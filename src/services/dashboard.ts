import { supabase } from '../lib/supabase';
import { ActivityItem, Project, ServiceType } from '../types';

export interface DashboardMetrics {
  activeClientsCount: number;
  inProgressProjectsCount: number;
  waitingClientProjectsCount: number;
  upcomingCount: number;
}

export const dashboardService = {
  /**
   * Obtém métricas reais agregadas do Supabase
   */
  async getMetrics(): Promise<DashboardMetrics> {
    try {
      // 1. Clientes ativos
      const { count: activeClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // 2. Projetos em andamento (planning, production, review)
      const { count: inProgress } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .in('status', ['planning', 'production', 'review']);

      // 3. Aguardando cliente
      const { count: waitingClient } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'waiting_client');

      // 4. Entregas próximas (próximos 15 dias)
      const today = new Date().toISOString().split('T')[0];
      const maxDate = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];

      const { count: upcoming } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'completed')
        .gte('due_date', today)
        .lte('due_date', maxDate);

      return {
        activeClientsCount: activeClients || 0,
        inProgressProjectsCount: inProgress || 0,
        waitingClientProjectsCount: waitingClient || 0,
        upcomingCount: upcoming || 0,
      };
    } catch (err) {
      console.warn('Erro ao obter métricas do dashboard:', err);
      return {
        activeClientsCount: 0,
        inProgressProjectsCount: 0,
        waitingClientProjectsCount: 0,
        upcomingCount: 0,
      };
    }
  },

  /**
   * Busca as atividades recentes gravadas na tabela activity_logs
   */
  async getRecentActivities(): Promise<ActivityItem[]> {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error || !data || data.length === 0) {
        return [];
      }

      return data.map((a: any) => ({
        id: a.id,
        title: a.action,
        description: a.description,
        timestamp: new Date(a.created_at).toLocaleDateString('pt-BR'),
        type: (a.entity_type as any) || 'project',
        user: 'Wesley Nunes',
      }));
    } catch {
      return [];
    }
  },

  /**
   * Registra um novo log de atividade no Supabase e cache local
   */
  async logActivity(
    action: string,
    entityType: 'client' | 'project' | 'material' | 'process' | 'lead' | 'proposal' | 'contract' | 'financial' | 'task' | 'approval' | 'template' | 'content' | string,
    entityId: string,
    description: string
  ) {
    try {
      await supabase.from('activity_logs').insert({
        action,
        entity_type: entityType,
        entity_id: entityId,
        description,
      });
    } catch (err) {
      console.warn('Erro ao gravar log de atividade:', err);
    }
  },
};
