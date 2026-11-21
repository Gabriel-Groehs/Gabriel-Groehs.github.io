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
let QI = NQ - 1;
const MC = new Map();
const range = (a, b) => { const o = []; for (let i = a; i <= b; i++) o.push(i); return o; };
function mEnd(qi) { return D.M.indexOf(D.Q[qi]); }
const mat2 = (flat, rows) => flat ? range(0, rows - 1).map(i => flat.slice(i * 7, i * 7 + 7)) : null;
function metricsAt(n, qi) {
  const key = n.id + '|' + qi; if (MC.has(key)) return MC.get(key);
  const r = aggregate(n);
  const Vq = (k, q = qi) => r.V[q][FI[k]] || 0;
  const flow = (k, q) => { const j = DI[k], c = r.R[q][j] || 0; return (semEnd(q) && q > 0) ? c - (r.R[q - 1][j] || 0) : c; };
  const w0 = Math.max(0, qi - 3), W = range(w0, qi), ann = 4 / W.length;
  const a0 = Math.max(0, qi - 4), A = range(a0, qi);
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
  // índices sobre a carteira (DRE gerencial)
  const gi = (q, ann_) => {
    const f = k => q == null ? L(k) : flow(k, q) * 4;
    const iq = q == null ? m.icoop : (r.IQ[q] || 0) * 4;
    const rec = f('rcre') + f('rtvm') + f('rapl') + f('rarr') + f('rocc') + f('rder') + f('rout') + iq + f('tar') + f('srv') + f('rpag');
    const fun = -(f('dcp') + f('ddc'));
    const prov = -(f('pe') + f('peo'));
    const dd = -(f('pes') + f('adm'));
    const ll = f('ll');
    const mb = rec - fun, ml = mb - prov, di = ml - dd - ll;
    const base = q == null ? aCrb : (q ? (Vq('crb', q) + Vq('crb', q - 1)) / 2 : Vq('crb', q));
    return { rec: div(rec, base), fun: div(fun, base), mb: div(mb, base), prov: div(prov, base), ml: div(ml, base), dd: div(dd, base), di: div(di, base), ll: div(ll, base) };
  };
  m.gi = gi(null); m.giQ = range(0, qi).map(q => gi(q));
  const g = k => qi >= 4 ? div(Vq(k, qi), Vq(k, qi - 4)) - 1 : NaN;
  m.gAt = g('at'); m.gCrb = g('crb'); m.gCapt = g('capt'); m.gPl = g('pl'); m.gDep = g('dep');
  const gq = k => qi >= 1 ? div(Vq(k, qi), Vq(k, qi - 1)) - 1 : NaN;
  m.gqAt = gq('at'); m.gqCrb = gq('crb');
  // séries trimestrais até a data-base
  const Q = range(0, qi);
  const qa = (k, q) => q ? (Vq(k, q) + Vq(k, q - 1)) / 2 : Vq(k, q);
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
  q.roe = Q.map(i => div(4 * flow('ll', i), qa('pl', i)));
  q.roa = Q.map(i => div(4 * flow('ll', i), qa('at', i)));
  q.nim = Q.map(i => div(4 * (flow('rif', i) - flow('pe', i) + (r.IQ[i] || 0)), qa('at', i)));
  q.yld = Q.map(i => div(4 * flow('rcre', i), qa('crb', i)));
  q.cof = Q.map(i => div(-4 * flow('dcp', i), qa('capt', i)));
  q.spread = q.yld.map((y, i) => y - q.cof[i]);
  q.cor = Q.map(i => div(-4 * flow('pecr', i), qa('crb', i)));
  q.eff = Q.map(i => div(-(flow('pes', i) + flow('adm', i)), flow('rif', i) - flow('pe', i) + (r.IQ[i] || 0) + flow('tar', i) + flow('srv', i) + flow('rpag', i)));
  q.irrbb = Q.map(i => X.prI[i] ? X.irr[i] / X.prI[i] : NaN);
  q.e3 = Q.map(i => { const c = r.CZ && r.CZ[i]; if (!c) return NaN; const t = c[CI.e1] + c[CI.e2] + c[CI.e3] + c[CI.sn] + c[CI.sp]; return div(c[CI.e3] + c[CI.sp], t); });
  q.e2 = Q.map(i => { const c = r.CZ && r.CZ[i]; if (!c) return NaN; const t = c[CI.e1] + c[CI.e2] + c[CI.e3] + c[CI.sn] + c[CI.sp]; return div(c[CI.e2], t); });
  q.rwaD = Q.map(i => div(Vq('rwa', i), Vq('at', i)));
  q.mktPR = Q.map(i => div(Vq('rwam', i) * 0.08, Vq('pr', i)));
  m.q = q;
  const HD = { opx: ['pes', 'adm'], tar: ['tar', 'srv'] };
  m.H = k => Q.map(i => {
    if (HD[k]) return HD[k].reduce((s, x) => s + flow(x, i), 0);
    if (k === 'liq') return Vq('disp', i) + Vq('aplic', i);
    if (DI[k] != null) return flow(k, i);
    return Vq(k, i);
  });
  const me = mEnd(qi);
  m.r = { pf: r.PF ? mat2(r.PF[qi], 7) : null, pj: r.PJ ? mat2(r.PJ[qi], 9) : null, ix: r.X[qi], cz, m: r.M && me >= 0 ? r.M.map(a => a.slice(0, me + 1)) : null, BC: r.BC };
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
