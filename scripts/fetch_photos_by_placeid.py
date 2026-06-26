#!/usr/bin/env python3
"""
Descarga fotos REALES por place_id (autoritativo) via Google Places API (New).

A diferencia de fetch_places_photos.py (que busca por nombre+dirección y puede
casar el local equivocado), aquí usamos el place_id ya guardado en negocios.json
(de Apify) → la foto SIEMPRE corresponde al negocio correcto.

Uso:
  # Una ficha (arregla fotos mal asignadas):
  python scripts/fetch_photos_by_placeid.py --slug burger-king-canaveral --count 3 --write
  # Toda una categoría (dry-run):
  python scripts/fetch_photos_by_placeid.py --category restaurantes --count 5
  # Todas:
  python scripts/fetch_photos_by_placeid.py --all --count 5 --write
"""
import argparse, io, json, sys, time
from pathlib import Path
import requests
from dotenv import load_dotenv
from PIL import Image
import os

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")
API_KEY = os.environ.get("GOOGLE_PLACES_API_KEY")
if not API_KEY:
    sys.exit("ERROR: falta GOOGLE_PLACES_API_KEY en .env")

DATA_FILE = ROOT / "src" / "data" / "negocios.json"
IMAGES_DIR = ROOT / "public" / "images" / "negocios"
IMAGES_DIR.mkdir(parents=True, exist_ok=True)


def place_photos(place_id: str):
    """Devuelve (displayName, [photo_names]) para un place_id."""
    url = f"https://places.googleapis.com/v1/places/{place_id}"
    headers = {"X-Goog-Api-Key": API_KEY,
               "X-Goog-FieldMask": "id,displayName,photos"}
    r = requests.get(url, headers=headers, params={"languageCode": "es"}, timeout=20)
    if r.status_code != 200:
        print(f"    place {r.status_code}: {r.text[:120]}")
        return None, []
    j = r.json()
    name = (j.get("displayName") or {}).get("text", "")
    photos = [p["name"] for p in (j.get("photos") or [])]
    return name, photos


def fetch_media(photo_name: str, max_h: int = 1200):
    url = f"https://places.googleapis.com/v1/{photo_name}/media"
    r = requests.get(url, params={"maxHeightPx": max_h, "key": API_KEY},
                     timeout=30, allow_redirects=True)
    return r.content if r.status_code == 200 else None


def save_image(data: bytes, out: Path) -> int:
    img = Image.open(io.BytesIO(data))
    if img.mode != "RGB":
        img = img.convert("RGB")
    if img.width > 1200:
        img = img.resize((1200, int(img.height * 1200 / img.width)), Image.LANCZOS)
    img.save(out, "JPEG", quality=85, optimize=True)
    return out.stat().st_size


def process(n: dict, count: int, dry: bool):
    slug, pid = n["slug"], n.get("placeId")
    if not pid:
        print(f"  ✗ {slug}: sin placeId"); return None
    disp, photos = place_photos(pid)
    if not photos:
        print(f"  ✗ {slug}: sin fotos en Google ({disp})"); return None
    print(f"  · {slug} → Google dice «{disp}» ({len(photos)} fotos)")
    imgs = []
    for i in range(min(count, len(photos))):
        suffix = "" if i == 0 else f"-{i+1}"
        out = IMAGES_DIR / f"{slug}{suffix}.jpg"
        if dry:
            imgs.append(f"/images/negocios/{slug}{suffix}.jpg"); continue
        data = fetch_media(photos[i])
        if not data or len(data) < 4000:
            continue
        kb = save_image(data, out) // 1024
        print(f"      ✓ {out.name} ({kb} KB)")
        imgs.append(f"/images/negocios/{slug}{suffix}.jpg")
        time.sleep(0.15)
    return imgs or None


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--slug")
    p.add_argument("--category")
    p.add_argument("--all", action="store_true")
    p.add_argument("--only-missing", action="store_true", help="solo fichas con placeId y sin fotos")
    p.add_argument("--limit", type=int)
    p.add_argument("--count", type=int, default=5)
    p.add_argument("--write", action="store_true")
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()
    dry = args.dry_run or not args.write

    negocios = json.load(open(DATA_FILE, encoding="utf-8"))
    if args.slug:
        targets = [n for n in negocios if n["slug"] == args.slug]
    elif args.category:
        targets = [n for n in negocios if n.get("category") == args.category]
    elif args.only_missing:
        targets = [n for n in negocios if n.get("placeId") and not n.get("images")]
    elif args.all:
        targets = [n for n in negocios if n.get("placeId")]
    else:
        sys.exit("indica --slug / --category / --all / --only-missing")
    if args.limit:
        targets = targets[: args.limit]

    print(f"A procesar: {len(targets)}  {'(dry-run)' if dry else '(ESCRIBE)'}\n")
    updated = 0
    for n in targets:
        imgs = process(n, args.count, dry)
        if imgs:
            if not dry:
                for b in negocios:
                    if b["slug"] == n["slug"]:
                        b["image"] = imgs[0]; b["images"] = imgs; break
            updated += 1
    if not dry and updated:
        json.dump(negocios, open(DATA_FILE, "w", encoding="utf-8"),
                  ensure_ascii=False, indent=2)
        open(DATA_FILE, "a").write("\n")
    print(f"\n=== {'escrito' if not dry else 'dry-run'}: {updated}/{len(targets)} ===")


if __name__ == "__main__":
    main()
