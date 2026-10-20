import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createEvaluation,availability,evaluationQuiz} from '../server/evaluation.mjs';
import {fileAttemptStore} from '../server/local-attempts.mjs';
import {preparePublication,validateQuiz} from '../src/authoring-model.mjs';
import {questionStats} from '../src/question-stats.mjs';
import {readHistory,rememberEval,rememberLive,rememberPractice,clearHistory} from '../src/my-history.mjs';

const base={topic:'Python',brief:'¿Qué imprime?',code:'print(1)',explanation:'Porque sí.',points:2};
const draft={id:'eval-1',title:'Evaluación',description:'',course:'SC',cycle:'2026-1',code:'EVAL01',hints:true,practice:true,questions:[
 {...base,id:1,title:'Uno',type:'choice',options:['a','b','c','d'],solution:2},
 {...base,id:2,title:'Dos',type:'input',options:[],solution:'12.50'}]};
const catalog=d=>({drafts:[d],publications:[preparePublication(draft,1)]});
const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}};

test('Las fechas de apertura y cierre del borrador controlan el ingreso, sin publicar otra versión',()=>{
 const t=Date.parse('2026-10-20T15:00:00Z');
 assert.equal(availability({},t),null);
 assert.match(availability({opensAt:'2026-10-21T13:00:00Z'},t),/abre el/);
 assert.match(availability({closesAt:'2026-10-20T14:00:00Z'},t),/cerró el/);
 assert.equal(availability({opensAt:'2026-10-20T14:00:00Z',closesAt:'2026-10-20T16:00:00Z'},t),null);
 assert.throws(()=>evaluationQuiz(catalog({...draft,closesAt:'2026-10-20T14:00:00Z'}),'EVAL01',undefined,t),/cerró/);
 assert.equal(evaluationQuiz(catalog({...draft,closesAt:'2026-10-20T16:00:00Z'}),'EVAL01',undefined,t).id,'eval-1');
 assert.ok(validateQuiz({...draft,opensAt:'2026-10-21T00:00:00Z',closesAt:'2026-10-20T00:00:00Z'}).some(x=>x.includes('cierre')));
});
test('El historial del servidor solo responde por los tokens del propio dispositivo',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'sc-hist-'));const clock={t:1_000_000};
 const ev=createEvaluation(fileAttemptStore(path.join(dir,'a.json'),async()=>catalog(draft)),{now:()=>clock.t});
 try{
  const a=await ev.join({name:'Ana Torres',student:'2026001',code:'EVAL01'}),b=await ev.join({name:'Luis Rojas',student:'2026002',code:'EVAL01'});
  for(const s of [a,b]){await ev.question({token:s.token});await ev.submit({token:s.token,question:1,value:2});}
  await ev.question({token:a.token});await ev.submit({token:a.token,question:2,value:'12.50'});
  const h=await ev.history({tokens:[a.token,b.token,'x','0'.repeat(64)]});
  assert.equal(h.length,2);
  const mine=h.find(x=>x.token===a.token),open=h.find(x=>x.token===b.token);
  assert.deepEqual([mine.status,mine.score,mine.position,mine.of],['finished',20,1,1]);
  assert.deepEqual([open.status,open.answered,open.total],['open',1,2]);
  assert.ok(!JSON.stringify(h).includes('solution'));
  await assert.rejects(ev.history({tokens:'no'}),/no válido/);
 }finally{await rm(dir,{recursive:true})}
});
test('Las estadísticas calculan el porcentaje de fallos por pregunta y versión',()=>{
 const qs=[{id:1,title:'Uno',topic:'t',type:'choice'},{id:2,title:'Dos',topic:'t',type:'input'}];
 const rows=[{quizId:'q',revision:1,quizTitle:'Q',marks:[true,false],questions:qs},{quizId:'q',revision:1,quizTitle:'Q',marks:[false,false],questions:qs},{quizId:'q',revision:1,quizTitle:'Q',marks:[true,null],questions:qs},{quizId:'q',revision:2,quizTitle:'Q',marks:[true],questions:[qs[0]]},{quizId:'q',revision:1}];
 const [v2,v1]=questionStats(rows);
 assert.equal(v2.revision,2);assert.equal(v1.attempts,3);
 assert.deepEqual(v1.questions.map(q=>[q.wrong,q.answered,q.failRate]),[[1,3,33],[2,2,100]]);
});
test('El historial local guarda tokens válidos, evita duplicados y se puede borrar',()=>{
 const s=memory(),t='a'.repeat(64);
 rememberEval(t,s);rememberEval(t,s);rememberEval('malo',s);
 rememberLive({key:'123456-p1',title:'T',finished:'2026-10-20',score:900,correct:3,total:5,position:1,of:4},s);rememberLive({key:'123456-p1',title:'T',finished:'x',score:1,correct:0,total:5,position:4,of:4},s);
 rememberPractice({quizId:'q',revision:1,title:'P',nick:'Ari',score:1000,correct:5,total:5,finished:'2026-10-20'},s);
 const h=readHistory(s);assert.deepEqual(h.evals,[t]);assert.equal(h.live.length,1);assert.equal(h.live[0].score,900);assert.equal(h.practices.length,1);
 clearHistory(s);assert.deepEqual(readHistory(s),{evals:[],live:[],practices:[]});
 s.setItem('sc-history-v1','{dañado');assert.deepEqual(readHistory(s).evals,[]);
});
