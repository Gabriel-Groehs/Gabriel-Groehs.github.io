/* =====================================================================
   v2: Painel de métricas, Sankey do resultado, CAMELS, PEARLS, RAS,
       DRE gerencial por segmento e séries temporais adicionais
   ===================================================================== */
const POS_RAMP = ['#17712F', '#1E8E3E', '#2F9E50', '#4AAE68', '#69BE83', '#8DCD9F', '#B2DDBE'];
const NEG_RAMP = ['#9E2A22', '#B8332A', '#C8372D', '#D45246', '#DE6F63', '#E68D83', '#EFAEA6'];
const fmtBy = t => t === 'brl' ? brl : t === 'pp' ? (x => pp(x, 1)) : t === 'x' ? (x => mult(x, 1)) : t === 'pct0' ? (x => pct(x, 0)) : t === 'pct2' ? (x => pct(x, 2)) : (x => pct(x, 1));

/* ---------------- catálogo de métricas ---------------- */
const GS = (s, k, l, f, d) => ['gs_' + s + '_' + k, l + ', a.a.', f, d, m => m.segIdx(null, s)[k], m => range(0, m.qi).map(q => m.segIdx(q, s)[k])];
const MET = [
  ['Porte (R$)', [['at', 'Ativo total', 'brl', 0, m => m.at, m => m.H('at')], ['cart', 'Carteira de crédito', 'brl', 0, m => m.cart, m => m.H('cart')], ['capt', 'Captações', 'brl', 0, m => m.capt, m => m.H('capt')], ['dep', 'Depósitos', 'brl', 0, m => m.dep, m => m.H('dep')], ['pl', 'Patrimônio líquido', 'brl', 0, m => m.pl, m => m.H('pl')], ['ll', 'Lucro / sobras (12m; série trimestral)', 'brl', 1, m => m.ll, m => m.H('ll')], ['pr', 'Patrimônio de referência', 'brl', 0, m => m.pr, m => m.H('pr')], ['rwa', 'RWA total', 'brl', 0, m => m.rwa, m => m.H('rwa')]]],
  ['Capital', [['ib', 'Índice de Basileia', 'pct', 1, m => m.ib, m => m.q.ib], ['icp', 'Capital principal', 'pct', 1, m => m.icp, m => m.q.icp], ['ra', 'Razão de alavancagem', 'pct', 1, m => m.ra, m => m.q.ra], ['alav', 'Ativo ÷ PL (multiplicador)', 'x', -1, m => m.alav, m => m.q.alav], ['rwaD', 'Densidade de RWA', 'pct0', 0, m => m.rwaD, m => m.q.rwaD], ['irrbbPR', 'Capital IRRBB ÷ PR', 'pct', -1, m => m.irrbbPR, m => m.q.irrbb]]],
  ['Crédito', [['agroSh', 'Rural e agroindustrial ÷ carteira (SCR)', 'pct', -1, m => m.agroSh, m => range(0, m.qi).map(q => metricsAt(m.n, q).agroSh)], ['nEffMod', 'Nº efetivo de modalidades (1/HHI)', 'dec1', 1, m => m.nEffMod, m => range(0, m.qi).map(q => metricsAt(m.n, q).nEffMod)], ['inadR', 'Atraso > 90 dias (SCR)', 'pct2', -1, m => m.inadR, m => m.q.inad], ['probR', 'Ativos problemáticos', 'pct2', -1, m => m.probR, m => m.q.prob], ['pbR', 'Problema de recuperação (E3 + simplificada)', 'pct2', -1, m => m.pbR, m => m.q.pb], ['e3R', 'Estágio 3 (metodologia completa)', 'pct2', -1, m => m.e3R, m => m.q.e3], ['e2R', 'Estágio 2', 'pct2', -1, m => m.e2R, m => m.q.e2], ['cob', 'Cobertura PE ÷ problemáticos', 'pct0', 1, m => m.cob, m => m.q.cob], ['cor', 'Custo do risco', 'pct2', -1, m => m.cor, m => m.q.cor]]],
  ['Resultado', [['nimR', 'NIM sobre ativos rentáveis', 'pct', 1, m => m.nimR, m => range(0, m.qi).map(q => metricsAt(m.n, q).nimR)], ['rorwa', 'RORWA · resultado ÷ RWA médio', 'pct2', 1, m => m.rorwa, m => range(0, m.qi).map(q => metricsAt(m.n, q).rorwa)], ['roe', 'ROE', 'pct', 1, m => m.roe, m => m.q.roe], ['roa', 'ROA', 'pct2', 1, m => m.roa, m => m.q.roa], ['nim', 'NIM', 'pct', 1, m => m.nim, m => m.q.nim], ['eff', 'Índice de eficiência', 'pct0', -1, m => m.eff, m => m.q.eff], ['yld', 'Taxa implícita da carteira', 'pct', 0, m => m.yld, m => m.q.yld], ['cof', 'Custo de captação', 'pct', -1, m => m.cof, m => m.q.cof], ['spread', 'Spread bruto', 'pp', 1, m => m.spread, m => m.q.spread]]],
  ['DRE gerencial · total ÷ ativo, a.a.', [['gi_rec', 'Receitas ÷ ativo, a.a.', 'pct', 1, m => m.gi.rec, m => m.giQ.map(x => x.rec)], ['gi_fun', 'Custo de funding ÷ ativo, a.a.', 'pct2', -1, m => m.gi.fun, m => m.giQ.map(x => x.fun)], ['gi_mb', 'Margem bruta ÷ ativo, a.a.', 'pct2', 1, m => m.gi.mb, m => m.giQ.map(x => x.mb)], ['gi_prov', 'Provisão ÷ ativo, a.a.', 'pct2', -1, m => m.gi.prov, m => m.giQ.map(x => x.prov)], ['gi_ml', 'Margem líquida ÷ ativo, a.a.', 'pct2', 1, m => m.gi.ml, m => m.giQ.map(x => x.ml)], ['gi_dd', 'Despesas diretas ÷ ativo, a.a.', 'pct2', -1, m => m.gi.dd, m => m.giQ.map(x => x.dd)], ['gi_di', 'Despesas indiretas ÷ ativo, a.a.', 'pct2', -1, m => m.gi.di, m => m.giQ.map(x => x.di)], ['gi_ll', 'Sobras / lucro ÷ ativo, a.a.', 'pct2', 1, m => m.gi.ll, m => m.giQ.map(x => x.ll)]]],
  ['DRE gerencial · segmentos', [GS('cred', 'rec', 'Crédito · receitas ÷ carteira', 'pct', 1), GS('cred', 'ml', 'Crédito · margem líquida ÷ carteira', 'pct', 1), GS('cred', 'll', 'Crédito · resultado ÷ carteira', 'pct2', 1), GS('card', 'rec', 'Cartões · receitas ÷ carteira de cartões', 'pct', 1), GS('card', 'll', 'Cartões · resultado ÷ carteira de cartões', 'pct2', 1), GS('tes', 'll', 'Tesouraria · resultado ÷ ativos de tesouraria', 'pct2', 1), GS('srv', 'll', 'Serviços e outros · resultado ÷ demais ativos', 'pct2', 1)]],
  ['Liquidez e funding', [['ltdC', 'Crédito ÷ captações', 'pct0', -1, m => m.ltdC, m => m.q.ltdC], ['ltd', 'Crédito ÷ depósitos', 'pct0', -1, m => m.ltd, m => m.q.ltd], ['liqA', 'Ativos líquidos ÷ ativo', 'pct0', 1, m => m.liqA, m => m.q.liqA], ['depShare', 'Depósitos ÷ captações', 'pct0', 1, m => m.depShare, null]]],
  ['Crescimento 12m', [['gCrb', 'Crescimento da carteira', 'pct', 0, m => m.gCrb, null], ['gCapt', 'Crescimento das captações', 'pct', 0, m => m.gCapt, null], ['gAt', 'Crescimento do ativo', 'pct', 0, m => m.gAt, null], ['gPl', 'Crescimento do PL', 'pct', 0, m => m.gPl, null]]],
];
const METI = {}; MET.forEach(([g, L]) => L.forEach(([k, l, f, d, v, s]) => { METI[k] = { k, l, g, fmt: fmtBy(f), f, dir: d, v, s }; }));
const FXM = { at: 'at', cart: 'cart', capt: 'capt', dep: 'dep', pl: 'pl', ll: 'll', pr: 'pr', rwa: 'rwa', ib: 'ib', pbR: 'stages', nimR: 'nim', rorwa: 'roe', icp: 'icp', ra: 'ra', alav: 'balanca', rwaD: 'rwa', irrbbPR: 'irrbb', inadR: 'inad', probR: 'prob', e3R: 'stages', e2R: 'stages', cob: 'cob', cor: 'cor', roe: 'roe', roa: 'roe', nim: 'nim', eff: 'eff', yld: 'yld', cof: 'cof', spread: 'spread', ltdC: 'ltd', ltd: 'ltd', liqA: 'liqA', depShare: 'capt', gCrb: 'cart', gCapt: 'capt', gAt: 'at', gPl: 'pl' };
const fxOfMetric = k => k.startsWith('gi_') ? 'gi' : k.startsWith('gs_') ? 'seg' : (FXM[k] || 'nmetric');

function metricSelect(val, onPick) {
  const s = el('select', 'sel');
  s.innerHTML = MET.map(([g, L]) => `<optgroup label="${g}">${L.map(x => `<option value="${x[0]}" ${x[0] === val ? 'selected' : ''}>${x[1]}</option>`).join('')}</optgroup>`).join('');
  s.onchange = () => onPick(s.value);
  return s;
}
function filt(label, inner, cls) { const d = el('div', 'filt ' + (cls || '')); d.innerHTML = `<label>${label}</label>`; d.appendChild(inner); return d; }

/* ---------------- Painel de métricas ---------------- */
VIEWS.painel = (V) => {
  const ui = ST.ui.pn || (ST.ui.pn = { k: 'ib', pop: 'auto', top: 15 });
  head(V, 'Visão · Painel', 'Painel de métricas', 'Escolha a métrica e até duas seleções — cooperativa, sistema, central, bancão ou os grupos — para ver séries temporais, ranking, categorias e o quadro geral na data-base.');
  const bar = el('div', 'ctlbar'); V.appendChild(bar);
  bar.appendChild(filt('Métrica', metricSelect(ui.k, k => { ui.k = k; render(false); }), 'sm'));
  const pa = el('div', 'picker'), pb = el('div', 'picker');
  bar.appendChild(filt('Seleção A', pa));
  const vs = el('span', 'vsbadge', 'vs'); bar.appendChild(vs);
  bar.appendChild(filt('Seleção B (opcional)', pb));
  makePicker(pa, { value: ST.a, cta: 'A', onChange: id => { ST.a = id; writeHash(); render(false); } });
  if (ST.b) makePicker(pb, { value: ST.b, cta: 'B', align: 'right', onChange: id => { ST.b = id; writeHash(); render(false); } });
  else { const add = el('button', 'btn', '+ adicionar comparação'); add.onclick = () => { ST.b = 'G:bank'; writeHash(); render(false); }; pb.appendChild(add); }
  if (ST.b) { const rm = el('button', 'btn', '× remover B'); rm.onclick = () => { ST.b = ''; writeHash(); render(false); }; bar.appendChild(rm); }
  const popSel = el('select', 'sel');
  popSel.innerHTML = [['auto', 'Automático (pares de A)'], ['coop', 'Cooperativas singulares'], ['sysA', 'Singulares do sistema de A'], ['sys', 'Sistemas cooperativos e grandes bancos'], ['bank', 'Grandes bancos'], ['all', 'Todas (singulares + grandes bancos)']].map(([k, l]) => `<option value="${k}" ${k === ui.pop ? 'selected' : ''}>${l}</option>`).join('');
  popSel.onchange = () => { ui.pop = popSel.value; render(false); };
  bar.appendChild(filt('Ranking entre', popSel, 'sm'));
  const M = METI[ui.k], A = node(ST.a), B = ST.b ? node(ST.b) : null;
  const mA = metrics(A), mB = B ? metrics(B) : null;
  const vA = M.v(mA), vB = B ? M.v(mB) : NaN;
  let pop = ui.pop;
  if (pop === 'auto') pop = A.grp === 'bank' ? 'bank' : (A.kind === 'coop' || A.kind === 'central') ? 'sysA' : A.kind === 'system' ? 'sys' : 'coop';
  let L;
  if (pop === 'coop') L = COOPS.map(e => node(e.id));
  else if (pop === 'bank') L = BANKS.map(e => node(e.id));
  else if (pop === 'sys') L = SYS_ORDER.filter(s => NODES.has('S:' + s)).map(s => node('S:' + s)).concat([node('G:bank')], BANKS.slice(0, 8).map(e => node(e.id)));
  else if (pop === 'sysA') L = (A.sys && NODES.has('S:' + A.sys)) ? node('S:' + A.sys).members.map(e => node(e.id)) : COOPS.map(e => node(e.id));
  else L = COOPS.concat(BANKS).map(e => node(e.id));
  const vals = L.map(nn => ({ nn, v: M.v(metrics(nn)) })).filter(x => ok(x.v));
  const sorted = vals.slice().sort((a, b) => M.dir < 0 ? a.v - b.v : b.v - a.v);
  const rankOf = id => sorted.findIndex(x => x.nn.id === id) + 1;
  const med = median(vals.map(x => x.v));
  const fxk = fxOfMetric(ui.k);
  const K = el('div', 'kpis'); V.appendChild(K);
  kpi(K, { l: 'A · ' + A.name, v: M.fmt(vA), d: (rankOf(A.id) ? rankOf(A.id) + 'º de ' + sorted.length : 'fora do ranking'), fx: fxk, cls: 'accent' });
  if (B) kpi(K, { l: 'B · ' + B.name, v: M.fmt(vB), d: (rankOf(B.id) ? rankOf(B.id) + 'º de ' + sorted.length : 'fora do ranking'), fx: fxk });
  if (B) kpi(K, { l: 'Diferença A − B', v: M.f === 'brl' ? brl(vA - vB, { sign: true }) : M.f === 'x' ? dec(vA - vB, 2) + '×' : pp(vA - vB, 2, true), d: M.dir ? ((M.dir > 0 ? vA > vB : vA < vB) ? '<span class="dl up">A melhor</span>' : '<span class="dl dn">B melhor</span>') : 'sem direção de melhor', fx: fxk });
  kpi(K, { l: 'Mediana do ranking', v: M.fmt(med), d: sorted.length + ' instituições', fx: 'ranking' });
  kpi(K, { l: 'Melhor do ranking', v: sorted.length ? M.fmt(sorted[0].v) : '—', d: sorted.length ? esc(sorted[0].nn.name) : '', fx: 'ranking' });
  const G = grid(V); G.classList.add('mt');
  const ts = card(G, { cls: 'c8', title: M.l + ' · série trimestral', sub: 'Até a data-base selecionada · tracejado = mediana do ranking', fx: fxk });
  if (M.s) {
    const SS = L.slice(0, 400).map(nn => M.s(metrics(nn)));
    const med_s = D.Q.slice(0, QI + 1).map((_, q) => median(SS.map(s_ => s_ ? s_[q] : NaN)));
    const ser = [{ name: 'A · ' + A.name, color: 'var(--s1)', values: M.s(mA), area: !B }];
    if (B) ser.push({ name: 'B · ' + B.name, color: 'var(--s2)', values: M.s(mB) });
    ser.push({ name: 'Mediana do ranking', color: 'var(--s5)', values: med_s, dash: '5 4' });
    const qq = p => D.Q.slice(0, QI + 1).map((_, q) => quant(SS.map(s_ => s_ ? s_[q] : NaN), p));
    ser.push({ name: 'P25 do ranking', color: 'var(--ink-3)', values: qq(.25), dash: '2 4', w: 1.2 }, { name: 'P75 do ranking', color: 'var(--ink-3)', values: qq(.75), dash: '2 4', w: 1.2 });
    lineChart(chartEl(ts.b, 260), { cats: qcats(), series: ser, fmt: M.fmt, h: 260 });
    ts.b.appendChild(tsReadTable([['A', M.s(mA)]].concat(B ? [['B', M.s(mB)]] : []), M));
  } else ts.b.appendChild(el('p', 'note', 'Métrica de crescimento em 12 meses: sem série trimestral própria. Veja os níveis (ativo, carteira, captações) para a trajetória.'));
  const hs = card(G, { cls: 'c4', title: 'Posição na distribuição', sub: 'Histograma do ranking · marcador = A', fx: 'pctl' });
  histogram(chartEl(hs.b, 220), vals.map(x => x.v), { fmt: M.fmt, marker: vA, markerLabel: 'A ' + M.fmt(vA), h: 220, colorFn: () => 'var(--s7)' });
  if (B) hs.b.appendChild(el('div', 'take', `B (${esc(B.name)}): <b>${M.fmt(vB)}</b> — ${rankOf(B.id) ? rankOf(B.id) + 'º' : 'fora'} no ranking. ${M.dir ? 'Direção: ' + (M.dir > 0 ? 'maior é melhor' : 'menor é melhor') + '.' : ''}`));
  const rk = card(G, { cls: 'c7', title: 'Ranking · ' + M.l, sub: `Top ${ui.top} ${M.dir < 0 ? '(menor é melhor)' : M.dir > 0 ? '(maior é melhor)' : '(ordem decrescente)'} · A e B destacados`, fx: 'ranking' });
  const topRows = sorted.slice(0, ui.top);
  [A, B].forEach(x => { if (x && rankOf(x.id) > ui.top) topRows.push(sorted[rankOf(x.id) - 1]); });
  hbars(chartEl(rk.b, topRows.length * 24 + 10), topRows.map(x => ({ label: rankOf(x.nn.id) + '. ' + x.nn.name, value: x.v, color: x.nn.id === A.id ? 'var(--s1)' : (B && x.nn.id === B.id) ? 'var(--s2)' : 'var(--s6)', tip: ttRow('Caminho', esc(crumb(x.nn))) })), { fmt: M.fmt, lw: 250, rh: 24, name: M.l });
  const ct = card(G, { cls: 'c5', title: 'Categorias', sub: 'Sistemas cooperativos (soma das singulares) e grandes bancos', fx: 'cmp' });
  const cats = SYS_ORDER.filter(s => NODES.has('S:' + s)).map(s => node('S:' + s)).concat([node('G:coop'), node('G:bank')]);
  hbars(chartEl(ct.b, cats.length * 26 + 10), cats.map(nn => ({ label: nn.name, value: M.v(metrics(nn)), color: nn.id === A.id || (A.sys && nn.id === 'S:' + A.sys) ? 'var(--s1)' : (B && (nn.id === B.id || (B.sys && nn.id === 'S:' + B.sys))) ? 'var(--s2)' : nn.kind === 'group' ? 'var(--s5)' : 'var(--s6)' })), { fmt: M.fmt, lw: 130, name: M.l });
  // quadro geral
  const qg = card(G, { cls: 'c12', title: 'Métricas gerais · A' + (B ? ' × B' : ''), sub: 'Valores na data-base, série trimestral em miniatura e posição no ranking escolhido', fx: 'cmp' });
  const keys = ['at', 'cart', 'pl', 'll', 'ib', 'icp', 'inadR', 'pbR', 'cob', 'roe', 'nim', 'eff', 'spread', 'gs_cred_ml', 'gs_cred_ll', 'ltdC', 'liqA', 'irrbbPR'];
  qg.b.innerHTML = `<div class="tblwrap" style="max-height:none"><table class="tbl"><thead><tr><th>Métrica</th><th>A · ${esc(A.name)}</th><th></th>${B ? `<th>B · ${esc(B.name)}</th><th></th><th>A − B</th>` : ''}<th>Mediana</th></tr></thead><tbody>${keys.map(k => { const X = METI[k], a = X.v(mA), b = B ? X.v(mB) : NaN, mv = median(vals.length && k === ui.k ? vals.map(x => x.v) : L.slice(0, 400).map(nn => X.v(metrics(nn)))); const better = X.dir && ok(a) && ok(b) ? ((X.dir > 0) === (a > b)) : null; return `<tr><td class="l"><a href="#" data-k="${k}" style="color:var(--ink);text-decoration:none;border-bottom:1px dotted var(--gold)">${X.l}</a></td><td><b class="${better === true ? '' : ''}">${X.fmt(a)}</b></td><td>${X.s ? spark(X.s(mA), 'var(--s1)', 70, 22).replace('class="sk"', 'style="display:inline-block;vertical-align:middle"') : ''}</td>${B ? `<td><b>${X.fmt(b)}</b></td><td>${X.s ? spark(X.s(mB), 'var(--s2)', 70, 22).replace('class="sk"', 'style="display:inline-block;vertical-align:middle"') : ''}</td><td>${ok(a) && ok(b) ? `<span class="dl ${better == null ? 'flat' : better ? 'up' : 'dn'}">${X.f === 'brl' ? brl(a - b, { sign: true }) : X.f === 'x' ? dec(a - b, 2) + '×' : pp(a - b, 2, true)}</span>` : '—'}</td>` : ''}<td class="muted">${X.fmt(mv)}</td></tr>`; }).join('')}</tbody></table></div><p class="note">Clique no nome de uma métrica para trazê-la ao painel. Verde/vermelho indicam qual seleção está melhor quando a métrica tem direção.</p>`;
  $$('a[data-k]', qg.b).forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); ui.k = a.dataset.k; render(false); window.scrollTo(0, 0); }));
};

/* ---------------- DRE gerencial por segmento (card reutilizável) ---------------- */
const SEG_T = {
  T: { l: 'Total', n: 'ativo', h: '% do ativo total médio', sub: 'Cada grupo de contas da DRE ÷ ativo total médio — soma exata dos quatro segmentos' },
  cred: { l: 'Crédito', n: 'carteira de crédito', h: '% da carteira de crédito média', sub: 'Rendas de crédito, arrendamento e títulos com característica de crédito ÷ carteira de crédito média' },
  card: { l: 'Cartões', n: 'carteira de cartões', h: '% da carteira de cartões média', sub: 'Cartões e meios de pagamento ÷ valores a receber de transações de pagamento (pós-pago e credenciamento)' },
  tes: { l: 'Tesouraria', n: 'ativos de tesouraria', h: '% dos ativos de tesouraria médios', sub: 'Aplicações, TVM, derivativos e centralização ÷ caixa, aplicações, TVM, derivativos, centralização e compulsórios' },
  srv: { l: 'Serviços e outros', n: 'demais ativos', h: '% dos demais ativos médios', sub: 'Tarifas, serviços, participações e outros resultados ÷ demais ativos médios' },
};
const SEG_C = { cred: 'var(--s1)', card: 'var(--s2)', tes: 'var(--s7)', srv: 'var(--s5)' };
function giCard(G, n, cls) {
  const ui = ST.ui.gi || (ST.ui.gi = { seg: 'T', key: 'rec' });
  const m = metrics(n), sg = SEG_T[ui.seg] ? ui.seg : 'T', key = ui.key === 'bal' ? 'bal' : 'rec', Tt = SEG_T[sg];
  // taxas ao mês (padrão): fluxo do período ÷ nº de meses ÷ saldo médio do período; ao ano: trimestre × 4 e 12 meses
  const MO = txMO(), R = x => MO ? x / 12 : x, UL = MO ? 'a.m.' : 'a.a.', fP = x => pct(R(x), 2);
  const c = card(G, { cls: cls || 'c12', title: 'DRE gerencial · índices por segmento', sub: Tt.sub + ' · série trimestral e 12 meses até a data-base, em % ' + (MO ? 'ao mês' : 'ao ano'), fx: 'gi' });
  const bar = el('div', 'gibar'); c.b.appendChild(bar);
  bar.appendChild(filt('Segmento', segCtl(Object.keys(SEG_T).map(k => [k, SEG_T[k].l]), sg, k => { ui.seg = k; render(false); }), 'segf'));
  bar.appendChild(filt('Rateio das despesas indiretas ' + infoBtn('rateio'), segCtl([['rec', 'Participação nas receitas'], ['bal', 'Participação no ativo']], key, k => { ui.key = k; render(false); }), 'sm'));
  bar.appendChild(txCtl('Taxas'));
  const o12 = m.seg(null, key), X12 = sg === 'T' ? o12.T : o12.S[sg];
  const ix = range(0, QI).map(q => m.segIdx(q, sg, key)), iL = m.segIdx(null, sg, key);
  const shTxt = key === 'bal' ? 'no ativo médio' : 'nas receitas';
  if (ok(iL.rec)) {
    const w = el('div', 'grid g12'); c.b.appendChild(w);
    const a = el('div', 'c6'); w.appendChild(a); const b = el('div', 'c6'); w.appendChild(b);
    const S_ = k => ix.map(x => R(x[k])), fc = x => pct(x, MO ? 2 : 1);
    lineChart(a, { cats: qcats(), series: [{ name: 'Receitas', color: 'var(--pos)', values: S_('rec') }, { name: 'Margem bruta', color: 'var(--s1)', values: S_('mb') }, { name: 'Margem líquida', color: 'var(--s7)', values: S_('ml') }, { name: sg === 'T' ? lucroK(n) : 'Resultado', color: 'var(--gold)', values: S_('ll') }], h: 230, fmt: fc });
    lineChart(b, { cats: qcats(), series: [{ name: 'Custo de funding', color: 'var(--neg)', values: S_('fun') }, { name: 'Provisão', color: 'var(--neg-3)', values: S_('prov') }, { name: 'Despesas diretas', color: 'var(--s6)', values: S_('dd') }, { name: 'Despesas indiretas', color: 'var(--s5)', values: S_('di') }], h: 230, fmt: fc });
    const rows = [['rec', 'Receitas', 1], ['fun', '(−) Custo de funding · taxa de transferência', -1], ['mb', '= Margem bruta', 0], ['prov', '(−) Provisão para risco de crédito (perda esperada)', -1], ['ml', '= Margem líquida', 0], ['dd', '(−) Despesas diretas (custos próprios do produto)', -1], ['di', sg === 'T' ? '(−) Despesas indiretas' : '(−) Despesas indiretas rateadas', -1], ['pa', 'pessoal e administrativas', -1, 1], ['ot', 'tributos, outras receitas e despesas, IR/CS e participações', -1, 1], ['ll', '= ' + (sg === 'T' ? lucroLbl(n) : 'Resultado do segmento'), 0]];
    const col = s => s > 0 ? 'var(--good-ink)' : s < 0 ? 'var(--crit-ink)' : 'var(--ink)';
    const t = el('div', 'tblwrap mt'); t.style.maxHeight = 'none';
    t.innerHTML = `<table class="tbl gitbl"><thead><tr><th>${Tt.h}, <span class="u">${UL}</span></th>${ix.map((_, i) => `<th>${qlab(D.Q[i])}</th>`).join('')}<th>12 meses</th></tr></thead><tbody>${rows.map(([k, l, s, sub]) => `<tr class="${s === 0 ? 'tot' : ''}${sub ? ' sub' : ''}"><td class="l">${sub ? '· ' : ''}${l}</td>${ix.map(x => `<td style="color:${col(s)}">${fP(x[k])}</td>`).join('')}<td><b>${fP(iL[k])}</b></td></tr>`).join('')}</tbody></table>`;
    c.b.appendChild(t);
    c.b.appendChild(el('p', 'note gicap', MO
      ? `<b>Ao mês:</b> cada trimestre = fluxo do trimestre ÷ 3 ÷ saldo médio do trimestre; 12 meses = fluxo de 12 meses ÷ 12 ÷ saldo médio das datas-base do período — aproxima a divisão da receita pela soma dos saldos mensais. A DRE do IF.data acumula no semestre: junho e dezembro entram descontados de março e setembro.`
      : `<b>Ao ano:</b> cada trimestre = fluxo do trimestre × 4 ÷ saldo médio do trimestre; 12 meses = fluxo de 12 meses ÷ saldo médio das datas-base do período. A DRE do IF.data acumula no semestre: junho e dezembro entram descontados de março e setembro.`));
    const d1 = MO ? 2 : sg === 'T' ? 2 : 1, R100 = x => dec(R(x) * 100, d1), per = MO ? 'por mês' : 'em 12 meses';
    c.b.appendChild(el('div', 'take', sg === 'T'
      ? `A cada <b>R$ 100</b> de ativo médio, a instituição gerou <b>R$ ${R100(iL.rec)}</b> de receitas ${per}, pagou <b>R$ ${R100(iL.fun)}</b> de funding, provisionou <b>R$ ${R100(iL.prov)}</b>, gastou <b>R$ ${R100(iL.dd)}</b> em despesas diretas e <b>R$ ${R100(iL.di)}</b> em indiretas e ficou com <b>R$ ${R100(iL.ll)}</b> de ${lucroK(n).toLowerCase()}.`
      : `A cada <b>R$ 100</b> de ${Tt.n}, o segmento <b>${Tt.l}</b> gerou <b>R$ ${R100(iL.rec)}</b> de receitas ${per}, pagou <b>R$ ${R100(iL.fun)}</b> de funding pela taxa de transferência de ${fP(o12.ftp)} ${UL}, provisionou <b>R$ ${R100(iL.prov)}</b>, teve <b>R$ ${R100(iL.dd)}</b> de despesas diretas e absorveu <b>R$ ${R100(iL.di)}</b> de despesas indiretas no rateio (${pct(X12.sh, 1)} pela participação ${shTxt}); resultado de <b>R$ ${R100(iL.ll)}</b>.${sg === 'card' && iL.rec < 0.03 ? ' A receita é baixa para o tamanho da carteira: a remuneração dos cartões pode estar registrada na central ou no banco do sistema.' : ''}`));
  } else {
    const why = !(X12.base > 0)
      ? (sg === 'srv' ? 'as bases de crédito, cartões e tesouraria já cobrem praticamente todo o ativo, então o segmento não tem saldo próprio' : `não há ${Tt.n} no balanço`)
      : `a base de balanço (${brl(X12.base)}) é pequena demais para as receitas do segmento (${brl(X12.rec)} em 12 meses): o ativo do produto fica, em boa parte, fora do balanço da instituição`;
    c.b.appendChild(el('div', 'take', `<b>${esc(nameOf(n))} · ${Tt.l}:</b> ${why}${sg === 'card' ? ' — quando o banco do sistema é o emissor, os valores a receber dos cartões ficam no balanço dele e a cooperativa recebe a remuneração' : ''}. Os índices ficam indisponíveis; os valores do segmento em R$ estão no quadro abaixo.`));
  }
  // rateio e resultado por segmento
  const ag = el('div', 'grid g12 mt'); c.b.appendChild(ag);
  const h1 = el('div', 'c5'); ag.appendChild(h1); const h2 = el('div', 'c7'); ag.appendChild(h2);
  h1.appendChild(el('div', 'gihd', 'Resultado por segmento · 12 meses'));
  const hb = el('div'); h1.appendChild(hb);
  hbars(hb, SEGK.map(k => { const s = o12.S[k]; return { label: SEG_T[k].l, value: s.ll, color: s.ll >= 0 ? 'var(--pos)' : 'var(--neg)', tip: ttRow('Resultado ÷ ' + SEG_T[k].n + ' (' + UL + ')', s.base > 0 ? fP(s.ll / s.base) : '—') + ttRow('Despesas indiretas rateadas', brl(-s.di)) }; }), { fmt: x => brl(x), lw: 128, name: 'Resultado 12m' });
  h2.appendChild(el('div', 'gihd', 'Participação de cada segmento'));
  const sk = el('div'); h2.appendChild(sk);
  stack100(sk, [{ label: 'Ativo médio', parts: SEGK.map(k => ({ label: SEG_T[k].l, value: o12.S[k].base, color: SEG_C[k] })) }, { label: 'Receitas', parts: SEGK.map(k => ({ label: SEG_T[k].l, value: Math.max(0, o12.S[k].rec), color: SEG_C[k] })) }, { label: 'Indiretas rateadas', parts: SEGK.map(k => ({ label: SEG_T[k].l, value: Math.max(0, o12.S[k].di), color: SEG_C[k] })) }], { lw: 128, fmt: brl });
  const rt = el('div', 'tblwrap mt'); rt.style.maxHeight = 'none'; c.b.appendChild(rt);
  const shC = (v, on, isT) => `<small class="sh${on ? ' key' : ''}">${isT ? '100%' : pct(v, 1)}</small>`;
  const rowS = (k, s, isT) => `<tr class="${isT ? 'tot' : ''}${k === sg ? ' hl' : ''}" data-seg="${k}" title="Ver ${isT ? 'o total' : 'o segmento ' + SEG_T[k].l}"><td class="l">${isT ? 'Total' : `<i class="dot" style="background:${SEG_C[k]}"></i>${SEG_T[k].l}`}</td><td>${brl(s.base)}${shC(s.shBal, key === 'bal', isT)}</td><td>${brl(s.rec)}${shC(s.shRec, key === 'rec', isT)}</td><td>${brl(-s.fun)}</td><td>${brl(-s.prov)}</td><td>${brl(-s.dd)}</td><td>${brl(-s.di)}</td><td style="color:${s.ll >= 0 ? 'var(--good-ink)' : 'var(--crit-ink)'}"><b>${brl(s.ll)}</b></td><td>${s.base > 0 ? fP(s.ll / s.base) : '—'}</td></tr>`;
  rt.innerHTML = `<table class="tbl gitbl2"><thead><tr><th>Segmento · 12 meses</th><th>Base média<small class="sh">% do ativo</small></th><th>Receitas<small class="sh">% das receitas</small></th><th>Funding (FTP)</th><th>Provisão</th><th>Despesas diretas</th><th>Indiretas rateadas</th><th>Resultado</th><th>Resultado ÷ base<small class="sh">${UL}</small></th></tr></thead><tbody>${SEGK.map(k => rowS(k, o12.S[k])).join('')}${rowS('T', o12.T, true)}</tbody></table>`;
  $$('tr[data-seg]', rt).forEach(tr => tr.addEventListener('click', () => { ui.seg = tr.dataset.seg; render(false); }));
  const small = sg !== 'T' && X12.base > 0 && X12.base < 0.005 * o12.T.base;
  c.b.appendChild(el('p', 'note', `<b>Como ler.</b> Receitas e despesas são fluxos e as bases são saldos: cada índice divide o fluxo de um período pelo saldo médio do mesmo período. Funding: despesas de captação e de dívida elegível a capital distribuídas pela taxa de transferência única (FTP = funding ÷ soma das bases = ${fP(o12.ftp)} ${UL}). Provisão: perda esperada por tipo de ativo (IF.data f1–f6, l2 e q). Despesas diretas: custos com conta própria no COSIF — cessão e descontos em renegociação no crédito; serviços de pagamento, antecipação e aluguel de maquininhas nos cartões. Pessoal, administrativas, tributos, outras receitas e despesas, IR/CS e participações não têm conta por produto e são rateados pela participação de cada segmento ${shTxt}. Cartões = valores a receber de transações de pagamento (pós-pago e credenciamento); rotativo e parcelado com juros são operações de crédito no COSIF e ficam em Crédito. Clique numa linha do quadro para trocar o segmento.${small ? ' <b>Base pequena (menos de 0,5% do ativo): índices voláteis.</b>' : ''}`));
}

/* ---------------- Sankey do resultado ---------------- */
const NETP = [['7158000003', '8155000005', 'Resultado com derivativos (líquido)'], ['7199100003', '8199100002', 'Variação cambial (líquida)'], ['7199300009', '8199300008', 'Ajuste a valor justo (líquido)'], ['7199400002', '8199400001', 'Hedge de valor justo (líquido)'], ['7199200006', '8199200005', 'Provisão p/ risco de crédito (líquida)'], ['7199500005', '8199500004', 'Provisões passivas (líquidas)'], ['7198600009', '8198600008', 'Depósitos intercooperativos (líquido)'], ['7191600006', '8191600005', 'Compra e venda de moeda (líquido)']];
const PRODMAP = { '7110300002': ['1611000003'], '7110500008': ['1612000002'], '7111000002': ['1613000001'], '7111500007': ['1621000000'], '7112000001': ['1622000009'], '7114100002': ['1630500003'], '7114200005': ['1631500002'], '7114300008': ['1632500001'], '7114400001': ['1633500000'], '7114600007': ['1634500009'], '7115500003': ['1624000007'], '7116500002': ['1643000002'], '7116000007': ['1641000004'], '8111000001': ['4120000003'], '8112000000': ['4130000000'], '8113000009': ['4150000004'], '8115000007': ['4200000002'], '8116500001': ['4324000005'], '8117500000': ['4323500001'], '8118200000': ['4325000004'] };
const CARD_ACC = ['7163100008', '7170500000', '7191800002'];
function accIndex() { if (accIndex.m) return accIndex.m; const mp = new Map(); ACC.forEach((a, i) => mp.set(a[0], i)); return (accIndex.m = mp); }
function plData(n, srcKey) {
  let mp;
  const S_ = n.kind === 'system' ? SYSD.get(n.sys) : null;
  if (srcKey === 'comb' && S_ && S_.BC) mp = S_._bc || (S_._bc = bcMap(S_.BC)); else mp = aggregate(n).BC;
  const W = range(Math.max(0, QI - 3), QI), ann = 4 / W.length;
  const flow = (arr, q) => (semEnd(q) && q > 0) ? (arr[q] || 0) - (arr[q - 1] || 0) : (arr[q] || 0);
  const ltm = arr => sum(W.map(q => flow(arr, q))) * ann;
  const A0 = range(Math.max(0, QI - 4), QI), avgS = arr => mean(A0.map(q => arr[q] || 0));
  const val = new Map(), stock = new Map();
  for (const [i, arr] of mp) { const a = ACC[i]; if (!a) continue; if (a[0][0] === '7' || a[0][0] === '8') val.set(a[0], ltm(arr)); else stock.set(a[0], avgS(arr)); }
  return { val, stock, ann: W.length < 4 ? W.length : 0 };
}
function plTree(val, net) {
  const lv = c => ACC[accIndex().get(c)][2];
  const nm = c => ACC[accIndex().get(c)][1];
  const L3 = [...val.keys()].filter(c => lv(c) === 3), L4 = [...val.keys()].filter(c => lv(c) === 4);
  const kids = new Map(L3.map(c => [c, []]));
  L4.forEach(c => { const p = L3.find(x => x.slice(0, 3) === c.slice(0, 3)); if (p) kids.get(p).push(c); });
  const v = new Map(val);
  const orig = new Map(L3.map(c => [c, val.get(c) - sum(kids.get(c).map(k => val.get(k)))]));
  if (net) NETP.forEach(([r, e]) => { if (v.has(r) || v.has(e)) { const s = (v.get(r) || 0) + (v.get(e) || 0); if (v.has(r)) v.set(r, Math.max(0, s)); if (v.has(e)) v.set(e, Math.min(0, s)); if (!v.has(r) && s > 0) v.set(e, 0); if (!v.has(e) && s < 0) v.set(r, 0); } });
  const nodes = L3.map(c => {
    const ch = kids.get(c).map(k => ({ code: k, name: nm(k), v: v.get(k) || 0 }));
    const rest = orig.get(c) || 0;
    if (Math.abs(rest) > 1) ch.push({ code: c + '*', name: 'Demais contas de ' + nm(c).toLowerCase(), v: rest });
    return { code: c, name: nm(c).replace(/^\(-\)\s*/, ''), v: sum(ch.map(x => x.v)), ch: ch.map(x => ({ ...x, name: x.name.replace(/^\(-\)\s*/, '') })) };
  });
  const rev = [], exp = [];
  nodes.forEach(nd => {
    const pos = nd.ch.filter(x => x.v > 0), neg = nd.ch.filter(x => x.v < 0);
    const g = nd.code[0];
    const mk = (arr, side) => ({ code: nd.code + side, base: nd.code, name: nd.name, v: Math.abs(sum(arr.map(x => x.v))), ch: arr.map(x => ({ ...x, v: Math.abs(x.v) })).sort((a, b) => b.v - a.v), side });
    if (g === '7') { if (pos.length) rev.push(mk(pos, 'R')); if (neg.length) exp.push({ ...mk(neg, 'E'), name: nd.name + ' (estornos)' }); }
    else { if (neg.length) exp.push(mk(neg, 'E')); if (pos.length) rev.push({ ...mk(pos, 'R'), name: nd.name + ' (reversões)' }); }
  });
  rev.sort((a, b) => b.v - a.v); exp.sort((a, b) => b.v - a.v);
  return { rev: rev.filter(x => x.v > 0.5), exp: exp.filter(x => x.v > 0.5) };
}
VIEWS.sankey = (V, n) => {
  const ui = ST.ui.sk || (ST.ui.sk = { open: null, net: true, src: 'comb', min: 0.4 });
  const hasComb = n.kind === 'system' && SYSD.get(n.sys) && SYSD.get(n.sys).BC;
  const srcKey = hasComb ? ui.src : 'soma';
  const { val, stock, ann } = plData(n, srcKey);
  head(V, 'Demonstrações · Resultado', 'Resultado em fluxo — ' + esc(nameOf(n)), `Sankey do P&L com as contas de resultado do COSIF em 12 meses até ${mlab(D.Q[QI])}${ann ? ` (anualizado de ${ann} trimestre${ann > 1 ? 's' : ''})` : ''}: receitas à esquerda, despesas e resultado à direita. Use <b>+</b> e <b>−</b> nos nós para detalhar por produto ou recolher; passe o mouse para valores.`);
  if (!val.size) { V.appendChild(el('p', 'note', 'Sem contas de resultado no balancete para esta seleção.')); return; }
  const T = plTree(val, ui.net);
  if (!ui.open) ui.open = new Set(T.rev.concat(T.exp).map(x => x.code));
  const bar = el('div', 'ctlbar'); V.appendChild(bar);
  const btn = (t, f) => { const b = el('button', 'btn', t); b.onclick = f; bar.appendChild(b); return b; };
  btn('⊕ Abrir tudo', () => { ui.open = new Set(T.rev.concat(T.exp).map(x => x.code)); render(false); });
  btn('⊖ Recolher tudo', () => { ui.open = new Set(); render(false); });
  bar.appendChild(segCtl([['1', 'Compensar derivativos, câmbio e provisões'], ['0', 'Valores brutos']], ui.net ? '1' : '0', k => { ui.net = k === '1'; render(false); }));
  if (hasComb) bar.appendChild(segCtl([['comb', 'Combinado oficial'], ['soma', 'Soma das singulares']], ui.src, k => { ui.src = k; ui.open = null; render(false); }));
  const totR = sum(T.rev.map(x => x.v)), totE = sum(T.exp.map(x => x.v)), res = totR - totE;
  const K = el('div', 'kpis'); V.appendChild(K);
  kpi(K, { l: 'Receitas (grupo 7)', v: brl(totR), d: T.rev.length + ' grupos de contas', fx: 'sankey' });
  kpi(K, { l: 'Despesas (grupo 8)', v: brl(totE), d: pct(div(totE, totR), 0) + ' das receitas', fx: 'sankey' });
  kpi(K, { l: res >= 0 ? lucroK(n) + ' (resultado)' : 'Prejuízo', v: brl(res), d: 'margem ' + pct(div(res, totR), 1), cls: 'accent', fx: 'll' });
  const cr = T.rev.find(x => x.base === '7110000003');
  if (cr) kpi(K, { l: 'Rendas de crédito', v: brl(cr.v), d: pct(div(cr.v, totR), 0) + ' das receitas', fx: 'yld' });
  const G = grid(V); G.classList.add('mt');
  const sc = card(G, { cls: 'c12', title: 'Sankey do resultado (P&L)', sub: 'Receitas → total → despesas e resultado · verde = receita, vermelho = despesa · + / − para detalhar ou recolher', fx: 'sankey', src: [['COSIF 7 e 8', 'r']] });
  drawPL(sc.b, T, res, ui, n);
  // lista de produtos
  const pc = card(G, { cls: 'c12', title: 'Produtos e contas · receitas e custos de 12 meses', sub: 'Contas de nível 4 do COSIF, com taxa implícita quando há saldo correspondente no balanço', fx: 'produtos' });
  const revRows = [], expRows = [];
  T.rev.forEach(g => g.ch.forEach(x => revRows.push({ ...x, grp: g.name })));
  T.exp.forEach(g => g.ch.forEach(x => expRows.push({ ...x, grp: g.name })));
  revRows.sort((a, b) => b.v - a.v); expRows.sort((a, b) => b.v - a.v);
  const cardsV = sum(CARD_ACC.map(c => Math.max(0, val.get(c) || 0)));
  const rate = code => { const st = (PRODMAP[code] || []).map(c => stock.get(c) || 0); const s = sum(st); const v = Math.abs(val.get(code) || 0); return s > 0 ? v / s : NaN; };
  const tr = (x, tot) => `<tr><td class="l"><span class="mono muted" style="font-size:10.5px">${x.code.endsWith('*') ? '—' : fmtCode(x.code)}</span> ${esc(x.name)}<div class="muted" style="font-size:11px">${esc(x.grp)}</div></td><td>${brl(x.v)}</td><td>${pct(div(x.v, tot), 1)}</td><td>${PRODMAP[x.code] ? brl(sum(PRODMAP[x.code].map(c => stock.get(c) || 0))) : '—'}</td><td>${ok(rate(x.code)) ? '<b>' + pct(rate(x.code), 1) + '</b>' : '—'}</td></tr>`;
  pc.b.innerHTML = `<div class="grid g2"><div><h4 style="margin:0 0 6px;font:600 15px var(--serif);color:var(--good-ink)">Receitas por produto</h4><div class="tblwrap"><table class="tbl"><thead><tr><th>Conta</th><th>12 meses</th><th>% receitas</th><th>Saldo médio</th><th>Taxa implícita</th></tr></thead><tbody>${cardsV ? `<tr style="background:var(--gold-soft)"><td class="l"><b>Cartões e meios de pagamento</b> <span class="muted" style="font-size:11px">(agrupamento analítico: títulos c/ caract. de crédito, serviços de pagamento e antecipação de transações)</span></td><td><b>${brl(cardsV)}</b></td><td>${pct(div(cardsV, totR), 1)}</td><td>—</td><td>—</td></tr>` : ''}${revRows.slice(0, 40).map(x => tr(x, totR)).join('')}</tbody></table></div></div><div><h4 style="margin:0 0 6px;font:600 15px var(--serif);color:var(--crit-ink)">Despesas e custos por conta</h4><div class="tblwrap"><table class="tbl"><thead><tr><th>Conta</th><th>12 meses</th><th>% receitas</th><th>Saldo médio</th><th>Custo implícito</th></tr></thead><tbody>${expRows.slice(0, 40).map(x => tr(x, totR)).join('')}</tbody></table></div></div></div><p class="note">Taxa implícita = receita (ou despesa) de 12 meses ÷ saldo médio da conta patrimonial correspondente nas datas-base do período (ex.: rendas de empréstimos ÷ empréstimos; despesas de depósitos a prazo ÷ depósitos a prazo). Aproximação: o saldo médio usa posições trimestrais.</p>`;
};
function drawPL(host, TR, res, ui, n) {
  host.innerHTML = '';
  const wrap = el('div', 'sk-wrap'); host.appendChild(wrap);
  const W = Math.max(1120, host.clientWidth || 1120);
  const revO = TR.rev.filter(x => ui.open.has(x.code)), expO = TR.exp.filter(x => ui.open.has(x.code));
  const tot0 = Math.max(sum(TR.rev.map(x => x.v)), sum(TR.exp.map(x => x.v)));
  const foldL = g => { const big = g.ch.filter(c => c.v >= tot0 * 0.006), sm = g.ch.filter(c => c.v < tot0 * 0.006); const out = big.map(c => ({ ...c, p: g.code })); if (sm.length === 1) out.push({ ...sm[0], p: g.code }); else if (sm.length) out.push({ code: g.code + '~', name: 'Demais (' + sm.length + ' contas)', v: sum(sm.map(c => c.v)), p: g.code, tipL: sm.map(c => esc(c.name) + ': ' + brl(c.v)).join('<br>') }); return out; };
  const leafR = revO.flatMap(foldL), leafE = expO.flatMap(foldL);
  const resNode = res >= 0 ? { code: 'RES', name: lucroLbl(n), v: res, side: 'E' } : { code: 'RES', name: 'Prejuízo', v: -res, side: 'R' };
  const colR3 = TR.rev.concat(res < 0 ? [resNode] : []), colE3 = TR.exp.concat(res >= 0 ? [resNode] : []);
  const tot = Math.max(sum(colR3.map(x => x.v)), sum(colE3.map(x => x.v)));
  const counts = [leafR.length, colR3.length, 1, colE3.length, leafE.length];
  const H = Math.max(560, Math.max(...counts) * 23 + 60);
  const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, style: 'min-width:1120px' }, wrap);
  const pad = 6, top = 30, bot = 18, avail = H - top - bot;
  const k = Math.min(...counts.filter(c => c > 0).map(c => (avail - pad * (c - 1)) / tot));
  const nw = 14, xs = [230, Math.round(W * 0.36), (W - nw) / 2, Math.round(W * 0.64) - nw, W - 230 - nw];
  const hasL = leafR.length > 0, hasR = leafE.length > 0;
  if (!hasL) xs[1] = 250; if (!hasR) xs[3] = W - 250 - nw;
  const place = (arr, x) => { const h = sum(arr.map(a => a.v * k)) + pad * Math.max(0, arr.length - 1); let y = top + (avail - h) / 2; return arr.map(a => { const o = { ...a, x, y, h: Math.max(1.2, a.v * k), off: 0 }; y += o.h + pad; return o; }); };
  // ordem das folhas acompanha a ordem dos pais
  const ordR = colR3.map(x => x.code), ordE = colE3.map(x => x.code);
  leafR.sort((a, b) => ordR.indexOf(a.p) - ordR.indexOf(b.p) || b.v - a.v); leafE.sort((a, b) => ordE.indexOf(a.p) - ordE.indexOf(b.p) || b.v - a.v);
  const LR = place(leafR, xs[0]), R3 = place(colR3, xs[1]), TT = place([{ code: 'TOT', name: 'Receitas totais', v: tot }], xs[2]), E3 = place(colE3, xs[3]), LE = place(leafE, xs[4]);
  const gL = S('g', {}, svg);
  const ribbon = (x0, y0, x1, y1, h, col, tip) => {
    const mx = (x0 + x1) / 2;
    const p = S('path', { d: `M${x0},${y0}C${mx},${y0} ${mx},${y1} ${x1},${y1}L${x1},${y1 + h}C${mx},${y1 + h} ${mx},${y0 + h} ${x0},${y0 + h}Z`, fill: col, 'fill-opacity': .26, stroke: 'none', class: 'fade', style: 'transition:fill-opacity .2s' }, gL);
    p.addEventListener('pointerenter', ev => { p.setAttribute('fill-opacity', .55); tipShow(tip, ev); });
    p.addEventListener('pointermove', tipMove); p.addEventListener('pointerleave', () => { p.setAttribute('fill-opacity', .26); tipHide(); });
  };
  const byCode = arr => new Map(arr.map(a => [a.code, a]));
  const mR3 = byCode(R3), mE3 = byCode(E3), tN = TT[0];
  LR.forEach(l => { const p = mR3.get(l.p); if (!p) return; ribbon(l.x + nw, l.y, p.x, p.y + p.off, l.h, 'var(--pos)', `<b>${esc(l.name)}</b><hr>${ttRow('12 meses', brl(l.v))}${ttRow('% das receitas', pct(l.v / tot, 1))}`); p.off += l.h; });
  let tOff = 0;
  R3.forEach(r => { const col = r.code === 'RES' ? 'var(--neg)' : 'var(--pos)'; ribbon(r.x + nw, r.y, tN.x, tN.y + tOff, r.h, col, `<b>${esc(r.name)} → receitas totais</b><hr>${ttRow('12 meses', brl(r.v))}`); tOff += r.h; });
  tOff = 0;
  E3.forEach(e => { const col = e.code === 'RES' ? 'var(--pos)' : 'var(--neg)'; ribbon(tN.x + nw, tN.y + tOff, e.x, e.y, e.h, col, `<b>Receitas → ${esc(e.name)}</b><hr>${ttRow('12 meses', brl(e.v))}${ttRow('% das receitas', pct(e.v / tot, 1))}`); tOff += e.h; });
  LE.forEach(l => { const p = mE3.get(l.p); if (!p) return; ribbon(p.x + nw, p.y + p.off, l.x, l.y, l.h, 'var(--neg)', `<b>${esc(l.name)}</b><hr>${ttRow('12 meses', brl(l.v))}${ttRow('% das receitas', pct(l.v / tot, 1))}`); p.off += l.h; });
  const node_ = (a, col, lblSide, opts = {}) => {
    const g = S('g', { class: 'sk-node' }, svg);
    const r = S('rect', { class: 'nd', x: a.x, y: a.y, width: nw, height: a.h, rx: 3, fill: col }, g);
    bindTip(r, () => `<b>${esc(a.name)}</b>${a.code && /^\d{10}/.test(a.code) ? `<div style="opacity:.75">${fmtCode(a.code.slice(0, 10))}</div>` : ''}<hr>${ttRow('12 meses', brl(a.v))}${ttRow('% das receitas', pct(a.v / tot, 1))}${a.tipL ? '<hr>' + a.tipL : ''}`);
    const ty = a.y + a.h / 2;
    const tx = lblSide === 'L' ? a.x - 8 : a.x + nw + 8, an = lblSide === 'L' ? 'end' : 'start';
    const maxc = opts.maxc || 34;
    if (a.h >= 9 || opts.force) {
      const t1 = T(g, tx, ty - (a.h >= 22 ? 3 : -4), a.name.length > maxc ? a.name.slice(0, maxc - 1) + '…' : a.name, { class: 'sk-lbl', 'text-anchor': an, style: 'paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round' });
      if (a.h >= 22) T(g, tx, ty + 11, brl(a.v) + ' · ' + pct(a.v / tot, 1), { class: 'sk-val', 'text-anchor': an, style: 'paint-order:stroke;stroke:var(--surface);stroke-width:3px' });
    }
    if (opts.toggle) {
      const open = ui.open.has(a.code);
      const bx = lblSide === 'L' ? a.x + nw + 13 : a.x - 13;
      const bt = S('g', { class: 'sk-btn', 'data-code': a.code, transform: `translate(${opts.btnX != null ? opts.btnX : bx},${ty})` }, svg);
      S('circle', { r: 8 }, bt); T(bt, 0, 4, open ? '−' : '+', { 'text-anchor': 'middle' });
      bt.addEventListener('click', () => { open ? ui.open.delete(a.code) : ui.open.add(a.code); render(false); });
      bindTip(bt, () => open ? 'Recolher (drill-up)' : 'Detalhar por produto (drill-down)');
    }
  };
  LR.forEach((a, i) => node_(a, POS_RAMP[Math.min(3 + (i % 3), 6)], 'L', { maxc: 32 }));
  R3.forEach((a, i) => node_(a, a.code === 'RES' ? 'var(--neg)' : POS_RAMP[Math.min(i, 3)], hasL ? 'L' : 'L', { toggle: a.code !== 'RES' && a.ch && a.ch.length > 1, btnX: a.x + nw + 13, maxc: 30 }));
  { const g = S('g', {}, svg); S('rect', { x: tN.x, y: tN.y, width: nw, height: tN.h, rx: 3, fill: 'var(--s1)' }, g); bindTip(g, () => `<b>Receitas totais</b><hr>${ttRow('12 meses', brl(tN.v))}`); }
  E3.forEach((a, i) => node_(a, a.code === 'RES' ? 'var(--pos)' : NEG_RAMP[Math.min(i, 4)], 'R', { toggle: a.code !== 'RES' && a.ch && a.ch.length > 1, btnX: a.x - 13, maxc: 30 }));
  LE.forEach((a, i) => node_(a, NEG_RAMP[Math.min(3 + (i % 3), 6)], 'R', { maxc: 32 }));
  T(svg, xs[1] + nw / 2, 16, 'RECEITAS', { 'text-anchor': 'middle', style: 'font:700 10px var(--mono);letter-spacing:.14em;fill:var(--good-ink)' });
  T(svg, xs[3] + nw / 2, 16, 'DESPESAS E RESULTADO', { 'text-anchor': 'middle', style: 'font:700 10px var(--mono);letter-spacing:.14em;fill:var(--crit-ink)' });
  T(svg, tN.x + nw / 2, tN.y - 8, brl(tot), { 'text-anchor': 'middle', style: 'font:700 13px var(--sans);fill:var(--ink)' });
  reveal(wrap);
}

/* ---------------- CAMELS ---------------- */
const CAM = [
  ['C', 'Capital', .25, [['Índice de Basileia', m => m.ib, 1, m => { const b = capK(m); return [b + .075, b + .045, b + .025, b]; }, 'pct'], ['PL ÷ ativo', m => div(m.pl, m.at), 1, [.15, .12, .09, .06], 'pct'], ['Capital principal', m => m.icp, 1, [.15, .12, .09, .07], 'pct'], ['Razão de alavancagem', m => m.ra, 1, [.12, .09, .06, .03], 'pct']]],
  ['A', 'Qualidade dos ativos', .20, [['Atraso > 90 dias (SCR)', m => m.inadR, -1, [.02, .035, .05, .08], 'pct2'], ['Ativos problemáticos', m => m.probR, -1, [.04, .07, .1, .15], 'pct2'], ['Problema de recuperação', m => m.pbR, -1, [.03, .05, .08, .12], 'pct2'], ['Cobertura PE ÷ problemáticos', m => m.cob, 1, [1.3, 1, .8, .5], 'pct0'], ['Custo do risco', m => m.cor, -1, [.015, .025, .04, .06], 'pct2']]],
  ['M', 'Gestão (Management)', .15, [['Índice de eficiência', m => m.eff, -1, [.45, .55, .65, .8], 'pct0'], ['Despesas operacionais ÷ ativo', m => m.opxA, -1, [.03, .045, .06, .08], 'pct'], ['Cobertura por serviços', m => m.feeCov, 1, [.35, .25, .15, .08], 'pct0'], ['Descasamento crescimento carteira × PL', m => ok(m.gCrb) && ok(m.gPl) ? Math.abs(m.gCrb - m.gPl) : NaN, -1, [.05, .1, .2, .3], 'pp']]],
  ['E', 'Resultados (Earnings)', .15, [['ROA', m => m.roa, 1, [.02, .015, .01, .005], 'pct2'], ['ROE', m => m.roe, 1, [.18, .14, .1, .05], 'pct'], ['NIM', m => m.nim, 1, [.06, .045, .035, .025], 'pct'], ['Sobras ÷ carteira', m => div(m.ll, m.avg.crb), 1, [.04, .025, .015, .005], 'pct']]],
  ['L', 'Liquidez', .15, [['Ativos líquidos ÷ ativo', m => m.liqA, 1, [.35, .25, .18, .12], 'pct0'], ['Crédito ÷ captações', m => m.ltdC, -1, [.7, .85, 1, 1.15], 'pct0'], ['Depósitos ÷ captações', m => m.depShare, 1, [.85, .7, .55, .4], 'pct0']]],
  ['S', 'Sensibilidade a mercado', .10, [['Capital IRRBB ÷ PR', m => m.irrbbPR, -1, [.02, .05, .1, .15], 'pct'], ['Carteira prefixada', m => div(m.r.ix[XI.pre], m.r.ix[XI.tot]), -1, [.4, .55, .7, .85], 'pct0'], ['RWA de mercado ÷ PR (×8%)', m => m.mktPR, -1, [.01, .03, .06, .1], 'pct'], ['Pior ΔEVE ÷ nível I (modelo)', m => { if (!m.n1 || m.qi !== QI) return NaN; const R = almCalc(m.n, almDefaults(m.n)); return Math.abs(Math.min(0, ...R.eve.map(e => e.v))) / m.n1; }, -1, [.05, .1, .15, .2], 'pct']]],
];
const CAM_LBL = ['', 'Forte', 'Satisfatório', 'Razoável', 'Marginal', 'Insatisfatório'];
const CAM_COL = ['', '#17712F', '#5CA14A', '#D2A23F', '#E07A4B', '#C8372D'];
const grade = (x, dir, cuts) => { if (!ok(x)) return NaN; for (let i = 0; i < 4; i++) if (dir > 0 ? x >= cuts[i] : x <= cuts[i]) return i + 1; return 5; };
function camelsOf(m) {
  const comp = CAM.map(([L, t, w, items]) => { const it = items.map(([l, f, d, c0, fm]) => { const x = f(m), c = typeof c0 === 'function' ? c0(m) : c0; return { l, x, g: grade(x, d, c), c, d, fm }; }); const gs = it.map(i => i.g).filter(ok); return { L, t, w, it, s: gs.length ? mean(gs) : NaN }; });
  let tw = 0, ts = 0; comp.forEach(c => { if (ok(c.s)) { tw += c.w; ts += c.w * c.s; } });
  return { comp, s: tw ? ts / tw : NaN };
}
VIEWS.camels = (V, n) => {
  const m = metrics(n), C = camelsOf(m), g = Math.round(C.s);
  head(V, 'Análises · CAMELS', 'CAMELS por indicadores públicos — ' + esc(nameOf(n)), 'Capital, qualidade dos Ativos, gestão (Management), resultados (Earnings), Liquidez e Sensibilidade a mercado. Cada indicador recebe nota de 1 (forte) a 5 (insatisfatório) por faixas; a nota composta pondera os seis componentes. Calibração ilustrativa do Radar — não é a nota supervisória.');

  { const vh_ = V.querySelector('.vh'); if (vh_) vh_.insertAdjacentElement('afterend', el('div', 'take', 'CAMELS é um sistema de avaliação de supervisores; aqui é uma <b>aproximação com indicadores públicos</b>. O pilar de gestão (M) usa eficiência contábil, que não substitui a avaliação de governança e controles.')); }
  const K = el('div', 'kpis'); V.appendChild(K);
  kpi(K, { l: 'CAMELS composto', v: `<span style="font-family:var(--serif);font-size:30px;color:${CAM_COL[g] || 'var(--ink)'}">${ok(C.s) ? dec(C.s, 2) : '—'}</span>`, d: ok(g) ? `nota ${g} · ${CAM_LBL[g]}` : '', cls: 'accent', fx: 'camels' });
  C.comp.forEach(c => kpi(K, { l: c.L + ' · ' + c.t, v: `<span style="color:${CAM_COL[Math.round(c.s)] || 'var(--ink)'}">${ok(c.s) ? dec(c.s, 1) : '—'}</span>`, d: ok(c.s) ? CAM_LBL[Math.round(c.s)] : 's/ dado', fx: 'camels' }));
  const G = grid(V); G.classList.add('mt');
  C.comp.forEach(c => {
    const cc = card(G, { cls: 'c4', title: c.L + ' · ' + c.t, sub: 'peso ' + int(c.w * 100) + '% · nota ' + (ok(c.s) ? dec(c.s, 1) : '—'), fx: 'camels' });
    cc.b.innerHTML = `<div class="letter"><div class="L" style="background:linear-gradient(150deg,${CAM_COL[Math.round(c.s)] || 'var(--s1)'},var(--navy))">${c.L}</div><div><h4>${c.t}</h4><p>${ok(c.s) ? CAM_LBL[Math.round(c.s)] : 'sem dados suficientes'}</p></div></div><div class="tblwrap mt" style="max-height:none"><table class="tbl camtbl"><thead><tr><th>Indicador · faixas das notas 1 a 4</th><th>Valor</th><th>Nota</th></tr></thead><tbody>${c.it.map(i => `<tr><td class="l">${i.l}<small>${i.d > 0 ? '≥' : '≤'} ${i.c.map(fmtBy(i.fm)).join(' · ')}</small></td><td><b>${ok(i.x) ? fmtBy(i.fm)(i.x) : 'n/a'}</b></td><td><span class="pill" style="color:#fff;background:${CAM_COL[i.g] || 'var(--ink-3)'};border-color:transparent">${ok(i.g) ? i.g : '—'}</span></td></tr>`).join('')}</tbody></table></div>`;
  });
  const rd = card(G, { cls: 'c5', title: 'Radar CAMELS', sub: 'Quanto maior a área, mais forte (6 − nota) · comparado ao grupo', fx: 'camels' });
  const grp = node(n.grp === 'bank' ? 'G:bank' : 'G:coop'), Cg = camelsOf(metrics(grp));
  radarChart(chartEl(rd.b, 300), C.comp.map(c => c.L + ' · ' + c.t.split(' ')[0]), [{ name: n.name, color: 'var(--s1)', values: C.comp.map(c => ok(c.s) ? (6 - c.s) / 5 : 0) }, { name: grp.name + ' (soma)', color: 'var(--s2)', values: Cg.comp.map(c => ok(c.s) ? (6 - c.s) / 5 : 0) }], { size: 300, fmt: x => dec(6 - x * 5, 1) });
  const tr = card(G, { cls: 'c7', title: 'CAMELS ao longo do tempo', sub: 'Nota composta e por componente em cada data-base (1 = forte)', fx: 'traj' });
  const hist = D.Q.slice(0, QI + 1).map((_, q) => camelsOf(metricsAt(n, q)));
  lineChart(chartEl(tr.b, 200), { cats: qcats(), series: [{ name: 'Composto', color: 'var(--s1)', values: hist.map(h => h.s) }, { name: 'Mediana do grupo', color: 'var(--s5)', values: D.Q.slice(0, QI + 1).map((_, q) => camelsOf(metricsAt(grp, q)).s), dash: '5 4' }], fmt: x => dec(x, 2), h: 200, min: 1, max: 5 });
  const hm = el('div', 'tblwrap mt'); hm.style.maxHeight = 'none';
  hm.innerHTML = `<table class="tbl"><thead><tr><th>Componente</th>${hist.map((_, i) => `<th>${qlab(D.Q[i])}</th>`).join('')}</tr></thead><tbody>${CAM.map((c, ci) => `<tr><td class="l"><b>${c[0]}</b> · ${c[1]}</td>${hist.map(h => { const s = h.comp[ci].s; return `<td style="background:${ok(s) ? `color-mix(in srgb,${CAM_COL[Math.round(s)]} 22%,var(--surface))` : 'transparent'};font-weight:600">${ok(s) ? dec(s, 1) : '—'}</td>`; }).join('')}</tr>`).join('')}</tbody></table>`;
  tr.b.appendChild(hm);
  const ds = card(G, { cls: 'c12', title: 'Distribuição do CAMELS composto', sub: 'Entre as ' + peerLbl(n) + ' na data-base', fx: 'camels' });
  const allS = peersOf(n).map(e => camelsOf(metrics(node(e.id))).s).filter(ok);
  histogram(chartEl(ds.b, 170), allS, { fmt: x => dec(x, 1), marker: C.s, markerLabel: n.name.slice(0, 22) + ': ' + dec(C.s, 2), min: 1, max: 5, bins: 24, h: 170, colorFn: x => CAM_COL[Math.min(5, Math.max(1, Math.round(x)))] });
};

/* ---------------- PEARLS ---------------- */
const PEA = [
  ['P', 'Proteção', [['P1* · Perda esperada ÷ atraso > 90 dias (aprox.)', m => m.cobI, '≥ 100%', x => x >= 1, x => x >= .8, 'pct0'], ['P2* · Perda esperada ÷ ativos problemáticos (aprox.)', m => m.cob, '≥ 35%', x => x >= .35, x => x >= .25, 'pct0'], ['P6 · Solvência (aprox.)', m => { const cs = m.cz ? m.cz.capsoc : 0; const den = m.dep + cs; return den ? (m.at - (m.pex - m.dep) - Math.max(0, m.prob - m.pe)) / den : NaN; }, '≥ 111%', x => x >= 1.11, x => x >= 1.0, 'pct0']]],
  ['E', 'Estrutura financeira efetiva', [['E1 · Crédito líquido ÷ ativo', m => div(m.crl, m.at), '70% a 80%', x => x >= .7 && x <= .8, x => x >= .6 && x <= .85, 'pct0'], ['E2 · Investimentos líquidos ÷ ativo', m => div(m.aplic + m.tvm + m.cent, m.at), '≤ 16%', x => x <= .16, x => x <= .25, 'pct0'], ['E5 · Depósitos ÷ ativo', m => div(m.dep, m.at), '70% a 80%', x => x >= .7 && x <= .8, x => x >= .6 && x <= .85, 'pct0'], ['E7 · Capital social ÷ ativo', m => m.cz ? div(m.cz.capsoc, m.at) : NaN, '≤ 20%', x => x <= .2, x => x <= .25, 'pct'], ['E8 · Capital institucional (reservas) ÷ ativo', m => m.cz ? div(m.cz.res, m.at) : NaN, '≥ 10%', x => x >= .1, x => x >= .07, 'pct']]],
  ['A', 'Qualidade dos ativos', [['A1 · Inadimplência ÷ carteira', m => m.inadR, '≤ 5%', x => x <= .05, x => x <= .07, 'pct2'], ['A2 · Ativos improdutivos ÷ ativo', m => div(m.perm + m.disp, m.at), '≤ 5%', x => x <= .05, x => x <= .07, 'pct']]],
  ['R', 'Rentabilidade e custos', [['R1 · Rendimento da carteira', m => m.yld, 'taxa de mercado', x => x >= .12, x => x >= .09, 'pct'], ['R5 · Custo das captações vs inflação', m => m.cof, '≥ IPCA 12m', x => x >= (sgLast('ipca12').v / 100 || 0), x => x >= (sgLast('ipca12').v / 100 || 0) * .8, 'pct'], ['R9 · Despesas operacionais ÷ ativo', m => m.opxA, '≤ 5%', x => x <= .05, x => x <= .065, 'pct'], ['R12 · Resultado ÷ ativo médio (ROA)', m => m.roa, '≥ 1%', x => x >= .01, x => x >= .005, 'pct2']]],
  ['L', 'Liquidez', [['L1 · (Ativos líquidos − compromissadas) ÷ depósitos', m => div(m.liq - m.comp, m.dep), '15% a 20% (mín.)', x => x >= .15, x => x >= .1, 'pct0'], ['L3 · Ativos líquidos improdutivos ÷ ativo', m => div(m.disp, m.at), '< 1%', x => x < .01, x => x < .02, 'pct2']]],
  ['S', 'Sinais de crescimento (12m)', [['S1 · Carteira de crédito', m => m.gCrb, '> inflação', x => x > (sgLast('ipca12').v / 100 || 0), x => x > 0, 'pct'], ['S5 · Depósitos', m => m.gDep, '> inflação', x => x > (sgLast('ipca12').v / 100 || 0), x => x > 0, 'pct'], ['S8 · Capital institucional (reservas)', m => { const r = m.r.CZ; if (!r || QI < 4 || !r[QI] || !r[QI - 4]) return NaN; return div(r[QI][CI.res], r[QI - 4][CI.res]) - 1; }, '> crescimento do ativo', (x, m) => x > (m.gAt || 0), x => x > 0, 'pct'], ['S11 · Ativo total', m => m.gAt, '> inflação + 10%', x => x > (sgLast('ipca12').v / 100 || 0) + .1, x => x > (sgLast('ipca12').v / 100 || 0), 'pct']]],
];
function pearlsOf(m) {
  return PEA.map(([L, t, items]) => { const it = items.map(([l, f, goal, okF, nearF, fm]) => { const x = f(m); const st = !ok(x) ? 'na' : okF(x, m) ? 'good' : nearF(x, m) ? 'warn' : 'crit'; return { l, x, goal, st, fm }; }); const v = it.filter(i => i.st !== 'na'); return { L, t, it, sc: v.length ? (v.filter(i => i.st === 'good').length + .5 * v.filter(i => i.st === 'warn').length) / v.length : NaN }; });
}
VIEWS.pearls = (V, n) => {
  const m = metrics(n), P = pearlsOf(m);
  head(V, 'Análises · PEARLS', 'PEARLS adaptado — ' + esc(nameOf(n)), 'O sistema de monitoramento do Conselho Mundial de Cooperativas de Crédito (WOCCU): Proteção, Estrutura financeira Efetiva, qualidade dos Ativos, Rentabilidade e custos, Liquidez e Sinais de crescimento. Cada indicador tem uma meta; aqui as metas do WOCCU são aplicadas aos dados do Bacen (algumas por aproximação, indicadas).');

  { const vh_ = V.querySelector('.vh'); if (vh_) vh_.insertAdjacentElement('afterend', el('div', 'take', 'PEARLS (WOCCU) <b>adaptado</b>: P1 e P2 originais exigem provisão sobre atrasos de 1–12 e de mais de 12 meses, que os dados públicos não trazem — aqui usam atraso > 90 dias e ativos problemáticos (marcados com *). Metas locais quando indicadas.')); }
  const all = P.flatMap(p => p.it).filter(i => i.st !== 'na');
  const K = el('div', 'kpis'); V.appendChild(K);
  kpi(K, { l: 'Metas atingidas', v: `${all.filter(i => i.st === 'good').length} / ${all.length}`, d: pct(div(all.filter(i => i.st === 'good').length, all.length), 0) + ' dos indicadores', cls: 'accent', fx: 'pearls' });
  P.forEach(p => kpi(K, { l: p.L + ' · ' + p.t, v: ok(p.sc) ? pct(p.sc, 0) : '—', d: p.it.filter(i => i.st === 'good').length + ' de ' + p.it.filter(i => i.st !== 'na').length + ' metas', fx: 'pearls' }));
  const G = grid(V); G.classList.add('mt');
  P.forEach(p => {
    const c = card(G, { cls: 'c6', title: p.L + ' · ' + p.t, sub: 'Meta WOCCU × valor na data-base', fx: 'pearls' });
    c.b.innerHTML = `<div class="tblwrap" style="max-height:none"><table class="tbl"><thead><tr><th>Indicador</th><th>Valor</th><th>Meta</th><th>Status</th></tr></thead><tbody>${p.it.map(i => `<tr><td class="l">${i.l}</td><td><b>${ok(i.x) ? fmtBy(i.fm)(i.x) : 'n/a'}</b></td><td class="muted">${i.goal}</td><td><span class="st ${i.st}"><i>${ST_IC[i.st]}</i>${i.st === 'good' ? 'atinge' : i.st === 'warn' ? 'próximo' : i.st === 'crit' ? 'fora' : 's/ dado'}</span></td></tr>`).join('')}</tbody></table></div>`;
  });
  const sm = card(G, { cls: 'c6', title: 'Aderência por letra', sub: 'Proporção das metas atingidas (meio ponto para "próximo")', fx: 'pearls' });
  hbars(chartEl(sm.b, 190), P.map(p => ({ label: p.L + ' · ' + p.t, value: p.sc, color: p.sc >= .75 ? 'var(--pos)' : p.sc >= .5 ? 'var(--s4)' : 'var(--neg)' })), { fmt: x => pct(x, 0), max: 1, lw: 220 });
  const ts = card(G, { cls: 'c6', title: 'Estrutura e qualidade ao longo do tempo', sub: 'E1 (crédito líquido ÷ ativo), E5 (depósitos ÷ ativo) e A1 (inadimplência)', fx: 'traj' });
  const H = q => metricsAt(n, q);
  lineChart(chartEl(ts.b, 200), { cats: qcats(), series: [{ name: 'E1', color: 'var(--s1)', values: D.Q.slice(0, QI + 1).map((_, q) => div(H(q).crl, H(q).at)) }, { name: 'E5', color: 'var(--s2)', values: D.Q.slice(0, QI + 1).map((_, q) => div(H(q).dep, H(q).at)) }], refs: [{ y: .7, label: 'meta E1/E5 ≥ 70%', color: 'var(--s5)' }], h: 170, fmt: x => pct(x, 0) });
  lineChart(chartEl(ts.b, 150), { cats: qcats(), series: [{ name: 'A1* · atraso > 90 dias', color: 'var(--neg)', values: m.q.inad }], refs: [{ y: .05, label: 'meta A1 ≤ 5%', color: 'var(--s5)' }], h: 150, fmt: x => pct(x, 1) });   // escala própria: a inadimplência não fica espremida junto de razões perto de 70%
  V.appendChild(el('p', 'note', 'Aproximações: P6 usa ativo − (passivo exigível − depósitos) − ativos problemáticos não provisionados sobre depósitos + capital social; E7/E8 usam capital social e reservas de lucros do balancete 4010/4060; A2 usa ativo permanente + disponibilidades. Referência: WOCCU, PEARLS Monitoring System; Bressan et al. (2011).'));
};

/* ---------------- RAS ---------------- */
const RASD = [
  ['Capital', [['Índice de Basileia', 'ib', 1, .15, .13, .105, 'pct'], ['Capital principal', 'icp', 1, .11, .09, .07, 'pct'], ['Razão de alavancagem', 'ra', 1, .06, .045, .03, 'pct']]],
  ['Liquidez', [['Ativos líquidos ÷ ativo', 'liqA', 1, .25, .18, .12, 'pct0'], ['Crédito ÷ captações', 'ltdC', -1, .85, 1, 1.15, 'pct0'], ['Depósitos ÷ captações', 'depShare', 1, .75, .6, .45, 'pct0']]],
  ['Crédito', [['Atraso > 90 dias (SCR)', 'inadR', -1, .03, .05, .07, 'pct2'], ['Problema de recuperação', 'pbR', -1, .04, .06, .09, 'pct2'], ['Custo do risco', 'cor', -1, .02, .035, .05, 'pct2'], ['Concentração na maior modalidade', 'conc', -1, .35, .45, .6, 'pct0']]],
  ['Mercado e IRRBB', [['Capital IRRBB ÷ PR', 'irrbbPR', -1, .05, .1, .15, 'pct'], ['RWA de mercado × 8% ÷ PR', 'mktPR', -1, .03, .06, .1, 'pct']]],
  ['Rentabilidade', [['ROE', 'roe', 1, .15, .1, .05, 'pct'], ['Índice de eficiência', 'eff', -1, .55, .65, .8, 'pct0']]],
  ['Crescimento', [['Crescimento da carteira 12m', 'gCrb', -1, .2, .3, .4, 'pct'], ['Carteira − PL (crescimento)', 'gGap', -1, .05, .1, .15, 'pp']]],
];
function rasVal(m, k) {
  if (k === 'conc') { const t = [...(m.r.pf || []), ...(m.r.pj || [])].map(r => sum(r)); const s = sum(t); return s ? Math.max(...t) / s : NaN; }
  if (k === 'gGap') return ok(m.gCrb) && ok(m.gPl) ? m.gCrb - m.gPl : NaN;
  return m[k];
}
function rasLim(base, dir, prof, cap) { if (prof === 'cons') return dir > 0 ? Math.min(base * 1.15, cap * 1.6 || base * 1.15) : base * .85; if (prof === 'arr') return dir > 0 ? Math.max(base * .9, cap) : Math.min(base * 1.15, cap); return base; }
function rasStatus(x, dir, a, t, c) { if (!ok(x)) return 'na'; if (dir > 0) return x >= a ? 'good' : x >= t ? 'warn' : x >= c ? 'serious' : 'crit'; return x <= a ? 'good' : x <= t ? 'warn' : x <= c ? 'serious' : 'crit'; }
VIEWS.ras = (V, n) => {
  const ui = ST.ui.ras || (ST.ui.ras = { prof: 'mod' });
  const m = metrics(n);
  head(V, 'Análises · RAS', 'Limites de referência (estilo RAS) — ' + esc(nameOf(n)), 'Declaração de apetite por riscos: para cada dimensão, o <b>apetite</b> (zona-alvo), a <b>tolerância</b> (alerta) e a <b>capacidade</b> (limite que não pode ser rompido). Escolha um perfil e veja o consumo do apetite na data-base e o histórico de aderência. Limites ilustrativos do Radar, inspirados na Res. CMN 4.557/2017.');

  { const vh_ = V.querySelector('.vh'); if (vh_) vh_.insertAdjacentElement('afterend', el('div', 'take', 'A RAS é um documento interno aprovado pelo conselho da própria instituição (Res. CMN 4.557). Esta tela usa <b>limites de referência externos</b>, no formato de uma RAS, para leitura comparativa.')); }
  const bar = el('div', 'ctlbar'); V.appendChild(bar);
  bar.appendChild(filt('Perfil de apetite', segCtl([['cons', 'Conservador'], ['mod', 'Moderado'], ['arr', 'Arrojado']], ui.prof, k => { ui.prof = k; render(false); }), 'sm'));
  const rows = RASD.flatMap(([dim, L]) => L.map(([l, k, dir, a, t, c, fm]) => { if (k === 'ib' && ok(m.capMin)) { const d_ = m.capMin - c; a += d_; t += d_; c = m.capMin; } const A_ = rasLim(a, dir, ui.prof, c), T_ = rasLim(t, dir, ui.prof, c); const x = rasVal(m, k); return { dim, l, k, dir, a: A_, t: T_, c, fm, x, st: rasStatus(x, dir, A_, T_, c) }; }));
  const cnt = s => rows.filter(r => r.st === s).length;
  const K = el('div', 'kpis'); V.appendChild(K);
  kpi(K, { l: 'Dentro do apetite', v: cnt('good') + ' / ' + rows.filter(r => r.st !== 'na').length, d: '<span class="st good"><i>✓</i>apetite</span>', cls: 'accent', fx: 'ras' });
  kpi(K, { l: 'Na tolerância', v: String(cnt('warn')), d: '<span class="st warn"><i>!</i>alerta</span>', fx: 'ras' });
  kpi(K, { l: 'Além da tolerância', v: String(cnt('serious')), d: '<span class="st serious"><i>!</i>ação</span>', fx: 'ras' });
  kpi(K, { l: 'Capacidade rompida', v: String(cnt('crit')), d: '<span class="st crit"><i>×</i>limite</span>', fx: 'ras' });
  const G = grid(V); G.classList.add('mt');
  const bc = card(G, { cls: 'c12', title: 'Painel do apetite a riscos', sub: 'Faixas: verde = apetite · âmbar = tolerância · laranja = além da tolerância · vermelho = além da capacidade · marcador = valor atual', fx: 'ras' });
  let h = '<div class="ras">', last = '';
  rows.forEach(r => {
    if (r.dim !== last) { h += `<div style="font:700 10px var(--mono);letter-spacing:.14em;color:var(--gold-ink);margin-top:8px">${r.dim.toUpperCase()}</div>`; last = r.dim; }
    const lo = r.dir > 0 ? Math.min(r.c * .6, ok(r.x) ? r.x * .9 : r.c * OPX_CRED) : 0, hi = r.dir > 0 ? Math.max(r.a * 1.5, ok(r.x) ? r.x * 1.1 : 0) : Math.max(r.c * 1.35, ok(r.x) ? r.x * 1.1 : 0);
    const P_ = v => clamp((v - lo) / ((hi - lo) || 1) * 100, 0, 100);
    const zones = r.dir > 0 ? [[lo, r.c, 'var(--crit)'], [r.c, r.t, 'var(--serious)'], [r.t, r.a, 'var(--warn)'], [r.a, hi, 'var(--good)']] : [[lo, r.a, 'var(--good)'], [r.a, r.t, 'var(--warn)'], [r.t, r.c, 'var(--serious)'], [r.c, hi, 'var(--crit)']];
    const f = fmtBy(r.fm);
    h += `<div class="r"><span>${r.l}</span><div class="bb">${zones.map(([z0, z1, col]) => `<span style="width:${Math.max(0, P_(z1) - P_(z0))}%;background:color-mix(in srgb,${col} 32%,var(--surface))"></span>`).join('')}${ok(r.x) ? `<i style="left:calc(${P_(r.x)}% - 1.5px)"></i>` : ''}</div><b class="tnum" style="text-align:right">${ok(r.x) ? f(r.x) : 'n/a'}</b><span class="lim">${r.dir > 0 ? '≥' : '≤'} ${f(r.a)} · ${f(r.t)} · ${f(r.c)}</span></div>`;
  });
  bc.b.innerHTML = h + '</div>';
  const hm = card(G, { cls: 'c7', title: 'Histórico de aderência ao apetite', sub: 'Status de cada métrica em cada data-base (mesmo perfil)', fx: 'ras' });
  const qs = range(0, QI);
  const COLS = { good: 'var(--good)', warn: 'var(--warn)', serious: 'var(--serious)', crit: 'var(--crit)', na: 'var(--surface-3)' };
  hm.b.innerHTML = `<div class="tblwrap" style="max-height:none"><table class="tbl"><thead><tr><th>Métrica</th>${qs.map(q => `<th>${qlab(D.Q[q])}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr><td class="l">${r.l}</td>${qs.map(q => { const x = rasVal(metricsAt(n, q), r.k); const s = rasStatus(x, r.dir, r.a, r.t, r.c); return `<td title="${ok(x) ? fmtBy(r.fm)(x) : 'n/a'}"><span style="display:inline-block;width:26px;height:14px;border-radius:4px;background:color-mix(in srgb,${COLS[s]} ${s === 'na' ? 100 : 75}%,transparent)"></span></td>`; }).join('')}</tr>`).join('')}</tbody></table></div>`;
  const st = card(G, { cls: 'c5', title: 'Declaração (gerada)', sub: 'Texto-base de RAS para o comitê', fx: 'ras' });
  const prof = { cons: 'conservador', mod: 'moderado', arr: 'arrojado' }[ui.prof];
  const br = rows.filter(r => r.st === 'serious' || r.st === 'crit');
  st.b.innerHTML = `<div style="font-family:var(--serif);font-size:14.5px;line-height:1.65;color:var(--ink-2)"><p style="margin:0 0 8px"><b style="color:var(--ink)">${esc(nameOf(n))}</b> adota perfil de apetite <b>${prof}</b>. Declara que manterá índice de Basileia de ao menos <b>${pct(rows[0].a, 1)}</b> (tolerância ${pct(rows[0].t, 1)}; limite ${pct(rows[0].c, 1)}), ativos líquidos de pelo menos <b>${pct(rows.find(r => r.k === 'liqA').a, 0)}</b> do ativo e inadimplência de até <b>${pct(rows.find(r => r.k === 'inadR').a, 1)}</b>, com custo do risco limitado a ${pct(rows.find(r => r.k === 'cor').a, 1)} da carteira e capital IRRBB de até ${pct(rows.find(r => r.k === 'irrbbPR').a, 0)} do PR.</p><p style="margin:0">Na data-base ${mlab(D.Q[QI])}, <b>${cnt('good')}</b> métricas estão dentro do apetite${br.length ? `; exigem plano de ação: <b>${br.map(r => r.l + ' (' + fmtBy(r.fm)(r.x) + ')').join('; ')}</b>.` : ' e nenhuma rompe a tolerância.'}</p></div>`;
};

/* ---------------- séries adicionais nas telas existentes ---------------- */
const _V = Object.assign({}, VIEWS);
const extra = (V, cards) => { const G = grid(V); G.classList.add('mt'); cards(G); };
VIEWS.dre = (V, n) => { _V.dre(V, n); extra(V, G => giCard(G, n)); };
VIEWS.credito = (V, n) => { _V.credito(V, n); const m = metrics(n); extra(V, G => {
  const c1 = card(G, { cls: 'c6', title: 'Estágios de risco ao longo do tempo', sub: 'Estágios 2 e 3 na metodologia completa e problema de recuperação nas duas metodologias (balancetes)', fx: 'stages' });
  lineChart(chartEl(c1.b, 200), { cats: qcats(), series: [{ name: 'Estágio 2 (completa)', color: 'var(--s4)', values: m.q.e2 }, { name: 'Estágio 3 (completa)', color: 'var(--neg)', values: m.q.e3 }, { name: 'Problema de recuperação (ambas)', color: 'var(--neg-3)', values: m.q.pb, dash: '5 4' }], h: 200, fmt: x => pct(x, 1) });
  const c2 = card(G, { cls: 'c6', title: 'Carteira, perda esperada e cobertura', sub: 'Carteira bruta (barras) e cobertura PE ÷ problemáticos', fx: 'cob' });
  barChart(chartEl(c2.b, 130), { cats: qcats(), series: [{ name: 'Carteira bruta', values: m.H('crb'), color: 'var(--s1)' }, { name: 'Perda esperada (estoque)', values: m.H('pec').map(x => Math.abs(x)), color: 'var(--neg-2)' }], fmt: brl, h: 150 });
  lineChart(chartEl(c2.b, 120), { cats: qcats(), series: [{ name: 'Cobertura', color: 'var(--s2)', values: m.q.cob }], h: 120, fmt: x => pct(x, 0) });
  if (m.r.m && m.r.m[0].length >= 3) { const c3 = card(G, { cls: 'c12', title: 'Estágio 3 mensal', sub: 'Balancete ' + (n.grp === 'bank' ? '4060' : '4010') + ' · estágio 3 ÷ carteira de crédito', fx: 'mensal' }); const e3 = m.r.m[MI.e3], cr = m.r.m[MI.cr]; lineChart(chartEl(c3.b, 190), { cats: mcats(), series: [{ name: 'Estágio 3 ÷ crédito', color: 'var(--neg)', values: e3.map((x, i) => div(x, cr[i])) }, { name: 'Estágio 2 ÷ crédito', color: 'var(--s4)', values: m.r.m[MI.e2].map((x, i) => div(x, cr[i])) }], h: 190, fmt: x => pct(x, 1) }); }
}); };
VIEWS.capital = (V, n) => { _V.capital(V, n); const m = metrics(n); extra(V, G => {
  const c1 = card(G, { cls: 'c6', title: 'RWA por tipo de risco · trimestral', sub: 'Crédito, mercado e operacional', fx: 'rwa' });
  barChart(chartEl(c1.b, 220), { cats: qcats(), stacked: true, series: [{ name: 'Crédito', values: m.H('rwac'), color: 'var(--s1)' }, { name: 'Mercado', values: m.H('rwam'), color: 'var(--s2)' }, { name: 'Operacional', values: m.H('rwao'), color: 'var(--s5)' }], fmt: brl, h: 220 });
  const c2 = card(G, { cls: 'c6', title: 'Patrimônio de referência por nível · trimestral', sub: 'Capital principal, complementar e nível II', fx: 'pr' });
  barChart(chartEl(c2.b, 220), { cats: qcats(), stacked: true, series: [{ name: 'Capital principal', values: m.H('cp'), color: 'var(--s1)' }, { name: 'Capital complementar', values: m.H('at1'), color: 'var(--s7)' }, { name: 'Nível II', values: m.H('n2'), color: 'var(--s2)' }], fmt: brl, h: 220 });
}); };
VIEWS.mercado = (V, n) => { _V.mercado(V, n); const m = metrics(n); extra(V, G => {
  const c1 = card(G, { cls: 'c6', title: 'Tesouraria · trimestral', sub: 'Disponibilidades, aplicações interfinanceiras e TVM', fx: 'tes' });
  barChart(chartEl(c1.b, 220), { cats: qcats(), stacked: true, series: [{ name: 'Disponibilidades', values: m.H('disp'), color: 'var(--s6)' }, { name: 'Aplicações', values: m.H('aplic'), color: 'var(--s7)' }, { name: 'TVM', values: m.H('tvm'), color: 'var(--s1)' }], fmt: brl, h: 220 });
  const c2 = card(G, { cls: 'c6', title: 'Requisitos de mercado e IRRBB · trimestral', sub: '% do patrimônio de referência', fx: 'irrbb' });
  lineChart(chartEl(c2.b, 220), { cats: qcats(), series: [{ name: 'RWA mercado × 8% ÷ PR', color: 'var(--s2)', values: m.q.mktPR }, { name: 'Capital IRRBB ÷ PR', color: 'var(--s1)', values: m.q.irrbb }], h: 220, fmt: x => pct(x, 1) });
}); };
VIEWS.alm = (V, n) => { _V.alm(V, n); const m = metrics(n); extra(V, G => {
  const c1 = card(G, { cls: 'c7', title: 'Funding por tipo · trimestral', sub: 'Composição das captações', fx: 'capt' });
  barChart(chartEl(c1.b, 230), { cats: qcats(), stacked: true, series: [{ name: 'À vista', values: m.H('dvis'), color: 'var(--s7)' }, { name: 'Poupança', values: m.H('dpou'), color: 'var(--s6)' }, { name: 'A prazo', values: m.H('dpra'), color: 'var(--s1)' }, { name: 'LCA/LCI/LF', values: m.H('lca').map((x, i) => x + m.H('lci')[i] + m.H('lf')[i]), color: 'var(--s2)' }, { name: 'Repasses', values: m.H('emr'), color: 'var(--s5)' }], fmt: brl, h: 230 });
  const c2 = card(G, { cls: 'c5', title: 'Liquidez e alavancagem de funding · trimestral', sub: 'Crédito ÷ captações e ativos líquidos ÷ ativo', fx: 'ltd' });
  lineChart(chartEl(c2.b, 230), { cats: qcats(), series: [{ name: 'Crédito ÷ captações', color: 'var(--s1)', values: m.q.ltdC }, { name: 'Ativos líquidos ÷ ativo', color: 'var(--s2)', values: m.q.liqA }], h: 230, fmt: x => pct(x, 0) });
}); };
VIEWS.dfc = (V, n) => { _V.dfc(V, n); const m = metrics(n); extra(V, G => {
  const c1 = card(G, { cls: 'c12', title: 'Caixa e equivalentes · trimestral', sub: 'Disponibilidades + aplicações interfinanceiras e variação no trimestre', fx: 'dfc' });
  const cash = m.H('disp').map((x, i) => x + m.H('aplic')[i]);
  barChart(chartEl(c1.b, 210), { cats: qcats(), series: [{ name: 'Variação no trimestre', values: cash.map((x, i) => i ? x - cash[i - 1] : NaN), colors: cash.map((x, i) => i && x - cash[i - 1] < 0 ? 'var(--neg)' : 'var(--pos)') }], lines: [{ name: 'Caixa e equivalentes', values: cash, color: 'var(--s1)' }], fmt: brl, h: 210 });
}); };
VIEWS.nii = (V, n) => { _V.nii(V, n); extra(V, G => giCard(G, n)); };
VIEWS.balancete = (V, n) => { _V.balancete(V, n); const m = metrics(n); if (!(m.r.m && m.r.m[0].length >= 3)) return; extra(V, G => {
  const c = card(G, { cls: 'c12', title: 'Evolução mensal das principais linhas', sub: 'Ativo, crédito, depósitos, letras e PL · balancete ' + (n.grp === 'bank' ? '4060' : '4010'), fx: 'mensal' });
  const mm = k => m.r.m[MI[k]];
  lineChart(chartEl(c.b, 230), { cats: mcats(), series: [{ name: 'Ativo', color: 'var(--s1)', values: mm('at') }, { name: 'Crédito', color: 'var(--s2)', values: mm('cr') }, { name: 'Depósitos', color: 'var(--s7)', values: mm('dp') }, { name: 'PL', color: 'var(--s5)', values: mm('pl') }], fmt: brl, h: 230 });
}); };
VIEWS.rating = (V, n) => { _V.rating(V, n); extra(V, G => {
  const c = card(G, { cls: 'c12', title: 'Trajetória do score Radar', sub: 'Score recalculado em cada data-base · tracejado = mediana dos pares', fx: 'rating' });
  const sc = D.Q.slice(0, QI + 1).map((_, q) => { const k_ = QI; setBase(q); const s = ratingOf(n).score; setBase(k_); return s; });
  lineChart(chartEl(c.b, 190), { cats: qcats(), series: [{ name: n.name, color: 'var(--s1)', values: sc, area: true }], refs: [{ y: 80, label: 'AA', color: 'var(--good)' }, { y: 60, label: 'BBB', color: 'var(--warn)' }], fmt: x => int(x), h: 190, min: 0, max: 100 });
}); };



/* leitura de uma série trimestral curta (até 6 pontos): só o que o histórico sustenta; lacunas não são atravessadas */
function tsReadTable(list, M) {
  const isBal = M.f === 'brl', ipca = sgv('ipca12', D.Q[QI]);
  const rd = s0 => {
    const v = (s0 || []).slice(0, QI + 1).map(x => ok(x) ? x : NaN), n = v.length, last = v[n - 1], prev = v[n - 2], y4 = n >= 5 ? v[n - 5] : NaN;
    const r = {};
    if (isBal) {
      r.tri = prev > 0 && ok(last) ? pct(last / prev - 1, 1) : '—';
      r.a12 = y4 > 0 && ok(last) ? pct(last / y4 - 1, 1) : '—';
      r.real = y4 > 0 && ok(last) && ok(ipca) ? pct((last / y4) / (1 + ipca) - 1, 1) : '—';
      const b0 = v.find(x => ok(x)); r.b100 = b0 > 0 && ok(last) ? dec(last / b0 * 100, 1) : '—';
      let pk = -Infinity, dd = 0; v.forEach(x => { if (!ok(x)) return; pk = Math.max(pk, x); if (pk > 0) dd = Math.min(dd, x / pk - 1); }); r.dd = pct(dd, 1);
    } else {
      r.tri = ok(last) && ok(prev) ? pp(last - prev, 2, true) : '—';
      r.a12 = ok(last) && ok(y4) ? pp(last - y4, 2, true) : '—';
    }
    const w4 = v.slice(-4); r.ma = n >= 4 && w4.every(ok) ? M.fmt(mean(w4)) : '—';
    const vv = v.filter(ok); r.amp = vv.length >= 3 ? M.fmt(Math.max(...vv) - Math.min(...vv)) : '—';
    r.sd = vv.length >= 3 ? M.fmt(Math.sqrt(vv.reduce((s_, x) => s_ + (x - mean(vv)) ** 2, 0) / (vv.length - 1))) : '—';
    const xs = v.map((x, i) => [i, x]).filter(p_ => ok(p_[1]));
    if (xs.length >= 3) { const mx = mean(xs.map(p_ => p_[0])), my = mean(xs.map(p_ => p_[1])); const b = xs.reduce((s_, p_) => s_ + (p_[0] - mx) * (p_[1] - my), 0) / xs.reduce((s_, p_) => s_ + (p_[0] - mx) ** 2, 0); r.slope = isBal ? brl(b) + ' por trimestre' : pp(b, 2, true) + ' por trimestre'; } else r.slope = '—';
    return r;
  };
  const R_ = list.map(([k, s0]) => [k, rd(s0)]);
  const rows = (isBal ? [['tri', 'Variação no último trimestre'], ['a12', 'Variação em 12 meses (5 trimestres)'], ['real', 'Crescimento real em 12 meses (IPCA)'], ['b100', 'Índice base 100 no 1º trimestre'], ['dd', 'Maior queda desde um pico']]
    : [['tri', 'Variação no último trimestre (p.p.)'], ['a12', 'Variação em 12 meses (p.p., 5 trimestres)']]).concat([['ma', 'Média dos 4 últimos trimestres'], ['amp', 'Amplitude · descritivo'], ['sd', 'Desvio-padrão amostral · descritivo'], ['slope', 'Inclinação linear · descritivo']]);
  const d = el('div', 'tblwrap mt'); d.style.maxHeight = 'none';
  d.innerHTML = `<table class="tbl"><thead><tr><th>Leitura da série</th>${R_.map(([k]) => `<th>${k}</th>`).join('')}</tr></thead><tbody>${rows.map(([k, l]) => `<tr><td class="l">${l}</td>${R_.map(([, r]) => `<td>${r[k]}</td>`).join('')}</tr>`).join('')}</tbody></table><p class="note">Com seis trimestres, só medidas descritivas: variação em 12 meses exige o mesmo trimestre do ano anterior; janelas incompletas e lacunas ficam em branco. Amplitude, desvio-padrão e inclinação usam poucos pontos e são sensíveis a um trimestre atípico — não são testes de tendência nem volatilidade de retornos.${isBal ? ' Crescimento real = (1 + g) ÷ (1 + IPCA de 12 meses) − 1.' : ''}</p>`;
  return d;
}


/* ---------------- Resumo executivo (tela de entrada) ---------------- */
const RS_K = [['ib', 'Capital', 'capital', 'folga para crescer a carteira e absorver perdas', 'menos espaço para crescer e absorver perdas'],
  ['inadR', 'Atraso > 90 dias', 'credito', 'carteira com pouco atraso', 'pressão futura sobre provisões e resultado'],
  ['pbR', 'Problema de recuperação', 'credito', 'poucos ativos com problema de recuperação', 'ativos problemáticos podem exigir mais provisão'],
  ['cob', 'Cobertura das provisões', 'credito', 'provisões cobrem bem os ativos problemáticos', 'colchão de provisão curto para os ativos problemáticos'],
  ['cor', 'Custo do risco', 'credito', 'perdas baixas preservam a margem', 'perdas consomem parte relevante da margem'],
  ['roe', 'ROE', 'dre', 'gera capital próprio para crescer', 'baixa geração interna de capital'],
  ['eff', 'Eficiência', 'dre', 'estrutura enxuta para o porte', 'despesas pesam sobre as receitas'],
  ['ltdC', 'Crédito ÷ captações', 'alm', 'carteira financiada com folga de captação', 'pouca folga de captação para crescer a carteira'],
  ['liqA', 'Liquidez', 'alm', 'colchão de liquidez confortável', 'pouca liquidez para saques e oportunidades'],
  ['irrbbPR', 'Risco de juros (IRRBB)', 'alm', 'baixa exposição a juros no banking book', 'resultado e valor sensíveis a juros']];
VIEWS.resumo = (V, n) => {
  const m = metrics(n), P = peerSet(n);
  head(V, 'Visão geral · Resumo executivo', 'Resumo executivo — ' + esc(nameOf(n)), `O que se destaca em ${esc(nameOf(n))} na data-base ${mlab(D.Q[QI])}: forças, pontos de atenção e o que mudou no trimestre, sempre comparando com ${P.n} ${peerLbl(n)} e com os limites de referência. Cada item leva à tela com a evidência.`);
  const K = el('div', 'kpis'); V.appendChild(K);
  kpi(K, { l: 'Ativo total', v: { n: m.at, f: 'brl' }, d: delta(m.gAt) + ' 12m' });
  kpi(K, { l: 'Carteira de crédito', v: { n: m.cart, f: 'brl' }, d: delta(m.gCrb) + ' 12m' });
  kpi(K, { l: lucroK(n) + ' 12 meses', v: ok(m.ll) ? { n: m.ll, f: 'brl' } : '—', d: 'ROE ' + pct(m.roe), fx: 'roe' });
  kpi(K, { l: 'Capital', v: { n: m.ib, f: 'pct' }, d: stChip('ib', m.ib, null, m.capMin) + ' mín. ' + pct(m.capMin, 1), cls: 'accent', fx: 'ib' });
  const it = RS_K.map(([k, l, v, good, bad]) => { const x = m[k], dir = THR[k] ? THR[k].dir : 1, p = pctile(n, k, x); const op = ok(p) ? (dir > 0 ? p : 1 - p) : NaN; const st = status(k, x, k === 'ib' ? m.capMin : undefined); return { k, l, v, good, bad, x, op, st, med: peerMed(n, k), fm: ['eff', 'ltdC', 'liqA', 'cob'].includes(k) ? (y => pct(y, 0)) : (y => pct(y, ['inadR', 'pbR', 'cor', 'roa'].includes(k) ? 2 : 1)) }; }).filter(i => ok(i.x));
  const strong = it.filter(i => i.st === 'good').sort((a, b) => (b.op || 0) - (a.op || 0)).slice(0, 3);
  const weak = it.filter(i => i.st !== 'good').sort((a, b) => (a.op || 0) - (b.op || 0)).slice(0, 3);
  const line = (i, good) => `<li><a href="#" data-go-v="${i.v}"><b>${i.l}</b></a> ${stChip(i.k, i.x, null, i.k === 'ib' ? m.capMin : undefined)} — ${i.fm(i.x)} contra mediana de ${i.fm(i.med)}${ok(i.op) ? ` (melhor que ${int(i.op * 100)}% dos pares)` : ''} → ${good ? i.good : i.bad}.</li>`;
  const G = grid(V); G.classList.add('mt');
  const f = card(G, { cls: 'c6', title: 'Forças', sub: 'Indicadores confortáveis e mais bem posicionados entre os pares' });
  f.b.innerHTML = strong.length ? `<ul class="refs">${strong.map(i => line(i, true)).join('')}</ul>` : '<p class="note">Nenhum indicador na faixa confortável nesta data-base.</p>';
  const a = card(G, { cls: 'c6', title: 'Pontos de atenção', sub: 'Fora da faixa confortável, do pior posicionado para o melhor' });
  a.b.innerHTML = weak.length ? `<ul class="refs">${weak.map(i => line(i, false)).join('')}</ul>` : '<p class="note">Todos os indicadores acompanhados estão na faixa confortável.</p>';
  // o que mudou no trimestre
  const c = card(G, { cls: 'c12', title: 'O que mudou no trimestre', sub: QI ? `${mlab(D.Q[QI - 1])} → ${mlab(D.Q[QI])} · maiores variações relativas à dispersão entre os pares` : 'Primeira data-base da série: sem trimestre anterior' });
  if (QI) {
    const m0 = metricsAt(n, QI - 1);
    const ch = RS_K.map(([k, l, v]) => { const d = m[k] - m0[k], arr = P[k] || [], iqr = quant(arr, .75) - quant(arr, .25), dir = THR[k] ? THR[k].dir : 1; return { k, l, v, d, z: ok(d) && iqr > 0 ? Math.abs(d) / iqr : NaN, better: dir > 0 ? d > 0 : d < 0 }; }).filter(x => ok(x.z) && Math.abs(x.d) > 1e-5).sort((x, y) => y.z - x.z).slice(0, 4);
    c.b.innerHTML = ch.length ? `<ul class="refs">${ch.map(x => `<li><a href="#" data-go-v="${x.v}"><b>${x.l}</b></a>: <span class="dl ${x.better ? 'up' : 'dn'}">${x.d > 0 ? '▲' : '▼'} ${pp(Math.abs(x.d), 2)}</span> no trimestre — ${x.better ? 'melhora' : 'piora'} equivalente a ${dec(x.z, 1)}× a dispersão típica entre os pares.</li>`).join('')}</ul>` : '<p class="note">Sem variações relevantes no trimestre.</p>';
  } else c.b.innerHTML = '<p class="note">Escolha uma data-base posterior para ver as variações.</p>';
  c.b.appendChild(el('p', 'note', 'Forças e pontos de atenção usam os mesmos limites do painel de limites e o percentil entre pares de porte semelhante; o capital é comparado com o mínimo aplicável à instituição. É uma leitura de triagem, não uma avaliação de risco.'));
  $$('a[data-go-v]', V).forEach(x => x.addEventListener('click', ev => { ev.preventDefault(); go(x.dataset.goV); }));
};

/* ---------------- Onda 2: rentabilidade decomposta, concentração, capital cooperativo, qualidade dos dados ---------------- */
{ const f = VIEWS.dre; VIEWS.dre = (V, n) => { f(V, n); const m = metrics(n); extra(V, G => {
  const c = card(G, { cls: 'c12', title: 'Rentabilidade decomposta (DuPont) e retorno sobre o risco', sub: 'ROE = margem × giro × multiplicador · 12 meses e saldos médios · mediana dos ' + peerLbl(n), fx: 'roe' });
  const K = el('div', 'kpis'); c.b.appendChild(K);
  const md = k => peerMed(n, k);
  kpi(K, { l: 'Margem (resultado ÷ receitas)', v: ok(m.dp.margem) ? pct(m.dp.margem, 1) : '—', d: 'receitas = margem antes da PE + tarifas, serviços e pagamentos' });
  kpi(K, { l: '× Giro (receitas ÷ ativo médio)', v: ok(m.dp.giro) ? pct(m.dp.giro, 1) : '—' });
  kpi(K, { l: '× Multiplicador (ativo ÷ PL médio)', v: ok(m.dp.mult) ? mult(m.dp.mult, 1) : '—' });
  kpi(K, { l: '= ROE', v: ok(m.roe) ? pct(m.roe, 1) : '—', d: 'mediana ' + pct(md('roe'), 1), cls: 'accent', fx: 'roe' });
  const K2 = el('div', 'kpis mt'); c.b.appendChild(K2);
  kpi(K2, { l: 'NIM sobre o ativo total', v: ok(m.nim) ? pct(m.nim, 2) : '—', d: 'mediana ' + pct(md('nim'), 2), fx: 'nim' });
  kpi(K2, { l: 'NIM sobre ativos rentáveis', v: ok(m.nimR) ? pct(m.nimR, 2) : '—', d: 'mediana ' + pct(md('nimR'), 2) + ' · crédito, TVM, aplicações e centralização', fx: 'nim' });
  kpi(K2, { l: 'RORWA (resultado ÷ RWA médio)', v: ok(m.rorwa) ? pct(m.rorwa, 2) : '—', d: 'mediana ' + pct(md('rorwa'), 2), fx: 'rwa' });
  c.b.appendChild(el('p', 'note', 'A margem financeira ("NII") é o resultado de intermediação antes da provisão: inclui títulos, derivativos e câmbio, não só juros. O NIM sobre o ativo total fica abaixo do NIM sobre ativos rentáveis quando há muito ativo sem rendimento (imobilizado, outros créditos).'));
}); }; }
{ const f = VIEWS.credito; VIEWS.credito = (V, n) => { f(V, n); const m = metrics(n); if (!m.r.pf && !m.r.pj) return; extra(V, G => {
  const c = card(G, { cls: 'c12', title: 'Concentração por modalidade e exposição ao agro', sub: 'Carteira PF e PJ por modalidade (SCR, IF.data rel. 11 e 13) · mediana dos ' + peerLbl(n), src: [['SCR', 'r']] });
  const K = el('div', 'kpis'); c.b.appendChild(K);
  kpi(K, { l: 'Rural e agroindustrial', v: ok(m.agroSh) ? pct(m.agroSh, 1) : '—', d: 'mediana ' + pct(peerMed(n, 'agroSh'), 1) + ' da carteira' });
  kpi(K, { l: 'HHI por modalidade', v: ok(m.hhiMod) ? dec(m.hhiMod, 3) : '—', d: '0 = pulverizada · 1 = uma só modalidade' });
  kpi(K, { l: 'Nº efetivo de modalidades', v: ok(m.nEffMod) ? dec(m.nEffMod, 1) : '—', d: 'mediana ' + dec(peerMed(n, 'nEffMod') || NaN, 1) });
  const rows = [...(m.r.pf || []).map((r_, i) => ({ label: 'PF · ' + D.PFM[i], value: sum(r_) })), ...(m.r.pj || []).map((r_, i) => ({ label: 'PJ · ' + D.PJM[i], value: sum(r_) }))].filter(x => x.value > 0).sort((a, b) => b.value - a.value).slice(0, 8);
  const T_ = sum(rows.map(x => x.value)) || 1;
  hbars(chartEl(c.b, 220), rows.map(x => ({ label: x.label.length > 34 ? x.label.slice(0, 33) + '…' : x.label, value: x.value, color: /rural/i.test(x.label) ? 'var(--gold)' : 'var(--s1)', tip: ttRow('Participação', pct(x.value / T_, 1)) })), { fmt: brl, lw: 230, name: 'Carteira' });
  c.b.appendChild(el('p', 'note', 'HHI = soma dos quadrados das participações das modalidades; número efetivo = 1 ÷ HHI. Mede concentração por produto, não por devedor (a concentração por cliente não é pública). Exposição ao agro é relevante para cooperativas: ciclos de preço, eventos climáticos e recuperações judiciais no setor.'));
}); }; }
{ const f = VIEWS.capital; VIEWS.capital = (V, n) => { f(V, n); if (n.grp !== 'coop') return; const m = metrics(n); const ix = accIndex().get('6110000004'); const arr = ix != null ? m.r.BC.get(ix) : null; if (!arr) return; extra(V, G => {
  const sh = D.Q.slice(0, QI + 1).map((_, q) => { const pl = metricsAt(n, q).pl; return pl > 0 ? (arr[q] || 0) / pl : NaN; });
  const c = card(G, { cls: 'c12', title: 'Capital cooperativo · quotas-partes', sub: 'Capital social (COSIF 6.1.1) ÷ patrimônio líquido', src: [['COSIF', 'r']] });
  const K = el('div', 'kpis'); c.b.appendChild(K);
  kpi(K, { l: 'Capital social ÷ PL', v: ok(sh[QI]) ? pct(sh[QI], 1) : '—', d: 'capital social ' + brl(arr[QI] || 0) });
  kpi(K, { l: 'Reservas e sobras retidas ÷ PL', v: ok(sh[QI]) ? pct(1 - sh[QI], 1) : '—', d: 'parte do PL que não depende de quotas' });
  lineChart(chartEl(c.b, 170), { cats: qcats(), series: [{ name: 'Capital social ÷ PL', color: 'var(--s3)', values: sh }], h: 170, fmt: x => pct(x, 0) });
  c.b.appendChild(el('p', 'note', 'As quotas-partes podem ser resgatadas pelos associados, nos limites do estatuto e das regras prudenciais. Quanto maior a parcela do PL em capital social, mais o capital depende de recursos resgatáveis; reservas e sobras retidas são o colchão permanente.'));
}); }; }
{ const f = VIEWS.metodologia; VIEWS.metodologia = (V, n) => { f(V, n); const G = grid(V); G.classList.add('mt');
  const c = card(G, { cls: 'c12', title: 'Qualidade e cobertura dos dados', sub: 'Instituições ativas por data-base e presença de cada relatório · origem dos perfis de prazos e indexadores' });
  const ents = D.E.filter(e => e.AV);
  const row = q => { const act = ents.filter(e => e.AV.r2[q] !== '-' || e.AV.r4[q] !== '-'); const c_ = k => act.filter(e => e.AV[k][q] === '1').length; const src = ['7', '11', '13'].map(r_ => D.AVQ && D.AVQ[r_] ? D.AVQ[r_][q] : q); return `<tr><td class="l">${mlab(D.Q[q])}</td><td>${act.length}</td><td>${c_('r2')}</td><td>${c_('r4')}</td><td>${c_('r5')}</td><td>${src.every(j => j === q) ? 'da própria data' : 'de ' + mlab(D.Q[Math.max(...src)])}</td></tr>`; };
  c.b.innerHTML = `<div class="tblwrap" style="max-height:none"><table class="tbl"><thead><tr><th>Data-base</th><th>Instituições ativas</th><th>Balanço</th><th>DRE</th><th>Capital</th><th>Perfis de prazo/indexador</th></tr></thead><tbody>${D.Q.map((_, q) => row(q)).join('')}</tbody></table></div>
  <p class="note">"Ativa" = enviou algum relatório na data. Ausência de relatório não é tratada como zero: o indicador fica indisponível na instituição e os agregados informam a cobertura. Coleta de 21/11/2026: os relatórios de set/25 vieram com linhas repetidas pelo serviço do Banco Central e foram deduplicados.</p>
  <p class="note"><b>Lacunas que dependem de outros dados:</b> safras e migrações completas de crédito, recuperações, concentração por devedor e por depositante, ativos desimpedidos (LCR regulatório), fluxos contratuais (ALM completo), perdas operacionais, governança e controles, riscos cibernético, social, ambiental e climático, incorporações e trocas de filiação ao longo do tempo.</p>`;
}; }

/* aviso quando o perfil de prazos/indexadores vem de outra data-base (relatórios 7, 10, 11 e 13 do IF.data) */
function avqNote(V) {
  const src = ['7', '11', '13'].map(r => (D.AVQ && D.AVQ[r]) ? D.AVQ[r][QI] : QI).find(j => j !== QI);
  if (src == null) return;
  const vh = V.querySelector('.vh'); if (!vh) return;
  vh.insertAdjacentElement('afterend', el('div', 'take', `Os relatórios de prazos, indexadores e clientes do IF.data para ${mlab(D.Q[QI])} não estavam disponíveis na coleta; esta tela usa o perfil de <b>${mlab(D.Q[src])}</b> para essas aberturas. Saldos, resultado, capital e qualidade da carteira são da data-base selecionada.`));
}
['credito', 'alm', 'camels', 'ras', 'nii'].forEach(k => { const f = VIEWS[k]; VIEWS[k] = (V, n) => { f(V, n); avqNote(V); }; });
