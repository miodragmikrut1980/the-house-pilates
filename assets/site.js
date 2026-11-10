(()=>{
const rm=matchMedia('(prefers-reduced-motion: reduce)').matches;
const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];

/* hero ulaz */
const hero=$('.hero,.p-hero');
if(hero) requestAnimationFrame(()=>setTimeout(()=>hero.classList.add('on'),120));

/* zaglavlje + dock */
const top=$('#top'), dock=$('#dock');
let last=-1;
const onScroll=()=>{const y=scrollY; const s=y>40; if(s!==last){top.classList.toggle('scrolled',s); last=s;} if(dock) dock.classList.toggle('vidi', y>innerHeight*.7 && (innerHeight+y)<document.body.scrollHeight-500);};
addEventListener('scroll',onScroll,{passive:true}); onScroll();

/* meni za telefon */
const mb=$('.menu-btn'), mm=$('#meni');
if(mb&&mm){
  const zatvori=()=>{mm.classList.remove('otvoren'); mb.setAttribute('aria-expanded','false'); document.body.classList.remove('meni-on');};
  mb.addEventListener('click',()=>{const o=!mm.classList.contains('otvoren'); mm.classList.toggle('otvoren',o); mb.setAttribute('aria-expanded',String(o)); document.body.classList.toggle('meni-on',o); if(o) $('a',mm).focus();});
  $$('a',mm).forEach(a=>a.addEventListener('click',zatvori));
  addEventListener('keydown',e=>{if(e.key==='Escape'&&mm.classList.contains('otvoren')){zatvori(); mb.focus();}});
}

/* reveal sa malim razmakom među susedima */
const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){const el=e.target; const sib=el.parentElement?[...el.parentElement.children].filter(c=>c.classList.contains('r')):[]; const i=Math.max(0,sib.indexOf(el)); el.style.transitionDelay=(rm?0:Math.min(i,5)*90)+'ms'; el.classList.add('in'); io.unobserve(el);}})},{rootMargin:'0px 0px -8% 0px',threshold:.12});
$$('.r').forEach(el=>io.observe(el));

/* brojač */
const cnt=new IntersectionObserver(es=>{es.forEach(e=>{if(!e.isIntersecting)return; const b=e.target, n=+b.dataset.broj, plus=b.dataset.plus||''; cnt.unobserve(b); if(rm){b.textContent=n+plus;return;} const t0=performance.now(); const step=t=>{const p=Math.min(1,(t-t0)/1600); const v=Math.round(n*(1-Math.pow(1-p,3))); b.textContent=v+(p===1?plus:''); if(p<1)requestAnimationFrame(step)}; requestAnimationFrame(step);})},{threshold:.6});
$$('[data-broj]').forEach(b=>cnt.observe(b));

/* vreme u Novom Sadu */
const sad=()=>{const f=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Belgrade',weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date()); const g=k=>f.find(p=>p.type===k).value; const wd={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[g('weekday')]; return {d:wd,h:+g('hour')+ +g('minute')/60};};
const now=sad();
const radno={1:[8,22],2:[8,22],3:[8,22],4:[8,22],5:[8,22],6:[8,13],0:null};
const st=$('#status');
if(st){const r=radno[now.d]; const open=r&&now.h>=r[0]&&now.h<r[1]; st.innerHTML=open?`<span class="dot"></span><span>Otvoreno sada · do ${r[1]}h</span>`:`<span class="dot zat"></span><span>Sada zatvoreno · ${now.d===6||now.d===0?'otvaramo u ponedeljak u 8h':'otvaramo u 8h'}</span>`;}
const tr=$(`#sati tr[data-d="${now.d}"]`); if(tr) tr.classList.add('danas');

/* vodič kroz sobe */
const grid=$('#grid-sobe'), odg=$('#vodic-odgovor');
if(grid) $$('.chip').forEach(c=>c.addEventListener('click',()=>{const on=c.getAttribute('aria-pressed')!=='true'; $$('.chip').forEach(x=>x.setAttribute('aria-pressed','false')); $$('.soba').forEach(s=>s.classList.remove('pogodak')); if(on){c.setAttribute('aria-pressed','true'); grid.classList.add('filtrirano'); const s=$(`.soba[data-id="${c.dataset.soba}"]`); s.classList.add('pogodak'); odg.textContent=c.dataset.txt;} else {grid.classList.remove('filtrirano'); odg.textContent='';}}));

/* KUĆNI RASPORED (sa pilates.rs/raspored) */
const R={
 mini:{kap:5,naziv:'Mini grupa',termini:{1:['09:00','18:00','19:00'],2:['10:00','18:00','19:00'],3:['18:00','19:00'],4:['10:00','18:00','19:00'],5:['10:00','19:00']}},
 velika:{kap:10,naziv:'Pilates',termini:{1:['08:00','18:00','19:00'],2:['18:00'],3:['08:00','18:00','19:00'],4:['18:00'],5:['08:00','18:00','19:00']}}
};
const dani=['','Ponedeljak','Utorak','Sreda','Četvrtak','Petak'], krat=['','Pon','Uto','Sre','Čet','Pet'];
let vrsta='mini', izbor=null, sediste=null;
const zauzeto=(v,d,t)=>{const s=(d*31+parseInt(t)*7+(v==='mini'?3:5))%(v==='mini'?4:7); return v==='mini'?Math.min(4,s+ (t==='19:00'?1:0)):s+2;};
const slob=n=>{const d=n%10,s=n%100;return (d===1&&s!==11)?'slobodno':(d>=2&&d<=4&&(s<12||s>14))?'slobodna':'slobodnih'};
const nazivTermina=(v,d,t)=>v==='velika'&&t==='19:00'?'Weight loss':R[v].naziv;
const nedelja=$('#nedelja');
function crtaj(){
  if(!nedelja) return;
  $('#legenda-txt').textContent=vrsta==='mini'?'Mini grupa: najviše 5 osoba, na spravama.':'Velika grupa: pilates na strunjačama, sa rekvizitima.';
  nedelja.innerHTML=[1,2,3,4,5].map(d=>{const t=R[vrsta].termini[d]||[]; const danas=d===now.d;
    return `<div class="dan${danas?' danas':''}"><h3>${krat[d]}${danas?'<b class="dn">danas</b>':''}</h3><div class="t-red">${t.length?t.map(h=>{const z=zauzeto(vrsta,d,h), k=R[vrsta].kap, sl=k-z; const sel=izbor&&izbor.d===d&&izbor.t===h&&izbor.v===vrsta;
      return `<button class="termin" aria-pressed="${sel}" data-d="${d}" data-t="${h}" aria-label="${dani[d]} ${h}, ${nazivTermina(vrsta,d,h)}, slobodno ${sl} od ${k}"><b>${h}</b><span>${nazivTermina(vrsta,d,h)} · ${sl} ${slob(sl)}</span>${vrsta==='mini'?`<span class="mesta-mini" aria-hidden="true">${Array.from({length:k},(_,i)=>`<b class="${i<z?'z':''}"></b>`).join('')}</span>`:''}</button>`}).join(''):'<p class="prazan">Nema grupnih termina. Individualni po dogovoru.</p>'}</div></div>`}).join('');
  $$('.termin',nedelja).forEach(b=>b.addEventListener('click',()=>izaberi(+b.dataset.d,b.dataset.t)));
}
function izaberi(d,t){
  izbor={v:vrsta,d,t}; sediste=null;
  $$('.termin',nedelja).forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.d===d&&b.dataset.t===t)));
  const z=zauzeto(vrsta,d,t);
  $('#izabrano').textContent=`${dani[d]}, ${t} · ${nazivTermina(vrsta,d,t)}`;
  const sed=$('#sedista');
  const zz=vrsta==='mini'?z:Math.round(z/2);
  sed.innerHTML=Array.from({length:5},(_,i)=>`<button type="button" class="sediste" ${i<zz?'disabled':''} aria-pressed="false" aria-label="${i<zz?'Zauzeto':'Slobodno mesto '+(i+1)}"><span>${i<zz?'':i+1}</span></button>`).join('');
  $('#sed-opis').textContent=vrsta==='mini'?`Slobodno ${5-z} od 5 mesta za spravama. Izaberi svoje.`:`Grupa na strunjačama, slobodno ${R.velika.kap-z} mesta.`;
  $$('.sediste',sed).forEach((b,i)=>b.addEventListener('click',()=>{ $$('.sediste',sed).forEach(x=>x.setAttribute('aria-pressed','false')); b.setAttribute('aria-pressed','true'); sediste=i+1; $('#sed-opis').textContent=vrsta==='mini'?`Mesto ${i+1} je tvoje dok ne potvrdiš.`:'Mesto je sačuvano dok ne potvrdiš.';}));
  const prvo=$('.sediste:not(:disabled)',sed); if(prvo) prvo.click();
}
if(nedelja){
  crtaj();
  const d=(now.d>=1&&now.d<=5)?now.d:1; const t=R.mini.termini[d]; izaberi(d,t[t.length>1?1:0]);
  nedelja.addEventListener('click',e=>{if(e.isTrusted&&e.target.closest('.termin')&&innerWidth<1100) $('#kljuc').scrollIntoView({behavior:rm?'auto':'smooth',block:'start'});});
}

/* prekidači sa klizačem */
const klizac=p=>{const b=$('[aria-selected="true"]',p), k=$('.klizac',p); k.style.width=b.offsetWidth+'px'; k.style.transform=`translateX(${b.offsetLeft-5}px)`;};
$$('.prekidac').forEach(p=>{klizac(p); $$('button',p).forEach(b=>b.addEventListener('click',()=>{$$('button',p).forEach(x=>x.setAttribute('aria-selected','false')); b.setAttribute('aria-selected','true'); klizac(p); if(p.dataset.prekidac==='rasp'){vrsta=b.dataset.vrsta; crtaj();} else {$$('.cena-panel').forEach(x=>x.hidden=x.id!==b.dataset.panel);} }));});
addEventListener('resize',()=>$$('.prekidac').forEach(klizac));
document.fonts&&document.fonts.ready.then(()=>$$('.prekidac').forEach(klizac));

/* validacija i forme (demo: ništa se ne šalje) */
const proveri=(inp,msg)=>{const g=inp.parentElement.querySelector('.greska'); const ok=inp.type==='tel'?/^[+0-9 ()\/-]{8,}$/.test(inp.value.trim()):inp.value.trim().length>1; g.textContent=ok?'':msg; inp.setAttribute('aria-invalid',String(!ok)); return ok;};
const fr=$('#forma-rez');
if(fr) fr.addEventListener('submit',e=>{e.preventDefault(); const a=proveri($('#r-ime'),'Upiši ime i prezime.'), b=proveri($('#r-tel'),'Upiši broj telefona, npr. 064 123 4567.'); if(!izbor){$('#izabrano').textContent='Prvo izaberi termin u rasporedu.';return;} if(a&&b){$('#potvrda-txt').textContent=`${dani[izbor.d]}, ${izbor.t}${sediste&&izbor.v==='mini'?`, mesto ${sediste}`:''}. Vidimo se u kući, ${$('#r-ime').value.trim().split(' ')[0]}.`; $('#kljuc').classList.add('gotovo'); requestAnimationFrame(()=>$('#kljuc .potvrda').classList.add('in'));}});
$$('.forma').forEach(f=>{const form=$('form',f); if(!form) return; form.addEventListener('submit',e=>{e.preventDefault(); const ok=$$('input[required]',form).map(i=>proveri(i,i.type==='tel'?'Upiši broj telefona.':'Upiši ime.')).every(Boolean); if(ok){f.classList.add('gotovo'); f.scrollIntoView({behavior:rm?'auto':'smooth',block:'center'});}});});

/* mapa: učitaj tek na klik (bez kolačića pre pristanka) */
$$('.mapa-ucitaj').forEach(b=>b.addEventListener('click',()=>{const m=b.closest('.mapa'); m.innerHTML=`<iframe title="Mapa: THE HOUSE Pilates, Vojvode Mišića 1, Novi Sad" src="https://www.google.com/maps?q=Vojvode+Mi%C5%A1i%C4%87a+1,+21000+Novi+Sad&z=16&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>`; m.classList.add('ziva');}));

/* godina u futeru */
$$('[data-godina]').forEach(e=>e.textContent=new Date().getFullYear());
})();

/* v2: dock se sklanja dok skroluješ nadole, vraća se kad kreneš nagore */
(()=>{const d=document.getElementById('dock'); if(!d) return; let y0=scrollY;
addEventListener('scroll',()=>{const y=scrollY; if(Math.abs(y-y0)<8) return; d.classList.toggle('skriven', y>y0); y0=y;},{passive:true});})();
/* v2: otkrij sve što je već iznad dna ekrana (brz skrol, skok na sidro) */
(()=>{const f=()=>{const h=innerHeight;document.querySelectorAll('.r:not(.in)').forEach(e=>{if(e.getBoundingClientRect().top<h)e.classList.add('in')})};addEventListener('scroll',f,{passive:true});addEventListener('load',f);})();
/* v2: na telefonu raspored po jedan dan */
(()=>{const ned=document.getElementById('nedelja'); if(!ned) return;
const imena=['Pon','Uto','Sre','Čet','Pet'], puna=['Ponedeljak','Utorak','Sreda','Četvrtak','Petak'];
const t=document.createElement('div'); t.className='dani-tabs'; t.setAttribute('role','group'); t.setAttribute('aria-label','Izaberi dan');
let akt=Math.max(0,[...ned.children].findIndex(d=>d.classList.contains('danas')));
t.innerHTML=imena.map((n,i)=>`<button type="button" aria-pressed="${i===akt}" aria-label="${puna[i]}">${n}</button>`).join('');
ned.parentNode.insertBefore(t,ned);
const primeni=()=>{[...ned.children].forEach((d,i)=>d.classList.toggle('aktivan',i===akt)); [...t.children].forEach((b,i)=>b.setAttribute('aria-pressed',String(i===akt))); if(innerWidth<=760){const d=ned.children[akt]; if(d&&!d.querySelector('.termin[aria-pressed="true"]')){const x=d.querySelector('.termin'); if(x) setTimeout(()=>x.click(),0);}}};
t.addEventListener('click',e=>{const b=e.target.closest('button'); if(!b) return; akt=[...t.children].indexOf(b); primeni();});
new MutationObserver(primeni).observe(ned,{childList:true}); primeni();})();
