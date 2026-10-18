// Eliminar retira el cuestionario de circulación; conserva sus preguntas y publicaciones para restaurarlo.
export const archivedQuiz=(data,id)=>(data.archivedQuizIds??[]).includes(id);
export function archiveQuiz(data,id){if(!data.drafts.some(q=>q.id===id))throw new Error('No se encontró el cuestionario.');return {...data,archivedQuizIds:[...new Set([...(data.archivedQuizIds??[]),id])]}}
export function restoreQuiz(data,id){return {...data,archivedQuizIds:(data.archivedQuizIds??[]).filter(value=>value!==id)}}
export function usableLocalResults(raw){
 try{const rows=JSON.parse(raw||'[]');if(!Array.isArray(rows))return [];return rows.filter(r=>r&&typeof r.name==='string'&&Number.isFinite(r.score)&&Number.isFinite(r.elapsed)&&typeof r.finished==='string'&&Number.isFinite(Date.parse(r.finished))).sort((a,b)=>b.score-a.score||a.elapsed-b.elapsed)}catch{return []}
}
