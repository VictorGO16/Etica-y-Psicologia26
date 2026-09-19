import { TESTS } from './bank.js';

const $=s=>document.querySelector(s);
let snapshot=null;
let selectedTestId=Object.keys(TESTS)[0];

function escapeHTML(value){ return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function formatDuration(ms){ const sec=Math.max(0,Math.round((Number(ms)||0)/1000)); if(sec<60)return sec+' s'; const min=Math.floor(sec/60),rest=sec%60; return rest?min+' min '+rest+' s':min+' min'; }
function pct(n,d){ return d?Math.round(n/d*100)+' %':'—'; }
function when(value){ if(!value)return '—'; return new Date(value).toLocaleString('es-CL'); }
function statusLabel(value){ return value==='completed'?'Completado':value==='abandoned'?'Reiniciado':'En curso'; }
function shortId(value){ return String(value||'').replace(/-/g,'').slice(0,8).toUpperCase(); }

async function login(key){
  const r=await fetch('/api/tests/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key}),cache:'no-store'});
  const data=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(data.error||'No se pudo iniciar sesión.');
}

async function loadData(){
  const r=await fetch('/api/tests/admin/data',{cache:'no-store'});
  if(r.status===401){ showLogin(); return false; }
  const data=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(data.error||'No se pudieron cargar los datos.');
  snapshot=data;
  showDashboard();
  renderAll();
  return true;
}

function showLogin(){ $('#adminLogin').classList.remove('hidden'); $('#adminDashboard').classList.add('hidden'); }
function showDashboard(){ $('#adminLogin').classList.add('hidden'); $('#adminDashboard').classList.remove('hidden'); }

function renderAll(){
  $('#adminUpdated').textContent=`Actualizado ${when(snapshot.generatedAt)} · ${snapshot.totalStoredRuns} prácticas guardadas`;
  renderOverview();
  renderPeople();
  renderTest(selectedTestId);
}

function testStats(id){ return snapshot.tests?.[id]||{testId:id,participants:0,completed:0,active:0,abandoned:0,totalAttempts:0,questions:{}}; }

function renderOverview(){
  $('#adminOverview').innerHTML=Object.values(TESTS).map(test=>{
    const s=testStats(test.id);
    return `<button class="admin-test-card ${selectedTestId===test.id?'selected':''}" type="button" data-admin-test="${test.id}"><span class="admin-test-no">${test.no}</span><strong>${escapeHTML(test.title)}</strong><span>${s.participants} ${s.participants===1?'participante':'participantes'}</span><small>${s.completed} completados · ${s.active} en curso</small></button>`;
  }).join('');
  document.querySelectorAll('[data-admin-test]').forEach(button=>button.onclick=()=>{ selectedTestId=button.dataset.adminTest; renderOverview(); renderTest(selectedTestId); $('#adminRunSection').classList.add('hidden'); });
}


function renderPeople(){
  const byPerson=new Map();
  for(const run of snapshot.runs||[]){
    let person=byPerson.get(run.participantId);
    if(!person){ person={id:run.participantId,label:run.participantLabel||shortId(run.participantId),runs:{},updatedAt:run.updatedAt}; byPerson.set(run.participantId,person); }
    person.runs[run.testId]=run;
    if(new Date(run.updatedAt)>new Date(person.updatedAt)) person.updatedAt=run.updatedAt;
  }
  const tests=Object.values(TESTS);
  const head=tests.map(t=>`<th>${escapeHTML(t.title)}</th>`).join('');
  const rows=[...byPerson.values()].sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt)).map(person=>{
    const cells=tests.map(t=>{
      const r=person.runs[t.id];
      if(!r) return '<td>—</td>';
      return `<td><button class="admin-run-link" type="button" data-admin-run="${r.id}">${r.completedQuestions}/${r.totalQuestions}<small>${statusLabel(r.status)}</small></button></td>`;
    }).join('');
    return `<tr><td><strong>${escapeHTML(person.label)}</strong><small>${when(person.updatedAt)}</small></td>${cells}</tr>`;
  }).join('');
  $('#adminPeopleSection').innerHTML=`<div class="admin-section-head"><div><p class="eyebrow">Vista integrada</p><h2>Participantes</h2></div><p class="admin-muted">${byPerson.size} ${byPerson.size===1?'participante':'participantes'} registrados</p></div><div class="admin-table-wrap"><table class="admin-table admin-people-table"><thead><tr><th>ID</th>${head}</tr></thead><tbody>${rows||`<tr><td colspan="${tests.length+1}">Aún no hay respuestas registradas.</td></tr>`}</tbody></table></div>`;
  document.querySelectorAll('#adminPeopleSection [data-admin-run]').forEach(button=>button.onclick=()=>openRun(button.dataset.adminRun));
}

function renderQuestionRow(test,q,s){
  const first=s?.firstAttempts||0;
  const optionCounts=s?.firstChoiceCounts||{};
  const options=q.options.map(o=>`${escapeHTML(o.text)} ${optionCounts[o.id]||0}`).join(' · ');
  return `<details class="admin-question"><summary><span>${escapeHTML(q.tag)}</span><span>${s?.engaged||0} abordaron</span><span>${pct(s?.firstAttemptCorrect||0,first)} primer intento</span><span>${s?.revealed||0} consultaron solución</span></summary><div class="admin-question-body"><p class="admin-prompt">${escapeHTML(q.q)}</p><dl><div><dt>Resueltas</dt><dd>${s?.resolved||0}</dd></div><div><dt>Intentos</dt><dd>${s?.totalAttempts||0}</dd></div><div><dt>Tiempo mediano</dt><dd>${s?.medianActiveMs==null?'—':formatDuration(s.medianActiveMs)}</dd></div></dl><p class="admin-distribution"><strong>Primera respuesta</strong><br>${options}</p></div></details>`;
}

function renderTest(id){
  const test=TESTS[id];
  const s=testStats(id);
  const runs=(snapshot.runs||[]).filter(r=>r.testId===id);
  const questions=test.questions.map(q=>renderQuestionRow(test,q,s.questions?.[q.id])).join('');
  const people=runs.length?runs.map(r=>`<tr data-admin-run="${r.id}"><td>${escapeHTML(r.participantLabel||shortId(r.participantId))}</td><td>${statusLabel(r.status)}</td><td>${r.completedQuestions}/${r.totalQuestions}</td><td>${r.attempts}</td><td>${r.revealed}</td><td>${formatDuration(r.activeMs)}</td><td>${when(r.updatedAt)}</td></tr>`).join(''):`<tr><td colspan="7">Aún no hay respuestas para este test.</td></tr>`;
  $('#adminTestSection').innerHTML=`<div class="admin-section-head"><div><p class="eyebrow">${test.no}</p><h2>${escapeHTML(test.title)}</h2></div><div class="admin-summary-line"><span>${s.participants} participantes</span><span>${s.completed} completados</span><span>${s.active} en curso</span><span>${s.totalAttempts} intentos</span></div></div><div class="admin-columns"><div><h3>Preguntas</h3><div class="admin-questions">${questions}</div></div><div><h3>Participantes</h3><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>ID</th><th>Estado</th><th>Avance</th><th>Intentos</th><th>Soluciones</th><th>Tiempo</th><th>Última actividad</th></tr></thead><tbody>${people}</tbody></table></div></div></div>`;
  document.querySelectorAll('[data-admin-run]').forEach(row=>row.onclick=()=>openRun(row.dataset.adminRun));
}

async function openRun(id){
  const section=$('#adminRunSection');
  section.classList.remove('hidden');
  section.innerHTML='<p class="admin-muted">Cargando detalle…</p>';
  try{
    const r=await fetch('/api/tests/admin/run?id='+encodeURIComponent(id),{cache:'no-store'});
    const data=await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(data.error||'No se pudo cargar la práctica.');
    renderRun(data);
    section.scrollIntoView({behavior:'smooth',block:'start'});
  }catch(error){ section.innerHTML=`<p class="admin-status">${escapeHTML(error.message)}</p>`; }
}

function renderRun(data){
  const test=TESTS[data.testId];
  const states=data.payload?.questions||{};
  const rows=test.questions.map((q,i)=>{
    const st=states[q.id]||{};
    const attempts=Array.isArray(st.attempts)?st.attempts:[];
    const attemptText=attempts.length?attempts.map(a=>{const opt=q.options.find(o=>o.id===a.optionId);return `<li><span>${escapeHTML(opt?.text||a.optionId)}</span><strong class="${a.correct?'ok':'no'}">${a.correct?'Correcta':'Incorrecta'}</strong></li>`}).join(''):'<li>Sin intento.</li>';
    const status=st.everRevealed?'Solución consultada':st.status==='solved'?'Resuelta':st.status==='wrong'?'En curso':st.visitCount>0?'Vista':'Pendiente';
    return `<details class="admin-run-question"><summary><span>${String(i+1).padStart(2,'0')} · ${escapeHTML(q.tag)}</span><span>${status}</span></summary><div><p>${escapeHTML(q.q)}</p><ol>${attemptText}</ol><small>${formatDuration(st.activeMs||0)} · ${st.visitCount||0} visitas</small></div></details>`;
  }).join('');
  $('#adminRunSection').innerHTML=`<div class="admin-section-head"><div><p class="eyebrow">Participante ${escapeHTML(shortId(data.participantId))}</p><h2>${escapeHTML(test.title)}</h2><p class="admin-muted">Inicio ${when(data.startedAt)} · última actualización ${when(data.updatedAt)}</p></div><button class="btn secondary" id="closeRunDetail" type="button">Cerrar detalle</button></div><div class="admin-run-list">${rows}</div>`;
  $('#closeRunDetail').onclick=()=>$('#adminRunSection').classList.add('hidden');
}

$('#adminLoginForm').onsubmit=async event=>{
  event.preventDefault();
  const status=$('#adminLoginStatus');
  status.textContent='';
  try{ await login($('#adminKey').value); $('#adminKey').value=''; await loadData(); }
  catch(error){ status.textContent=error.message; }
};
$('#adminRefresh').onclick=()=>loadData().catch(error=>{$('#adminUpdated').textContent=error.message});
$('#adminLogout').onclick=async()=>{ await fetch('/api/tests/admin/logout',{method:'POST'}).catch(()=>{}); showLogin(); };

loadData().catch(error=>{ showLogin(); $('#adminLoginStatus').textContent=error.message; });
