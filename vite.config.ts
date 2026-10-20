import { defineConfig,loadEnv } from 'vite';
import {createMemberApi} from './server/member-api.mjs';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig(({mode})=>{const env=loadEnv(mode,process.cwd());return {plugins:[tailwindcss(),{name:'gadest-members',async configureServer(server){server.middlewares.use(await createMemberApi())}}],server:{allowedHosts:['.trycloudflare.com'],watch:{ignored:['**/.private/**']}},preview:{allowedHosts:['.trycloudflare.com']},define:{__CLOUD__:JSON.stringify(mode==='cloud'),__LIVE__:JSON.stringify(mode!=='demo'&&mode!=='cloud'&&!!(env.VITE_SUPABASE_URL&&env.VITE_SUPABASE_ANON_KEY))}}});
