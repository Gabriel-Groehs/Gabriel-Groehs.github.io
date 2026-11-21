"""Relatórios IF.data 7, 10, 11, 13 dos trimestres anteriores + balancetes de mar/25 (4060 e combinados)."""
import json, os, sys, time, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_ifdata import valores

SP = os.path.dirname(os.path.abspath(__file__))
D = os.path.join(SP, "data"); B = os.path.join(SP, "b4010")
for am in ["202603", "202512", "202509", "202506", "202503"]:
    for rel in ["7", "10", "11", "13"]:
        p = os.path.join(D, "v_%s_t1_r%s.json" % (am, rel))
        if os.path.exists(p) and os.path.getsize(p) > 100:
            continue
        try:
            v = valores(am, 1, rel)
        except Exception as e:
            print("FAIL", am, rel, e, flush=True); continue
        json.dump(v, open(p, "w", encoding="utf-8"), ensure_ascii=False)
        print("ifdata", am, rel, len(v), flush=True)
COSIF = "https://www.bcb.gov.br/content/estabilidadefinanceira/cosif/"
for url, fn in [(COSIF + "Conglomerados-prudenciais/202503BLOPRUDENCIAL.csv.zip", "202503PRU.zip"), (COSIF + "Combinados-cooperativos/202503COMBINADOS.csv.zip", "202503COMB.zip")]:
    p = os.path.join(B, fn)
    if os.path.exists(p):
        continue
    for i in range(3):
        try:
            b = urllib.request.urlopen(url, timeout=240).read(); open(p, "wb").write(b); print("cosif", fn, len(b), flush=True); break
        except Exception as e:
            print("  retry", fn, e, flush=True); time.sleep(4)
print("fim", flush=True)
