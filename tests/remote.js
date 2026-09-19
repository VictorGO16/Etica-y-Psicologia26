const timers = new Map();
const pending = new Map();

async function send(participantId, run, keepalive=false){
  if(!run || location.protocol==='file:') return false;
  const key=run.id;
  const body=JSON.stringify({participantId,run});
  try{
    const response=await fetch('/api/tests/sync',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body,
      cache:'no-store',
      keepalive
    });
    if(!response.ok) throw new Error('sync '+response.status);
    pending.delete(key);
    return true;
  }catch{
    pending.set(key,{participantId,run:structuredClone(run)});
    return false;
  }
}

export function scheduleRunSync(participantId, run){
  if(!run) return;
  pending.set(run.id,{participantId,run:structuredClone(run)});
  clearTimeout(timers.get(run.id));
  timers.set(run.id,setTimeout(()=>{
    timers.delete(run.id);
    const item=pending.get(run.id);
    if(item) send(item.participantId,item.run,false);
  },500));
}

export function flushRunSync(participantId, run){
  if(!run) return;
  clearTimeout(timers.get(run.id));
  timers.delete(run.id);
  pending.set(run.id,{participantId,run:structuredClone(run)});
  void send(participantId,run,true);
}

export async function syncAllRuns(participantId, runs){
  if(location.protocol==='file:') return;
  for(const run of runs){
    await send(participantId,run,false);
  }
}
