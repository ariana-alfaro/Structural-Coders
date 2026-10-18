import {normalizeAvatar} from './avatars.mjs';
// Partida en vivo: estado puro que mantiene la pantalla del docente. Las soluciones nunca salen de aquí antes de la revelación.
import {matchesAnswer} from './authoring-model.mjs';
export const MAX_PLAYERS=200;
export function makePin(rng=Math.random){return String(100000+Math.floor(rng()*900000))}
export function cleanNick(name){return String(name??'').replace(/\s+/g,' ').trim().slice(0,20)}
export function publicQuestion(q){const {solution,explanation,...rest}=q;return rest}
export function validValue(q,value){if(q.type==='input')return typeof value==='string'&&value.length<=80;if(q.type==='order')return Array.isArray(value)&&value.length===q.options.length&&value.every(n=>Number.isInteger(n)&&n>=0&&n<q.options.length)&&new Set(value).size===value.length;return Number.isInteger(value)&&value>=0&&value<q.options.length}
export function roundPoints({correct,elapsed,limit,speed=true,weight=2,streak=1}){if(!correct)return 0;const t=Math.min(Math.max(elapsed,0),limit);const base=Math.round(1000*(weight/2)*(speed?1-t/limit/2:1));return base+Math.min(500,Math.max(0,streak-1)*100)}
export function createGame(quiz,{limit=20,speed=true,requireUniversityCode=false}={},rng){return {id:globalThis.crypto.randomUUID(),pin:makePin(rng),quiz,limit,speed,requireUniversityCode,phase:'lobby',index:-1,startedAt:0,players:{},order:[],banned:[],answers:{},round:{}}}
export function addPlayer(game,id,name,universityCode='',avatar){
 if(game.banned.includes(id))throw new Error('El docente te retiró de esta partida.');
 if(game.players[id])return game;
 const nick=cleanNick(name);
 const studentCode=String(universityCode??'').trim().toUpperCase();
 if(game.requireUniversityCode&&!/^[A-Z0-9-]{4,24}$/.test(studentCode))throw new Error('Ingresa tu codigo universitario (4 a 24 letras, numeros o guiones).');
 if(studentCode&&Object.values(game.players).some(p=>p.universityCode===studentCode))throw new Error('Ese codigo universitario ya esta en la partida.');
 if(nick.length<2)throw new Error('Usa un apodo de 2 a 20 caracteres.');
 if(Object.values(game.players).some(p=>p.name.toLocaleLowerCase()===nick.toLocaleLowerCase()))throw new Error('Ese apodo ya está en uso. Elige otro.');
 if(game.order.length>=MAX_PLAYERS)throw new Error('La partida está llena.');
 if(game.phase==='podium')throw new Error('La partida ya terminó.');
 return {...game,players:{...game.players,[id]:{name:nick,universityCode:studentCode,avatar:normalizeAvatar(avatar),score:0,streak:0,correct:0}},order:[...game.order,id]};
}
export function removePlayer(game,id){const {[id]:_,...players}=game.players;const {[id]:__,...answers}=game.answers;return {...game,players,answers,order:game.order.filter(x=>x!==id),banned:[...game.banned,id]}}
export function startQuestion(game,now){const index=game.index+1;if(index>=game.quiz.questions.length)return {...game,phase:'podium'};return {...game,phase:'question',index,startedAt:now,answers:{},round:{}}}
export function recordLiveAnswer(game,id,qIndex,value,now){
 const q=game.quiz.questions[game.index];
 if(game.phase!=='question'||qIndex!==game.index||!game.players[id]||game.answers[id]||!validValue(q,value))return game;
 const elapsed=now-game.startedAt;if(elapsed>game.limit*1000+1500)return game;
 return {...game,answers:{...game.answers,[id]:{value,elapsed:Math.min(elapsed,game.limit*1000)}}};
}
export const everyoneAnswered=game=>game.order.length>0&&game.order.every(id=>game.answers[id]);
export function closeQuestion(game){
 if(game.phase!=='question')return game;
 const q=game.quiz.questions[game.index],players={...game.players},round={};
 for(const id of game.order){const p=players[id],a=game.answers[id],correct=!!a&&matchesAnswer(q,a.value),streak=correct?p.streak+1:0;const gained=roundPoints({correct,elapsed:a?.elapsed??0,limit:game.limit*1000,speed:game.speed,weight:q.points??2,streak});players[id]={...p,score:p.score+gained,streak,correct:p.correct+(correct?1:0)};round[id]={answered:!!a,correct,gained,streak}}
 return {...game,phase:'reveal',players,round};
}
export function showStandings(game){return {...game,phase:game.index>=game.quiz.questions.length-1?'podium':'leaderboard'}}
export function standings(game){return game.order.filter(id=>game.players[id]).map(id=>({id,...game.players[id]})).sort((a,b)=>b.score-a.score)}
export function distribution(q,answers){if(!['choice','boolean','blank'].includes(q.type))return null;const counts=q.options.map(()=>0);for(const a of Object.values(answers))if(counts[a.value]!==undefined)counts[a.value]++;return counts}
export function snapshot(game,now){
 const q=game.quiz.questions[game.index],revealed=['reveal','leaderboard','podium'].includes(game.phase);
 return {pin:game.pin,phase:game.phase,title:game.quiz.title,total:game.quiz.questions.length,index:game.index,limit:game.limit,speed:game.speed,
  remaining:game.phase==='question'?Math.max(0,game.startedAt+game.limit*1000-now):0,
  question:q?publicQuestion(q):null,
  players:standings(game).map(({id,name,score,correct,streak,avatar})=>({id,name,score,correct,streak,avatar:normalizeAvatar(avatar)})),
  answered:Object.keys(game.answers),round:revealed?game.round:{},
  reveal:revealed&&q?{solution:q.solution,explanation:q.explanation,distribution:distribution(q,game.answers)}:null};
}
