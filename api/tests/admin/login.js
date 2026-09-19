import { reply, fail, body, checkAdminKey, issueAdminCookie, problem } from '../_shared.js';

export default async function handler(req,res){
  if(req.method!=='POST') return reply(res,405,{error:'Método no permitido.'});
  try{
    const b=body(req,4000);
    if(typeof b.key!=='string' || !checkAdminKey(b.key)) throw problem(401,'Clave incorrecta.');
    issueAdminCookie(req,res);
    return reply(res,200,{ok:true});
  }catch(error){ return fail(res,error); }
}
