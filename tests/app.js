import { TESTS } from './bank.js';
import { loadLocalDb, saveLocalDb, clearLocalDb } from './storage.js';
import { scheduleRunSync, flushRunSync, syncAllRuns } from './remote.js';

let db = loadLocalDb();
let activeRunId = null;
let index = 0;
let activeView = null;
const $ = s => document.querySelector(s);

function uuid(){ if(globalThis.crypto && crypto.randomUUID) return crypto.randomUUID(); return 'id-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2); }
function persist(run=currentRun()){ saveLocalDb(db); if(run) scheduleRunSync(db.participantId,run); }
function randomInt(max){ if(globalThis.crypto && crypto.getRandomValues){ const a=new Uint32Array(1); crypto.getRandomValues(a); return Math.floor(a[0]/4294967296*max); } return Math.floor(Math.random()*max); }
function shuffled(ids){ const out=[...ids]; for(let i=out.length-1;i>0;i--){ const j=randomInt(i+1); [out[i],out[j]]=[out[j],out[i]]; } return out; }
function testById(id){ return TESTS[id]; }
function runById(id){ return db.runs.find(r=>r.id===id); }
function currentRun(){ return runById(activeRunId); }
function latestRun(testId){ const test=testById(testId); return [...db.runs].reverse().find(r=>r.testId===testId && r.testVersion===test.version && !r.abandonedAt) || null; }
function questionById(test,qid){ return test.questions.find(q=>q.id===qid); }
function stateFor(run,qid){ return run.questions[qid]; }
function completed(st){ return st.status==='solved' || st.status==='revealed'; }
function completedCount(run){ const t=testById(run.testId); return t.questions.filter(q=>completed(stateFor(run,q.id))).length; }
function masteredCount(run){ const t=testById(run.testId); return t.questions.filter(q=>{const s=stateFor(run,q.id);return s.status==='solved'&&!s.everRevealed}).length; }
function firstAttemptCount(run){ const t=testById(run.testId); return t.questions.filter(q=>{const a=stateFor(run,q.id).attempts[0];return a&&a.correct}).length; }
function allComplete(run){ return completedCount(run)===testById(run.testId).questions.length; }

function createRun(testId){
  const test=testById(testId); const now=new Date().toISOString(); const run={id:uuid(),participantId:db.participantId,testId,testVersion:test.version,startedAt:now,finishedAt:null,abandonedAt:null,questions:{},events:[]};
  test.questions.forEach(q=>{ run.questions[q.id]={questionVersion:q.version,optionOrder:shuffled(q.options.map(o=>o.id)),draftOptionId:null,status:'unanswered',attempts:[],everRevealed:false,lastWrongOptionId:null,activeMs:0,completedActiveMs:null,completedAt:null,visitCount:0,sourceOpenCount:0}; });
  db.runs.push(run); persist(); recordEvent(run,'run_started',{}); return run;
}
function recordEvent(run,type,data){ const event={id:uuid(),type,at:new Date().toISOString(),runId:run.id,testId:run.testId,...data}; run.events.push(event); persist(); return event; }
function closeActiveView(reason){ if(!activeView) return; const run=runById(activeView.runId); if(run){ const st=stateFor(run,activeView.questionId); const delta=Math.max(0,Date.now()-activeView.startedAt); st.activeMs+=delta; recordEvent(run,'question_time', {questionId:activeView.questionId,questionVersion:st.questionVersion,elapsedMs:delta,totalActiveMs:st.activeMs,reason}); } activeView=null; }
function openActiveView(run,qid){ const st=stateFor(run,qid); st.visitCount++; activeView={runId:run.id,questionId:qid,startedAt:Date.now()}; recordEvent(run,'question_viewed',{questionId:qid,questionVersion:st.questionVersion,visitNo:st.visitCount}); }
function activeTime(st){ if(activeView && activeView.questionId && currentRun() && activeView.runId===currentRun().id){ return st.activeMs + Math.max(0,Date.now()-activeView.startedAt); } return st.activeMs; }

function renderHome(){
  closeActiveView('home'); activeRunId=null; $('#home').classList.remove('hidden'); $('#quiz').classList.add('hidden'); $('#summary').classList.add('hidden'); $('#backHome').classList.add('hidden');
  $('#testGrid').innerHTML=Object.values(TESTS).map(t=>{ const run=latestRun(t.id); const done=run?completedCount(run):0; const pct=done/t.questions.length*100; const label=!run?'Comenzar':run.finishedAt?'Ver avance':'Continuar'; return `<article class="test-card"><div class="card-no">${t.no} · ${t.short}</div><h3>${t.title}</h3><p>${t.desc}</p><div class="card-meta"><span>${t.questions.length} preguntas</span><span>${run?done+' completadas':'Sin comenzar'}</span></div><div class="card-bottom"><div class="progress-mini"><i style="width:${pct}%"></i></div><button class="btn" data-start="${t.id}">${label} →</button></div></article>`; }).join('');
  document.querySelectorAll('[data-start]').forEach(b=>b.onclick=()=>startOrResume(b.dataset.start));
}
function startOrResume(testId){ let run=latestRun(testId); if(!run) run=createRun(testId); activeRunId=run.id; $('#home').classList.add('hidden'); $('#backHome').classList.remove('hidden'); if(run.finishedAt){ renderGlobalProgress(testId); return; } const test=testById(testId); const pending=test.questions.findIndex(q=>!completed(stateFor(run,q.id))); index=pending<0?0:pending; $('#summary').classList.add('hidden'); $('#quiz').classList.remove('hidden'); renderQuestion(); window.scrollTo({top:0,behavior:'smooth'}); }
function newRun(testId){ closeActiveView('new_run'); const run=createRun(testId); activeRunId=run.id; index=0; $('#summary').classList.add('hidden'); $('#quiz').classList.remove('hidden'); renderQuestion(); window.scrollTo({top:0,behavior:'smooth'}); }
function gotoQuestion(i,reason='navigate'){ const run=currentRun(),test=testById(run.testId); if(i<0||i>=test.questions.length)return; closeActiveView(reason); index=i; renderQuestion(); window.scrollTo({top:0,behavior:'smooth'}); }

function renderQuestion(){
  const run=currentRun(),test=testById(run.testId),q=test.questions[index];
  if(activeView) closeActiveView('render_question');
  openActiveView(run,q.id);
  $('#quizTitle').textContent=test.title;
  $('#quizCount').textContent=`Pregunta ${index+1} de ${test.questions.length}`;
  $('#quizProgress').style.width=`${((index+1)/test.questions.length)*100}%`;
  $('#resetConfirm').classList.add('hidden');
  $('#questionPanel').innerHTML=`<div class="question-tag" id="questionTag"></div><p class="case hidden" id="questionCase"></p><h2 class="question" id="questionText"></h2><div class="answers" id="answers"></div><div class="actions" id="primaryActions"></div><div class="feedback hidden" id="feedback"></div>`;
  $('#questionTag').textContent=q.tag;
  $('#questionText').textContent=q.q;
  $('#questionCase').textContent=q.case||'';
  $('#questionCase').classList.toggle('hidden',!q.case);
  renderQuestionNav();
  renderAnswers();
  renderPrimaryAction();
  renderFeedback();
  renderQuestionActions();
}
function renderQuestionNav(){ const run=currentRun(),test=testById(run.testId); $('#questionNav').innerHTML=test.questions.map((q,i)=>{ const st=stateFor(run,q.id); const classes=[i===index?'current':'',st.status==='solved'?'solved':'',st.status==='revealed'?'revealed':'',st.status==='wrong'?'wrong':''].filter(Boolean).join(' '); const status=st.status==='solved'?'respondida':st.status==='revealed'?'respuesta mostrada':st.status==='wrong'?'con error pendiente':'sin completar'; return `<button class="${classes}" data-jump="${i}" aria-label="Pregunta ${i+1}, ${status}">${String(i+1).padStart(2,'0')}</button>`; }).join(''); document.querySelectorAll('[data-jump]').forEach(b=>b.onclick=()=>gotoQuestion(Number(b.dataset.jump),'jump')); }
function optionFor(q,id){ return q.options.find(o=>o.id===id); }
function renderAnswers(){ const run=currentRun(),test=testById(run.testId),q=test.questions[index],st=stateFor(run,q.id); const order=st.optionOrder; $('#answers').innerHTML=order.map((oid,pos)=>{ const o=optionFor(q,oid); let cls='answer'; if(st.draftOptionId===oid && st.status==='unanswered') cls+=' selected'; if(st.status==='wrong'&&st.lastWrongOptionId===oid) cls+=' wrong'; if((st.status==='solved'||st.status==='revealed')&&oid===q.correctId) cls+=' correct'; if(st.status==='revealed'&&st.lastWrongOptionId===oid&&oid!==q.correctId) cls+=' wrong'; const disabled=st.status!=='unanswered'; return `<button class="${cls}" data-option="${oid}" ${disabled?'disabled':''}><span class="answer-letter">${String.fromCharCode(65+pos)}</span><span class="answer-text">${o.text}</span></button>`; }).join(''); document.querySelectorAll('[data-option]').forEach(b=>b.onclick=()=>chooseOption(b.dataset.option)); }
function chooseOption(optionId){ const run=currentRun(),q=testById(run.testId).questions[index],st=stateFor(run,q.id); if(st.status!=='unanswered')return; st.draftOptionId=optionId; persist(); renderAnswers(); renderPrimaryAction(); }
function renderPrimaryAction(){ const run=currentRun(),q=testById(run.testId).questions[index],st=stateFor(run,q.id); if(st.status==='unanswered'){ $('#primaryActions').innerHTML='<button class="btn" id="checkBtn" '+(st.draftOptionId?'':'disabled')+'>Comprobar</button>'; $('#checkBtn').onclick=checkAnswer; } else $('#primaryActions').innerHTML=''; }
function checkAnswer(){ const run=currentRun(),q=testById(run.testId).questions[index],st=stateFor(run,q.id); if(!st.draftOptionId||st.status!=='unanswered')return; const order=st.optionOrder; const correct=st.draftOptionId===q.correctId; const totalMs=activeTime(st); const previous=st.attempts.at(-1)?.totalActiveMs||0; const attempt={attemptNo:st.attempts.length+1,optionId:st.draftOptionId,displayedPosition:order.indexOf(st.draftOptionId)+1,correct,totalActiveMs:totalMs,sincePreviousAttemptMs:Math.max(0,totalMs-previous),phase:run.finishedAt?'review':'practice',at:new Date().toISOString()}; st.attempts.push(attempt); if(correct){ st.status='solved'; st.lastWrongOptionId=null; if(st.completedActiveMs===null){st.completedActiveMs=totalMs;st.completedAt=new Date().toISOString();} }else{ st.status='wrong'; st.lastWrongOptionId=st.draftOptionId; } recordEvent(run,'answer_submitted',{questionId:q.id,questionVersion:q.version,...attempt}); persist(); renderQuestionNav(); renderAnswers(); renderFeedback(); renderPrimaryAction(); renderQuestionActions(); }
function retryQuestion(){ const run=currentRun(),q=testById(run.testId).questions[index],st=stateFor(run,q.id); recordEvent(run,'answer_retry',{questionId:q.id,questionVersion:q.version,attemptsBeforeRetry:st.attempts.length}); st.status='unanswered'; st.draftOptionId=null; st.lastWrongOptionId=null; persist(); renderQuestionNav(); renderAnswers(); renderFeedback(); renderPrimaryAction(); renderQuestionActions(); }
function revealAnswer(){ const run=currentRun(),q=testById(run.testId).questions[index],st=stateFor(run,q.id); st.status='revealed'; st.everRevealed=true; if(st.completedActiveMs===null){st.completedActiveMs=activeTime(st);st.completedAt=new Date().toISOString();} recordEvent(run,'answer_revealed',{questionId:q.id,questionVersion:q.version,totalActiveMs:activeTime(st),attemptCount:st.attempts.length}); persist(); renderQuestionNav(); renderAnswers(); renderFeedback(); renderPrimaryAction(); renderQuestionActions(); }
function answerAgain(){ const run=currentRun(),q=testById(run.testId).questions[index],st=stateFor(run,q.id); recordEvent(run,'answer_again',{questionId:q.id,questionVersion:q.version,priorStatus:st.status,attemptCount:st.attempts.length}); st.status='unanswered'; st.draftOptionId=null; st.lastWrongOptionId=null; persist(); renderQuestionNav(); renderAnswers(); renderFeedback(); renderPrimaryAction(); renderQuestionActions(); }
function renderFeedback(){ const run=currentRun(),q=testById(run.testId).questions[index],st=stateFor(run,q.id),box=$('#feedback'); if(st.status==='unanswered'){ box.classList.add('hidden'); box.innerHTML=''; return; } box.classList.remove('hidden'); if(st.status==='wrong'){ box.innerHTML=`<div class="feedback-inline bad"><strong>Incorrecta</strong><span>${q.hint}</span></div><div class="actions"><button class="btn secondary" id="retryBtn">Intentar otra vez</button><button class="btn ghost" id="revealBtn">Mostrar respuesta</button></div>`; $('#retryBtn').onclick=retryQuestion; $('#revealBtn').onclick=revealAnswer; return; } const label=st.status==='solved'?'Correcta':'Respuesta correcta'; const quote=q.sourceQuote?`<figure class="source-quote"><blockquote>“${escapeHTML(q.sourceQuote)}”</blockquote><figcaption>Cita del material de la clase</figcaption></figure>`:''; const action=q.source.download?'Descargar':'Abrir'; const mark=q.source.download?' ↓':' ↗'; const download=q.source.download?' download':''; box.innerHTML=`<div class="explanation"><div class="explanation-label">${label}</div><p>${q.why}</p>${quote}<a class="source-link" id="sourceLink" href="${q.source.href}" target="_blank" rel="noopener"${download}>${action} ${q.source.label}${mark}</a></div>${run.finishedAt?'':`<div class="actions"><button class="btn secondary" id="againBtn">Responder de nuevo</button></div>`}`; if($('#againBtn'))$('#againBtn').onclick=answerAgain; $('#sourceLink').onclick=()=>{st.sourceOpenCount++;recordEvent(run,'source_opened',{questionId:q.id,questionVersion:q.version,sourceHref:q.source.href,sourceLabel:q.source.label,sourceOpenCount:st.sourceOpenCount,origin:'question'});persist();}; }
function renderQuestionActions(){ const run=currentRun(),test=testById(run.testId); let right=''; if(index<test.questions.length-1) right=`<button class="btn secondary" id="nextQ">Siguiente →</button>`; else if(allComplete(run)) right=`<button class="btn" id="finishQ">Ver cierre →</button>`; else right=`<button class="btn secondary" id="pendingQ">Ir a pendiente →</button>`; $('#questionNavActions').innerHTML=`${index>0?'<button class="btn secondary" id="prevQ">← Anterior</button>':'<span></span>'}<div class="right">${right}</div>`; if($('#prevQ'))$('#prevQ').onclick=()=>gotoQuestion(index-1,'previous'); if($('#nextQ'))$('#nextQ').onclick=()=>gotoQuestion(index+1,'next'); if($('#pendingQ'))$('#pendingQ').onclick=()=>{const i=test.questions.findIndex(q=>!completed(stateFor(run,q.id)));gotoQuestion(i,'pending')}; if($('#finishQ'))$('#finishQ').onclick=renderSummary; }

function showResetConfirm(){ $('#resetConfirm').classList.remove('hidden'); $('#confirmReset').focus(); }
function hideResetConfirm(){ $('#resetConfirm').classList.add('hidden'); }
function resetCurrentTest(){
  const run=currentRun();
  if(!run)return;
  closeActiveView('reset');
  run.abandonedAt=new Date().toISOString();
  recordEvent(run,'run_reset',{completedQuestions:completedCount(run),totalAttempts:totalAttempts(run),activeMs:totalActiveMs(run)});
  persist();
  const fresh=createRun(run.testId);
  activeRunId=fresh.id;
  index=0;
  hideResetConfirm();
  renderQuestion();
  window.scrollTo({top:0,behavior:'smooth'});
}

function formatDuration(ms){ const sec=Math.max(0,Math.round((ms||0)/1000)); if(sec<60)return sec+' s'; const min=Math.floor(sec/60),rest=sec%60; return rest?min+' min '+rest+' s':min+' min'; }
function escapeHTML(value){ return String(value??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c])); }
function totalAttempts(run){ const test=testById(run.testId); return test.questions.reduce((n,q)=>n+stateFor(run,q.id).attempts.length,0); }
function totalActiveMs(run){ const test=testById(run.testId); return test.questions.reduce((n,q)=>n+stateFor(run,q.id).activeMs,0); }
function runStatusText(st){ const first=st.attempts[0]; if(st.status==='wrong'||st.status==='unanswered')return 'Por resolver'; if(st.everRevealed)return 'Solución consultada'; if(first?.correct)return 'Resuelta al primer intento'; if(st.status==='solved')return `Resuelta en ${st.attempts.length} intentos`; return 'Por resolver'; }
function firstCompletionMs(st){ return st.completedActiveMs ?? st.activeMs; }
function attemptRows(q,st){ if(!st.attempts.length)return ''; return st.attempts.map(a=>{const o=optionFor(q,a.optionId);return `<div class="attempt-row"><span class="attempt-no">Intento ${a.attemptNo}</span><span>${escapeHTML(o?.text||a.optionId)}</span><span class="attempt-result ${a.correct?'ok':'no'}">${a.correct?'Correcta':'Incorrecta'}</span></div>`}).join(''); }
function progressState(st){
  if(st.everRevealed)return {label:'Solución consultada',cls:'review'};
  if(st.status==='solved')return {label:'Resuelta',cls:'good'};
  if(st.status==='wrong')return {label:`En curso · ${st.attempts.length} ${st.attempts.length===1?'intento':'intentos'}`,cls:'bad'};
  if(st.draftOptionId)return {label:'Respuesta sin comprobar',cls:''};
  if(st.visitCount>0)return {label:'Vista, sin responder',cls:''};
  return {label:'Pendiente',cls:''};
}
function questionWasEngaged(st){ return st.visitCount>0 || st.attempts.length>0 || !!st.draftOptionId || completed(st); }
function unresolvedEngagedCount(run){ const t=testById(run.testId); return t.questions.filter(q=>{const st=stateFor(run,q.id);return !completed(st)&&questionWasEngaged(st)}).length; }
function revealedCount(run){ const t=testById(run.testId); return t.questions.filter(q=>stateFor(run,q.id).everRevealed).length; }
function finalizeRunIfNeeded(run){ if(run&&allComplete(run)&&!run.finishedAt){ run.finishedAt=new Date().toISOString(); recordEvent(run,'run_finished',{durationMs:new Date(run.finishedAt)-new Date(run.startedAt),mastered:masteredCount(run),firstAttemptCorrect:firstAttemptCount(run),totalAttempts:totalAttempts(run),activeMs:totalActiveMs(run)}); persist(); } }
function progressQuestionHTML(run,q,i){
  const st=stateFor(run,q.id), state=progressState(st), engaged=questionWasEngaged(st);
  if(!engaged){
    return `<div class="progress-question-static"><span class="progress-question-no">${String(i+1).padStart(2,'0')}</span><div><p class="progress-question-title">${escapeHTML(q.tag)}</p></div><span class="progress-question-state">Pendiente</span></div>`;
  }
  const done=completed(st), hasCorrectAttempt=st.attempts.some(a=>a.correct), correct=optionFor(q,q.correctId);
  const open=(st.status==='wrong'||st.everRevealed)?' open':'';
  const attempts=attemptRows(q,st);
  const draft=(!st.attempts.length&&st.draftOptionId)?`<div class="study-pending"><strong>Respuesta seleccionada</strong><p>${escapeHTML(optionFor(q,st.draftOptionId)?.text||'')}</p></div>`:'';
  const solution=done&&!hasCorrectAttempt?`<div class="study-solution"><strong>Solución consultada</strong><p>${escapeHTML(correct.text)}</p></div>`:'';
  const quote=done&&q.sourceQuote?`<figure class="source-quote"><blockquote>“${escapeHTML(q.sourceQuote)}”</blockquote><figcaption>Cita del material de la clase</figcaption></figure>`:'';
  const explanation=done?`<div class="study-why"><strong>Explicación</strong><p>${escapeHTML(q.why)}</p>${quote}</div>`:'';
  const source=done?`<a href="${q.source.href}" target="_blank" rel="noopener"${q.source.download?' download':''} data-progress-source="${run.id}|${i}">${q.source.download?'Descargar':'Revisar'} ${escapeHTML(q.source.label)}</a>`:'';
  const activity=`<div class="progress-activity">${st.attempts.length} ${st.attempts.length===1?'intento':'intentos'} · ${formatDuration(st.activeMs)} de tiempo activo · ${st.visitCount} ${st.visitCount===1?'visita':'visitas'}${st.sourceOpenCount?` · fuente abierta ${st.sourceOpenCount} ${st.sourceOpenCount===1?'vez':'veces'}`:''}</div>`;
  return `<details class="progress-question"${open}><summary><span class="progress-question-no">${String(i+1).padStart(2,'0')}</span><div><p class="progress-question-title">${escapeHTML(q.tag)}</p></div><span class="progress-question-state ${state.cls}">${state.label}</span></summary><div class="progress-question-body">${q.case?`<p class="study-case">${escapeHTML(q.case)}</p>`:''}${attempts?`<div class="attempts">${attempts}</div>`:''}${draft}${solution}${explanation}${activity}<div class="progress-question-actions">${source}<button type="button" data-progress-question="${run.id}|${i}">Ir a la pregunta</button></div></div></details>`;
}
function progressHistoryHTML(testId,currentRunId){
  const older=db.runs.filter(r=>r.testId===testId&&r.id!==currentRunId&&r.finishedAt&&!r.abandonedAt).slice().reverse();
  if(!older.length)return '';
  return `<div class="progress-history"><details><summary>Prácticas anteriores · ${older.length}</summary><div class="progress-history-list">${older.map(r=>`<div class="progress-history-row"><div>${new Date(r.startedAt).toLocaleDateString('es-CL')} · ${new Date(r.startedAt).toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'})}</div><span>${completedCount(r)}/${testById(testId).questions.length} resueltas</span><button type="button" data-progress-history="${r.id}">Ver</button></div>`).join('')}</div></details></div>`;
}
let progressOverrideRunId=null;
function progressRunForTest(testId){ const override=progressOverrideRunId?runById(progressOverrideRunId):null; if(override&&override.testId===testId)return override; return latestRun(testId); }
function progressTestHTML(test,focusTestId){
  const run=progressRunForTest(test.id), isOverride=!!(run&&progressOverrideRunId===run.id);
  if(!run){
    return `<details class="progress-test"${focusTestId===test.id?' open':''}><summary><span class="progress-test-no">${test.no}</span><div><h3 class="progress-test-title">${escapeHTML(test.title)}</h3><div class="progress-test-meta">${test.questions.length} preguntas</div></div><span class="progress-test-state">Sin comenzar</span></summary><div class="progress-test-body"><div class="progress-empty">Todavía no has iniciado este test.</div><div class="progress-test-actions"><button class="btn secondary" type="button" data-progress-start="${test.id}">Comenzar</button></div></div></details>`;
  }
  finalizeRunIfNeeded(run);
  const done=completedCount(run), inProgress=unresolvedEngagedCount(run), pending=test.questions.length-done-inProgress;
  const status=run.finishedAt?'Completado':`${done} de ${test.questions.length} resueltas`;
  const meta=[`${done} resueltas`]; if(inProgress)meta.push(`${inProgress} en curso`); if(pending)meta.push(`${pending} pendientes`); if(isOverride)meta.push('práctica anterior');
  const action=run.finishedAt?'Practicar de nuevo':'Continuar test';
  const downloadTools=run.finishedAt?`<button class="btn secondary" type="button" data-progress-download="${run.id}|html">Descargar informe</button><button class="btn secondary" type="button" data-progress-download="${run.id}|csv">Descargar CSV</button>`:'';
  const backCurrent=isOverride?`<button class="btn ghost" type="button" data-progress-current="${test.id}">Volver al avance actual</button>`:'';
  return `<details class="progress-test"${focusTestId===test.id?' open':''}><summary><span class="progress-test-no">${test.no}</span><div><h3 class="progress-test-title">${escapeHTML(test.title)}</h3><div class="progress-test-meta">${meta.join(' · ')}</div></div><span class="progress-test-state">${status}</span></summary><div class="progress-test-body"><div class="progress-test-actions"><button class="btn" type="button" data-progress-resume="${run.id}">${action}</button>${downloadTools}${backCurrent}</div><div class="progress-question-list">${test.questions.map((q,i)=>progressQuestionHTML(run,q,i)).join('')}</div>${progressHistoryHTML(test.id,run.id)}</div></details>`;
}
function renderGlobalProgress(focusTestId=null,overrideRunId=null){
  closeActiveView('progress');
  progressOverrideRunId=overrideRunId;
  activeRunId=null;
  $('#home').classList.add('hidden'); $('#quiz').classList.add('hidden'); $('#summary').classList.remove('hidden'); $('#backHome').classList.remove('hidden');
  const latestRuns=Object.values(TESTS).map(t=>latestRun(t.id)).filter(Boolean);
  latestRuns.forEach(finalizeRunIfNeeded);
  const testsStarted=latestRuns.length, totalQuestions=Object.values(TESTS).reduce((n,t)=>n+t.questions.length,0), resolved=latestRuns.reduce((n,r)=>n+completedCount(r),0), revealed=latestRuns.reduce((n,r)=>n+revealedCount(r),0);
  $('#summary').innerHTML=`<div class="progress-overview"><p class="eyebrow">Avance actual</p><h2>Estado de los tests</h2><p class="progress-intro">Abre un test para ver sus preguntas y el detalle de las que ya abordaste.</p><div class="progress-global"><div><strong>${testsStarted}/5</strong><span>Tests iniciados</span></div><div><strong>${resolved}/${totalQuestions}</strong><span>Preguntas resueltas</span></div><div><strong>${revealed}</strong><span>Soluciones consultadas</span></div></div><div class="progress-tests">${Object.values(TESTS).map(t=>progressTestHTML(t,focusTestId)).join('')}</div><div class="actions" style="margin-top:34px"><button class="btn secondary" id="progressHome">Volver a preguntas</button></div></div>`;
  $('#progressHome').onclick=renderHome;
  document.querySelectorAll('[data-progress-start]').forEach(b=>b.onclick=()=>startOrResume(b.dataset.progressStart));
  document.querySelectorAll('[data-progress-resume]').forEach(b=>b.onclick=()=>{ const run=runById(b.dataset.progressResume); if(!run)return; if(run.finishedAt)newRun(run.testId); else startOrResume(run.testId); });
  document.querySelectorAll('[data-progress-question]').forEach(b=>b.onclick=()=>{ const [rid,raw]=b.dataset.progressQuestion.split('|'); const run=runById(rid); if(!run)return; activeRunId=rid; index=Number(raw); $('#summary').classList.add('hidden'); $('#quiz').classList.remove('hidden'); renderQuestion(); window.scrollTo({top:0,behavior:'smooth'}); });
  document.querySelectorAll('[data-progress-source]').forEach(a=>a.onclick=()=>{ const [rid,raw]=a.dataset.progressSource.split('|'); const run=runById(rid),test=run&&testById(run.testId),q=test&&test.questions[Number(raw)]; if(!run||!q)return; const st=stateFor(run,q.id); st.sourceOpenCount++; recordEvent(run,'source_opened',{questionId:q.id,questionVersion:q.version,sourceHref:q.source.href,sourceLabel:q.source.label,sourceOpenCount:st.sourceOpenCount,origin:'progress'}); persist(); });
  document.querySelectorAll('[data-progress-download]').forEach(b=>b.onclick=()=>{ const [rid,format]=b.dataset.progressDownload.split('|'); activeRunId=rid; if(format==='html')downloadStudyReport(); else downloadStudyCSV(); activeRunId=null; });
  document.querySelectorAll('[data-progress-history]').forEach(b=>b.onclick=()=>{ const r=runById(b.dataset.progressHistory); if(r)renderGlobalProgress(r.testId,r.id); });
  document.querySelectorAll('[data-progress-current]').forEach(b=>b.onclick=()=>renderGlobalProgress(b.dataset.progressCurrent,null));
  window.scrollTo({top:0,behavior:'smooth'});
}
function absoluteSource(href){ try{return new URL(href,location.href).href}catch{return href} }
function reportData(run){ const test=testById(run.testId); return {test:test.title,testId:test.id,testVersion:run.testVersion,runId:run.id,startedAt:run.startedAt,finishedAt:run.finishedAt,summary:{questions:test.questions.length,firstAttemptCorrect:firstAttemptCount(run),solvedWithoutReveal:masteredCount(run),revealed:test.questions.filter(q=>stateFor(run,q.id).everRevealed).length,totalAttempts:totalAttempts(run),activeMs:totalActiveMs(run)},questions:test.questions.map((q,i)=>{const st=stateFor(run,q.id);return {number:i+1,id:q.id,version:q.version,tag:q.tag,prompt:q.q,case:q.case||null,status:runStatusText(st),attemptCount:st.attempts.length,firstAttemptCorrect:!!st.attempts[0]?.correct,revealed:st.everRevealed,timeToFirstResolutionMs:firstCompletionMs(st),activeMs:st.activeMs,visitCount:st.visitCount,sourceOpenCount:st.sourceOpenCount,attempts:st.attempts.map(a=>({attemptNo:a.attemptNo,optionId:a.optionId,optionText:optionFor(q,a.optionId)?.text||'',displayedPosition:a.displayedPosition,correct:a.correct,totalActiveMs:a.totalActiveMs,sincePreviousAttemptMs:a.sincePreviousAttemptMs,phase:a.phase||'practice',at:a.at})),correctOption:{id:q.correctId,text:optionFor(q,q.correctId).text},explanation:q.why,sourceQuote:q.sourceQuote||null,source:{label:q.source.label,href:absoluteSource(q.source.href),download:!!q.source.download}}})}; }
function downloadText(filename,text,type){ const blob=new Blob([text],{type}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000); }
function safeFilename(text){ return String(text).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
function downloadStudyReport(){ const run=currentRun(); if(!allComplete(run))return; const data=reportData(run),test=testById(run.testId); recordEvent(run,'student_report_downloaded',{format:'html'}); const rows=data.questions.map(q=>{const hasCorrect=q.attempts.some(a=>a.correct);const solution=!hasCorrect?`<p><b>Solución consultada</b> ${escapeHTML(q.correctOption.text)}</p>`:'';const quote=q.sourceQuote?`<blockquote>“${escapeHTML(q.sourceQuote)}”</blockquote>`:'';const action=q.source.download?'Descargar fuente':'Abrir fuente';return `<section><h2>${q.number}. ${escapeHTML(q.tag)}</h2><p><b>Estado</b> ${escapeHTML(q.status)} · <b>Intentos</b> ${q.attemptCount} · <b>Tiempo</b> ${formatDuration(q.timeToFirstResolutionMs)}</p>${q.case?`<p><b>Caso</b> ${escapeHTML(q.case)}</p>`:''}<h3>Intentos</h3>${q.attempts.length?`<ol>${q.attempts.map(a=>`<li>${escapeHTML(a.optionText)} <b>${a.correct?'Correcta':'Incorrecta'}</b></li>`).join('')}</ol>`:'<p>Sin respuesta registrada.</p>'}${solution}<p><b>Explicación</b> ${escapeHTML(q.explanation)}</p>${quote}<p><a href="${escapeHTML(q.source.href)}">${action} · ${escapeHTML(q.source.label)}</a></p></section>`}).join(''); const html=`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${escapeHTML(test.title)} · Informe de estudio</title><style>body{font-family:system-ui,Arial,sans-serif;max-width:860px;margin:40px auto;padding:0 24px;color:#171717;line-height:1.55}header{border-bottom:2px solid #171717;padding-bottom:20px;margin-bottom:30px}h1{font-size:38px;margin:0 0 8px}h2{font-size:22px;margin-top:0}h3{font-size:13px;text-transform:uppercase;letter-spacing:.08em}section{border-bottom:1px solid #bbb;padding:24px 0}a{color:#5f480f}small{color:#666}blockquote{font-family:Georgia,serif;margin:16px 0;padding:12px 14px;border:1px solid #bbb}.metrics{display:flex;gap:18px;flex-wrap:wrap}.metrics span{border:1px solid #bbb;padding:8px 10px}footer{margin-top:42px;padding-top:18px;border-top:1px solid #bbb;color:#666;font-size:12px}</style></head><body><header><small>Ética y Psicología · Preguntas de práctica</small><h1>${escapeHTML(test.title)}</h1><p>Práctica del ${new Date(run.startedAt).toLocaleString('es-CL')}</p><div class="metrics"><span>${data.summary.firstAttemptCorrect}/${data.summary.questions} correctas al primer intento</span><span>${data.summary.totalAttempts} intentos</span><span>${formatDuration(data.summary.activeMs)} de tiempo activo</span></div></header>${rows}<footer>Construido gracias al trabajo de David Carrasco y Carolina Contreras.</footer></body></html>`; downloadText(safeFilename(test.title)+'-informe.html',html,'text/html;charset=utf-8'); }
function csvCell(v){ const x=String(v??'').replace(/\"/g,'\"\"'); return '"'+x+'"'; }
function downloadStudyCSV(){ const run=currentRun(); if(!allComplete(run))return; const data=reportData(run),test=testById(run.testId); recordEvent(run,'student_report_downloaded',{format:'csv'}); const head=['test_id','run_id','question_number','question_id','tag','status','attempt_count','first_attempt_correct','revealed','time_to_first_resolution_ms','active_ms','visit_count','source_open_count','attempt_no','option_id','option_text','displayed_position','correct','source']; const rows=[head]; data.questions.forEach(q=>{ const attempts=q.attempts.length?q.attempts:[{}]; attempts.forEach(a=>rows.push([data.testId,data.runId,q.number,q.id,q.tag,q.status,q.attemptCount,q.firstAttemptCorrect,q.revealed,q.timeToFirstResolutionMs,q.activeMs,q.visitCount,q.sourceOpenCount,a.attemptNo??'',a.optionId??'',a.optionText??'',a.displayedPosition??'',a.correct??'',q.source.href])); }); downloadText(safeFilename(test.title)+'-datos.csv',rows.map(r=>r.map(csvCell).join(',')).join('\n'),'text/csv;charset=utf-8'); }
function openRunReport(runId){ const r=runById(runId); if(r)renderGlobalProgress(r.testId,r.id); }
function renderSummary(){ const run=currentRun(); renderGlobalProgress(run?.testId||null,null); }

$('#viewProgress').onclick=()=>{ const run=currentRun(); renderGlobalProgress(run?.testId||null,null); };
$('#homeProgress').onclick=()=>renderGlobalProgress();
$('#resetTest').onclick=showResetConfirm;
$('#cancelReset').onclick=hideResetConfirm;
$('#confirmReset').onclick=resetCurrentTest;
function validateBank(){ const problems=[]; Object.values(TESTS).forEach(t=>{ const ids=new Set(); t.questions.forEach(q=>{ if(ids.has(q.id))problems.push('id repetido '+q.id); ids.add(q.id); const optionIds=q.options.map(o=>o.id); if(q.options.length!==4||new Set(optionIds).size!==4||!optionIds.includes(q.correctId))problems.push('opciones inválidas '+q.id); const lengths=q.options.map(o=>o.text.length),sorted=[...lengths].sort((a,b)=>a-b),median=(sorted[1]+sorted[2])/2,correctLen=optionFor(q,q.correctId)?.text.length||0; if(Math.max(...lengths)/Math.min(...lengths)>1.30)problems.push('longitudes desbalanceadas '+q.id); if(correctLen/median>1.18||correctLen/median<0.82)problems.push('clave destaca por longitud '+q.id); if(!Array.isArray(q.sourceTerms)||q.sourceTerms.length<2)problems.push('sin vocabulario fuente '+q.id); const visible=[q.q,q.case||'',q.hint,q.why,...q.options.map(o=>o.text)].join(' '); if(/[—:;]/.test(visible))problems.push('puntuación a revisar '+q.id); if(/\b(primera|segunda|tercera|cuarta) (alternativa|formulación|opción|respuesta)\b/i.test(q.why))problems.push('explicación depende de posición '+q.id); }); }); if(problems.length)console.warn('[tests] revisión de banco',problems); }
window.EYPTests={exportAnalytics(){return structuredClone(db)},getActiveRun(){return activeRunId?structuredClone(currentRun()):null},getStudentReport(){return activeRunId?structuredClone(reportData(currentRun())):null},clearLocalData(){clearLocalDb();location.reload()}};
window.addEventListener('beforeunload',()=>{ closeActiveView('unload'); const run=currentRun(); if(run) flushRunSync(db.participantId,run); });
document.addEventListener('visibilitychange',()=>{ if(document.hidden) closeActiveView('hidden'); else if(activeRunId&&!$('#quiz').classList.contains('hidden')){const run=currentRun(),q=testById(run.testId).questions[index];openActiveView(run,q.id);} });
async function teacherLogin(event){
  event.preventDefault();
  const key=$('#teacherKey').value;
  const status=$('#teacherAccessStatus');
  status.textContent='';
  if(!key){ status.textContent='Escribe la clave.'; return; }
  try{
    const response=await fetch('/api/tests/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key}),cache:'no-store'});
    const data=await response.json().catch(()=>({}));
    if(!response.ok){ status.textContent=data.error||'No se pudo iniciar.'; return; }
    location.href='./docente.html';
  }catch{
    status.textContent='Este acceso no está disponible en este entorno.';
  }
}
$('#openTeacherAccess').onclick=()=>{ $('#teacherAccessForm').classList.toggle('hidden'); if(!$('#teacherAccessForm').classList.contains('hidden')) $('#teacherKey').focus(); };
$('#closeTeacherAccess').onclick=()=>{ $('#teacherAccessForm').classList.add('hidden'); $('#teacherAccessStatus').textContent=''; };
$('#teacherAccessForm').onsubmit=teacherLogin;
$('#backHome').onclick=renderHome;
validateBank();
renderHome();
void syncAllRuns(db.participantId,db.runs);