-- Alicerce OS — Imagem de capa nas tarefas
-- Execute no SQL Editor do Supabase.

alter table public.tasks add column if not exists cover_image text;

-- As imagens são enviadas para o bucket "materials", na pasta "task-covers/".
-- Garante que o bucket exista e seja público para leitura.
insert into storage.buckets (id, name, public)
values ('materials', 'materials', true)
on conflict (id) do update set public = true;

drop policy if exists "task_covers_public_read" on storage.objects;
create policy "task_covers_public_read"
  on storage.objects for select
  using (bucket_id = 'materials' and (storage.foldername(name))[1] = 'task-covers');

drop policy if exists "task_covers_authenticated_write" on storage.objects;
create policy "task_covers_authenticated_write"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'materials' and (storage.foldername(name))[1] = 'task-covers');

drop policy if exists "task_covers_authenticated_update" on storage.objects;
create policy "task_covers_authenticated_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'materials' and (storage.foldername(name))[1] = 'task-covers');
