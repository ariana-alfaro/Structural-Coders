import {useState,useEffect} from 'react';
import {LayoutDashboard,BarChart3,ArrowRight,ArrowLeft,Download,Users,GraduationCap,Target,Layers,Radio} from 'lucide-react';
import {LiveHost} from './LiveHost';
import {CycleExport} from './CycleExport';
import {PanelBoundary} from './PanelBoundary';
import type {SessionData} from './cycle-excel';
import {live,type Result,type Session} from './service';
import {Authoring} from './QuizStudio';
import {catalog} from './authoring';
import {archivedQuiz,usableLocalResults} from './member-model.mjs';

type Tab='overview'|'results'|'quizzes'|'live';
function localResults():Result[]{return live?[]:usableLocalResults(localStorage.getItem('sc-results-v2'))}
export function Teacher({onStudent}:{onStudent:(code?:string)=>void}){
 const [tab,setTab]=useState<Tab>(()=>sessionStorage.getItem('sc-vivo-host')?'live':'quizzes');
 const [query,setQuery]=useState(''),[quizFilter,setQuizFilter]=useState(''),[notice,setNotice]=useState('');
 const [libraryStats,setLibraryStats]=useState({questions:0,quizzes:0});
 useEffect(()=>{catalog().then(data=>{const active=data.drafts.filter(q=>!archivedQuiz(data,q.id));setLibraryStats({questions:active.reduce((sum,d)=>sum+d.questions.length,0),quizzes:active.length})}).catch(()=>{})},[tab]);
 const rows=localResults(),filtered=rows.filter(r=>r.name.toLocaleLowerCase().includes(query.toLocaleLowerCase())&&(!quizFilter||(r.quizTitle||'Fundamentos de Python')===quizFilter));
 const mean=rows.length?rows.reduce((sum,r)=>sum+r.score,0)/rows.length:0;
 const positionOf=(result:Result)=>rows.filter(r=>(r.quizId??'python-fundamentos')===(result.quizId??'python-fundamentos')&&(r.revision??1)===(result.revision??1)).indexOf(result)+1;
 function navigate(next:Tab){setTab(next);setNotice('');window.scrollTo({top:0,behavior:'instant'})}
 function individualSession():SessionData|null{
  const chosen=rows.filter(r=>(r.quizTitle||'Fundamentos de Python')===quizFilter);if(!chosen.length)return null;
  let attempts:Record<string,Session>={};try{attempts=JSON.parse(localStorage.getItem('sc-attempts-v3')||'{}')}catch{}
  const first=chosen[0];
  return {id:`individual-${first.quizId??'python-fundamentos'}-v${first.revision??1}`,title:quizFilter,quizTitle:quizFilter,mode:'Individual',date:new Date(),rows:chosen.map(r=>{const a=attempts[(r as Result&{token?:string}).token??''],qs=a?.quiz?.questions??[];return {code:a?.student??'',name:r.name,correct:r.correctCount??r.score/2,total:r.total??10,grade:r.score,seconds:Math.round(r.elapsed/100)/10,position:positionOf(r),date:new Date(r.finished),marks:qs.map(q=>{const answer=a!.answers.find(x=>x.id===q.id);return answer?answer.correct:null})}})};
 }
 function exportCSV(){
  const cell=(value:unknown)=>{let s=String(value);if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"'};
  const csv='\uFEFF'+[['Curso','Ciclo','Cuestionario','Aspirante','Aciertos','Preguntas','Nota','Posición','Tiempo (s)','Fecha'],...filtered.map(r=>[r.course||'Structural Coders',r.cycle||'2026-1',r.quizTitle||'Fundamentos de Python',r.name,r.correctCount??r.score/2,r.total??10,r.score,positionOf(r),(r.elapsed/1000).toFixed(1),r.finished])].map(row=>row.map(cell).join(';')).join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download='structural-coders-resultados.csv';a.click();URL.revokeObjectURL(url);setNotice('Reporte CSV descargado.');
 }
 return <div className="teacher">
  <div className="teacherintro"><div><span className="eyebrow">ESPACIO MIEMBRO GADEST</span><h1>Enseñar también es construir<span>.</span></h1><p>Crea talleres, prepara tus cuestionarios y acompaña a los aspirantes.</p></div><span className="teacheravatar"><GraduationCap size={21}/> Miembro GADEST <small>Panel de gestión</small></span></div>
  <div className="teachertabs" role="tablist" aria-label="Secciones del panel de miembros GADEST">{([['overview','Vista general',LayoutDashboard],['quizzes','Mis cuestionarios',Layers],['live','Organizar partida en vivo',Radio],['results','Resultados',BarChart3]] as const).map(([id,label,Icon])=><button key={id} id={`tab-${id}`} role="tab" aria-selected={tab===id} aria-controls={`panel-${id}`} onClick={()=>navigate(id)}><Icon size={17}/>{label}</button>)}</div>
  <PanelBoundary key={tab} onBack={()=>navigate('quizzes')}><section role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
   {tab==='live'?<LiveHost/>:tab==='quizzes'?<Authoring onStudent={onStudent} onHost={id=>{sessionStorage.setItem('sc-live-selected',id);navigate('live')}}/>:tab==='overview'?<>
    <div className="teacherstats"><article><Users size={21}/><span>Evaluaciones finalizadas</span><strong>{rows.length}</strong><small>Guardadas en este navegador</small></article><article><GraduationCap size={21}/><span>Promedio de notas</span><strong>{rows.length?mean.toFixed(1):'—'}<small>/20</small></strong><small>Evaluaciones individuales</small></article><article><Layers size={21}/><span>Retos en biblioteca</span><strong>{libraryStats.questions}</strong><small>{libraryStats.quizzes} cuestionarios disponibles</small></article><article><Target size={21}/><span>Nota máxima</span><strong>20</strong><small>Ponderación configurable</small></article></div>
    <section className="teacherresults"><h2>Prepara el siguiente taller</h2><p>Elige un cuestionario de tu biblioteca o abre una partida para el grupo.</p><div className="memberquickactions"><button className="primary" onClick={()=>navigate('quizzes')}>Mis cuestionarios <ArrowRight size={16}/></button><button className="secondary" onClick={()=>navigate('live')}>Organizar partida en vivo</button><button className="secondary" onClick={()=>navigate('results')}>Ver resultados</button></div></section>
   </>:<section className="teacherresults">
    <button className="textaction resultsback" onClick={()=>navigate('quizzes')}><ArrowLeft size={16}/> Volver a mis cuestionarios</button>
    <div className="bankheading"><div><h2>Resultados del recorrido</h2><p>Evaluaciones individuales guardadas en este navegador.</p></div><button className="primary" disabled={!filtered.length} onClick={exportCSV}><Download size={16}/> Descargar CSV</button></div>
    <p className="resultscope">Los resultados de las partidas en vivo se descargan desde el podio de cada partida. Aún no hay un historial compartido de partidas en esta sección.</p>
    {quizFilter?<CycleExport key={quizFilter} defaultTitle={quizFilter} session={individualSession}/>:rows.length>0&&<p className="teacherempty">Elige un cuestionario para agregarlo al Excel del ciclo.</p>}
    <label className="teachersearch">Buscar participante<input placeholder="Escribe un nombre…" value={query} onChange={e=>setQuery(e.target.value)}/></label>
    <label className="teachersearch">Filtrar por cuestionario<select value={quizFilter} onChange={e=>setQuizFilter(e.target.value)}><option value="">Todos los cuestionarios</option>{Array.from(new Set(rows.map(r=>r.quizTitle||'Fundamentos de Python'))).map(title=><option key={title}>{title}</option>)}</select></label>
    <div className="tablewrap"><table><thead><tr><th>Posición</th><th>Participante</th><th>Cuestionario</th><th>Aciertos</th><th>Nota</th><th>Tiempo</th></tr></thead><tbody>{filtered.map((r,i)=><tr key={i}><td>#{positionOf(r)}</td><td>{r.name}</td><td>{r.quizTitle||'Fundamentos de Python'}</td><td>{r.correctCount??r.score/2}/{r.total??10}</td><td><b>{r.score}/20</b></td><td>{(r.elapsed/1000).toFixed(1)} s</td></tr>)}</tbody></table>{!filtered.length&&<p className="teacherempty">{query||quizFilter?'No hay resultados que coincidan con estos filtros.':'Todavía no hay evaluaciones individuales finalizadas en este navegador.'}</p>}</div>
    <button className="secondary resultsback" onClick={()=>navigate('quizzes')}><ArrowLeft size={16}/> Volver a mis cuestionarios</button>
   </section>}
  </section></PanelBoundary>
  {notice&&<div className="teachernotice" role="status">{notice}<button onClick={()=>setNotice('')}>Cerrar</button></div>}
 </div>;
}
