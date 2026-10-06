-- ==============================================================================
-- ALICERCE OS — MIGRATION DEFENSIVA: RESTRINGIR SISTEMA AO DONO + CAMPOS OPCIONAIS
-- Arquivo: alicerce_os_owner_update.sql
-- Proprietário exclusivo: wesleynunespro@gmail.com (role: 'owner')
-- Regra de Ouro: Sem DROP TABLE ou TRUNCATE. 100% idempotente e defensivo.
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

  alter table public.profiles 
    add constraint profiles_role_check 
    check (role in ('owner', 'admin', 'team', 'commercial', 'manager', 'designer', 'social_media', 'traffic_manager', 'client'));
exception when others then
  null; -- Se a constraint já existir ou tiver outro nome, segue sem erro
end $$;

-- 2. GARANTIR QUE O USUÁRIO DONO TENHA ROLE = 'owner'
update public.profiles
set 
  role = 'owner',
  cargo = coalesce(cargo, 'Diretor Geral / Dono'),
  updated_at = now()
where lower(email) = 'wesleynunespro@gmail.com';

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'auth' and table_name = 'users') then
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
  end if;
exception when others then
  null;
end $$;

-- 3. FUNÇÕES DE SEGURANÇA: is_owner() e is_admin()
-- Retorna true para wesleynunespro@gmail.com ou role = 'owner'
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

-- 4. FLEXIBILIZAÇÃO DEFENSIVA DE COLUNAS OBRIGATÓRIAS (CADASTRO RÁPIDO)
-- Remove restrições NOT NULL apenas se as colunas e tabelas existirem
do $$
begin
  -- 4.1 TAREFAS (tasks): Apenas title é obrigatório. Prazo pode ser null.
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'tasks' and column_name = 'due_date') then
    alter table public.tasks alter column due_date drop not null;
    alter table public.tasks alter column due_date drop default;
  end if;

  -- 4.2 CLIENTES (clients): Apenas company_name obrigatório. Contato, email e segmento opcionais.
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'clients' and column_name = 'contact_name') then
    alter table public.clients alter column contact_name drop not null;
    alter table public.clients alter column contact_name set default '';
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'clients' and column_name = 'email') then
    alter table public.clients alter column email drop not null;
    alter table public.clients alter column email set default '';
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'clients' and column_name = 'segment') then
    alter table public.clients alter column segment drop not null;
    alter table public.clients alter column segment set default 'Outros';
  end if;

  -- 4.3 PROJETOS (projects): Apenas name obrigatório. Cliente, serviço e prazo opcionais.
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'projects' and column_name = 'client_id') then
    alter table public.projects alter column client_id drop not null;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'projects' and column_name = 'service') then
    alter table public.projects alter column service drop not null;
    alter table public.projects alter column service set default '';
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'projects' and column_name = 'service_id') then
    alter table public.projects alter column service_id drop not null;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'projects' and column_name = 'due_date') then
    alter table public.projects alter column due_date drop not null;
  end if;

  -- 4.4 LEADS (leads): Apenas name essencial. Empresa opcional.
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'leads' and column_name = 'company') then
    alter table public.leads alter column company drop not null;
    alter table public.leads alter column company set default '';
  end if;

  -- 4.5 RECEBÍVEIS (financial_entries): Cliente opcional
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'financial_entries' and column_name = 'client_id') then
    alter table public.financial_entries alter column client_id drop not null;
  end if;

  -- 4.6 MATERIAIS (materials): Link/URL opcional
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'materials' and column_name = 'url') then
    alter table public.materials alter column url drop not null;
    alter table public.materials alter column url set default '';
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'materials' and column_name = 'file_url') then
    alter table public.materials alter column file_url drop not null;
    alter table public.materials alter column file_url set default '';
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'materials' and column_name = 'external_url') then
    alter table public.materials alter column external_url drop not null;
    alter table public.materials alter column external_url set default '';
  end if;
end $$;

-- 5. POLÍTICAS DE ROW LEVEL SECURITY (RLS) RESTRITAS AO OWNER
-- Execução totalmente dinâmica: aplica apenas nas tabelas existentes no banco
do $$
declare
  target_table text;
  pol_rec record;
  tables_to_secure text[] := array[
    'profiles', 'services', 'clients', 'client_services', 'projects',
    'project_steps', 'processes', 'process_steps', 'materials',
    'brand_assets', 'activity_logs', 'tasks', 'calendar_events',
    'approvals', 'leads', 'proposals', 'contracts', 'financial_entries',
    'content_items', 'comments', 'quick_links'
  ];
begin
  foreach target_table in array tables_to_secure loop
    -- Verifica se a tabela realmente existe antes de manipular RLS
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = target_table) then
      -- 1. Habilita RLS
      execute format('alter table public.%I enable row level security', target_table);

      -- 2. Remove políticas existentes na tabela para evitar conflitos ou brechas
      for pol_rec in (
        select policyname 
        from pg_policies 
        where schemaname = 'public' and tablename = target_table
      ) loop
        execute format('drop policy if exists %I on public.%I', pol_rec.policyname, target_table);
      end loop;

      -- 3. Cria a política exclusiva do Owner
      execute format('
        create policy %I on public.%I
        for all
        to authenticated
        using (public.is_owner())
        with check (public.is_owner())
      ', 'Owner acesso total ' || target_table, target_table);
    end if;
  end loop;
end $$;

-- ==============================================================================
-- 6. VERIFICAÇÃO FINAL
-- Execute o comando abaixo para confirmar que seu perfil é o Owner:
-- select id, nome, email, role, cargo from public.profiles where lower(email) = 'wesleynunespro@gmail.com';
-- ==============================================================================
