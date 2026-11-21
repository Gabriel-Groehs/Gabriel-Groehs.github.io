"""Monta a base compacta do Radar Prudencial (cooperativas e bancos) a partir de:
IF.data (Olinda), balancetes COSIF 4010 (cooperativas), 4060 (conglomerados prudenciais),
combinados cooperativos 4413/4423/4433, SGS e o agregado SCR.data já usado na Cidade do Crédito.
Saída: data/radar.json (valores monetários em R$ mil, inteiros)."""
import json, os, re, sys, zipfile, collections, unicodedata

SP = os.path.dirname(os.path.abspath(__file__))
D = os.path.join(SP, "data")
B = os.path.join(SP, "b4010")
G = os.path.join(SP, "sgs")
REPO = sys.argv[1]

QS = ["202503", "202506", "202509", "202512", "202603", "202606"]
LAST = QS[-1]
MS = ["202507", "202508", "202509", "202510", "202511", "202512", "202601", "202602", "202603", "202604", "202605", "202606"]

def load(am, rel, tipo=1):
    p = os.path.join(D, "v_%s_t%d_r%s.json" % (am, tipo, rel))
    return json.load(open(p, encoding="utf-8")) if os.path.exists(p) else []

def table(am, rel):
    """{CodInst: {Conta: Saldo}} e mapa conta->(grupo,nome)"""
    t = collections.defaultdict(dict); names = {}
    for r in load(am, rel):
        t[r["CodInst"]][r["Conta"]] = r["Saldo"] if r["Saldo"] is not None else 0.0
        names[r["Conta"]] = (r.get("Grupo"), r["NomeColuna"])
    return t, names

# ---------- campos IF.data (último trimestre) ----------
BAL = [  # (chave, relatório, conta)
    ("disp", "2", "140198"), ("aplic", "2", "140199"), ("tvm", "2", "140200"), ("dera", "2", "141612"),
    ("crb", "2", "140201"), ("pec", "2", "140202"), ("crl", "2", "140205"), ("arr", "2", "140210"),
    ("occ", "2", "140216"), ("pag", "2", "145833"), ("oar", "2", "140218"), ("perm", "2", "140219"), ("at", "2", "140220"),
    ("dvis", "3", "140222"), ("dpou", "3", "140223"), ("dint", "3", "140224"), ("dpra", "3", "140225"), ("dpre", "3", "140226"),
    ("dout", "3", "140227"), ("dep", "3", "140228"), ("comp", "3", "140230"), ("lci", "3", "140231"), ("lca", "3", "140232"),
    ("lf", "3", "140233"), ("ext", "3", "140234"), ("demi", "3", "140235"), ("oid", "3", "140236"), ("emr", "3", "140238"),
    ("capt", "3", "140239"), ("derp", "3", "140241"), ("oob", "3", "140242"), ("dcap", "3", "140243"), ("pex", "3", "140244"),
    ("pl", "3", "140246"),
    ("cp", "5", "79645"), ("at1", "5", "79646"), ("n1", "5", "79647"), ("n2", "5", "79648"), ("pr", "5", "79649"),
    ("rwac", "5", "138232"), ("rwam", "5", "79651"), ("rcam", "5", "79652"), ("rcom", "5", "79653"), ("rjur", "5", "79654"),
    ("racs", "5", "79655"), ("rcva", "5", "134460"), ("rdrc", "5", "142840"), ("rwao", "5", "79656"), ("rwas", "5", "134461"),
    ("rwa", "5", "79665"), ("expo", "5", "79658"), ("acp", "5", "92999"), ("irrbb", "5", "98576"),
    ("imob", "5", "79662"),  # razão (não monetária)
    ("k1", "16", "148835"), ("k2", "16", "148836"), ("k3", "16", "148837"), ("k4", "16", "148838"), ("k5", "16", "148839"),
    ("prob", "16", "148833"), ("inad", "16", "148834"), ("scr", "16", "24454"), ("nind", "16", "24457"), ("ninf", "16", "149385"),
    ("cli", "10", "113786"), ("ops", "10", "113787"),
]
DRE = [
    ("rapl", "141825"), ("rtvm", "141830"), ("rcre", "141835"), ("rjcr", "141831"), ("rarr", "141836"), ("rocc", "141837"),
    ("pe", "141842"), ("pecr", "141840"), ("dcp", "141847"), ("djcp", "141843"), ("ddc", "141848"), ("rder", "141849"),
    ("rout", "141850"), ("rif", "141851"), ("rpag", "141855"), ("tar", "141856"), ("srv", "141857"), ("pes", "141858"),
    ("adm", "141859"), ("peo", "141860"), ("trib", "141862"), ("part", "141863"), ("orec", "141864"), ("odes", "141865"),
    ("ovr", "141866"), ("lair", "141867"), ("ir", "141868"), ("plr", "141869"), ("ll", "141870"), ("jcp", "141861"),
    # v2.1 — sublinhas para a DRE gerencial por segmento
    ("pe1", "141838"), ("pe2", "141839"), ("pe4", "142851"), ("pe5", "142852"), ("pe6", "141841"),
    ("pg1", "141852"), ("pg2", "141853"), ("pg3", "141854"),
]
IDX = [("pre", "23367"), ("cdi", "23372"), ("selic", "23373"), ("tr", "23368"), ("tjlp", "23369"), ("tlp", "94951"),
       ("ipca", "23376"), ("igpm", "23375"), ("opos", "23371"), ("oflu", "23374"), ("oidp", "23378"), ("oind", "23379"),
       ("tcr", ("107030", "112607", "112608", "112609")), ("tot", "24454")]
BKT = ["A Vencer em até 90 Dias", "A Vencer Entre 91 a 360 Dias", "A Vencer Entre 361 a 1080 Dias", "A Vencer Entre 1081 a 1800 Dias",
       "A Vencer Entre 1801 a 5400 Dias", "A Vencer Acima de 5400 Dias", "Vencido a Partir de 15 Dias"]
PFM = ["Empréstimo com Consignação em Folha", "Empréstimo sem Consignação em Folha", "Veículos", "Habitação", "Cartão de Crédito",
       "Rural e Agroindustrial", "Outros Créditos"]
PJM = ["Capital de Giro", "Investimento", "Cheque Especial e Conta Garantida", "Operações com Recebíveis", "Comércio Exterior",
       "Financiamento de Infraestrutura/Desenvolvimento/Projeto e Outros Créditos", "Habitacional", "Rural e Agroindustrial", "Outros Créditos"]

def norm(s):
    return unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower().strip()

BK = [norm(b) for b in BKT]

def k(x):
    return int(round((x or 0) / 1000.0))  # R$ -> R$ mil

# ---------- carregar último trimestre ----------
tabs = {}
for rel in ("2", "3", "5", "16", "10", "7"):
    tabs[rel], _ = table(LAST, rel)
dre = {am: table(am, "4")[0] for am in QS}
r11 = collections.defaultdict(lambda: [[0] * 7 for _ in PFM])
r13 = collections.defaultdict(lambda: [[0] * 7 for _ in PJM])
for rel, store, mods in (("11", r11, PFM), ("13", r13, PJM)):
    nm = [norm(m) for m in mods]
    for r in load(LAST, rel):
        g = norm(r.get("Grupo"))
        if g not in nm:
            continue
        c = norm(r["NomeColuna"]).replace("  ", " ")
        if c not in BK:
            continue
        store[r["CodInst"]][nm.index(g)][BK.index(c)] = k(r["Saldo"])

cad = {r["CodInst"]: r for r in json.load(open(os.path.join(D, "cad_%s.json" % LAST), encoding="utf-8"))}
# nomes dos conglomerados: instituição líder
lead = {}
for r in cad.values():
    c = r.get("CodConglomeradoPrudencial")
    if c and (r.get("CnpjInstituicaoLider") == r["CodInst"] or c not in lead):
        if c not in lead or r.get("CnpjInstituicaoLider") == r["CodInst"]:
            lead[c] = r

reg = {r["CNPJ"]: r for r in json.load(open(os.path.join(D, "coops_reg.json"), encoding="utf-8"))["value"]}

# ---------- universo ----------
codes = set(tabs["2"].keys())
SYSKEY = [("sicredi", "SICREDI"), ("sicoob", "SICOOB"), ("cresol", "CRESOL"), ("unicred", "UNICRED"), ("ailos", "AILOS"),
          ("uniprime", "UNIPRIME"), ("credisis", "CREDISIS")]
SYSN = {"sicredi": "Sicredi", "sicoob": "Sicoob", "cresol": "Cresol", "unicred": "Unicred", "ailos": "Ailos",
        "uniprime": "Uniprime", "credisis": "Credisis", "indep": "Independentes"}

def sys_of(text):
    t = (text or "").upper()
    for key, kw in SYSKEY:
        if kw in t:
            return key
    return None

UFS = set("AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split())
SMALL = {"de", "da", "do", "das", "dos", "e", "em", "com", "a", "o", "na", "no", "para"}
KEEP = {"LTDA", "LTDA.", "S.A.", "S/A", "CC", "CCC", "BV", "XP", "BTG", "BNDES", "BNB", "BRB", "ABC", "BMG", "C6", "II", "III", "IV",
        "VI", "VII", "VIII", "IX", "XI", "XII", "MG", "UFV", "UFMG", "CEF", "BB", "RS/SC", "SC/RS", "PR/SP", "PR/SP/RJ", "MS/GO", "RJ/ES"}

def smart(s):
    out = []
    for i, w in enumerate((s or "").split()):
        W = w.upper()
        bare = re.sub(r"[^A-Z0-9/]", "", unicodedata.normalize("NFKD", W).encode("ascii", "ignore").decode())
        if W in KEEP or bare in UFS or ("/" in W and len(W) <= 9):
            out.append(W)
        elif i > 0 and w.lower() in SMALL:
            out.append(w.lower())
        else:
            out.append(w[:1].upper() + w[1:].lower())
    return " ".join(out).replace("Ltda.", "").replace("Ltda", "").strip(" -")

def short_coop(full):
    if not full:
        return ""
    parts = [p.strip() for p in re.split(r"\s+-\s+|\s+–\s+", full) if p.strip()]
    if len(parts) > 1:
        cand = [x for x in parts if len(x) >= 3 and not re.match(r"^(COOPERATIVA|CC |CCC )", x, re.I)]
        s = cand[-1] if cand else parts[-1]
    else:
        s = full
    s = re.sub(r"^COOPERATIVA DE (ECONOMIA E )?CR[EÉ]DITO( M[UÚ]TUO)?( DE LIVRE ADMISS[AÃ]O)?( DE ASSOCIADOS)?\s*", "", s, flags=re.I) or s
    s = re.sub(r"^[,;\s-]*(POUPAN[ÇC]A E INVESTIMENTO|E INVESTIMENTO|INVESTIMENTO|COM INTERA[ÇC][ÃA]O SOLID[ÁA]RIA|RURAL|DE LIVRE ADMISS[ÃA]O)?[,;\s-]*(DE |DO |DA |DOS |DAS )?", "", s, flags=re.I).strip(" ,-") or s
    return smart(s)[:60]

BANKS = {
    "C0080099": "Itaú Unibanco", "C0080329": "Banco do Brasil", "C0080738": "Caixa", "C0080075": "Bradesco",
    "C0080185": "Santander", "C0081847": "BNDES", "C0080336": "BTG Pactual", "C0084693": "Nubank", "C0082475": "XP",
    "C0080109": "Safra", "C0080745": "Banco Cooperativo Sicredi", "C0080879": "Banco Sicoob", "C0080154": "Banrisul",
    "C0084844": "C6 Bank", "C0080192": "Citibank", "C0080484": "Banco BV", "C0081744": "Daycoval", "C0080116": "J.P. Morgan",
    "C0080996": "Inter", "C0081593": "Banco do Nordeste", "C0080312": "ABC Brasil", "C0081249": "Banco da Amazônia",
    "C0081555": "Rabobank", "C0083694": "Agibank", "C0080178": "BMG", "C0080123": "Mercantil", "C0080147": "Banestes",
    "C0080673": "BNP Paribas",
}

ents = []
by = {}
for c in sorted(codes):
    cr = cad.get(c)
    if c in BANKS:
        L = lead.get(c, {})
        e = {"id": c, "n": BANKS[c], "nf": (L.get("NomeInstituicao") or BANKS[c]), "k": "b", "sr": L.get("Sr") or "",
             "uf": L.get("Uf") or "", "mu": L.get("Municipio") or "", "tp": L.get("SegmentoTb") or ""}
    elif cr and cr["Tcb"] in ("B3S", "B3C"):
        rg = reg.get(c, {})
        full = rg.get("NOME_INSTITUICAO") or cr.get("NomeInstituicao")
        fil = rg.get("FILIACAO") or ""
        central = rg.get("CLASSE") in ("Central", "Confederação") or cr["Tcb"] == "B3C"
        s = sys_of(fil) or sys_of(full) or "indep"
        cen = fil.split(" - ")[-1].strip() if fil else ""
        if central:
            cen = (full or "").split(" - ")[-1].strip()
        e = {"id": c, "n": short_coop(full), "nf": full, "k": "x" if central else "c", "s": s, "ce": smart(cen)[:48],
             "sr": cr.get("Sr") or "", "uf": rg.get("UF") or cr.get("Uf") or "", "mu": smart(rg.get("MUNICIPIO") or cr.get("Municipio") or ""),
             "cl": rg.get("CATEGCOOPSING") or "", "as": rg.get("ASSOCIACAO") or "", "ini": cr.get("DataInicioAtividade")}
        if cr.get("SegmentoTb") == "Confederação de Serviços":
            continue
    else:
        continue
    ents.append(e); by[c] = e

# nomes duplicados -> acrescenta UF
cnt = collections.Counter(e["n"] for e in ents)
for e in ents:
    if cnt[e["n"]] > 1 and e["k"] != "b":
        e["n"] = (e["n"] + " · " + e["uf"]).strip(" ·")

# ---------- COSIF (4010 / 4060 / combinados) ----------
CL = {"e1": "3311000002", "e2": "3312000001", "e3": "3313000000", "sn": "3314000009", "sp": "3315000008",
      "c1": "3321000009", "c2": "3322000008", "c3": "3323000007", "c4": "3324000006", "c5": "3325000005",
      "fgc": "8118500009", "dvpf": "4111000005", "dvpj": "4112000004", "rl": "1630500003", "rv": "1631500002",
      "rp": "1632500001", "rlca": "1633500000", "rpub": "1634500009", "cent": "1450000006", "crec": "4450000003",
      "clib": "3340000004", "gar": "3350000001", "emp": "1612000002", "fin": "1621000000", "rur": "1630000008",
      "imo": "1640000005", "dsc": "1613000001", "dvi": "4110000006", "dpo": "4120000003", "dpz": "4150000004",
      "let": "4320000009", "capsoc": "6110000004", "res": "6150000002", "adm": "8170000004", "pesb": "8172700003",
      "pese": "8173000001", "pesp": "8173300000", "dpd": "8173900008",
      # v2.1 — bases e custos diretos dos segmentos
      "pagb": "1887900009", "trp": "1415000003", "cvin": "1420000005",
      "pgd": ("8191900004", "8191800001", "8198100003"), "cdd": ("8195000003", "8195200009")}
CLF = list(CL.keys())
MF = ["at", "cr", "dp", "lt", "pl", "rs", "rc", "dc", "e2", "e3", "ad", "ic"]

ACCN = {}
ENTN = {}

def read_cosif(path, docs):
    out = collections.defaultdict(dict)
    if not os.path.exists(path):
        return out
    z = zipfile.ZipFile(path)
    for line in z.read(z.namelist()[0]).decode("latin-1").splitlines()[4:]:
        p = line.split(";")
        if len(p) < 11 or p[1] not in docs:
            continue
        key = p[5] if p[5] else p[2]
        try:
            val = float(p[10].replace(",", "."))
        except ValueError:
            continue
        out[key][p[8]] = out[key].get(p[8], 0) + val
        if key not in ENTN:
            ENTN[key] = p[4]
        if p[8] not in ACCN:
            ACCN[p[8]] = p[9]
    return out

def lvl(code):
    seg = [code[0], code[1], code[2], code[3:5], code[5:7]]
    L = 0
    for i, x in enumerate(seg):
        if x.strip("0"):
            L = i + 1
    return L

BAL_GROUPS = ("1", "2", "4", "6", "7", "8")
MAXLVL = int(os.environ.get("RADAR_MAXLVL", "4"))
ACC_USED = collections.Counter()

def balancete(cur, prev):
    """pares [idx, saldo atual, saldo 12m antes] (R$ mil) para contas até o nível MAXLVL dos grupos patrimoniais e de resultado"""
    out = []
    keys = set()
    for s in (cur or {}, prev or {}):
        for code, val in s.items():
            if code[0] in BAL_GROUPS and lvl(code) <= MAXLVL and abs(val) >= 500:
                keys.add(code)
    for code in sorted(keys):
        a = k((cur or {}).get(code, 0)); b = k((prev or {}).get(code, 0))
        if a == 0 and b == 0:
            continue
        ACC_USED[code] += 1
        out.append([code, a, b])
    return out

def monthly(series):
    """series: dict m -> {conta: saldo}; devolve vetores MF"""
    res = {f: [] for f in MF}
    prev = {}
    for m in MS:
        s = series.get(m)
        if not s:
            for f in MF:
                res[f].append(None)
            prev = {}; continue
        res["at"].append(k(s.get("1000000009", 0) + s.get("2000000008", 0)))
        res["cr"].append(k(s.get("1600000007", 0)))
        res["dp"].append(k(s.get("4100000009", 0)))
        res["lt"].append(k(s.get("4320000009", 0)))
        res["pl"].append(k(s.get("6000000004", 0)))
        res["e2"].append(k(s.get("3312000001", 0)))
        res["e3"].append(k(s.get("3313000000", 0)))
        reset = m[4:] in ("01", "07")
        for f, contas in (("rs", ("7000000003", "8000000002")), ("rc", ("7110000003",)), ("dc", ("8110000002",)), ("ad", ("8170000004",)), ("ic", ("7198600009", "8198600008"))):
            cur = sum(s.get(cc, 0) for cc in contas)
            pv = 0 if reset or not prev else sum(prev.get(cc, 0) for cc in contas)
            res[f].append(k(cur - pv) if (reset or prev) else None)
        prev = s
    return res

MS0 = ["202506"] + MS

# =====================================================================
# v2: base completa por trimestre (data-base selecionável)
# =====================================================================
REL_Q = ("2", "3", "5", "16", "10", "7")
TAB = {am: {rel: table(am, rel)[0] for rel in REL_Q} for am in QS}
DREt = {am: table(am, "4")[0] for am in QS}

def avail(am, rel):
    return bool(TAB[am].get(rel)) if rel in REL_Q else os.path.exists(os.path.join(D, "v_%s_t1_r%s.json" % (am, rel))) and os.path.getsize(os.path.join(D, "v_%s_t1_r%s.json" % (am, rel))) > 100

def srcq(i, rel):
    """índice do trimestre usado para um relatório (fallback ao mais próximo disponível, preferindo o seguinte)"""
    order = [i] + [j for j in range(i + 1, len(QS))] + [j for j in range(i - 1, -1, -1)]
    for j in order:
        if avail(QS[j], rel):
            return j
    return i

AVQ = {rel: [srcq(i, rel) for i in range(len(QS))] for rel in ("7", "10", "11", "13")}
print("fontes por trimestre", AVQ)

MATS = {}
for j in sorted(set(AVQ["11"] + AVQ["13"])):
    am = QS[j]
    r11 = collections.defaultdict(lambda: [0] * 49)
    r13 = collections.defaultdict(lambda: [0] * 63)
    for rel, store, mods in (("11", r11, PFM), ("13", r13, PJM)):
        nm = [norm(m) for m in mods]
        for r in load(am, rel):
            g = norm(r.get("Grupo"))
            if g not in nm:
                continue
            c = norm(r["NomeColuna"]).replace("  ", " ")
            if c not in BK:
                continue
            store[r["CodInst"]][nm.index(g) * 7 + BK.index(c)] = k(r["Saldo"])
    MATS[j] = (r11, r13)

F = [f for f, _, _ in BAL]
DREF = [f for f, _ in DRE]

def bal_vec(c, am):
    v = []
    for f, rel, conta in BAL:
        rr = rel
        tq = am
        if rel in ("10", "7"):
            tq = QS[AVQ[rel][QS.index(am)]]
        x = TAB[tq][rr].get(c, {}).get(conta, 0.0)
        if f == "imob":
            v.append(round((x or 0) * 1000))
        elif f in ("cli", "ops"):
            v.append(int(x or 0))
        else:
            v.append(k(x))
    return v

def idx_vec(c, am):
    tq = QS[AVQ["7"][QS.index(am)]]
    t = TAB[tq]["7"].get(c, {})
    out = []
    for f, conta in IDX:
        if isinstance(conta, tuple):
            out.append(sum(k(t.get(cc, 0)) for cc in conta))
        else:
            out.append(k(t.get(conta, 0)))
    return out

for e in ents:
    c = e["id"]
    e["V"] = [bal_vec(c, am) for am in QS]
    e["R"] = [[k(DREt[am].get(c, {}).get(conta, 0)) for f, conta in DRE] for am in QS]
    e["X"] = [idx_vec(c, am) for am in QS]
    pf = [MATS[AVQ["11"][i]][0].get(c) for i in range(len(QS))]
    pj = [MATS[AVQ["13"][i]][1].get(c) for i in range(len(QS))]
    e["PF"] = pf if any(x and any(x) for x in pf) else None
    e["PJ"] = pj if any(x and any(x) for x in pj) else None
    if e["PF"]:
        e["PF"] = [x if x else [0] * 49 for x in e["PF"]]
    if e["PJ"]:
        e["PJ"] = [x if x else [0] * 63 for x in e["PJ"]]

# ---------- COSIF por trimestre ----------
MS0 = ["202506"] + MS
coopM = {m: read_cosif(os.path.join(B, "%sC.zip" % m), ("4010",)) for m in ["202503"] + MS0}
pruM = {m: read_cosif(os.path.join(B, "%sPRU.zip" % m), ("4060",)) for m in ["202503"] + MS0}
QC = [m for m in ["202503", "202506", "202509", "202512", "202603", "202606"] if os.path.exists(os.path.join(B, "%sCOMB.zip" % m))]
combM = {m: read_cosif(os.path.join(B, "%sCOMB.zip" % m), ("4413", "4423", "4433")) for m in QC}
print("cosif", {m: (len(coopM.get(m, {})), len(pruM.get(m, {}))) for m in ["202503"] + MS0}, "comb", QC)

BC_MIN = 50  # R$ mil
def balancete6(series):
    """[[conta, v_q0..v_q5]] para contas até nível MAXLVL dos grupos patrimoniais e de resultado"""
    keys = set()
    for s in series:
        for code, val in (s or {}).items():
            if code[0] in BAL_GROUPS and lvl(code) <= MAXLVL and abs(val) >= BC_MIN * 1000:
                keys.add(code)
    out = []
    for code in sorted(keys):
        vals = [k((s or {}).get(code, 0)) if s else None for s in series]
        if not any(vals):
            continue
        ACC_USED[code] += 1
        out.append([code] + vals)
    return out

def cz_one(s, c):
    return sum(s.get(x, 0) for x in c) if isinstance(c, tuple) else s.get(c, 0)

def cz_vec(s):
    return [k(cz_one(s, CL[f])) for f in CLF] if s else None

for e in ents:
    src = pruM if e["k"] == "b" else coopM
    ser = [src.get(am, {}).get(e["id"]) for am in QS]
    if any(ser):
        e["CZ"] = [cz_vec(s) for s in ser]
        e["BC"] = balancete6(ser)
    lastS = src[LAST].get(e["id"])
    if lastS:
        e["M"] = [monthly({m: src[m].get(e["id"]) for m in MS})[f] for f in MF]
    if e["k"] != "b":
        cum = []
        for am in QS:
            s_ = coopM.get(am, {}).get(e["id"]) or {}
            cum.append(s_.get("7198600009", 0))  # v2.1: só ingressos; os dispêndios (8.1.9.86) já estão nas despesas de captação (g4)
        iq = []
        for i, am in enumerate(QS):
            iq.append(k(cum[i] - cum[i - 1]) if am[4:] in ("06", "12") and i > 0 else k(cum[i]))
        if any(iq):
            e["IQ"] = iq

def quarterly(series):
    st = {f: [] for f in ("at", "cr", "dp", "lt", "pl", "e2", "e3")}
    fl = {f: [] for f in ("rs", "rc", "dc", "ad")}
    acc = {"at": ("1000000009", "2000000008"), "cr": ("1600000007",), "dp": ("4100000009",), "lt": ("4320000009",),
           "pl": ("6000000004",), "e2": ("3312000001",), "e3": ("3313000000",)}
    fac = {"rs": ("7000000003", "8000000002"), "rc": ("7110000003",), "dc": ("8110000002",), "ad": ("8170000004",)}
    for i, m in enumerate(QS):
        s = series.get(m) or {}
        for f, cc in acc.items():
            st[f].append(k(sum(s.get(c, 0) for c in cc)) if s else None)
        cur = None
        if s:
            for f, cc in fac.items():
                v = sum(s.get(c, 0) for c in cc)
                if m[4:] in ("06", "12") and i > 0:
                    p = series.get(QS[i - 1]) or {}
                    if not p:
                        fl[f].append(None); continue
                    v -= sum(p.get(c, 0) for c in cc)
                fl[f].append(k(v))
        else:
            for f in fac:
                fl[f].append(None)
    return {"st": st, "fl": fl}

COMB_SYS = {"sicredi": "01181521", "sicoob": "02038232", "cresol": "10398952", "unicred": "00315557", "ailos": "05463212",
            "uniprime": "03046391", "credisis": "04632856"}
systems = []
for s, cnpj in COMB_SYS.items():
    o = {"id": s, "n": SYSN[s], "cnpj": cnpj, "doc": "4413" if s in ("sicredi", "sicoob") else ("4423" if s == "cresol" else "4433")}
    ser = [combM.get(am, {}).get(cnpj) for am in QS]
    if any(ser):
        o["CZ"] = [cz_vec(x) for x in ser]
        o["BC"] = balancete6(ser)
        o["q"] = quarterly({m: combM.get(m, {}).get(cnpj) for m in QS})
    systems.append(o)
centrais = {}
for cnpj in combM.get(LAST, {}):
    if cnpj in ("01181521", "02038232", "10398952"):
        continue
    rg = reg.get(cnpj, {})
    nm = (rg.get("NOME_INSTITUICAO") or ENTN.get(cnpj) or cnpj).split(" - ")[-1]
    centrais[cnpj] = {"n": smart(nm), "s": sys_of(rg.get("NOME_INSTITUICAO")) or sys_of(nm) or "indep",
                      "q": quarterly({m: combM.get(m, {}).get(cnpj) for m in QS})}
for e in ents:
    if e["k"] == "c":
        fil = reg.get(e["id"], {}).get("FILIACAO") or ""
        for cnpj in centrais:
            if fil and reg.get(cnpj, {}).get("NOME_INSTITUICAO") == fil:
                e["cx"] = cnpj
                break

# ---------- descrições COSIF das linhas do IF.data ----------
DESC = {}
for rel in ("1", "2", "3", "4", "5", "16", "10", "7"):
    for r in load(LAST, rel):
        DESC.setdefault((rel, r["Conta"]), ((r.get("DescricaoColuna") or "").replace("\n", " ").strip(), r["NomeColuna"].replace("\n", " ").strip()))
DESCF = {}
for f, rel, conta in BAL:
    if (rel, conta) in DESC:
        DESCF[f] = DESC[(rel, conta)]
for f, conta in DRE:
    if ("4", conta) in DESC:
        DESCF[f] = DESC[("4", conta)]
for f, conta in IDX:
    if not isinstance(conta, tuple) and ("7", conta) in DESC:
        DESCF["ix_" + f] = DESC[("7", conta)]
codes_ref = set()
for d_, n_ in DESCF.values():
    codes_ref.update(re.findall(r"\[(\d{10})\]", d_))
CN = {c: ACCN.get(c) for c in sorted(codes_ref) if ACCN.get(c)}

# ---------- SCR (agregado por segmento, Cidade do Crédito) ----------
html = open(os.path.join(REPO, "cidade_credito.html"), encoding="utf-8").read()
snap = json.loads(re.search(r'<script id="snap" type="application/json">(.*?)</script>', html, re.S).group(1))
scr = {"meses": snap["scr"]["meses"], "tot": snap["scr"]["tot"],
       "seg": {s: snap["scr"]["dims"]["segmento"][s] for s in ("Banco", "Cooperativa", "Financeira", "Fintech")},
       "mod": snap["scr"]["dims"]["modalidade"], "focus": snap.get("focus", {})}

# ---------- SGS ----------
def sgs(code, last_of_month=False):
    d = json.load(open(os.path.join(G, "s%d.json" % code)))
    out = collections.OrderedDict()
    for r in d:
        dd, mm, yy = r["data"].split("/")
        out[yy + mm] = float(r["valor"])
    return out

SG = {"selic": 432, "cdi": 4189, "ipca12": 13522, "base": 1788, "pmpp": 27789, "dv": 27790, "m1": 27791, "m2": 27810,
      "m3": 27813, "m4": 27815, "res": 1787, "pme": 1786, "cv": 1849, "cp": 1848, "cz": 1850, "spread": 20783,
      "taxa": 20714, "inad": 21082, "icc": 25351, "saldo": 20539}
sgsd = {}
months_all = None
for key, code in SG.items():
    s = sgs(code)
    sgsd[key] = s
mm = sorted(set().union(*[set(x.keys()) for x in sgsd.values()]))
mm = [m for m in mm if m >= "201901"]
sgs_out = {"meses": mm}
for key, s in sgsd.items():
    sgs_out[key] = [s.get(m) for m in mm]


codes_used = sorted(ACC_USED)
cidx = {c: i for i, c in enumerate(codes_used)}
def nice(nm):
    nm = (nm or "").strip()
    if nm.isupper() or sum(ch.isupper() for ch in nm) > 0.6 * max(1, sum(ch.isalpha() for ch in nm)):
        low = nm.lower()
        nm = low[:1].upper() + low[1:]
        nm = re.sub(r"(tvm|fgc|lca|lci|ifs?|ii|cdb|rdc|pj|pf|ipca|cdi|pn|mei|iss|cofins|pis/pasep|sfh|lf)", lambda m: m.group(1).upper(), nm)
    return nm
ACC = [[c, nice(ACCN.get(c, c)), lvl(c)] for c in codes_used]
for holder in ents + systems:
    if "BC" in holder:
        holder["BC"] = [x for r in holder["BC"] for x in ([cidx[r[0]]] + r[1:])]
CNn = {c: nice(n) for c, n in CN.items()}
out = {"v": 2, "gerado": "2026-11-20", "base": LAST, "Q": QS, "M": MS, "QC": QC, "F": F, "DREF": DREF, "IDX": [i[0] for i in IDX],
       "PFM": PFM, "PJM": PJM, "BKT": BKT, "CLF": CLF, "MF": MF, "ACC": ACC, "E": ents, "SYS": systems, "CEN": centrais,
       "SCR": scr, "SGS": sgs_out, "DESC": {f: list(v) for f, v in DESCF.items()}, "CN": CNn, "AVQ": AVQ}
js = json.dumps(out, ensure_ascii=False, separators=(",", ":"))
open(os.path.join(D, "radar2.json"), "w", encoding="utf-8").write(js)
import gzip
gz = gzip.compress(js.encode("utf-8"), 9)
open(os.path.join(D, "radar2.json.gz"), "wb").write(gz)
print("entidades", len(ents), "contas", len(ACC), "json", len(js.encode("utf-8")), "gz", len(gz))
