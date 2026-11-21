/* =====================================================================
   Interface: navegação, seletor em árvore, roteador, cartões
   ===================================================================== */
const IC = {
  scale: '<path d="M12 3v18M5 7h14M5 7l-3 7a3.5 2 0 0 0 6 0zM19 7l-3 7a3.5 2 0 0 0 6 0zM8 21h8"/>',
  dots: '<circle cx="7" cy="15" r="3"/><circle cx="16" cy="8" r="4"/><circle cx="17" cy="18" r="2"/>',
  book: '<path d="M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3z"/><path d="M4 17a3 3 0 0 1 3-3h11"/>',
  bars: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  flow: '<path d="M3 6h7l3 6 3-6h5M3 18h7l3-6M16 18h5"/>',
  spread: '<path d="M4 18 L9 12 L13 15 L20 6"/><path d="M4 21h16"/><path d="M16 6h4v4"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  pillar: '<path d="M3 21h18M5 18h14M6 18V9M10 18V9M14 18V9M18 18V9M3 9l9-6 9 6z"/>',
  wave: '<path d="M2 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0"/><path d="M2 18h20"/>',
  ladder: '<path d="M4 20V4M20 20V4M4 8h16M4 13h16M4 18h16"/>',
  coin: '<circle cx="12" cy="12" r="8"/><path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.7 0-2.8 1-2.8 2.2 0 2.8 5.6 1.6 5.6 4.3 0 1.2-1.2 2.2-2.8 2.2-1.2 0-2.3-.6-2.8-1.6M12 6.5V8M12 16v1.5"/>',
  radar: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 12 18 6"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  versus: '<path d="M4 6h6v12H4zM14 6h6v12h-6z"/><path d="M10 12h4"/>',
  books: '<path d="M4 19V5M8 19V5M12 19 15 5l4 1-3 14"/><path d="M3 19h18"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  bank: '<path d="M3 21h18M4 10h16M12 3 3 8h18zM6 10v8M10 10v8M14 10v8M18 10v8"/>',
  coop: '<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M3 20c0-3 2.5-5 5-5s5 2 5 5M11 20c0-3 2.5-5 5-5s5 2 5 5"/>',
  net: '<circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="18" r="2.5"/><circle cx="19" cy="18" r="2.5"/><path d="M12 7.5v4M12 11.5 6.5 16M12 11.5l5.5 4.5"/>',
  chev: '<path d="m9 6 6 6-6 6"/>',
  car: '<path d="m6 9 6 6 6-6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 18h7M17.5 14.5v7"/>',
  sankey: '<path d="M3 5h4c5 0 5 7 10 7h4M3 12h4c5 0 5-7 10-7h4M3 19h4c4 0 6-3 10-3h4"/>',
  camel: '<path d="M4 20V9l4-4 4 4 4-4 4 4v11"/><path d="M4 14h16"/>',
  pearl: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  ras: '<path d="M12 3a9 9 0 1 0 9 9"/><path d="M12 7v5l3 2"/><path d="M16 3h5v5"/>',
  funnel: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
};
const ico = (k, s = 18) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${IC[k] || ''}</svg>`;

const NAV = [
  { g: 'Visão', items: [{ id: 'balanca', t: 'Balança da intermediação', ic: 'scale' }, { id: 'painel', t: 'Painel de métricas', ic: 'grid', tag: 'A×B' }, { id: 'universo', t: 'Universo & ranking', ic: 'dots' }] },
  { g: 'Demonstrações', items: [{ id: 'balancete', t: 'Balancete COSIF', ic: 'book', tag: '4010' }, { id: 'dre', t: 'DRE', ic: 'bars' }, { id: 'sankey', t: 'Resultado em fluxo', ic: 'sankey', tag: 'P&L' }, { id: 'dfc', t: 'DFC · fluxo de caixa', ic: 'flow' }, { id: 'spread', t: 'Spread', ic: 'spread' }] },
  { g: 'Riscos', items: [{ id: 'credito', t: 'Risco de crédito', ic: 'shield', tag: 'SCR' }, { id: 'capital', t: 'Capital & Basileia', ic: 'pillar' }, { id: 'mercado', t: 'Mercado & tesouraria', ic: 'wave', tag: 'VaR' }, { id: 'alm', t: 'ALM, IRRBB & liquidez', ic: 'ladder' }, { id: 'nii', t: 'NII & pricing', ic: 'coin' }, { id: 'frm', t: 'FRM 360°', ic: 'radar' }] },
  { g: 'Análises', items: [{ id: 'camels', t: 'CAMELS', ic: 'camel' }, { id: 'pearls', t: 'PEARLS (WOCCU)', ic: 'pearl' }, { id: 'ras', t: 'RAS · apetite a riscos', ic: 'ras' }, { id: 'rating', t: 'Rating estilo FGCoop', ic: 'star' }, { id: 'comparar', t: 'Comparar IFs', ic: 'versus' }] },
  { g: 'Referências', items: [{ id: 'biblioteca', t: 'Biblioteca', ic: 'books' }, { id: 'metodologia', t: 'Metodologia & dados', ic: 'info' }] },
];
const VIEW_IDS = NAV.flatMap(g => g.items.map(i => i.id));
const VIEW_T = Object.fromEntries(NAV.flatMap(g => g.items.map(i => [i.id, i.t])));

/* ---------------- estado / rota ---------------- */
const ST = { v: 'balanca', e: 'G:coop', a: 'S:sicredi', b: 'S:sicoob', ui: {} };
let HEAD_NODE = null;
function readHash() {
  const p = new URLSearchParams(location.hash.slice(1));
  const v = p.get('v'); if (v && VIEW_IDS.includes(v)) ST.v = v;
  const e = p.get('e'); if (e && NODES.has(e)) ST.e = e;
  const a = p.get('a'); if (a && NODES.has(a)) ST.a = a;
  const b = p.get('b'); if (b && NODES.has(b)) ST.b = b;
  const d = p.get('d'); if (d && D.Q.includes(d)) setBase(D.Q.indexOf(d));
}
function writeHash() {
  const p = new URLSearchParams(); p.set('v', ST.v); p.set('e', ST.e); p.set('d', D.Q[QI]);
  if (ST.v === 'comparar' || ST.v === 'painel') { p.set('a', ST.a); p.set('b', ST.b); }
  const h = '#' + p.toString(); if (location.hash !== h) history.replaceState(null, '', h);
}
function go(v, e) { if (v) ST.v = v; if (e) ST.e = e; writeHash(); render(true); }
addEventListener('hashchange', () => { readHash(); render(true); });

/* ---------------- navegação ---------------- */
function buildNav() {
  $('#nav').innerHTML = NAV.map(g => `<h6>${g.g}</h6>` + g.items.map(i => `<a href="#v=${i.id}" data-v="${i.id}">${ico(i.ic)}<span>${i.t}</span>${i.tag ? `<em class="tag">${i.tag}</em>` : ''}</a>`).join('')).join('');
  $('#mtabs').innerHTML = NAV.flatMap(g => g.items).map(i => `<a href="#v=${i.id}" data-v="${i.id}">${i.t}</a>`).join('');
  $$('#nav a, #mtabs a').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); closeSide(); go(a.dataset.v); }));
}
function markNav(center) {
  $$('#nav a, #mtabs a').forEach(a => a.classList.toggle('on', a.dataset.v === ST.v));
  if (center === false) return;
  // centraliza a aba ativa só na horizontal (scrollIntoView também rolaria a página)
  const mt = $('#mtabs'), on = $('#mtabs a.on');
  if (on && mt && mt.scrollWidth > mt.clientWidth) mt.scrollLeft += (on.getBoundingClientRect().left - mt.getBoundingClientRect().left) - (mt.clientWidth - on.offsetWidth) / 2;
}
const side = $('#side'), scrim = $('#scrim');
function closeSide() { side.classList.remove('open'); scrim.classList.remove('on'); }
$('#hamb').onclick = () => { side.classList.add('open'); scrim.classList.add('on'); };
scrim.onclick = closeSide;
$('#themeBtn').onclick = () => {
  const cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const nx = cur === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = nx;
  try { localStorage.setItem('radar-theme', nx); } catch (e) { }
  render(false);
};
try { const t = localStorage.getItem('radar-theme'); if (t) document.documentElement.dataset.theme = t; } catch (e) { }
$('#shareBtn').onclick = async () => {
  writeHash();
  try { await navigator.clipboard.writeText(location.href); $('#shareBtn span').textContent = 'Copiado'; } catch (e) { $('#shareBtn span').textContent = 'Copie a URL'; }
  setTimeout(() => { $('#shareBtn span').textContent = 'Link'; }, 1600);
};

/* ---------------- seletor em árvore ---------------- */
const PICKERS = [];
function closePickers(except) { PICKERS.forEach(p => { if (p !== except) p.close(); }); }
document.addEventListener('pointerdown', e => { PICKERS.forEach(p => { if (!p.root.contains(e.target)) p.close(); }); });
function nodeIcon(n) {
  const col = n.kind === 'bank' || n.id === 'G:bank' ? 'linear-gradient(145deg,#C9A24A,#8E6A1F)' : `linear-gradient(145deg,color-mix(in srgb,${n.color} 85%,#fff),${n.color})`;
  const k = n.kind === 'bank' || n.id === 'G:bank' ? 'bank' : n.kind === 'group' ? 'coop' : n.kind === 'system' ? 'net' : n.kind === 'central' ? 'net' : 'coop';
  return `<span class="pk-ic" style="background:${col}">${ico(k, 18)}</span>`;
}
function crumb(n) { return n.path.map(id => node(id).name).join(' › '); }
function makePicker(host, o) {
  host.innerHTML = `<button class="pk-btn" type="button" aria-haspopup="tree" aria-expanded="false"></button>
  <div class="pk-pan" role="dialog" aria-label="Escolher instituição"><div class="pk-search">${ico('search', 16)}<input type="search" placeholder="Buscar cooperativa, sistema, banco, cidade ou UF…" aria-label="Buscar"></div><div class="pk-list" role="tree"></div></div>`;
  if (o.align === 'right') host.classList.add('right');
  const btn = $('.pk-btn', host), pan = $('.pk-pan', host), inp = $('input', host), list = $('.pk-list', host);
  const P = { root: host, value: o.value, exp: new Set(['G:coop', 'G:bank']), kb: -1, rows: [] };
  const paint = () => {
    const n = node(P.value);
    btn.innerHTML = `${nodeIcon(n)}<span class="pk-t"><b>${esc(n.name)}</b><small>${esc(crumb(n))}${n.kind === 'group' || n.kind === 'system' ? ' · ' + n.members.length + ' instituições' : ''}</small></span><span class="pk-cta">${o.cta || 'Filtrar'}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6">${IC.car}</svg></span>`;
  };
  const row = (id, lvl, extra = {}) => {
    const n = node(id), hasKids = n.kind === 'group' || n.kind === 'system';
    const at = n.kind === 'group' || n.kind === 'system' ? sum(n.members.map(at0)) : at0(n.ent);
    const sm = n.kind === 'system' ? `${n.members.length}` : n.kind === 'group' ? `${n.members.length} IFs` : n.kind === 'central' ? 'central' : (n.ent.uf || n.ent.sr || '');
    return `<div class="pk-row l${lvl}${P.exp.has(id) ? ' exp' : ''}${id === P.value ? ' sel' : ''}" role="treeitem" data-id="${id}" ${hasKids ? `aria-expanded="${P.exp.has(id)}"` : ''}>
      ${hasKids ? `<span class="tw" data-tw="${id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">${IC.chev}</svg></span>` : '<span class="tw"></span>'}
      <i class="dot" style="background:${n.color}"></i><span class="nm">${esc(extra.label || n.name)}<small>${esc(extra.sub || sm)}</small></span><span class="vl tnum">${brl(at)}</span></div>`;
  };
  const build = () => {
    const q = inp.value.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    let h = '';
    if (q.length >= 2) {
      const hits = [];
      for (const n of NODES.values()) {
        const hay = (n.name + ' ' + (n.ent ? (n.ent.nf || '') + ' ' + (n.ent.mu || '') + ' ' + (n.ent.uf || '') + ' ' + (n.ent.ce || '') : '') + ' ' + (n.sys ? SYS_NAME[n.sys] : '')).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
        if (hay.includes(q)) hits.push(n);
        if (hits.length > 120) break;
      }
      hits.sort((a, b) => (a.kind === 'group' ? -2 : a.kind === 'system' ? -1 : 0) - (b.kind === 'group' ? -2 : b.kind === 'system' ? -1 : 0) || (b.ent ? at0(b.ent) : 1e15) - (a.ent ? at0(a.ent) : 1e15));
      h = hits.length ? hits.map(n => row(n.id, 1, { sub: n.path.slice(0, -1).map(id => node(id).name).join(' › ') || n.sub })).join('') : '<div class="pk-empty">Nenhuma instituição encontrada.</div>';
    } else {
      h += row('G:coop', 0);
      if (P.exp.has('G:coop')) for (const s of SYS_ORDER) {
        const sid = 'S:' + s; if (!NODES.has(sid)) continue;
        h += row(sid, 1);
        if (P.exp.has(sid)) {
          const sn = node(sid);
          h += sn.members.map(e => row(e.id, 2, { sub: (e.uf || '') + (e.ce && s !== 'indep' ? ' · ' + e.ce.replace(/^Central /i, '') : '') })).join('');
          if (sn.cents && sn.cents.length) h += `<div class="pk-sub">Centrais (2º grau) · não somadas</div>` + sn.cents.map(e => row(e.id, 2, { sub: 'central' })).join('');
        }
      }
      h += row('G:bank', 0);
      if (P.exp.has('G:bank')) h += BANKS.map(e => row(e.id, 1, { sub: e.sr || '' })).join('');
    }
    list.innerHTML = h;
    P.rows = $$('.pk-row', list); P.kb = P.rows.findIndex(r => r.dataset.id === P.value);
    if (P.kb >= 0) P.rows[P.kb].classList.add('kb');
  };
  P.open = () => {
    closePickers(P); host.classList.remove('hint');
    const n = node(P.value); n.path.forEach(id => { if (id !== P.value || n.kind === 'system') P.exp.add(id); });
    host.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); inp.value = ''; build();
    const s = $('.pk-row.sel', list); if (s) s.scrollIntoView({ block: 'center' });
    setTimeout(() => inp.focus(), 30);
  };
  P.close = () => { host.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); };
  P.set = v => { P.value = v; paint(); };
  btn.onclick = () => host.classList.contains('open') ? P.close() : P.open();
  inp.oninput = build;
  list.addEventListener('click', e => {
    const tw = e.target.closest('[data-tw]');
    if (tw) { const id = tw.dataset.tw; P.exp.has(id) ? P.exp.delete(id) : P.exp.add(id); build(); return; }
    const r = e.target.closest('.pk-row'); if (!r) return;
    P.value = r.dataset.id; paint(); P.close(); o.onChange(P.value);
  });
  inp.addEventListener('keydown', e => {
    if (!P.rows.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); if (P.kb >= 0) P.rows[P.kb].classList.remove('kb');
      P.kb = clamp(P.kb + (e.key === 'ArrowDown' ? 1 : -1), 0, P.rows.length - 1);
      P.rows[P.kb].classList.add('kb'); P.rows[P.kb].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault(); const r = P.rows[Math.max(0, P.kb)]; P.value = r.dataset.id; paint(); P.close(); o.onChange(P.value);
    } else if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && !inp.value) {
      const r = P.rows[P.kb]; if (!r) return; const id = r.dataset.id; const n = node(id);
      if (n.kind === 'group' || n.kind === 'system') { e.preventDefault(); e.key === 'ArrowRight' ? P.exp.add(id) : P.exp.delete(id); build(); }
    }
  });
  paint(); PICKERS.push(P);
  return P;
}

/* ---------------- cartões e KPIs ---------------- */
function el(tag, cls, html) { const d = document.createElement(tag); if (cls) d.className = cls; if (html != null) d.innerHTML = html; return d; }
let DELAY = 0;
function card(parent, o) {
  if (!o.fx && typeof fxFor === 'function') o.fx = fxFor(o.title);
  const c = el('section', 'card ' + (o.cls || '') + (STILL ? ' ni' : ''));
  if (!STILL) { c.style.animationDelay = Math.min(DELAY, 700) + 'ms'; DELAY += 60; }
  c.innerHTML = `<header class="card-h"><div><h3>${o.title}</h3>${o.sub ? `<span class="sub">${o.sub}</span>` : ''}</div><div class="tools">${o.src ? o.src.map(s => `<span class="src ${s[1] || ''}">${s[0]}</span>`).join('') : ''}${infoBtn(o.fx)}</div></header><div class="card-b"></div>`;
  parent.appendChild(c);
  const b = $('.card-b', c);
  return { c, b, tools: $('.tools', c) };
}
function grid(parent, cls) { const g = el('div', 'grid ' + (cls || 'g12')); parent.appendChild(g); return g; }
function kpi(parent, o) {
  if (!o.fx && typeof fxFor === 'function') o.fx = fxFor(o.l);
  const k = el('div', 'kpi ' + (o.cls || '') + (STILL ? ' ni' : ''));
  if (!STILL) { k.style.animationDelay = Math.min(DELAY, 600) + 'ms'; DELAY += 40; }
  const v = typeof o.v === 'object' ? `<span data-count="${o.v.n}" data-fmt="${o.v.f}">${(FMT[o.v.f] || int)(o.v.n)}</span>` : o.v;
  k.innerHTML = `<div class="l">${o.l}${o.fx ? infoBtn(o.fx).replace('class="info"', 'class="info" style="width:17px;height:17px;font-size:9.5px"') : ''}</div><div class="v tnum">${v}${o.u ? `<small>${o.u}</small>` : ''}</div><div class="d">${o.d || ''}</div>${o.sk || ''}`;
  parent.appendChild(k); reveal(k);
  return k;
}
function delta(x, o = {}) {
  if (!ok(x)) return '<span class="dl flat">—</span>';
  const good = o.inv ? x < 0 : x > 0, cls = Math.abs(x) < (o.eps || 1e-4) ? 'flat' : good ? 'up' : 'dn';
  return `<span class="dl ${cls}">${x > 0 ? '▲' : x < 0 ? '▼' : '■'} ${(o.fmt || (v => pct(v, 1)))(Math.abs(x))}</span>`;
}
function head(parent, eyebrow, title, desc, actions) {
  const cr = HEAD_NODE ? `<div class="crumbs">${HEAD_NODE.path.map((id, i) => (i ? '<span>›</span>' : '') + `<a href="#" data-go="${id}">${esc(node(id).name)}</a>`).join('')}<span style="margin-left:8px">· data-base ${mlab(D.Q[QI])}${QI < NQ - 1 ? ' (histórica)' : ''}</span></div>` : '';
  const h = el('div', 'vh', `<div style="min-width:0;flex:1 1 520px"><div class="eyebrow">${eyebrow}</div><h1>${title}</h1>${cr}${desc ? `<p>${desc}</p>` : ''}</div>${actions ? `<div class="act">${actions}</div>` : ''}`);
  $$('[data-go]', h).forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); ST.e = a.dataset.go; writeHash(); render(false); }));   // mesma tela: troca no lugar
  parent.appendChild(h); return h;
}
function segCtl(opts, val, onPick) {
  const d = el('div', 'seg');
  d.innerHTML = opts.map(o => `<button type="button" data-k="${o[0]}" class="${o[0] === val ? 'on' : ''}">${o[1]}</button>`).join('');
  d.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('button', d).forEach(x => x.classList.toggle('on', x === b)); onPick(b.dataset.k); });
  return d;
}
function slider(parent, o) {
  const w = el('div', 'rng');
  const id = 'r' + Math.random().toString(36).slice(2, 8);
  w.innerHTML = `<label for="${id}">${o.label}</label><output for="${id}"></output><input id="${id}" type="range" min="${o.min}" max="${o.max}" step="${o.step}" value="${o.value}">`;
  const inp = $('input', w), out = $('output', w);
  const upd = () => { out.textContent = o.fmt(+inp.value); };
  inp.addEventListener('input', () => { upd(); o.onInput(+inp.value); });
  upd(); parent.appendChild(w);
  return inp;
}
/* ---------------- re-render no lugar ----------------
   Trocar instituição, data-base, tema ou qualquer controle dentro da tela remonta a visão sem voltar ao topo: antes de
   montar, guarda a posição na tela do elemento clicado (ou do primeiro bloco visível), o foco e as rolagens internas;
   depois de montar, devolve cada um ao mesmo lugar. A troca de tela continua começando do topo. */
let LAST_PTR = null, LAST_KEY = 0;
document.addEventListener('pointerdown', e => { LAST_PTR = { el: e.target, t: performance.now() }; }, true);
document.addEventListener('keydown', () => { LAST_KEY = performance.now(); }, true);
const KBLK = '.card, .kpi, .ctlbar, .vh, .take, .book, .shelf, #view > h2';
const KSCR = '.tblwrap, .scale-scroll, .sk-wrap, .fx';
const KFOC = 'button, select, input, textarea, a[href], [tabindex]';
const KKEY = KFOC + ', tr, [data-k], [data-seg], [data-code], [data-id], [data-g], [data-v], [data-go]';
function kPath(e, root) { const p = []; while (e && e !== root) { const par = e.parentElement; if (!par) return null; p.unshift(Array.prototype.indexOf.call(par.children, e)); e = par; } return e === root ? p : null; }
function kAt(root, p) { let e = root; for (const i of p) { e = e.children[i]; if (!e) return null; } return e; }
function kSig(e) { let s = e.tagName.toLowerCase(); for (const a of e.attributes) if (a.name.startsWith('data-') && a.name !== 'data-count') s += `[${a.name}="${CSS.escape(a.value)}"]`; return s; }
function kTitle(b) { const h = b.querySelector('h3, h1, .l, h4, label'); return ((h || b).textContent || '').trim().slice(0, 90); }
function kTopH() { const t = $('.top'); return t ? Math.max(0, t.getBoundingClientRect().bottom) : 0; }
function kDesc(e, V) {
  const b0 = e.closest(KBLK), b = b0 && b0 !== V && V.contains(b0) ? b0 : null;
  return { p: kPath(e, V), sig: kSig(e), top: e.getBoundingClientRect().top, bp: b && kPath(b, V), bt: b && kTitle(b), btop: b && b.getBoundingClientRect().top, rp: b && kPath(e, b) };
}
function kFind(V, d) {
  if (!d || !d.p) return null;
  const e = kAt(V, d.p);
  if (e && kSig(e) === d.sig) return { el: e, top: d.top };
  if (!d.bp) return null;
  let b = kAt(V, d.bp);
  if (!b || !b.matches(KBLK) || kTitle(b) !== d.bt) { const c = $$(KBLK, V).filter(x => kTitle(x) === d.bt); if (c.length) b = c[0]; }
  if (!b) return null;
  const e2 = d.rp && kAt(b, d.rp); if (e2 && kSig(e2) === d.sig) return { el: e2, top: d.top };
  if (d.sig.includes('[data-')) { const c = b.querySelectorAll(d.sig); if (c.length === 1) return { el: c[0], top: d.top }; }
  return { el: b, top: d.btop };
}
function keepSnap(V) {
  const s = { y: scrollY, anchor: null, focus: null, sc: [] }, top = kTopH();
  const live = x => x && x !== V && V.contains(x) && x.getClientRects().length > 0;
  const vis = x => { const r = x.getBoundingClientRect(); return r.bottom > top && r.top < innerHeight; };
  const ae = document.activeElement, now = performance.now();
  let a = null;
  if (LAST_PTR && now - LAST_PTR.t < 4000 && LAST_PTR.t >= LAST_KEY && live(LAST_PTR.el) && vis(LAST_PTR.el)) a = LAST_PTR.el;   // clique
  else if (live(ae) && vis(ae)) a = ae;                                                                                          // teclado
  if (a) { const k = a.closest(KKEY); if (k && k !== V && V.contains(k)) a = k; }                                              // sobe do <circle>/<span> clicado até o controle
  if (!a) a = $$(KBLK, V).find(b => b.getBoundingClientRect().bottom > top + 4) || null;                                       // primeiro bloco visível
  if (a) s.anchor = kDesc(a, V);
  if (live(ae) && ae.matches(KFOC)) s.focus = kDesc(ae, V);
  $$(KSCR, V).forEach(x => { if (x.scrollLeft || x.scrollTop) s.sc.push({ d: kDesc(x, V), l: x.scrollLeft, t: x.scrollTop }); });
  return s;
}
function keepRestore(V, s) {
  for (const x of s.sc) { const f = kFind(V, x.d); if (f && f.el.matches(KSCR)) { f.el.scrollLeft = x.l; f.el.scrollTop = x.t; } }
  const f = kFind(V, s.anchor);
  const y = f ? scrollY + f.el.getBoundingClientRect().top - f.top : s.y;
  window.scrollTo(0, Math.max(0, y));
  const g = kFind(V, s.focus);
  if (g && g.el.matches(KFOC) && kSig(g.el) === s.focus.sig && g.el.getClientRects().length) { try { g.el.focus({ preventScroll: true }); } catch (e) { } }
}

/* ---------------- música de abertura: Sarabanda (G. F. Händel, Suíte em ré menor HWV 437) ----------------
   Arranjo e gravação: zero-project (zero-project.gr), licença CC BY 4.0. Toca ao abrir — ou no primeiro clique, toque
   ou tecla, porque os navegadores só liberam som depois de um gesto do visitante. O botão no canto inferior direito
   liga e desliga com fade; a escolha fica guardada no navegador e a música pausa com a aba em segundo plano. */
const MUSIC = (() => {
  const btn = $('#musicBtn'); if (!btn) return { start() { } };
  const SRC = 'assets/radar/sarabanda-handel.mp3', VOL = 0.3;
  let want = true; try { want = localStorage.getItem('radar-music') !== 'off'; } catch (e) { }
  const au = new Audio(); au.loop = true; au.preload = 'none'; au.volume = 0;
  let fadeT = null, hid = false;
  const save = () => { try { localStorage.setItem('radar-music', want ? 'on' : 'off'); } catch (e) { } };
  const paint = () => {
    const on = !au.paused;
    btn.classList.toggle('on', on); btn.classList.toggle('wait', want && !on);
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', on ? 'Silenciar a música' : 'Tocar a música');
    btn.title = (on ? 'Silenciar' : 'Tocar') + ' · Sarabanda (G. F. Händel, HWV 437) — arranjo e gravação: zero-project · CC BY 4.0';
  };
  const fade = (to, ms, done) => {
    clearInterval(fadeT); const from = au.volume, t0 = performance.now();
    fadeT = setInterval(() => { const p = Math.min(1, (performance.now() - t0) / ms); au.volume = clamp(from + (to - from) * p, 0, 1); if (p >= 1) { clearInterval(fadeT); fadeT = null; if (done) done(); } }, 40);
  };
  const play = () => {
    if (!au.src) au.src = SRC;
    const p = au.play();
    if (p && p.then) p.then(() => { fade(VOL, 2500); paint(); }, () => paint()); else paint();
  };
  const stop = () => fade(0, 400, () => { au.pause(); paint(); });
  btn.addEventListener('click', () => { if (!au.paused && want) { want = false; stop(); } else { want = true; play(); } save(); paint(); });
  // primeiro gesto em qualquer ponto da página libera o som (o próprio botão decide sozinho)
  const unkick = () => { document.removeEventListener('pointerdown', kick, true); document.removeEventListener('keydown', kick, true); };
  const kick = e => { if (btn.contains(e.target)) return; unkick(); if (want && au.paused) play(); };
  document.addEventListener('pointerdown', kick, true); document.addEventListener('keydown', kick, true);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (!au.paused) { hid = true; clearInterval(fadeT); au.pause(); } }
    else if (hid) { hid = false; if (want) { au.volume = 0; play(); } }
  });
  au.addEventListener('error', () => { btn.hidden = true; });
  au.addEventListener('play', paint); au.addEventListener('pause', paint);
  paint();
  return { start() { if (want) play(); }, au };
})();

const nameOf = n => n.kind === 'group' ? (n.id === 'G:coop' ? 'Cooperativas (soma das singulares)' : 'Bancões (soma)') : n.kind === 'system' ? 'Sistema ' + n.name + (n.sys === 'indep' ? '' : ' (soma das singulares)') : n.name;
const peerLbl = n => n.grp === 'bank' ? 'bancões' : 'cooperativas singulares';
