import {$,api,escapeHTML,dateLabel,timerLabel,remaining,setupLogin} from './common.js';
let signature='';
async function load(){
  try{
    const data=await api('state');$('#stateStatus').textContent='';$('#empty').hidden=data.sessions.length>0;
    const next=JSON.stringify(data.sessions);
    if(next!==signature){signature=next;$('#sessions').innerHTML=data.sessions.map(s=>`<article class="attendance-card" data-expires="${s.expiresAt}"><p class="eyebrow">${escapeHTML(dateLabel(s.date))}</p><h2>Módulo ${s.module}</h2><img class="qr" src="/api/asistencia?action=qr&amp;token=${s.token}" alt="QR para registrar asistencia del módulo ${s.module}"><p class="countdown" data-timer="${s.expiresAt}"></p><p class="muted">${s.requireLocation?'Requiere compartir ubicación.':'Sin comprobación de ubicación.'}</p><a class="btn secondary" href="./registrar.html?token=${s.token}">Abrir formulario</a></article>`).join('');tick();}
  }catch(error){$('#stateStatus').textContent=error.message;}
}
function tick(){document.querySelectorAll('[data-timer]').forEach(el=>{el.textContent=remaining(el.dataset.timer)?`Disponible ${timerLabel(el.dataset.timer)}`:'Registro cerrado';});document.querySelectorAll('[data-expires]').forEach(el=>{if(!remaining(el.dataset.expires))el.hidden=true;});if(signature&&![...document.querySelectorAll('[data-expires]')].some(el=>!el.hidden))$('#empty').hidden=false;}
$('#debug').onclick=()=>{$('#login').hidden=false;$('#adminKey').focus();$('#login').scrollIntoView({behavior:'smooth'});};$('#closeLogin').onclick=()=>{$('#login').hidden=true;$('#adminKey').value='';};
setupLogin(()=>{location.href='./docente.html';});
load();setInterval(load,10000);setInterval(tick,1000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)load();});
