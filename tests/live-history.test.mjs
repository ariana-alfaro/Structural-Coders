import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,addPlayer,snapshot} from '../src/live-model.mjs';
import {liveReport,validReport} from '../src/live-history.mjs';
const quiz={id:'q',title:'Taller',questions:[{id:1,type:'choice',options:['a','b'],solution:0}]};
test('Codigo universitario requerido, unico y privado en partidas nuevas',()=>{let g=createGame(quiz,{requireUniversityCode:true});assert.throws(()=>addPlayer(g,'1','Ana'));g=addPlayer(g,'1','Ana','20260001');assert.throws(()=>addPlayer(g,'2','Luis','20260001'));assert.equal(g.players['1'].universityCode,'20260001');assert.equal(JSON.stringify(snapshot(g,0)).includes('20260001'),false);assert.equal(addPlayer(g,'1','Ana','20260001'),g)});
test('El reporte conserva la identidad y puntos solo al finalizar',()=>{let g=addPlayer(createGame(quiz,{requireUniversityCode:true}),'1','Ana','20260001');assert.throws(()=>liveReport(g));g={...g,phase:'podium'};const r=liveReport(g);assert.equal(validReport(r),true);assert.equal(validReport({...r,rows:[null]}),false);assert.equal(r.rows[0].universityCode,'20260001');assert.equal(validReport({...r,rows:[{...r.rows[0],correct:4}]}),false);assert.equal(validReport({...r,rows:[{...r.rows[0],universityCode:''}]}),false)});
