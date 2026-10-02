// Supabase Database Row Definitions
export type UserRole =
  | 'admin'
  | 'team'
  | 'commercial'
  | 'manager'
  | 'designer'
  | 'social_media'
  | 'traffic_manager'
  | 'client';

export type DbClientStatus = 'onboarding' | 'active' | 'paused' | 'closed';

export type DbProjectStatus =
  | 'planning'
  | 'production'
  | 'waiting_client'
  | 'review'
  | 'completed';

export type DbProcessCategory =
  | 'strategy'
  | 'brand'
  | 'digital_presence'
  | 'acquisition'
  | 'content';

export type DbMaterialCategory =
  | 'commercial'
  | 'onboarding'
  | 'contracts'
  | 'briefings'
  | 'checklists'
  | 'reports'
  | 'presentations'
  | 'templates'
  | 'internal_documents';

export interface DbProfile {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  avatar_url?: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface DbService {
  id: string;
  name: string;
  category: string;
  active: boolean;
  created_at: string;
}

export interface DbClient {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  website: string;
  instagram: string;
  segment: string;
  status: DbClientStatus;
  start_date: string;
  internal_owner_id?: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface DbClientService {
  id: string;
  client_id: string;
  service_id: string;
  created_at: string;
}

export interface DbProject {
  id: string;
  client_id: string;
  service_id?: string | null;
  name: string;
  description: string;
  responsible_user_id?: string | null;
  start_date: string;
  due_date: string;
  status: DbProjectStatus;
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface DbProjectStep {
  id: string;
  project_id: string;
  title: string;
  description: string;
  position: number;
  completed: boolean;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbProcess {
  id: string;
  name: string;
  description: string;
  category: DbProcessCategory;
  service_id?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbProcessStep {
  id: string;
  process_id: string;
  title: string;
  description: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface DbMaterial {
  id: string;
  title: string;
  description: string;
  category: DbMaterialCategory;
  file_url: string;
  external_url: string;
  responsible_user_id?: string | null;
  client_id?: string | null;
  project_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbBrandAsset {
  id: string;
  type: string;
  name: string;
  description: string;
  value: string;
  file_url: string;
  created_at: string;
  updated_at: string;
}

export interface DbActivityLog {
  id: string;
  user_id?: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  description: string;
  created_at: string;
}
