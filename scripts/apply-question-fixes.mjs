// Aplica los enunciados de scripts/question-fixes.mjs a una biblioteca ya cargada y publica una versión nueva
// de cada taller afectado. Solo toca los cuestionarios del equipo (sin autor) y solo enunciados que siguen
// con el texto original; nunca cambia copias de miembros ni enunciados editados a mano.
// Uso:  node scripts/apply-question-fixes.mjs                       → revisa .private/catalog.json (sin escribir)
//       node scripts/apply-question-fixes.mjs --apply               → escribe .private/catalog.json
//       node --env-file=.env.cloud.local scripts/apply-question-fixes.mjs --cloud [--apply]   → Supabase
import {readFile,writeFile,rename} from 'node:fs/promises';
import {preparePublication,validateQuiz} from '../src/authoring-model.mjs';
import {questionFixes} from './question-fixes.mjs';

const apply=process.argv.includes('--apply'),cloud=process.argv.includes('--cloud');
const original=new Set(['Ordena las líneas para obtener un programa válido. Conserva la sangría.','Arrastra al hueco la pieza que completa el código.']);

function update(data){
 const notes=[],drafts=data.drafts.map(d=>{
  const fixes=questionFixes[d.code];if(d.owner||!fixes)return d;
  let changed=0;const questions=d.questions.map(q=>{const brief=fixes[q.id];if(!brief||q.brief===brief)return q;if(!original.has(q.brief)){notes.push(`  ${d.code} #${q.id}: se omite, el enunciado ya fue editado`);return q}changed++;return {...q,brief}});
  if(!changed)return d;notes.push(`  ${d.code}: ${changed} enunciado(s)`);return {...d,questions,updatedAt:new Date().toISOString()};
 });
 const publications=[...data.publications];
 for(const d of drafts){
  const before=data.drafts.find(x=>x.id===d.id);if(d===before)continue;
  const latest=publications.filter(p=>p.id===d.id).sort((a,b)=>b.revision-a.revision)[0];if(!latest)continue;
  if(validateQuiz(d).length){notes.push(`  ${d.code}: borrador incompleto, no se publica una versión nueva`);continue}
  publications.push({...preparePublication(d,latest.revision+1),...(latest.visibility?{visibility:latest.visibility}:{})});
  notes.push(`  ${d.code}: versión ${latest.revision+1} ${apply?'publicada':'se publicaría'}`);
 }
 return {data:{...data,drafts,publications},notes};
}

if(cloud){
 const {createClient}=await import('@supabase/supabase-js');
 const {SUPABASE_URL,SUPABASE_SECRET_KEY}=process.env;if(!SUPABASE_URL||!SUPABASE_SECRET_KEY)throw new Error('Configura .env.cloud.local y ejecuta con --env-file.');
 const db=createClient(SUPABASE_URL,SUPABASE_SECRET_KEY,{auth:{persistSession:false}});
 const {data:row,error}=await db.from('sc_web_catalog').select('revision,data').eq('id',1).maybeSingle();if(error||!row)throw new Error('No se pudo leer la biblioteca de Supabase.');
 const {data,notes}=update(row.data);console.log(notes.length?notes.join('\n'):'  Nada que cambiar.');
 if(apply&&notes.length){const saved=await db.rpc('sc_web_save_catalog',{p_revision:row.revision,p_data:data});if(saved.error||saved.data===null)throw new Error('Otro miembro guardó cambios a la vez. Vuelve a ejecutar.');console.log('Guardado en Supabase.')}
}else{
 const file=new URL('../.private/catalog.json',import.meta.url);const raw=JSON.parse(await readFile(file,'utf8'));
 const {data,notes}=update(raw);console.log(notes.length?notes.join('\n'):'  Nada que cambiar.');
 if(apply&&notes.length){const tmp=new URL('../.private/catalog.json.tmp',import.meta.url);await writeFile(tmp,JSON.stringify({...data,serverRevision:(raw.serverRevision||0)+1}),{mode:0o600});await rename(tmp,file);console.log('Guardado en .private/catalog.json.')}
}
if(!apply)console.log('Revisión sin cambios. Añade --apply para guardar.');
