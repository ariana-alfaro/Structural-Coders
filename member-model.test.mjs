import {test} from 'node:test';

import assert from 'node:assert/strict';

import {archiveQuiz,restoreQuiz,archivedQuiz,usableLocalResults,permanentlyDeleteQuiz} from '../src/member-model.mjs';

test('Eliminar y restaurar conserva preguntas, publicaciones y configuración',()=>{const original={drafts:[{id:'a',questions:[{title:'Editada'}]}],publications:[{id:'a',revision:3}],setting:'conservar'};const deleted=archiveQuiz(original,'a');assert.equal(archivedQuiz(deleted,'a'),true);assert.deepEqual(deleted.drafts,original.drafts);assert.deepEqual(deleted.publications,original.publications);assert.equal(deleted.setting,'conservar');assert.equal(archivedQuiz(original,'a'),false);assert.deepEqual(archiveQuiz(deleted,'a').archivedQuizIds,['a']);assert.equal(archivedQuiz(restoreQuiz(deleted,'a'),'a'),false);assert.throws(()=>archiveQuiz(original,'missing'));});

test('Resultados dañados o incompletos no bloquean la navegación',()=>{for(const raw of ['{','{}','null','[null,{}]'])assert.deepEqual(usableLocalResults(raw),[]);const row={name:'Aspirante',score:18,elapsed:1000,finished:'2026-10-18T12:00:00Z'};assert.deepEqual(usableLocalResults(JSON.stringify([null,row,{}])),[row]);});


test('Borrado definitivo exige papelera y nombre exacto, preserva otros datos',()=>{const data={drafts:[{id:'a',title:'Mi taller',questions:[{id:1}]},{id:'b',title:'Otro'}],publications:[{id:'a',revision:1},{id:'a',revision:2},{id:'b',revision:1}],archivedQuizIds:['a'],results:[{score:100}]};assert.throws(()=>permanentlyDeleteQuiz(data,'a','Incorrecto'));assert.throws(()=>permanentlyDeleteQuiz(data,'b','Otro'));const result=permanentlyDeleteQuiz(data,'a','Mi taller');assert.deepEqual(result.drafts,[data.drafts[1]]);assert.deepEqual(result.publications,[data.publications[2]]);assert.deepEqual(result.archivedQuizIds,[]);assert.deepEqual(result.deletedQuizIds,['a']);assert.deepEqual(result.results,data.results);assert.equal(data.drafts.length,2)});
