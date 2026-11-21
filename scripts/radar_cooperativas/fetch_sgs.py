"""Baixa as séries do SGS usadas pelo Radar Prudencial para sgs/sNNNN.json."""
import os, sys, time, urllib.request

SP = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(SP, "sgs")
os.makedirs(OUT, exist_ok=True)
CODES = [432, 4189, 13522, 1788, 1786, 1787, 27789, 27790, 27791, 27810, 27813, 27815, 1849, 1848, 1850, 20783, 20714, 21082, 25351, 20539]
fim = sys.argv[1] if len(sys.argv) > 1 else time.strftime("%d/%m/%Y")
for c in CODES:
    url = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.%d/dados?formato=json&dataInicial=01/01/2019&dataFinal=%s" % (c, fim)
    for i in range(3):
        try:
            b = urllib.request.urlopen(url, timeout=120).read()
            open(os.path.join(OUT, "s%d.json" % c), "wb").write(b)
            print("sgs", c, len(b))
            break
        except Exception as e:
            print("  retry", c, e)
            time.sleep(3)
