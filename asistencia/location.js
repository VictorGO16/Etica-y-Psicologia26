// Una medición puntual. No persiste coordenadas ni envía datos por sí misma.
export function currentLocation(provider=globalThis.navigator?.geolocation){
  return new Promise((resolve,reject)=>{
    if(!provider){reject(new Error('Este navegador no permite compartir ubicación. Abre el enlace en el navegador de tu teléfono.'));return;}
    provider.getCurrentPosition(p=>resolve({latitude:p.coords.latitude,longitude:p.coords.longitude,accuracy:p.coords.accuracy,timestamp:p.timestamp}),error=>reject(new Error(error.code===1?'Permiso de ubicación denegado. Habilítalo en los ajustes del navegador para continuar.':error.code===3?'No se obtuvo ubicación a tiempo. Activa la ubicación precisa y vuelve a intentar.':'No se pudo obtener tu ubicación. Comprueba los ajustes de ubicación del teléfono y vuelve a intentar.')),{enableHighAccuracy:true,maximumAge:0,timeout:20000});
  });
}
