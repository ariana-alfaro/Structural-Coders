import {test} from 'node:test';
import assert from 'node:assert/strict';
import {availability,evaluationQuiz} from '../server/evaluation.mjs';
import {preparePublication,validateQuiz} from '../src/authoring-model.mjs';
import {questionStats} from '../src/question-stats.mjs';

const base={topic:'Python',brief:'¿Qué imprime?',code:'print(1)',explanation:'Porque sí.',points:2};
const draft={id:'eval-1',title:'Evaluación',description:'',course:'SC',cycle:'2026-1',code:'EVAL01',hints:true,practice:true,questions:[
 {...base,id:1,title:'Uno',type:'choice',options:['a','b','c','d'],solution:2},
 {...base,id:2,title:'Dos',type:'input',options:[],solution:'12.50'}]};
const catalog=d=>({drafts:[d],publications:[preparePublication(draft,1)]});

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
test('Las estadísticas calculan el porcentaje de fallos por pregunta y versión',()=>{
 const qs=[{id:1,title:'Uno',topic:'t',type:'choice'},{id:2,title:'Dos',topic:'t',type:'input'}];
 const rows=[{quizId:'q',revision:1,quizTitle:'Q',marks:[true,false],questions:qs},{quizId:'q',revision:1,quizTitle:'Q',marks:[false,false],questions:qs},{quizId:'q',revision:1,quizTitle:'Q',marks:[true,null],questions:qs},{quizId:'q',revision:2,quizTitle:'Q',marks:[true],questions:[qs[0]]},{quizId:'q',revision:1}];
 const [v2,v1]=questionStats(rows);
 assert.equal(v2.revision,2);assert.equal(v1.attempts,3);
 assert.deepEqual(v1.questions.map(q=>[q.wrong,q.answered,q.failRate]),[[1,3,33],[2,2,100]]);
});
