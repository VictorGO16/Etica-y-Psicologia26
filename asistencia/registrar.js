import {$,api,dateLabel,timeLabel,remaining,timerLabel} from './common.js';
import {currentLocation} from './location.js';
const token=new URLSearchParams(location.search).get('token');
let session,students=[],selected=null,busy=false,done=false;
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function renderNames(){
  const terms=normalize($('#search').value).split(/\s+/).filter(Boolean);
  const found=students.filter(s=>terms.every(t=>normalize(s.name).includes(t)));
  $('#student').replaceChildren(...found.map(s=>new Option(s.name,String(s.id),false,s.id===selected)));
  if(!found.some(s=>s.id===selected))selected=null;
  $('#student').value=selected===null?'':String(selected);
  $('#noMatches').hidden=found.length>0;selection();
}
function selection(){const person=students.find(s=>s.id===selected);$('#chosen').textContent=person?`Seleccionado: ${person.name}`:'';$('#save').disabled=!person||busy||!session||!remaining(session.expiresAt);}
function receipt(data){done=true;$('#attendanceForm').hidden=true;$('#formStatus').textContent='';$('#timer').textContent='Registro completado.';$('#receipt').hidden=false;$('#receipt').textContent=`Asistencia guardada para ${data.name}, módulo ${session.module}, a las ${timeLabel(data.recordedAt)} hrs.`;}
function tick(){if(!session||done)return;const left=remaining(session.expiresAt);$('#timer').textContent=left?`Tiempo restante: ${timerLabel(session.expiresAt)}`:'Registro cerrado';selection();if(!left)$('#formStatus').textContent='Esta toma de asistencia terminó. Si necesitas tiempo extra, avisa al docente.';}
$('#search').oninput=renderNames;$('#student').onchange=()=>{selected=Number($('#student').value)||null;selection();};
$('#attendanceForm').onsubmit=async event=>{
  event.preventDefault();if(busy||!selected||!remaining(session.expiresAt))return;busy=true;selection();$('#formStatus').textContent='';
  try{
    $('#saving').textContent=session.requireLocation?'Comprobando ubicación…':'Guardando asistencia…';
    let locationData=session.requireLocation?await currentLocation():undefined;
    $('#saving').textContent='Guardando asistencia…';
    const data=await api('submit',{token,studentId:selected,...(locationData?{location:locationData}:{})});
    locationData=undefined;receipt(data);
  }catch(error){$('#formStatus').textContent=error.message;}finally{busy=false;$('#saving').textContent='';selection();}
};
async function load(){
  if(busy||done)return;
  try{const data=await api('form',undefined,{token});session=data.session;students=data.students;$('#classDate').textContent=dateLabel(session.date);$('#moduleTitle').textContent=`Módulo ${session.module}`;$('#loading').hidden=true;$('#locationNotice').hidden=!session.requireLocation;if(data.receipt){receipt(data.receipt);return;}$('#attendanceForm').hidden=false;if($('#formStatus').textContent.includes('toma de asistencia terminó'))$('#formStatus').textContent='';renderNames();tick();}
  catch(error){$('#loading').hidden=true;$('#formStatus').textContent=error.message;if(error.status===410){$('#attendanceForm').hidden=true;$('#timer').textContent='Registro cerrado';}}
}
if(token){load();setInterval(load,15000);setInterval(tick,1000);}else{$('#loading').hidden=true;$('#formStatus').textContent='Abre este formulario desde un QR de asistencia activo.';}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&token)load();});
