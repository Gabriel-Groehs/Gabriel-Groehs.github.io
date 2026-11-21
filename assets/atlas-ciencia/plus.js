/* Atlas Plus — motor compartilhado dos três atlas de estudo (Hull, Séries Temporais, Deep Credit Risk).
   Conceitos com tooltip, livro 3D que folheia, fórmulas anotadas, fluxogramas animados,
   gráficos em canvas com transição e simuladores declarativos. Sem dependências externas.
   Os arquivos plus-<livro>.js registram conceitos (PLUS.cx) e simuladores (PLUS.sim) antes deste. */
(()=>{'use strict';
const P=window.PLUS=window.PLUS||{};
const RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
P.RM=RM;P.$=$;P.$$=$$;P.esc=esc;

/* ---------- números e estatística ---------- */
const fmt=(v,d=2)=>Number.isFinite(+v)?Number(v).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
P.f=fmt;
P.pct=(v,d=1)=>fmt(v*100,d)+'%';
P.money=(v,d=1,u='R$ ')=>(v<0?'−':'')+u+fmt(Math.abs(v),d);
P.sgn=(v,d=2)=>(v>0?'+':v<0?'−':'')+fmt(Math.abs(v),d);
P.n=(v,d=2,suf='')=>`<span class="n">${typeof v==='string'?v:fmt(v,d)}${suf}</span>`;
P.clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
P.lerp=(a,b,t)=>a+(b-a)*t;
P.rng=seed=>{let a=seed>>>0||1;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};
P.randn=r=>{let u=0,v=0;while(u===0)u=r();while(v===0)v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)};
P.npdf=x=>Math.exp(-x*x/2)/2.5066282746310002;
P.N=x=>{const t=1/(1+.2316419*Math.abs(x)),d=.3989422804014327*Math.exp(-x*x/2);const p=d*t*(.31938153+t*(-.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));return x>0?1-p:p};
P.Ninv=p=>{p=P.clamp(p,1e-12,1-1e-12);const a=[-39.69683028665376,220.9460984245205,-275.9285104469687,138.357751867269,-30.66479806614716,2.506628277459239],b=[-54.47609879822406,161.5858368580409,-155.6989798598866,66.80131188771972,-13.28068155211027],c=[-.007784894002430293,-.3223964580411365,-2.400758277161838,-2.549732539343734,4.374664141464968,2.938163982698783],d=[.007784695709041462,.3224671290700398,2.445134137142996,3.754408661907416],pl=.02425;let q,r;
 if(p<pl){q=Math.sqrt(-2*Math.log(p));return(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)}
 if(p>1-pl){q=Math.sqrt(-2*Math.log(1-p));return-(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)}
 q=p-.5;r=q*q;return(((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1)};
P.mean=a=>a.reduce((s,x)=>s+x,0)/(a.length||1);
P.sd=a=>{const m=P.mean(a);return Math.sqrt(a.reduce((s,x)=>s+(x-m)**2,0)/Math.max(1,a.length-1))};
P.quantile=(sorted,p)=>{if(!sorted.length)return NaN;const v=(sorted.length-1)*p,i=Math.floor(v),j=Math.min(sorted.length-1,i+1);return sorted[i]+(sorted[j]-sorted[i])*(v-i)};
P.linspace=(a,b,n)=>Array.from({length:n},(_,i)=>a+(b-a)*i/(n-1));
P.hist=(data,bins,lo,hi)=>{lo=lo??Math.min(...data);hi=hi??Math.max(...data);const w=(hi-lo)/bins||1,c=new Array(bins).fill(0);for(const x of data){const k=Math.floor((x-lo)/w);if(k>=0&&k<bins)c[k]++;else if(x===hi)c[bins-1]++}return c.map((n,i)=>[lo+(i+.5)*w,n])};
P.acf=(x,lags)=>{const n=x.length,m=P.mean(x);let c0=0;for(const v of x)c0+=(v-m)**2;const out=[];for(let k=1;k<=lags;k++){let s=0;for(let t=k;t<n;t++)s+=(x[t]-m)*(x[t-k]-m);out.push([k,s/c0])}return out};
P.cumsum=a=>{let s=0;return a.map(x=>s+=x)};
// distribuições: log-gama (Lanczos), t de Student, gama incompleta regularizada, χ²
P.lgamma=function lg(x){const c=[.99999999999980993,676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,12.507343278686905,-.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];
 if(x<.5)return Math.log(Math.PI/Math.sin(Math.PI*x))-lg(1-x);x-=1;let a=c[0];const t=x+7.5;for(let i=1;i<9;i++)a+=c[i]/(x+i);return .5*Math.log(2*Math.PI)+(x+.5)*Math.log(t)-t+Math.log(a)};
P.tpdf=(x,v)=>Math.exp(P.lgamma((v+1)/2)-P.lgamma(v/2)-.5*Math.log(v*Math.PI)-(v+1)/2*Math.log(1+x*x/v));
P.tcdf=(x,v)=>{if(x<0)return 1-P.tcdf(-x,v);const m=160,h=x/m;let s=P.tpdf(0,v)+P.tpdf(x,v);for(let i=1;i<m;i++)s+=(i%2?4:2)*P.tpdf(i*h,v);return Math.min(1,.5+s*h/3)};
P.tinv=(p,v)=>{if(p<.5)return-P.tinv(1-p,v);let lo=0,hi=80;for(let i=0;i<50;i++){const mid=(lo+hi)/2;P.tcdf(mid,v)<p?lo=mid:hi=mid}return(lo+hi)/2};
P.gammainc=(a,x)=>{if(x<=0)return 0;if(x<a+1){let s=1/a,t=s;for(let n=1;n<300;n++){t*=x/(a+n);s+=t;if(Math.abs(t)<Math.abs(s)*1e-12)break}return s*Math.exp(-x+a*Math.log(x)-P.lgamma(a))}
 let b=x+1-a,c=1e300,d=1/b,h=d;for(let i=1;i<300;i++){const an=-i*(i-a);b+=2;d=an*d+b;if(Math.abs(d)<1e-300)d=1e-300;c=b+an/c;if(Math.abs(c)<1e-300)c=1e-300;d=1/d;const del=d*c;h*=del;if(Math.abs(del-1)<1e-12)break}return 1-Math.exp(-x+a*Math.log(x)-P.lgamma(a))*h};
P.chi2cdf=(x,k)=>P.gammainc(k/2,x/2);
// amostradores
P.rgamma=(r,k)=>{if(k<1)return P.rgamma(r,k+1)*Math.pow(r(),1/k);const d=k-1/3,c=1/Math.sqrt(9*d);for(;;){let x,v;do{x=P.randn(r);v=1+c*x}while(v<=0);v=v*v*v;const u=r();if(u<1-.0331*x**4||Math.log(u)<.5*x*x+d*(1-v+Math.log(v)))return d*v}};
P.rbeta=(r,a,b)=>{const x=P.rgamma(r,a),y=P.rgamma(r,b);return x/(x+y)};
P.rpois=(r,l)=>{if(l>40)return Math.max(0,Math.round(l+Math.sqrt(l)*P.randn(r)));const L=Math.exp(-l);let k=0,p=1;do{k++;p*=r()}while(p>L);return k-1};
P.betapdf=(x,a,b)=>x<=0||x>=1?0:Math.exp((a-1)*Math.log(x)+(b-1)*Math.log(1-x)+P.lgamma(a+b)-P.lgamma(a)-P.lgamma(b));
// álgebra mínima: resolve A·x = b (Gauss com pivô), OLS e logit por IRLS
P.solve=(A,b)=>{const n=b.length,M=A.map((r,i)=>[...r,b[i]]);for(let i=0;i<n;i++){let p=i;for(let k=i+1;k<n;k++)if(Math.abs(M[k][i])>Math.abs(M[p][i]))p=k;[M[i],M[p]]=[M[p],M[i]];const v=M[i][i]||1e-12;for(let k=i+1;k<n;k++){const f=M[k][i]/v;for(let j=i;j<=n;j++)M[k][j]-=f*M[i][j]}}
 const x=new Array(n).fill(0);for(let i=n-1;i>=0;i--){let s=M[i][n];for(let j=i+1;j<n;j++)s-=M[i][j]*x[j];x[i]=s/(M[i][i]||1e-12)}return x};
P.inv=A=>{const n=A.length;return A.map((_,j)=>P.solve(A,A.map((__,i)=>i===j?1:0))).reduce((M,col,j)=>{col.forEach((v,i)=>{(M[i]=M[i]||[])[j]=v});return M},[])};
P.ols=(X,y)=>{const n=y.length,k=X[0].length,XtX=Array.from({length:k},(_,i)=>Array.from({length:k},(_,j)=>X.reduce((s,r)=>s+r[i]*r[j],0))),Xty=Array.from({length:k},(_,i)=>X.reduce((s,r,t)=>s+r[i]*y[t],0));
 const b=P.solve(XtX,Xty),fit=X.map(r=>r.reduce((s,v,i)=>s+v*b[i],0)),e=y.map((v,i)=>v-fit[i]),sse=e.reduce((s,v)=>s+v*v,0),my=P.mean(y),sst=y.reduce((s,v)=>s+(v-my)**2,0),s2=sse/Math.max(1,n-k),iv=P.inv(XtX),se=iv.map((r,i)=>Math.sqrt(Math.max(0,r[i]*s2)));
 return{b,se,t:b.map((v,i)=>v/se[i]),r2:1-sse/(sst||1),resid:e,fit,s2}};
P.logit=(X,y,it=25)=>{const k=X[0].length;let b=new Array(k).fill(0);for(let r=0;r<it;r++){const H=Array.from({length:k},()=>new Array(k).fill(0)),g=new Array(k).fill(0);
 X.forEach((x,t)=>{const z=x.reduce((s,v,i)=>s+v*b[i],0),p=1/(1+Math.exp(-z)),w=p*(1-p);for(let i=0;i<k;i++){g[i]+=x[i]*(y[t]-p);for(let j=0;j<k;j++)H[i][j]+=w*x[i]*x[j]}});
 for(let i=0;i<k;i++)H[i][i]+=1e-8;const d=P.solve(H,g);b=b.map((v,i)=>v+d[i]);if(d.reduce((s,v)=>s+Math.abs(v),0)<1e-8)break}return b};
P.sigmoid=z=>1/(1+Math.exp(-z));
// AUC (Mann–Whitney com empates) e KS para escores com rótulos 0/1
P.auc=(s,y)=>{const idx=s.map((v,i)=>[v,y[i]]).sort((a,b)=>a[0]-b[0]);let rank=0,sumPos=0,nPos=0,i=0;while(i<idx.length){let j=i;while(j<idx.length&&idx[j][0]===idx[i][0])j++;const avg=(i+j+1)/2;for(let k=i;k<j;k++)if(idx[k][1]){sumPos+=avg;nPos++}i=j}const nNeg=idx.length-nPos;return nPos&&nNeg?(sumPos-nPos*(nPos+1)/2)/(nPos*nNeg):NaN};

/* ---------- cores do tema ---------- */
let CS=null;const cssv=k=>(CS||(CS=getComputedStyle(document.body))).getPropertyValue('--'+k).trim();
const TOK=/^(c[1-5]|accent2?|warm|gold2?|good|bad|ink|muted|line|cx[1-4])$/;
P.col=c=>{if(!c)return cssv('c1')||'#65c9f7';if(TOK.test(c))return cssv(c)||'#65c9f7';return c};
P.alpha=(c,a)=>{c=P.col(c);if(c[0]==='#'){let h=c.slice(1);if(h.length===3)h=[...h].map(x=>x+x).join('');const n=parseInt(h.slice(0,6),16);return`rgba(${n>>16&255},${n>>8&255},${n&255},${a})`}if(c.startsWith('rgb('))return c.replace('rgb(','rgba(').replace(')',`,${a})`);return c};
P.mix=(c1,c2,t)=>{const h=c=>{c=P.col(c).replace('#','');if(c.length===3)c=[...c].map(x=>x+x).join('');const n=parseInt(c,16);return[n>>16&255,n>>8&255,n&255]};const a=h(c1),b=h(c2);return`rgb(${a.map((v,i)=>Math.round(v+(b[i]-v)*t)).join(',')})`};

/* ---------- tooltip único (conceitos, símbolos, ícones "i") ---------- */
const CAT={undefined:'conceito','':'conceito',c:'conceito',m:'métrica',mod:'modelo · método',reg:'regulação · norma'};
const CATC={c:'cx1',m:'cx2',mod:'cx3',reg:'cx4'};
let tip,tipFor=null;
function tipHTML(el){
 if(el.dataset.cx){const e=(P.cx||{})[el.dataset.cx];if(!e)return null;const c=e.c||'c';
  return`<div class="k" style="--dot:var(--${CATC[c]||'cx1'})"><i></i>${CAT[c]||c}</div><div class="t">${e.t}${e.en?`<em>${e.en}</em>`:''}</div><p>${e.d}</p>${e.f?`<div class="f">${e.f}</div>`:''}${e.go?`<span class="go">→ aprofundado em: ${esc(e.goLabel||'tópico relacionado')}</span>`:''}`}
 const t=el.dataset.tip;if(!t)return null;
 return`${el.dataset.tipT?`<div class="t">${el.dataset.tipT}</div>`:''}<p>${t}</p>`}
function showTip(el){const h=tipHTML(el);if(!h)return;tipFor=el;tip.innerHTML=h;tip.hidden=false;
 const r=el.getBoundingClientRect(),tw=tip.offsetWidth,th=tip.offsetHeight,vw=innerWidth,vh=innerHeight;
 let x=P.clamp(r.left+r.width/2-tw/2,10,vw-tw-10),y=r.bottom+10;if(y+th>vh-8)y=Math.max(8,r.top-th-10);
 tip.style.left=x+'px';tip.style.top=y+'px';requestAnimationFrame(()=>tip.classList.add('show'));el.classList.add('on')}
function hideTip(){if(!tipFor)return;tipFor.classList.remove('on');tipFor=null;tip.classList.remove('show');tip.hidden=true}
function initTips(){
 tip=document.createElement('div');tip.className='cx-tip';tip.id='cx-tip';tip.setAttribute('role','tooltip');tip.hidden=true;document.body.append(tip);
 const sel='[data-cx],[data-tip]';
 document.addEventListener('mouseover',e=>{const el=e.target.closest&&e.target.closest(sel);if(el&&el!==tipFor){hideTip();showTip(el)}});
 document.addEventListener('mouseout',e=>{const el=e.target.closest&&e.target.closest(sel);if(el&&el===tipFor&&!el.contains(e.relatedTarget))hideTip()});
 document.addEventListener('focusin',e=>{const el=e.target.closest&&e.target.closest(sel);if(el){hideTip();showTip(el)}});
 document.addEventListener('focusout',e=>{if(tipFor&&e.target===tipFor)hideTip()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')hideTip()});
 addEventListener('scroll',hideTip,{passive:true});
 document.addEventListener('click',e=>{const el=e.target.closest&&e.target.closest('.cx');if(el&&matchMedia('(hover:none)').matches){e.preventDefault();if(tipFor===el)hideTip();else{hideTip();showTip(el)}}});
 // fórmula anotada: símbolo ↔ termo
 document.addEventListener('mouseover',e=>{const s=e.target.closest&&e.target.closest('.fx [data-k]');if(!s)return;const fx=s.closest('.fx');$$('[data-k]',fx).forEach(n=>n.classList.toggle('on',n.dataset.k===s.dataset.k))});
 document.addEventListener('mouseout',e=>{const s=e.target.closest&&e.target.closest('.fx [data-k]');if(s)$$('.on[data-k]',s.closest('.fx')).forEach(n=>n.classList.remove('on'))});
}

/* ---------- marcação automática dos conceitos ---------- */
const ROOTS='.lesson,.sim,.panel,.casebox,.scenario-walkthrough,.chapter-head,.term,.study-map article,.qcard,.deep .side-card';
const SKIP='.deep-h,.equation,.fx-eq,.fx-head,pre,code,a,button,.cx,h1,h2,h3,h4,h5,label,output,.label,.method-tag,.lesson-meta,.section-index,svg,canvas,.kpi,.bigmetric,summary,script,style,.sim-tag,.src,.bi,.legend,.ch-hover,.live-eq,dt,.codehead,.xflow,.in-flow,.steps,.q-options,.district,.city-caption,.storybar,.fx-terms b,th,figcaption,.exec,.no-cx,[data-tip]';
let CXR=null;
function markConcepts(only){
 const dict=P.cx||{};
 if(!CXR){const al=[];
  for(const[k,e]of Object.entries(dict))for(const a of(e.m||[e.t]))if(a&&a.length>1)al.push({a,k,cs:a.length<=5||!/[a-zà-ú]/.test(a)});
  al.sort((x,y)=>y.a.length-x.a.length);
  const rx=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const build=(list,fl)=>list.length?new RegExp(`(?<![\\p{L}\\p{N}_])(${list.map(x=>rx(x.a)).join('|')})(?![\\p{L}\\p{N}_])`,fl):null;
  CXR={n:al.length,R1:build(al.filter(x=>x.cs),'gu'),R2:build(al.filter(x=>!x.cs),'giu'),look1:new Map(al.filter(x=>x.cs).map(x=>[x.a,x.k])),look2:new Map(al.filter(x=>!x.cs).map(x=>[x.a.toLowerCase(),x.k]))}}
 if(!CXR.n)return;const{R1,R2,look1,look2}=CXR;
 const seen=new WeakMap(),main=only||$('main')||document.body;const local=only?new Set():null;
 const tw=document.createTreeWalker(main,NodeFilter.SHOW_TEXT,{acceptNode:n=>{const p=n.parentElement;if(!p||!n.nodeValue.trim())return NodeFilter.FILTER_REJECT;return p.closest(SKIP)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT}});
 const nodes=[];while(tw.nextNode())nodes.push(tw.currentNode);
 for(const n of nodes){
  const root=n.parentElement.closest(ROOTS)||main;let set=local||seen.get(root);if(!set){set=new Set();seen.set(root,set);$$('.cx[data-cx]',root).forEach(b=>set.add(b.dataset.cx))}
  const t=n.nodeValue,hits=[];
  for(const[R,look,lc]of[[R1,look1,false],[R2,look2,true]]){if(!R)continue;R.lastIndex=0;let m;while((m=R.exec(t))){const k=look.get(lc?m[1].toLowerCase():m[1]);if(k)hits.push({i:m.index,j:m.index+m[1].length,k})}}
  if(!hits.length)continue;hits.sort((a,b)=>a.i-b.i||(b.j-b.i)-(a.j-a.i));
  const keep=[];let end=-1;for(const h of hits){if(h.i<end||set.has(h.k))continue;keep.push(h);set.add(h.k);end=h.j}
  if(!keep.length)continue;const frag=document.createDocumentFragment();let pos=0;
  for(const h of keep){if(h.i>pos)frag.append(t.slice(pos,h.i));const b=document.createElement('b');b.className='cx';b.dataset.cx=h.k;const c=dict[h.k].c;if(c&&c!=='c')b.dataset.c=c;b.tabIndex=0;b.textContent=t.slice(h.i,h.j);frag.append(b);pos=h.j}
  if(pos<t.length)frag.append(t.slice(pos));n.replaceWith(frag)}
 if(!only)$$('.cx[data-cx]').forEach(b=>{b.tabIndex=0;const c=(dict[b.dataset.cx]||{}).c;if(c&&c!=='c'&&!b.dataset.c)b.dataset.c=c});
}

/* ---------- livro 3D: folheia uma vez ao entrar, depois acompanha o mouse ---------- */
function initBooks(){
 $$('.book3d').forEach(bk=>{
  const b3=$('.b3',bk),front=$('.b3-front',bk);if(!b3||!front)return;
  const N=+bk.dataset.leaves||10;
  for(let i=N-1;i>=0;i--){const l=document.createElement('div');l.className='b3-leaf';l.style.setProperty('--n',i);l.style.setProperty('--z',`calc(var(--t) / 2 - ${(.45+i*.32).toFixed(2)}px)`);front.before(l)}
  const base={rx:parseFloat(getComputedStyle(bk).getPropertyValue('--rx'))||-9,ry:parseFloat(getComputedStyle(bk).getPropertyValue('--ry'))||-30};
  let busy=false;
  const riffle=()=>{if(busy||RM)return;busy=true;bk.classList.add('riffle')};
  front.addEventListener('animationend',e=>{if(e.animationName==='b3open'){bk.classList.remove('riffle');busy=false}});
  const zone=bk.closest('.hero-cover')||bk;
  zone.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')riffle()});
  zone.addEventListener('pointermove',e=>{if(RM)return;const r=bk.getBoundingClientRect(),dx=P.clamp((e.clientX-(r.left+r.width/2))/(r.width*.9),-1,1),dy=P.clamp((e.clientY-(r.top+r.height/2))/(r.height*.9),-1,1);
   bk.classList.add('tracking');bk.style.setProperty('--ry',(base.ry+dx*34).toFixed(1)+'deg');bk.style.setProperty('--rx',(base.rx-dy*16).toFixed(1)+'deg');
   bk.style.setProperty('--gx',(50+dx*40).toFixed(0)+'%');bk.style.setProperty('--gy',(40+dy*40).toFixed(0)+'%')});
  zone.addEventListener('pointerleave',()=>{bk.classList.remove('tracking');bk.style.removeProperty('--ry');bk.style.removeProperty('--rx')});
  bk.addEventListener('click',riffle);bk.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();riffle()}});
 });
}

/* ---------- fluxogramas animados ---------- */
const flowTimers=[];
function initFlows(){
 $$('.xflow').forEach(fig=>{
  const ol=$('.xf-nodes',fig);if(!ol)return;const items=$$(':scope>li',ol);
  items.forEach((li,i)=>{li.tabIndex=0;li.dataset.i=String(i+1).padStart(2,'0');li.setAttribute('role','button');if(i<items.length-1){const a=document.createElement('li');a.className='xf-arrow';a.setAttribute('aria-hidden','true');a.innerHTML='<i></i>';li.after(a)}});
  const arrows=$$('.xf-arrow',ol);
  let cap=$('figcaption',fig);if(!cap){cap=document.createElement('figcaption');cap.innerHTML='<span>Fluxo</span>';fig.prepend(cap)}
  const btn=document.createElement('button');btn.type='button';btn.textContent=RM?'▶ passo':'❚❚ pausar';cap.append(btn);
  let det=$('.xf-detail',fig);if(!det){det=document.createElement('div');det.className='xf-detail';det.setAttribute('aria-live','polite');fig.append(det)}
  let k=-1,paused=RM,vis=false;
  const set=i=>{k=(i+items.length)%items.length;items.forEach((li,j)=>{li.classList.toggle('on',j===k);li.classList.toggle('done',j<k)});
   arrows.forEach(a=>a.classList.remove('run'));if(k>0){const a=arrows[k-1];void a.offsetWidth;a.classList.add('run')}
   const li=items[k];det.innerHTML=`<b>${String(k+1).padStart(2,'0')} · ${esc($('b',li)?.textContent||li.textContent)}</b>${li.dataset.d||''}`};
  items.forEach((li,i)=>{li.addEventListener('click',()=>{set(i);paused=true;btn.textContent='▶ continuar'});li.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();li.click()}})});
  btn.addEventListener('click',()=>{if(RM){set(k+1);return}paused=!paused;btn.textContent=paused?'▶ continuar':'❚❚ pausar'});
  set(0);
  const tick=()=>{if(!paused&&vis&&!document.hidden)set(k+1)};flowTimers.push(setInterval(tick,+fig.dataset.ms||2900));
  if('IntersectionObserver'in window)new IntersectionObserver(es=>es.forEach(e=>vis=e.isIntersecting),{threshold:.35}).observe(fig);else vis=true;
  fig.addEventListener('mouseenter',()=>{fig._hold=paused;paused=true});fig.addEventListener('mouseleave',()=>{paused=fig._hold??paused;if(!RM&&btn.textContent.startsWith('❚❚'))paused=false});
 });
 // trilhas curtas existentes (in-flow, steps) recebem percurso sequencial
 $$('.in-flow,.steps').forEach(w=>{const sp=$$(':scope>span',w),ar=$$(':scope>b',w);if(sp.length<2)return;w.classList.add('walk');let k=-1,vis=false;
  const step=()=>{if(!vis||RM||document.hidden)return;k=(k+1)%(sp.length+1);sp.forEach((s,i)=>{s.classList.toggle('on',i===k);s.classList.toggle('done',i<k)});ar.forEach((a,i)=>a.classList.toggle('on',i===k-1))};
  flowTimers.push(setInterval(step,1100));if('IntersectionObserver'in window)new IntersectionObserver(es=>es.forEach(e=>vis=e.isIntersecting)).observe(w)});
}

/* ---------- gráficos em canvas ---------- */
const DPR=()=>Math.min(2,window.devicePixelRatio||1);
function niceTicks(a,b,n=5){const sp=b-a||1,s0=sp/n,mag=10**Math.floor(Math.log10(s0)),r=s0/mag,st=(r<1.5?1:r<3?2:r<7?5:10)*mag,out=[];for(let v=Math.ceil(a/st-1e-9)*st;v<=b+sp*1e-9;v+=st)out.push(+v.toFixed(10));return out}
function domainOf(s){
 const X=s.x||{},Y=s.y||{};let xs=[],ys=[];
 for(const se of s.series||[]){if(!se.data)continue;for(const p of se.data){if(se.type==='band'){xs.push(p[0]);ys.push(p[1],p[2])}else if(se.type==='seg'){xs.push(p[0],p[2]);ys.push(p[1],p[3])}else{xs.push(p[0]);ys.push(p[1])}}if(se.type==='bars'||se.type==='area')ys.push(se.base??0)}
 for(const m of s.marks||[])if(m.y!=null&&Y.marks!==false)ys.push(m.y);
 xs=xs.filter(Number.isFinite);ys=ys.filter(Number.isFinite);
 let x0,x1;if(X.cats){x0=-.5;x1=X.cats.length-.5}else{x0=X.min??Math.min(...xs);x1=X.max??Math.max(...xs);if(!(x1>x0)){x0-=1;x1+=1}
  const bw=(s.series||[]).find(se=>se.type==='bars');if(bw&&X.min==null){const w=bw.bw??autoBW(bw.data);x0-=w*.6;x1+=w*.6}}
 let y0=Y.min??Math.min(...ys),y1=Y.max??Math.max(...ys);if(Y.zero){y0=Math.min(0,y0);y1=Math.max(0,y1)}if(!(y1>y0)){y0-=1;y1+=1}
 const pad=(y1-y0)*.08;if(Y.min==null)y0-=(y0===0?0:pad);if(Y.max==null)y1+=pad;
 return{x0,x1,y0,y1}}
function autoBW(d){if(!d||d.length<2)return 1;let m=Infinity;for(let i=1;i<d.length;i++)m=Math.min(m,Math.abs(d[i][0]-d[i-1][0]));return(m||1)*.8}
function lerpSpec(a,b,e){
 const L=(x,y)=>typeof x==='number'&&typeof y==='number'?x+(y-x)*e:y;
 const o={...b,series:b.series.map((s,i)=>({...s,data:s.data.map((p,j)=>p.map((v,k)=>L(a.series[i].data[j][k],v)))}))};
 if(b.marks&&a.marks&&a.marks.length===b.marks.length)o.marks=b.marks.map((m,i)=>({...m,x:L(a.marks[i].x,m.x),y:L(a.marks[i].y,m.y)}));
 if(b.shade&&a.shade&&a.shade.length===b.shade.length)o.shade=b.shade.map((m,i)=>({...m,x0:L(a.shade[i].x0,m.x0),x1:L(a.shade[i].x1,m.x1),y0:L(a.shade[i].y0,m.y0),y1:L(a.shade[i].y1,m.y1)}));
 const da=a._dom,db=domainOf(b);if(da){o.x={...(b.x||{}),min:L(da.x0,db.x0),max:L(da.x1,db.x1)};o.y={...(b.y||{}),min:L(da.y0,db.y0),max:L(da.y1,db.y1)}}
 return o}
function compatible(a,b){if(!a||!b||a.heat||b.heat||!a.series||!b.series||a.series.length!==b.series.length)return false;return a.series.every((s,i)=>s.data&&b.series[i].data&&s.data.length===b.series[i].data.length&&s.type===b.series[i].type)}
function drawChart(cv,spec,rv=1){
 const W=Math.max(260,cv.clientWidth||cv.parentElement.clientWidth||600),H=spec.h||280,dpr=DPR();
 if(cv.width!==Math.round(W*dpr)||cv.height!==Math.round(H*dpr)){cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr)}cv.style.height=H+'px';
 const c=cv.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,W,H);
 const ink=cssv('chart-ink')||'rgba(230,238,250,.62)',grid=cssv('chart-grid')||'rgba(255,255,255,.08)';
 c.font='11px "IBM Plex Mono",Consolas,monospace';c.textBaseline='middle';
 if(spec.heat)return drawHeat(c,spec,W,H,ink);
 const d=domainOf(spec);spec._dom=d;
 const X=spec.x||{},Y=spec.y||{};const yf=Y.fmt||(v=>fmt(v,Math.abs(d.y1-d.y0)<5?2:Math.abs(d.y1-d.y0)<50?1:0)),xf=X.fmt||(v=>fmt(v,Math.abs(d.x1-d.x0)<5?2:0));
 const yt=niceTicks(d.y0,d.y1,Y.ticks||5);c.font='11px "IBM Plex Mono",Consolas,monospace';
 const ml=spec.ml??Math.max(40,12+Math.max(...yt.map(v=>c.measureText(yf(v)).width))),mr=spec.mr??14,mt=spec.mt??(Y.label?22:12),mb=spec.mb??(X.label?40:28);
 const w=W-ml-mr,h=H-mt-mb,Xp=x=>ml+(x-d.x0)/(d.x1-d.x0)*w,Yp=y=>mt+(1-(y-d.y0)/(d.y1-d.y0))*h;
 cv._geo={ml,mt,w,h,d,Xp,Yp,spec};
 // grade
 c.strokeStyle=grid;c.lineWidth=1;c.fillStyle=ink;c.textAlign='right';
 for(const v of yt){const y=Math.round(Yp(v))+.5;c.beginPath();c.moveTo(ml,y);c.lineTo(ml+w,y);c.stroke();c.fillText(yf(v),ml-7,y)}
 c.textAlign='center';
 if(X.cats)X.cats.forEach((s,i)=>{c.fillText(s,Xp(i),mt+h+14)});
 else for(const v of niceTicks(d.x0,d.x1,X.ticks||Math.max(3,Math.min(8,Math.floor(w/90)))))c.fillText(xf(v),Xp(v),mt+h+14);
 if(X.label){c.textAlign='right';c.fillText(X.label,ml+w,mt+h+31)}
 if(Y.label){c.textAlign='left';c.fillText(Y.label,ml-Math.min(ml-4,36),8)}
 if(d.y0<0&&d.y1>0){c.strokeStyle=P.alpha('ink',.28);c.beginPath();c.moveTo(ml,Yp(0));c.lineTo(ml+w,Yp(0));c.stroke()}
 c.save();c.beginPath();c.rect(ml,mt-2,w*rv,h+4);c.clip();
 for(const s of spec.shade||[]){c.fillStyle=P.alpha(s.color||'c1',s.a??.1);const x0=s.x0!=null?Xp(s.x0):ml,x1=s.x1!=null?Xp(s.x1):ml+w,y0=s.y1!=null?Yp(s.y1):mt,y1=s.y0!=null?Yp(s.y0):mt+h;c.fillRect(Math.min(x0,x1),Math.min(y0,y1),Math.abs(x1-x0),Math.abs(y1-y0));if(s.label){c.fillStyle=P.alpha(s.color||'c1',.85);const lw=c.measureText(s.label).width,lx=Math.min(x0,x1)+5;if(lx+lw>ml+w*rv-2){c.textAlign='right';c.fillText(s.label,Math.min(Math.max(x0,x1),ml+w)-5,mt+10)}else{c.textAlign='left';c.fillText(s.label,lx,mt+10)}}}
 for(const s of spec.series||[]){const col=P.col(s.color||'c1'),dt=s.data||[];if(!dt.length)continue;c.setLineDash(s.dash||[]);c.lineWidth=s.w??2.2;c.strokeStyle=col;c.lineJoin='round';c.lineCap='round';
  const base=Yp(P.clamp(s.base??0,d.y0,d.y1));
  if(s.type==='band'){c.fillStyle=P.alpha(col,s.a??.18);c.beginPath();dt.forEach((p,i)=>i?c.lineTo(Xp(p[0]),Yp(p[2])):c.moveTo(Xp(p[0]),Yp(p[2])));for(let i=dt.length-1;i>=0;i--)c.lineTo(Xp(dt[i][0]),Yp(dt[i][1]));c.closePath();c.fill();continue}
  if(s.type==='bars'){const bw=(s.bw??(X.cats?.7:autoBW(dt)))*w/(d.x1-d.x0);for(const p of dt){if(!Number.isFinite(p[1]))continue;const x=Xp(p[0]+(s.off||0))-bw/2,y=Yp(p[1]);c.fillStyle=typeof p[2]==='string'?P.col(p[2]):P.alpha(col,s.a??.85);c.fillRect(x,Math.min(y,base),Math.max(1,bw),Math.abs(base-y))}continue}
  if(s.type==='dots'){for(const p of dt){if(!Number.isFinite(p[1]))continue;c.fillStyle=typeof p[2]==='string'?P.col(p[2]):P.alpha(col,s.a??.8);c.beginPath();c.arc(Xp(p[0]),Yp(p[1]),typeof p[3]==='number'?p[3]:(s.r??3),0,7);c.fill()}continue}
  if(s.type==='seg'){for(const p of dt){c.beginPath();c.moveTo(Xp(p[0]),Yp(p[1]));c.lineTo(Xp(p[2]),Yp(p[3]));c.stroke()}continue}
  c.beginPath();let on=false,first=null,last=null;
  for(let i=0;i<dt.length;i++){const p=dt[i];if(!Number.isFinite(p[1])){on=false;continue}const x=Xp(p[0]),y=Yp(p[1]);
   if(!on){c.moveTo(x,y);on=true;if(!first)first=[x,y]}else if(s.type==='step'){c.lineTo(x,last[1]);c.lineTo(x,y)}else c.lineTo(x,y);last=[x,y]}
  if((s.type==='area'||s.fill)&&first){c.save();c.lineTo(last[0],base);c.lineTo(first[0],base);c.closePath();const g=c.createLinearGradient(0,mt,0,mt+h);g.addColorStop(0,P.alpha(col,s.fill??.32));g.addColorStop(1,P.alpha(col,.02));c.fillStyle=g;c.fill();c.restore();
   c.beginPath();on=false;for(const p of dt){if(!Number.isFinite(p[1])){on=false;continue}const x=Xp(p[0]),y=Yp(p[1]);on?c.lineTo(x,y):c.moveTo(x,y);on=true}}
  c.stroke();
  if(s.end&&last){c.fillStyle=col;c.beginPath();c.arc(last[0],last[1],4,0,7);c.fill();c.fillStyle=P.alpha(col,.25);c.beginPath();c.arc(last[0],last[1],9,0,7);c.fill()}}
 c.setLineDash([]);c.restore();
 for(const m of spec.marks||[]){const col=P.col(m.color||'gold');c.strokeStyle=col;c.lineWidth=m.w??1.5;c.setLineDash(m.dash===false?[]:[5,4]);c.beginPath();
  if(m.x!=null){const x=Xp(m.x);if(x<ml-1||x>ml+w+1)continue;c.moveTo(x,mt);c.lineTo(x,mt+h);c.stroke();if(m.label){c.setLineDash([]);c.fillStyle=col;c.textAlign=x>ml+w*.8?'right':'left';c.fillText(m.label,x+(x>ml+w*.8?-5:5),mt+(m.ly??10))}}
  else if(m.y!=null){const y=Yp(m.y);if(y<mt-1||y>mt+h+1)continue;c.moveTo(ml,y);c.lineTo(ml+w,y);c.stroke();if(m.label){c.setLineDash([]);c.fillStyle=col;c.textAlign=m.align||'right';c.fillText(m.label,m.align==='left'?ml+5:ml+w-4,y-9)}}}
 c.setLineDash([]);
 for(const l of spec.labels||[]){c.fillStyle=P.col(l.color||'ink');c.textAlign=l.align||'left';c.font=l.font||'11px "IBM Plex Mono",Consolas,monospace';c.fillText(l.text,Xp(l.x)+(l.dx||0),Yp(l.y)+(l.dy||0))}
 if(spec.draw){c.save();spec.draw(c,{Xp,Yp,ml,mt,w,h,W,H,d,col:P.col,alpha:P.alpha,rv});c.restore()}
 c.strokeStyle=P.alpha('ink',.22);c.beginPath();c.moveTo(ml,mt+h+.5);c.lineTo(ml+w,mt+h+.5);c.stroke();
}
function drawHeat(c,spec,W,H,ink){
 const z=spec.heat.z,R=z.length,C=z[0].length,xl=spec.heat.xl||[],yl=spec.heat.yl||[],f=spec.heat.fmt||(v=>fmt(v,1));
 const ml=spec.ml??64,mt=spec.mt??14,mb=spec.mb??(spec.x?.label?42:28),mr=12,w=W-ml-mr,h=H-mt-mb,cw=w/C,ch=h/R;
 const flat=z.flat().filter(Number.isFinite),lo=spec.heat.lo??Math.min(...flat),hi=spec.heat.hi??Math.max(...flat),mid=spec.heat.mid;
 c.font='11px "IBM Plex Mono",Consolas,monospace';c.textAlign='center';
 for(let i=0;i<R;i++)for(let j=0;j<C;j++){const v=z[i][j];let col;
  if(mid!=null){const t=v>=mid?(v-mid)/((hi-mid)||1):(mid-v)/((mid-lo)||1);col=P.alpha(v>=mid?(spec.heat.pos||'good'):(spec.heat.neg||'bad'),.12+.75*P.clamp(t,0,1))}
  else col=P.alpha(spec.heat.color||'c1',.08+.8*P.clamp((v-lo)/((hi-lo)||1),0,1));
  c.fillStyle=col;c.fillRect(ml+j*cw+1,mt+i*ch+1,cw-2,ch-2);
  if(cw>34&&ch>16){c.fillStyle='rgba(255,255,255,.92)';c.fillText(f(v),ml+j*cw+cw/2,mt+i*ch+ch/2)}}
 c.fillStyle=ink;xl.forEach((s,j)=>c.fillText(s,ml+j*cw+cw/2,mt+h+14));c.textAlign='right';yl.forEach((s,i)=>c.fillText(s,ml-7,mt+i*ch+ch/2));
 if(spec.x?.label){c.textAlign='right';c.fillText(spec.x.label,ml+w,mt+h+31)}if(spec.y?.label){c.save();c.translate(11,mt+h/2);c.rotate(-Math.PI/2);c.textAlign='center';c.fillText(spec.y.label,0,0);c.restore()}
 if(spec.draw)spec.draw(c,{ml,mt,w,h,cw,ch,W,H})}
P.drawChart=drawChart;
P.chart=(cv,spec,o={})=>{
 const prev=cv._spec;cv._spec=spec;cancelAnimationFrame(cv._raf);
 if(o.reveal&&!RM){const t0=performance.now(),D=o.dur||1100;const go=now=>{const e=P.clamp((now-t0)/D,0,1);drawChart(cv,spec,1-(1-e)**3);if(e<1)cv._raf=requestAnimationFrame(go)};cv._raf=requestAnimationFrame(go);return}
 if(o.instant||RM||!compatible(prev,spec)||!prev._dom){drawChart(cv,spec);return}
 const t0=performance.now(),D=o.dur||420;const go=now=>{const e=P.clamp((now-t0)/D,0,1),k=1-(1-e)**3;drawChart(cv,e<1?lerpSpec(prev,spec,k):spec);if(e<1)cv._raf=requestAnimationFrame(go)};cv._raf=requestAnimationFrame(go)};
function legendHTML(spec){const items=[...(spec.series||[]).filter(s=>s.name).map(s=>({n:s.name,c:P.col(s.color||'c1'),k:s.type==='bars'||s.type==='band'||s.type==='area'?'box':s.dash?'dash':''})),...(spec.marks||[]).filter(m=>m.name).map(m=>({n:m.name,c:P.col(m.color||'gold'),k:'dash'})),...(spec.legend||[]).map(l=>({n:l.name,c:P.col(l.color),k:l.k||''}))];
 return items.map(i=>`<span><i class="${i.k}" style="--lc:${i.c}"></i>${esc(i.n)}</span>`).join('')}
function hoverChart(fig,cv){
 const box=document.createElement('div');box.className='ch-hover';fig.append(box);
 cv.addEventListener('pointermove',e=>{const g=cv._geo;if(!g||g.spec.hover===false||g.spec.heat){box.classList.remove('show');return}
  const r=cv.getBoundingClientRect(),px=e.clientX-r.left,py=e.clientY-r.top;if(px<g.ml||px>g.ml+g.w){box.classList.remove('show');return}
  const rows=[];const X=g.spec.x||{},Y=g.spec.y||{};const xf=X.cats?(v=>X.cats[Math.round(v)]):(X.fmt||(v=>fmt(v,2))),yf=Y.fmt||(v=>fmt(v,2));let xv=null;
  for(const s of g.spec.series||[]){if(!s.data||!s.data.length||s.type==='seg'||s.hover===false)continue;let best=null,bd=1e9;for(const p of s.data){const dd=Math.abs(g.Xp(p[0]+(s.off||0))-px);if(dd<bd&&Number.isFinite(p[1])){bd=dd;best=p}}
   if(!best||bd>Math.max(26,g.w/(s.data.length||1)))continue;xv=xv??best[0];const val=s.type==='band'?`${(s.fmt||yf)(best[1])} – ${(s.fmt||yf)(best[2])}`:(s.fmt||yf)(best[1]);rows.push(`<div><i style="--lc:${P.col(s.color||'c1')}"></i>${esc(s.name||'série')}: <b>${val}</b></div>`)}
  if(!rows.length){box.classList.remove('show');return}
  box.innerHTML=`<div style="opacity:.7">${esc(X.name||'x')} = ${esc(xf(xv))}</div>${rows.slice(0,6).join('')}`;
  const fr=fig.getBoundingClientRect();let lx=e.clientX-fr.left+14,ly=e.clientY-fr.top-10;if(lx+box.offsetWidth>fr.width-6)lx=e.clientX-fr.left-box.offsetWidth-14;box.style.left=lx+'px';box.style.top=Math.max(4,ly-box.offsetHeight/2)+'px';box.classList.add('show')});
 cv.addEventListener('pointerleave',()=>box.classList.remove('show'))}

/* ---------- simuladores declarativos ---------- */
const SIMS=[];P.sim=(id,S)=>SIMS.push([id,S]);let conceptsReady=false;
const live=[];let simErrors=[];
function decimals(step){const s=String(step);return s.includes('.')?s.split('.')[1].length:0}
function makeSim(el,S){
 const id=el.id,ctrls=S.controls||[],kpis=S.kpis||[],charts=S.charts||[{k:'main'}];
 el.classList.add('sim');el.setAttribute('role','group');el.setAttribute('aria-label',S.title||'Simulador');
 const ctl=ctrls.map(c=>{const cid=`${id}-${c.k}`;
  if(c.type==='seg')return`<div class="control"><span class="kpi-l">${c.label}${c.tip?`<i class="i" data-tip="${esc(c.tip)}">i</i>`:''}</span><div class="seg" data-k="${c.k}" role="group" aria-label="${esc(c.label)}">${c.options.map((o,i)=>`<button type="button" data-v="${i}" aria-pressed="${i===(c.value||0)}">${o}</button>`).join('')}</div></div>`;
  return`<div class="control"><label for="${cid}"><span>${c.label}${c.tip?`<i class="i" data-tip="${esc(c.tip)}">i</i>`:''}</span><output for="${cid}" id="${cid}-out">—</output></label><input type="range" id="${cid}" min="${c.min}" max="${c.max}" step="${c.step}" value="${c.value}"></div>`}).join('');
 el.innerHTML=`<header class="sim-head"><span class="sim-tag">${S.tag||'Simulador'}</span><h4>${S.title||''}</h4>${S.lede?`<p class="sim-lede">${S.lede}</p>`:''}</header>
 <div class="sim-body">${ctl||S.play?`<div class="sim-ctrls">${ctl}${S.play?`<div class="control"><button type="button" class="sim-play">${S.play.label||'▶ Animar'}</button></div>`:''}</div>`:''}
 ${kpis.length?`<div class="sim-kpis">${kpis.map(k=>`<div class="kpi" data-k="${k.k}" style="--kc:${P.col(k.color||'c1')}"><span class="kpi-l">${k.label}${k.tip?`<i class="i" data-tip="${esc(k.tip)}">i</i>`:''}</span><b class="kpi-v">—</b><small class="kpi-s">${k.sub||''}</small></div>`).join('')}</div>`:''}
 <div class="sim-charts ${charts.length>1?'c'+Math.min(3,S.cols||charts.length):''}">${charts.map(c=>`<figure class="sim-fig" data-k="${c.k}">${c.title?`<figcaption>${c.title}</figcaption>`:''}<canvas aria-label="${esc(c.title||S.title||'gráfico')}" role="img"></canvas><div class="legend"></div></figure>`).join('')}</div>
 ${S.eq!==false?'<div class="live-eq" hidden></div>':''}${S.take!==false?'<p class="sim-take" hidden><b>Leitura executiva</b><span></span></p>':''}${S.note?`<p class="sim-note">${S.note}</p>`:''}</div>
 <button type="button" class="reset-lab">Restaurar parâmetros</button>`;
 const segs={};ctrls.filter(c=>c.type==='seg').forEach(c=>segs[c.k]=c.value||0);
 const st={t:1,drawn:false,vis:false,memo:{}};
 const read=()=>{const p={};for(const c of ctrls){if(c.type==='seg')p[c.k]=segs[c.k];else p[c.k]=+$('#'+CSS.escape(`${id}-${c.k}`),el).value}p.t=st.t;return p};
 const figs=charts.map(c=>({c,fig:$(`.sim-fig[data-k="${c.k}"]`,el)}));figs.forEach(o=>{o.cv=$('canvas',o.fig);o.cv.style.height=(o.c.h||(charts.length>1?250:300))+'px';hoverChart(o.fig,o.cv)});
 let lastK={};
 const update=(mode)=>{const p=read();
  for(const c of ctrls)if(c.type!=='seg'){const o=$('#'+CSS.escape(`${id}-${c.k}-out`),el);if(o)o.textContent=c.fmt?c.fmt(p[c.k]):fmt(p[c.k],decimals(c.step))}
  let out;try{out=S.model(p,st.memo,st)||{}}catch(e){simErrors.push(id+': '+e.message);document.documentElement.dataset.simErrors=simErrors.join(' | ');console.error(id,e);return}
  for(const k of kpis){const box=$(`.kpi[data-k="${k.k}"]`,el);let v=out.kpi?.[k.k];if(v==null)continue;let sub=null,tone=null;if(typeof v==='object'){sub=v.s;tone=v.tone;v=v.v}
   const b=$('.kpi-v',box);if(b.textContent!==String(v)){b.textContent=v;if(mode!=='play'&&st.drawn){b.classList.remove('flash');void b.offsetWidth;b.classList.add('flash')}}
   if(sub!=null)$('.kpi-s',box).innerHTML=sub;box.classList.toggle('good',tone==='good');box.classList.toggle('bad',tone==='bad')}
  if(out.eq!=null){const q=$('.live-eq',el);if(q){q.hidden=false;q.innerHTML=out.eq}}
  if(out.take!=null){const q=$('.sim-take',el);if(q){q.hidden=false;const sp=$('span',q);if(sp.dataset.raw!==out.take){sp.dataset.raw=out.take;sp.innerHTML=out.take;if(conceptsReady)try{markConcepts(sp)}catch(e){}}}}
  st.last=out;if(st.vis)paint(mode)};
 const paint=mode=>{const out=st.last||{};for(const o of figs){const sp=out.charts?.[o.c.k];if(!sp)continue;sp.h=sp.h||o.c.h||(charts.length>1?250:300);
   P.chart(o.cv,sp,mode==='play'||mode==='resize'?{instant:true}:!st.drawn?{reveal:true}:{});const lg=$('.legend',o.fig);const h=legendHTML(sp);if(lg.innerHTML!==h)lg.innerHTML=h}st.drawn=true};
 let raf=0;el.addEventListener('input',e=>{if(e.target.matches('input[type=range]')){update('input')}});
 $$('.seg',el).forEach(g=>g.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;segs[g.dataset.k]=+b.dataset.v;$$('button',g).forEach(x=>x.setAttribute('aria-pressed',x===b));update('input')}));
 $('.reset-lab',el).addEventListener('click',()=>{$$('input[type=range]',el).forEach(i=>i.value=i.defaultValue);ctrls.filter(c=>c.type==='seg').forEach(c=>{segs[c.k]=c.value||0;$$(`.seg[data-k="${c.k}"] button`,el).forEach(x=>x.setAttribute('aria-pressed',+x.dataset.v===segs[c.k]))});st.t=1;update('input')});
 if(S.play){const btn=$('.sim-play',el),lab=S.play.label||'▶ Animar';let run=false;
  btn.addEventListener('click',()=>{if(run){run=false;cancelAnimationFrame(raf);btn.textContent=lab;return}run=true;btn.textContent='❚❚ Pausar';const D=RM?1:(S.play.dur||6000),t0=performance.now()-(st.t<1?st.t*D:0);
   const go=now=>{if(!run)return;st.t=P.clamp((now-t0)/D,0,1);update('play');if(st.t<1)raf=requestAnimationFrame(go);else{run=false;btn.textContent='↺ Repetir'}};if(st.t>=1)st.t=0;raf=requestAnimationFrame(go)})}
 update('init');
 const show=()=>{if(st.vis)return;st.vis=true;if(S.play&&S.play.auto&&!RM){st.t=0;$('.sim-play',el).click()}else paint('reveal')};
 if('IntersectionObserver'in window)new IntersectionObserver((es,ob)=>es.forEach(e=>{if(e.isIntersecting){show();ob.disconnect()}}),{threshold:.15}).observe(el);else show();
 live.push(()=>{if(st.vis)paint('resize')});
}
let rsz;addEventListener('resize',()=>{clearTimeout(rsz);rsz=setTimeout(()=>{live.forEach(f=>f())},160)});

/* ---------- herói "capa viva" ---------- */
function heroFX(){
 const hero=$('.hero'),book=document.body.dataset.book;if(!hero)return;
 const cv=document.createElement('canvas');cv.className='hero-fx';cv.setAttribute('aria-hidden','true');hero.prepend(cv);
 const c=cv.getContext('2d');let W=0,H=0,vis=true,t0=performance.now();
 const size=()=>{const r=hero.getBoundingClientRect(),d=DPR();W=r.width;H=r.height;cv.width=W*d;cv.height=H*d;c.setTransform(d,0,0,d,0,0)};
 const r=P.rng(7),bub=Array.from({length:46},()=>({x:r(),y:r(),s:.4+r()*1.6,v:.2+r()*.6}));
 const series=(()=>{const rr=P.rng(11),a=[];let y=0,v=0;for(let i=0;i<260;i++){v=.86*v+.25*P.randn(rr);y=y*.985+v+.9*Math.sin(i/9);a.push(y)}return a})();
 const frame=now=>{const t=(now-t0)/1000;c.clearRect(0,0,W,H);
  if(book==='hull'){ // ondas de partículas como na capa Wiley
   const top=H-160,cols=Math.floor(W/9),rows=16;
   for(let j=0;j<rows;j++){const dep=j/rows,yb=top+18+j*(H-top-12)/rows;for(let i=0;i<cols;i++){const x=i*9+((j%2)*4.5);const ph=i*.055+t*.9+j*.35;
     const y=yb+Math.sin(ph)*(10+22*dep)*Math.sin(i/cols*Math.PI)+Math.cos(i*.021-t*.5)*8;const a=.15+.6*dep*(.5+.5*Math.sin(ph*1.3));
     c.fillStyle=`rgba(${70+60*dep|0},${130+60*dep|0},255,${a.toFixed(3)})`;c.fillRect(x,y,1.6+dep*1.2,1.6+dep*1.2)}}
   c.strokeStyle='rgba(120,180,255,.35)';c.lineWidth=1;for(let k=0;k<3;k++){c.beginPath();for(let x=0;x<=W;x+=6){const y=top+50+k*16+Math.sin(x/120+t*(.6+k*.2)+k)*22;x?c.lineTo(x,y):c.moveTo(x,y)}c.stroke()}}
  else if(book==='series'){ // a série cresce, o leque de previsão abre
   const n=series.length,mn=Math.min(...series),mx=Math.max(...series),amp=78/(mx-mn||1),y0=H-22+mn*amp,cyc=(t%14)/14,shown=Math.max(2,Math.floor(P.clamp(cyc/.6,0,1)*n*.72));
   c.strokeStyle='rgba(0,78,141,.6)';c.lineWidth=2;c.beginPath();for(let i=0;i<shown;i++){const x=W*.04+i*(W*.92/n),y=y0-series[i]*amp;i?c.lineTo(x,y):c.moveTo(x,y)}c.stroke();
   if(cyc>.6){const k=P.clamp((cyc-.6)/.3,0,1),xs=W*.04+shown*(W*.92/n),ys=y0-series[shown-1]*amp,L=W*.92*.28*k;
    c.fillStyle='rgba(0,78,141,.16)';c.beginPath();c.moveTo(xs,ys);c.lineTo(xs+L,Math.max(H-108,ys-34*k));c.lineTo(xs+L,Math.min(H-8,ys+34*k));c.closePath();c.fill();
    c.setLineDash([6,5]);c.strokeStyle='rgba(214,38,44,.8)';c.beginPath();c.moveTo(xs,ys);c.lineTo(xs+L,ys-4*k);c.stroke();c.setLineDash([])}
   c.fillStyle='rgba(6,56,108,.55)';c.font='600 10px "IBM Plex Mono",monospace';c.textAlign='left';c.fillText('HISTÓRICO  →  PREVISÃO COM INTERVALO',W*.04,H-112)}
  else if(book==='credit'){ // linha d'água, raios de luz, bolhas e iceberg
   const wl=H*.455,cx=W*.6,bob=Math.sin(t*.6)*3;
   c.fillStyle='rgba(235,248,255,.10)';c.beginPath();c.moveTo(cx-W*.12,wl+bob);c.lineTo(cx-W*.05,wl-H*.16+bob);c.lineTo(cx-W*.02,wl-H*.11+bob);c.lineTo(cx+W*.02,wl-H*.24+bob);c.lineTo(cx+W*.08,wl-H*.09+bob);c.lineTo(cx+W*.14,wl+bob);c.closePath();c.fill();
   const g=c.createLinearGradient(0,wl,0,H);g.addColorStop(0,'rgba(170,220,250,.13)');g.addColorStop(1,'rgba(170,220,250,.02)');c.fillStyle=g;c.beginPath();c.moveTo(cx-W*.14,wl+bob);c.bezierCurveTo(cx-W*.3,wl+H*.2,cx-W*.26,H*.95,cx-W*.05,H*1.02);c.lineTo(cx+W*.12,H*1.02);c.bezierCurveTo(cx+W*.32,H*.85,cx+W*.3,wl+H*.18,cx+W*.15,wl+bob);c.closePath();c.fill();
   c.strokeStyle='rgba(255,255,255,.45)';c.lineWidth=1.2;c.beginPath();for(let x=0;x<=W;x+=5){const y=wl+Math.sin(x/38+t*1.4)*2.2+Math.sin(x/91-t*.8)*1.6;x?c.lineTo(x,y):c.moveTo(x,y)}c.stroke();
   for(let k=0;k<5;k++){const x=W*(.1+k*.2)+Math.sin(t*.2+k)*30;const gr=c.createLinearGradient(x,wl,x+60,H);gr.addColorStop(0,'rgba(200,235,255,.07)');gr.addColorStop(1,'rgba(200,235,255,0)');c.fillStyle=gr;c.beginPath();c.moveTo(x,wl);c.lineTo(x+40,wl);c.lineTo(x+140,H);c.lineTo(x+60,H);c.closePath();c.fill()}
   for(const b of bub){const y=(b.y-t*.02*b.v)%1,yy=wl+(1-(y<0?y+1:y))*(H-wl);c.fillStyle='rgba(220,245,255,.22)';c.beginPath();c.arc(b.x*W+Math.sin(t+b.x*9)*4,yy,b.s,0,7);c.fill()}}
  if(vis&&!RM&&!document.hidden)requestAnimationFrame(frame)};
 size();frame(performance.now());addEventListener('resize',()=>{size();if(RM)frame(performance.now())});
 if('IntersectionObserver'in window)new IntersectionObserver(es=>es.forEach(e=>{const was=vis;vis=e.isIntersecting;if(vis&&!was&&!RM)requestAnimationFrame(frame)})).observe(hero);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&vis&&!RM)requestAnimationFrame(frame)});
}

/* ---------- contadores, numeração de figuras, revelação ---------- */
function finish(){
 let n=0;$$('.sim,.xflow').forEach(el=>{n++;const tag=el.classList.contains('sim')?$('.sim-tag',el):$('figcaption>span',el);if(tag&&!tag.dataset.fig){tag.dataset.fig=n;tag.textContent=`Fig. ${n} · ${tag.textContent}`}});
 const counts={sim:$$('.sim').length+$$('#laboratorio .panel').length,fx:$$('.fx').length+$$('.equation').length,flow:$$('.xflow').length+$$('.walk').length,cx:Object.keys(P.cx||{}).length,lesson:$$('.lesson').length};
 $$('[data-count]').forEach(el=>{const v=counts[el.dataset.count]??0;if(RM||!('IntersectionObserver'in window)){el.textContent=v;return}el.textContent='0';
  new IntersectionObserver((es,ob)=>es.forEach(e=>{if(!e.isIntersecting)return;ob.disconnect();const t0=performance.now();const go=now=>{const k=P.clamp((now-t0)/1200,0,1);el.textContent=Math.round(v*(1-(1-k)**3));if(k<1)requestAnimationFrame(go)};requestAnimationFrame(go)})).observe(el)});
 if(!RM&&'IntersectionObserver'in window){const ob=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');ob.unobserve(e.target)}}),{rootMargin:'0px 0px -6% 0px'});
  $$('.deep,.fx,.exec').forEach(el=>{el.classList.add('rv');ob.observe(el)})}
}

function init(){
 const steps=[['tips',initTips],['sims',()=>{for(const[id,S]of SIMS){const el=document.getElementById(id);if(!el){simErrors.push('sem ponto de montagem: '+id);continue}try{makeSim(el,S)}catch(e){simErrors.push(id+': '+e.message);console.error(id,e)}}if(simErrors.length)document.documentElement.dataset.simErrors=simErrors.join(' | ')}],
  ['concepts',()=>{markConcepts();conceptsReady=true}],['books',initBooks],['flows',initFlows],['hero',heroFX],['finish',finish]];
 for(const[n,f]of steps){try{f()}catch(e){console.error('atlas-plus '+n,e);document.documentElement.dataset.plusError=(document.documentElement.dataset.plusError||'')+n+': '+e.message+' | '}}
 document.documentElement.classList.add('plus-ready');
}
// plus.js carrega antes dos arquivos de cada livro; a montagem espera todos os scripts defer.
let started=false;const go=()=>{if(started)return;started=true;init()};
if(document.readyState==='complete')go();else{document.addEventListener('DOMContentLoaded',go);addEventListener('load',go)}
})();
