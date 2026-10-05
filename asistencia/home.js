import {$,api,timerLabel,remaining,setupLogin} from './common.js';
import {sessionCard} from './cards.js';
let signature='';
async function load(){
  try{
    const data=await api('state');$('#stateStatus').textContent='';$('#empty').hidden=data.sessions.length>0;
    const next=JSON.stringify(data.sessions);
    if(next!==signature){signature=next;$('#sessions').innerHTML=data.sessions.map(sessionCard).join('');tick();}
  }catch(error){$('#stateStatus').textContent=error.message;}
}
function tick(){document.querySelectorAll('[data-timer]').forEach(el=>{el.textContent=remaining(el.dataset.timer)?`Disponible ${timerLabel(el.dataset.timer)}`:'Registro cerrado';});document.querySelectorAll('[data-expires]').forEach(el=>{if(!remaining(el.dataset.expires))el.hidden=true;});if(signature&&![...document.querySelectorAll('[data-expires]')].some(el=>!el.hidden))$('#empty').hidden=false;}
$('#debug').onclick=()=>{$('#login').hidden=false;$('#adminKey').focus();$('#login').scrollIntoView({behavior:'smooth'});};$('#closeLogin').onclick=()=>{$('#login').hidden=true;$('#adminKey').value='';};
setupLogin(()=>{location.href='./docente.html';});
load();setInterval(load,10000);setInterval(tick,1000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)load();});
