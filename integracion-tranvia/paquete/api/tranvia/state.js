import { db, reply, fail, publicRecord } from './_shared.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return reply(res, 405, { error: 'Método no permitido.' });
  try {
    const sql = db();
    const [current, rows] = await sql.transaction([
      sql`SELECT generation FROM tranvia_control WHERE id = 1`,
      sql`SELECT r.* FROM tranvia_respuestas r JOIN tranvia_control c ON c.generation = r.generation WHERE c.id = 1 ORDER BY r.created_at, r.id`,
    ], { readOnly: true, isolationMode: 'RepeatableRead' });
    if (!current.length) throw new Error('Falta ejecutar sql/tranvia.sql.');
    return reply(res, 200, { generation: current[0].generation, records: rows.map(publicRecord) });
  } catch (error) { return fail(res, error); }
}
