import {$,api} from './common.js';

export function universityQrPanel({isBusy,setBusy,reload}){
  let config={enabled:false,hasImage:false},selected=null,previewUrl=null,selectionVersion=0;
  function render(next=config){
    config=next;
    $('#universityMode').checked=config.enabled;
    $('#universityMode').disabled=isBusy()||!config.hasImage||Boolean(selected);
    $('#publishUniversityQr').disabled=isBusy()||!selected;
    $('#discardUniversityQr').hidden=!selected;
    $('#universityFile').disabled=isBusy();
    $('#nativeControls').hidden=config.enabled;
    const src=previewUrl||config.imageUrl;
    $('#universityPreview').hidden=!src;
    if(src&&$('#universityPreview').getAttribute('src')!==src)$('#universityPreview').src=src;
    if(!src)$('#universityPreview').removeAttribute('src');
    $('#universityCurrent').textContent=config.enabled?'La sección Asistencia muestra el QR de la universidad.':'La sección Asistencia usa las tomas del sitio.';
  }
  function discard(){
    selectionVersion++;selected=null;
    if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=null;
    $('#universityFile').value='';render();
  }
  async function select(file){
    if(isBusy())return;
    const version=++selectionVersion;
    $('#universityStatus').textContent='';$('#universitySuccess').hidden=true;
    if(!file)return;
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)){$('#universityStatus').textContent='Selecciona una imagen PNG, JPG o WebP.';return;}
    if(file.size>1024*1024){$('#universityStatus').textContent='La imagen debe pesar como máximo 1 MB.';return;}
    const url=URL.createObjectURL(file);
    try{
      await new Promise((resolve,reject)=>{const image=new Image();image.onload=resolve;image.onerror=()=>reject(new Error('No se pudo leer la imagen.'));image.src=url;});
      if(version!==selectionVersion){URL.revokeObjectURL(url);return;}
      if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=url;selected=file;render();
      $('#universityStatus').textContent='Vista previa lista. Pulsa «Publicar QR» para mostrarla a los estudiantes.';
    }catch(error){URL.revokeObjectURL(url);if(version===selectionVersion)$('#universityStatus').textContent=error.message;}
  }
  $('#universityFile').onchange=event=>select(event.target.files[0]);
  document.addEventListener('paste',event=>{
    if($('#dashboard').hidden||isBusy())return;
    const item=[...(event.clipboardData?.items||[])].find(x=>x.kind==='file'&&x.type.startsWith('image/'));
    if(!item)return;event.preventDefault();select(item.getAsFile());
  });
  $('#discardUniversityQr').onclick=()=>{discard();$('#universityStatus').textContent='';};
  async function save(image,enabled){
    if(isBusy())return;setBusy(true);render();$('#universityStatus').textContent='';$('#universitySuccess').hidden=true;
    try{
      const payload={enabled};
      if(image)payload.image=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('No se pudo leer la imagen.'));reader.readAsDataURL(image);});
      const result=await api('university-qr',payload);config=result.universityQr;
      if(image)discard();
      $('#universitySuccess').hidden=false;$('#universitySuccess').textContent=enabled?'QR de la universidad publicado.':'Se muestran nuevamente las tomas del sitio.';
      await reload();
    }catch(error){$('#universityStatus').textContent=error.message;if(error.status===401)await reload();}
    finally{setBusy(false);render();}
  }
  $('#publishUniversityQr').onclick=()=>{if(selected)save(selected,true);};
  $('#universityMode').onchange=()=>save(null,$('#universityMode').checked);
  return {render};
}
