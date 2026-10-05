import { randomUUID } from 'node:crypto';
import QRCode from 'qrcode';
import {qrImage,qrView} from '../lib/university-qr.js';
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
async function nativeMode(sql){
  const [config]=await sql`SELECT enabled FROM asistencia_university_qr WHERE id=true`;
  if(config?.enabled)throw problem(410,'Usa el QR de la universidad disponible en Asistencia.');
}
async function report(sql, query) {
  const {date,module} = filters(query);
  const queries = [
    sql`SELECT id,name FROM asistencia_students ORDER BY name`,
    sql`SELECT s.*, (SELECT count(*) FROM asistencia_records r WHERE r.session_id=s.id) AS count
      FROM asistencia_sessions s WHERE (${date}::date IS NULL OR s.class_date=${date}::date)
      AND (${module}::int IS NULL OR s.module=${module}::int) ORDER BY class_date DESC,module`,
    sql`SELECT r.student_id, st.name, s.class_date, s.module, r.recorded_at, r.location_checked
      FROM asistencia_records r JOIN asistencia_sessions s ON s.id=r.session_id JOIN asistencia_students st ON st.id=r.student_id
      WHERE (${date}::date IS NULL OR s.class_date=${date}::date) AND (${module}::int IS NULL OR s.module=${module}::int)
      ORDER BY s.class_date DESC,s.module,st.name`
  ];
  if(module!==null)queries.push(sql`SELECT r.student_id, st.name, s.class_date, s.module, r.recorded_at, r.location_checked
    FROM asistencia_records r JOIN asistencia_sessions s ON s.id=r.session_id JOIN asistencia_students st ON st.id=r.student_id
    WHERE (${date}::date IS NULL OR s.class_date=${date}::date) ORDER BY s.class_date DESC,s.module,st.name`);
  queries.push(sql`SELECT enabled,version FROM asistencia_university_qr WHERE id=true`);
  const results=await sql.transaction(queries,{isolationLevel:'RepeatableRead',readOnly:true});
  const [students,sessions,records]=results,dailyRows=module!==null?results[3]:null;
  const now = Date.now();
  students.sort((a,b)=>a.name.localeCompare(b.name,'es'));
  const recordView=r=>({
    studentId:Number(r.student_id),name:r.name,date:String(r.class_date instanceof Date?r.class_date.toISOString():r.class_date).slice(0,10),
    module:Number(r.module),recordedAt:new Date(r.recorded_at).toISOString(),locationChecked:r.location_checked
  });
  const visibleRecords=records.map(recordView);
  return {serverTime:new Date(now).toISOString(),students,sessions:sessions.map(s=>sessionView(s,now,true)),records:visibleRecords,dailyRecords:dailyRows?dailyRows.map(recordView):visibleRecords,universityQr:qrView(results.at(-1)[0])};
}
export function createHandler(getDb = db) {
  return async function handler(req,res) {
    res.setHeader('Cache-Control','no-store, max-age=0');
    res.setHeader('X-Content-Type-Options','nosniff');
    const action = req.query?.action || 'state';
    try {
      const gets = ['state','form','qr','data','export','university-image'];
      const posts = ['login','logout','activate','extend','delete','button','submit','university-qr'];
      if (!gets.includes(action) && !posts.includes(action)) throw problem(404,'Operación no disponible.');
      if (req.method !== (gets.includes(action)?'GET':'POST')) { res.setHeader('Allow',gets.includes(action)?'GET':'POST'); throw problem(405,'Método no permitido.'); }
      if (req.method==='POST') sameOrigin(req);
      if (action==='login') {
        const b=body(req,4000);
        if (typeof b.key!=='string' || !checkAdminKey(b.key)) throw problem(401,'Clave incorrecta.');
        issueAdminCookie(req,res); return reply(res,200,{ok:true});
      }
      if (action==='logout') { clearAdminCookie(req,res); return reply(res,200,{ok:true}); }
      if (['data','export','activate','extend','delete','button','university-qr'].includes(action)) requireAdmin(req);
      const sql=getDb();
      if (action==='state') {
        const [config]=await sql`SELECT enabled,version FROM asistencia_university_qr WHERE id=true`;
        if(config?.enabled)return reply(res,200,{serverTime:new Date().toISOString(),sessions:[],universityQr:qrView(config)});
        const rows=await sql`SELECT * FROM asistencia_sessions WHERE expires_at>clock_timestamp() ORDER BY class_date,module`;
        return reply(res,200,{serverTime:new Date().toISOString(),universityQr:{enabled:false},sessions:rows.map(s=>{
          const view=sessionView(s);
          // Si el botón está oculto, el enlace solo se entrega codificado en el QR.
          if(!s.show_button)delete view.token;
          return view;
        })});
      }
      if(action==='university-image'){
        const [image]=await sql`SELECT image_data,mime_type,enabled,version FROM asistencia_university_qr WHERE id=true`;
        if(!image?.image_data||image.version!==req.query.v)throw problem(404,'Imagen no disponible.');
        if(!image.enabled)requireAdmin(req);
        res.setHeader('Content-Type',image.mime_type);
        return res.status(200).send(Buffer.from(image.image_data,'base64'));
      }
      if(['form','qr','submit'].includes(action))await nativeMode(sql);
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
        const rows=await sql`SELECT * FROM asistencia_sessions WHERE id=${uuid(req.query.id)}::uuid AND expires_at>clock_timestamp()`;
        if(!rows.length)throw problem(410,'Esta toma de asistencia terminó o fue eliminada.');
        const s=rows[0];
        // QR propio: no envía enlaces ni nombres a servicios externos.
        // Un QR necesita una URL absoluta para que funcione desde la cámara del teléfono.
        const host=String(req.headers.host||'');
        if (!/^[a-z0-9.:[\]-]+$/i.test(host)) throw problem(400,'Dominio no válido.');
        const scheme=process.env.VERCEL || req.headers['x-forwarded-proto']==='https'?'https':'http';
        const absolute=await QRCode.toString(`${scheme}://${host}/asistencia/registrar.html?token=${s.token}`,{type:'svg',width:320,margin:4,errorCorrectionLevel:'M'});
        res.setHeader('Content-Type','image/svg+xml'); return res.status(200).send(absolute);
      }
      if (action==='data' || action==='export') {
        const data=await report(sql,req.query);
        if (action==='data') return reply(res,200,data);
        const buffer=await exportWorkbook(data.students,data.sessions,data.records,data.dailyRecords);
        const suffix=[req.query.date||'todas',req.query.module?`modulo-${req.query.module}`:''].filter(Boolean).join('-');
        res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition',`attachment; filename="asistencia-${suffix}.xlsx"`);
        return res.status(200).send(buffer);
      }
      const b=body(req,action==='university-qr'?1500000:8000);
      if(action==='university-qr'){
        if(typeof b.enabled!=='boolean')throw problem(400,'Selecciona el modo de asistencia.');
        const image=b.image===undefined?null:qrImage(b.image);
        const rows=await sql`UPDATE asistencia_university_qr SET enabled=${b.enabled},
          image_data=COALESCE(${image?.data??null}::text,image_data),mime_type=COALESCE(${image?.mime??null}::text,mime_type),
          version=CASE WHEN ${Boolean(image)} THEN ${randomUUID()}::uuid ELSE version END
          WHERE id=true AND (${Boolean(image)} OR NOT ${b.enabled} OR image_data IS NOT NULL) RETURNING enabled,version`;
        if(!rows.length)throw problem(400,'Sube una imagen antes de activar este modo.');
        return reply(res,200,{ok:true,universityQr:qrView(rows[0])});
      }
      if (action==='activate') {
        const date=monday(b.date), module=integer(b.module,1,3,'Módulo'), minutes=integer(b.minutes,1,240,'Minutos');
        if (typeof b.requireLocation!=='boolean' || typeof b.replace!=='boolean' || typeof b.showButton!=='boolean') throw problem(400,'Configuración no válida.');
        const p=coordinates(b.latitude,b.longitude);
        if (customCoordinates(p) && b.confirmCustom!==true) throw problem(409,'Las coordenadas no son las de la UAH. Confirma su uso.');
        const expected=b.replace?uuid(b.expectedToken):null;
        const rows=await sql`SELECT asistencia_activate(${randomUUID()}::uuid,${date}::date,${module},${randomUUID()}::uuid,${minutes},${b.requireLocation},${p.latitude},${p.longitude},${b.replace},${expected}::uuid,${b.showButton}::boolean) AS result`;
        return reply(res,200,{ok:true,session:sessionView(dbResult(rows).session,Date.now(),true)});
      }
      if (action==='extend') {
        const rows=await sql`SELECT asistencia_extend(${uuid(b.id)}::uuid,${uuid(b.token)}::uuid,${integer(b.minutes,1,240,'Minutos')}::int) AS result`;
        return reply(res,200,{ok:true,session:sessionView(dbResult(rows).session,Date.now(),true)});
      }
      if(action==='button'){
        if(typeof b.showButton!=='boolean')throw problem(400,'Configuración del botón no válida.');
        const rows=await sql`SELECT asistencia_button(${uuid(b.id)}::uuid,${uuid(b.token)}::uuid,${b.showButton}::boolean) AS result`;
        return reply(res,200,{ok:true,session:sessionView(dbResult(rows).session,Date.now(),true)});
      }
      if(action==='delete'){
        if(b.confirmDelete!==true)throw problem(400,'Confirma el borrado de la toma de asistencia.');
        const result=dbResult(await sql`SELECT asistencia_delete(${uuid(b.id)}::uuid,${uuid(b.token)}::uuid) AS result`);
        return reply(res,200,{ok:true,...result});
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
