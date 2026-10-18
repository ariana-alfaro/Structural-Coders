// Modo práctica tipo Quizizz: recorrido individual con puntos de juego. No crea intentos académicos ni modifica notas.
import {matchesAnswer} from './authoring-model.mjs';
import {roundPoints} from './live-model.mjs';
export const TIMERS=[0,10,20,30,60];
export const MAX_POWERUPS=3;
export const powerupInfo={
 doble:{label:'Puntos dobles',detail:'Duplica los puntos de esta pregunta si aciertas.'},
 mitad:{label:'50/50',detail:'Retira dos alternativas incorrectas.'},
 congelar:{label:'Congelar tiempo',detail:'Detiene el reloj de esta pregunta.'},
 escudo:{label:'Escudo de racha',detail:'Si fallas, tu racha se conserva.'},
};
export const defaultGame={enabled:false,timer:20,speed:true,powerups:true,leaderboard:true};
export function normalizeGame(g){const s=g&&typeof g==='object'?g:{};return {enabled:s.enabled===true,timer:TIMERS.includes(s.timer)?s.timer:defaultGame.timer,speed:s.speed!==false,powerups:s.powerups!==false,leaderboard:s.leaderboard!==false}}
const pick=(list,rng)=>list[Math.min(list.length-1,Math.floor(rng()*list.length))];
export function poolFor(settings){return Object.keys(powerupInfo).filter(k=>k!=='congelar'||settings.timer>0)}
export function createRun(quiz,nick,rng=Math.random){const settings=normalizeGame(quiz.game);return {quizId:quiz.id,revision:quiz.revision,title:quiz.title,nick,settings,index:0,score:0,streak:0,best:0,correct:0,progress:[],inventory:settings.powerups?[pick(poolFor(settings),rng)]:[],effects:{},used:0,done:false}}
export function usable(run,q,kind){if(run.done||!run.inventory.includes(kind)||run.effects[kind])return false;if(kind==='mitad')return ['choice','blank'].includes(q.type)&&q.options.length>=4;if(kind==='congelar')return run.settings.timer>0;return true}
export function usePowerup(run,q,kind,rng=Math.random){
 if(!usable(run,q,kind))return run;
 const inventory=[...run.inventory];inventory.splice(inventory.indexOf(kind),1);
 let value=true;if(kind==='mitad'){const wrong=q.options.map((_,i)=>i).filter(i=>!matchesAnswer(q,i));const removed=[];while(removed.length<2&&wrong.length){removed.push(...wrong.splice(Math.floor(rng()*wrong.length),1))}value=removed.sort((a,b)=>a-b)}
 return {...run,inventory,used:run.used+1,effects:{...run.effects,[kind]:value}};
}
// value null = se agotó el tiempo
export function answerQuestion(run,q,value,elapsed,rng=Math.random){
 if(run.done)return {run,result:null};
 const correct=value!==null&&matchesAnswer(q,value),limit=run.settings.timer*1000;
 const shieldUsed=!correct&&!!run.effects.escudo&&run.streak>0,streak=correct?run.streak+1:shieldUsed?run.streak:0;
 let gained=roundPoints({correct,elapsed:limit?elapsed:0,limit:limit||1,speed:run.settings.speed&&limit>0,weight:q.points??2,streak});
 if(run.effects.doble)gained*=2;
 let award=null,inventory=run.inventory;
 if(correct&&run.settings.powerups&&streak%3===0&&inventory.length<MAX_POWERUPS){award=pick(poolFor(run.settings),rng);inventory=[...inventory,award]}
 const score=run.score+gained;
 const next={...run,score,streak,best:Math.max(run.best,streak),correct:run.correct+(correct?1:0),progress:[...run.progress,score],inventory};
 return {run:next,result:{correct,gained,streak,shieldUsed,award,timedOut:value===null,doubled:!!run.effects.doble&&correct}};
}
export function advanceRun(run,total){const index=run.index+1;return {...run,index,effects:{},done:index>=total}}
// Posición del jugador frente a recorridos anteriores del mismo cuestionario, en el mismo punto del recorrido
export function rankAt(records,run){const i=run.progress.length-1;const others=records.filter(r=>r.quizId===run.quizId&&r.revision===run.revision&&r.progress.length>i).map(r=>r.progress[i]);return {position:1+others.filter(s=>s>run.score).length,of:others.length+1}}
export function leaderboard(records,quizId,revision){const best=new Map();for(const r of records)if(r.quizId===quizId&&r.revision===revision){const key=r.nick.toLocaleLowerCase(),old=best.get(key);if(!old||r.score>old.score)best.set(key,r)}return [...best.values()].sort((a,b)=>b.score-a.score||a.finished.localeCompare(b.finished))}
export function recordOf(run,now=new Date()){return {quizId:run.quizId,revision:run.revision,nick:run.nick,score:run.score,correct:run.correct,best:run.best,progress:run.progress,finished:now.toISOString()}}
