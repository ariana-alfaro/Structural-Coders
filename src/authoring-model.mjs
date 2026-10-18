export function validateQuiz(quiz){
 const issues=[];
 if(!quiz.title.trim())issues.push('Escribe el nombre del cuestionario.');
 if(!quiz.course.trim()||!quiz.cycle.trim())issues.push('Completa el curso y el ciclo.');
 if(!/^[A-Z0-9]{6}$/.test(quiz.code))issues.push('El código debe tener seis letras o números.');
 if(!quiz.questions.length)issues.push('Agrega al menos una pregunta.');
 if(quiz.questions.length>100)issues.push('El máximo es 100 preguntas por cuestionario.');
 quiz.questions.forEach((q,i)=>{
  const at=`Pregunta ${i+1}: `;
  if(!q.title.trim()||!q.brief.trim())issues.push(at+'completa el título y las instrucciones.');
  if(!q.explanation.trim())issues.push(at+'escribe una explicación para el estudiante.');
  if(!Number.isFinite(q.points)||q.points<=0||q.points>100)issues.push(at+'el peso debe ser mayor que 0 y como máximo 100.');
  if(q.type==='input'){if(typeof q.solution!=='string'||!q.solution.trim())issues.push(at+'indica la salida correcta.');return}
  const expected=q.type==='boolean'?2:q.type==='order'?null:4;
  if(expected!==null&&q.options.length!==expected)issues.push(at+`debe tener ${expected} alternativas.`);
  if(q.options.some(s=>!s.trim())||new Set(q.options).size!==q.options.length)issues.push(at+'las alternativas o líneas deben ser distintas y no estar vacías.');
  if(q.type==='order'){
   if(q.options.length<3||q.options.length>5)issues.push(at+'ordena entre tres y cinco líneas.');
   if(!Array.isArray(q.solution)||JSON.stringify([...q.solution].sort((a,b)=>a-b))!==JSON.stringify(q.options.map((_,j)=>j)))issues.push(at+'el orden correcto debe incluir cada línea una sola vez.');
  }else if(!Number.isInteger(q.solution)||q.solution<0||q.solution>=q.options.length)issues.push(at+'selecciona una respuesta correcta.');
  if(q.type==='blank'&&(q.code?.match(/___/g)||[]).length!==1)issues.push(at+'incluye exactamente un espacio ___ en el código.');
 });return issues;
}
export function quizScore(quiz,answers){const total=quiz.questions.reduce((s,q)=>s+q.points,0);const earned=quiz.questions.reduce((s,q)=>s+(answers.some(a=>a.id===q.id&&a.correct)?q.points:0),0);return total?Math.round(earned/total*200)/10:0}
export function matchesAnswer(q,value){return JSON.stringify(q.solution)===JSON.stringify(typeof value==='string'?value.trim():value)}
export function preparePublication(draft,revision,rng=Math.random){const issues=validateQuiz(draft);if(issues.length)throw new Error(issues.join('\n'));const copy=structuredClone(draft);copy.questions=copy.questions.map((q,i)=>{
 if(q.type!=='order')return {...q,id:i+1};
 const correct=q.solution.map(idx=>q.options[idx]);const options=[...correct];for(let j=options.length-1;j>0;j--){const k=Math.floor(rng()*(j+1));[options[j],options[k]]=[options[k],options[j]]}
 if(options.every((s,j)=>s===correct[j]))options.reverse();return {...q,id:i+1,options,solution:correct.map(s=>options.indexOf(s))};
 });return {...copy,revision,publishedAt:new Date().toISOString()};}
