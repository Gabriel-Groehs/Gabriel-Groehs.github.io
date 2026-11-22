/* =====================================================================
   Telas de riscos: crédito, capital, mercado, ALM/IRRBB, NII & pricing, FRM
   ===================================================================== */
const OPX_CRED = .6;   // hipótese: 60% das despesas de pessoal e administrativas atribuídas ao crédito (RAROC)
const STAGE_COL = { e1: 'var(--s1)', e2: 'var(--s4)', e3: 'var(--neg)', sn: 'var(--s7)', sp: 'var(--neg-3)' };
const SEG_LBL = ['Prefixado', 'CDI', 'Selic', 'TR', 'TJLP/TLP', 'IPCA/IGP-M', 'Outros'];
function idxParts(r) {
  const x = k => r.ix[XI[k]] || 0;
  return [
    { label: 'Prefixado', value: x('pre'), color: 'var(--s1)' }, { label: 'CDI', value: x('cdi'), color: 'var(--s2)' }, { label: 'Selic', value: x('selic'), color: 'var(--s7)' },
    { label: 'TR', value: x('tr'), color: 'var(--s6)' }, { label: 'TJLP / TLP', value: x('tjlp') + x('tlp'), color: 'var(--s5)' }, { label: 'IPCA / IGP-M', value: x('ipca') + x('igpm'), color: '#8C6230' },
    { label: 'Outros', value: x('opos') + x('oflu') + x('oidp') + x('oind') + x('tcr'), color: '#8A8F9C' },
  ].filter(p => p.value > 0);
}
function peerQ(n, key) { // mediana trimestral dos pares
  const L = peerList(n);
  return D.Q.map((_, i) => median(L.map(x => metrics(x).q[key][i])));
}

/* ---------------- Risco de crédito ---------------- */
VIEWS.credito = (V, n) => {
  const m = metrics(n), r = m.r;
  head(V, 'Riscos · Crédito', 'Risco de crédito — ' + esc(nameOf(n)), `Qualidade da carteira com dados do SCR (documento 3040, via IF.data), estágios de risco do balancete COSIF (Res. CMN 4.966 · IFRS 9) e um modelo de perdas Vasicek/ASRF para separar perda esperada de perda inesperada.`);
  const K = el('div', 'kpis'); V.appendChild(K);
  kpi(K, { l: 'Carteira ativa (SCR)', v: { n: m.scr, f: 'brl' }, d: int(m.ops) + ' operações' });
  kpi(K, { l: 'Atraso > 90 dias (SCR)', v: { n: m.inadR, f: 'pct2' }, d: stChip('inadR', m.inadR), fx: 'inad' });
  kpi(K, { l: 'Ativos problemáticos', v: { n: m.probR, f: 'pct2' }, d: stChip('probR', m.probR), fx: 'prob' });
  kpi(K, { l: 'Estágio 3 · metodologia completa', v: ok(m.e3R) ? { n: m.e3R, f: 'pct2' } : '—', d: ok(m.e2R) ? 'E2 ' + pct(m.e2R) + (m.stSimp ? ' · ' + pct(m.stFullSh, 0) + ' da carteira' : '') : (m.stSimp ? 'sem carteira nessa metodologia' : ''), fx: 'stages' });
  if (m.stSimp) kpi(K, { l: 'Problemáticos · metodologia simplificada', v: ok(m.spR) ? { n: m.spR, f: 'pct2' } : '—', d: pct(1 - (m.stFullSh || 0), 0) + ' da carteira', fx: 'stages' });
  kpi(K, { l: 'Perda esperada (estoque)', v: { n: m.pe, f: 'brl' }, d: pct(m.peR) + ' da carteira bruta' });
  kpi(K, { l: 'Cobertura PE ÷ problemáticos', v: { n: m.cob, f: 'pct' }, d: stChip('cob', m.cob), fx: 'cob' });
  kpi(K, { l: 'Custo do risco 12m', v: { n: m.cor, f: 'pct2' }, d: stChip('cor', m.cor), fx: 'cor' });
  kpi(K, { l: 'Ticket médio', v: brl(m.ticket), d: int(m.cli) + ' clientes' });
  const G = grid(V); G.classList.add('mt');
  // estágios
  const st = card(G, { cls: 'c6', title: 'Estágios de risco · IFRS 9 / Res. 4.966', sub: 'Ativos financeiros por estágio (balancete, contas 3.3.1)', src: [['COSIF', 'r']], fx: 'stages' });
  const rowsSt = [];
  const stRow = (lbl, nn) => { const mm = metrics(nn); if (!mm.cz) return; rowsSt.push({ label: lbl, parts: [{ label: 'Estágio 1', value: mm.cz.e1, color: STAGE_COL.e1 }, { label: 'Estágio 2', value: mm.cz.e2, color: STAGE_COL.e2 }, { label: 'Estágio 3', value: mm.cz.e3, color: STAGE_COL.e3 }, { label: 'Simplificada · sem problema', value: mm.cz.sn, color: STAGE_COL.sn }, { label: 'Simplificada · com problema', value: mm.cz.sp, color: STAGE_COL.sp }] }); };
  stRow(n.name.length > 18 ? n.name.slice(0, 17) + '…' : n.name, n);
  if (n.kind === 'coop' || n.kind === 'central') stRow('Sistema ' + SYS_NAME[n.sys], node('S:' + n.sys));
  if (n.id !== 'G:coop') stRow('Cooperativas', node('G:coop'));
  if (n.id !== 'G:bank') stRow('Grandes bancos', node('G:bank'));
  if (rowsSt.length) stack100(chartEl(st.b, 160), rowsSt, { rh: 28, lw: 130, fmt: brl }); else st.b.innerHTML = '<p class="note">Sem balancete COSIF para esta seleção.</p>';
  st.b.appendChild(el('div', 'take', `Estágio 1: risco não aumentou desde a concessão (perda esperada de 12 meses). Estágio 2: aumento significativo de risco (perda esperada para a vida toda). Estágio 3: ativo com problema de recuperação de crédito. Na metodologia simplificada (permitida a instituições menores) não há estágio 2: os ativos são só com ou sem problema de recuperação, então as duas metodologias aparecem separadas. ${ok(m.e3R) ? `Aqui, <b>${pct(m.e3R)}</b> da carteira na metodologia completa está no estágio 3` : ''}${ok(m.e3R) && ok(m.spR) ? ' e ' : ok(m.spR) ? 'Aqui, ' : ''}${ok(m.spR) ? `<b>${pct(m.spR)}</b> da carteira na simplificada tem problema de recuperação` : ''}${ok(m.e3R) || ok(m.spR) ? '.' : ''}`));
  // C1..C5
  const cc = card(G, { cls: 'c6', title: 'Carteiras C1 a C5 (Res. BCB 352)', sub: 'Classificação da carteira ativa para a perda incorrida mínima · SCR', src: [['SCR · IF.data', 'r']], fx: 'c15' });
  const ck = ['k1', 'k2', 'k3', 'k4', 'k5'], cl = ['C1 · menor perda mínima', 'C2', 'C3', 'C4', 'C5 · maior perda mínima'];
  const seq = ['#13254A', '#2E4C80', '#5D84B8', '#B8892E', '#8C6230'];
  donut(chartEl(cc.b, 190), ck.map((k, i) => ({ label: cl[i], value: m[k], color: seq[i] })), { center: { v: brl(m.scr), l: 'carteira SCR' } });
  // modalidade × prazo
  const bk = ['≤90d', '91–360d', '1–3a', '3–5a', '5–15a', '>15a', 'Vencido ≥15d'];
  if (r.pf) { const hp = card(G, { cls: 'c6', title: 'Pessoa física · modalidade × prazo', sub: 'Carteira por prazo a vencer e vencida (SCR, IF.data rel. 11)', src: [['SCR', 'r']] }); heatTable(hp.b, D.PFM.map(x => x.replace('Empréstimo com Consignação em Folha', 'Consignado').replace('Empréstimo sem Consignação em Folha', 'Não consignado')), bk, r.pf, { critCol: 6, total: true }); }
  if (r.pj) { const hj = card(G, { cls: 'c6', title: 'Pessoa jurídica · modalidade × prazo', sub: 'Carteira por prazo a vencer e vencida (SCR, IF.data rel. 13)', src: [['SCR', 'r']] }); heatTable(hj.b, D.PJM.map(x => x.replace('Financiamento de Infraestrutura/Desenvolvimento/Projeto e Outros Créditos', 'Infraestrutura e projetos').replace('Cheque Especial e Conta Garantida', 'Cheque esp. e conta garantida')), bk, r.pj, { critCol: 6, total: true }); }
  // atraso por modalidade
  const at = card(G, { cls: 'c6', title: 'Atraso acima de 15 dias por modalidade', sub: 'Vencido ≥15d ÷ carteira da modalidade · ranking de risco por produto' });
  const mods = [];
  if (r.pf) r.pf.forEach((row, i) => { const t = sum(row); if (t > 0) mods.push({ label: 'PF · ' + D.PFM[i].replace('Empréstimo com Consignação em Folha', 'Consignado').replace('Empréstimo sem Consignação em Folha', 'Não consignado'), value: row[6] / t, tot: t }); });
  if (r.pj) r.pj.forEach((row, i) => { const t = sum(row); if (t > 0) mods.push({ label: 'PJ · ' + D.PJM[i].replace('Financiamento de Infraestrutura/Desenvolvimento/Projeto e Outros Créditos', 'Infra e projetos').replace('Cheque Especial e Conta Garantida', 'Cheque especial'), value: row[6] / t, tot: t }); });
  mods.sort((a, b) => b.value - a.value);
  hbars(chartEl(at.b, 300), mods.filter(x => x.tot > m.scr * 0.003).slice(0, 12).map(x => ({ ...x, color: x.value > .08 ? 'var(--neg)' : x.value > .04 ? 'var(--neg-3)' : 'var(--s1)', tip: ttRow('Carteira', brl(x.tot)) })), { fmt: x => pct(x, 1), lw: 210, name: 'Vencido ≥15d' });
  const ix = card(G, { cls: 'c6', title: 'Indexadores da carteira', sub: 'Exposição a juros prefixados × pós-fixados (base do IRRBB)', src: [['SCR · IF.data rel. 7', 'r']] });
  donut(chartEl(ix.b, 190), idxParts(r), { center: { v: pct(div(r.ix[XI.pre], r.ix[XI.tot]), 0), l: 'prefixado' } });
  // histórico e SCR
  const hi = card(G, { cls: 'c6', title: 'Inadimplência × pares (trimestral)', sub: 'Inadimplência 90d ÷ carteira SCR · mediana das ' + peerLbl(n) });
  lineChart(chartEl(hi.b, 210), { cats: qcats(), series: [{ name: n.name, color: 'var(--s8)', values: m.q.inad }, { name: 'Mediana dos pares', color: 'var(--ink-3)', values: peerQ(n, 'inad'), dash: '5 4' }, { name: 'Ativos problemáticos', color: 'var(--s2)', values: m.q.prob }], h: 210, fmt: x => pct(x, 1) });
  const sc = card(G, { cls: 'c6', title: 'SCR.data · cooperativas × bancos (mensal)', sub: 'Inadimplência e ativo problemático do SFN por segmento — o mesmo agregado da Cidade do Crédito', src: [['SCR.data', 'r']] });
  const MS = D.SCR.meses.map(String), seg = D.SCR.seg;
  const rate = (s, j) => MS.map(mm => { const a = seg[s][mm]; return a ? a[j] / a[0] : NaN; });
  lineChart(chartEl(sc.b, 210), { cats: MS.map(mlab), series: [{ name: 'Cooperativas · inadimplência', color: 'var(--s1)', values: rate('Cooperativa', 1) }, { name: 'Bancos · inadimplência', color: 'var(--gold)', values: rate('Banco', 1) }, { name: 'Cooperativas · problemático', color: 'var(--s1)', values: rate('Cooperativa', 2), dash: '5 4' }, { name: 'Bancos · problemático', color: 'var(--gold)', values: rate('Banco', 2), dash: '5 4' }], h: 210, fmt: x => pct(x, 1) });
  // Vasicek
  const vk = card(G, { cls: 'c12', title: 'Perda esperada × perda inesperada · modelo Vasicek (ASRF, Basileia IRB)', sub: 'Distribuição de perdas da carteira com um fator sistêmico — calibre PD, LGD e correlação', fx: 'vasicek', src: [['modelo', 'm']] });
  const ui = ST.ui.vk || (ST.ui.vk = {});
  const pd0 = clamp(ok(m.inadR) ? m.inadR * 0.9 : 0.03, 0.004, 0.25);
  const S0 = { pd: ui.pd ?? +(pd0 * 100).toFixed(1), lgd: ui.lgd ?? (isCoop(n) ? 40 : 45), rho: ui.rho ?? +(rhoRetail(pd0) * 100).toFixed(1), q: ui.q ?? 99.9, ccf: ui.ccf ?? 50 };
  const wrap = el('div', 'grid g12'); vk.b.appendChild(wrap);
  vk.b.appendChild(el('p', 'note', '<b>Premissas do modelo.</b> Vasicek/ASRF supõe carteira muito pulverizada (granularidade infinita), um único fator sistêmico, devedores homogêneos e LGD fixa. A PD inicial (0,9 × atraso > 90 dias) é <b>hipótese editável</b>: o estoque de atraso não é a probabilidade de default em 12 meses. LGD e CCF também são hipóteses. A perda do modelo não equivale à provisão contábil nem a uma frequência de “uma vez em X anos”.'));
  const ctl = el('div', 'ctl c3'); wrap.appendChild(ctl);
  const out = el('div', 'c9'); wrap.appendChild(out);
  const kp = el('div', 'kpis'); out.appendChild(kp);
  const ch = el('div', 'chart'); out.appendChild(ch);
  const tk = el('div', 'take'); out.appendChild(tk);
  const undrawn = m.cz ? m.cz.clib : 0;
  const draw = () => {
    Object.assign(ui, S0);
    const pd = S0.pd / 100, lgd = S0.lgd / 100, rho = S0.rho / 100, q = S0.q / 100;
    const ead = m.scr + undrawn * S0.ccf / 100;
    const el_ = pd * lgd * ead, wc = vasicekQ(pd, rho, q), var_ = wc * lgd * ead, ul = var_ - el_;
    const regK = m.rwac * capK(m);
    kp.innerHTML = '';
    kpi(kp, { l: 'EAD', v: brl(ead), d: 'carteira + ' + S0.ccf + '% do limite a liberar' });
    kpi(kp, { l: 'Perda esperada (EL)', v: brl(el_), d: pct(el_ / ead, 2) + ' · provisão atual ' + brl(m.pe) });
    kpi(kp, { l: 'Taxa de inadimplência condicional', v: pct(wc, 2), d: 'cenário ' + nf(1).format(S0.q) + '%' });
    kpi(kp, { l: 'Perda inesperada (UL)', v: brl(ul), d: 'capital econômico de crédito', cls: 'accent' });
    kpi(kp, { l: 'Capital regulatório de crédito', v: brl(regK), d: 'RWA crédito × ' + pct(capK(m), 1) + ' (mínimo aplicável) · ' + (ul > 0 ? mult(regK / ul, 2) + ' a UL' : '') });
    const xs = [], ys = [], xmax = Math.min(1, Math.max(wc * 1.6, pd * 4, 0.02));
    for (let i = 1; i < 240; i++) { const x = xmax * i / 240; xs.push(x * lgd * 100); ys.push(vasicekPdf(x, pd, rho)); }
    densityChart(ch, { xs, series: [{ name: 'densidade', color: 'var(--s1)', ys, fill: true }], fmt: x => nf(1).format(x) + '%', markers: [{ x: pd * lgd * 100, label: 'EL ' + pct(pd * lgd, 2), color: 'var(--s3)' }, { x: wc * lgd * 100, label: 'VaR ' + nf(1).format(S0.q) + '% ' + pct(wc * lgd, 2), color: 'var(--crit)', dash: true }], shade: { from: wc * lgd * 100, dir: 1 }, h: 230 });
    tk.innerHTML = `Com PD de <b>${pct(pd, 1)}</b>, LGD de <b>${pct(lgd, 0)}</b> e correlação de <b>${pct(rho, 1)}</b>, a perda média é ${brl(el_)}; no cenário de 1 em ${int(1 / (1 - q))} anos a perda chega a ${brl(var_)} — a diferença (${brl(ul)}) precisa estar coberta por capital, não por provisão. Eixo: perda em % da EAD.`;
  };
  slider(ctl, { label: 'PD 12 meses', min: 0.3, max: 25, step: 0.1, value: S0.pd, fmt: v => nf(1).format(v) + '%', onInput: v => { S0.pd = v; draw(); } });
  slider(ctl, { label: 'LGD', min: 5, max: 90, step: 1, value: S0.lgd, fmt: v => v + '%', onInput: v => { S0.lgd = v; draw(); } });
  slider(ctl, { label: 'Correlação de ativos (ρ)', min: 1, max: 30, step: 0.5, value: S0.rho, fmt: v => nf(1).format(v) + '%', onInput: v => { S0.rho = v; draw(); } });
  slider(ctl, { label: 'Confiança', min: 95, max: 99.9, step: 0.1, value: S0.q, fmt: v => nf(1).format(v) + '%', onInput: v => { S0.q = v; draw(); } });
  slider(ctl, { label: 'CCF do limite a liberar', min: 0, max: 100, step: 5, value: S0.ccf, fmt: v => v + '%', onInput: v => { S0.ccf = v; draw(); } });
  ctl.appendChild(el('p', 'note', `PD inicial = 90% da inadimplência observada; ρ inicial pela fórmula de varejo de Basileia (${pct(rhoRetail(pd0), 1)}). Limite de crédito a liberar no balancete: ${brl(undrawn)}.`));
  draw();
};

/* ---------------- Capital ---------------- */
VIEWS.capital = (V, n) => {
  const m = metrics(n);
  head(V, 'Riscos · Capital', 'Capital & Basileia — ' + esc(nameOf(n)), `Patrimônio de referência, ativos ponderados pelo risco (RWA) por tipo de risco, índices de Basileia e alavancagem, adicional de capital e a folga para crescer — dados do relatório "Informações de Capital" do IF.data.`);
  const K = el('div', 'kpis'); V.appendChild(K);
  kpi(K, { l: 'Patrimônio de referência', v: { n: m.pr, f: 'brl' }, d: 'nível I ' + brl(m.n1) });
  kpi(K, { l: 'RWA total', v: { n: m.rwa, f: 'brl' }, d: 'densidade ' + pct(m.rwaD, 0) + ' do ativo', fx: 'rwa' });
  kpi(K, { l: m.cap.nS && !m.cap.nF ? 'PRS5 ÷ RWAS5' : 'Índice de Basileia', v: { n: m.ib, f: 'pct' }, d: stChip('ib', m.ib, null, m.capMin) + ' mín. ' + pct(m.capMin, 1), cls: 'accent', fx: 'ib' });
  kpi(K, { l: 'Capital principal', v: ok(m.icp) ? { n: m.icp, f: 'pct' } : 'n/a', d: ok(m.icp) ? stChip('icp', m.icp) + (n.members.length > 1 ? ' ' + m.capCov + ' IFs' : '') : 'regime S5 simplificado' });
  kpi(K, { l: 'Razão de alavancagem', v: ok(m.ra) ? { n: m.ra, f: 'pct' } : 'n/a', d: ok(m.ra) ? stChip('ra', m.ra) : 'não informada (S5)', fx: 'ra' });
  kpi(K, { l: 'Folga sobre o mínimo', v: { n: m.buf, f: 'brl' }, d: n.members.length > 1 ? (m.cap.below ? m.cap.below + ' de ' + m.cap.n + ' abaixo do mínimo' : 'todas acima do mínimo') : 'capacidade ≈ ' + brl(m.buf / capK(m)) + ' de RWA', fx: 'buffer' });
  kpi(K, { l: 'Adicional (ACP) exigido', v: pct(div(m.acp, m.rwa), 2), d: brl(m.acp) });
  kpi(K, { l: 'Índice de imobilização', v: ok(m.imob) ? pct(m.imob, 1) : '—', d: 'limite 50% do PR' });
  const G = grid(V); G.classList.add('mt');
  const g1 = card(G, { cls: 'c4', title: 'Índice de Basileia', sub: 'PR ÷ RWA, com faixas de requerimento', fx: 'ib' });
  gauge(g1.b, { value: m.ib, min: 0, max: .3, fmt: x => pct(x, 1), label: 'mediana pares ' + pct(peerMed(n, 'ib')), bands: capBands(m), ticks: [{ v: capK(m), l: pct(capK(m), 1) }, { v: .2, l: '20%' }] });
  g1.b.appendChild(el('p', 'note', capNote(m, n) + (n.members.length > 1 ? ` Capital principal, nível I e alavancagem usam só as ${m.capCov} instituições que os informam.` : '')));
  const g2 = card(G, { cls: 'c4', title: 'Composição do patrimônio de referência', sub: 'Capital principal, complementar e nível II' });
  donut(chartEl(g2.b, 180), [{ label: 'Capital principal (CET1)', value: m.cp, color: 'var(--s1)' }, { label: 'Capital complementar (AT1)', value: m.at1, color: 'var(--s7)' }, { label: 'Nível II', value: m.n2, color: 'var(--s4)' }], { center: { v: brl(m.pr), l: 'PR' } });
  const g3 = card(G, { cls: 'c4', title: 'RWA por tipo de risco', sub: 'Crédito, mercado, operacional e serviços de pagamento', fx: 'rwa' });
  donut(chartEl(g3.b, 180), [{ label: 'Crédito', value: m.rwac, color: 'var(--s1)' }, { label: 'Mercado', value: m.rwam, color: 'var(--s2)' }, { label: 'Operacional', value: m.rwao, color: 'var(--s5)' }, { label: 'Serviços de pagamento', value: m.rwas, color: 'var(--s6)' }], { center: { v: brl(m.rwa), l: 'RWA' } });
  const st = card(G, { cls: 'c6', title: 'Pilha de capital × requerimentos', sub: 'Índices observados contra mínimo + adicional (ACP efetivo do IF.data)' });
  const acpR = div(m.acp, m.rwa) || 0.025;
  hbars(chartEl(st.b, 170), [
    { label: 'Capital principal', value: m.icp, color: 'var(--s1)', tip: ttRow('Requerido', pct(0.045 + acpR)) },
    { label: 'Nível I', value: m.in1, color: 'var(--s7)', tip: ttRow('Requerido', pct(0.06 + acpR)) },
    { label: 'Patrimônio de referência', value: m.ib, color: 'var(--gold)', tip: ttRow('Requerido', pct(0.08 + acpR)) },
    { label: 'Razão de alavancagem', value: m.ra, color: 'var(--s5)', tip: ttRow('Mínimo (S1/S2)', '3%') },
  ], { fmt: x => pct(x, 1), lw: 170, max: Math.max(.25, m.ib * 1.1), ref: { value: 0.08 + acpR, label: 'PR mín. + ACP ' + pct(0.08 + acpR, 1), color: 'var(--crit)' } });
  const hs = card(G, { cls: 'c6', title: 'Trajetória trimestral', sub: 'Basileia, capital principal e mediana dos pares' });
  lineChart(chartEl(hs.b, 190), { cats: qcats(), series: [{ name: 'Basileia', color: 'var(--gold)', values: m.q.ib }, { name: 'Capital principal', color: 'var(--s1)', values: m.q.icp }, { name: 'Mediana Basileia pares', color: 'var(--ink-3)', values: peerQ(n, 'ib'), dash: '5 4' }], refs: capRef(m), h: 190 });
  // estresse de capital
  const sx = card(G, { cls: 'c12', title: 'Estresse de capital e capacidade de crescimento', sub: 'Quanto de perda o capital absorve e quanto crédito novo a folga sustenta', src: [['modelo', 'm']], fx: 'buffer' });
  const ui = ST.ui.cap || (ST.ui.cap = { loss: 2, grow: 10, rw: 85 });
  const w = el('div', 'grid g12'); sx.b.appendChild(w);
  const ctl = el('div', 'ctl c3'); w.appendChild(ctl);
  const o = el('div', 'c9'); w.appendChild(o);
  const ko = el('div', 'kpis'); o.appendChild(ko); const chs = el('div', 'chart'); o.appendChild(chs); const tk = el('div', 'take'); o.appendChild(tk);
  const run = () => {
    const loss = m.scr * ui.loss / 100, newCred = m.cart * ui.grow / 100;
    const pr1 = m.pr - loss, rwa1 = m.rwa + newCred * ui.rw / 100 - loss * ui.rw / 100;
    const ib1 = div(pr1, rwa1);
    const mn = capK(m), absorb = (m.pr - mn * m.rwa) / (1 - mn * ui.rw / 100);
    const growMax = (m.pr - mn * m.rwa) / (mn * ui.rw / 100);
    ko.innerHTML = '';
    kpi(ko, { l: 'Basileia após choque', v: pct(ib1, 1), d: stChip('ib', ib1, null, mn) });
    kpi(ko, { l: 'Perda que leva ao mínimo (' + pct(mn, 1) + ')', v: brl(absorb), d: pct(absorb / m.scr, 1) + ' da carteira' });
    kpi(ko, { l: 'Crescimento máximo com a folga', v: brl(growMax), d: pct(growMax / m.cart, 0) + ' da carteira atual', cls: 'accent' });
    kpi(ko, { l: 'Multiplicador do capital', v: mult(m.alav, 1), d: 'ativo por R$ 1 de PL' });
    const sens = [0, 1, 2, 3, 4, 5, 6, 8, 10].map(p => { const L = m.scr * p / 100; return div(m.pr - L, m.rwa + newCred * ui.rw / 100 - L * ui.rw / 100); });
    barChart(chs, { cats: [0, 1, 2, 3, 4, 5, 6, 8, 10].map(p => p + '%'), series: [{ name: 'Basileia', values: sens, colors: sens.map(x => x >= mn + .025 ? 'var(--s3)' : x >= mn ? 'var(--s4)' : 'var(--s8)') }], fmt: x => pct(x, 0), h: 190, labels: true, maxBar: 40 });
    tk.innerHTML = `Eixo: perda adicional de crédito (% da carteira SCR), já considerando o crescimento de <b>${ui.grow}%</b>. Uma perda de <b>${brl(absorb)}</b> consome toda a folga sobre o mínimo de ${pct(mn, 1)}; sem perdas, a folga permitiria ampliar a carteira em ${brl(growMax)} com ponderação média de ${ui.rw}%.`;
  };
  slider(ctl, { label: 'Perda adicional de crédito', min: 0, max: 15, step: .5, value: ui.loss, fmt: v => nf(1).format(v) + '% da carteira', onInput: v => { ui.loss = v; run(); } });
  slider(ctl, { label: 'Crescimento da carteira', min: 0, max: 40, step: 1, value: ui.grow, fmt: v => v + '%', onInput: v => { ui.grow = v; run(); } });
  slider(ctl, { label: 'Ponderação média de risco (RW)', min: 20, max: 150, step: 5, value: ui.rw, fmt: v => v + '%', onInput: v => { ui.rw = v; run(); } });
  run();
  const hp = card(G, { cls: 'c12', title: 'Basileia entre pares', sub: 'Distribuição do índice nas ' + peerLbl(n) });
  histogram(chartEl(hp.b, 170), peerSet(n).ib, { fmt: x => pct(x, 0), marker: m.ib, markerLabel: n.name.slice(0, 24) + ': ' + pct(m.ib), h: 170, min: 0.05, max: 0.45, bins: 32, colorFn: x => { const pm = n.grp === 'coop' ? .12 : .105; return x < pm ? 'var(--neg)' : x < pm + .025 ? 'var(--s4)' : 'var(--s1)'; } });
};

/* ---------------- Mercado & tesouraria ---------------- */
let RNG_S = 7;
const rnd = () => { RNG_S = (RNG_S * 16807) % 2147483647; return (RNG_S - 1) / 2147483646; };
const gauss = () => { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
VIEWS.mercado = (V, n) => {
  const m = metrics(n);
  head(V, 'Riscos · Mercado e tesouraria', 'Mercado & tesouraria — ' + esc(nameOf(n)), `Carteira de títulos e aplicações, rendimento da tesouraria, RWA de mercado por fator (IF.data) e um motor de VaR/ES com backtesting — as exposições são reais; volatilidades e durations são premissas ajustáveis.`);
  const K = el('div', 'kpis'); V.appendChild(K);
  kpi(K, { l: 'Títulos e valores mobiliários', v: { n: m.tvm, f: 'brl' }, d: pct(div(m.tvm, m.at), 0) + ' do ativo' });
  kpi(K, { l: 'Aplicações interfinanceiras', v: { n: m.aplic, f: 'brl' }, d: 'disponibilidades ' + brl(m.disp) });
  kpi(K, { l: 'Rendimento da tesouraria 12m', v: { n: m.yTes, f: 'pct' }, d: pct(div(m.yTes, CDI_LTM), 0) + ' do CDI', fx: 'ytes' });
  kpi(K, { l: 'RWA de mercado', v: { n: m.rwam, f: 'brl' }, d: pct(div(m.rwam, m.rwa), 1) + ' do RWA' });
  kpi(K, { l: 'Capital para risco de mercado', v: brl(m.rwam * 0.08), d: pct(m.mktPR, 1) + ' do PR' });
  kpi(K, { l: 'Capital IRRBB (banking book)', v: ok(m.irrbbPR) ? { n: m.irrbb, f: 'brl' } : 'n/a', d: ok(m.irrbbPR) ? pct(m.irrbbPR, 1) + ' do PR (S1–S4)' : 'S5: sem parcela IRRBB', fx: 'irrbb' });
  kpi(K, { l: 'Derivativos', v: brl(m.dera), d: 'passivo ' + brl(m.derp) });
  if (m.cz && m.cz.cent) kpi(K, { l: 'Centralização financeira', v: brl(m.cz.cent), d: 'recursos repassados à central' });
  const G = grid(V); G.classList.add('mt');
  const f = card(G, { cls: 'c6', title: 'RWA de mercado por fator de risco', sub: 'Parcelas RWAjur, RWAcam, RWAacs, RWAcom, CVA e DRC', src: [['IF.data · capital', 'r']], fx: 'rwamkt' });
  const fr = [['Juros e cupons (RWAjur)', 'rjur', 'var(--s1)'], ['Câmbio e ouro (RWAcam)', 'rcam', 'var(--s2)'], ['Ações (RWAacs)', 'racs', 'var(--s7)'], ['Commodities (RWAcom)', 'rcom', 'var(--s4)'], ['CVA de derivativos', 'rcva', 'var(--s5)'], ['Risco de crédito da carteira de negociação (DRC)', 'rdrc', 'var(--s6)']].map(x => ({ label: x[0], value: m[x[1]], color: x[2] }));
  if (m.rwam > 0) hbars(chartEl(f.b, 180), fr, { lw: 230 }); else f.b.appendChild(el('p', 'note', 'Sem RWA de mercado relevante: a instituição praticamente não mantém carteira de negociação. O risco de juros relevante está no banking book (IRRBB) — veja ALM & IRRBB.'));
  f.b.appendChild(el('div', 'take', `Requisito de capital de mercado = RWA de mercado × 8% = <b>${brl(m.rwam * 0.08)}</b> (${pct(m.mktPR, 2)} do PR). O capital para IRRBB (${brl(m.irrbb)}) mede o risco de juros da carteira bancária.`));
  const tc = card(G, { cls: 'c6', title: 'Composição da tesouraria', sub: 'Ativos de liquidez e investimentos financeiros' });
  donut(chartEl(tc.b, 180), [{ label: 'Disponibilidades', value: m.disp, color: 'var(--s6)' }, { label: 'Aplicações interfinanceiras', value: m.aplic, color: 'var(--s1)' }, { label: 'TVM', value: m.tvm, color: 'var(--s7)' }, { label: 'Centralização financeira', value: m.cent, color: 'var(--s4)' }, { label: 'Derivativos (ativo)', value: m.dera, color: 'var(--s2)' }].filter(p => p.value > 0), { center: { v: brl(m.liq + m.dera), l: 'tesouraria' } });
  if (m.cent) tc.b.appendChild(el('div', 'take', `<b>Centralização financeira:</b> ${brl(m.cent)} aplicados na cooperativa central (${pct(div(m.cent, m.at), 0)} do ativo), remunerados por <b>ingressos intercooperativos</b> de ${brl(m.icoop)} em 12 meses (${pct(div(m.icoop, m.cent), 1)} sobre o saldo atual) — no IF.data esses valores aparecem em “outros ativos” e “outras receitas”.`));
  // VaR
  const vr = card(G, { cls: 'c12', title: 'Motor de VaR e Expected Shortfall', sub: 'Exposição prefixada dos títulos × duration × volatilidade diária da taxa · normal ou t de Student (caudas gordas)', src: [['modelo', 'm']], fx: 'var' });
  const ui = ST.ui.var || (ST.ui.var = { fix: isCoop(n) ? 15 : 35, dur: 2.5, vol: 9, conf: 99, hz: 10, dist: 't' });
  const wr = el('div', 'grid g12'); vr.b.appendChild(wr);
  const ctl = el('div', 'ctl c3'); wr.appendChild(ctl);
  const o = el('div', 'c9'); wr.appendChild(o);
  const ko = el('div', 'kpis'); o.appendChild(ko); const ch = el('div', 'chart'); o.appendChild(ch); const tk = el('div', 'take'); o.appendChild(tk);
  const sims = (() => { RNG_S = 11; const N = 20000, z = new Float64Array(N), t = new Float64Array(N); for (let i = 0; i < N; i++) { z[i] = gauss(); let c = 0; for (let k = 0; k < 4; k++) { const g = gauss(); c += g * g; } t[i] = gauss() / Math.sqrt(c / 4) * Math.sqrt(2 / 4); } return { z, t }; })();
  const run = () => {
    const mv = m.tvm * ui.fix / 100, dv01 = mv * ui.dur / 10000;
    const sd = dv01 * ui.vol * Math.sqrt(ui.hz);
    const a = ui.conf / 100;
    const arr = Array.from(ui.dist === 't' ? sims.t : sims.z).map(x => x * sd).sort((x, y) => x - y);
    const kq = Math.floor((1 - a) * arr.length); const VaR = -arr[kq]; const ES = -mean(arr.slice(0, kq + 1));
    const stress = dv01 * 300;
    ko.innerHTML = '';
    kpi(ko, { l: 'Exposição prefixada', v: brl(mv), d: 'DV01 ' + brl(dv01) });
    kpi(ko, { l: `VaR ${ui.conf}% · ${ui.hz}d`, v: brl(VaR), d: pct(VaR / m.pr, 2) + ' do PR', cls: 'accent' });
    kpi(ko, { l: 'Expected Shortfall', v: brl(ES), d: 'média além do VaR' });
    kpi(ko, { l: 'Choque +300 bp', v: brl(stress), d: pct(stress / m.pr, 2) + ' do PR' });
    const lo = arr[Math.floor(arr.length * .001)], hi = arr[Math.floor(arr.length * .999)];
    const nb = 70, xs = [], ys = new Array(nb).fill(0); for (let i = 0; i < nb; i++) xs.push(lo + (hi - lo) * (i + .5) / nb);
    arr.forEach(x => { const b = Math.floor((x - lo) / (hi - lo) * nb); if (b >= 0 && b < nb) ys[b]++; });
    const yn = xs.map(x => Npdf(x / sd) * arr.length * (hi - lo) / nb / sd);
    densityChart(ch, { xs, series: [{ name: 'simulado', color: 'var(--s1)', ys, fill: true }, { name: 'normal', color: 'var(--ink-3)', ys: yn, dash: '4 4' }], fmt: x => brl(x), markers: [{ x: -VaR, label: 'VaR ' + brl(VaR), color: 'var(--crit)' }, { x: -ES, label: 'ES ' + brl(ES), color: 'var(--s2)', dash: true }], shade: { from: -VaR, dir: -1 }, h: 220 });
    tk.innerHTML = `Com ${pct(ui.fix / 100, 0)} dos títulos prefixados e duration de ${nf(1).format(ui.dur)} anos, cada 1 bp move ${brl(dv01)}. Em ${ui.hz} dias, com volatilidade de ${ui.vol} bp/dia, a perda só é superada em ${nf(1).format(100 - ui.conf)}% dos cenários (VaR); quando é, a perda média é ${brl(ES)} (ES). ${ui.dist === 't' ? 'Distribuição t (ν = 4): caudas mais pesadas que a normal tracejada.' : ''}`;
    bt();
  };
  slider(ctl, { label: 'TVM prefixado', min: 0, max: 100, step: 1, value: ui.fix, fmt: v => v + '%', onInput: v => { ui.fix = v; run(); } });
  slider(ctl, { label: 'Duration modificada', min: .2, max: 8, step: .1, value: ui.dur, fmt: v => nf(1).format(v) + ' anos', onInput: v => { ui.dur = v; run(); } });
  slider(ctl, { label: 'Volatilidade diária da taxa', min: 2, max: 30, step: 1, value: ui.vol, fmt: v => v + ' bp', onInput: v => { ui.vol = v; run(); } });
  slider(ctl, { label: 'Confiança', min: 95, max: 99.9, step: .1, value: ui.conf, fmt: v => nf(1).format(v) + '%', onInput: v => { ui.conf = v; run(); } });
  slider(ctl, { label: 'Horizonte', min: 1, max: 20, step: 1, value: ui.hz, fmt: v => v + ' dias', onInput: v => { ui.hz = v; run(); } });
  ctl.appendChild(segCtl([['t', 't de Student'], ['n', 'Normal']], ui.dist, k => { ui.dist = k; run(); }));
  // backtesting
  const bk = card(G, { cls: 'c12', title: 'Backtesting do VaR · experimento didático (Kupiec)', sub: '250 dias de P&L simulados com caudas gordas contra o VaR diário normal de 99% — zonas de Basileia', src: [['simulação', 'm']], fx: 'kupiec' });
  const bkc = el('div', 'chart'); bk.b.appendChild(bkc); const bkt = el('div', 'take'); bk.b.appendChild(bkt);
  function bt() {
    RNG_S = 2027;
    const mv = m.tvm * ui.fix / 100, dv01 = mv * ui.dur / 10000, sd1 = dv01 * ui.vol;
    const pnl = []; for (let i = 0; i < 250; i++) { let c = 0; for (let k = 0; k < 4; k++) { const g = gauss(); c += g * g; } pnl.push(gauss() / Math.sqrt(c / 4) * Math.sqrt(2 / 4) * sd1); }
    const v99 = 2.326 * sd1, exc = pnl.filter(x => -x > v99).length, T = 250, p = 0.01;
    const ph = exc / T;
    const lr = exc >= T ? -2 * T * Math.log(p) : exc === 0 ? -2 * (T * Math.log(1 - p)) : -2 * ((T - exc) * Math.log(1 - p) + exc * Math.log(p) - ((T - exc) * Math.log(1 - ph) + exc * Math.log(ph)));
    const pv = 1 - (erf(Math.sqrt(lr / 2)));
    const zone = exc <= 4 ? ['verde', 'good'] : exc <= 9 ? ['amarela', 'warn'] : ['vermelha', 'crit'];
    barChart(bkc, { cats: pnl.map((_, i) => 'd' + (i + 1)), series: [{ name: 'P&L diário', values: pnl, colors: pnl.map(x => -x > v99 ? 'var(--crit)' : x < 0 ? 'var(--s2)' : 'var(--s1)') }], lines: [{ name: '−VaR 99%', values: pnl.map(() => -v99), color: 'var(--crit)' }], fmt: brl, h: 200, maxBar: 6 });
    bkt.innerHTML = `<b>${exc}</b> exceções em 250 dias (esperado: 2,5). Estatística de Kupiec LR = ${dec(lr, 2)} (p ≈ ${dec(pv, 3)}) — ${pv < 0.05 ? 'rejeita' : 'não rejeita'} a cobertura correta a 5%. Zona <span class="st ${zone[1]}"><i>${ST_IC[zone[1]]}</i>${zone[0]}</span> de Basileia (0–4 verde, 5–9 amarela, ≥10 vermelha). A normal subestima caudas gordas: por isso o ES de 97,5% substituiu o VaR de 99% no FRTB.`;
  }
  run();
  // juros
  const jc = card(G, { cls: 'c12', title: 'Ambiente de juros', sub: 'Selic meta, CDI mensal anualizado e IPCA 12 meses (SGS) · expectativas Focus para a Selic', src: [['SGS 432 · 4189 · 13522', ''], ['Focus', '']] });
  const i0 = SG.meses.indexOf('202101');
  const ms = SG.meses.slice(i0);
  lineChart(chartEl(jc.b, 220), { cats: ms.map(mlab), series: [{ name: 'Selic meta', color: 'var(--s7)', values: ms.map(x => sgv('selic', x)) }, { name: 'CDI (anualizado)', color: 'var(--s1)', values: ms.map(x => sgv('cdi', x)) }, { name: 'IPCA 12m', color: 'var(--s2)', values: ms.map(x => sgv('ipca12', x)) }], h: 220 });
  const fc = D.SCR.focus && D.SCR.focus.Selic ? D.SCR.focus.Selic.ref : null;
  if (fc) jc.b.appendChild(el('div', 'take', 'Focus (mediana da Selic no fim do ano): ' + Object.entries(fc).map(([y, v]) => `<b>${y}</b> ${nf(2).format(v)}%`).join(' · ') + '. Juro real ex-ante elevado amplia o custo de carregar ativos prefixados e eleva o valor econômico de depósitos estáveis.'));
};

/* ---------------- ALM & IRRBB ---------------- */
const BK6 = [{ l: 'até 3m', t: 0.125 }, { l: '3–12m', t: 0.625 }, { l: '1–3a', t: 2 }, { l: '3–5a', t: 4 }, { l: '5–15a', t: 9 }, { l: '>15a', t: 20 }];
function spreadAt(T) { const w = new Array(6).fill(0); if (T <= BK6[0].t) { w[0] = 1; return w; } for (let i = 0; i < 5; i++) { if (T <= BK6[i + 1].t) { const f = (T - BK6[i].t) / (BK6[i + 1].t - BK6[i].t); w[i] = 1 - f; w[i + 1] = f; return w; } } w[5] = 1; return w; }
function almCalc(n, u) {
  const m = metrics(n), r = m.r;
  const A = new Array(6).fill(0), Lb = new Array(6).fill(0), detA = {}, detL = {};
  const add = (arr, det, key, i, v) => { arr[i] += v; (det[key] || (det[key] = new Array(6).fill(0)))[i] += v; };
  // crédito: vencimentos SCR, pós-fixados repactuam no 1º bucket
  const mat = new Array(6).fill(0);
  [r.pf, r.pj].forEach(M => { if (M) M.forEach(row => { for (let i = 0; i < 6; i++) mat[i] += row[i]; }); });
  const tm = sum(mat) || 1, scale = m.cart / tm;
  const fl = div((r.ix[XI.cdi] || 0) + (r.ix[XI.selic] || 0) + (r.ix[XI.oflu] || 0) + (r.ix[XI.opos] || 0), r.ix[XI.tot] || 1) || 0;
  for (let i = 0; i < 6; i++) add(A, detA, 'Crédito prefixado/indexado', i, mat[i] * scale * (1 - fl));
  add(A, detA, 'Crédito pós-fixado', 0, m.cart * fl);
  add(A, detA, 'Aplicações interfinanceiras', 0, m.aplic);
  if (m.cent) add(A, detA, 'Centralização financeira', 0, m.cent);
  add(A, detA, 'TVM pós-fixado', 0, m.tvm * (1 - u.tvmFix / 100));
  spreadAt(u.tvmDur).forEach((w, i) => add(A, detA, 'TVM prefixado', i, m.tvm * u.tvmFix / 100 * w));
  // passivo
  const nmd = m.dvis + m.dpou;
  add(Lb, detL, 'Depósitos à vista e poupança (não core)', 0, nmd * (1 - u.core / 100));
  spreadAt(u.coreMat).forEach((w, i) => add(Lb, detL, 'Depósitos à vista e poupança (core)', i, nmd * u.core / 100 * w));
  const term = m.dpra + m.dint + m.dout + m.dpre + m.lca + m.lci;
  add(Lb, detL, 'Depósitos a prazo e letras pós-fixados', 0, term * u.float / 100);
  add(Lb, detL, 'Depósitos a prazo e letras prefixados', 1, term * (1 - u.float / 100));
  add(Lb, detL, 'Compromissadas', 0, m.comp);
  add(Lb, detL, 'Letras financeiras e dívida externa', 2, m.lf + m.ext + m.demi);
  add(Lb, detL, 'Repasses e empréstimos', 2, m.emr);
  add(Lb, detL, 'Dívida elegível a capital', 3, m.dcap);
  const gap = A.map((a, i) => a - Lb[i]);
  let c = 0; const cum = gap.map(g => (c += g));
  const r0 = SELIC_NOW, Sx = 0.05, Lx = 0.03, Px = 0.04;
  const S = t => Sx * Math.exp(-t / 4), Lg = t => Lx * (1 - Math.exp(-t / 4));
  const SC = [
    ['Paralelo +', t => Px], ['Paralelo −', t => -Px], ['Inclinação (steepener)', t => -0.65 * S(t) + 0.9 * Lg(t)],
    ['Achatamento (flattener)', t => 0.8 * S(t) - 0.6 * Lg(t)], ['Curto +', t => S(t)], ['Curto −', t => -S(t)]];
  const eve = SC.map(([l, f]) => ({ l, v: sum(gap.map((g, i) => g * (Math.exp(-(r0 + f(BK6[i].t)) * BK6[i].t) - Math.exp(-r0 * BK6[i].t)))) }));
  const nii = s => sum(gap.map((g, i) => BK6[i].t < 1 ? g * s * (1 - BK6[i].t) : 0));
  const sa = sum(A), sl = sum(Lb);
  const dA = sum(A.map((a, i) => a * BK6[i].t)) / (sa || 1), dL = sum(Lb.map((a, i) => a * BK6[i].t)) / (sl || 1);
  return { m, A, L: Lb, detA, detL, gap, cum, eve, nii, dA, dL, dGap: dA - (sl / (sa || 1)) * dL, fl, r0 };
}
function almDefaults(n) { return { core: 55, coreMat: 2.5, float: isCoop(n) ? 88 : 75, tvmFix: isCoop(n) ? 15 : 35, tvmDur: 2.5, shock: 200, run: 10 }; }
VIEWS.alm = (V, n) => {
  const u = ST.ui.alm && ST.ui.alm._id === n.id ? ST.ui.alm : (ST.ui.alm = Object.assign(almDefaults(n), { _id: n.id }));
  head(V, 'Riscos · ALM, IRRBB e liquidez', 'ALM & IRRBB — ' + esc(nameOf(n)), `Descasamento de repactuação entre ativos e passivos sensíveis a juros, valor econômico (ΔEVE) nos seis choques padronizados do Comitê de Basileia calibrados para o real, resultado de intermediação (ΔNII) e indicadores de liquidez. Prazos do crédito e indexadores vêm do SCR; o comportamento de depósitos é premissa ajustável.`);
  const K = el('div', 'kpis'); V.appendChild(K);
  const G = grid(V); G.classList.add('mt');
  const cc = card(G, { cls: 'c12', title: 'Premissas comportamentais', sub: 'Mude e veja o gap, o ΔEVE e o ΔNII se recalcularem', src: [['premissas', 'm']], fx: 'nmd' });
  const cw = el('div', 'grid g4'); cc.b.appendChild(cw);
  const gp = card(G, { cls: 'c8', title: 'Gap de repactuação por prazo', sub: 'Ativos sensíveis (+), passivos sensíveis (−) e gap acumulado', fx: 'gap' });
  const gpc = el('div', 'chart'); gp.b.appendChild(gpc);
  const ev = card(G, { cls: 'c4', title: 'ΔEVE · seis choques BCBS (BRL)', sub: 'Paralelo ±400 bp, curto ±500 bp, longo 300 bp', fx: 'eve' });
  const evc = el('div', 'chart'); ev.b.appendChild(evc); const evt = el('div', 'take'); ev.b.appendChild(evt);
  const ni = card(G, { cls: 'c6', title: 'ΔNII em 12 meses', sub: 'Choques paralelos instantâneos sobre o balanço constante', fx: 'nii' });
  const nic = el('div', 'chart'); ni.b.appendChild(nic);
  const lq = card(G, { cls: 'c6', title: 'Liquidez sob estresse de saques', sub: 'Ativos líquidos × saídas em 30 dias (proxy inspirada no LCR)', fx: 'lcr' });
  const lqc = el('div'); lq.b.appendChild(lqc);
  const tf = card(G, { cls: 'c12', title: 'Transformação de prazos', sub: 'Fluxograma do funding (por prazo de repactuação) para os ativos (alocação proporcional ilustrativa)' });
  const tfc = el('div', 'chart'); tf.b.appendChild(tfc);
  const run = () => {
    const R = almCalc(n, u), m = R.m;
    K.innerHTML = '';
    const worst = R.eve.reduce((a, b) => b.v < a.v ? b : a);
    kpi(K, { l: 'Gap até 12 meses', v: brl(R.cum[1]), d: pct(div(R.cum[1], m.at), 1) + ' do ativo', fx: 'gap' });
    kpi(K, { l: 'Pior ΔEVE', v: brl(worst.v), d: worst.l + ' · ' + pct(div(worst.v, m.n1), 1) + ' do nível I', cls: 'accent', fx: 'eve' });
    kpi(K, { l: 'Teste de outlier (15% N1)', v: Math.abs(div(worst.v, m.n1)) > .15 ? '<span style="color:var(--crit-ink)">acima</span>' : '<span style="color:var(--good-ink)">dentro</span>', d: 'limite supervisório BCBS' });
    kpi(K, { l: `ΔNII +${u.shock} bp`, v: brl(R.nii(u.shock / 10000)), d: pct(div(R.nii(u.shock / 10000), m.nii), 1) + ' da margem' });
    kpi(K, { l: 'Duration gap', v: dec(R.dGap, 2) + ' anos', d: 'D ativos ' + dec(R.dA, 2) + ' · D passivos ' + dec(R.dL, 2) });
    kpi(K, { l: 'Capital IRRBB reportado', v: ok(m.irrbbPR) ? brl(m.irrbb) : 'n/a', d: ok(m.irrbbPR) ? pct(m.irrbbPR, 1) + ' do PR (S1–S4)' : 'S5: sem parcela IRRBB', fx: 'irrbb' });
    kpi(K, { l: 'Crédito pós-fixado', v: pct(R.fl, 0), d: 'repactua em até 3 meses' });
    barChart(gpc, { cats: BK6.map(b => b.l), series: [{ name: 'Ativos sensíveis', values: R.A, color: 'var(--s1)' }, { name: 'Passivos sensíveis', values: R.L.map(x => -x), color: 'var(--gold)' }], lines: [{ name: 'Gap acumulado', values: R.cum, color: 'var(--s8)' }], fmt: brl, h: 280, tipExtra: (i) => ttRow('Gap do prazo', brl(R.gap[i])) + ttRow('Gap acumulado', brl(R.cum[i])) });
    hbars(evc, R.eve.map(e => ({ label: e.l, value: e.v, color: e.v < 0 ? 'var(--s8)' : 'var(--s3)', tip: ttRow('% do nível I', pct(div(e.v, m.n1), 2)) })), { lw: 150, vw: 82 });
    evt.innerHTML = `Taxa-base: Selic de ${pct(R.r0, 2)}. Pior cenário <b>${worst.l}</b>: ${brl(worst.v)} (${pct(div(worst.v, m.n1), 1)} do nível I). Compare com o capital IRRBB reportado de ${brl(m.irrbb)}.`;
    const sh = [-400, -300, -200, -100, 100, 200, 300, 400];
    const nv = sh.map(s => R.nii(s / 10000));
    barChart(nic, { cats: sh.map(s => (s > 0 ? '+' : '') + s + ' bp'), series: [{ name: 'ΔNII 12m', values: nv, colors: nv.map(v => v >= 0 ? 'var(--s3)' : 'var(--s8)') }], fmt: brl, h: 200, labels: true, tipExtra: i => ttRow('% da margem 12m', pct(div(nv[i], m.nii), 1)) });
    nic.appendChild(el('div', 'take', `Balanço <b>${R.cum[1] >= 0 ? 'ativo-sensível' : 'passivo-sensível'}</b> em 12 meses: gap acumulado de ${brl(R.cum[1])}. Cada +100 bp ${R.nii(0.01) >= 0 ? 'somam' : 'subtraem'} ${brl(Math.abs(R.nii(0.01)))} à margem (${pct(Math.abs(div(R.nii(0.01), m.nii)), 1)} do NII de 12 meses), enquanto o valor econômico ${R.eve[0].v < 0 ? 'cai' : 'sobe'} ${brl(Math.abs(R.eve[0].v))} no choque paralelo de +400 bp — o dilema clássico entre resultado e valor.`));
    // liquidez
    const hqla = m.disp + m.aplic + 0.85 * m.tvm + m.cent;
    const out = (m.dvis + m.dpou) * u.run / 100 + (m.dpra + m.dint + m.dout) * u.run / 100 * 0.8 + m.comp * 0.5 + (m.lca + m.lci + m.lf) / 12;
    const lcr = div(hqla, out);
    lqc.innerHTML = '';
    const kk = el('div', 'kpis'); lqc.appendChild(kk);
    kpi(kk, { l: 'Ativos líquidos ajustados', v: brl(hqla), d: m.cent ? 'inclui ' + brl(m.cent) + ' na central' : 'TVM com haircut de 15%' });
    kpi(kk, { l: 'Saídas em 30 dias', v: brl(out), d: 'saque de ' + u.run + '% dos depósitos' });
    kpi(kk, { l: 'Cobertura de liquidez', v: mult(lcr, 1), d: lcr >= 1 ? stChip('liqA', 1, 'cobre') : stChip('liqA', 0, 'não cobre'), cls: 'accent' });
    kpi(kk, { l: 'Crédito ÷ depósitos', v: pct(m.ltd, 0), d: 'crédito ÷ captações ' + pct(m.ltdC, 0) });
    const fd = fundingParts(m);
    const dn = el('div', 'chart mt'); lqc.appendChild(dn);
    donut(dn, fd, { center: { v: brl(sum(fd.map(x => x.value))), l: 'funding' }, size: 150, thick: 18 });
    // transformação
    const left = [{ label: 'À vista e poupança', value: m.dvis + m.dpou, color: BLUE_RAMP[0] }, { label: 'Prazo e letras', value: m.dpra + m.dint + m.dout + m.dpre + m.lca + m.lci, color: BLUE_RAMP[1] }, { label: 'LF, repasses e dívida', value: m.lf + m.ext + m.demi + m.emr + m.dcap + m.comp, color: BLUE_RAMP[2] }, { label: 'Outras obrigações', value: m.oob + m.derp, color: BLUE_RAMP[3] }, { label: 'Patrimônio líquido', value: m.pl, color: 'var(--gold)' }];
    const mat = R.detA; const cr = (i0, i1) => sum(['Crédito prefixado/indexado', 'Crédito pós-fixado'].map(k => sum((mat[k] || []).slice(i0, i1))));
    const right = [{ label: 'Liquidez e tesouraria', value: m.liq, color: 'var(--s7)' }, { label: 'Crédito até 1 ano', value: cr(0, 2), color: GOLD_RAMP[1] }, { label: 'Crédito 1 a 5 anos', value: cr(2, 4), color: GOLD_RAMP[2] }, { label: 'Crédito acima de 5 anos', value: cr(4, 6), color: GOLD_RAMP[3] }, { label: 'Outros ativos e permanente', value: Math.max(0, m.at - m.liq - cr(0, 6)), color: '#8A8F9C' }];
    sankey(tfc, left.filter(x => x.value > 0), right.filter(x => x.value > 0), { h: 300, lw: 170, rw: 190 });
  };
  const s = (lbl, k, mn, mx, st, f) => { const b = el('div', 'ctl'); cw.appendChild(b); slider(b, { label: lbl, min: mn, max: mx, step: st, value: u[k], fmt: f, onInput: v => { u[k] = v; run(); } }); };
  s('Depósitos à vista/poupança core', 'core', 0, 90, 5, v => v + '%');
  s('Prazo médio do core', 'coreMat', .5, 5, .25, v => nf(2).format(v) + ' anos');
  s('Depósitos a prazo/letras pós-fixados', 'float', 0, 100, 1, v => v + '%');
  s('TVM prefixado', 'tvmFix', 0, 100, 1, v => v + '%');
  s('Duration do TVM prefixado', 'tvmDur', .25, 8, .25, v => nf(2).format(v) + ' anos');
  s('Choque para o ΔNII (KPI)', 'shock', 50, 500, 50, v => '+' + v + ' bp');
  s('Saque em 30 dias (estresse)', 'run', 0, 40, 1, v => v + '%');
  run();
};

/* ---------------- NII & pricing ---------------- */
const PRODUCTS = {
  cons: { t: 'Consignado PF', pd: 2.5, lgd: 35, rw: 75, tenor: 4 },
  pess: { t: 'Pessoal não consignado', pd: 8, lgd: 60, rw: 75, tenor: 2 },
  card: { t: 'Cartão (rotativo/parcelado)', pd: 14, lgd: 75, rw: 75, tenor: .5 },
  veic: { t: 'Veículos PF', pd: 4, lgd: 40, rw: 75, tenor: 4 },
  giro: { t: 'Capital de giro PJ', pd: 4.5, lgd: 45, rw: 85, tenor: 2 },
  rural: { t: 'Rural · custeio', pd: 2, lgd: 30, rw: 75, tenor: 1 },
  hab: { t: 'Habitacional', pd: 1.2, lgd: 15, rw: 35, tenor: 15 },
};
VIEWS.nii = (V, n) => {
  const m = metrics(n);
  head(V, 'Riscos · NII e precificação', 'NII & pricing — ' + esc(nameOf(n)), `De onde vem a margem financeira (NII), como ela reage aos juros e qual a taxa mínima que remunera funding, perda esperada, custo operacional e capital (RAROC).`);
  const K = el('div', 'kpis'); V.appendChild(K);
  kpi(K, { l: 'NII 12m (antes da PE)', v: { n: m.nii, f: 'brl' }, fx: 'nim' });
  kpi(K, { l: 'NIM', v: { n: m.nim, f: 'pct' }, d: 'mediana pares ' + pct(peerMed(n, 'nim')) });
  kpi(K, { l: 'Taxa implícita da carteira', v: { n: m.yld, f: 'pct' }, fx: 'yld' });
  kpi(K, { l: 'Custo de captação', v: { n: m.cof, f: 'pct' }, d: pct(div(m.cof, CDI_LTM), 0) + ' do CDI', fx: 'cof' });
  kpi(K, { l: 'Spread bruto', v: { n: m.spread, f: 'pp' }, cls: 'accent' });
  kpi(K, { l: 'Eficiência', v: { n: m.eff, f: 'pct' }, d: stChip('eff', m.eff), fx: 'eff' });
  const G = grid(V); G.classList.add('mt');
  const H = k => m.H(k);
  const qc = card(G, { cls: 'c7', title: 'Formação do NII por trimestre', sub: 'Receitas (+) e despesas (−) da intermediação · linha = NII antes da perda esperada' });
  const niiq = H('rif').map((x, i) => x - H('pecr')[i]);
  barChart(chartEl(qc.b, 260), { cats: qcats(), stacked: true, series: [{ name: 'Rendas de crédito', values: H('rcre'), color: 'var(--pos)' }, { name: 'TVM e aplicações', values: H('rtvm').map((x, i) => x + H('rapl')[i]), color: 'var(--pos-2)' }, { name: 'Despesas de captação', values: H('dcp'), color: 'var(--neg)' }], lines: [{ name: 'NII', values: niiq, color: 'var(--s1)' }], fmt: brl, h: 260 });
  const sn = card(G, { cls: 'c5', title: 'Sensibilidade do NII aos juros', sub: 'Mesmo motor de repactuação do ALM (premissas padrão)', fx: 'nii' });
  const R = almCalc(n, almDefaults(n));
  const sh = [-300, -200, -100, 100, 200, 300], nv = sh.map(s => R.nii(s / 10000));
  barChart(chartEl(sn.b, 200), { cats: sh.map(s => (s > 0 ? '+' : '') + s + ' bp'), series: [{ name: 'ΔNII', values: nv, colors: nv.map(v => v >= 0 ? 'var(--s3)' : 'var(--s8)') }], fmt: brl, h: 200, labels: true });
  sn.b.appendChild(el('div', 'take', `${R.cum[1] >= 0 ? 'Ativo-sensível' : 'Passivo-sensível'} em 12 meses (gap acumulado ${brl(R.cum[1])}): uma alta de 100 bp ${R.nii(0.01) >= 0 ? 'eleva' : 'reduz'} a margem em ${brl(Math.abs(R.nii(0.01)))} (${pct(Math.abs(div(R.nii(0.01), m.nii)), 1)}).`));
  const yc = card(G, { cls: 'c12', title: 'Taxas implícitas × CDI', sub: 'Taxa da carteira, custo de captação e spread trimestrais anualizados' });
  const cdiQ = D.Q.map(q => { const y = q.slice(0, 4), mm = +q.slice(4); const ms = [mm - 2, mm - 1, mm].map(x => y + String(x).padStart(2, '0')); return mean(ms.map(x => sgv('cdi', x))); });
  lineChart(chartEl(yc.b, 220), { cats: qcats(), series: [{ name: 'Taxa da carteira', color: 'var(--pos)', values: m.q.yld }, { name: 'Custo de captação', color: 'var(--neg)', values: m.q.cof }, { name: 'CDI', color: 'var(--ink-3)', values: cdiQ, dash: '5 4' }, { name: 'Spread', color: 'var(--s1)', values: m.q.spread, area: true }], h: 220 });
  // RAROC pricing
  const pc = card(G, { cls: 'c12', title: 'Precificação baseada em risco (RAROC)', sub: 'Taxa mínima = funding + perda esperada + custo operacional + custo do capital', src: [['modelo', 'm']], fx: 'raroc' });
  const effTax = clamp(div(-m.L.ir, m.L.lair) || 0, 0, .45);
  const u = ST.ui.prc || (ST.ui.prc = { p: 'giro' });
  const P0 = PRODUCTS[u.p];
  const ps = Object.assign({ pd: P0.pd, lgd: P0.lgd, rw: P0.rw, fund: +(div(m.cof, CDI_LTM) * 100 || 100).toFixed(0), opx: +((div(m.opx, m.avg.crb) || 0.04) * 100 * 0.6).toFixed(1), hurdle: 15, tax: Math.round(effTax * 100) }, u.ps && u.ps._p === u.p ? u.ps : {});
  u.ps = ps; ps._p = u.p;
  const w = el('div', 'grid g12'); pc.b.appendChild(w);
  const ctl = el('div', 'ctl c3'); w.appendChild(ctl);
  const out = el('div', 'c9'); w.appendChild(out);
  const sel = el('select', 'sel'); sel.innerHTML = Object.entries(PRODUCTS).map(([k, p]) => `<option value="${k}" ${k === u.p ? 'selected' : ''}>${p.t}</option>`).join('');
  sel.onchange = () => { u.p = sel.value; u.ps = null; render(false); };
  const lb = el('label', '', '<span style="font-size:12px;color:var(--ink-2);font-weight:500">Produto</span>'); lb.style.cssText = 'display:grid;gap:4px'; lb.appendChild(sel); ctl.appendChild(lb);
  const ko = el('div', 'kpis'); out.appendChild(ko); const chp = el('div', 'chart'); out.appendChild(chp); const tk = el('div', 'take'); out.appendChild(tk);
  const run = () => {
    const CF = CDI_LTM * ps.fund / 100, K = ps.rw / 100 * capK(m), EL = ps.pd / 100 * ps.lgd / 100, OP = ps.opx / 100, h = ps.hurdle / 100, t = ps.tax / 100;
    const fundC = CF * (1 - K), capC = h * K / (1 - t);
    const rate = fundC + EL + OP + capC;
    const raroc = div((m.yld - m.cof - m.cor - div(m.opx, m.avg.crb) * OPX_CRED) * (1 - t), capK(m) * (m.rwac / Math.max(1, m.cart)));
    ko.innerHTML = '';
    kpi(ko, { l: 'Taxa mínima', v: pct(rate, 2), u: 'a.a.', d: pct(Math.pow(1 + rate, 1 / 12) - 1, 2) + ' a.m.', cls: 'accent' });
    kpi(ko, { l: 'Spread mínimo sobre CDI', v: pp(rate - CDI_LTM, 2) });
    kpi(ko, { l: 'Capital alocado', v: pct(K, 1), d: 'RW ' + ps.rw + '% × ' + pct(capK(m), 1) + ' · hipótese: capital no mínimo aplicável' });
    kpi(ko, { l: 'RAROC implícito da carteira', v: pct(raroc, 1), d: 'hurdle ' + ps.hurdle + '% · hipótese: ' + pct(OPX_CRED, 0) + ' das despesas no crédito' });
    waterfall(chp, [{ label: 'Funding (CDI × % do CDI)', value: fundC, kind: 'start', color: 'var(--neg)' }, { label: 'Perda esperada (PD × LGD)', value: EL, color: 'var(--neg-2)' }, { label: 'Custo operacional', value: OP, color: 'var(--neg-3)' }, { label: 'Custo do capital (com tributos)', value: capC, color: 'var(--neg-4)' }, { label: 'Taxa mínima', value: rate, kind: 'total', color: 'var(--gold)' }, { label: 'Taxa da carteira atual', value: m.yld, kind: 'total', color: 'var(--s1)' }], { fmt: x => pct(x, 1), h: 240, rot: false });
    tk.innerHTML = `Para <b>${PRODUCTS[u.p].t}</b>: com funding a ${ps.fund}% do CDI (${pct(CF, 2)}), perda esperada de ${pct(EL, 2)}, custo operacional de ${pct(OP, 1)} e retorno exigido de ${ps.hurdle}% sobre ${pct(K, 1)} de capital (alíquota ${ps.tax}%), a taxa que paga o risco é <b>${pct(rate, 2)} a.a.</b> A taxa média da carteira atual é ${pct(m.yld, 1)} — comparação de ordem de grandeza (estoque, todas as modalidades).`;
  };
  const s = (lbl, k, mn, mx, st, f) => slider(ctl, { label: lbl, min: mn, max: mx, step: st, value: ps[k], fmt: f, onInput: v => { ps[k] = v; run(); } });
  s('PD', 'pd', .2, 30, .1, v => nf(1).format(v) + '%'); s('LGD', 'lgd', 5, 90, 1, v => v + '%'); s('Ponderação de risco (RW)', 'rw', 20, 150, 5, v => v + '%');
  s('Funding (% do CDI)', 'fund', 80, 130, 1, v => v + '%'); s('Custo operacional', 'opx', .5, 12, .1, v => nf(1).format(v) + '% a.a.');
  s('Retorno exigido (hurdle)', 'hurdle', 5, 30, 1, v => v + '%'); s('Alíquota efetiva', 'tax', 0, 45, 1, v => v + '%');
  ctl.appendChild(el('p', 'note', `CDI médio 12m: ${pct(CDI_LTM, 2)}. Funding e custo operacional iniciam calibrados pela DRE da instituição; alíquota efetiva observada: ${pct(effTax, 0)}.`));
  run();
};

/* ---------------- FRM 360 ---------------- */
VIEWS.frm = (V, n) => {
  const m = metrics(n);
  head(V, 'Riscos · Visão integrada', 'FRM 360° — ' + esc(nameOf(n)), `Painel de apetite a risco com limites e pares, capital econômico agregado com correlações entre riscos (exercício ilustrativo, não ICAAP) e testes de estresse combinados — a leitura de um comitê de riscos.`);
  const G = grid(V);
  const tb = card(G, { cls: 'c12', title: 'Painel de apetite a risco', sub: 'Indicador · limites (confortável / atenção / alerta) · mediana e percentil entre pares', fx: 'appetite' });
  const keys = ['ib', 'icp', 'ra', 'inadR', 'probR', 'pbR', 'cob', 'cor', 'roe', 'roa', 'eff', 'ltdC', 'liqA', 'irrbbPR'];
  const fm = k => ['eff', 'ltdC', 'liqA', 'cob'].includes(k) ? (x => pct(x, 0)) : k === 'roa' ? (x => pct(x, 2)) : (x => pct(x, 1));
  tb.b.innerHTML = `<div class="tblwrap" style="max-height:none"><table class="tbl"><thead><tr><th>Indicador</th><th>Valor</th><th>Limites</th><th>Mediana pares</th><th>Percentil</th><th>Status</th></tr></thead><tbody>${keys.map(k => { const t = thrOf(k, m.capMin), x = m[k], p = pctile(n, k, x); const pp_ = ok(p) ? (t.dir > 0 ? p : 1 - p) : NaN; return `<tr><td class="l">${t.lab}</td><td><b>${ok(x) ? fm(k)(x) : 'n/a'}</b></td><td class="muted">${t.dir > 0 ? '≥' : '≤'} ${fm(k)(t.g)} · ${fm(k)(t.w)} · ${fm(k)(t.s)}</td><td>${fm(k)(peerMed(n, k))}</td><td><div class="pctl" style="display:block"><div class="bar" style="width:130px;display:inline-block;vertical-align:middle"><b></b><i style="left:${ok(pp_) ? (pp_ * 100).toFixed(0) : 50}%;width:11px;height:11px;border-width:2px"></i></div><span class="tnum" style="margin-left:8px">${ok(pp_) ? int(pp_ * 100) + 'º' : '—'}</span></div></td><td>${stChip(k, x)}</td></tr>`; }).join('')}</tbody></table></div>`;
  const rd = card(G, { cls: 'c4', title: 'Radar de pilares (rating)', sub: 'Pontuação 0–100 por pilar · comparação com o grupo', fx: 'rating' });
  const rt = ratingOf(n), rg = ratingOf(node(n.grp === 'bank' ? 'G:bank' : 'G:coop'));
  radarChart(chartEl(rd.b, 300), rt.pillars.map(p => p.t), [{ name: n.name, color: 'var(--s1)', values: rt.pillars.map(p => p.s / 100) }, { name: n.grp === 'bank' ? 'Grandes bancos (soma)' : 'Cooperativas (soma)', color: 'var(--gold)', values: rg.pillars.map(p => p.s / 100) }], { size: 300 });
  // capital econômico
  const ec = card(G, { cls: 'c8', title: 'Capital econômico agregado · exercício ilustrativo', sub: 'Crédito (Vasicek 99,9%), mercado (VaR 99,9%), operacional (RWA × 8%, proxy regulatória) e IRRBB — medidas e horizontes diferentes; não é capital econômico calibrado nem ICAAP', src: [['modelo', 'm']], fx: 'ecap' });
  const u = ST.ui.ec || (ST.ui.ec = { rCM: 30, rCO: 20, rCI: 30, rMI: 50 });
  const w = el('div', 'grid g12'); ec.b.appendChild(w); const ctl = el('div', 'ctl c3'); w.appendChild(ctl); const o = el('div', 'c9'); w.appendChild(o);
  const ko = el('div', 'kpis'); o.appendChild(ko); const chx = el('div', 'chart'); o.appendChild(chx); const tk = el('div', 'take'); o.appendChild(tk);
  const pd = clamp((m.inadR || .03) * .9, .004, .25), lgd = isCoop(n) ? .4 : .45;
  const ecC = Math.max(0, (vasicekQ(pd, rhoRetail(pd), .999) - pd) * lgd * m.scr);
  const mvFix = m.tvm * (isCoop(n) ? .15 : .35), ecM = mvFix * 2.5 / 10000 * 9 * 3.09 * Math.sqrt(10);   // só o VaR econômico (somar o RWA de mercado contaria duas vezes)
  const ecO = m.rwao * 0.08;
  const Ralm = almCalc(n, almDefaults(n)); const ecI = Math.max(m.irrbb, -Math.min(0, ...Ralm.eve.map(e => e.v)));
  const runE = () => {
    const v = [ecC, ecM, ecO, ecI];
    const C = [[1, u.rCM / 100, u.rCO / 100, u.rCI / 100], [u.rCM / 100, 1, .2, u.rMI / 100], [u.rCO / 100, .2, 1, .1], [u.rCI / 100, u.rMI / 100, .1, 1]];
    const psd = cholOk(C);   // matriz de correlação válida (positiva semidefinida)?
    let tot = 0; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) tot += v[i] * v[j] * C[i][j];
    tot = Math.sqrt(Math.max(0, tot)); const st = sum(v);
    ko.innerHTML = '';
    kpi(ko, { l: 'Soma dos capitais isolados', v: brl(st), d: psd ? 'matriz de correlação válida' : '<span class="st crit"><i>×</i>matriz inválida: ajuste as correlações</span>' });
    kpi(ko, { l: 'Capital econômico diversificado', v: brl(tot), d: 'diversificação ' + pct(1 - tot / st, 0), cls: 'accent' });
    kpi(ko, { l: 'PR disponível', v: brl(m.pr), d: 'cobertura ' + mult(m.pr / tot, 1) });
    kpi(ko, { l: 'Excedente econômico', v: brl(m.pr - tot), d: m.pr > tot ? 'capital suficiente' : 'déficit' });
    waterfall(chx, [{ label: 'Crédito', value: ecC, kind: 'start', color: 'var(--gold)' }, { label: 'Mercado', value: ecM, color: 'var(--s7)' }, { label: 'Operacional', value: ecO, color: 'var(--s5)' }, { label: 'IRRBB', value: ecI, color: 'var(--s1)' }, { label: 'Diversificação', value: tot - st, color: 'var(--pos)' }, { label: 'Capital econômico', value: tot, kind: 'total', color: 'var(--ink-2)' }, { label: 'PR disponível', value: m.pr, kind: 'total', color: 'var(--gold)' }], { h: 250, rot: false });
    tk.innerHTML = `Agregação por matriz de correlação (variância-covariância): <i>CE = √(vᵀ C v)</i>. Crédito usa PD = ${pct(pd, 1)}, LGD = ${pct(lgd, 0)} e ρ de varejo; mercado usa só o VaR 99,9%/10 dias do TVM prefixado; IRRBB usa o maior entre o capital reportado e a pior perda de EVE estimada.`;
  };
  const s = (lbl, k) => slider(ctl, { label: lbl, min: -20, max: 90, step: 5, value: u[k], fmt: v => (v / 100).toFixed(2).replace('.', ','), onInput: v => { u[k] = v; runE(); } });
  s('ρ crédito × mercado', 'rCM'); s('ρ crédito × operacional', 'rCO'); s('ρ crédito × IRRBB', 'rCI'); s('ρ mercado × IRRBB', 'rMI');
  runE();
  // estresse
  const sx = card(G, { cls: 'c12', title: 'Teste de estresse integrado', sub: 'Choques simultâneos em crédito, juros e liquidez — efeitos sobre capital, resultado e liquidez', src: [['modelo', 'm']], fx: 'stress' });
  const scen = [['Base', 1, 0, 0, 0], ['Adverso', 1.6, .1, 300, 10], ['Severo', 2.5, .2, 500, 20]];
  const pd0 = clamp((m.inadR || .03) * .9, .004, .25);
  const grid3 = el('div', 'grid g3'); sx.b.appendChild(grid3);
  scen.forEach(([nm, pdm, lgdUp, bp, run], i) => {
    const extraLoss = Math.max(0, (pd0 * pdm * (lgd + lgdUp) - pd0 * lgd)) * m.scr;
    const dEve = Math.min(0, sum(Ralm.gap.map((g, j) => g * (Math.exp(-(Ralm.r0 + bp / 10000) * BK6[j].t) - Math.exp(-Ralm.r0 * BK6[j].t)))));
    const dNii = Ralm.nii(bp / 10000);
    const pr1 = m.pr - extraLoss + Math.min(0, dNii);   // ΔEVE é valor econômico, não perda contábil: mostrado à parte, fora do PR
    const ib1 = div(pr1, m.rwa);
    const ll1 = m.ll - extraLoss + dNii;
    const hq = m.disp + m.aplic + .85 * m.tvm + m.cent, outf = (m.dvis + m.dpou + m.dpra) * Math.max(run, 3) / 100 + m.comp * .5;
    const c = el('div', 'cmp-card'); c.style.borderTop = `4px solid ${i === 0 ? 'var(--s3)' : i === 1 ? 'var(--s4)' : 'var(--s8)'}`;
    c.innerHTML = `<b style="font-family:var(--serif);font-size:20px">${nm}</b><div class="muted" style="font-size:11.5px;margin-top:2px">PD ×${nf(1).format(pdm)} · LGD +${int(lgdUp * 100)} p.p. · juros +${bp} bp · saque ${run}%</div>`;
    const gg = el('div'); c.appendChild(gg);
    gauge(gg, { value: ib1, min: 0, max: .3, fmt: x => pct(x, 1), label: 'Basileia pós-estresse', w: 240, h: 140, bands: capBands(m), ticks: [{ v: capK(m), l: pct(capK(m), 1) }] });
    c.insertAdjacentHTML('beforeend', `<div style="display:grid;gap:4px;font-size:12.5px;margin-top:6px">${['Perda de crédito adicional', 'Resultado 12m estressado', 'ΔEVE (juros)', 'Cobertura de liquidez'].map((l, j) => `<div style="display:flex;justify-content:space-between;color:var(--ink-2)"><span>${l}</span><b style="color:var(--ink)">${j === 0 ? brl(extraLoss) : j === 1 ? brl(ll1) : j === 2 ? brl(dEve) : mult(div(hq, outf), 1)}</b></div>`).join('')}</div>`);
    grid3.appendChild(c);
  });
  sx.b.appendChild(el('p', 'note', 'Choques aplicados instantaneamente sobre o balanço da data-base ' + mlab(D.Q[QI]) + '. Perda de crédito = PD estressada × LGD estressada − perda esperada base, sobre a carteira SCR; o ΔEVE é mostrado à parte e não reduz o PR (valor econômico não é perda contábil); ΔNII via gap de repactuação do ALM.'));
};
