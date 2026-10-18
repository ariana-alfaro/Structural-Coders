import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createServer} from 'node:http';
import {createEvaluation,evaluationQuiz,publicQuiz} from '../server/evaluation.mjs';
import {fileAttemptStore} from '../server/local-attempts.mjs';
import {createMemberApi} from '../server/member-api.mjs';
import {preparePublication} from '../src/authoring-model.mjs';

const base={topic:'Python',brief:'¿Qué imprime?',code:'print(1)',explanation:'Porque sí.',points:2};
const draft={id:'eval-1',title:'Evaluación',description:'',course:'SC',cycle:'2026-1',code:'EVAL01',hints:true,practice:true,questions:[
 {...base,id:1,title:'Uno',type:'choice',options:['a','b','c','d'],solution:2},
 {...base,id:2,title:'Dos',type:'input',options:[],solution:'12.50'},
]};
const catalogWith=(...extra)=>({drafts:[draft,...extra.map(e=>e.draft)],publications:[preparePublication(draft,1),...extra.map(e=>preparePublication(e.draft,1))]});
const game={draft:{...draft,id:'prac-1',code:'PRAC01',game:{enabled:true,timer:20,speed:true,powerups:true,leaderboard:true}}};
const priv={draft:{...draft,id:'priv-1',code:'PRIV01',owner:'Ariana',visibility:'private'}};
async function setup(clock={t:1_000_000}){const dir=await mkdtemp(path.join(tmpdir(),'sc-eval-'));const data=catalogWith(game,priv);const store=fileAttemptStore(path.join(dir,'attempts.json'),async()=>data);return {dir,clock,store,ev:createEvaluation(store,{now:()=>clock.t})}}

test('El navegador recibe preguntas sin soluciones ni explicaciones',async()=>{
 const {ev,dir}=await setup();try{
  const s=await ev.join({name:'Ana Torres',student:'20261042',code:'eval01'});
  assert.match(s.token,/^[a-f0-9]{64}$/);
  const text=JSON.stringify(s)+JSON.stringify(await ev.question({token:s.token}));
  assert.ok(!text.includes('solution')&&!text.includes('explanation')&&!text.includes('12.50'));
  assert.deepEqual(Object.keys(publicQuiz(draft).questions[0]).includes('solution'),false);
 }finally{await rm(dir,{recursive:true})}
});
test('El servidor mide el tiempo, califica, guarda la nota y exige la secuencia',async()=>{
 const {ev,dir,clock}=await setup();try{
  const s=await ev.join({name:'Ana Torres',student:'20261042',code:'EVAL01'});
  await assert.rejects(ev.submit({token:s.token,question:1,value:2}),/fuera de secuencia/,'sin abrir la pregunta');
  await ev.question({token:s.token});clock.t+=4000;
  await assert.rejects(ev.submit({token:s.token,question:2,value:'12.50'}),/fuera de secuencia/);
  await assert.rejects(ev.submit({token:s.token,question:1,value:9}),/no válida/);
  const r1=await ev.submit({token:s.token,question:1,value:2});
  assert.equal(r1.correct,true);assert.equal(r1.explanation,'Porque sí.');assert.equal(r1.session.answers[0].elapsed,4000);
  assert.equal((await ev.submit({token:s.token,question:1,value:2})).correct,true,'reenviar lo mismo devuelve el recibo');
  await assert.rejects(ev.submit({token:s.token,question:1,value:0}),/ya está registrada/);
  await assert.rejects(ev.results({token:s.token}),/Termina/);
  await ev.question({token:s.token});clock.t+=1000;
  assert.equal((await ev.submit({token:s.token,question:2,value:' 12.5 '})).correct,false);
  const [mine]=await ev.results({token:s.token});
  assert.equal(mine.score,10);assert.equal(mine.position,1);assert.equal(mine.correctCount,1);
  const all=await ev.memberResults('Renzo');assert.equal(all.length,1);assert.equal(all[0].student,'20261042');assert.deepEqual(all[0].marks,[true,false]);
 }finally{await rm(dir,{recursive:true})}
});
test('Un código universitario no puede abrir ni secuestrar otra participación',async()=>{
 const {ev,dir}=await setup();try{
  await ev.join({name:'Ana Torres',student:'20261042',code:'EVAL01'});
  await assert.rejects(ev.join({name:'Otra persona',student:' 20261042 ',code:'EVAL01'}),/Ya existe una participación/);
  await assert.rejects(ev.recover({token:'0'.repeat(64)}),/no es válida/);
  await assert.rejects(ev.question({token:'x'}),/no es válida/);
 }finally{await rm(dir,{recursive:true})}
});
test('Las prácticas tipo juego y los cuestionarios privados no sirven como evaluación',async()=>{
 const data=catalogWith(game,priv);
 assert.throws(()=>evaluationQuiz(data,'PRAC01'),/práctica tipo juego/);
 assert.throws(()=>evaluationQuiz(data,'PRIV01'),/No hay una evaluación/);
 assert.equal(evaluationQuiz(data,'PRIV01','Ariana').id,'priv-1');
 assert.throws(()=>evaluationQuiz({...data,archivedQuizIds:['eval-1']},'EVAL01'),/No hay una evaluación/);
 assert.throws(()=>evaluationQuiz(data,'NOPE00'),/No hay una evaluación/);
});
test('La ayuda descarta una incorrecta una sola vez y la práctica no cambia la nota',async()=>{
 const {ev,dir}=await setup();try{
  const s=await ev.join({name:'Ana Torres',student:'20261042',code:'EVAL01'});await ev.question({token:s.token});
  const h=await ev.hint({token:s.token,question:1});assert.notEqual(h.eliminated,2);assert.equal(h.hintQuestion,1);
  await assert.rejects(ev.hint({token:s.token,question:1}),/Ya utilizaste/);
  await assert.rejects(ev.practice({token:s.token,question:1,value:2}),/después de una respuesta incorrecta/);
  await ev.submit({token:s.token,question:1,value:0});
  const p=await ev.practice({token:s.token,question:1,value:2});assert.equal(p.correct,true);assert.deepEqual(p.state.practiced,[1]);
  assert.equal((await ev.recover({token:s.token})).answers[0].correct,false);
 }finally{await rm(dir,{recursive:true})}
});
test('Servidor local: rutas /api/eval de punta a punta, origen y práctica sin juego',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'sc-api-'));
 await writeFile(path.join(dir,'members.json'),'[]');await writeFile(path.join(dir,'catalog.json'),JSON.stringify(catalogWith(game,priv)));
 const api=await createMemberApi(dir),server=createServer((req,res)=>api(req,res));await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url=`http://127.0.0.1:${server.address().port}`;
 const post=(action,body,origin=url)=>fetch(`${url}/api/eval/${action}`,{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify(body)});
 try{
  assert.equal((await post('join',{name:'Ana Torres',student:'20261042',code:'EVAL01'},'https://otro.example')).status,403);
  const joined=await post('join',{name:'Ana Torres',student:'20261042',code:'EVAL01'});assert.equal(joined.status,200);const s=await joined.json();
  const q=await (await post('question',{token:s.token})).json();assert.equal(q.solution,undefined);
  const sub=await (await post('submit',{token:s.token,question:1,value:2})).json();assert.equal(sub.correct,true);
  const dup=await post('join',{name:'Ana Torres',student:'20261042',code:'EVAL01'});assert.equal(dup.status,409);assert.match((await dup.json()).error,/Ya existe/);
  assert.equal((await fetch(`${url}/api/practice?code=EVAL01`)).status,404,'sin práctica activada no se entregan soluciones');
  assert.equal((await fetch(`${url}/api/practice?code=PRAC01`)).status,200);
  assert.equal((await fetch(`${url}/api/member/eval-results`)).status,401);
  const saved=JSON.parse(await readFile(path.join(dir,'attempts.json'),'utf8'));assert.equal(saved.length,1);assert.ok(!JSON.stringify(saved).includes(s.token),'solo se guarda el hash del token');
 }finally{server.close();await rm(dir,{recursive:true})}
});

function fakeSupabase(tables){
 return {rpc:async name=>({data:name==='sc_web_limit'?true:null}),from(name){const filters=[];let op='select',value,single=false,returning=false;const q={
  select(){if(op!=='select')returning=true;return q},eq(k,v){filters.push(r=>r[k]===v);return q},in(k,vs){filters.push(r=>vs.includes(r[k]));return q},limit(){return q},maybeSingle(){single=true;return q},
  insert(v){op='insert';value=v;return q},update(v){op='update';value=v;return q},
  then(resolve,reject){tables[name]??=[];const rows=tables[name].filter(r=>filters.every(f=>f(r)));let result;
   if(op==='insert'){const dup=tables[name].some(r=>r.token_hash===value.token_hash||(r.quiz_id===value.quiz_id&&r.revision===value.revision&&r.student_key===value.student_key));if(dup)result={error:{code:'23505'}};else{tables[name].push(structuredClone(value));result={data:null}}}
   else if(op==='update'){rows.forEach(r=>Object.assign(r,structuredClone(value)));result={data:returning?structuredClone(rows):null}}
   else result={data:structuredClone(single?rows[0]??null:rows)};
   return Promise.resolve(result).then(resolve,reject)}};return q}};
}
test('Nube: el adaptador de Supabase califica en el servidor y solo miembros ven resultados',async()=>{
 const {createCloudApi}=await import('../server/cloud-api.mjs');
 const tables={sc_web_catalog:[{id:1,revision:0,data:catalogWith(game,priv)}],sc_web_attempts:[]};
 const handler=createCloudApi({client:fakeSupabase(tables),env:{APP_URL:'https://quiz.example'}}),server=createServer(handler);await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url=`http://127.0.0.1:${server.address().port}`;
 const post=(action,body)=>fetch(`${url}/api/eval/${action}`,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://quiz.example'},body:JSON.stringify(body)}).then(async r=>({status:r.status,data:await r.json()}));
 try{
  const s=(await post('join',{name:'Ana Torres',student:'20261042',code:'EVAL01'})).data;
  assert.ok(!JSON.stringify(s).includes('solution'));
  await post('question',{token:s.token});
  assert.equal((await post('submit',{token:s.token,question:1,value:2})).data.correct,true);
  await post('question',{token:s.token});
  assert.equal((await post('submit',{token:s.token,question:2,value:'12.50'})).data.correct,true);
  const res=await post('results',{token:s.token});assert.equal(res.data[0].score,20);
  assert.equal((await post('join',{name:'X Y',student:'20261042',code:'EVAL01'})).status,409);
  assert.equal((await post('join',{name:'X Y',student:'20269999',code:'PRAC01'})).status,409);
  assert.equal((await fetch(`${url}/api/member/eval-results`)).status,401);
  assert.equal(tables.sc_web_attempts.length,1);assert.equal(tables.sc_web_attempts[0].version,4);assert.ok(tables.sc_web_attempts[0].finished_at);
 }finally{server.close()}
});
