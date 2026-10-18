-- Añade un historial privado; no modifica cuestionarios ni cuentas existentes.
begin;
create table if not exists public.sc_web_live_results(
 id uuid primary key,
 owner text not null references public.sc_web_members(username),
 created_at timestamptz not null default now(),
 report jsonb not null
);
alter table public.sc_web_live_results enable row level security;
revoke all on public.sc_web_live_results from anon, authenticated;
grant select,insert on public.sc_web_live_results to service_role;
commit;
