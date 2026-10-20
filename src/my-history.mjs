// Historial personal del aspirante, guardado solo en este dispositivo.
// Las evaluaciones se guardan como tokens: la nota la confirma el servidor, y nadie puede ver
// las notas de otra persona escribiendo su código universitario.
const KEY='sc-history-v1',LIMIT=100;
const empty=()=>({evals:[],live:[],practices:[]});
export function readHistory(storage=globalThis.localStorage){try{const h=JSON.parse(storage.getItem(KEY)||'null');return h&&Array.isArray(h.evals)&&Array.isArray(h.live)&&Array.isArray(h.practices)?h:empty()}catch{return empty()}}
function write(next,storage){try{storage.setItem(KEY,JSON.stringify(next))}catch{}return next}
export function rememberEval(token,storage=globalThis.localStorage){if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))return readHistory(storage);const h=readHistory(storage);return h.evals.includes(token)?h:write({...h,evals:[token,...h.evals].slice(0,LIMIT)},storage)}
export function rememberLive(entry,storage=globalThis.localStorage){const h=readHistory(storage);if(h.live.some(x=>x.key===entry.key))return h;return write({...h,live:[entry,...h.live].slice(0,LIMIT)},storage)}
export function rememberPractice(entry,storage=globalThis.localStorage){const h=readHistory(storage);return write({...h,practices:[entry,...h.practices].slice(0,LIMIT)},storage)}
export function clearHistory(storage=globalThis.localStorage){try{storage.removeItem(KEY)}catch{}return empty()}
