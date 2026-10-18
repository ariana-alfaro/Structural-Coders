import {randomBytes,scrypt,timingSafeEqual,createHash} from 'node:crypto';
import {promisify} from 'node:util';
import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import path from 'node:path';
import {validateQuiz,preparePublication} from '../src/authoring-model.mjs';

const derive=promisify(scrypt),hash=t=>createHash('sha256').update(t).digest('hex');
export async function passwordHash(password,salt=randomBytes(16).toString('hex')){return {salt,digest:(await derive(password,salt,64)).toString('hex')}}
export async function passwordMatches(password,user){const digest=await derive(password,user.salt,64);return timingSafeEqual(digest,Buffer.from(user.digest,'hex'))}
export async function createMemberApi(directory=path.resolve('.private')){
 await mkdir(directory,{recursive:true});
 const file=path.join(directory,'members.json'),catalogFile=path.join(directory,'catalog.json');
 let users;try{users=JSON.parse(await readFile(file,'utf8'))}catch(e){if(e.code!=='ENOENT')throw e;users=await Promise.all(['Renzo','Ariana'].map(async username=>({username,...await passwordHash('GADEST'),temporary:true})));await writeFile(file,JSON.stringify(users),{mode:0o600,flag:'wx'})}
 const sessions=new Map(),attempts=new Map();let saving=Promise.resolve();
 const saveUsers=()=>{saving=saving.catch(()=>{}).then(async()=>{await writeFile(file+'.tmp',JSON.stringify(users),{mode:0o600});await rename(file+'.tmp',file)});return saving};
 const readCatalog=async()=>{try{return JSON.parse(await readFile(catalogFile,'utf8'))}catch(e){if(e.code!=='ENOENT')throw e;const initial=JSON.parse(await readFile(new URL('../content/workshops.json',import.meta.url),'utf8'));return {drafts:initial.quizzes,publications:initial.quizzes.map(q=>preparePublication(q,1))}}};
 const publicUser=u=>({username:u.username,temporary:u.temporary});
 const sessionFor=req=>{const token=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('sc_member='))?.slice(10);const s=token&&sessions.get(hash(token));if(!s||s.expires<Date.now())return null;return {key:hash(token),...s,user:users.find(u=>u.username===s.username)}};
 return async function memberApi(req,res,next=()=>{res.statusCode=404;res.end()}){
  const url=new URL(req.url,'http://localhost');const decoded=decodeURIComponent(url.pathname).replaceAll('\\','/');if(/(?:^|\/)(?:\.private|server|content)(?:\/|$)/i.test(decoded)){res.statusCode=404;return res.end()}if(!url.pathname.startsWith('/api/'))return next();
  res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('X-Content-Type-Options','nosniff');
  const send=(status,data)=>{res.statusCode=status;res.end(JSON.stringify(data))};
  try{
   if(!['GET','POST','PUT'].includes(req.method))return send(405,{error:'Método no permitido.'});
   if(req.method!=='GET'){
    const origin=req.headers.origin;if(origin&&origin!==`${req.socket.encrypted?'https':'http'}://${req.headers.host}`)return send(403,{error:'Origen no permitido.'});
    if(!req.headers['content-type']?.startsWith('application/json'))return send(415,{error:'Se requiere JSON.'});
   }
   let body={};if(req.method!=='GET'){let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>2_000_000)return send(413,{error:'Archivo demasiado grande.'})}body=JSON.parse(raw||'{}')}
   const current=sessionFor(req);
   const cookie=(value,age)=>`sc_member=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${age}${req.socket.encrypted||process.env.SC_SECURE_COOKIE==='1'?'; Secure':''}`;
   if(url.pathname==='/api/member/session'&&req.method==='GET')return send(200,{user:current?publicUser(current.user):null});
   if(url.pathname==='/api/member/login'&&req.method==='POST'){
    const ip=req.socket.remoteAddress||'local',now=Date.now();for(const [key,v] of attempts)if(v.until<now)attempts.delete(key);
    const prior=attempts.get(ip);if(prior?.count>=8)return send(429,{error:'Demasiados intentos. Espera quince minutos.'});
    if(typeof body.username!=='string'||typeof body.password!=='string'||body.password.length>256)return send(400,{error:'Revisa tus credenciales.'});
    const user=users.find(u=>u.username.toLowerCase()===body.username.trim().toLowerCase());
    const matches=await passwordMatches(body.password,user||users[0]);
    if(!user||!matches){attempts.set(ip,{count:(prior?.count||0)+1,until:prior?.until||now+900000});return send(401,{error:'Usuario o contraseña incorrectos.'})}
    attempts.delete(ip);const token=randomBytes(32).toString('hex');sessions.set(hash(token),{username:user.username,expires:now+8*3600000});res.setHeader('Set-Cookie',cookie(token,8*3600));return send(200,{user:publicUser(user)});
   }
   if(url.pathname==='/api/member/logout'&&req.method==='POST'){if(current)sessions.delete(current.key);res.setHeader('Set-Cookie',cookie('',0));return send(200,{ok:true})}
   if(url.pathname==='/api/practice'&&req.method==='GET'){
    const data=await readCatalog();const quiz=data.publications.filter(q=>q.code===url.searchParams.get('code')?.toUpperCase()).at(-1);
    if(!quiz||(data.archivedQuizIds??[]).includes(quiz.id)||(!quiz.game?.enabled&&quiz.id.startsWith('sc26-')))return send(404,{error:'No hay una práctica habilitada con ese código.'});return send(200,quiz);
   }
   if(!current)return send(401,{error:'Inicia sesión como miembro GADEST.'});
   if(url.pathname==='/api/member/password'&&req.method==='POST'){
    if(typeof body.current!=='string'||typeof body.password!=='string'||body.current.length>256||body.password.length<8||body.password.length>128)return send(400,{error:'Usa una contraseña nueva de 8 a 128 caracteres.'});
    if(!await passwordMatches(body.current,current.user))return send(403,{error:'La contraseña actual no coincide.'});
    if(body.current===body.password)return send(400,{error:'Elige una contraseña diferente.'});
    Object.assign(current.user,await passwordHash(body.password),{temporary:false});await saveUsers();
    for(const [key,s] of sessions)if(s.username===current.username&&key!==current.key)sessions.delete(key);
    return send(200,{user:publicUser(current.user)});
   }
   if(url.pathname==='/api/member/catalog'&&req.method==='GET')return send(200,await readCatalog());
   if(url.pathname==='/api/member/catalog'&&req.method==='PUT'){
    if(!Array.isArray(body.drafts)||!Array.isArray(body.publications)||body.drafts.length>100||body.publications.length>1000||(body.archivedQuizIds!==undefined&&(!Array.isArray(body.archivedQuizIds)||body.archivedQuizIds.length>100||body.archivedQuizIds.some(id=>typeof id!=='string'))))return send(400,{error:'Biblioteca no válida.'});
    if(body.publications.some(q=>validateQuiz(q).length))return send(400,{error:'Hay una publicación con preguntas no válidas.'});
    const write=async()=>{const previous=await readCatalog();if((body.serverRevision||0)!==(previous.serverRevision||0)){const error=new Error('Otro miembro guardó cambios. Exporta tu borrador y recarga la biblioteca antes de continuar.');error.status=409;throw error}body.serverRevision=(previous.serverRevision||0)+1;await writeFile(catalogFile+'.tmp',JSON.stringify(body),{mode:0o600});await rename(catalogFile+'.tmp',catalogFile)};
    saving=saving.catch(()=>{}).then(write);await saving;return send(200,{ok:true,serverRevision:body.serverRevision});
   }
   return send(404,{error:'Ruta no disponible.'});
  }catch(error){console.error('API miembros:',error.message);if(!res.headersSent)send(error.status||400,{error:error.status===409?error.message:'No se pudo completar la operación. Revisa los datos e inténtalo otra vez.'});else res.end()}
 }
}
