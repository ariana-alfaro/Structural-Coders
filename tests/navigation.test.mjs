import {test} from 'node:test';
import assert from 'node:assert/strict';
import {viewFromHash,liveJoinUrl} from '../src/navigation.mjs';
test('Los enlaces antiguos de docente abren Miembro GADEST y en vivo pertenece a Aspirante',()=>{assert.equal(viewFromHash('#docente'),'member');assert.equal(viewFromHash('#miembro'),'member');assert.equal(viewFromHash('#vivo=123456'),'live');assert.equal(viewFromHash('#practica'),'aspirant');assert.equal(viewFromHash(''),'aspirant')});
test('El QR usa la dirección pública configurada cuando la pantalla anfitriona está en localhost',()=>{assert.equal(liveJoinUrl('123456','http://localhost:5173','/','https://taller.example'), 'https://taller.example/#vivo=123456');assert.equal(liveJoinUrl('123456','https://a.example','/quiz/'), 'https://a.example/quiz/#vivo=123456');assert.equal(liveJoinUrl('123456','http://localhost:5173','/','https://taller.example/app/'), 'https://taller.example/app/#vivo=123456')});
