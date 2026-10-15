/*
  ============================================================
  Rebel with Heart · Widgets
  © 2026 Andrea Wotzka, Nürnberg, Deutschland
  rebelwithheart.github.io/widgets · rebelwithheart@outlook.com

  Dieser Code und seine Gestaltung sind urheberrechtlich geschützt.
  Erlaubt ist die Nutzung innerhalb einer bei Rebel with Heart
  erworbenen Vorlage.
  Nicht erlaubt sind Vervielfältigung, Bearbeitung, Weitergabe,
  Veröffentlichung und Weiterverkauf, ganz oder in Teilen, sowie
  die Verwendung in eigenen oder fremden Produkten.

  This code and its design are protected by copyright. Use is
  permitted only within a template purchased from Rebel with Heart.
  Copying, modification, redistribution, publication, resale or use
  in any other product is not permitted.

  Impressum: rebelwithheart.github.io/widgets/impressum.html
  ============================================================
*/


const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const jstr = s => JSON.stringify(String(s));

/* url = Schriftdienst Bunny Fonts (EU, protokolliert nach eigenen Angaben nichts).
   url null = reine Systemschrift, das Widget sendet dann gar keine Anfrage nach außen. */
const FONTS = {
  'Fredoka':{css:"'Fredoka','Trebuchet MS',sans-serif",url:'fredoka:400,500,600,700'},
  'Baloo 2':{css:"'Baloo 2','Trebuchet MS',sans-serif",url:'baloo-2:400,600,800'},
  'Quicksand':{css:"'Quicksand',system-ui,sans-serif",url:'quicksand:400,600,700'},
  'Nunito':{css:"'Nunito',system-ui,sans-serif",url:'nunito:400,700,900'},
  'Patrick Hand':{css:"'Patrick Hand','Comic Sans MS',cursive",url:'patrick-hand'},
  'Gaegu':{css:"'Gaegu','Comic Sans MS',cursive",url:'gaegu:400,700'},
  'Caveat':{css:"'Caveat','Comic Sans MS',cursive",url:'caveat:400,600,700'},
  'System rund':{css:"'Trebuchet MS','Segoe UI',system-ui,sans-serif",url:null},
  'System Handschrift':{css:"'Comic Sans MS','Bradley Hand','Segoe Print',cursive",url:null},
  'System klar':{css:"Verdana,'Segoe UI',system-ui,sans-serif",url:null}
};

const PALETTES = [
  {n:'Rosé',      bg:'#fff0f6', accent:'#e8629a', text:'#4a2b38'},
  {n:'Lavendel',  bg:'#f3effd', accent:'#8b6ce0', text:'#39305a'},
  {n:'Mint',      bg:'#eafaf3', accent:'#36b08c', text:'#1f4a3d'},
  {n:'Pfirsich',  bg:'#fff1e8', accent:'#f08a52', text:'#5a3524'},
  {n:'Himmel',    bg:'#eaf4fd', accent:'#4a9ad4', text:'#243e52'},
  {n:'Butter',    bg:'#fff8e3', accent:'#e0a62c', text:'#5a461b'},
  {n:'Nacht',     bg:'#2b2433', accent:'#ff86b8', text:'#f6ecf2'},
  {n:'Creme',     bg:'#faf6f0', accent:'#b58a6a', text:'#4a3b2f'}
];

const STYLE_FIELDS = [
  {k:'font',t:'select',label:'Schrift',opts:Object.keys(FONTS),def:'Fredoka'},
  {k:'fontnote',t:'note',label:'Die ersten sieben Schriften kommen vom EU-Dienst Bunny Fonts. Die drei Systemschriften senden gar keine Anfrage nach außen.'},
  {k:'bgMode',t:'select',label:'Hintergrund',opts:['Farbe','Verlauf','Transparent','Nur Rahmen'],def:'Verlauf'},
  {k:'colors',t:'colors'},
  {k:'radius',t:'range',label:'Ecken runden',min:0,max:40,def:18,unit:'px'},
  {k:'pad',t:'range',label:'Innenabstand',min:0,max:40,def:10,unit:'px'},
  {k:'scale',t:'range',label:'Inhalt größer oder kleiner',min:70,max:150,def:100,unit:'%'},
  {k:'dash',t:'bool',label:'Gestrichelter Rahmen',def:false},
  {k:'shadow',t:'bool',label:'Weicher Schatten',def:true}
];
const STYLE_DEF = {font:'Fredoka',bgMode:'Verlauf',bg:'#fff0f6',accent:'#e8629a',text:'#4a2b38',radius:18,pad:10,scale:100,dash:false,shadow:true};

/* ---------- Hilfen ---------- */
function hexa(hex,a){const h=hex.replace('#','');const n=parseInt(h.length===3?h.split('').map(c=>c+c).join(''):h,16);
  return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`}
function mix(a,b,t){const p=h=>{const x=h.replace('#','');const n=parseInt(x.length===3?x.split('').map(c=>c+c).join(''):x,16);return [(n>>16)&255,(n>>8)&255,n&255]};
  const [r1,g1,b1]=p(a),[r2,g2,b2]=p(b);const m=(u,v)=>Math.round(u+(v-u)*t);
  return '#'+[m(r1,r2),m(g1,g2),m(b1,b2)].map(v=>v.toString(16).padStart(2,'0')).join('')}
function lum(hex){const x=hex.replace('#','');const n=parseInt(x.length===3?x.split('').map(c=>c+c).join(''):x,16);
  const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};
  return .2126*f((n>>16)&255)+.7152*f((n>>8)&255)+.0722*f(n&255)}
const onAccent = c => lum(c.accent) > .55 ? c.text : '#ffffff';

function shell(cfg,title,bodyHtml,extraCss,js,fitH,fitW){
  const f = FONTS[cfg.font] || FONTS.Fredoka;
  const dh = fitH || 11, dw = fitW || fitH || 11;
  const pad = cfg.pad == null ? 10 : cfg.pad;
  const autofit = `(function(){var S=${(cfg.scale||100)/100},DH=${dh},DW=${dw};
function fit(){var w=document.body.clientWidth||320,h=document.body.clientHeight||220;
 var base=Math.min(h/DH, w/DW)*S;
 document.documentElement.style.fontSize=Math.max(9,Math.min(64,base))+'px'}
fit();addEventListener('resize',fit);
if(window.ResizeObserver){try{new ResizeObserver(fit).observe(document.body)}catch(e){}}})();
`;
  let bg;
  if(cfg.bgMode==='Transparent'||cfg.bgMode==='Nur Rahmen') bg='transparent';
  else if(cfg.bgMode==='Verlauf') bg=`linear-gradient(155deg, ${cfg.bg} 0%, ${mix(cfg.bg,cfg.accent,.35)} 100%)`;
  else bg=cfg.bg;
  const border=(cfg.bgMode==='Nur Rahmen'||cfg.dash)?`${cfg.dash?'2.5px dashed':'2.5px solid'} ${cfg.accent}`:'none';
  const shadow=cfg.shadow&&cfg.bgMode!=='Transparent'?`box-shadow:0 6px 20px ${hexa(cfg.accent,.22)};`:'';
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
${f.url ? `<link rel="preconnect" href="https://fonts.bunny.net">
<link rel="stylesheet" href="https://fonts.bunny.net/css?family=${f.url}&display=swap">` : '<!-- Systemschrift, keine externen Dateien -->'}
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{height:100%;margin:0;overflow:hidden}
html{font-size:16px}
body{display:flex;align-items:stretch;padding:0;
  font-family:${f.css};font-size:1rem;color:${cfg.text};background:transparent}
.card{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:.28em;text-align:center;padding:${pad}px;border-radius:${cfg.radius}px;background:${bg};border:${border};${shadow}
  overflow:hidden}
.ttl{font-size:.8em;font-weight:600;letter-spacing:.07em;text-transform:uppercase;opacity:.6;margin:0;flex:0 0 auto;line-height:1.15}
button,input,textarea,select{font-family:inherit;font-size:inherit;color:inherit}
button{cursor:pointer}
:focus-visible{outline:2px solid ${cfg.accent};outline-offset:2px}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
${extraCss}
</style>
</head>
<body>
<div class="card">
${bodyHtml}
</div>
<script>
${autofit}${js}
<\/script>
</body>
</html>`;
}

const store = `function ld(k,d){try{var v=localStorage.getItem(k);return v===null?d:JSON.parse(v)}catch(e){return d}}
function sv(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function today(){var d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()}`;
const beep = `function beep(){try{var a=new (window.AudioContext||window.webkitAudioContext)(),o=a.createOscillator(),g=a.createGain();
o.connect(g);g.connect(a.destination);o.type='sine';o.frequency.value=880;g.gain.setValueAtTime(.001,a.currentTime);
g.gain.exponentialRampToValueAtTime(.25,a.currentTime+.02);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+.6);
o.start();o.stop(a.currentTime+.62)}catch(e){}}`;
const WTAG = `var WT=['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
var WK=['So','Mo','Di','Mi','Do','Fr','Sa'];
var MO=['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
function p2(n){return n<10?'0'+n:''+n}`;

/* Analoges Zifferblatt als SVG */
function clockSvg(c){
  const ticks = Array.from({length:12},(_,i)=>{
    const a = i*30*Math.PI/180, r1 = 41, r2 = i%3===0 ? 33 : 37;
    const x1 = 50+Math.sin(a)*r1, y1 = 50-Math.cos(a)*r1, x2 = 50+Math.sin(a)*r2, y2 = 50-Math.cos(a)*r2;
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${hexa(c.text,i%3===0?.75:.3)}" stroke-width="${i%3===0?2.6:1.4}" stroke-linecap="round"/>`;
  }).join('');
  return `<div class="an">
<svg viewBox="0 0 100 100" aria-hidden="true">
  <circle cx="50" cy="50" r="46" fill="${hexa(c.accent,.1)}" stroke="${c.accent}" stroke-width="2.5"/>
  ${ticks}
  <line id="hh" x1="50" y1="50" x2="50" y2="28" stroke="${c.text}" stroke-width="4.2" stroke-linecap="round"/>
  <line id="mi" x1="50" y1="50" x2="50" y2="18" stroke="${c.text}" stroke-width="2.8" stroke-linecap="round"/>
  <line id="se" x1="50" y1="54" x2="50" y2="15" stroke="${c.accent}" stroke-width="1.4" stroke-linecap="round"/>
  <circle cx="50" cy="50" r="3.2" fill="${c.accent}"/>
</svg></div>`;
}
const clockJs = `function hands(){var n=new Date(),s=n.getSeconds(),m=n.getMinutes(),h=n.getHours()%12;
 var set=function(id,deg){var e=document.getElementById(id);if(e)e.setAttribute('transform','rotate('+deg+' 50 50)')};
 set('se',s*6);set('mi',m*6+s*.1);set('hh',h*30+m*.5)}
hands();setInterval(hands,1000);`;

/* ---------- Widgets ---------- */
const WIDGETS = {

uhr:{
  name:'Uhr & Datum', icon:'⏰', folder:'uhr',
  desc:'Uhrzeit und Datum in sechs sehr unterschiedlichen Aufmachungen.',
  variants:[
    {k:'digital', n:'Digital', d:'Große Ziffern, darunter Wochentag und Datum.'},
    {k:'analog', n:'Analog', d:'Echtes Zifferblatt mit laufendem Sekundenzeiger.'},
    {k:'analog_datum', n:'Analog + Datum', d:'Zifferblatt links, Wochentag und Datum rechts daneben.'},
    {k:'kalender', n:'Monatskalender', d:'Ganzer Monat als Raster, heutiger Tag hervorgehoben.'},
    {k:'tag', n:'Nur heute', d:'Riesige Tageszahl im Stil eines Abreißkalenders.'},
    {k:'kacheln', n:'Ziffernkacheln', d:'Jede Ziffer in einem eigenen Kästchen.'}
  ],
  fields:[
    {k:'top',t:'text',label:'Text darüber',def:'Mein kunterbunter Alltag'},
    {k:'h24',t:'bool',label:'24 Stunden Anzeige',def:true},
    {k:'sec',t:'bool',label:'Sekunden zeigen',def:false},
    {k:'emoji',t:'text',label:'Emoji (leer für keins)',def:'🌸'}
  ],
  build(c){
    const oa = onAccent(c), v = c.variant;
    const base = `.em{font-size:1.3em;line-height:1;flex:0 0 auto}
.an{flex:1 1 auto;min-height:0;width:100%;display:block}
.an svg{width:100%;height:100%;display:block}
.clock{font-size:3.2em;font-weight:700;line-height:1;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.dt{font-size:.95em;font-weight:500;opacity:.75;line-height:1.2}`;

    if(v==='analog' || v==='analog_datum'){
      const css = base + (v==='analog_datum' ? `
.card{flex-direction:row;gap:.7em;text-align:left;align-items:center;justify-content:center}
.an{flex:0 0 auto;height:100%;width:auto;aspect-ratio:1;max-width:48%}
.side{display:flex;flex-direction:column;gap:.1em;min-width:0;flex:1}
.side .wd{font-size:1.5em;font-weight:700;line-height:1.05}
.side .dd{font-size:1.05em;opacity:.7;font-variant-numeric:tabular-nums}
.side .tt{font-size:.74em;letter-spacing:.07em;text-transform:uppercase;opacity:.5;line-height:1.2}` : '');
      const html = v==='analog_datum'
        ? `${clockSvg(c)}<div class="side">${c.top?`<div class="tt">${esc(c.top)}</div>`:''}<div class="wd" id="wd">—</div><div class="dd" id="dd"></div>${c.emoji?`<div class="em">${esc(c.emoji)}</div>`:''}</div>`
        : `${c.top?`<p class="ttl">${esc(c.top)}</p>`:''}${clockSvg(c)}`;
      const js = `${WTAG}${clockJs}
var wd=document.getElementById('wd');
if(wd){function dts(){var n=new Date();wd.textContent=WT[n.getDay()];
 document.getElementById('dd').textContent=p2(n.getDate())+'.'+p2(n.getMonth()+1)+'.'+n.getFullYear()}
 dts();setInterval(dts,60000)}`;
      return shell(c, c.top||'Uhr', html, css, js, v==='analog_datum'?7:11, v==='analog_datum'?17:11);
    }

    if(v==='kalender'){
      const css = base + `
.card{gap:.25em;justify-content:stretch}
.mh{display:flex;align-items:baseline;gap:.4em;font-weight:700;font-size:1.1em;flex:0 0 auto;line-height:1.1}
.mh small{font-weight:500;opacity:.6;font-size:.7em}
.cal{display:grid;grid-template-columns:repeat(7,1fr);grid-auto-rows:1fr;gap:.1em;width:100%;flex:1 1 auto;min-height:0;font-variant-numeric:tabular-nums}
.cal b{font-size:.62em;font-weight:700;opacity:.45;display:grid;place-items:center;letter-spacing:.04em}
.cal span{font-size:.78em;display:grid;place-items:center;border-radius:.35em;line-height:1}
.cal span.o{opacity:.2}
.cal span.t{background:${c.accent};color:${oa};font-weight:700}
.cal span.we{opacity:.55}`;
      const html = `${c.top?`<p class="ttl">${esc(c.top)}</p>`:''}
<div class="mh"><span id="mn">Monat</span><small id="tm"></small></div>
<div class="cal" id="cl"></div>`;
      const js = `${WTAG}
function cal(){var n=new Date(),y=n.getFullYear(),m=n.getMonth(),td=n.getDate();
 document.getElementById('mn').textContent=MO[m]+' '+y;
 var tm=document.getElementById('tm');
 if(tm)tm.textContent=p2(n.getHours())+':'+p2(n.getMinutes());
 var first=new Date(y,m,1),off=(first.getDay()+6)%7,dim=new Date(y,m+1,0).getDate();
 var pm=new Date(y,m,0).getDate(),h='';
 ['Mo','Di','Mi','Do','Fr','Sa','So'].forEach(function(d){h+='<b>'+d+'</b>'});
 for(var i=off;i>0;i--)h+='<span class="o">'+(pm-i+1)+'</span>';
 for(var d=1;d<=dim;d++){var we=(new Date(y,m,d).getDay()%6===0);
  h+='<span class="'+(d===td?'t':(we?'we':''))+'">'+d+'</span>'}
 var rest=(7-((off+dim)%7))%7;
 for(var k=1;k<=rest;k++)h+='<span class="o">'+k+'</span>';
 document.getElementById('cl').innerHTML=h}
cal();setInterval(cal,60000);`;
      return shell(c, c.top||'Kalender', html, css, js, 13, 12);
    }

    if(v==='tag'){
      const css = base + `
.card{gap:.12em}
.big{font-size:4.3em;font-weight:700;line-height:.82;font-variant-numeric:tabular-nums}
.wd{font-size:1.2em;font-weight:700;letter-spacing:.04em;line-height:1.1}
.mo{font-size:.85em;opacity:.65;letter-spacing:.12em;text-transform:uppercase;line-height:1.2}
.rule{width:55%;height:2px;background:${hexa(c.accent,.45)};border-radius:2px;flex:0 0 auto}`;
      const html = `${c.top?`<p class="ttl">${esc(c.top)}</p>`:''}
<div class="wd" id="wd">—</div><div class="rule"></div>
<div class="big" id="dd">–</div>
<div class="mo" id="mm"></div>
${c.emoji?`<div class="em">${esc(c.emoji)}</div>`:''}`;
      const js = `${WTAG}
function run(){var n=new Date();
 document.getElementById('wd').textContent=WT[n.getDay()];
 document.getElementById('dd').textContent=n.getDate();
 document.getElementById('mm').textContent=MO[n.getMonth()]+' '+n.getFullYear()}
run();setInterval(run,60000);`;
      return shell(c, c.top||'Heute', html, css, js, 10, 9);
    }

    if(v==='kacheln'){
      const css = base + `
.tiles{display:flex;gap:.18em;align-items:center;justify-content:center;flex:0 0 auto}
.tiles i{font-style:normal;font-size:2.6em;font-weight:700;line-height:1;font-variant-numeric:tabular-nums;
 background:${hexa(c.accent,.16)};border:.06em solid ${hexa(c.accent,.45)};border-radius:.2em;padding:.08em .14em;min-width:.95em;text-align:center}
.tiles u{text-decoration:none;font-size:1.8em;font-weight:700;opacity:.5;padding:0 .03em}`;
      const html = `${c.top?`<p class="ttl">${esc(c.top)}</p>`:''}
<div class="tiles" id="tl"></div>
<div class="dt" id="d"></div>`;
      const js = `${WTAG}
var T=${c.h24?'true':'false'},S=${c.sec?'true':'false'};
function run(){var n=new Date(),h=n.getHours();if(!T){h=h%12;if(h===0)h=12}
 var parts=[p2(h),p2(n.getMinutes())];if(S)parts.push(p2(n.getSeconds()));
 var h2='';parts.forEach(function(x,i){if(i)h2+='<u>:</u>';
  h2+='<i>'+x[0]+'</i><i>'+x[1]+'</i>'});
 document.getElementById('tl').innerHTML=h2;
 document.getElementById('d').textContent=WT[n.getDay()]+', '+p2(n.getDate())+'.'+p2(n.getMonth()+1)+'.'+n.getFullYear()}
run();setInterval(run,1000);`;
      return shell(c, c.top||'Uhr', html, css, js, 9, 14);
    }

    /* digital */
    const html = `${c.top?`<p class="ttl">${esc(c.top)}</p>`:''}
${c.emoji?`<div class="em">${esc(c.emoji)}</div>`:''}
<div class="clock" id="c">--:--</div>
<div class="dt" id="d"></div>`;
    const js = `${WTAG}
var T=${c.h24?'true':'false'},S=${c.sec?'true':'false'};
function run(){var n=new Date(),h=n.getHours(),sfx='';
 if(!T){sfx=h<12?' AM':' PM';h=h%12;if(h===0)h=12}
 document.getElementById('c').textContent=p2(h)+':'+p2(n.getMinutes())+(S?':'+p2(n.getSeconds()):'')+sfx;
 document.getElementById('d').textContent=WT[n.getDay()]+', '+n.getDate()+'.'+(n.getMonth()+1)+'.'+n.getFullYear()}
run();setInterval(run,1000);`;
    return shell(c, c.top||'Uhr', html, base, js, 8.5, 11);
  }
},

countdown:{
  name:'Countdown', icon:'⏳', folder:'countdown',
  desc:'Zählt bis zu einem Datum, zum Beispiel bis zu den Ferien.',
  variants:[
    {k:'zahl', n:'Große Zahl', d:'Eine riesige Tageszahl, darunter das Wort Tage.'},
    {k:'kacheln', n:'Kacheln', d:'Tage, Stunden und Minuten in eigenen Feldern.'},
    {k:'ring', n:'Ring', d:'Kreis, der sich füllt, je näher der Tag rückt.'},
    {k:'striche', n:'Strichliste', d:'Jeder Tag ein Kästchen, vergangene sind gefüllt.'},
    {k:'ticket', n:'Ticket', d:'Querformat mit Perforation, Zahl links, Text rechts.'}
  ],
  fields:[
    {k:'top',t:'text',label:'Worauf wird gewartet',def:'Bis zu den Sommerferien'},
    {k:'start',t:'date',label:'Gezählt ab (für Ring und Striche)',def:'2026-09-15'},
    {k:'target',t:'date',label:'Zieldatum',def:'2027-08-02'},
    {k:'emoji',t:'text',label:'Emoji',def:'🏖️'},
    {k:'done',t:'text',label:'Text wenn erreicht',def:'Endlich Ferien!'}
  ],
  build(c){
    const oa = onAccent(c), v = c.variant;
    const base = `.em{font-size:1.4em;line-height:1;flex:0 0 auto}
.num{font-size:4.2em;font-weight:700;line-height:.9;font-variant-numeric:tabular-nums}
.unit{font-size:.92em;font-weight:600;letter-spacing:.1em;text-transform:uppercase;opacity:.7;line-height:1.2}
.small{font-size:.85em;opacity:.7;font-variant-numeric:tabular-nums}`;

    if(v==='kacheln'){
      const css = base + `
.kk{display:flex;gap:.3em;justify-content:center;align-items:stretch;width:100%;flex:1 1 auto;min-height:0;max-height:5em}
.k{background:${hexa(c.accent,.14)};border:.06em solid ${hexa(c.accent,.4)};border-radius:.4em;padding:.3em .2em;flex:1;min-width:0;
 display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.1em}
.k b{display:block;font-size:2em;font-weight:700;line-height:1;font-variant-numeric:tabular-nums}
.k span{display:block;font-size:.62em;letter-spacing:.08em;text-transform:uppercase;opacity:.6}`;
      const html = `${c.top?`<p class="ttl">${esc(c.top)}</p>`:''}
${c.emoji?`<div class="em">${esc(c.emoji)}</div>`:''}
<div class="kk">
 <div class="k"><b id="kd">–</b><span>Tage</span></div>
 <div class="k"><b id="kh">–</b><span>Std</span></div>
 <div class="k"><b id="km">–</b><span>Min</span></div>
</div>`;
      const js = `var TG=new Date(${jstr(c.target)}+'T00:00:00');
function run(){var ms=TG-new Date();
 if(ms<=0){document.querySelector('.kk').innerHTML='<div class="k" style="min-width:auto"><b>🎉</b><span>'+${jstr(c.done)}+'</span></div>';return}
 var d=Math.floor(ms/86400000),r=ms-d*86400000;
 document.getElementById('kd').textContent=d;
 document.getElementById('kh').textContent=Math.floor(r/3600000);
 document.getElementById('km').textContent=Math.floor((r%3600000)/60000)}
run();setInterval(run,20000);`;
      return shell(c, c.top||'Countdown', html, css, js, 9, 12);
    }

    if(v==='ring'){
      const css = base + `
.rg{position:relative;flex:1 1 auto;min-height:0;width:100%}
.rg svg{width:100%;height:100%;transform:rotate(-90deg);display:block}
.rg .t{fill:none;stroke:${hexa(c.accent,.18)};stroke-width:8}
.rg .p{fill:none;stroke:${c.accent};stroke-width:8;stroke-linecap:round;transition:stroke-dashoffset .6s}
.rg .c{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.02em}`;
      const html = `${c.top?`<p class="ttl">${esc(c.top)}</p>`:''}
<div class="rg"><svg viewBox="0 0 100 100" aria-hidden="true">
 <circle class="t" cx="50" cy="50" r="44"></circle>
 <circle class="p" id="pr" cx="50" cy="50" r="44" stroke-dasharray="276.5" stroke-dashoffset="276.5"></circle></svg>
 <div class="c"><div class="num" id="n" style="font-size:2.3em">–</div><div class="unit" id="u">Tage</div></div></div>`;
      const js = `var A=new Date(${jstr(c.start)}+'T00:00:00'),B=new Date(${jstr(c.target)}+'T00:00:00');
function run(){var n=new Date(),ms=B-n;
 var num=document.getElementById('n'),u=document.getElementById('u');
 var tot=B-A,p=Math.max(0,Math.min(1,tot>0?(n-A)/tot:1));
 document.getElementById('pr').setAttribute('stroke-dashoffset',String(276.5*(1-p)));
 if(ms<=0){num.textContent='🎉';u.textContent=${jstr(c.done)};return}
 var d=Math.floor(ms/86400000);num.textContent=d;u.textContent=d===1?'Tag':'Tage'}
run();setInterval(run,60000);`;
      return shell(c, c.top||'Countdown', html, css, js, 11, 11);
    }

    if(v==='striche'){
      const css = base + `
.bx{display:flex;flex-wrap:wrap;gap:.16em;justify-content:center;align-content:center;width:100%;flex:1 1 auto;min-height:0}
.bx i{width:.58em;height:.58em;border-radius:.14em;background:${hexa(c.accent,.2)};display:block}
.bx i.f{background:${c.accent}}`;
      const html = `${c.top?`<p class="ttl">${esc(c.top)}</p>`:''}
<div class="num" id="n" style="font-size:2.6em">–</div>
<div class="unit" id="u">Tage übrig</div>
<div class="bx" id="bx"></div>`;
      const js = `var A=new Date(${jstr(c.start)}+'T00:00:00'),B=new Date(${jstr(c.target)}+'T00:00:00');
function run(){var n=new Date();
 var tot=Math.max(1,Math.round((B-A)/86400000));
 var gone=Math.max(0,Math.min(tot,Math.round((n-A)/86400000)));
 var left=tot-gone;
 document.getElementById('n').textContent=left>0?left:'🎉';
 document.getElementById('u').textContent=left>0?(left===1?'Tag übrig':'Tage übrig'):${jstr(c.done)};
 var cap=Math.min(tot,120),step=tot/cap,h='';
 for(var i=0;i<cap;i++)h+='<i class="'+(i*step<gone?'f':'')+'"></i>';
 document.getElementById('bx').innerHTML=h}
run();setInterval(run,3600000);`;
      return shell(c, c.top||'Countdown', html, css, js, 10, 11);
    }

    if(v==='ticket'){
      const css = base + `
.card{flex-direction:row;gap:0;padding:0;align-items:stretch;text-align:left}
.lf{flex:0 0 36%;background:${c.accent};color:${oa};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;padding:.4em}
.lf .num{font-size:3.1em}
.lf .unit{opacity:.85;font-size:.8em}
.pf{flex:0 0 0;border-left:.14em dashed ${hexa(c.text,.28)}}
.rt{flex:1;display:flex;flex-direction:column;justify-content:center;gap:.2em;padding:.6em .9em;min-width:0;overflow:hidden}
.rt .h{font-size:1.25em;font-weight:700;line-height:1.15;text-wrap:balance}
.rt .s{font-size:.85em;opacity:.65;font-variant-numeric:tabular-nums}`;
      const html = `<div class="lf"><div class="num" id="n">–</div><div class="unit" id="u">Tage</div></div>
<div class="pf"></div>
<div class="rt"><div class="h">${esc(c.top||'Countdown')} ${c.emoji?esc(c.emoji):''}</div><div class="s" id="dt"></div></div>`;
      const js = `${WTAG}
var TG=new Date(${jstr(c.target)}+'T00:00:00');
function run(){var ms=TG-new Date();
 var num=document.getElementById('n'),u=document.getElementById('u');
 if(ms<=0){num.textContent='🎉';u.textContent='';}
 else{var d=Math.floor(ms/86400000);num.textContent=d;u.textContent=d===1?'Tag':'Tage'}
 document.getElementById('dt').textContent=WT[TG.getDay()]+', '+p2(TG.getDate())+'.'+p2(TG.getMonth()+1)+'.'+TG.getFullYear()}
run();setInterval(run,60000);`;
      return shell(c, c.top||'Countdown', html, css, js, 6, 17);
    }

    /* zahl */
    const html = `${c.top?`<p class="ttl">${esc(c.top)}</p>`:''}
${c.emoji?`<div class="em">${esc(c.emoji)}</div>`:''}
<div class="num" id="n">–</div><div class="unit" id="u">Tage</div>`;
    const js = `var TG=new Date(${jstr(c.target)}+'T00:00:00');
function run(){var ms=TG-new Date(),n=document.getElementById('n'),u=document.getElementById('u');
 if(ms<=0){n.textContent='🎉';u.textContent=${jstr(c.done)};return}
 var d=Math.floor(ms/86400000);n.textContent=d;u.textContent=d===1?'Tag':'Tage'}
run();setInterval(run,60000);`;
    return shell(c, c.top||'Countdown', html, base, js, 9.5, 10.5);
  }
},

pomodoro:{
  name:'Pomodoro', icon:'🍅', folder:'pomodoro',
  desc:'Lerntimer mit Lernzeit, kurzer und langer Pause.',
  variants:[
    {k:'ring', n:'Ring', d:'Kreis läuft leer, Zeit in der Mitte.'},
    {k:'balken', n:'Balken', d:'Waagerechter Balken, Zeit darüber.'},
    {k:'zahl', n:'Nur Zahlen', d:'Sehr große Ziffern, sonst nichts.'},
    {k:'tomate', n:'Tomaten', d:'Gelaufene Runden als Tomaten, Balken darunter.'},
    {k:'karte', n:'Breite Karte', d:'Querformat, Zeit links, Knöpfe rechts.'}
  ],
  fields:[
    {k:'top',t:'text',label:'Überschrift',def:'Lernzeit'},
    {k:'work',t:'number',label:'Lernen (Minuten)',def:15,min:1,max:90},
    {k:'short',t:'number',label:'Kurze Pause (Minuten)',def:5,min:1,max:30},
    {k:'long',t:'number',label:'Lange Pause (Minuten)',def:15,min:1,max:60},
    {k:'rounds',t:'number',label:'Runden bis zur langen Pause',def:4,min:2,max:8},
    {k:'sound',t:'bool',label:'Signalton am Ende',def:true}
  ],
  build(c){
    const oa = onAccent(c), v = c.variant;
    const common = `
.tm{font-size:2em;font-weight:700;font-variant-numeric:tabular-nums;line-height:1}
.ph{font-size:.72em;font-weight:600;letter-spacing:.1em;text-transform:uppercase;opacity:.6;line-height:1.2}
.ctr{display:flex;gap:.4em;justify-content:center;flex:0 0 auto}
.ctr button{border:none;background:${c.accent};color:${oa};font-weight:600;font-size:.92em;padding:.45em 1.2em;border-radius:999px;line-height:1.2}
.ctr button.sec{background:${hexa(c.accent,.16)};color:${c.text}}
.cnt{font-size:.74em;opacity:.55;line-height:1.2}`;
    const logic = `${c.sound?beep:'function beep(){}'}
var W=${c.work}*60,S=${c.short}*60,L=${c.long}*60,R=${c.rounds};
var phase='work',left=W,running=false,done=0,iv=null;
var tm=document.getElementById('tm'),ph=document.getElementById('ph'),go=document.getElementById('go'),cnt=document.getElementById('cnt');
function total(){return phase==='work'?W:phase==='short'?S:L}
function paint(){var m=Math.floor(left/60),s=left%60;
 tm.textContent=(m<10?'0':'')+m+':'+(s<10?'0':'')+s;
 if(ph)ph.textContent=phase==='work'?'Lernen':phase==='short'?'Kurze Pause':'Lange Pause';
 if(cnt)cnt.textContent='Runde '+(done%R+1)+' von '+R;
 if(go)go.textContent=running?'Pause':'Start';
 var frac=1-left/total();
 var pr=document.getElementById('pr');if(pr)pr.setAttribute('stroke-dashoffset',String(279.6*frac));
 var bi=document.getElementById('bi');if(bi)bi.style.width=(frac*100)+'%';
 var tt=document.getElementById('tt');
 if(tt){var h='';for(var i=0;i<R;i++)h+=(i<done%R||(done>0&&done%R===0)?'🍅':'🤍');tt.textContent=h}}
function next(){beep();if(phase==='work'){done++;phase=(done%R===0)?'long':'short'}else{phase='work'}left=total();paint()}
function tick(){if(left>0){left--;paint()}else{next()}}
if(go)go.onclick=function(){running=!running;if(running){iv=setInterval(tick,1000)}else{clearInterval(iv)}paint()};
var rs=document.getElementById('rs');
if(rs)rs.onclick=function(){clearInterval(iv);running=false;phase='work';left=W;done=0;paint()};
paint();`;

    if(v==='balken' || v==='tomate'){
      const css = common + `
.card{justify-content:space-evenly}
.bar{width:100%;height:.75em;border-radius:999px;background:${hexa(c.text,.14)};overflow:hidden;flex:0 0 auto}
.bar i{display:block;height:100%;width:0;background:${c.accent};border-radius:999px;transition:width .4s linear}
.tt{font-size:1.5em;letter-spacing:.08em;line-height:1;flex:0 0 auto}`;
      const html = `${c.top?`<p class="ttl">${esc(c.top)}</p>`:''}
${v==='tomate'?'<div class="tt" id="tt"></div>':''}
<div class="tm" id="tm" style="font-size:3.1em">00:00</div>
<div class="ph" id="ph">Lernen</div>
<div class="bar"><i id="bi"></i></div>
<div class="ctr"><button id="go">Start</button><button class="sec" id="rs">Neu</button></div>
${v==='balken'?'<div class="cnt" id="cnt"></div>':''}`;
      return shell(c, c.top||'Pomodoro', html, css, logic, 9, 10.5);
    }

    if(v==='zahl'){
      const css = common + `.card{justify-content:space-evenly}.tm{font-size:4.2em}`;
      const html = `${c.top?`<p class="ttl">${esc(c.top)}</p>`:''}
<div class="tm" id="tm">00:00</div><div class="ph" id="ph">Lernen</div>
<div class="ctr"><button id="go">Start</button><button class="sec" id="rs">Neu</button></div>`;
      return shell(c, c.top||'Pomodoro', html, css, logic, 8, 13);
    }

    if(v==='karte'){
      const css = common + `
.card{flex-direction:row;gap:1em;text-align:left;align-items:center}
.lf{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:.1em}
.lf .tm{font-size:3.2em}
.rt{flex:0 0 auto;display:flex;flex-direction:column;gap:.35em;align-items:stretch}
.rt button{border:none;background:${c.accent};color:${oa};font-weight:600;font-size:.92em;padding:.45em 1.1em;border-radius:999px;white-space:nowrap;line-height:1.2}
.rt button.sec{background:${hexa(c.accent,.16)};color:${c.text}}
.bar{width:100%;height:.4em;border-radius:999px;background:${hexa(c.text,.14)};overflow:hidden;margin-top:.25em}
.bar i{display:block;height:100%;width:0;background:${c.accent};transition:width .4s linear}`;
      const html = `<div class="lf">${c.top?`<p class="ttl" style="text-align:left">${esc(c.top)}</p>`:''}
<div class="tm" id="tm">00:00</div><div class="ph" id="ph">Lernen</div>
<div class="bar"><i id="bi"></i></div><div class="cnt" id="cnt"></div></div>
<div class="rt"><button id="go">Start</button><button class="sec" id="rs">Neu</button></div>`;
      return shell(c, c.top||'Pomodoro', html, css, logic, 7.5, 17);
    }

    /* ring */
    const css = common + `
.ring{position:relative;flex:1 1 auto;min-height:0;width:100%}
.ring svg{width:100%;height:100%;transform:rotate(-90deg);display:block}
.ring .tr{fill:none;stroke:${hexa(c.accent,.18)};stroke-width:7.5}
.ring .pr{fill:none;stroke:${c.accent};stroke-width:7.5;stroke-linecap:round;transition:stroke-dashoffset .3s linear}
.ring .lbl{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.05em}
.ring .tm{font-size:2.3em}`;
    const html = `${c.top?`<p class="ttl">${esc(c.top)}</p>`:''}
<div class="ring"><svg viewBox="0 0 100 100" aria-hidden="true">
 <circle class="tr" cx="50" cy="50" r="44.5"></circle>
 <circle class="pr" cx="50" cy="50" r="44.5" id="pr" stroke-dasharray="279.6" stroke-dashoffset="0"></circle></svg>
 <div class="lbl"><div class="tm" id="tm">00:00</div><div class="ph" id="ph">Lernen</div></div></div>
<div class="ctr"><button id="go">Start</button><button class="sec" id="rs">Neu</button></div>
<div class="cnt" id="cnt"></div>`;
    return shell(c, c.top||'Pomodoro', html, css, logic, 11, 11);
  }
},

spruch:{
  name:'Spruch des Tages', icon:'💬', folder:'spruch',
  desc:'Ein Spruch aus deiner eigenen Liste, wechselt von allein.',
  variants:[
    {k:'karte', n:'Karte', d:'Schlicht zentriert mit Anführungszeichen.'},
    {k:'blase', n:'Sprechblase', d:'Blase mit Zipfel, darunter ein Emoji.'},
    {k:'tape', n:'Zettel mit Klebeband', d:'Leicht gedrehter Zettel, oben Washi Tape.'},
    {k:'polaroid', n:'Polaroid', d:'Weißer Rahmen, Text unten wie handgeschrieben.'},
    {k:'banner', n:'Schmales Band', d:'Eine Zeile quer, passt über den Stundenplan.'}
  ],
  fields:[
    {k:'top',t:'text',label:'Überschrift',def:'Spruch des Tages'},
    {k:'list',t:'textarea',label:'Sprüche, einer pro Zeile',def:'Du schaffst das, Schritt für Schritt.\nFehler sind Übungsrunden.\nSei stolz auf dich, auch an kleinen Tagen.\nMut sieht morgens oft wie Aufstehen aus.\nDu musst nicht perfekt sein, nur du.'},
    {k:'mode',t:'select',label:'Wechselt',opts:['Täglich','Bei jedem Laden','Auf Klick'],def:'Täglich'},
    {k:'emoji',t:'text',label:'Emoji',def:'✨'}
  ],
  build(c){
    const lines = String(c.list).split('\n').map(s=>s.trim()).filter(Boolean);
    const v = c.variant, clickable = c.mode==='Auf Klick';
    let css = `.q{font-weight:500;line-height:1.35;text-wrap:balance;margin:0}
.em{font-size:1.5em;line-height:1;flex:0 0 auto}
.tap{font-size:.66em;opacity:.45;letter-spacing:.05em;flex:0 0 auto}
.card{cursor:${clickable?'pointer':'default'}}`;
    let html;

    if(v==='blase'){
      css += `
.card{justify-content:space-evenly}
.bub{position:relative;background:${hexa(c.accent,.15)};border:.08em solid ${hexa(c.accent,.45)};border-radius:.9em;padding:.7em .9em;width:100%}
.bub:after{content:'';position:absolute;left:1.6em;bottom:-.6em;width:1.1em;height:.62em;
 background:${hexa(c.accent,.15)};clip-path:polygon(0 0,100% 0,18% 100%)}
.q{font-size:1.25em}`;
      html = `${c.top?`<p class="ttl">${esc(c.top)}</p>`:''}
<div class="bub"><p class="q" id="q">…</p></div>
${c.emoji?`<div class="em">${esc(c.emoji)}</div>`:''}
${clickable?'<div class="tap">Tippen für den nächsten</div>':''}`;
    }
    else if(v==='tape'){
      css += `
.card{background:transparent;border:none;box-shadow:none;padding:${Math.max(6,(c.pad==null?10:c.pad))}px}
.note{position:relative;transform:rotate(-1.4deg);background:${c.bg};border-radius:.3em;padding:1.2em .9em .9em;
 box-shadow:0 .25em .8em ${hexa(c.text,.18)};width:100%;height:100%;
 display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.3em}
.note:before{content:'';position:absolute;top:-.5em;left:50%;transform:translateX(-50%) rotate(-2deg);
 width:5em;height:1.2em;background:${hexa(c.accent,.42)};border-radius:2px}
.q{font-size:1.2em}`;
      html = `<div class="note">${c.top?`<p class="ttl">${esc(c.top)}</p>`:''}<p class="q" id="q">…</p>
${c.emoji?`<div class="em">${esc(c.emoji)}</div>`:''}
${clickable?'<div class="tap">Tippen für den nächsten</div>':''}</div>`;
    }
    else if(v==='polaroid'){
      css += `
.card{background:transparent;border:none;box-shadow:none;padding:${Math.max(4,(c.pad==null?10:c.pad))}px}
.po{background:#fffdfb;border-radius:3px;padding:.5em .5em .8em;box-shadow:0 .3em .9em ${hexa(c.text,.22)};
 transform:rotate(1deg);width:100%;height:100%;display:flex;flex-direction:column;gap:.4em}
.ph2{background:${hexa(c.accent,.2)};border-radius:2px;display:grid;place-items:center;font-size:2.4em;flex:1 1 auto;min-height:0;line-height:1}
.q{font-size:1.05em;color:#3a2b32;font-weight:500;flex:0 0 auto}`;
      html = `<div class="po"><div class="ph2">${c.emoji?esc(c.emoji):'🌸'}</div><p class="q" id="q">…</p>
${clickable?'<div class="tap" style="color:#3a2b32">Tippen für den nächsten</div>':''}</div>`;
    }
    else if(v==='banner'){
      css += `
.card{flex-direction:row;gap:.6em;align-items:center;justify-content:flex-start;text-align:left}
.em{font-size:1.5em;flex:0 0 auto}
.q{font-size:1.15em;min-width:0}
.ttl{display:none}`;
      html = `${c.emoji?`<div class="em">${esc(c.emoji)}</div>`:''}<p class="q" id="q">…</p>`;
    }
    else {
      css += `
.card{justify-content:space-evenly}
.mark{font-size:2.8em;line-height:.5;opacity:.28;font-weight:700;flex:0 0 auto}
.q{font-size:1.35em}`;
      html = `${c.top?`<p class="ttl">${esc(c.top)}</p>`:''}
<div class="mark">&ldquo;</div>
<p class="q" id="q">…</p>
${c.emoji?`<div class="em">${esc(c.emoji)}</div>`:''}
${clickable?'<div class="tap">Tippen für den nächsten</div>':''}`;
    }

    const js = `var Q=${JSON.stringify(lines.length?lines:['Trag deine Sprüche ein.'])};
var q=document.getElementById('q'),M=${jstr(c.mode)},i=0;
if(M==='Täglich'){i=Math.floor(new Date().getTime()/86400000)%Q.length}
else{i=Math.floor(Math.random()*Q.length)}
function show(){q.textContent=Q[((i%Q.length)+Q.length)%Q.length]}
show();
if(M==='Auf Klick'){document.querySelector('.card').onclick=function(){i++;show()}}`;
    return shell(c, c.top||'Spruch', html, css, js, v==='banner'?5.5:13, v==='banner'?26:18);
  }
},

checkliste:{
  name:'Checkliste', icon:'✅', folder:'checkliste',
  desc:'Abhakliste mit Fortschritt. Merkt sich die Haken im Browser.',
  variants:[
    {k:'kasten', n:'Kästchen', d:'Klassische Kästchen, abgehakt wird farbig gefüllt.'},
    {k:'herz', n:'Herzen', d:'Leeres Herz wird zum vollen Herz.'},
    {k:'stern', n:'Sterne', d:'Leerer Stern wird zum goldenen Stern.'},
    {k:'pille', n:'Pillen', d:'Jeder Punkt eine Kapsel, erledigt wird komplett eingefärbt.'},
    {k:'karten', n:'Kacheln', d:'Zwei Spalten mit Kacheln, gut für kurze Punkte.'}
  ],
  fields:[
    {k:'top',t:'text',label:'Überschrift',def:'Mein Tagescheck'},
    {k:'list',t:'textarea',label:'Punkte, einer pro Zeile',def:'Ranzen gepackt\nHausaufgaben gemacht\nBrotdose eingepackt\nSportsachen dabei\nZähne geputzt'},
    {k:'daily',t:'bool',label:'Jeden Tag automatisch zurücksetzen',def:true},
    {k:'bar',t:'bool',label:'Fortschrittsbalken zeigen',def:true},
    {k:'strike',t:'bool',label:'Erledigtes durchstreichen',def:true}
  ],
  build(c){
    const items = String(c.list).split('\n').map(s=>s.trim()).filter(Boolean);
    const oa = onAccent(c), v = c.variant;
    const strike = c.strike ? `.it.on .tx{opacity:.45;text-decoration:line-through}` : `.it.on .tx{opacity:.5}`;
    let css = `.card{justify-content:stretch;gap:.25em;align-items:stretch;text-align:left}
.ttl{text-align:center}
.ls{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;justify-content:space-evenly}
.it{display:flex;align-items:center;gap:.5em;font-size:1em;font-weight:500;cursor:pointer;user-select:none;min-width:0}
.tx{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
${strike}
.bar{height:.45em;border-radius:999px;background:${hexa(c.text,.14)};overflow:hidden;flex:0 0 auto}
.bar i{display:block;height:100%;width:0;background:${c.accent};border-radius:999px;transition:width .3s}
.pct{font-size:.68em;opacity:.55;text-align:right;font-variant-numeric:tabular-nums;flex:0 0 auto;line-height:1.2}`;

    if(v==='kasten'){
      css += `
.bx{flex:0 0 auto;width:1.25em;height:1.25em;border-radius:.3em;border:.14em solid ${c.accent};
 background:${hexa(c.accent,.1)};display:grid;place-items:center;transition:background .15s}
.bx svg{width:.8em;height:.8em;opacity:0;transition:opacity .12s}
.bx svg path{stroke:${oa};stroke-width:3.6;fill:none;stroke-linecap:round;stroke-linejoin:round}
.it.on .bx{background:${c.accent}}
.it.on .bx svg{opacity:1}`;
    } else if(v==='herz' || v==='stern'){
      css += `.bx{flex:0 0 auto;font-size:1.25em;line-height:1;width:1.25em;text-align:center}`;
    } else if(v==='pille'){
      css += `
.it{background:${hexa(c.accent,.1)};border:.1em solid ${hexa(c.accent,.3)};border-radius:999px;padding:.28em .75em}
.it.on{background:${c.accent};border-color:${c.accent};color:${oa}}
.it.on .tx{opacity:.9${c.strike?';text-decoration:line-through':''}}
.bx{flex:0 0 auto;font-size:.95em;line-height:1;width:1.1em;text-align:center;font-weight:700}`;
    } else if(v==='karten'){
      css += `
.ls{display:grid;grid-template-columns:repeat(auto-fit,minmax(4.8em,1fr));grid-auto-rows:1fr;gap:.28em;align-content:stretch}
.it{flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:.15em;background:${hexa(c.accent,.1)};
 border:.1em solid ${hexa(c.accent,.28)};border-radius:.6em;padding:.25em;font-size:.62em;overflow:hidden}
.it .tx{white-space:normal;text-overflow:clip;line-height:1.15}
.it.on{background:${c.accent};border-color:${c.accent};color:${oa}}
.bx{font-size:1.1em;line-height:1}`;
    }

    const html = `${c.top?`<p class="ttl">${esc(c.top)}</p>`:''}
<div id="ls" class="ls"></div>
${c.bar?'<div class="bar"><i id="bi"></i></div><div class="pct" id="pc">0 %</div>':''}`;

    const mark = v==='kasten'
      ? `'<span class="bx"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13l5.5 5.5L20 6"/></svg></span>'`
      : v==='herz' ? `'<span class="bx">'+(on?'💖':'🤍')+'</span>'`
      : v==='stern' ? `'<span class="bx">'+(on?'⭐':'☆')+'</span>'`
      : `'<span class="bx">'+(on?'✓':'○')+'</span>'`;

    const js = `${store}
var IT=${JSON.stringify(items)},KEY='chk_'+${jstr(c.top||'liste')};
var st=ld(KEY,{d:'',v:[]});
if(${c.daily?'true':'false'} && st.d!==today()){st={d:today(),v:[]}}
var ls=document.getElementById('ls');
function row(t,ix){
 var on=st.v.indexOf(ix)>-1;
 var el=document.createElement('div');el.className='it'+(on?' on':'');
 el.setAttribute('role','checkbox');el.setAttribute('tabindex','0');el.setAttribute('aria-checked',String(on));
 el.innerHTML=${mark}+'<span class="tx"></span>';
 el.querySelector('.tx').textContent=t;
 function flip(){var pos=st.v.indexOf(ix);
  if(pos>-1){st.v.splice(pos,1)}else{st.v.push(ix)}
  st.d=today();sv(KEY,st);draw()}
 el.onclick=flip;
 el.onkeydown=function(e){if(e.key===' '||e.key==='Enter'){e.preventDefault();flip()}};
 return el}
function draw(){ls.innerHTML='';IT.forEach(function(t,ix){ls.appendChild(row(t,ix))});
 var bi=document.getElementById('bi');if(!bi)return;
 var p=IT.length?Math.round(st.v.length/IT.length*100):0;
 bi.style.width=p+'%';document.getElementById('pc').textContent=p+' %'}
draw();`;
    const rows = v==='karten' ? Math.ceil(items.length/2)*1.9 : items.length;
    return shell(c, c.top||'Checkliste', html, css, js, Math.max(8, 4.5 + rows*1.55), v==='karten'?12:14);
  }
},

fortschritt:{
  name:'Fortschritt', icon:'📊', folder:'fortschritt',
  desc:'Zeigt, wie viel von einem Zeitraum geschafft ist, etwa vom Schuljahr.',
  variants:[
    {k:'balken', n:'Balken', d:'Prozent groß, darunter ein Balken.'},
    {k:'ring', n:'Ring', d:'Kreis mit Prozent in der Mitte.'},
    {k:'herzen', n:'Herzen', d:'Zehn Herzen füllen sich nach und nach.'},
    {k:'bloecke', n:'Blöcke', d:'Zwanzig Segmente wie eine Ladeanzeige.'},
    {k:'pflanze', n:'Pflanze', d:'Pflanze wächst mit dem Fortschritt.'},
    {k:'zeile', n:'Schmale Zeile', d:'Eine Zeile mit Text links und Balken rechts.'}
  ],
  fields:[
    {k:'top',t:'text',label:'Überschrift',def:'Schuljahr geschafft'},
    {k:'from',t:'date',label:'Start',def:'2026-09-15'},
    {k:'to',t:'date',label:'Ende',def:'2027-07-30'},
    {k:'days',t:'bool',label:'Tage im Klartext zeigen',def:true}
  ],
  build(c){
    const v = c.variant, oa = onAccent(c);
    let css = `.card{justify-content:space-evenly}
.pcn{font-size:3em;font-weight:700;line-height:1;font-variant-numeric:tabular-nums;flex:0 0 auto}
.bar{width:100%;height:.8em;border-radius:999px;background:${hexa(c.text,.14)};overflow:hidden;flex:0 0 auto}
.bar i{display:block;height:100%;width:0;background:${c.accent};border-radius:999px;transition:width .5s}
.sm{font-size:.82em;opacity:.68;font-variant-numeric:tabular-nums;flex:0 0 auto;line-height:1.2}
.rg{position:relative;flex:1 1 auto;min-height:0;width:100%}
.rg svg{width:100%;height:100%;transform:rotate(-90deg);display:block}
.rg .t{fill:none;stroke:${hexa(c.accent,.18)};stroke-width:8}
.rg .p{fill:none;stroke:${c.accent};stroke-width:8;stroke-linecap:round;transition:stroke-dashoffset .6s}
.rg .c{position:absolute;inset:0;display:grid;place-items:center}
.hrt{font-size:1.7em;letter-spacing:.05em;line-height:1;flex:0 0 auto}
.blk{display:flex;gap:.12em;width:100%;flex:0 0 auto}
.blk i{flex:1;height:1.2em;border-radius:.14em;background:${hexa(c.accent,.18)}}
.blk i.f{background:${c.accent}}
.pl{font-size:3em;line-height:1;flex:0 0 auto}`;
    let body;
    if(v==='ring') body = `<div class="rg"><svg viewBox="0 0 100 100" aria-hidden="true"><circle class="t" cx="50" cy="50" r="44"></circle><circle class="p" id="pr" cx="50" cy="50" r="44" stroke-dasharray="276.5" stroke-dashoffset="276.5"></circle></svg><div class="c"><div class="pcn" id="pc" style="font-size:1.8em">0 %</div></div></div>`;
    else if(v==='herzen') body = `<div class="hrt" id="hr">🤍🤍🤍🤍🤍🤍🤍🤍🤍🤍</div><div class="pcn" id="pc" style="font-size:2em">0 %</div>`;
    else if(v==='bloecke') body = `<div class="pcn" id="pc" style="font-size:2.4em">0 %</div><div class="blk" id="bk"></div>`;
    else if(v==='pflanze') body = `<div class="pl" id="pl">🌱</div><div class="pcn" id="pc" style="font-size:2em">0 %</div><div class="bar"><i id="bi"></i></div>`;
    else if(v==='zeile'){
      css += `
.card{flex-direction:row;gap:.7em;align-items:center;text-align:left}
.ttl{text-align:left;flex:0 1 auto;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bar{flex:1 1 auto;width:auto;min-width:3em;height:.9em}
.pcn{font-size:1.2em;flex:0 0 auto}
.sm{display:none}`;
      body = `<div class="bar"><i id="bi"></i></div><div class="pcn" id="pc">0 %</div>`;
    }
    else body = `<div class="pcn" id="pc">0 %</div><div class="bar"><i id="bi"></i></div>`;

    const html = `${c.top?`<p class="ttl">${esc(c.top)}</p>`:''}
${body}
${c.days && v!=='zeile' ?'<div class="sm" id="dy"></div>':''}`;
    const js = `var A=new Date(${jstr(c.from)}+'T00:00:00'),B=new Date(${jstr(c.to)}+'T00:00:00');
var STAGES=['🌱','🌿','☘️','🪴','🌷','🌸'];
function run(){var n=new Date(),tot=B-A,el=n-A;
 var p=Math.max(0,Math.min(100,tot>0?el/tot*100:0));
 document.getElementById('pc').textContent=Math.round(p)+' %';
 var bi=document.getElementById('bi');if(bi)bi.style.width=p+'%';
 var pr=document.getElementById('pr');if(pr)pr.setAttribute('stroke-dashoffset',String(276.5*(1-p/100)));
 var hr=document.getElementById('hr');
 if(hr){var f=Math.round(p/10),s='';for(var i=0;i<10;i++)s+=(i<f?'💖':'🤍');hr.textContent=s}
 var bk=document.getElementById('bk');
 if(bk){var n2=20,fl=Math.round(p/100*n2),h='';for(var j=0;j<n2;j++)h+='<i class="'+(j<fl?'f':'')+'"></i>';bk.innerHTML=h}
 var pl=document.getElementById('pl');
 if(pl)pl.textContent=STAGES[Math.min(STAGES.length-1,Math.floor(p/100*STAGES.length))];
 var dy=document.getElementById('dy');
 if(dy){var left=Math.max(0,Math.ceil((B-n)/86400000));
  dy.textContent=left===0?'Heute ist der letzte Tag':'Noch '+left+(left===1?' Tag':' Tage')}}
run();setInterval(run,3600000);`;
    const fd = v==='zeile' ? 5 : (v==='herzen' ? 13 : 10);
    const fw = v==='zeile' ? 22 : (v==='herzen' ? 18 : 10.5);
    return shell(c, c.top||'Fortschritt', html, css, js, fd, fw);
  }
},

tracker:{
  name:'Tracker', icon:'💧', folder:'tracker',
  desc:'Zählt Dinge pro Tag, zum Beispiel Gläser Wasser oder gelesene Seiten.',
  variants:[
    {k:'reihe', n:'Reihe', d:'Symbole nebeneinander zum Antippen.'},
    {k:'gitter', n:'Gitter', d:'Symbole als Raster, gut für hohe Ziele.'},
    {k:'knopf', n:'Großer Knopf', d:'Ein großer Zählknopf mit Minus daneben.'},
    {k:'balken', n:'Balken', d:'Plus und Minus mit Fortschrittsbalken.'},
    {k:'woche', n:'Wochenstreifen', d:'Sieben Tage nebeneinander, jeder mit eigenem Stand.'}
  ],
  fields:[
    {k:'top',t:'text',label:'Überschrift',def:'Wasser heute'},
    {k:'emoji',t:'text',label:'Symbol',def:'💧'},
    {k:'empty',t:'text',label:'Symbol wenn offen',def:'🤍'},
    {k:'goal',t:'number',label:'Tagesziel',def:6,min:1,max:30},
    {k:'cheer',t:'text',label:'Text bei Ziel erreicht',def:'Geschafft! 🎉'}
  ],
  build(c){
    const v = c.variant, oa = onAccent(c), G = Math.max(1, Number(c.goal)||1);
    let css = `.card{justify-content:space-evenly}
.cn{font-size:1.7em;font-weight:700;font-variant-numeric:tabular-nums;line-height:1;flex:0 0 auto}
.ch{font-size:.8em;font-weight:600;color:${c.accent};min-height:1.1em;flex:0 0 auto;line-height:1.2}
.rs{border:none;background:${hexa(c.accent,.15)};font-size:.68em;font-weight:600;padding:.3em 1em;border-radius:999px;flex:0 0 auto}
.dots{display:flex;flex-wrap:wrap;gap:.16em;justify-content:center;align-content:center;font-size:1.6em;line-height:1;flex:1 1 auto;min-height:0}
.dots button{border:none;background:none;padding:0;font-size:1em;line-height:1}`;
    let html, js;

    if(v==='gitter'){
      css += `.dots{display:grid;grid-template-columns:repeat(auto-fit,minmax(1.6em,1fr));gap:.14em;width:100%;font-size:1.5em}`;
    }
    if(v==='knopf' || v==='balken'){
      css += `
.big{border:none;background:${c.accent};color:${oa};font-weight:700;font-size:2em;line-height:1;
 width:2.2em;height:2.2em;border-radius:50%;display:grid;place-items:center;flex:0 0 auto}
.row{display:flex;gap:.5em;align-items:center;justify-content:center;flex:0 0 auto}
.mini{border:none;background:${hexa(c.accent,.16)};color:${c.text};font-weight:700;font-size:1.3em;
 width:1.9em;height:1.9em;border-radius:50%;display:grid;place-items:center;flex:0 0 auto}
.bar{width:100%;height:.65em;border-radius:999px;background:${hexa(c.text,.14)};overflow:hidden;flex:0 0 auto}
.bar i{display:block;height:100%;width:0;background:${c.accent};transition:width .3s}
.ico{font-size:1.8em;line-height:1;flex:0 0 auto}`;
    }

    if(v==='woche'){
      css += `
.wk{display:flex;gap:.22em;width:100%;align-items:stretch;justify-content:center;flex:1 1 auto;min-height:0}
.wd{display:flex;flex-direction:column;align-items:center;gap:.14em;flex:1;min-width:0}
.wd b{font-size:.62em;font-weight:700;opacity:.5;flex:0 0 auto}
.wd .tube{width:100%;border-radius:.35em;background:${hexa(c.accent,.16)};
 border:.1em solid ${hexa(c.accent,.3)};display:flex;align-items:flex-end;overflow:hidden;cursor:pointer;flex:1 1 auto;min-height:0}
.wd .tube i{display:block;width:100%;height:0;background:${c.accent};transition:height .25s}
.wd.t .tube{border-color:${c.accent}}
.wd small{font-size:.6em;opacity:.6;font-variant-numeric:tabular-nums;flex:0 0 auto}`;
      html = `${c.top?`<p class="ttl">${esc(c.top)}</p>`:''}
<div class="wk" id="wk"></div>
<div class="cn" id="cn">0 / ${G}</div>
<div class="ch" id="ch"></div>`;
      js = `${store}${WTAG}
var G=${G},KEY='trkw_'+${jstr(c.top||'tracker')};
var st=ld(KEY,{});
function draw(){var wk=document.getElementById('wk');wk.innerHTML='';
 var n=new Date(),off=(n.getDay()+6)%7,tk=today();
 for(var d=0;d<7;d++){(function(d){
  var x=new Date(n);x.setDate(n.getDate()-off+d);
  var k=x.getFullYear()+'-'+(x.getMonth()+1)+'-'+x.getDate(),val=st[k]||0;
  var e=document.createElement('div');e.className='wd'+(k===tk?' t':'');
  e.innerHTML='<b></b><div class="tube" role="button" tabindex="0"><i></i></div><small></small>';
  e.querySelector('b').textContent=WK[x.getDay()];
  e.querySelector('i').style.height=Math.min(100,val/G*100)+'%';
  e.querySelector('small').textContent=val;
  var t=e.querySelector('.tube');
  function bump(){st[k]=(val>=G)?0:val+1;sv(KEY,st);draw()}
  t.onclick=bump;t.onkeydown=function(ev){if(ev.key===' '||ev.key==='Enter'){ev.preventDefault();bump()}};
  wk.appendChild(e)})(d)}
 var tv=st[tk]||0;
 document.getElementById('cn').textContent=tv+' / '+G;
 document.getElementById('ch').textContent=tv>=G?${jstr(c.cheer)}:''}
draw();`;
      return shell(c, c.top||'Tracker', html, css, js, 13, 11);
    }

    if(v==='knopf' || v==='balken'){
      html = `${c.top?`<p class="ttl">${esc(c.top)}</p>`:''}
<div class="ico">${esc(c.emoji||'💧')}</div>
<div class="cn" id="cn">0 / ${G}</div>
${v==='balken'?'<div class="bar"><i id="bi"></i></div>':''}
<div class="row"><button class="mini" id="mn" aria-label="weniger">−</button><button class="big" id="pl" aria-label="mehr">+</button></div>
<div class="ch" id="ch"></div>`;
      js = `${store}
var G=${G},KEY='trk_'+${jstr(c.top||'tracker')};
var st=ld(KEY,{d:'',n:0});if(st.d!==today())st={d:today(),n:0};
function draw(){document.getElementById('cn').textContent=st.n+' / '+G;
 var bi=document.getElementById('bi');if(bi)bi.style.width=Math.min(100,st.n/G*100)+'%';
 document.getElementById('ch').textContent=st.n>=G?${jstr(c.cheer)}:''}
document.getElementById('pl').onclick=function(){st.n++;st.d=today();sv(KEY,st);draw()};
document.getElementById('mn').onclick=function(){st.n=Math.max(0,st.n-1);st.d=today();sv(KEY,st);draw()};
draw();`;
      return shell(c, c.top||'Tracker', html, css, js, 11, 10);
    }

    /* reihe und gitter */
    html = `${c.top?`<p class="ttl">${esc(c.top)}</p>`:''}
<div class="dots" id="ds"></div>
<div class="cn" id="cn">0 / ${G}</div>
<div class="ch" id="ch"></div>
<button class="rs" id="rs">Zurücksetzen</button>`;
    js = `${store}
var G=${G},FULL=${jstr(c.emoji||'💧')},EMP=${jstr(c.empty||'🤍')},KEY='trk_'+${jstr(c.top||'tracker')};
var st=ld(KEY,{d:'',n:0});if(st.d!==today())st={d:today(),n:0};
var ds=document.getElementById('ds');
function draw(){ds.innerHTML='';
 for(var i=0;i<G;i++){(function(i){var b=document.createElement('button');b.type='button';
  b.textContent=i<st.n?FULL:EMP;b.setAttribute('aria-label',(i+1)+' von '+G);
  b.onclick=function(){st.n=(st.n===i+1)?i:i+1;st.d=today();sv(KEY,st);draw()};
  ds.appendChild(b)})(i)}
 document.getElementById('cn').textContent=st.n+' / '+G;
 document.getElementById('ch').textContent=st.n>=G?${jstr(c.cheer)}:''}
document.getElementById('rs').onclick=function(){st={d:today(),n:0};sv(KEY,st);draw()};
draw();`;
    return shell(c, c.top||'Tracker', html, css, js, v==='gitter'?12:11, Math.max(10, G*2.1));
  }
},

stimmung:{
  name:'Stimmung', icon:'😊', folder:'stimmung',
  desc:'Stimmung pro Tag antippen, die Woche oder der Monat bleibt sichtbar.',
  variants:[
    {k:'reihe', n:'Reihe + Woche', d:'Gesichter antippen, darunter die Woche.'},
    {k:'gross', n:'Nur heute', d:'Großes Gesicht, Auswahl darunter.'},
    {k:'monat', n:'Monatsraster', d:'Ganzer Monat als farbige Punkte.'},
    {k:'leiste', n:'Schieberegler', d:'Regler von schlecht bis super.'},
    {k:'karten', n:'Kacheln', d:'Jede Stimmung eine Kachel mit Wort darunter.'}
  ],
  fields:[
    {k:'top',t:'text',label:'Überschrift',def:'Wie geht es mir?'},
    {k:'faces',t:'text',label:'Gesichter, durch Leerzeichen getrennt',def:'😄 🙂 😐 😕 😢'},
    {k:'words',t:'text',label:'Wörter dazu, durch Komma getrennt',def:'super, gut, geht so, mau, traurig'}
  ],
  build(c){
    const faces = String(c.faces).trim().split(/\s+/).filter(Boolean);
    const words = String(c.words).split(',').map(s=>s.trim()).filter(Boolean);
    const F = faces.length ? faces : ['😄','🙂','😐','😕','😢'];
    const v = c.variant, oa = onAccent(c);
    let css = `.card{justify-content:space-evenly}
.fc{display:flex;gap:.22em;justify-content:center;align-items:center;font-size:2em;line-height:1;flex:0 0 auto}
.fc button{border:none;background:none;padding:.08em;border-radius:.3em;filter:grayscale(1) opacity(.5);transition:filter .15s,transform .15s}
.fc button.on{filter:none;transform:scale(1.14);background:${hexa(c.accent,.15)}}
.wk{display:flex;gap:.25em;justify-content:center;flex:0 0 auto}
.wd{display:flex;flex-direction:column;align-items:center;gap:.1em;flex:1;min-width:0}
.wd b{font-weight:700;opacity:.5;font-size:.6em}
.wd span{font-size:1.35em;line-height:1}`;
    let html, extra = '';

    if(v==='gross'){
      css += `.now{font-size:4em;line-height:1;flex:0 0 auto}.lbl{font-size:.95em;opacity:.7;font-weight:600;flex:0 0 auto;line-height:1.2}`;
      html = `${c.top?`<p class="ttl">${esc(c.top)}</p>`:''}
<div class="now" id="now">·</div><div class="lbl" id="lbl">noch nichts gewählt</div><div class="fc" id="fc"></div>`;
      extra = `var now=document.getElementById('now'),lbl=document.getElementById('lbl');`;
    }
    else if(v==='monat'){
      css += `
.card{justify-content:stretch;gap:.2em}
.mh{font-size:.95em;font-weight:700;flex:0 0 auto;line-height:1.1}
.mg{display:grid;grid-template-columns:repeat(7,1fr);grid-auto-rows:1fr;gap:.1em;width:100%;flex:1 1 auto;min-height:0}
.mg b{font-size:.55em;font-weight:700;opacity:.4;display:grid;place-items:center}
.mg span{border-radius:.25em;display:grid;place-items:center;font-size:.85em;line-height:1;background:${hexa(c.accent,.1)}}
.mg span.o{opacity:.15}
.mg span.t{outline:.1em solid ${c.accent};outline-offset:-.1em}`;
      html = `${c.top?`<p class="ttl">${esc(c.top)}</p>`:''}
<div class="mh" id="mh">Monat</div><div class="mg" id="mg"></div><div class="fc" id="fc"></div>`;
    }
    else if(v==='leiste'){
      css += `
.now{font-size:3.6em;line-height:1;flex:0 0 auto}
.sl{width:100%;accent-color:${c.accent};flex:0 0 auto}
.lbl{font-size:.95em;opacity:.7;font-weight:600;flex:0 0 auto;line-height:1.2}
.ends{display:flex;justify-content:space-between;width:100%;font-size:.62em;opacity:.5;letter-spacing:.05em;text-transform:uppercase;flex:0 0 auto}`;
      html = `${c.top?`<p class="ttl">${esc(c.top)}</p>`:''}
<div class="now" id="now">·</div><div class="lbl" id="lbl"></div>
<input class="sl" id="sl" type="range" min="0" max="${F.length-1}" step="1" value="${Math.floor((F.length-1)/2)}" aria-label="Stimmung">
<div class="ends"><span>${esc(words[words.length-1]||'schlecht')}</span><span>${esc(words[0]||'super')}</span></div>`;
    }
    else if(v==='karten'){
      css += `
.fc{display:grid;grid-template-columns:repeat(${Math.min(F.length,6)},minmax(0,1fr));gap:.25em;width:100%;font-size:1em;flex:1 1 auto;min-height:0;align-content:stretch}
.fc button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.1em;background:${hexa(c.accent,.1)};
 border:.1em solid ${hexa(c.accent,.26)};border-radius:.5em;padding:.35em .2em;filter:grayscale(1) opacity(.65)}
.fc button em{font-style:normal;font-size:1.7em;line-height:1}
.fc button small{font-size:.62em;font-weight:600;line-height:1.1}
.fc button.on{filter:none;transform:none;background:${c.accent};border-color:${c.accent};color:${oa}}`;
      html = `${c.top?`<p class="ttl">${esc(c.top)}</p>`:''}<div class="fc" id="fc"></div><div class="wk" id="wk"></div>`;
    }
    else {
      html = `${c.top?`<p class="ttl">${esc(c.top)}</p>`:''}<div class="fc" id="fc"></div><div class="wk" id="wk"></div>`;
    }

    const js = `${store}${WTAG}
var F=${JSON.stringify(F)},WD=${JSON.stringify(words)},KEY='mood_v1',V=${jstr(v)};
var st=ld(KEY,{});
${extra}
function pick(i){var t=today();st[t]=(st[t]===i)?null:i;sv(KEY,st);draw()}
function draw(){
 var t=today(),cur=st[t];
 var fc=document.getElementById('fc');
 if(fc){fc.innerHTML='';
  F.forEach(function(f,i){var b=document.createElement('button');b.type='button';
   if(V==='karten'){b.innerHTML='<em></em><small></small>';b.querySelector('em').textContent=f;
    b.querySelector('small').textContent=WD[i]||''}
   else{b.textContent=f}
   b.setAttribute('aria-label',(WD[i]||('Stimmung '+(i+1))));
   if(cur===i)b.className='on';
   b.onclick=function(){pick(i)};fc.appendChild(b)})}
 var now=document.getElementById('now');
 if(now){now.textContent=(cur!==null&&cur!==undefined)?F[cur]:'·';
  var lb=document.getElementById('lbl');
  if(lb)lb.textContent=(cur!==null&&cur!==undefined)?(WD[cur]||''):'noch nichts gewählt'}
 var wk=document.getElementById('wk');
 if(wk){wk.innerHTML='';var n=new Date(),off=(n.getDay()+6)%7;
  for(var d=0;d<7;d++){var x=new Date(n);x.setDate(n.getDate()-off+d);
   var k=x.getFullYear()+'-'+(x.getMonth()+1)+'-'+x.getDate();
   var e=document.createElement('div');e.className='wd';e.innerHTML='<b></b><span></span>';
   e.querySelector('b').textContent=WK[x.getDay()];
   e.querySelector('span').textContent=(st[k]!==undefined&&st[k]!==null)?F[st[k]]:'·';
   wk.appendChild(e)}}
 var mg=document.getElementById('mg');
 if(mg){var n2=new Date(),y=n2.getFullYear(),m=n2.getMonth(),td=n2.getDate();
  document.getElementById('mh').textContent=MO[m]+' '+y;
  var off2=(new Date(y,m,1).getDay()+6)%7,dim=new Date(y,m+1,0).getDate(),h='';
  ['Mo','Di','Mi','Do','Fr','Sa','So'].forEach(function(d){h+='<b>'+d+'</b>'});
  for(var i=0;i<off2;i++)h+='<span class="o"></span>';
  for(var d2=1;d2<=dim;d2++){var k2=y+'-'+(m+1)+'-'+d2,val=st[k2];
   h+='<span class="'+(d2===td?'t':'')+'">'+((val!==undefined&&val!==null)?F[val]:'')+'</span>'}
  mg.innerHTML=h}}
var sl=document.getElementById('sl');
if(sl){sl.oninput=function(){var t=today();st[t]=F.length-1-Number(sl.value);sv(KEY,st);draw()};
 var c0=st[today()];if(c0!==undefined&&c0!==null)sl.value=String(F.length-1-c0)}
draw();`;
    const fd = v==='monat' ? 15 : (v==='karten' ? 12 : 11);
    const fw = v==='monat' ? 13 : (v==='karten' ? Math.max(12, F.length*3.7) : Math.max(11, F.length*2.5));
    return shell(c, c.top||'Stimmung', html, css, js, fd, fw);
  }
},

notiz:{
  name:'Notizzettel', icon:'📝', folder:'notiz',
  desc:'Freies Feld zum Draufschreiben, speichert automatisch im Browser.',
  variants:[
    {k:'heft', n:'Heftpapier', d:'Linien wie im Schulheft, Rand links.'},
    {k:'haft', n:'Haftnotiz', d:'Gelber Zettel, leicht gedreht, mit Eselsohr.'},
    {k:'tafel', n:'Tafel', d:'Dunkle Tafel mit Kreideschrift.'},
    {k:'karo', n:'Karopapier', d:'Rechenkaro, gut für Skizzen und Rechnen.'},
    {k:'pin', n:'Pinnwand', d:'Zettel mit Pinnadel oben.'},
    {k:'liste', n:'Schnellliste', d:'Enter macht eine neue Zeile mit Punkt davor.'}
  ],
  fields:[
    {k:'top',t:'text',label:'Überschrift',def:'Gedankenchaos'},
    {k:'ph',t:'text',label:'Platzhaltertext',def:'Einfach losschreiben …'},
    {k:'counter',t:'bool',label:'Zeichen zählen',def:false}
  ],
  build(c){
    const v = c.variant;
    let paper = 'transparent', ink = c.text, cardCss = '', deco = '';
    if(v==='heft') paper = `repeating-linear-gradient(${hexa(c.text,0)} 0 1.55em, ${hexa(c.accent,.28)} 1.55em 1.62em)`;
    if(v==='karo') paper = `linear-gradient(${hexa(c.accent,.22)} 1px, transparent 1px) 0 0/100% 1.1em,
      linear-gradient(90deg, ${hexa(c.accent,.22)} 1px, transparent 1px) 0 0/1.1em 100%`;
    if(v==='haft'){
      cardCss = `.card{background:${mix(c.bg,'#ffe66d',.55)};border-radius:2px;transform:rotate(-1.4deg);
        box-shadow:0 7px 18px ${hexa(c.text,.2)};position:relative}
      .card:after{content:'';position:absolute;right:0;bottom:0;border-width:0 0 1.5em 1.5em;border-style:solid;
        border-color:transparent transparent ${hexa(c.text,.14)} ${mix(c.bg,'#ffe66d',.3)}}`;
    }
    if(v==='tafel'){
      const board = mix(c.text,'#101418',.45);
      ink = '#f7f4ec';
      cardCss = `.card{background:${board};border:6px solid ${mix(c.accent,'#6b4a2f',.5)};box-shadow:inset 0 0 40px rgba(0,0,0,.45)}
      .ttl{color:${hexa('#ffffff',.6)}}`;
    }
    if(v==='pin'){
      cardCss = `.card{padding-top:1.6em;position:relative}
      .card:before{content:'📌';position:absolute;top:.15em;left:50%;transform:translateX(-50%);font-size:1.3em;line-height:1}`;
    }
    const lineH = v==='heft' ? '1.62em' : (v==='karo' ? '1.1em' : '1.5em');
    const css = `.card{align-items:stretch;justify-content:flex-start;gap:.2em}
.ttl{text-align:center;flex:0 0 auto}
textarea{flex:1 1 auto;min-height:0;width:100%;border:none;background:${paper};font-family:inherit;font-size:1em;
 line-height:${lineH};color:${ink};resize:none;outline:none;padding:0}
textarea::placeholder{color:${hexa(v==='tafel'?'#ffffff':c.text,.4)}}
.sv{font-size:.62em;opacity:.45;text-align:right;min-height:1em;color:${ink};flex:0 0 auto;line-height:1.1}
${cardCss}${deco}`;
    const html = `${c.top?`<p class="ttl">${esc(c.top)}</p>`:''}
<textarea id="tx" placeholder="${esc(c.ph)}" aria-label="${esc(c.top||'Notizen')}" spellcheck="false"></textarea>
<div class="sv" id="sv"></div>`;
    const js = `${store}
var KEY='note_'+${jstr(c.top||'notiz')},tx=document.getElementById('tx'),out=document.getElementById('sv'),t=null;
var CNT=${c.counter?'true':'false'},LIST=${v==='liste'?'true':'false'};
tx.value=ld(KEY,LIST?'• ':'');
function info(s){out.textContent=CNT?(s||('')) + (s?' · ':'') + tx.value.length+' Zeichen':(s||'')}
info('');
tx.addEventListener('input',function(){clearTimeout(t);info('…');
 t=setTimeout(function(){sv(KEY,tx.value);info('gespeichert')},500)});
if(LIST){tx.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();
 var s=tx.selectionStart,val=tx.value;
 tx.value=val.slice(0,s)+'\\n• '+val.slice(s);tx.selectionStart=tx.selectionEnd=s+3;
 tx.dispatchEvent(new Event('input'))}})}`;
    return shell(c, c.top||'Notizzettel', html, css, js, 16, 20);
  }
},

rechner:{
  name:'Taschenrechner', icon:'🧮', folder:'rechner',
  desc:'Rechnen mit großen Tasten, dazu ein Sparziel-Rechner fürs Taschengeld.',
  variants:[
    {k:'tasten', n:'Tastenfeld', d:'Klassischer Rechner mit Plus, Minus, Mal, Geteilt und Prozent.'},
    {k:'euro', n:'Euro', d:'Gleiches Tastenfeld, Anzeige in Euro mit zwei Nachkommastellen.'},
    {k:'gross', n:'Nur Plus und Minus', d:'Sehr große Tasten, nur Zusammenzählen und Abziehen.'},
    {k:'sparziel', n:'Sparziel', d:'Wunsch, Erspartes und Taschengeld eintragen, rechnet Rest und Wochen aus.'},
    {k:'teilen', n:'Gerecht teilen', d:'Betrag durch Anzahl Kinder teilen, zeigt den Rest in Cent.'}
  ],
  fields:[
    {k:'top',t:'text',label:'Überschrift',def:'Mein Taschenrechner'},
    {k:'wunschLbl',t:'text',label:'Beschriftung Wunsch (nur Sparziel)',def:'Das möchte ich'},
    {k:'habeLbl',t:'text',label:'Beschriftung Erspartes (nur Sparziel)',def:'Schon gespart'},
    {k:'wocheLbl',t:'text',label:'Beschriftung Taschengeld (nur Sparziel)',def:'Pro Woche'},
    {k:'wunsch',t:'number',label:'Wunsch kostet (Euro)',def:25,min:0,max:100000},
    {k:'habe',t:'number',label:'Schon gespart (Euro)',def:8,min:0,max:100000},
    {k:'woche',t:'number',label:'Taschengeld pro Woche (Euro)',def:2,min:0,max:1000},
    {k:'kinder',t:'number',label:'Anzahl zum Teilen',def:3,min:2,max:20}
  ],
  build(c){
    const v = c.variant, oa = onAccent(c);
    const euro = v === 'euro';

    if(v === 'sparziel'){
      const css = `.card{justify-content:space-evenly;align-items:stretch;text-align:left}
.ttl{text-align:center}
.zeile{display:flex;align-items:center;gap:.5em;font-size:.8em;font-weight:600}
.zeile label{flex:1;min-width:0;opacity:.75}
.zeile input{width:4.6em;flex:0 0 auto;text-align:right;font-weight:700;font-size:1.05em;
 background:${hexa(c.accent,.12)};border:.1em solid ${hexa(c.accent,.32)};border-radius:.4em;padding:.25em .45em;outline:none}
.bar{height:.6em;border-radius:999px;background:${hexa(c.text,.14)};overflow:hidden;flex:0 0 auto}
.bar i{display:block;height:100%;width:0;background:${c.accent};border-radius:999px;transition:width .35s}
.erg{display:flex;gap:.5em;align-items:stretch}
.erg div{flex:1;background:${hexa(c.accent,.14)};border-radius:.5em;padding:.4em .5em;text-align:center;min-width:0}
.erg b{display:block;font-size:1.5em;font-weight:700;line-height:1.05;font-variant-numeric:tabular-nums}
.erg span{display:block;font-size:.58em;letter-spacing:.06em;text-transform:uppercase;opacity:.65;margin-top:.15em}
.fertig{background:${c.accent}!important;color:${oa}}
.fertig span{opacity:.85}`;
      const html = `${c.top?`<p class="ttl">${esc(c.top)}</p>`:''}
<div class="zeile"><label for="a">${esc(c.wunschLbl)}</label><input id="a" type="number" min="0" step="0.5" inputmode="decimal"></div>
<div class="zeile"><label for="b">${esc(c.habeLbl)}</label><input id="b" type="number" min="0" step="0.5" inputmode="decimal"></div>
<div class="zeile"><label for="w">${esc(c.wocheLbl)}</label><input id="w" type="number" min="0" step="0.5" inputmode="decimal"></div>
<div class="bar"><i id="bi"></i></div>
<div class="erg">
  <div id="k1"><b id="rest">–</b><span>Noch nötig</span></div>
  <div id="k2"><b id="wochen">–</b><span>Wochen</span></div>
</div>`;
      const js = `${store}
var KEY='spar_'+${jstr(c.top||'sparziel')};
var a=document.getElementById('a'),b=document.getElementById('b'),w=document.getElementById('w');
var st=ld(KEY,{a:${Number(c.wunsch)||0},b:${Number(c.habe)||0},w:${Number(c.woche)||0}});
a.value=st.a; b.value=st.b; w.value=st.w;
function eur(x){return x.toFixed(2).replace('.',',')+' €'}
function rechne(){
  var A=parseFloat(a.value)||0, B=parseFloat(b.value)||0, W=parseFloat(w.value)||0;
  st={a:a.value,b:b.value,w:w.value}; sv(KEY,st);
  var rest=Math.max(0,A-B);
  var p=A>0?Math.min(100,B/A*100):0;
  document.getElementById('bi').style.width=p+'%';
  var r=document.getElementById('rest'), wo=document.getElementById('wochen');
  var k1=document.getElementById('k1'), k2=document.getElementById('k2');
  if(rest<=0 && A>0){
    r.textContent='🎉'; wo.textContent='0';
    k1.className='fertig'; k2.className='fertig';
    k1.querySelector('span').textContent='Geschafft'; k2.querySelector('span').textContent='Wochen';
  } else {
    k1.className=''; k2.className='';
    k1.querySelector('span').textContent='Noch nötig';
    r.textContent=eur(rest);
    wo.textContent = W>0 ? Math.ceil(rest/W) : '–';
    k2.querySelector('span').textContent = (W>0 && Math.ceil(rest/W)===1) ? 'Woche' : 'Wochen';
  }
}
[a,b,w].forEach(function(el){el.addEventListener('input',rechne)});
rechne();`;
      return shell(c, c.top||'Sparziel', html, css, js, 9, 13);
    }

    if(v === 'teilen'){
      const css = `.card{justify-content:space-evenly}
.zeile{display:flex;align-items:center;gap:.5em;width:100%;font-size:.82em;font-weight:600}
.zeile label{flex:1;min-width:0;opacity:.75;text-align:left}
.zeile input{width:4.6em;flex:0 0 auto;text-align:right;font-weight:700;font-size:1.05em;
 background:${hexa(c.accent,.12)};border:.1em solid ${hexa(c.accent,.32)};border-radius:.4em;padding:.25em .45em;outline:none}
.gross{font-size:2.6em;font-weight:700;line-height:1;font-variant-numeric:tabular-nums}
.unter{font-size:.78em;opacity:.7}`;
      const html = `${c.top?`<p class="ttl">${esc(c.top)}</p>`:''}
<div class="zeile"><label for="s">Betrag</label><input id="s" type="number" min="0" step="0.5" inputmode="decimal"></div>
<div class="zeile"><label for="n">Geteilt durch</label><input id="n" type="number" min="2" step="1" inputmode="numeric"></div>
<div class="gross" id="je">–</div>
<div class="unter" id="rest"></div>`;
      const js = `${store}
var KEY='teil_v1';
var s=document.getElementById('s'), n=document.getElementById('n');
var st=ld(KEY,{s:10,n:${Number(c.kinder)||3}});
s.value=st.s; n.value=st.n;
function eur(x){return x.toFixed(2).replace('.',',')+' €'}
function rechne(){
  var S=Math.round((parseFloat(s.value)||0)*100), N=Math.max(1,parseInt(n.value,10)||1);
  sv(KEY,{s:s.value,n:n.value});
  var je=Math.floor(S/N), rest=S-je*N;
  document.getElementById('je').textContent=eur(je/100);
  document.getElementById('rest').textContent = rest>0
    ? ('jede und jeder bekommt das, ' + rest + ' Cent bleiben übrig')
    : 'geht genau auf';
}
[s,n].forEach(function(el){el.addEventListener('input',rechne)});
rechne();`;
      return shell(c, c.top||'Teilen', html, css, js, 9, 12);
    }

    /* Tastenfeld: tasten, euro, gross */
    const klein = v === 'gross';
    const tasten = klein
      ? [['C','f'],['⌫','f'],['−','o'],['7','n'],['8','n'],['9','n'],['4','n'],['5','n'],['6','n'],
         ['1','n'],['2','n'],['3','n'],['0','n'],[',','n'],['+','o'],['=','g']]
      : [['C','f'],['⌫','f'],['%','f'],['÷','o'],
         ['7','n'],['8','n'],['9','n'],['×','o'],
         ['4','n'],['5','n'],['6','n'],['−','o'],
         ['1','n'],['2','n'],['3','n'],['+','o'],
         ['0','n w2'],[',','n'],['=','g']];
    const spalten = klein ? 3 : 4;
    const css = `.card{justify-content:stretch;gap:.3em}
.disp{flex:0 0 auto;text-align:right;font-size:2.1em;font-weight:700;line-height:1.1;font-variant-numeric:tabular-nums;
 padding:0 .12em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.merk{flex:0 0 auto;text-align:right;font-size:.62em;opacity:.5;min-height:1em;font-variant-numeric:tabular-nums;padding:0 .2em}
.pad{flex:1 1 auto;min-height:0;display:grid;grid-template-columns:repeat(${spalten},1fr);grid-auto-rows:1fr;gap:.22em}
.pad button{border:none;border-radius:.42em;font-size:1.15em;font-weight:600;line-height:1;
 background:${hexa(c.accent,.12)};display:grid;place-items:center;transition:background .1s}
.pad button:active{background:${hexa(c.accent,.3)}}
.pad button.o{background:${hexa(c.accent,.26)};font-weight:700}
.pad button.f{background:${hexa(c.text,.12)};font-size:1em}
.pad button.g{background:${c.accent};color:${oa};font-weight:700}
.pad button.w2{grid-column:span 2}`;
    const html = `${c.top?`<p class="ttl">${esc(c.top)}</p>`:''}
<div class="merk" id="merk"></div>
<div class="disp" id="disp">0</div>
<div class="pad" id="pad"></div>`;
    const js = `var EURO=${euro?'true':'false'};
var T=${JSON.stringify(tasten)};
var disp=document.getElementById('disp'), merk=document.getElementById('merk'), pad=document.getElementById('pad');
var cur='0', acc=null, op=null, neu=true;
function zeig(x){
  var s=String(x);
  if(EURO && s!=='' && !isNaN(parseFloat(s))) s=parseFloat(s).toFixed(2);
  s=s.replace('.',',');
  disp.textContent = EURO ? s+' €' : s;
}
function rechne(a,o,b){
  if(o==='+') return a+b;
  if(o==='−') return a-b;
  if(o==='×') return a*b;
  if(o==='÷') return b===0 ? NaN : a/b;
  return b;
}
function rund(x){ return Math.round(x*1e8)/1e8 }
function taste(t){
  if(t>='0' && t<='9'){ cur = (neu||cur==='0') ? t : cur+t; neu=false; }
  else if(t===','){ if(neu){cur='0.';neu=false} else if(cur.indexOf('.')<0) cur+='.'; }
  else if(t==='C'){ cur='0'; acc=null; op=null; neu=true; merk.textContent=''; }
  else if(t==='⌫'){ cur = cur.length>1 ? cur.slice(0,-1) : '0'; if(cur==='0')neu=true; }
  else if(t==='%'){ cur = String(rund(parseFloat(cur)/100)); neu=true; }
  else if(t==='='){
    if(op!==null){ cur=String(rund(rechne(acc,op,parseFloat(cur)||0))); acc=null; op=null; merk.textContent=''; neu=true; }
  } else {
    var z=parseFloat(cur)||0;
    if(op!==null && !neu){ z=rund(rechne(acc,op,z)); cur=String(z); }
    acc=z; op=t; neu=true;
    merk.textContent=String(acc).replace('.',',')+' '+t;
  }
  if(isNaN(parseFloat(cur))){ disp.textContent='Hoppla'; cur='0'; neu=true; return }
  zeig(cur);
}
T.forEach(function(p){
  var b=document.createElement('button');
  b.type='button'; b.textContent=p[0]; b.className=p[1];
  b.setAttribute('aria-label', p[0]==='⌫' ? 'Löschen' : p[0]);
  b.onclick=function(){taste(p[0])};
  pad.appendChild(b);
});
document.addEventListener('keydown',function(e){
  var k=e.key;
  if(k>='0'&&k<='9') taste(k);
  else if(k===','||k==='.') taste(',');
  else if(k==='+') taste('+');
  else if(k==='-') taste('−');
  else if(k==='*') taste('×');
  else if(k==='/'){ e.preventDefault(); taste('÷') }
  else if(k==='Enter'||k==='='){ e.preventDefault(); taste('=') }
  else if(k==='Backspace'){ e.preventDefault(); taste('⌫') }
  else if(k==='Escape') taste('C');
});
zeig(cur);`;
    return shell(c, c.top||'Taschenrechner', html, css, js, klein ? 11 : 13, klein ? 9 : 11);
  }
},
uhrzeit:{
  name:'Uhrzeit üben', icon:'🕐', folder:'uhrzeit',
  desc:'Die Uhr zeigt eine Zeit, das Kind tippt die richtige Antwort an. Vier Schwierigkeiten.',
  variants:[
    {k:'voll', n:'Volle Stunden', d:'Nur 1 Uhr, 2 Uhr, 3 Uhr. Für den Anfang in der ersten Klasse.'},
    {k:'halb', n:'Halbe Stunden', d:'Volle und halbe Stunden.'},
    {k:'viertel', n:'Viertelstunden', d:'Volle, halbe und Viertelstunden.'},
    {k:'fuenf', n:'Fünf Minuten', d:'In Fünf-Minuten-Schritten, für Fortgeschrittene.'}
  ],
  fields:[
    {k:'top',t:'text',label:'Überschrift',def:'Wie viel Uhr ist es?'},
    {k:'lob',t:'text',label:'Text bei richtig',def:'Richtig!'},
    {k:'trost',t:'text',label:'Text bei falsch',def:'Fast! Schau nochmal.'},
    {k:'punkte',t:'bool',label:'Punktestand zeigen',def:true}
  ],
  build(c){
    const oa = onAccent(c);
    const schritt = c.variant === 'voll' ? 60 : c.variant === 'halb' ? 30 : c.variant === 'viertel' ? 15 : 5;
    const ticks = Array.from({length:12},(_,i)=>{
      const a = i*30*Math.PI/180, r1 = 41, r2 = i%3===0 ? 33 : 37;
      const x1 = 50+Math.sin(a)*r1, y1 = 50-Math.cos(a)*r1, x2 = 50+Math.sin(a)*r2, y2 = 50-Math.cos(a)*r2;
      return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${hexa(c.text,i%3===0?.75:.3)}" stroke-width="${i%3===0?2.6:1.4}" stroke-linecap="round"/>`;
    }).join('');
    const zahlen = [12,3,6,9].map((n,i)=>{
      const a = i*90*Math.PI/180;
      const x = 50+Math.sin(a)*26, y = 50-Math.cos(a)*26;
      return `<text x="${x.toFixed(1)}" y="${(y+3.4).toFixed(1)}" text-anchor="middle" font-size="9" font-weight="700" fill="${hexa(c.text,.55)}">${n}</text>`;
    }).join('');
    const css = `.card{justify-content:space-evenly}
.an{flex:1 1 auto;min-height:0;width:100%}
.an svg{width:100%;height:100%;display:block}
.ant{display:grid;grid-template-columns:1fr 1fr;gap:.3em;width:100%;flex:0 0 auto}
.ant button{border:none;border-radius:.5em;background:${hexa(c.accent,.15)};font-size:.98em;font-weight:700;
 padding:.3em .2em;font-variant-numeric:tabular-nums;transition:background .12s}
.ant button.ja{background:${c.accent};color:${oa}}
.ant button.nein{background:${hexa(c.text,.16)};opacity:.55}
.rueck{flex:0 0 auto;font-size:.74em;font-weight:600;min-height:1.1em;line-height:1.1;color:${c.accent}}
.pkt{flex:0 0 auto;font-size:.62em;opacity:.55;line-height:1.1;font-variant-numeric:tabular-nums}`;
    const html = `${c.top?`<p class="ttl">${esc(c.top)}</p>`:''}
<div class="an"><svg viewBox="0 0 100 100" aria-hidden="true">
<circle cx="50" cy="50" r="46" fill="${hexa(c.accent,.1)}" stroke="${c.accent}" stroke-width="2.5"/>
${ticks}${zahlen}
<line id="hh" x1="50" y1="50" x2="50" y2="29" stroke="${c.text}" stroke-width="4.4" stroke-linecap="round"/>
<line id="mi" x1="50" y1="50" x2="50" y2="18" stroke="${c.accent}" stroke-width="2.8" stroke-linecap="round"/>
<circle cx="50" cy="50" r="3.2" fill="${c.accent}"/>
</svg></div>
<div class="ant" id="ant"></div>
<div class="rueck" id="rueck"></div>
${c.punkte?'<div class="pkt" id="pkt"></div>':''}`;
    const js = `var SCHRITT=${schritt};
var hh=document.getElementById('hh'), mi=document.getElementById('mi');
var ant=document.getElementById('ant'), rueck=document.getElementById('rueck'), pkt=document.getElementById('pkt');
var richtig=0, gesamt=0, loesung=0, offen=true;
function p2(n){return n<10?'0'+n:''+n}
function txt(m){ var h=Math.floor(m/60)%12; if(h===0)h=12; return h+':'+p2(m%60) }
function zeige(m){
  var h=(Math.floor(m/60)%12)*30 + (m%60)*.5, w=(m%60)*6;
  hh.setAttribute('transform','rotate('+h+' 50 50)');
  mi.setAttribute('transform','rotate('+w+' 50 50)');
}
function mische(a){ for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t} return a }
function neu(){
  offen=true; rueck.textContent='';
  var stufen=Math.floor(60/SCHRITT);
  loesung=(Math.floor(Math.random()*12)*60) + (Math.floor(Math.random()*stufen)*SCHRITT);
  var menge=[loesung];
  var versuche=0;
  while(menge.length<4 && versuche<60){
    versuche++;
    var art=Math.floor(Math.random()*3), kand;
    if(art===0) kand=loesung + (Math.random()<.5?60:-60);
    else if(art===1) kand=loesung + (Math.random()<.5?SCHRITT:-SCHRITT);
    else kand=(Math.floor(Math.random()*12)*60) + (Math.floor(Math.random()*stufen)*SCHRITT);
    kand=((kand%720)+720)%720;
    if(menge.indexOf(kand)<0) menge.push(kand);
  }
  while(menge.length<4) menge.push((menge[menge.length-1]+SCHRITT)%720);
  menge=mische(menge);
  zeige(loesung);
  ant.innerHTML='';
  menge.forEach(function(m){
    var b=document.createElement('button');
    b.type='button'; b.textContent=txt(m);
    b.onclick=function(){ pruefe(m,b) };
    ant.appendChild(b);
  });
}
function pruefe(m,b){
  if(!offen) return;
  offen=false; gesamt++;
  if(m===loesung){
    richtig++; b.className='ja'; rueck.textContent=${jstr(c.lob)};
    setTimeout(neu,1100);
  } else {
    b.className='nein'; rueck.textContent=${jstr(c.trost)};
    [].forEach.call(ant.children,function(x){ if(x.textContent===txt(loesung)) x.className='ja' });
    setTimeout(neu,2000);
  }
  if(pkt) pkt.textContent=richtig+' von '+gesamt+' richtig';
}
neu();`;
    return shell(c, c.top||'Uhrzeit üben', html, css, js, 13, 11);
  }
},

rechnen:{
  name:'Rechnen üben', icon:'➗', folder:'rechnen',
  desc:'Kopfrechnen und Einmaleins mit Antworttasten, Punkten und Serie.',
  variants:[
    {k:'plus20', n:'Plus bis 20', d:'Zusammenzählen im Zahlenraum bis 20. Erste Klasse.'},
    {k:'minus20', n:'Minus bis 20', d:'Abziehen im Zahlenraum bis 20, nie unter null.'},
    {k:'gemischt100', n:'Plus und Minus bis 100', d:'Gemischt im Zahlenraum bis 100. Zweite Klasse.'},
    {k:'einmaleins', n:'Einmaleins', d:'Malnehmen. Reihe frei wählbar oder gemischt.'},
    {k:'geteilt', n:'Geteilt', d:'Teilen ohne Rest, passend zur gewählten Reihe.'}
  ],
  fields:[
    {k:'top',t:'text',label:'Überschrift',def:'Rechnen üben'},
    {k:'reihe',t:'number',label:'Reihe (0 heißt gemischt)',def:0,min:0,max:10},
    {k:'lob',t:'text',label:'Text bei richtig',def:'Super!'},
    {k:'trost',t:'text',label:'Text bei falsch',def:'Fast! Probier die nächste.'},
    {k:'serie',t:'bool',label:'Serie zeigen',def:true}
  ],
  build(c){
    const oa = onAccent(c), v = c.variant;
    const css = `.card{justify-content:space-evenly}
.auf{font-size:2.4em;font-weight:700;line-height:1;font-variant-numeric:tabular-nums;flex:0 0 auto}
.ant{display:grid;grid-template-columns:repeat(3,1fr);gap:.3em;width:100%;flex:0 0 auto}
.ant button{border:none;border-radius:.5em;background:${hexa(c.accent,.15)};font-size:1.35em;font-weight:700;
 padding:.45em .2em;font-variant-numeric:tabular-nums;transition:background .12s}
.ant button.ja{background:${c.accent};color:${oa}}
.ant button.nein{background:${hexa(c.text,.16)};opacity:.55}
.rueck{flex:0 0 auto;font-size:.82em;font-weight:600;min-height:1.3em;color:${c.accent}}
.pkt{flex:0 0 auto;font-size:.68em;opacity:.55;font-variant-numeric:tabular-nums}`;
    const html = `${c.top?`<p class="ttl">${esc(c.top)}</p>`:''}
<div class="auf" id="auf">…</div>
<div class="ant" id="ant"></div>
<div class="rueck" id="rueck"></div>
${c.serie?'<div class="pkt" id="pkt"></div>':''}`;
    const js = `var ART=${jstr(v)}, REIHE=${Number(c.reihe)||0};
var auf=document.getElementById('auf'), ant=document.getElementById('ant');
var rueck=document.getElementById('rueck'), pkt=document.getElementById('pkt');
var richtig=0, gesamt=0, serie=0, best=0, loesung=0, offen=true;
function zz(n){ return Math.floor(Math.random()*n) }
function mische(a){ for(var i=a.length-1;i>0;i--){var j=zz(i+1);var t=a[i];a[i]=a[j];a[j]=t} return a }
function aufgabe(){
  var a,b,text;
  if(ART==='plus20'){ a=1+zz(18); b=1+zz(20-a); loesung=a+b; text=a+' + '+b; }
  else if(ART==='minus20'){ a=2+zz(19); b=1+zz(a); loesung=a-b; text=a+' − '+b; }
  else if(ART==='gemischt100'){
    if(Math.random()<.5){ a=2+zz(89); b=1+zz(100-a); loesung=a+b; text=a+' + '+b; }
    else { a=10+zz(91); b=1+zz(a); loesung=a-b; text=a+' − '+b; }
  }
  else if(ART==='einmaleins'){ a=REIHE>0?REIHE:1+zz(10); b=1+zz(10); loesung=a*b; text=a+' × '+b; }
  else { b=REIHE>0?REIHE:2+zz(9); var e=1+zz(10); a=b*e; loesung=e; text=a+' ÷ '+b; }
  return text;
}
function neu(){
  offen=true; rueck.textContent='';
  auf.textContent=aufgabe()+' =';
  var menge=[loesung], versuche=0;
  while(menge.length<3 && versuche<60){
    versuche++;
    var d=1+zz(Math.max(3,Math.round(loesung*.25)));
    var kand=loesung + (Math.random()<.5?d:-d);
    if(kand>=0 && menge.indexOf(kand)<0) menge.push(kand);
  }
  while(menge.length<3) menge.push(loesung + menge.length);
  menge=mische(menge);
  ant.innerHTML='';
  menge.forEach(function(z){
    var b=document.createElement('button');
    b.type='button'; b.textContent=z;
    b.onclick=function(){ pruefe(z,b) };
    ant.appendChild(b);
  });
}
function pruefe(z,b){
  if(!offen) return;
  offen=false; gesamt++;
  if(z===loesung){
    richtig++; serie++; if(serie>best)best=serie;
    b.className='ja';
    rueck.textContent = serie>=3 ? (${jstr(c.lob)}+' '+serie+' in Folge') : ${jstr(c.lob)};
    setTimeout(neu,900);
  } else {
    serie=0; b.className='nein';
    rueck.textContent=${jstr(c.trost)};
    [].forEach.call(ant.children,function(x){ if(+x.textContent===loesung) x.className='ja' });
    setTimeout(neu,1800);
  }
  if(pkt) pkt.textContent=richtig+' von '+gesamt+' richtig, beste Serie '+best;
}
neu();`;
    return shell(c, c.top||'Rechnen üben', html, css, js, 10, 11);
  }
},
gruss:{
  name:'Begrüßung', icon:'👋', folder:'gruss',
  desc:'Begrüßt mit Namen, der Text wechselt nach Tageszeit.',
  variants:[
    {k:'mitte', n:'Zentriert', d:'Emoji oben, Gruß groß darunter.'},
    {k:'zeile', n:'Eine Zeile', d:'Emoji links, Text daneben, sehr flach.'},
    {k:'uhr', n:'Mit Uhrzeit', d:'Gruß links, Uhrzeit groß rechts.'},
    {k:'tagesziel', n:'Mit Tagesziel', d:'Gruß plus ein Feld für das Ziel von heute.'}
  ],
  fields:[
    {k:'name',t:'text',label:'Name',def:'Alicia'},
    {k:'m',t:'text',label:'Morgens',def:'Guten Morgen'},
    {k:'a',t:'text',label:'Nachmittags',def:'Schön, dass du da bist'},
    {k:'e',t:'text',label:'Abends',def:'Guten Abend'},
    {k:'sub',t:'text',label:'Zeile darunter',def:'Heute wird ein guter Tag'},
    {k:'emoji',t:'text',label:'Emoji',def:'🐰'}
  ],
  build(c){
    const v = c.variant;
    let css = `.card{justify-content:space-evenly}
.hi{font-size:1.9em;font-weight:700;line-height:1.1;text-wrap:balance;flex:0 0 auto}
.nm{color:${c.accent}}
.sb{font-size:.95em;opacity:.7;flex:0 0 auto;line-height:1.2}
.em{font-size:2.4em;line-height:1;flex:0 0 auto}`;
    let html = `${c.emoji?`<div class="em">${esc(c.emoji)}</div>`:''}
<div class="hi"><span id="g">Hallo</span> <span class="nm">${esc(c.name)}</span></div>
${c.sub?`<div class="sb">${esc(c.sub)}</div>`:''}`;
    let js = `var h=new Date().getHours();
document.getElementById('g').textContent = h<11 ? ${jstr(c.m)} : (h<18 ? ${jstr(c.a)} : ${jstr(c.e)});`;

    if(v==='zeile'){
      css += `.card{flex-direction:row;gap:.55em;align-items:center;justify-content:flex-start;text-align:left}
.em{font-size:1.6em;flex:0 0 auto}.hi{font-size:1.2em}.sb{display:none}`;
    }
    if(v==='uhr'){
      css += `.card{flex-direction:row;gap:.8em;align-items:center;text-align:left;justify-content:space-between}
.lf{flex:1;min-width:0;display:flex;flex-direction:column;gap:.06em}
.tm{flex:0 0 auto;font-size:2.9em;font-weight:700;font-variant-numeric:tabular-nums;line-height:1}
.hi{font-size:1.3em}`;
      html = `<div class="lf">${c.emoji?`<div class="em" style="font-size:1.5em">${esc(c.emoji)}</div>`:''}
<div class="hi"><span id="g">Hallo</span> <span class="nm">${esc(c.name)}</span></div>
${c.sub?`<div class="sb">${esc(c.sub)}</div>`:''}</div>
<div class="tm" id="tm">--:--</div>`;
      js += `
function p2(n){return n<10?'0'+n:''+n}
function ck(){var n=new Date();document.getElementById('tm').textContent=p2(n.getHours())+':'+p2(n.getMinutes())}
ck();setInterval(ck,30000);`;
    }
    if(v==='tagesziel'){
      css += `
.goal{width:100%;flex:0 0 auto}
.goal label{display:block;font-size:.62em;letter-spacing:.08em;text-transform:uppercase;opacity:.55;margin-bottom:.2em;text-align:left}
.goal input{width:100%;font-family:inherit;font-size:1em;color:inherit;background:${hexa(c.accent,.12)};
 border:.1em solid ${hexa(c.accent,.3)};border-radius:.45em;padding:.35em .55em;outline:none}
.goal input::placeholder{color:${hexa(c.text,.42)}}`;
      html += `
<div class="goal"><label for="gz">Mein Ziel für heute</label>
<input id="gz" type="text" placeholder="Zum Beispiel: Lesen üben"></div>`;
      js = `${store}` + js + `
var gz=document.getElementById('gz'),K='goal_v1';
var g=ld(K,{d:'',v:''});if(g.d!==today())g={d:today(),v:''};
gz.value=g.v;
gz.addEventListener('input',function(){sv(K,{d:today(),v:gz.value})});`;
    }
    const fd = v==='zeile' ? 5 : (v==='uhr' ? 7 : 10);
    const fw = v==='zeile' ? 18 : (v==='uhr' ? 19 : 14);
    return shell(c, 'Begrüßung ' + (c.name||''), html, css, js, fd, fw);
  }
}
};


