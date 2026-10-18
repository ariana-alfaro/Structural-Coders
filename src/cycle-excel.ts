import ExcelJS from 'exceljs';
export type SessionRow={code:string;name:string;correct:number;total:number;grade:number;points?:number;seconds?:number;position:number;date?:Date;marks:(boolean|null)[]};
export type SessionData={id:string;title:string;quizTitle:string;mode:string;date:Date;rows:SessionRow[]};
const metaName='_SC_CICLO';
const col=(n:number)=>{let s='';for(;n>0;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s};
function style(sheet:ExcelJS.Worksheet){sheet.views=[{state:'frozen',ySplit:1}];sheet.getRow(1).font={bold:true,color:{argb:'FFFFFFFF'}};sheet.getRow(1).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF195B91'}};sheet.getRow(1).height=28;sheet.columns.forEach((c,i)=>{c.width=i===1?30:20});sheet.autoFilter={from:{row:1,column:1},to:{row:Math.max(1,sheet.rowCount),column:sheet.columnCount}}}
export async function buildCycleWorkbook(input:ArrayBuffer|Uint8Array|null,cycle:string,session:SessionData){
 if(!cycle.trim()||!session.title.trim())throw new Error('Completa el ciclo y el nombre del taller.');
 if(!session.rows.length||session.rows.some(r=>!r.code.trim()))throw new Error('Cada aspirante necesita código universitario para consolidar el Excel.');
 if(new Set(session.rows.map(r=>r.code.trim())).size!==session.rows.length)throw new Error('Hay códigos repetidos en este taller. Exporta una versión o intento por aspirante.');
 const wb=new ExcelJS.Workbook();
 if(input){try{await wb.xlsx.load(input as never)}catch{throw new Error('No se pudo leer el archivo Excel.');}if(wb.getWorksheet(metaName)?.getCell('A1').value!=='structural-coders-cycle-v1')throw new Error('Este archivo no es un Excel del ciclo de Structural Coders.');if(wb.getWorksheet(metaName)!.getCell('B1').value!==cycle.trim())throw new Error('El archivo pertenece a otro ciclo académico.');}
 let meta=wb.getWorksheet(metaName);if(!meta){meta=wb.addWorksheet(metaName);meta.addRow(['structural-coders-cycle-v1',cycle.trim()]);meta.state='veryHidden'}
 const entries:{id:string;sheet:string;title:string}[]=[];meta.eachRow((row,i)=>{if(i>1&&wb.getWorksheet(String(row.getCell(2).value)))entries.push({id:String(row.getCell(1).value),sheet:String(row.getCell(2).value),title:String(row.getCell(3).value)})});
 if(entries.some(e=>e.id===session.id))throw new Error('Este taller ya está en el Excel. Borra su hoja si quieres reemplazarlo.');
 const index=entries.length+1;let sheetName=`T${index} ${session.title.replace(/[\\/*?:\[\]]/g,' ').trim()}`.slice(0,31);while(wb.getWorksheet(sheetName))sheetName=(sheetName.slice(0,25)+' '+crypto.randomUUID().slice(0,4)).slice(0,31);
 const workshop=wb.addWorksheet(sheetName);const markCount=Math.max(...session.rows.map(r=>r.marks.length));
 workshop.addRow(['Código','Nombre','Modalidad','Aciertos','Preguntas','Puntos de juego','Nota','Tiempo (s)','Puesto','Fecha','Cuestionario',...Array.from({length:markCount},(_,i)=>`P${i+1}`)]);
 session.rows.forEach(r=>workshop.addRow([r.code.trim(),r.name,session.mode,r.correct,r.total,r.points??null,r.grade,r.seconds??null,r.position,r.date??session.date,session.quizTitle,...Array.from({length:markCount},(_,i)=>r.marks[i]===true?'✓':r.marks[i]===false?'✗':'—')]));style(workshop);workshop.getColumn(7).numFmt='0.0';workshop.getColumn(10).numFmt='yyyy-mm-dd hh:mm';
 entries.push({id:session.id,sheet:sheetName,title:session.title});meta.spliceRows(2,Math.max(0,meta.rowCount-1));entries.forEach(e=>meta!.addRow([e.id,e.sheet,e.title]));
 for(const name of ['Resumen','Ganadores','Léeme']){const s=wb.getWorksheet(name);if(s)wb.removeWorksheet(s.id)}
 const summary=wb.addWorksheet('Resumen'),winners=wb.addWorksheet('Ganadores'),guide=wb.addWorksheet('Léeme');
 summary.addRow(['Código','Nombre',...entries.map(e=>e.sheet),'Talleres','Promedio','Podios']);winners.addRow(['Taller','Puesto','Nombre','Código','Nota','Puntos']);
 const people=new Map<string,string>();for(const entry of entries){const s=wb.getWorksheet(entry.sheet)!;s.eachRow((r,i)=>{if(i===1)return;const code=String(r.getCell(1).value??'').trim();if(code)people.set(code,String(r.getCell(2).value??''));const position=Number(r.getCell(9).value);if(position>=1&&position<=3)winners.addRow([entry.title,position,r.getCell(2).value,code,r.getCell(7).value,r.getCell(6).value])})}
 for(const [code,name] of people){const row=summary.addRow([code,name]),n=row.number;entries.forEach((e,i)=>{const name=e.sheet.replaceAll("'","''");row.getCell(i+3).value={formula:`IFERROR(INDEX('${name}'!$G:$G,MATCH($A${n},'${name}'!$A:$A,0)),"")`}});const range=`C${n}:${col(entries.length+2)}${n}`;row.getCell(entries.length+3).value={formula:`COUNT(${range})`};row.getCell(entries.length+4).value={formula:`IF(COUNT(${range})=0,"",ROUND(AVERAGE(${range}),1))`};row.getCell(entries.length+5).value={formula:entries.map(e=>`COUNTIFS('${e.sheet.replaceAll("'","''")}'!$A:$A,$A${n},'${e.sheet.replaceAll("'","''")}'!$I:$I,"<=3",'${e.sheet.replaceAll("'","''")}'!$I:$I,">=1")`).join('+')}}
 guide.addRow(['Structural Coders · Excel del ciclo',cycle.trim()]);guide.addRow(['Corrige nombres o notas en las hojas T1, T2… Las hojas Resumen y Ganadores se regeneran al agregar talleres.']);guide.addRow(['Para reemplazar un taller, borra su hoja antes de volver a importarlo. Conserva una copia de respaldo.']);guide.addRow(['Los puntos de juego y el tiempo no cambian la nota académica. El archivo contiene datos de aspirantes.']);guide.getColumn(1).width=105;guide.getColumn(2).width=25;style(summary);style(winners);wb.calcProperties.fullCalcOnLoad=true;
 // Place the regenerated reports first; workshop rows remain untouched.
 const order=['Resumen','Ganadores',...entries.map(e=>e.sheet),'Léeme',metaName];order.forEach((name,i)=>{const sheet=wb.getWorksheet(name)!;(sheet as unknown as {orderNo:number}).orderNo=i});
 return {buffer:await wb.xlsx.writeBuffer(),sheet:sheetName};
}
