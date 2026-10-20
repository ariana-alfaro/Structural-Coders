// Estadísticas por pregunta de las evaluaciones individuales: qué porcentaje falla cada una.
// Agrupa por cuestionario y versión, porque una versión nueva puede cambiar las preguntas.
export function questionStats(rows){
 const groups=new Map();
 for(const r of rows){
  if(!Array.isArray(r.questions)||!Array.isArray(r.marks))continue;
  const key=`${r.quizId}@${r.revision}`;
  if(!groups.has(key))groups.set(key,{quizId:r.quizId,revision:r.revision,title:r.quizTitle,attempts:0,questions:r.questions.map(q=>({...q,answered:0,wrong:0}))});
  const g=groups.get(key);g.attempts++;
  r.marks.forEach((m,i)=>{const q=g.questions[i];if(!q||m===null||m===undefined)return;q.answered++;if(!m)q.wrong++});
 }
 return [...groups.values()].map(g=>({...g,questions:g.questions.map((q,i)=>({...q,position:i+1,failRate:q.answered?Math.round(q.wrong/q.answered*100):null}))})).sort((a,b)=>b.revision-a.revision);
}
