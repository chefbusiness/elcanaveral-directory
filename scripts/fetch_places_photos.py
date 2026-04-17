#!/usr/bin/env python3
"""
Descarga fotos REALES de negocios via Google Places API (New).

Pipeline:
  1. Text Search (New) → encontrar place_id por nombre + dirección
  2. Place Photo (New) → descargar primera foto disponible
  3. Optimizar con Pillow a max 1200px de ancho, JPEG calidad 85
  4. Guardar en /public/images/negocios/{slug}.jpg
  5. Actualizar negocios.json con el path local

Uso:
  python scripts/fetch_places_photos.py             # todos los que faltan
  python scripts/fetch_places_photos.py --limit 3   # solo N para testing
  python scripts/fetch_places_photos.py --slug mercadona-coslada  # uno concreto
  python scripts/fetch_places_photos.py --dry-run   # no escribe nada
"""

import argparse
import io
import json
import os
import sys
import time
from pathlib import Path

import requests
from dotenv import load_dotenv
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

API_KEY = os.environ.get("GOOGLE_PLACES_API_KEY")
if not API_KEY:
    sys.exit("ERROR: falta GOOGLE_PLACES_API_KEY en .env")

DATA_FILE = ROOT / "src" / "data" / "negocios.json"
IMAGES_DIR = ROOT / "public" / "images" / "negocios"
IMAGES_DIR.mkdir(parents=True, exist_ok=True)

TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
# Bias geográfico centrado en El Cañaveral, Madrid (radio 10 km)
LOCATION_BIAS = {
    "circle": {
        "center": {"latitude": 40.4300, "longitude": -3.5790},
        "radius": 10000.0,
    }
}

FIELD_MASK = ",".join([
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.photos",
])


def text_search(name: str, address: str) -> dict | None:
    query = f"{name} {address}" if address else f"{name} El Cañaveral Madrid"
    payload = {
        "textQuery": query,
        "languageCode": "es",
        "regionCode": "es",
        "locationBias": LOCATION_BIAS,
        "maxResultCount": 1,
    }
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask": FIELD_MASK,
    }
    resp = requests.post(TEXT_SEARCH_URL, json=payload, headers=headers, timeout=20)
    if resp.status_code != 200:
        print(f"    TextSearch {resp.status_code}: {resp.text[:200]}")
        return None
    data = resp.json()
    places = data.get("places") or []
    return places[0] if places else None


def fetch_photo(photo_name: str, max_height: int = 1200) -> bytes | None:
    """photo_name has the form 'places/XXXX/photos/YYYY'."""
    url = f"https://places.googleapis.com/v1/{photo_name}/media"
    params = {"maxHeightPx": max_height, "key": API_KEY}
    resp = requests.get(url, params=params, timeout=30, allow_redirects=True)
    if resp.status_code != 200:
        print(f"    Photo {resp.status_code}: {resp.text[:200]}")
        return None
    return resp.content


def optimize_image(data: bytes, slug: str) -> Path:
    img = Image.open(io.BytesIO(data))
    if img.mode != "RGB":
        img = img.convert("RGB")
    # Cap width at 1200px, keep aspect ratio
    if img.width > 1200:
        ratio = 1200 / img.width
        img = img.resize((1200, int(img.height * ratio)), Image.LANCZOS)
    out_path = IMAGES_DIR / f"{slug}.jpg"
    img.save(out_path, "JPEG", quality=85, optimize=True)
    return out_path


def needs_photo(negocio: dict) -> bool:
    img = str(negocio.get("image") or "")
    if not img:
        return True
    if "/categorias/" in img:
        return True
    return False


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None, help="max negocios a procesar")
    parser.add_argument("--slug", type=str, default=None, help="solo este slug")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--force", action="store_true", help="re-descargar incluso si tiene foto")
    args = parser.parse_args()

    with open(DATA_FILE, encoding="utf-8") as f:
        negocios = json.load(f)

    if args.slug:
        targets = [n for n in negocios if n["slug"] == args.slug]
    elif args.force:
        targets = list(negocios)
    else:
        targets = [n for n in negocios if needs_photo(n)]

    if args.limit:
        targets = targets[: args.limit]

    print(f"Negocios totales: {len(negocios)}")
    print(f"A procesar: {len(targets)}")
    if args.dry_run:
        print("(dry-run — no se guardará nada)")
    print()

    updated = 0
    failed = []
    for i, n in enumerate(targets, 1):
        slug = n["slug"]
        name = n["name"]
        address = n.get("address", "")
        print(f"[{i}/{len(targets)}] {slug}  ({name})")

        try:
            place = text_search(name, address)
            if not place:
                print("    ✗ no results")
                failed.append(slug)
                continue

            photos = place.get("photos") or []
            if not photos:
                print(f"    ✗ sin fotos (place_id={place.get('id')})")
                failed.append(slug)
                continue

            photo_name = photos[0]["name"]
            print(f"    place_id={place.get('id')}  photo={photo_name.split('/')[-1][:20]}...")

            img_bytes = fetch_photo(photo_name)
            if not img_bytes or len(img_bytes) < 5000:
                print(f"    ✗ descarga fallida ({len(img_bytes) if img_bytes else 0}B)")
                failed.append(slug)
                continue

            if args.dry_run:
                print(f"    [dry-run] would save {len(img_bytes)}B")
                updated += 1
                continue

            out_path = optimize_image(img_bytes, slug)
            size_kb = out_path.stat().st_size / 1024
            print(f"    ✓ guardado {out_path.name} ({size_kb:.0f} KB)")

            for b in negocios:
                if b["slug"] == slug:
                    b["image"] = f"/images/negocios/{slug}.jpg"
                    break
            updated += 1

        except Exception as e:
            print(f"    ✗ error: {e}")
            failed.append(slug)

        time.sleep(0.3)

    if not args.dry_run and updated > 0:
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(negocios, f, indent=2, ensure_ascii=False)
            f.write("\n")

    print()
    print(f"=== Completado ===")
    print(f"  Actualizados: {updated}")
    print(f"  Fallidos: {len(failed)}")
    if failed:
        print(f"  Slugs fallidos: {', '.join(failed[:20])}" + ("..." if len(failed) > 20 else ""))


if __name__ == "__main__":
    main()
