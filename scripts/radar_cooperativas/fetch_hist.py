"""Histórico: IF.data (trimestres anteriores, relatórios 1,2,3,4,5,16, tipo 1) + balancetes COSIF mensais
(cooperativas 4010, combinados 4413/4423/4433, conglomerados prudenciais 4060)."""
import json, os, sys, time, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_ifdata import valores, cadastro

SP = os.path.dirname(os.path.abspath(__file__))
D = os.path.join(SP, "data")
B = os.path.join(SP, "b4010")
COSIF = "https://www.bcb.gov.br/content/estabilidadefinanceira/cosif/"

def dl(url, path):
    if os.path.exists(path) and os.path.getsize(path) > 10000:
        return True
    for i in range(4):
        try:
            with urllib.request.urlopen(url, timeout=240) as r:
                b = r.read()
            open(path, "wb").write(b)
            return True
        except Exception as e:
            print("  retry", url, e)
            time.sleep(3 + 3 * i)
    return False

for am in ["202603", "202512", "202509", "202506", "202503"]:
    p = os.path.join(D, "cad_%s.json" % am)
    if not os.path.exists(p):
        json.dump(cadastro(am), open(p, "w", encoding="utf-8"), ensure_ascii=False)
    for rel in ["1", "2", "3", "4", "5", "16"]:
        p = os.path.join(D, "v_%s_t1_r%s.json" % (am, rel))
        if os.path.exists(p):
            continue
        try:
            v = valores(am, 1, rel)
        except Exception as e:
            print("FAIL", am, rel, e); continue
        json.dump(v, open(p, "w", encoding="utf-8"), ensure_ascii=False)
        print("ifdata", am, rel, len(v), flush=True)

months = ["202507", "202508", "202509", "202510", "202511", "202512", "202601", "202602", "202603", "202604", "202605", "202606"]
for m in months:
    ok1 = dl(COSIF + "Cooperativas-de-credito/%sCOOPERATIVAS.csv.zip" % m, os.path.join(B, "%sC.zip" % m))
    ok2 = dl(COSIF + "Combinados-cooperativos/%sCOMBINADOS.csv.zip" % m, os.path.join(B, "%sCOMB.zip" % m))
    ok3 = dl(COSIF + "Conglomerados-prudenciais/%sBLOPRUDENCIAL.csv.zip" % m, os.path.join(B, "%sPRU.zip" % m))
    print("cosif", m, ok1, ok2, ok3, flush=True)
