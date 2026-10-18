import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const compile=path=>ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const asModule=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const questionURL=asModule(compile('../src/questions.ts'));
const modelURL=new URL('../src/authoring-model.mjs',import.meta.url).href;
const engineURL=new URL('../src/engine.mjs',import.meta.url).href;
const practiceURL=new URL('../src/practice-model.mjs',import.meta.url).href;
const source=compile('../src/authoring.ts').replace("'./questions'",JSON.stringify(questionURL)).replace("'./authoring-model.mjs'",JSON.stringify(modelURL)).replace("'./engine.mjs'",JSON.stringify(engineURL)).replace("'./practice-model.mjs'",JSON.stringify(practiceURL));
const repo=await import(asModule(source));
const memory=new Map();globalThis.localStorage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,value)};
const initial=JSON.parse(readFileSync(new URL('../content/workshops.json',import.meta.url),'utf8')).quizzes[0];
let remote={drafts:[structuredClone(initial)],publications:[{...structuredClone(initial),revision:1}]};
globalThis.window=new EventTarget();
globalThis.fetch=async(route,options={})=>{
 if(options.method==='PUT'){remote=JSON.parse(options.body);return {ok:true,json:async()=>({ok:true})}}
 if(route.startsWith('/api/practice?')){const code=new URL(route,'http://test').searchParams.get('code');const quiz=remote.publications.filter(q=>q.code===code).at(-1);return {ok:!!quiz,json:async()=>structuredClone(quiz||{error:'No disponible'})}}
 return {ok:true,json:async()=>structuredClone(remote)};
};
function reset(){memory.clear();remote={drafts:[structuredClone(initial)],publications:[{...structuredClone(initial),revision:1}]}}

test('La biblioteca se recupera del servidor y mantiene versiones previas',async()=>{reset();let data=await repo.catalog();assert.equal(data.drafts.length,1);assert.equal(data.drafts[0].questions.length,10);const copy={...structuredClone(data.drafts[0]),...repo.freshQuiz(data),title:'Semana 2',questions:structuredClone(data.drafts[0].questions)};data={...data,drafts:[...data.drafts,copy]};data=repo.publish(data,copy.id);await repo.persistCatalog(data);let recovered=await repo.catalog();assert.equal(recovered.drafts.length,2);assert.equal((await repo.roomQuiz(copy.code)).title,'Semana 2');recovered.drafts.find(d=>d.id===copy.id).questions[0].title='Editada después';recovered=repo.publish(recovered,copy.id);await repo.persistCatalog(recovered);assert.equal(repo.latest(recovered,copy.id).revision,2);assert.notEqual(recovered.publications.find(p=>p.id===copy.id&&p.revision===1).questions[0].title,'Editada después');assert.equal((await repo.roomQuiz(copy.code)).questions[0].title,'Editada después')});
test('No se permite reutilizar el código de otro cuestionario',async()=>{reset();const data=await repo.catalog();const copy={...structuredClone(data.drafts[0]),id:'otra'};assert.throws(()=>repo.publish({...data,drafts:[...data.drafts,copy]},'otra'),/código/)});
test('Un respaldo restaura copias sin sobrescribir originales, incluso borradores incompletos',async()=>{reset();const data=await repo.catalog();const incomplete=repo.freshQuiz(data);incomplete.questions=[repo.freshQuestion('input',1)];const next=repo.importBackup(JSON.stringify({format:'structural-coders-quiz',version:1,quizzes:[data.drafts[0],incomplete]}),data);assert.equal(next.drafts.length,3);assert.notEqual(next.drafts[1].id,data.drafts[0].id);assert.notEqual(next.drafts[1].code,data.drafts[0].code);assert.equal(next.publications.length,1);assert.equal(next.drafts[2].questions[0].brief,'')});
test('Se rechazan respaldos ajenos y tipos de pregunta no compatibles',async()=>{reset();const data=await repo.catalog();assert.throws(()=>repo.importBackup('{}',data),/compatible/);const invalid=structuredClone(data.drafts[0]);invalid.questions[0].type='script';assert.throws(()=>repo.importBackup(JSON.stringify({format:'structural-coders-quiz',version:1,quizzes:[invalid]}),data),/Pregunta no válida/)});

test('Una copia antigua del navegador no restaura cuestionarios eliminados definitivamente',async()=>{reset();memory.set('sc-authoring-v1',JSON.stringify({drafts:[structuredClone(initial)],publications:[]}));remote={drafts:[],publications:[],deletedQuizIds:[initial.id]};const data=await repo.catalog();assert.equal(data.drafts.length,0);assert.deepEqual(data.deletedQuizIds,[initial.id]);});
