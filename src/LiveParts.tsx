import {Triangle,Diamond,Circle,Square} from 'lucide-react';
const shapes=[Triangle,Diamond,Circle,Square];
export function Shape({i,size=22}:{i:number;size?:number}){const Icon=shapes[i%4];return <Icon className="liveshape" size={size} fill="currentColor" aria-hidden="true"/>}
export function LiveCountdown({remaining,limit}:{remaining:number;limit:number}){const s=Math.ceil(remaining/1000);return <span className={`livecountdown ${s<=5?'hurry':''}`} role="timer" aria-label={`${s} segundos`} style={{'--p':`${Math.max(0,remaining/limit)*360}deg`} as React.CSSProperties}><b>{s}</b></span>}
