#!/usr/bin/env python3
"""
Cura los espacios públicos descubiertos (parques, pipicanes, pistas, caminerías),
los clasifica por tipo, baja una foto por placeId y genera src/data/espacios.json.
NO son negocios → van en su propio archivo y página (/espacios-publicos).

Uso:  python scripts/build_espacios.py --in prospecting/espacios-canaveral.json --write
"""
import argparse, io, json, sys, time, unicodedata
from pathlib import Path
import requests
from dotenv import load_dotenv
from PIL import Image
import os

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")
API_KEY = os.environ.get("GOOGLE_PLACES_API_KEY")
OUT = ROOT / "src" / "data" / "espacios.json"
IMG = ROOT / "public" / "images" / "espacios"
IMG.mkdir(parents=True, exist_ok=True)

# googleCategory → tipo del espacio
CAT_TIPO = {
    "Parque infantil": "infantil",
    "Parque para perros": "canino",
    "Parque": "parque",
    "Parque deportivo": "deporte",
    "Club deportivo": "deporte",
    "Zona de senderismo": "senderismo",
}


def slugify(s):
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower()
    import re
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")[:55] or "espacio"


def clasifica(x):
    cat = x.get("categoryName") or ""
    if cat in CAT_TIPO:
        return CAT_TIPO[cat]
    if "canin" in (x.get("title") or "").lower():   # "Área Canina" catalogada como Jardín
        return "canino"
    return None


def place_photo(pid):
    if not API_KEY:
        return None
    r = requests.get(f"https://places.googleapis.com/v1/places/{pid}",
                     headers={"X-Goog-Api-Key": API_KEY, "X-Goog-FieldMask": "photos"},
                     params={"languageCode": "es"}, timeout=20)
    if r.status_code != 200:
        return None
    photos = (r.json().get("photos") or [])
    if not photos:
        return None
    m = requests.get(f"https://places.googleapis.com/v1/{photos[0]['name']}/media",
                     params={"maxHeightPx": 800, "key": API_KEY}, timeout=30)
    return m.content if m.status_code == 200 and len(m.content) > 4000 else None


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--in", dest="infile", required=True)
    p.add_argument("--write", action="store_true")
    args = p.parse_args()

    cands = json.load(open(args.infile, encoding="utf-8"))
    seen, espacios, slugs = set(), [], set()
    for x in cands:
        pid = x.get("placeId")
        if pid in seen:
            continue
        seen.add(pid)
        tipo = clasifica(x)
        if not tipo:
            continue
        slug = slugify(x["title"])
        base = slug; i = 2
        while slug in slugs:
            slug = f"{base}-{i}"; i += 1
        slugs.add(slug)
        loc = x.get("location") or {}
        e = {
            "slug": slug, "tipo": tipo, "name": x["title"],
            "address": x.get("address"), "placeId": pid,
            "lat": loc.get("lat"), "lng": loc.get("lng"),
            "rating": x.get("totalScore"), "numReviews": x.get("reviewsCount"),
        }
        # foto
        if args.write:
            data = place_photo(pid)
            if data:
                try:
                    img = Image.open(io.BytesIO(data)).convert("RGB")
                    if img.width > 1000:
                        img = img.resize((1000, int(img.height * 1000 / img.width)), Image.LANCZOS)
                    out = IMG / f"{slug}.jpg"
                    img.save(out, "JPEG", quality=85, optimize=True)
                    e["image"] = f"/images/espacios/{slug}.jpg"
                except Exception:
                    pass
            time.sleep(0.15)
        espacios.append(e)

    from collections import Counter
    print(f"Espacios públicos: {len(espacios)}  →  {dict(Counter(e['tipo'] for e in espacios))}")
    for e in espacios:
        print(f"  [{e['tipo']}] {e['name']} {'📷' if e.get('image') else '  '} | {(e.get('address') or '')[:45]}")

    if args.write:
        json.dump(espacios, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        open(OUT, "a").write("\n")
        print(f"\n  ✓ {OUT}  ({sum(1 for e in espacios if e.get('image'))} con foto)")


if __name__ == "__main__":
    main()
