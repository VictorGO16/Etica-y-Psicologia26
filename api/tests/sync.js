import { db, reply, fail, body, text, sanitizeRun } from './_shared.js';

export default async function handler(req,res){
  if(req.method!=='POST') return reply(res,405,{error:'Método no permitido.'});
  try{
    const b=body(req);
    const participantId=text(b.participantId,128,'participantId');
    const run=sanitizeRun(participantId,b.run);
    const sql=db();
    const payload=JSON.stringify(run.payload);
    await sql`
      INSERT INTO practica_runs
        (id, participant_id, test_id, started_at, finished_at, abandoned_at, payload, updated_at)
      VALUES
        (${run.id}, ${run.participantId}, ${run.testId}, ${run.startedAt}, ${run.finishedAt}, ${run.abandonedAt}, ${payload}::jsonb, NOW())
      ON CONFLICT (id) DO UPDATE SET
        participant_id = EXCLUDED.participant_id,
        test_id = EXCLUDED.test_id,
        started_at = EXCLUDED.started_at,
        finished_at = EXCLUDED.finished_at,
        abandoned_at = EXCLUDED.abandoned_at,
        payload = EXCLUDED.payload,
        updated_at = NOW()
    `;
    return reply(res,200,{ok:true,runId:run.id});
  }catch(error){ return fail(res,error); }
}
