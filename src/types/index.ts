export type ServiceType =
  | 'Meta Ads'
  | 'Google Ads'
  | 'Social Media'
  | 'Google Meu Negócio'
  | 'Landing Page'
  | 'Site Institucional'
  | 'Identidade Visual'
  | 'Criativos'
  | 'Edição de Vídeo'
  | 'Plano Estratégico'
  | 'Outros';

export type ClientStatus = 'Ativo' | 'Onboarding' | 'Pausado' | 'Encerrado';

export interface Client {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  website?: string;
  instagram?: string;
  segment: string;
  services: ServiceType[];
  startDate: string;
  accountManager: string;
  notes?: string;
  status: ClientStatus;
  createdAt: string;
}

export type ProjectStatus =
  | 'Planejamento'
  | 'Em produção'
  | 'Aguardando cliente'
  | 'Revisão'
  | 'Finalizado';

export interface ProjectStage {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  service: ServiceType;
  responsible: string;
  startDate: string;
  dueDate: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  stages: ProjectStage[];
  notes?: string;
  relatedMaterials?: string[];
  createdAt: string;
}

export type ProcessCategory =
  | 'Estratégia'
  | 'Marca'
  | 'Presença Digital'
  | 'Aquisição'
  | 'Conteúdo';

export interface ProcessStep {
  stepNumber: string;
  title: string;
  description: string;
  checklist: string[];
}

export interface SOPProcess {
  id: string;
  title: string;
  service: ServiceType;
  category: ProcessCategory;
  description: string;
  steps: ProcessStep[];
  updatedAt: string;
  responsible: string;
}

export type MaterialCategory =
  | 'Comercial'
  | 'Onboarding'
  | 'Contratos'
  | 'Briefings'
  | 'Checklists'
  | 'Relatórios'
  | 'Apresentações'
  | 'Templates'
  | 'Documentos internos';

export interface Material {
  id: string;
  title: string;
  category: MaterialCategory;
  description: string;
  updatedAt: string;
  responsible: string;
  fileUrl?: string;
  externalLink?: string;
  fileType?: 'pdf' | 'doc' | 'sheet' | 'figma' | 'link' | 'archive';
  fileSize?: string;
  clientId?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  roleType: 'Admin' | 'Equipe';
  avatarUrl?: string;
  phone: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'deadline' | 'delayed' | 'material' | 'update' | 'info';
  timestamp: string;
  read: boolean;
  link?: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'client' | 'project' | 'material' | 'process';
  user: string;
}
