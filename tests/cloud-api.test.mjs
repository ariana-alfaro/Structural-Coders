import {test} from 'node:test';

import assert from 'node:assert/strict';

import {createServer} from 'node:http';

import {createCloudApi} from '../server/cloud-api.mjs';

import {readFile} from 'node:fs/promises';

import {preparePublication} from '../src/authoring-model.mjs';
import {passwordHash} from '../server/member-api.mjs';



function fakeDatabase(tables){

 return {auth:{getUser:async token=>token==='guest-token'?{data:{user:{id:'guest-1'}}}:{error:true,data:{}}},

 rpc:async(name,args)=>{if(name==='sc_web_limit')return {data:true};const row=tables.sc_web_catalog[0];if(row.revision!==args.p_revision)return {data:null};row.data=structuredClone(args.p_data);return {data:++row.revision}},

 from(name){const filters=[];let operation='select',value,single=false;const query={

  order(){return query},limit(){return query},select(){return query},eq(k,v){filters.push(r=>r[k]===v);return query},neq(k,v){filters.push(r=>r[k]!==v);return query},gt(k,v){filters.push(r=>r[k]>v);return query},

  insert(v){operation='insert';value=v;return query},update(v){operation='update';value=v;return query},delete(){operation='delete';return query},upsert(v){operation='insert';value=v;return query},maybeSingle(){single=true;return query},

  then(resolve){tables[name]??=[];const rows=tables[name].filter(r=>filters.every(f=>f(r)));if(operation==='insert')tables[name].push(structuredClone(value));if(operation==='update')rows.forEach(r=>Object.assign(r,structuredClone(value)));if(operation==='delete')tables[name]=tables[name].filter(r=>!rows.includes(r));return Promise.resolve({data:structuredClone(single?rows[0]||null:rows)}).then(resolve)}

 };return query}

 }

}

test('API en nube: las sesiones funcionan entre instancias y solo miembros pueden gestionar la biblioteca',async()=>{

 const tables={sc_web_members:[{username:'Ariana',username_key:'ariana',temporary:false,...await passwordHash('Clave-de-prueba-123')}],sc_web_catalog:[{id:1,revision:0,data:{drafts:[],publications:[]}}]};

 const client=fakeDatabase(tables),handlers=[createCloudApi({client,env:{APP_URL:'https://quiz.example'}}),createCloudApi({client,env:{APP_URL:'https://quiz.example'}})];let turn=0;

 const server=createServer((req,res)=>handlers[turn++%2](req,res));await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;let cookie='';

 async function request(route,body,method=body?'POST':'GET',origin='https://quiz.example'){

  const response=await fetch(base+route,{method,headers:{...(cookie?{cookie}:{}),...(body?{'Content-Type':'application/json',Origin:origin}:{})},body:body?JSON.stringify(body):undefined});if(response.headers.get('set-cookie')){assert(response.headers.get('set-cookie').includes('HttpOnly; Secure; SameSite=Strict'));cookie=response.headers.get('set-cookie').split(';')[0]}return response;

 }

 try{

  assert.equal((await request('/api/member/catalog')).status,401);
  assert.equal((await request('/api/member/live-results')).status,401);

  assert.equal((await request('/api/member/login',{username:'Ariana',password:'x'},'POST','https://other.example')).status,403);

  assert.equal((await request('/api/member/login',{username:'Ariana',password:'x'})).status,401);

  assert.equal((await request('/api/member/login',{username:'Ariana',password:'Clave-de-prueba-123'})).status,200);

  assert.equal((await request('/api/member/session')).status,200);assert.equal((await request('/api/member/catalog')).status,200);

  const report={id:crypto.randomUUID(),pin:'123456',title:'Partida de prueba',quizId:'quiz-test',finished:new Date().toISOString(),total:10,rows:[{position:1,name:'Aspirante',universityCode:'20260001',score:1000,correct:1}]};
  assert.equal((await request('/api/member/live-results',{report})).status,200);
  assert.equal((await request('/api/member/live-results',{report})).status,200);
  assert.equal(tables.sc_web_live_results.length,1);
  assert.deepEqual((await (await request('/api/member/live-results')).json()).reports,[report]);
  assert.equal((await request('/api/member/live-results',{report:{...report,id:crypto.randomUUID(),rows:[{...report.rows[0],universityCode:''}]}})).status,400);
  const catalog={drafts:[],publications:[],archivedQuizIds:[],serverRevision:0};assert.equal((await request('/api/member/catalog',catalog,'PUT')).status,200);assert.equal((await request('/api/member/catalog',catalog,'PUT')).status,409);

  assert.deepEqual((await (await request('/api/member/catalog')).json()).archivedQuizIds,[]);
  const bank=JSON.parse(await readFile(new URL('../content/workshops.json',import.meta.url),'utf8'));
  const draft={...bank.quizzes.find(q=>q.game?.enabled),owner:'Ariana',visibility:'private'},publication=preparePublication(draft,1);
  const active={drafts:[draft],publications:[publication],archivedQuizIds:[],serverRevision:1};
  assert.equal((await request('/api/member/catalog',active,'PUT')).status,200);
  assert.equal((await request('/api/practice?code='+draft.code)).status,200);
  {const savedCookie=cookie;cookie='';assert.equal((await request('/api/practice?code='+draft.code)).status,404);cookie=savedCookie;}
  assert.equal((await request('/api/member/catalog',{...active,serverRevision:2,archivedQuizIds:[draft.id]},'PUT')).status,200);
  assert.equal((await request('/api/practice?code='+draft.code)).status,404);
  assert.equal((await request('/api/member/catalog',{...active,serverRevision:3},'PUT')).status,200);
  assert.equal((await request('/api/practice?code='+draft.code)).status,200);
  assert.deepEqual((await (await request('/api/member/catalog')).json()).drafts,[draft]);


  const toArchive=await (await request('/api/member/catalog')).json();assert.equal((await request('/api/member/catalog',{...toArchive,archivedQuizIds:[draft.id]},'PUT')).status,200);
  const beforePurge=await (await request('/api/member/catalog')).json();
  const purged={drafts:[],publications:[],archivedQuizIds:[],deletedQuizIds:[draft.id],serverRevision:beforePurge.serverRevision};
  assert.equal((await request('/api/member/catalog',purged,'PUT')).status,200);
  const afterPurge=await (await request('/api/member/catalog')).json();
  assert.deepEqual(afterPurge.deletedQuizIds,[draft.id]);
  assert.equal((await request('/api/practice?code='+draft.code)).status,404);
  assert.deepEqual((await (await request('/api/member/live-results')).json()).reports,[report]);
  assert.equal((await request('/api/member/catalog',{...active,serverRevision:afterPurge.serverRevision},'PUT')).status,409);
  assert.equal((await request('/api/member/password',{current:'Clave-de-prueba-123',password:'Otra-clave-prueba-456'})).status,200);

  assert.equal((await request('/api/member/logout',{})).status,200);assert.equal((await request('/api/member/catalog')).status,401);

  assert.equal((await request('/api/member/login',{username:'Ariana',password:'Otra-clave-prueba-456'})).status,200);

  assert.equal((await request('/api/live/access',{pin:'123456',host:true,accessToken:'guest-token'})).status,200);

  assert.equal(tables.sc_web_rooms[0].owner,'Ariana');await request('/api/member/logout',{});

  assert.equal((await request('/api/live/access',{pin:'123456',host:true,accessToken:'guest-token'})).status,401);

  assert.equal((await request('/api/live/access',{pin:'123456',host:false,accessToken:'guest-token'})).status,200);

  assert.equal((await request('/api/live/access',{pin:'000000',host:false,accessToken:'guest-token'})).status,404);

 }finally{await new Promise(resolve=>server.close(resolve))}

});

test('Espacios por API: privacidad, compartir y protección del original entre Ariana y Renzo',async()=>{
 const bank=JSON.parse(await readFile(new URL('../content/workshops.json',import.meta.url),'utf8'));
 const original={...bank.quizzes[0],owner:'Ariana',visibility:'private'};
 const credential=await passwordHash('Prueba-espacios-123');
 const tables={sc_web_members:['Ariana','Renzo'].map(username=>({username,username_key:username.toLowerCase(),temporary:false,...credential})),sc_web_catalog:[{id:1,revision:0,data:{drafts:[original],publications:[preparePublication(original,1)]}}]};
 const handler=createCloudApi({client:fakeDatabase(tables),env:{APP_URL:'https://quiz.example'}});
 const server=createServer((req,res)=>handler(req,res));await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;const cookies={};
 async function request(username,route,body,method=body?'POST':'GET'){
  const response=await fetch(base+route,{method,headers:{...(cookies[username]?{cookie:cookies[username]}:{}),...(body?{'Content-Type':'application/json',Origin:'https://quiz.example'}:{})},body:body?JSON.stringify(body):undefined});if(response.headers.get('set-cookie'))cookies[username]=response.headers.get('set-cookie').split(';')[0];return response;
 }
 try{
  for(const username of ['Ariana','Renzo'])assert.equal((await request(username,'/api/member/login',{username,password:'Prueba-espacios-123'})).status,200);
  assert.equal((await (await request('Renzo','/api/member/catalog')).json()).drafts.length,0);
  assert.equal((await request('Renzo','/api/practice?code='+original.code)).status,404);
  let a=await (await request('Ariana','/api/member/catalog')).json();const r=await (await request('Renzo','/api/member/catalog')).json();
  const renzo={...original,id:crypto.randomUUID(),code:'RENZOO',owner:'Renzo'};r.drafts.push(renzo);r.publications.push(preparePublication(renzo,1));assert.equal((await request('Renzo','/api/member/catalog',r,'PUT')).status,200);
  a=await (await request('Ariana','/api/member/catalog')).json();assert.equal(a.drafts.length,1);assert.equal(a.drafts[0].owner,'Ariana');a.drafts[0].visibility='group';assert.equal((await request('Ariana','/api/member/catalog',a,'PUT')).status,200);
  let shared=await (await request('Renzo','/api/member/catalog')).json();assert.equal(shared.drafts.length,2);shared.drafts.find(q=>q.owner==='Ariana').title='Cambio no autorizado';assert.equal((await request('Renzo','/api/member/catalog',shared,'PUT')).status,403);
  assert.equal((await request('Renzo','/api/practice?code='+original.code)).status,200);
  a=await (await request('Ariana','/api/member/catalog')).json();assert.equal(a.drafts[0].title,original.title);a.drafts[0].visibility='private';assert.equal((await request('Ariana','/api/member/catalog',a,'PUT')).status,200);
  shared=await (await request('Renzo','/api/member/catalog')).json();assert.equal(shared.drafts.length,1);assert.equal(shared.drafts[0].owner,'Renzo');assert.equal((await request('Renzo','/api/practice?code='+original.code)).status,404);
 }finally{await new Promise(resolve=>server.close(resolve))}
});

