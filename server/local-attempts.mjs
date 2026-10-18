// Almacenamiento de evaluaciones para el servidor local (npm start, Vite o túnel): un archivo JSON privado.
import {readFile,writeFile,rename} from 'node:fs/promises';
export function fileAttemptStore(file,loadCatalog){
 let loading=null,writing=Promise.resolve();const limits=new Map();
 const load=()=>loading??=readFile(file,'utf8').then(JSON.parse,e=>{if(e.code==='ENOENT')return [];throw e});
 const persist=rows=>{const snapshot=JSON.stringify(rows);writing=writing.catch(()=>{}).then(async()=>{await writeFile(file+'.tmp',snapshot,{mode:0o600});await rename(file+'.tmp',file)});return writing};
 const copy=v=>v==null?null:structuredClone(v);
 return {
  loadCatalog,
  getAttempt:async h=>copy((await load()).find(r=>r.token_hash===h)),
  findAttempt:async(id,rev,key)=>copy((await load()).find(r=>r.quiz_id===id&&r.revision===rev&&r.student_key===key)),
  async insertAttempt(row){const rows=await load();if(rows.some(r=>r.token_hash===row.token_hash||(r.quiz_id===row.quiz_id&&r.revision===row.revision&&r.student_key===row.student_key)))return false;rows.push(copy(row));await persist(rows);return true},
  async updateAttempt(h,version,patch){const rows=await load(),row=rows.find(r=>r.token_hash===h&&r.version===version);if(!row)return false;Object.assign(row,copy(patch));await persist(rows);return true},
  finishedAttempts:async(id,rev)=>copy((await load()).filter(r=>r.quiz_id===id&&r.revision===rev&&r.finished_at)),
  attemptsFor:async ids=>copy((await load()).filter(r=>ids.includes(r.quiz_id))),
  async limit(key,max){const now=Date.now();for(const [k,v] of limits)if(v.until<now)limits.delete(k);const entry=limits.get(key);if(!entry){limits.set(key,{count:1,until:now+900000});return true}entry.count++;return entry.count<=max},
 };
}
