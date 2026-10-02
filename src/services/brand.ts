import { supabase } from '../lib/supabase';
import { DbBrandAsset } from '../types/database';

export interface BrandAsset {
  id: string;
  type: 'logo' | 'color' | 'typography' | 'voice' | 'positioning' | 'editorial' | 'other';
  name: string;
  description: string;
  value: string;
  fileUrl?: string;
}

export const brandService = {
  /**
   * Busca todos os assets de marca
   */
  async getAssets(): Promise<BrandAsset[]> {
    try {
      const { data, error } = await supabase
        .from('brand_assets')
        .select('*')
        .order('created_at', { ascending: true });

      if (error || !data || data.length === 0) {
        return [];
      }

      return data.map((a: DbBrandAsset) => ({
        id: a.id,
        type: a.type as any,
        name: a.name,
        description: a.description,
        value: a.value,
        fileUrl: a.file_url || undefined,
      }));
    } catch {
      return [];
    }
  },

  /**
   * Atualiza ou insere um asset de marca
   */
  async updateAsset(id: string, updates: Partial<BrandAsset>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('brand_assets')
        .update({
          name: updates.name,
          description: updates.description,
          value: updates.value,
          file_url: updates.fileUrl,
        })
        .eq('id', id);

      return !error;
    } catch {
      return false;
    }
  },
};
