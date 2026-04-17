#!/usr/bin/env python3
"""
Descarga fotos REALES de negocios via Google Places API (New).

Modos:
  --mode hero      Descarga 1 foto principal → {slug}.jpg (default inicial)
  --mode gallery   Descarga hasta N fotos extra → {slug}-2.jpg ... {slug}-N.jpg
                   (no sobrescribe {slug}.jpg si ya existe)

Pipeline:
  1. Text Search (New) → encontrar place_id por nombre + dirección
  2. Place Photo (New) → descargar fotos disponibles
  3. Optimizar con Pillow: max 1200px ancho, JPEG q85
  4. Actualizar campos image (primera) e images (array) en negocios.json

Uso:
  python scripts/fetch_places_photos.py --mode gallery --count 5
  python scripts/fetch_places_photos.py --mode gallery --slug mercadona-coslada
  python scripts/fetch_places_photos.py --mode hero    # comportamiento legacy
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
LOCATION_BIAS = {
    "circle": {
        "center": {"latitude": 40.4300, "longitude": -3.5790},
        "radius": 10000.0,
    }
}
FIELD_MASK = "places.id,places.displayName,places.formattedAddress,places.photos"


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
        print(f"    TextSearch {resp.status_code}: {resp.text[:180]}")
        return None
    places = resp.json().get("places") or []
    return places[0] if places else None


def fetch_photo(photo_name: str, max_height: int = 1200) -> bytes | None:
    url = f"https://places.googleapis.com/v1/{photo_name}/media"
    params = {"maxHeightPx": max_height, "key": API_KEY}
    resp = requests.get(url, params=params, timeout=30, allow_redirects=True)
    if resp.status_code != 200:
        print(f"    Photo {resp.status_code}")
        return None
    return resp.content


def save_image(data: bytes, out_path: Path) -> int:
    img = Image.open(io.BytesIO(data))
    if img.mode != "RGB":
        img = img.convert("RGB")
    if img.width > 1200:
        ratio = 1200 / img.width
        img = img.resize((1200, int(img.height * ratio)), Image.LANCZOS)
    img.save(out_path, "JPEG", quality=85, optimize=True)
    return out_path.stat().st_size


def needs_hero(negocio: dict) -> bool:
    img = str(negocio.get("image") or "")
    return (not img) or ("/categorias/" in img)


def process_hero(n: dict, dry: bool) -> tuple[bool, list[str]]:
    slug, name, address = n["slug"], n["name"], n.get("address", "")
    place = text_search(name, address)
    if not place:
        print("    ✗ no results")
        return False, []
    photos = place.get("photos") or []
    if not photos:
        print(f"    ✗ sin fotos")
        return False, []
    data = fetch_photo(photos[0]["name"])
    if not data or len(data) < 5000:
        print(f"    ✗ descarga fallida")
        return False, []
    if dry:
        print(f"    [dry-run] would save {len(data)}B")
        return True, [f"/images/negocios/{slug}.jpg"]
    out = IMAGES_DIR / f"{slug}.jpg"
    size = save_image(data, out)
    print(f"    ✓ {out.name} ({size // 1024} KB)")
    return True, [f"/images/negocios/{slug}.jpg"]


def process_gallery(n: dict, count: int, dry: bool) -> tuple[bool, list[str]]:
    slug, name, address = n["slug"], n["name"], n.get("address", "")
    place = text_search(name, address)
    if not place:
        print("    ✗ no results")
        return False, []
    photos = place.get("photos") or []
    if not photos:
        print(f"    ✗ sin fotos")
        return False, []

    # Build the resulting images array. Keep existing hero as images[0] if present.
    existing = str(n.get("image") or "")
    images: list[str] = []
    hero_path = IMAGES_DIR / f"{slug}.jpg"

    if hero_path.exists() and "/images/negocios/" in existing:
        # Keep existing hero — skip photos[0], start extras from photos[1]
        images.append(f"/images/negocios/{slug}.jpg")
        extras_source = photos[1 : count]
        extra_start_index = 2
    else:
        # Download photos[0] as new hero
        data = fetch_photo(photos[0]["name"])
        if data and len(data) >= 5000:
            if not dry:
                save_image(data, hero_path)
                print(f"    ✓ {slug}.jpg ({hero_path.stat().st_size // 1024} KB) [hero]")
            images.append(f"/images/negocios/{slug}.jpg")
        extras_source = photos[1 : count]
        extra_start_index = 2

    # Download extras
    for i, photo in enumerate(extras_source, start=extra_start_index):
        extra_path = IMAGES_DIR / f"{slug}-{i}.jpg"
        if extra_path.exists() and not dry:
            images.append(f"/images/negocios/{slug}-{i}.jpg")
            continue
        data = fetch_photo(photo["name"])
        if not data or len(data) < 5000:
            continue
        if dry:
            print(f"    [dry-run] extra {i}: {len(data)}B")
            images.append(f"/images/negocios/{slug}-{i}.jpg")
            continue
        size = save_image(data, extra_path)
        print(f"    ✓ {extra_path.name} ({size // 1024} KB)")
        images.append(f"/images/negocios/{slug}-{i}.jpg")
        time.sleep(0.15)

    return bool(images), images


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["hero", "gallery"], default="gallery")
    parser.add_argument("--count", type=int, default=5, help="fotos totales por negocio (gallery)")
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--slug", type=str, default=None)
    parser.add_argument("--only-missing", action="store_true", help="solo negocios sin hero")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    with open(DATA_FILE, encoding="utf-8") as f:
        negocios = json.load(f)

    if args.slug:
        targets = [n for n in negocios if n["slug"] == args.slug]
    elif args.only_missing or args.mode == "hero":
        targets = [n for n in negocios if needs_hero(n)]
    else:
        # gallery mode: all businesses with an existing hero
        targets = [n for n in negocios if not needs_hero(n)]

    if args.limit:
        targets = targets[: args.limit]

    print(f"Mode: {args.mode}  Negocios totales: {len(negocios)}  A procesar: {len(targets)}")
    if args.dry_run:
        print("(dry-run)")
    print()

    updated = 0
    failed: list[str] = []
    for i, n in enumerate(targets, 1):
        print(f"[{i}/{len(targets)}] {n['slug']}  ({n['name']})")
        try:
            if args.mode == "hero":
                ok, imgs = process_hero(n, args.dry_run)
            else:
                ok, imgs = process_gallery(n, args.count, args.dry_run)

            if ok and imgs:
                if not args.dry_run:
                    for b in negocios:
                        if b["slug"] == n["slug"]:
                            b["image"] = imgs[0]
                            b["images"] = imgs
                            break
                updated += 1
            else:
                failed.append(n["slug"])
        except Exception as e:
            print(f"    ✗ error: {e}")
            failed.append(n["slug"])
        time.sleep(0.25)

    if not args.dry_run and updated > 0:
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(negocios, f, indent=2, ensure_ascii=False)
            f.write("\n")

    print()
    print(f"=== Completado ===  Actualizados: {updated}  Fallidos: {len(failed)}")
    if failed:
        print(f"  Fallidos: {', '.join(failed[:15])}" + ("..." if len(failed) > 15 else ""))


if __name__ == "__main__":
    main()
