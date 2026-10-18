import type {CSSProperties} from 'react';
import {avatars,avatarInfo} from './avatars.mjs';
import './avatars.css';
export function Avatar({id,size=44,mood='',decorative=false}:{id?:unknown;size?:number;mood?:''|'celebrate'|'encourage';decorative?:boolean}){
 const a=avatarInfo(id)!;
 const style={width:size,height:size,backgroundPosition:`${a.index%4/3*100}% ${Math.floor(a.index/4)/3*100}%`} as CSSProperties;
 return <span className={`sc-avatar ${mood?'sc-avatar--'+mood:''}`} style={style} role={decorative?undefined:'img'} aria-label={decorative?undefined:`${a.name} · ${a.role}`} aria-hidden={decorative||undefined}/>;
}
export function AvatarPicker({value,onChange,disabled=false}:{value:string;onChange:(id:string)=>void;disabled?:boolean}){
 const selected=avatarInfo(value)!;
 return <fieldset className="avatarpicker" disabled={disabled}><legend>Tu compañero de Structural Coders</legend><details><summary><Avatar id={value} size={56} decorative/><span><b>{selected.name}</b><small>{selected.role}</small></span><span className="avatarchange">Cambiar personaje</span></summary><div className="avatargrid">{avatars.map(a=><button type="button" key={a.id} aria-label={`${a.name} · ${a.role}`} aria-pressed={value===a.id} onClick={()=>onChange(a.id)}><Avatar id={a.id} size={64} decorative/><span>{a.name}</span></button>)}</div></details></fieldset>;
}
