import {createClient} from '@supabase/supabase-js';
import {questions, type Question} from './questions';
import {matchesAnswer,quizScore} from './authoring-model.mjs';
import {roomQuiz,type QuizSnapshot} from './authoring';
export type Answer={id:number;value:number|number[]|string;correct:boolean;elapsed:number};
export type Session={token:string;name:string;student:string;answers:Answer[];opened:number;openedFor?:number;quiz?:QuizSnapshot};
export type Result={name:string;score:number;elapsed:number;finished:string;position?:number;quizId?:string;revision?:number;quizTitle?:string;course?:string;cycle?:string;correctCount?:number;total?:number};
const env=(import.meta as unknown as {env:Record<string,string>}).env;
declare const __LIVE__:boolean;
declare const __CLOUD__:boolean;
export const cloud=__CLOUD__;
export const live=__LIVE__;
export const db=live||cloud?createClient(env.VITE_SUPABASE_URL,env.VITE_SUPABASE_ANON_KEY,{auth:{persistSession:!cloud,autoRefreshToken:true}}):null;
const key='sc-session-v2';
export const load=():Session|null=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}};
function save(s:Session){if(!live&&s.quiz){const attempts=JSON.parse(localStorage.getItem('sc-attempts-v3')||'{}');attempts[s.token]=s;localStorage.setItem('sc-attempts-v3',JSON.stringify(attempts))}localStorage.setItem(key,JSON.stringify(s));return s}
async function rpc(name:string,args:Record<string,unknown>){const {data,error}=await db!.rpc(name,args);if(error)throw new Error(error.message);return data}
export async function join(name:string,student:string,code:string):Promise<Session>{
 if(live){const data=await rpc('join_quiz',{p_name:name,p_student:student,p_code:code});return save(data)}
 const quiz=await roomQuiz(code.toUpperCase());
 const old=load();if(old&&!old.quiz&&quiz.id==='python-fundamentos'&&quiz.revision===1&&old.student===student)return old;
 const attempts=Object.values(JSON.parse(localStorage.getItem('sc-attempts-v3')||'{}')) as Session[];
 const previous=attempts.find(s=>s.student===student&&s.quiz?.id===quiz.id&&s.quiz?.revision===quiz.revision);
 return save(previous||{token:crypto.randomUUID(),name,student,answers:[],opened:Date.now(),quiz});
}
export async function recover(s:Session):Promise<Session>{return live?save(await rpc('recover_quiz',{p_token:s.token})):s}
export async function question(s:Session):Promise<Question>{if(live)return rpc('get_question',{p_token:s.token});if(s.openedFor!==s.answers.length+1){s.opened=Date.now();s.openedFor=s.answers.length+1;save(s)}return (s.quiz?.questions??questions)[s.answers.length]}
export async function submit(s:Session,q:Question,value:number|number[]|string):Promise<{session:Session;explanation:string;correct:boolean}>{
 if(live){const data=await rpc('submit_answer',{p_token:s.token,p_question:q.id,p_value:value});save(data.session);return data}
 const latest=load();if(latest?.token===s.token&&latest.answers.length!==s.answers.length)throw new Error('Esta participación cambió en otra pestaña. Recarga para retomarla.');
 if(s.quiz){const stored=s.quiz.questions[s.answers.length];if(!stored||stored.id!==q.id)throw new Error('Esta pregunta ya fue respondida o está fuera de secuencia.');const correct=matchesAnswer(stored,value);const next={...s,answers:[...s.answers,{id:q.id,value,correct,elapsed:Math.max(0,Date.now()-s.opened)}]};save(next);return {session:next,correct,explanation:stored.explanation}}
 const engine=await import('./engine.mjs');const next=engine.recordAnswer(s,q.id,value,Math.max(0,Date.now()-s.opened));save(next);return {session:next,explanation:engine.explanations[q.id-1],correct:engine.isCorrect(q.id,value)};
}
export async function advance(s:Session){return save({...s,opened:Date.now(),openedFor:s.answers.length+1})}
export async function results(s:Session):Promise<Result[]>{
 if(live)return rpc('get_results',{p_token:s.token});
 const {grade,ranking}=await import('./engine.mjs');const all: (Result & {token:string})[]=JSON.parse(localStorage.getItem('sc-results-v2')||'[]');
 if(s.answers.length===(s.quiz?.questions.length??10)&&!all.some(r=>r.token===s.token)){all.push({token:s.token,name:s.name,score:s.quiz?quizScore(s.quiz,s.answers):grade(s.answers),elapsed:s.answers.reduce((a,b)=>a+b.elapsed,0),finished:new Date().toISOString(),quizId:s.quiz?.id,revision:s.quiz?.revision,quizTitle:s.quiz?.title,course:s.quiz?.course,cycle:s.quiz?.cycle,correctCount:s.answers.filter(a=>a.correct).length,total:s.quiz?.questions.length??10});localStorage.setItem('sc-results-v2',JSON.stringify(all))}
 return ranking(all.filter(r=>s.quiz?(r.quizId===s.quiz.id&&r.revision===s.quiz.revision||!r.quizId&&s.quiz.id==='python-fundamentos'&&s.quiz.revision===1):!r.quizId));
}
export function reset(){const current=load();if(!live&&current?.quiz){const attempts=JSON.parse(localStorage.getItem('sc-attempts-v3')||'{}');delete attempts[current.token];localStorage.setItem('sc-attempts-v3',JSON.stringify(attempts))}localStorage.removeItem(key)}
export type LearningState={hintQuestion:number|null;eliminated:number|null;practiced:number[]};
const learningKey=(s:Session)=>'sc-learning-'+s.token;
export async function learning(s:Session):Promise<LearningState>{if(live)return rpc('learning_state',{p_token:s.token});return JSON.parse(localStorage.getItem(learningKey(s))||'{"hintQuestion":null,"eliminated":null,"practiced":[]}')}
export async function hint(s:Session,q:Question):Promise<LearningState>{if(live)return rpc('request_hint',{p_token:s.token,p_question:q.id});if(s.quiz&&!s.quiz.hints)throw new Error('Este cuestionario no tiene ayudas activadas.');const state=await learning(s);if(state.hintQuestion!==null)throw new Error('Ya utilizaste la ayuda de este recorrido.');if(q.type!=='choice'||s.answers.some(a=>a.id===q.id))throw new Error('La ayuda está disponible antes de responder una pregunta de opción múltiple.');const stored=s.quiz?.questions.find(item=>item.id===q.id);const engine=stored?null:await import('./engine.mjs');const excluded=q.options.findIndex((_,i)=>stored?!matchesAnswer(stored,i):!engine!.isCorrect(q.id,i));const next={...state,hintQuestion:q.id,eliminated:excluded};localStorage.setItem(learningKey(s),JSON.stringify(next));return next}
export async function practice(s:Session,q:Question,value:number|number[]|string):Promise<{correct:boolean;state:LearningState}>{if(live)return rpc('practice_answer',{p_token:s.token,p_question:q.id,p_value:value});if(s.quiz&&!s.quiz.practice)throw new Error('Este cuestionario no tiene práctica activada.');if(!s.answers.some(a=>a.id===q.id&&!a.correct))throw new Error('La práctica se abre después de una respuesta incorrecta.');const stored=s.quiz?.questions.find(item=>item.id===q.id);const engine=stored?null:await import('./engine.mjs');const correct=stored?matchesAnswer(stored,value):engine!.isCorrect(q.id,value);const state=await learning(s);if(correct&&!state.practiced.includes(q.id)){state.practiced.push(q.id);localStorage.setItem(learningKey(s),JSON.stringify(state))}return {correct,state}}
