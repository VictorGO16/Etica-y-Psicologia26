import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import ExcelJS from 'exceljs';
import { createHandler } from '../api/asistencia.js';
import { UAH, distance, checkLocation, monday } from '../lib/asistencia.js';
import { testDatabase, response } from './support.mjs';
import { currentLocation } from '../asistencia/location.js';

process.env.TESTS_ADMIN_KEY='clave-solo-para-pruebas-locales';
let pg,sql,handler,admin;
const request = async (action,{method='GET',body,cookie,query={},headers={}}={}) => {
  const res=response();await handler({method,query:{action,...query},body,headers:{host:'localhost:4175',...(cookie?{cookie}:{}),...headers}},res);return res;
};
const activate = async (date,module=1,extra={}) => request('activate',{method:'POST',cookie:admin,body:{date,module,minutes:5,requireLocation:false,...UAH,replace:false,...extra}});
const form = async token => {const r=await request('form',{query:{token}});assert.equal(r.statusCode,200);return r.headers['set-cookie'].split(';')[0];};
const submit = (token,studentId,cookie,location) => request('submit',{method:'POST',cookie,body:{token,studentId,...(location?{location}:{})}});
before(async()=>{
  ({pg,sql}=await testDatabase());handler=createHandler(()=>sql);
  const login=await request('login',{method:'POST',body:{key:process.env.TESTS_ADMIN_KEY}});assert.equal(login.statusCode,200);admin=login.headers['set-cookie'].split(';')[0];
});
after(async()=>{await pg?.close();});

test('migración repetible, 45 estudiantes, ninguna columna con coordenadas del estudiante o RUT',async()=>{
  await pg.exec(await readFile(new URL('../sql/asistencia.sql',import.meta.url),'utf8'));
  assert.equal((await sql`SELECT count(*)::int AS n FROM asistencia_students`)[0].n,45);
  const columns=await sql`SELECT column_name FROM information_schema.columns WHERE table_name='asistencia_records'`;
  assert.deepEqual(columns.map(x=>x.column_name).sort(),['id','session_id','student_id','device_id','recorded_at','location_checked'].sort());
  assert.deepEqual((await sql`SELECT column_name FROM information_schema.columns WHERE table_name='asistencia_students'`).map(x=>x.column_name).sort(),['id','name']);
});
test('panel privado, clave incorrecta, cookie manipulada, método y origen rechazados',async()=>{
  assert.equal((await request('data')).statusCode,401);
  assert.equal((await request('export')).statusCode,401);
  assert.equal((await request('login',{method:'POST',body:{key:'incorrecta'}})).statusCode,401);
  assert.equal((await request('data',{cookie:admin.slice(0,-1)+'x'})).statusCode,401);
  assert.equal((await request('activate',{cookie:admin})).statusCode,405);
  assert.equal((await request('logout',{method:'POST',headers:{origin:'https://otro.example'}})).statusCode,403);
});
test('lunes, minutos enteros y coordenadas validados; confirmación custom obligatoria',async()=>{
  assert.throws(()=>monday('2026-10-06'));assert.throws(()=>monday('2026-02-30'));
  assert.equal((await activate('2026-10-06')).statusCode,400);
  assert.equal((await activate('2026-10-05',1,{minutes:1.5})).statusCode,400);
  assert.equal((await activate('2026-10-05',1,{latitude:95})).statusCode,400);
  assert.equal((await activate('2026-10-05',1,{latitude:0})).statusCode,409);
});
test('registro, reintento idempotente, bloqueo por dispositivo/estudiante, módulo siguiente permitido',async()=>{
  const a=await activate('2026-10-12');assert.equal(a.statusCode,200);const token=a.data.session.token;
  const cookie=await form(token);const first=await submit(token,1,cookie);assert.equal(first.statusCode,200);assert.equal(first.data.already,false);
  const retry=await submit(token,1,cookie);assert.equal(retry.statusCode,200);assert.equal(retry.data.recordedAt,first.data.recordedAt);assert.equal(retry.data.already,true);
  assert.equal((await submit(token,2,cookie)).statusCode,409);
  assert.equal((await submit(token,1,await form(token))).statusCode,409);
  assert.equal((await submit(token,2,cookie.replace(/.$/,'x'))).statusCode,400);
  const next=await activate('2026-10-12',2);assert.equal((await submit(next.data.session.token,1,cookie)).statusCode,200);
  assert.equal((await request('form',{cookie,query:{token}})).data.receipt.name,first.data.name);
});
test('reemplazo atómico exige confirmación, no afecta otros módulos e invalida el QR viejo',async()=>{
  const data=(await request('data',{cookie:admin})).data;
  const s=data.sessions.find(s=>s.date==='2026-10-12'&&s.module===1);
  const conflict=await activate(s.date);assert.equal(conflict.statusCode,409);assert.equal(conflict.data.count,1);
  assert.equal((await submit(s.token,3,await form(s.token))).statusCode,200);
  const reset=await activate(s.date,1,{replace:true,expectedToken:s.token});assert.equal(reset.statusCode,200);assert.notEqual(reset.data.session.token,s.token);
  assert.equal((await request('form',{query:{token:s.token}})).statusCode,410);
  assert.equal((await activate(s.date,1,{replace:true,expectedToken:s.token})).statusCode,409);
  const fresh=(await request('data',{cookie:admin})).data;
  assert.equal(fresh.sessions.find(x=>x.date===s.date&&x.module===1).count,0);
  assert.equal(fresh.sessions.find(x=>x.date===s.date&&x.module===2).count,1);
  assert.equal((await submit(reset.data.session.token,1,await form(reset.data.session.token))).statusCode,200);
});
test('vencimiento, tiempo extra conserva registros/token/configuración y bloqueo de duplicados',async()=>{
  const a=await activate('2026-10-19',1,{requireLocation:true,latitude:0,longitude:0,confirmCustom:true});const s=a.data.session;
  const cookie=await form(s.token),location={latitude:0,longitude:0,accuracy:10,timestamp:Date.now()};
  assert.equal((await submit(s.token,1,cookie,location)).statusCode,200);
  await sql`UPDATE asistencia_sessions SET expires_at=clock_timestamp()-interval '1 minute' WHERE id=${s.id}::uuid`;
  assert.equal((await submit(s.token,2,await form((await activate('2026-10-26')).data.session.token),location)).statusCode,410);
  const reopen=await request('extend',{method:'POST',cookie:admin,body:{id:s.id,token:s.token,minutes:3}});assert.equal(reopen.statusCode,200);
  assert.equal(reopen.data.session.token,s.token);assert.equal(reopen.data.session.latitude,0);assert.equal(reopen.data.session.requireLocation,true);
  assert.ok(new Date(reopen.data.session.expiresAt).getTime()>Date.now()+170000);
  assert.equal((await submit(s.token,2,cookie,{...location,timestamp:Date.now()})).statusCode,409);
  assert.equal((await submit(s.token,2,await form(s.token),{...location,timestamp:Date.now()})).statusCode,200);
  const expiry=new Date(reopen.data.session.expiresAt).getTime();
  const extend=await request('extend',{method:'POST',cookie:admin,body:{id:s.id,token:s.token,minutes:2}});
  assert.equal(new Date(extend.data.session.expiresAt).getTime(),expiry+120000);
});
test('ubicación precisa/fresca, radio conservador y sin persistencia de la medición',async()=>{
  const s={...UAH};const location={...UAH,accuracy:20,timestamp:Date.now()};
  assert.equal(distance(UAH,UAH),0);assert.equal(checkLocation(location,s),true);
  assert.throws(()=>checkLocation({...location,accuracy:1000},s),/poco precisa/);
  assert.throws(()=>checkLocation({...location,timestamp:Date.now()-120000},s),/reciente/);
  assert.throws(()=>checkLocation({...location,latitude:UAH.latitude+0.02},s),/fuera/);
  assert.throws(()=>checkLocation({...location,latitude:UAH.latitude+0.0068,accuracy:90},s),/precisión/);
  const a=await activate('2026-11-02',1,{requireLocation:true});const cookie=await form(a.data.session.token);
  assert.equal((await submit(a.data.session.token,1,cookie)).statusCode,400);
  assert.equal((await submit(a.data.session.token,1,cookie,{...location,timestamp:Date.now()})).statusCode,200);
  const [row]=await sql`SELECT * FROM asistencia_records WHERE session_id=${a.data.session.id}::uuid`;
  assert.equal(row.location_checked,true);assert.equal('latitude' in row,false);
});
test('doble envío concurrente solo guarda una persona por dispositivo',async()=>{
  const a=await activate('2026-11-09');const token=a.data.session.token,cookie=await form(token);
  const results=await Promise.all([submit(token,1,cookie),submit(token,2,cookie)]);
  assert.deepEqual(results.map(r=>r.statusCode).sort(),[200,409]);
  assert.equal((await sql`SELECT count(*)::int AS n FROM asistencia_records WHERE session_id=${a.data.session.id}::uuid`)[0].n,1);
});
test('estado público solo tomas activas, QR SVG propio, sin nómina ni punto custom en el estado',async()=>{
  const a=await activate('2026-11-16');const s=a.data.session;
  const state=await request('state');assert.equal(state.statusCode,200);assert.equal('students' in state.data,false);assert.equal('latitude' in state.data.sessions[0],false);
  const qr=await request('qr',{query:{token:s.token}});assert.equal(qr.statusCode,200);assert.match(qr.data,/<svg/);assert.equal(qr.headers['cache-control'],'no-store, max-age=0');
  await sql`UPDATE asistencia_sessions SET expires_at=clock_timestamp()-interval '1 second' WHERE id=${s.id}::uuid`;
  assert.equal((await request('qr',{query:{token:s.token}})).statusCode,410);
  assert.ok(!(await request('state')).data.sessions.some(x=>x.id===s.id));
});
test('exportación XLSX real por módulo, día y todo, con detalle/matriz y horas Chile sin dispositivos',async()=>{
  for(const query of [{date:'2026-10-12',module:'2'},{date:'2026-10-12'},{}]){
    const data=(await request('data',{cookie:admin,query})).data;
    const exported=await request('export',{cookie:admin,query});assert.equal(exported.statusCode,200);
    const book=new ExcelJS.Workbook();await book.xlsx.load(exported.data);
    assert.equal(book.worksheets.length,2);assert.equal(book.getWorksheet('Registros').rowCount,data.records.length+1);
    assert.equal(book.getWorksheet('Por estudiante y día').rowCount,1+45*new Set(data.sessions.map(s=>s.date)).size);
    const header=book.getWorksheet('Registros').getRow(1).values.join(' ');assert.doesNotMatch(header,/device|latitude|longitude|RUT/);
    assert.ok(book.getWorksheet('Registros').views[0].ySplit===1);
  }
  assert.equal((await request('export',{cookie:admin,query:{date:'2026-10-06'}})).statusCode,400);
});
test('ubicación del dispositivo solicita una medición precisa nueva y maneja permiso/timeout',async()=>{
  let options;
  const location=await currentLocation({getCurrentPosition(success,_error,settings){options=settings;success({coords:{...UAH,accuracy:10},timestamp:12345});}});
  assert.deepEqual(location,{...UAH,accuracy:10,timestamp:12345});assert.deepEqual(options,{enableHighAccuracy:true,maximumAge:0,timeout:20000});
  await assert.rejects(currentLocation(null),/no permite/);
  await assert.rejects(currentLocation({getCurrentPosition(_success,error){error({code:1});}}),/denegado/);
  await assert.rejects(currentLocation({getCurrentPosition(_success,error){error({code:3});}}),/tiempo/);
});
