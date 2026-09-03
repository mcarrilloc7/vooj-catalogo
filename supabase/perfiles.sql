-- ============================================================================
-- VOOJ · vooj-catalogo — perfiles de usuario + RLS de productos por perfil
-- Correr en Supabase → SQL Editor DESPUÉS de schema.sql.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Tabla perfiles (1 fila por usuario de auth.users)
--    rol: 'dueña' o 'soporte'. Por ahora ambos roles tienen los mismos
--    permisos; el rol sirve para identificar quién hizo qué y para poder
--    restringir más adelante sin rediseñar.
-- ----------------------------------------------------------------------------
create table if not exists public.perfiles (
  id     uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  rol    text not null check (rol in ('dueña', 'soporte'))
);

alter table public.perfiles enable row level security;

-- Cada usuario autenticado puede leer SU propio perfil (para mostrar
-- nombre + rol en el panel). Nadie inserta/edita perfiles desde la app:
-- eso se hace desde el SQL Editor (ver más abajo).
drop policy if exists "perfiles: leer el propio" on public.perfiles;
create policy "perfiles: leer el propio"
  on public.perfiles
  for select
  to authenticated
  using (id = (select auth.uid()));

-- ----------------------------------------------------------------------------
-- 2. Helper: ¿el usuario actual tiene perfil?
--    SECURITY DEFINER para poder consultarlo desde las políticas de
--    productos sin recursión de RLS.
-- ----------------------------------------------------------------------------
create or replace function public.tiene_perfil()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.perfiles where id = (select auth.uid())
  );
$$;

revoke all on function public.tiene_perfil() from public;
grant execute on function public.tiene_perfil() to authenticated;

-- ----------------------------------------------------------------------------
-- 3. RLS de productos: quien tenga perfil (dueña o soporte) tiene acceso
--    completo de lectura y escritura. Se mantiene la lectura pública de
--    los productos con disponible = true (para /catalogo).
-- ----------------------------------------------------------------------------

-- Quitar las políticas de escritura "para cualquier autenticado" del paso 2.
drop policy if exists "productos: insert para autenticados" on public.productos;
drop policy if exists "productos: update para autenticados" on public.productos;
drop policy if exists "productos: delete para autenticados" on public.productos;

-- Lectura total (incluye los ocultos) para usuarios con perfil.
drop policy if exists "productos: lectura total con perfil" on public.productos;
create policy "productos: lectura total con perfil"
  on public.productos
  for select
  to authenticated
  using (public.tiene_perfil());

drop policy if exists "productos: insert con perfil" on public.productos;
create policy "productos: insert con perfil"
  on public.productos
  for insert
  to authenticated
  with check (public.tiene_perfil());

drop policy if exists "productos: update con perfil" on public.productos;
create policy "productos: update con perfil"
  on public.productos
  for update
  to authenticated
  using (public.tiene_perfil())
  with check (public.tiene_perfil());

drop policy if exists "productos: delete con perfil" on public.productos;
create policy "productos: delete con perfil"
  on public.productos
  for delete
  to authenticated
  using (public.tiene_perfil());

-- ============================================================================
-- 4. CREAR LOS PERFILES (correr DESPUÉS de crear las cuentas en
--    Authentication → Users). Cambiá los correos y nombres por los reales.
-- ----------------------------------------------------------------------------
-- insert into public.perfiles (id, nombre, rol)
-- select id, 'Nombre de la dueña', 'dueña'
-- from auth.users where email = 'duena@ejemplo.com';
--
-- insert into public.perfiles (id, nombre, rol)
-- select id, 'Isabel', 'soporte'
-- from auth.users where email = 'isabel@ejemplo.com';
-- ============================================================================
