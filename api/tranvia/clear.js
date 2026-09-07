import { randomUUID } from 'node:crypto';
import { db, reply, fail, problem, body } from './_shared.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return reply(res, 405, { error: 'Método no permitido.' });
  try {
    const b = await body(req);
    if (b.code !== 'cleanall') throw problem(400, 'Código no reconocido.');
    const sql = db();
    const generation = randomUUID();
    await sql.transaction([
      sql`INSERT INTO tranvia_generaciones (generation) VALUES (${generation})`,
      sql`UPDATE tranvia_control SET generation = ${generation} WHERE id = 1`,
      sql`DELETE FROM tranvia_generaciones WHERE generation <> (SELECT generation FROM tranvia_control WHERE id = 1)`,
    ], { isolationMode: 'Serializable' });
    return reply(res, 200, { generation, records: [] });
  } catch (error) { return fail(res, error); }
}
