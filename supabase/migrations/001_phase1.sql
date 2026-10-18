begin;
create table public.courses(id uuid primary key default gen_random_uuid(),name text not null);
create table public.academic_cycles(id uuid primary key default gen_random_uuid(),name text not null unique);
create table public.quizzes(id uuid primary key default gen_random_uuid(),course_id uuid references public.courses,cycle_id uuid references public.academic_cycles,title text not null);
create table public.students(id uuid primary key default gen_random_uuid(),student_code text not null unique,name text not null);
create table public.questions(id integer primary key,quiz_id uuid not null references public.quizzes,title text not null,topic text not null,type text not null check(type in ('choice','boolean','blank','order','input')),brief text not null,code text,options jsonb not null,solution jsonb not null,explanation text not null,points integer not null default 2 check(points=2));
create table public.quiz_sessions(id uuid primary key default gen_random_uuid(),quiz_id uuid not null references public.quizzes,code text not null unique,active boolean not null default true);
create table public.participants(id uuid primary key default gen_random_uuid(),session_id uuid not null references public.quiz_sessions,student_id uuid not null references public.students,token uuid not null unique default gen_random_uuid(),name text not null,opened_at timestamptz,current_question integer,created_at timestamptz not null default clock_timestamp(),unique(session_id,student_id));
create table public.answers(id uuid primary key default gen_random_uuid(),participant_id uuid not null references public.participants,question_id integer not null references public.questions,value jsonb not null,correct boolean not null,elapsed bigint not null check(elapsed>=0),created_at timestamptz not null default clock_timestamp(),unique(participant_id,question_id));
create table public.results(participant_id uuid primary key references public.participants,score integer not null check(score between 0 and 20),elapsed bigint not null,finished timestamptz not null default clock_timestamp());
create index on public.answers(participant_id);
create index on public.results(score desc,elapsed,finished);
create index on public.participants(session_id);
alter table public.courses enable row level security;
alter table public.academic_cycles enable row level security;
alter table public.quizzes enable row level security;
alter table public.students enable row level security;
alter table public.questions enable row level security;
alter table public.quiz_sessions enable row level security;
alter table public.participants enable row level security;
alter table public.answers enable row level security;
alter table public.results enable row level security;
revoke all on public.courses,public.academic_cycles,public.quizzes,public.students,public.questions,public.quiz_sessions,public.participants,public.answers,public.results from anon,authenticated;

-- No public RPC accepts a score, a correct-answer flag or a client timestamp.
create function public.recover_quiz(p_token uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare p participants; s students; payload jsonb;
begin
 select * into p from participants where token=p_token;
 if not found then raise exception 'Participación no válida.'; end if;
 select * into s from students where id=p.student_id;
 select coalesce(jsonb_agg(jsonb_build_object('id',a.question_id,'value',a.value,'correct',a.correct,'elapsed',a.elapsed) order by a.question_id),'[]'::jsonb) into payload from answers a where a.participant_id=p.id;
 return jsonb_build_object('token',p.token,'name',p.name,'student',s.student_code,'answers',payload,'opened',extract(epoch from coalesce(p.opened_at,clock_timestamp()))*1000);
end $$;

create function public.join_quiz(p_name text,p_student text,p_code text) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare sid uuid; stid uuid; tok uuid;
begin
 if length(trim(p_name)) not between 2 and 80 or length(trim(p_student)) not between 3 and 24 then raise exception 'Revisa tu nombre y código universitario.';end if;
 select id into sid from quiz_sessions where code=upper(trim(p_code)) and active;
 if sid is null then raise exception 'Sala no disponible.';end if;
 insert into students(student_code,name) values(trim(p_student),trim(p_name)) on conflict(student_code) do nothing;
 select id into stid from students where student_code=trim(p_student);
 if exists(select 1 from participants where session_id=sid and student_id=stid) then raise exception 'Ya existe una participación. Retómala desde el navegador original o contacta al docente.';end if;
 insert into participants(session_id,student_id,name) values(sid,stid,trim(p_name)) returning token into tok;
 return recover_quiz(tok);
exception when unique_violation then raise exception 'Ya existe una participación para este estudiante.';
end $$;

create function public.get_question(p_token uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare p participants; q questions; n integer;
begin
 select * into p from participants where token=p_token for update;
 if not found then raise exception 'Participación no válida.';end if;
 if not exists(select 1 from quiz_sessions where id=p.session_id and active) then raise exception 'La evaluación está cerrada.';end if;
 select count(*)+1 into n from answers where participant_id=p.id;
 select q1.* into q from questions q1 join quiz_sessions s on s.quiz_id=q1.quiz_id where s.id=p.session_id and q1.id=n;
 if not found then raise exception 'Evaluación completada.';end if;
 if p.current_question is distinct from q.id then update participants set current_question=q.id,opened_at=clock_timestamp() where id=p.id;end if;
 return jsonb_build_object('id',q.id,'title',q.title,'topic',q.topic,'type',q.type,'brief',q.brief,'code',q.code,'options',q.options);
end $$;

create function public.submit_answer(p_token uuid,p_question integer,p_value jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare p participants;q questions;a answers;ok boolean;v jsonb;
begin
 select * into p from participants where token=p_token for update;
 if not found then raise exception 'Participación no válida.';end if;
 select * into a from answers where participant_id=p.id and question_id=p_question;
 if found then
   if a.value<>p_value then raise exception 'La respuesta cerrada no puede modificarse.';end if;
   select * into q from questions where id=p_question;
   return jsonb_build_object('session',recover_quiz(p_token),'correct',a.correct,'explanation',q.explanation);
 end if;
 if not exists(select 1 from quiz_sessions where id=p.session_id and active) then raise exception 'La evaluación está cerrada.';end if;
 if p.current_question is distinct from p_question or p.opened_at is null then raise exception 'Pregunta no abierta.';end if;
 select q1.* into q from questions q1 join quiz_sessions s on s.quiz_id=q1.quiz_id where s.id=p.session_id and q1.id=p_question;
 if not found then raise exception 'Pregunta no válida.';end if;
 if q.type='order' then
   if jsonb_typeof(p_value)<>'array' then raise exception 'Orden no válido.';end if;
   select jsonb_agg(x order by x) into v from jsonb_array_elements(p_value) x;
   if v<>'[0,1,2]'::jsonb then raise exception 'Orden no válido.';end if;
 elsif q.type='input' then
   if jsonb_typeof(p_value)<>'string' or length(btrim(p_value #>> '{}')) not between 1 and 80 then raise exception 'Escribe una salida de entre 1 y 80 caracteres.';end if;
   p_value=to_jsonb(btrim(p_value #>> '{}'));
 else
   if not exists(select 1 from generate_series(0,jsonb_array_length(q.options)-1) i where to_jsonb(i)=p_value) then raise exception 'Opción no válida.';end if;
 end if;
 ok=p_value=q.solution;
 insert into answers(participant_id,question_id,value,correct,elapsed) values(p.id,q.id,p_value,ok,greatest(0,floor(extract(epoch from(clock_timestamp()-p.opened_at))*1000)::bigint));
 if (select count(*) from answers where participant_id=p.id)=10 then
 insert into results(participant_id,score,elapsed) select p.id,sum(case when correct then 2 else 0 end),sum(elapsed) from answers where participant_id=p.id;
 end if;
 return jsonb_build_object('session',recover_quiz(p_token),'correct',ok,'explanation',q.explanation);
end $$;

create function public.get_results(p_token uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare p participants;payload jsonb;
begin
 select * into p from participants where token=p_token;
 if not found then raise exception 'Participación no válida.';end if;
 -- Return only the caller's private result and position. Never disclose classmates' grades.
 with ranked as(select r.*,row_number() over(order by r.score desc,r.elapsed,r.finished,r.participant_id) as position from results r join participants x on x.id=r.participant_id where x.session_id=p.session_id)
 select jsonb_build_array(jsonb_build_object('name',p.name,'score',r.score,'elapsed',r.elapsed,'finished',r.finished,'position',r.position)) into payload from ranked r where r.participant_id=p.id;
 return coalesce(payload,'[]'::jsonb);
end $$;
revoke all on function public.join_quiz(text,text,text),public.recover_quiz(uuid),public.get_question(uuid),public.submit_answer(uuid,integer,jsonb),public.get_results(uuid) from public;
grant execute on function public.join_quiz(text,text,text),public.recover_quiz(uuid),public.get_question(uuid),public.submit_answer(uuid,integer,jsonb),public.get_results(uuid) to anon,authenticated;
commit;
