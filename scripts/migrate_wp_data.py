#!/usr/bin/env python3
"""
Migra datos e imagenes desde WordPress (elcanaveral.info) al directorio Astro.
- Descarga imagenes featured de cada listing
- Enriquece negocios.json con datos reales (direcciones, telefonos, ratings)
"""

import json
import os
import re
import requests
from pathlib import Path
from urllib.parse import urlparse

BASE_URL = "https://elcanaveral.info/wp-json/wp/v2"
IMAGES_DIR = Path("public/images/negocios")
DATA_FILE = Path("src/data/negocios.json")

# Mapeo de categorias WP → nuestras categorias Astro
CAT_MAP = {
    "supermercado": "supermercados",
    "tienda-de-alimentacion": "tiendas-alimentacion",
    "fruteria": "fruterias",
    "panaderia": "panaderias",
    "cafeterias": "cafeterias",
    "food": "restaurantes",
    "compras": "tiendas-alimentacion",
}

# Mapeo de ubicaciones WP → nuestras zonas
ZONA_MAP = {
    "el-canaveral": {"slug": "el-canaveral", "name": "El Canaveral"},
    "vicalvaro": {"slug": "vicalvaro", "name": "Vicalvaro"},
    "coslada": {"slug": "coslada", "name": "Coslada"},
    "san-fernando-de-henares": {"slug": "san-fernando-de-henares", "name": "San Fernando de Henares"},
}


def fetch_listings():
    """Obtiene todos los listings del directorio WP."""
    listings = []
    page = 1
    while True:
        resp = requests.get(f"{BASE_URL}/at_biz_dir", params={"per_page": 100, "page": page})
        if resp.status_code != 200:
            break
        data = resp.json()
        if not data:
            break
        listings.extend(data)
        page += 1
    print(f"  Obtenidos {len(listings)} listings de WP")
    return listings


def fetch_media(media_id):
    """Obtiene info de un media item por ID."""
    if not media_id:
        return None
    resp = requests.get(f"{BASE_URL}/media/{media_id}")
    if resp.status_code != 200:
        return None
    return resp.json()


def download_image(url, filename):
    """Descarga imagen y la guarda en IMAGES_DIR."""
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    filepath = IMAGES_DIR / filename
    if filepath.exists():
        print(f"    Ya existe: {filename}")
        return f"/images/negocios/{filename}"

    try:
        resp = requests.get(url, timeout=30)
        resp.raise_for_status()
        filepath.write_bytes(resp.content)
        size_kb = len(resp.content) / 1024
        print(f"    Descargada: {filename} ({size_kb:.0f} KB)")
        return f"/images/negocios/{filename}"
    except Exception as e:
        print(f"    Error descargando {url}: {e}")
        return None


def extract_address_from_content(content):
    """Extrae direccion del contenido HTML del listing."""
    # Buscar patrones de direccion comunes
    patterns = [
        r'(?:Calle|C\.|Av\.|Avenida|Blvr\.|Boulevard|Plaza)[\w\s,\.]+\d{5}\s*Madrid',
        r'[\w\s,\.]+(?:Vicálvaro|Coslada|San Fernando)[\w\s,\.]*\d{5}\s*Madrid',
    ]
    for pattern in patterns:
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            return match.group(0).strip()
    return None


def slugify(text):
    """Genera slug URL-safe."""
    text = text.lower().strip()
    text = re.sub(r'[áà]', 'a', text)
    text = re.sub(r'[éè]', 'e', text)
    text = re.sub(r'[íì]', 'i', text)
    text = re.sub(r'[óò]', 'o', text)
    text = re.sub(r'[úù]', 'u', text)
    text = re.sub(r'[ñ]', 'n', text)
    text = re.sub(r'[^a-z0-9]+', '-', text)
    text = text.strip('-')
    return text


def process_listing(listing):
    """Procesa un listing WP y devuelve un negocio para nuestro JSON."""
    title = listing.get("title", {}).get("rendered", "")
    slug = slugify(title)
    content = listing.get("content", {}).get("rendered", "")

    # Extraer texto plano del contenido
    clean_content = re.sub(r'<[^>]+>', '', content).strip()
    description = clean_content[:300] if clean_content else title

    # Categoria
    # WP no devuelve categorias directamente en el JSON, usaremos las que ya tenemos

    # Featured media
    featured_media_id = listing.get("featured_media", 0)
    image_path = None
    if featured_media_id:
        media = fetch_media(featured_media_id)
        if media:
            source_url = media.get("source_url", "")
            if source_url:
                ext = os.path.splitext(urlparse(source_url).path)[1] or ".jpg"
                filename = f"{slug}{ext}"
                image_path = download_image(source_url, filename)

    return {
        "wp_id": listing["id"],
        "slug": slug,
        "name": title,
        "description": description,
        "image": image_path,
        "featured_media_id": featured_media_id,
        "wp_slug": listing.get("slug", ""),
        "date": listing.get("date", ""),
    }


def enrich_existing_negocios(wp_data):
    """Enriquece negocios.json existente con datos de WP."""
    with open(DATA_FILE) as f:
        negocios = json.load(f)

    # Datos enriquecidos extraidos manualmente del WP REST API
    enrichments = {
        "el-horno-de-izan-iii": {
            "address": "Calle de Mario Moreno Cantinflas & C. de Francisco Grande Covian, 28052 Madrid",
            "rating": 4.3,
            "numReviews": 437,
        },
        "obrador-de-goya": {
            "address": "Av. de Miguel Delibes, 80, local 4, Vicalvaro, 28052 Madrid",
            "rating": 3.8,
            "numReviews": 300,
            "email": "info@obradordegoya.com",
        },
        "caprichos-coffee-bakery": {
            "address": "Av. de Miguel Delibes, 30, Vicalvaro, 28052 Madrid",
            "rating": 4.2,
            "numReviews": 290,
        },
        "levaduramadre": {
            "address": "Av. de Blas de Lezo, Vicalvaro, 28052 Madrid",
            "rating": 4.2,
            "numReviews": 49,
        },
        "panaderia-bulevar": {
            "address": "Blvr. de Indalecio Prieto, 12, local 6, Vicalvaro, 28032 Madrid",
            "rating": 4.4,
            "numReviews": 126,
            "phone": "910 44 22 38",
        },
        "le-petit-cafe-de-cryss": {
            "address": "Av. de Blas de Lezo, 287, Vicalvaro, 28052 Madrid",
            "rating": 4.6,
            "numReviews": 47,
        },
        "mimarutxa": {
            "address": "Avenida Miguel Delibes & C. Concejal Victorino Granizo, 28052 Madrid",
            "rating": 3.8,
            "numReviews": 173,
            "phone": "912 93 91 55",
        },
        "fabricacion-y-distribucion-panaderia": {
            "address": "Calle de Rivas, Vicalvaro, 28052 Madrid",
            "phone": "917 75 22 11",
            "zona": "vicalvaro",
            "zonaName": "Vicalvaro",
        },
        "la-fruteria-de-mama": {
            "address": "C. Anna Frank, 12, Local 7, Vicalvaro, 28052 Madrid",
            "rating": 5.0,
            "phone": "699 90 33 69",
        },
        "megafruta-canaveral": {
            "address": "Av. de Miguel Delibes, 25, Vicalvaro, 28052 Madrid",
        },
        "fruteria-charcuteria-el-canaveral": {
            "address": "Av. de Miguel Delibes, 30-44, Vicalvaro, 28052 Madrid",
            "phone": "610 44 34 73",
        },
        "frutas-y-verduras-vida-sana": {
            "address": "Av. de Miguel Delibes, 47, Vicalvaro, 28052 Madrid",
        },
        "mercadona-coslada": {
            "address": "Av. de Espana, 116, 28822 Coslada, Madrid",
            "rating": 4.1,
            "numReviews": 1820,
        },
        "casa-elias": {
            "address": "C. Miguel Delibes - Mario Moreno, Vicalvaro, 28052 Madrid",
        },
    }

    # Mapeo de WP image IDs a URLs para descargar
    wp_images = {
        "el-horno-de-izan-iii": "https://elcanaveral.info/wp-content/uploads/2025/10/AF1QipM52cEjC5DqXB_7s8WXrbT2YaEIxQXbMk794hJrw426-h240-k-no.jpg",
        "obrador-de-goya": "https://elcanaveral.info/wp-content/uploads/2025/10/AC9h4nqX2OFZ5yJB6MxaABbIHFr4ny7TouYfXVIT6D6wzPhhRzArmeRVPBLy8-i9f5Tt0YubM28GqzsLH9S6oZnLSFoUU9v7edq0aBbA9w9t_k5lIs8GOe6AoUcluFxat9P-jLvlvc0w408-h306-k-no.jpg",
        "caprichos-coffee-bakery": "https://elcanaveral.info/wp-content/uploads/2025/10/AF1QipPo2vwj9sNuny-iMA2J4OSvD9oBfE5eQ2zP3Ci6w408-h408-k-no.jpg",
        "levaduramadre": "https://elcanaveral.info/wp-content/uploads/2025/10/AC9h4nphTKxb3QKzRG7vZsYzyQ9RDgA-MrII4hQueOSAo6K_8THe_FxteW-wrBp8JztFDV6U9v3pEu4M4gY9PTpgb1euojoKMrzscvz_AngYOkt7l3YXXWHnm-drJnHyxYIdnUWzepqOIgFlZTGBw408-h544-k-no.jpg",
        "mimarutxa": "https://elcanaveral.info/wp-content/uploads/2025/10/AF1QipMF62J2yNYiJ9zOeq9f-k-QAke7RaZyBILdslmSw408-h544-k-no.jpg",
        "panaderia-bulevar": "https://elcanaveral.info/wp-content/uploads/2025/10/panaderia-vicalvaro.jpeg",
        "fabricacion-y-distribucion-panaderia": "https://elcanaveral.info/wp-content/uploads/2025/10/panaderia-vicalvaro.jpeg",
        "le-petit-cafe-de-cryss": "https://elcanaveral.info/wp-content/uploads/2025/10/AC9h4nphTKxb3QKzRG7vZsYzyQ9RDgA-MrII4hQueOSAo6K_8THe_FxteW-wrBp8JztFDV6U9v3pEu4M4gY9PTpgb1euojoKMrzscvz_AngYOkt7l3YXXWHnm-drJnHyxYIdnUWzepqOIgFlZTGBw408-h544-k-no.jpg",
    }

    updated = 0
    for negocio in negocios:
        slug = negocio["slug"]

        # Enriquecer con datos estructurados
        if slug in enrichments:
            for key, value in enrichments[slug].items():
                if value and (key not in negocio or not negocio.get(key)):
                    negocio[key] = value
                    updated += 1

        # Descargar imagen si existe en WP
        if slug in wp_images and not negocio.get("image"):
            url = wp_images[slug]
            ext = ".jpg"
            filename = f"{slug}{ext}"
            image_path = download_image(url, filename)
            if image_path:
                negocio["image"] = image_path
                updated += 1

    with open(DATA_FILE, "w") as f:
        json.dump(negocios, f, indent=2, ensure_ascii=False)

    print(f"\n  Negocios actualizados: {updated} campos enriquecidos")
    return negocios


def main():
    print("=== Migracion de datos WP → Astro ===\n")

    # 1. Obtener listings de WP
    print("1. Obteniendo listings de WP...")
    wp_listings = fetch_listings()

    # 2. Descargar imagenes y enriquecer datos
    print("\n2. Descargando imagenes de negocios...")
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    # 3. Enriquecer negocios existentes
    print("\n3. Enriqueciendo negocios.json...")
    negocios = enrich_existing_negocios(wp_listings)

    print(f"\n=== Completado ===")
    print(f"  Total negocios en JSON: {len(negocios)}")
    print(f"  Imagenes en {IMAGES_DIR}: {len(list(IMAGES_DIR.glob('*')))}")


if __name__ == "__main__":
    os.chdir(Path(__file__).parent.parent)
    main()
