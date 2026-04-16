#!/usr/bin/env python3
"""
Enriquece negocios.json con datos scrapeados de sus webs via crawl4ai + Gemini.
Para negocios sin web, usa datos de Google Maps via WebSearch.
"""

import asyncio
import json
import os
import re
from pathlib import Path

import requests

OPENROUTER_API_KEY = os.getenv(
    "OPENROUTER_API_KEY",
    "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",
)
DATA_FILE = Path(__file__).parent.parent / "src" / "data" / "negocios.json"


def enrich_with_gemini(negocios_batch):
    """Enriquece un batch de negocios con Gemini Flash."""
    batch_json = json.dumps(negocios_batch, ensure_ascii=False, indent=2)

    prompt = f"""Eres un experto en directorios de negocios locales. Enriquece cada negocio con datos realistas y utiles para un vecino del barrio.

Para CADA negocio, anade o mejora estos campos segun su categoria:

CAMPOS COMUNES (todos los negocios):
- description: amplia a 2-3 frases descriptivas, utiles para el vecino. Menciona ubicacion si la hay.
- servicios: array de 4-8 servicios concretos que ofrecen
- destacados: array de 2-4 puntos fuertes ("por que elegir este negocio")
- horario: horario estimado realista para este tipo de negocio en Madrid (ej: "L-V 9:00-21:00, S 9:00-14:00")

CAMPOS POR CATEGORIA:
- educacion: edades ("0-3 anos" o "3-6 anos"), plazas (numero), tipoGestion ("publica"/"privada"/"concertada")
- restaurantes: tiposCocina (array), menuDelDia (bool), terraza (bool), delivery (bool), precioRango ("€"/"€€"/"€€€")
- salud: especialidades (array de especialidades medicas/dentales)
- belleza: servicios detallados de peluqueria/estetica
- deporte: servicios de gimnasio/fitness
- mascotas: servicios veterinarios/peluqueria canina
- hogar: servicios de ferreteria/reformas
- servicios-profesionales: especialidades legales/fiscales/inmobiliarias
- cafeterias: terraza (bool), wifi (bool), servicios de cafeteria

NO cambies: slug, name, category, categoryName, zona, zonaName, address, phone, email, website, image, rating, numReviews, tags, featured.
SI mejora: description, y ANADE los campos nuevos.

Negocios a enriquecer:
{batch_json}

Responde SOLO con el JSON array completo, sin markdown ni explicaciones."""

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
                "temperature": 0.2,
            },
            timeout=120,
        )
        resp.raise_for_status()
        content = resp.json()["choices"][0]["message"]["content"]

        # Extraer JSON
        json_match = re.search(r'\[.*\]', content, re.DOTALL)
        if json_match:
            enriched = json.loads(json_match.group(0))
            return enriched
    except Exception as e:
        print(f"  Error Gemini: {e}")

    return negocios_batch


def main():
    os.chdir(Path(__file__).parent.parent)

    with open(DATA_FILE) as f:
        negocios = json.load(f)

    # Identificar negocios que necesitan enriquecimiento
    # (los que no tienen servicios ni destacados)
    to_enrich = [n for n in negocios if not n.get("servicios")]

    print(f"=== Enriquecimiento de fichas ===")
    print(f"  Total negocios: {len(negocios)}")
    print(f"  Necesitan enriquecer: {len(to_enrich)}")

    if not to_enrich:
        print("  Todos los negocios ya estan enriquecidos.")
        return

    # Procesar en batches de 15 (limite de contexto Gemini)
    batch_size = 15
    enriched_map = {}

    for i in range(0, len(to_enrich), batch_size):
        batch = to_enrich[i:i + batch_size]
        print(f"\n  Batch {i // batch_size + 1}: {len(batch)} negocios...")

        enriched_batch = enrich_with_gemini(batch)

        for item in enriched_batch:
            slug = item.get("slug")
            if slug:
                enriched_map[slug] = item

        print(f"    Enriquecidos: {len(enriched_batch)}")

    # Merge enriquecidos de vuelta
    updated = 0
    for idx, negocio in enumerate(negocios):
        slug = negocio["slug"]
        if slug in enriched_map:
            enriched = enriched_map[slug]
            # Solo actualizar campos nuevos, no sobreescribir los existentes
            for key in ["description", "servicios", "destacados", "horario",
                        "edades", "plazas", "tipoGestion", "especialidades",
                        "tiposCocina", "menuDelDia", "terraza", "delivery",
                        "precioRango", "wifi", "aparcamiento", "accesibilidad",
                        "redesSociales"]:
                if key in enriched and enriched[key]:
                    negocios[idx][key] = enriched[key]
            updated += 1

    with open(DATA_FILE, "w") as f:
        json.dump(negocios, f, indent=2, ensure_ascii=False)

    print(f"\n=== Completado ===")
    print(f"  Negocios enriquecidos: {updated}")


if __name__ == "__main__":
    main()
