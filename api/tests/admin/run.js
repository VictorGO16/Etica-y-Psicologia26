import { db, reply, fail, requireAdmin, problem } from '../_shared.js';

export default async function handler(req,res){
  if(req.method!=='GET') return reply(res,405,{error:'Método no permitido.'});
  try{
    requireAdmin(req);
    const id=typeof req.query?.id==='string'?req.query.id:'';
    if(!id || id.length>128) throw problem(400,'Práctica no válida.');
    const sql=db();
    const rows=await sql`SELECT id, participant_id, test_id, started_at, finished_at, abandoned_at, updated_at, payload FROM practica_runs WHERE id = ${id} LIMIT 1`;
    if(!rows.length) throw problem(404,'Práctica no encontrada.');
    const row=rows[0];
    return reply(res,200,{
      id:row.id,
      participantId:row.participant_id,
      testId:row.test_id,
      startedAt:new Date(row.started_at).toISOString(),
      finishedAt:row.finished_at?new Date(row.finished_at).toISOString():null,
      abandonedAt:row.abandoned_at?new Date(row.abandoned_at).toISOString():null,
      updatedAt:new Date(row.updated_at).toISOString(),
      payload:row.payload
    });
  }catch(error){ return fail(res,error); }
}
