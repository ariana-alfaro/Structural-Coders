export const avatars=Object.freeze([
 ['castor','Castor','Constructor'],['robot','Robot','Programador'],['buho','Búho','Calculista'],['gato','Gato','Estructural'],
 ['tortuga','Tortuga','Puentes'],['pato','Pato','Topógrafo'],['conejo','Conejo','Proyectista'],['mapache','Mapache','Mantenimiento'],
 ['panda','Panda','Python'],['zorro','Zorro','Dibujante'],['pulpo','Pulpo','Multitarea'],['hamster','Hámster','Electrónica'],
 ['elefante','Elefante','Supervisor'],['rana','Rana','Materiales'],['koala','Koala','Constructor'],['capibara','Capibara','Analista']
].map(([id,name,role],index)=>Object.freeze({id,name,role,index})));
export const isAvatar=value=>typeof value==='string'&&avatars.some(a=>a.id===value);
export const normalizeAvatar=value=>isAvatar(value)?value:'castor';
export const avatarInfo=value=>avatars.find(a=>a.id===normalizeAvatar(value));
const key='sc-avatar-v1';
export function preferredAvatar(){try{return normalizeAvatar(localStorage.getItem(key))}catch{return 'castor'}}
export function rememberAvatar(value){const id=normalizeAvatar(value);try{localStorage.setItem(key,id)}catch{}return id}
