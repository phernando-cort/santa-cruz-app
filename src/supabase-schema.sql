-- Santa Cruz · backend compartido (Supabase) — esquema mínimo.
-- Ejecutar UNA vez en Supabase → SQL Editor → New query → Run.
--
-- Modelo: UNA tabla para las 16 colecciones de la app
-- (0 bulletins, 1 documents, 2 messages, 3 intenciones, 4 directory, 5 news,
--  6 ministry, 7 parishPrayers, 8 cantos, 9 videos, 10 givingUpdates,
--  11 givingGoals, 12 muro, 13 config, 14 editors, 15 users).
-- Clave primaria (c, par, rid) = (colección, parroquia, id del registro).

create table if not exists public.parish_records (
  c          integer not null,
  par        text    not null default '',
  rid        text    not null,
  body       jsonb   not null default '{}'::jsonb,
  ts         bigint  not null default 0,
  updated_at timestamptz not null default now(),
  primary key (c, par, rid)
);

create index if not exists idx_parish_records_par_ts
  on public.parish_records (c, par, ts desc);

-- Para recibir DELETE por Realtime con el registro completo:
alter table public.parish_records replica identity full;

-- Lectura/escritura pública (demo parroquial, igual que el servidor Perchance):
-- cualquiera puede leer y publicar; el borrado y la gestión de cuentas
-- se controlan en el cliente (solo admin/editores ven los botones).
-- Si quieres endurecerlo (p.ej. solo admin borra), pide el modo estricto.
alter table public.parish_records enable row level security;

drop policy if exists "public read"   on public.parish_records;
drop policy if exists "public insert" on public.parish_records;
drop policy if exists "public update" on public.parish_records;
drop policy if exists "public delete" on public.parish_records;

create policy "public read"   on public.parish_records for select using (true);
create policy "public insert" on public.parish_records for insert with check (true);
create policy "public update" on public.parish_records for update using (true) with check (true);
create policy "public delete" on public.parish_records for delete using (true);

-- Activar Realtime en esta tabla (si ya está añadida, esta línea da aviso y no pasa nada):
do $$
begin
  begin
    execute 'alter publication supabase_realtime add table public.parish_records';
  exception when duplicate_object then
    null;
  end;
end $$;

-- ============================================================
-- Contenidos editables del sitio (para que el editor corrija todo).
-- Ejecutar también UNA vez (si ya ejecutaste la parte de arriba, pega
-- solo desde aquí). Clave -> JSON. RLS pública (modelo demo parroquial).
-- ============================================================
create table if not exists public.site_content (
  key        text    not null primary key,
  body       jsonb   not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

drop policy if exists "public read"   on public.site_content;
drop policy if exists "public insert" on public.site_content;
drop policy if exists "public update" on public.site_content;
drop policy if exists "public delete" on public.site_content;

create policy "public read"   on public.site_content for select using (true);
create policy "public insert" on public.site_content for insert with check (true);
create policy "public update" on public.site_content for update using (true) with check (true);
create policy "public delete" on public.site_content for delete using (true);

alter table public.site_content replica identity full;

do $$
begin
  begin
    execute 'alter publication supabase_realtime add table public.site_content';
  exception when duplicate_object then
    null;
  end;
end $$;
