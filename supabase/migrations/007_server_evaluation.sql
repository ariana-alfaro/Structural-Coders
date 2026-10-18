-- Evaluación individual calificada en el servidor (modo nube). Añade una tabla nueva; no modifica las anteriores.
-- Solo la función del servidor (service_role) accede: el navegador nunca recibe soluciones ni intentos ajenos.
begin;
create table if not exists public.sc_web_attempts(
 token_hash text primary key check(token_hash ~ '^[a-f0-9]{64}$'),
 quiz_id text not null,
 revision integer not null,
 student_key text not null,
 name text not null check(char_length(name) between 2 and 80),
 student text not null check(char_length(student) between 3 and 24),
 quiz jsonb not null,
 answers jsonb not null default '[]'::jsonb,
 opened_at bigint,
 opened_for integer,
 learning jsonb not null default '{"hintQuestion":null,"eliminated":null,"practiced":[]}'::jsonb,
 version integer not null default 0,
 created_at timestamptz not null default now(),
 finished_at timestamptz,
 unique(quiz_id,revision,student_key)
);
create index if not exists sc_web_attempts_quiz on public.sc_web_attempts(quiz_id,revision);
alter table public.sc_web_attempts enable row level security;
revoke all on public.sc_web_attempts from anon,authenticated;
grant select,insert,update on public.sc_web_attempts to service_role;
commit;
