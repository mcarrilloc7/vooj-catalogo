-- ============================================================================
-- VOOJ · vooj-catalogo — esquema inicial
-- Correr en Supabase → SQL Editor (una sola vez).
-- ============================================================================

-- gen_random_uuid() ya viene disponible en Supabase; esta línea es idempotente.
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. Tabla productos
-- ----------------------------------------------------------------------------
create table if not exists public.productos (
  id             uuid         primary key default gen_random_uuid(),
  nombre         text         not null,
  descripcion    text,
  precio         numeric      not null,
  categoria      text         not null,
  talla          text,
  existencias    integer      not null,
  disponible     boolean      not null default true,
  fotos          text[]       not null default '{}',
  actualizado_en timestamptz  not null default now()
);

-- Mantener actualizado_en al día en cada UPDATE.
create or replace function public.set_actualizado_en()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

drop trigger if exists trg_productos_actualizado_en on public.productos;
create trigger trg_productos_actualizado_en
  before update on public.productos
  for each row execute function public.set_actualizado_en();

-- ----------------------------------------------------------------------------
-- 2. RLS de productos
--    - lectura pública: solo filas con disponible = true
--    - escritura (insert / update / delete): solo usuarios autenticados
-- ----------------------------------------------------------------------------
alter table public.productos enable row level security;

drop policy if exists "productos: lectura pública de disponibles" on public.productos;
create policy "productos: lectura pública de disponibles"
  on public.productos
  for select
  using (disponible = true);

drop policy if exists "productos: insert para autenticados" on public.productos;
create policy "productos: insert para autenticados"
  on public.productos
  for insert
  to authenticated
  with check (true);

drop policy if exists "productos: update para autenticados" on public.productos;
create policy "productos: update para autenticados"
  on public.productos
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "productos: delete para autenticados" on public.productos;
create policy "productos: delete para autenticados"
  on public.productos
  for delete
  to authenticated
  using (true);

-- ----------------------------------------------------------------------------
-- 3. Storage: bucket vooj-fotos (público en lectura)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('vooj-fotos', 'vooj-fotos', true)
on conflict (id) do update set public = true;

-- Lectura pública de los objetos del bucket.
drop policy if exists "vooj-fotos: lectura pública" on storage.objects;
create policy "vooj-fotos: lectura pública"
  on storage.objects
  for select
  using (bucket_id = 'vooj-fotos');

-- Subir / reemplazar / borrar fotos: solo usuarios autenticados.
drop policy if exists "vooj-fotos: insert para autenticados" on storage.objects;
create policy "vooj-fotos: insert para autenticados"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'vooj-fotos');

drop policy if exists "vooj-fotos: update para autenticados" on storage.objects;
create policy "vooj-fotos: update para autenticados"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'vooj-fotos')
  with check (bucket_id = 'vooj-fotos');

drop policy if exists "vooj-fotos: delete para autenticados" on storage.objects;
create policy "vooj-fotos: delete para autenticados"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'vooj-fotos');

-- ============================================================================
-- OPCIONAL — descomentar cuando conectes el panel admin.
-- Con las políticas de arriba, un usuario autenticado SOLO puede leer los
-- productos con disponible = true (igual que el público). Para que el admin
-- liste también los agotados / ocultos, agregá esta política de lectura:
-- ----------------------------------------------------------------------------
-- drop policy if exists "productos: lectura total para autenticados" on public.productos;
-- create policy "productos: lectura total para autenticados"
--   on public.productos
--   for select
--   to authenticated
--   using (true);
-- ============================================================================
