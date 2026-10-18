// Canal de la partida en vivo. Demo: BroadcastChannel entre pestañas de este navegador. Conectado: Supabase Realtime (broadcast).
// Los mensajes de la pantalla docente van firmados (ECDSA) y las respuestas de cada jugador van cifradas (ECDH + AES-GCM),
// así nadie que escuche el canal puede leer ni suplantar respuestas ajenas.
import {db,live,cloud} from './service';
import {liveJoinUrl} from './navigation.mjs';
export type Wire={t:string;[k:string]:unknown};
export type Box={iv:string;ct:string};
export type Channel={send:(m:Wire)=>void;close:()=>void};

export function openChannel(pin:string,onMessage:(m:Wire)=>void,onReady:()=>void,options:{host?:boolean;onError?:(message:string)=>void}={}):Channel{
 if(cloud&&db){
  const client=db;let stopped=false;let channels:ReturnType<typeof client.channel>[]=[];let output:ReturnType<typeof client.channel>|null=null;const pending:Wire[]=[];
  const fail=(message:string)=>{if(!stopped)options.onError?.(message)};
  const send=(m:Wire)=>{if(stopped)return;if(!output){if(pending.length<30)pending.push(m);return}void output.send({type:'broadcast',event:'m',payload:m}).then(status=>{if(status!=='ok')fail('No se pudo enviar el mensaje. Comprueba tu conexión.')})};
  void(async()=>{
   const {data:{session:previous}}=await client.auth.getSession();const auth=previous?{data:{session:previous},error:null}:await client.auth.signInAnonymously();
   if(auth.error||!auth.data.session)throw new Error('Falta habilitar el acceso anónimo de aspirantes en Supabase.');
   const response=await fetch('/api/live/access',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin,host:options.host===true,accessToken:auth.data.session.access_token})});const result=await response.json();if(!response.ok)throw new Error(result.error||'No se pudo abrir la conexión.');if(stopped)return;
   await client.realtime.setAuth(auth.data.session.access_token);
   const host=client.channel('sc-host-'+pin,{config:{private:true,broadcast:{self:false,ack:true}}});const players=client.channel('sc-player-'+pin,{config:{private:true,broadcast:{self:false,ack:true}}});channels=[host,players];
   host.on('broadcast',{event:'m'},({payload})=>{if(!options.host&&payload?.t==='host')onMessage(payload as Wire)});
   players.on('broadcast',{event:'m'},({payload})=>{if(options.host&&['join','answer','sync'].includes(payload?.t))onMessage(payload as Wire)});
   const connected=new Set<string>();for(const channel of channels)channel.subscribe(status=>{if(stopped)return;if(status==='SUBSCRIBED'){connected.add(channel.topic);if(connected.size===2){output=options.host?host:players;pending.splice(0).forEach(send);onReady()}}else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT')fail('No se pudo conectar la sala privada. Comprueba las políticas de Realtime y tu conexión.')});
  })().catch(e=>fail(e instanceof Error?e.message:'No se pudo conectar.'));
  return {send,close:()=>{stopped=true;channels.forEach(channel=>void client.removeChannel(channel))}};
 }
 if(live&&db){
  const client=db,ch=client.channel('vivo-'+pin,{config:{broadcast:{self:false}}});
  ch.on('broadcast',{event:'m'},({payload})=>onMessage(payload as Wire));
  ch.subscribe(status=>{if(status==='SUBSCRIBED')onReady()});
  return {send:m=>{void ch.send({type:'broadcast',event:'m',payload:m})},close:()=>{void client.removeChannel(ch)}};
 }
 const bc=new BroadcastChannel('sc-vivo-'+pin);bc.onmessage=e=>onMessage(e.data as Wire);setTimeout(onReady,0);
 return {send:m=>bc.postMessage(m),close:()=>bc.close()};
}

const subtle=crypto.subtle,ECDH={name:'ECDH',namedCurve:'P-256'},ECDSA={name:'ECDSA',namedCurve:'P-256'},SIGN={name:'ECDSA',hash:'SHA-256'};
const enc=new TextEncoder(),dec=new TextDecoder();
const b64=(b:ArrayBuffer|Uint8Array)=>btoa(String.fromCharCode(...new Uint8Array(b)));
const unb64=(s:string)=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));

export type HostJwks={dh:JsonWebKey;sig:JsonWebKey;dhPub:JsonWebKey;sigPub:JsonWebKey};
export async function hostKeys(stored?:HostJwks){
 if(stored)return {dh:await subtle.importKey('jwk',stored.dh,ECDH,true,['deriveKey']),sig:await subtle.importKey('jwk',stored.sig,ECDSA,true,['sign']),dhPub:stored.dhPub,sigPub:stored.sigPub,jwks:stored};
 const [dh,sig]=await Promise.all([subtle.generateKey(ECDH,true,['deriveKey']),subtle.generateKey(ECDSA,true,['sign','verify'])]);
 const jwks={dh:await subtle.exportKey('jwk',dh.privateKey),sig:await subtle.exportKey('jwk',sig.privateKey),dhPub:await subtle.exportKey('jwk',dh.publicKey),sigPub:await subtle.exportKey('jwk',sig.publicKey)};
 return {dh:dh.privateKey,sig:sig.privateKey,dhPub:jwks.dhPub,sigPub:jwks.sigPub,jwks};
}
export async function playerKeys(stored?:JsonWebKey){
 if(stored){const {x,y,crv,kty}=stored;return {priv:await subtle.importKey('jwk',stored,ECDH,true,['deriveKey']),pub:{x,y,crv,kty} as JsonWebKey,jwk:stored}}
 const pair=await subtle.generateKey(ECDH,true,['deriveKey']);
 return {priv:pair.privateKey,pub:await subtle.exportKey('jwk',pair.publicKey),jwk:await subtle.exportKey('jwk',pair.privateKey)};
}
export async function sharedKey(priv:CryptoKey,pub:JsonWebKey){
 const other=await subtle.importKey('jwk',pub,ECDH,false,[]);
 return subtle.deriveKey({name:'ECDH',public:other},priv,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
export async function seal(key:CryptoKey,data:unknown):Promise<Box>{const iv=crypto.getRandomValues(new Uint8Array(12));return {iv:b64(iv),ct:b64(await subtle.encrypt({name:'AES-GCM',iv},key,enc.encode(JSON.stringify(data))))}}
export async function unseal<T>(key:CryptoKey,box:Box):Promise<T>{return JSON.parse(dec.decode(await subtle.decrypt({name:'AES-GCM',iv:unb64(box.iv)},key,unb64(box.ct))))}
export async function sign(key:CryptoKey,data:string){return b64(await subtle.sign(SIGN,key,enc.encode(data)))}
export async function verify(pub:JsonWebKey,data:string,signature:string){
 try{const key=await subtle.importKey('jwk',pub,ECDSA,false,['verify']);return await subtle.verify(SIGN,key,unb64(signature),enc.encode(data))}catch{return false}
}
export const sameKey=(a?:JsonWebKey,b?:JsonWebKey)=>!!a&&!!b&&a.x===b.x&&a.y===b.y;
export const joinUrl=(pin:string)=>liveJoinUrl(pin,location.origin,location.pathname,live||cloud?(import.meta as unknown as {env:Record<string,string>}).env.VITE_PUBLIC_URL:'');
