"""Busca metadados e capas no Open Library e salva miniaturas WebP (base64 depois)."""
import json, os, sys, time, io, urllib.request, urllib.parse
from PIL import Image

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)

Q = [
    ("securato_tes", "Cálculo Financeiro das Tesourarias", "Securato"),
    ("securato_cred", "Crédito: análise e avaliação do risco", "Securato"),
    ("securato_dec", "Decisões financeiras em condições de risco", "Securato"),
    ("hull_rmfi", "Risk Management and Financial Institutions", "Hull"),
    ("hull_ofod", "Options, Futures, and Other Derivatives", "Hull"),
    ("jorion_var", "Value at Risk", "Jorion"),
    ("jorion_frm", "Financial Risk Manager Handbook", "Jorion"),
    ("alexander4", "Market Risk Analysis", "Alexander"),
    ("dowd", "Measuring Market Risk", "Dowd"),
    ("christoffersen", "Elements of Financial Risk Management", "Christoffersen"),
    ("mfe_qrm", "Quantitative Risk Management", "McNeil"),
    ("brigo", "Interest Rate Models", "Brigo"),
    ("embrechts", "Modelling Extremal Events", "Embrechts"),
    ("choudhry_alm", "Bank Asset and Liability Management", "Choudhry"),
    ("choudhry_pob", "The Principles of Banking", "Choudhry"),
    ("bessis", "Risk Management in Banking", "Bessis"),
    ("saunders_fim", "Financial Institutions Management", "Saunders"),
    ("koch", "Bank Management", "Koch"),
    ("freixas", "Microeconomics of Banking", "Freixas"),
    ("alm_handbook", "Asset and Liability Management Handbook", "Mitra"),
    ("castagna", "Measuring and Managing Liquidity Risk", "Castagna"),
    ("baesens", "Credit Risk Analytics", "Baesens"),
    ("bohn", "Active Credit Portfolio Management in Practice", "Bohn"),
    ("engelmann", "The Basel II Risk Parameters", "Engelmann"),
    ("bielecki", "Credit Risk: Modeling, Valuation and Hedging", "Bielecki"),
    ("saunders_allen", "Credit Risk Measurement", "Saunders"),
    ("lando", "Credit Risk Modeling", "Lando"),
    ("resti", "Risk Management and Shareholders' Value in Banking", "Resti"),
    ("assaf", "Mercado Financeiro", "Assaf"),
    ("silva_cred", "Gestão e análise de risco de crédito", "Silva"),
    ("meinen", "Cooperativismo financeiro", "Meinen"),
    ("fortuna", "Mercado financeiro: produtos e serviços", "Fortuna"),
    ("coop_europe", "Cooperative Banking in Europe", "Boscia"),
    ("lubinska", "Asset Liability Management Optimisation", "Lubinska"),
    ("bellini", "IFRS 9 and CECL Credit Risk Modelling and Validation", "Bellini"),
    ("crouhy", "The Essentials of Risk Management", "Crouhy"),
    ("duffie", "Credit Risk: Pricing, Measurement, and Management", "Duffie"),
    ("matz", "Liquidity Risk Measurement and Management", "Matz"),
]

def get(url, binary=False):
    req = urllib.request.Request(url, headers={"User-Agent": "radar-prudencial-build/1.0"})
    for i in range(3):
        try:
            with urllib.request.urlopen(req, timeout=40) as r:
                b = r.read()
                return b if binary else json.loads(b.decode("utf-8"))
        except Exception as e:
            err = e
            time.sleep(1.5 + 2 * i)
    print("   fail", url, err)
    return None

res = {}
for key, title, author in Q:
    url = "https://openlibrary.org/search.json?" + urllib.parse.urlencode({"title": title, "author": author, "limit": 6,
        "fields": "key,title,subtitle,author_name,isbn,cover_i,first_publish_year,publisher,edition_count"})
    d = get(url) or {}
    docs = d.get("docs") or []
    print(key, len(docs))
    for x in docs[:4]:
        print("    ", x.get("title"), "|", (x.get("author_name") or [])[:3], "|", x.get("first_publish_year"), "| cover", x.get("cover_i"),
              "| ed", x.get("edition_count"))
    res[key] = docs[:4]
    best = next((x for x in docs if x.get("cover_i")), None)
    if best:
        img = get("https://covers.openlibrary.org/b/id/%s-L.jpg" % best["cover_i"], binary=True)
        if img and len(img) > 2000:
            try:
                im = Image.open(io.BytesIO(img)).convert("RGB")
                w, h = im.size
                if h / max(w, 1) < 1.05 or w < 60:
                    print("    (capa descartada: proporção)", w, h)
                else:
                    im.thumbnail((220, 330), Image.LANCZOS)
                    im.save(os.path.join(OUT, key + ".webp"), "WEBP", quality=72, method=6)
                    print("    capa ok", im.size, os.path.getsize(os.path.join(OUT, key + ".webp")))
            except Exception as e:
                print("    erro imagem", e)
    time.sleep(0.4)
json.dump(res, open(os.path.join(OUT, "ol.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
