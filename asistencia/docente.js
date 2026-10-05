import {$,api,UAH,escapeHTML as esc,dateLabel,timeLabel,customCoordinates,timerLabel,remaining,setupLogin} from './common.js';
import {referenceMap} from './map.js';
let snapshot=null,mutation=false,loading=false;
function todayMonday(){
  const civil=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Santiago',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const d=new Date(civil+'T12:00:00Z');const offset=(d.getUTCDay()+6)%7;d.setUTCDate(d.getUTCDate()-offset);return d.toISOString().slice(0,10);
}
$('#classDate').value=todayMonday();
const mapPicker=referenceMap({element:$('#referenceMap'),latitude:$('#latitude'),longitude:$('#longitude'),button:$('#useMyLocation'),status:$('#mapStatus'),onChange:activationNotice});
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
function showLogin(){snapshot=null;$('#login').hidden=false;$('#dashboard').hidden=true;$('#records').replaceChildren();$('#sessionTable').replaceChildren();}
function selectedSession(){return snapshot?.sessions.find(s=>s.date===$('#classDate').value&&s.module===Number($('#module').value));}
function activationNotice(){
  const s=selectedSession();$('#activate').textContent=s?'Volver a tomar asistencia':'Activar asistencia';$('#replaceNotice').hidden=!s;
  if(s)$('#replaceNotice').textContent=`Ya existe este módulo con ${s.count} registros. Volver a tomarlo los eliminará, previa confirmación.`;
  $('#customNotice').hidden=!customCoordinates({latitude:Number($('#latitude').value),longitude:Number($('#longitude').value)});
}
async function load(){
  if(loading)return;loading=true;
  try{
    snapshot=await api('data');$('#login').hidden=true;$('#dashboard').hidden=false;
    mapPicker.init();
    $('#updated').textContent=`Actualizado a las ${timeLabel(snapshot.serverTime)} hrs. · ${snapshot.students.length} estudiantes`;
    renderSessions();renderDateFilter();renderRecords();activationNotice();
  }catch(error){if(error.status===401){showLogin();}else{$('#updated').textContent=error.message;if($('#dashboard').hidden)$('#loginStatus').textContent=error.message;}}
  finally{loading=false;}
}
function renderSessions(){
  $('#sessionTable').innerHTML=`<table><thead><tr><th>Fecha y módulo</th><th>Estado</th><th>Registros</th><th>Ubicación</th><th>Acciones</th></tr></thead><tbody>${snapshot.sessions.map(s=>`<tr><td>${esc(dateLabel(s.date))}<small>Módulo ${s.module}</small></td><td><span class="badge${remaining(s.expiresAt)?'':' closed'}" data-session-timer="${s.expiresAt}"></span></td><td>${s.count}</td><td>${s.requireLocation?'Requerida':'No requerida'}<small>${s.custom?'Coordenadas personalizadas':'Punto UAH'}</small>${s.requireLocation?`<small>${s.latitude}, ${s.longitude}</small>`:''}</td><td><button type="button" class="inline-btn" data-extra="${s.id}">Tiempo extra</button><br><button type="button" class="inline-btn" data-retake="${s.id}">Volver a tomar</button><br><button type="button" class="inline-btn" data-report="${s.id}">Ver registros</button></td></tr>`).join('')||'<tr><td colspan="5">Aún no se han creado asistencias.</td></tr>'}</tbody></table>`;
  document.querySelectorAll('[data-extra]').forEach(button=>button.onclick=()=>extend(button.dataset.extra));
  document.querySelectorAll('[data-retake]').forEach(button=>button.onclick=()=>{
    const s=snapshot.sessions.find(s=>s.id===button.dataset.retake);$('#classDate').value=s.date;$('#module').value=String(s.module);
    // Nueva toma: siempre parte con las coordenadas UAH, aunque la anterior fuera una prueba.
    $('#latitude').value=UAH.latitude;$('#longitude').value=UAH.longitude;$('#requireLocation').checked=s.requireLocation;
    mapPicker.sync(true);
    activationNotice();$('#activateForm').scrollIntoView({behavior:'smooth',block:'center'});$('#minutes').focus();
  });
  document.querySelectorAll('[data-report]').forEach(button=>button.onclick=()=>{const s=snapshot.sessions.find(s=>s.id===button.dataset.report);$('#filterDate').value=s.date;$('#filterModule').value=String(s.module);renderRecords();$('#records').scrollIntoView({behavior:'smooth'});});tick();
}
function tick(){document.querySelectorAll('[data-session-timer]').forEach(el=>{const left=remaining(el.dataset.sessionTimer);el.textContent=left?`Abierta · ${timerLabel(el.dataset.sessionTimer)}`:'Cerrada';el.className='badge'+(left?'':' closed');});}
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
    headers=['Fecha','Estudiante','Módulo 1','Módulo 2','Módulo 3','Total'];rows=[];
    const dates=[...new Set(sessions.map(s=>s.date))].sort().reverse();const lookup=new Map(records.map(r=>[`${r.date}:${r.studentId}:${r.module}`,r]));
    for(const date of dates){const included=new Set(sessions.filter(s=>s.date===date).map(s=>s.module));for(const student of snapshot.students){let total=0;const cells=[1,2,3].map(n=>{const r=lookup.get(`${date}:${student.id}:${n}`);if(r)total++;return `<td class="time">${r?timeLabel(r.recordedAt):included.has(n)?'Sin registro':'—'}</td>`;}).join('');rows.push(`<tr><td>${esc(dateLabel(date))}</td><td>${esc(student.name)}</td>${cells}<td>${total}</td></tr>`);}}
  }
  $('#records').innerHTML=`<table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')||`<tr><td colspan="${headers.length}">No hay registros para esta consulta.</td></tr>`}</tbody></table>`;
}
async function confirmRetake(payload,s){
  const answer=await modal({title:'¿Volver a tomar asistencia?',text:`Ya existe una asistencia para ${dateLabel(payload.date)}, módulo ${payload.module}, con ${s.count} registros. Si continúas, se eliminarán esos registros y comenzará una nueva toma. Esta acción no se puede deshacer.`,accept:'Borrar y activar nuevamente',danger:true});
  if(!answer)return false;payload.replace=true;payload.expectedToken=s.token;return true;
}
$('#activateForm').onsubmit=async event=>{
  event.preventDefault();if(mutation)return;mutation=true;$('#activate').disabled=true;$('#activateStatus').textContent='';$('#activateSuccess').hidden=true;
  try{
    const payload={date:$('#classDate').value,module:Number($('#module').value),minutes:Number($('#minutes').value),requireLocation:$('#requireLocation').checked,latitude:Number($('#latitude').value),longitude:Number($('#longitude').value),replace:false,confirmCustom:false};
    const parsed=new Date(payload.date+'T12:00:00Z');if(parsed.getUTCDay()!==1)throw new Error('Selecciona un lunes como fecha de clase.');
    if(customCoordinates(payload)){
      const answer=await modal({title:'Coordenadas fuera de la UAH',text:`Las coordenadas ingresadas (${payload.latitude}, ${payload.longitude}) no son las de la UAH. ¿Estás seguro de que quieres utilizarlas?`,accept:'Sí, estoy seguro',alternative:'Usar las de la UAH'});
      if(!answer)return;if(answer==='alternative'){Object.assign(payload,UAH);$('#latitude').value=UAH.latitude;$('#longitude').value=UAH.longitude;mapPicker.sync(true);}else payload.confirmCustom=true;
    }
    const existing=selectedSession();if(existing&&!await confirmRetake(payload,existing))return;
    let result;
    try{result=await api('activate',payload);}catch(error){if(error.code!=='confirm')throw error;if(!await confirmRetake(payload,error))return;result=await api('activate',payload);}
    $('#activateSuccess').hidden=false;$('#activateSuccess').textContent=`Asistencia activada: ${dateLabel(result.session.date)}, módulo ${result.session.module}, por ${payload.minutes} minutos.`;
    // Cada creación nueva vuelve a los valores originales; el punto de la toma activa permanece guardado.
    $('#latitude').value=UAH.latitude;$('#longitude').value=UAH.longitude;$('#mapStatus').textContent='';mapPicker.sync(true);await load();
  }catch(error){$('#activateStatus').textContent=error.message;if(error.status===401)showLogin();}
  finally{mutation=false;$('#activate').disabled=false;activationNotice();}
};
async function extend(id){
  if(mutation)return;const s=snapshot.sessions.find(s=>s.id===id);mutation=true;$('#sessionStatus').textContent='';
  try{
    const minutes=await modal({title:'Dar tiempo extra',text:`${dateLabel(s.date)}, módulo ${s.module}. Se conservarán sus ${s.count} registros y su configuración de ubicación${s.custom?' con coordenadas personalizadas':''}. Si está cerrado, se abrirá desde ahora; si sigue abierto, se sumarán los minutos al tiempo restante.`,accept:'Dar tiempo extra',extra:true});
    if(!minutes)return;await api('extend',{id:s.id,token:s.token,minutes});await load();
  }catch(error){$('#sessionStatus').textContent=error.message;if(error.status===401)showLogin();}finally{mutation=false;}
}
$('#download').onclick=async()=>{
  const button=$('#download');button.disabled=true;$('#downloadStatus').textContent='';
  try{const params=new URLSearchParams({action:'export'});if($('#filterDate').value)params.set('date',$('#filterDate').value);if($('#filterModule').value)params.set('module',$('#filterModule').value);
    const r=await fetch('/api/asistencia?'+params,{cache:'no-store'});if(!r.ok){const data=await r.json().catch(()=>({}));if(r.status===401)showLogin();throw new Error(data.error||'No se pudo descargar el archivo.');}
    const url=URL.createObjectURL(await r.blob());const a=document.createElement('a');a.href=url;a.download=`asistencia-${$('#filterDate').value||'todas'}${$('#filterModule').value?'-modulo-'+$('#filterModule').value:''}.xlsx`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
  }catch(error){$('#downloadStatus').textContent=error.message;}finally{button.disabled=false;}
};
['classDate','module','latitude','longitude'].forEach(id=>$('#'+id).addEventListener('input',activationNotice));['filterDate','filterModule','view'].forEach(id=>$('#'+id).onchange=renderRecords);
$('#refresh').onclick=load;$('#logout').onclick=async()=>{try{await api('logout',{});showLogin();}catch(error){$('#updated').textContent=error.message;}};
setupLogin(load);load();setInterval(tick,1000);setInterval(()=>{if(snapshot&&!mutation&&!document.hidden)load();},20000);document.addEventListener('visibilitychange',()=>{if(!document.hidden&&snapshot&&!mutation)load();});
