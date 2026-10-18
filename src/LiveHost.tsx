import {archivedQuiz} from './member-model.mjs';
import {useEffect,useRef,useState} from 'react';
import QRCode from 'qrcode';
import {Radio,Users,Play,X,Timer,Zap,SkipForward,Trophy,Maximize2,Download,RotateCcw,Upload,Check,Copy} from 'lucide-react';
import {catalog,importBackup,persistCatalog,type Catalog,type QuizDraft} from './authoring';
import {validateQuiz,preparePublication} from './authoring-model.mjs';
import {type Game,createGame,addPlayer,removePlayer,startQuestion,recordLiveAnswer,everyoneAnswered,closeQuestion,showStandings,snapshot,standings,distribution} from './live-model.mjs';
import {openChannel,hostKeys,sharedKey,unseal,sign,sameKey,joinUrl,type Channel,type Wire,type Box,type HostJwks} from './live-net';
import {live,cloud} from './service';
import {Code} from './Code';
import {Shape,LiveCountdown} from './LiveParts';
import './live.css';

type Keys=Awaited<ReturnType<typeof hostKeys>>;
const limits=[10,20,30,60],hostStore='sc-vivo-host';

async function loadCatalog():Promise<Catalog>{return catalog()}

export function LiveHost(){
 const [data,setData]=useState<Catalog|null>(null),[quizId,setQuizId]=useState(''),[limit,setLimit]=useState(20),[speed,setSpeed]=useState(true),[error,setError]=useState('');
 const [game,setGame]=useState<Game|null>(null),[now,setNow]=useState(Date.now()),[qr,setQr]=useState(''),[copied,setCopied]=useState(false);
 const gameRef=useRef<Game|null>(null),keys=useRef<Keys|null>(null),channel=useRef<Channel|null>(null),players=useRef(new Map<string,{pub:JsonWebKey;key:CryptoKey}>()),pending=useRef(0),stage=useRef<HTMLDivElement>(null);
 const ready=(data?.drafts??[]).filter(d=>!archivedQuiz(data,d.id)&&!validateQuiz(d).length);
 useEffect(()=>{loadCatalog().then(c=>{setData(c);const available=c.drafts.filter(d=>!archivedQuiz(c,d.id));const first=available.find(d=>d.id===sessionStorage.getItem('sc-live-selected')&&!validateQuiz(d).length)??available.find(d=>d.code.endsWith('VIVO')&&!validateQuiz(d).length)??available.find(d=>!validateQuiz(d).length);if(first)setQuizId(first.id)}).catch(()=>setData({drafts:[],publications:[]}))},[]);
 useEffect(()=>{void restore();return()=>{channel.current?.close();clearTimeout(pending.current)}},[]);
 useEffect(()=>{if(!game||game.phase==='podium')return;const warn=(e:BeforeUnloadEvent)=>e.preventDefault();addEventListener('beforeunload',warn);return()=>removeEventListener('beforeunload',warn)},[!!game&&game.phase!=='podium']);
 useEffect(()=>{if(game?.phase!=='question')return;const tick=setInterval(()=>{const t=Date.now();setNow(t);const g=gameRef.current;if(g?.phase==='question'&&t>=g.startedAt+g.limit*1000)update(closeQuestion)},250);return()=>clearInterval(tick)},[game?.phase,game?.index]);

 async function broadcast(){const g=gameRef.current,k=keys.current;if(!g||!k||!channel.current)return;const d=JSON.stringify({kind:'state',hostKey:k.dhPub,...snapshot(g,Date.now())});channel.current.send({t:'host',d,s:await sign(k.sig,d),k:k.sigPub})}
 async function reject(id:string,reason:string){const k=keys.current;if(!k||!channel.current)return;const d=JSON.stringify({kind:'reject',pin:gameRef.current?.pin,id,reason});channel.current.send({t:'host',d,s:await sign(k.sig,d),k:k.sigPub})}
 function queue(){if(pending.current)return;pending.current=window.setTimeout(()=>{pending.current=0;void broadcast()},200)}
 function persist(){const g=gameRef.current,k=keys.current;if(g&&k)sessionStorage.setItem(hostStore,JSON.stringify({game:g,keys:k.jwks,pubs:Object.fromEntries([...players.current].map(([id,v])=>[id,v.pub]))}))}
 function update(fn:(g:Game)=>Game){const g=gameRef.current;if(!g)return;const next=fn(g);if(next===g)return;gameRef.current=next;setGame(next);setNow(Date.now());persist();queue()}
 async function launch(g:Game){gameRef.current=g;setGame(g);persist();channel.current?.close();channel.current=openChannel(g.pin,m=>void handler.current(m),()=>void broadcast(),{host:true,onError:setError});setQr(await QRCode.toString(joinUrl(g.pin),{type:'svg',margin:1,color:{dark:'#0d1726',light:'#ffffff'}}))}
 async function restore(){
  let saved:{game:Game;keys:HostJwks;pubs:Record<string,JsonWebKey>}|null=null;try{saved=JSON.parse(sessionStorage.getItem(hostStore)||'null')}catch{}
  if(!saved||!crypto.subtle)return;
  try{const k=await hostKeys(saved.keys);for(const [id,pub] of Object.entries(saved.pubs))players.current.set(id,{pub,key:await sharedKey(k.dh,pub)});keys.current=k;await launch(saved.game)}catch{sessionStorage.removeItem(hostStore)}
 }
 const handler=useRef<(m:Wire)=>void>(()=>{});
 handler.current=async(m:Wire)=>{
  const k=keys.current;if(!k||!gameRef.current)return;
  if(m.t==='sync'){queue();return}
  const id=m.id;if(typeof id!=='string'||id.length>64)return;
  if(m.t==='join'){
   if(gameRef.current.banned.includes(id)){void reject(id,'El miembro GADEST te retiró de esta partida.');return}
   const known=players.current.get(id),pub=m.pub as JsonWebKey;
   if(known&&!sameKey(known.pub,pub)){void reject(id,'Ese identificador ya está en uso. Recarga e intenta de nuevo.');return}
   let key:CryptoKey,name:string;try{key=known?.key??await sharedKey(k.dh,pub);({name}=await unseal<{name:string}>(key,m.box as Box))}catch{return}
   try{const next=addPlayer(gameRef.current,id,name);players.current.set(id,{pub,key});update(()=>next);queue()}catch(e){void reject(id,e instanceof Error?e.message:'No se pudo ingresar.')}
  }else if(m.t==='answer'){
   const known=players.current.get(id);if(!known)return;
   let a:{q:number;v:unknown};try{a=await unseal(known.key,m.box as Box)}catch{return}
   update(g=>{const next=recordLiveAnswer(g,id,a.q,a.v,Date.now());return next!==g&&everyoneAnswered(next)?closeQuestion(next):next});
  }
 };

 async function create(){
  setError('');const draft=data?.drafts.find(d=>d.id===quizId);if(!draft)return setError('Elige un cuestionario completo.');
  try{
   if(!crypto.subtle)throw new Error('El modo en vivo necesita HTTPS o localhost.');
   keys.current=await hostKeys();players.current.clear();
   await launch(createGame(preparePublication(draft,0),{limit,speed}));
  }catch(e){setError(e instanceof Error?e.message:'No se pudo crear la sala.')}
 }
 function finish(){sessionStorage.removeItem(hostStore);channel.current?.close();channel.current=null;gameRef.current=null;setGame(null);setQr('')}
 function importFile(file?:File){if(!file||!data)return;file.text().then(raw=>{const next=importBackup(raw,data);persistCatalog(next);setData(next);const first=next.drafts.find(d=>!validateQuiz(d).length);if(first&&!quizId)setQuizId(first.id)}).catch(e=>setError(e instanceof Error?e.message:'No se pudo importar.'))}
 function exportCSV(g:Game){const cell=(v:unknown)=>{let s=String(v);if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"'};const csv='﻿'+[['Posición','Apodo','Puntos','Aciertos','Preguntas','Cuestionario'],...standings(g).map((p,i)=>[i+1,p.name,p.score,p.correct,g.quiz.questions.length,g.quiz.title])].map(r=>r.map(cell).join(';')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download=`en-vivo-${g.pin}.csv`;a.click();URL.revokeObjectURL(url)}

 if(!game)return <section className="livesetup"><div className="liveheading"><span className="sectionicon"><Radio size={22}/></span><div><h2>Partida en vivo</h2><p>Proyecta esta pantalla. Tus aspirantes entran con el PIN o el código QR desde su teléfono.</p></div></div>
  {!data?<p className="livemuted">Cargando cuestionarios…</p>:<>
  <label className="livefield">Cuestionario<select value={quizId} onChange={e=>setQuizId(e.target.value)}>{!ready.length&&<option value="">No hay cuestionarios completos</option>}{ready.map((d:QuizDraft)=><option key={d.id} value={d.id}>{d.title} · {d.questions.length} preguntas</option>)}</select></label>
  {data.drafts.length>ready.length&&<p className="livemuted">{data.drafts.length-ready.length} borrador(es) incompleto(s) no aparecen. Complétalos en Cuestionarios.</p>}
  {live&&<label className="liveimport"><Upload size={16}/> Importar cuestionario JSON<input type="file" accept="application/json" onChange={e=>importFile(e.target.files?.[0])}/></label>}
  <div className="livefield">Tiempo por pregunta<div className="livechips">{limits.map(s=><button key={s} className={limit===s?'chosen':''} aria-pressed={limit===s} onClick={()=>setLimit(s)}><Timer size={15}/> {s} s</button>)}</div></div>
  <label className="livetoggle"><input type="checkbox" checked={speed} onChange={e=>setSpeed(e.target.checked)}/><span><b><Zap size={15}/> Puntos por rapidez</b><small>{speed?'Hasta 1000 puntos por acierto: responder antes suma más. Las rachas dan un bono de hasta 500.':'Cada acierto vale lo mismo, sin importar el tiempo. Las rachas siguen sumando bono.'}</small></span></label>
  <button className="primary" disabled={!quizId||!ready.length} onClick={()=>void create()}><Radio size={18}/> Abrir sala en vivo</button>
  <p className="livemuted">{live||cloud?'Conectado: los teléfonos se unen por Supabase Realtime. La partida vive en esta pestaña; si la cierras, termina.':'Demostración: los jugadores deben abrir otra pestaña de este mismo navegador (#vivo). Para usar teléfonos, conecta Supabase y publica con HTTPS.'} Los puntos del juego no modifican la nota académica.</p></>}
  {error&&<p className="liveerror" role="alert">{error}</p>}</section>;

 const q=game.quiz.questions[game.index],ranked=standings(game),answered=Object.keys(game.answers).length,remaining=Math.max(0,game.startedAt+game.limit*1000-now);
 const counts=q&&game.phase!=='question'?distribution(q,game.answers):null,maxCount=Math.max(1,...(counts??[0])),correctCount=Object.values(game.round).filter(r=>r.correct).length;
 const optionTiles=q&&['choice','boolean','blank'].includes(q.type);
 return <div className="livestage" ref={stage}>{error&&<p className="liveerror" role="alert">{error}</p>}
  <div className="livetop"><span className="livepin">PIN <b>{game.pin}</b></span><span className="livetitle">{game.quiz.title}</span><span className="livecount"><Users size={16}/> {ranked.length}</span><button className="liveicon" title="Pantalla completa" onClick={()=>void stage.current?.requestFullscreen?.()}><Maximize2 size={17}/></button><button className="liveicon" title="Terminar partida" onClick={()=>{if(game.phase==='podium'||confirm('¿Terminar la partida para todos?'))finish()}}><X size={17}/></button></div>
  {game.phase==='lobby'?<div className="livelobby"><div className="livejoin"><p>Únete desde tu teléfono en</p><button className="liveurl" onClick={()=>{void navigator.clipboard?.writeText(joinUrl(game.pin));setCopied(true);setTimeout(()=>setCopied(false),1600)}}>{joinUrl(game.pin).replace(/^https?:\/\//,'')} {copied?<Check size={15}/>:<Copy size={15}/>}</button><p>con el PIN</p><strong className="livebigpin">{game.pin.slice(0,3)} {game.pin.slice(3)}</strong></div><div className="liveqr" aria-label="Código QR para unirse" dangerouslySetInnerHTML={{__html:qr}}/>
   <div className="liveplayers"><div className="liveplayershead"><span><Users size={18}/> {ranked.length} jugador{ranked.length===1?'':'es'}</span><button className="primary" disabled={!ranked.length} onClick={()=>update(g=>startQuestion(g,Date.now()))}><Play size={18}/> Comenzar</button></div>{ranked.length?<div className="livechipsplayers">{ranked.map(p=><span key={p.id} className="liveplayer">{p.name}<button aria-label={`Retirar a ${p.name}`} title="Retirar" onClick={()=>{players.current.delete(p.id);update(g=>removePlayer(g,p.id));void reject(p.id,'El miembro GADEST te retiró de esta partida.')}}><X size={13}/></button></span>)}</div>:<p className="livewaiting">Esperando jugadores…</p>}</div></div>
  :game.phase==='leaderboard'||game.phase==='podium'?<div className="liveboard"><h2>{game.phase==='podium'?<><Trophy size={30}/> Podio final</>:'Clasificación'}</h2>
   {game.phase==='podium'&&<div className="livepodium">{[1,0,2].map(i=>ranked[i]&&<div key={i} className={`livepodiumplace p${i+1}`}><b>{ranked[i].name}</b><small>{ranked[i].score} pts · {ranked[i].correct}/{game.quiz.questions.length}</small><div>{i+1}</div></div>)}</div>}
   <ol className="liveranking">{ranked.slice(game.phase==='podium'?3:0,game.phase==='podium'?13:5).map((p,i)=><li key={p.id}><span>{i+(game.phase==='podium'?4:1)}</span><b>{p.name}</b>{game.phase==='leaderboard'&&game.round[p.id]?.gained?<small>+{game.round[p.id].gained}</small>:null}<strong>{p.score}</strong></li>)}</ol>
   <div className="liveactions">{game.phase==='podium'?<><button className="secondarylive" onClick={()=>exportCSV(game)}><Download size={17}/> Exportar CSV</button><button className="primary" onClick={finish}><RotateCcw size={17}/> Nueva partida</button></>:<button className="primary" onClick={()=>update(g=>startQuestion(g,Date.now()))}>Siguiente pregunta <SkipForward size={18}/></button>}</div></div>
  :q&&<div className="livequestion"><div className="liveqhead"><span>Pregunta {game.index+1} de {game.quiz.questions.length}</span>{game.phase==='question'?<LiveCountdown remaining={remaining} limit={game.limit*1000}/>:<span className="livecorrect">{correctCount} de {ranked.length} acertaron</span>}<span className="liveanswered"><b>{answered}</b> respuesta{answered===1?'':'s'}</span></div>
   <h2>{q.title}</h2><p className="livebrief">{q.brief}</p>{q.code&&<div className="livecode"><Code code={q.code} fill={q.type==='blank'&&game.phase!=='question'?q.options[q.solution as number]:undefined}/></div>}
   {optionTiles?<div className={`livetiles n${q.options.length}`}>{q.options.map((o,i)=><div key={i} className={`livetile c${i} ${game.phase!=='question'?(i===q.solution?'right':'dim'):''}`}><Shape i={i}/><code>{o}</code>{counts&&<span className="livebar"><i style={{width:`${counts[i]/maxCount*100}%`}}/><b>{counts[i]}</b></span>}{game.phase!=='question'&&i===q.solution&&<Check size={22}/>}</div>)}</div>
   :game.phase==='question'?<p className="livenote">{q.type==='order'?'Los jugadores ordenan las líneas en su teléfono.':'Los jugadores escriben la salida en su teléfono.'}</p>
   :<div className="livesolution"><span>Respuesta correcta</span>{q.type==='order'?<ol>{(q.solution as number[]).map(i=><li key={i}><code>{q.options[i]}</code></li>)}</ol>:<code>{String(q.solution)}</code>}</div>}
   {game.phase==='reveal'&&<p className="liveexplain">{q.explanation}</p>}
   <div className="liveactions">{game.phase==='question'?<button className="secondarylive" onClick={()=>update(closeQuestion)}>Cerrar pregunta <SkipForward size={17}/></button>:<button className="primary" onClick={()=>update(showStandings)}>{game.index===game.quiz.questions.length-1?'Ver podio final':'Ver clasificación'} <Trophy size={17}/></button>}</div></div>}
 </div>;
}
