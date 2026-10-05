import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';

// Adaptador de pruebas para la interfaz HTTP de Neon. Ejecuta el SQL real en PostgreSQL WASM.
export function sqlFor(pg) {
  const sql = (strings,...values) => {
    const text=strings.reduce((out,s,i)=>out+s+(i<values.length?`$${i+1}`:''),'');
    return {text,values,then(resolve,reject){return pg.query(text,values).then(r=>r.rows).then(resolve,reject);}};
  };
  sql.transaction=queries=>pg.transaction(async tx=>{
    const out=[];for(const q of queries)out.push((await tx.query(q.text,q.values)).rows);return out;
  });
  return sql;
}
export async function testDatabase() {
  const pg=new PGlite();
  await pg.exec(await readFile(new URL('../sql/asistencia.sql',import.meta.url),'utf8'));
  await pg.exec(await readFile(new URL('../sql/asistencia-borrar.sql',import.meta.url),'utf8'));
  await pg.exec(await readFile(new URL('../sql/asistencia-boton.sql',import.meta.url),'utf8'));
  return {pg,sql:sqlFor(pg)};
}
export function response() {
  return {statusCode:200,headers:{},setHeader(k,v){this.headers[k.toLowerCase()]=v;},status(n){this.statusCode=n;return this;},json(value){this.data=value;return this;},send(value){this.data=value;return this;}};
}
