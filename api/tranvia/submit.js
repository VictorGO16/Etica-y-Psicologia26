import { db, reply, fail, problem, body, text, resultFor, publicRecord } from './_shared.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return reply(res, 405, { error: 'Método no permitido.' });
  try {
    const b = await body(req);
    const generation = text(b.generation, 128, 'generation');
    const sessionId = text(b.sessionId, 128, 'sessionId');
    const id = text(b.id, 128, 'id');
    const name = text(b.name, 80, 'name');
    const reason = text(b.reason, 4000, 'reason');
    const scene = b.scene;
    if (!Number.isInteger(scene) || scene < 1 || scene > 4 || !['none','left','right'].includes(b.choice) || !['left','right'].includes(b.destination)) {
      throw problem(400, 'La decisión no es válida.');
    }
    if (b.choice !== 'none' && b.choice !== b.destination) {
      throw problem(400, 'La elección y la trayectoria no coinciden.');
    }
    const scenarioVersion = b.scenarioVersion === undefined ? 1 : b.scenarioVersion;
    if (![1, 2].includes(scenarioVersion)) throw problem(400, 'La versión del escenario no es válida.');
    const result = resultFor(scene, b.destination, scenarioVersion);
    const sql = db();
    // La generación evita que una partida anterior vuelva a poblar el registro tras cleanall.
    // La combinación sesión + escenario evita guardar más de una respuesta por caso.
    // El primer nombre registrado queda fijado para los casos siguientes.
    const inserted = await sql`
      INSERT INTO tranvia_respuestas
        (id, generation, session_id, scene, choice, destination, result, name, reason)
      SELECT ${id}, ${generation}, ${sessionId}, ${scene}, ${b.choice}, ${b.destination}, ${result}, ${name}, ${reason}
      FROM tranvia_control c
      WHERE c.id = 1 AND c.generation = ${generation}
        AND (
          ${scene} = 1
          OR EXISTS (
            SELECT 1 FROM tranvia_respuestas p
            WHERE p.generation = ${generation} AND p.session_id = ${sessionId}
              AND p.scene = ${scene - 1} AND p.name = ${name}
          )
        )
      ON CONFLICT (generation, session_id, scene) DO NOTHING
      RETURNING *
    `;
    if (inserted.length) return reply(res, 200, { generation, record: publicRecord(inserted[0]) });
    const existing = await sql`
      SELECT * FROM tranvia_respuestas
      WHERE generation = ${generation} AND session_id = ${sessionId} AND scene = ${scene}
    `;
    if (existing.length) return reply(res, 200, { generation, record: publicRecord(existing[0]) });
    throw problem(409, 'El registro fue reiniciado o falta registrar el escenario anterior. Recarga la página.');
  } catch (error) { return fail(res, error); }
}
