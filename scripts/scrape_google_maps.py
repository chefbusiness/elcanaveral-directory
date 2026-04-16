#!/usr/bin/env python3
"""
Scraping de negocios locales desde Google Maps para El Canaveral y alrededores.
Usa crawl4ai para buscar negocios por categoria y zona.

Uso:
  python scrape_google_maps.py
  python scrape_google_maps.py --categoria "guarderias"
  python scrape_google_maps.py --dry-run
"""

import asyncio
import json
import os
import re
import sys
import time
from pathlib import Path

# crawl4ai
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig

# OpenRouter para clasificar con Gemini
import requests

OPENROUTER_API_KEY = os.getenv(
    "OPENROUTER_API_KEY",
    "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",
)

DATA_DIR = Path(__file__).parent.parent / "src" / "data"
OUTPUT_FILE = DATA_DIR / "negocios_scraped.json"
EXISTING_FILE = DATA_DIR / "negocios.json"

# Zonas y sus queries de Google Maps
ZONAS = {
    "el-canaveral": {
        "name": "El Canaveral",
        "query_suffix": "El Cañaveral Madrid",
    },
    "vicalvaro": {
        "name": "Vicalvaro",
        "query_suffix": "Vicálvaro Madrid",
    },
    "coslada": {
        "name": "Coslada",
        "query_suffix": "Coslada Madrid",
    },
    "san-fernando-de-henares": {
        "name": "San Fernando de Henares",
        "query_suffix": "San Fernando de Henares Madrid",
    },
}

# Categorias a buscar con sus queries
SEARCH_QUERIES = [
    # Educacion / Infantil
    {"query": "guarderias", "category": "educacion", "categoryName": "Educacion e Infantil"},
    {"query": "escuelas infantiles", "category": "educacion", "categoryName": "Educacion e Infantil"},
    {"query": "colegios", "category": "educacion", "categoryName": "Educacion e Infantil"},
    {"query": "academias", "category": "educacion", "categoryName": "Educacion e Infantil"},
    # Restaurantes
    {"query": "restaurantes", "category": "restaurantes", "categoryName": "Restaurantes"},
    {"query": "pizzerias", "category": "restaurantes", "categoryName": "Restaurantes"},
    {"query": "kebab", "category": "restaurantes", "categoryName": "Restaurantes"},
    {"query": "comida china", "category": "restaurantes", "categoryName": "Restaurantes"},
    {"query": "comida rapida", "category": "restaurantes", "categoryName": "Restaurantes"},
    # Salud
    {"query": "farmacias", "category": "salud", "categoryName": "Salud y Bienestar"},
    {"query": "dentistas", "category": "salud", "categoryName": "Salud y Bienestar"},
    {"query": "clinicas", "category": "salud", "categoryName": "Salud y Bienestar"},
    {"query": "fisioterapia", "category": "salud", "categoryName": "Salud y Bienestar"},
    {"query": "opticas", "category": "salud", "categoryName": "Salud y Bienestar"},
    {"query": "centro medico", "category": "salud", "categoryName": "Salud y Bienestar"},
    # Belleza
    {"query": "peluquerias", "category": "belleza", "categoryName": "Belleza y Peluquerias"},
    {"query": "barberías", "category": "belleza", "categoryName": "Belleza y Peluquerias"},
    {"query": "centros de estetica", "category": "belleza", "categoryName": "Belleza y Peluquerias"},
    # Deporte
    {"query": "gimnasios", "category": "deporte", "categoryName": "Deporte y Fitness"},
    {"query": "crossfit", "category": "deporte", "categoryName": "Deporte y Fitness"},
    # Hogar
    {"query": "ferreterias", "category": "hogar", "categoryName": "Hogar y Reformas"},
    {"query": "fontaneros", "category": "hogar", "categoryName": "Hogar y Reformas"},
    {"query": "electricistas", "category": "hogar", "categoryName": "Hogar y Reformas"},
    {"query": "reformas", "category": "hogar", "categoryName": "Hogar y Reformas"},
    # Mascotas
    {"query": "veterinarios", "category": "mascotas", "categoryName": "Mascotas"},
    {"query": "tiendas de mascotas", "category": "mascotas", "categoryName": "Mascotas"},
    {"query": "peluqueria canina", "category": "mascotas", "categoryName": "Mascotas"},
    # Moda
    {"query": "tiendas de ropa", "category": "moda", "categoryName": "Moda y Complementos"},
    {"query": "zapaterias", "category": "moda", "categoryName": "Moda y Complementos"},
    # Automocion
    {"query": "talleres mecanicos", "category": "automocion", "categoryName": "Automocion"},
    {"query": "lavadero de coches", "category": "automocion", "categoryName": "Automocion"},
    # Servicios profesionales
    {"query": "gestorias", "category": "servicios-profesionales", "categoryName": "Servicios Profesionales"},
    {"query": "abogados", "category": "servicios-profesionales", "categoryName": "Servicios Profesionales"},
    {"query": "inmobiliarias", "category": "servicios-profesionales", "categoryName": "Servicios Profesionales"},
    {"query": "seguros", "category": "servicios-profesionales", "categoryName": "Servicios Profesionales"},
    # Ocio
    {"query": "bares", "category": "ocio", "categoryName": "Ocio y Entretenimiento"},
    {"query": "ludotecas", "category": "ocio", "categoryName": "Ocio y Entretenimiento"},
]


def slugify(text):
    """Genera slug URL-safe."""
    text = text.lower().strip()
    text = re.sub(r'[áàä]', 'a', text)
    text = re.sub(r'[éèë]', 'e', text)
    text = re.sub(r'[íìï]', 'i', text)
    text = re.sub(r'[óòö]', 'o', text)
    text = re.sub(r'[úùü]', 'u', text)
    text = re.sub(r'[ñ]', 'n', text)
    text = re.sub(r'[^a-z0-9]+', '-', text)
    text = text.strip('-')
    return text


def parse_google_maps_results(markdown_text, category_info, zona_info):
    """Extrae negocios del markdown scrapeado de Google Maps."""
    negocios = []

    # Patrones para extraer datos de Google Maps
    # Los resultados suelen venir como nombre, rating, direccion, telefono
    lines = markdown_text.split('\n')

    current = {}
    for line in lines:
        line = line.strip()
        if not line:
            if current.get("name"):
                negocios.append(current)
                current = {}
            continue

        # Detectar nombre de negocio (suele ser texto con link o bold)
        if re.match(r'^#{1,3}\s', line) or (len(line) > 5 and len(line) < 100 and not line.startswith('http')):
            name_clean = re.sub(r'[#\[\]*]', '', line).strip()
            if name_clean and len(name_clean) > 2 and len(name_clean) < 80:
                if current.get("name"):
                    negocios.append(current)
                current = {
                    "name": name_clean,
                    "category": category_info["category"],
                    "categoryName": category_info["categoryName"],
                    "zona": zona_info["slug"],
                    "zonaName": zona_info["name"],
                }

        # Rating
        rating_match = re.search(r'(\d+[.,]\d+)\s*(?:estrellas?|stars?|\()', line)
        if rating_match and current:
            try:
                current["rating"] = float(rating_match.group(1).replace(',', '.'))
            except ValueError:
                pass

        # Numero de resenas
        review_match = re.search(r'\((\d+(?:\.\d+)?)\s*(?:resena|review|opinion)', line, re.IGNORECASE)
        if review_match and current:
            current["numReviews"] = int(review_match.group(1).replace('.', ''))

        # Direccion
        addr_match = re.search(r'(?:C/|Calle|Av\.|Avda\.|Avenida|Blvr\.|Plaza|Pza\.)[\w\s,\.]+\d{5}', line, re.IGNORECASE)
        if addr_match and current:
            current["address"] = addr_match.group(0).strip()

        # Telefono
        phone_match = re.search(r'(?:\+34\s?)?(?:6\d{2}|7\d{2}|8\d{2}|9\d{2})[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}', line)
        if phone_match and current:
            current["phone"] = phone_match.group(0).strip()

    if current.get("name"):
        negocios.append(current)

    return negocios


async def scrape_zona_category(crawler, query, zona_slug, zona_info, category_info):
    """Busca negocios en Google Maps para una categoria y zona."""
    search_query = f"{query} en {zona_info['query_suffix']}"
    url = f"https://www.google.com/maps/search/{search_query.replace(' ', '+')}"

    print(f"  Buscando: {search_query}...")

    try:
        config = CrawlerRunConfig(
            wait_until="domcontentloaded",
            page_timeout=20000,
            delay_before_return_html=3.0,
        )
        result = await crawler.arun(url=url, config=config)

        if result.success and result.markdown:
            negocios = parse_google_maps_results(
                result.markdown, category_info, {"slug": zona_slug, "name": zona_info["name"]}
            )
            print(f"    Encontrados: {len(negocios)} negocios")
            return negocios
        else:
            print(f"    Sin resultados o error")
            return []
    except Exception as e:
        print(f"    Error: {e}")
        return []


def classify_with_gemini(negocios_raw):
    """Usa Gemini via OpenRouter para clasificar y limpiar negocios."""
    if not negocios_raw:
        return []

    # Preparar batch para Gemini
    batch_text = json.dumps(negocios_raw[:50], ensure_ascii=False, indent=2)

    prompt = f"""Analiza esta lista de negocios scrapeados de Google Maps.
Para cada negocio, devuelve un JSON limpio con:
- name: nombre correcto del negocio
- slug: URL-friendly (sin acentos, guiones)
- description: descripcion breve en espanol (1-2 frases)
- category: la categoria asignada
- categoryName: nombre de la categoria
- zona: la zona asignada
- zonaName: nombre de la zona
- address: direccion si la hay
- phone: telefono si lo hay
- rating: rating numerico si lo hay
- numReviews: numero de resenas si lo hay
- tags: 1-3 tags relevantes

IMPORTANTE:
- Elimina duplicados
- Elimina resultados que no sean negocios reales (ads, Google info boxes)
- Mantén solo negocios que realmente esten en la zona indicada

Negocios raw:
{batch_text}

Responde SOLO con un JSON array valido, sin markdown ni explicaciones."""

    try:
        resp = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "google/gemini-2.5-flash",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.1,
            },
            timeout=60,
        )
        resp.raise_for_status()
        content = resp.json()["choices"][0]["message"]["content"]

        # Extraer JSON del response
        json_match = re.search(r'\[.*\]', content, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(0))
    except Exception as e:
        print(f"  Error Gemini: {e}")

    return negocios_raw


def load_existing_slugs():
    """Carga slugs existentes para evitar duplicados."""
    if EXISTING_FILE.exists():
        with open(EXISTING_FILE) as f:
            return {n["slug"] for n in json.load(f)}
    return set()


async def main():
    dry_run = "--dry-run" in sys.argv
    filter_cat = None
    if "--categoria" in sys.argv:
        idx = sys.argv.index("--categoria")
        if idx + 1 < len(sys.argv):
            filter_cat = sys.argv[idx + 1]

    existing_slugs = load_existing_slugs()
    print(f"=== Scraping Google Maps — El Canaveral ===")
    print(f"  Negocios existentes: {len(existing_slugs)}")
    print(f"  Queries: {len(SEARCH_QUERIES)}")
    print(f"  Zonas: {len(ZONAS)}")
    if filter_cat:
        print(f"  Filtro categoria: {filter_cat}")
    print()

    all_negocios_raw = []

    browser_config = BrowserConfig(headless=True)
    async with AsyncWebCrawler(config=browser_config) as crawler:
        for query_info in SEARCH_QUERIES:
            if filter_cat and filter_cat not in query_info["query"]:
                continue

            # Solo buscar en El Canaveral y Vicalvaro por ahora
            # (Coslada y San Fernando se pueden añadir despues)
            for zona_slug in ["el-canaveral", "vicalvaro"]:
                zona_info = ZONAS[zona_slug]
                negocios = await scrape_zona_category(
                    crawler, query_info["query"], zona_slug, zona_info, query_info
                )
                all_negocios_raw.extend(negocios)

                # Pausa para no saturar
                await asyncio.sleep(2)

    print(f"\n  Total raw: {len(all_negocios_raw)} negocios encontrados")

    if dry_run:
        print("\n  [DRY RUN] No se guardan datos")
        for n in all_negocios_raw[:20]:
            print(f"    - {n.get('name', '?')} ({n.get('category', '?')}, {n.get('zonaName', '?')})")
        return

    # Clasificar y limpiar con Gemini
    print("\n  Clasificando con Gemini...")
    cleaned = classify_with_gemini(all_negocios_raw)

    # Dedup contra existentes
    new_negocios = []
    seen_slugs = set(existing_slugs)
    for n in cleaned:
        slug = n.get("slug") or slugify(n.get("name", ""))
        if slug and slug not in seen_slugs:
            n["slug"] = slug
            n["featured"] = False
            new_negocios.append(n)
            seen_slugs.add(slug)

    print(f"  Nuevos negocios (sin duplicados): {len(new_negocios)}")

    # Guardar
    with open(OUTPUT_FILE, "w") as f:
        json.dump(new_negocios, f, indent=2, ensure_ascii=False)
    print(f"  Guardado en: {OUTPUT_FILE}")

    # Merge con existentes
    if new_negocios:
        with open(EXISTING_FILE) as f:
            existing = json.load(f)
        merged = existing + new_negocios
        with open(EXISTING_FILE, "w") as f:
            json.dump(merged, f, indent=2, ensure_ascii=False)
        print(f"  Mergeado en negocios.json: {len(merged)} total")


if __name__ == "__main__":
    asyncio.run(main())
