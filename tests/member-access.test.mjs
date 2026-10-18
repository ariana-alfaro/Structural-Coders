import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createMemberApi} from '../server/member-api.mjs';
test('Miembros: bloqueo, dos cuentas, cambio persistente, cierre de sesión y aislamiento de secretos',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'sc-auth-'));const api=await createMemberApi(dir),server=createServer(api);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}`;let cookie='';
 const request=async(route,body,method=body?'POST':'GET',headers={})=>{const response=await fetch(base+route,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(cookie?{cookie}:{}),...headers},body:body?JSON.stringify(body):undefined});if(response.headers.get('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];return response};
 try{
  assert.equal((await request('/api/member/catalog')).status,401);
  assert.equal((await request('/api/member/catalog',{drafts:[],publications:[]},'PUT')).status,401);
  assert.equal((await request('/.private/members.json')).status,404);
  assert.equal((await request('/server/member-api.mjs')).status,404);
  assert.equal((await request('/api/member/login',{username:'Renzo',password:'incorrecta'})).status,401);
  assert.equal((await request('/api/member/login',{username:'Renzo',password:'GADEST'},'POST',{Origin:'https://ajeno.example'})).status,403);
  const login=await request('/api/member/login',{username:'Renzo',password:'GADEST'});assert.equal(login.status,200);assert.equal((await login.json()).user.username,'Renzo');
  const data=await (await request('/api/member/catalog')).json();assert.equal(data.drafts.length,14);
  assert.equal((await request('/api/member/catalog',data,'PUT')).status,200);
  assert.equal((await request('/api/member/catalog',data,'PUT')).status,409);
  assert.equal((await request('/api/member/password',{current:'error',password:'Nueva-segura-123'})).status,403);
  assert.equal((await request('/api/member/password',{current:'GADEST',password:'Nueva-segura-123'})).status,200);
  assert.equal((await request('/api/member/logout',{})).status,200);
  assert.equal((await request('/api/member/catalog')).status,401);
  assert.equal((await request('/api/member/login',{username:'Renzo',password:'GADEST'})).status,401);
  assert.equal((await request('/api/member/login',{username:'Renzo',password:'Nueva-segura-123'})).status,200);
  await request('/api/member/logout',{});
  assert.equal((await request('/api/member/login',{username:'Ariana',password:'GADEST'})).status,200);
  const stored=JSON.parse(await readFile(path.join(dir,'members.json'),'utf8'));assert.equal(stored[0].temporary,false);assert.equal(stored[1].temporary,true);assert(!JSON.stringify(stored).includes('GADEST'));assert(!JSON.stringify(stored).includes('Nueva-segura-123'));
  const restarted=await createMemberApi(dir);assert.equal(typeof restarted,'function');
  await request('/api/member/logout',{});const practice=await request('/api/practice?code=S1PRAC');assert.equal(practice.status,200);assert.equal((await practice.json()).questions.length,10);assert.equal((await request('/api/practice?code=S1VIVO')).status,404);
 }finally{await new Promise(resolve=>server.close(resolve));await rm(dir,{recursive:true,force:true})}
});
