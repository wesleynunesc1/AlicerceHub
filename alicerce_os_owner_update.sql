-- ==============================================================================
-- ALICERCE OS — MIGRATION: RESTRINGIR SISTEMA AO DONO + CAMPOS OPCIONAIS
-- Arquivo: alicerce_os_owner_update.sql
-- Proprietário exclusivo: wesleynunespro@gmail.com (role: 'owner')
-- Regra: Sem DROP TABLE ou TRUNCATE. Preserva todos os dados existentes.
-- Execução: Supabase Dashboard -> SQL Editor -> Colar este script -> Run
-- ==============================================================================

-- 1. ATUALIZAR CONSTRAINT DE ROLE EM PROFILES PARA SUPORTAR 'owner'
do $$
begin
  if exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'profiles_role_check'
      and table_name = 'profiles'
  ) then
    alter table public.profiles drop constraint profiles_role_check;
  end if;
end $$;

alter table public.profiles 
  add constraint profiles_role_check 
  check (role in ('owner', 'admin', 'team', 'commercial', 'manager', 'designer', 'social_media', 'traffic_manager', 'client'));

-- 2. GARANTIR QUE O USUÁRIO DONO TENHA ROLE = 'owner'
-- Atualiza registro de perfil se já existir com o email wesleynunespro@gmail.com
update public.profiles
set 
  role = 'owner',
  cargo = coalesce(cargo, 'Diretor Geral / Dono'),
  updated_at = now()
where lower(email) = 'wesleynunespro@gmail.com';

-- Se existir usuário no auth.users mas não em profiles, insere o perfil como owner
insert into public.profiles (id, nome, email, cargo, role)
select 
  u.id,
  coalesce(u.raw_user_meta_data->>'nome', u.raw_user_meta_data->>'name', 'Wesley Nunes'),
  u.email,
  'Diretor Geral / Dono',
  'owner'
from auth.users u
where lower(u.email) = 'wesleynunespro@gmail.com'
  and not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do update set
  role = 'owner',
  updated_at = now();

-- 3. FUNÇÃO DE SEGURANÇA: is_owner()
-- Retorna true apenas para wesleynunespro@gmail.com ou role = 'owner'
create or replace function public.is_owner()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and (role = 'owner' or lower(email) = 'wesleynunespro@gmail.com')
  ) or lower(coalesce(auth.jwt() ->> 'email', '')) = 'wesleynunespro@gmail.com';
$$;

-- Atualiza is_admin() para herdar de is_owner()
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select public.is_owner() or exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'owner')
  );
$$;

-- 4. FLEXIBILIZAÇÃO DE COLUNAS OBRIGATÓRIAS (CADASTRO RÁPIDO)
-- Remove restrições NOT NULL desnecessárias para viabilizar cadastro rápido

-- 4.1 TAREFAS (tasks): Apenas title é estritamente obrigatório. Prazo pode ser null.
alter table public.tasks alter column due_date drop not null;
alter table public.tasks alter column due_date drop default;

-- 4.2 CLIENTES (clients): Apenas company_name obrigatório. Contato, email, etc opcionais.
alter table public.clients alter column contact_name drop not null;
alter table public.clients alter column contact_name set default '';
alter table public.clients alter column email drop not null;
alter table public.clients alter column email set default '';
alter table public.clients alter column segment drop not null;
alter table public.clients alter column segment set default 'Outros';

-- 4.3 PROJETOS (projects): Apenas name obrigatório. Cliente, serviço, prazo opcionais.
alter table public.projects alter column client_id drop not null;
alter table public.projects alter column service drop not null;
alter table public.projects alter column service set default '';
alter table public.projects alter column due_date drop not null;

-- 4.4 LEADS (leads): Apenas name/company essencial.
alter table public.leads alter column company drop not null;
alter table public.leads alter column company set default '';

-- 4.5 RECEBÍVEIS (financial_entries): Cliente opcional
alter table public.financial_entries alter column client_id drop not null;

-- 4.6 MATERIAIS (materials): Link pode ser opcional se for rascunho
alter table public.materials alter column url drop not null;
alter table public.materials alter column url set default '';

-- 5. POLÍTICAS DE ROW LEVEL SECURITY (RLS) RESTRITAS AO OWNER
-- Bloqueia acesso de terceiros, anônimos ou outros usuários cadastrados no Supabase

-- Habilita RLS em todas as tabelas
alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.clients enable row level security;
alter table public.client_services enable row level security;
alter table public.projects enable row level security;
alter table public.project_steps enable row level security;
alter table public.processes enable row level security;
alter table public.process_steps enable row level security;
alter table public.materials enable row level security;
alter table public.brand_assets enable row level security;
alter table public.activity_logs enable row level security;
alter table public.tasks enable row level security;
alter table public.calendar_events enable row level security;
alter table public.approvals enable row level security;
alter table public.leads enable row level security;
alter table public.proposals enable row level security;
alter table public.contracts enable row level security;
alter table public.financial_entries enable row level security;
alter table public.content_items enable row level security;
alter table public.comments enable row level security;
alter table public.quick_links enable row level security;

-- PROFILES
drop policy if exists "Usuários autenticados podem ver perfis" on public.profiles;
drop policy if exists "Usuários podem atualizar seus próprios perfis" on public.profiles;
drop policy if exists "Usuários podem atualizar seu próprio perfil" on public.profiles;
drop policy if exists "Admin pode gerenciar perfis" on public.profiles;
drop policy if exists "Owner acesso total profiles" on public.profiles;

create policy "Owner acesso total profiles"
  on public.profiles for all
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

-- SERVICES
drop policy if exists "Todos podem visualizar serviços" on public.services;
drop policy if exists "Usuários autenticados podem visualizar serviços" on public.services;
drop policy if exists "Admins podem gerenciar serviços" on public.services;
drop policy if exists "Owner acesso total services" on public.services;

create policy "Owner acesso total services"
  on public.services for all
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

-- CLIENTS
drop policy if exists "Usuários autenticados podem ver clientes" on public.clients;
drop policy if exists "Usuários autenticados podem gerenciar clientes" on public.clients;
drop policy if exists "Owner acesso total clients" on public.clients;

create policy "Owner acesso total clients"
  on public.clients for all
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

-- CLIENT SERVICES
drop policy if exists "Owner acesso total client_services" on public.client_services;
create policy "Owner acesso total client_services"
  on public.client_services for all
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

-- PROJECTS
drop policy if exists "Usuários autenticados podem ver projetos" on public.projects;
drop policy if exists "Usuários autenticados podem gerenciar projetos" on public.projects;
drop policy if exists "Owner acesso total projects" on public.projects;

create policy "Owner acesso total projects"
  on public.projects for all
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

-- PROJECT STEPS
drop policy if exists "Owner acesso total project_steps" on public.project_steps;
create policy "Owner acesso total project_steps"
  on public.project_steps for all
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

-- TASKS
drop policy if exists "Usuários autenticados podem ver tarefas" on public.tasks;
drop policy if exists "Usuários autenticados podem gerenciar tarefas" on public.tasks;
drop policy if exists "Owner acesso total tasks" on public.tasks;

create policy "Owner acesso total tasks"
  on public.tasks for all
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

-- CALENDAR EVENTS
drop policy if exists "Usuários autenticados podem ver eventos" on public.calendar_events;
drop policy if exists "Usuários autenticados podem gerenciar eventos" on public.calendar_events;
drop policy if exists "Owner acesso total calendar_events" on public.calendar_events;

create policy "Owner acesso total calendar_events"
  on public.calendar_events for all
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

-- APPROVALS
drop policy if exists "Usuários autenticados podem ver aprovações" on public.approvals;
drop policy if exists "Usuários autenticados podem gerenciar aprovações" on public.approvals;
drop policy if exists "Owner acesso total approvals" on public.approvals;

create policy "Owner acesso total approvals"
  on public.approvals for all
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

-- LEADS
drop policy if exists "Usuários autenticados podem ver leads" on public.leads;
drop policy if exists "Usuários autenticados podem gerenciar leads" on public.leads;
drop policy if exists "Owner acesso total leads" on public.leads;

create policy "Owner acesso total leads"
  on public.leads for all
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

-- PROPOSALS
drop policy if exists "Usuários autenticados podem ver propostas" on public.proposals;
drop policy if exists "Usuários autenticados podem gerenciar propostas" on public.proposals;
drop policy if exists "Owner acesso total proposals" on public.proposals;

create policy "Owner acesso total proposals"
  on public.proposals for all
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

-- CONTRACTS
drop policy if exists "Usuários autenticados podem ver contratos" on public.contracts;
drop policy if exists "Usuários autenticados podem gerenciar contratos" on public.contracts;
drop policy if exists "Owner acesso total contracts" on public.contracts;

create policy "Owner acesso total contracts"
  on public.contracts for all
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

-- FINANCIAL ENTRIES
drop policy if exists "Usuários autenticados podem ver entradas financeiras" on public.financial_entries;
drop policy if exists "Usuários autenticados podem gerenciar entradas financeiras" on public.financial_entries;
drop policy if exists "Owner acesso total financial_entries" on public.financial_entries;

create policy "Owner acesso total financial_entries"
  on public.financial_entries for all
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

-- PROCESSES & PROCESS STEPS
drop policy if exists "Owner acesso total processes" on public.processes;
create policy "Owner acesso total processes"
  on public.processes for all
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

drop policy if exists "Owner acesso total process_steps" on public.process_steps;
create policy "Owner acesso total process_steps"
  on public.process_steps for all
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

-- MATERIALS
drop policy if exists "Owner acesso total materials" on public.materials;
create policy "Owner acesso total materials"
  on public.materials for all
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

-- BRAND ASSETS
drop policy if exists "Owner acesso total brand_assets" on public.brand_assets;
create policy "Owner acesso total brand_assets"
  on public.brand_assets for all
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

-- CONTENT ITEMS
drop policy if exists "Owner acesso total content_items" on public.content_items;
create policy "Owner acesso total content_items"
  on public.content_items for all
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

-- COMMENTS
drop policy if exists "Owner acesso total comments" on public.comments;
create policy "Owner acesso total comments"
  on public.comments for all
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

-- QUICK LINKS
drop policy if exists "Owner acesso total quick_links" on public.quick_links;
create policy "Owner acesso total quick_links"
  on public.quick_links for all
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

-- ACTIVITY LOGS
drop policy if exists "Owner acesso total activity_logs" on public.activity_logs;
create policy "Owner acesso total activity_logs"
  on public.activity_logs for all
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

-- ==============================================================================
-- FINALIZAÇÃO
-- Verificação de status do owner:
-- select id, nome, email, role from public.profiles where lower(email) = 'wesleynunespro@gmail.com';
-- ==============================================================================
