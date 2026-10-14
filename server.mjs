import http from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve('dist');
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.mp4':'video/mp4','.webm':'video/webm'};
http.createServer(async(req,res)=>{try{
 const route=new URL(req.url,'http://localhost').pathname;
 // Authoring endpoint is opt-in, loopback only, and never shipped to Sites static hosting.
 if(process.env.RENDER_FILMS==='1'){
  if(route.startsWith('/__capture/')&&req.method==='POST'){
   const id=route.slice('/__capture/'.length);if(!['wide','press','counter'].includes(id)||req.headers.origin!=='http://127.0.0.1:4396'){res.writeHead(403).end();return;}
   let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>60e6){res.writeHead(413).end();return;}chunks.push(chunk);}await mkdir('tmp/films',{recursive:true});await writeFile(`tmp/films/${id}.webm`,Buffer.concat(chunks));res.writeHead(200).end('Saved');return;
  }
  const authoring={'/__studio':'scripts/render.html','/__studio/replay3d.js':'scripts/replay3d.js','/vendor/three.module.js':'node_modules/three/build/three.module.js','/vendor/three.core.js':'node_modules/three/build/three.core.js'};
  if(authoring[route]){const path=authoring[route];res.writeHead(200,{'Content-Type':types[extname(path)],'Cache-Control':'no-store'}).end(await readFile(path));return;}
 }
 const path=resolve(root,'.'+decodeURIComponent(route).replace(/\/$/,'/index.html'));if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}const data=await readFile(path);const headers={'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-store','Accept-Ranges':'bytes'};
 const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);if(range){const start=Number(range[1]),end=Math.min(data.length-1,range[2]?Number(range[2]):data.length-1);if(start>end){res.writeHead(416,{'Content-Range':`bytes */${data.length}`}).end();return;}res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${data.length}`,'Content-Length':end-start+1}).end(data.subarray(start,end+1));return;}
 res.writeHead(200,{...headers,'Content-Length':data.length}).end(data);
 }catch{res.writeHead(404).end('Not found');}}).listen(4396,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4396'));
