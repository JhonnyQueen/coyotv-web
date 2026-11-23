"use strict";
// Videoteca: editar solamente videos-coyotv.json para agregar o quitar enlaces.
const videoteca = {
  items: [],
  grilla: document.getElementById('video-grilla'),
  vacio: document.getElementById('video-vacio'),
  visor: document.getElementById('video-visor'),
  pantalla: document.getElementById('video-pantalla'),
  titulo: document.getElementById('video-titulo'),
  abrir: document.getElementById('video-abrir'),
  categoria: document.getElementById('video-categoria'),
  buscar: document.getElementById('video-buscar')
};
function identificarVideo(raw) {
  let u;
  try { u = new URL(raw); } catch { return null; }
  if (u.protocol !== 'https:') return null;
  const host = u.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '');
  const path = u.pathname;
  const enc = encodeURIComponent;
  const youtube = host === 'youtu.be' || host === 'youtube.com' || host === 'youtube-nocookie.com';
  if (youtube) {
    const id = host === 'youtu.be' ? path.split('/')[1] : (u.searchParams.get('v') || path.match(/\/(?:shorts|live|embed)\/([\w-]{11})/)?.[1]);
    if (/^[\w-]{11}$/.test(id || '')) return {nombre:'YouTube', tipo:'iframe',src:'https://www.youtube-nocookie.com/embed/'+id+'?rel=0&playsinline=1'};
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = path.match(/(?:\/video)?\/(\d+)/)?.[1];
    if(id) return {nombre:'Vimeo',tipo:'iframe',src:'https://player.vimeo.com/video/'+id};
  }
  if (host === 'tiktok.com') {
    const id = path.match(/\/video\/(\d+)/)?.[1];
    if(id) return {nombre:'TikTok',tipo:'iframe',src:'https://www.tiktok.com/embed/v2/'+id};
  }
  if (host === 'facebook.com' || host === 'fb.watch' || host === 'fb.com') {
    return {nombre:'Facebook',tipo:'iframe',src:'https://www.facebook.com/plugins/video.php?href='+enc(u.href)+'&show_text=false&width=960'};
  }
  if (host === 'instagram.com') {
    const match = path.match(/^\/(?:reel|p|tv)\/([\w-]+)/);
    if(match) return {nombre:'Instagram',tipo:'iframe',src:'https://www.instagram.com'+path.replace(/\/?$/, '/')+'embed/'};
  }
  if(host === 'dailymotion.com' || host === 'dai.ly') {
    const id = host === 'dai.ly' ? path.split('/')[1] : path.match(/\/video\/([\w]+)/)?.[1];
    if(id && /^[\w]+$/.test(id)) return {nombre:'Dailymotion',tipo:'iframe',src:'https://www.dailymotion.com/embed/video/'+id};
  }
  if(/\.mp4$/i.test(path)) return {nombre:'Video MP4',tipo:'video',src:u.href};
  // Plataformas que bloquean incrustaciones: ofrecer enlace sin intentar un iframe arbitrario.
  return {nombre:host,tipo:'externo',src:u.href};
}
function cerrarVideo() {
  videoteca.pantalla.replaceChildren(); // También detiene el audio del video anterior.
  videoteca.visor.hidden=true;
}
function abrirVideo(item) {
  cerrarVideo();
  videoteca.titulo.textContent=item.titulo;
  videoteca.abrir.href=item.url;
  videoteca.visor.hidden=false;
  const info=identificarVideo(item.url);
  if (info && info.tipo==='iframe') {
    const frame=document.createElement('iframe');
    frame.title=item.titulo;
    frame.src=info.src;
    frame.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen=true;
    frame.referrerPolicy='strict-origin-when-cross-origin';
    videoteca.pantalla.append(frame);
  } else if(info && info.tipo==='video') {
    const video=document.createElement('video');video.controls=true;video.playsInline=true;video.src=info.src;
    videoteca.pantalla.append(video);
  } else {
    const mensaje=document.createElement('p');mensaje.textContent='Este video se abre directamente en su plataforma. Usa el enlace inferior.';
    mensaje.style.padding='24px';videoteca.pantalla.append(mensaje);
  }
  videoteca.visor.scrollIntoView({behavior:'smooth',block:'start'});
}
function pintarVideos() {
  cerrarVideo();
  videoteca.grilla.replaceChildren();
  const texto=videoteca.buscar.value.trim().toLocaleLowerCase('es');
  const cat=videoteca.categoria.value;
  const lista=videoteca.items.filter(v=>(!cat||v.categoria===cat)&&(!texto||(v.titulo+' '+v.descripcion+' '+v.categoria).toLocaleLowerCase('es').includes(texto)));
  videoteca.vacio.hidden=lista.length>0;
  videoteca.vacio.textContent=videoteca.items.length ? 'No encontramos videos con esos filtros.' : 'Próximamente: nuevos videos de COYOTV.';
  for (const item of lista) {
    const card=document.createElement('button');card.type='button';card.className='videoteca-tarjeta';
    const mini=document.createElement('div');mini.className='videoteca-miniatura';
    const play=document.createElement('span');play.className='videoteca-play';play.textContent='▶';play.setAttribute('aria-hidden','true');
    const origen=document.createElement('span');origen.className='videoteca-plataforma';origen.textContent=identificarVideo(item.url)?.nombre||'VIDEO';
    mini.append(play,origen);
    const datos=document.createElement('div');datos.className='videoteca-datos';
    const titulo=document.createElement('strong');titulo.textContent=item.titulo;
    const categoria=document.createElement('small');categoria.textContent=item.categoria+(item.descripcion?' · '+item.descripcion:'');
    datos.append(titulo,categoria);card.append(mini,datos);
    card.setAttribute('aria-label','Reproducir '+item.titulo);
    card.addEventListener('click',()=>abrirVideo(item));
    videoteca.grilla.append(card);
  }
}
async function cargarVideos(){
  try {
    const respuesta=await fetch('videos-coyotv.json',{cache:'no-store'});
    if(!respuesta.ok) throw new Error('HTTP '+respuesta.status);
    const contenido=await respuesta.json();
    if(!Array.isArray(contenido)) throw new Error('El catálogo debe ser un arreglo de videos');
    videoteca.items=contenido.filter(v=>v&&typeof v.titulo==='string'&&typeof v.url==='string'&&identificarVideo(v.url)).map(v=>({
      titulo:v.titulo, url:v.url, descripcion:String(v.descripcion||''), categoria:String(v.categoria||'Videos')
    }));
    for(const c of [...new Set(videoteca.items.map(v=>v.categoria))].sort()){
      const opt=document.createElement('option');opt.value=c;opt.textContent=c;videoteca.categoria.append(opt);
    }
    pintarVideos();
  } catch(error) {
    videoteca.vacio.hidden=false;
    videoteca.vacio.textContent='La videoteca no está disponible todavía. La señal en vivo funciona de manera independiente.';
    console.warn('COYOTV videoteca:',error.message);
  }
}
videoteca.buscar.addEventListener('input',pintarVideos);
videoteca.categoria.addEventListener('change',pintarVideos);
document.getElementById('video-cerrar').addEventListener('click',cerrarVideo);
cargarVideos();
