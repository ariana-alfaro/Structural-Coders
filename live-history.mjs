import {standings} from './live-model.mjs';
export function liveReport(game){
 if(game.phase!=='podium')throw new Error('La partida todavía no termina.');
 return {id:game.id,pin:game.pin,title:game.quiz.title,quizId:game.quiz.id,finished:new Date().toISOString(),total:game.quiz.questions.length,rows:standings(game).map((p,i)=>({position:i+1,name:p.name,universityCode:p.universityCode||'',score:p.score,correct:p.correct}))};
}
export function validReport(r){return !!r&&typeof r.id==='string'&&/^[a-f0-9-]{36}$/.test(r.id)&&typeof r.title==='string'&&r.title.length<=200&&/^\d{6}$/.test(r.pin)&&typeof r.quizId==='string'&&r.quizId.length<=100&&Number.isFinite(Date.parse(r.finished))&&Number.isInteger(r.total)&&r.total>0&&r.total<=100&&Array.isArray(r.rows)&&r.rows.length>0&&r.rows.length<=200&&r.rows.every(p=>p&&typeof p.name==='string'&&p.name.length<=20&&typeof p.universityCode==='string'&&/^[A-Z0-9-]{4,24}$/.test(p.universityCode)&&Number.isFinite(p.score)&&p.score>=0&&p.score<=10000000&&Number.isInteger(p.correct)&&p.correct>=0&&p.correct<=r.total&&Number.isInteger(p.position)&&p.position>=1&&p.position<=200)&&new Set(r.rows.map(p=>p.universityCode)).size===r.rows.length;}
