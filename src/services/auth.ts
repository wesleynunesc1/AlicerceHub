import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';
import { DbProfile } from '../types/database';

export interface AuthSessionState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  loading: boolean;
}

export const OWNER_EMAIL = 'wesleynunespro@gmail.com';

export const isOwnerEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return email.trim().toLowerCase() === OWNER_EMAIL.toLowerCase();
};

const DEFAULT_PROFILE: UserProfile = {
  id: 'usr_owner',
  name: 'Wesley Nunes',
  email: OWNER_EMAIL,
  role: 'Diretor Geral / Dono',
  roleType: 'Admin',
  phone: '',
};

export const authService = {
  /**
   * Obtém a sessão atual do Supabase Auth validando se é o proprietário
   */
  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (data.session?.user) {
        if (!isOwnerEmail(data.session.user.email)) {
          await supabase.auth.signOut();
          return null;
        }
      }
      return data.session;
    } catch (err) {
      console.warn('Erro ao obter sessão do Supabase:', err);
      return null;
    }
  },

  /**
   * Realiza login com E-mail e Senha no Supabase Auth com validação de conta proprietária
   */
  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string; profile?: UserProfile }> {
    try {
      const cleanEmail = email.trim().toLowerCase();

      // Somente a conta principal wesleynunespro@gmail.com é autorizada
      if (!isOwnerEmail(cleanEmail)) {
        await supabase.auth.signOut();
        return {
          success: false,
          error: 'Esta conta não possui acesso ao Alicerce OS.'
        };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user || !isOwnerEmail(data.user.email)) {
        await supabase.auth.signOut();
        return {
          success: false,
          error: 'Esta conta não possui acesso ao Alicerce OS.'
        };
      }

      const profile = await this.getProfile(data.user.id, data.user.email || cleanEmail);
      return { success: true, profile };
    } catch (err: any) {
      return { success: false, error: err.message || 'Falha na autenticação.' };
    }
  },

  /**
   * Cadastro desabilitado na versão privada do Alicerce OS
   */
  async signUp(_nome: string, _email: string, _password: string): Promise<{ success: boolean; error?: string; user?: any; session?: any; profile?: UserProfile }> {
    return {
      success: false,
      error: 'O cadastro de novas contas está desabilitado. O Alicerce OS é de uso exclusivo do proprietário.'
    };
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
        return {
          id: userId,
          name: 'Wesley Nunes',
          email: OWNER_EMAIL,
          role: 'Diretor Geral / Dono',
          roleType: 'Admin',
          phone: '',
        };
      }

      const p = data as DbProfile;
      return {
        id: p.id,
        name: p.nome || 'Wesley Nunes',
        email: p.email || OWNER_EMAIL,
        role: p.cargo || 'Diretor Geral / Dono',
        roleType: 'Admin',
        avatarUrl: p.avatar_url || undefined,
        phone: '',
      };
    } catch (err) {
      console.warn('Não foi possível obter perfil do Supabase:', err);
      return {
        ...DEFAULT_PROFILE,
        id: userId,
        email: OWNER_EMAIL,
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
        if (!isOwnerEmail(session.user.email)) {
          await supabase.auth.signOut();
          callback(null, null);
          return;
        }
        const profile = await this.getProfile(session.user.id, session.user.email || '');
        callback(session, profile);
      } else {
        callback(null, null);
      }
    });
  },
};
