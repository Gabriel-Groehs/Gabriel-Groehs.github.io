/* =====================================================================
   Telas: Balança (visão executiva) e Demonstrações (balancete, DRE, DFC, spread)
   ===================================================================== */
const VIEWS = {};
let ANIM = null;
const isCoop = n => n.grp === 'coop';
const lucroLbl = n => isCoop(n) ? 'Sobras / resultado' : 'Lucro líquido';
const lucroK = n => isCoop(n) ? 'Sobras' : 'Lucro';
const BLUE_RAMP = ['#104281', '#1c5cab', '#2a78d6', '#5598e7', '#86b6ef', '#b7d3f6'];
const GOLD_RAMP = ['#7C5A12', '#9C7421', '#C49A3E', '#D9B45E', '#E8CD8C', '#F2E2B8'];
const qcats = () => D.Q.slice(0, QI + 1).map(qlab);
const mcats = () => { const e = mEnd(QI); return e >= 0 ? D.M.slice(0, e + 1).map(mlab) : []; };

/* composição de funding e de crédito para a balança */
function fundingParts(m) {
  const parts = [
    { label: 'Depósitos a prazo / RDC', value: m.dpra, k: 'dpra' },
    { label: 'Depósitos à vista', value: m.dvis, k: 'dvis' },
    { label: 'Poupança', value: m.dpou, k: 'dpou' },
    { label: 'LCA · LCI · LF', value: m.letras, k: 'let' },
    { label: 'Repasses e empréstimos', value: m.emr, k: 'emr' },
    { label: 'Interfinanceiros e outros', value: m.dint + m.dout + m.dpre + m.comp + m.ext + m.demi, k: 'out' },
  ].filter(p => p.value > 0).sort((a, b) => b.value - a.value);
  parts.forEach((p, i) => { p.color = BLUE_RAMP[Math.min(i, 5)]; });
  return parts;
}
function creditParts(m) {
  const r = m.r, pf = r.pf, pj = r.pj;
  const t = (mat, i) => mat ? sum(mat[i]) : 0;
  let parts;
  if (pf || pj) {
    parts = [
      { label: 'Rural e agroindustrial', value: t(pf, 5) + t(pj, 7) },
      { label: 'PJ: capital de giro e recebíveis', value: t(pj, 0) + t(pj, 2) + t(pj, 3) },
      { label: 'Pessoal, cartão e outros PF', value: t(pf, 1) + t(pf, 4) + t(pf, 6) },
      { label: 'Consignado', value: t(pf, 0) },
      { label: 'Veículos e habitação', value: t(pf, 2) + t(pf, 3) + t(pj, 6) },
      { label: 'PJ: investimento, infra e comex', value: t(pj, 1) + t(pj, 4) + t(pj, 5) + t(pj, 8) },
    ];
  } else parts = [{ label: 'Carteira de crédito', value: m.cart }];
  parts = parts.filter(p => p.value > 0).sort((a, b) => b.value - a.value);
  const tt = sum(parts.map(p => p.value)); if (tt > 0 && m.cart > 0) parts.forEach(p => { p.value = p.value / tt * m.cart; });
  parts.forEach((p, i) => { p.color = GOLD_RAMP[Math.min(i, 5)]; });
  return parts;
}
/* decomposição do spread (por R$ de carteira média, a.a.) */
function spreadDecomp(m) {
  const aC = m.avg.crb, aA = m.avg.at;
  const y = m.yld, c = m.cof;
  const share = clamp(div(m.avg.capt, aA) || 1, 0, 1);
  const cA = c * share, eq = c - cA;
  const cor = div(-m.L.pecr, aC);
  const adm = div(m.opx, aA);
  const trib = div(m.trib, aA);
  const margin = y - cA - cor - adm - trib;
  return { y, c, cA, eq, share, cor, adm, trib, margin, spread: y - c };
}

/* ---------------- a cena da balança ---------------- */
function drawScale(host, n, m) {
  if (ANIM) { cancelAnimationFrame(ANIM); ANIM = null; }
  host.innerHTML = '<div class="scale-hint">← arraste para explorar a balança →</div>';
  const scroller = el('div', 'scale-scroll'); host.appendChild(scroller);
  const W = 1200, H = 700, svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'scale-svg', role: 'img', 'aria-label': 'Balança da intermediação financeira' }, scroller);
  const defs = S('defs', {}, svg);
  const lg = (id, c1, c2, vert = true) => { const g = S('linearGradient', { id, x1: 0, y1: 0, x2: vert ? 0 : 1, y2: vert ? 1 : 0 }, defs); S('stop', { offset: '0', 'stop-color': c1 }, g); S('stop', { offset: '1', 'stop-color': c2 }, g); };
  lg('gBeam', '#F2D58A', '#9C7421'); lg('gStone', 'var(--surface)', 'var(--surface-3)'); lg('gCol', 'var(--surface-2)', 'var(--surface-3)', false); lg('gGlow', 'rgba(216,177,90,.28)', 'rgba(216,177,90,0)');
  const rg = S('radialGradient', { id: 'gMed', cx: '35%', cy: '30%', r: '75%' }, defs); S('stop', { offset: '0', 'stop-color': '#F7E3A8' }, rg); S('stop', { offset: '.55', 'stop-color': '#C9A043' }, rg); S('stop', { offset: '1', 'stop-color': '#7C5A12' }, rg);
  const sh = S('filter', { id: 'fSh', x: '-20%', y: '-20%', width: '140%', height: '160%' }, defs); S('feDropShadow', { dx: 0, dy: 6, stdDeviation: 7, 'flood-color': '#000', 'flood-opacity': .18 }, sh);

  const fund = fundingParts(m), cred = creditParts(m);
  const capt = sum(fund.map(p => p.value)), cart = sum(cred.map(p => p.value));
  const ratio = div(cart, capt);
  const thetaT = clamp(13 * ((ok(ratio) ? ratio : 1) - 1), -9, 9);
  const PX = 600, PY = 232, BL = 330;
  const sd = spreadDecomp(m);

  /* fundo: halo e chão */
  S('ellipse', { cx: 600, cy: 470, rx: 520, ry: 210, fill: 'url(#gGlow)' }, svg);
  S('line', { x1: 40, x2: 1160, y1: 528, y2: 528, stroke: 'var(--line-2)', 'stroke-dasharray': '2 6' }, svg);

  /* multiplicador (topo) */
  const top = S('g', {}, svg);
  S('line', { x1: PX, y1: 150, x2: PX, y2: PY - 12, stroke: 'var(--gold)', 'stroke-width': 1.5, 'stroke-dasharray': '3 4', class: 'flowdash' }, top);
  S('circle', { cx: PX, cy: 92, r: 64, fill: 'url(#gMed)', filter: 'url(#fSh)' }, top);
  S('circle', { cx: PX, cy: 92, r: 54, fill: 'none', stroke: 'rgba(255,255,255,.55)', 'stroke-width': 1 }, top);
  const alavF = clamp(div(m.alav, 25), 0, 1), C = 2 * Math.PI * 58;
  const ring = S('circle', { cx: PX, cy: 92, r: 58, fill: 'none', stroke: '#2a1d05', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': `0 ${C}`, transform: `rotate(-90 ${PX} 92)`, style: 'transition:stroke-dasharray 1.6s cubic-bezier(.2,.8,.2,1) .3s' }, top);
  later(() => ring.setAttribute('stroke-dasharray', `${C * alavF} ${C}`), 60);
  T(top, PX, 86, ok(m.alav) ? '×' + nf(1).format(m.alav) : '—', { 'text-anchor': 'middle', style: 'font:800 30px var(--sans);fill:#21170a' });
  T(top, PX, 106, 'ATIVO ÷ PL', { 'text-anchor': 'middle', style: 'font:700 9.5px var(--mono);letter-spacing:.12em;fill:#3b2a0c' });
  T(top, PX, 120, 'multiplicador', { 'text-anchor': 'middle', style: 'font:600 10px var(--sans);fill:#3b2a0c' });
  const chipL = (x, y, a, b, anchor) => { const g = S('g', {}, top); T(g, x, y, a, { 'text-anchor': anchor, style: 'font:700 18px var(--sans);fill:var(--ink)' }); T(g, x, y + 16, b, { 'text-anchor': anchor, class: 'lbl', style: 'font-size:11px' }); return g; };
  chipL(PX - 84, 72, ok(m.cart / m.pl) ? '×' + nf(1).format(m.cart / m.pl) : '—', 'crédito por R$ 1 de PL', 'end');
  chipL(PX - 84, 112, pct(m.ltd, 0), 'crédito / depósitos', 'end');
  chipL(PX + 84, 72, pct(m.ltdC, 0), 'crédito / captações', 'start');
  chipL(PX + 84, 112, pct(m.ib, 1), 'Índice de Basileia', 'start');
  // multiplicador monetário do SFN
  const mm = sgLast('m1'), bb = sgLast('base'), pm = sgLast('pmpp'), dv = sgLast('dv');
  const mon = S('g', { transform: 'translate(930,26)' }, top);
  S('rect', { x: 0, y: 0, width: 240, height: 96, rx: 12, fill: 'var(--surface)', stroke: 'var(--line-2)' }, mon);
  T(mon, 14, 22, 'MULTIPLICADOR MONETÁRIO · SFN', { style: 'font:600 9.5px var(--mono);letter-spacing:.08em;fill:var(--gold-ink)' });
  T(mon, 14, 52, 'm = M1 ÷ B = ×' + nf(2).format(mm.v / bb.v), { style: 'font:700 17px var(--sans);fill:var(--ink)' });
  const cpar = pm.v / mm.v, rpar = (bb.v - pm.v) / dv.v;
  T(mon, 14, 72, `c = ${pct(cpar, 0)} (papel-moeda/M1) · r = ${pct(rpar, 0)}`, { class: 'lbl' });
  T(mon, 14, 87, `M2 ÷ B = ×${nf(1).format(sgLast('m2').v / bb.v)} · ${mlab(mm.m)} (SGS)`, { class: 'lbl' });
  const mm2 = S('g', { transform: 'translate(30,26)' }, top);
  S('rect', { x: 0, y: 0, width: 240, height: 96, rx: 12, fill: 'var(--surface)', stroke: 'var(--line-2)' }, mm2);
  T(mm2, 14, 22, 'CRIAÇÃO DE CRÉDITO', { style: 'font:600 9.5px var(--mono);letter-spacing:.08em;fill:var(--gold-ink)' });
  T(mm2, 14, 52, brl(m.cart), { style: 'font:700 17px var(--sans);fill:var(--ink)' });
  T(mm2, 14, 72, `com ${brl(m.pl)} de capital próprio`, { class: 'lbl' });
  T(mm2, 14, 87, `RWA ${brl(m.rwa)} · densidade ${pct(m.rwaD, 0)}`, { class: 'lbl' });

  /* templo (banco) */
  const bank = S('g', { filter: 'url(#fSh)' }, svg);
  S('rect', { x: 414, y: 480, width: 372, height: 16, rx: 3, fill: 'url(#gStone)', stroke: 'var(--line-2)' }, bank);
  S('rect', { x: 430, y: 466, width: 340, height: 16, rx: 3, fill: 'url(#gStone)', stroke: 'var(--line-2)' }, bank);
  S('rect', { x: 446, y: 450, width: 308, height: 18, rx: 3, fill: 'url(#gStone)', stroke: 'var(--line-2)' }, bank);
  for (let i = 0; i < 6; i++) { const x = 470 + i * 47; S('rect', { x, y: 326, width: 24, height: 124, rx: 3, fill: 'url(#gCol)', stroke: 'var(--line-2)' }, bank); S('rect', { x: x - 4, y: 320, width: 32, height: 8, rx: 2, fill: 'var(--surface)', stroke: 'var(--line-2)' }, bank); }
  S('rect', { x: 452, y: 296, width: 296, height: 26, rx: 3, fill: 'var(--surface)', stroke: 'var(--line-2)' }, bank);
  S('path', { d: `M440,298 L600,250 L760,298 Z`, fill: 'url(#gStone)', stroke: 'var(--line-2)', 'stroke-linejoin': 'round' }, bank);
  const short = n.name.length > 30 ? n.name.slice(0, 29) + '…' : n.name;
  T(svg, 600, 314, short.toUpperCase(), { 'text-anchor': 'middle', style: 'font:700 10.5px var(--mono);letter-spacing:.12em;fill:var(--ink)' });
  // cofres dentro
  const vault = (x, lab, val, col) => { const g = S('g', {}, svg); S('rect', { x, y: 352, width: 120, height: 76, rx: 9, fill: 'var(--surface)', stroke: col, 'stroke-width': 1.5, opacity: .96 }, g); T(g, x + 60, 372, lab, { 'text-anchor': 'middle', style: 'font:600 9.5px var(--mono);letter-spacing:.06em;fill:var(--ink-3)' }); T(g, x + 60, 396, val, { 'text-anchor': 'middle', style: 'font:700 15px var(--sans);fill:var(--ink)' }); return g; };
  const v1 = vault(476, 'LIQUIDEZ', brl(m.liq), 'var(--s1)'); T(v1, 536, 414, pct(m.liqA, 0) + ' do ativo', { 'text-anchor': 'middle', class: 'lbl' });
  const v2 = vault(604, 'CAPITAL (PL)', brl(m.pl), 'var(--gold)'); T(v2, 664, 414, 'PR ' + brl(m.pr), { 'text-anchor': 'middle', class: 'lbl' });
  bindTip(v1, () => `<b>Liquidez</b><hr>${ttRow('Disponibilidades', brl(m.disp))}${ttRow('Aplicações interfinanceiras', brl(m.aplic))}${ttRow('TVM', brl(m.tvm))}${m.cent ? ttRow('Centralização financeira (na central)', brl(m.cent)) : ''}`);
  bindTip(v2, () => `<b>Capital</b><hr>${ttRow('Patrimônio líquido', brl(m.pl))}${ttRow('Patrimônio de referência', brl(m.pr))}${ttRow('Capital principal', brl(m.cp))}${ttRow('Basileia', pct(m.ib))}`);
  T(svg, 600, 512, 'Ativo total ' + brl(m.at), { 'text-anchor': 'middle', style: 'font:700 12.5px var(--sans);fill:var(--ink-2)' });

  /* travessão + pratos (dinâmicos) */
  const beamG = S('g', {}, svg);
  S('rect', { x: PX - 9, y: PY - 2, width: 18, height: 22, rx: 4, fill: 'url(#gBeam)' }, svg);
  const beam = S('rect', { x: PX - BL - 8, y: PY - 6, width: 2 * BL + 16, height: 12, rx: 6, fill: 'url(#gBeam)', stroke: '#7C5A12', 'stroke-width': .8 }, beamG);
  S('circle', { cx: PX, cy: PY, r: 11, fill: 'url(#gMed)', stroke: '#7C5A12' }, svg);
  const mkPan = (parts, side, total) => {
    const g = S('g', {}, svg);
    const hook = S('circle', { r: 6, fill: 'none', stroke: '#9C7421', 'stroke-width': 2.4 }, g);
    const s1 = S('line', { stroke: '#9C7421', 'stroke-width': 1.6 }, g), s2 = S('line', { stroke: '#9C7421', 'stroke-width': 1.6 }, g);
    const yoke = S('rect', { width: 250, height: 6, rx: 3, fill: 'url(#gBeam)' }, g);
    const v1l = S('line', { stroke: '#9C7421', 'stroke-width': 1.3, 'stroke-dasharray': '1 3' }, g), v2l = S('line', { stroke: '#9C7421', 'stroke-width': 1.3, 'stroke-dasharray': '1 3' }, g);
    const tray = S('path', { fill: 'url(#gBeam)', stroke: '#7C5A12', 'stroke-width': .8 }, g);
    const stack = S('g', {}, g);
    const maxH = 168, minH = 16, tot = total || 1;
    let hs = parts.map(p => Math.max(minH, p.value / tot * maxH));
    const sc = Math.min(1, maxH / sum(hs)); hs = hs.map(h => h * sc);
    let yy = 0;
    const blocks = parts.map((p, i) => {
      const h = hs[i]; const bg = S('g', { class: 'blk' }, stack);
      const r = S('rect', { x: -112, y: -(yy + h), width: 224, height: h - 2, rx: 5, fill: p.color, stroke: 'rgba(0,0,0,.12)' }, bg);
      const dark = i <= 2;
      if (h >= 17) {
        T(bg, -102, -(yy + h / 2) + 4, p.label.length > 26 ? p.label.slice(0, 25) + '…' : p.label, { style: `font:600 10.5px var(--sans);fill:${dark ? '#fff' : '#14183A'}` });
        T(bg, 102, -(yy + h / 2) + 4, pct(p.value / tot, 0), { 'text-anchor': 'end', style: `font:700 10.5px var(--sans);fill:${dark ? '#fff' : '#14183A'}` });
      }
      bindTip(bg, () => `<b>${esc(p.label)}</b><hr>${ttRow('Saldo', brl(p.value), p.color)}${ttRow('Participação', pct(p.value / tot))}<hr><span style="opacity:.8">Clique para abrir ${side < 0 ? 'ALM & liquidez' : 'Risco de crédito'}</span>`);
      bg.addEventListener('click', () => go(side < 0 ? 'alm' : 'credito'));
      if (!STILL) { bg.style.opacity = 0; bg.style.transition = `opacity .5s ease ${300 + i * 120}ms`; setTimeout(() => { bg.style.opacity = 1; }, 30); }
      yy += h; return r;
    });
    const title = S('g', {}, g);
    const tl = T(title, 0, 0, side < 0 ? 'POUPADORES & INVESTIDORES' : 'TOMADORES DE CRÉDITO', { 'text-anchor': 'middle', style: 'font:700 10px var(--mono);letter-spacing:.1em;fill:var(--gold-ink)' });
    const tv = T(title, 0, 20, (side < 0 ? 'Captações ' : 'Carteira ') + brl(total), { 'text-anchor': 'middle', style: 'font:700 16px var(--sans);fill:var(--ink)' });
    return { g, hook, s1, s2, yoke, v1l, v2l, tray, stack, title, stackH: yy };
  };
  const L = mkPan(fund, -1, capt), R = mkPan(cred, 1, cart);
  const place = (P, ex, ey) => {
    P.hook.setAttribute('cx', ex); P.hook.setAttribute('cy', ey + 6);
    const yk = ey + 46;
    P.s1.setAttribute('x1', ex); P.s1.setAttribute('y1', ey + 12); P.s1.setAttribute('x2', ex - 118); P.s1.setAttribute('y2', yk);
    P.s2.setAttribute('x1', ex); P.s2.setAttribute('y1', ey + 12); P.s2.setAttribute('x2', ex + 118); P.s2.setAttribute('y2', yk);
    P.yoke.setAttribute('x', ex - 125); P.yoke.setAttribute('y', yk - 3);
    const ty = yk + 200;
    P.v1l.setAttribute('x1', ex - 120); P.v1l.setAttribute('x2', ex - 120); P.v1l.setAttribute('y1', yk); P.v1l.setAttribute('y2', ty);
    P.v2l.setAttribute('x1', ex + 120); P.v2l.setAttribute('x2', ex + 120); P.v2l.setAttribute('y1', yk); P.v2l.setAttribute('y2', ty);
    P.tray.setAttribute('d', `M${ex - 132},${ty} L${ex + 132},${ty} L${ex + 112},${ty + 14} Q${ex},${ty + 22} ${ex - 112},${ty + 14} Z`);
    P.stack.setAttribute('transform', `translate(${ex},${ty - 1})`);
    P.title.setAttribute('transform', `translate(${ex},${ty + 44})`);
    return { ex, ey, yk, ty };
  };
  /* pessoas (poupadores / tomadores) */
  const people = (cx, cy, col, label) => {
    const g = S('g', {}, svg);
    [[-26, 8, .8], [0, 0, 1], [26, 8, .8]].forEach(([dx, dy, s]) => { S('circle', { cx: cx + dx, cy: cy + dy - 22 * s, r: 9 * s, fill: col }, g); S('path', { d: `M${cx + dx - 15 * s},${cy + dy + 12 * s} Q${cx + dx},${cy + dy - 14 * s} ${cx + dx + 15 * s},${cy + dy + 12 * s} Z`, fill: col }, g); });
    T(g, cx, cy + 36, label, { 'text-anchor': 'middle', class: 'lbl', style: 'font-weight:600;fill:var(--ink-2)' });
    return g;
  };
  people(70, 600, 'var(--s1)', isCoop(n) ? 'associados poupadores' : 'depositantes e investidores');
  people(1130, 600, 'var(--gold)', ok(m.cli) && m.cli ? int(m.cli) + ' tomadores' : 'tomadores');

  /* spread (base) */
  const sp = S('g', { transform: 'translate(0,0)' }, svg);
  const bx = 330, bw = 540, by = 600;
  T(sp, 600, 566, 'SPREAD DA CARTEIRA · ' + (ok(sd.spread) ? pp(sd.spread) : '—'), { 'text-anchor': 'middle', style: 'font:700 11px var(--mono);letter-spacing:.1em;fill:var(--gold-ink)' });
  T(sp, 600, 584, `taxa implícita ${pct(sd.y)} a.a. − custo de captação ${pct(sd.c)} a.a. · barra: para onde vão os juros`, { 'text-anchor': 'middle', class: 'lbl', style: 'font-size:11.5px' });
  const segs = [
    { l: 'Custo de captação', v: sd.cA, c: 'var(--neg)' }, { l: 'Perda esperada', v: sd.cor, c: 'var(--neg-2)' },
    { l: 'Despesas adm.', v: sd.adm, c: 'var(--neg-3)' }, { l: 'Tributos', v: sd.trib, c: 'var(--neg-4)' }, { l: 'Margem', v: sd.margin, c: 'var(--pos)' }];
  const posTot = sum(segs.map(s => Math.max(0, s.v || 0)));
  let x = bx;
  segs.forEach((s, i) => {
    const w = posTot ? Math.max(0, s.v || 0) / posTot * bw : 0; if (w <= 0) return;
    const r = S('rect', { x: x + 1, y: by, width: Math.max(1, w - 2), height: 26, rx: 4, fill: s.c, class: 'grow-x' }, sp);
    r.style.transitionDelay = (500 + i * 120) + 'ms';
    bindTip(r, () => `<b>${s.l}</b><hr>${ttRow('% a.a. sobre a carteira', pct(s.v, 2), s.c)}${ttRow('Parcela da taxa', pct(s.v / sd.y, 0))}`);
    if (w > 58) T(sp, x + w / 2, by + 17, pct(s.v, 1), { 'text-anchor': 'middle', style: 'font:700 11px var(--sans);fill:#fff;pointer-events:none' });
    T(sp, x + w / 2, by + 44, w > 70 ? s.l : '', { 'text-anchor': 'middle', class: 'lbl' });
    x += w;
  });
  if (sd.margin < 0) T(sp, 600, by + 64, `margem negativa: ${pct(sd.margin, 1)} a.a.`, { 'text-anchor': 'middle', style: 'font:600 11px var(--sans);fill:var(--crit-ink)' });
  requestAnimationFrame(() => requestAnimationFrame(() => sp.classList.add('in')));

  /* partículas (fluxo de recursos e de juros) */
  const pg = S('g', {}, svg);
  const NB = 16, NG = 12, parts = [];
  for (let i = 0; i < NB; i++) parts.push({ k: 'b', t: i / NB, c: S('circle', { r: 4.2, fill: 'var(--s1)', stroke: 'var(--surface)', 'stroke-width': 1.2 }, pg) });
  const shareSaver = clamp(div(sd.c, sd.y), 0.1, 0.9);
  for (let i = 0; i < NG; i++) parts.push({ k: i / NG < shareSaver ? 'gs' : 'gb', t: i / NG, c: S('circle', { r: 3.8, fill: '#E2B84E', stroke: '#7C5A12', 'stroke-width': 1 }, pg) });
  const t0 = performance.now() - (STILL ? 1e4 : 0);   // no re-render no lugar a balança já começa na inclinação final
  let geo = null;
  const polyAt = (pts, t) => {
    let L = 0; const seg = []; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); L += l; }
    let d = t * L; for (let i = 0; i < seg.length; i++) { if (d <= seg[i]) { const f = d / seg[i]; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f]; } d -= seg[i]; }
    return pts[pts.length - 1];
  };
  const frame = now => {
    const tt = (now - t0) / 1000;
    const th = RM ? thetaT : thetaT * (1 - Math.exp(-2.2 * tt) * Math.cos(4.6 * tt));
    const rad = th * Math.PI / 180;
    beamG.setAttribute('transform', `rotate(${th} ${PX} ${PY})`);
    const lx = PX - BL * Math.cos(rad), ly = PY - BL * Math.sin(rad), rx = PX + BL * Math.cos(rad), ry = PY + BL * Math.sin(rad);
    const gl = place(L, lx, ly), gr = place(R, rx, ry);
    geo = { gl, gr };
    const leftIn = [[95, 560], [lx - 60, gl.ty - 20], [lx, gl.yk], [lx, ly], [PX, PY]];
    const rightOut = [[PX, PY], [rx, ry], [rx, gr.yk], [rx + 60, gr.ty - 20], [1105, 560]];
    const back = rightOut.slice().reverse();
    const toSaver = leftIn.slice().reverse();
    const toBase = [[PX, PY], [PX, 330], [PX, 470], [PX, by - 4]];
    if (!RM) for (const p of parts) {
      p.t = (p.t + (p.k === 'b' ? 0.0026 : 0.0021)) % 1;
      let pt;
      if (p.k === 'b') pt = p.t < 0.5 ? polyAt(leftIn, p.t * 2) : polyAt(rightOut, (p.t - .5) * 2);
      else pt = p.t < 0.5 ? polyAt(back, p.t * 2) : polyAt(p.k === 'gs' ? toSaver : toBase, (p.t - .5) * 2);
      p.c.setAttribute('cx', pt[0]); p.c.setAttribute('cy', pt[1]);
      p.c.setAttribute('opacity', (p.t < .04 || p.t > .96) ? 0 : (p.k !== 'b' && p.t > .5 && p.k === 'gb' && p.t > .93) ? 0 : 0.95);
    } else parts.forEach(p => p.c.setAttribute('opacity', 0));
    if (!RM && document.body.contains(svg)) ANIM = requestAnimationFrame(frame);
  };
  ANIM = requestAnimationFrame(frame);
  if (RM) frame(performance.now() + 10000);
  const lgd = el('div', 'scale-legend', `<span><i style="background:var(--s1)"></i>recursos captados → crédito concedido</span><span><i style="background:#E2B84E"></i>juros pagos pelos tomadores → remuneração dos poupadores e spread retido</span><span><b>Inclinação:</b> crédito/captações = ${pct(ratio, 0)} ${ratio > 1 ? '(prato do crédito mais pesado)' : '(prato do funding mais pesado)'}</span>`);
  host.appendChild(lgd);
}

/* ---------------- resumo executivo ---------------- */
function execBullets(n, m) {
  const P = peerSet(n), B = [];
  const rank = (k, dir = 1) => { const a = P[k].slice().sort((x, y) => dir * (y - x)); const r = a.findIndex(x => dir > 0 ? x <= m[k] : x >= m[k]); return r < 0 ? a.length : r + 1; };
  if (n.kind === 'coop' || n.kind === 'bank') B.push(['n', `<b>Porte:</b> ${brl(m.at)} em ativos — ${rank('at')}º maior entre ${P.at.length} ${peerLbl(n)}; carteira de ${brl(m.cart)} e ${int(m.cli)} clientes com operações ativas.`]);
  else B.push(['n', `<b>Porte:</b> ${n.members.length} instituições somando ${brl(m.at)} em ativos, ${brl(m.cart)} em crédito e ${brl(m.capt)} em captações.`]);
  const sIb = status('ib', m.ib, m.capMin); const med = peerMed(n, 'ib');
  B.push([sIb === 'good' ? 'g' : sIb === 'warn' ? 'w' : 'c', `<b>Capital:</b> Basileia de ${pct(m.ib)} (mediana dos pares ${pct(med)}); folga de ${brl(m.buf)} sobre ${capMinTxt(m)} — permitiria ${brl(m.buf / m.capMin / Math.max(.3, m.rwaD))} adicionais de ativos com a densidade atual de RWA${m.cap.below ? `; ${m.cap.below} ${m.cap.below > 1 ? 'instituições estão' : 'instituição está'} abaixo do próprio mínimo` : ''}.`]);
  const sIn = status('inadR', m.inadR);
  const tr = m.q.inad[NQ - 1] - m.q.inad[1];
  B.push([sIn === 'good' ? 'g' : sIn === 'warn' ? 'w' : 'c', `<b>Crédito:</b> inadimplência (90d, SCR) de ${pct(m.inadR)} ${tr > 0.002 ? `subindo ${pp(tr)} em 12 meses` : tr < -0.002 ? `caindo ${pp(-tr)} em 12 meses` : 'estável em 12 meses'}; ativos problemáticos ${pct(m.probR)}${ok(m.pbR) ? `, problema de recuperação em ${pct(m.pbR)} dos ativos financeiros (estágio 3 + simplificada)` : ''} e cobertura de ${pct(m.cob, 0)}.`]);
  const sRoe = status('roe', m.roe);
  B.push([sRoe === 'good' ? 'g' : sRoe === 'warn' ? 'w' : 'c', `<b>Resultado:</b> ${lucroLbl(n).toLowerCase()} de ${brl(m.ll)} em 12 meses; ROE ${pct(m.roe)} e ROA ${pct(m.roa, 2)}; margem financeira (NIM) de ${pct(m.nim)} do ativo e eficiência de ${pct(m.eff, 0)}.`]);
  const sL = status('ltdC', m.ltdC);
  B.push([sL === 'good' ? 'g' : sL === 'warn' ? 'w' : 'c', `<b>Funding e liquidez:</b> crédito equivale a ${pct(m.ltdC, 0)} das captações (${pct(m.ltd, 0)} dos depósitos); ativos líquidos somam ${pct(m.liqA, 0)} do ativo; depósitos são ${pct(m.depShare, 0)} do funding.`]);
  if (ok(m.irrbbPR)) { const s = status('irrbbPR', m.irrbbPR); B.push([s === 'good' ? 'g' : s === 'warn' ? 'w' : 'c', `<b>Taxa de juros (IRRBB):</b> capital alocado de ${brl(m.irrbb)}, ${pct(m.irrbbPR)} do PR; carteira prefixada responde por ${pct(div(m.r.ix[XI.pre], m.r.ix[XI.tot]), 0)} do crédito.`]); }
  B.push([m.gCrb > 0.15 ? 'w' : 'n', `<b>Crescimento 12m:</b> carteira ${pct(m.gCrb, 1, true)}, captações ${pct(m.gCapt, 1, true)}, PL ${pct(m.gPl, 1, true)}.`]);
  return B;
}
function pctlRows(n, m) {
  const R = [['Índice de Basileia', 'ib', 1, pct], ['Inadimplência', 'inadR', -1, pct], ['Problema de recuperação', 'pbR', -1, pct], ['ROE', 'roe', 1, pct], ['NIM', 'nim', 1, pct], ['Eficiência', 'eff', -1, x => pct(x, 0)], ['Ativos líquidos', 'liqA', 1, x => pct(x, 0)], ['Crédito / captações', 'ltdC', -1, x => pct(x, 0)], ['Custo de captação', 'cof', -1, pct]];
  return R.map(([l, k, d, f]) => { let p = pctile(n, k, m[k]); if (d < 0 && ok(p)) p = 1 - p; return `<div class="r"><span>${l}</span><div class="bar"><b></b><i style="left:${ok(p) ? (p * 100).toFixed(1) : 50}%"></i></div><span class="v">${f(m[k])}</span></div>`; }).join('');
}

VIEWS.balanca = (V, n) => {
  const m = metrics(n);
  head(V, 'Visão executiva · ' + (n.grp === 'bank' ? 'Bancos' : 'Cooperativismo financeiro'), esc(nameOf(n)),
    `A intermediação em uma balança: à esquerda quem poupa e investe, à direita quem toma crédito, no centro a instituição. Acima, o <b>multiplicador</b> (quanto ativo e crédito cada real de capital sustenta); abaixo, o <b>spread</b> que remunera risco, custo e capital. Data-base ${mlab(D.Q[QI])} · ${n.members.length > 1 ? n.members.length + ' instituições somadas' : (n.ent.nf || '')}.`);
  const K = el('div', 'kpis'); V.appendChild(K);
  const h = k => m.H(k);
  kpi(K, { l: 'Ativo total', v: { n: m.at, f: 'brl' }, d: delta(m.gAt) + ' 12m', sk: spark(h('at'), 'var(--s1)') });
  kpi(K, { l: 'Carteira de crédito', v: { n: m.cart, f: 'brl' }, d: delta(m.gCrb) + ' 12m', sk: spark(h('crb'), 'var(--gold)') });
  kpi(K, { l: 'Captações', v: { n: m.capt, f: 'brl' }, d: delta(m.gCapt) + ' 12m', sk: spark(h('capt'), 'var(--s1)') });
  kpi(K, { l: 'Patrimônio líquido', v: { n: m.pl, f: 'brl' }, d: delta(m.gPl) + ' 12m', sk: spark(h('pl'), 'var(--s3)') });
  kpi(K, { l: lucroK(n) + ' 12 meses', v: { n: m.ll, f: 'brl' }, d: 'ROE ' + pct(m.roe) + ' ' + stChip('roe', m.roe, ' '), sk: spark(m.q.roe, 'var(--s3)'), fx: 'roe' });
  kpi(K, { l: 'Índice de Basileia', v: { n: m.ib, f: 'pct' }, d: stChip('ib', m.ib, null, m.capMin), sk: spark(m.q.ib, 'var(--s7)'), fx: 'ib', cls: 'accent' });
  kpi(K, { l: 'Atraso > 90 dias (SCR)', v: { n: m.inadR, f: 'pct2' }, d: stChip('inadR', m.inadR), sk: spark(m.q.inad, 'var(--s8)'), fx: 'inad' });
  kpi(K, { l: 'Problema de recuperação', v: ok(m.pbR) ? { n: m.pbR, f: 'pct' } : '—', d: stChip('pbR', m.pbR) + ' estágio 3 + simplificada', fx: 'stages' });
  kpi(K, { l: 'NIM (margem/ativo)', v: { n: m.nim, f: 'pct' }, d: 'spread ' + pp(m.spread), sk: spark(m.q.nim, 'var(--s2)'), fx: 'nim' });
  const rt = ratingOf(n);
  kpi(K, { l: 'Rating Radar', v: `<span style="font-family:var(--serif);font-weight:700">${rt.cls}</span>`, d: `score ${int(rt.score)}/100 · <a href="#v=rating" style="color:var(--gold-ink)">detalhes</a>`, fx: 'rating' });

  const G = grid(V); G.classList.add('mt');
  const sc = card(G, { cls: 'c12 hero', title: 'Balança da intermediação financeira', sub: 'Funding × crédito, multiplicador do capital e decomposição do spread — passe o mouse nos blocos; clique para aprofundar', src: [['IF.data ' + mlab(D.Q[QI]), 'r'], ['SGS', '']], fx: 'balanca' });
  drawScale(sc.b, n, m);

  const ex = card(G, { cls: 'c7', title: 'Diagnóstico executivo', sub: 'Leitura automática dos indicadores frente aos pares' });
  ex.b.innerHTML = `<ul class="bul">${execBullets(n, m).map(([k, t]) => `<li><span class="ic ${k}">${k === 'g' ? '✓' : k === 'w' ? '!' : k === 'c' ? '×' : '•'}</span><span>${t}</span></li>`).join('')}</ul>`;
  const pc = card(G, { cls: 'c5', title: 'Posição relativa', sub: `Percentil entre ${peerSet(n).n} ${peerLbl(n)} — à direita é melhor` });
  pc.b.innerHTML = `<div class="pctl">${pctlRows(n, m)}</div><p class="note">Marcador central = mediana dos pares. Para sistemas e grupos, o valor agregado é posicionado na distribuição das singulares.</p>`;

  const c1 = card(G, { cls: 'c4', title: 'Basileia trimestral', sub: 'PR ÷ RWA', fx: 'ib' }); lineChart(chartEl(c1.b, 170), { cats: qcats(), series: [{ name: 'Basileia', color: 'var(--s1)', values: m.q.ib, area: true }], refs: capRef(m), h: 170 });
  const c2 = card(G, { cls: 'c4', title: 'Inadimplência e ativos problemáticos', sub: 'SCR · % da carteira', fx: 'inad' }); lineChart(chartEl(c2.b, 170), { cats: qcats(), series: [{ name: 'Inadimplência', color: 'var(--s8)', values: m.q.inad }, { name: 'Problemáticos', color: 'var(--s2)', values: m.q.prob }], h: 170, fmt: x => pct(x, 1) });
  const c3 = card(G, { cls: 'c4', title: 'Rentabilidade trimestral anualizada', sub: 'ROE e NIM', fx: 'roe' }); lineChart(chartEl(c3.b, 170), { cats: qcats(), series: [{ name: 'ROE', color: 'var(--s1)', values: m.q.roe }, { name: 'NIM', color: 'var(--s2)', values: m.q.nim }], h: 170 });

  if (m.r.m && m.r.m[0].length >= 3) {
    const mo = card(G, { cls: 'c8', title: 'Evolução mensal do balanço', sub: `Balancete ${n.grp === 'bank' ? '4060 (conglomerado prudencial)' : '4010'} · ${mlab(D.M[0])} a ${mlab(D.Q[QI])}`, src: [[n.grp === 'bank' ? 'Doc 4060' : 'Doc 4010', 'r']] });
    const mm = k => m.r.m[MI[k]];
    lineChart(chartEl(mo.b, 230), { cats: mcats(), series: [{ name: 'Ativo', color: 'var(--s1)', values: mm('at') }, { name: 'Crédito', color: 'var(--gold)', values: mm('cr') }, { name: 'Depósitos', color: 'var(--s7)', values: mm('dp') }, { name: 'PL', color: 'var(--s5)', values: mm('pl') }], fmt: brl, h: 230 });
    const mr = card(G, { cls: 'c4', title: lucroLbl(n) + ' mensal', sub: 'Variação mensal das contas de resultado (7 + 8)', src: [[n.grp === 'bank' ? '4060' : '4010', 'r']] });
    const rs = mm('rs');
    barChart(chartEl(mr.b, 230), { cats: mcats(), series: [{ name: 'Resultado do mês', values: rs, colors: rs.map(v => v >= 0 ? 'var(--s3)' : 'var(--s8)') }], fmt: brl, h: 230 });
    mr.b.appendChild(el('p', 'note', 'Junho e dezembro concentram encargos de fechamento do semestre (tributos, participações e destinações), o que pode tornar o mês negativo.'));
  }
};

/* ---------------- Balancete ---------------- */
const ACC = D.ACC;
const PLEN = [0, 1, 2, 3, 5, 7];
function balRows(n, srcKey) {
  let mp = null, label = '';
  const S_ = n.kind === 'system' ? SYSD.get(n.sys) : null;
  if (srcKey === 'comb' && S_ && S_.BC) { mp = S_._bc || (S_._bc = bcMap(S_.BC)); label = 'Balancete combinado oficial · doc ' + S_.doc; }
  else { mp = aggregate(n).BC; label = n.members.length > 1 ? `Soma de ${n.members.length} balancetes ${n.grp === 'bank' ? '4060' : '4010'}` : (n.grp === 'bank' ? 'Balancete 4060 · conglomerado prudencial' : 'Balancete 4010 · instituição individual'); }
  const qc = QI >= 4 ? QI - 4 : (QI >= 1 ? QI - 1 : -1);
  const map = new Map();
  for (const [k, arr] of mp) { const a = arr[QI] || 0, b = qc >= 0 ? (arr[qc] || 0) : 0; if (a || b) map.set(k, [a, b]); }
  return { map, label, qc };
}
VIEWS.balancete = (V, n) => {
  const m = metrics(n);
  const hasComb = n.kind === 'system' && SYSD.get(n.sys) && SYSD.get(n.sys).BC;
  const ui = ST.ui.bal || (ST.ui.bal = { src: 'comb', depth: 3, q: '', open: null });
  const srcKey = hasComb ? ui.src : 'soma';
  head(V, 'Demonstrações · Balancete patrimonial', 'Balancete COSIF — ' + esc(srcKey === 'comb' ? 'Sistema ' + n.name + ' (combinado oficial)' : nameOf(n)),
    `Saldos por conta do plano COSIF (níveis 1 a 4) na data-base ${mlab(D.Q[QI])}, com análise vertical (AV) e horizontal (AH) contra a data de comparação. Contas de resultado (grupos 7 e 8) acumuladas no semestre.`);
  const { map, label, qc } = balRows(n, srcKey);
  const qcL = qc >= 0 ? mlab(D.Q[qc]) : '—', ahL = qc === QI - 4 ? 'AH 12m' : 'AH trim.';
  if (!map.size) { V.appendChild(el('p', 'note', 'Balancete não disponível para esta seleção.')); return; }
  const val = (code, j = 0) => { const i = ACC.findIndex(a => a[0] === code); const r = i >= 0 ? map.get(i) : null; return r ? r[j] : 0; };
  const A = val('1000000009') + val('2000000008'), A0 = val('1000000009', 1) + val('2000000008', 1);
  const PEX = val('4000000006'), PL = val('6000000004'), RC = val('7000000003'), RD = val('8000000002');
  const K = el('div', 'kpis'); V.appendChild(K);
  kpi(K, { l: 'Ativo (1 + 2)', v: { n: A, f: 'brl' }, d: delta(div(A, A0) - 1) + ' vs ' + qcL, fx: 'at' });
  kpi(K, { l: 'Passivo exigível (4)', v: { n: PEX, f: 'brl' }, d: pct(div(PEX, A), 0) + ' do ativo' });
  kpi(K, { l: 'Patrimônio líquido (6)', v: { n: PL, f: 'brl' }, d: pct(div(PL, A), 1) + ' do ativo' });
  kpi(K, { l: 'Resultado do semestre (7 + 8)', v: { n: RC + RD, f: 'brl' }, d: 'receitas ' + brl(RC) });
  const gap = A - (PEX + PL + RC + RD);
  kpi(K, { l: 'Equação patrimonial', v: Math.abs(gap) <= Math.max(5, A * 1e-6) ? '<span style="color:var(--good-ink)">✓ fecha</span>' : brl(gap), d: 'Ativo = Passivo + PL + Resultado', cls: 'accent' });

  const G = grid(V); G.classList.add('mt');
  const vis = card(G, { cls: 'c5', title: 'Balanço visual', sub: 'Composição do ativo e do passivo + PL (nível 2)', src: [[label.split('·')[0].trim(), 'r']] });
  const lvl2 = g => ACC.map((a, i) => [a, i]).filter(([a, i]) => a[2] === 2 && g.includes(a[0][0]) && map.has(i)).map(([a, i]) => ({ label: a[1], value: map.get(i)[0] }));
  const at2 = lvl2(['1', '2']).filter(x => x.value > 0).sort((a, b) => b.value - a.value);
  const ps2 = lvl2(['4', '6']).filter(x => x.value > 0).sort((a, b) => b.value - a.value);
  if (RC + RD) ps2.push({ label: 'Resultado do semestre', value: RC + RD });
  const pal = ['var(--s1)', 'var(--s3)', 'var(--s4)', 'var(--s2)', 'var(--s7)', 'var(--s5)', 'var(--s8)', '#8A8F9C'];
  const fold = (arr) => { const top = arr.slice(0, 7); const rest = arr.slice(7); if (rest.length) top.push({ label: 'Demais contas', value: sum(rest.map(x => x.value)) }); return top.map((x, i) => ({ ...x, color: pal[i] })); };
  const palB = ['#104281', '#2a78d6', '#5598e7', '#86b6ef', '#1baf7a', '#6250d6', '#e87ba4', '#8A8F9C'], palG = ['#7C5A12', '#9C7421', '#C49A3E', '#D9B45E', '#eb6834', '#e34948', '#6250d6', '#8A8F9C'];
  const fold2 = (arr, pal) => fold(arr).map((x, i) => ({ ...x, color: pal[i] }));
  stack100(chartEl(vis.b, 90), [{ label: 'Ativo', parts: fold2(at2, palB) }], { rh: 40, lw: 92 });
  stack100(chartEl(vis.b, 90), [{ label: 'Passivo + PL', parts: fold2(ps2, palG) }], { rh: 40, lw: 92 });
  vis.b.appendChild(el('p', 'note', 'Cada faixa é uma conta de nível 2 do COSIF. Passe o mouse para ver saldos; a soma das duas barras é igual (equação patrimonial).'));
  const res = card(G, { cls: 'c7', title: 'Maiores contas de resultado no semestre', sub: 'Receitas (7) e despesas (8) de nível 3 · 1º semestre de 2026' });
  const r3 = ACC.map((a, i) => [a, i]).filter(([a, i]) => a[2] === 3 && (a[0][0] === '7' || a[0][0] === '8') && map.has(i)).map(([a, i]) => ({ label: a[1].replace(/^\(-\)\s*/, ''), value: map.get(i)[0], color: a[0][0] === '7' ? 'var(--s1)' : 'var(--s8)' })).filter(x => x.value).sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, 10);
  hbars(chartEl(res.b, 270), r3, { lw: 250 });

  const tb = card(G, { cls: 'c12', title: 'Balancete analítico', sub: label + ' · valores em R$ mil agregados e formatados', src: [['COSIF', 'r']] });
  const bar = el('div', '', ''); bar.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px';
  if (hasComb) bar.appendChild(segCtl([['comb', 'Combinado oficial'], ['soma', 'Soma das singulares']], ui.src, k => { ui.src = k; render(false); }));
  bar.appendChild(segCtl([['2', 'Nível 2'], ['3', 'Nível 3'], ['4', 'Nível 4']], String(ui.depth), k => { ui.depth = +k; ui.open = null; paint(); }));
  const q = el('input', 'search'); q.type = 'search'; q.placeholder = 'Filtrar contas (ex.: depósitos, rural, 1630)'; q.value = ui.q; bar.appendChild(q);
  tb.b.appendChild(bar);
  const wrap = el('div', 'tblwrap'); tb.b.appendChild(wrap);
  const items = []; const stack = [];
  ACC.forEach((a, i) => {
    if (!map.has(i)) return;
    const [code, name, lv] = a; const pre = code.slice(0, PLEN[lv]);
    while (stack.length && (stack[stack.length - 1].lv >= lv || !pre.startsWith(stack[stack.length - 1].pre))) stack.pop();
    const it = { i, code, name, lv, pre, a: map.get(i)[0], b: map.get(i)[1], parent: stack.length ? stack[stack.length - 1] : null, kids: 0 };
    if (it.parent) it.parent.kids++;
    items.push(it); stack.push(it);
  });
  const base = it => { const g = it.code[0]; return g === '7' ? RC : g === '8' ? Math.abs(RD) : A; };
  const mx = Math.max(...items.filter(x => x.lv === 2).map(x => Math.abs(x.a)), 1);
  const paint = () => {
    ui.q = q.value; const qq = q.value.trim().toLowerCase();
    if (!ui.open) { ui.open = new Set(items.filter(x => x.lv < ui.depth - 0).map(x => x.code)); }
    const visible = it => { if (qq) return (it.name.toLowerCase().includes(qq) || it.code.startsWith(qq)) && it.lv <= 4; let p = it.parent; while (p) { if (!ui.open.has(p.code)) return false; p = p.parent; } return it.lv <= ui.depth; };
    let h = `<table class="tbl"><thead><tr><th>Conta</th><th style="text-align:left">Descrição</th><th>${mlab(D.Q[QI])}</th><th>AV</th><th>${qcL}</th><th>${ahL}</th><th style="width:120px"></th></tr></thead><tbody>`;
    let sec = '';
    for (const it of items) {
      if (!visible(it)) continue;
      const s = it.code[0] === '1' || it.code[0] === '2' ? 'ATIVO' : it.code[0] === '4' || it.code[0] === '6' ? 'PASSIVO E PATRIMÔNIO LÍQUIDO' : 'RESULTADO DO SEMESTRE (acumulado jan–jun)';
      if (s !== sec && !qq) { h += `<tr><td colspan="7" style="text-align:left;font:700 10px var(--mono);letter-spacing:.14em;color:var(--gold-ink);background:var(--surface);padding-top:14px">${s}</td></tr>`; sec = s; }
      const av = div(it.a, base(it)), ah = it.b ? div(it.a, it.b) - 1 : NaN;
      const w = Math.min(110, Math.abs(it.a) / mx * 110);
      h += `<tr class="bal-row lv${it.lv}${ui.open.has(it.code) ? ' open' : ''}" data-c="${it.code}"><td><span class="code">${it.code.slice(0, 1)}.${it.code.slice(1, 2)}.${it.code.slice(2, 3)}.${it.code.slice(3, 5)}.${it.code.slice(5, 7)}-${it.code.slice(9)}</span></td><td class="l"><span class="nm" style="padding-left:${(it.lv - 1) * 16}px">${it.kids && !qq ? `<span class="tg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6">${IC.chev}</svg></span>` : '<span style="width:16px;display:inline-block"></span>'}${esc(it.name)}</span></td><td class="${it.a < 0 ? 'neg' : ''}">${brl(it.a, { noR: true })}</td><td>${ok(av) ? pct(av, 1) : '—'}</td><td class="${it.b < 0 ? 'neg' : ''}">${brl(it.b, { noR: true })}</td><td>${ok(ah) && Math.abs(ah) < 50 ? `<span class="dl ${ah >= 0 ? 'up' : 'dn'}" style="font-weight:500">${pct(ah, 1, true)}</span>` : '—'}</td><td><span class="minibar" style="width:${w.toFixed(1)}px;background:${it.a < 0 || it.code[0] === '8' ? 'var(--s8)' : it.code[0] === '1' || it.code[0] === '2' ? 'var(--s1)' : 'var(--s3)'}"></span></td></tr>`;
    }
    h += '</tbody></table>';
    wrap.innerHTML = h;
  };
  wrap.addEventListener('click', e => { const tr = e.target.closest('.bal-row'); if (!tr || !e.target.closest('.tg')) return; const c = tr.dataset.c; ui.open.has(c) ? ui.open.delete(c) : ui.open.add(c); paint(); });
  q.addEventListener('input', paint);
  paint();
  tb.b.appendChild(el('p', 'note', 'Valores em reais (escala automática). Fonte: Banco Central, balancetes analíticos (documentos 4010 – instituições individuais; 4060 – conglomerados prudenciais; 4413/4423/4433 – combinados cooperativos). AV: participação no ativo total (grupos 1, 2, 4 e 6) ou no total de receitas/despesas do semestre (grupos 7 e 8). AH: variação contra o mesmo trimestre do ano anterior (ou contra o trimestre anterior quando não há 12 meses de histórico); contas de resultado comparam o acumulado do semestre nas duas datas.'));
};

/* ---------------- DRE ---------------- */
const DRE_ROWS = [
  ['h', 'Receitas da intermediação financeira'], ['rcre', 'Rendas de operações de crédito', 1], ['rtvm', 'Rendas de títulos e valores mobiliários', 1], ['rapl', 'Rendas de aplicações interfinanceiras de liquidez', 1], ['rarr', 'Rendas de arrendamento financeiro', 1], ['rocc', 'Rendas de outras operações com características de crédito', 1],
  ['h', 'Despesas da intermediação financeira'], ['dcp', 'Despesas de captações', 1], ['ddc', 'Despesas de instrumentos de dívida elegíveis a capital', 1], ['rder', 'Resultado com derivativos', 1], ['rout', 'Outros resultados de intermediação', 1],
  ['icoop', 'Ingressos de depósitos intercooperativos (centralização · 4010)', 1],
  ['=nii', 'Margem financeira antes da perda esperada (NII)'],
  ['pe', 'Resultado com perda esperada', 1], ['pecr', 'da qual: operações de crédito', 2],
  ['=rif', 'Resultado de intermediação financeira'],
  ['rpag', 'Resultado com transações de pagamento', 1], ['tar', 'Rendas de tarifas bancárias', 1], ['srv', 'Outras rendas de prestação de serviços', 1], ['pes', 'Despesas de pessoal', 1], ['adm', 'Despesas administrativas', 1], ['trib', 'Despesas tributárias', 1], ['peo', 'Perdas esperadas de outras operações', 1], ['part', 'Resultado de participações', 1], ['orec', 'Outras receitas', 1], ['icoopm', '(−) ingressos intercooperativos já contados na margem', 2], ['odes', 'Outras despesas', 1],
  ['=lair', 'Resultado antes da tributação e participações'], ['ir', 'Imposto de renda e contribuição social', 1], ['plr', 'Participações no lucro', 1],
  ['=ll', 'Lucro líquido / sobras'], ['jcp', 'Juros sobre o capital próprio de cooperativas', 1],
];
VIEWS.dre = (V, n) => {
  const m = metrics(n);
  head(V, 'Demonstrações · Resultado', 'DRE — ' + esc(nameOf(n)), `Demonstração do resultado no leiaute do IF.data (Res. CMN 4.966), por trimestre e em 12 meses (${winTxt()}). Em cooperativas, o resultado é chamado de <b>sobras</b>.`);
  dreCovNote(V, m);
  const L = m.L, rev = L.rcre + L.rtvm + L.rapl + L.rarr + L.rocc + Math.max(0, m.icoop);
  const IQa = m.r.IQ || [];
  const K = el('div', 'kpis'); V.appendChild(K);
  kpi(K, { l: 'Receitas de intermediação', v: { n: rev, f: 'brl' }, d: '12 meses · crédito = ' + pct(div(L.rcre, rev), 0) });
  kpi(K, { l: 'Margem financeira antes da PE (NII)', v: { n: m.nii, f: 'brl' }, d: '12 meses · NIM ' + pct(m.nim), fx: 'nim' });
  kpi(K, { l: 'Perda esperada', v: { n: -L.pe, f: 'brl' }, d: '12 meses · custo do risco ' + pct(m.cor), fx: 'cor' });
  kpi(K, { l: lucroK(n) + ' 12 meses', v: { n: m.ll, f: 'brl' }, d: 'ROE ' + pct(m.roe) + ' · ROA ' + pct(m.roa, 2), cls: 'accent', fx: 'roe' });
  kpi(K, { l: 'Índice de eficiência', v: { n: m.eff, f: 'pct' }, d: stChip('eff', m.eff), fx: 'eff' });
  kpi(K, { l: 'Cobertura por serviços', v: { n: m.feeCov, f: 'pct' }, d: 'tarifas ÷ pessoal e adm.', fx: 'feecov' });
  const G = grid(V); G.classList.add('mt');
  const wf = card(G, { cls: 'c12', title: 'Da receita ao resultado — 12 meses', sub: 'Cascata da DRE: o que cada linha soma ou consome até o ' + lucroLbl(n).toLowerCase(), src: [['IF.data · DRE', 'r']], fx: 'dre' });
  const outras = L.part + L.orec + L.odes + L.peo + L.rpag - m.icoop;
  waterfall(chartEl(wf.b, 320), [
    { label: 'Rendas de crédito', value: L.rcre, kind: 'start', color: 'var(--s1)' },
    { label: 'TVM e aplicações', value: L.rtvm + L.rapl },
    ...(m.icoop ? [{ label: 'Centralização financeira', value: m.icoop, color: 'var(--s3)', tip: ttRow('Fonte', 'balancete 4010 · conta 7.1.9.86 (os dispêndios 8.1.9.86 já estão nas despesas de captação)') }] : []),
    { label: 'Outras rendas e derivativos', value: L.rarr + L.rocc + L.rder + L.rout },
    { label: 'Despesas de captação', value: L.dcp + L.ddc },
    { label: 'Margem financeira antes da PE (NII)', value: m.nii, kind: 'total' },
    { label: 'Perda esperada', value: L.pe },
    { label: 'Tarifas e serviços', value: L.tar + L.srv },
    { label: 'Despesas de pessoal', value: L.pes },
    { label: 'Despesas administrativas', value: L.adm },
    { label: 'Tributárias', value: L.trib },
    { label: 'Outras (pagamentos, particip., diversas)', value: outras },
    { label: 'Resultado antes de IR', value: L.lair, kind: 'total' },
    { label: 'IR/CS e participações', value: L.ir + L.plr },
    { label: lucroLbl(n), value: L.ll, kind: 'total', color: 'var(--s3)' },
  ], { h: 340 });
  const tb = card(G, { cls: 'c8', title: 'Demonstração do resultado', sub: 'Semestres e 12 meses · AV sobre receitas de intermediação (12m)' });
  const cols = m.W.map(q => ['q' + q, qlab(D.Q[q])]).concat([['L', m.ann ? '12m*' : '12 meses']]);
  const getv = (k, c) => { const kk = k.replace('=', ''); if (c === 'L') return k === '=nii' ? m.L.rif - m.L.pe + m.icoop : k === 'icoop' ? m.icoop : k === 'icoopm' ? -m.icoop : m.L[kk]; const q = +c.slice(1); return k === '=nii' ? m.Qf('rif', q) - m.Qf('pe', q) + (IQa[q] || 0) : k === 'icoop' ? (IQa[q] || 0) : k === 'icoopm' ? -(IQa[q] || 0) : m.Qf(kk, q); };
  const yo = QI >= 4 ? QI - 4 : -1;
  const getYo = k => { if (yo < 0) return NaN; const kk = k.replace('=', ''); return k === '=nii' ? m.Qf('rif', yo) - m.Qf('pe', yo) + (IQa[yo] || 0) : k === 'icoop' ? (IQa[yo] || 0) : k === 'icoopm' ? -(IQa[yo] || 0) : m.Qf(kk, yo); };
  let h = `<div class="tblwrap" style="max-height:none"><table class="tbl"><thead><tr><th>Linha</th>${cols.map(c => `<th>${c[1]}</th>`).join('')}<th>AV</th><th>Δ ${qlab(D.Q[QI])} a/a</th></tr></thead><tbody>`;
  DRE_ROWS.forEach(r => {
    if ((r[0] === 'icoop' || r[0] === 'icoopm') && !m.icoop) return;
    if (r[0] === 'h') { h += `<tr><td colspan="${cols.length + 3}" style="text-align:left;font:700 10px var(--mono);letter-spacing:.12em;color:var(--gold-ink);padding-top:12px">${r[1].toUpperCase()}</td></tr>`; return; }
    const tot = r[0][0] === '=';
    const vals = cols.map(c => getv(r[0], c[0]));
    const lastQ = vals[vals.length - 2], yov = getYo(r[0]);
    const dlt = div(lastQ, yov) - 1;
    h += `<tr class="${tot ? 'tot' : ''}"><td class="l" style="padding-left:${(r[2] || 0) * 14 + 8}px">${r[0] === '=ll' ? lucroLbl(n) : r[1]}</td>${vals.map(v => `<td class="${v < 0 ? 'neg' : ''}">${brl(v, { noR: true })}</td>`).join('')}<td>${pct(div(vals[vals.length - 1], rev), 1)}</td><td>${ok(dlt) && Math.abs(dlt) < 20 && Math.sign(lastQ) === Math.sign(yov) ? `<span class="dl ${(dlt >= 0) === (lastQ >= 0) ? 'up' : 'dn'}" style="font-weight:500">${pct(dlt, 1, true)}</span>` : '—'}</td></tr>`;
  });
  tb.b.innerHTML = h + `</tbody></table></div><p class="note">Colunas trimestrais derivadas da DRE do IF.data (acumulada no semestre). 12 meses = soma dos quatro trimestres até a data-base${m.ann ? ` (*anualizado a partir de ${m.ann} trimestre${m.ann > 1 ? 's' : ''} disponíveis)` : ''}. Valores negativos são despesas.${m.icoop ? ' Nas cooperativas, a remuneração dos recursos aplicados na central (centralização financeira) aparece em "outras receitas" no IF.data; aqui ela foi trazida do balancete 4010 para a margem financeira — as demais linhas seguem o IF.data.' : ''}</p>`;
  const side = el('div', 'c4'); side.style.cssText = 'display:grid;gap:16px;align-content:start;min-width:0'; G.appendChild(side);
  const qd = card(side, { title: 'Resultado trimestral', sub: 'Fluxo de cada trimestre (derivado das posições semestrais)' });
  const H = k => m.H(k);
  barChart(chartEl(qd.b, 220), { cats: qcats(), series: [{ name: lucroK(n), values: H('ll'), color: 'var(--pos)' }, { name: 'Resultado de intermediação', values: H('rif'), color: 'var(--s1)' }], fmt: brl, h: 220 });
  const q2 = card(side, { title: 'Receita de crédito × custo de captação', sub: 'Por trimestre' });
  barChart(chartEl(q2.b, 200), { cats: qcats(), series: [{ name: 'Rendas de crédito', values: H('rcre'), color: 'var(--pos)' }, { name: 'Despesas de captação', values: H('dcp'), color: 'var(--neg)' }, { name: 'PE de crédito', values: H('pecr'), color: 'var(--neg-3)' }], fmt: brl, h: 200 });
};

/* ---------------- DFC (indireta, estimada) ---------------- */
function dfcCalc(n) {
  const r = aggregate(n), m = metrics(n);
  const q1 = QI, q0 = Math.max(0, QI - 4);
  if (q1 === q0) return null;
  const c = k => r.V[q1][FI[k]] || 0, p = k => r.V[q0][FI[k]] || 0, d = k => c(k) - p(k);
  const fl = k => range(q0 + 1, q1).reduce((s_, q) => s_ + m.Qf(k, q), 0);
  const LL = fl('ll'), PEx = -fl('pe');
  const cred = d('crl') + d('arr') + d('occ') + d('pag');
  const op = [
    ['Lucro líquido / sobras do período', LL, 'res'], ['Perda esperada (não caixa)', PEx, 'aj'],
    ['Carteira de crédito e operações assemelhadas', -(cred + PEx), 'at'], ['TVM e derivativos (ativo)', -(d('tvm') + d('dera')), 'at'],
    ['Outros ativos realizáveis', -d('oar'), 'at'], ['Depósitos', d('dep'), 'ps'], ['Captações no mercado aberto', d('comp'), 'ps'],
    ['Letras e outros instrumentos de dívida', d('oid'), 'ps'], ['Empréstimos e repasses', d('emr'), 'ps'], ['Derivativos (passivo) e outras obrigações', d('derp') + d('oob'), 'ps'],
  ];
  const inv = [['Ativo permanente (investimentos, imobilizado, intangível)', -d('perm'), 'inv']];
  const fin = [['Instrumentos de dívida elegíveis a capital', d('dcap'), 'fin'], ['Capital, distribuição de sobras/dividendos e ajustes no PL', d('pl') - LL, 'fin']];
  const cash0 = p('disp') + p('aplic'), cash1 = c('disp') + c('aplic');
  const fo = sum(op.map(x => x[1])), fi = sum(inv.map(x => x[1])), ff = sum(fin.map(x => x[1]));
  const resid = (cash1 - cash0) - (fo + fi + ff);
  return { op, inv, fin, fo, fi, ff, cash0, cash1, resid, q0, q1 };
}
VIEWS.dfc = (V, n) => {
  const m = metrics(n), F = dfcCalc(n);
  if (!F) { head(V, 'Demonstrações · Fluxo de caixa', 'DFC — ' + esc(nameOf(n)), 'A DFC estimada precisa de ao menos dois balanços: escolha uma data-base a partir de ' + mlab(D.Q[1]) + '.'); return; }
  const L0 = mlab(D.Q[F.q0]), L1 = mlab(D.Q[F.q1]), nMes = (F.q1 - F.q0) * 3;
  head(V, 'Demonstrações · Fluxo de caixa', 'DFC — ' + esc(nameOf(n)), `Demonstração dos fluxos de caixa <b>estimada pelo método indireto</b> a partir dos balanços de ${L0} e ${L1} (IF.data) e do resultado dos ${nMes} meses entre eles. Caixa e equivalentes = disponibilidades + aplicações interfinanceiras de liquidez.`);
  const K = el('div', 'kpis'); V.appendChild(K);
  kpi(K, { l: 'Caixa inicial · ' + L0, v: { n: F.cash0, f: 'brl' }, d: 'disponib. + aplic. interfin.', fx: 'dfc' });
  kpi(K, { l: 'Operacional', v: { n: F.fo, f: 'brl' }, d: F.fo >= 0 ? 'geração de caixa' : 'consumo de caixa' });
  kpi(K, { l: 'Investimento', v: { n: F.fi, f: 'brl' }, d: 'ativo permanente' });
  kpi(K, { l: 'Financiamento', v: { n: F.ff, f: 'brl' }, d: 'capital e dívida subordinada' });
  kpi(K, { l: 'Caixa final · ' + L1, v: { n: F.cash1, f: 'brl' }, d: delta(div(F.cash1, F.cash0) - 1) + ' em ' + nMes + ' meses', cls: 'accent', fx: 'dfc' });
  const G = grid(V); G.classList.add('mt');
  const wf = card(G, { cls: 'c12', title: `Ponte de caixa — ${L0} → ${L1}`, sub: 'Cada barra é uma origem (+) ou aplicação (−) de caixa no período', src: [['IF.data', 'r'], ['estimada', 'm']], fx: 'dfc' });
  const steps = [{ label: 'Caixa ' + L0, value: F.cash0, kind: 'start', color: 'var(--s5)' }]
    .concat(F.op.filter(x => Math.abs(x[1]) > 0).map(x => ({ label: x[0], value: x[1] })))
    .concat(F.inv.map(x => ({ label: x[0], value: x[1] })))
    .concat(F.fin.map(x => ({ label: x[0], value: x[1] })));
  if (Math.abs(F.resid) > Math.max(10, Math.abs(F.cash1) * 1e-4)) steps.push({ label: 'Diferenças de consolidação', value: F.resid });
  steps.push({ label: 'Caixa ' + L1, value: F.cash1, kind: 'total', color: 'var(--s1)' });
  waterfall(chartEl(wf.b, 360), steps, { h: 380 });
  const sk = card(G, { cls: 'c7', title: 'Origens e aplicações de recursos', sub: 'Fluxograma: de onde veio o caixa e para onde foi (alocação proporcional ilustrativa)' });
  const all = F.op.concat(F.inv, F.fin);
  const src = all.filter(x => x[1] > 0).map((x, i) => ({ label: x[0].replace(' do período', '').replace(' (não caixa)', ''), value: x[1], color: ['#1E8E3E', '#2E9B4F', '#45A863', '#61B07C', '#7DBE93', '#9ACCAB'][Math.min(i, 5)] }));
  const use = all.filter(x => x[1] < 0).map((x, i) => ({ label: x[0], value: -x[1], color: ['#C8372D', '#D2493F', '#DE6F63', '#E48A80', '#EBA096', '#F2BDB6'][Math.min(i, 5)] }));
  const dc = F.cash1 - F.cash0; if (dc > 0) use.push({ label: 'Aumento do caixa', value: dc, color: 'var(--s1)' }); else if (dc < 0) src.push({ label: 'Redução do caixa', value: -dc, color: 'var(--s1)' });
  sankey(chartEl(sk.b, 340), src.sort((a, b) => b.value - a.value), use.sort((a, b) => b.value - a.value), { h: 340, lw: 190, rw: 200 });
  const tb = card(G, { cls: 'c5', title: 'DFC — método indireto', sub: 'Estimativa a partir de variações patrimoniais' });
  const line = (x, cls) => `<tr class="${cls || ''}"><td class="l">${x[0]}</td><td class="${x[1] < 0 ? 'neg' : ''}">${brl(x[1], { noR: true })}</td></tr>`;
  tb.b.innerHTML = `<div class="tblwrap" style="max-height:none"><table class="tbl"><thead><tr><th>Atividade</th><th>${nMes} meses</th></tr></thead><tbody>
    ${F.op.map(x => line(x)).join('')}${line(['Caixa líquido das atividades operacionais', F.fo], 'tot')}
    ${F.inv.map(x => line(x)).join('')}${line(['Caixa líquido de investimento', F.fi], 'tot')}
    ${F.fin.map(x => line(x)).join('')}${line(['Caixa líquido de financiamento', F.ff], 'tot')}
    ${Math.abs(F.resid) > 0 ? line(['Diferenças de consolidação/arredondamento', F.resid]) : ''}
    ${line(['Variação de caixa e equivalentes', F.cash1 - F.cash0], 'tot')}</tbody></table></div>
    <p class="note">Estimativa analítica — não substitui a DFC publicada nas demonstrações financeiras. O ativo permanente é tomado pela variação líquida (depreciação incluída); "capital e ajustes no PL" = ΔPL − resultado, que capta integralizações, devoluções de cotas, distribuição de sobras/dividendos e ajustes de avaliação.</p>`;
};

/* ---------------- Spread ---------------- */
// unidade das taxas, compartilhada pelo Spread e pela DRE gerencial por segmento: ao mês (padrão) ou ao ano
const txMO = () => ST.ui.tx !== 'a';
const txCtl = lbl => filt((lbl || 'Unidade das taxas') + ' ' + infoBtn('taxam'), segCtl([['m', 'Taxa ao mês'], ['a', 'Taxa ao ano']], txMO() ? 'm' : 'a', k => { ST.ui.tx = k; render(false); }), 'sm');
VIEWS.spread = (V, n) => {
  const MO = txMO();
  const m = metrics(n), sd = spreadDecomp(m);
  const R = x => MO ? x / 12 : x;                                                   // taxas da DRE: média mensal realizada
  const RS = x => MO ? (ok(x) && x > -1 ? Math.pow(1 + x, 1 / 12) - 1 : NaN) : x;   // taxas de mercado: equivalência composta
  const UL = MO ? 'a.m.' : 'a.a.', PF = MO ? 'pct2' : 'pct', fr = x => pct(x, MO ? (x !== 0 && Math.abs(x) < 0.001 ? 3 : 2) : 1), fpp = x => pp(x, MO ? 2 : 1);
  head(V, 'Demonstrações · Spread', 'Spread — ' + esc(nameOf(n)), `Taxa implícita da carteira, custo de captação e a decomposição do spread no formato do Relatório de Economia Bancária do Banco Central (custo de captação, inadimplência, despesas administrativas, tributos e margem), calculados com a DRE de 12 meses e saldos médios — em taxa ${MO ? 'ao mês' : 'ao ano'}.`);
  const bar = el('div', 'ctlbar'); V.appendChild(bar);
  bar.appendChild(txCtl());
  bar.appendChild(el('p', 'note', MO ? 'Ao mês: taxas da DRE = fluxo de 12 meses ÷ 12 ÷ saldo médio (média mensal realizada; a decomposição continua somando). Taxas de mercado do SGS convertidas por equivalência composta, (1 + i)<sup>1/12</sup> − 1.' : 'Ao ano: fluxos de 12 meses ÷ saldos médios; taxas de mercado do SGS como publicadas (% a.a.).'));
  const K = el('div', 'kpis'); V.appendChild(K);
  kpi(K, { l: 'Taxa implícita da carteira', v: { n: R(sd.y), f: PF }, u: UL, fx: 'yld' });
  kpi(K, { l: 'Custo de captação', v: { n: R(sd.c), f: PF }, u: UL, d: pct(div(sd.c, CDI_LTM), 0) + ' do CDI médio', fx: 'cof' });
  kpi(K, { l: 'Spread bruto', v: { n: R(sd.spread), f: MO ? 'pp2' : 'pp' }, u: MO ? 'a.m.' : '', d: 'mediana pares ' + fpp(R(peerMed(n, 'spread'))), cls: 'accent', fx: 'spread' });
  kpi(K, { l: 'Custo do risco', v: { n: R(sd.cor), f: PF }, u: UL, d: stChip('cor', sd.cor), fx: 'cor' });
  kpi(K, { l: 'Margem líquida', v: { n: R(sd.margin), f: PF }, u: UL, d: pct(div(sd.margin, sd.y), 0) + ' da taxa' });
  const sTx = sgLast('taxa').v / 100, sSp = sgLast('spread').v / 100;
  const sSpU = MO ? RS(sTx) - RS(sTx - sSp) : sSp;
  kpi(K, { l: 'SFN · spread das concessões', v: fpp(sSpU) + (MO ? '<small>a.m.</small>' : ''), d: 'taxa média ' + fr(RS(sTx)) + ' ' + UL + ' · ' + mlab(sgLast('spread').m) });
  const G = grid(V); G.classList.add('mt');
  const wf = card(G, { cls: 'c7', title: `Decomposição do spread (% ${UL} sobre a carteira média)`, sub: `Da taxa implícita à margem — formato REB/Bacen · ${pct(sd.share, 0)} do ativo é financiado por captações remuneradas`, fx: 'spreaddec' });
  waterfall(chartEl(wf.b, 300), [
    { label: 'Taxa implícita', value: R(sd.y), kind: 'start', color: 'var(--gold)' },
    { label: 'Custo de captação', value: -R(sd.c), color: 'var(--neg)' },
    { label: 'Spread bruto', value: R(sd.spread), kind: 'total', color: 'var(--s1)' },
    { label: 'Funding sem custo (PL e outros)', value: R(sd.eq), color: 'var(--s3)', tip: ttRow('Parcela financiada por captações', pct(sd.share, 0)) },
    { label: 'Perda esperada', value: -R(sd.cor), color: 'var(--neg-2)' },
    { label: 'Despesas administrativas', value: -R(sd.adm), color: 'var(--neg-3)' },
    { label: 'Tributos', value: -R(sd.trib), color: 'var(--neg-4)' },
    { label: 'Margem líquida', value: R(sd.margin), kind: 'total', color: 'var(--s3)' },
  ], { fmt: fr, h: 300, rot: false });
  const dn = card(G, { cls: 'c5', title: 'Composição da taxa', sub: 'Quanto de cada R$ 100 de juros vai para cada componente' });
  donut(chartEl(dn.b, 200), [
    { label: 'Custo de captação (atribuído)', value: R(sd.cA), color: 'var(--neg)' }, { label: 'Perda esperada', value: R(sd.cor), color: 'var(--neg-2)' },
    { label: 'Despesas administrativas', value: R(sd.adm), color: 'var(--neg-3)' }, { label: 'Tributos', value: R(sd.trib), color: 'var(--neg-4)' },
    { label: 'Margem líquida', value: Math.max(0, R(sd.margin)), shown: R(sd.margin), color: 'var(--s3)' }], { fmt: x => pct(x, MO ? 3 : 2), center: { v: pct(R(sd.y), MO ? 2 : 1), l: 'taxa ' + UL } });
  dn.b.appendChild(el('div', 'take', `A cada R$ 100 de juros da carteira, <b>R$ ${dec(div(sd.cA, sd.y) * 100, 0)}</b> remuneram os poupadores e <b>R$ ${dec(div(sd.cor, sd.y) * 100, 0)}</b> cobrem perdas esperadas; sobram <b>R$ ${dec(div(sd.margin, sd.y) * 100, 0)}</b> de margem após despesas e tributos.`));
  const hs = card(G, { cls: 'c6', title: 'Taxa, custo e spread por trimestre', sub: MO ? 'Média mensal de cada trimestre · fluxo trimestral ÷ 3 sobre saldos médios' : 'Anualizados · fluxos trimestrais sobre saldos médios' });
  lineChart(chartEl(hs.b, 220), { cats: qcats(), series: [{ name: 'Taxa implícita', color: 'var(--pos)', values: m.q.yld.map(R) }, { name: 'Custo de captação', color: 'var(--neg)', values: m.q.cof.map(R) }, { name: 'Spread', color: 'var(--s1)', values: m.q.spread.map(R), area: true }], h: 220, fmt: fr });
  const cp = card(G, { cls: 'c6', title: 'Spread entre pares', sub: 'Distribuição do spread bruto ' + (MO ? 'ao mês ' : '') + 'nas ' + peerLbl(n) });
  histogram(chartEl(cp.b, 190), peerSet(n).spread.map(R), { fmt: x => pp(x, MO ? 1 : 0), marker: R(sd.spread), markerLabel: 'você: ' + fpp(R(sd.spread)), h: 190, colorFn: x => x < 0 ? 'var(--s8)' : 'var(--s1)' });
  const sgc = card(G, { cls: 'c12', title: 'Contexto de mercado (SFN, SGS)', sub: `Taxa média e spread das novas concessões × Selic, em % ${UL} — concessões novas, não estoque`, src: [['SGS 20714 · 20783 · 432', '']] });
  const i0 = SG.meses.indexOf('202301');
  const mm = SG.meses.slice(i0).filter((_, i) => ok(SG.taxa[i0 + i]));
  const tx = mm.map(x => sgv('taxa', x)), sp = mm.map(x => sgv('spread', x));
  lineChart(chartEl(sgc.b, 220), { cats: mm.map(mlab), series: [{ name: `Taxa média das concessões (% ${UL})`, color: 'var(--gold)', values: tx.map(RS) }, { name: `Spread médio (p.p. ${UL})`, color: 'var(--s1)', values: MO ? tx.map((t, i) => RS(t) - RS(t - sp[i])) : sp }, { name: `Selic meta (% ${UL})`, color: 'var(--s7)', values: mm.map(x => RS(sgv('selic', x))) }], h: 220, fmt: fr });
  sgc.b.appendChild(el('p', 'note', `A taxa implícita desta página é sobre o <b>estoque</b> (rendas de crédito ÷ carteira média), inclui crédito rural e direcionado e por isso fica abaixo da taxa média das <b>concessões novas</b> do SGS. Custo de captação = despesas de captação ÷ captações médias; CDI médio dos 12 meses até ${mlab(D.Q[QI])} = ${pct(CDI_LTM)} a.a.${MO ? ' (' + pct(RS(CDI_LTM), 2) + ' a.m.)' : ''}.`));
};
