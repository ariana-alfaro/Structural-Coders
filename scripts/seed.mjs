import {readFileSync,writeFileSync} from 'node:fs';
import vm from 'node:vm';
import {solutions,explanations} from '../src/engine.mjs';
const source=readFileSync(new URL('../src/questions.ts',import.meta.url),'utf8');
const questions=vm.runInNewContext(source.slice(source.indexOf('export const questions')).replace('export const questions:Question[] =','const questions =')+';questions');
const sql=value=>value==null?'NULL':"'"+String(value).replaceAll("'","''")+"'";
const course='ad8d7ce8-67b7-465a-9f37-9d9e3e049715',cycle='acee0550-d874-4f9b-8791-5cce03320cb9',quiz='318b5ea4-5b74-4f95-b1ee-47ab95f3f353';
let out=`begin;\ninsert into public.courses(id,name) values('${course}','Structural Coders');\ninsert into public.academic_cycles(id,name) values('${cycle}','2026-1');\ninsert into public.quizzes(id,course_id,cycle_id,title) values('${quiz}','${course}','${cycle}','Cuestionario N.º 1 — Fundamentos de Python');\n`;
for(const q of questions){out+=`insert into public.questions(id,quiz_id,title,topic,type,brief,code,options,solution,explanation) values(${q.id},'${quiz}',${sql(q.title)},${sql(q.topic)},${sql(q.type)},${sql(q.brief)},${sql(q.code)},${sql(JSON.stringify(q.options))}::jsonb,${sql(JSON.stringify(solutions[q.id-1]))}::jsonb,${sql(explanations[q.id-1])});\n`}
out+=`insert into public.quiz_sessions(quiz_id,code) values('${quiz}',upper(substr(replace(gen_random_uuid()::text,'-',''),1,6)));\ncommit;\n-- Consultar el código generado: select code from public.quiz_sessions;\n`;
writeFileSync(new URL('../supabase/migrations/002_demo.sql',import.meta.url),out);
console.log('Migración de las diez preguntas generada.');
