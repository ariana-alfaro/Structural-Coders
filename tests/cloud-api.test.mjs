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

  select(){return query},eq(k,v){filters.push(r=>r[k]===v);return query},neq(k,v){filters.push(r=>r[k]!==v);return query},gt(k,v){filters.push(r=>r[k]>v);return query},

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

  assert.equal((await request('/api/member/login',{username:'Ariana',password:'x'},'POST','https://other.example')).status,403);

  assert.equal((await request('/api/member/login',{username:'Ariana',password:'x'})).status,401);

  assert.equal((await request('/api/member/login',{username:'Ariana',password:'Clave-de-prueba-123'})).status,200);

  assert.equal((await request('/api/member/session')).status,200);assert.equal((await request('/api/member/catalog')).status,200);

  const catalog={drafts:[],publications:[],archivedQuizIds:['removed-quiz'],serverRevision:0};assert.equal((await request('/api/member/catalog',catalog,'PUT')).status,200);assert.equal((await request('/api/member/catalog',catalog,'PUT')).status,409);

  assert.deepEqual((await (await request('/api/member/catalog')).json()).archivedQuizIds,['removed-quiz']);
  const bank=JSON.parse(await readFile(new URL('../content/workshops.json',import.meta.url),'utf8'));
  const draft=bank.quizzes.find(q=>q.game?.enabled),publication=preparePublication(draft,1);
  const active={drafts:[draft],publications:[publication],archivedQuizIds:[],serverRevision:1};
  assert.equal((await request('/api/member/catalog',active,'PUT')).status,200);
  assert.equal((await request('/api/practice?code='+draft.code)).status,200);
  assert.equal((await request('/api/member/catalog',{...active,serverRevision:2,archivedQuizIds:[draft.id]},'PUT')).status,200);
  assert.equal((await request('/api/practice?code='+draft.code)).status,404);
  assert.equal((await request('/api/member/catalog',{...active,serverRevision:3},'PUT')).status,200);
  assert.equal((await request('/api/practice?code='+draft.code)).status,200);
  assert.deepEqual((await (await request('/api/member/catalog')).json()).drafts,[draft]);


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

