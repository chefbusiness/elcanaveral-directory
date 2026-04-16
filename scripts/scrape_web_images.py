#!/usr/bin/env python3
"""
Descarga imágenes REALES de negocios desde sus WEBS (OG image, logo, hero).
Mucho más fiable que Google Maps scraping.
"""

import json
import os
import re
from pathlib import Path
import requests

DATA_FILE = Path(__file__).parent.parent / "src" / "data" / "negocios.json"
IMAGES_DIR = Path(__file__).parent.parent / "public" / "images" / "negocios"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
}


def download_image(url, slug):
    """Descarga una imagen desde URL."""
    filepath = IMAGES_DIR / f"{slug}.jpg"
    if filepath.exists():
        return f"/images/negocios/{slug}.jpg"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15, allow_redirects=True)
        if resp.status_code == 200 and len(resp.content) > 3000:
            # Verificar que es imagen
            ct = resp.headers.get("content-type", "")
            if "image" in ct or url.endswith((".jpg", ".jpeg", ".png", ".webp")):
                filepath.write_bytes(resp.content)
                size_kb = len(resp.content) / 1024
                print(f"    OK: {slug}.jpg ({size_kb:.0f} KB)")
                return f"/images/negocios/{slug}.jpg"
    except Exception as e:
        print(f"    Error: {e}")
    return None


def extract_og_image(website):
    """Extrae og:image de una web."""
    try:
        resp = requests.get(website, headers=HEADERS, timeout=10, allow_redirects=True)
        if resp.status_code != 200:
            return None

        html = resp.text
        # og:image
        og = re.search(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)', html)
        if og:
            return og.group(1)
        # og:image reverse attr order
        og2 = re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image', html)
        if og2:
            return og2.group(1)
        # twitter:image
        tw = re.search(r'<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)', html)
        if tw:
            return tw.group(1)
        # First large image in hero/header
        imgs = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', html)
        for img in imgs[:5]:
            if any(kw in img.lower() for kw in ['hero', 'banner', 'header', 'logo', 'main']):
                if not img.startswith("http"):
                    img = website.rstrip("/") + "/" + img.lstrip("/")
                return img

        return None
    except Exception:
        return None


def main():
    os.chdir(Path(__file__).parent.parent)
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    with open(DATA_FILE) as f:
        negocios = json.load(f)

    sin_imagen = [
        n for n in negocios
        if not n.get("image") or n.get("image", "").startswith("/images/categorias/")
    ]
    con_web = [n for n in sin_imagen if n.get("website")]

    print(f"=== Scraping imágenes desde webs ===")
    print(f"  Sin imagen propia: {len(sin_imagen)}")
    print(f"  Con web: {len(con_web)}\n")

    updated = 0
    for n in con_web:
        slug = n["slug"]
        website = n["website"]
        print(f"  {slug}... ", end="")

        og_url = extract_og_image(website)
        if og_url:
            # Normalizar URL
            if not og_url.startswith("http"):
                og_url = website.rstrip("/") + "/" + og_url.lstrip("/")
            img_path = download_image(og_url, slug)
            if img_path:
                for neg in negocios:
                    if neg["slug"] == slug:
                        neg["image"] = img_path
                        updated += 1
                        break
                continue
        print("    Sin OG image")

    with open(DATA_FILE, "w") as f:
        json.dump(negocios, f, indent=2, ensure_ascii=False)

    print(f"\n=== Completado ===")
    print(f"  Imágenes web descargadas: {updated}/{len(con_web)}")


if __name__ == "__main__":
    main()
