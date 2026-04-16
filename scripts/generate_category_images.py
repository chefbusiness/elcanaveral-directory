#!/usr/bin/env python3
"""
Genera hero images por categoria con Nano Banana 2 (Gemini)
para negocios sin imagen propia.
"""

import base64
import json
import os
import re
import time
from pathlib import Path

import requests

API_KEY = "AIzaSyARZuyrpA57DjYKLq2QFZA06nTUUnSwhvQ"
ENDPOINT = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key={API_KEY}"
IMAGES_DIR = Path(__file__).parent.parent / "public" / "images" / "categorias"
DATA_FILE = Path(__file__).parent.parent / "src" / "data" / "negocios.json"

# Prompts por categoria — estilo barrio moderno Madrid
CATEGORY_PROMPTS = {
    "educacion": "Hyperrealistic photography of a modern nursery school entrance in a new residential neighborhood in Madrid Spain 2026. Bright colorful facade, children's artwork on windows, warm natural light. Clean contemporary architecture with playful elements. Small urban garden visible. Horizontal 16:9 aspect ratio. Shot on 35mm film, natural grain.",
    "restaurantes": "Hyperrealistic photography of a cozy neighborhood restaurant terrace in a modern Madrid residential area 2026. Warm evening light, contemporary outdoor furniture, green plants, brick and wood accents. Mediterranean urban vibe, casual dining atmosphere. Horizontal 16:9. Shot on 35mm film, shallow depth of field.",
    "salud": "Hyperrealistic photography of a modern dental clinic reception area in Madrid 2026. Clean white interior, contemporary design, comfortable waiting area with warm wood accents. Professional and welcoming atmosphere. Natural light through large windows. Horizontal 16:9. Shot on 35mm film.",
    "belleza": "Hyperrealistic photography of a stylish hair salon interior in Madrid 2026. Modern mirrors, clean stations, warm lighting, contemporary design with plants. Professional and trendy atmosphere. Natural tones, wood and white palette. Horizontal 16:9. Shot on 35mm film.",
    "deporte": "Hyperrealistic photography of a modern gym fitness area in Madrid 2026. Clean equipment, functional training zone, natural light, industrial-modern interior. Energy and motivation atmosphere. Horizontal 16:9. Shot on 35mm film, warm tones.",
    "mascotas": "Hyperrealistic photography of a friendly veterinary clinic waiting room in Madrid 2026. Warm welcoming interior, pet-friendly design, comfortable seating, a golden retriever sitting calmly. Modern and clean. Horizontal 16:9. Shot on 35mm film.",
    "hogar": "Hyperrealistic photography of a well-organized hardware store interior in Madrid 2026. Tools displayed on walls, wood shelves, warm lighting, professional organization. Traditional meets modern. Horizontal 16:9. Shot on 35mm film.",
    "servicios-profesionales": "Hyperrealistic photography of a modern law office in Madrid 2026. Clean desk, bookshelf with legal books, warm wood tones, professional atmosphere. Natural light from window showing urban Madrid view. Horizontal 16:9. Shot on 35mm film.",
    "ocio": "Hyperrealistic photography of a lively neighborhood bar terrace in Madrid 2026. Evening golden hour, happy people, contemporary outdoor seating, string lights, urban greenery. Warm Mediterranean atmosphere. Horizontal 16:9. Shot on 35mm film.",
    "moda": "Hyperrealistic photography of a boutique clothing store interior in Madrid 2026. Curated displays, warm lighting, minimalist design, wood and white palette. Contemporary fashion retail. Horizontal 16:9. Shot on 35mm film.",
    "automocion": "Hyperrealistic photography of a clean modern car workshop in Madrid 2026. Professional mechanics, organized tools, car on lift, natural light from large garage door. Industrial-modern aesthetic. Horizontal 16:9. Shot on 35mm film.",
}


def generate_image(prompt, filename):
    """Genera una imagen con Nano Banana 2."""
    filepath = IMAGES_DIR / filename
    if filepath.exists():
        print(f"  Ya existe: {filename}")
        return True

    try:
        resp = requests.post(
            ENDPOINT,
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"responseModalities": ["IMAGE", "TEXT"]},
            },
            timeout=60,
        )
        resp.raise_for_status()
        data = resp.json()

        # Extraer imagen del response
        for candidate in data.get("candidates", []):
            for part in candidate.get("content", {}).get("parts", []):
                if "inlineData" in part:
                    img_data = base64.b64decode(part["inlineData"]["data"])
                    filepath.write_bytes(img_data)
                    size_kb = len(img_data) / 1024
                    print(f"  Generada: {filename} ({size_kb:.0f} KB)")
                    return True

        print(f"  Sin imagen en response: {filename}")
        return False
    except Exception as e:
        print(f"  Error: {filename} — {e}")
        return False


def main():
    os.chdir(Path(__file__).parent.parent)
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    print("=== Generando hero images por categoria ===\n")

    generated = []
    for cat_slug, prompt in CATEGORY_PROMPTS.items():
        filename = f"{cat_slug}.jpg"
        print(f"Categoria: {cat_slug}")
        if generate_image(prompt, filename):
            generated.append(cat_slug)
        time.sleep(3)  # Rate limit

    print(f"\n  Generadas: {len(generated)}/{len(CATEGORY_PROMPTS)}")

    # Asignar imagenes de categoria a negocios sin imagen
    print("\n=== Asignando imagenes a negocios sin foto ===")
    with open(DATA_FILE) as f:
        negocios = json.load(f)

    updated = 0
    for negocio in negocios:
        if not negocio.get("image"):
            cat = negocio["category"]
            cat_image = f"/images/categorias/{cat}.jpg"
            img_file = IMAGES_DIR / f"{cat}.jpg"
            if img_file.exists():
                negocio["image"] = cat_image
                updated += 1

    with open(DATA_FILE, "w") as f:
        json.dump(negocios, f, indent=2, ensure_ascii=False)

    print(f"  {updated} negocios con imagen de categoria asignada")
    print("\n=== Completado ===")


if __name__ == "__main__":
    main()
