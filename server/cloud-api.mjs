import {visibleCatalog,mergeWorkspace} from './workspace-model.mjs';
import {validReport} from '../src/live-history.mjs';
import {createClient} from '@supabase/supabase-js';

import {createHash,randomBytes} from 'node:crypto';

import {passwordHash,passwordMatches} from './member-api.mjs';

import {validateQuiz} from '../src/authoring-model.mjs';
import {createEvaluation,evaluationRoute} from './evaluation.mjs';

const hash=value=>createHash('sha256').update(value).digest('hex');

const error=(status,message)=>Object.assign(new Error(message),{status});

export const publicMember=m=>({username:m.username,temporary:m.temporary});

export function createCloudApi({client,env=process.env}={}){

 const db=client||createClient(env.SUPABASE_URL,env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});

 const check=result=>{if(result.error)throw error(503,'No se pudo acceder al almacenamiento compartido.');return result.data};

 const attempts=()=>db.from('sc_web_attempts');
 const evaluation=createEvaluation({
  async loadCatalog(){const row=check(await db.from('sc_web_catalog').select('data').eq('id',1).maybeSingle());if(!row)throw error(503,'Falta cargar la biblioteca inicial en Supabase.');return row.data},
  getAttempt:async h=>check(await attempts().select('*').eq('token_hash',h).maybeSingle()),
  findAttempt:async(id,rev,key)=>check(await attempts().select('token_hash').eq('quiz_id',id).eq('revision',rev).eq('student_key',key).maybeSingle()),
  async insertAttempt(row){const result=await attempts().insert(row);if(result.error?.code==='23505')return false;check(result);return true},
  updateAttempt:async(h,version,patch)=>check(await attempts().update(patch).eq('token_hash',h).eq('version',version).select('token_hash')).length>0,
  finishedAttempts:async(id,rev)=>check(await attempts().select('*').eq('quiz_id',id).eq('revision',rev)).filter(r=>r.finished_at),
  attemptsFor:async ids=>ids.length?check(await attempts().select('*').in('quiz_id',ids).limit(5000)):[],
  limit:async(key,max)=>check(await db.rpc('sc_web_limit',{p_key:key,p_limit:max})),
 });

 return async(req,res)=>{

  res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');

  const send=(status,data)=>{res.statusCode=status;res.end(JSON.stringify(data))};

  try{

   const url=new URL(req.url,'https://localhost'),route=url.pathname;

   if(!['GET','POST','PUT'].includes(req.method))throw error(405,'Método no permitido.');

   if(req.method!=='GET'){

    const origin=req.headers.origin;const permitted=env.APP_URL?new URL(env.APP_URL).origin:`https://${req.headers.host}`;

    if(origin&&origin!==permitted)throw error(403,'Origen no permitido.');

    if(!req.headers['content-type']?.startsWith('application/json'))throw error(415,'Se requiere JSON.');

   }

   let body=req.body;if(!body&&req.method!=='GET'){let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>2_000_000)throw error(413,'Archivo demasiado grande.')}body=JSON.parse(raw||'{}')}

   if(typeof body==='string')body=JSON.parse(body);body??={};if(Buffer.byteLength(JSON.stringify(body))>2_000_000)throw error(413,'Archivo demasiado grande.');

   const rawToken=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('sc_member='))?.slice(10);

   let session=null,member=null;

   if(rawToken&&/^[a-f0-9]{64}$/.test(rawToken)){

    session=check(await db.from('sc_web_sessions').select('*').eq('token_hash',hash(rawToken)).gt('expires_at',new Date().toISOString()).maybeSingle());

    if(session)member=check(await db.from('sc_web_members').select('*').eq('username',session.username).maybeSingle());

   }

   const cookie=(value,age)=>`sc_member=${value}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${age}`;

   const requireMember=()=>{if(!member)throw error(401,'Inicia sesión como miembro GADEST.');if(member.temporary)throw error(403,'Cambia primero tu contraseña temporal desde Mi cuenta.');return member};

   if(route==='/api/member/session'&&req.method==='GET')return send(200,{user:member?publicMember(member):null});

   if(route==='/api/member/login'&&req.method==='POST'){

    if(typeof body.username!=='string'||typeof body.password!=='string'||body.username.length>80||body.password.length>256)throw error(400,'Revisa tus credenciales.');

    const ip=String(req.headers['x-real-ip']||req.socket?.remoteAddress||'unknown');

    const allowed=check(await db.rpc('sc_web_limit',{p_key:hash(ip+'|'+body.username.trim().toLowerCase()),p_limit:8}));if(!allowed)throw error(429,'Demasiados intentos. Espera quince minutos.');

    const found=check(await db.from('sc_web_members').select('*').eq('username_key',body.username.trim().toLowerCase()).maybeSingle());

    // Igual coste de derivación para usuarios inexistentes.

    const candidate=found||{salt:'00000000000000000000000000000000',digest:'0'.repeat(128)};

    if(!await passwordMatches(body.password,candidate)||!found)throw error(401,'Usuario o contraseña incorrectos.');

    const token=randomBytes(32).toString('hex');check(await db.from('sc_web_sessions').insert({token_hash:hash(token),username:found.username,expires_at:new Date(Date.now()+8*3600000).toISOString()}));

    res.setHeader('Set-Cookie',cookie(token,28800));return send(200,{user:publicMember(found)});

   }

   if(route==='/api/member/logout'&&req.method==='POST'){if(session)check(await db.from('sc_web_sessions').delete().eq('token_hash',session.token_hash));res.setHeader('Set-Cookie',cookie('',0));return send(200,{ok:true})}

   if(route==='/api/member/password'&&req.method==='POST'){

    if(!member)throw error(401,'Inicia sesión.');

    if(typeof body.current!=='string'||body.current.length>256||typeof body.password!=='string'||body.password.length<8||body.password.length>128)throw error(400,'Usa una contraseña de 8 a 128 caracteres.');

    const allowed=check(await db.rpc('sc_web_limit',{p_key:hash('password|'+member.username),p_limit:8}));if(!allowed)throw error(429,'Demasiados intentos. Espera quince minutos.');

    if(!await passwordMatches(body.current,member))throw error(403,'La contraseña actual no coincide.');if(body.current===body.password)throw error(400,'Elige una contraseña diferente.');

    const next={...await passwordHash(body.password),temporary:false};const updated=check(await db.from('sc_web_members').update(next).eq('username',member.username).eq('digest',member.digest).select('username'));

    if(!updated.length)throw error(409,'La contraseña cambió en otra sesión. Vuelve a ingresar.');

    check(await db.from('sc_web_sessions').delete().eq('username',member.username).neq('token_hash',session.token_hash));return send(200,{user:{username:member.username,temporary:false}});

   }

   const action=evaluationRoute(route,req.method);
   if(action)return send(200,await evaluation[action](body,{ip:String(req.headers['x-real-ip']||req.socket?.remoteAddress||'unknown'),username:member&&!member.temporary?member.username:undefined}));
   if(route==='/api/member/eval-results'&&req.method==='GET'){requireMember();return send(200,{results:await evaluation.memberResults(member.username)})}

   if(route==='/api/practice'&&req.method==='GET'){

    const row=check(await db.from('sc_web_catalog').select('data').eq('id',1).maybeSingle());const quiz=row?.data.publications.filter(q=>q.code===url.searchParams.get('code')?.toUpperCase()).at(-1);

    const draft=row?.data.drafts.find(q=>q.id===quiz?.id);if(!quiz||(draft?.owner&&draft.visibility!=='group'&&draft.owner!==member?.username)||(row.data.archivedQuizIds??[]).includes(quiz.id)||!quiz.game?.enabled)throw error(404,'No hay una práctica habilitada con ese código.');return send(200,quiz);

   }

   if(route==='/api/member/catalog'&&req.method==='GET'){

    requireMember();const row=check(await db.from('sc_web_catalog').select('*').eq('id',1).maybeSingle());if(!row)throw error(503,'Falta cargar la biblioteca inicial en Supabase.');return send(200,{...visibleCatalog(row.data,member.username),serverRevision:row.revision});

   }

   if(route==='/api/member/catalog'&&req.method==='PUT'){

    requireMember();if(!Array.isArray(body.drafts)||!Array.isArray(body.publications)||body.drafts.length>100||(body.deletedQuizIds!==undefined&&(!Array.isArray(body.deletedQuizIds)||body.deletedQuizIds.length>10000||body.deletedQuizIds.some(id=>typeof id!=='string')))||body.publications.length>1000||(body.archivedQuizIds!==undefined&&(!Array.isArray(body.archivedQuizIds)||body.archivedQuizIds.length>100||body.archivedQuizIds.some(id=>typeof id!=='string'))))throw error(400,'Biblioteca no válida.');

    if(body.publications.some(q=>validateQuiz(q).length))throw error(400,'Revisa las preguntas publicadas.');

    const previous=check(await db.from('sc_web_catalog').select('data').eq('id',1).maybeSingle());const merged=mergeWorkspace(previous?.data??{drafts:[],publications:[]},body,member.username);
    const revision=check(await db.rpc('sc_web_save_catalog',{p_revision:body.serverRevision||0,p_data:merged}));if(revision===null)throw error(409,'Otro miembro guardó cambios. Exporta tu borrador y recarga la biblioteca.');return send(200,{ok:true,serverRevision:revision});

   }

   if(route==='/api/member/live-results'&&req.method==='GET'){
    requireMember();const rows=check(await db.from('sc_web_live_results').select('report,created_at').order('created_at',{ascending:false}).limit(100));return send(200,{reports:rows.map(r=>r.report)});
   }
   if(route==='/api/member/live-results'&&req.method==='POST'){
    requireMember();if(!validReport(body.report))throw error(400,'Resultados incompletos. Verifica los codigos universitarios.');
    const prior=check(await db.from('sc_web_live_results').select('id,owner').eq('id',body.report.id).maybeSingle());if(prior){if(prior.owner!==member.username)throw error(403,'Esta partida pertenece a otro miembro.');return send(200,{ok:true})}
    check(await db.from('sc_web_live_results').insert({id:body.report.id,owner:member.username,report:body.report}));return send(200,{ok:true});
   }
   if(route==='/api/live/access'&&req.method==='POST'){

    if(!/^\d{6}$/.test(body.pin)||typeof body.accessToken!=='string'||body.accessToken.length>8000)throw error(400,'Revisa el PIN de la sala.');

    const identity=await db.auth.getUser(body.accessToken);if(identity.error||!identity.data.user)throw error(401,'No se pudo verificar tu conexión.');const uid=identity.data.user.id;

    const allowed=check(await db.rpc('sc_web_limit',{p_key:hash('room|'+uid),p_limit:30}));if(!allowed)throw error(429,'Espera un momento antes de volver a conectar.');

    let room=check(await db.from('sc_web_rooms').select('*').eq('pin',body.pin).maybeSingle());

    if(body.host){

     requireMember();if(room&&new Date(room.expires_at)>new Date()&&room.owner!==member.username)throw error(409,'El PIN ya está ocupado. Abre una sala nueva.');

     const expires_at=new Date(Date.now()+4*3600000).toISOString();

     // No sustituir una sala activa de otro miembro ante dos aperturas concurrentes.

     if(!room){const inserted=await db.from('sc_web_rooms').insert({pin:body.pin,owner:member.username,host_uid:uid,expires_at});if(inserted.error)throw error(409,'El PIN está ocupado. Abre otra sala.')}else{check(await db.from('sc_web_rooms').update({owner:member.username,host_uid:uid,expires_at}).eq('pin',body.pin).eq('owner',room.owner))}

     room={pin:body.pin,owner:member.username,host_uid:uid,expires_at};

    }else if(!room||new Date(room.expires_at)<=new Date())throw error(404,'La sala no está disponible. Revisa el PIN.');

    check(await db.from('sc_web_room_access').upsert({pin:body.pin,user_id:uid,expires_at:room.expires_at},{onConflict:'pin,user_id'}));return send(200,{ok:true});

   }

   throw error(404,'Ruta no disponible.');

  }catch(e){return send(e.status||400,{error:e.status?e.message:'No se pudo completar la operación. Revisa los datos.'})}

 }

}

