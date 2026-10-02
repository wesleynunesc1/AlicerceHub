import { supabase } from '../lib/supabase';
import { Project, ProjectStage, ProjectStatus, ServiceType } from '../types';
import { DbProject, DbProjectStep } from '../types/database';

const STATUS_TO_DB: Record<ProjectStatus, 'planning' | 'production' | 'waiting_client' | 'review' | 'completed'> = {
  Planejamento: 'planning',
  'Em produção': 'production',
  'Aguardando cliente': 'waiting_client',
  Revisão: 'review',
  Finalizado: 'completed',
};

const DB_TO_STATUS: Record<string, ProjectStatus> = {
  planning: 'Planejamento',
  production: 'Em produção',
  waiting_client: 'Aguardando cliente',
  review: 'Revisão',
  completed: 'Finalizado',
};

const DEFAULT_STAGES = [
  'Briefing',
  'Acessos',
  'Planejamento',
  'Produção',
  'Aprovação',
  'Entrega',
];

export const projectsService = {
  /**
   * Busca todos os projetos com clientes e etapas
   */
  async getProjects(): Promise<Project[]> {
    try {
      const { data: projectsData, error } = await supabase
        .from('projects')
        .select(`
          *,
          clients (
            id,
            company_name
          ),
          services (
            id,
            name
          ),
          project_steps (
            id,
            title,
            completed,
            position
          )
        `)
        .order('due_date', { ascending: true });

      if (error) {
        console.warn('Erro ao consultar projects no Supabase:', error.message);
        return [];
      }

      return (projectsData || []).map((p: any) => {
        const sortedSteps = (p.project_steps || []).sort(
          (a: any, b: any) => (a.position || 0) - (b.position || 0)
        );

        const stages: ProjectStage[] = sortedSteps.map((st: any) => ({
          id: st.id,
          title: st.title,
          completed: Boolean(st.completed),
        }));

        return {
          id: p.id,
          name: p.name,
          clientId: p.client_id,
          clientName: p.clients?.company_name || 'Cliente',
          service: (p.services?.name as ServiceType) || 'Meta Ads',
          responsible: 'Wesley Nunes',
          startDate: p.start_date || p.created_at,
          dueDate: p.due_date,
          description: p.description || '',
          status: DB_TO_STATUS[p.status] || 'Planejamento',
          progress: p.progress || 0,
          stages,
          createdAt: p.created_at,
        };
      });
    } catch (err) {
      console.warn('Exceção ao listar projetos:', err);
      return [];
    }
  },

  /**
   * Busca um projeto detalhado por ID
   */
  async getProjectById(id: string): Promise<Project | null> {
    try {
      const { data: p, error } = await supabase
        .from('projects')
        .select(`
          *,
          clients (
            id,
            company_name
          ),
          services (
            id,
            name
          ),
          project_steps (
            id,
            title,
            description,
            completed,
            position
          )
        `)
        .eq('id', id)
        .single();

      if (error || !p) return null;

      const sortedSteps = (p.project_steps || []).sort(
        (a: any, b: any) => (a.position || 0) - (b.position || 0)
      );

      const stages: ProjectStage[] = sortedSteps.map((st: any) => ({
        id: st.id,
        title: st.title,
        completed: Boolean(st.completed),
      }));

      return {
        id: p.id,
        name: p.name,
        clientId: p.client_id,
        clientName: p.clients?.company_name || 'Cliente',
        service: (p.services?.name as ServiceType) || 'Meta Ads',
        responsible: 'Wesley Nunes',
        startDate: p.start_date || p.created_at,
        dueDate: p.due_date,
        description: p.description || '',
        status: DB_TO_STATUS[p.status] || 'Planejamento',
        progress: p.progress || 0,
        stages,
        createdAt: p.created_at,
      };
    } catch {
      return null;
    }
  },

  /**
   * Cria novo projeto e gera automaticamente as etapas padrão
   */
  async createProject(project: Omit<Project, 'id' | 'createdAt'>): Promise<Project | null> {
    try {
      // 1. Resolve ID do serviço se existir
      let serviceId: string | null = null;
      if (project.service) {
        const { data: s } = await supabase
          .from('services')
          .select('id')
          .eq('name', project.service)
          .single();
        if (s) serviceId = s.id;
      }

      // 2. Insere projeto
      const { data: inserted, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: project.name,
          client_id: project.clientId,
          service_id: serviceId,
          description: project.description || '',
          due_date: project.dueDate,
          start_date: project.startDate || new Date().toISOString().split('T')[0],
          status: STATUS_TO_DB[project.status] || 'planning',
          progress: project.progress || 0,
        })
        .select()
        .single();

      if (projectError || !inserted) {
        console.error('Erro ao inserir projeto:', projectError);
        return null;
      }

      // 3. Insere etapas padrão
      const stagesToCreate = project.stages && project.stages.length > 0
        ? project.stages.map((s, idx) => ({
            project_id: inserted.id,
            title: s.title,
            completed: s.completed,
            position: idx,
          }))
        : DEFAULT_STAGES.map((title, idx) => ({
            project_id: inserted.id,
            title,
            completed: false,
            position: idx,
          }));

      const { data: insertedSteps } = await supabase
        .from('project_steps')
        .insert(stagesToCreate)
        .select();

      const createdStages: ProjectStage[] = (insertedSteps || []).map((st: any) => ({
        id: st.id,
        title: st.title,
        completed: Boolean(st.completed),
      }));

      return {
        id: inserted.id,
        ...project,
        stages: createdStages,
        createdAt: inserted.created_at,
      };
    } catch (err) {
      console.error('Falha ao criar projeto:', err);
      return null;
    }
  },

  /**
   * Atualiza dados do projeto
   */
  async updateProject(id: string, updates: Partial<Project>): Promise<boolean> {
    try {
      const dbUpdates: Partial<DbProject> = {};
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.clientId) dbUpdates.client_id = updates.clientId;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.dueDate) dbUpdates.due_date = updates.dueDate;
      if (updates.startDate) dbUpdates.start_date = updates.startDate;
      if (updates.status) dbUpdates.status = STATUS_TO_DB[updates.status];
      if (updates.progress !== undefined) dbUpdates.progress = updates.progress;

      if (updates.service) {
        const { data: s } = await supabase
          .from('services')
          .select('id')
          .eq('name', updates.service)
          .single();
        if (s) dbUpdates.service_id = s.id;
      }

      const { error } = await supabase
        .from('projects')
        .update(dbUpdates)
        .eq('id', id);

      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Alterna estado de uma etapa e recalcula o progresso do projeto
   */
  async toggleStep(projectId: string, stepId: string, completed: boolean): Promise<number> {
    try {
      await supabase
        .from('project_steps')
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq('id', stepId);

      // Recalcula progresso
      const { data: steps } = await supabase
        .from('project_steps')
        .select('id, completed')
        .eq('project_id', projectId);

      if (!steps || steps.length === 0) return 0;

      const total = steps.length;
      const done = steps.filter((s: any) => s.completed).length;
      const progress = Math.round((done / total) * 100);

      await supabase
        .from('projects')
        .update({ progress })
        .eq('id', projectId);

      return progress;
    } catch {
      return 0;
    }
  },

  /**
   * Exclui um projeto
   */
  async deleteProject(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      return !error;
    } catch {
      return false;
    }
  },
};
