/* ==================================================================
   Estado global
   ================================================================== */
const $ = id => document.getElementById(id);
const LS_SETTINGS='skymood_settings', LS_STATS='skymood_stats', LS_TODOS='skymood_todos', LS_EVENTS='skymood_events', LS_NOTES='skymood_notes';

let settings = Object.assign({ dark:false, music:true, animations:true, volume:0.6, favCity:'', pomoWork:25, pomoRest:5,
  accentColor:'#FF9EC4', font:'Fredoka', dailyGoalHours:4, favorites:[] }, JSON.parse(localStorage.getItem(LS_SETTINGS) || '{}'));
let stats = Object.assign({ completedPomodoros:0, totalFocusMinutes:0, streak:0, bestStreak:0, lastDate:null, history:{} },
  JSON.parse(localStorage.getItem(LS_STATS) || '{}'));
let todos = JSON.parse(localStorage.getItem(LS_TODOS) || '[]');
let calEvents = JSON.parse(localStorage.getItem(LS_EVENTS) || '{}');

function saveSettings(){ localStorage.setItem(LS_SETTINGS, JSON.stringify(settings)); }
function saveStats(){ localStorage.setItem(LS_STATS, JSON.stringify(stats)); }
function saveTodos(){ localStorage.setItem(LS_TODOS, JSON.stringify(todos)); }
function saveEvents(){ localStorage.setItem(LS_EVENTS, JSON.stringify(calEvents)); }
function todayKey(){ return new Date().toISOString().slice(0,10); }

function applyTheme(){
  document.body.classList.toggle('dark', settings.dark);
  document.documentElement.style.setProperty('--accent', settings.accentColor);
  document.documentElement.style.setProperty('--font-head', `'${settings.font}', sans-serif`);
  $('opt-dark').checked = settings.dark;
}

/* ==================================================================
   Sub-tabs (timer / pomodoro / cronómetro)
   ================================================================== */
document.querySelectorAll('.subtab').forEach(t=>{
  t.addEventListener('click', ()=>{
    document.querySelectorAll('.subtab').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.subpanel').forEach(x=>x.classList.remove('active'));
    t.classList.add('active'); $('sub-'+t.dataset.sub).classList.add('active');
  });
});

/* ==================================================================
   Ajustes / modal
   ================================================================== */
$('settings-btn').addEventListener('click', ()=>{
  $('opt-dark').checked = settings.dark; $('opt-music').checked = settings.music; $('opt-anim').checked = settings.animations;
  $('opt-volume').value = settings.volume; $('opt-city').value = settings.favCity;
  $('opt-pomo-work').value = settings.pomoWork; $('opt-pomo-rest').value = settings.pomoRest;
  $('opt-color').value = settings.accentColor; $('opt-font').value = settings.font; $('opt-goal').value = settings.dailyGoalHours;
  $('overlay').classList.add('show');
});
$('close-settings').addEventListener('click', ()=> $('overlay').classList.remove('show'));
$('overlay').addEventListener('click', e=>{ if(e.target.id==='overlay') $('overlay').classList.remove('show'); });
$('save-settings').addEventListener('click', ()=>{
  settings.dark = $('opt-dark').checked; settings.music = $('opt-music').checked; settings.animations = $('opt-anim').checked;
  settings.volume = parseFloat($('opt-volume').value); settings.favCity = $('opt-city').value.trim();
  settings.pomoWork = parseInt($('opt-pomo-work').value) || 25; settings.pomoRest = parseInt($('opt-pomo-rest').value) || 5;
  settings.accentColor = $('opt-color').value; settings.font = $('opt-font').value;
  settings.dailyGoalHours = parseInt($('opt-goal').value) || 4;
  saveSettings(); applyTheme();
  $('volume').value = settings.volume; audio.volume = settings.volume;
  if(!settings.music) pauseAll();
  resetPomodoroToPreset(settings.pomoWork, settings.pomoRest, true);
  renderGoal();
  $('overlay').classList.remove('show');
});
$('fullscreen-btn').addEventListener('click', ()=>{
  if(!document.fullscreenElement) document.documentElement.requestFullscreen().catch(()=>{});
  else document.exitFullscreen();
});

/* export / import */
$('export-data').addEventListener('click', ()=>{
  const data = { settings, stats, todos, calEvents, notes: localStorage.getItem(LS_NOTES)||'' };
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'skymood-datos.json'; a.click();
});
$('import-data-btn').addEventListener('click', ()=> $('import-file').click());
$('import-file').addEventListener('change', e=>{
  const file = e.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const data = JSON.parse(reader.result);
      if(data.settings) localStorage.setItem(LS_SETTINGS, JSON.stringify(data.settings));
      if(data.stats) localStorage.setItem(LS_STATS, JSON.stringify(data.stats));
      if(data.todos) localStorage.setItem(LS_TODOS, JSON.stringify(data.todos));
      if(data.calEvents) localStorage.setItem(LS_EVENTS, JSON.stringify(data.calEvents));
      if(data.notes) localStorage.setItem(LS_NOTES, data.notes);
      location.reload();
    }catch(err){ $('status').textContent = 'Archivo de importación no válido 😕'; }
  };
  reader.readAsText(file);
});

/* compartir estadísticas */
$('share-btn').addEventListener('click', ()=>{
  const resumen = `🍅 SkyMood — mis stats\nPomodoros hoy: ${stats.completedPomodoros}\nConcentración total: ${stats.totalFocusMinutes} min\nRacha actual: ${stats.streak} días\nMejor racha: ${stats.bestStreak} días`;
  if(navigator.clipboard) navigator.clipboard.writeText(resumen).then(()=>{ $('status').textContent = 'Estadísticas copiadas al portapapeles 📋'; }).catch(()=> alert(resumen));
  else alert(resumen);
});

/* ==================================================================
   Clima — perfiles visuales
   ================================================================== */
function profileFor(code, isDay){
  if(code === 0) return { key:'clear', label:'Cielo despejado', mascot: isDay ? '☀️' : '🌙', sound:'ocean',
    day:{bg1:'#FFE9B0', bg2:'#FFD3A3', bg3:'#FFF3D6', orb:'#FFE066'}, night:{bg1:'#2b2350', bg2:'#3a2f66', bg3:'#191536', orb:'#e8e8f5'} };
  if([1,2,3].includes(code)) return { key:'clouds', label:'Parcialmente nublado', mascot:'⛅', sound:'wind',
    day:{bg1:'#CFE0EE', bg2:'#E4E9F0', bg3:'#B9D3E6', orb:'#FFE066'}, night:{bg1:'#2c3450', bg2:'#3b4566', bg3:'#1c2136', orb:'#e8e8f5'} };
  if([45,48].includes(code)) return { key:'fog', label:'Niebla', mascot:'🌫️', sound:'forest',
    day:{bg1:'#D8D8D8', bg2:'#E9E9E9', bg3:'#C7C7C7', orb:'#FFE066'}, night:{bg1:'#33363d', bg2:'#41444c', bg3:'#25272d', orb:'#cfcfcf'} };
  if([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code)) return { key:'rain', label:'Lluvia', mascot:'🌧️', sound:'rain',
    day:{bg1:'#9FB8CE', bg2:'#B7C9D8', bg3:'#7E9BB4', orb:'#e4e4e4'}, night:{bg1:'#232c3d', bg2:'#2c3648', bg3:'#161c29', orb:'#cfd6e0'} };
  if([71,73,75,77,85,86].includes(code)) return { key:'snow', label:'Nieve', mascot:'❄️', sound:'wind',
    day:{bg1:'#E4F1FB', bg2:'#CDE7F7', bg3:'#F3FAFF', orb:'#fff'}, night:{bg1:'#28324a', bg2:'#354160', bg3:'#1a2135', orb:'#eef3ff'} };
  if([95,96,99].includes(code)) return { key:'storm', label:'Tormenta', mascot:'⛈️', sound:'rain',
    day:{bg1:'#5b5f78', bg2:'#43465e', bg3:'#71748a', orb:'#dcdce6'}, night:{bg1:'#15151f', bg2:'#20202e', bg3:'#0c0c14', orb:'#c9c9d6'} };
  return { key:'clouds', label:'Variable', mascot:'🌥️', sound:'wind',
    day:{bg1:'#CFE0EE', bg2:'#E4E9F0', bg3:'#B9D3E6', orb:'#FFE066'}, night:{bg1:'#2c3450', bg2:'#3b4566', bg3:'#1c2136', orb:'#e8e8f5'} };
}
function tempMessage(t){
  if(t >= 35) return "🔥 Hace muchísimo calor. Mantente hidratado.";
  if(t >= 20) return "😊 Temperatura perfecta para salir.";
  if(t >= 10) return "🍃 Fresquito, lleva una chaqueta ligera.";
  if(t > 0)   return "🧥 Hace frío, abrígate un poco.";
  return "🧣 Hace muchísimo frío. Abrígate bien.";
}
function aqiLabel(v){ if(v==null) return '--'; if(v<=50) return 'Buena 🙂'; if(v<=100) return 'Aceptable'; if(v<=150) return 'Regular 😐'; return 'Mala 😷'; }
const WEATHER_ICONS = {0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',51:'🌦️',53:'🌦️',55:'🌧️',61:'🌧️',63:'🌧️',65:'🌧️',71:'🌨️',73:'❄️',75:'❄️',80:'🌦️',81:'🌧️',82:'⛈️',95:'⛈️',96:'⛈️',99:'⛈️'};

/* ==================================================================
   Sonidos ambientales (mp3, mezclables) + ruido generado (WebAudio)
   ================================================================== */
const AMBIENT_SOUNDS = {
  rain:{ label:'🌧️ Lluvia', src:'assets/sounds/rain.mp3' },
  forest:{ label:'🌲 Bosque', src:'assets/sounds/forest.mp3' },
  ocean:{ label:'🌊 Mar', src:'assets/sounds/ocean.mp3' },
  wind:{ label:'🍃 Viento', src:'assets/sounds/wind.mp3' },
  birds:{ label:'🐦 Pájaros', src:'assets/sounds/birds.mp3' },
  fireplace:{ label:'🔥 Chimenea', src:'assets/sounds/fireplace.mp3' },
  river:{ label:'🏞️ Río', src:'assets/sounds/river.mp3' },
  lofi:{ label:'🎧 Lo-Fi', src:'assets/sounds/lofi.mp3' },
  cafe:{ label:'☕ Café', src:'assets/sounds/cafe.mp3' },
  library:{ label:'📚 Biblioteca', src:'assets/sounds/library.mp3' }
};
const NOISE_TYPES = { white:{label:'⚪ Ruido blanco'}, pink:{label:'🌸 Ruido rosa'}, brown:{label:'🟤 Ruido marrón'} };

const ambientPlayers = {};
function makePlayer(key){
  if(ambientPlayers[key]) return ambientPlayers[key];
  const p = new Audio(AMBIENT_SOUNDS[key].src); p.loop = true; p.preload = 'auto'; p.volume = settings.volume;
  ambientPlayers[key] = p; return p;
}
function buildSoundButtons(){
  const wrap = $('sound-tracks'); wrap.innerHTML = '';
  Object.entries(AMBIENT_SOUNDS).forEach(([key,val])=>{
    const b = document.createElement('button'); b.className = 'sound-btn'; b.textContent = val.label; b.dataset.key = key;
    b.addEventListener('click', ()=> togglePlayer(key, b)); wrap.appendChild(b);
  });
  const nwrap = $('noise-tracks'); nwrap.innerHTML = '';
  Object.entries(NOISE_TYPES).forEach(([key,val])=>{
    const b = document.createElement('button'); b.className = 'sound-btn'; b.textContent = val.label; b.dataset.key = key;
    b.addEventListener('click', ()=> toggleNoise(key, b)); nwrap.appendChild(b);
  });
}
function togglePlayer(key, btn){
  if(!settings.music){ $('status').textContent = 'Activa la música en Ajustes para reproducir sonidos.'; return; }
  const p = makePlayer(key);
  if(p.paused){ p.play().then(()=>{ btn.classList.add('active'); updateAudioToggleIcon(); }).catch(()=>{ $('status').textContent = 'Toca la página para permitir reproducción automática.'; }); }
  else { p.pause(); btn.classList.remove('active'); updateAudioToggleIcon(); }
}
function playTrack(key){
  if(!settings.music) return;
  const btn = document.querySelector(`.sound-btn[data-key="${key}"]`);
  if(btn && !btn.classList.contains('active')) togglePlayer(key, btn);
}

let audioCtx = null;
function ensureCtx(){ if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)(); return audioCtx; }
function createNoiseBuffer(ctx, type){
  const bufferSize = 2*ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  if(type==='white'){ for(let i=0;i<bufferSize;i++) data[i]=Math.random()*2-1; }
  else if(type==='pink'){
    let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
    for(let i=0;i<bufferSize;i++){ const w=Math.random()*2-1;
      b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759; b2=0.96900*b2+w*0.1538520;
      b3=0.86650*b3+w*0.3104856; b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980;
      data[i]=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.11; b6=w*0.115926; }
  } else { let last=0; for(let i=0;i<bufferSize;i++){ const w=Math.random()*2-1; const val=(last+0.02*w)/1.02; data[i]=val*3.5; last=val; } }
  return buffer;
}
const noiseNodes = {};
function toggleNoise(key, btn){
  if(!settings.music){ $('status').textContent = 'Activa la música en Ajustes para reproducir sonidos.'; return; }
  const ctx = ensureCtx();
  if(noiseNodes[key] && noiseNodes[key].playing){
    noiseNodes[key].source.stop(); noiseNodes[key].playing = false; btn.classList.remove('active'); updateAudioToggleIcon(); return;
  }
  const buffer = createNoiseBuffer(ctx, key);
  const source = ctx.createBufferSource(); source.buffer = buffer; source.loop = true;
  const gain = ctx.createGain(); gain.gain.value = settings.volume;
  source.connect(gain); gain.connect(ctx.destination); source.start();
  noiseNodes[key] = { source, gain, playing:true };
  btn.classList.add('active'); updateAudioToggleIcon();
}
function updateAudioToggleIcon(){
  const b = $('audio-toggle'); if(!b) return;
  const anyPlaying = Object.values(ambientPlayers).some(p=>p && !p.paused) || Object.values(noiseNodes).some(n=>n && n.playing);
  b.querySelector('i').className = anyPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play';
}
function pauseAll(){
  Object.values(ambientPlayers).forEach(p=>{ try{ p.pause(); }catch(e){} });
  Object.entries(noiseNodes).forEach(([k,n])=>{ if(n.playing){ try{ n.source.stop(); }catch(e){} n.playing=false; } });
  document.querySelectorAll('.sound-btn').forEach(b=>b.classList.remove('active'));
  updateAudioToggleIcon();
}
function playActiveButtons(){
  document.querySelectorAll('#sound-tracks .sound-btn.active').forEach(btn=>{ makePlayer(btn.dataset.key).play().catch(()=>{}); });
  document.querySelectorAll('#noise-tracks .sound-btn.active').forEach(btn=> toggleNoise(btn.dataset.key, btn) ); // reactivate if needed
  updateAudioToggleIcon();
}
$('audio-toggle').addEventListener('click', ()=>{
  const anyPlaying = Object.values(ambientPlayers).some(p=>p && !p.paused) || Object.values(noiseNodes).some(n=>n && n.playing);
  if(anyPlaying) pauseAll();
  else {
    const anyActive = document.querySelectorAll('.sound-btn.active').length > 0;
    if(anyActive) playActiveButtons();
    else { const firstBtn = document.querySelector('#sound-tracks .sound-btn'); if(firstBtn) togglePlayer(firstBtn.dataset.key, firstBtn); }
  }
});
const audio = $('ambient-audio'); audio.volume = settings.volume;
$('volume').addEventListener('input', e=>{
  const v = parseFloat(e.target.value); settings.volume = v; saveSettings();
  Object.values(ambientPlayers).forEach(p=>{ if(p) p.volume = v; });
  Object.values(noiseNodes).forEach(n=>{ if(n.gain) n.gain.gain.value = v; });
});

/* ==================================================================
   Fondo animado / partículas
   ================================================================== */
const sky = $('sky'), celestial = $('celestial');
let particlesInterval = null, lightningInterval = null, leavesInterval = null;
function clearParticles(){
  if(particlesInterval) clearInterval(particlesInterval);
  if(leavesInterval) clearInterval(leavesInterval);
  sky.querySelectorAll('.drop,.flake,.cloud-bg,.star,.leaf').forEach(el=>el.remove());
}
function applyVisuals(profile, isDay){
  const p = isDay ? profile.day : profile.night;
  const root = document.documentElement.style;
  root.setProperty('--bg1', p.bg1); root.setProperty('--bg2', p.bg2); root.setProperty('--bg3', p.bg3); root.setProperty('--orb', p.orb);
  celestial.classList.toggle('moon', !isDay);
  clearParticles();
  if(lightningInterval){ clearInterval(lightningInterval); lightningInterval=null; }
  if(!settings.animations) return;

  if(!isDay){
    for(let i=0;i<36;i++){
      const s = document.createElement('div'); s.className='star';
      s.style.left = Math.random()*100+'%'; s.style.top = Math.random()*55+'%'; s.style.opacity = Math.random()*0.9+0.1;
      sky.appendChild(s);
    }
  }
  if(profile.key === 'clouds' || profile.key === 'storm'){
    for(let i=0;i<4;i++){
      const c = document.createElement('div'); c.className='cloud-bg';
      const w = 100+Math.random()*80, h = w*0.4;
      c.style.width=w+'px'; c.style.height=h+'px'; c.style.top = (10+Math.random()*20)+'%'; c.style.left = '-150px'; c.style.opacity = .55;
      c.style.animation = `driftCloud ${25+Math.random()*20}s linear ${i*4}s infinite`; sky.appendChild(c);
    }
  }
  if(profile.key === 'rain' || profile.key === 'storm'){
    particlesInterval = setInterval(()=>{
      const d = document.createElement('div'); d.className='drop';
      d.style.left = Math.random()*100+'%'; d.style.opacity = .5+Math.random()*.4;
      d.style.animation = `fallDrop ${.6+Math.random()*.4}s linear forwards`;
      sky.appendChild(d); setTimeout(()=>d.remove(), 1200);
    }, 60);
  }
  if(profile.key === 'snow'){
    particlesInterval = setInterval(()=>{
      const f = document.createElement('div'); f.className='flake'; f.textContent='❄';
      f.style.left = Math.random()*100+'%'; f.style.opacity = .6+Math.random()*.4;
      f.style.animation = `fallFlake ${3+Math.random()*3}s linear forwards`;
      sky.appendChild(f); setTimeout(()=>f.remove(), 6500);
    }, 200);
  }
  if(profile.key === 'storm'){
    lightningInterval = setInterval(()=>{
      $('lightning').style.transition = 'none'; $('lightning').style.opacity = .8;
      setTimeout(()=>{ $('lightning').style.transition='opacity .4s ease'; $('lightning').style.opacity = 0; }, 90);
    }, 3500 + Math.random()*3000);
  }
  const month = new Date().getMonth(); // 8=sep,9=oct,10=nov
  if([8,9,10].includes(month) && (profile.key==='clear' || profile.key==='clouds')){
    const leafEmojis = ['🍂','🍁'];
    leavesInterval = setInterval(()=>{
      const l = document.createElement('div'); l.className='leaf'; l.textContent = leafEmojis[Math.floor(Math.random()*2)];
      l.style.left = Math.random()*100+'%'; l.style.opacity = .6+Math.random()*.4;
      l.style.animation = `fallFlake ${4+Math.random()*3}s linear forwards`;
      sky.appendChild(l); setTimeout(()=>l.remove(), 8000);
    }, 500);
  }
}
const styleTag = document.createElement('style');
styleTag.textContent = `
@keyframes fallDrop{ from{transform:translateY(0);} to{transform:translateY(110vh);} }
@keyframes fallFlake{ from{transform:translateY(0) translateX(0) rotate(0);} to{transform:translateY(110vh) translateX(30px) rotate(180deg);} }
@keyframes driftCloud{ from{transform:translateX(0);} to{transform:translateX(120vw);} }
`;
document.head.appendChild(styleTag);

/* ==================================================================
   Open-Meteo
   ================================================================== */
async function geocodeCity(name){
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=es`);
  const data = await res.json();
  if(!data.results || !data.results.length) throw new Error('Ciudad no encontrada');
  const r = data.results[0];
  return { name:r.name, country:r.country, region:r.admin1, latitude:r.latitude, longitude:r.longitude };
}
/* Geocodificación inversa (coordenadas -> ciudad/región/país). Gratuita, sin clave. */
async function reverseGeocode(lat, lon){
  try{
    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=es`);
    const data = await res.json();
    return {
      name: data.city || data.locality || data.localityInfo?.administrative?.[0]?.name || 'Tu ubicación',
      region: data.principalSubdivision || '', country: data.countryName || '',
      latitude:lat, longitude:lon
    };
  }catch(e){ return { name:'Tu ubicación', region:'', country:'', latitude:lat, longitude:lon }; }
}
/* Foto del lugar vía Wikipedia REST API (gratuita, sin clave; source.unsplash.com fue descontinuada por Unsplash en 2024) */
async function loadCityPhoto(name){
  const photo = $('city-photo'); photo.classList.remove('show');
  try{
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`);
    if(!res.ok) throw new Error('sin resumen');
    const data = await res.json();
    const src = data.originalimage?.source || data.thumbnail?.source;
    if(!src) throw new Error('sin imagen');
    photo.onload = ()=> photo.classList.add('show');
    photo.onerror = ()=> photo.classList.remove('show');
    photo.src = src;
  }catch(e){ /* sin foto disponible: el widget simplemente se oculta */ }
}
/* Fase lunar calculada localmente (algoritmo de ciclo sinódico, no necesita API) */
function moonPhase(date = new Date()){
  const synodic = 29.53058867;
  const knownNewMoon = Date.UTC(2000,0,6,18,14);
  const days = (date.getTime() - knownNewMoon) / 86400000;
  const phase = ((days % synodic) + synodic) % synodic;
  const idx = Math.floor((phase / synodic) * 8 + 0.5) % 8;
  const phases = [
    {emoji:'🌑', label:'Luna nueva'}, {emoji:'🌒', label:'Creciente'}, {emoji:'🌓', label:'Cuarto creciente'}, {emoji:'🌔', label:'Gibosa creciente'},
    {emoji:'🌕', label:'Luna llena'}, {emoji:'🌖', label:'Gibosa menguante'}, {emoji:'🌗', label:'Cuarto menguante'}, {emoji:'🌘', label:'Menguante'}
  ];
  return phases[idx];
}
async function getWeather(lat, lon){
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day,surface_pressure&hourly=temperature_2m,weather_code,precipitation_probability,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&forecast_days=7&timezone=auto`);
  return res.json();
}
async function getAirQuality(lat, lon){
  try{ const res = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`);
    const data = await res.json(); return data?.current?.us_aqi ?? null; }catch(e){ return null; }
}
let clockTimer = null;
function startLocalClock(isoTime){
  if(clockTimer) clearInterval(clockTimer);
  let t = new Date(isoTime);
  const render = ()=>{ $('local-time').textContent = t.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}); };
  render(); clockTimer = setInterval(()=>{ t = new Date(t.getTime()+1000); render(); }, 1000);
}
function findHourIndex(hourlyTimes, currentIso){
  const curHour = currentIso.slice(0,13);
  const idx = hourlyTimes.findIndex(t=>t.slice(0,13)===curHour);
  return idx === -1 ? 0 : idx;
}

let lastPlace = null;

async function renderWeather(place, weather, aqi){
  lastPlace = place;
  const cur = weather.current; const isDay = cur.is_day === 1; const profile = profileFor(cur.weather_code, isDay);

  $('city-name').textContent = place.name;
  $('temp').textContent = `${Math.round(cur.temperature_2m)}°C`;
  $('desc').textContent = `${profile.label} ${profile.mascot}`;
  $('mascot').textContent = profile.mascot;
  $('msg').textContent = tempMessage(cur.temperature_2m);
  $('feels').textContent = `${Math.round(cur.apparent_temperature)}°C`;
  $('humidity').textContent = `${cur.relative_humidity_2m}%`;
  $('wind').textContent = `${Math.round(cur.wind_speed_10m)} km/h`;
  $('pressure').textContent = `${Math.round(cur.surface_pressure)} hPa`;
  $('uv').textContent = weather.daily.uv_index_max?.[0] != null ? weather.daily.uv_index_max[0].toFixed(1) : '--';
  $('rainprob').textContent = `${weather.daily.precipitation_probability_max?.[0] ?? '--'}%`;
  $('aqi').textContent = aqiLabel(aqi);
  $('sunrise').textContent = weather.daily.sunrise?.[0] ? new Date(weather.daily.sunrise[0]).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}) : '--:--';
  $('sunset').textContent = weather.daily.sunset?.[0] ? new Date(weather.daily.sunset[0]).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}) : '--:--';
  $('moon-phase').textContent = moonPhase().emoji;
  $('location-sub').textContent = [place.region, place.country].filter(Boolean).join(', ');
  startLocalClock(cur.time);

  const hIdx = findHourIndex(weather.hourly.time, cur.time);
  $('visibility').textContent = weather.hourly.visibility?.[hIdx] != null ? `${(weather.hourly.visibility[hIdx]/1000).toFixed(0)} km` : '--';

  const hourlyEl = $('hourly'); hourlyEl.innerHTML = '';
  for(let i=hIdx; i<Math.min(hIdx+8, weather.hourly.time.length); i++){
    const dt = new Date(weather.hourly.time[i]);
    const el = document.createElement('div'); el.className='hitem';
    el.innerHTML = `<div>${dt.toLocaleTimeString('es-ES',{hour:'2-digit'})}h</div>
      <div class="em">${WEATHER_ICONS[weather.hourly.weather_code[i]] || '🌤️'}</div>
      <div>${Math.round(weather.hourly.temperature_2m[i])}°</div>`;
    hourlyEl.appendChild(el);
  }

  const fc = $('forecast'); fc.innerHTML = '';
  weather.daily.time.forEach((d,i)=>{
    if(i===0) return;
    const dt = new Date(d);
    const el = document.createElement('div'); el.className='fday';
    el.innerHTML = `<div>${dt.toLocaleDateString('es-ES',{weekday:'short'})}</div>
      <div class="em">${WEATHER_ICONS[weather.daily.weather_code[i]] || '🌤️'}</div>
      <div>${Math.round(weather.daily.temperature_2m_max[i])}°/${Math.round(weather.daily.temperature_2m_min[i])}°</div>`;
    fc.appendChild(el);
  });

  loadCityPhoto(place.name);

  $('map-frame').dataset.lat = place.latitude; $('map-frame').dataset.lon = place.longitude;
  $('map-frame').style.display = 'none'; $('map-toggle').textContent = '🗺️ Ver mapa';

  renderFavorites();
  $('fav-star').className = settings.favorites.includes(place.name) ? 'fa-solid fa-star' : 'fa-regular fa-star';

  applyVisuals(profile, isDay);
  $('card').style.display = 'block';
  playTrack(profile.sound);
}
async function searchCity(name){
  try{
    $('status').textContent = 'Buscando... ⏳';
    const place = await geocodeCity(name);
    const [weather, aqi] = await Promise.all([ getWeather(place.latitude, place.longitude), getAirQuality(place.latitude, place.longitude) ]);
    await renderWeather(place, weather, aqi);
    $('status').textContent = '';
  }catch(e){ $('status').textContent = 'No se ha encontrado esa ciudad 😕'; $('card').style.display = 'none'; }
}
$('search-btn').addEventListener('click', ()=>{ const v=$('city-input').value.trim(); if(v) searchCity(v); });
$('city-input').addEventListener('keydown', e=>{ if(e.key==='Enter') $('search-btn').click(); });
$('geo-btn').addEventListener('click', ()=>{
  if(!navigator.geolocation){ $('status').textContent='Tu navegador no soporta geolocalización'; return; }
  $('status').textContent = 'Localizando... 📍';
  navigator.geolocation.getCurrentPosition(async pos=>{
    const { latitude, longitude } = pos.coords;
    try{
      const [place, weather, aqi] = await Promise.all([ reverseGeocode(latitude, longitude), getWeather(latitude, longitude), getAirQuality(latitude, longitude) ]);
      await renderWeather(place, weather, aqi);
      $('status').textContent = '';
    }catch(e){ $('status').textContent = 'No se ha podido obtener el tiempo 😕'; }
  }, ()=>{ $('status').textContent = 'No se ha podido acceder a tu ubicación'; });
});

/* favoritos */
function renderFavorites(){
  const wrap = $('fav-row'); wrap.innerHTML = '';
  settings.favorites.forEach(city=>{
    const c = document.createElement('button'); c.className='fav-chip'; c.textContent = '⭐ '+city;
    c.addEventListener('click', ()=> searchCity(city));
    wrap.appendChild(c);
  });
}
$('fav-star').addEventListener('click', ()=>{
  if(!lastPlace) return;
  const idx = settings.favorites.indexOf(lastPlace.name);
  if(idx>-1) settings.favorites.splice(idx,1); else settings.favorites.push(lastPlace.name);
  saveSettings(); renderFavorites();
  $('fav-star').className = settings.favorites.includes(lastPlace.name) ? 'fa-solid fa-star' : 'fa-regular fa-star';
});

/* mapa */
$('map-toggle').addEventListener('click', ()=>{
  const frame = $('map-frame');
  if(frame.style.display === 'none'){
    const lat = frame.dataset.lat, lon = frame.dataset.lon;
    if(lat && lon && !frame.src){
      frame.src = `https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(lon)-0.06}%2C${parseFloat(lat)-0.06}%2C${parseFloat(lon)+0.06}%2C${parseFloat(lat)+0.06}&layer=mapnik&marker=${lat}%2C${lon}`;
    }
    frame.style.display = 'block'; $('map-toggle').textContent = '🗺️ Ocultar mapa';
  } else { frame.style.display = 'none'; $('map-toggle').textContent = '🗺️ Ver mapa'; }
});

/* ==================================================================
   Temporizador
   ================================================================== */
const RING_LEN = 396;
let timerTotal = 300, timerLeft = 300, timerRunning = false, timerInt = null;
function beep(freq=880, dur=180){
  try{
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.frequency.value = freq; osc.connect(gain); gain.connect(ctx.destination);
    gain.gain.setValueAtTime(.15, ctx.currentTime); osc.start(); osc.stop(ctx.currentTime + dur/1000);
  }catch(e){}
}
function fmt(s){ const m=Math.floor(s/60); const r=s%60; return `${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}`; }
function updateTimerRing(){
  const pct = timerTotal ? timerLeft/timerTotal : 0;
  $('ring-fg-timer').style.strokeDashoffset = RING_LEN * (1-pct);
  $('timer-display').textContent = fmt(timerLeft);
}
function tickTimer(){
  if(timerLeft<=0){ clearInterval(timerInt); timerRunning=false; $('timer-sub').textContent='¡Tiempo!'; beep(660,300); setTimeout(()=>beep(880,300),300); return; }
  timerLeft--; updateTimerRing();
}
$('timer-start').addEventListener('click', ()=>{
  if(timerRunning) return;
  if(timerLeft<=0){ timerTotal = (parseInt($('min-input').value)||0)*60 + (parseInt($('sec-input').value)||0); timerLeft = timerTotal; }
  timerRunning = true; $('timer-sub').textContent='en marcha...'; timerInt = setInterval(tickTimer, 1000);
});
$('timer-pause').addEventListener('click', ()=>{ clearInterval(timerInt); timerRunning=false; $('timer-sub').textContent='pausado'; });
$('timer-reset').addEventListener('click', ()=>{
  clearInterval(timerInt); timerRunning=false;
  timerTotal = (parseInt($('min-input').value)||0)*60 + (parseInt($('sec-input').value)||0);
  timerLeft = timerTotal; $('timer-sub').textContent='listo'; updateTimerRing();
});
$('min-input').addEventListener('change', ()=>{ if(!timerRunning) $('timer-reset').click(); });
$('sec-input').addEventListener('change', ()=>{ if(!timerRunning) $('timer-reset').click(); });
updateTimerRing();

/* ==================================================================
   Cronómetro
   ================================================================== */
let swElapsed = 0, swRunning = false, swInt = null;
function fmtSw(s){ const h=Math.floor(s/3600), m=Math.floor((s%3600)/60), r=s%60;
  return h>0 ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}` : `${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}`; }
function updateSw(){ $('sw-display').textContent = fmtSw(swElapsed); }
$('sw-start').addEventListener('click', ()=>{ if(swRunning) return; swRunning=true; swInt=setInterval(()=>{ swElapsed++; updateSw(); },1000); });
$('sw-pause').addEventListener('click', ()=>{ clearInterval(swInt); swRunning=false; });
$('sw-reset').addEventListener('click', ()=>{ clearInterval(swInt); swRunning=false; swElapsed=0; updateSw(); });

/* ==================================================================
   Pomodoro
   ================================================================== */
const MOTIVATIONS = ["🌱 Cada sesión suma. ¡Tú puedes!", "🍅 Un pomodoro más cerca de tu meta.",
  "✨ Concéntrate en una cosa a la vez.", "🌤️ Respira, y sigue adelante.",
  "🎯 Pequeños pasos, grandes resultados.", "💪 Ya has llegado hasta aquí, sigue así."];
let pomoWork = settings.pomoWork, pomoRest = settings.pomoRest, pomoIsWork = true, pomoCount = 0;
let pomoTotal = pomoWork*60, pomoLeft = pomoTotal, pomoRunning=false, pomoInt=null;
function updatePomoRing(){
  const pct = pomoTotal ? pomoLeft/pomoTotal : 0;
  $('ring-fg-pomo').style.strokeDashoffset = RING_LEN * (1-pct);
  $('pomo-display').textContent = fmt(pomoLeft);
  $('session-label').textContent = (pomoIsWork ? `Trabajo #${pomoCount+1}` : 'Descanso ☕');
}
function resetPomodoroToPreset(work, rest, keepCount){
  pomoWork = work; pomoRest = rest; clearInterval(pomoInt); pomoRunning = false;
  pomoIsWork = true; if(!keepCount) pomoCount = 0;
  pomoTotal = pomoWork*60; pomoLeft = pomoTotal; updatePomoRing();
}
function registerFocusMinutes(min){
  stats.totalFocusMinutes += min;
  const key = todayKey(); stats.history[key] = (stats.history[key]||0) + min;
  const yestKey = new Date(Date.now()-86400000).toISOString().slice(0,10);
  if(stats.lastDate === yestKey) stats.streak += 1; else if(stats.lastDate !== key) stats.streak = 1;
  stats.lastDate = key; stats.bestStreak = Math.max(stats.bestStreak||0, stats.streak);
  saveStats(); renderStats(); renderGoal(); renderLevel(); renderBadges(); renderCalendar();
}
function renderStats(){
  $('stat-pomos').textContent = stats.completedPomodoros;
  $('stat-focus').textContent = `${stats.totalFocusMinutes} min`;
  $('stat-streak').textContent = stats.streak;
  $('stat-best').textContent = stats.bestStreak || 0;

  const now = new Date();
  const dow = (now.getDay()+6)%7;
  const monday = new Date(now); monday.setDate(now.getDate()-dow);
  let weekMin = 0, monthMin = 0;
  Object.entries(stats.history).forEach(([k,v])=>{
    const d = new Date(k+'T00:00:00');
    if(d >= new Date(monday.toDateString())) weekMin += v;
    if(d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear()) monthMin += v;
  });
  $('stat-week').textContent = `${weekMin} min`;
  $('stat-month').textContent = `${monthMin} min`;

  const days = []; const labels=[];
  for(let i=6;i>=0;i--){ const d = new Date(); d.setDate(d.getDate()-i); const k = d.toISOString().slice(0,10);
    days.push(stats.history[k]||0); labels.push(d.toLocaleDateString('es-ES',{weekday:'narrow'})); }
  const max = Math.max(...days, 1);
  const chart = $('chart-row'); chart.innerHTML = '';
  days.forEach(v=>{ const bar = document.createElement('div'); bar.className='chart-bar';
    bar.innerHTML = `<i style="height:${Math.max(4,(v/max)*100)}%"></i>`; chart.appendChild(bar); });
  const lbl = $('chart-labels'); lbl.innerHTML = '';
  labels.forEach(l=>{ const s=document.createElement('span'); s.textContent=l; lbl.appendChild(s); });
}
function renderGoal(){
  const todayMin = stats.history[todayKey()]||0;
  const goalMin = settings.dailyGoalHours*60;
  const pct = Math.min(100, Math.round((todayMin/goalMin)*100));
  $('goal-bar').style.width = pct+'%';
  $('goal-text').textContent = `${(todayMin/60).toFixed(1)} / ${settings.dailyGoalHours} h`;
  $('goal-pct').textContent = pct+'%';
}
function renderLevel(){
  const xp = stats.totalFocusMinutes + stats.completedPomodoros*5;
  const level = Math.floor(xp/100)+1;
  const within = xp%100;
  $('level-num').textContent = level;
  $('xp-bar').style.width = within+'%';
  $('xp-text').textContent = `${within} / 100 XP`;
}
const BADGES = [
  { icon:'🥉', label:'1er Pomodoro', check:()=> stats.completedPomodoros>=1 },
  { icon:'🥈', label:'10h estudiadas', check:()=> stats.totalFocusMinutes>=600 },
  { icon:'🥇', label:'50 Pomodoros', check:()=> stats.completedPomodoros>=50 },
  { icon:'🔥', label:'Racha 7 días', check:()=> (stats.bestStreak||0)>=7 }
];
function renderBadges(){
  const wrap = $('badges-grid'); wrap.innerHTML = '';
  BADGES.forEach(b=>{
    const unlocked = b.check();
    const el = document.createElement('div'); el.className = 'badge'+(unlocked?' unlocked':'');
    el.innerHTML = `${b.icon}<span>${b.label}</span>`;
    wrap.appendChild(el);
  });
}
function notify(title, body){
  if('Notification' in window){
    if(Notification.permission === 'granted') new Notification(title,{body});
    else if(Notification.permission !== 'denied') Notification.requestPermission();
  }
}
function tickPomo(){
  if(pomoLeft<=0){
    beep(660,250); setTimeout(()=>beep(990,250),260);
    if(pomoIsWork){
      pomoCount++; stats.completedPomodoros++; registerFocusMinutes(pomoWork);
      notify('¡Pomodoro completado! 🍅', 'Toca descansar un poco ☕'); pomoIsWork = false; pomoTotal = pomoRest*60;
    } else { notify('Descanso terminado 🌤️', 'Hora de volver al trabajo'); pomoIsWork = true; pomoTotal = pomoWork*60; }
    pomoLeft = pomoTotal; $('motivation').textContent = MOTIVATIONS[Math.floor(Math.random()*MOTIVATIONS.length)];
    updatePomoRing(); return;
  }
  pomoLeft--; updatePomoRing();
}
$('pomo-start').addEventListener('click', ()=>{
  if(pomoRunning) return; pomoRunning = true;
  $('motivation').textContent = MOTIVATIONS[Math.floor(Math.random()*MOTIVATIONS.length)];
  pomoInt = setInterval(tickPomo, 1000);
});
$('pomo-pause').addEventListener('click', ()=>{ clearInterval(pomoInt); pomoRunning=false; });
$('pomo-reset').addEventListener('click', ()=> resetPomodoroToPreset(pomoWork, pomoRest, false));
document.querySelectorAll('.preset-btn[data-work]').forEach(b=>{
  b.addEventListener('click', ()=>{
    document.querySelectorAll('.preset-btn').forEach(x=>x.classList.remove('active')); b.classList.add('active');
    resetPomodoroToPreset(parseInt(b.dataset.work), parseInt(b.dataset.rest), false);
  });
});
$('preset-custom').addEventListener('click', ()=>{
  document.querySelectorAll('.preset-btn').forEach(x=>x.classList.remove('active'));
  $('preset-custom').classList.add('active'); $('settings-btn').click();
});

/* ==================================================================
   Calendario (con días estudiados y eventos)
   ================================================================== */
let calDate = new Date();
function renderCalendar(){
  const y = calDate.getFullYear(), m = calDate.getMonth();
  $('cal-label').textContent = calDate.toLocaleDateString('es-ES',{month:'long', year:'numeric'});
  const first = new Date(y,m,1);
  const startOffset = (first.getDay()+6)%7;
  const daysInMonth = new Date(y,m+1,0).getDate();
  const today = new Date();
  const grid = $('cal-grid'); grid.innerHTML = '';
  ['L','M','X','J','V','S','D'].forEach(d=>{ const el=document.createElement('div'); el.className='dow'; el.textContent=d; grid.appendChild(el); });
  for(let i=0;i<startOffset;i++){ const el=document.createElement('div'); el.className='cal-day empty'; grid.appendChild(el); }
  for(let d=1; d<=daysInMonth; d++){
    const dateKey = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const el = document.createElement('div'); el.className='cal-day'; el.textContent = d;
    if(d===today.getDate() && m===today.getMonth() && y===today.getFullYear()) el.classList.add('today');
    if(stats.history[dateKey]) { const dot=document.createElement('div'); dot.className='dot studied'; el.appendChild(dot); }
    if(calEvents[dateKey] && calEvents[dateKey].length) { const dot=document.createElement('div'); dot.className='dot event'; el.appendChild(dot); }
    el.addEventListener('click', ()=>{
      const txt = prompt(`Añadir evento/recordatorio para el ${d}/${m+1}/${y}:`);
      if(txt){ if(!calEvents[dateKey]) calEvents[dateKey]=[]; calEvents[dateKey].push(txt); saveEvents(); renderCalendar(); }
    });
    grid.appendChild(el);
  }
  const evWrap = $('cal-events'); evWrap.innerHTML = '';
  const upcoming = Object.entries(calEvents).filter(([k])=> k >= todayKey()).sort(([a],[b])=> a.localeCompare(b)).slice(0,5);
  if(upcoming.length===0){ evWrap.innerHTML = '<span>Sin eventos próximos</span>'; }
  upcoming.forEach(([k,arr])=>{ arr.forEach(txt=>{ const d=document.createElement('div'); d.textContent = `📌 ${k}: ${txt}`; evWrap.appendChild(d); }); });
}
$('cal-prev').addEventListener('click', ()=>{ calDate.setMonth(calDate.getMonth()-1); renderCalendar(); });
$('cal-next').addEventListener('click', ()=>{ calDate.setMonth(calDate.getMonth()+1); renderCalendar(); });

/* ==================================================================
   Lista de tareas
   ================================================================== */
function renderTodos(){
  const list = $('todo-list'); list.innerHTML = '';
  $('todo-empty').style.display = todos.length ? 'none' : 'block';
  todos.forEach(t=>{
    const li = document.createElement('li'); if(t.done) li.classList.add('done');
    const check = document.createElement('div'); check.className='check';
    check.addEventListener('click', ()=>{ t.done = !t.done; saveTodos(); renderTodos(); });
    const span = document.createElement('span'); span.textContent = t.text;
    const del = document.createElement('i'); del.className='fa-solid fa-xmark del';
    del.addEventListener('click', ()=>{ todos = todos.filter(x=>x.id!==t.id); saveTodos(); renderTodos(); });
    li.appendChild(check); li.appendChild(span); li.appendChild(del); list.appendChild(li);
  });
}
function addTodo(){
  const v = $('todo-input').value.trim(); if(!v) return;
  todos.push({ id: Date.now(), text: v, done:false }); saveTodos(); renderTodos(); $('todo-input').value='';
}
$('todo-add').addEventListener('click', addTodo);
$('todo-input').addEventListener('keydown', e=>{ if(e.key==='Enter') addTodo(); });

/* ==================================================================
   Notas
   ================================================================== */
$('notes-area').value = localStorage.getItem(LS_NOTES) || '';
$('notes-area').addEventListener('input', e=>{ localStorage.setItem(LS_NOTES, e.target.value); });
$('notes-export').addEventListener('click', ()=>{
  const blob = new Blob([$('notes-area').value], {type:'text/plain'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'skymood-notas.txt'; a.click();
});

/* ==================================================================
   Frases motivadoras
   ================================================================== */
const QUOTES = [
  "Little progress is still progress.", "Stay focused, stay calm.", "One task at a time.",
  "Hazlo con calma, pero hazlo.", "Cada pomodoro cuenta.", "El progreso no siempre se ve, pero se acumula.",
  "Respira. Enfócate. Continúa.", "Pequeños pasos también llegan lejos."
];
function newQuote(){ $('quote-box').textContent = '“' + QUOTES[Math.floor(Math.random()*QUOTES.length)] + '”'; }
$('quote-refresh').addEventListener('click', newQuote);

/* ==================================================================
   Atajos de teclado
   ================================================================== */
document.addEventListener('keydown', e=>{
  if(['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return;
  if(e.code === 'Space'){
    e.preventDefault();
    const activeSub = document.querySelector('.subpanel.active').id;
    if(activeSub==='sub-timer') timerRunning ? $('timer-pause').click() : $('timer-start').click();
    else if(activeSub==='sub-pomodoro') pomoRunning ? $('pomo-pause').click() : $('pomo-start').click();
    else if(activeSub==='sub-stopwatch') swRunning ? $('sw-pause').click() : $('sw-start').click();
  }
  if(e.key.toLowerCase()==='r'){
    const activeSub = document.querySelector('.subpanel.active').id;
    if(activeSub==='sub-timer') $('timer-reset').click();
    else if(activeSub==='sub-pomodoro') $('pomo-reset').click();
    else if(activeSub==='sub-stopwatch') $('sw-reset').click();
  }
});

/* ==================================================================
   PWA (opcional — requiere manifest.json y sw.js junto a este archivo)
   ================================================================== */
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{ navigator.serviceWorker.register('sw.js').catch(()=>{}); });
}

/* ==================================================================
   NASA APOD — "Descubrimiento del día"
   Usa la clave DEMO_KEY de la NASA (pública, limitada a ~30 peticiones/hora).
   Se guarda en caché por día para no gastar peticiones de más.
   Para uso serio, pide tu propia clave gratis en https://api.nasa.gov y sustituye DEMO_KEY.
   ================================================================== */
const NASA_API_KEY = 'DEMO_KEY';
const LS_APOD = 'skymood_apod_cache';
async function loadApod(){
  const cache = JSON.parse(localStorage.getItem(LS_APOD) || 'null');
  if(cache && cache.date === todayKey()){ renderApod(cache.data); return; }
  try{
    const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`);
    if(!res.ok) throw new Error('APOD no disponible');
    const data = await res.json();
    localStorage.setItem(LS_APOD, JSON.stringify({ date: todayKey(), data }));
    renderApod(data);
  }catch(e){
    $('apod-loading').textContent = 'No se pudo cargar la imagen de hoy (límite de peticiones de la NASA). Vuelve a intentarlo más tarde.';
  }
}
function renderApod(data){
  $('apod-loading').style.display = 'none';
  if(data.media_type === 'image'){
    const img = $('apod-img'); img.src = data.url; img.alt = data.title; img.style.display = 'block';
  }
  $('apod-title').textContent = data.title || '';
  const text = data.explanation || '';
  $('apod-text').textContent = text.length > 220 ? text.slice(0,220) + '…' : text;
}

/* ==================================================================
   ISS Tracker — posición en vivo de la Estación Espacial Internacional
   API https://wheretheiss.at (https, sin clave, más fiable que open-notify)
   + geocodificación inversa para mostrar sobre qué país/océano está pasando
   ================================================================== */
async function loadIss(){
  $('iss-location').textContent = 'Buscando la estación...';
  try{
    const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
    const data = await res.json();
    $('iss-coords').textContent = `${data.latitude.toFixed(2)}°, ${data.longitude.toFixed(2)}°`;
    const place = await reverseGeocode(data.latitude, data.longitude);
    const label = place.country ? `Sobrevolando ${place.name !== 'Tu ubicación' ? place.name+', ' : ''}${place.country}` : 'Sobrevolando el océano 🌊';
    $('iss-location').textContent = label;
  }catch(e){ $('iss-location').textContent = 'No se pudo localizar la ISS ahora mismo.'; }
}
$('iss-refresh').addEventListener('click', loadIss);

/* ==================================================================
   Inicio
   ================================================================== */
buildSoundButtons();
applyTheme();
renderStats();
renderGoal();
renderLevel();
renderBadges();
updatePomoRing();
updateSw();
renderCalendar();
renderTodos();
renderFavorites();
newQuote();
searchCity(settings.favCity || 'Barcelona');
loadApod();
loadIss();