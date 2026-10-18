import {useEffect,useRef,useState} from 'react';
import {Radio,ArrowRight,Check,X,Flame,Trophy,Hourglass,LogOut} from 'lucide-react';
import type {Snapshot,Value} from './live-model.mjs';
import {openChannel,playerKeys,sharedKey,seal,verify,sameKey,type Channel,type Wire} from './live-net';
import {cloud} from './service';
import {Code} from './Code';
import {SortCode,ConsoleAnswer} from './QuestionControls';
import {Shape,LiveCountdown} from './LiveParts';
import './live.css';

const storeKey='sc-vivo-player';
type Stored={pin:string;id:string;nick:string;jwk:JsonWebKey};
const readStored=():Stored|null=>{try{return JSON.parse(sessionStorage.getItem(storeKey)||'null')}catch{return null}};
export const pinFromHash=()=>/^#vivo=(\d{6})$/.exec(location.hash)?.[1]??'';

export function LivePlayer({onExit}:{onExit:()=>void}){
 const stored=readStored();
 const [pin,setPin]=useState(pinFromHash()||stored?.pin||''),[nick,setNick]=useState(stored?.nick??''),[status,setStatus]=useState<'form'|'connecting'|'in'>('form'),[error,setError]=useState('');
 const [snap,setSnap]=useState<Snapshot|null>(null),[receivedAt,setReceivedAt]=useState(0),[now,setNow]=useState(Date.now()),[sent,setSent]=useState<number|null>(null);
 const [selected,setSelected]=useState<number|null>(null),[order,setOrder]=useState<number[]>([]),[output,setOutput]=useState('');
 const channel=useRef<Channel|null>(null),me=useRef<{id:string;pin:string;nick:string;priv:CryptoKey;pub:JsonWebKey}|null>(null),hostSig=useRef<JsonWebKey|null>(null),hostDh=useRef<JsonWebKey|null>(null),aes=useRef<CryptoKey|null>(null),lastJoin=useRef(0),lastAnswer=useRef<{index:number;value:Value;at:number}|null>(null),found=useRef(false);
 useEffect(()=>()=>channel.current?.close(),[]);
 useEffect(()=>{if(stored&&(!pinFromHash()||pinFromHash()===stored.pin))void connect(stored.pin,stored.nick)},[]);
 useEffect(()=>{const onHash=()=>{const next=pinFromHash();if(next&&next!==me.current?.pin){leave();setPin(next)}};addEventListener('hashchange',onHash);return()=>removeEventListener('hashchange',onHash)},[]);
 useEffect(()=>{if(snap?.phase!=='question')return;const t=setInterval(()=>setNow(Date.now()),250);return()=>clearInterval(t)},[snap?.phase,snap?.index]);
 useEffect(()=>{if(snap?.question?.type==='order')setOrder(snap.question.options.map((_,i)=>i));setSelected(null);setOutput('')},[snap?.index]);

 function leave(message=''){channel.current?.close();channel.current=null;me.current=null;hostSig.current=null;hostDh.current=null;aes.current=null;found.current=false;sessionStorage.removeItem(storeKey);setSnap(null);setSent(null);setStatus('form');setError(message)}
 async function onMessage(m:Wire){
  const self=me.current;if(m.t!=='host'||!self||typeof m.d!=='string'||typeof m.s!=='string')return;
  const signer=m.k as JsonWebKey;if(hostSig.current&&!sameKey(hostSig.current,signer))return;
  if(!await verify(signer,m.d,m.s))return;
  const data=JSON.parse(m.d);if(data.pin!==self.pin)return;
  hostSig.current=signer;found.current=true;
  if(data.kind==='reject'){if(data.id===self.id)leave(data.reason);return}
  const s=data as Snapshot&{hostKey:JsonWebKey};
  if(!aes.current){aes.current=await sharedKey(self.priv,s.hostKey);hostDh.current=s.hostKey}else if(!sameKey(hostDh.current!,s.hostKey))return;
  setSnap(s);setReceivedAt(Date.now());setNow(Date.now());
  const joined=s.players.some(p=>p.id===self.id);
  if(joined)setStatus('in');
  else if(s.phase!=='podium'&&Date.now()-lastJoin.current>2000){lastJoin.current=Date.now();channel.current?.send({t:'join',id:self.id,pub:self.pub,box:await seal(aes.current,{name:self.nick})})}
  const pendingAnswer=lastAnswer.current;
  if(joined&&s.phase==='question'&&pendingAnswer?.index===s.index&&!s.answered.includes(self.id)&&Date.now()-pendingAnswer.at>1500){pendingAnswer.at=Date.now();channel.current?.send({t:'answer',id:self.id,box:await seal(aes.current,{q:s.index,v:pendingAnswer.value})})}
 }
 async function connect(p:string,name:string){
  setError('');
  if(!/^\d{6}$/.test(p))return setError('El PIN tiene seis dígitos.');
  const clean=name.replace(/\s+/g,' ').trim();if(clean.length<2||clean.length>20)return setError('Usa un apodo de 2 a 20 caracteres.');
  if(!crypto.subtle)return setError('Abre esta página con HTTPS para jugar en vivo.');
  setStatus('connecting');
  const prior=readStored(),reuse=prior?.pin===p?prior:null,keys=await playerKeys(reuse?.jwk);
  const id=reuse?.id??crypto.randomUUID();
  sessionStorage.setItem(storeKey,JSON.stringify({pin:p,id,nick:clean,jwk:keys.jwk}));
  me.current={id,pin:p,nick:clean,priv:keys.priv,pub:keys.pub};found.current=false;lastJoin.current=0;
  channel.current?.close();
  const ch=openChannel(p,m=>void onMessage(m),()=>ch.send({t:'sync'}),{onError:message=>leave(message)});channel.current=ch;
  setTimeout(()=>{if(me.current?.id===id&&!found.current)leave('No encontramos una partida activa con ese PIN. Revisa el número en la pantalla del miembro GADEST.')},cloud?20000:6000);
 }
 async function answer(value:Value){
  const self=me.current;if(!snap||!self||!aes.current||sent===snap.index)return;
  lastAnswer.current={index:snap.index,value,at:Date.now()};setSent(snap.index);
  channel.current?.send({t:'answer',id:self.id,box:await seal(aes.current,{q:snap.index,v:value})});
 }

 if(status!=='in'||!snap||!me.current)return <div className="liveplayerwrap"><section className="livejoincard"><span className="sectionicon"><Radio size={24}/></span><h2>Juego en vivo</h2><p>Ingresa el PIN que aparece en la pantalla del miembro GADEST.</p>
  <form onSubmit={e=>{e.preventDefault();void connect(pin,nick)}}><label>PIN del juego<input className="roominput" inputMode="numeric" autoComplete="off" required pattern="\d{6}" maxLength={6} value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,''))} disabled={status==='connecting'}/></label><label>Tu apodo<input required minLength={2} maxLength={20} placeholder="Ej. Ana T." value={nick} onChange={e=>setNick(e.target.value)} disabled={status==='connecting'}/></label><button className="primary" disabled={status==='connecting'}>{status==='connecting'?'Buscando la partida…':<>Entrar al juego <ArrowRight size={18}/></>}</button></form>
  {error&&<p className="liveerror" role="alert">{error}</p>}<p className="livemuted">Usa un apodo respetuoso: el miembro GADEST lo verá en pantalla. Los puntos del juego no cambian tu nota.</p><button className="resumebtn" onClick={()=>{leave();onExit()}}>Volver al laboratorio</button></section></div>;

 const self=me.current,mine=snap.players.find(p=>p.id===self.id),rank=snap.players.findIndex(p=>p.id===self.id)+1,ahead=rank>1?snap.players[rank-2]:null,round=snap.round[self.id],q=snap.question;
 const remaining=Math.max(0,snap.remaining-(now-receivedAt)),answeredHere=sent===snap.index||snap.answered.includes(self.id);
 return <div className="liveplayerwrap"><div className="liveplayertop"><span>{snap.title}</span><span className="liveme">{self.nick} · <b>{mine?.score??0}</b> pts</span><button className="liveicon" title="Salir" onClick={()=>{if(confirm('¿Salir de la partida?')){leave();onExit()}}}><LogOut size={16}/></button></div>
  {snap.phase==='lobby'?<section className="livestatus"><Check size={40}/><h2>¡Ya estás dentro!</h2><p>Busca <b>{self.nick}</b> en la pantalla. El juego empieza cuando el miembro GADEST lo indique.</p><small>{snap.players.length} jugador{snap.players.length===1?'':'es'} en la sala</small></section>
  :snap.phase==='question'&&q?(answeredHere||remaining<=0?<section className="livestatus"><Hourglass size={40}/><h2>{answeredHere?'Respuesta enviada':'Se acabó el tiempo'}</h2><p>{answeredHere?'Esperando a los demás…':'La próxima pregunta es tuya.'}</p><small>{snap.answered.length} de {snap.players.length} respondieron</small></section>
   :<section className="liveplay"><div className="liveqhead"><span>{snap.index+1} / {snap.total}</span><LiveCountdown remaining={remaining} limit={snap.limit*1000}/></div><h2>{q.title}</h2><p className="livebrief">{q.brief}</p>{q.code&&<Code code={q.code} fill={q.type==='blank'&&selected!==null?q.options[selected]:undefined}/>}
    {['choice','boolean','blank'].includes(q.type)?<div className={`livetiles player n${q.options.length}`}>{q.options.map((o,i)=><button key={i} className={`livetile c${i}`} onClick={()=>void answer(i)}><Shape i={i} size={26}/><code>{o}</code></button>)}</div>
    :q.type==='order'?<><SortCode q={q} order={order} onChange={setOrder} disabled={false}/><button className="primary livesubmit" onClick={()=>void answer(order)}>Enviar orden <ArrowRight size={17}/></button></>
    :<><ConsoleAnswer value={output} onChange={setOutput} disabled={false}/><button className="primary livesubmit" disabled={!output.trim()} onClick={()=>void answer(output.trim())}>Enviar salida <ArrowRight size={17}/></button></>}</section>)
  :snap.phase==='podium'?<section className="livestatus"><Trophy size={44}/><h2>{rank===1?'¡Primer lugar!':rank<=3?`¡Podio! Puesto ${rank}`:`Terminaste en el puesto ${rank}`}</h2><p><b>{mine?.score??0}</b> puntos · {mine?.correct??0} de {snap.total} aciertos</p><ol className="liveranking compact">{snap.players.slice(0,3).map((p,i)=><li key={p.id}><span>{i+1}</span><b>{p.name}</b><strong>{p.score}</strong></li>)}</ol><button className="resumebtn" onClick={()=>{leave();onExit()}}>Volver al laboratorio</button></section>
  :<section className={`livestatus ${round?.correct?'good':round?'bad':''}`}>{round?.correct?<Check size={44}/>:<X size={44}/>}<h2>{round?.correct?'¡Correcto!':round?.answered?'Esta vez no':'Sin respuesta'}</h2>{round?.correct&&<p className="livegain">+{round.gained}{round.streak>1&&<span><Flame size={16}/> racha de {round.streak}</span>}</p>}<p>Vas en el puesto <b>{rank}</b>{ahead?<> · a {ahead.score-(mine?.score??0)} pts de {ahead.name}</>:rank===1?' · ¡a la cabeza!':''}</p>
   {snap.reveal&&q&&<div className="livesolution small"><span>Respuesta correcta</span>{q.type==='order'?<ol>{(snap.reveal.solution as number[]).map(i=><li key={i}><code>{q.options[i]}</code></li>)}</ol>:<code>{q.type==='input'?String(snap.reveal.solution):q.options[snap.reveal.solution as number]}</code>}<p>{snap.reveal.explanation}</p></div>}</section>}
 </div>;
}
