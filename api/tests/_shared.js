import { createHmac, timingSafeEqual } from 'node:crypto';
import { neon } from '@neondatabase/serverless';

const COOKIE_NAME='eyp_teacher';
const SESSION_SECONDS=8*60*60;

export function db(){
  if(!process.env.DATABASE_URL) throw new Error('Falta configurar DATABASE_URL.');
  return neon(process.env.DATABASE_URL);
}

export function reply(res,status,data){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.status(status).json(data);
}

export function problem(status,message){
  return Object.assign(new Error(message),{status});
}

export function fail(res,error){
  console.error('[tests]',error);
  const status=error.status||500;
  return reply(res,status,{error:status===500?'No se pudo completar la operación. Revisa la configuración del servidor.':error.message});
}

export function body(req,maxBytes=350000){
  const value=req.body;
  if(!value || typeof value!=='object' || Array.isArray(value)) throw problem(400,'Solicitud no válida.');
  const raw=JSON.stringify(value);
  if(raw.length>maxBytes) throw problem(413,'La solicitud es demasiado grande.');
  return value;
}

export function text(value,max,label){
  if(typeof value!=='string' || !value.trim() || value.length>max) throw problem(400,`El campo ${label} no es válido.`);
  return value.trim();
}

export function validDate(value){
  if(value===null || value===undefined || value==='') return null;
  const date=new Date(value);
  if(Number.isNaN(date.getTime())) throw problem(400,'Fecha no válida.');
  return date.toISOString();
}

function secret(){
  const key=process.env.TESTS_ADMIN_KEY;
  if(!key || key.length<8) throw new Error('Falta configurar TESTS_ADMIN_KEY con al menos 8 caracteres.');
  return key;
}

function safeEqual(a,b){
  const aa=Buffer.from(String(a));
  const bb=Buffer.from(String(b));
  return aa.length===bb.length && timingSafeEqual(aa,bb);
}

export function checkAdminKey(value){
  return safeEqual(value,secret());
}

function signature(expires){
  return createHmac('sha256',secret()).update(`teacher:${expires}`).digest('hex');
}

export function issueAdminCookie(req,res){
  const expires=Math.floor(Date.now()/1000)+SESSION_SECONDS;
  const token=`${expires}.${signature(expires)}`;
  const forwarded=String(req.headers['x-forwarded-proto']||'');
  const secure=forwarded==='https' || Boolean(process.env.VERCEL);
  const parts=[`${COOKIE_NAME}=${token}`,'Path=/','HttpOnly','SameSite=Strict',`Max-Age=${SESSION_SECONDS}`];
  if(secure) parts.push('Secure');
  res.setHeader('Set-Cookie',parts.join('; '));
}

export function clearAdminCookie(req,res){
  const forwarded=String(req.headers['x-forwarded-proto']||'');
  const secure=forwarded==='https' || Boolean(process.env.VERCEL);
  const parts=[`${COOKIE_NAME}=`,'Path=/','HttpOnly','SameSite=Strict','Max-Age=0'];
  if(secure) parts.push('Secure');
  res.setHeader('Set-Cookie',parts.join('; '));
}

function cookies(req){
  const raw=String(req.headers.cookie||'');
  const out={};
  for(const part of raw.split(';')){
    const i=part.indexOf('=');
    if(i<0) continue;
    out[part.slice(0,i).trim()]=decodeURIComponent(part.slice(i+1).trim());
  }
  return out;
}

export function requireAdmin(req){
  const token=cookies(req)[COOKIE_NAME];
  if(!token) throw problem(401,'Sesión docente no iniciada.');
  const [expRaw,sig]=token.split('.');
  const exp=Number(expRaw);
  if(!Number.isFinite(exp) || exp<Math.floor(Date.now()/1000) || !safeEqual(sig,signature(expRaw))) throw problem(401,'La sesión docente expiró.');
  return true;
}

export function sanitizeRun(participantId,run){
  if(!run || typeof run!=='object' || Array.isArray(run)) throw problem(400,'Práctica no válida.');
  const id=text(run.id,128,'run.id');
  const pid=text(run.participantId,128,'run.participantId');
  if(pid!==participantId) throw problem(400,'El participante de la práctica no coincide.');
  const testId=text(run.testId,80,'run.testId');
  if(!run.questions || typeof run.questions!=='object' || Array.isArray(run.questions)) throw problem(400,'Preguntas no válidas.');
  if(!Array.isArray(run.events)) throw problem(400,'Eventos no válidos.');
  if(run.events.length>5000) throw problem(400,'Demasiados eventos en la práctica.');
  if(Object.keys(run.questions).length>100) throw problem(400,'Demasiadas preguntas en la práctica.');
  const startedAt=validDate(run.startedAt);
  const finishedAt=validDate(run.finishedAt);
  const abandonedAt=validDate(run.abandonedAt);
  return {id,participantId:pid,testId,startedAt,finishedAt,abandonedAt,payload:run};
}

export function shortId(id){
  return String(id||'').replace(/-/g,'').slice(0,8).toUpperCase();
}
