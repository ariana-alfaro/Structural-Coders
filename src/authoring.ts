import {questions,type Question} from './questions';

import {preparePublication,validateQuiz} from './authoring-model.mjs';

import {normalizeGame,type GameSettings} from './practice-model.mjs';

export type AuthoredQuestion=Question&{solution:number|number[]|string;explanation:string;points:number};

export type QuizDraft={id:string;title:string;description:string;course:string;cycle:string;code:string;hints:boolean;practice:boolean;game?:GameSettings;opensAt?:string;closesAt?:string;questions:AuthoredQuestion[];updatedAt:string;owner?:string;visibility?:'private'|'group'};

export type QuizSnapshot=QuizDraft&{revision:number;publishedAt:string};

export type Catalog={drafts:QuizDraft[];publications:QuizSnapshot[];archivedQuizIds?:string[];deletedQuizIds?:string[];memberUsername?:string};

declare const __LIVE__:boolean;

const catalogKey='sc-authoring-v1';

let serverRevision=0;

export async function catalog():Promise<Catalog>{

 await pendingSave.catch(()=>{});

 const response=await fetch('/api/member/catalog');const data=await response.json();if(!response.ok)throw new Error(data.error||'No se pudo cargar la biblioteca.');serverRevision=data.serverRevision||0;

 if(!localStorage.getItem('sc-server-migrated-v1')){

  const old=localStorage.getItem(catalogKey);if(old){try{const prior=JSON.parse(old) as Catalog;const extras=prior.drafts.filter(q=>!(data.deletedQuizIds??[]).includes(q.id)&&!data.drafts.some((d:QuizDraft)=>d.id===q.id||d.code===q.code));if(extras.length){data.drafts.push(...extras);data.publications.push(...prior.publications.filter(q=>extras.some(d=>d.id===q.id)));await persistCatalog(data)}}catch(error){throw new Error('No se pudieron migrar los cuestionarios anteriores. Exporta su respaldo antes de continuar.')}}

  localStorage.setItem('sc-server-migrated-v1','1');

 }

 return data;

}

let pendingSave=Promise.resolve();

export function persistCatalog(data:Catalog){

 localStorage.setItem(catalogKey,JSON.stringify(data));

 window.dispatchEvent(new CustomEvent('sc-save',{detail:{pending:true}}));

 pendingSave=pendingSave.catch(()=>{}).then(async()=>{const response=await fetch('/api/member/catalog',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,serverRevision})});const result=await response.json();if(!response.ok)throw new Error(result.error||'No se pudo guardar.');serverRevision=result.serverRevision??serverRevision;});

 pendingSave.then(()=>window.dispatchEvent(new CustomEvent('sc-save',{detail:{ok:true}}))).catch(error=>window.dispatchEvent(new CustomEvent('sc-save',{detail:{ok:false,message:error.message}})));

 return pendingSave;

}

export function flushCatalog(){return pendingSave}

export function latest(data:Catalog,id:string){return data.publications.filter(p=>p.id===id).sort((a,b)=>b.revision-a.revision)[0]}

export function publish(data:Catalog,id:string):Catalog{const draft=data.drafts.find(q=>q.id===id)!;if(data.publications.some(q=>q.id!==id&&q.code===draft.code))throw new Error('Ese código ya pertenece a otro cuestionario.');const snapshot=preparePublication(draft,(latest(data,id)?.revision||0)+1);return {...data,publications:[...data.publications,snapshot]}}

export function freshQuiz(data:Catalog):QuizDraft{const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let code='';do{code=Array.from(crypto.getRandomValues(new Uint8Array(6)),n=>chars[n%chars.length]).join('')}while(data.drafts.some(d=>d.code===code)||data.publications.some(d=>d.code===code));return {id:crypto.randomUUID(),owner:data.memberUsername,visibility:'private',title:'Nuevo cuestionario',description:'',course:'Structural Coders',cycle:'2026-1',code,hints:true,practice:true,questions:[],updatedAt:new Date().toISOString()}}

export function freshQuestion(type:Question['type'],id:number):AuthoredQuestion{return {id,type,title:'',topic:'',brief:'',code:type==='blank'?'resultado = ___':'',options:type==='input'?[]:type==='boolean'?['Verdadero','Falso']:type==='order'?['Línea 1','Línea 2','Línea 3']:['','','',''],solution:type==='input'?'':type==='order'?[0,1,2]:0,explanation:'',points:2}}

export async function roomQuiz(code:string):Promise<QuizSnapshot>{

 await pendingSave.catch(()=>{});

 const response=await fetch('/api/practice?code='+encodeURIComponent(code));const data=await response.json();if(!response.ok)throw new Error(data.error||'Práctica no disponible.');return data;

}

export function importBackup(raw:string,data:Catalog):Catalog{const input=JSON.parse(raw);if(input?.format!=='structural-coders-quiz'||input.version!==1||!Array.isArray(input.quizzes)||input.quizzes.length>100)throw new Error('El archivo no es un respaldo compatible.');const drafts=input.quizzes.map((item:unknown)=>{if(!item||typeof item!=='object')throw new Error('Cuestionario no válido.');const q=item as QuizDraft;if(!['title','description','course','cycle','code'].every(k=>typeof(q as unknown as Record<string,unknown>)[k]==='string')||!Array.isArray(q.questions)||q.questions.length>100)throw new Error('El archivo contiene campos no válidos.');const quiz={...freshQuiz(data),title:q.title,description:q.description,course:q.course,cycle:q.cycle,hints:q.hints===true,practice:q.practice===true,game:normalizeGame(q.game),questions:q.questions.map((question,i)=>{if(!question||!['choice','input','blank','order','boolean'].includes(question.type)||!['title','topic','brief','explanation'].every(k=>typeof(question as unknown as Record<string,unknown>)[k]==='string')||question.code!=null&&typeof question.code!=='string'||!Array.isArray(question.options)||!question.options.every(x=>typeof x==='string'))throw new Error('Pregunta no válida en el respaldo.');return {...question,id:i+1}})};if(quiz.questions.some(item=>!Number.isFinite(item.points)||item.options.length>5||!(typeof item.solution==='string'||typeof item.solution==='number'||Array.isArray(item.solution)&&item.solution.every(n=>Number.isInteger(n)))))throw new Error('Ponderación o solución no válida en el respaldo.');return quiz});return {...data,drafts:[...data.drafts,...drafts]}}

