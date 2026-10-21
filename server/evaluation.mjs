// Evaluación individual calificada en el servidor. El navegador recibe preguntas sin soluciones;
// el servidor mide el tiempo, califica y guarda cada intento. El almacenamiento llega como adaptador (Supabase o archivo local).
import {createHash,randomBytes} from 'node:crypto';
import {matchesAnswer,quizScore} from '../src/authoring-model.mjs';
import {publicQuestion,validValue} from '../src/live-model.mjs';
import {canEditQuiz,sharedQuiz} from './workspace-model.mjs';

const hash=value=>createHash('sha256').update(value).digest('hex');
const fail=(status,message)=>{throw Object.assign(new Error(message),{status})};
const text=(v,min,max)=>typeof v==='string'&&v.trim().length>=min&&v.trim().length<=max;
export const studentKey=s=>s.trim().toLowerCase().replace(/\s+/g,'');
const emptyLearning={hintQuestion:null,eliminated:null,practiced:[]};

export function publicQuiz(quiz){const {owner,visibility,...rest}=quiz;return {...rest,questions:quiz.questions.map(publicQuestion)}}

// Última versión habilitada con ese código. Las prácticas tipo juego entregan sus soluciones al navegador,
// así que un cuestionario con práctica activada no se puede usar para evaluar.
// Fechas de apertura y cierre: se leen del borrador, así un cambio rige de inmediato sin publicar otra versión.
const when=iso=>new Date(iso).toLocaleString('es-PE',{timeZone:'America/Lima',dateStyle:'long',timeStyle:'short'});
export function availability(draft,now=Date.now()){if(draft.opensAt&&now<Date.parse(draft.opensAt))return `La evaluación abre el ${when(draft.opensAt)}`;if(draft.closesAt&&now>=Date.parse(draft.closesAt))return `La evaluación cerró el ${when(draft.closesAt)}`;return null}
export function evaluationQuiz(data,code,username,now=Date.now()){
 const wanted=String(code??'').trim().toUpperCase();
 const quiz=data.publications.filter(q=>q.code===wanted).sort((a,b)=>a.revision-b.revision).at(-1);
 const draft=data.drafts.find(q=>q.id===quiz?.id);
 if(!quiz||!draft||(data.archivedQuizIds??[]).includes(quiz.id)||(data.deletedQuizIds??[]).includes(quiz.id)||(!sharedQuiz(draft)&&draft.owner!==username))fail(404,'No hay una evaluación habilitada con ese código.');
 if(quiz.game?.enabled)fail(409,'Este código corresponde a una práctica tipo juego, que no registra nota. Pide el código de la evaluación.');
 const window=availability(draft,now);if(window)fail(403,window);
 return quiz;
}

export function sessionOf(row,token){return {token,name:row.name,student:row.student,answers:row.answers,opened:row.opened_at??Date.now(),openedFor:row.opened_for??undefined,quiz:publicQuiz(row.quiz)}}

export function finishedResult(row){
 const correctCount=row.answers.filter(a=>a.correct).length;
 return {name:row.name,student:row.student,score:quizScore(row.quiz,row.answers),elapsed:row.answers.reduce((s,a)=>s+a.elapsed,0),finished:row.finished_at,quizId:row.quiz_id,revision:row.revision,quizTitle:row.quiz.title,course:row.quiz.course,cycle:row.quiz.cycle,correctCount,total:row.quiz.questions.length,marks:row.quiz.questions.map(q=>{const a=row.answers.find(x=>x.id===q.id);return a?a.correct:null}),questions:row.quiz.questions.map(q=>({id:q.id,title:q.title,topic:q.topic,type:q.type}))};
}
export const rankResults=rows=>[...rows].sort((a,b)=>b.score-a.score||a.elapsed-b.elapsed||a.finished.localeCompare(b.finished));

/** store: loadCatalog, getAttempt(tokenHash), findAttempt(quizId,revision,studentKey), insertAttempt(row)->bool,
 *  updateAttempt(tokenHash,version,patch)->bool, finishedAttempts(quizId,revision), attemptsFor(quizIds), limit(key,max)->bool */
export function createEvaluation(store,{now=()=>Date.now()}={}){
 async function attempt(token){
  if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))fail(401,'La participación no es válida. Vuelve a ingresar con tu código.');
  const row=await store.getAttempt(hash(token));if(!row)fail(401,'La participación no es válida. Vuelve a ingresar con tu código.');return row;
 }
 async function save(row,patch){if(!await store.updateAttempt(row.token_hash,row.version,{...patch,version:row.version+1}))fail(409,'La participación cambió en otra pestaña. Recarga para retomarla.');return {...row,...patch,version:row.version+1}}
 const current=row=>row.quiz.questions[row.answers.length];
 const questionFor=(row,id)=>{const q=row.quiz.questions.find(item=>item.id===id);if(!q)fail(400,'Pregunta no válida.');return q};
 return {
  async join({name,student,code},{ip='desconocida',username}={}){
   if(!text(name,2,80)||!text(student,3,24))fail(400,'Revisa tu nombre (2 a 80 caracteres) y tu código universitario (3 a 24).');
   if(!await store.limit(hash('eval|'+ip),30))fail(429,'Demasiados intentos. Espera quince minutos.');
   const quiz=evaluationQuiz(await store.loadCatalog(),code,username,now()),key=studentKey(student);
   if(await store.findAttempt(quiz.id,quiz.revision,key))fail(409,'Ya existe una participación con ese código universitario. Retómala desde el navegador donde empezaste o pide ayuda al miembro GADEST.');
   const token=randomBytes(32).toString('hex');
   const row={token_hash:hash(token),quiz_id:quiz.id,revision:quiz.revision,student_key:key,name:name.trim(),student:student.trim(),quiz,answers:[],opened_at:null,opened_for:null,learning:emptyLearning,version:0,created_at:new Date(now()).toISOString(),finished_at:null};
   if(!await store.insertAttempt(row))fail(409,'Ya existe una participación con ese código universitario. Retómala desde el navegador donde empezaste o pide ayuda al miembro GADEST.');
   return sessionOf(row,token);
  },
  async recover({token}){return sessionOf(await attempt(token),token)},
  async question({token}){
   let row=await attempt(token);const q=current(row);if(!q)fail(409,'Ya respondiste todas las preguntas.');
   if(row.opened_for!==row.answers.length+1)row=await save(row,{opened_at:now(),opened_for:row.answers.length+1});
   return publicQuestion(q);
  },
  async submit({token,question,value}){
   let row=await attempt(token);
   const prior=row.answers.find(a=>a.id===question);
   if(prior){if(JSON.stringify(prior.value)!==JSON.stringify(typeof value==='string'?value.trim():value))fail(409,'Esta respuesta ya está registrada.');return {session:sessionOf(row,token),correct:prior.correct,explanation:questionFor(row,question).explanation}}
   const q=current(row);if(!q||q.id!==question||row.opened_for!==row.answers.length+1)fail(409,'Pregunta fuera de secuencia. Recarga para continuar.');
   if(!validValue(q,value))fail(400,'Respuesta no válida.');
   const stored=typeof value==='string'?value.trim():value,correct=matchesAnswer(q,stored);
   const answers=[...row.answers,{id:q.id,value:stored,correct,elapsed:Math.max(0,now()-row.opened_at)}];
   row=await save(row,{answers,finished_at:answers.length===row.quiz.questions.length?new Date(now()).toISOString():null});
   return {session:sessionOf(row,token),correct,explanation:q.explanation};
  },
  // Solo la nota y la posición propias: los nombres de otros aspirantes no salen del servidor.
  async results({token}){
   const row=await attempt(token);if(!row.finished_at)fail(409,'Termina el cuestionario para ver tu resultado.');
   const ranked=rankResults((await store.finishedAttempts(row.quiz_id,row.revision)).map(finishedResult)),mine=finishedResult(row);
   const position=ranked.findIndex(r=>r.student===mine.student&&r.finished===mine.finished)+1||ranked.length+1;
   return [{name:mine.name,score:mine.score,elapsed:mine.elapsed,finished:mine.finished,position,correctCount:mine.correctCount,total:mine.total}];
  },
  async learning({token}){return (await attempt(token)).learning??emptyLearning},
  async hint({token,question}){
   let row=await attempt(token);const state=row.learning??emptyLearning,q=current(row);
   if(!row.quiz.hints)fail(403,'Este cuestionario no tiene ayudas activadas.');
   if(state.hintQuestion!==null)fail(409,'Ya utilizaste la ayuda de este recorrido.');
   if(!q||q.id!==question||q.type!=='choice')fail(409,'La ayuda está disponible antes de responder una pregunta de opción múltiple.');
   const next={...state,hintQuestion:q.id,eliminated:q.options.findIndex((_,i)=>!matchesAnswer(q,i))};
   row=await save(row,{learning:next});return next;
  },
  async practice({token,question,value}){
   let row=await attempt(token);const state=row.learning??emptyLearning;
   if(!row.quiz.practice)fail(403,'Este cuestionario no tiene práctica activada.');
   if(!row.answers.some(a=>a.id===question&&!a.correct))fail(409,'La práctica se abre después de una respuesta incorrecta.');
   const q=questionFor(row,question);if(!validValue(q,value))fail(400,'Respuesta no válida.');
   const correct=matchesAnswer(q,typeof value==='string'?value.trim():value);
   if(!correct||state.practiced.includes(q.id))return {correct,state};
   const next={...state,practiced:[...state.practiced,q.id]};row=await save(row,{learning:next});return {correct,state:next};
  },
  // Resultados para miembros: solo de cuestionarios que pueden ver en su biblioteca.
  async memberResults(username){
   const data=await store.loadCatalog();
   const ids=data.drafts.filter(q=>canEditQuiz(q,username)||sharedQuiz(q)).map(q=>q.id);
   return rankResults((await store.attemptsFor(ids)).filter(r=>r.finished_at).map(finishedResult));
  },
 };
}

const routes={join:'join',recover:'recover',question:'question',submit:'submit',results:'results',learning:'learning',hint:'hint',practice:'practice'};
// Devuelve la acción para /api/eval/<acción> con POST, o null si la ruta no es de evaluación.
export function evaluationRoute(pathname,method){const m=/^\/api\/eval\/([a-z]+)$/.exec(pathname);return m&&method==='POST'&&routes[m[1]]?routes[m[1]]:null}
