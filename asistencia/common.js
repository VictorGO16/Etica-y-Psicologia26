export const $ = selector => document.querySelector(selector);
export const UAH = {latitude:-33.44497399230422,longitude:-70.6627676244979};
export function escapeHTML(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export function dateLabel(date){return new Intl.DateTimeFormat('es-CL',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));}
export function timeLabel(iso){return new Intl.DateTimeFormat('es-CL',{timeZone:'America/Santiago',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date(iso));}
export function customCoordinates(p){return Math.abs(p.latitude-UAH.latitude)>1e-10||Math.abs(p.longitude-UAH.longitude)>1e-10;}
export let clockOffset=0;
export async function api(action,data,params={}){
  const r=await fetch('/api/asistencia?'+new URLSearchParams({action,...params}),{method:data?'POST':'GET',cache:'no-store',...(data?{headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}:{})});
  const result=await r.json().catch(()=>({}));
  if(!r.ok)throw Object.assign(new Error(result.error||'No se pudo completar la operación.'),{status:r.status,...result});
  if(result.serverTime)clockOffset=new Date(result.serverTime).getTime()-Date.now();
  return result;
}
export function remaining(iso){return Math.max(0,Math.ceil((new Date(iso).getTime()-Date.now()-clockOffset)/1000));}
export function timerLabel(iso){const s=remaining(iso);return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;}
export function setupLogin(onSuccess){
  $('#loginForm').addEventListener('submit',async event=>{
    event.preventDefault();const button=$('#loginForm button[type=submit]');button.disabled=true;$('#loginStatus').textContent='';
    try{await api('login',{key:$('#adminKey').value});$('#adminKey').value='';await onSuccess();}
    catch(error){$('#loginStatus').textContent=error.message;}finally{button.disabled=false;}
  });
}
