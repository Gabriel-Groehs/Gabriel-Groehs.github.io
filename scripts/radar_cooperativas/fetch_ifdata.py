"""Baixa IF.data (Olinda/Bacen) para os trimestres pedidos e salva JSON cru por relatório.
Uso: python fetch_ifdata.py OUTDIR AnoMes [AnoMes ...]
"""
import json, os, sys, time, urllib.request, urllib.parse

BASE = "https://olinda.bcb.gov.br/olinda/servico/IFDATA/versao/v1/odata/"

def get(url, tries=4):
    for i in range(tries):
        try:
            with urllib.request.urlopen(url, timeout=240) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as e:
            print("  retry", i, e, file=sys.stderr)
            time.sleep(3 + 4 * i)
    raise RuntimeError(url)

def cadastro(am):
    url = BASE + "IfDataCadastro(AnoMes=@AnoMes)?@AnoMes=%s&$format=json&$top=100000" % am
    return get(url)["value"]

def valores(am, tipo, rel):
    q = "IfDataValores(AnoMes=@AnoMes,TipoInstituicao=@TipoInstituicao,Relatorio=@Relatorio)?@AnoMes=%s&@TipoInstituicao=%d&@Relatorio='%s'&$format=json&$top=2000000" % (am, tipo, rel)
    return get(BASE + q)["value"]

if __name__ == "__main__":
    out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    for am in sys.argv[2:]:
        p = os.path.join(out, "cad_%s.json" % am)
        if not os.path.exists(p):
            json.dump(cadastro(am), open(p, "w", encoding="utf-8"), ensure_ascii=False)
            print("cad", am)
        # tipo 1 = conglomerados prudenciais e instituições independentes; tipo 3 = instituições individuais
        for tipo, rels in ((1, ["1", "2", "3", "4", "5", "7", "8", "10", "11", "13", "16"]), (3, ["1", "2", "3", "4", "5", "7", "8", "10", "11", "13", "16"])):
            for rel in rels:
                p = os.path.join(out, "v_%s_t%d_r%s.json" % (am, tipo, rel))
                if os.path.exists(p):
                    continue
                t0 = time.time()
                try:
                    v = valores(am, tipo, rel)
                except Exception as e:
                    print("FAIL", am, tipo, rel, e)
                    continue
                json.dump(v, open(p, "w", encoding="utf-8"), ensure_ascii=False)
                print(am, "tipo", tipo, "rel", rel, len(v), "linhas", round(time.time() - t0, 1), "s")
