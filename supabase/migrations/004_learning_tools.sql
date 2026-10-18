begin;
create table public.learning_support(participant_id uuid primary key references public.participants,hint_question integer references public.questions,eliminated integer,practiced integer[] not null default '{}');
alter table public.learning_support enable row level security;
revoke all on public.learning_support from anon,authenticated;
create function public.learning_state(p_token uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare pid uuid;st learning_support;
begin
 select id into pid from participants where token=p_token;
 if pid is null then raise exception 'Participación no válida.';end if;
 select * into st from learning_support where participant_id=pid;
 return jsonb_build_object('hintQuestion',st.hint_question,'eliminated',st.eliminated,'practiced',coalesce(to_jsonb(st.practiced),'[]'::jsonb));
end $$;
create function public.request_hint(p_token uuid,p_question integer) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare p participants;q questions;removed integer;st learning_support;
begin
 select * into p from participants where token=p_token for update;
 if not found then raise exception 'Participación no válida.';end if;
 if not exists(select 1 from quiz_sessions where id=p.session_id and active) then raise exception 'La evaluación está cerrada.';end if;
 select * into st from learning_support where participant_id=p.id;
 if st.hint_question is not null then raise exception 'Ya utilizaste la ayuda de este recorrido.';end if;
 if p.current_question is distinct from p_question or exists(select 1 from answers where participant_id=p.id and question_id=p_question) then raise exception 'La ayuda se usa antes de responder la pregunta abierta.';end if;
 select q1.* into q from questions q1 join quiz_sessions s on s.quiz_id=q1.quiz_id where s.id=p.session_id and q1.id=p_question and q1.type='choice';
 if not found then raise exception 'La ayuda está disponible en opción múltiple.';end if;
 select i into removed from generate_series(0,jsonb_array_length(q.options)-1) i where to_jsonb(i)<>q.solution order by i limit 1;
 insert into learning_support(participant_id,hint_question,eliminated) values(p.id,q.id,removed) on conflict(participant_id) do update set hint_question=excluded.hint_question,eliminated=excluded.eliminated;
 return learning_state(p_token);
end $$;
create function public.practice_answer(p_token uuid,p_question integer,p_value jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare p participants;q questions;ok boolean;
begin
 select * into p from participants where token=p_token for update;
 if not found then raise exception 'Participación no válida.';end if;
 if not exists(select 1 from answers where participant_id=p.id and question_id=p_question and not correct) then raise exception 'La práctica se abre después de una respuesta incorrecta.';end if;
 select * into q from questions where id=p_question;
 if q.type='input' and jsonb_typeof(p_value)='string' then p_value=to_jsonb(btrim(p_value #>> '{}'));end if;
 ok=coalesce(p_value=q.solution,false);
 if ok then
 insert into learning_support(participant_id,practiced) values(p.id,array[p_question]) on conflict(participant_id) do update set practiced=case when p_question=any(learning_support.practiced) then learning_support.practiced else array_append(learning_support.practiced,p_question) end;
 end if;
 -- Practice never updates answers, elapsed response time, results, or ranking.
 return jsonb_build_object('correct',ok,'state',learning_state(p_token));
end $$;
revoke all on function public.learning_state(uuid),public.request_hint(uuid,integer),public.practice_answer(uuid,integer,jsonb) from public;
grant execute on function public.learning_state(uuid),public.request_hint(uuid,integer),public.practice_answer(uuid,integer,jsonb) to anon,authenticated;
commit;
