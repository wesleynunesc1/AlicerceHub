import { supabase } from '../lib/supabase';
import { Material, MaterialCategory } from '../types';
import { DbMaterial } from '../types/database';

const CATEGORY_TO_DB: Record<MaterialCategory, 'commercial' | 'onboarding' | 'contracts' | 'briefings' | 'checklists' | 'reports' | 'presentations' | 'templates' | 'internal_documents'> = {
  Comercial: 'commercial',
  Onboarding: 'onboarding',
  Contratos: 'contracts',
  Briefings: 'briefings',
  Checklists: 'checklists',
  Relatórios: 'reports',
  Apresentações: 'presentations',
  Templates: 'templates',
  'Documentos internos': 'internal_documents',
};

const DB_TO_CATEGORY: Record<string, MaterialCategory> = {
  commercial: 'Comercial',
  onboarding: 'Onboarding',
  contracts: 'Contratos',
  briefings: 'Briefings',
  checklists: 'Checklists',
  reports: 'Relatórios',
  presentations: 'Apresentações',
  templates: 'Templates',
  internal_documents: 'Documentos internos',
};

export const materialsService = {
  /**
   * Busca todos os materiais
   */
  async getMaterials(): Promise<Material[]> {
    try {
      const { data: materialsData, error } = await supabase
        .from('materials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Erro ao consultar materials no Supabase:', error.message);
        return [];
      }

      return (materialsData || []).map((m: DbMaterial) => ({
        id: m.id,
        title: m.title,
        category: DB_TO_CATEGORY[m.category] || 'Documentos internos',
        description: m.description || '',
        updatedAt: m.updated_at,
        responsible: 'Wesley Nunes',
        fileUrl: m.file_url || undefined,
        externalLink: m.external_url || undefined,
        fileType: m.file_url ? 'pdf' : 'link',
        clientId: m.client_id || undefined,
      }));
    } catch (err) {
      console.warn('Exceção ao listar materiais:', err);
      return [];
    }
  },

  /**
   * Faz upload de arquivo para o bucket 'materials' no Supabase Storage
   */
  async uploadFile(file: File): Promise<{ publicUrl: string; error?: string }> {
    try {
      const fileExt = file.name.split('.').pop();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${Date.now()}_${sanitizedName}`;

      const { data, error } = await supabase.storage
        .from('materials')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error || !data) {
        console.error('Erro no upload para storage:', error);
        return { publicUrl: '', error: error?.message || 'Falha no upload' };
      }

      const { data: urlData } = supabase.storage
        .from('materials')
        .getPublicUrl(data.path);

      return { publicUrl: urlData.publicUrl };
    } catch (err: any) {
      return { publicUrl: '', error: err.message || 'Erro no envio do arquivo' };
    }
  },

  /**
   * Cadastra novo material
   */
  async createMaterial(mat: Omit<Material, 'id' | 'updatedAt'>): Promise<Material | null> {
    try {
      const { data: inserted, error } = await supabase
        .from('materials')
        .insert({
          title: mat.title,
          description: mat.description || '',
          category: CATEGORY_TO_DB[mat.category] || 'internal_documents',
          file_url: mat.fileUrl || '',
          external_url: mat.externalLink || '',
          client_id: mat.clientId || null,
        })
        .select()
        .single();

      if (error || !inserted) return null;

      return {
        id: inserted.id,
        ...mat,
        updatedAt: inserted.updated_at,
      };
    } catch {
      return null;
    }
  },

  /**
   * Atualiza material existente
   */
  async updateMaterial(id: string, updates: Partial<Material>): Promise<boolean> {
    try {
      const dbUpdates: Partial<DbMaterial> = {};
      if (updates.title) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.category) dbUpdates.category = CATEGORY_TO_DB[updates.category];
      if (updates.fileUrl !== undefined) dbUpdates.file_url = updates.fileUrl;
      if (updates.externalLink !== undefined) dbUpdates.external_url = updates.externalLink;
      if (updates.clientId !== undefined) dbUpdates.client_id = updates.clientId || null;

      const { error } = await supabase
        .from('materials')
        .update(dbUpdates)
        .eq('id', id);

      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Remove material do Supabase
   */
  async deleteMaterial(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', id);

      return !error;
    } catch {
      return false;
    }
  },
};
