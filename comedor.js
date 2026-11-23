"use strict";


// PUBLICACIÓN DEL COMEDOR — Solo sustituye los archivos en assets/.
// El menú conserva su nombre: menu.png
// Opcionales: extra.jpg y promo.mp4
// La marca de versión evita que el navegador muestre una copia antigua demasiado tiempo.
const cacheVersion = String(Date.now());
function activateImage(id, src, containerId) {
 const image=document.getElementById(id);
 image.onload=()=>{image.hidden=false;if(containerId)document.getElementById(containerId).hidden=false;};
 image.onerror=()=>{image.hidden=true;if(containerId)document.getElementById(containerId).hidden=true;};
 image.src=src+'?v='+cacheVersion;
}
// El menú se muestra directamente como imagen, sin depender de JavaScript.
activateImage('comedor-extra-img','assets/extra.jpg','comedor-extra');
// Se comprueba el archivo opcional solo cuando se sirve desde http(s), sin descargar el video.
if(location.protocol==='https:'||location.protocol==='http:'){
 fetch('assets/promo.mp4',{method:'HEAD',cache:'no-store'}).then(r=>{
  if(r.ok && (r.headers.get('content-type')||'').toLowerCase().includes('video')){
   document.getElementById('comedor-video-zone').hidden=false;
   document.getElementById('comedor-video').src='assets/promo.mp4';
  }
 }).catch(()=>{});
}

