-- Ejecutar como propietario en SQL Editor. Añade tablas nuevas; no modifica las evaluaciones anteriores.
begin;
create table if not exists public.sc_web_members(username text primary key,username_key text unique not null,salt text not null,digest text not null,temporary boolean not null default false);
create table if not exists public.sc_web_sessions(token_hash text primary key,username text not null references public.sc_web_members(username),expires_at timestamptz not null);
create index if not exists sc_web_sessions_expiry on public.sc_web_sessions(expires_at);
create table if not exists public.sc_web_catalog(id integer primary key check(id=1),revision integer not null default 0,data jsonb not null);
create table if not exists public.sc_web_limits(key text primary key,attempts integer not null,reset_at timestamptz not null);
create table if not exists public.sc_web_rooms(pin text primary key check(pin ~ '^\d{6}$'),owner text not null references public.sc_web_members(username),host_uid uuid not null references auth.users(id),expires_at timestamptz not null);
create table if not exists public.sc_web_room_access(pin text references public.sc_web_rooms(pin) on delete cascade,user_id uuid references auth.users(id) on delete cascade,expires_at timestamptz not null,primary key(pin,user_id));
alter table public.sc_web_members enable row level security;
alter table public.sc_web_sessions enable row level security;
alter table public.sc_web_catalog enable row level security;
alter table public.sc_web_limits enable row level security;
alter table public.sc_web_rooms enable row level security;
alter table public.sc_web_room_access enable row level security;
revoke all on public.sc_web_members,public.sc_web_sessions,public.sc_web_catalog,public.sc_web_limits,public.sc_web_rooms,public.sc_web_room_access from anon,authenticated;
grant all on public.sc_web_members,public.sc_web_sessions,public.sc_web_catalog,public.sc_web_limits,public.sc_web_rooms,public.sc_web_room_access to service_role;

create or replace function public.sc_web_limit(p_key text,p_limit integer) returns boolean language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 insert into public.sc_web_limits(key,attempts,reset_at) values(p_key,1,clock_timestamp()+interval '15 minutes')
 on conflict(key) do update set attempts=case when sc_web_limits.reset_at<clock_timestamp() then 1 else sc_web_limits.attempts+1 end,
 reset_at=case when sc_web_limits.reset_at<clock_timestamp() then clock_timestamp()+interval '15 minutes' else sc_web_limits.reset_at end
 returning attempts into n;
 return n<=p_limit;
end $$;
revoke all on function public.sc_web_limit(text,integer) from public,anon,authenticated;
grant execute on function public.sc_web_limit(text,integer) to service_role;

create or replace function public.sc_web_save_catalog(p_revision integer,p_data jsonb) returns integer language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 update public.sc_web_catalog set data=p_data,revision=revision+1 where id=1 and revision=p_revision returning revision into n;
 return n;
end $$;
revoke all on function public.sc_web_save_catalog(integer,jsonb) from public,anon,authenticated;
grant execute on function public.sc_web_save_catalog(integer,jsonb) to service_role;

-- Dos canales privados separan permisos de emisión del anfitrión y de los aspirantes.
create or replace function public.sc_web_realtime_allowed(p_topic text,p_write boolean) returns boolean language sql stable security definer set search_path='' as $$
 select exists(
  select 1 from public.sc_web_room_access a join public.sc_web_rooms r on r.pin=a.pin
  where a.user_id=auth.uid() and a.expires_at>now() and r.expires_at>now()
  and ((p_topic='sc-host-'||r.pin and (not p_write or r.host_uid=auth.uid()))
    or (p_topic='sc-player-'||r.pin and true))
 );
$$;
revoke all on function public.sc_web_realtime_allowed(text,boolean) from public,anon;
grant execute on function public.sc_web_realtime_allowed(text,boolean) to authenticated;
drop policy if exists sc_web_receive on realtime.messages;
drop policy if exists sc_web_send on realtime.messages;
create policy sc_web_receive on realtime.messages for select to authenticated using(extension='broadcast' and public.sc_web_realtime_allowed(realtime.topic(),false));
create policy sc_web_send on realtime.messages for insert to authenticated with check(extension='broadcast' and public.sc_web_realtime_allowed(realtime.topic(),true));
commit;
