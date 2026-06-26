#!/usr/bin/env python3
"""
Genera guías "mejores X de [Zona]" para las zonas distintas de El Cañaveral
(El Cañaveral ya lo cubren las guías "y alrededores"). Solo crea guía si la
zona×categoría tiene >=4 negocios con nota >=4. Asigna publishedDate
escalonada (drip). Añade las nuevas a src/data/listicles.json (no duplica).

Uso:
  python scripts/generate_zone_listicles.py                 # dry-run
  python scripts/generate_zone_listicles.py --write --start 2026-06-27 --every 2
"""
import argparse, json, statistics, unicodedata
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src" / "data" / "negocios.json"
LIST = ROOT / "src" / "data" / "listicles.json"

ZONAS = {"coslada": "Coslada", "san-fernando-de-henares": "San Fernando de Henares", "vicalvaro": "Vicálvaro"}
CONFIGS = [
    dict(cat="restaurantes", gm=None, pl="restaurantes", sg="restaurante", un="un", el="el", slugn="restaurantes"),
    dict(cat="salud", gm=["dental", "dentista"], pl="clínicas dentales", sg="clínica dental", un="una", el="la", slugn="clinicas-dentales"),
    dict(cat="salud", gm=["fisioterap"], pl="centros de fisioterapia", sg="centro de fisioterapia", un="un", el="el", slugn="fisioterapia"),
    dict(cat="salud", gm=["farmacia"], pl="farmacias", sg="farmacia", un="una", el="la", slugn="farmacias"),
    dict(cat="belleza", gm=["peluqueria"], pl="peluquerías", sg="peluquería", un="una", el="la", slugn="peluquerias"),
    dict(cat="deporte", gm=["gimnasio", "deportivo"], pl="gimnasios", sg="gimnasio", un="un", el="el", slugn="gimnasios"),
    dict(cat="mascotas", gm=["veterinari"], pl="veterinarios", sg="veterinario", un="un", el="el", slugn="veterinarios"),
    dict(cat="automocion", gm=["taller", "reparacion", "automovil"], pl="talleres mecánicos", sg="taller mecánico", un="un", el="el", slugn="talleres-mecanicos"),
    dict(cat="inmobiliarias", gm=None, pl="inmobiliarias", sg="inmobiliaria", un="una", el="la", slugn="inmobiliarias"),
    dict(cat="panaderias", gm=None, pl="panaderías", sg="panadería", un="una", el="la", slugn="panaderias"),
    dict(cat="cafeterias", gm=None, pl="cafeterías", sg="cafetería", un="una", el="la", slugn="cafeterias"),
    dict(cat="fruterias", gm=None, pl="fruterías", sg="frutería", un="una", el="la", slugn="fruterias"),
    dict(cat="supermercados", gm=None, pl="supermercados", sg="supermercado", un="un", el="el", slugn="supermercados"),
    dict(cat="educacion", gm=["preescolar", "infancia", "infantil", "jardin"], pl="guarderías y escuelas infantiles", sg="guardería", un="una", el="la", slugn="guarderias"),
    dict(cat="moda", gm=None, pl="tiendas de ropa", sg="tienda de ropa", un="una", el="la", slugn="tiendas-ropa"),
    dict(cat="hogar", gm=["ferreteria"], pl="ferreterías", sg="ferretería", un="una", el="la", slugn="ferreterias"),
]


def norm(s):
    return "".join(c for c in unicodedata.normalize("NFD", (s or "").lower()) if not unicodedata.combining(c))


def ranked(d, zona, cat, gm, minr=4.0):
    r = [x for x in d if x.get("zona") == zona and x.get("category") == cat
         and x.get("rating") and x.get("numReviews")]
    if gm:
        r = [x for x in r if any(g in norm(x.get("googleCategory", "")) for g in gm)]
    if not r:
        return []
    C = sum(x["rating"] for x in r) / len(r)
    m = statistics.median(x["numReviews"] for x in r)
    r.sort(key=lambda x: (x["numReviews"] / (x["numReviews"] + m)) * x["rating"] + (m / (x["numReviews"] + m)) * C, reverse=True)
    return [x for x in r if x["rating"] >= minr]


def build(cfg, zslug, zname, top):
    pl, sg, el = cfg["pl"], cfg["sg"], cfg["el"]
    suf = "o" if el == "el" else "a"
    return {
        "slug": f"mejores-{cfg['slugn']}-{zslug}",
        "category": cfg["cat"], "zona": zslug, "minRating": 4,
        **({"googleCategoryMatch": cfg["gm"]} if cfg["gm"] else {}),
        "noun": pl, "breadcrumb": f"Mejores {pl}",
        "ctaTitle": f"¿Tienes {cfg['un']} {sg} en {zname}?",
        "h1": f"Las mejores {pl} de {zname}",
        "metaTitle": f"Las mejores {pl} de {zname} (2026)",
        "metaDescription": f"Las {pl} mejor valoradas de {zname}, ordenadas por valoración y número de reseñas reales de Google. Actualizado en 2026.",
        "intro": (f"Estas son las mejores {pl} de {zname}, ordenadas con una puntuación que combina la "
                  f"nota media de Google con el número de reseñas (no solo la nota ni solo el volumen de "
                  f"opiniones). {zname} es una de las zonas que cubre el directorio de El Cañaveral y "
                  f"alrededores, adonde muchos vecinos del barrio se desplazan para sus servicios del día a "
                  f"día. Solo aparecen las que mantienen 4 estrellas o más."),
        "publishedDate": None,  # se rellena al asignar el calendario
        "updatedDate": "2026-06-26",
        "faq": [
            {"q": f"¿Cuál es {el} mejor {sg} de {zname}?",
             "a": f"Según las reseñas de Google, {top['name']} es {el} mejor valorad{suf} de {zname}, "
                  f"con {top['rating']} estrellas y {top['numReviews']} reseñas."},
            {"q": "¿Cómo se ordena este ranking?",
             "a": "Con una puntuación ponderada que combina la nota media de Google y el número de reseñas "
                  "reales de cada negocio, no por la nota a secas ni por el número de opiniones por separado."},
        ],
    }


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--start", default="2026-06-27", help="fecha de la 1ª guía (drip)")
    p.add_argument("--every", type=int, default=2, help="días entre guías")
    p.add_argument("--min-count", type=int, default=4, help="mínimo de negocios para crear guía")
    p.add_argument("--write", action="store_true")
    args = p.parse_args()

    d = json.load(open(DATA, encoding="utf-8"))
    listicles = json.load(open(LIST, encoding="utf-8"))
    existing = {l["slug"] for l in listicles}

    cands = []
    for zslug, zname in ZONAS.items():
        for cfg in CONFIGS:
            r = ranked(d, zslug, cfg["cat"], cfg["gm"])
            if len(r) >= args.min_count:
                cands.append((len(r), cfg, zslug, zname, r[0]))
    # más completas primero → drip empieza por las mejores
    cands.sort(key=lambda x: -x[0])

    start = date.fromisoformat(args.start)
    nuevas, i = [], 0
    for cnt, cfg, zslug, zname, top in cands:
        g = build(cfg, zslug, zname, top)
        if g["slug"] in existing:
            continue
        g["publishedDate"] = (start + timedelta(days=i * args.every)).isoformat()
        nuevas.append((cnt, g))
        i += 1

    print(f"Guías de zona a crear: {len(nuevas)}\n")
    for cnt, g in nuevas:
        print(f"  {g['publishedDate']}  {g['slug']}  ({cnt} negocios)")

    if args.write:
        listicles.extend(g for _, g in nuevas)
        json.dump(listicles, open(LIST, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        open(LIST, "a").write("\n")
        print(f"\n  ✓ ESCRITO: +{len(nuevas)} guías (total {len(listicles)})")
    else:
        print(f"\n  (dry-run — usa --write)")


if __name__ == "__main__":
    main()
