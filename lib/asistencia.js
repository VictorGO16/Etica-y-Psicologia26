import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import ExcelJS from 'exceljs';
import { problem } from '../api/tests/_shared.js';

export const UAH = Object.freeze({ latitude: -33.44497399230422, longitude: -70.6627676244979 });
export const RADIUS = 800;
export const TZ = 'America/Santiago';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function uuid(value) {
  if (typeof value !== 'string' || !UUID.test(value)) throw problem(400, 'Identificador no válido.');
  return value;
}
export function monday(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw problem(400, 'Selecciona un lunes.');
  const d = new Date(value + 'T12:00:00Z');
  if (!Number.isFinite(d.getTime()) || d.toISOString().slice(0, 10) !== value || d.getUTCDay() !== 1) throw problem(400, 'Selecciona un lunes válido.');
  return value;
}
export function integer(value, min, max, label) {
  if (!Number.isInteger(value) || value < min || value > max) throw problem(400, `${label}: usa un número entero entre ${min} y ${max}.`);
  return value;
}
export function coordinates(latitude, longitude) {
  if (typeof latitude !== 'number' || typeof longitude !== 'number' || !Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) throw problem(400, 'Coordenadas no válidas.');
  return { latitude, longitude };
}
export function customCoordinates(p) {
  return Math.abs(p.latitude - UAH.latitude) > 1e-10 || Math.abs(p.longitude - UAH.longitude) > 1e-10;
}
export function distance(a, b) {
  const rad = x => x * Math.PI / 180;
  const h = Math.sin(rad(b.latitude - a.latitude) / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(rad(b.longitude - a.longitude) / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}
export function checkLocation(location, session, now = Date.now()) {
  if (!location || typeof location !== 'object') throw problem(400, 'Comparte tu ubicación para guardar la asistencia.');
  const p = coordinates(location.latitude, location.longitude);
  if (typeof location.accuracy !== 'number' || !Number.isFinite(location.accuracy) || location.accuracy <= 0 || location.accuracy > 100) throw problem(422, 'La ubicación es poco precisa. Activa la ubicación precisa del teléfono y vuelve a intentar.');
  if (typeof location.timestamp !== 'number' || !Number.isFinite(location.timestamp) || now - location.timestamp > 60000 || location.timestamp - now > 15000) throw problem(422, 'Necesitamos una ubicación reciente. Vuelve a intentar.');
  const meters = distance(p, { latitude: Number(session.latitude), longitude: Number(session.longitude) });
  if (meters > RADIUS) throw problem(403, 'Estás fuera del radio permitido de 800 metros.');
  if (meters + location.accuracy > RADIUS) throw problem(422, 'La precisión no permite confirmar que estás dentro del radio. Vuelve a intentar.');
  return true;
}
function sign(id) {
  const key = process.env.TESTS_ADMIN_KEY;
  if (!key || key.length < 8) throw problem(500, 'Configuración incompleta.');
  return createHmac('sha256', key).update('attendance-device:' + id).digest('hex');
}
export function getDevice(req, res, create = false) {
  const value = String(req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith('eyp_attendance_device='))?.slice('eyp_attendance_device='.length);
  if (value) {
    const [id, sig] = value.split('.');
    if (UUID.test(id || '') && /^[a-f0-9]{64}$/.test(sig || '') && timingSafeEqual(Buffer.from(sig), Buffer.from(sign(id)))) return id;
  }
  if (!create) throw problem(400, 'Habilita las cookies y vuelve a abrir el formulario.');
  const id = randomUUID();
  const secure = process.env.VERCEL || req.headers['x-forwarded-proto'] === 'https';
  res.setHeader('Set-Cookie', `eyp_attendance_device=${id}.${sign(id)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=31536000${secure ? '; Secure' : ''}`);
  return id;
}
export function sessionView(s, now = Date.now(), admin = false) {
  const date = s.class_date instanceof Date ? s.class_date.toISOString().slice(0, 10) : String(s.class_date).slice(0, 10);
  return {
    id: s.id, date, module: Number(s.module), token: s.token,
    openedAt: new Date(s.opened_at).toISOString(), expiresAt: new Date(s.expires_at).toISOString(),
    active: new Date(s.expires_at).getTime() > now, requireLocation: s.require_location,
    ...(admin ? { latitude: Number(s.latitude), longitude: Number(s.longitude), count: Number(s.count || 0), custom: customCoordinates({latitude: Number(s.latitude), longitude: Number(s.longitude)}) } : {})
  };
}
export function dbResult(rows) {
  const result = rows[0]?.result;
  const errors = {
    invalid: [400, 'Datos de activación no válidos.'], confirm: [409, 'Ya existe una asistencia para esa fecha y módulo. Confirma antes de reemplazarla.'],
    changed: [409, 'La asistencia cambió desde que abriste el panel. Actualiza antes de continuar.'],
    missing: [404, 'No existe esa asistencia.'], closed: [410, 'Esta toma de asistencia terminó o fue reemplazada.'],
    location: [403, 'Debes comprobar la ubicación.'], student: [400, 'Selecciona un estudiante de la nómina.'],
    device: [409, 'Este dispositivo ya registró asistencia para otra persona en este módulo.'],
    duplicate: [409, 'Ese estudiante ya registró asistencia para esta fecha y módulo.']
  };
  if (result?.error) {
    const [status, message] = errors[result.error] || [500, 'No se pudo completar la operación.'];
    throw Object.assign(problem(status, message), { code: result.error, count: result.count, token: result.token });
  }
  if (!result) throw problem(500, 'No se pudo completar la operación.');
  return result;
}
export function filters(query) {
  const date = query.date ? monday(query.date) : null;
  const module = query.module ? integer(Number(query.module), 1, 3, 'Módulo') : null;
  return { date, module };
}
export function localTime(iso) {
  return new Intl.DateTimeFormat('es-CL', { timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date(iso));
}
export async function exportWorkbook(students, sessions, records) {
  const book = new ExcelJS.Workbook();
  book.creator = 'Ética y Psicología';
  book.created = new Date();
  const detail = book.addWorksheet('Registros');
  detail.columns = [
    {header:'Fecha de clase',key:'date',width:19}, {header:'Módulo',key:'module',width:12},
    {header:'Estudiante',key:'name',width:52}, {header:'Hora (Chile)',key:'time',width:18},
    {header:'Registro UTC',key:'utc',width:29}, {header:'Ubicación comprobada',key:'location',width:26}
  ];
  for (const r of records) detail.addRow({date:r.date,module:r.module,name:r.name,time:localTime(r.recordedAt),utc:r.recordedAt,location:r.locationChecked?'Sí':'No requerida'});
  const summary = book.addWorksheet('Por estudiante y día');
  summary.columns = [
    {header:'Fecha de clase',key:'date',width:19},{header:'Estudiante',key:'name',width:52},
    ...[1,2,3].map(n=>({header:`Módulo ${n}`,key:`m${n}`,width:17})),{header:'Total módulos',key:'total',width:18}
  ];
  const days = [...new Set(sessions.map(s=>s.date))].sort();
  const lookup = new Map(records.map(r=>[`${r.date}:${r.studentId}:${r.module}`,r]));
  for (const date of days) {
    const available = new Set(sessions.filter(s=>s.date===date).map(s=>s.module));
    for (const student of students) {
      const row = {date,name:student.name,total:0};
      for (const n of [1,2,3]) {
        const r = lookup.get(`${date}:${student.id}:${n}`);
        row[`m${n}`] = r ? localTime(r.recordedAt) : available.has(n) ? 'Sin registro' : '—';
        if (r) row.total++;
      }
      summary.addRow(row);
    }
  }
  for (const sheet of [detail,summary]) {
    sheet.views = [{state:'frozen',ySplit:1}];
    sheet.autoFilter = {from:'A1',to:{row:Math.max(1,sheet.rowCount),column:sheet.columnCount}};
    sheet.getRow(1).font = {bold:true,color:{argb:'FFFFFFFF'}};
    sheet.getRow(1).fill = {type:'pattern',pattern:'solid',fgColor:{argb:'FF222722'}};
  }
  return Buffer.from(await book.xlsx.writeBuffer());
}
