import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateQuiz,preparePublication,matchesAnswer} from '../src/authoring-model.mjs';
const bank=JSON.parse(await readFile(new URL('../content/workshops.json',import.meta.url),'utf8'));
test('Siete talleres, dos modos y 140 preguntas originales válidas y editables',()=>{
 assert.equal(bank.quizzes.length,14);const titles=new Set(),codes=new Set();
 for(let session=1;session<=7;session++){
  const pair=bank.quizzes.filter(q=>q.course.endsWith(`Taller ${session}`));assert.equal(pair.length,2);
  assert.equal(pair.filter(q=>q.game.enabled).length,1);
  for(const q of pair){assert.equal(q.questions.length,10);assert.deepEqual(validateQuiz(q),[]);codes.add(q.code);assert.equal(new Set(q.questions.map(q=>q.type)).size,5);const pub=preparePublication(q,1);for(const item of pub.questions){assert(matchesAnswer(item,item.solution));assert(!titles.has(item.title));titles.add(item.title)}}
 }
 assert.equal(titles.size,140);assert.equal(codes.size,14);
});
