/* =====================================================================
   Rating, comparar, universo, biblioteca, metodologia, fórmulas e init
   ===================================================================== */
const RCACHE = new Map();
const CLASSES = [['AAA', 90, 'Risco muito baixo'], ['AA', 80, 'Risco baixo'], ['A', 70, 'Risco moderado-baixo'], ['BBB', 60, 'Risco moderado'], ['BB', 50, 'Risco elevado'], ['B', 40, 'Risco alto'], ['CCC', -1, 'Risco muito alto']];
const CLS_COL = { AAA: '#0a7d0a', AA: '#2f9e44', A: '#5c9e2f', BBB: '#C49A3E', BB: '#ec835a', B: '#d0563b', CCC: '#b42f2f' };
function ratingOf(n) {
  const rk_ = n.id + '|' + QI;
  if (RCACHE.has(rk_)) return RCACHE.get(rk_);
  const m = metrics(n);
  const sc = (x, bad, good) => ok(x) ? clamp((x - bad) / (good - bad), 0, 1) * 100 : NaN;
  const p2 = x => pct(x, 2), p0 = x => pct(x, 0), p1 = x => pct(x, 1);
  const P = [
    { t: 'Capital', w: .25, items: [['Índice de Basileia', m.ib, .105, .22, p1], ['PL ÷ ativo', div(m.pl, m.at), .06, .16, p1], ['Imobilização', m.imob, .5, .15, p1]] },
    { t: 'Carteira', w: .25, items: [['Inadimplência 90d', m.inadR, .08, .015, p2], ['Ativos problemáticos', m.probR, .12, .03, p2], ['Estágio 3', m.e3R, .10, .025, p2], ['Cobertura PE ÷ problemáticos', m.cob, .4, 1.2, p0]] },
    { t: 'Rentabilidade', w: .15, items: [['ROA', m.roa, 0, .025, p2], ['ROE', m.roe, 0, .20, p1]] },
    { t: 'Eficiência', w: .10, items: [['Índice de eficiência', m.eff, .9, .4, p0]] },
    { t: 'Liquidez', w: .15, items: [['Ativos líquidos ÷ ativo', m.liqA, .08, .35, p0], ['Crédito ÷ captações', m.ltdC, 1.25, .7, p0]] },
    { t: 'Funding e juros', w: .10, items: [['Depósitos ÷ captações', m.depShare, .4, .9, p0], ['Capital IRRBB ÷ PR', m.irrbbPR, .15, .02, p1]] },
  ];
  let tw = 0, ts = 0;
  P.forEach(p => { p.items = p.items.map(([l, x, bad, good, f]) => ({ l, x, bad, good, f, s: sc(x, bad, good) })); const v = p.items.map(i => i.s).filter(ok); p.s = v.length ? mean(v) : NaN; if (ok(p.s)) { tw += p.w; ts += p.w * p.s; } });
  const score = tw ? ts / tw : NaN;
  const c = CLASSES.find(x => score >= x[1]) || CLASSES[CLASSES.length - 1];
  const r = { score, cls: ok(score) ? c[0] : '—', band: ok(score) ? c[2] : '', pillars: P };
  RCACHE.set(rk_, r);
  return r;
}
function ratingBadge(host, rt, size = 200) {
  const C = 2 * Math.PI * 84, col = CLS_COL[rt.cls] || 'var(--ink-3)';
  host.innerHTML = `<div class="rbadge" style="width:${size}px;height:${size}px"><svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="84" fill="none" stroke="var(--surface-3)" stroke-width="14"/><circle class="rring" cx="100" cy="100" r="84" fill="none" stroke="${col}" stroke-width="14" stroke-linecap="round" stroke-dasharray="0 ${C}" transform="rotate(-90 100 100)" style="transition:stroke-dasharray 1.4s cubic-bezier(.2,.8,.2,1)"/></svg><div class="g"><div><b style="color:${col}">${rt.cls}</b><small>score ${int(rt.score)} / 100</small><small style="letter-spacing:.02em;text-transform:none;font-size:12px;color:var(--ink-2)">${rt.band}</small></div></div></div>`;
  const ring = $('.rring', host); later(() => ring.setAttribute('stroke-dasharray', `${C * clamp(rt.score / 100, 0, 1)} ${C}`), 60);
}

/* ---------------- Rating ---------------- */
VIEWS.rating = (V, n) => {
  const m = metrics(n), rt = ratingOf(n);
  head(V, 'Avaliação · Rating', 'Rating Radar (ilustrativo) — ' + esc(nameOf(n)), `Classificação ilustrativa de 0 a 100 em seis pilares — capital, carteira, rentabilidade, eficiência, liquidez e funding — inspirada nos sistemas PEARLS (WOCCU) e CAMELS. <b>Não é um rating oficial</b> e não tem relação com o FGCoop, o Banco Central ou agências de rating.`);
  const G = grid(V);
  const b = card(G, { cls: 'c4 hero', title: 'Classificação', sub: 'Score ponderado dos pilares', fx: 'rating' });
  const bh = el('div'); b.b.appendChild(bh); ratingBadge(bh, rt);
  const L = peersOf(n).map(e => ({ e, s: ratingOf(node(e.id)).score })).filter(x => ok(x.s)).sort((a, b) => b.s - a.s);
  const pos = n.ent ? L.findIndex(x => x.e.id === n.id) + 1 : 0;
  b.b.appendChild(el('div', 'take', n.ent ? `<b>${pos}º</b> de ${L.length} ${peerLbl(n)} · percentil ${int(100 * (1 - (pos - 1) / L.length))}` : `Score do agregado de ${n.members.length} instituições.`));
  const pl = card(G, { cls: 'c8', title: 'Pilares', sub: 'Pontuação 0–100 e peso de cada pilar' });
  hbars(chartEl(pl.b, 200), rt.pillars.map(p => ({ label: `${p.t} · peso ${int(p.w * 100)}%`, value: p.s, color: p.s >= 70 ? 'var(--s3)' : p.s >= 45 ? 'var(--s4)' : 'var(--s8)' })), { fmt: x => int(x), max: 100, lw: 200 });
  const it = card(G, { cls: 'c7', title: 'Indicadores e notas', sub: 'Cada indicador vira nota 0–100 entre a faixa "ruim" e a "boa" (linear, com teto e piso)' });
  it.b.innerHTML = `<div class="tblwrap" style="max-height:none"><table class="tbl"><thead><tr><th>Pilar · indicador</th><th>Valor</th><th>Ruim → bom</th><th>Nota</th></tr></thead><tbody>${rt.pillars.map(p => `<tr><td colspan="4" style="text-align:left;font:700 10px var(--mono);letter-spacing:.12em;color:var(--gold-ink);padding-top:10px">${p.t.toUpperCase()} · ${ok(p.s) ? int(p.s) : '—'}</td></tr>` + p.items.map(i => `<tr><td class="l">${i.l}</td><td><b>${i.f(i.x)}</b></td><td class="muted">${i.f(i.bad)} → ${i.f(i.good)}</td><td><span class="pill" style="border-color:${ok(i.s) ? (i.s >= 70 ? 'var(--good)' : i.s >= 45 ? 'var(--warn)' : 'var(--crit)') : 'var(--line)'}">${ok(i.s) ? int(i.s) : '—'}</span></td></tr>`).join('')).join('')}</tbody></table></div>`;
  const ds = card(G, { cls: 'c5', title: 'Distribuição dos scores', sub: 'Entre as ' + peerLbl(n) });
  histogram(chartEl(ds.b, 180), L.map(x => x.s), { fmt: x => int(x), marker: rt.score, markerLabel: rt.cls + ' · ' + int(rt.score), min: 0, max: 100, bins: 25, h: 180, colorFn: x => x >= 75 ? 'var(--s3)' : x >= 55 ? 'var(--s4)' : x >= 45 ? 'var(--s2)' : 'var(--s8)' });
  const cnt = CLASSES.map(c => L.filter(x => (CLASSES.find(y => x.s >= y[1]) || CLASSES[6])[0] === c[0]).length);
  ds.b.appendChild(el('div', 'legend', CLASSES.map((c, i) => `<span><i style="background:${CLS_COL[c[0]]}"></i>${c[0]} · ${cnt[i]}</span>`).join('')));
  // ranking no grupo/sistema
  let pool = L;
  if (n.kind === 'coop' || n.kind === 'system') pool = L.filter(x => x.e.s === n.sys);
  const rk = card(G, { cls: 'c12', title: n.kind === 'coop' || n.kind === 'system' ? 'Ranking no sistema ' + SYS_NAME[n.sys] : 'Ranking entre ' + peerLbl(n), sub: 'Clique para abrir a instituição · ordenado pelo score' });
  const top = pool.slice(0, 12), bot = pool.slice(-6).filter(x => !top.includes(x));
  const row = (x, i) => { const mm = metrics(node(x.e.id)), r = ratingOf(node(x.e.id)); return `<tr data-id="${x.e.id}" style="cursor:pointer${x.e.id === n.id ? ';background:var(--gold-soft)' : ''}"><td class="l">${i}. ${esc(x.e.n)} <span class="muted">${x.e.uf || ''}</span></td><td><span class="pill" style="color:${CLS_COL[r.cls]}">${r.cls}</span></td><td>${int(x.s)}</td><td>${brl(mm.at)}</td><td>${pct(mm.ib)}</td><td>${pct(mm.inadR, 2)}</td><td>${pct(mm.roe)}</td><td>${pct(mm.liqA, 0)}</td></tr>`; };
  rk.b.innerHTML = `<div class="tblwrap"><table class="tbl"><thead><tr><th>Instituição</th><th>Classe</th><th>Score</th><th>Ativo</th><th>Basileia</th><th>Inad.</th><th>ROE</th><th>Liquidez</th></tr></thead><tbody>${top.map((x, i) => row(x, i + 1)).join('')}${bot.length ? `<tr><td colspan="8" class="muted" style="text-align:center">⋯</td></tr>` + bot.map(x => row(x, pool.indexOf(x) + 1)).join('') : ''}</tbody></table></div>`;
  $$('tr[data-id]', rk.b).forEach(tr => tr.addEventListener('click', () => go('rating', tr.dataset.id)));
  V.appendChild(el('p', 'note', 'Metodologia ilustrativa: faixas calibradas por referência a requisitos prudenciais (p. ex. Basileia 10,5%) e a padrões de mercado; pesos editáveis no código. Indicadores sem dado são ignorados e o peso é redistribuído. Fontes: IF.data, balancetes COSIF e SCR — data-base ' + mlab(D.base) + '.'));
};

/* ---------------- Comparar ---------------- */
const CMP = [
  ['Porte', null], ['Ativo total', 'at', 0, brl], ['Carteira de crédito', 'cart', 0, brl], ['Captações', 'capt', 0, brl], ['Patrimônio líquido', 'pl', 0, brl], ['Resultado 12m', 'll', 0, brl],
  ['Capital', null], ['Índice de Basileia', 'ib', 1, pct], ['Capital principal', 'icp', 1, pct], ['Ativo ÷ PL (multiplicador)', 'alav', -1, mult], ['Capital IRRBB ÷ PR', 'irrbbPR', -1, pct],
  ['Crédito', null], ['Inadimplência 90d', 'inadR', -1, x => pct(x, 2)], ['Ativos problemáticos', 'probR', -1, x => pct(x, 2)], ['Estágio 3', 'e3R', -1, x => pct(x, 2)], ['Cobertura PE ÷ problemáticos', 'cob', 1, x => pct(x, 0)], ['Custo do risco', 'cor', -1, x => pct(x, 2)],
  ['Resultado', null], ['ROE', 'roe', 1, pct], ['ROA', 'roa', 1, x => pct(x, 2)], ['NIM', 'nim', 1, pct], ['Taxa da carteira', 'yld', 0, pct], ['Custo de captação', 'cof', -1, pct], ['Spread', 'spread', 1, pp], ['Eficiência', 'eff', -1, x => pct(x, 0)],
  ['Liquidez', null], ['Crédito ÷ captações', 'ltdC', -1, x => pct(x, 0)], ['Ativos líquidos ÷ ativo', 'liqA', 1, x => pct(x, 0)], ['Crescimento da carteira 12m', 'gCrb', 0, x => pct(x, 1, true)],
];
VIEWS.comparar = (V) => {
  head(V, 'Avaliação · Comparar', 'Comparar instituições', 'Escolha uma instituição à esquerda e outra à direita — cooperativas, sistemas, centrais ou bancões. Cada linha destaca quem está melhor no indicador (quando há direção de "melhor").');
  const hp = el('div', 'cmp-h'); V.appendChild(hp);
  const pa = el('div', 'picker'), vs = el('div', 'cmp-vs', 'vs'), pb = el('div', 'picker');
  hp.appendChild(pa); hp.appendChild(vs); hp.appendChild(pb);
  makePicker(pa, { value: ST.a, onChange: id => { ST.a = id; writeHash(); render(false); } });
  makePicker(pb, { value: ST.b, align: 'right', onChange: id => { ST.b = id; writeHash(); render(false); } });
  const A = node(ST.a), B = node(ST.b), ma = metrics(A), mb = metrics(B), ra = ratingOf(A), rb = ratingOf(B);
  const G = grid(V); G.classList.add('mt');
  const hc = (n, m, r, cls, col) => { const c = card(G, { cls: 'c6', title: esc(nameOf(n)), sub: esc(crumb(n)) }); c.c.style.borderTop = `4px solid ${col}`; c.b.innerHTML = `<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap"><div style="font-family:var(--serif);font-size:44px;font-weight:700;color:${CLS_COL[r.cls]}">${r.cls}</div><div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px 18px;flex:1;font-size:12.5px"><span class="muted">Ativo<br><b style="color:var(--ink);font-size:15px">${brl(m.at)}</b></span><span class="muted">Basileia<br><b style="color:var(--ink);font-size:15px">${pct(m.ib)}</b></span><span class="muted">ROE<br><b style="color:var(--ink);font-size:15px">${pct(m.roe)}</b></span><span class="muted">Inadimplência<br><b style="color:var(--ink);font-size:15px">${pct(m.inadR, 2)}</b></span><span class="muted">Spread<br><b style="color:var(--ink);font-size:15px">${pp(m.spread)}</b></span><span class="muted">Score<br><b style="color:var(--ink);font-size:15px">${int(r.score)}</b></span></div></div>`; };
  hc(A, ma, ra, 'a', 'var(--s1)'); hc(B, mb, rb, 'b', 'var(--s2)');
  const bf = card(G, { cls: 'c12', title: 'Indicador a indicador', sub: `<span style="color:var(--s1);font-weight:700">■</span> ${esc(A.name)}  ·  <span style="color:var(--s2);font-weight:700">■</span> ${esc(B.name)} — em negrito, o melhor` });
  let winsA = 0, winsB = 0;
  const rows = CMP.map(r => {
    if (!r[1]) return `<div class="r" style="grid-template-columns:1fr"><div style="font:700 10px var(--mono);letter-spacing:.14em;color:var(--gold-ink);margin-top:8px;text-align:center">${r[0].toUpperCase()}</div></div>`;
    const [l, k, d, f] = r, a = ma[k], b = mb[k];
    const mx = Math.max(Math.abs(a) || 0, Math.abs(b) || 0) || 1;
    let wa = '', wb = '';
    if (d && ok(a) && ok(b) && a !== b) { const aBetter = d > 0 ? a > b : a < b; wa = aBetter ? 'win' : 'lose'; wb = aBetter ? 'lose' : 'win'; aBetter ? winsA++ : winsB++; }
    return `<div class="r"><div class="l"><span class="${wa}">${f(a)}</span><span class="bar" style="width:${(Math.abs(a) / mx * 62 || 0).toFixed(1)}%;background:var(--s1);opacity:${wa === 'lose' ? .45 : .9}"></span></div><div class="m">${l}</div><div class="rr"><span class="bar" style="width:${(Math.abs(b) / mx * 62 || 0).toFixed(1)}%;background:var(--s2);opacity:${wb === 'lose' ? .45 : .9}"></span><span class="${wb}">${f(b)}</span></div></div>`;
  }).join('');
  bf.b.innerHTML = `<div class="bf">${rows}</div><div class="take">Placar nos indicadores com direção definida: <b>${esc(A.name)} ${winsA}</b> × <b>${winsB} ${esc(B.name)}</b>. Score Radar: ${int(ra.score)} (${ra.cls}) × ${int(rb.score)} (${rb.cls}).</div>`;
  const rd = card(G, { cls: 'c5', title: 'Pilares do rating', sub: 'Sobreposição das notas 0–100' });
  radarChart(chartEl(rd.b, 300), ra.pillars.map(p => p.t), [{ name: A.name, color: 'var(--s1)', values: ra.pillars.map(p => p.s / 100) }, { name: B.name, color: 'var(--s2)', values: rb.pillars.map(p => p.s / 100) }], { size: 300 });
  const st = card(G, { cls: 'c7', title: 'Estrutura do balanço', sub: 'Composição do funding e do crédito (100%)' });
  const lbl = (n, s) => (n.name.length > 20 ? n.name.slice(0, 19) + '…' : n.name) + (s ? ' · ' + s : '');
  const fp = m => fundingParts(m).map((p, i) => ({ ...p, color: ['var(--s1)', 'var(--s7)', 'var(--s6)', 'var(--s2)', 'var(--s5)', '#9AA2AE'][['dpra', 'dvis', 'dpou', 'let', 'emr', 'out'].indexOf(p.k)] }));
  const cp = m => { const c = creditParts(m); const order = ['Rural e agroindustrial', 'PJ: capital de giro e recebíveis', 'Pessoal, cartão e outros PF', 'Consignado', 'Veículos e habitação', 'PJ: investimento, infra e comex', 'Carteira de crédito']; const cols = ['#8C6230', 'var(--s1)', 'var(--s2)', 'var(--s7)', 'var(--s6)', 'var(--s5)', '#9AA2AE']; return c.map(p => ({ ...p, color: cols[order.indexOf(p.label)] })); };
  st.b.appendChild(el('div', 'note', '<b>Funding</b>'));
  stack100(chartEl(st.b, 110), [{ label: lbl(A, ''), parts: fp(ma) }, { label: lbl(B, ''), parts: fp(mb) }], { rh: 26, lw: 150 });
  st.b.appendChild(el('div', 'note', '<b>Crédito</b>'));
  stack100(chartEl(st.b, 110), [{ label: lbl(A, ''), parts: cp(ma) }, { label: lbl(B, ''), parts: cp(mb) }], { rh: 26, lw: 150 });
  const tl = [['Basileia', 'ib', x => pct(x, 1)], ['Inadimplência', 'inad', x => pct(x, 1)], ['ROE', 'roe', x => pct(x, 0)]];
  tl.forEach(([t, k, f]) => { const c = card(G, { cls: 'c4', title: t + ' trimestral', sub: 'Trajetória comparada' }); lineChart(chartEl(c.b, 170), { cats: qcats(), series: [{ name: A.name, color: 'var(--s1)', values: ma.q[k] }, { name: B.name, color: 'var(--s2)', values: mb.q[k] }], fmt: f, h: 170 }); });
  const dc = card(G, { cls: 'c12', title: 'DRE em base comum', sub: 'Linhas de 12 meses em % do ativo médio — compara modelos de negócio de portes diferentes' });
  const lines = [['Rendas de crédito', 'rcre'], ['Rendas de TVM e aplicações', x => x.rtvm + x.rapl], ['Despesas de captação', 'dcp'], ['Perda esperada', 'pe'], ['Tarifas e serviços', x => x.tar + x.srv], ['Pessoal e administrativas', x => x.pes + x.adm], ['Tributos e IR/CS', x => x.trib + x.ir], ['Resultado 12m', 'll']];
  const v = (m, g) => div(typeof g === 'function' ? g(m.L) : m.L[g], m.avg.at);
  dc.b.innerHTML = `<div class="tblwrap" style="max-height:none"><table class="tbl"><thead><tr><th>Linha (% do ativo médio)</th><th style="color:var(--s1)">${esc(A.name)}</th><th style="color:var(--s2)">${esc(B.name)}</th><th>Diferença</th></tr></thead><tbody>${lines.map(([l, g]) => { const a = v(ma, g), b = v(mb, g); return `<tr><td class="l">${l}</td><td class="${a < 0 ? 'neg' : ''}">${pct(a, 2)}</td><td class="${b < 0 ? 'neg' : ''}">${pct(b, 2)}</td><td>${pp(a - b, 2, true)}</td></tr>`; }).join('')}</tbody></table></div>`;
};

/* ---------------- Universo ---------------- */
const AXES = { ib: ['Índice de Basileia', x => pct(x, 0), .05, .6], inadR: ['Inadimplência 90d', x => pct(x, 1), 0, .14], roe: ['ROE', x => pct(x, 0), -.15, .4], nim: ['NIM', x => pct(x, 1), 0, .16], eff: ['Eficiência', x => pct(x, 0), .2, 1.3], ltdC: ['Crédito ÷ captações', x => pct(x, 0), 0, 1.6], liqA: ['Ativos líquidos ÷ ativo', x => pct(x, 0), 0, .8], e3R: ['Estágio 3', x => pct(x, 1), 0, .2], spread: ['Spread', x => pp(x, 0), -.05, .3], cof: ['Custo de captação', x => pct(x, 1), 0, .2], gCrb: ['Crescimento da carteira 12m', x => pct(x, 0), -.3, .6], irrbbPR: ['Capital IRRBB ÷ PR', x => pct(x, 1), 0, .15], score: ['Score Radar', x => int(x), 0, 100] };
VIEWS.universo = (V, n) => {
  const ui = ST.ui.uni || (ST.ui.uni = { pop: n.grp === 'bank' ? 'bank' : 'coop', x: 'ib', y: 'inadR', off: new Set(), q: '', sort: 'at', dir: -1 });
  head(V, 'Visão · Universo', 'Universo & ranking', `Todas as ${COOPS.length} cooperativas singulares, os sistemas e os ${BANKS.length} bancões em um só mapa: escolha os eixos, filtre sistemas na legenda e clique em uma bolha para abrir a instituição. Bolha = ativo total.`);
  const bar = el('div', ''); bar.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:12px'; V.appendChild(bar);
  bar.appendChild(segCtl([['coop', 'Cooperativas singulares'], ['sys', 'Sistemas e bancões'], ['bank', 'Bancões']], ui.pop, k => { ui.pop = k; render(false); }));
  const mk = (k, lab) => { const s = el('select', 'sel'); s.innerHTML = Object.entries(AXES).map(([a, v]) => `<option value="${a}" ${a === ui[k] ? 'selected' : ''}>${lab}: ${v[0]}</option>`).join(''); s.onchange = () => { ui[k] = s.value; render(false); }; bar.appendChild(s); };
  mk('x', 'Eixo X'); mk('y', 'Eixo Y');
  const G = grid(V);
  const sc = card(G, { cls: 'c12', title: `${AXES[ui.y][0]} × ${AXES[ui.x][0]}`, sub: 'Passe o mouse para detalhes · clique para selecionar' });
  const val = (nn, k) => k === 'score' ? ratingOf(nn).score : metrics(nn)[k];
  let pool;
  if (ui.pop === 'coop') pool = COOPS.map(e => node(e.id));
  else if (ui.pop === 'bank') pool = BANKS.map(e => node(e.id));
  else pool = SYS_ORDER.filter(s => NODES.has('S:' + s)).map(s => node('S:' + s)).concat(BANKS.map(e => node(e.id)));
  const groups = ui.pop === 'coop' ? SYS_ORDER.filter(s => NODES.has('S:' + s)) : ui.pop === 'bank' ? ['banco'] : SYS_ORDER.filter(s => NODES.has('S:' + s)).concat(['banco']);
  const gOf = nn => nn.kind === 'bank' ? 'banco' : nn.sys;
  const lg = el('div', 'legend'); sc.b.appendChild(lg);
  lg.innerHTML = groups.map(g => `<span data-g="${g}" class="${ui.off.has(g) ? 'off' : ''}" style="cursor:pointer"><i style="background:${g === 'banco' ? BANK_COLOR : SYS_COLOR[g]}"></i>${g === 'banco' ? 'Bancões' : SYS_NAME[g]} · ${pool.filter(x => gOf(x) === g).length}</span>`).join('') + '<span class="muted">clique para ocultar/mostrar</span>';
  lg.addEventListener('click', e => { const s = e.target.closest('[data-g]'); if (!s) return; const g = s.dataset.g; ui.off.has(g) ? ui.off.delete(g) : ui.off.add(g); render(false); });
  const pts = pool.filter(nn => !ui.off.has(gOf(nn))).map(nn => ({ id: nn.id, x: val(nn, ui.x), y: val(nn, ui.y), r: metrics(nn).at, color: nn.kind === 'bank' ? BANK_COLOR : SYS_COLOR[nn.sys], label: nn.name, sel: nn.id === n.id || (n.kind === 'system' && ui.pop === 'sys' && nn.id === n.id), group: gOf(nn), nn }));
  const xs = pts.map(p => p.x).filter(ok), ys = pts.map(p => p.y).filter(ok);
  scatter(chartEl(sc.b, 460), pts, {
    h: 460, xFmt: AXES[ui.x][1], yFmt: AXES[ui.y][1], xLabel: AXES[ui.x][0], yLabel: AXES[ui.y][0], rMax: ui.pop === 'coop' ? 26 : 34,
    xmin: Math.max(AXES[ui.x][2], quant(xs, .01)), xmax: Math.min(AXES[ui.x][3], quant(xs, .99)), ymin: Math.max(AXES[ui.y][2], quant(ys, .01)), ymax: Math.min(AXES[ui.y][3], quant(ys, .99)),
    refX: ui.x === 'ib' ? { v: .105, l: '10,5%' } : null, refY: { v: median(ys), l: 'mediana' },
    tip: p => { const mm = metrics(p.nn), r = ratingOf(p.nn); return `<b>${esc(p.label)}</b><div style="opacity:.75">${esc(crumb(p.nn))}</div><hr>${ttRow(AXES[ui.x][0], AXES[ui.x][1](p.x))}${ttRow(AXES[ui.y][0], AXES[ui.y][1](p.y))}${ttRow('Ativo', brl(mm.at))}${ttRow('Rating', r.cls + ' · ' + int(r.score))}`; },
    onClick: p => { ST.e = p.id; writeHash(); if (PICK) PICK.set(p.id); render(false); },
  });
  sc.b.appendChild(el('p', 'note', 'Eixos limitados a faixas de leitura (pontos extremos, comuns em cooperativas muito pequenas, ficam presos à borda). Selecionada: ' + esc(n.name) + '.'));
  // ranking
  const rk = card(G, { cls: 'c12', title: 'Ranking', sub: 'Clique no cabeçalho para ordenar · clique na linha para abrir a balança da instituição' });
  const tools = el('div', ''); tools.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap';
  const q = el('input', 'search'); q.type = 'search'; q.placeholder = 'Filtrar por nome, UF ou sistema'; q.value = ui.q; tools.appendChild(q); rk.b.appendChild(tools);
  const tw = el('div', 'tblwrap'); rk.b.appendChild(tw);
  const COLS = [['n', 'Instituição'], ['sys', 'Sistema'], ['at', 'Ativo'], ['cart', 'Carteira'], ['ib', 'Basileia'], ['inadR', 'Inad.'], ['e3R', 'Estágio 3'], ['roe', 'ROE'], ['nim', 'NIM'], ['eff', 'Eficiência'], ['score', 'Score']];
  const data = pool.map(nn => { const mm = metrics(nn); return { nn, n: nn.name, sys: nn.kind === 'bank' ? 'Banco' : SYS_NAME[nn.sys], uf: nn.ent ? nn.ent.uf : '', at: mm.at, cart: mm.cart, ib: mm.ib, inadR: mm.inadR, e3R: mm.e3R, roe: mm.roe, nim: mm.nim, eff: mm.eff, score: ratingOf(nn).score, cls: ratingOf(nn).cls }; });
  const paint = () => {
    ui.q = q.value; const qq = q.value.trim().toLowerCase();
    const rows = data.filter(d => !qq || (d.n + ' ' + d.sys + ' ' + d.uf).toLowerCase().includes(qq)).sort((a, b) => { const x = a[ui.sort], y = b[ui.sort]; if (typeof x === 'string') return ui.dir * x.localeCompare(y); return ui.dir * ((ok(x) ? x : -1e18) - (ok(y) ? y : -1e18)); });
    const f = { at: brl, cart: brl, ib: pct, inadR: x => pct(x, 2), e3R: x => pct(x, 1), roe: pct, nim: pct, eff: x => pct(x, 0), score: x => int(x) };
    tw.innerHTML = `<table class="tbl"><thead><tr><th>#</th>${COLS.map(c => `<th data-s="${c[0]}" style="cursor:pointer;${c[0] === 'n' || c[0] === 'sys' ? 'text-align:left' : ''}">${c[1]}${ui.sort === c[0] ? (ui.dir > 0 ? ' ▲' : ' ▼') : ''}</th>`).join('')}</tr></thead><tbody>${rows.slice(0, 150).map((d, i) => `<tr data-id="${d.nn.id}" style="cursor:pointer${d.nn.id === n.id ? ';background:var(--gold-soft)' : ''}"><td>${i + 1}</td><td class="l"><b style="font-weight:600">${esc(d.n)}</b> <span class="muted">${d.uf}</span></td><td class="l"><i style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${d.nn.kind === 'bank' ? BANK_COLOR : SYS_COLOR[d.nn.sys]};margin-right:6px"></i>${d.sys}</td>${COLS.slice(2).map(c => `<td>${c[0] === 'score' ? `<span class="pill" style="color:${CLS_COL[d.cls]}">${d.cls} ${int(d.score)}</span>` : f[c[0]](d[c[0]])}</td>`).join('')}</tr>`).join('')}</tbody></table>${rows.length > 150 ? `<p class="note" style="padding:0 10px">Mostrando 150 de ${rows.length}. Use o filtro.</p>` : ''}`;
  };
  tw.addEventListener('click', e => { const th = e.target.closest('th[data-s]'); if (th) { const s = th.dataset.s; ui.dir = ui.sort === s ? -ui.dir : (s === 'n' || s === 'sys' ? 1 : -1); ui.sort = s; paint(); return; } const tr = e.target.closest('tr[data-id]'); if (tr) go('balanca', tr.dataset.id); });
  q.addEventListener('input', paint); paint();
};

/* ---------------- Biblioteca ---------------- */
const AREAS = [
  ['tes', 'Tesouraria, juros e derivativos'], ['mer', 'Risco de mercado, VaR e risco quantitativo'], ['alm', 'ALM, liquidez e IRRBB'], ['cre', 'Risco de crédito'], ['cap', 'Bancos, capital e gestão de riscos'], ['br', 'Mercado brasileiro e cooperativismo'],
];
const PUB = { 'Wiley': ['#0B2C5A', '#7FB2E5'], 'Springer': ['#F2C230', '#123A73'], 'Saint Paul': ['#7A1424', '#F3D9A0'], 'Atlas': ['#123B66', '#F2B544'], 'Princeton': ['#E46F1E', '#1B1B1B'], 'Palgrave Macmillan': ['#0E6F73', '#F5E9C9'], 'Academic Press': ['#D35400', '#FFF4E0'], 'McGraw-Hill': ['#B3121B', '#FFFFFF'], 'Confebras': ['#1E6B3A', '#F0E5B8'], 'Banco Central do Brasil': ['#14325E', '#D8B15A'], 'Qualitymark': ['#4A2C6E', '#F1D9A7'], 'MIT Press': ['#1D1D1D', '#E23B2E'], 'Pearson': ['#003057', '#FFB81C'], 'Cengage': ['#00467F', '#F4B400'] };
const BOOKS = [
  { id: 'securato_tes', t: 'Cálculo Financeiro das Tesourarias: Bancos e Empresas', a: 'José Roberto Securato', p: 'Saint Paul', ar: 'tes', why: 'A matemática da mesa de tesouraria no Brasil: taxas over e efetivas, CDI, marcação a mercado, duration, convexidade e precificação de títulos públicos e privados — base para o NII, o spread e o gap de juros.', v: ['nii', 'spread', 'alm', 'mercado'] },
  { id: 'securato_cred', t: 'Crédito: Análise e Avaliação do Risco — Pessoas Físicas e Jurídicas', a: 'José Roberto Securato (coord.)', p: 'Saint Paul', ar: 'cre', why: 'Análise de crédito de PF e PJ com olhar brasileiro: modelos de escoragem, rating, garantias e precificação do risco.', v: ['credito', 'nii'] },
  { id: 'securato_dec', t: 'Decisões Financeiras em Condições de Risco', a: 'José Roberto Securato', p: 'Atlas', ar: 'tes', why: 'Risco e retorno, utilidade e decisões de investimento sob incerteza — o arcabouço por trás de VaR, RAROC e precificação.', v: ['mercado', 'frm'] },
  { id: 'hull_rmfi', t: 'Risk Management and Financial Institutions', a: 'John C. Hull', p: 'Wiley', y: '6ª ed., 2023', ar: 'cap', why: 'O manual do FRM: Basileia I a III, VaR e ES, risco de crédito, liquidez, IRRBB, risco operacional, capital econômico e RAROC.', v: ['capital', 'mercado', 'alm', 'frm'] },
  { id: 'hull_ofod', t: 'Options, Futures, and Other Derivatives', a: 'John C. Hull', p: 'Pearson', y: '11ª ed., 2021', ar: 'tes', why: 'Derivativos, curvas de juros, duration e convexidade, modelos de taxa — referência para hedge e marcação da tesouraria.', v: ['mercado', 'alm'] },
  { id: 'jorion_var', t: 'Value at Risk: The New Benchmark for Managing Financial Risk', a: 'Philippe Jorion', p: 'McGraw-Hill', y: '3ª ed., 2006', ar: 'mer', why: 'O livro do VaR: paramétrico, histórico e Monte Carlo, backtesting, estresse e uso do VaR para capital.', v: ['mercado', 'frm'] },
  { id: 'jorion_frm', t: 'Financial Risk Manager Handbook', a: 'Philippe Jorion (GARP)', p: 'Wiley', y: '6ª ed., 2010', ar: 'cap', why: 'Guia do exame FRM: estatística, mercados, risco de mercado, crédito, operacional e gestão integrada.', v: ['frm', 'mercado', 'credito'] },
  { id: 'alexander4', t: 'Market Risk Analysis, Vol. IV: Value-at-Risk Models', a: 'Carol Alexander', p: 'Wiley', y: '2008', ar: 'mer', why: 'Modelos de VaR com rigor e planilhas: normal, t de Student, simulação histórica filtrada, backtests e agregação.', v: ['mercado'] },
  { id: 'dowd', t: 'Measuring Market Risk', a: 'Kevin Dowd', p: 'Wiley', y: '2ª ed., 2005', ar: 'mer', why: 'Medidas coerentes de risco, ES, teoria de valores extremos e estimação de VaR na prática.', v: ['mercado', 'frm'] },
  { id: 'christoffersen', t: 'Elements of Financial Risk Management', a: 'Peter F. Christoffersen', p: 'Academic Press', y: '2ª ed., 2012', ar: 'mer', why: 'Volatilidade dinâmica (GARCH), correlação, caudas e backtesting — o VaR moderno.', v: ['mercado'] },
  { id: 'mfe_qrm', t: 'Quantitative Risk Management: Concepts, Techniques and Tools', a: 'A. McNeil, R. Frey, P. Embrechts', p: 'Princeton', y: 'ed. revisada, 2015', ar: 'mer', why: 'A base matemática: cópulas, valores extremos, modelos de crédito de portfólio e agregação de riscos.', v: ['frm', 'credito'] },
  { id: 'brigo', t: 'Interest Rate Models — Theory and Practice', a: 'Damiano Brigo, Fabio Mercurio', p: 'Springer', y: '2ª ed., 2006', ar: 'tes', why: 'Modelos de curva de juros de curto prazo e de mercado (LMM) — fundamento para choques de curva e valor econômico.', v: ['alm', 'mercado'] },
  { id: 'embrechts', t: 'Modelling Extremal Events for Insurance and Finance', a: 'P. Embrechts, C. Klüppelberg, T. Mikosch', p: 'Springer', y: '1997', ar: 'mer', why: 'Teoria de valores extremos: por que as caudas importam para VaR, ES e testes de estresse.', v: ['mercado', 'frm'] },
  { id: 'choudhry_alm', t: 'Bank Asset and Liability Management: Strategy, Trading, Analysis', a: 'Moorad Choudhry', p: 'Wiley', y: '2007', ar: 'alm', why: 'ALM de tesouraria bancária: gap, duration, preço de transferência (FTP), liquidez e hedge do balanço.', v: ['alm', 'nii'] },
  { id: 'choudhry_pob', t: 'The Principles of Banking', a: 'Moorad Choudhry', p: 'Wiley', y: '2012', ar: 'alm', why: 'Os princípios do balanço bancário sustentável: capital, liquidez, funding estável e governança de ALCO.', v: ['alm', 'capital', 'balanca'] },
  { id: 'bessis', t: 'Risk Management in Banking', a: 'Joël Bessis', p: 'Wiley', y: '4ª ed., 2015', ar: 'cap', why: 'Visão integrada do banco: ALM, FTP, risco de crédito de portfólio, capital econômico e RAROC.', v: ['frm', 'alm', 'nii'] },
  { id: 'saunders_fim', t: 'Financial Institutions Management: A Risk Management Approach', a: 'Anthony Saunders, Marcia Millon Cornett', p: 'McGraw-Hill', ar: 'cap', why: 'Clássico de gestão de instituições financeiras: repricing gap, duration gap, liquidez, crédito e capital.', v: ['alm', 'capital', 'credito'] },
  { id: 'koch', t: 'Bank Management', a: 'Timothy W. Koch, S. Scott MacDonald', p: 'Cengage', ar: 'cap', why: 'Análise de desempenho bancário (ROE, NIM, eficiência), gap de juros e gestão de liquidez — leitura de balanço e DRE.', v: ['dre', 'nii', 'alm'] },
  { id: 'freixas', t: 'Microeconomics of Banking', a: 'Xavier Freixas, Jean-Charles Rochet', p: 'MIT Press', y: '2ª ed., 2008', ar: 'cap', why: 'Teoria da intermediação: por que bancos existem, modelo Monti-Klein de spread, corridas, regulação e o papel do capital.', v: ['balanca', 'spread'] },
  { id: 'alm_handbook', t: 'Asset and Liability Management Handbook', a: 'Gautam Mitra, Katharina Schwaiger (orgs.)', p: 'Palgrave Macmillan', y: '2011', ar: 'alm', why: 'Coletânea de ALM: otimização estocástica, modelagem de depósitos e gestão integrada de balanço.', v: ['alm'] },
  { id: 'castagna', t: 'Measuring and Managing Liquidity Risk', a: 'Antonio Castagna, Francesco Fede', p: 'Wiley', y: '2013', ar: 'alm', why: 'Liquidez com modelos: gaps de liquidez, buffers, custo de funding e depósitos sem vencimento.', v: ['alm'] },
  { id: 'lubinska', t: 'Asset Liability Management Optimisation', a: 'Beata Lubinska', p: 'Wiley', y: '2020', ar: 'alm', why: 'Gestão moderna de balanço: IRRBB (EVE e NII), modelagem comportamental e remodelagem do balanço.', v: ['alm', 'nii'] },
  { id: 'matz', t: 'Liquidity Risk Measurement and Management', a: 'Leonard Matz, Peter Neu (orgs.)', p: 'Wiley', y: '2007', ar: 'alm', why: 'Guia prático de liquidez: medidas, limites, testes de estresse e planos de contingência.', v: ['alm', 'frm'] },
  { id: 'baesens', t: 'Credit Risk Analytics', a: 'Bart Baesens, Daniel Rösch, Harald Scheule', p: 'Wiley', y: '2016', ar: 'cre', why: 'PD, LGD, EAD, IFRS 9 e validação com dados reais — tem uma página dedicada neste site.', v: ['credito'], link: 'credit_risk_analytics_book.html' },
  { id: 'bohn', t: 'Active Credit Portfolio Management in Practice', a: 'Jeffrey R. Bohn, Roger M. Stein', p: 'Wiley', y: '2009', ar: 'cre', why: 'Gestão ativa de portfólio de crédito: modelos estruturais, correlação, capital econômico e precificação.', v: ['credito', 'frm', 'nii'] },
  { id: 'engelmann', t: 'The Basel II Risk Parameters: Estimation, Validation, Stress Testing', a: 'Bernd Engelmann, Robert Rauhmeier (orgs.)', p: 'Springer', y: '2ª ed., 2011', ar: 'cre', why: 'Estimação e validação de PD, LGD e EAD sob Basileia, com testes de estresse.', v: ['credito', 'capital'] },
  { id: 'bielecki', t: 'Credit Risk: Modeling, Valuation and Hedging', a: 'Tomasz R. Bielecki, Marek Rutkowski', p: 'Springer', y: '2002', ar: 'cre', why: 'Modelos estruturais e de intensidade para precificação e hedge de risco de crédito.', v: ['credito'] },
  { id: 'saunders_allen', t: 'Credit Risk Measurement', a: 'Anthony Saunders, Linda Allen', p: 'Wiley', ar: 'cre', why: 'Das abordagens tradicionais aos modelos de VaR de crédito (CreditMetrics, KMV, CreditRisk+).', v: ['credito'] },
  { id: 'lando', t: 'Credit Risk Modeling: Theory and Applications', a: 'David Lando', p: 'Princeton', y: '2004', ar: 'cre', why: 'Teoria rigorosa de modelos de crédito: Merton, intensidade, migração de ratings e dependência.', v: ['credito'] },
  { id: 'duffie', t: 'Credit Risk: Pricing, Measurement, and Management', a: 'Darrell Duffie, Kenneth J. Singleton', p: 'Princeton', y: '2003', ar: 'cre', why: 'Precificação de risco de crédito e medidas de portfólio por dois expoentes da área.', v: ['credito', 'nii'] },
  { id: 'bellini', t: 'IFRS 9 and CECL Credit Risk Modelling and Validation', a: 'Tiziano Bellini', p: 'Academic Press', y: '2019', ar: 'cre', why: 'Perda esperada contábil: estágios, PD lifetime, cenários macro — o espírito da Res. CMN 4.966.', v: ['credito'] },
  { id: 'resti', t: "Risk Management and Shareholders' Value in Banking", a: 'Andrea Resti, Andrea Sironi', p: 'Wiley', y: '2007', ar: 'cap', why: 'Da medição de riscos à alocação de capital e criação de valor: RAROC, custo de capital e Basileia.', v: ['frm', 'nii', 'capital'] },
  { id: 'crouhy', t: 'The Essentials of Risk Management', a: 'Michel Crouhy, Dan Galai, Robert Mark', p: 'McGraw-Hill', y: '2ª ed., 2014', ar: 'cap', why: 'Panorama executivo de gestão de riscos corporativos e bancários — governança, apetite e limites.', v: ['frm'] },
  { id: 'assaf', t: 'Mercado Financeiro', a: 'Alexandre Assaf Neto', p: 'Atlas', ar: 'br', why: 'Sistema financeiro nacional, matemática financeira, renda fixa e derivativos no contexto brasileiro.', v: ['spread', 'mercado'] },
  { id: 'fortuna', t: 'Mercado Financeiro: Produtos e Serviços', a: 'Eduardo Fortuna', p: 'Qualitymark', ar: 'br', why: 'O guia de produtos do SFN: captação (CDB, RDC, LCA, LCI, LF), crédito, câmbio e política monetária.', v: ['balanca', 'alm'] },
  { id: 'silva_cred', t: 'Gestão e Análise de Risco de Crédito', a: 'José Pereira da Silva', p: 'Atlas', ar: 'br', why: 'Análise de crédito no Brasil: demonstrações financeiras, rating, garantias e gestão da carteira.', v: ['credito', 'dre'] },
  { id: 'meinen', t: 'Cooperativismo Financeiro: Percurso Histórico, Perspectivas e Desafios', a: 'Ênio Meinen, Márcio Port', p: 'Confebras', y: '2014', ar: 'br', why: 'A história, a governança e os desafios do cooperativismo de crédito brasileiro — sistemas, centrais e singulares.', v: ['balanca', 'rating'] },
  { id: 'pinheiro', t: 'Cooperativas de Crédito: História da Evolução Normativa no Brasil', a: 'Marcos Antonio Henrique Pinheiro', p: 'Banco Central do Brasil', y: '6ª ed., 2008', ar: 'br', why: 'A evolução das normas do Bacen e do CMN para cooperativas de crédito, das origens ao sistema atual.', v: ['metodologia'] },
  { id: 'coop_europe', t: 'Cooperative Banking in Europe: Case Studies', a: 'V. Boscia, A. Carretta, P. Schwizer (orgs.)', p: 'Palgrave Macmillan', y: '2010', ar: 'br', why: 'Comparação internacional de sistemas cooperativos (Alemanha, França, Itália, Holanda…): modelos de rede, proteção institucional e desempenho.', v: ['balanca', 'rating'] },
];
function coverHTML(b) {
  if (COVERS[b.id]) return `<div class="cover"><img src="${COVERS[b.id]}" alt="Capa de ${esc(b.t)}" loading="lazy" decoding="async"></div>`;
  const [bg, fg] = PUB[b.p] || ['#14183A', '#D8B15A'];
  return `<div class="cover" style="background:linear-gradient(160deg,${bg},color-mix(in srgb,${bg} 70%,#000))"><div class="cv" style="color:${fg}"><span class="pub">${esc(b.p)}</span><div><div class="rule"></div><div class="t" style="color:#fff">${esc(b.t.length > 64 ? b.t.split(':')[0] : b.t)}</div></div><span class="a">${esc(b.a.split(',')[0].replace(' (coord.)', '').replace(' (orgs.)', ''))}</span></div></div>`;
}
const REFS = [
  ['Multiplicador, intermediação e spread', [
    ['McLeay, M.; Radia, A.; Thomas, R. (2014)', 'Money creation in the modern economy', 'Bank of England Quarterly Bulletin, 2014 Q1', 'https://www.bankofengland.co.uk/quarterly-bulletin/2014/q1/money-creation-in-the-modern-economy', 'Por que o "multiplicador" de livro-texto inverte a causalidade: o crédito cria depósitos.'],
    ['Carpenter, S.; Demiralp, S. (2012)', 'Money, reserves, and the transmission of monetary policy: Does the money multiplier exist?', 'Journal of Macroeconomics, 34(1), 59–75', 'https://doi.org/10.1016/j.jmacro.2011.09.009', 'Evidência empírica sobre a (fraca) relação entre reservas e crédito.'],
    ['Klein, M. A. (1971)', 'A theory of the banking firm', 'Journal of Money, Credit and Banking, 3(2), 205–218', 'https://doi.org/10.2307/1991279', 'Base do modelo Monti-Klein: spread ótimo como função de elasticidades.'],
    ['Ho, T.; Saunders, A. (1981)', 'The determinants of bank interest margins: theory and empirical evidence', 'Journal of Financial and Quantitative Analysis, 16(4), 581–600', 'https://doi.org/10.2307/2330377', 'O banco como "dealer" de fundos: aversão a risco e volatilidade de juros explicam a margem.'],
    ['Maudos, J.; Fernández de Guevara, J. (2004)', 'Factors explaining the interest margin in the banking sectors of the European Union', 'Journal of Banking & Finance, 28(9), 2259–2281', 'https://doi.org/10.1016/j.jbankfin.2003.09.004', 'Extensão empírica: poder de mercado, custos operacionais e risco no spread.'],
    ['Fama, E. F. (1985)', "What's different about banks?", 'Journal of Monetary Economics, 15(1), 29–39', 'https://doi.org/10.1016/0304-3932(85)90051-0', 'Por que o crédito bancário é especial e quem arca com o custo das reservas.'],
  ]],
  ['ALM, IRRBB e liquidez', [
    ['Basel Committee on Banking Supervision (2016)', 'Interest rate risk in the banking book (IRRBB)', 'BIS, d368', 'https://www.bis.org/bcbs/publ/d368.htm', 'Os seis choques padronizados, ΔEVE, ΔNII, depósitos sem vencimento e o teste de outlier de 15% do nível I.'],
    ['Basel Committee on Banking Supervision (2013)', 'Basel III: The Liquidity Coverage Ratio and liquidity risk monitoring tools', 'BIS, bcbs238', 'https://www.bis.org/publ/bcbs238.htm', 'Ativos líquidos de alta qualidade e taxas de saída em 30 dias — base da proxy de liquidez.'],
    ['Drechsler, I.; Savov, A.; Schnabl, P. (2021)', 'Banking on deposits: maturity transformation without interest rate risk', 'The Journal of Finance, 76(3), 1091–1143', 'https://doi.org/10.1111/jofi.13013', 'O poder de mercado sobre depósitos funciona como hedge natural da transformação de prazos.'],
    ['Drechsler, I.; Savov, A.; Schnabl, P. (2017)', 'The deposits channel of monetary policy', 'The Quarterly Journal of Economics, 132(4), 1819–1876', 'https://doi.org/10.1093/qje/qjx019', 'Como a Selic se transmite ao custo dos depósitos e ao crédito.'],
    ['Diamond, D. W.; Dybvig, P. H. (1983)', 'Bank runs, deposit insurance, and liquidity', 'Journal of Political Economy, 91(3), 401–419', 'https://doi.org/10.1086/261155', 'O modelo de corrida bancária — e o papel de garantidores como FGC e FGCoop.'],
    ['Kashyap, A. K.; Rajan, R.; Stein, J. C. (2002)', 'Banks as liquidity providers: an explanation for the coexistence of lending and deposit-taking', 'The Journal of Finance, 57(1), 33–73', 'https://doi.org/10.1111/1540-6261.00415', 'Sinergia entre depósitos e linhas de crédito: por que o mesmo balanço faz as duas coisas.'],
  ]],
  ['Risco de crédito e capital', [
    ['Vasicek, O. (2002)', 'The distribution of loan portfolio value', 'Risk, 15(12), 160–162', '', 'A distribuição de perdas com um fator: base do modelo ASRF de Basileia.'],
    ['Gordy, M. B. (2003)', 'A risk-factor model foundation for ratings-based bank capital rules', 'Journal of Financial Intermediation, 12(3), 199–232', 'https://doi.org/10.1016/S1042-9573(03)00040-8', 'Por que o capital IRB é aditivo por operação: o modelo de fator único assintótico.'],
    ['Basel Committee on Banking Supervision (2005)', 'An Explanatory Note on the Basel II IRB Risk Weight Functions', 'BIS', 'https://www.bis.org/bcbs/irbriskweight.htm', 'Fórmulas de correlação de varejo e empresas usadas no simulador Vasicek.'],
    ['Merton, R. C. (1974)', 'On the pricing of corporate debt: the risk structure of interest rates', 'The Journal of Finance, 29(2), 449–470', 'https://doi.org/10.1111/j.1540-6261.1974.tb03058.x', 'O modelo estrutural: a dívida como opção sobre os ativos da empresa.'],
    ['Altman, E. I. (1968)', 'Financial ratios, discriminant analysis and the prediction of corporate bankruptcy', 'The Journal of Finance, 23(4), 589–609', 'https://doi.org/10.1111/j.1540-6261.1968.tb00843.x', 'O Z-score: índices contábeis como preditores de insolvência.'],
    ['Basel Committee on Banking Supervision (2017)', 'Basel III: Finalising post-crisis reforms', 'BIS, d424', 'https://www.bis.org/bcbs/publ/d424.htm', 'A versão final dos requerimentos de capital (abordagem padronizada revista, output floor).'],
  ]],
  ['Mercado, VaR e precificação ajustada a risco', [
    ['Artzner, P.; Delbaen, F.; Eber, J.-M.; Heath, D. (1999)', 'Coherent measures of risk', 'Mathematical Finance, 9(3), 203–228', 'https://doi.org/10.1111/1467-9965.00068', 'Por que o Expected Shortfall é coerente e o VaR não é subaditivo.'],
    ['Kupiec, P. H. (1995)', 'Techniques for verifying the accuracy of risk measurement models', 'The Journal of Derivatives, 3(2), 73–84', 'https://doi.org/10.3905/jod.1995.407942', 'O teste de proporção de falhas (POF) usado no backtesting.'],
    ['Basel Committee on Banking Supervision (2019)', 'Minimum capital requirements for market risk', 'BIS, d457', 'https://www.bis.org/bcbs/publ/d457.htm', 'FRTB: ES de 97,5%, horizontes de liquidez e a fronteira negociação × bancária.'],
    ['Hull, J.; White, A. (1990)', 'Pricing interest-rate-derivative securities', 'The Review of Financial Studies, 3(4), 573–592', 'https://doi.org/10.1093/rfs/3.4.573', 'O modelo de Hull-White para curvas de juros.'],
    ['Zaik, E.; Walter, J.; Retting, G.; James, C. (1996)', 'RAROC at Bank of America: from theory to practice', 'Journal of Applied Corporate Finance, 9(2), 83–93', 'https://doi.org/10.1111/j.1745-6622.1996.tb00117.x', 'RAROC na prática: alocação de capital econômico e precificação por linha de negócio.'],
    ['Froot, K. A.; Stein, J. C. (1998)', 'Risk management, capital budgeting, and capital structure policy for financial institutions: an integrated approach', 'Journal of Financial Economics, 47(1), 55–82', 'https://doi.org/10.1016/S0304-405X(97)00037-8', 'Por que o hurdle depende do risco não diversificável pelo banco.'],
  ]],
  ['Cooperativas de crédito (Brasil)', [
    ['Bressan, V. G. F.; Braga, M. J.; Bressan, A. A.; Resende Filho, M. A. (2011)', 'Uma aplicação do sistema PEARLS às cooperativas de crédito brasileiras', 'Revista de Administração (RAUSP), 46(3), 258–274', 'https://doi.org/10.5700/rausp1011', 'Os indicadores PEARLS (WOCCU) aplicados às cooperativas brasileiras — base do Rating Radar.'],
    ['Bressan, V. G. F.; Braga, M. J.; Bressan, A. A.; Resende Filho, M. A. (2011)', 'Avaliação de insolvência em cooperativas de crédito: uma aplicação do sistema PEARLS', 'RAM — Revista de Administração Mackenzie, 12(2), 113–144', 'https://doi.org/10.1590/S1678-69712011000200006', 'Quais indicadores antecipam a insolvência de cooperativas.'],
    ['Bressan, V. G. F.; Bressan, A. A.; Silva Júnior, J. M. (2015)', 'Evitar divulgar perdas: foi uma estratégia utilizada na última década pelas cooperativas de crédito filiadas ao Sicredi?', 'Revista de Gestão e Organizações Cooperativas, 2(3)', 'https://doi.org/10.5902/2359043216336', 'Gerenciamento de resultados (sobras) em cooperativas de um sistema.'],
  ]],
];
const NORMAS = [
  ['Lei Complementar nº 130/2009', 'Sistema Nacional de Crédito Cooperativo', 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp130.htm'],
  ['Resolução CMN nº 5.051/2022', 'Constituição e funcionamento de cooperativas de crédito', 'https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolu%C3%A7%C3%A3o%20CMN&numero=5051'],
  ['Resolução CMN nº 4.966/2021', 'Instrumentos financeiros: classificação, estágios e perda esperada (IFRS 9)', 'https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolu%C3%A7%C3%A3o%20CMN&numero=4966'],
  ['Resolução BCB nº 352/2023', 'Procedimentos contábeis da 4.966, carteiras C1–C5 e perdas mínimas', 'https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolu%C3%A7%C3%A3o%20BCB&numero=352'],
  ['Resolução CMN nº 4.553/2017', 'Segmentação S1 a S5 para aplicação proporcional da regulação', 'https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolu%C3%A7%C3%A3o%20CMN&numero=4553'],
  ['Resolução CMN nº 4.606/2017', 'Metodologia simplificada de capital (RWAS5) para o segmento S5', 'https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolu%C3%A7%C3%A3o%20CMN&numero=4606'],
  ['Circular nº 3.876/2018', 'Risco de taxa de juros da carteira bancária (IRRBB)', 'https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Circular&numero=3876'],
  ['FGCoop', 'Fundo Garantidor do Cooperativismo de Crédito', 'https://www.fgcoop.coop.br'],
];
VIEWS.biblioteca = (V) => {
  head(V, 'Referências · Biblioteca', 'Estante do Radar de Riscos', `Os livros por trás de cada tela — tesourarias (Securato), Hull, Jorion, Choudhry, Bessis, Springer, Wiley e a literatura brasileira de cooperativismo — com artigos de referência e normas. As etiquetas levam à tela correspondente.`);
  for (const [k, t] of AREAS) {
    const bs = BOOKS.filter(b => b.ar === k); if (!bs.length) continue;
    V.appendChild(el('h2', '', t)).style.cssText = 'font-family:var(--serif);font-weight:600;font-size:22px;margin:26px 0 12px;padding-bottom:6px;border-bottom:1px solid var(--line-2)';
    const sh = el('div', 'shelf'); V.appendChild(sh);
    bs.forEach((b, i) => {
      const c = el('article', 'book');
      c.innerHTML = `${coverHTML(b)}<div><h4>${esc(b.t)}</h4><div class="meta">${esc(b.a)} · ${esc(b.p)}${b.y ? ' · ' + b.y : ''}</div><p>${b.why}</p><div class="tags">${b.v.map(v => `<a href="#v=${v}" data-v="${v}">${VIEW_T[v] || v}</a>`).join('')}${b.link ? `<a href="${b.link}">página do livro ↗</a>` : ''}</div></div>`;
      if (!STILL) c.style.cssText = `opacity:0;transform:translateY(8px);animation:rise .5s cubic-bezier(.2,.7,.2,1) ${Math.min(i * 50, 500)}ms forwards`;
      sh.appendChild(c);
    });
  }
  $$('.tags a[data-v]', V).forEach(a => a.addEventListener('click', e => { e.preventDefault(); go(a.dataset.v); }));
  V.appendChild(el('h2', '', 'Artigos de referência')).style.cssText = 'font-family:var(--serif);font-weight:600;font-size:22px;margin:34px 0 4px;padding-bottom:6px;border-bottom:1px solid var(--line-2)';
  const G = grid(V, 'g2'); G.style.marginTop = '14px';
  REFS.forEach(([t, list]) => {
    const c = card(G, { title: t, sub: list.length + ' referências' });
    c.b.innerHTML = `<ul class="refs">${list.map(r => `<li>${esc(r[0])}. <b>${esc(r[1])}</b>. <i>${esc(r[2])}</i>. ${r[3] ? `<a href="${r[3]}" target="_blank" rel="noopener">${r[3].replace('https://', '')}</a>` : ''}<span class="why">${r[4]}</span></li>`).join('')}</ul>`;
  });
  const nc = card(G, { title: 'Normas e fontes oficiais', sub: 'Regulação citada nas telas' });
  nc.b.innerHTML = `<ul class="refs">${NORMAS.map(r => `<li><b>${r[0]}</b> — ${r[1]}. <a href="${r[2]}" target="_blank" rel="noopener">abrir ↗</a></li>`).join('')}</ul>`;
};

/* ---------------- Metodologia ---------------- */
const GLOSS = [
  ['ALM', 'Asset and Liability Management', 'gestão de ativos e passivos'], ['IRRBB', 'Interest Rate Risk in the Banking Book', 'risco de taxa de juros da carteira bancária'],
  ['EVE', 'Economic Value of Equity', 'valor econômico do patrimônio'], ['NII', 'Net Interest Income', 'margem financeira (resultado de intermediação)'],
  ['NIM', 'Net Interest Margin', 'margem financeira sobre o ativo'], ['NMD', 'Non-Maturity Deposits', 'depósitos sem vencimento (à vista, poupança)'],
  ['VaR', 'Value at Risk', 'valor em risco'], ['ES', 'Expected Shortfall', 'perda esperada na cauda'], ['DV01', 'Dollar Value of 1 basis point', 'variação de valor por 1 ponto-base'],
  ['RWA', 'Risk-Weighted Assets', 'ativos ponderados pelo risco'], ['CET1', 'Common Equity Tier 1', 'capital principal'], ['PR', 'Regulatory Capital', 'patrimônio de referência'],
  ['LCR', 'Liquidity Coverage Ratio', 'índice de cobertura de liquidez'], ['PD · LGD · EAD', 'Probability of Default · Loss Given Default · Exposure at Default', 'probabilidade de descumprimento · perda dado o descumprimento · exposição'],
  ['EL · UL', 'Expected / Unexpected Loss', 'perda esperada / inesperada'], ['ASRF', 'Asymptotic Single Risk Factor', 'modelo de fator de risco único assintótico'],
  ['CCF', 'Credit Conversion Factor', 'fator de conversão de crédito'], ['RAROC', 'Risk-Adjusted Return on Capital', 'retorno ajustado ao risco sobre o capital'],
  ['FTP', 'Funds Transfer Pricing', 'preço de transferência de recursos'], ['ICAAP', 'Internal Capital Adequacy Assessment Process', 'processo interno de avaliação da adequação de capital'],
  ['Stage 1/2/3', 'IFRS 9 impairment stages', 'estágios de risco de crédito'], ['Backtesting', 'Backtesting', 'teste retroativo do modelo'],
];
VIEWS.metodologia = (V) => {
  head(V, 'Referências · Metodologia', 'Metodologia, dados e glossário', 'Como cada número foi obtido, o que é dado oficial e o que é modelo, e as limitações que importam para a leitura.');
  const G = grid(V, 'g2');
  const src = card(G, { title: 'Fontes de dados', sub: 'Todas públicas, do Banco Central do Brasil' });
  src.b.innerHTML = `<ul class="refs">
    <li><b>IF.data (Olinda/OData)</b> — trimestres ${D.Q.map(qlab).join(', ')}: Resumo, Ativo, Passivo, DRE, Informações de Capital (PR, RWA por risco, IRRBB, alavancagem), carteira por indexador, quantidade de clientes, carteira PF/PJ por modalidade e prazo e carteiras C1–C5 com inadimplência e ativos problemáticos (derivados do SCR, documento 3040). Conglomerados prudenciais para bancos; cooperativas como instituições independentes.</li>
    <li><b>Balancetes COSIF</b> — mensais de ${mlab('202506')} a ${mlab(D.base)}: documento 4010 (cooperativas, individual), 4060 (conglomerados prudenciais) e combinados cooperativos 4413/4423/4433 (sistemas e centrais, trimestrais). Contas até o nível 4, estágios de risco (3.3.1), carteiras de provisão (3.3.2), contribuição ao fundo garantidor e depósitos PF/PJ.</li>
    <li><b>Relação de instituições em funcionamento</b> — cooperativas com classe, categoria, associação e filiação à central, usada para montar a árvore Sistema → Singular.</li>
    <li><b>SCR.data</b> — agregados mensais por segmento (o mesmo recorte da Cidade do Crédito) para cooperativas × bancos.</li>
    <li><b>SGS</b> — Selic, CDI, IPCA 12m, base monetária, M1–M4, compulsórios, taxa média e spread das concessões; <b>Focus</b> para expectativas de Selic.</li></ul>
    <p class="note">Música de abertura: <a href="https://zero-project.gr/music/tracks/sarabande/" target="_blank" rel="noopener">Sarabanda</a> da Suíte em ré menor HWV 437 de G. F. Händel (obra em domínio público), arranjo e gravação de <b>zero-project</b>, licença <a href="https://creativecommons.org/licenses/by/4.0/deed.pt-br" target="_blank" rel="noopener">CC BY 4.0</a>; arquivo recodificado em MP3 de ~120 kbps, com o silêncio das pontas aparado.</p>`;
  const tr = card(G, { title: 'Tratamentos', sub: 'Decisões de cálculo' });
  tr.b.innerHTML = `<ul class="refs">
    <li><b>DRE em 12 meses</b>: o IF.data acumula a DRE no semestre (jun = 1S, dez = 2S). 12 meses = dez/25 + jun/26; trimestres: mar e set diretos, jun = jun − mar, dez = dez − set.</li>
    <li><b>Saldos médios</b>: média de jun/25, set/25, dez/25, mar/26 e jun/26 para ROA, ROE, NIM, taxas e custos.</li>
    <li><b>Taxas ao mês × ao ano</b> (Spread e DRE gerencial): receitas e despesas são fluxos e carteiras são saldos, então cada taxa divide o fluxo de um período pelo saldo médio do mesmo período — ao mês, fluxo ÷ nº de meses ÷ saldo médio (12 meses ÷ 12; trimestre ÷ 3), o mesmo que dividir pela soma dos saldos mensais; ao ano, 12 meses ÷ saldo médio (trimestre × 4).</li>
    <li><b>Sistemas</b>: soma das singulares (sem centrais, para não contar duas vezes) para os indicadores do IF.data; o balancete oferece também o <b>combinado oficial</b> do sistema.</li>
    <li><b>Índices de agregados</b> são recalculados a partir das somas (ex.: Basileia = ΣPR ÷ ΣRWA), nunca por média de índices.</li>
    <li><b>Centralização financeira</b> (cooperativas): o IF.data registra os recursos aplicados na central em "outros ativos" e sua remuneração em "outras receitas". O Radar soma o saldo da conta 1.4.5 do balancete 4010 à liquidez e os ingressos líquidos de depósitos intercooperativos (7.1.9.86 − 8.1.9.86) à margem financeira, por trimestre.</li>
    <li><b>Cooperativas S5</b> (regime simplificado) informam apenas PR e RWAS5: capital principal, nível I, razão de alavancagem e capital IRRBB são calculados só sobre as instituições que os reportam, e o número de instituições cobertas aparece na tela de capital.</li>
    <li><b>DFC</b>: estimada pelo método indireto a partir de dois balanços IF.data e do resultado de 12 meses; não é a DFC publicada.</li>
    <li><b>Modelos</b> (marcados com a etiqueta roxa "modelo"): Vasicek, VaR/ES, backtesting, IRRBB, liquidez, RAROC, capital econômico, estresse e rating — usam dados reais com premissas declaradas e ajustáveis.</li></ul>`;
  const lim = card(G, { title: 'Limitações', sub: 'Leia antes de concluir' });
  lim.b.innerHTML = `<ul class="refs">
    <li>Prazos do SCR são <b>contratuais</b>; repactuação de pós-fixados usa a participação de CDI/Selic no total da carteira (não por modalidade).</li>
    <li>Depósitos sem vencimento e a parcela prefixada da tesouraria são <b>premissas</b>: o ΔEVE é indicativo e deve ser comparado ao capital IRRBB reportado.</li>
    <li>Taxas implícitas são sobre o <b>estoque</b> e misturam modalidades (inclui rural e direcionado); não se comparam diretamente às taxas de concessões do SGS.</li>
    <li>Cooperativas S5 no regime simplificado têm requerimento de capital próprio (RWAS5); limites de 10,5% são referência para S1–S4.</li>
    <li>O <b>Rating Radar</b> é ilustrativo — não representa avaliação do FGCoop, do Banco Central ou de agências.</li></ul>`;
  const fx = card(G, { title: 'Fórmulas', sub: 'Clique em "i" nos cartões para ver cada uma no contexto' });
  fx.b.innerHTML = Object.entries(FX).filter(([k, f]) => f.tex).map(([k, f]) => `<div style="margin:0 0 10px"><b style="font-size:13px">${f.t}</b><span class="fx" data-tex="${esc(f.tex)}"></span></div>`).join('');
  const gl = card(G, { cls: '', title: 'Glossário bilíngue', sub: 'Termo · original em inglês · tradução' });
  gl.c.style.gridColumn = '1 / -1';
  gl.b.innerHTML = `<div class="tblwrap" style="max-height:none"><table class="tbl"><thead><tr><th>Sigla</th><th style="text-align:left">English term</th><th style="text-align:left">Tradução</th></tr></thead><tbody>${GLOSS.map(g => `<tr><td class="l"><b>${g[0]}</b></td><td class="l"><i>${g[1]}</i></td><td class="l">${g[2]}</td></tr>`).join('')}</tbody></table></div>`;
};

/* ---------------- registro de fórmulas ---------------- */
const FX = {
  balanca: { t: 'Balança da intermediação', tex: '\\underbrace{\\text{Crédito}}_{\\text{tomadores}}\\;\\text{vs}\\;\\underbrace{\\text{Captações}}_{\\text{poupadores}}\\qquad \\theta \\propto \\frac{\\text{Crédito}}{\\text{Captações}}-1', d: 'A inclinação do travessão é proporcional à razão crédito/captações. O medalhão mostra o multiplicador do capital (ativo ÷ PL) e o painel inferior decompõe o spread da carteira. O quadro do SFN usa m = M1 ÷ base monetária, com c = papel-moeda em poder do público ÷ M1 e r = (base − papel-moeda do público) ÷ depósitos à vista, de forma que m = 1 ÷ [c + r(1 − c)].', s: 'IF.data; SGS 1788, 27789, 27790, 27791, 27810.' },
  ib: { t: 'Índice de Basileia', tex: '\\text{IB}=\\frac{\\text{PR}}{\\text{RWA}_{\\text{cr}}+\\text{RWA}_{\\text{mer}}+\\text{RWA}_{\\text{op}}+\\text{RWA}_{\\text{sp}}}', d: 'Patrimônio de referência sobre ativos ponderados pelo risco. Referência: 8% de PR + 2,5% de adicional de conservação = 10,5% (S1–S4).', s: 'IF.data · Informações de Capital.' },
  ra: { t: 'Razão de alavancagem', tex: '\\text{RA}=\\frac{\\text{Nível I}}{\\text{Exposição total}}', d: 'Capital de nível I sobre a exposição total sem ponderação de risco; mínimo de 3% para S1 e S2.', s: 'IF.data.' },
  rwa: { t: 'Densidade de RWA', tex: '\\text{densidade}=\\frac{\\text{RWA}}{\\text{Ativo total}}', d: 'Quanto do ativo "pesa" para capital: carteiras de varejo e PJ elevam a densidade; títulos públicos e operações garantidas reduzem.', s: 'IF.data.' },
  buffer: { t: 'Folga de capital e capacidade de crescimento', tex: '\\text{Folga}=\\text{PR}-10{,}5\\%\\times\\text{RWA}\\qquad \\Delta C_{\\max}=\\frac{\\text{Folga}}{10{,}5\\%\\times \\text{RW}}', d: 'A folga de PR sobre o requerimento sustenta novos ativos com ponderação RW; a perda que zera a folga considera que o RWA cai com a baixa.', s: 'Modelo sobre dados do IF.data.' },
  roe: { t: 'ROE e ROA', tex: '\\text{ROE}=\\frac{\\text{Resultado}_{12m}}{\\overline{\\text{PL}}}\\qquad \\text{ROA}=\\frac{\\text{Resultado}_{12m}}{\\overline{\\text{Ativo}}}', d: 'Resultado de 12 meses (lucro ou sobras) sobre saldos médios de cinco trimestres.', s: 'IF.data · DRE e balanço.' },
  inad: { t: 'Inadimplência (SCR)', tex: '\\text{Inad}=\\frac{\\text{Carteira inadimplida (90+ dias, arrastada)}}{\\text{Carteira ativa SCR}}', d: 'Operações com atraso acima de 90 dias, com arrasto do cliente, sobre a carteira ativa informada ao SCR.', s: 'IF.data · relatório 16 (SCR, documento 3040).' },
  prob: { t: 'Ativos problemáticos', tex: '\\text{AP}=\\frac{\\text{Inadimplência}+\\text{reestruturados e indícios de não pagamento}}{\\text{Carteira ativa}}', d: 'Conceito prudencial mais amplo que a inadimplência: inclui operações reestruturadas e com indícios de que não serão honradas.', s: 'IF.data · relatório 16.' },
  stages: { t: 'Estágios de risco (IFRS 9 · Res. 4.966)', tex: '\\text{Estágio }3\\,\\%=\\frac{E_3+\\text{simplificada problemática}}{E_1+E_2+E_3+\\text{simplificada}}', d: 'Ativos financeiros classificados por estágio no balancete (contas 3.3.1). Estágio 1: perda esperada de 12 meses; estágio 2: aumento significativo do risco (vida inteira); estágio 3: problema de recuperação.', s: 'Balancetes 4010/4060.' },
  c15: { t: 'Carteiras C1 a C5', tex: '', d: 'Agrupamento da carteira previsto na Resolução BCB 352 para a perda mínima sobre ativos inadimplidos: de C1 (menores percentuais mínimos, garantias mais fortes) a C5 (maiores percentuais). A distribuição indica a qualidade das garantias e o piso de provisão em caso de atraso.', s: 'IF.data · relatório 16.' },
  cob: { t: 'Cobertura', tex: '\\text{Cobertura}=\\frac{\\text{Perda esperada (estoque)}}{\\text{Ativos problemáticos}}', d: 'Quanto da carteira problemática já está provisionado.', s: 'IF.data · Ativo e relatório 16.' },
  cor: { t: 'Custo do risco', tex: '\\text{CoR}=\\frac{-\\text{Resultado com perda esperada de crédito}_{12m}}{\\overline{\\text{Carteira bruta}}}', d: 'Despesa de provisão do ano sobre a carteira média.', s: 'IF.data · DRE (f3).' },
  nim: { t: 'NII e NIM', tex: '\\text{NII}=\\text{RIF}-\\text{PE}\\qquad \\text{NIM}=\\frac{\\text{NII}_{12m}}{\\overline{\\text{Ativo}}}', d: 'Margem financeira antes da perda esperada: receitas da intermediação menos despesas de captação e de dívida.', s: 'IF.data · DRE.' },
  eff: { t: 'Índice de eficiência', tex: '\\text{Ef}=\\frac{\\text{Pessoal}+\\text{Administrativas}}{\\text{NII}+\\text{Tarifas}+\\text{Serviços}+\\text{Pagamentos}}', d: 'Quanto da receita é consumido por despesas operacionais; menor é melhor.', s: 'IF.data · DRE.' },
  feecov: { t: 'Cobertura por serviços', tex: '\\frac{\\text{Tarifas}+\\text{Serviços}}{\\text{Pessoal}+\\text{Administrativas}}', d: 'Quanto da estrutura de custos é paga por receitas não ligadas a juros.', s: 'IF.data · DRE.' },
  yld: { t: 'Taxa implícita da carteira', tex: 'y=\\frac{\\text{Rendas de crédito}_{12m}}{\\overline{\\text{Carteira bruta}}}', d: 'Rendimento médio do estoque de crédito.', s: 'IF.data.' },
  cof: { t: 'Custo de captação', tex: 'c=\\frac{-\\text{Despesas de captação}_{12m}}{\\overline{\\text{Captações}}}\\qquad \\%\\text{CDI}=\\frac{c}{\\overline{\\text{CDI}}}', d: 'Custo médio do funding remunerado; comparado ao CDI médio do período.', s: 'IF.data; SGS 4189.' },
  spread: { t: 'Spread bruto', tex: 's=y-c', d: 'Diferença entre a taxa implícita da carteira e o custo de captação.', s: 'IF.data.' },
  spreaddec: { t: 'Decomposição do spread', tex: 'y=\\underbrace{c\\cdot\\tfrac{\\overline{\\text{Captações}}}{\\overline{\\text{Ativo}}}}_{\\text{captação atribuída}}+\\underbrace{\\text{CoR}}_{\\text{inadimplência}}+\\underbrace{\\tfrac{\\text{Pessoal}+\\text{Adm}}{\\overline{\\text{Ativo}}}}_{\\text{adm.}}+\\underbrace{\\tfrac{\\text{Trib.}+\\text{IR/CS}}{\\overline{\\text{Ativo}}}}_{\\text{tributos}}+\\text{margem}', d: 'Inspirada na decomposição do ICC no Relatório de Economia Bancária. Todos os custos são alocados ao crédito pela participação no ativo: o custo de captação incide só sobre a fração do ativo financiada por captações remuneradas; o restante (PL e passivos sem custo) aparece como "funding sem custo". A margem é o resíduo.', s: 'IF.data; REB/Bacen (metodologia de referência).' },
  dre: { t: 'Cascata da DRE', tex: '\\text{Lucro}=\\text{NII}+\\text{PE}+\\text{Serviços}-\\text{Pessoal}-\\text{Adm}-\\text{Trib}\\pm\\text{Outras}-\\text{IR}-\\text{PLR}', d: 'Leitura de cima para baixo da DRE no leiaute da Res. 4.966.', s: 'IF.data · DRE.' },
  dfc: { t: 'DFC pelo método indireto', tex: '\\Delta\\text{Caixa}=\\underbrace{\\text{LL}+\\text{PE}-\\Delta\\text{Ativos op.}+\\Delta\\text{Passivos op.}}_{\\text{operacional}}-\\Delta\\text{Permanente}+\\underbrace{\\Delta\\text{Dívida sub.}+(\\Delta\\text{PL}-\\text{LL})}_{\\text{financiamento}}', d: 'Reconstrução do fluxo de caixa a partir de dois balanços e do resultado. Por identidade contábil, a soma fecha com a variação de caixa e equivalentes.', s: 'IF.data (balanços de jun/25 e jun/26; DRE 12m).' },
  vasicek: { t: 'Perda inesperada — Vasicek/ASRF', tex: '\\text{WCDR}=\\Phi\\!\\left(\\frac{\\Phi^{-1}(PD)+\\sqrt{\\rho}\\,\\Phi^{-1}(q)}{\\sqrt{1-\\rho}}\\right)\\quad UL=(\\text{WCDR}-PD)\\times LGD\\times EAD', d: 'Taxa de inadimplência condicional ao fator sistêmico no quantil q: base da fórmula IRB de Basileia. A correlação de varejo é 3%–16% conforme a PD.', s: 'Vasicek (2002); Gordy (2003); BCBS (2005).' },
  ytes: { t: 'Rendimento da tesouraria', tex: '\\frac{\\text{Rendas de TVM}+\\text{Rendas de aplicações interfinanceiras}}{\\overline{\\text{TVM}}+\\overline{\\text{Disp.}+\\text{Aplic.}}}', d: 'Retorno médio dos ativos de tesouraria em 12 meses, comparado ao CDI.', s: 'IF.data.' },
  irrbb: { t: 'Capital IRRBB', tex: '\\frac{K_{\\text{IRRBB}}}{\\text{PR}}', d: 'Capital para cobertura do risco de taxa de juros da carteira bancária informado no IF.data (Circular 3.876/2018).', s: 'IF.data · Informações de Capital.' },
  rwamkt: { t: 'RWA de mercado', tex: '\\text{RWA}_{\\text{mer}}=\\text{RWA}_{\\text{jur}}+\\text{RWA}_{\\text{cam}}+\\text{RWA}_{\\text{com}}+\\text{RWA}_{\\text{acs}}+\\text{RWA}_{\\text{cva}}+\\text{RWA}_{\\text{drc}}', d: 'Parcelas de ativos ponderados por fator de risco de mercado; requisito = 8% do RWA.', s: 'IF.data.' },
  var: { t: 'VaR e Expected Shortfall', tex: '\\text{VaR}_\\alpha=-q_{1-\\alpha}(\\Delta P),\\quad \\Delta P\\approx -D\\cdot MV\\cdot \\Delta y\\qquad \\text{ES}_\\alpha=-\\mathbb{E}[\\Delta P\\mid \\Delta P\\le -\\text{VaR}_\\alpha]', d: 'P&L de juros aproximado por duration × valor × choque de taxa; distribuição normal ou t de Student (ν = 4) simulada com 20 mil cenários.', s: 'Jorion; Dowd; Artzner et al. (1999).' },
  kupiec: { t: 'Teste de Kupiec (POF)', tex: 'LR=-2\\ln\\!\\left[(1-p)^{T-x}p^{x}\\right]+2\\ln\\!\\left[(1-\\hat p)^{T-x}\\hat p^{x}\\right]\\sim\\chi^2_1', d: 'Compara a frequência observada de exceções x/T com a esperada p; zonas de Basileia por número de exceções em 250 dias.', s: 'Kupiec (1995); BCBS.' },
  nmd: { t: 'Depósitos sem vencimento', tex: '\\text{NMD}=\\underbrace{(1-c)\\,\\text{NMD}}_{\\le 3m}+\\underbrace{c\\,\\text{NMD}}_{\\text{distribuído até o prazo médio}}', d: 'A parcela "core" (estável e pouco sensível a juros) é distribuída entre os prazos para atingir o prazo médio escolhido; o restante reprecifica em até 3 meses. BCBS limita core e prazo médio por tipo de depositante.', s: 'BCBS d368.' },
  gap: { t: 'Gap de repactuação', tex: '\\text{Gap}_i=A_i-L_i\\qquad \\text{Gap acumulado}_k=\\sum_{i\\le k}\\text{Gap}_i', d: 'Ativos e passivos sensíveis a juros por prazo de repactuação: pós-fixados no primeiro prazo; prefixados no vencimento contratual (SCR).', s: 'SCR (prazos e indexadores) + premissas.' },
  eve: { t: 'ΔEVE nos choques padronizados', tex: '\\Delta EVE_s=\\sum_i \\text{Gap}_i\\left(e^{-(r_0+\\Delta r_s(t_i))t_i}-e^{-r_0 t_i}\\right)', d: 'Seis cenários BCBS com calibração do real: paralelo ±400 bp; curto ±500·e^(−t/4); longo 300·(1−e^(−t/4)); steepener −0,65|curto|+0,9|longo|; flattener +0,8|curto|−0,6|longo|. Teste de outlier: pior ΔEVE acima de 15% do nível I.', s: 'BCBS (2016) d368.' },
  nii: { t: 'ΔNII em 12 meses', tex: '\\Delta NII=\\sum_{t_i<1}\\text{Gap}_i\\,\\Delta r\\,(1-t_i)', d: 'Efeito de um choque paralelo instantâneo sobre a margem dos próximos 12 meses, com balanço constante.', s: 'BCBS d368; Saunders & Cornett.' },
  lcr: { t: 'Cobertura de liquidez (proxy)', tex: '\\frac{\\text{Disp.}+\\text{Aplic.}+0{,}85\\,\\text{TVM}}{s\\,(\\text{à vista}+\\text{poupança})+0{,}8\\,s\\,\\text{prazo}+0{,}5\\,\\text{compromissadas}+\\tfrac{1}{12}\\text{letras}}', d: 'Indicador simplificado inspirado no LCR, com taxa de saque s ajustável; não é o LCR regulatório.', s: 'BCBS (2013) bcbs238 — inspiração.' },
  raroc: { t: 'Precificação RAROC', tex: 'r_{\\min}=CF(1-K)+PD\\cdot LGD+c_{op}+\\frac{h\\,K}{1-t}\\qquad K=RW\\times 10{,}5\\%', d: 'Taxa que cobre funding da parcela não financiada por capital, perda esperada, custo operacional e o retorno exigido h sobre o capital alocado, bruto de tributos.', s: 'Zaik et al. (1996); Resti & Sironi.' },
  appetite: { t: 'Apetite a risco', tex: '', d: 'Limites em três níveis (confortável, atenção, alerta) definidos como referência executiva; o percentil é orientado para que valores maiores signifiquem melhor posição.', s: 'Radar de Riscos.' },
  ecap: { t: 'Capital econômico agregado', tex: 'CE=\\sqrt{\\mathbf{v}^{\\top}\\mathbf{C}\\,\\mathbf{v}}\\qquad \\mathbf{v}=(CE_{cr},CE_{mer},CE_{op},CE_{irrbb})', d: 'Agregação variância-covariância dos capitais isolados com matriz de correlação C ajustável; a diferença para a soma simples é o benefício de diversificação.', s: 'Bessis; Resti & Sironi.' },
  stress: { t: 'Estresse integrado', tex: '\\text{IB}^{\\text{estr}}=\\frac{\\text{PR}-\\Delta PE+\\min(0,\\Delta NII)+\\tfrac12\\Delta EVE}{\\text{RWA}}', d: 'Choques simultâneos: PD e LGD estressadas, alta de juros e saques; efeitos sobre capital, resultado e liquidez.', s: 'Modelo ilustrativo.' },
  rating: { t: 'Rating Radar', tex: '\\text{Score}=\\sum_p w_p\\,\\overline{s}_p,\\quad s=100\\cdot\\text{clamp}\\!\\left(\\frac{x-x_{\\text{ruim}}}{x_{\\text{bom}}-x_{\\text{ruim}}},0,1\\right)', d: 'Seis pilares (capital 25%, carteira 25%, rentabilidade 15%, eficiência 10%, liquidez 15%, funding 10%). Classes: AAA ≥ 90, AA ≥ 80, A ≥ 70, BBB ≥ 60, BB ≥ 50, B ≥ 40, CCC abaixo. Ilustrativo, inspirado em PEARLS/CAMELS.', s: 'Bressan et al. (2011); WOCCU PEARLS.' },
};

/* ---------------- render e inicialização ---------------- */
let PICK = null;
function footer(V) {
  V.appendChild(el('div', 'foot2', `<span>Radar de Riscos · dados públicos do Banco Central do Brasil (IF.data, balancetes COSIF, SCR.data, SGS) · data-base ${mlab(D.Q[QI])} · gerado em ${D.gerado.split('-').reverse().join('/')}</span><span>Indicadores marcados como <b>modelo</b> usam premissas declaradas.</span><span>♪ Música: <a href="https://zero-project.gr/music/tracks/sarabande/" target="_blank" rel="noopener">Sarabanda (G. F. Händel, HWV 437) — arranjo e gravação zero-project</a> · <a href="https://creativecommons.org/licenses/by/4.0/deed.pt-br" target="_blank" rel="noopener">CC BY 4.0</a></span><span><a href="cidade_credito.html">Cidade do Crédito</a> · <a href="credit_risk_analytics_book.html">Credit Risk Analytics</a> · <a href="market_risk.html">Risco de mercado</a> · <a href="portfolio.html">Portfólio</a></span>`));
}
let LAST_VIEW = null, STILL_T = null;
function render(scrollTop) {
  if (ANIM) { cancelAnimationFrame(ANIM); ANIM = null; }
  tipHide(); POP.classList.remove('on'); closePickers();
  DELAY = 0;
  const V = $('#view');
  // mesma tela (filtro, data-base, instituição, tema ou controle interno): remonta no lugar, sem voltar ao topo nem reanimar
  const stay = !scrollTop && LAST_VIEW === ST.v && V.childElementCount > 0;
  const snap = stay ? keepSnap(V) : null;
  clearTimeout(STILL_T); V.classList.toggle('still', stay);
  STILL = stay;
  try { renderView(V); } finally { STILL = false; }
  if (snap) { keepRestore(V, snap); STILL_T = setTimeout(() => V.classList.remove('still'), 1200); }
  else if (scrollTop) window.scrollTo(0, 0);
  LAST_VIEW = ST.v;
}
function renderView(V) {
  V.innerHTML = '';
  markNav(!STILL);
  const n = node(ST.e);
  if (PICK) PICK.set(ST.e);
  const noEnt = ['comparar', 'biblioteca', 'metodologia', 'painel'].includes(ST.v);
  $('#filtMain').style.visibility = noEnt ? 'hidden' : 'visible';
  HEAD_NODE = noEnt ? null : n;
  $('#dbSel').value = String(QI);
  document.title = (VIEW_T[ST.v] || '') + ' · ' + n.name + ' · Radar de Riscos';
  PICKERS.length = PICK ? 1 : 0;
  try { VIEWS[ST.v](V, n); } catch (err) { console.error(err); V.appendChild(el('p', 'note', 'Falha ao montar esta visão: ' + esc(err.message))); }
  footer(V);
  tex(V);
}
function initBase() {
  const sel = $('#dbSel');
  sel.innerHTML = D.Q.map((q, i) => ({ q, i })).reverse().map(({ q, i }) => `<option value="${i}">${MES[+q.slice(4) - 1]}/${q.slice(0, 4)} · ${qlab(q)}${i === NQ - 1 ? ' · mais recente' : ''}</option>`).join('');
  sel.value = String(QI);
  sel.onchange = () => { setBase(+sel.value); writeHash(); render(false); };
  const sb = $('#sideBase'); if (sb) sb.textContent = mlab(D.Q[NQ - 1]);
}
function init() {
  buildNav(); readHash();
  PICK = makePicker($('#pickerMain'), { value: ST.e, onChange: id => { ST.e = id; writeHash(); render(false); } });
  initBase();
  writeHash();
  render(false);
  MUSIC.start();   // Sarabanda de Händel: toca já ou no primeiro gesto, conforme a política de som do navegador
  let lw = innerWidth, to = null;
  addEventListener('resize', () => { clearTimeout(to); to = setTimeout(() => { if (Math.abs(innerWidth - lw) > 40) { lw = innerWidth; render(false); } }, 250); });
  addEventListener('load', () => tex($('#view')));
}
