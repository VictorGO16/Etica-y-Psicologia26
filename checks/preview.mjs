// Vista completa local con DB de prueba en memoria. Nunca usa Neon ni secretos de Vercel.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHandler } from '../api/asistencia.js';
import { testDatabase } from './support.mjs';

process.env.TESTS_ADMIN_KEY='asistencia-local-pruebas';
const {pg,sql}=await testDatabase();const handler=createHandler(()=>sql);
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../publicado');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/api/asistencia'){
    req.query=Object.fromEntries(url.searchParams);let raw='';
    for await(const chunk of req){raw+=chunk;if(raw.length>1500000){res.writeHead(413).end();return;}}
    try{req.body=raw?JSON.parse(raw):undefined;}catch{res.writeHead(400).end();return;}
    res.status=n=>{res.statusCode=n;return res;};res.json=data=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data));};res.send=data=>res.end(data);
    await handler(req,res);return;
  }
  try{
    const target=path.resolve(root,'.'+decodeURIComponent(url.pathname));
    if(!target.startsWith(root+path.sep)&&target!==root){res.writeHead(403).end();return;}
    const file=(await stat(target)).isDirectory()?path.join(target,'index.html'):target;
    res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(await readFile(file));
  }catch{res.writeHead(404).end('No encontrado');}
});
server.listen(4175,'127.0.0.1',()=>console.log('Vista de prueba: http://127.0.0.1:4175/asistencia/ · clave local: asistencia-local-pruebas'));
process.on('SIGINT',async()=>{server.close();await pg.close();process.exit(0);});
