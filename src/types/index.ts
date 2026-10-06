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
  | 'Posicionamento'
  | 'Estruturação Digital'
  | 'Outros';

export type UserRole =
  | 'admin'
  | 'manager'
  | 'commercial'
  | 'team'
  | 'designer'
  | 'social_media'
  | 'traffic_manager'
  | 'client';

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

/* ==============================================================================
   FASE 2: TAREFAS & WORKFLOW
============================================================================== */
export type TaskPriority = 'Baixa' | 'Média' | 'Alta' | 'Urgente';
export type TaskStatus = 'Pendente' | 'Em andamento' | 'Aguardando' | 'Concluída';

export interface Task {
  id: string;
  title: string;
  description?: string;
  projectId?: string;
  projectName?: string;
  clientId?: string;
  clientName?: string;
  responsible: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  createdAt: string;
  completedAt?: string;
  commentsCount?: number;
  attachments?: string[];
}

/* ==============================================================================
   FASE 2: AGENDA / PRAZOS & EVENTOS
============================================================================== */
export type CalendarEventType =
  | 'Entrega'
  | 'Tarefa'
  | 'Reunião'
  | 'Follow-up'
  | 'Contrato'
  | 'Financeiro'
  | 'Aprovação'
  | 'Outro';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  type: CalendarEventType;
  responsible: string;
  clientId?: string;
  clientName?: string;
  projectId?: string;
  projectName?: string;
  notes?: string;
}

/* ==============================================================================
   FASE 2: APROVAÇÕES DE MATERIAIS / ENTREGAS
============================================================================== */
export type ApprovalStatus =
  | 'Aguardando aprovação'
  | 'Aprovado'
  | 'Alterações solicitadas'
  | 'Rejeitado';

export interface ApprovalHistoryEntry {
  date: string;
  status: ApprovalStatus;
  user: string;
  feedback?: string;
}

export interface ApprovalItem {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  projectId?: string;
  projectName?: string;
  type: string; // Criativo, Legenda, Vídeo, Identidade Visual, Site, Proposta, etc.
  fileUrl?: string;
  externalLink?: string;
  responsible: string;
  date: string;
  notes?: string;
  feedback?: string;
  status: ApprovalStatus;
  history: ApprovalHistoryEntry[];
  createdAt: string;
}

/* ==============================================================================
   FASE 2: COMERCIAL & LEADS
============================================================================== */
export type LeadStatus =
  | 'Novo lead'
  | 'Contato realizado'
  | 'Diagnóstico'
  | 'Proposta'
  | 'Negociação'
  | 'Fechado'
  | 'Perdido';

export type LeadOrigin =
  | 'Instagram'
  | 'Meta Ads'
  | 'Google Ads'
  | 'Indicação'
  | 'Site'
  | 'WhatsApp'
  | 'Orgânico'
  | 'Outro';

export interface Lead {
  id: string;
  name: string;
  company: string;
  phone: string;
  whatsapp?: string;
  email: string;
  serviceOfInterest: ServiceType;
  origin: LeadOrigin;
  estimatedValue: number;
  responsible: string;
  status: LeadStatus;
  nextFollowUp?: string;
  notes?: string;
  entryDate: string;
  convertedClientId?: string;
}

/* ==============================================================================
   FASE 2: PROPOSTAS COMERCIAIS
============================================================================== */
export type ProposalStatus =
  | 'Rascunho'
  | 'Enviada'
  | 'Visualizada'
  | 'Aprovada'
  | 'Recusada'
  | 'Expirada';

export interface ProposalItem {
  id: string;
  description: string;
  value: number;
}

export interface Proposal {
  id: string;
  title: string;
  clientId?: string;
  clientName?: string;
  leadId?: string;
  description: string;
  services: ServiceType[];
  items: ProposalItem[];
  subtotal: number;
  discount: number;
  total: number;
  deadline: string;
  validUntil: string;
  notes?: string;
  status: ProposalStatus;
  createdAt: string;
}

/* ==============================================================================
   FASE 2: CONTRATOS
============================================================================== */
export type ContractStatus = 'Rascunho' | 'Ativo' | 'Vencendo' | 'Encerrado' | 'Cancelado';

export interface Contract {
  id: string;
  clientId: string;
  clientName: string;
  service: ServiceType;
  value: number;
  recurrence: 'Mensal' | 'Trimestral' | 'Semestral' | 'Anual' | 'Pontual';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  status: ContractStatus;
  fileUrl?: string;
  notes?: string;
  createdAt: string;
}

/* ==============================================================================
   FASE 2: FINANCEIRO BÁSICO
============================================================================== */
export type FinancialStatus = 'Pendente' | 'Pago' | 'Atrasado' | 'Cancelado';

export interface FinancialEntry {
  id: string;
  clientId: string;
  clientName: string;
  contractId?: string;
  description: string;
  value: number;
  dueDate: string;
  paymentDate?: string;
  status: FinancialStatus;
  createdAt: string;
}

/* ==============================================================================
   FASE 2: TEMPLATES OPERACIONAIS
============================================================================== */
export interface TemplateStep {
  title: string;
  description?: string;
  estimatedDays?: number;
  checklist?: string[];
}

export interface ProjectTemplate {
  id: string;
  title: string;
  service: ServiceType;
  description: string;
  steps: TemplateStep[];
  createdAt: string;
}

/* ==============================================================================
   FASE 2: CONTEÚDO EDITORIAL
============================================================================== */
export type ContentPillar =
  | 'Notícia / Atualidade'
  | 'Curiosidade / Case'
  | 'Educação'
  | 'Institucional';

export type ContentFormat =
  | 'Carrossel'
  | 'Reels'
  | 'Post Estático'
  | 'Story'
  | 'Vídeo'
  | 'Artigo';

export type ContentStatus =
  | 'Ideia'
  | 'Roteiro'
  | 'Design'
  | 'Revisão'
  | 'Aprovado'
  | 'Publicado';

export interface ContentItem {
  id: string;
  title: string;
  pauta: string;
  pillar: ContentPillar;
  format: ContentFormat;
  responsible: string;
  clientId?: string;
  clientName?: string;
  script?: string;
  caption?: string;
  scheduledDate: string;
  status: ContentStatus;
  files?: string[];
  externalLink?: string;
  createdAt: string;
}

/* ==============================================================================
   FASE 2: COMENTÁRIOS, LINKS RÁPIDOS, ONBOARDING & EQUIPE
============================================================================== */
export interface InternalComment {
  id: string;
  entityType: 'client' | 'project' | 'task' | 'approval' | 'lead';
  entityId: string;
  userName: string;
  userId?: string;
  content: string;
  createdAt: string;
}

export interface QuickLink {
  id: string;
  clientId?: string;
  projectId?: string;
  title: string;
  url: string;
  category: 'Instagram' | 'Facebook' | 'Meta Business' | 'Google Ads' | 'Google Business' | 'Drive' | 'Site' | 'WhatsApp' | 'Outro';
}

export interface OnboardingCheckItem {
  id: string;
  clientId: string;
  key: string;
  title: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
  orderIndex: number;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  roleType: UserRole;
  avatarUrl?: string;
  phone?: string;
  status: 'Ativo' | 'Ausente' | 'Férias';
  activeProjectsCount: number;
  openTasksCount: number;
  delayedTasksCount: number;
}

/* ==============================================================================
   PROCESSOS, MATERIAIS & AUXILIARES
============================================================================== */
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
  | 'Identidade Visual'
  | 'Logos'
  | 'Criativos'
  | 'Vídeos'
  | 'Apresentações'
  | 'Contratos'
  | 'Briefings'
  | 'Propostas'
  | 'Referências'
  | 'Mockups'
  | 'Templates'
  | 'Comercial'
  | 'Onboarding'
  | 'Checklists'
  | 'Relatórios'
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
  type: 'client' | 'project' | 'material' | 'process' | 'task' | 'lead' | 'contract' | 'financial';
  user: string;
}
