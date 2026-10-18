import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {createMemberApi} from './member-api.mjs';
const api=await createMemberApi(),root=path.resolve('dist');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon'};
createServer((req,res)=>api(req,res,async()=>{
 try{const url=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);return res.end()}
 const target=file===root?path.join(root,'index.html'):file;const bytes=await readFile(target);res.setHeader('Content-Type',types[path.extname(target)]||'application/octet-stream');res.setHeader('X-Content-Type-Options','nosniff');res.end(bytes)
 }catch{res.writeHead(404);res.end('No encontrado')}
})).listen(Number(process.env.PORT||5175),process.env.SC_HOST||'127.0.0.1',()=>console.log('Structural Coders listo en el puerto '+(process.env.PORT||5175)));
