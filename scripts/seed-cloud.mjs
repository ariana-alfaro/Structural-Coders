// Ejecutar localmente: node --env-file=.env.cloud.local scripts/seed-cloud.mjs
// Nunca imprime hashes ni claves. No restablece cuentas ni sobrescribe la biblioteca existente.
import {readFile} from 'node:fs/promises';
import {createClient} from '@supabase/supabase-js';
import {preparePublication,validateQuiz} from '../src/authoring-model.mjs';
const {SUPABASE_URL,SUPABASE_SECRET_KEY}=process.env;
if(!SUPABASE_URL||!SUPABASE_SECRET_KEY)throw new Error('Configura SUPABASE_URL y SUPABASE_SECRET_KEY en el archivo local ignorado .env.cloud.local.');
const db=createClient(SUPABASE_URL,SUPABASE_SECRET_KEY,{auth:{persistSession:false}});
const check=({data,error})=>{if(error)throw new Error('Supabase rechazó la operación. Comprueba que ejecutaste 005_cloud_web.sql y que la clave del servidor es correcta.');return data};
const users=JSON.parse(await readFile(new URL('../.private/members.json',import.meta.url),'utf8'));
const required=['Renzo','Ariana'].map(name=>users.find(u=>u.username===name));
if(required.some(u=>!u||u.temporary))throw new Error('Antes de publicar, Renzo y Ariana deben cambiar su contraseña temporal en la aplicación local. No se copiará GADEST a internet.');
for(const user of required){
 const existing=check(await db.from('sc_web_members').select('username').eq('username',user.username).maybeSingle());
 if(!existing)check(await db.from('sc_web_members').insert({...user,username_key:user.username.toLowerCase()}));
}
const existing=check(await db.from('sc_web_catalog').select('id').eq('id',1).maybeSingle());
if(!existing){
 let catalog;try{catalog=JSON.parse(await readFile(new URL('../.private/catalog.json',import.meta.url),'utf8'))}catch(e){if(e.code!=='ENOENT')throw e;const bank=JSON.parse(await readFile(new URL('../content/workshops.json',import.meta.url),'utf8'));catalog={drafts:bank.quizzes,publications:bank.quizzes.map(q=>preparePublication(q,1))}}
 if(catalog.publications.some(q=>validateQuiz(q).length))throw new Error('Revisa los cuestionarios publicados antes de migrarlos.');
 check(await db.from('sc_web_catalog').insert({id:1,revision:0,data:{drafts:catalog.drafts,publications:catalog.publications}}));
 console.log(`Biblioteca copiada: ${catalog.drafts.length} cuestionarios.`);
}else console.log('Se conservó la biblioteca que ya existe en Supabase.');
console.log('Cuentas preparadas. Las contraseñas existentes en Supabase se conservaron.');
