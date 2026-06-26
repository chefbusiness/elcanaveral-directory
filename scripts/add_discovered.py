#!/usr/bin/env python3
"""
Da de alta en negocios.json los candidatos descubiertos (mode discover) que
pasan el bar de calidad. Mapea categoría y zona, genera slug único, y crea
description/servicios/destacados con el LLM de Abacus (factual, sin inventar).

Las FOTOS van aparte después:  fetch_photos_by_placeid.py --slugs <nuevos>

Uso:
  # Previsualizar (no escribe):
  python scripts/add_discovered.py --in prospecting/descubrimientos-coslada.json
  # Dar de alta de verdad:
  python scripts/add_discovered.py --in prospecting/descubrimientos-coslada.json --write
"""
import argparse, json, os, re, sys, time, unicodedata
from pathlib import Path
import requests

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src" / "data" / "negocios.json"
CATS = json.load(open(ROOT / "src" / "data" / "categorias.json", encoding="utf-8"))
ZONAS = json.load(open(ROOT / "src" / "data" / "zonas.json", encoding="utf-8"))
CAT_NAME = {c["slug"]: c["name"] for c in CATS}
ZONA_NAME = {z["slug"]: z["name"] for z in ZONAS}

LLM_URL = os.environ.get("LLM_URL", "https://routellm.abacus.ai/v1")
API_KEY = os.environ.get("ABACUS_API_KEY")

# término de búsqueda → categoría del directorio
TERM_CAT = {
    "restaurante": "restaurantes", "cafetería": "cafeterias", "panadería": "panaderias",
    "frutería": "fruterias", "supermercado": "supermercados", "farmacia": "salud",
    "peluquería": "belleza", "gimnasio": "deporte", "clínica dental": "salud",
    "ferretería": "hogar", "taller mecánico": "automocion", "guardería": "educacion",
    "veterinario": "mascotas", "inmobiliaria": "inmobiliarias", "tienda de ropa": "moda",
}


def slugify(s):
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s[:55] or "negocio"


# Código postal → zona (lo más fiable). PC fuera de esta tabla = fuera de
# nuestras 4 zonas (Torrejón 28850, Rivas 28523, etc.) → se descarta.
ZONA_BY_PC = {
    "28052": "el-canaveral",
    "28032": "vicalvaro",
    "28820": "coslada", "28821": "coslada", "28822": "coslada", "28823": "coslada",
    "28830": "san-fernando-de-henares",
}


def detect_zona(c):
    pc = str(c.get("postalCode") or "")
    if pc in ZONA_BY_PC:
        return ZONA_BY_PC[pc]
    city = (c.get("city") or "").lower()
    nb = (c.get("neighborhood") or "").lower()
    if "san fernando" in city:
        return "san-fernando-de-henares"
    if "coslada" in city:
        return "coslada"
    if "cañaveral" in city or "cañaveral" in nb:
        return "el-canaveral"
    if "vicálvaro" in city or "vicalvaro" in nb:
        return "vicalvaro"
    return None   # fuera de nuestras zonas → no dar de alta


def llm_content(batch, model):
    """Genera description/servicios/destacados para un lote. Devuelve dict por slug."""
    items = [{"slug": b["slug"], "nombre": b["name"], "tipo": b["googleCategory"] or b["categoryName"],
              "zona": b["zonaName"]} for b in batch]
    prompt = (
        "Eres editor de un directorio local del barrio El Cañaveral (Madrid) y alrededores "
        "(Vicálvaro, Coslada, San Fernando de Henares). Para cada negocio te doy nombre, tipo y zona.\n"
        "Genera contenido SOBRIO y FACTUAL para su ficha. NO inventes datos concretos (precios, premios, "
        "años de apertura, especialidades específicas que no puedas saber): mantente en lo genérico pero "
        "útil para un vecino, basándote solo en el tipo de negocio y la zona.\n\n"
        "Para cada negocio devuelve:\n"
        "- description: 2-3 frases en español, naturales, describiendo el negocio por su tipo y zona.\n"
        "- servicios: array de 4-6 servicios TÍPICOS de ese tipo de negocio.\n"
        "- destacados: array de 2-3 puntos fuertes genéricos.\n\n"
        f"Negocios:\n{json.dumps(items, ensure_ascii=False, indent=2)}\n\n"
        "Responde SOLO con un JSON array; un objeto por negocio con las claves: slug, description, servicios, destacados."
    )
    r = requests.post(f"{LLM_URL}/chat/completions",
                      headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
                      json={"model": model, "messages": [{"role": "user", "content": prompt}],
                            "temperature": 0.3}, timeout=180)
    r.raise_for_status()
    txt = r.json()["choices"][0]["message"]["content"]
    m = re.search(r"\[.*\]", txt, re.DOTALL)
    arr = json.loads(m.group(0)) if m else []
    return {o["slug"]: o for o in arr if o.get("slug")}


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--in", dest="infile", required=True)
    p.add_argument("--min-rating", type=float, default=4.3)
    p.add_argument("--min-reviews", type=int, default=30)
    p.add_argument("--model", default="gemini-3.5-flash")
    p.add_argument("--limit", type=int)
    p.add_argument("--write", action="store_true")
    args = p.parse_args()
    if not API_KEY:
        sys.exit("Falta ABACUS_API_KEY en el entorno (source ~/.abacus_env)")

    cands = json.load(open(args.infile, encoding="utf-8"))
    negocios = json.load(open(DATA, encoding="utf-8"))
    used = {n["slug"] for n in negocios}
    known_pid = {n.get("placeId") for n in negocios if n.get("placeId")}

    # filtrar por bar de calidad + categoría conocida + no cerrado + no duplicado
    sel = []
    for c in cands:
        if (c.get("totalScore") or 0) < args.min_rating: continue
        if (c.get("reviewsCount") or 0) < args.min_reviews: continue
        if c.get("permanentlyClosed"): continue
        if c.get("placeId") in known_pid: continue
        cat = TERM_CAT.get(c.get("searchString"))
        if not cat: continue
        zona = detect_zona(c)
        if not zona: continue          # fuera de nuestras 4 zonas (Torrejón, Rivas…)
        sel.append((c, cat, zona))
    if args.limit:
        sel = sel[: args.limit]

    print(f"Candidatos: {len(cands)} → seleccionados (≥{args.min_rating}★/≥{args.min_reviews}): {len(sel)}")

    # construir registros base
    nuevos = []
    for c, cat, zona in sel:
        slug = slugify(c["title"])
        base = slug
        i = 2
        while slug in used:
            slug = f"{base}-{i}"; i += 1
        used.add(slug)
        loc = c.get("location") or {}
        rec = {
            "slug": slug, "name": c["title"], "description": "",
            "category": cat, "categoryName": CAT_NAME.get(cat, cat),
            "zona": zona, "zonaName": ZONA_NAME.get(zona, zona),
            "address": c.get("address"), "tags": [], "featured": False,
            "servicios": [], "destacados": [],
            "rating": c.get("totalScore"), "numReviews": c.get("reviewsCount"),
            "placeId": c.get("placeId"), "googleCategory": c.get("categoryName"),
        }
        if c.get("phone"): rec["phone"] = c["phone"]
        if c.get("website"): rec["website"] = c["website"]
        if loc.get("lat"): rec["lat"] = loc["lat"]; rec["lng"] = loc["lng"]
        nuevos.append(rec)

    # generar contenido con el LLM por lotes
    B = 10
    for i in range(0, len(nuevos), B):
        lote = nuevos[i:i + B]
        print(f"  LLM lote {i//B+1}/{(len(nuevos)+B-1)//B} ({len(lote)})…")
        try:
            cont = llm_content(lote, args.model)
        except Exception as e:
            print(f"    error LLM: {e}; reintento en 5s"); time.sleep(5)
            cont = llm_content(lote, args.model)
        for rec in lote:
            o = cont.get(rec["slug"], {})
            rec["description"] = o.get("description") or f"{rec['name']} es un negocio de {rec['categoryName'].lower()} en {rec['zonaName']}."
            rec["servicios"] = o.get("servicios") or []
            rec["destacados"] = o.get("destacados") or []
        time.sleep(0.3)

    # reparto por zona/categoría
    from collections import Counter
    print("\n  Por zona:", dict(Counter(r["zona"] for r in nuevos)))
    print("  Por categoría:", dict(Counter(r["category"] for r in nuevos)))
    print("\n  Muestra:")
    for r in nuevos[:4]:
        print(f"   • {r['name']} [{r['categoryName']}/{r['zonaName']}] {r['rating']}★ — {r['description'][:80]}…")

    if args.write:
        negocios.extend(nuevos)
        with open(DATA, "w", encoding="utf-8") as f:
            json.dump(negocios, f, ensure_ascii=False, indent=2); f.write("\n")
        print(f"\n  ✓ ESCRITO: +{len(nuevos)} fichas (total {len(negocios)})")
        print("  Slugs nuevos:", ",".join(r["slug"] for r in nuevos))
    else:
        print(f"\n  (dry-run — usa --write para dar de alta los {len(nuevos)})")


if __name__ == "__main__":
    main()
