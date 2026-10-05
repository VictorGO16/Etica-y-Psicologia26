import {$,api,UAH,escapeHTML as esc,dateLabel,timeLabel,customCoordinates,timerLabel,remaining,setupLogin} from './common.js';
import {referenceMap} from './map.js';
import {attendanceMatrix} from './matrix.js';
import {universityQrPanel} from './university-qr.js';
let snapshot=null,mutation=false,loading=false,retakeId=null,lastActivatedToken=null;
function todayMonday(){
  const civil=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Santiago',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const d=new Date(civil+'T12:00:00Z');const offset=(d.getUTCDay()+6)%7;d.setUTCDate(d.getUTCDate()-offset);return d.toISOString().slice(0,10);
}
$('#classDate').value=todayMonday();
const mapPicker=referenceMap({element:$('#referenceMap'),latitude:$('#latitude'),longitude:$('#longitude'),button:$('#useMyLocation'),status:$('#mapStatus'),onChange:activationNotice});
const qrPanel=universityQrPanel({isBusy:()=>mutation,setBusy:value=>{mutation=value;},reload:load});
function modal({title,text,accept,alternative,extra=false,danger=false}){
  return new Promise(resolve=>{
    $('#dialogTitle').textContent=title;$('#dialogText').textContent=text;$('#dialogAccept').textContent=accept;
    $('#dialogAccept').className='btn'+(danger?' danger':'');$('#dialogAlternative').hidden=!alternative;$('#dialogAlternative').textContent=alternative||'';
    $('#extraField').hidden=!extra;$('#extraMinutes').value='5';$('#dialogStatus').textContent='';
    let settled=false;
    const finish=value=>{if(settled)return;settled=true;$('#confirmDialog').close();resolve(value);};
    $('#dialogAccept').onclick=()=>{const minutes=Number($('#extraMinutes').value);if(extra&&(!Number.isInteger(minutes)||minutes<1||minutes>240)){$('#dialogStatus').textContent='Ingresa entre 1 y 240 minutos enteros.';return;}finish(extra?minutes:'accept');};
    $('#dialogAlternative').onclick=()=>finish('alternative');$('#dialogCancel').onclick=()=>finish(null);
    $('#confirmDialog').oncancel=event=>{event.preventDefault();finish(null);};$('#confirmDialog').showModal();
  });
}
function showLogin(){snapshot=null;retakeId=null;lastActivatedToken=null;$('#login').hidden=false;$('#dashboard').hidden=true;$('#records').replaceChildren();$('#sessionTable').replaceChildren();}
function selectedSession(){return snapshot?.sessions.find(s=>s.date===$('#classDate').value&&s.module===Number($('#module').value));}
function activationNotice(){
  const s=selectedSession(),retake=Boolean(s&&s.id===retakeId),justActivated=Boolean(s&&s.token===lastActivatedToken);
  $('#activate').disabled=mutation||Boolean(s&&!retake);
  $('#activate').textContent=retake?'Volver a tomar asistencia':s?(remaining(s.expiresAt)?'Asistencia activa':'Toma finalizada'):'Activar asistencia';
  $('#replaceNotice').hidden=!s||justActivated;
  $('#replaceNotice').className=retake?'warning':'muted';
  if(s)$('#replaceNotice').textContent=retake?`Volver a tomar eliminará sus ${s.count} ${s.count===1?'registro':'registros'}, previa confirmación.`:`Este módulo ${remaining(s.expiresAt)?'está activo':'ya fue tomado'}. Usa las acciones de «Asistencias creadas» para dar tiempo extra, volver a tomarlo o borrarlo.`;
  $('#activateSuccess').hidden=!justActivated;
  $('#customNotice').hidden=!customCoordinates({latitude:Number($('#latitude').value),longitude:Number($('#longitude').value)});
}
async function load(){
  if(loading)return;loading=true;
  try{
    snapshot=await api('data');$('#login').hidden=true;$('#dashboard').hidden=false;
    qrPanel.render(snapshot.universityQr);if(!snapshot.universityQr.enabled)mapPicker.init();
    $('#updated').textContent=`Actualizado a las ${timeLabel(snapshot.serverTime)} hrs. · ${snapshot.students.length} estudiantes`;
    renderSessions();renderDateFilter();renderRecords();activationNotice();
  }catch(error){if(error.status===401){showLogin();}else{$('#updated').textContent=error.message;if($('#dashboard').hidden)$('#loginStatus').textContent=error.message;}}
  finally{loading=false;}
}
function renderSessions(){
  $('#sessionTable').innerHTML=`<table><thead><tr><th>Fecha y módulo</th><th>Estado</th><th>Registros</th><th>Ubicación</th><th>Botón de acceso</th><th>Acciones</th></tr></thead><tbody>${snapshot.sessions.map(s=>`<tr><td>${esc(dateLabel(s.date))}<small>Módulo ${s.module}</small></td><td><span class="badge${remaining(s.expiresAt)?'':' closed'}" data-session-timer="${s.expiresAt}"></span></td><td>${s.count}</td><td>${s.requireLocation?'Requerida':'No requerida'}<small>${s.custom?'Coordenadas personalizadas':'Punto UAH'}</small>${s.requireLocation?`<small>${s.latitude}, ${s.longitude}</small>`:''}</td><td><label class="toggle session-toggle"><input type="checkbox" data-button="${s.id}" aria-label="Mostrar botón para abrir el formulario del módulo ${s.module}, ${esc(dateLabel(s.date))}" ${s.showButton?'checked':''}><span>${s.showButton?'Visible':'Oculto'}</span></label></td><td><button type="button" class="inline-btn" data-extra="${s.id}">Tiempo extra</button><br><button type="button" class="inline-btn" data-retake="${s.id}">Volver a tomar</button><br><button type="button" class="inline-btn" data-report="${s.id}">Ver registros</button><br><button type="button" class="inline-btn delete-link" data-delete="${s.id}">Borrar toma</button></td></tr>`).join('')||'<tr><td colspan="6">Aún no se han creado asistencias.</td></tr>'}</tbody></table>`;
  document.querySelectorAll('[data-extra]').forEach(button=>button.onclick=()=>extend(button.dataset.extra));
  document.querySelectorAll('[data-delete]').forEach(button=>button.onclick=()=>deleteSession(button.dataset.delete));
  document.querySelectorAll('[data-button]').forEach(toggle=>toggle.onchange=()=>changeButton(toggle));
  document.querySelectorAll('[data-retake]').forEach(button=>button.onclick=()=>{
    if(mutation)return;const s=snapshot.sessions.find(s=>s.id===button.dataset.retake);retakeId=s.id;lastActivatedToken=null;$('#activateStatus').textContent='';$('#classDate').value=s.date;$('#module').value=String(s.module);
    // Nueva toma: siempre parte con las coordenadas UAH, aunque la anterior fuera una prueba.
    $('#latitude').value=UAH.latitude;$('#longitude').value=UAH.longitude;$('#requireLocation').checked=s.requireLocation;$('#showButton').checked=s.showButton;
    mapPicker.sync(true);
    activationNotice();$('#activateForm').scrollIntoView({behavior:'smooth',block:'center'});$('#minutes').focus();
  });
  document.querySelectorAll('[data-report]').forEach(button=>button.onclick=()=>{const s=snapshot.sessions.find(s=>s.id===button.dataset.report);$('#filterDate').value=s.date;$('#filterModule').value=String(s.module);renderRecords();$('#records').scrollIntoView({behavior:'smooth'});});tick();
}
function tick(){document.querySelectorAll('[data-session-timer]').forEach(el=>{const left=remaining(el.dataset.sessionTimer);el.textContent=left?`Abierta · ${timerLabel(el.dataset.sessionTimer)}`:'Cerrada';el.className='badge'+(left?'':' closed');});if(snapshot)activationNotice();}
function renderDateFilter(){
  const value=$('#filterDate').value;const dates=[...new Set(snapshot.sessions.map(s=>s.date))].sort().reverse();
  $('#filterDate').replaceChildren(new Option('Todas las fechas',''),...dates.map(d=>new Option(dateLabel(d),d)));if(dates.includes(value))$('#filterDate').value=value;
}
function filtered(){const date=$('#filterDate').value,module=Number($('#filterModule').value)||null;const match=x=>(!date||x.date===date)&&(!module||x.module===module);return {sessions:snapshot.sessions.filter(match),records:snapshot.records.filter(match)};}
function renderRecords(){
  if(!snapshot)return;const {sessions,records}=filtered();$('#recordCount').textContent=`${records.length} registros · ${sessions.length} módulos incluidos`;
  let headers,rows;
  if($('#view').value==='detail'){
    headers=['Fecha','Módulo','Estudiante','Hora (Chile)','Ubicación'];
    rows=records.map(r=>`<tr><td>${esc(dateLabel(r.date))}</td><td>${r.module}</td><td>${esc(r.name)}</td><td class="time">${timeLabel(r.recordedAt)}</td><td>${r.locationChecked?'Comprobada':'No requerida'}</td></tr>`);
  }else{
    headers=['Fecha','Estudiante','M1','M2','M3','asistencia_completa'];
    rows=attendanceMatrix(snapshot.students,sessions,snapshot.dailyRecords||snapshot.records).map(r=>`<tr><td>${esc(dateLabel(r.date))}</td><td>${esc(r.name)}</td><td>${r.M1}</td><td>${r.M2}</td><td>${r.M3}</td><td>${r.asistencia_completa}</td></tr>`);
  }
  $('#records').innerHTML=`<table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')||`<tr><td colspan="${headers.length}">No hay registros para esta consulta.</td></tr>`}</tbody></table>`;
}
async function confirmRetake(payload,s){
  const answer=await modal({title:'¿Volver a tomar asistencia?',text:`La toma de ${dateLabel(payload.date)}, módulo ${payload.module}, tiene ${s.count} ${s.count===1?'registro':'registros'}. Si continúas, se eliminarán y comenzará una nueva toma. Esta acción no se puede deshacer.`,accept:'Borrar y activar nuevamente',danger:true});
  if(!answer)return false;payload.replace=true;payload.expectedToken=s.token;return true;
}
$('#activateForm').onsubmit=async event=>{
  event.preventDefault();if(mutation)return;const chosen=selectedSession();if(chosen&&chosen.id!==retakeId)return;mutation=true;lastActivatedToken=null;$('#activate').disabled=true;$('#activateStatus').textContent='';$('#activateSuccess').hidden=true;
  try{
    const payload={date:$('#classDate').value,module:Number($('#module').value),minutes:Number($('#minutes').value),requireLocation:$('#requireLocation').checked,showButton:$('#showButton').checked,latitude:Number($('#latitude').value),longitude:Number($('#longitude').value),replace:false,confirmCustom:false};
    const parsed=new Date(payload.date+'T12:00:00Z');if(parsed.getUTCDay()!==1)throw new Error('Selecciona un lunes como fecha de clase.');
    if(customCoordinates(payload)){
      const answer=await modal({title:'Coordenadas fuera de la UAH',text:`Las coordenadas ingresadas (${payload.latitude}, ${payload.longitude}) no son las de la UAH. ¿Estás seguro de que quieres utilizarlas?`,accept:'Sí, estoy seguro',alternative:'Usar las de la UAH'});
      if(!answer)return;if(answer==='alternative'){Object.assign(payload,UAH);$('#latitude').value=UAH.latitude;$('#longitude').value=UAH.longitude;mapPicker.sync(true);}else payload.confirmCustom=true;
    }
    const existing=selectedSession();if(existing&&!await confirmRetake(payload,existing))return;
    let result;
    try{result=await api('activate',payload);}catch(error){if(error.code!=='confirm')throw error;if(!await confirmRetake(payload,error))return;result=await api('activate',payload);}
    lastActivatedToken=result.session.token;retakeId=null;$('#activateSuccess').hidden=false;$('#activateSuccess').textContent=`Asistencia activada: ${dateLabel(result.session.date)}, módulo ${result.session.module}, por ${payload.minutes} minutos.`;
    // Cada creación nueva vuelve a los valores originales; el punto de la toma activa permanece guardado.
    $('#latitude').value=UAH.latitude;$('#longitude').value=UAH.longitude;$('#mapStatus').textContent='';mapPicker.sync(true);await load();
  }catch(error){$('#activateStatus').textContent=error.message;if(error.status===401)showLogin();}
  finally{mutation=false;$('#activate').disabled=false;activationNotice();}
};
async function extend(id){
  if(mutation)return;const s=snapshot.sessions.find(s=>s.id===id);mutation=true;$('#sessionStatus').textContent='';
  try{
    const minutes=await modal({title:'Dar tiempo extra',text:`${dateLabel(s.date)}, módulo ${s.module}. Se conservarán sus ${s.count} registros y su configuración de ubicación${s.custom?' con coordenadas personalizadas':''}. Si está cerrado, se abrirá desde ahora; si sigue abierto, se sumarán los minutos al tiempo restante.`,accept:'Dar tiempo extra',extra:true});
    if(!minutes)return;await api('extend',{id:s.id,token:s.token,minutes});lastActivatedToken=null;await load();
  }catch(error){$('#sessionStatus').textContent=error.message;if(error.status===401)showLogin();}finally{mutation=false;}
}
async function changeButton(toggle){
  const s=snapshot.sessions.find(s=>s.id===toggle.dataset.button);
  if(mutation){toggle.checked=s.showButton;return;}
  mutation=true;toggle.disabled=true;$('#sessionStatus').textContent='';$('#sessionSuccess').hidden=true;
  try{
    await api('button',{id:s.id,token:s.token,showButton:toggle.checked});
    $('#sessionSuccess').hidden=false;$('#sessionSuccess').textContent=`Botón de acceso ${toggle.checked?'visible':'oculto'}: ${dateLabel(s.date)}, módulo ${s.module}.`;
    await load();
  }catch(error){toggle.checked=s.showButton;$('#sessionStatus').textContent=error.message;if(error.status===401)showLogin();}
  finally{mutation=false;toggle.disabled=false;activationNotice();}
}
async function deleteSession(id){
  if(mutation)return;const s=snapshot.sessions.find(s=>s.id===id);mutation=true;$('#sessionStatus').textContent='';$('#sessionSuccess').hidden=true;
  try{
    const answer=await modal({title:'¿Borrar esta toma de asistencia?',text:`Se eliminará la toma de ${dateLabel(s.date)}, módulo ${s.module}, y sus ${s.count} ${s.count===1?'registro':'registros'}. El QR dejará de funcionar. Esta acción no se puede deshacer. Las otras tomas se conservarán.`,accept:'Borrar toma',danger:true});
    if(!answer)return;
    await api('delete',{id:s.id,token:s.token,confirmDelete:true});
    if(retakeId===s.id)retakeId=null;if(lastActivatedToken===s.token)lastActivatedToken=null;
    $('#sessionSuccess').hidden=false;$('#sessionSuccess').textContent=`Toma borrada: ${dateLabel(s.date)}, módulo ${s.module}.`;
    await load();
  }catch(error){$('#sessionStatus').textContent=error.message;if(error.status===401)showLogin();}finally{mutation=false;activationNotice();}
}
$('#download').onclick=async()=>{
  const button=$('#download');button.disabled=true;$('#downloadStatus').textContent='';
  try{const params=new URLSearchParams({action:'export'});if($('#filterDate').value)params.set('date',$('#filterDate').value);if($('#filterModule').value)params.set('module',$('#filterModule').value);
    const r=await fetch('/api/asistencia?'+params,{cache:'no-store'});if(!r.ok){const data=await r.json().catch(()=>({}));if(r.status===401)showLogin();throw new Error(data.error||'No se pudo descargar el archivo.');}
    const url=URL.createObjectURL(await r.blob());const a=document.createElement('a');a.href=url;a.download=`asistencia-${$('#filterDate').value||'todas'}${$('#filterModule').value?'-modulo-'+$('#filterModule').value:''}.xlsx`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
  }catch(error){$('#downloadStatus').textContent=error.message;}finally{button.disabled=false;}
};
['classDate','module'].forEach(id=>$('#'+id).addEventListener('input',()=>{retakeId=null;$('#activateStatus').textContent='';activationNotice();}));['latitude','longitude'].forEach(id=>$('#'+id).addEventListener('input',activationNotice));['filterDate','filterModule','view'].forEach(id=>$('#'+id).onchange=renderRecords);
$('#refresh').onclick=load;$('#logout').onclick=async()=>{try{await api('logout',{});showLogin();}catch(error){$('#updated').textContent=error.message;}};
setupLogin(load);load();setInterval(tick,1000);setInterval(()=>{if(snapshot&&!mutation&&!document.hidden)load();},20000);document.addEventListener('visibilitychange',()=>{if(!document.hidden&&snapshot&&!mutation)load();});
