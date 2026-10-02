import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';
import { DbProfile } from '../types/database';

export interface AuthSessionState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  loading: boolean;
}

const DEFAULT_PROFILE: UserProfile = {
  id: 'usr_default',
  name: 'Wesley Nunes',
  email: 'wesley@alicerce.com',
  role: 'Diretor de Operações',
  roleType: 'Admin',
  phone: '(11) 98765-4321',
};

export const authService = {
  /**
   * Obtém a sessão atual do Supabase Auth
   */
  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    } catch (err) {
      console.warn('Erro ao obter sessão do Supabase:', err);
      return null;
    }
  },

  /**
   * Realiza login com E-mail e Senha no Supabase Auth
   */
  async signIn(email: string, password: string):Promise<{ success: boolean; error?: string; profile?: UserProfile }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Se ainda não houver usuário no Supabase ou credenciais inválidas:
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Usuário não encontrado.' };
      }

      const profile = await this.getProfile(data.user.id, data.user.email || email);
      return { success: true, profile };
    } catch (err: any) {
      return { success: false, error: err.message || 'Falha na autenticação.' };
    }
  },

  /**
   * Realiza cadastro de novo usuário no Supabase Auth
   */
  async signUp(nome: string, email: string, password: string): Promise<{ success: boolean; error?: string; user?: any; session?: any; profile?: UserProfile }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome,
            name: nome,
            cargo: 'Estrategista Alicerce',
            role: 'team'
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Não foi possível criar o usuário no Supabase Auth.' };
      }

      // Garante inserção direta na tabela profiles caso a trigger esteja pendente
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          nome,
          email,
          cargo: 'Estrategista Alicerce',
          role: 'team'
        }, { onConflict: 'id' });
      } catch {
        // trigger on_auth_user_created trata
      }

      const profile: UserProfile = {
        id: data.user.id,
        name: nome,
        email,
        role: 'Estrategista Alicerce',
        roleType: 'Equipe',
        phone: ''
      };

      return {
        success: true,
        user: data.user,
        session: data.session,
        profile
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Falha no cadastro.' };
    }
  },

  /**
   * Encerra a sessão no Supabase Auth
   */
  async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Erro ao sair:', err);
    }
  },

  /**
   * Busca os dados do perfil na tabela 'profiles'
   */
  async getProfile(userId: string, email: string): Promise<UserProfile> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        // Fallback construído a partir do usuário do auth
        return {
          id: userId,
          name: email.split('@')[0].replace('.', ' '),
          email,
          role: 'Estrategista',
          roleType: 'Admin',
          phone: '',
        };
      }

      const p = data as DbProfile;
      return {
        id: p.id,
        name: p.nome,
        email: p.email,
        role: p.cargo || 'Estrategista',
        roleType: p.role === 'admin' ? 'Admin' : 'Equipe',
        avatarUrl: p.avatar_url || undefined,
        phone: '',
      };
    } catch (err) {
      console.warn('Não foi possível obter perfil do Supabase:', err);
      return {
        ...DEFAULT_PROFILE,
        id: userId,
        email,
      };
    }
  },

  /**
   * Atualiza dados do perfil
   */
  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
    try {
      const dbUpdates: Partial<DbProfile> = {};
      if (updates.name) dbUpdates.nome = updates.name;
      if (updates.role) dbUpdates.cargo = updates.role;
      if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;

      const { error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', userId);

      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Observador de mudança de estado de autenticação
   */
  onAuthStateChange(callback: (session: any, profile: UserProfile | null) => void) {
    return supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await this.getProfile(session.user.id, session.user.email || '');
        callback(session, profile);
      } else {
        callback(null, null);
      }
    });
  },
};
