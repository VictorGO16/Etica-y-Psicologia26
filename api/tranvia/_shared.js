import { neon } from '@neondatabase/serverless';

export const RESULTADOS = [
  ['Mató 3 personas', 'Mató 1 persona'],
  ['Mató a sus cercanos', 'Mató 10 personas'],
  ['Mató 30 bebés', 'Eliminó todas las IA del mundo'],
  ['Mató a 3 personas bajo su cuidado', 'Mató 15 personas'],
];

// Cached clients and sessions started before the revision keep their original case.
// New sessions explicitly send scenarioVersion: 2. No database migration is required.
export const RESULTADOS_V1 = [
  ['Mató 3 personas', 'Mató 1 persona'],
  ['Mató a sus cercanos', 'Mató 15 personas'],
  ['Mató 30 bebés', 'Eliminó todas las IA del mundo'],
  ['Mató a 3 personas bajo su cuidado', 'Mató 15 personas desconocidas'],
];

export function resultFor(scene, destination, version) {
  const table = version === 2 ? RESULTADOS : RESULTADOS_V1;
  return table[scene - 1][destination === 'left' ? 0 : 1];
}

export function db() {
  if (!process.env.DATABASE_URL) throw new Error('Falta configurar DATABASE_URL.');
  return neon(process.env.DATABASE_URL);
}

export function reply(res, status, data) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(status).json(data);
}

export function fail(res, error) {
  console.error('[tranvia]', error);
  const status = error.status || 500;
  return reply(res, status, { error: status === 500 ? 'No se pudo completar la operación. Revisa la configuración del servidor.' : error.message });
}

export function problem(status, message) {
  return Object.assign(new Error(message), { status });
}

export function text(value, max, label) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) {
    throw problem(400, `El campo ${label} no es válido.`);
  }
  return value.trim();
}

export async function body(req) {
  const raw = JSON.stringify(req.body || {});
  if (raw.length > 16000 || !req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    throw problem(400, 'Solicitud no válida.');
  }
  return req.body;
}

export function publicRecord(row) {
  return {
    id: row.id,
    generation: row.generation,
    sessionId: row.session_id,
    scene: row.scene,
    choice: row.choice,
    destination: row.destination,
    result: row.result,
    name: row.name,
    reason: row.reason,
    createdAt: new Date(row.created_at).toISOString(),
  };
}
