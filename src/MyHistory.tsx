import {useEffect,useState} from 'react';
import {ClipboardList,Radio,Gamepad2,RotateCcw,Trash2,History as HistoryIcon} from 'lucide-react';
import {readHistory,clearHistory,type History} from './my-history.mjs';
import {evalHistory,type HistoryEval} from './service';
import {liveGrade} from './live-history.mjs';
const date=(iso?:string)=>iso?new Date(iso).toLocaleString('es-PE',{dateStyle:'medium',timeStyle:'short'}):'';

// Historial del aspirante en este dispositivo: evaluaciones (confirmadas por el servidor), partidas en vivo y prácticas.
export function MyHistory({onResume}:{onResume:(token:string)=>void}){
 const [history,setHistory]=useState<History>(readHistory),[evals,setEvals]=useState<HistoryEval[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{let alive=true;evalHistory(history.evals).then(r=>{if(alive){setEvals(r);setError('')}}).catch(e=>{if(alive)setError(e instanceof Error?e.message:'No se pudieron cargar tus evaluaciones.')}).finally(()=>{if(alive)setLoading(false)});return()=>{alive=false}},[history.evals.join()]);
 const empty=!history.evals.length&&!history.live.length&&!history.practices.length;
 return <div className="myhistory">
  <div className="myhistoryhead"><span className="sectionicon"><HistoryIcon size={22}/></span><div><h1>Mi historial</h1><p>Tus evaluaciones, partidas en vivo y prácticas hechas <b>en este dispositivo</b>. Por privacidad no se busca por código universitario: así nadie puede ver tus notas.</p></div></div>
  {empty?<p className="teacherempty">Todavía no hay actividad en este dispositivo. Cuando termines una evaluación, una partida en vivo o una práctica, aparecerá aquí.</p>:<>
  <section className="resultsblock"><header><span className="sectionicon"><ClipboardList size={18}/></span><div><h3>Evaluaciones</h3><small>Nota sobre 20, confirmada por el servidor</small></div></header>
   {loading?<p className="teacherempty">Cargando…</p>:error?<p className="teacherempty" role="alert">{error}</p>:!evals.length?<p className="teacherempty">Sin evaluaciones en este dispositivo.</p>:
   <div className="tablewrap"><table><thead><tr><th>Cuestionario</th><th>Fecha</th><th>Aciertos</th><th>Nota</th><th>Posición</th></tr></thead><tbody>{evals.map(e=><tr key={e.token}><td>{e.title}<small className="cellnote">{e.name}</small></td><td>{date(e.finished??e.started)}</td>{e.status==='finished'?<><td>{e.correctCount}/{e.total}</td><td><b>{e.score}/20</b></td><td>#{e.position} de {e.of}</td></>:<td colSpan={3}><button className="secondary" onClick={()=>onResume(e.token)}><RotateCcw size={14}/> Continuar ({e.answered}/{e.total} respondidas)</button></td>}</tr>)}</tbody></table></div>}
  </section>
  <section className="resultsblock"><header><span className="sectionicon"><Radio size={18}/></span><div><h3>Partidas en vivo</h3><small>Puntos del juego y nota por aciertos (no es nota oficial)</small></div></header>
   {!history.live.length?<p className="teacherempty">Sin partidas en vivo en este dispositivo.</p>:<div className="tablewrap"><table><thead><tr><th>Partida</th><th>Fecha</th><th>Puesto</th><th>Puntos</th><th>Aciertos</th><th>Nota</th></tr></thead><tbody>{history.live.map(l=><tr key={l.key}><td>{l.title}</td><td>{date(l.finished)}</td><td>#{l.position} de {l.of}</td><td>{l.score}</td><td>{l.correct}/{l.total}</td><td>{liveGrade(l.correct,l.total)}/20</td></tr>)}</tbody></table></div>}
  </section>
  <section className="resultsblock"><header><span className="sectionicon"><Gamepad2 size={18}/></span><div><h3>Prácticas</h3><small>Repasos tipo juego; no cambian ninguna nota</small></div></header>
   {!history.practices.length?<p className="teacherempty">Sin prácticas en este dispositivo.</p>:<div className="tablewrap"><table><thead><tr><th>Práctica</th><th>Fecha</th><th>Apodo</th><th>Puntos</th><th>Aciertos</th></tr></thead><tbody>{history.practices.map((p,i)=><tr key={i}><td>{p.title}</td><td>{date(p.finished)}</td><td>{p.nick}</td><td>{p.score.toLocaleString('es')}</td><td>{p.correct}/{p.total}</td></tr>)}</tbody></table></div>}
  </section>
  <button className="resumebtn" onClick={()=>{if(confirm('¿Borrar el historial de este dispositivo? Tus notas siguen registradas en el servidor, pero ya no las verás aquí.'))setHistory(clearHistory())}}><Trash2 size={15}/> Borrar historial de este dispositivo</button></>}
 </div>;
}
