'use strict';
/* =====================================================================
   Radar de Riscos — núcleo: dados, agregação, métricas, UI base, gráficos
   ===================================================================== */
let COVERS = {};
try { COVERS = JSON.parse(document.getElementById('radar-covers').textContent || '{}'); } catch (e) { COVERS = {}; }
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
let STILL = false;   // true durante o re-render no lugar (troca de filtro ou controle): sem animações de entrada
const later = (fn, ms) => (RM || STILL) ? fn() : setTimeout(fn, ms);
const idx = a => { const o = {}; a.forEach((f, i) => { o[f] = i; }); return o; };
const FI = idx(D.F), DI = idx(D.DREF), MI = idx(D.MF), CI = idx(D.CLF), XI = idx(D.IDX);
const NQ = D.Q.length, NM = D.M.length;
let QI = NQ - 1;
const SEGK = ['cred', 'card', 'tes', 'srv'];

/* ---------------- formatação ---------------- */
const NF = {};
const nf = d => NF[d] || (NF[d] = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }));
const ok = x => x != null && isFinite(x);
const MINUS = '−';
function brl(v, o = {}) {
  if (!ok(v)) return '—';
  const a = Math.abs(v), s = v < 0 ? MINUS : (o.sign && v > 0 ? '+' : '');
  const p = o.noR ? '' : 'R$ ';
  if (a >= 1e9) return s + p + nf(a >= 1e10 ? 1 : 2).format(a / 1e9) + ' tri';
  if (a >= 1e6) return s + p + nf(a >= 1e8 ? 0 : 1).format(a / 1e6) + ' bi';
  if (a >= 1e3) return s + p + nf(a >= 1e5 ? 0 : 1).format(a / 1e3) + ' mi';
  return s + p + nf(0).format(a) + ' mil';
}
const sgn_ = (x, s, sign) => /[1-9]/.test(s) ? ((sign && x > 0) ? '+' : (x < 0 ? MINUS : '')) : '';   // sem "−0,00"
const pct = (x, d = 1, sign) => { if (!ok(x)) return '—'; const s = nf(d).format(Math.abs(x) * 100); return sgn_(x, s, sign) + s + '%'; };
const pp = (x, d = 1, sign) => { if (!ok(x)) return '—'; const s = nf(d).format(Math.abs(x) * 100); return sgn_(x, s, sign) + s + ' p.p.'; };
const mult = (x, d = 1) => ok(x) ? nf(d).format(x) + '×' : '—';
const int = x => ok(x) ? nf(0).format(Math.round(x)) : '—';
const dec = (x, d = 1) => { if (!ok(x)) return '—'; const s = nf(d).format(Math.abs(x)); return sgn_(x, s) + s; };
const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const mlab = ym => MES[+ym.slice(4) - 1] + '/' + ym.slice(2, 4);
const qlab = ym => (Math.ceil(+ym.slice(4) / 3)) + 'T' + ym.slice(2, 4);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const sum = a => a.reduce((s, x) => s + (x || 0), 0);
const mean = a => { const b = a.filter(ok); return b.length ? sum(b) / b.length : NaN; };
const div = (a, b) => (ok(a) && ok(b) && b !== 0) ? a / b : NaN;
function median(a) { const b = a.filter(ok).sort((x, y) => x - y); if (!b.length) return NaN; const m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; }
function quant(a, q) { const b = a.filter(ok).sort((x, y) => x - y); if (!b.length) return NaN; const p = (b.length - 1) * q, lo = Math.floor(p), hi = Math.ceil(p); return b[lo] + (b[hi] - b[lo]) * (p - lo); }

/* ---------------- sistemas, entidades, árvore ---------------- */
const SYS_ORDER = ['sicredi', 'sicoob', 'cresol', 'unicred', 'ailos', 'uniprime', 'credisis', 'indep'];
const SYS_NAME = { sicredi: 'Sicredi', sicoob: 'Sicoob', cresol: 'Cresol', unicred: 'Unicred', ailos: 'Ailos', uniprime: 'Uniprime', credisis: 'Credisis', indep: 'Independentes' };
const SYS_COLOR = { sicoob: 'var(--s7)', sicredi: 'var(--s2)', cresol: '#8C6230', unicred: 'var(--s5)', ailos: '#C9B27A', uniprime: 'var(--s6)', credisis: '#7E8794', indep: '#B9BFC9' };
const BANK_COLOR = 'var(--s1)';
const ENT = new Map(D.E.map(e => [e.id, e]));
const SYSD = new Map(D.SYS.map(s => [s.id, s]));
const COOPS = D.E.filter(e => e.k === 'c');
const CENTS = D.E.filter(e => e.k === 'x');
const BANKS = D.E.filter(e => e.k === 'b');
const at0 = e => e.V[QI][FI.at] || 0;
COOPS.sort((a, b) => at0(b) - at0(a)); BANKS.sort((a, b) => at0(b) - at0(a));

const NODES = new Map();
function addNode(n) { NODES.set(n.id, n); return n; }
addNode({ id: 'G:coop', name: 'Cooperativas', sub: 'Soma das ' + COOPS.length + ' cooperativas singulares', kind: 'group', grp: 'coop', members: COOPS, color: 'var(--s3)', path: ['G:coop'] });
addNode({ id: 'G:bank', name: 'Bancos', sub: 'Soma dos ' + BANKS.length + ' bancões (conglomerados prudenciais)', kind: 'group', grp: 'bank', members: BANKS, color: BANK_COLOR, path: ['G:bank'] });
for (const s of SYS_ORDER) {
  const mem = COOPS.filter(e => e.s === s);
  if (!mem.length) continue;
  addNode({ id: 'S:' + s, sys: s, name: SYS_NAME[s], sub: mem.length + ' singulares' + (s === 'indep' ? ' não filiadas a centrais' : ''), kind: 'system', grp: 'coop', members: mem, color: SYS_COLOR[s], path: ['G:coop', 'S:' + s], cents: CENTS.filter(c => c.s === s) });
}
for (const e of D.E) {
  const sys = e.k === 'b' ? null : (e.s || 'indep');
  addNode({ id: e.id, ent: e, name: e.n, sub: e.k === 'b' ? (e.sr ? 'Segmento ' + e.sr + ' · ' : '') + 'Conglomerado prudencial' : (e.k === 'x' ? 'Cooperativa central (2º grau)' : (e.ce ? e.ce : 'Não filiada')) + (e.uf ? ' · ' + (e.mu ? e.mu + '/' : '') + e.uf : ''), kind: e.k === 'b' ? 'bank' : (e.k === 'x' ? 'central' : 'coop'), grp: e.k === 'b' ? 'bank' : 'coop', members: [e], color: e.k === 'b' ? BANK_COLOR : SYS_COLOR[sys], sys, path: e.k === 'b' ? ['G:bank', e.id] : ['G:coop', 'S:' + sys, e.id] });
}
const node = id => NODES.get(id) || NODES.get('G:coop');
const peersOf = n => n.grp === 'bank' ? BANKS : COOPS;

/* ---------------- agregação (v2: por trimestre) ---------------- */
const AGG = new Map();
const zeros = n => new Array(n).fill(0);
const NF_ = D.F.length, ND_ = D.DREF.length, NX_ = D.IDX.length, NC_ = D.CLF.length;
const semEnd = q => /0[6]$|12$/.test(D.Q[q]);
function capCover(L) {
  const z = () => zeros(NQ);
  const x = { cp: z(), n1: z(), rwaCp: z(), n1e: z(), expo: z(), prI: z(), irr: z(), nFull: z() };
  for (const e of L) for (let q = 0; q < NQ; q++) {
    const v = k => e.V[q][FI[k]] || 0;
    if (v('cp') > 0) { x.cp[q] += v('cp'); x.n1[q] += v('n1'); x.rwaCp[q] += v('rwa'); x.nFull[q]++; }
    if (v('n1') > 0 && v('expo') > 0) { x.n1e[q] += v('n1'); x.expo[q] += v('expo'); }
    if (e.sr && e.sr !== 'S5' && v('pr') > 0) { x.prI[q] += v('pr'); x.irr[q] += v('irrbb'); }
  }
  return x;
}
function bcMap(flat) {
  const mp = new Map(); if (!flat) return mp;
  for (let i = 0; i < flat.length; i += NQ + 1) mp.set(flat[i], flat.slice(i + 1, i + 1 + NQ));
  return mp;
}
function aggregate(n) {
  if (AGG.has(n.id)) return AGG.get(n.id);
  const L = n.members;
  let r;
  if (L.length === 1) {
    const e = L[0];
    r = { V: e.V, R: e.R, X: e.X, PF: e.PF || null, PJ: e.PJ || null, CZ: e.CZ || null, BCf: e.BC || null, M: e.M || null, IQ: e.IQ || zeros(NQ), nm: 1,
      imob: e.V.map(v => (v[FI.imob] || 0) / 1000), x: capCover([e]), nCz: (e.CZ || []).map(c => c ? 1 : 0) };
  } else {
    r = { V: D.Q.map(() => zeros(NF_)), R: D.Q.map(() => zeros(ND_)), X: D.Q.map(() => zeros(NX_)), PF: D.Q.map(() => zeros(49)), PJ: D.Q.map(() => zeros(63)),
      CZ: D.Q.map(() => zeros(NC_)), M: D.MF.map(() => new Array(NM).fill(null)), IQ: zeros(NQ), nm: L.length, nCz: zeros(NQ), imob: zeros(NQ) };
    const bc = new Map(), imW = zeros(NQ), prW = zeros(NQ);
    let anyPF = false, anyPJ = false;
    for (const e of L) {
      for (let q = 0; q < NQ; q++) {
        const V = e.V[q], R = e.R[q], X = e.X[q], RV = r.V[q], RR = r.R[q], RX = r.X[q];
        for (let i = 0; i < NF_; i++) RV[i] += V[i];
        for (let i = 0; i < ND_; i++) RR[i] += R[i];
        for (let i = 0; i < NX_; i++) RX[i] += X[i];
        if (e.PF && e.PF[q]) { anyPF = true; const a = e.PF[q], b = r.PF[q]; for (let i = 0; i < 49; i++) b[i] += a[i]; }
        if (e.PJ && e.PJ[q]) { anyPJ = true; const a = e.PJ[q], b = r.PJ[q]; for (let i = 0; i < 63; i++) b[i] += a[i]; }
        if (e.CZ && e.CZ[q]) { r.nCz[q]++; const a = e.CZ[q], b = r.CZ[q]; for (let i = 0; i < NC_; i++) b[i] += a[i]; }
        const pr = V[FI.pr] || 0; imW[q] += (V[FI.imob] / 1000) * pr; prW[q] += pr;
        if (e.IQ) r.IQ[q] += e.IQ[q];
      }
      if (e.M) for (let f = 0; f < e.M.length; f++) for (let t = 0; t < NM; t++) { const x = e.M[f][t]; if (x != null) r.M[f][t] = (r.M[f][t] || 0) + x; }
      if (e.BC) for (let i = 0; i < e.BC.length; i += NQ + 1) { const k = e.BC[i]; let c = bc.get(k); if (!c) { c = zeros(NQ); bc.set(k, c); } for (let q = 0; q < NQ; q++) c[q] += e.BC[i + 1 + q] || 0; }
    }
    r.imob = imW.map((w, q) => prW[q] ? w / prW[q] : NaN);
    if (!anyPF) r.PF = null; if (!anyPJ) r.PJ = null;
    r.CZ = r.CZ.map((c, q) => r.nCz[q] ? c : null); if (!r.CZ.some(Boolean)) r.CZ = null;
    r.BC = bc; r.x = capCover(L);
  }
  if (!r.BC) r.BC = bcMap(r.BCf);
  AGG.set(n.id, r);
  return r;
}

/* ---------------- métricas na data-base ---------------- */
const MC = new Map();
const range = (a, b) => { const o = []; for (let i = a; i <= b; i++) o.push(i); return o; };
function mEnd(qi) { return D.M.indexOf(D.Q[qi]); }
const mat2 = (flat, rows) => flat ? range(0, rows - 1).map(i => flat.slice(i * 7, i * 7 + 7)) : null;
function metricsAt(n, qi) {
  const key = n.id + '|' + qi; if (MC.has(key)) return MC.get(key);
  const r = aggregate(n);
  const Vq = (k, q = qi) => r.V[q][FI[k]] || 0;
  const flow = (k, q) => { const j = DI[k], c = r.R[q][j] || 0; return (semEnd(q) && q > 0) ? c - (r.R[q - 1][j] || 0) : c; };
  const nz = a => { if (!a) return false; for (const x of a) if (x) return true; return false; };
  const hasV = q => nz(r.V[q]), hasR = q => nz(r.R[q]);
  // fluxo do trimestre nas séries: NaN quando falta o relatório 4 do trimestre — ou do anterior, em jun e dez —, porque a DRE do
  // IF.data acumula no semestre e, sem o trimestre anterior, jun e dez carregariam o semestre inteiro
  const flowQ = (k, q) => (!hasR(q) || (semEnd(q) && q > 0 && !hasR(q - 1))) ? NaN : flow(k, q);
  const w0 = Math.max(0, qi - 3), W = range(w0, qi), ann = 4 / W.length;
  const a0 = Math.max(0, qi - 4), A = range(a0, qi).filter(q => q === qi || hasV(q));   // saldos médios só com datas-base informadas
  const L = k => sum(W.map(q => flow(k, q))) * ann;
  const avg = k => mean(A.map(q => Vq(k, q)));
  const m = { n, r, nm: r.nm, qi, W, ann: W.length < 4 ? W.length : 0 };
  for (const f of D.F) m[f] = Vq(f);
  m.imob = r.imob[qi];
  m.L = {}; for (const f of D.DREF) m.L[f] = L(f);
  m.Qf = (k, q) => flow(k, q);
  m.pe = Math.abs(Vq('pec'));
  m.cart = Vq('crb') + Math.max(Vq('occ'), 0) + Math.max(Vq('arr'), 0);
  const cz = r.CZ ? r.CZ[qi] : null;
  m.cent = cz ? (cz[CI.cent] || 0) : 0;
  m.icoop = sum(W.map(q => r.IQ[q] || 0)) * ann;
  m.liq = Vq('disp') + Vq('aplic') + Vq('tvm') + m.cent;
  m.liqI = Vq('disp') + Vq('aplic') + m.cent;
  m.letras = Vq('lci') + Vq('lca') + Vq('lf');
  const aAt = avg('at'), aCrb = avg('crb'), aCapt = avg('capt'), aPl = avg('pl'), aDep = avg('dep');
  m.avg = { at: aAt, crb: aCrb, capt: aCapt, pl: aPl, dep: aDep };
  const X = r.x;
  m.ib = div(Vq('pr'), Vq('rwa')); m.icp = X.rwaCp[qi] ? X.cp[qi] / X.rwaCp[qi] : NaN; m.in1 = X.rwaCp[qi] ? X.n1[qi] / X.rwaCp[qi] : NaN; m.ra = X.expo[qi] ? X.n1e[qi] / X.expo[qi] : NaN;
  m.capCov = X.nFull[qi]; m.s5 = !X.nFull[qi];
  m.alav = div(Vq('at'), Vq('pl')); m.rwaD = div(Vq('rwa'), Vq('at'));
  m.buf = Vq('pr') - 0.105 * Vq('rwa');
  m.irrbbPR = X.prI[qi] ? X.irr[qi] / X.prI[qi] : NaN;
  m.mktPR = div(Vq('rwam') * 0.08, Vq('pr'));
  m.inadR = div(Vq('inad'), Vq('scr')); m.probR = div(Vq('prob'), Vq('scr'));
  m.cob = div(m.pe, Vq('prob')); m.cobI = div(m.pe, Vq('inad')); m.peR = div(m.pe, Vq('crb'));
  m.cor = div(-L('pecr'), aCrb);
  m.ticket = div(Vq('scr'), Vq('cli'));
  if (cz) {
    const C = k => cz[CI[k]] || 0;
    const st = C('e1') + C('e2') + C('e3') + C('sn') + C('sp');
    m.stTot = st; m.e1R = div(C('e1') + C('sn'), st); m.e2R = div(C('e2'), st); m.e3R = div(C('e3') + C('sp'), st);
    m.cz = {}; for (const f of D.CLF) m.cz[f] = C(f);
    m.fgcA = div(-C('fgc') * (semEnd(qi) ? 2 : 4), Vq('dep'));
  }
  m.ltd = div(m.cart, Vq('dep')); m.ltdC = div(m.cart, Vq('capt'));
  m.liqA = div(m.liq, Vq('at'));
  m.depShare = div(Vq('dep'), Vq('capt'));
  m.repShare = div(Vq('emr'), Vq('capt'));
  m.ll = L('ll'); m.roa = div(m.ll, aAt); m.roe = div(m.ll, aPl);
  m.nii = L('rif') - L('pe') + m.icoop;
  m.nim = div(m.nii, aAt);
  m.yld = div(L('rcre'), aCrb); m.cof = div(-L('dcp'), aCapt); m.spread = m.yld - m.cof;
  m.opx = -(L('pes') + L('adm'));
  m.rev = m.nii + L('tar') + L('srv') + L('rpag');
  m.eff = div(m.opx, m.rev);
  m.opxA = div(m.opx, aAt);
  m.trib = -(L('trib') + L('ir'));
  m.feeCov = div(L('tar') + L('srv'), m.opx);
  m.yTes = div(L('rtvm') + L('rapl') + m.icoop, mean(A.map(q => Vq('tvm', q) + Vq('disp', q) + Vq('aplic', q))) + m.cent);
  // DRE gerencial por segmento (v2.1): Total ÷ ativo; Crédito, Cartões, Tesouraria e Serviços e outros ÷ base própria
  const czv = (k, q) => { const c = r.CZ && r.CZ[q]; return c ? (c[CI[k]] || 0) : 0; };
  const czf = (k, q) => (semEnd(q) && q > 0) ? czv(k, q) - czv(k, q - 1) : czv(k, q);
  const czOK = q => !r.CZ || (!!r.CZ[q] && !(semEnd(q) && q > 0 && !r.CZ[q - 1]));   // balancete do trimestre (e do anterior, em jun/dez)
  const SEGC = new Map();
  m.seg = (q, key) => {
    key = key === 'bal' ? 'bal' : 'rec';
    const ck = q + '|' + key; if (SEGC.has(ck)) return SEGC.get(ck);
    const f = k => q == null ? L(k) : flowQ(k, q) * 4;
    const fz = k => q == null ? sum(W.map(i => czf(k, i))) * ann : (czOK(q) ? czf(k, q) * 4 : NaN);
    const iq = q == null ? m.icoop : (czOK(q) ? (r.IQ[q] || 0) * 4 : NaN);
    const bAvg = fn => q == null ? mean(A.map(fn)) : (q && hasV(q - 1) ? (fn(q) + fn(q - 1)) / 2 : fn(q));
    const base = {
      cred: bAvg(i => Vq('crb', i) + Math.max(Vq('occ', i), 0) + Math.max(Vq('arr', i), 0)),
      card: bAvg(i => { const g = czv('pagb', i) + czv('trp', i); return g > 0 ? g : Math.max(0, Vq('pag', i)); }),
      tes: bAvg(i => Vq('disp', i) + Vq('aplic', i) + Vq('tvm', i) + Math.max(Vq('dera', i), 0) + czv('cent', i) + czv('cvin', i)),
    };
    const atA = bAvg(i => Vq('at', i));
    base.srv = Math.max(0, atA - bAvg(i => Vq('crl', i) + Math.max(Vq('occ', i), 0) + Math.max(Vq('arr', i), 0)) - base.card - base.tes);
    const cdd = fz('cdd'), pgd = fz('pgd'), pg2 = f('pg2');
    const pe = f('pe'), pe12 = f('pe1') + f('pe2'), peC = f('pecr') + f('pe4') + f('pe5');
    const S_ = {
      cred: { rec: f('rcre') + f('rarr') + f('rocc') - cdd, dd: -cdd, prov: -peC },
      card: { rec: f('rpag') - pg2 - pgd, dd: -pgd, prov: -pg2 },
      tes: { rec: f('rapl') + f('rtvm') + f('rder') + iq, dd: 0, prov: -pe12 },
      srv: { rec: f('tar') + f('srv') + f('part') + f('rout'), dd: 0, prov: -(pe - pe12 - peC) - f('peo') },
    };
    const fun = -(f('dcp') + f('ddc')), ll = f('ll');
    const sb = sum(SEGK.map(k => base[k])), ftp = div(fun, sb);
    let rec = 0, prov = 0, dd = 0;
    SEGK.forEach(k => { const s = S_[k]; s.base = base[k]; s.fun = ok(ftp) ? ftp * base[k] : 0; rec += s.rec; prov += s.prov; dd += s.dd; });
    const di = rec - fun - prov - dd - ll, pa = -(f('pes') + f('adm'));
    const wR = SEGK.map(k => Math.max(0, S_[k].rec)), wB = SEGK.map(k => base[k]), sR = sum(wR), sB = sum(wB);
    SEGK.forEach((k, i) => {
      const s = S_[k];
      s.shRec = sR ? wR[i] / sR : 0; s.shBal = sB ? wB[i] / sB : 0; s.sh = key === 'bal' ? s.shBal : s.shRec;
      s.di = di * s.sh; s.pa = pa * s.sh; s.ot = s.di - s.pa;
      s.mb = s.rec - s.fun; s.ml = s.mb - s.prov; s.ll = s.ml - s.dd - s.di;
    });
    const TT = { rec, fun, mb: rec - fun, prov, ml: rec - fun - prov, dd, di, pa, ot: di - pa, ll, base: atA };
    const o = { T: TT, S: S_, ftp, sb, key };
    SEGC.set(ck, o); return o;
  };
  const RAT = (x, b) => { const o = {}; for (const k of ['rec', 'fun', 'mb', 'prov', 'ml', 'dd', 'di', 'pa', 'ot', 'll']) o[k] = div(x[k], b); return o; };
  const segOK = x => x.base > 0 && Math.abs(x.rec) <= 1.5 * x.base;
  m.segIdx = (q, sg, key) => { const o = m.seg(q, key); const tot = !sg || sg === 'T'; const x = tot ? o.T : o.S[sg]; return RAT(x, tot || segOK(x) ? x.base : NaN); };
  m.gi = m.segIdx(null, 'T'); m.giQ = range(0, qi).map(q => m.segIdx(q, 'T'));
  const g = k => qi >= 4 ? div(Vq(k, qi), Vq(k, qi - 4)) - 1 : NaN;
  m.gAt = g('at'); m.gCrb = g('crb'); m.gCapt = g('capt'); m.gPl = g('pl'); m.gDep = g('dep');
  const gq = k => qi >= 1 ? div(Vq(k, qi), Vq(k, qi - 1)) - 1 : NaN;
  m.gqAt = gq('at'); m.gqCrb = gq('crb');
  // séries trimestrais até a data-base
  const Q = range(0, qi);
  const qa = (k, q) => q && hasV(q - 1) ? (Vq(k, q) + Vq(k, q - 1)) / 2 : Vq(k, q);
  const iqQ = i => czOK(i) ? (r.IQ[i] || 0) : NaN;   // ingressos intercooperativos do trimestre (balancete)
  const q = {};
  q.ib = Q.map(i => div(Vq('pr', i), Vq('rwa', i)));
  q.icp = Q.map(i => X.rwaCp[i] ? X.cp[i] / X.rwaCp[i] : NaN);
  q.ra = Q.map(i => X.expo[i] ? X.n1e[i] / X.expo[i] : NaN);
  q.inad = Q.map(i => div(Vq('inad', i), Vq('scr', i)));
  q.prob = Q.map(i => div(Vq('prob', i), Vq('scr', i)));
  q.cob = Q.map(i => div(Math.abs(Vq('pec', i)), Vq('prob', i)));
  q.ltd = Q.map(i => div(Vq('crb', i), Vq('dep', i)));
  q.ltdC = Q.map(i => div(Vq('crb', i) + Math.max(0, Vq('occ', i)), Vq('capt', i)));
  q.alav = Q.map(i => div(Vq('at', i), Vq('pl', i)));
  q.liqA = Q.map(i => div(Vq('disp', i) + Vq('aplic', i) + Vq('tvm', i) + (r.CZ && r.CZ[i] ? r.CZ[i][CI.cent] || 0 : 0), Vq('at', i)));
  q.roe = Q.map(i => div(4 * flowQ('ll', i), qa('pl', i)));
  q.roa = Q.map(i => div(4 * flowQ('ll', i), qa('at', i)));
  q.nim = Q.map(i => div(4 * (flowQ('rif', i) - flowQ('pe', i) + iqQ(i)), qa('at', i)));
  q.yld = Q.map(i => div(4 * flowQ('rcre', i), qa('crb', i)));
  q.cof = Q.map(i => div(-4 * flowQ('dcp', i), qa('capt', i)));
  q.spread = q.yld.map((y, i) => y - q.cof[i]);
  q.cor = Q.map(i => div(-4 * flowQ('pecr', i), qa('crb', i)));
  q.eff = Q.map(i => div(-(flowQ('pes', i) + flowQ('adm', i)), flowQ('rif', i) - flowQ('pe', i) + iqQ(i) + flowQ('tar', i) + flowQ('srv', i) + flowQ('rpag', i)));
  q.irrbb = Q.map(i => X.prI[i] ? X.irr[i] / X.prI[i] : NaN);
  q.e3 = Q.map(i => { const c = r.CZ && r.CZ[i]; if (!c) return NaN; const t = c[CI.e1] + c[CI.e2] + c[CI.e3] + c[CI.sn] + c[CI.sp]; return div(c[CI.e3] + c[CI.sp], t); });
  q.e2 = Q.map(i => { const c = r.CZ && r.CZ[i]; if (!c) return NaN; const t = c[CI.e1] + c[CI.e2] + c[CI.e3] + c[CI.sn] + c[CI.sp]; return div(c[CI.e2], t); });
  q.rwaD = Q.map(i => div(Vq('rwa', i), Vq('at', i)));
  q.mktPR = Q.map(i => div(Vq('rwam', i) * 0.08, Vq('pr', i)));
  m.q = q;
  const HD = { opx: ['pes', 'adm'], tar: ['tar', 'srv'] };
  m.H = k => Q.map(i => {
    if (HD[k]) return HD[k].reduce((s, x) => s + flowQ(x, i), 0);
    if (k === 'liq') return Vq('disp', i) + Vq('aplic', i);
    if (DI[k] != null) return flowQ(k, i);
    return Vq(k, i);
  });
  const me = mEnd(qi);
  m.r = { pf: r.PF ? mat2(r.PF[qi], 7) : null, pj: r.PJ ? mat2(r.PJ[qi], 9) : null, ix: r.X[qi], cz, m: r.M && me >= 0 ? r.M.map(a => a.slice(0, me + 1)) : null, BC: r.BC, IQ: r.IQ, V: r.V, R: r.R, CZ: r.CZ };
  MC.set(key, m);
  return m;
}
const metrics = n => metricsAt(n, QI);

/* universo de pares: métricas de todas as entidades na data-base */
const PEER_KEYS = ['ib', 'icp', 'ra', 'alav', 'inadR', 'probR', 'e3R', 'cob', 'cor', 'roa', 'roe', 'nim', 'eff', 'ltdC', 'liqA', 'irrbbPR', 'yld', 'cof', 'spread', 'gCrb', 'gCapt', 'rwaD', 'opxA', 'depShare', 'at', 'cart', 'pl', 'capt', 'll'];
const PEERS = new Map();
function peers() {
  if (PEERS.has(QI)) return PEERS.get(QI);
  const P = { coop: {}, bank: {} };
  for (const g of ['coop', 'bank']) {
    const L = g === 'coop' ? COOPS : BANKS;
    const ms = L.map(e => metrics(node(e.id)));
    for (const k of PEER_KEYS) P[g][k] = ms.map(m => m[k]).filter(ok);
  }
  PEERS.set(QI, P);
  return P;
}
function pctile(n, k, x) {
  const arr = peers()[n.grp][k]; if (!arr || !arr.length || !ok(x)) return NaN;
  let c = 0; for (const y of arr) if (y < x) c++; else if (y === x) c += 0.5;
  return c / arr.length;
}
const peerMed = (n, k) => median(peers()[n.grp][k] || []);


/* limites de apetite a risco (bom → crítico) */
const THR = {
  ib: { dir: 1, g: .15, w: .12, s: .105, lab: 'Índice de Basileia' },
  icp: { dir: 1, g: .11, w: .09, s: .07, lab: 'Capital principal' },
  ra: { dir: 1, g: .06, w: .04, s: .03, lab: 'Razão de alavancagem' },
  inadR: { dir: -1, g: .03, w: .05, s: .07, lab: 'Inadimplência (90d)' },
  probR: { dir: -1, g: .05, w: .08, s: .12, lab: 'Ativos problemáticos' },
  e3R: { dir: -1, g: .03, w: .06, s: .09, lab: 'Estágio 3' },
  cob: { dir: 1, g: 1, w: .7, s: .5, lab: 'Cobertura (PE/problemáticos)' },
  roe: { dir: 1, g: .15, w: .08, s: 0, lab: 'ROE' },
  roa: { dir: 1, g: .015, w: .008, s: 0, lab: 'ROA' },
  eff: { dir: -1, g: .5, w: .65, s: .8, lab: 'Índice de eficiência' },
  ltdC: { dir: -1, g: .85, w: 1, s: 1.15, lab: 'Crédito / captações' },
  liqA: { dir: 1, g: .25, w: .15, s: .1, lab: 'Ativos líquidos / ativo' },
  irrbbPR: { dir: -1, g: .05, w: .1, s: .15, lab: 'Capital IRRBB / PR' },
  cor: { dir: -1, g: .02, w: .035, s: .05, lab: 'Custo do risco' },
};
function status(k, x) {
  const t = THR[k]; if (!t || !ok(x)) return 'na';
  if (t.dir > 0) return x >= t.g ? 'good' : x >= t.w ? 'warn' : x >= t.s ? 'serious' : 'crit';
  return x <= t.g ? 'good' : x <= t.w ? 'warn' : x <= t.s ? 'serious' : 'crit';
}
const ST_LBL = { good: 'Confortável', warn: 'Atenção', serious: 'Alerta', crit: 'Crítico', na: 's/ dado' };
const ST_IC = { good: '✓', warn: '!', serious: '!', crit: '×', na: '·' };
const stChip = (k, x, lbl) => { const s = status(k, x); return `<span class="st ${s}"><i>${ST_IC[s]}</i>${lbl || ST_LBL[s]}</span>`; };

/* ---------------- tooltip, popover, revelação ---------------- */
const TT = $('#tt');
function tipShow(html, ev) { TT.innerHTML = html; TT.classList.add('on'); tipMove(ev); }
function tipMove(ev) {
  const w = TT.offsetWidth, h = TT.offsetHeight; let x = ev.clientX + 14, y = ev.clientY + 14;
  if (x + w > innerWidth - 8) x = ev.clientX - w - 14; if (y + h > innerHeight - 8) y = ev.clientY - h - 14;
  TT.style.left = Math.max(6, x) + 'px'; TT.style.top = Math.max(6, y) + 'px';
}
function tipHide() { TT.classList.remove('on'); }
function bindTip(el, fn) {
  el.addEventListener('pointerenter', e => tipShow(fn(e), e));
  el.addEventListener('pointermove', e => { if (TT.classList.contains('on')) tipMove(e); });
  el.addEventListener('pointerleave', tipHide);
}
const ttRow = (k, v, c) => `<div class="r"><span>${c ? `<i class="k" style="background:${c}"></i>` : ''}${k}</span><b>${v}</b></div>`;

const POP = $('#pop'), POPB = $('#popBody');
POP.querySelector('.x').onclick = () => POP.classList.remove('on');
document.addEventListener('keydown', e => { if (e.key === 'Escape') { POP.classList.remove('on'); closePickers(); } });
document.addEventListener('pointerdown', e => { if (POP.classList.contains('on') && !POP.contains(e.target) && !e.target.closest('.info')) POP.classList.remove('on'); });
function tex(el) {
  $$('[data-tex]', el).forEach(x => {
    if (window.katex) { try { katex.render(x.dataset.tex, x, { throwOnError: false, displayMode: x.classList.contains('fx') }); return; } catch (e) { } }
    x.textContent = x.dataset.tex.replace(/\\(text|mathrm|operatorname)\{([^}]*)\}/g, '$2').replace(/\\[a-zA-Z]+/g, s => ({ '\\times': '×', '\\cdot': '·', '\\frac': '', '\\sum': 'Σ', '\\Delta': 'Δ', '\\sigma': 'σ', '\\rho': 'ρ', '\\Phi': 'Φ', '\\le': '≤', '\\ge': '≥', '\\sqrt': '√', '\\alpha': 'α', '\\beta': 'β', '\\mu': 'μ', '\\left': '', '\\right': '' }[s] ?? '')).replace(/[{}]/g, '');
  });
}
const fmtCode = c => c && c.length === 10 ? `${c[0]}.${c[1]}.${c[2]}.${c.slice(3, 5)}.${c.slice(5, 7)}-${c[9]}` : c;
function cosifLine(desc) {
  return esc(desc).replace(/\[(\d{10})\]/g, (_, c) => `<span class="cc" title="${esc(D.CN[c] || '')}"><b>${fmtCode(c)}</b>${D.CN[c] ? ' ' + esc(D.CN[c]) : ''}</span>`);
}
function cosifHTML(fields) {
  const rows = (fields || []).filter(f => D.DESC[f]).map(f => { const [d, nm] = D.DESC[f]; return `<li><span class="cn">${esc(nm.replace(/\s*\([a-z0-9]+\)(\s*=.*)?$/i, ''))}</span><span class="cf">${cosifLine(d)}</span></li>`; });
  return rows.length ? `<div class="pop-sec"><h5>Contas COSIF / linhas do IF.data</h5><ul class="cosif">${rows.join('')}</ul></div>` : '';
}
function showPop(key, anchor) {
  const f = FX[key]; if (!f) return;
  POPB.innerHTML = `<h4>${f.t}</h4>${f.d ? `<div class="pop-sec"><h5>Conceito</h5><p>${f.d}</p></div>` : ''}${f.tex ? `<div class="pop-sec"><h5>Fórmula</h5><span class="fx" data-tex="${esc(f.tex)}"></span></div>` : ''}${cosifHTML(f.f)}${f.c ? `<div class="pop-sec"><h5>Contas e campos</h5><p class="cf2">${f.c}</p></div>` : ''}${f.s ? `<p class="note"><b>Fonte:</b> ${f.s}</p>` : ''}`;
  tex(POPB);
  POP.classList.add('on');
  const r = anchor.getBoundingClientRect(); const w = POP.offsetWidth, h = POP.offsetHeight;
  let x = r.left + r.width / 2 - w / 2, y = r.bottom + 10;
  x = clamp(x, 8, innerWidth - w - 8); if (y + h > innerHeight - 8) y = Math.max(8, r.top - h - 10);
  POP.style.left = x + 'px'; POP.style.top = y + 'px';
}
let popT = null, popPin = false;
document.addEventListener('pointerover', e => {
  const b = e.target.closest && e.target.closest('.info'); if (!b || !b.dataset.fx || e.pointerType === 'touch') return;
  clearTimeout(popT); popT = setTimeout(() => { popPin = false; showPop(b.dataset.fx, b); }, 110);
});
document.addEventListener('pointerout', e => {
  const b = e.target.closest && e.target.closest('.info'); if (!b) return;
  clearTimeout(popT); if (!popPin) popT = setTimeout(() => { if (!POP.matches(':hover')) POP.classList.remove('on'); }, 260);
});
POP.addEventListener('pointerenter', () => clearTimeout(popT));
POP.addEventListener('pointerleave', () => { if (!popPin) popT = setTimeout(() => POP.classList.remove('on'), 220); });
document.addEventListener('click', e => { const b = e.target.closest('.info'); if (b && b.dataset.fx) { e.stopPropagation(); e.preventDefault(); clearTimeout(popT); popPin = true; showPop(b.dataset.fx, b); } });
document.addEventListener('focusin', e => { const b = e.target.closest && e.target.closest('.info'); if (b && b.dataset.fx) showPop(b.dataset.fx, b); });
const infoBtn = k => FX[k] ? `<button class="info" data-fx="${k}" aria-label="Como é calculado">i</button>` : '';

const IO = 'IntersectionObserver' in window ? new IntersectionObserver(es => {
  for (const e of es) if (e.isIntersecting) { activate(e.target); IO.unobserve(e.target); }
}, { rootMargin: '0px 0px -8% 0px' }) : null;
function activate(el) {
  el.classList.add('in');
  $$('.draw', el).forEach(p => { p.style.strokeDashoffset = '0'; });
  $$('[data-count]', el).forEach(countUp);
}
function reveal(el) { if (STILL) { activate(el); return; } if (RM || !IO) { requestAnimationFrame(() => activate(el)); } else IO.observe(el); }
function countUp(el) {
  const to = +el.dataset.count, fmt = FMT[el.dataset.fmt] || int; if (!ok(to)) return;
  if (RM || STILL) { el.textContent = fmt(to); return; }
  const t0 = performance.now(), dur = 900;
  const step = t => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(to * e); if (p < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
const FMT = { brl, pct: x => pct(x, 1), pct2: x => pct(x, 2), int, mult: x => mult(x, 1), pp: x => pp(x, 1), pp2: x => pp(x, 2), dec1: x => dec(x, 1) };

/* ---------------- SVG ---------------- */
const NS = 'http://www.w3.org/2000/svg';
function S(tag, a, p) { const el = document.createElementNS(NS, tag); if (a) for (const k in a) if (a[k] != null) el.setAttribute(k, a[k]); if (p) p.appendChild(el); return el; }
function T(p, x, y, txt, a) { const t = S('text', Object.assign({ x, y }, a || {}), p); t.textContent = txt; return t; }
function niceTicks(lo, hi, n = 5) {
  if (!ok(lo) || !ok(hi)) return [0, 1];
  if (lo === hi) { hi = lo + (Math.abs(lo) || 1); lo = lo - (Math.abs(lo) || 1) * 0.1; }
  const span = hi - lo, step0 = span / n, mag = Math.pow(10, Math.floor(Math.log10(step0))), r = step0 / mag;
  const step = (r >= 5 ? 10 : r >= 2 ? 5 : r >= 1 ? 2 : 1) * mag;
  const a = Math.floor(lo / step) * step, b = Math.ceil(hi / step) * step, t = [];
  for (let x = a; x <= b + step / 2; x += step) t.push(+x.toFixed(12));
  return t;
}
function box(el, h) {
  el.innerHTML = '';
  const W = Math.max(280, Math.floor(el.clientWidth || el.getBoundingClientRect().width || 600));
  const svg = S('svg', { viewBox: `0 0 ${W} ${h}`, width: W, height: h, role: 'img' }, el);
  return { svg, W, H: h };
}
function legend(el, items) {
  const d = document.createElement('div'); d.className = 'legend';
  d.innerHTML = items.map(i => `<span><i class="${i.line ? 'ln' : ''}" style="background:${i.color}"></i>${esc(i.name)}</span>`).join('');
  el.appendChild(d); return d;
}
function chartEl(parent, h, cls) { const d = document.createElement('div'); d.className = 'chart ' + (cls || ''); d.style.minHeight = h + 'px'; parent.appendChild(d); return d; }

/* linha (uma escala, várias séries) */
function lineChart(el, o) {
  el.innerHTML = '';
  if (o.series.length > 1 && !o.noLegend) legend(el, o.series.map(s => ({ name: s.name, color: s.color, line: true })));
  const holder = document.createElement('div'); el.appendChild(holder);
  const { svg, W, H } = box(holder, o.h || 220);
  const fmt = o.fmt || (x => pct(x, 1));
  const all = o.series.flatMap(s => s.values).concat((o.refs || []).map(r => r.y)).filter(ok);
  let lo = o.min != null ? o.min : Math.min(...all), hi = o.max != null ? o.max : Math.max(...all);
  if (o.zero && lo > 0) lo = 0;
  const pad = (hi - lo) * 0.08 || Math.abs(hi) * 0.1 || 1; if (o.min == null) lo -= o.zero && lo === 0 ? 0 : pad; if (o.max == null) hi += pad;
  const ticks = niceTicks(lo, hi, 4); lo = ticks[0]; hi = ticks[ticks.length - 1];
  const ml = Math.max(...ticks.map(t => fmt(t).length)) * 6.2 + 12, mr = o.series.length <= 4 ? 62 : 14, mt = 10, mb = 24;
  const n = o.cats.length, X = i => ml + (n === 1 ? (W - ml - mr) / 2 : i * (W - ml - mr) / (n - 1)), Y = v => mt + (hi - v) / (hi - lo) * (H - mt - mb);
  const g = S('g', { class: 'gridl' }, svg), ax = S('g', { class: 'ax' }, svg);
  ticks.forEach(t => { S('line', { x1: ml, x2: W - mr, y1: Y(t), y2: Y(t) }, g); T(ax, ml - 8, Y(t) + 3.5, fmt(t), { 'text-anchor': 'end' }); });
  const every = Math.ceil(n / Math.max(2, Math.floor((W - ml - mr) / 58)));
  o.cats.forEach((c, i) => { if (i % every === 0 || i === n - 1) T(ax, X(i), H - 6, c, { 'text-anchor': 'middle' }); });
  (o.refs || []).forEach(r => {
    S('line', { x1: ml, x2: W - mr, y1: Y(r.y), y2: Y(r.y), stroke: r.color || 'var(--ink-3)', 'stroke-dasharray': '4 4', 'stroke-width': 1.2 }, svg);
    T(svg, ml + 4, Y(r.y) - 5, r.label, { class: 'lbl', fill: r.color || 'var(--ink-3)' });
  });
  const endLabels = [];
  o.series.forEach((s, si) => {
    const pts = s.values.map((v, i) => ok(v) ? [X(i), Y(v)] : null);
    let d = ''; let pen = false; pts.forEach(p => { if (!p) { pen = false; return; } d += (pen ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1); pen = true; });
    if (s.area) {
      const f = pts.filter(Boolean); if (f.length > 1) S('path', { d: d + `L${f[f.length - 1][0]},${Y(Math.max(lo, 0))}L${f[0][0]},${Y(Math.max(lo, 0))}Z`, fill: s.color, 'fill-opacity': .12, class: 'fade' }, svg);
    }
    const p = S('path', { d, fill: 'none', stroke: s.color, 'stroke-width': s.w || 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'stroke-dasharray': s.dash || null, class: s.dash ? 'fade' : 'draw' }, svg);
    if (!s.dash) { const L = p.getTotalLength ? p.getTotalLength() : 1000; p.style.strokeDasharray = L; p.style.strokeDashoffset = L; }
    pts.forEach((pt, i) => { if (pt && (i === pts.length - 1 || n <= 8)) S('circle', { cx: pt[0], cy: pt[1], r: i === pts.length - 1 ? 4 : 2.6, fill: s.color, stroke: 'var(--surface)', 'stroke-width': 2, class: 'fade' }, svg); });
    if (o.series.length <= 4) { const lst = pts.map((p, i) => [p, i]).filter(x => x[0]).pop(); if (lst) endLabels.push({ x: lst[0][0] + 8, y: lst[0][1] + 4, t: fmt(s.values[lst[1]]) }); }
  });
  endLabels.sort((a, b) => a.y - b.y).forEach((l, i, arr) => { if (i && l.y - arr[i - 1].y < 12) l.y = arr[i - 1].y + 12; T(svg, l.x, l.y, l.t, { class: 'vlab fade', fill: 'var(--ink-2)' }); });
  const cross = S('line', { y1: mt, y2: H - mb, stroke: 'var(--ink-3)', 'stroke-width': 1, opacity: 0 }, svg);
  const hit = S('rect', { x: ml, y: mt, width: W - ml - mr, height: H - mt - mb, class: 'hit' }, svg);
  const idxAt = ev => { const r = svg.getBoundingClientRect(); const x = (ev.clientX - r.left) * W / r.width; return clamp(Math.round((x - ml) / ((W - ml - mr) / Math.max(1, n - 1))), 0, n - 1); };
  hit.addEventListener('pointermove', ev => {
    const i = idxAt(ev); cross.setAttribute('x1', X(i)); cross.setAttribute('x2', X(i)); cross.setAttribute('opacity', .5);
    tipShow(`<b>${o.cats[i]}</b><hr>` + o.series.map(s => ttRow(s.name, ok(s.values[i]) ? fmt(s.values[i]) : '—', s.color)).join(''), ev);
  });
  hit.addEventListener('pointerleave', () => { cross.setAttribute('opacity', 0); tipHide(); });
  reveal(holder);
}

/* colunas (agrupadas ou empilhadas, com negativos) */
function barChart(el, o) {
  el.innerHTML = '';
  if (o.series.length > 1 && !o.noLegend) legend(el, o.series.map(s => ({ name: s.name, color: s.color })));
  const holder = document.createElement('div'); el.appendChild(holder);
  const { svg, W, H } = box(holder, o.h || 220);
  const fmt = o.fmt || brl, n = o.cats.length, k = o.series.length;
  let lo = 0, hi = 0;
  if (o.stacked) for (let i = 0; i < n; i++) { let p = 0, q = 0; o.series.forEach(s => { const v = s.values[i] || 0; if (v >= 0) p += v; else q += v; }); hi = Math.max(hi, p); lo = Math.min(lo, q); }
  else o.series.forEach(s => s.values.forEach(v => { if (ok(v)) { hi = Math.max(hi, v); lo = Math.min(lo, v); } }));
  (o.lines || []).forEach(l => l.values.forEach(v => { if (ok(v)) { hi = Math.max(hi, v); lo = Math.min(lo, v); } }));
  const ticks = niceTicks(lo, hi, 4); lo = ticks[0]; hi = ticks[ticks.length - 1];
  const ml = Math.max(...ticks.map(t => fmt(t).length)) * 6 + 14, mr = 10, mt = 14, mb = o.rot ? 54 : 26;
  const Y = v => mt + (hi - v) / (hi - lo) * (H - mt - mb), bw = (W - ml - mr) / n;
  const g = S('g', { class: 'gridl' }, svg), ax = S('g', { class: 'ax' }, svg);
  ticks.forEach(t => { S('line', { x1: ml, x2: W - mr, y1: Y(t), y2: Y(t) }, g); T(ax, ml - 8, Y(t) + 3.5, fmt(t), { 'text-anchor': 'end' }); });
  S('line', { x1: ml, x2: W - mr, y1: Y(0), y2: Y(0), stroke: 'var(--axis)' }, svg);
  const every = Math.ceil(n / Math.max(2, Math.floor((W - ml - mr) / (o.rot ? 22 : 54))));
  o.cats.forEach((c, i) => {
    if (i % every) return;
    const x = ml + bw * (i + .5);
    if (o.rot) T(ax, x, H - mb + 12, c, { 'text-anchor': 'end', transform: `rotate(-35 ${x} ${H - mb + 12})` });
    else T(ax, x, H - 7, c, { 'text-anchor': 'middle' });
  });
  const inner = Math.min(o.stacked ? bw * .62 : bw * .78, o.maxBar || 46);
  for (let i = 0; i < n; i++) {
    let p = 0, q = 0;
    o.series.forEach((s, si) => {
      const v = s.values[i]; if (!ok(v) || v === 0) return;
      let x, w, y0, y1;
      if (o.stacked) { w = inner; x = ml + bw * i + (bw - w) / 2; if (v >= 0) { y0 = Y(p + v); y1 = Y(p); p += v; } else { y0 = Y(q); y1 = Y(q + v); q += v; } }
      else { w = Math.max(2, inner / k - 2); x = ml + bw * i + (bw - inner) / 2 + si * (inner / k); y0 = Y(Math.max(v, 0)); y1 = Y(Math.min(v, 0)); }
      const hgt = Math.max(1, y1 - y0);
      const rc = S('rect', { x, y: y0, width: w, height: hgt, rx: Math.min(3, w / 3), fill: s.colors ? s.colors[i] : s.color, class: v >= 0 ? 'grow-y' : 'grow-yd' }, svg);
      rc.style.transitionDelay = (i * 25 + si * 40) + 'ms';
      bindTip(rc, () => `<b>${o.cats[i]}</b><hr>${ttRow(s.name, fmt(v), s.colors ? s.colors[i] : s.color)}${o.tipExtra ? o.tipExtra(i, si) : ''}`);
      if (o.labels && !o.stacked && k === 1) T(svg, x + w / 2, v >= 0 ? y0 - 5 : y1 + 12, fmt(v), { class: 'vlab fade', 'text-anchor': 'middle' });
    });
    if (o.stacked && o.totals) T(svg, ml + bw * (i + .5), Y(p) - 5, fmt(p + q), { class: 'vlab fade', 'text-anchor': 'middle' });
  }
  (o.lines || []).forEach(l => {
    let d = ''; l.values.forEach((v, i) => { if (ok(v)) d += (d ? 'L' : 'M') + (ml + bw * (i + .5)) + ',' + Y(v); });
    const pth = S('path', { d, fill: 'none', stroke: l.color, 'stroke-width': 2.2, class: 'draw', 'stroke-linejoin': 'round' }, svg);
    const L = pth.getTotalLength ? pth.getTotalLength() : 800; pth.style.strokeDasharray = L; pth.style.strokeDashoffset = L;
    if (n <= 24) l.values.forEach((v, i) => { if (ok(v)) { const c = S('circle', { cx: ml + bw * (i + .5), cy: Y(v), r: 3.5, fill: l.color, stroke: 'var(--surface)', 'stroke-width': 2, class: 'fade' }, svg); bindTip(c, () => `<b>${o.cats[i]}</b><hr>${ttRow(l.name, fmt(v), l.color)}`); } });
  });
  reveal(holder);
}

/* barras horizontais com rótulos */
function hbars(el, rows, o = {}) {
  el.innerHTML = '';
  const holder = document.createElement('div'); el.appendChild(holder);
  const rh = o.rh || 26, lw = o.lw || 150, H = rows.length * rh + 8;
  const { svg, W } = box(holder, H);
  const fmt = o.fmt || brl, vw = o.vw || 78;
  const vals = rows.map(r => r.value).filter(ok);
  const hi = o.max != null ? o.max : Math.max(0, ...vals), lo = Math.min(0, ...vals);
  const X = v => lw + (v - lo) / ((hi - lo) || 1) * (W - lw - vw - 10);
  rows.forEach((r, i) => {
    const y = 4 + i * rh;
    const t = T(svg, lw - 10, y + rh / 2 + 4, r.label, { 'text-anchor': 'end', class: 'lbl', fill: 'var(--ink-2)' });
    if (r.label.length * 6.1 > lw - 14) { t.textContent = r.label.slice(0, Math.floor((lw - 14) / 6.1) - 1) + '…'; }
    S('rect', { x: lw, y: y + 5, width: W - lw - vw - 10, height: rh - 10, rx: 4, fill: 'var(--surface-3)' }, svg);
    if (ok(r.value)) {
      const x0 = X(Math.min(0, r.value)), x1 = X(Math.max(0, r.value));
      const rc = S('rect', { x: x0, y: y + 5, width: Math.max(1.5, x1 - x0), height: rh - 10, rx: 4, fill: r.color || 'var(--s1)', class: r.value < 0 ? 'grow-xr' : 'grow-x' }, svg);
      rc.style.transitionDelay = i * 40 + 'ms';
      bindTip(rc, () => `<b>${esc(r.label)}</b><hr>${ttRow(o.name || 'Valor', fmt(r.value), r.color)}${r.tip || ''}`);
    }
    T(svg, W - 4, y + rh / 2 + 4, ok(r.value) ? (r.vtxt || fmt(r.value)) : '—', { 'text-anchor': 'end', class: 'vlab ink' });
  });
  if (o.ref != null) {
    const x = X(o.ref.value);
    S('line', { x1: x, x2: x, y1: 0, y2: H, stroke: o.ref.color || 'var(--ink-3)', 'stroke-dasharray': '3 3', 'stroke-width': 1.4 }, svg);
    if (o.ref.label) T(svg, x + 4, 10, o.ref.label, { class: 'lbl', fill: o.ref.color || 'var(--ink-3)' });
  }
  reveal(holder);
}

/* rosca com legenda */
function donut(el, parts, o = {}) {
  el.innerHTML = '';
  const tot = sum(parts.map(p => Math.max(0, p.value)));
  const wrap = document.createElement('div'); wrap.style.cssText = 'display:grid;grid-template-columns:' + (o.size || 170) + 'px minmax(0,1fr);gap:16px;align-items:center';
  el.appendChild(wrap);
  const sz = o.size || 170, R = sz / 2 - 6, w = o.thick || 22, C = 2 * Math.PI * (R - w / 2);
  const svg = S('svg', { viewBox: `0 0 ${sz} ${sz}`, width: sz, height: sz }, wrap);
  S('circle', { cx: sz / 2, cy: sz / 2, r: R - w / 2, fill: 'none', stroke: 'var(--surface-3)', 'stroke-width': w }, svg);
  let acc = 0;
  parts.forEach((p, i) => {
    const f = tot ? Math.max(0, p.value) / tot : 0; if (f <= 0) return;
    const gap = parts.length > 1 ? Math.min(2.5, C * f * 0.25) : 0;
    const c = S('circle', { cx: sz / 2, cy: sz / 2, r: R - w / 2, fill: 'none', stroke: p.color, 'stroke-width': w, 'stroke-dasharray': `0 ${C}`, transform: `rotate(${-90 + acc * 360} ${sz / 2} ${sz / 2})`, style: 'transition:stroke-dasharray 1s cubic-bezier(.2,.8,.2,1) ' + (i * 70) + 'ms;cursor:pointer' }, svg);
    c.dataset.full = `${Math.max(0.5, C * f - gap)} ${C}`;
    bindTip(c, () => `<b>${esc(p.label)}</b><hr>${ttRow('Valor', (o.fmt || brl)(p.shown != null ? p.shown : p.value), p.color)}${ttRow('Participação', pct(f, 1))}`);
    acc += f;
  });
  const cg = S('g', {}, svg);
  if (o.center) { T(cg, sz / 2, sz / 2 + 2, o.center.v, { 'text-anchor': 'middle', style: 'font:700 19px var(--sans);fill:var(--ink)' }); T(cg, sz / 2, sz / 2 + 19, o.center.l || '', { 'text-anchor': 'middle', class: 'lbl' }); }
  const lg = document.createElement('div'); lg.style.cssText = 'display:grid;gap:6px;min-width:0';
  lg.innerHTML = parts.map(p => `<div style="display:grid;grid-template-columns:12px minmax(0,1fr) auto auto;gap:8px;align-items:center;font-size:12.5px"><i style="width:10px;height:10px;border-radius:3px;background:${p.color}"></i><span style="color:var(--ink-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${esc(p.label)}">${esc(p.label)}</span><b class="tnum" style="font-weight:600">${(o.fmt || brl)(p.shown != null ? p.shown : p.value)}</b><span class="tnum muted" style="min-width:46px;text-align:right">${tot ? pct(Math.max(0, p.value) / tot, 1) : '—'}</span></div>`).join('');
  wrap.appendChild(lg);
  const go = () => $$('circle[data-full]', svg).forEach(c => c.setAttribute('stroke-dasharray', c.dataset.full));
  if (RM || STILL) go(); else if (IO) { const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { go(); io.disconnect(); } }); io.observe(svg); } else go();
}

/* cascata */
function waterfall(el, steps, o = {}) {
  el.innerHTML = '';
  const holder = document.createElement('div'); el.appendChild(holder);
  const { svg, W, H } = box(holder, o.h || 280);
  const fmt = o.fmt || brl;
  let run = 0; const bars = steps.map(s => {
    if (s.kind === 'start' || s.kind === 'total') { const b = { s, y0: 0, y1: s.value }; run = s.value; return b; }
    const b = { s, y0: run, y1: run + s.value }; run += s.value; return b;
  });
  const vals = bars.flatMap(b => [b.y0, b.y1]);
  const ticks = niceTicks(Math.min(0, ...vals), Math.max(0, ...vals), 4); const lo = ticks[0], hi = ticks[ticks.length - 1];
  const ml = Math.max(...ticks.map(t => fmt(t).length)) * 6 + 14, mr = 8, mt = 18, mb = o.rot === false ? 30 : 70;
  const Y = v => mt + (hi - v) / (hi - lo) * (H - mt - mb), n = steps.length, bw = (W - ml - mr) / n;
  const g = S('g', { class: 'gridl' }, svg), ax = S('g', { class: 'ax' }, svg);
  ticks.forEach(t => { S('line', { x1: ml, x2: W - mr, y1: Y(t), y2: Y(t) }, g); T(ax, ml - 8, Y(t) + 3.5, fmt(t), { 'text-anchor': 'end' }); });
  S('line', { x1: ml, x2: W - mr, y1: Y(0), y2: Y(0), stroke: 'var(--axis)' }, svg);
  bars.forEach((b, i) => {
    const x = ml + bw * i + bw * .14, w = bw * .72, top = Y(Math.max(b.y0, b.y1)), bot = Y(Math.min(b.y0, b.y1));
    const tot = b.s.kind === 'start' || b.s.kind === 'total';
    const col = b.s.color || (tot ? 'var(--s1)' : b.s.value >= 0 ? 'var(--pos)' : 'var(--neg)');
    const rc = S('rect', { x, y: top, width: w, height: Math.max(1.5, bot - top), rx: 3, fill: col, class: b.s.value >= 0 || tot ? 'grow-y' : 'grow-yd' }, svg);
    rc.style.transitionDelay = i * 70 + 'ms';
    if (i < bars.length - 1) S('line', { x1: x + w, x2: x + bw, y1: Y(b.y1), y2: Y(b.y1), stroke: 'var(--ink-3)', 'stroke-dasharray': '2 2', class: 'fade' }, svg);
    const lx = x + w / 2;
    if (o.rot === false) { const t = T(ax, lx, H - 18, '', { 'text-anchor': 'middle' }); const words = b.s.label.split(' '); const maxc = Math.max(6, Math.floor(bw / 5.6)); let l1 = '', l2 = ''; words.forEach(w => { if ((l1 + ' ' + w).trim().length <= maxc && !l2) l1 = (l1 + ' ' + w).trim(); else l2 = (l2 + ' ' + w).trim(); }); if (l2.length > maxc) l2 = l2.slice(0, maxc - 1) + '…'; [l1, l2].forEach((s, k) => { const ts = S('tspan', { x: lx, dy: k ? 12 : 0 }, t); ts.textContent = s; }); }
    else { const t = T(ax, lx, H - mb + 12, b.s.label, { 'text-anchor': 'end', transform: `rotate(-32 ${lx} ${H - mb + 12})` }); if (b.s.label.length > 24) t.textContent = b.s.label.slice(0, 23) + '…'; }
    if (bw > 34) T(svg, lx, top - 5, (tot ? '' : (b.s.value >= 0 ? '+' : '')) + fmt(b.s.value), { 'text-anchor': 'middle', class: 'vlab fade', style: 'font-size:10px' });
    bindTip(rc, () => `<b>${esc(b.s.label)}</b><hr>${ttRow(tot ? 'Saldo' : 'Variação', fmt(b.s.value), col)}${b.s.tip || ''}${!tot ? ttRow('Acumulado', fmt(b.y1)) : ''}`);
  });
  reveal(holder);
}

/* medidor semicircular */
function gauge(el, o) {
  el.innerHTML = '';
  const W = o.w || 260, H = (o.h || 160) + 30, cx = W / 2, cy = H - 46, R = Math.min(W / 2 - 16, H - 66);
  const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%', style: `max-width:${W}px;margin:0 auto;display:block` }, el);
  const A = v => Math.PI * (1 - clamp((v - o.min) / (o.max - o.min), 0, 1));
  const P = (a, r) => [cx + r * Math.cos(a), cy - r * Math.sin(a)];
  const arc = (v0, v1, r) => { const a0 = A(v0), a1 = A(v1), p0 = P(a0, r), p1 = P(a1, r); return `M${p0[0]},${p0[1]}A${r},${r} 0 ${a0 - a1 > Math.PI ? 1 : 0} 1 ${p1[0]},${p1[1]}`; };
  let prev = o.min;
  (o.bands || []).forEach(b => { S('path', { d: arc(prev, Math.min(b.to, o.max), R), stroke: b.color, 'stroke-width': 12, fill: 'none', opacity: .85 }, svg); prev = b.to; });
  (o.ticks || []).forEach(t => { const a = A(t.v), p0 = P(a, R - 12), p1 = P(a, R + 9); S('line', { x1: p0[0], y1: p0[1], x2: p1[0], y2: p1[1], stroke: 'var(--ink)', 'stroke-width': 1.5 }, svg); const pt = P(a, R + 20); T(svg, pt[0], pt[1] + 3, t.l, { 'text-anchor': 'middle', class: 'lbl', style: 'font-size:9.5px' }); });
  const needle = S('g', { style: `transform-origin:${cx}px ${cy}px;transition:transform 1.4s cubic-bezier(.3,1.4,.4,1);transform:rotate(-90deg)` }, svg);
  S('path', { d: `M${cx - 4},${cy} L${cx},${cy - R + 6} L${cx + 4},${cy} Z`, fill: 'var(--ink)' }, needle);
  S('circle', { cx, cy, r: 7, fill: 'var(--ink)' }, svg); S('circle', { cx, cy, r: 3, fill: 'var(--surface)' }, svg);
  const vt = T(svg, cx, cy + 30, o.fmt(o.value), { 'text-anchor': 'middle', style: 'font:700 22px var(--sans);fill:var(--ink)' });
  if (o.label) T(svg, cx, cy + 44, o.label, { 'text-anchor': 'middle', class: 'lbl' });
  const ang = (clamp((o.value - o.min) / (o.max - o.min), 0, 1) * 180) - 90;
  const go = () => { needle.style.transform = `rotate(${ang}deg)`; };
  later(go, 120);
  return vt;
}

/* radar */
function radarChart(el, axes, series, o = {}) {
  el.innerHTML = '';
  if (series.length > 1) legend(el, series.map(s => ({ name: s.name, color: s.color })));
  const sz = o.size || 300, cx = sz / 2, cy = sz / 2 + 4, R = sz / 2 - 46;
  const svg = S('svg', { viewBox: `0 0 ${sz} ${sz}`, width: '100%', style: `max-width:${sz + 40}px;display:block;margin:0 auto` }, el);
  const n = axes.length, P = (i, r) => [cx + r * Math.sin(2 * Math.PI * i / n), cy - r * Math.cos(2 * Math.PI * i / n)];
  [0.25, 0.5, 0.75, 1].forEach(f => S('polygon', { points: axes.map((_, i) => P(i, R * f).join(',')).join(' '), fill: 'none', stroke: 'var(--grid)' }, svg));
  axes.forEach((a, i) => { const p = P(i, R); S('line', { x1: cx, y1: cy, x2: p[0], y2: p[1], stroke: 'var(--grid)' }, svg); const q = P(i, R + 20); T(svg, q[0], q[1] + 4, a, { 'text-anchor': Math.abs(q[0] - cx) < 8 ? 'middle' : q[0] > cx ? 'start' : 'end', class: 'lbl', style: 'font-size:10.5px;fill:var(--ink-2)' }); });
  series.forEach((s, si) => {
    const pts = s.values.map((v, i) => P(i, R * clamp(ok(v) ? v : 0, 0, 1)));
    const pg = S('polygon', { points: pts.map(p => p.join(',')).join(' '), fill: s.color, 'fill-opacity': .16, stroke: s.color, 'stroke-width': 2, style: `transform-origin:${cx}px ${cy}px;transform:scale(0);transition:transform 1s cubic-bezier(.2,.8,.2,1) ${si * 120}ms` }, svg);
    pts.forEach((p, i) => { const c = S('circle', { cx: p[0], cy: p[1], r: 3.5, fill: s.color, stroke: 'var(--surface)', 'stroke-width': 1.5, class: 'fade' }, svg); bindTip(c, () => `<b>${esc(axes[i])}</b><hr>${ttRow(s.name, (o.fmt || (x => int(x * 100)))(s.values[i]), s.color)}`); });
    later(() => { pg.style.transform = 'scale(1)'; }, 80);
  });
  reveal(el);
}

/* dispersão / bolhas */
function scatter(el, pts, o) {
  el.innerHTML = '';
  const holder = document.createElement('div'); el.appendChild(holder);
  const { svg, W, H } = box(holder, o.h || 420);
  const xs = pts.map(p => p.x).filter(ok), ys = pts.map(p => p.y).filter(ok);
  const xlo = o.xmin != null ? o.xmin : quant(xs, 0.01), xhi = o.xmax != null ? o.xmax : quant(xs, 0.99);
  const ylo = o.ymin != null ? o.ymin : quant(ys, 0.01), yhi = o.ymax != null ? o.ymax : quant(ys, 0.99);
  const xt = niceTicks(xlo, xhi, 5), yt = niceTicks(ylo, yhi, 5);
  const ml = 58, mr = 16, mt = 12, mb = 40;
  const X = v => ml + (clamp(v, xt[0], xt[xt.length - 1]) - xt[0]) / (xt[xt.length - 1] - xt[0]) * (W - ml - mr);
  const Y = v => mt + (yt[yt.length - 1] - clamp(v, yt[0], yt[yt.length - 1])) / (yt[yt.length - 1] - yt[0]) * (H - mt - mb);
  const g = S('g', { class: 'gridl' }, svg), ax = S('g', { class: 'ax' }, svg);
  xt.forEach(t => { S('line', { x1: X(t), x2: X(t), y1: mt, y2: H - mb }, g); T(ax, X(t), H - mb + 15, o.xFmt(t), { 'text-anchor': 'middle' }); });
  yt.forEach(t => { S('line', { x1: ml, x2: W - mr, y1: Y(t), y2: Y(t) }, g); T(ax, ml - 8, Y(t) + 3.5, o.yFmt(t), { 'text-anchor': 'end' }); });
  T(svg, ml + (W - ml - mr) / 2, H - 6, o.xLabel, { 'text-anchor': 'middle', class: 'lbl', style: 'font-weight:600;fill:var(--ink-2)' });
  T(svg, 12, mt + (H - mt - mb) / 2, o.yLabel, { 'text-anchor': 'middle', class: 'lbl', transform: `rotate(-90 12 ${mt + (H - mt - mb) / 2})`, style: 'font-weight:600;fill:var(--ink-2)' });
  if (o.refX != null) { S('line', { x1: X(o.refX.v), x2: X(o.refX.v), y1: mt, y2: H - mb, stroke: 'var(--crit)', 'stroke-dasharray': '4 4' }, svg); T(svg, X(o.refX.v) + 4, mt + 10, o.refX.l, { class: 'lbl', fill: 'var(--crit-ink)' }); }
  if (o.refY != null) { S('line', { x1: ml, x2: W - mr, y1: Y(o.refY.v), y2: Y(o.refY.v), stroke: 'var(--ink-3)', 'stroke-dasharray': '4 4' }, svg); T(svg, W - mr - 4, Y(o.refY.v) - 5, o.refY.l, { class: 'lbl', 'text-anchor': 'end' }); }
  const rmax = Math.max(...pts.map(p => p.r || 0)) || 1;
  const sorted = pts.filter(p => ok(p.x) && ok(p.y)).sort((a, b) => (b.r || 0) - (a.r || 0));
  const gp = S('g', {}, svg);
  sorted.forEach((p, i) => {
    const rr = 3 + Math.sqrt((p.r || 0) / rmax) * (o.rMax || 26);
    const c = S('circle', { cx: X(p.x), cy: Y(p.y), r: rr, fill: p.color, 'fill-opacity': p.sel ? .95 : .55, stroke: p.sel ? 'var(--ink)' : 'var(--surface)', 'stroke-width': p.sel ? 2.5 : 1, style: `cursor:pointer;transform-origin:${X(p.x)}px ${Y(p.y)}px;transform:scale(0);transition:transform .6s cubic-bezier(.2,1.3,.4,1) ${Math.min(600, i * 2)}ms` }, gp);
    c.dataset.g = p.group || '';
    bindTip(c, () => o.tip(p));
    if (o.onClick) c.addEventListener('click', () => o.onClick(p));
    requestAnimationFrame(() => requestAnimationFrame(() => { c.style.transform = 'scale(1)'; }));
  });
  const sel = sorted.find(p => p.sel);
  if (sel) { const rr = 3 + Math.sqrt((sel.r || 0) / rmax) * (o.rMax || 26); S('circle', { cx: X(sel.x), cy: Y(sel.y), r: rr + 7, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.5, class: 'pulse' }, svg); T(svg, X(sel.x) + rr + 9, Y(sel.y) - 6, sel.label, { style: 'font:700 12px var(--sans);fill:var(--ink)' }); }
  return gp;
}

/* histograma com marcador */
function histogram(el, vals, o) {
  el.innerHTML = '';
  const holder = document.createElement('div'); el.appendChild(holder);
  const { svg, W, H } = box(holder, o.h || 170);
  const lo = o.min != null ? o.min : quant(vals, 0.01), hi = o.max != null ? o.max : quant(vals, 0.99), nb = o.bins || 24;
  const cnt = new Array(nb).fill(0); vals.forEach(v => { if (!ok(v)) return; const b = clamp(Math.floor((v - lo) / (hi - lo) * nb), 0, nb - 1); cnt[b]++; });
  const mx = Math.max(...cnt), ml = 10, mr = 10, mt = 16, mb = 24, bw = (W - ml - mr) / nb;
  const Y = c => mt + (1 - c / mx) * (H - mt - mb);
  cnt.forEach((c, i) => {
    const x0 = lo + (hi - lo) * i / nb, x1 = lo + (hi - lo) * (i + 1) / nb;
    const col = o.colorFn ? o.colorFn((x0 + x1) / 2) : 'var(--s1)';
    const rc = S('rect', { x: ml + i * bw + 1, y: Y(c), width: bw - 2, height: H - mb - Y(c), rx: 2, fill: col, opacity: .75, class: 'grow-y' }, svg);
    rc.style.transitionDelay = i * 18 + 'ms';
    bindTip(rc, () => `<b>${o.fmt(x0)} a ${o.fmt(x1)}</b><hr>${ttRow('Instituições', int(c))}`);
  });
  const ax = S('g', { class: 'ax' }, svg);
  niceTicks(lo, hi, 5).forEach(t => { if (t < lo || t > hi) return; T(ax, ml + (t - lo) / (hi - lo) * (W - ml - mr), H - 6, o.fmt(t), { 'text-anchor': 'middle' }); });
  if (ok(o.marker)) {
    const x = ml + (clamp(o.marker, lo, hi) - lo) / (hi - lo) * (W - ml - mr);
    S('line', { x1: x, x2: x, y1: 6, y2: H - mb, stroke: 'var(--ink)', 'stroke-width': 2 }, svg);
    S('circle', { cx: x, cy: 8, r: 4.5, fill: 'var(--ink)' }, svg);
    T(svg, x + (x > W - 140 ? -8 : 8), 12, o.markerLabel || o.fmt(o.marker), { 'text-anchor': x > W - 140 ? 'end' : 'start', style: 'font:700 11.5px var(--sans);fill:var(--ink)' });
  }
  reveal(holder);
}

/* curva de densidade (perdas, P&L) */
function densityChart(el, o) {
  el.innerHTML = '';
  const holder = document.createElement('div'); el.appendChild(holder);
  const { svg, W, H } = box(holder, o.h || 220);
  const ml = 14, mr = 14, mt = 18, mb = 26;
  const xs = o.xs, xmin = xs[0], xmax = xs[xs.length - 1];
  const ymax = Math.max(...o.series.flatMap(s => s.ys)) * 1.08;
  const X = x => ml + (x - xmin) / (xmax - xmin) * (W - ml - mr), Y = y => mt + (1 - y / ymax) * (H - mt - mb);
  S('line', { x1: ml, x2: W - mr, y1: H - mb, y2: H - mb, stroke: 'var(--axis)' }, svg);
  const ax = S('g', { class: 'ax' }, svg);
  niceTicks(xmin, xmax, 6).forEach(t => { if (t < xmin || t > xmax) return; T(ax, X(t), H - 8, o.fmt(t), { 'text-anchor': 'middle' }); });
  o.series.forEach(s => {
    let d = ''; xs.forEach((x, i) => { d += (i ? 'L' : 'M') + X(x).toFixed(1) + ',' + Y(s.ys[i]).toFixed(1); });
    if (s.fill) S('path', { d: d + `L${X(xmax)},${Y(0)}L${X(xmin)},${Y(0)}Z`, fill: s.color, 'fill-opacity': .14, class: 'fade' }, svg);
    const p = S('path', { d, fill: 'none', stroke: s.color, 'stroke-width': 2.2, 'stroke-dasharray': s.dash || null, class: s.dash ? 'fade' : 'draw' }, svg);
    if (!s.dash) { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; }
  });
  if (o.shade) {
    const s = o.series[0]; let d = ''; let first = null;
    xs.forEach((x, i) => { if ((o.shade.dir > 0 && x >= o.shade.from) || (o.shade.dir < 0 && x <= o.shade.from)) { if (!first) first = x; d += (d ? 'L' : 'M') + X(x) + ',' + Y(s.ys[i]); } });
    if (d) { const last = o.shade.dir > 0 ? xmax : o.shade.from; S('path', { d: d + `L${X(o.shade.dir > 0 ? xmax : o.shade.from)},${Y(0)}L${X(first)},${Y(0)}Z`, fill: 'var(--crit)', 'fill-opacity': .3, class: 'fade' }, svg); }
  }
  (o.markers || []).forEach((m, i) => {
    const x = X(m.x); S('line', { x1: x, x2: x, y1: mt - 6, y2: H - mb, stroke: m.color || 'var(--ink)', 'stroke-width': 1.6, 'stroke-dasharray': m.dash ? '4 3' : null }, svg);
    T(svg, x + (x > W * .7 ? -5 : 5), mt + 4 + i * 13, m.label, { 'text-anchor': x > W * .7 ? 'end' : 'start', style: `font:700 11px var(--sans);fill:${m.color || 'var(--ink)'}` });
  });
  reveal(holder);
}

/* sankey bipartido (alocação proporcional) */
function sankey(el, left, right, o = {}) {
  el.innerHTML = '';
  const holder = document.createElement('div'); el.appendChild(holder);
  const { svg, W, H } = box(holder, o.h || 320);
  const foldS = arr => { const a = arr.filter(x => x.value > 0).sort((p, q) => q.value - p.value); const t = sum(a.map(x => x.value)); const big = a.filter((x, i) => x.value >= t * 0.035 || i < 2); const small = a.filter(x => !big.includes(x)); if (small.length > 1) big.push({ label: 'Demais (' + small.length + ')', value: sum(small.map(x => x.value)), color: '#8A8F9C', tip: small.map(x => esc(x.label) + ': ' + (o.fmt || brl)(x.value)).join('<br>') }); else big.push(...small); return big; };
  const L = foldS(left), R = foldS(right);
  const tl = sum(L.map(x => x.value)), tr = sum(R.map(x => x.value)), tot = Math.max(tl, tr);
  const pad = 6, nw = 14, lx = o.lw || 170, rx = W - (o.rw || 170) - nw;
  const avail = h => H - 16 - pad * (h - 1);
  const sl = avail(L.length) / tot, sr = avail(R.length) / tot, sc = Math.min(sl, sr);
  let y = 8; const ln = L.map(x => { const h = x.value * sc; const r = { ...x, y, h, off: 0 }; y += h + pad; return r; });
  y = 8; const rn = R.map(x => { const h = x.value * sc; const r = { ...x, y, h, off: 0 }; y += h + pad; return r; });
  const gL = S('g', {}, svg);
  ln.forEach((a, i) => {
    rn.forEach((b, j) => {
      const v = a.value * b.value / tr; const hh = v * sc; if (hh < 0.3) return;
      const y0 = a.y + a.off + hh / 2, y1 = b.y + b.off + hh / 2; a.off += hh; b.off += hh;
      const x0 = lx + nw, x1 = rx, mx = (x0 + x1) / 2;
      const p = S('path', { d: `M${x0},${y0}C${mx},${y0} ${mx},${y1} ${x1},${y1}`, stroke: o.colorBy === 'right' ? b.color : a.color, 'stroke-width': Math.max(1, hh), fill: 'none', 'stroke-opacity': .3, class: 'fade', style: 'transition:stroke-opacity .25s' }, gL);
      p.addEventListener('pointerenter', ev => { p.setAttribute('stroke-opacity', .7); tipShow(`<b>${esc(a.label)} → ${esc(b.label)}</b><hr>${ttRow('Fluxo proporcional', (o.fmt || brl)(v))}`, ev); });
      p.addEventListener('pointermove', tipMove);
      p.addEventListener('pointerleave', () => { p.setAttribute('stroke-opacity', .3); tipHide(); });
    });
  });
  const lab = (n, x, anchor) => {
    const r = S('rect', { x, y: n.y, width: nw, height: Math.max(2, n.h), rx: 3, fill: n.color, class: 'grow-y' }, svg);
    bindTip(r, () => `<b>${esc(n.label)}</b><hr>${ttRow('Valor', (o.fmt || brl)(n.value), n.color)}${ttRow('Participação', pct(n.value / tot))}${n.tip ? '<hr>' + n.tip : ''}`);
    const tx = anchor === 'end' ? x - 8 : x + nw + 8, ty = n.y + n.h / 2;
    const room = Math.floor(((anchor === 'end' ? lx : W - rx - nw) - 12) / 6.3);
    if (n.h >= 9) T(svg, tx, ty - (n.h > 22 ? 2 : -4), n.label.length > room ? n.label.slice(0, room - 1) + '…' : n.label, { 'text-anchor': anchor, style: 'font:600 11.5px var(--sans);fill:var(--ink)' });
    if (n.h > 22) T(svg, tx, ty + 12, (o.fmt || brl)(n.value), { 'text-anchor': anchor, class: 'lbl' });
  };
  ln.forEach(n => lab(n, lx, 'end')); rn.forEach(n => lab(n, rx, 'start'));
  reveal(holder);
}

/* barras 100% empilhadas */
function stack100(el, rows, o = {}) {
  el.innerHTML = '';
  const keys = []; rows.forEach(r => r.parts.forEach(p => { if (!keys.find(k => k.label === p.label)) keys.push({ label: p.label, color: p.color }); }));
  if (!o.noLegend) legend(el, keys.map(k => ({ name: k.label, color: k.color })));
  const holder = document.createElement('div'); el.appendChild(holder);
  const rh = o.rh || 30, lw = o.lw || 120, H = rows.length * (rh + 10) + 4;
  const { svg, W } = box(holder, H);
  rows.forEach((r, i) => {
    const y = 4 + i * (rh + 10), tot = sum(r.parts.map(p => Math.max(0, p.value)));
    T(svg, lw - 10, y + rh / 2 + 4, r.label, { 'text-anchor': 'end', style: 'font:600 12px var(--sans);fill:var(--ink)' });
    let x = lw;
    r.parts.forEach((p, j) => {
      const w = tot ? Math.max(0, p.value) / tot * (W - lw - 6) : 0; if (w <= 0) return;
      const rc = S('rect', { x: x + 1, y, width: Math.max(0.5, w - 2), height: rh, rx: 3, fill: p.color, class: 'grow-x' }, svg);
      rc.style.transitionDelay = (i * 90 + j * 50) + 'ms';
      bindTip(rc, () => `<b>${esc(r.label)} · ${esc(p.label)}</b><hr>${ttRow('Valor', (o.fmt || brl)(p.value), p.color)}${ttRow('Participação', pct(p.value / tot))}`);
      if (w > 44) T(svg, x + w / 2, y + rh / 2 + 4, pct(p.value / tot, 0), { 'text-anchor': 'middle', style: 'font:700 10.5px var(--sans);fill:#fff;pointer-events:none', class: 'fade' });
      x += w;
    });
  });
  reveal(holder);
}

/* mini sparkline (string SVG) */
function spark(vals, color = 'var(--s1)', w = 72, h = 26) {
  const v = vals.filter(ok); if (v.length < 2) return '';
  const lo = Math.min(...v), hi = Math.max(...v), r = hi - lo || 1;
  const pts = vals.map((x, i) => ok(x) ? [(i / (vals.length - 1)) * (w - 4) + 2, h - 3 - (x - lo) / r * (h - 6)] : null).filter(Boolean);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('');
  const l = pts[pts.length - 1];
  return `<svg class="sk" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><path d="${d}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${l[0]}" cy="${l[1]}" r="2.6" fill="${color}"/></svg>`;
}

/* matriz de calor (HTML) */
function heatTable(el, rows, cols, mat, o = {}) {
  const mx = Math.max(...mat.flat().filter(ok).map(Math.abs)) || 1;
  const cell = (v, crit) => {
    if (!ok(v) || v === 0) return `<td style="color:var(--ink-3)">—</td>`;
    const f = Math.sqrt(Math.abs(v) / mx);
    const bg = crit ? `color-mix(in srgb,var(--crit) ${Math.round(12 + f * 70)}%,var(--surface))` : `color-mix(in srgb,var(--s1) ${Math.round(8 + f * 72)}%,var(--surface))`;
    return `<td style="background:${bg};color:${f > .55 ? '#fff' : 'var(--ink)'};font-weight:${f > .55 ? 650 : 500};padding:6px 6px;font-size:11.5px">${(o.fmt || (x => brl(x, { noR: true })))(v)}</td>`;
  };
  el.innerHTML = `<div class="tblwrap" style="max-height:none"><table class="tbl" style="font-size:12px"><thead><tr><th>${o.corner || 'R$'}</th>${cols.map(c => `<th>${c}</th>`).join('')}${o.total ? '<th>Total</th>' : ''}</tr></thead><tbody>${rows.map((r, i) => `<tr><td class="l">${r}</td>${mat[i].map((v, j) => cell(v, o.critCol === j)).join('')}${o.total ? `<td style="font-size:11.5px"><b>${(o.fmt || (x => brl(x, { noR: true })))(sum(mat[i]))}</b></td>` : ''}</tr>`).join('')}</tbody></table></div>`;
}

/* ---------------- matemática ---------------- */
function erf(x) { const s = Math.sign(x); x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return s * y; }
const Ncdf = x => 0.5 * (1 + erf(x / Math.SQRT2));
const Npdf = x => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
function Ninv(p) {
  if (p <= 0) return -Infinity; if (p >= 1) return Infinity;
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
  const pl = 0.02425, ph = 1 - pl; let q, r;
  if (p < pl) { q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  if (p <= ph) { q = p - 0.5; r = q * q; return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1); }
  q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
}
/* Vasicek / ASRF */
const vasicekQ = (pd, rho, q) => Ncdf((Ninv(pd) + Math.sqrt(rho) * Ninv(q)) / Math.sqrt(1 - rho));
function vasicekPdf(x, pd, rho) { // densidade da taxa de perda da carteira (LGD=1)
  if (x <= 0 || x >= 1) return 0;
  const k = Ninv(x), a = Ninv(pd);
  return Math.sqrt((1 - rho) / rho) * Math.exp(0.5 * k * k - (1 / (2 * rho)) * Math.pow(Math.sqrt(1 - rho) * k - a, 2));
}
/* Basileia: correlação de varejo/empresas (BCBS IRB) */
const rhoCorp = pd => 0.12 * (1 - Math.exp(-50 * pd)) / (1 - Math.exp(-50)) + 0.24 * (1 - (1 - Math.exp(-50 * pd)) / (1 - Math.exp(-50)));
const rhoRetail = pd => 0.03 * (1 - Math.exp(-35 * pd)) / (1 - Math.exp(-35)) + 0.16 * (1 - (1 - Math.exp(-35 * pd)) / (1 - Math.exp(-35)));

/* ---------------- dados macro (SGS) ---------------- */
const SG = D.SGS;
const sgv = (k, m) => { const i = SG.meses.indexOf(m); const v = i >= 0 ? SG[k][i] : null; return v == null ? NaN : v / 100; };
const sgLast = k => { const a = SG[k], lim = D.Q[QI]; for (let i = a.length - 1; i >= 0; i--) if (ok(a[i]) && SG.meses[i] <= lim) return { v: a[i], m: SG.meses[i] }; return { v: NaN }; };
const sgAvg = (k, from, to) => mean(SG.meses.map((m, i) => (m >= from && m <= to) ? SG[k][i] : null));
let CDI_LTM = NaN, SELIC_NOW = NaN;
function setBase(qi) {
  QI = clamp(qi, 0, NQ - 1);
  const b = D.Q[QI], y = +b.slice(0, 4), mo = +b.slice(4);
  const from = mo === 12 ? y + '01' : (y - 1) + String(mo + 1).padStart(2, '0');
  CDI_LTM = sgAvg('cdi', from, b) / 100; SELIC_NOW = sgLast('selic').v / 100;
}
setBase(NQ - 1);
