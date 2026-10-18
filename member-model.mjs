// Eliminar retira el cuestionario de circulación; conserva sus preguntas y publicaciones para restaurarlo.
export const archivedQuiz=(data,id)=>(data.archivedQuizIds??[]).includes(id);
export function archiveQuiz(data,id){if(!data.drafts.some(q=>q.id===id))throw new Error('No se encontró el cuestionario.');return {...data,archivedQuizIds:[...new Set([...(data.archivedQuizIds??[]),id])]}}
export function restoreQuiz(data,id){return {...data,archivedQuizIds:(data.archivedQuizIds??[]).filter(value=>value!==id)}}
export function usableLocalResults(raw){
 try{const rows=JSON.parse(raw||'[]');if(!Array.isArray(rows))return [];return rows.filter(r=>r&&typeof r.name==='string'&&Number.isFinite(r.score)&&Number.isFinite(r.elapsed)&&typeof r.finished==='string'&&Number.isFinite(Date.parse(r.finished))).sort((a,b)=>b.score-a.score||a.elapsed-b.elapsed)}catch{return []}
}

export function permanentlyDeleteQuiz(data,id,confirmation){
 const quiz=data.drafts.find(q=>q.id===id);
 if(!quiz||!archivedQuiz(data,id))throw new Error('Solo puedes eliminar definitivamente un cuestionario de la papelera.');
 if(confirmation!==quiz.title)throw new Error('Escribe el nombre exacto del cuestionario para confirmar.');
 return {...data,drafts:data.drafts.filter(q=>q.id!==id),publications:data.publications.filter(q=>q.id!==id),archivedQuizIds:(data.archivedQuizIds??[]).filter(value=>value!==id),deletedQuizIds:[...new Set([...(data.deletedQuizIds??[]),id])]};
}
