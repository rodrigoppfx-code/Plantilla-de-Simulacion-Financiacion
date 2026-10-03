// Mejoras de experiencia SOLO para la pagina publica de precios (precios-avovite).
// No toca calculos, precios ni la app de asesoras. Se inyecta en api/prices.js,
// por eso sobrevive a la regeneracion de lib/public-prices.cjs.

const css = `
.av-hint{display:flex;align-items:center;justify-content:center;gap:8px;margin:0 auto -4px;padding:9px 16px;border-radius:999px;background:#1F4D2B;color:#fff;font-size:14px;font-weight:600;width:max-content;max-width:100%;text-align:center;box-shadow:0 6px 18px rgba(31,77,43,.22);animation:avPulse 1.8s ease-in-out infinite}
.av-hint .av-ico{display:inline-block;animation:avTap 1.2s ease-in-out infinite}
html.av-picked .av-hint{display:none}
@keyframes avPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
@keyframes avTap{0%,100%{transform:translateY(0)}50%{transform:translateY(4px)}}
button[data-tier]{transition:transform .15s ease,box-shadow .15s ease}
@media (hover:hover){button[data-tier]:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(23,35,26,.10)}}
.av-wrap{position:relative}
.av-wrap::after{content:"";position:absolute;top:1px;right:1px;bottom:1px;width:44px;pointer-events:none;border-radius:0 12px 12px 0;background:linear-gradient(to right,rgba(244,242,235,0),rgba(23,35,26,.16));opacity:0;transition:opacity .2s}
.av-wrap.av-more::after{opacity:1}
.av-bar{display:none;align-items:center;gap:10px;user-select:none;-webkit-user-select:none}
.av-track{position:relative;flex:1;height:14px;border-radius:7px;background:#E4DECC;touch-action:none;cursor:pointer}
.av-thumb{position:absolute;top:0;left:0;height:14px;min-width:44px;border-radius:7px;background:#1F4D2B;cursor:grab;touch-action:none;box-shadow:0 1px 3px rgba(0,0,0,.25)}
.av-thumb:active{cursor:grabbing;background:#2E6B3A}
.av-thumb::before{content:"";position:absolute;inset:-12px -4px}
.av-lbl{flex:none;font-size:12px;font-weight:700;color:#1F4D2B;white-space:nowrap}
.av-lbl .av-hand{display:inline-block;animation:avSwipe 1.4s ease-in-out infinite}
.av-done .av-lbl{opacity:.55}
.av-done .av-lbl .av-hand{animation:none}
@keyframes avSwipe{0%,100%{transform:translateX(-3px)}50%{transform:translateX(5px)}}
[data-scroll],[data-r~=pr-table]{scrollbar-width:thin;scrollbar-color:#1F4D2B #E4DECC}
@media (prefers-reduced-motion:reduce){.av-hint,.av-hint .av-ico,.av-lbl .av-hand{animation:none}}
`;

const js = `(function(){
var main=document.querySelector('main');if(!main)return;
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
var swiped=false;
function sel(){return main.querySelectorAll('[data-scroll], [data-r="pr-table"]');}
function update(sc){
  var wrap=sc.parentNode;if(!wrap.classList.contains('av-wrap'))return;
  var max=sc.scrollWidth-sc.clientWidth,ov=max>2;
  wrap.classList.toggle('av-ov',ov);
  wrap.classList.toggle('av-more',ov&&sc.scrollLeft<max-4);
  wrap.parentNode.querySelectorAll('.av-bar[data-for="'+wrap.dataset.id+'"]').forEach(function(bar){
    bar.style.display=ov?'flex':'none';if(!ov)return;
    var track=bar.querySelector('.av-track'),thumb=bar.querySelector('.av-thumb');
    var tw=track.clientWidth,w=Math.max(44,tw*sc.clientWidth/sc.scrollWidth);
    thumb.style.width=w+'px';
    thumb.style.transform='translateX('+((tw-w)*(sc.scrollLeft/max))+'px)';
    bar.classList.toggle('av-done',swiped);
  });
}
var uid=0;
function makeBar(sc,wrap,before){
  var bar=document.createElement('div');bar.className='av-bar';bar.dataset.for=wrap.dataset.id;
  bar.style.margin=before?'0 0 8px':'8px 0 0';
  bar.innerHTML='<div class="av-track" aria-hidden="true"><div class="av-thumb"></div></div><span class="av-lbl"><span class="av-hand">👉</span> Desliza</span>';
  wrap.parentNode.insertBefore(bar,before?wrap:wrap.nextSibling);
  var track=bar.querySelector('.av-track'),thumb=bar.querySelector('.av-thumb'),drag=null;
  function toScroll(x){var tw=track.clientWidth,w=thumb.offsetWidth,max=sc.scrollWidth-sc.clientWidth;sc.scrollLeft=Math.max(0,Math.min(1,x/(tw-w)))*max;}
  thumb.addEventListener('pointerdown',function(e){e.preventDefault();e.stopPropagation();drag={x:e.clientX,l:new DOMMatrix(getComputedStyle(thumb).transform).m41};try{thumb.setPointerCapture(e.pointerId);}catch(_){}});
  thumb.addEventListener('pointermove',function(e){if(!drag)return;swiped=true;toScroll(drag.l+e.clientX-drag.x);});
  thumb.addEventListener('pointerup',function(){drag=null;});
  thumb.addEventListener('pointercancel',function(){drag=null;});
  track.addEventListener('pointerdown',function(e){if(e.target!==track)return;var r=track.getBoundingClientRect();swiped=true;toScroll(e.clientX-r.left-thumb.offsetWidth/2);});
}
function enhance(){
  sel().forEach(function(sc){
    if(sc.parentNode.classList.contains('av-wrap'))return;
    var wrap=document.createElement('div');wrap.className='av-wrap';
    sc.parentNode.insertBefore(wrap,sc);wrap.appendChild(sc);
    wrap.dataset.id='w'+(++uid);
    makeBar(sc,wrap,true);makeBar(sc,wrap,false);
    sc.addEventListener('scroll',function(){if(sc.scrollLeft>8)swiped=true;update(sc);},{passive:true});
    update(sc);
  });
  var grid=main.querySelector('button[data-tier]');
  if(grid&&!main.querySelector('.av-hint')){
    var h=document.createElement('div');h.className='av-hint';h.setAttribute('role','note');
    h.innerHTML='<span class="av-ico">👇</span> Selecciona tu plan y mira tus beneficios';
    grid.parentNode.parentNode.insertBefore(h,grid.parentNode);
  }
}
function showColumn(name){
  var sc=main.querySelector('[data-scroll]');if(!sc||sc.scrollWidth<=sc.clientWidth)return;
  var g=sc.firstElementChild,heads=Array.prototype.slice.call(g.children,1,5);
  var i=heads.findIndex(function(c){return c.textContent.indexOf(name)>-1&&c.textContent.replace('Tu categoría','').trim()===name;});
  if(i<0)return;var cell=heads[i],lab=g.children[0].offsetWidth;
  var target=cell.offsetLeft-lab-(sc.clientWidth-lab-cell.offsetWidth)/2;
  sc.scrollTo({left:Math.max(0,target),behavior:reduce?'auto':'smooth'});
}
main.addEventListener('click',function(e){
  var b=e.target.closest('[data-tier]');if(!b)return;
  var name=b.dataset.tier;document.documentElement.classList.add('av-picked');
  enhance();
  var h=document.getElementById('price-benefits');
  if(h)h.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});
  setTimeout(function(){showColumn(name);},reduce?0:350);
});
new MutationObserver(function(){enhance();}).observe(main,{childList:true});
window.addEventListener('resize',function(){sel().forEach(update);});
enhance();
})();`;

function enhanceHtml(html) {
  return html
    .replace('</style></head>', css + '</style></head>')
    .replace(/<\/body><\/html>\s*$/, '<script>' + js + '</script></body></html>');
}

module.exports = { enhanceHtml };
