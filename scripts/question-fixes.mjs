// Enunciados que dejan una sola respuesta correcta en el banco de talleres (revisión 2026-10-20).
// Clave: id del cuestionario → id de la pregunta → nuevo enunciado. Se usa en content/workshops.json y en
// scripts/apply-question-fixes.mjs para actualizar una biblioteca ya cargada.
const ORDER='Ordena las líneas para obtener un programa válido. Conserva la sangría.';
const BLANK='Arrastra al hueco la pieza que completa el código.';
export const questionFixes={
 S1PRAC:{9:`${ORDER} El programa debe imprimir 7.`},
 S1VIVO:{
  3:`${BLANK} El programa debe imprimir [20, 30].`,
  4:`${ORDER} print(original) va al final, después de modificar la copia.`,
  8:`${BLANK} Debe imprimir True solo si se cumplen las dos condiciones.`,
  9:`${ORDER} El programa debe imprimir 30.`,
 },
 S2PRAC:{9:`${ORDER} La conversión float("seis") debe estar dentro del bloque try.`},
 S2VIVO:{
  4:`${ORDER} El programa debe imprimir 3.`,
  9:`${ORDER} Al terminar, nivel debe valer "Logrado".`,
 },
 S3PRAC:{
  4:`${ORDER} Primero se dibuja la curva y después se etiqueta el eje x.`,
  8:`${BLANK} El programa debe imprimir 30.`,
 },
 S5PRAC:{
  4:`${ORDER} Los pasos deben imprimirse en el orden del flujo: materiales, geometría y análisis.`,
  9:`${ORDER} estado se asigna después de comprobar el código de retorno.`,
 },
 S5VIVO:{9:`${ORDER} Primero se obtiene el modelo y luego se define la ruta del archivo.`},
 S6VIVO:{
  4:`${ORDER} Al terminar, mensaje debe valer "Altura inválida".`,
  9:`${ORDER} El lienzo se dibuja antes de colocarlo en la ventana.`,
 },
 S7PRAC:{4:`${ORDER} El título va justo después del import.`},
 S7VIVO:{4:`${ORDER} El bloque with izquierda va antes de escribir en derecha.`},
};
export function applyFixes(quiz){const fixes=questionFixes[quiz.code];if(!fixes)return {quiz,changed:0};let changed=0;const questions=quiz.questions.map(q=>{const brief=fixes[q.id];if(!brief||q.brief===brief)return q;changed++;return {...q,brief}});return {quiz:changed?{...quiz,questions,updatedAt:new Date().toISOString()}:quiz,changed}}
