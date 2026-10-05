import {currentLocation} from './location.js';

export function referenceMap({element,latitude,longitude,button,status,onChange}){
  let map,marker,circle,tilesFailed=false;
  const point=()=>({latitude:Number(latitude.value),longitude:Number(longitude.value)});
  function valid(p){return latitude.value!==''&&longitude.value!==''&&Number.isFinite(p.latitude)&&Number.isFinite(p.longitude)&&Math.abs(p.latitude)<=90&&Math.abs(p.longitude)<=180;}
  function change(p){latitude.value=p.latitude;longitude.value=p.longitude;onChange();sync(true);}
  function sync(pan=false){if(!map)return;const p=point();if(!valid(p))return;const latlng=[p.latitude,p.longitude];marker.setLatLng(latlng);circle.setLatLng(latlng);if(pan)map.setView(latlng,Math.max(map.getZoom(),14));}
  function init(){
    if(map){map.invalidateSize();return;}
    const L=globalThis.L;
    if(!L){status.textContent='No se pudo cargar el mapa. Puedes ingresar coordenadas o usar tu ubicación.';return;}
    try{
      const p=point();map=L.map(element,{scrollWheelZoom:false}).setView([p.latitude,p.longitude],15);
      const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'});
      tiles.on('tileerror',()=>{tilesFailed=true;status.textContent='No se pudieron cargar algunas imágenes del mapa. Puedes usar las coordenadas o «Usar mi ubicación».';});
      tiles.on('load',()=>{if(!tilesFailed)status.textContent='';});tiles.addTo(map);
      marker=L.marker([p.latitude,p.longitude],{draggable:true,title:'Punto de referencia',alt:'Marcador del punto de referencia'}).addTo(map);
      circle=L.circle([p.latitude,p.longitude],{radius:800,color:'#886313',weight:2,fillOpacity:.12}).addTo(map);
      marker.on('dragend',()=>{const p=marker.getLatLng();change({latitude:p.lat,longitude:p.lng});});
      map.on('click',event=>change({latitude:event.latlng.lat,longitude:event.latlng.lng}));
    }catch{status.textContent='No se pudo iniciar el mapa. Puedes ingresar coordenadas o usar tu ubicación.';}
  }
  for(const input of [latitude,longitude])input.addEventListener('change',()=>sync(true));
  button.addEventListener('click',async()=>{
    button.disabled=true;status.textContent='Obteniendo tu ubicación…';
    try{const p=await currentLocation();if(p.accuracy>100){status.textContent='La ubicación es poco precisa. Vuelve a intentar o selecciona el punto en el mapa.';return;}change({latitude:p.latitude,longitude:p.longitude});status.textContent='Punto actualizado desde tu dispositivo. Se pedirá confirmación si es distinto de la UAH.';}
    catch(error){status.textContent=error.message;}finally{button.disabled=false;}
  });
  return {init,sync};
}
