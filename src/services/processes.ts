import { supabase } from '../lib/supabase';
import { ProcessCategory, ServiceType, SOPProcess } from '../types';
import { DbProcess, DbProcessStep } from '../types/database';

const CATEGORY_TO_DB: Record<ProcessCategory, 'strategy' | 'brand' | 'digital_presence' | 'acquisition' | 'content'> = {
  Estratégia: 'strategy',
  Marca: 'brand',
  'Presença Digital': 'digital_presence',
  Aquisição: 'acquisition',
  Conteúdo: 'content',
};

const DB_TO_CATEGORY: Record<string, ProcessCategory> = {
  strategy: 'Estratégia',
  brand: 'Marca',
  digital_presence: 'Presença Digital',
  acquisition: 'Aquisição',
  content: 'Conteúdo',
};

export const processesService = {
  /**
   * Busca todos os processos e suas etapas
   */
  async getProcesses(): Promise<SOPProcess[]> {
    try {
      const { data: processesData, error } = await supabase
        .from('processes')
        .select(`
          *,
          services (
            id,
            name
          ),
          process_steps (
            id,
            title,
            description,
            position
          )
        `)
        .order('name', { ascending: true });

      if (error) {
        console.warn('Erro ao consultar processes no Supabase:', error.message);
        return [];
      }

      return (processesData || []).map((p: any) => {
        const sortedSteps = (p.process_steps || []).sort(
          (a: any, b: any) => (a.position || 0) - (b.position || 0)
        );

        return {
          id: p.id,
          title: p.name,
          service: (p.services?.name as ServiceType) || 'Plano Estratégico',
          category: DB_TO_CATEGORY[p.category] || 'Estratégia',
          description: p.description || '',
          steps: sortedSteps.map((st: any, idx: number) => ({
            stepNumber: String(idx + 1).padStart(2, '0'),
            title: st.title,
            description: st.description || '',
            checklist: [],
          })),
          updatedAt: p.updated_at,
          responsible: 'Wesley Nunes',
        };
      });
    } catch (err) {
      console.warn('Exceção ao listar processos:', err);
      return [];
    }
  },

  /**
   * Cria novo processo
   */
  async createProcess(proc: Omit<SOPProcess, 'id' | 'updatedAt'>): Promise<SOPProcess | null> {
    try {
      let serviceId: string | null = null;
      if (proc.service) {
        const { data: s } = await supabase
          .from('services')
          .select('id')
          .eq('name', proc.service)
          .single();
        if (s) serviceId = s.id;
      }

      const { data: inserted, error } = await supabase
        .from('processes')
        .insert({
          name: proc.title,
          description: proc.description || '',
          category: CATEGORY_TO_DB[proc.category] || 'strategy',
          service_id: serviceId,
        })
        .select()
        .single();

      if (error || !inserted) return null;

      if (proc.steps && proc.steps.length > 0) {
        const stepsToInsert = proc.steps.map((st, idx) => ({
          process_id: inserted.id,
          title: st.title,
          description: st.description,
          position: idx,
        }));
        await supabase.from('process_steps').insert(stepsToInsert);
      }

      return {
        id: inserted.id,
        ...proc,
        updatedAt: inserted.updated_at,
      };
    } catch {
      return null;
    }
  },

  /**
   * Atualiza processo existente
   */
  async updateProcess(id: string, updates: Partial<SOPProcess>): Promise<boolean> {
    try {
      const dbUpdates: Partial<DbProcess> = {};
      if (updates.title) dbUpdates.name = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.category) dbUpdates.category = CATEGORY_TO_DB[updates.category];

      if (updates.service) {
        const { data: s } = await supabase
          .from('services')
          .select('id')
          .eq('name', updates.service)
          .single();
        if (s) dbUpdates.service_id = s.id;
      }

      const { error } = await supabase
        .from('processes')
        .update(dbUpdates)
        .eq('id', id);

      if (error) return false;

      if (updates.steps) {
        await supabase.from('process_steps').delete().eq('process_id', id);
        const stepsToInsert = updates.steps.map((st, idx) => ({
          process_id: id,
          title: st.title,
          description: st.description,
          position: idx,
        }));
        await supabase.from('process_steps').insert(stepsToInsert);
      }

      return true;
    } catch {
      return false;
    }
  },

  /**
   * Remove processo
   */
  async deleteProcess(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('processes')
        .delete()
        .eq('id', id);

      return !error;
    } catch {
      return false;
    }
  },
};
