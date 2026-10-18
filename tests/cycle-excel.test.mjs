import {test} from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import {buildCycleWorkbook} from '../src/cycle-excel.ts';
const row=(code,name,grade,position,marks)=>({code,name,correct:marks.filter(Boolean).length,total:marks.length,grade,points:position===1?1800:900,seconds:40,position,marks});
const t1={id:'vivo-1',title:'Fundamentos',quizTitle:'Fundamentos de Python',mode:'En vivo',date:new Date('2026-03-10'),rows:[row('2026001','Ana',20,1,[true,true]),row('2026002','Luis',10,2,[true,false])]};
const t2={id:'vivo-2',title:'Listas',quizTitle:'Listas',mode:'Individual',date:new Date('2026-03-17'),rows:[row('2026002','Luis',20,1,[true,null]),row('2026003','Rosa',0,2,[false,false])]};
const read=async buf=>{const wb=new ExcelJS.Workbook();await wb.xlsx.load(buf);return wb};
test('El Excel del ciclo acumula talleres, resume con fórmulas y lista ganadores',async()=>{
 const first=await buildCycleWorkbook(null,'26-1',t1);
 const second=await buildCycleWorkbook(first.buffer,'26-1',t2);
 const wb=await read(second.buffer);
 assert.deepEqual(wb.worksheets.filter(w=>w.state!=='veryHidden').map(w=>w.name),['Resumen','Ganadores','T1 Fundamentos','T2 Listas','Léeme']);
 const sum=wb.getWorksheet('Resumen');
 assert.deepEqual(sum.getRow(1).values.slice(1),['Código','Nombre','T1 Fundamentos','T2 Listas','Talleres','Promedio','Podios']);
 assert.deepEqual([2,3,4].map(r=>sum.getRow(r).getCell(2).value),['Ana','Luis','Rosa']);
 assert.match(sum.getCell('C3').value.formula,/^IFERROR\(INDEX\('T1 Fundamentos'!\$G:\$G,MATCH\(\$A3,'T1 Fundamentos'!\$A:\$A,0\)\),""\)$/);
 assert.equal(sum.getCell('F3').value.formula,'IF(COUNT(C3:D3)=0,"",ROUND(AVERAGE(C3:D3),1))');
 const t=wb.getWorksheet('T2 Listas');assert.deepEqual(t.getRow(2).values.slice(12),['✓','—']);assert.equal(t.getCell('A2').value,'2026002');
 const win=wb.getWorksheet('Ganadores');assert.equal(win.rowCount,5);assert.equal(win.getCell('C2').value,'Ana');
});
test('Un taller no se agrega dos veces, salvo que se borre su hoja',async()=>{
 const first=await buildCycleWorkbook(null,'26-1',t1);
 await assert.rejects(buildCycleWorkbook(first.buffer,'26-1',t1),/ya está en el Excel/);
 const wb=await read(first.buffer);wb.removeWorksheet(wb.getWorksheet('T1 Fundamentos').id);
 const again=await buildCycleWorkbook(await wb.xlsx.writeBuffer(),'26-1',t1);assert.equal(again.sheet,'T1 Fundamentos');
});
test('Las notas editadas a mano en una hoja de taller se conservan al agregar otro',async()=>{
 const wb=await read((await buildCycleWorkbook(null,'26-1',t1)).buffer);wb.getWorksheet('T1 Fundamentos').getCell('G3').value=14;
 const out=await read((await buildCycleWorkbook(await wb.xlsx.writeBuffer(),'26-1',t2)).buffer);
 assert.equal(out.getWorksheet('T1 Fundamentos').getCell('G3').value,14);
 await assert.rejects(buildCycleWorkbook(new TextEncoder().encode('no es excel').buffer,'26-1',t2),/No se pudo leer/);
});
