import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,addPlayer,snapshot} from '../src/live-model.mjs';
import {liveReport,validReport} from '../src/live-history.mjs';
const quiz={id:'q',title:'Taller',questions:[{id:1,type:'choice',options:['a','b'],solution:0}]};
test('Codigo universitario requerido, unico y privado en partidas nuevas',()=>{let g=createGame(quiz,{requireUniversityCode:true});assert.throws(()=>addPlayer(g,'1','Ana'));g=addPlayer(g,'1','Ana','20260001');assert.throws(()=>addPlayer(g,'2','Luis','20260001'));assert.equal(g.players['1'].universityCode,'20260001');assert.equal(JSON.stringify(snapshot(g,0)).includes('20260001'),false);assert.equal(addPlayer(g,'1','Ana','20260001'),g)});
test('El reporte conserva la identidad y puntos solo al finalizar',()=>{let g=addPlayer(createGame(quiz,{requireUniversityCode:true}),'1','Ana','20260001');assert.throws(()=>liveReport(g));g={...g,phase:'podium'};const r=liveReport(g);assert.equal(validReport(r),true);assert.equal(validReport({...r,rows:[null]}),false);assert.equal(r.rows[0].universityCode,'20260001');assert.equal(validReport({...r,rows:[{...r.rows[0],correct:4}]}),false);assert.equal(validReport({...r,rows:[{...r.rows[0],universityCode:''}]}),false)});
import {liveGrade} from '../src/live-history.mjs';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createServer} from 'node:http';
import {createMemberApi,passwordHash} from '../server/member-api.mjs';
test('La nota de una partida en vivo depende solo de los aciertos',()=>{assert.equal(liveGrade(5,5),20);assert.equal(liveGrade(3,5),12);assert.equal(liveGrade(2,3),13.3);assert.equal(liveGrade(0,10),0);assert.equal(liveGrade(1,0),0)});
test('Servidor local: solo quien guardó una partida puede eliminarla',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'sc-hist-'));
 await writeFile(path.join(dir,'members.json'),JSON.stringify(await Promise.all(['Ana','Luis'].map(async username=>({username,...await passwordHash('Clave-de-prueba-1'),temporary:false})))));
 const api=await createMemberApi(dir),server=createServer((req,res)=>api(req,res));await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}`;
 const login=async u=>(await fetch(url+'/api/member/login',{method:'POST',headers:{'Content-Type':'application/json',Origin:url},body:JSON.stringify({username:u,password:'Clave-de-prueba-1'})})).headers.get('set-cookie').split(';')[0];
 const call=(cookie,route,body)=>fetch(url+route,{method:body?'POST':'GET',headers:{cookie,...(body?{'Content-Type':'application/json',Origin:url}:{})},body:body?JSON.stringify(body):undefined});
 try{
  const ana=await login('Ana'),luis=await login('Luis');
  const report={id:crypto.randomUUID(),pin:'123456',title:'Partida',quizId:'q',finished:new Date().toISOString(),total:5,rows:[{position:1,name:'Ari',universityCode:'2021',score:5315,correct:5}]};
  assert.equal((await call(ana,'/api/member/live-results',{report})).status,200);
  const seen=await (await call(luis,'/api/member/live-results')).json();assert.deepEqual(seen.reports,[report]);assert.deepEqual(seen.deletable,[]);
  assert.equal((await call(luis,'/api/member/live-results/delete',{id:report.id})).status,403);
  assert.deepEqual((await (await call(ana,'/api/member/live-results')).json()).deletable,[report.id]);
  assert.equal((await call(ana,'/api/member/live-results/delete',{id:report.id})).status,200);
  assert.deepEqual((await (await call(ana,'/api/member/live-results')).json()).reports,[]);
 }finally{server.close();await rm(dir,{recursive:true})}
});
