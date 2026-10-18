-- Para proyectos ya creados: aplicar después de 001 y 002.
begin;
alter table public.questions drop constraint questions_type_check;
alter table public.questions add constraint questions_type_check check(type in ('choice','boolean','blank','order','input'));
update public.questions set type='input',options='[]',solution='"3"'::jsonb,brief='Escribe la salida en la terminal, sin elegir alternativas.' where id=2;
update public.questions set type='input',options='[]',solution='"12.50"'::jsonb,brief='Escribe la salida exacta, incluyendo los ceros finales.' where id=10;
update public.questions set type='order',code=null,options='["print(proyecto[\"material\"])","proyecto[\"material\"] = \"acero\"","proyecto = {\"pisos\": 4}"]'::jsonb,solution='[2,1,0]',brief='Crea el diccionario, agrega el material y muéstralo. Arrastra las líneas.',explanation='Primero crea el diccionario, después asigna el material y finalmente muestra su valor.' where id=7;
create or replace function public.submit_answer(p_token uuid,p_question integer,p_value jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
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


commit;
