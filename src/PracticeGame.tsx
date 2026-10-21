import {Avatar,AvatarPicker} from './Avatar';
import {preferredAvatar,rememberAvatar} from './avatars.mjs';
import {useEffect,useState} from 'react';
import {Zap,Scissors,Snowflake,Shield,Flame,Trophy,Timer,Check,X,ArrowRight,RotateCcw,Gamepad2,Hourglass,Gift} from 'lucide-react';
import type {QuizSnapshot} from './authoring';
import {createRun,usable,usePowerup,answerQuestion,advanceRun,rankAt,leaderboard,recordOf,powerupInfo,type Run,type RoundResult,type Powerup,type PracticeRecord,type Value} from './practice-model.mjs';
import {Code} from './Code';
import {SortCode,ConsoleAnswer} from './QuestionControls';
import {Shape} from './LiveParts';
import './live.css';
import './practice.css';

const storeKey='sc-practice-v1',icons:Record<Powerup,typeof Zap>={doble:Zap,mitad:Scissors,congelar:Snowflake,escudo:Shield};
function loadRecords():PracticeRecord[]{try{const list=JSON.parse(localStorage.getItem(storeKey)||'[]');return Array.isArray(list)?list:[]}catch{return []}}
function saveRecord(record:PracticeRecord){const all=[...loadRecords(),record];const mine=all.filter(r=>r.quizId===record.quizId&&r.revision===record.revision);const keep=new Set(mine.sort((a,b)=>b.score-a.score).slice(0,200));const next=all.filter(r=>r.quizId!==record.quizId||r.revision!==record.revision||keep.has(r));try{localStorage.setItem(storeKey,JSON.stringify(next))}catch{}return next}

export function PracticeGame({quiz,nick:initialNick,onExit}:{quiz:QuizSnapshot;nick:string;onExit:()=>void}){
 const total=quiz.questions.length;
 const [avatar,setAvatar]=useState(preferredAvatar);
 const [nick,setNick]=useState(initialNick.trim().slice(0,20)),[run,setRun]=useState<Run|null>(null),[phase,setPhase]=useState<'intro'|'question'|'feedback'|'final'>('intro'),[result,setResult]=useState<RoundResult|null>(null);
 const [records,setRecords]=useState(loadRecords),[startedAt,setStartedAt]=useState(0),[frozenAt,setFrozenAt]=useState<number|null>(null),[now,setNow]=useState(Date.now());
 const [order,setOrder]=useState<number[]>([]),[output,setOutput]=useState('');
 const q=run?quiz.questions[run.index]:null,limit=(run?.settings.timer??0)*1000,elapsed=frozenAt??Math.max(0,now-startedAt),remaining=Math.max(0,limit-elapsed);
 useEffect(()=>{if(phase!=='question'||!limit||frozenAt!==null)return;const t=setInterval(()=>setNow(Date.now()),100);return()=>clearInterval(t)},[phase,limit,frozenAt,run?.index]);
 useEffect(()=>{if(phase==='question'&&limit&&frozenAt===null&&remaining<=0)submit(null)},[remaining,phase]);

 function openQuestion(r:Run){const next=quiz.questions[r.index];setOrder(next.options.map((_,i)=>i));setOutput('');setFrozenAt(null);const t=Date.now();setStartedAt(t);setNow(t);setResult(null);setPhase('question')}
 function start(){const r={...createRun(quiz,nick.trim()),avatar:rememberAvatar(avatar)};setRun(r);openQuestion(r)}
 function submit(value:Value|null){if(!run||!q||phase!=='question')return;const out=answerQuestion(run,q,value,elapsed);setRun(out.run);setResult(out.result);setPhase('feedback')}
 function power(kind:Powerup){if(!run||!q)return;setRun(usePowerup(run,q,kind));if(kind==='congelar')setFrozenAt(Math.max(0,Date.now()-startedAt))}
 function next(){if(!run)return;const r=advanceRun(run,total);setRun(r);if(r.done){setRecords(saveRecord(recordOf(r)));setPhase('final')}else openQuestion(r)}

 if(phase==='intro'||!run)return <div className="practicewrap"><section className="practiceintro"><span className="sectionicon"><Gamepad2 size={24}/></span><span className="eyebrow">MODO PRÁCTICA</span><h1>{quiz.title}</h1><p>{total} preguntas para practicar como juego. Puedes repetirlo cuantas veces quieras: <b>no cuenta para tu nota</b>.</p>
  <div className="practicechips"><span><Timer size={15}/> {quiz.game?.timer?`${quiz.game.timer} s por pregunta`:'Sin temporizador'}</span>{quiz.game?.timer&&quiz.game.speed?<span><Zap size={15}/> Puntos por rapidez</span>:null}{quiz.game?.powerups&&<span><Gift size={15}/> Potenciadores</span>}{quiz.game?.leaderboard&&<span><Trophy size={15}/> Ranking entre preguntas</span>}</div>
  <form onSubmit={e=>{e.preventDefault();start()}}><label>Tu apodo de juego<input required minLength={2} maxLength={20} value={nick} onChange={e=>setNick(e.target.value)} placeholder="Ej. Ana T."/></label><AvatarPicker value={avatar} onChange={id=>setAvatar(rememberAvatar(id))}/><button className="primary" disabled={nick.trim().length<2}>¡A jugar! <ArrowRight size={18}/></button></form>
  {quiz.game?.powerups&&<ul className="practicepowerlist">{(Object.keys(powerupInfo) as Powerup[]).filter(k=>k!=='congelar'||quiz.game?.timer).map(k=>{const Icon=icons[k];return <li key={k}><Icon size={16}/><b>{powerupInfo[k].label}</b><span>{powerupInfo[k].detail}</span></li>})}</ul>}
  <button className="resumebtn" onClick={onExit}>Volver al laboratorio</button></section></div>;

 const standing=run.settings.leaderboard&&run.progress.length?rankAt(records,run):null;
 const head=<div className="practicehud"><Avatar id={run.avatar} size={36} decorative/><span className="practicecount">{Math.min(run.index+1,total)} / {total}</span><span className="practicescore"><Trophy size={16}/> {run.score.toLocaleString('es')}</span><span className={`practicestreak ${run.streak>=3?'hot':''}`}><Flame size={16}/> {run.streak}</span>{standing&&phase!=='final'&&<span className="practicerank">#{standing.position}<small>/{standing.of}</small></span>}<button className="liveicon" title="Salir" onClick={()=>{if(phase==='final'||confirm('¿Salir de la práctica? Este recorrido no se guardará.'))onExit()}}><X size={16}/></button></div>;

 if(phase==='final'){const board=leaderboard(records,run.quizId,run.revision),place=board.findIndex(r=>r.nick.toLocaleLowerCase()===run.nick.toLocaleLowerCase())+1;
  return <div className="practicewrap">{head}<section className="practicefinal"><Avatar id={run.avatar} size={128} mood="celebrate"/><Trophy size={28}/><span className="eyebrow">PRÁCTICA COMPLETADA</span><h1>{run.score.toLocaleString('es')} puntos</h1><div className="resultstats"><div><strong>{run.correct}<small>/{total}</small></strong><span>Aciertos</span></div><div><strong>{run.best}</strong><span>Mejor racha</span></div><div><strong>{run.used}</strong><span>Potenciadores usados</span></div>{run.settings.leaderboard&&<div><strong>#{place||1}</strong><span>Tu mejor marca</span></div>}</div>
   {run.settings.leaderboard&&<><h2>Mejores marcas de esta práctica</h2><ol className="liveranking">{board.slice(0,10).map((r,i)=><li key={i} className={r.nick.toLocaleLowerCase()===run.nick.toLocaleLowerCase()?'me':''}><span>{i+1}</span><b className="avataridentity"><Avatar id={r.avatar} size={38} decorative/>{r.nick}</b><small>{r.correct}/{total}</small><strong>{r.score.toLocaleString('es')}</strong></li>)}</ol><p className="livemuted">Marcas guardadas solo en este navegador. Los puntos de práctica no modifican la nota.</p></>}
   <div className="liveactions"><button className="secondarylive" onClick={onExit}>Volver al laboratorio</button><button className="primary" onClick={start}><RotateCcw size={17}/> Jugar otra vez</button></div></section></div>}

 if(!q)return null;
 if(phase==='feedback'&&result){const i=run.progress.length-1,others=records.filter(r=>r.quizId===run.quizId&&r.revision===run.revision&&r.progress.length>i).map(r=>({nick:r.nick,avatar:r.avatar,score:r.progress[i],me:false}));const table=[...others,{nick:run.nick,avatar:run.avatar,score:run.score,me:true}].sort((a,b)=>b.score-a.score||(a.me?-1:1));const myIndex=table.findIndex(r=>r.me),shown=table.slice(0,5);if(myIndex>=5)shown.push(table[myIndex]);const AwardIcon=result.award?icons[result.award]:null;
  return <div className="practicewrap">{head}<section className={`practicefeedback ${result.correct?'good':'bad'}`}><Avatar id={run.avatar} size={88} mood={result.correct?'celebrate':'encourage'}/>{result.correct?<Check size={46}/>:result.timedOut?<Hourglass size={46}/>:<X size={46}/>}<h2>{result.correct?'¡Correcto!':result.timedOut?'¡Se acabó el tiempo!':'Esta vez no'}</h2>
   {result.correct?<p className="livegain">+{result.gained.toLocaleString('es')}{result.doubled&&<span><Zap size={14}/> ×2</span>}{result.streak>1&&<span><Flame size={14}/> racha de {result.streak}</span>}</p>:result.shieldUsed?<p className="practiceshield"><Shield size={16}/> El escudo protegió tu racha de {result.streak}.</p>:null}
   {AwardIcon&&result.award&&<p className="practiceaward"><Gift size={17}/> ¡Ganaste un potenciador! <b><AwardIcon size={15}/> {powerupInfo[result.award].label}</b></p>}
   <div className="livesolution small"><span>Respuesta correcta</span>{q.type==='order'?<ol>{(q.solution as number[]).map(n=><li key={n}><code>{q.options[n]}</code></li>)}</ol>:<code>{q.type==='input'?String(q.solution):q.options[q.solution as number]}</code>}<p>{q.explanation}</p></div>
   {run.settings.leaderboard&&<div className="practiceboard"><h3>{others.length?`Vas #${myIndex+1} de ${table.length} en la pregunta ${i+1}`:'Eres el primero en practicar: tu marca será la referencia'}</h3>{others.length>0&&<ol className="liveranking compact">{shown.map(r=><li key={r.me?'me':r.nick+r.score} className={r.me?'me':''}><span>{table.indexOf(r)+1}</span><b className="avataridentity"><Avatar id={r.avatar} size={34} decorative/>{r.me?`${r.nick} (tú)`:r.nick}</b><strong>{r.score.toLocaleString('es')}</strong></li>)}</ol>}</div>}
   <button className="primary practicenext" autoFocus onClick={next}>{run.index+1>=total?'Ver resultado final':'Siguiente pregunta'} <ArrowRight size={17}/></button></section></div>}

 const removed=run.effects.mitad??[],tiles=['choice','boolean','blank'].includes(q.type);
 return <div className="practicewrap">{head}
  {limit>0?<div className={`practicetimer ${frozenAt!==null?'frozen':remaining<=5000?'hurry':''}`} role="timer" aria-label={`${Math.ceil(remaining/1000)} segundos`}><i style={{width:`${remaining/limit*100}%`}}/><span>{frozenAt!==null?<><Snowflake size={13}/> Congelado</>:`${Math.ceil(remaining/1000)} s`}</span></div>:<div className="practicetimer off"><span>Sin límite de tiempo</span></div>}
  {run.settings.powerups&&<div className="practicepowers" aria-label="Potenciadores">{run.inventory.length?run.inventory.map((k,i)=>{const Icon=icons[k];return <button key={k+i} disabled={!usable(run,q,k)} title={powerupInfo[k].detail} onClick={()=>power(k)}><Icon size={17}/>{powerupInfo[k].label}</button>}):<span>Acierta tres seguidas para ganar un potenciador.</span>}{(Object.keys(run.effects) as Powerup[]).map(k=><span key={k} className="practiceactive">{powerupInfo[k].label} activo</span>)}</div>}
  <section className="practiceq"><h2>{q.title}</h2><p className="livebrief">{q.brief}</p>{q.code&&<Code code={q.code}/>}
   {tiles?<div className={`livetiles player n${q.options.length}`}>{q.options.map((o,i)=><button key={i} disabled={removed.includes(i)} className={`livetile c${i} ${removed.includes(i)?'removed':''}`} onClick={()=>submit(i)}><Shape i={i} size={24}/><code>{o}</code></button>)}</div>
   :q.type==='order'?<><SortCode q={q} order={order} onChange={setOrder} disabled={false}/><button className="primary practicenext" onClick={()=>submit(order)}>Enviar orden <ArrowRight size={17}/></button></>
   :<form onSubmit={e=>{e.preventDefault();if(output.trim())submit(output.trim())}}><ConsoleAnswer value={output} onChange={setOutput} disabled={false}/><button className="primary practicenext" disabled={!output.trim()}>Enviar salida <ArrowRight size={17}/></button></form>}</section></div>;
}
