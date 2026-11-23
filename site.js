"use strict";
const year=document.getElementById('year');if(year) year.textContent=new Date().getFullYear();
const full=document.getElementById('full');
if(full){full.addEventListener('click',async()=>{
 const el=document.getElementById('videobox');
 try{if(document.fullscreenElement) await document.exitFullscreen();else if(el?.requestFullscreen) await el.requestFullscreen();}
 catch(_){const s=document.getElementById('status');if(s)s.textContent='Utiliza el botón de pantalla completa del reproductor.';}
});}
