export function moveItem(items,from,to){if(from<0||to<0||from>=items.length||to>=items.length)return [...items];const next=[...items];const [item]=next.splice(from,1);next.splice(to,0,item);return next}
export function normalizeOutput(value){return typeof value==='string'?value.trim():value}
