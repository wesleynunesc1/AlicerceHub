-- ==============================================================================
-- ALICERCE OS — SQL DE ATUALIZAÇÃO / MIGRATION SEGURA E IDEMPOTENTE
-- Arquivo: alicerce_os_update.sql
-- Propósito: Atualizar a estrutura do Supabase sem apagar ou resetar dados existentes
-- Instrução: Supabase -> SQL Editor -> New query -> Colar este script -> Run
-- ==============================================================================

-- 1. EXTENSÕES
create extension if not exists "uuid-ossp";

-- 2. FUNÇÕES AUXILIARES DE SISTEMA
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- Trigger automático para vincular novos usuários do auth.users à tabela profiles
create or replace function public.handle_new_user()
returns trigger as $$
declare
  user_count int;
  assigned_role text;
begin
  select count(*) into user_count from public.profiles;
  if user_count = 0 then
    assigned_role := 'admin';
  else
    assigned_role := coalesce(new.raw_user_meta_data->>'role', 'team');
  end if;

  insert into public.profiles (id, nome, email, cargo, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'cargo', 'Estrategista Alicerce'),
    assigned_role
  )
  on conflict (id) do update set
    email = excluded.email,
    updated_at = now();

  return new;
end;
$$ language plpgsql security definer;

-- 3. TABELA DE PERFIS DE USUÁRIOS
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text not null,
  cargo text default 'Estrategista',
  avatar_url text,
  role text not null default 'team' check (role in ('admin', 'team', 'commercial', 'manager', 'designer', 'social_media', 'traffic_manager', 'client')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Colunas adicionais seguras em profiles
alter table public.profiles add column if not exists cargo text default 'Estrategista';
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists role text not null default 'team';

drop trigger if exists trigger_profiles_updated_at on public.profiles;
create trigger trigger_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. TABELA DE SERVIÇOS
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null default 'Operacional',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.services add column if not exists category text not null default 'Operacional';
alter table public.services add column if not exists active boolean not null default true;

-- 5. TABELA DE CLIENTES
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text not null,
  email text not null,
  phone text default '',
  website text default '',
  instagram text default '',
  segment text not null default 'Outros',
  status text not null default 'Ativo' check (status in ('Ativo', 'Em produção', 'Aguardando cliente', 'Pausado', 'Onboarding', 'Finalizado', 'Encerrado')),
  contract_value numeric(12, 2) not null default 0,
  recurrence text not null default 'Mensal' check (recurrence in ('Mensal', 'Trimestral', 'Semestral', 'Anual', 'Pontual')),
  start_date date not null default current_date,
  contract_end_date date,
  account_manager text not null default 'Wesley Nunes',
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clients add column if not exists phone text default '';
alter table public.clients add column if not exists website text default '';
alter table public.clients add column if not exists instagram text default '';
alter table public.clients add column if not exists segment text not null default 'Outros';
alter table public.clients add column if not exists contract_value numeric(12, 2) not null default 0;
alter table public.clients add column if not exists recurrence text not null default 'Mensal';
alter table public.clients add column if not exists account_manager text not null default 'Wesley Nunes';
alter table public.clients add column if not exists contract_end_date date;

drop trigger if exists trigger_clients_updated_at on public.clients;
create trigger trigger_clients_updated_at
  before update on public.clients
  for each row execute function public.handle_updated_at();

-- 6. TABELA DE PROJETOS
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  client_id uuid not null references public.clients(id) on delete cascade,
  service text not null,
  responsible text not null default 'Equipe Alicerce',
  status text not null default 'Em produção' check (status in ('Planejamento', 'Em produção', 'Revisão', 'Aguardando cliente', 'Finalizado', 'Pausado')),
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  start_date date not null default current_date,
  due_date date not null,
  description text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects add column if not exists description text default '';
alter table public.projects add column if not exists progress integer not null default 0;

drop trigger if exists trigger_projects_updated_at on public.projects;
create trigger trigger_projects_updated_at
  before update on public.projects
  for each row execute function public.handle_updated_at();

-- 7. TABELA DE TAREFAS (tasks)
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  project_id uuid references public.projects(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  responsible text not null default 'Equipe Alicerce',
  priority text not null default 'Média' check (priority in ('Baixa', 'Média', 'Alta', 'Urgente')),
  status text not null default 'Pendente' check (status in ('Pendente', 'Em andamento', 'Aguardando', 'Concluída')),
  due_date date not null default current_date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tasks add column if not exists description text default '';
alter table public.tasks add column if not exists priority text not null default 'Média';
alter table public.tasks add column if not exists completed_at timestamptz;

drop trigger if exists trigger_tasks_updated_at on public.tasks;
create trigger trigger_tasks_updated_at
  before update on public.tasks
  for each row execute function public.handle_updated_at();

-- 8. TABELA DE EVENTOS DE AGENDA (calendar_events)
create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date date not null default current_date,
  time text default '10:00',
  type text not null default 'Reunião' check (type in ('Entrega', 'Tarefa', 'Reunião', 'Follow-up', 'Contrato', 'Financeiro', 'Aprovação', 'Outro')),
  responsible text not null default 'Equipe Alicerce',
  client_id uuid references public.clients(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  notes text default '',
  created_at timestamptz not null default now()
);

alter table public.calendar_events add column if not exists time text default '10:00';
alter table public.calendar_events add column if not exists notes text default '';

-- 9. TABELA DE APROVAÇÕES DE MATERIAIS (approvals)
create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  client_id uuid references public.clients(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  type text not null default 'Criativo',
  file_url text,
  external_link text,
  responsible text not null default 'Equipe Alicerce',
  date date not null default current_date,
  notes text default '',
  feedback text default '',
  status text not null default 'Aguardando aprovação' check (status in ('Aguardando aprovação', 'Aprovado', 'Alterações solicitadas', 'Rejeitado')),
  history jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.approvals add column if not exists history jsonb default '[]'::jsonb;
alter table public.approvals add column if not exists feedback text default '';

drop trigger if exists trigger_approvals_updated_at on public.approvals;
create trigger trigger_approvals_updated_at
  before update on public.approvals
  for each row execute function public.handle_updated_at();

-- 10. TABELA DE LEADS COMERCIAIS (leads)
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text not null,
  phone text default '',
  whatsapp text default '',
  email text default '',
  service_of_interest text not null default 'Meta Ads',
  origin text not null default 'Instagram' check (origin in ('Instagram', 'Meta Ads', 'Google Ads', 'Indicação', 'Site', 'WhatsApp', 'Orgânico', 'Outro')),
  estimated_value numeric(12, 2) not null default 0,
  responsible text not null default 'Equipe Alicerce',
  status text not null default 'Novo lead' check (status in ('Novo lead', 'Contato realizado', 'Diagnóstico', 'Proposta', 'Negociação', 'Fechado', 'Perdido')),
  next_follow_up date,
  notes text default '',
  entry_date date not null default current_date,
  converted_client_id uuid references public.clients(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.leads add column if not exists converted_client_id uuid references public.clients(id) on delete set null;
alter table public.leads add column if not exists next_follow_up date;

drop trigger if exists trigger_leads_updated_at on public.leads;
create trigger trigger_leads_updated_at
  before update on public.leads
  for each row execute function public.handle_updated_at();

-- 11. TABELA DE PROPOSTAS COMERCIAIS (proposals)
create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  client_id uuid references public.clients(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  description text default '',
  services text[] default '{}',
  items jsonb default '[]'::jsonb,
  subtotal numeric(12, 2) not null default 0,
  discount numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  deadline text default '15 dias úteis',
  valid_until date not null default (current_date + interval '15 days'),
  notes text default '',
  status text not null default 'Rascunho' check (status in ('Rascunho', 'Enviada', 'Visualizada', 'Aprovada', 'Recusada', 'Expirada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trigger_proposals_updated_at on public.proposals;
create trigger trigger_proposals_updated_at
  before update on public.proposals
  for each row execute function public.handle_updated_at();

-- 12. TABELA DE CONTRATOS (contracts)
create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  service text not null default 'Meta Ads',
  value numeric(12, 2) not null default 0,
  recurrence text not null default 'Mensal' check (recurrence in ('Mensal', 'Trimestral', 'Semestral', 'Anual', 'Pontual')),
  start_date date not null default current_date,
  end_date date not null default (current_date + interval '180 days'),
  auto_renew boolean not null default true,
  status text not null default 'Ativo' check (status in ('Rascunho', 'Ativo', 'Vencendo', 'Encerrado', 'Cancelado')),
  file_url text,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trigger_contracts_updated_at on public.contracts;
create trigger trigger_contracts_updated_at
  before update on public.contracts
  for each row execute function public.handle_updated_at();

-- 13. TABELA DE RECEBÍVEIS FINANCEIROS (financial_entries)
create table if not exists public.financial_entries (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  contract_id uuid references public.contracts(id) on delete set null,
  description text not null,
  value numeric(12, 2) not null default 0,
  due_date date not null default current_date,
  payment_date date,
  status text not null default 'Pendente' check (status in ('Pendente', 'Pago', 'Atrasado', 'Cancelado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trigger_financial_updated_at on public.financial_entries;
create trigger trigger_financial_updated_at
  before update on public.financial_entries
  for each row execute function public.handle_updated_at();

-- 14. TABELA DE PROCESSOS SOP (processes)
create table if not exists public.processes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  service text not null,
  description text default '',
  responsible text not null default 'Wesley Nunes',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 15. TABELA DE ETAPAS DE PROCESSOS (process_steps)
create table if not exists public.process_steps (
  id uuid primary key default gen_random_uuid(),
  process_id uuid not null references public.processes(id) on delete cascade,
  step_number text not null,
  title text not null,
  description text default '',
  checklist text[] default '{}',
  "order" integer not null default 1,
  created_at timestamptz not null default now()
);

-- 16. TABELA DE MATERIAIS (materials)
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'Templates',
  type text not null default 'Link' check (type in ('Link', 'Documento', 'Planilha', 'Arquivo', 'Drive')),
  url text not null,
  description text default '',
  responsible text not null default 'Wesley Nunes',
  client_id uuid references public.clients(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  file_path text,
  file_size text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 17. TABELA DE PLANEJAMENTO DE CONTEÚDO (content_items)
create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  pauta text default '',
  pillar text not null default 'Institucional' check (pillar in ('Notícia / Atualidade', 'Curiosidade / Case', 'Educação', 'Institucional')),
  format text not null default 'Carrossel' check (format in ('Carrossel', 'Reels', 'Post Estático', 'Story', 'Vídeo', 'Artigo')),
  responsible text not null default 'Equipe Alicerce',
  client_id uuid references public.clients(id) on delete set null,
  script text default '',
  caption text default '',
  scheduled_date date not null default current_date,
  status text not null default 'Ideia' check (status in ('Ideia', 'Roteiro', 'Design', 'Revisão', 'Aprovado', 'Publicado')),
  files text[] default '{}',
  external_link text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trigger_content_updated_at on public.content_items;
create trigger trigger_content_updated_at
  before update on public.content_items
  for each row execute function public.handle_updated_at();

-- 18. TABELA DE COMENTÁRIOS E HISTÓRICO (comments)
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('client', 'project', 'task', 'approval', 'lead')),
  entity_id text not null,
  user_name text not null default 'Wesley Nunes',
  user_id uuid references auth.users(id) on delete set null,
  content text not null,
  created_at timestamptz not null default now()
);

-- 19. TABELA DE LINKS RÁPIDOS DE CLIENTES (quick_links)
create table if not exists public.quick_links (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  title text not null,
  url text not null,
  category text not null default 'Drive',
  created_at timestamptz not null default now()
);

-- 20. TABELA DE LOGS DE AUDITORIA E ATIVIDADE (activity_logs)
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  entity_type text not null,
  entity_id text not null,
  title text not null,
  description text default '',
  user_name text not null default 'Wesley Nunes',
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 21. ÍNDICES DE PERFORMANCE (IF NOT EXISTS)
create index if not exists idx_tasks_client on public.tasks(client_id);
create index if not exists idx_tasks_project on public.tasks(project_id);
create index if not exists idx_tasks_due on public.tasks(due_date);
create index if not exists idx_tasks_status on public.tasks(status);

create index if not exists idx_calendar_date on public.calendar_events(date);
create index if not exists idx_approvals_client on public.approvals(client_id);
create index if not exists idx_approvals_status on public.approvals(status);

create index if not exists idx_leads_status on public.leads(status);
create index if not exists idx_contracts_client on public.contracts(client_id);
create index if not exists idx_contracts_status on public.contracts(status);
create index if not exists idx_contracts_end_date on public.contracts(end_date);

create index if not exists idx_financial_due on public.financial_entries(due_date);
create index if not exists idx_financial_status on public.financial_entries(status);
create index if not exists idx_content_status on public.content_items(status);
create index if not exists idx_comments_entity on public.comments(entity_type, entity_id);

-- 22. HABILITAÇÃO DE ROW LEVEL SECURITY (RLS)
alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.calendar_events enable row level security;
alter table public.approvals enable row level security;
alter table public.leads enable row level security;
alter table public.proposals enable row level security;
alter table public.contracts enable row level security;
alter table public.financial_entries enable row level security;
alter table public.processes enable row level security;
alter table public.process_steps enable row level security;
alter table public.materials enable row level security;
alter table public.content_items enable row level security;
alter table public.comments enable row level security;
alter table public.quick_links enable row level security;
alter table public.activity_logs enable row level security;

-- 23. POLÍTICAS RLS IDEMPOTENTES (DROP IF EXISTS -> CREATE)
-- PROFILES
drop policy if exists "Usuários autenticados podem ver perfis" on public.profiles;
create policy "Usuários autenticados podem ver perfis" on public.profiles for select to authenticated using (true);
drop policy if exists "Usuários podem atualizar seus próprios perfis" on public.profiles;
create policy "Usuários podem atualizar seus próprios perfis" on public.profiles for update to authenticated using (auth.uid() = id);

-- SERVICES
drop policy if exists "Todos podem visualizar serviços" on public.services;
create policy "Todos podem visualizar serviços" on public.services for select to authenticated, anon using (active = true);
drop policy if exists "Admins podem gerenciar serviços" on public.services;
create policy "Admins podem gerenciar serviços" on public.services for all to authenticated using (true) with check (true);

-- CLIENTS
drop policy if exists "Usuários autenticados podem ver clientes" on public.clients;
create policy "Usuários autenticados podem ver clientes" on public.clients for select to authenticated using (true);
drop policy if exists "Usuários autenticados podem gerenciar clientes" on public.clients;
create policy "Usuários autenticados podem gerenciar clientes" on public.clients for all to authenticated using (true) with check (true);

-- PROJECTS
drop policy if exists "Usuários autenticados podem ver projetos" on public.projects;
create policy "Usuários autenticados podem ver projetos" on public.projects for select to authenticated using (true);
drop policy if exists "Usuários autenticados podem gerenciar projetos" on public.projects;
create policy "Usuários autenticados podem gerenciar projetos" on public.projects for all to authenticated using (true) with check (true);

-- TASKS
drop policy if exists "Usuários autenticados podem ver tarefas" on public.tasks;
create policy "Usuários autenticados podem ver tarefas" on public.tasks for select to authenticated using (true);
drop policy if exists "Usuários autenticados podem gerenciar tarefas" on public.tasks;
create policy "Usuários autenticados podem gerenciar tarefas" on public.tasks for all to authenticated using (true) with check (true);

-- CALENDAR EVENTS
drop policy if exists "Usuários autenticados podem ver eventos" on public.calendar_events;
create policy "Usuários autenticados podem ver eventos" on public.calendar_events for select to authenticated using (true);
drop policy if exists "Usuários autenticados podem gerenciar eventos" on public.calendar_events;
create policy "Usuários autenticados podem gerenciar eventos" on public.calendar_events for all to authenticated using (true) with check (true);

-- APPROVALS
drop policy if exists "Usuários autenticados podem ver aprovações" on public.approvals;
create policy "Usuários autenticados podem ver aprovações" on public.approvals for select to authenticated using (true);
drop policy if exists "Usuários autenticados podem gerenciar aprovações" on public.approvals;
create policy "Usuários autenticados podem gerenciar aprovações" on public.approvals for all to authenticated using (true) with check (true);

-- LEADS
drop policy if exists "Usuários autenticados podem ver leads" on public.leads;
create policy "Usuários autenticados podem ver leads" on public.leads for select to authenticated using (true);
drop policy if exists "Usuários autenticados podem gerenciar leads" on public.leads;
create policy "Usuários autenticados podem gerenciar leads" on public.leads for all to authenticated using (true) with check (true);

-- PROPOSALS
drop policy if exists "Usuários autenticados podem ver propostas" on public.proposals;
create policy "Usuários autenticados podem ver propostas" on public.proposals for select to authenticated using (true);
drop policy if exists "Usuários autenticados podem gerenciar propostas" on public.proposals;
create policy "Usuários autenticados podem gerenciar propostas" on public.proposals for all to authenticated using (true) with check (true);

-- CONTRACTS
drop policy if exists "Usuários autenticados podem ver contratos" on public.contracts;
create policy "Usuários autenticados podem ver contratos" on public.contracts for select to authenticated using (true);
drop policy if exists "Usuários autenticados podem gerenciar contratos" on public.contracts;
create policy "Usuários autenticados podem gerenciar contratos" on public.contracts for all to authenticated using (true) with check (true);

-- FINANCIAL ENTRIES
drop policy if exists "Usuários autenticados podem ver financeiro" on public.financial_entries;
create policy "Usuários autenticados podem ver financeiro" on public.financial_entries for select to authenticated using (true);
drop policy if exists "Usuários autenticados podem gerenciar financeiro" on public.financial_entries;
create policy "Usuários autenticados podem gerenciar financeiro" on public.financial_entries for all to authenticated using (true) with check (true);

-- PROCESSES & STEPS
drop policy if exists "Usuários autenticados podem visualizar processos" on public.processes;
create policy "Usuários autenticados podem visualizar processos" on public.processes for select to authenticated using (true);
drop policy if exists "Usuários autenticados podem criar e editar processos" on public.processes;
create policy "Usuários autenticados podem criar e editar processos" on public.processes for all to authenticated using (true) with check (true);
drop policy if exists "Usuários autenticados podem gerenciar etapas de processos" on public.process_steps;
create policy "Usuários autenticados podem gerenciar etapas de processos" on public.process_steps for all to authenticated using (true) with check (true);

-- MATERIALS
drop policy if exists "Usuários autenticados podem visualizar materiais" on public.materials;
create policy "Usuários autenticados podem visualizar materiais" on public.materials for select to authenticated using (true);
drop policy if exists "Usuários autenticados podem cadastrar materiais" on public.materials;
create policy "Usuários autenticados podem cadastrar materiais" on public.materials for insert to authenticated with check (true);
drop policy if exists "Usuários autenticados podem atualizar materiais" on public.materials;
create policy "Usuários autenticados podem atualizar materiais" on public.materials for update to authenticated using (true);
drop policy if exists "Usuários autenticados podem excluir materiais" on public.materials;
create policy "Usuários autenticados podem excluir materiais" on public.materials for delete to authenticated using (true);

-- CONTENT ITEMS
drop policy if exists "Usuários autenticados podem ver conteudo" on public.content_items;
create policy "Usuários autenticados podem ver conteudo" on public.content_items for select to authenticated using (true);
drop policy if exists "Usuários autenticados podem gerenciar conteudo" on public.content_items;
create policy "Usuários autenticados podem gerenciar conteudo" on public.content_items for all to authenticated using (true) with check (true);

-- COMMENTS
drop policy if exists "Usuários autenticados podem ver comentários" on public.comments;
create policy "Usuários autenticados podem ver comentários" on public.comments for select to authenticated using (true);
drop policy if exists "Usuários autenticados podem criar comentários" on public.comments;
create policy "Usuários autenticados podem criar comentários" on public.comments for all to authenticated using (true) with check (true);

-- QUICK LINKS
drop policy if exists "Usuários autenticados podem ver links rápidos" on public.quick_links;
create policy "Usuários autenticados podem ver links rápidos" on public.quick_links for select to authenticated using (true);
drop policy if exists "Usuários autenticados podem gerenciar links rápidos" on public.quick_links;
create policy "Usuários autenticados podem gerenciar links rápidos" on public.quick_links for all to authenticated using (true) with check (true);

-- ACTIVITY LOGS
drop policy if exists "Usuários autenticados podem visualizar logs de atividade" on public.activity_logs;
create policy "Usuários autenticados podem visualizar logs de atividade" on public.activity_logs for select to authenticated using (true);
drop policy if exists "Usuários autenticados podem criar logs de atividade" on public.activity_logs;
create policy "Usuários autenticados podem criar logs de atividade" on public.activity_logs for insert to authenticated with check (true);

-- 24. STORAGE: BUCKET DE MATERIAIS
insert into storage.buckets (id, name, public)
values ('materials', 'materials', true)
on conflict (id) do update set public = true;

drop policy if exists "Materiais públicos para visualização" on storage.objects;
create policy "Materiais públicos para visualização"
  on storage.objects for select
  to authenticated, anon
  using (bucket_id = 'materials');

drop policy if exists "Upload de materiais por usuários autenticados" on storage.objects;
create policy "Upload de materiais por usuários autenticados"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'materials');

drop policy if exists "Atualização de materiais por usuários autenticados" on storage.objects;
create policy "Atualização de materiais por usuários autenticados"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'materials');

drop policy if exists "Exclusão de materiais por usuários autenticados" on storage.objects;
create policy "Exclusão de materiais por usuários autenticados"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'materials');

-- 25. CARGA INICIAL ESTRUTURAL (SEM DADOS FICTÍCIOS / SEM MOCK DATA)
insert into public.services (name, category, active) values
  ('Meta Ads', 'Tráfego & Aquisição', true),
  ('Google Ads', 'Tráfego & Aquisição', true),
  ('Social Media', 'Presença & Conteúdo', true),
  ('Google Meu Negócio', 'Presença Local', true),
  ('Landing Page', 'Desenvolvimento Web', true),
  ('Site Institucional', 'Desenvolvimento Web', true),
  ('Identidade Visual', 'Branding & Design', true),
  ('Criativos', 'Branding & Design', true),
  ('Edição de Vídeo', 'Audiovisual', true),
  ('Plano Estratégico', 'Estratégia & Direção', true),
  ('Posicionamento', 'Estratégia & Direção', true),
  ('Estruturação Digital', 'Infraestrutura & Operação', true),
  ('Outros', 'Geral', true)
on conflict (name) do nothing;
