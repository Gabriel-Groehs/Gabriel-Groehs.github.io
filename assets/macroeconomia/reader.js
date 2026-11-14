/* Leitura local: nenhuma conta ou serviço externo é necessário. */
(() => {
  'use strict';
  const storageKey = 'blanchard-reader-v1';
  let saved;
  try { saved = JSON.parse(safeStorage.get(storageKey) || '{}'); } catch { saved = {}; }
  if (!saved || typeof saved !== 'object') saved = {};
  saved.done = [...new Set((Array.isArray(saved.done) ? saved.done : []).filter(n => Number.isInteger(n) && n >= 1 && n <= 24))];
  saved.last = Number.isInteger(saved.last) && saved.last >= 1 && saved.last <= 24 ? saved.last : null;
  saved.scale = [1,1.12,1.24].includes(saved.scale) ? saved.scale : 1;
  if (!['light','dark'].includes(state.theme)) state.theme = 'light';
  let activeChapter = null, lastActiveId = '';
  const persist = () => safeStorage.set(storageKey, JSON.stringify(saved));
  const fold = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const isRead = n => saved.done.includes(n);
  const announce = message => { const toast = $('#toast'); toast.textContent = message; toast.classList.add('show'); clearTimeout(announce.timer); announce.timer = setTimeout(() => toast.classList.remove('show'), 2300); };
  const makeReadButton = n => `<button class="read-toggle" type="button" data-read="${n}" aria-pressed="${isRead(n)}" aria-label="${isRead(n) ? 'Desmarcar' : 'Marcar como lido'} o capítulo ${n}">${isRead(n) ? '✓ Capítulo concluído' : 'Marcar como lido'}</button>`;

  renderParts = function() {
    $('#parts').innerHTML = PARTS.map(p => `<a class="part-card" data-n="${p.n}" href="#cap-${CHAPTERS.find(c => c.part === p.id).n}"><span>Parte ${p.n} · capítulos ${p.range}</span><b>${p.title}</b><span>${p.text}</span></a>`).join('');
  };
  renderRail = function() {
    $('#rail').innerHTML = `<button type="button" class="rail-close" id="railClose" aria-label="Fechar sumário">×</button><div class="rail-top"><div class="kicker">Guia de leitura</div><h2>Seu percurso.</h2><progress class="rail-progress" max="24" value="${saved.done.length}" aria-label="Capítulos concluídos"></progress><div class="rail-status" id="railStatus">${saved.done.length} de 24 capítulos concluídos</div></div><div class="rail-home"><a href="#topo">Abertura <span aria-hidden="true">↗</span></a><a href="#mapa">Explorar os capítulos</a><a href="#arquitetura">Mapa de conexões</a><a href="#macro-lab">Laboratório macro</a></div>${PARTS.map((p, i) => `<details data-part="${p.id}" ${i === 0 ? 'open' : ''}><summary><span>${p.n}</span>${p.title}</summary><div class="rail-chapters">${CHAPTERS.filter(c => c.part === p.id).map(c => `<a href="#cap-${c.n}"><span>${String(c.n).padStart(2,'0')}.</span><span>${c.title}</span><span class="read-tick" data-tick="${c.n}">${isRead(c.n) ? '✓' : ''}</span></a>`).join('')}</div></details>`).join('')}<div class="rail-bottom"><a href="biblioteca.html">← Biblioteca de estudos</a><a href="#referencias">Referências e escopo ↗</a><p>Seu progresso fica salvo neste navegador.</p></div>`;
  };
  renderMap = function() {
    const q = fold(state.query.trim());
    const rows = CHAPTERS.filter(c => (state.filter === 'all' || c.part === state.filter) && (!q || fold([c.title,c.question,c.thesis,...c.tags].join(' ')).includes(q)));
    $('#chapterMap').innerHTML = rows.length ? rows.map(c => `<a class="map-card${isRead(c.n) ? ' is-read' : ''}" href="#cap-${c.n}"><div class="num">${String(c.n).padStart(2,'0')}</div><div class="part">${partName(c.part)}</div><h3>${c.title}</h3><p>${c.question}</p><div class="tags">${c.tags.slice(0,3).map(t => `<span class="pill">${t}</span>`).join('')}</div>${isRead(c.n) ? '<span class="sr-only">Capítulo concluído.</span>' : ''}</a>`).join('') : '<div class="map-card empty-map"><h3>Nenhum capítulo por aqui.</h3><p>Experimente outro conceito ou limpe a busca e os filtros.</p><button type="button" class="search-reset" data-reset-search>Ver todos os capítulos</button></div>';
    $('#mapResults').textContent = `${rows.length} de 24 capítulos`;
    $('#resetSearch').hidden = !state.query && state.filter === 'all';
    $$('.chapter-tools button[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === state.filter)));
  };

  function refreshProgress() {
    const count = saved.done.length;
    $('.rail-progress').value = count;
    $('#railStatus').textContent = `${count} de 24 capítulos concluídos`;
    $$('[data-read]').forEach(b => { const n = +b.dataset.read, done = isRead(n); b.setAttribute('aria-pressed', String(done)); b.setAttribute('aria-label', `${done ? 'Desmarcar' : 'Marcar como lido'} o capítulo ${n}`); b.textContent = b.classList.contains('dock-read') ? (done ? 'Concluído' : 'Marcar como lido') : (done ? '✓ Capítulo concluído' : 'Marcar como lido'); });
    $$('[data-tick]').forEach(el => el.textContent = isRead(+el.dataset.tick) ? '✓' : '');
    renderMap();
  }
  function refreshContinue() {
    const n = saved.last || 1, c = CHAPTERS[n-1];
    $('#continueReading').href = '#cap-' + n;
    $('#continueLabel').textContent = saved.last ? 'Continuar leitura' : 'Começar a leitura';
    $('#resumeNote').textContent = saved.last ? `Seu marcador: capítulo ${String(n).padStart(2,'0')} · ${c.title}` : 'Escolha um capítulo ou comece pela primeira página.';
  }
  function applyScale() {
    document.documentElement.style.setProperty('--reading-scale', saved.scale);
    const percent = Math.round(saved.scale * 100);
    $$('.text-size-control').forEach(b => { b.setAttribute('aria-label', `Tamanho do texto: ${percent}%. Alterar tamanho`); b.title = `Texto ${percent}% · clique para alterar`; });
  }
  function toggleToc(open) {
    document.body.classList.toggle('toc-open', open);
    $('#tocBtn').setAttribute('aria-expanded', String(open));
    $('#rail').setAttribute('aria-modal', String(open));
    if (open) { $('#rail').setAttribute('role','dialog'); $('#railClose').focus(); }
    else { $('#rail').removeAttribute('role'); $('#rail').removeAttribute('aria-modal'); }
  }
  function toggleFocus() {
    const on = document.body.classList.toggle('focus');
    $('#focusBtn').setAttribute('aria-pressed', String(on));
    $('#focusBtn').setAttribute('aria-label', on ? 'Sair do modo foco' : 'Entrar no modo foco');
    $('#focusBtn').title = on ? 'Sair do modo foco (Esc)' : 'Modo foco';
    redrawAll();
  }
  function updateThemeButton() {
    const dark = state.theme === 'dark';
    $('#themeBtn').setAttribute('aria-pressed', String(dark));
    $('#themeBtn').setAttribute('aria-label', dark ? 'Ativar tema claro' : 'Ativar tema escuro');
    $('#themeBtn').title = dark ? 'Tema claro' : 'Tema escuro';
    document.documentElement.dataset.theme = state.theme;
    $('meta[name="theme-color"]').content = dark ? '#19181e' : '#f7f5f0';
  }

  updateRailActive = function() {
    const sections = $$('main section[id]');
    let current = 'topo';
    const threshold = Math.min(300, Math.max(160, innerHeight * .28));
    for (const section of sections) { if (section.getBoundingClientRect().top <= threshold) current = section.id; }
    if (current === lastActiveId) return;
    lastActiveId = current;
    $$('#rail a').forEach(a => { const selected = a.getAttribute('href') === '#' + current; a.classList.toggle('active', selected); if (selected) a.setAttribute('aria-current','location'); else a.removeAttribute('aria-current'); });
    const match = /^cap-(\d+)$/.exec(current);
    activeChapter = match ? CHAPTERS[+match[1]-1] : null;
    $('#readerDock').hidden = !activeChapter;
    if (!activeChapter) return;
    const n = activeChapter.n;
    if (saved.last !== n) { saved.last = n; persist(); refreshContinue(); }
    const group = $(`#rail details[data-part="${activeChapter.part}"]`);
    $$('#rail details').forEach(d => d.open = d === group);
    $('#dockPart').textContent = `${partName(activeChapter.part)} · ${String(n).padStart(2,'0')} / 24`;
    $('#dockTitle').textContent = activeChapter.title;
    $('#dockPrev').href = n > 1 ? '#cap-' + (n-1) : '#mapa';
    $('#dockPrev').setAttribute('aria-label', n > 1 ? 'Capítulo anterior: ' + CHAPTERS[n-2].title : 'Voltar ao mapa de capítulos');
    $('#dockNext').href = n < 24 ? '#cap-' + (n+1) : '#referencias';
    $('#dockNext').setAttribute('aria-label', n < 24 ? 'Próximo capítulo: ' + CHAPTERS[n].title : 'Ir para referências');
    const b = $('#dockRead'); b.dataset.read = n; b.setAttribute('aria-pressed', String(isRead(n))); b.textContent = isRead(n) ? 'Concluído' : 'Marcar como lido'; b.setAttribute('aria-label', `${isRead(n) ? 'Desmarcar' : 'Marcar como lido'} o capítulo ${n}`);
  };

  // Legendas quebram em linhas antes de invadir a área do gráfico no celular.
  sizeCanvas = function(canvas, height=320) {
    const dpr = Math.min(devicePixelRatio || 1, 2), width = Math.max(180, canvas.getBoundingClientRect().width || 700);
    canvas.width = Math.round(width*dpr); canvas.height = Math.round(height*dpr); canvas.style.height = height+'px';
    const ctx = canvas.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0); return {ctx,w:width,h:height};
  };
  lineChart = function(canvas, series, opt={}) {
    const {ctx,w,h} = sizeCanvas(canvas,opt.h || 320), colors = ['--blue','--red','--gold','--green','--purple'].map(css);
    ctx.font = '11px '+getComputedStyle(document.body).fontFamily;
    let lx=50, ly=12;
    const legend = series.map((s,idx) => { const width=ctx.measureText(s.name).width+36; if(lx+width>w-8 && lx>50){lx=50;ly+=19;} const entry={x:lx,y:ly,width,color:s.color||colors[idx%5],name:s.name}; lx+=width; return entry; });
    const pad={l:50,r:16,t:ly+20,b:38}; grid(ctx,w,h,pad,opt.xTicks||5,opt.yTicks||5);
    const values=series.flatMap(s=>s.data.map(p=>p[1])), xs=series.flatMap(s=>s.data.map(p=>p[0]));
    let ymin=opt.ymin??Math.min(...values), ymax=opt.ymax??Math.max(...values), xmin=opt.xmin??Math.min(...xs), xmax=opt.xmax??Math.max(...xs);
    if(ymax===ymin){ymax+=1;ymin-=1} const span=ymax-ymin; ymin-=span*.08;ymax+=span*.08;if(xmax===xmin)xmax=xmin+1;
    const X=x=>pad.l+(x-xmin)/(xmax-xmin)*(w-pad.l-pad.r),Y=y=>h-pad.b-(y-ymin)/(ymax-ymin)*(h-pad.t-pad.b);
    ctx.font='10px '+getComputedStyle(document.body).fontFamily;ctx.fillStyle=css('--muted');ctx.textAlign='right';
    for(let i=0;i<=5;i++){const v=ymin+(ymax-ymin)*i/5;ctx.fillText(fmt(v,opt.decimals??1),pad.l-7,Y(v)+4)}
    ctx.textAlign='center';for(let i=0;i<=5;i++){const v=xmin+(xmax-xmin)*i/5;ctx.fillText(opt.xFormat?opt.xFormat(v):fmt(v,0),X(v),h-14)}
    series.forEach((s,i)=>{ctx.strokeStyle=s.color||colors[i%5];ctx.lineWidth=s.width||2.3;ctx.setLineDash(s.dash||[]);ctx.beginPath();s.data.forEach((p,j)=>j?ctx.lineTo(X(p[0]),Y(p[1])):ctx.moveTo(X(p[0]),Y(p[1])));ctx.stroke();ctx.setLineDash([]);if(s.points){ctx.fillStyle=ctx.strokeStyle;s.data.forEach(p=>{ctx.beginPath();ctx.arc(X(p[0]),Y(p[1]),4,0,2*Math.PI);ctx.fill()})}});
    ctx.font='11px '+getComputedStyle(document.body).fontFamily;ctx.textAlign='left';legend.forEach(item=>{ctx.fillStyle=item.color;ctx.fillRect(item.x,item.y-5,14,3);ctx.fillStyle=css('--muted');ctx.fillText(item.name,item.x+20,item.y)});
    if(opt.xLabel){ctx.fillStyle=css('--faint');ctx.textAlign='right';ctx.fillText(opt.xLabel,w-pad.r,h-3)}return {ymin,ymax,xmin,xmax};
  };
  const previousLabSeries=labSeries;
  labSeries=function(type,p){
    const result=previousLabSeries(type,p);
    if(type==='risk') result.series.push({name:'alavancagem selecionada',data:[[p.leverage,.8+.18*Math.pow(p.leverage,1.55)+.65*p.stress]],points:true});
    if(type==='monetary') result.series.push({name:'hiato selecionado',data:[[p.gap,4+1.5*(p.inflation-2)+.5*p.gap]],points:true});
    return result;
  };

  renderParts(); renderRail(); renderMap(); refreshContinue(); applyScale(); updateThemeButton();
  CHAPTERS.forEach(c => {
    const section=$('#cap-'+c.n), words=(c.thesis+' '+c.concepts.flat().join(' ')+' '+c.bridge).split(/\s+/).length;
    const tools=document.createElement('div'); tools.className='chapter-reading-tools';tools.innerHTML=`<span>LEITURA · ${Math.max(2,Math.ceil(words/180))} MIN + LABORATÓRIO</span>${makeReadButton(c.n)}`;
    $('.chapter-header',section).after(tools);
  });
  $$('.control input').forEach((input,i)=>{ if(!input.id)input.id='reader-control-'+i; const label=$('label',input.closest('.control'));if(label)label.htmlFor=input.id; });
  $('#formulaDialog').setAttribute('aria-labelledby','dlgTitle');$('#formulaDialog').setAttribute('aria-describedby','dlgExplain');
  $('#tocBtn').onclick=()=>toggleToc(!document.body.classList.contains('toc-open'));
  $('#railClose').onclick=()=>{toggleToc(false);$('#tocBtn').focus()};
  $('#tocBackdrop').onclick=()=>{toggleToc(false);$('#tocBtn').focus()};
  $('#rail').addEventListener('click',e=>{if(e.target.closest('a'))toggleToc(false)});
  $('#focusBtn').onclick=toggleFocus;
  $('#themeBtn').onclick=()=>{state.theme=state.theme==='light'?'dark':'light';safeStorage.set('macro-theme',state.theme);updateThemeButton();redrawAll()};
  $$('.text-size-control').forEach(b=>b.onclick=()=>{saved.scale=saved.scale===1?1.12:saved.scale===1.12?1.24:1;applyScale();persist();redrawAll();announce(`Texto em ${Math.round(saved.scale*100)}%`)});
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-read]');
    if(b){const n=+b.dataset.read;if(!CHAPTERS[n-1])return;saved.done=isRead(n)?saved.done.filter(x=>x!==n):[...saved.done,n];persist();refreshProgress();announce(isRead(n)?`Capítulo ${n} concluído. Seu progresso foi salvo.`:`Capítulo ${n} desmarcado.`)}
    if(e.target.closest('[data-reset-search]')){state.query='';state.filter='all';$('#chapterSearch').value='';$$('.chapter-tools button').forEach(x=>x.classList.toggle('active',x.dataset.filter==='all'));renderMap();$('#chapterSearch').focus()}
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){if(document.body.classList.contains('toc-open')){toggleToc(false);$('#tocBtn').focus()}else if(!$('#formulaDialog').open && document.body.classList.contains('focus'))toggleFocus()}
    if(e.key==='Tab'&&document.body.classList.contains('toc-open')){const elements=$$('button,a,summary,input',$('#rail')).filter(el=>el.getClientRects().length&&!el.disabled),first=elements[0],last=elements.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}
  });
  const presets=$$('.preset-row button');presets.forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.preset==='base'));b.addEventListener('click',()=>presets.forEach(x=>x.setAttribute('aria-pressed',String(x===b))))});
  $('#macroControls').addEventListener('input',()=>presets.forEach(x=>x.setAttribute('aria-pressed','false')));
  const stage=$('.book-stage'), reduced=matchMedia('(prefers-reduced-motion: reduce)');
  stage.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||reduced.matches||stage.classList.contains('is-front'))return;const r=stage.getBoundingClientRect();stage.style.setProperty('--book-y',`${-24+(e.clientX-r.left-r.width/2)/r.width*15}deg`);stage.style.setProperty('--book-x',`${7-(e.clientY-r.top-r.height/2)/r.height*9}deg`)});
  stage.addEventListener('pointerleave',()=>{stage.style.removeProperty('--book-x');stage.style.removeProperty('--book-y')});
  $('#bookTurnBtn').onclick=()=>{const front=stage.classList.toggle('is-front');$('#bookTurnBtn').setAttribute('aria-pressed',String(front));$('#bookTurnBtn').textContent=front?'Voltar à perspectiva 3D ↗':'Ver capa de frente ↗'};
  exportCanvas=function(id){const c=document.getElementById(id);if(!c)return;const a=document.createElement('a');a.download=`blanchard-${id}.png`;a.href=c.toDataURL('image/png');a.click();announce('Gráfico exportado em PNG.')};
  window.addEventListener('resize',()=>{if(innerWidth>1000&&document.body.classList.contains('toc-open'))toggleToc(false)});
  $('#backTop').onclick=()=>{location.hash='topo'};
  redrawAll();updateRailActive();
})();