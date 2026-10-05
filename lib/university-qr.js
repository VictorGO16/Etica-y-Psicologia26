import {problem} from '../api/tests/_shared.js';

export const MAX_QR_BYTES=1024*1024;
export function qrImage(value){
  if(typeof value!=='string')throw problem(400,'Selecciona una imagen PNG, JPG o WebP.');
  if(value.length>Math.ceil(MAX_QR_BYTES/3)*4+64)throw problem(413,'La imagen debe pesar como máximo 1 MB.');
  const match=/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if(!match)throw problem(400,'Selecciona una imagen PNG, JPG o WebP.');
  const [,mime,data]=match,bytes=Buffer.from(data,'base64');
  if(bytes.length>MAX_QR_BYTES)throw problem(413,'La imagen debe pesar como máximo 1 MB.');
  const signatures={
    'image/png':bytes.length>=24&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))&&bytes.toString('ascii',12,16)==='IHDR',
    'image/jpeg':bytes.length>=4&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255,
    'image/webp':bytes.length>=16&&bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP'
  };
  if(data!==bytes.toString('base64')||!signatures[mime])throw problem(400,'El archivo no corresponde a una imagen válida del formato indicado.');
  return {mime,data};
}
export function qrView(row){
  return {enabled:Boolean(row?.enabled),hasImage:Boolean(row?.version),
    imageUrl:row?.version?`/api/asistencia?action=university-image&v=${row.version}`:null};
}
