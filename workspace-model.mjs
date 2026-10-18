import {isDeepStrictEqual} from 'node:util';
const fail=(message,status=403)=>{throw Object.assign(new Error(message),{status})};
export const canEditQuiz=(quiz,username)=>!!quiz&&(!quiz.owner||quiz.owner===username);
export const sharedQuiz=quiz=>!quiz.owner||quiz.visibility==='group';
export function visibleCatalog(data,username){
 const drafts=data.drafts.filter(q=>canEditQuiz(q,username)||(sharedQuiz(q)&&!(data.archivedQuizIds??[]).includes(q.id)));
 const ids=new Set(drafts.map(q=>q.id));
 return structuredClone({...data,drafts,publications:data.publications.filter(q=>ids.has(q.id)),archivedQuizIds:(data.archivedQuizIds??[]).filter(id=>ids.has(id)),memberUsername:username});
}
export function mergeWorkspace(previous,incoming,username){
 const prior=new Map(previous.drafts.map(q=>[q.id,q]));
 const requested=incoming.deletedQuizIds??[],deleted=[...new Set([...(previous.deletedQuizIds??[]),...requested])];
 const archived=new Set(previous.archivedQuizIds??[]),incomingArchived=new Set(incoming.archivedQuizIds??[]);
 const draftIds=new Set();
 for(const q of incoming.drafts){
  if(!q||typeof q.id!=='string'||draftIds.has(q.id))fail('Biblioteca no válida.',400);
  draftIds.add(q.id);
  if(deleted.includes(q.id))fail('Un cuestionario fue eliminado definitivamente. Recarga la biblioteca.',409);
  const old=prior.get(q.id);
  if(old&&!canEditQuiz(old,username)){
   if(!sharedQuiz(old)||archived.has(old.id)||!isDeepStrictEqual(old,q)||incomingArchived.has(q.id)!==archived.has(q.id))fail('Solo el autor puede modificar este cuestionario. Puedes crear una copia.');
  }else if(old&&q.owner!==old.owner)fail('No puedes cambiar el autor de un cuestionario.');
  else if(!old&&q.owner&&q.owner!==username)fail('No puedes crear cuestionarios a nombre de otro miembro.');
 }
 for(const id of requested){
  if((previous.deletedQuizIds??[]).includes(id))continue;
  if(!canEditQuiz(prior.get(id),username)||!archived.has(id)||draftIds.has(id)||incoming.publications.some(p=>p.id===id))fail('Solo puedes borrar definitivamente tus cuestionarios de la papelera.');
 }
 for(const q of previous.drafts)if(canEditQuiz(q,username)&&!draftIds.has(q.id)&&!deleted.includes(q.id))fail('Envía el cuestionario a la papelera antes de eliminarlo.',400);
 const editable=incoming.drafts.filter(q=>!prior.has(q.id)||canEditQuiz(prior.get(q.id),username)).map(q=>{
  const old=prior.get(q.id),owner=old?old.owner:username;
  if(q.visibility!==undefined&&!['private','group'].includes(q.visibility))fail('Visibilidad no válida.',400);
  return {...q,...(owner?{owner}:{}),visibility:owner?(q.visibility??'private'):'group'};
 });
 const ownedIds=new Set(editable.map(q=>q.id));
 const drafts=[...previous.drafts.filter(q=>!canEditQuiz(q,username)),...editable];
 // Los códigos son únicos también entre espacios privados; nunca revelamos su contenido.
 const codeOwners=new Map();
 for(const p of previous.publications)if(!deleted.includes(p.id))codeOwners.set(p.code,p.id);
 for(const q of drafts){const other=codeOwners.get(q.code);if(other&&other!==q.id)fail('Ese código ya está ocupado. Elige otro.',409);codeOwners.set(q.code,q.id)}
 const publications=[];
 for(const p of incoming.publications){
  const old=prior.get(p.id);
  if(ownedIds.has(p.id)){
   if(deleted.includes(p.id))fail('Publicación eliminada.',409);
   const draft=editable.find(q=>q.id===p.id);
   const other=codeOwners.get(p.code);if(other&&other!==p.id)fail('Ese código ya está ocupado. Elige otro.',409);codeOwners.set(p.code,p.id);
   publications.push({...p,...(draft.owner?{owner:draft.owner}:{}),visibility:draft.visibility});
  }else{
   const existing=previous.publications.find(q=>q.id===p.id&&q.revision===p.revision);
   if(!old||!sharedQuiz(old)||archived.has(old.id)||!existing||!isDeepStrictEqual(existing,p))fail('No puedes modificar publicaciones de otro miembro.');
  }
 }
 for(const id of incomingArchived)if(!ownedIds.has(id)&&!archived.has(id))fail('No puedes enviar cuestionarios ajenos a la papelera.');
 return {...previous,drafts,publications:[...previous.publications.filter(p=>!canEditQuiz(prior.get(p.id),username)),...publications],archivedQuizIds:[...new Set([...(previous.archivedQuizIds??[]).filter(id=>!canEditQuiz(prior.get(id),username)),...[...incomingArchived].filter(id=>ownedIds.has(id))])],deletedQuizIds:deleted};
}
