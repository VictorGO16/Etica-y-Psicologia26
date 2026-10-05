import { randomUUID } from 'node:crypto';
import QRCode from 'qrcode';
import { db, body, reply, requireAdmin, checkAdminKey, issueAdminCookie, clearAdminCookie, problem } from './tests/_shared.js';
import { uuid, monday, integer, coordinates, customCoordinates, checkLocation, getDevice, sessionView, dbResult, filters, exportWorkbook } from '../lib/asistencia.js';

function sameOrigin(req) {
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (origin && (!host || new URL(origin).host !== host)) throw problem(403, 'Origen no permitido.');
  if (req.headers['sec-fetch-site'] === 'cross-site') throw problem(403, 'Origen no permitido.');
}
async function activeSession(sql, token) {
  const rows = await sql`SELECT * FROM asistencia_sessions WHERE token=${uuid(token)}::uuid AND expires_at>clock_timestamp()`;
  if (!rows.length) throw problem(410, 'Esta toma de asistencia terminó o fue reemplazada.');
  return rows[0];
}
async function report(sql, query) {
  const {date,module} = filters(query);
  const [students, sessions, records] = await sql.transaction([
    sql`SELECT id,name FROM asistencia_students ORDER BY name`,
    sql`SELECT s.*, (SELECT count(*) FROM asistencia_records r WHERE r.session_id=s.id) AS count
      FROM asistencia_sessions s WHERE (${date}::date IS NULL OR s.class_date=${date}::date)
      AND (${module}::int IS NULL OR s.module=${module}::int) ORDER BY class_date DESC,module`,
    sql`SELECT r.student_id, st.name, s.class_date, s.module, r.recorded_at, r.location_checked
      FROM asistencia_records r JOIN asistencia_sessions s ON s.id=r.session_id JOIN asistencia_students st ON st.id=r.student_id
      WHERE (${date}::date IS NULL OR s.class_date=${date}::date) AND (${module}::int IS NULL OR s.module=${module}::int)
      ORDER BY s.class_date DESC,s.module,st.name`
  ], {isolationLevel:'RepeatableRead',readOnly:true});
  const now = Date.now();
  students.sort((a,b)=>a.name.localeCompare(b.name,'es'));
  return {serverTime:new Date(now).toISOString(),students,sessions:sessions.map(s=>sessionView(s,now,true)),records:records.map(r=>({
    studentId:Number(r.student_id),name:r.name,date:String(r.class_date instanceof Date?r.class_date.toISOString():r.class_date).slice(0,10),
    module:Number(r.module),recordedAt:new Date(r.recorded_at).toISOString(),locationChecked:r.location_checked
  }))};
}
export function createHandler(getDb = db) {
  return async function handler(req,res) {
    res.setHeader('Cache-Control','no-store, max-age=0');
    res.setHeader('X-Content-Type-Options','nosniff');
    const action = req.query?.action || 'state';
    try {
      const gets = ['state','form','qr','data','export'];
      const posts = ['login','logout','activate','extend','submit'];
      if (!gets.includes(action) && !posts.includes(action)) throw problem(404,'Operación no disponible.');
      if (req.method !== (gets.includes(action)?'GET':'POST')) { res.setHeader('Allow',gets.includes(action)?'GET':'POST'); throw problem(405,'Método no permitido.'); }
      if (req.method==='POST') sameOrigin(req);
      if (action==='login') {
        const b=body(req,4000);
        if (typeof b.key!=='string' || !checkAdminKey(b.key)) throw problem(401,'Clave incorrecta.');
        issueAdminCookie(req,res); return reply(res,200,{ok:true});
      }
      if (action==='logout') { clearAdminCookie(req,res); return reply(res,200,{ok:true}); }
      if (['data','export','activate','extend'].includes(action)) requireAdmin(req);
      const sql=getDb();
      if (action==='state') {
        const rows=await sql`SELECT * FROM asistencia_sessions WHERE expires_at>clock_timestamp() ORDER BY class_date,module`;
        return reply(res,200,{serverTime:new Date().toISOString(),sessions:rows.map(s=>sessionView(s))});
      }
      if (action==='form') {
        const s=await activeSession(sql,req.query.token);
        const device=getDevice(req,res,true);
        const students=await sql`SELECT id,name FROM asistencia_students ORDER BY name`;
        students.sort((a,b)=>a.name.localeCompare(b.name,'es'));
        const existing=await sql`SELECT r.student_id,r.recorded_at,st.name FROM asistencia_records r
          JOIN asistencia_students st ON st.id=r.student_id WHERE session_id=${s.id}::uuid AND device_id=${device}::uuid`;
        return reply(res,200,{serverTime:new Date().toISOString(),session:sessionView(s),students,
          receipt:existing[0]?{name:existing[0].name,recordedAt:new Date(existing[0].recorded_at).toISOString()}:null});
      }
      if (action==='qr') {
        await activeSession(sql,req.query.token);
        // QR propio: no envía enlaces ni nombres a servicios externos.
        // Un QR necesita una URL absoluta para que funcione desde la cámara del teléfono.
        const host=String(req.headers.host||'');
        if (!/^[a-z0-9.:[\]-]+$/i.test(host)) throw problem(400,'Dominio no válido.');
        const scheme=process.env.VERCEL || req.headers['x-forwarded-proto']==='https'?'https':'http';
        const absolute=await QRCode.toString(`${scheme}://${host}/asistencia/registrar.html?token=${req.query.token}`,{type:'svg',width:320,margin:4,errorCorrectionLevel:'M'});
        res.setHeader('Content-Type','image/svg+xml'); return res.status(200).send(absolute);
      }
      if (action==='data' || action==='export') {
        const data=await report(sql,req.query);
        if (action==='data') return reply(res,200,data);
        const buffer=await exportWorkbook(data.students,data.sessions,data.records);
        const suffix=[req.query.date||'todas',req.query.module?`modulo-${req.query.module}`:''].filter(Boolean).join('-');
        res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition',`attachment; filename="asistencia-${suffix}.xlsx"`);
        return res.status(200).send(buffer);
      }
      const b=body(req,8000);
      if (action==='activate') {
        const date=monday(b.date), module=integer(b.module,1,3,'Módulo'), minutes=integer(b.minutes,1,240,'Minutos');
        if (typeof b.requireLocation!=='boolean' || typeof b.replace!=='boolean') throw problem(400,'Configuración no válida.');
        const p=coordinates(b.latitude,b.longitude);
        if (customCoordinates(p) && b.confirmCustom!==true) throw problem(409,'Las coordenadas no son las de la UAH. Confirma su uso.');
        const expected=b.replace?uuid(b.expectedToken):null;
        const rows=await sql`SELECT asistencia_activate(${randomUUID()}::uuid,${date}::date,${module},${randomUUID()}::uuid,${minutes},${b.requireLocation},${p.latitude},${p.longitude},${b.replace},${expected}::uuid) AS result`;
        return reply(res,200,{ok:true,session:sessionView(dbResult(rows).session,Date.now(),true)});
      }
      if (action==='extend') {
        const rows=await sql`SELECT asistencia_extend(${uuid(b.id)}::uuid,${uuid(b.token)}::uuid,${integer(b.minutes,1,240,'Minutos')}::int) AS result`;
        return reply(res,200,{ok:true,session:sessionView(dbResult(rows).session,Date.now(),true)});
      }
      if (action==='submit') {
        const token=uuid(b.token),student=integer(b.studentId,1,1000000,'Estudiante'),device=getDevice(req,res);
        const s=await activeSession(sql,token);
        if (s.require_location) checkLocation(b.location,s);
        const result=dbResult(await sql`SELECT asistencia_submit(${token}::uuid,${student},${device}::uuid,${Boolean(s.require_location)}) AS result`);
        const [person]=await sql`SELECT name FROM asistencia_students WHERE id=${student}`;
        return reply(res,200,{ok:true,already:result.already,name:person.name,date:sessionView(s).date,module:Number(s.module),recordedAt:new Date(result.record.recorded_at).toISOString()});
      }
    } catch (error) {
      // No imprimir req.body ni errores SQL: pueden incluir datos personales.
      const status=Number.isInteger(error.status)?error.status:500;
      return reply(res,status,{error:status===500?'No se pudo completar la operación. Comprueba la configuración de Neon y Vercel.':error.message,
        ...(error.code==='confirm'?{code:'confirm',count:error.count,token:error.token}:{})});
    }
  };
}
export default createHandler();
