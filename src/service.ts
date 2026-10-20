import {createClient} from '@supabase/supabase-js';
import type {Question} from './questions';
import type {QuizSnapshot} from './authoring';
import {rememberEval} from './my-history.mjs';
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
function save(s:Session){localStorage.setItem(key,JSON.stringify(s));return s}
async function rpc(name:string,args:Record<string,unknown>){const {data,error}=await db!.rpc(name,args);if(error)throw new Error(error.message);return data}
// Fuera del modo Supabase heredado, el servidor de la app (local o nube) califica: el navegador nunca recibe soluciones.
async function server(action:string,args:Record<string,unknown>){
 let response:Response;try{response=await fetch('/api/eval/'+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(args)})}catch{throw new Error('No hay conexión con el servidor. Revisa tu internet e inténtalo otra vez.')}
 const data=await response.json().catch(()=>({error:'Respuesta no válida del servidor.'}));if(!response.ok)throw Object.assign(new Error(response.status===401&&action==='recover'?'Esa participación ya no se puede retomar en este navegador. Ingresa de nuevo con el código de evaluación.':data.error||'No se pudo completar la operación.'),{status:response.status});return data;
}
export async function join(name:string,student:string,code:string):Promise<Session>{const s=save(live?await rpc('join_quiz',{p_name:name,p_student:student,p_code:code}):await server('join',{name,student,code}));if(!live)rememberEval(s.token);return s}
export async function recover(s:Session):Promise<Session>{return save(live?await rpc('recover_quiz',{p_token:s.token}):await server('recover',{token:s.token}))}
export async function question(s:Session):Promise<Question>{return live?rpc('get_question',{p_token:s.token}):server('question',{token:s.token})}
export async function submit(s:Session,q:Question,value:number|number[]|string):Promise<{session:Session;explanation:string;correct:boolean}>{
 const data=live?await rpc('submit_answer',{p_token:s.token,p_question:q.id,p_value:value}):await server('submit',{token:s.token,question:q.id,value});save(data.session);return data;
}
export async function advance(s:Session){return s}
export async function results(s:Session):Promise<Result[]>{return live?rpc('get_results',{p_token:s.token}):server('results',{token:s.token})}
export function reset(){localStorage.removeItem(key)}
export type LearningState={hintQuestion:number|null;eliminated:number|null;practiced:number[]};
export async function learning(s:Session):Promise<LearningState>{return live?rpc('learning_state',{p_token:s.token}):server('learning',{token:s.token})}
export async function hint(s:Session,q:Question):Promise<LearningState>{return live?rpc('request_hint',{p_token:s.token,p_question:q.id}):server('hint',{token:s.token,question:q.id})}
export async function practice(s:Session,q:Question,value:number|number[]|string):Promise<{correct:boolean;state:LearningState}>{return live?rpc('practice_answer',{p_token:s.token,p_question:q.id,p_value:value}):server('practice',{token:s.token,question:q.id,value})}
export type HistoryEval={token:string;title:string;course?:string;cycle?:string;name:string;total:number;started:string;status:'open'|'finished';answered?:number;score?:number;correctCount?:number;finished?:string;position?:number;of?:number};
export async function evalHistory(tokens:string[]):Promise<HistoryEval[]>{return tokens.length&&!live?server('history',{tokens}):[]}
export type MemberResult=Result&{student:string;marks:(boolean|null)[];questions?:{id:number;title:string;topic:string;type:string}[]};
export async function memberResults():Promise<MemberResult[]>{const response=await fetch('/api/member/eval-results');const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||'No se pudieron cargar los resultados.');return data.results}
