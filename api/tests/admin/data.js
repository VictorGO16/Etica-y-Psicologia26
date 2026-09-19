import { db, reply, fail, requireAdmin, shortId } from '../_shared.js';

function completed(st){ return st && (st.status==='solved' || st.status==='revealed'); }
function median(values){
  const xs=values.filter(Number.isFinite).sort((a,b)=>a-b);
  if(!xs.length) return null;
  const m=Math.floor(xs.length/2);
  return xs.length%2?xs[m]:Math.round((xs[m-1]+xs[m])/2);
}
function summarize(row){
  const run=row.payload||{};
  const states=Object.values(run.questions||{});
  const completedQuestions=states.filter(completed).length;
  const attempts=states.reduce((n,st)=>n+(Array.isArray(st?.attempts)?st.attempts.length:0),0);
  const revealed=states.filter(st=>st?.everRevealed).length;
  const activeMs=states.reduce((n,st)=>n+(Number(st?.activeMs)||0),0);
  return {
    id:row.id,
    participantId:row.participant_id,
    participantLabel:shortId(row.participant_id),
    testId:row.test_id,
    startedAt:new Date(row.started_at).toISOString(),
    finishedAt:row.finished_at?new Date(row.finished_at).toISOString():null,
    abandonedAt:row.abandoned_at?new Date(row.abandoned_at).toISOString():null,
    updatedAt:new Date(row.updated_at).toISOString(),
    status:row.abandoned_at?'abandoned':row.finished_at?'completed':'active',
    completedQuestions,
    totalQuestions:states.length,
    attempts,
    revealed,
    activeMs
  };
}

export default async function handler(req,res){
  if(req.method!=='GET') return reply(res,405,{error:'Método no permitido.'});
  try{
    requireAdmin(req);
    const sql=db();
    const rows=await sql`SELECT id, participant_id, test_id, started_at, finished_at, abandoned_at, updated_at, payload FROM practica_runs ORDER BY updated_at DESC`;

    // Para el estado actual se usa la práctica más reciente de cada participante en cada test.
    const latest=new Map();
    for(const row of rows){
      const key=`${row.participant_id}|${row.test_id}`;
      if(!latest.has(key)) latest.set(key,row);
    }

    const current=[...latest.values()];
    const runs=current.map(summarize);
    const tests={};

    for(const row of current){
      const summary=summarize(row);
      const t=tests[summary.testId] ||= {
        testId:summary.testId,
        participants:0,
        completed:0,
        active:0,
        abandoned:0,
        totalAttempts:0,
        questions:{}
      };

      t.participants++;
      t[summary.status]++;
      t.totalAttempts+=summary.attempts;

      const questions=row.payload?.questions||{};
      for(const [questionId,st] of Object.entries(questions)){
        const q=t.questions[questionId] ||= {
          questionId,
          engaged:0,
          responded:0,
          resolved:0,
          revealed:0,
          firstAttempts:0,
          firstAttemptCorrect:0,
          totalAttempts:0,
          activeTimes:[],
          resolutionTimes:[],
          firstChoiceCounts:{},
          allChoiceCounts:{}
        };

        const attempts=Array.isArray(st?.attempts)?st.attempts:[];
        const engaged=(Number(st?.visitCount)||0)>0 || attempts.length>0 || Boolean(st?.draftOptionId) || completed(st);

        if(engaged){
          q.engaged++;
          const activeMs=Number(st?.activeMs);
          if(Number.isFinite(activeMs)) q.activeTimes.push(activeMs);
        }

        if(attempts.length>0) q.responded++;
        if(completed(st)){
          q.resolved++;
          if(st?.completedActiveMs!==null && st?.completedActiveMs!==undefined){
            const resolutionMs=Number(st.completedActiveMs);
            if(Number.isFinite(resolutionMs)) q.resolutionTimes.push(resolutionMs);
          }
        }
        if(st?.everRevealed) q.revealed++;

        q.totalAttempts+=attempts.length;

        if(attempts[0]){
          q.firstAttempts++;
          if(attempts[0].correct) q.firstAttemptCorrect++;
          if(attempts[0].optionId){
            q.firstChoiceCounts[attempts[0].optionId]=(q.firstChoiceCounts[attempts[0].optionId]||0)+1;
          }
        }

        for(const attempt of attempts){
          if(attempt?.optionId){
            q.allChoiceCounts[attempt.optionId]=(q.allChoiceCounts[attempt.optionId]||0)+1;
          }
        }
      }
    }

    for(const t of Object.values(tests)){
      for(const q of Object.values(t.questions)){
        q.medianActiveMs=median(q.activeTimes);
        q.medianResolutionMs=median(q.resolutionTimes);
        delete q.activeTimes;
        delete q.resolutionTimes;
      }
    }

    return reply(res,200,{
      generatedAt:new Date().toISOString(),
      tests,
      runs,
      totalStoredRuns:rows.length
    });
  }catch(error){ return fail(res,error); }
}
