#!/usr/bin/env python3
"""
Descarga fotos REALES de negocios desde Google Maps Places Photos.
Para cada negocio sin imagen propia, busca su foto en Google.
"""

import json
import os
import re
import time
from pathlib import Path
from urllib.parse import quote_plus

import requests
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig
import asyncio

DATA_FILE = Path(__file__).parent.parent / "src" / "data" / "negocios.json"
IMAGES_DIR = Path(__file__).parent.parent / "public" / "images" / "negocios"


async def get_google_maps_image(crawler, name, address, slug):
    """Busca la imagen de un negocio en Google Maps."""
    filepath = IMAGES_DIR / f"{slug}.jpg"
    if filepath.exists():
        return f"/images/negocios/{slug}.jpg"

    search_query = f"{name} {address}" if address else f"{name} El Cañaveral Madrid"
    url = f"https://www.google.com/maps/search/{quote_plus(search_query)}"

    try:
        config = CrawlerRunConfig(
            wait_until="domcontentloaded",
            page_timeout=15000,
            delay_before_return_html=3.0,
        )
        result = await crawler.arun(url=url, config=config)

        if result.success and result.markdown:
            # Buscar URLs de imágenes de Google Maps Places
            # Formato: lh5.googleusercontent.com o streetviewpixels
            img_patterns = [
                r'(https://lh[35]\.googleusercontent\.com/p/[A-Za-z0-9_-]+)',
                r'(https://streetviewpixels[^"\s]+)',
                r'(https://maps\.googleapis\.com/maps/api/place/photo[^"\s]+)',
            ]
            for pattern in img_patterns:
                matches = re.findall(pattern, result.markdown)
                if matches:
                    img_url = matches[0]
                    # Descargar
                    resp = requests.get(img_url, timeout=15)
                    if resp.status_code == 200 and len(resp.content) > 5000:
                        filepath.write_bytes(resp.content)
                        size_kb = len(resp.content) / 1024
                        print(f"    Descargada: {slug}.jpg ({size_kb:.0f} KB)")
                        return f"/images/negocios/{slug}.jpg"

        # Fallback: buscar en la web del negocio
        return None
    except Exception as e:
        print(f"    Error {slug}: {e}")
        return None


async def get_website_image(crawler, website, slug):
    """Extrae la primera imagen relevante de la web del negocio."""
    filepath = IMAGES_DIR / f"{slug}.jpg"
    if filepath.exists():
        return f"/images/negocios/{slug}.jpg"

    if not website:
        return None

    try:
        config = CrawlerRunConfig(
            wait_until="domcontentloaded",
            page_timeout=10000,
            delay_before_return_html=1.0,
        )
        result = await crawler.arun(url=website, config=config)

        if result.success and result.markdown:
            # Buscar OG image o primera imagen grande
            og_match = re.search(r'og:image["\s]+content="([^"]+)"', result.markdown)
            if og_match:
                img_url = og_match.group(1)
                resp = requests.get(img_url, timeout=10)
                if resp.status_code == 200 and len(resp.content) > 5000:
                    filepath.write_bytes(resp.content)
                    print(f"    Web image: {slug}.jpg")
                    return f"/images/negocios/{slug}.jpg"

        return None
    except Exception:
        return None


async def main():
    os.chdir(Path(__file__).parent.parent)
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    with open(DATA_FILE) as f:
        negocios = json.load(f)

    # Negocios que usan imagen genérica de categoría o no tienen imagen
    sin_imagen_propia = [
        n for n in negocios
        if not n.get("image") or n.get("image", "").startswith("/images/categorias/")
    ]

    print(f"=== Scraping imágenes reales ===")
    print(f"  Total negocios: {len(negocios)}")
    print(f"  Sin imagen propia: {len(sin_imagen_propia)}")

    browser_config = BrowserConfig(headless=True)
    updated = 0

    async with AsyncWebCrawler(config=browser_config) as crawler:
        for n in sin_imagen_propia:
            slug = n["slug"]
            name = n["name"]
            address = n.get("address", "")
            website = n.get("website", "")

            print(f"\n  {slug}...")

            # Intentar Google Maps primero
            img_path = await get_google_maps_image(crawler, name, address, slug)

            # Si no, intentar su web
            if not img_path and website:
                img_path = await get_website_image(crawler, website, slug)

            if img_path:
                # Actualizar en el JSON
                for neg in negocios:
                    if neg["slug"] == slug:
                        neg["image"] = img_path
                        updated += 1
                        break

            # Rate limit
            await asyncio.sleep(2)

    with open(DATA_FILE, "w") as f:
        json.dump(negocios, f, indent=2, ensure_ascii=False)

    print(f"\n=== Completado ===")
    print(f"  Imágenes reales descargadas: {updated}")
    print(f"  Sin imagen aún: {len(sin_imagen_propia) - updated}")


if __name__ == "__main__":
    asyncio.run(main())
