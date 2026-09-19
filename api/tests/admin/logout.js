import { reply, clearAdminCookie } from '../_shared.js';

export default async function handler(req,res){
  if(req.method!=='POST') return reply(res,405,{error:'Método no permitido.'});
  clearAdminCookie(req,res);
  return reply(res,200,{ok:true});
}
