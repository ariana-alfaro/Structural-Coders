import {createCloudApi} from '../server/cloud-api.mjs';
let handler;
export default async function gateway(req,res){
 if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SECRET_KEY){res.statusCode=503;res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({error:'Falta configurar el servidor de Supabase.'}))}
 const url=new URL(req.url,'https://localhost');const route=req.query?.path||url.searchParams.get('path');if(typeof route==='string'&&route){url.searchParams.delete('path');req.url='/api/'+route+(url.searchParams.size?'?'+url.searchParams.toString():'')}
 handler??=createCloudApi();return handler(req,res);
}
