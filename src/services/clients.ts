import { supabase } from '../lib/supabase';
import { Client, ClientStatus, ServiceType } from '../types';
import { DbClient, DbService } from '../types/database';

const STATUS_TO_DB: Record<ClientStatus, 'onboarding' | 'active' | 'paused' | 'closed'> = {
  Ativo: 'active',
  Onboarding: 'onboarding',
  Pausado: 'paused',
  Encerrado: 'closed',
};

const DB_TO_STATUS: Record<string, ClientStatus> = {
  active: 'Ativo',
  onboarding: 'Onboarding',
  paused: 'Pausado',
  closed: 'Encerrado',
};

export const clientsService = {
  /**
   * Busca todos os clientes com seus serviços vinculados
   */
  async getClients(): Promise<Client[]> {
    try {
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select(`
          *,
          client_services (
            service_id,
            services (
              id,
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (clientsError) {
        console.warn('Erro ao consultar clients no Supabase:', clientsError.message);
        return [];
      }

      return (clientsData || []).map((c: any) => {
        const services: ServiceType[] = (c.client_services || [])
          .map((cs: any) => cs.services?.name as ServiceType)
          .filter(Boolean);

        return {
          id: c.id,
          companyName: c.company_name,
          contactName: c.contact_name,
          email: c.email,
          phone: c.phone || '',
          website: c.website || undefined,
          instagram: c.instagram || undefined,
          segment: c.segment || 'Geral',
          services,
          startDate: c.start_date || c.created_at,
          accountManager: 'Wesley Nunes',
          notes: c.notes || undefined,
          status: DB_TO_STATUS[c.status] || 'Ativo',
          createdAt: c.created_at,
        };
      });
    } catch (err) {
      console.warn('Exceção ao listar clientes:', err);
      return [];
    }
  },

  /**
   * Busca um cliente por ID
   */
  async getClientById(id: string): Promise<Client | null> {
    try {
      const { data: c, error } = await supabase
        .from('clients')
        .select(`
          *,
          client_services (
            services (
              id,
              name
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error || !c) return null;

      const services: ServiceType[] = (c.client_services || [])
        .map((cs: any) => cs.services?.name as ServiceType)
        .filter(Boolean);

      return {
        id: c.id,
        companyName: c.company_name,
        contactName: c.contact_name,
        email: c.email,
        phone: c.phone || '',
        website: c.website || undefined,
        instagram: c.instagram || undefined,
        segment: c.segment || 'Geral',
        services,
        startDate: c.start_date || c.created_at,
        accountManager: 'Wesley Nunes',
        notes: c.notes || undefined,
        status: DB_TO_STATUS[c.status] || 'Ativo',
        createdAt: c.created_at,
      };
    } catch {
      return null;
    }
  },

  /**
   * Cadastra novo cliente e vincula serviços
   */
  async createClient(client: Omit<Client, 'id' | 'createdAt'>): Promise<Client | null> {
    try {
      const { data: inserted, error: insertError } = await supabase
        .from('clients')
        .insert({
          company_name: client.companyName,
          contact_name: client.contactName,
          email: client.email,
          phone: client.phone || '',
          website: client.website || '',
          instagram: client.instagram || '',
          segment: client.segment || '',
          status: STATUS_TO_DB[client.status] || 'active',
          start_date: client.startDate || new Date().toISOString().split('T')[0],
          notes: client.notes || '',
        })
        .select()
        .single();

      if (insertError || !inserted) {
        console.error('Erro ao inserir cliente:', insertError);
        return null;
      }

      // Vincula serviços relacionais
      if (client.services && client.services.length > 0) {
        await this.syncClientServices(inserted.id, client.services);
      }

      return {
        id: inserted.id,
        ...client,
        createdAt: inserted.created_at,
      };
    } catch (err) {
      console.error('Falha ao criar cliente:', err);
      return null;
    }
  },

  /**
   * Atualiza cliente existente
   */
  async updateClient(id: string, updates: Partial<Client>): Promise<boolean> {
    try {
      const dbUpdates: Partial<DbClient> = {};
      if (updates.companyName) dbUpdates.company_name = updates.companyName;
      if (updates.contactName) dbUpdates.contact_name = updates.contactName;
      if (updates.email) dbUpdates.email = updates.email;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.website !== undefined) dbUpdates.website = updates.website;
      if (updates.instagram !== undefined) dbUpdates.instagram = updates.instagram;
      if (updates.segment !== undefined) dbUpdates.segment = updates.segment;
      if (updates.status) dbUpdates.status = STATUS_TO_DB[updates.status];
      if (updates.startDate) dbUpdates.start_date = updates.startDate;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

      const { error } = await supabase
        .from('clients')
        .update(dbUpdates)
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar cliente:', error);
        return false;
      }

      if (updates.services) {
        await this.syncClientServices(id, updates.services);
      }

      return true;
    } catch {
      return false;
    }
  },

  /**
   * Remove cliente do Supabase
   */
  async deleteClient(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Sincroniza tabela relacional client_services
   */
  async syncClientServices(clientId: string, serviceNames: ServiceType[]) {
    try {
      // 1. Remove vínculos anteriores
      await supabase.from('client_services').delete().eq('client_id', clientId);

      if (serviceNames.length === 0) return;

      // 2. Busca IDs dos serviços
      const { data: services } = await supabase
        .from('services')
        .select('id, name')
        .in('name', serviceNames);

      if (!services || services.length === 0) return;

      // 3. Insere novos vínculos
      const toInsert = services.map((s: any) => ({
        client_id: clientId,
        service_id: s.id,
      }));

      await supabase.from('client_services').insert(toInsert);
    } catch (err) {
      console.warn('Erro ao sincronizar client_services:', err);
    }
  },
};
