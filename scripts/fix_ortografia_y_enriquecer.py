#!/usr/bin/env python3
"""
1. Corrige ortografía española (acentos, eñes) en TODOS los negocios
2. Enriquece negocios incompletos (servicios, horarios, descripciones)
"""

import json
import os
import re
from pathlib import Path
import requests

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
DATA_FILE = Path(__file__).parent.parent / "src" / "data" / "negocios.json"


def fix_batch(negocios_batch):
    batch_json = json.dumps(negocios_batch, ensure_ascii=False, indent=2)

    prompt = f"""Eres un editor de textos en español de España (no latinoamericano).

TAREA 1 — ORTOGRAFÍA: Corrige TODOS los textos sin acentos ni eñes:
- "Canaveral" → "Cañaveral"
- "Vicalvaro" → "Vicálvaro"
- "educacion" → "educación"
- "alimentacion" → "alimentación"
- "panaderia" → "panadería"
- "fruteria" → "frutería"
- "cafeteria" → "cafetería"
- "peluqueria" → "peluquería"
- "estetica" → "estética"
- "mecanico" → "mecánico"
- "automocion" → "automoción"
- "gestoria" → "gestoría"
- "clinica" → "clínica"
- "farmacia" mantiene (no lleva acento)
- "telefono" → "teléfono"
- "direccion" → "dirección"
- "informacion" → "información"
- "descripcion" → "descripción"
- "artesanal" mantiene
- "ecologico" → "ecológico"
- "domestico" → "doméstico"
- "publico" → "público" / "publica" → "pública"
- "autonomico" → "autonómico"
- "historico" → "histórico"
- "rapido" → "rápido"
- Y TODOS los demás acentos que falten en español

Aplica esto a: name, description, categoryName, zonaName, servicios[], destacados[], tags[], especialidades[], tiposCocina[], edades, tipoGestion, horario.
NO cambies: slug, category, zona, address (las direcciones se mantienen como están).

TAREA 2 — ENRIQUECER negocios que les falten campos:
- Si NO tiene "servicios": añade array de 4-6 servicios realistas
- Si NO tiene "destacados": añade array de 2-3 puntos fuertes
- Si NO tiene "horario": añade horario realista para ese tipo de negocio en Madrid
- Si "description" tiene menos de 100 caracteres: amplía a 2-3 frases descriptivas

Responde SOLO con el JSON array completo corregido y enriquecido. Sin markdown.

Negocios:
{batch_json}"""

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
            timeout=120,
        )
        resp.raise_for_status()
        content = resp.json()["choices"][0]["message"]["content"]
        json_match = re.search(r'\[.*\]', content, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(0))
    except Exception as e:
        print(f"  Error: {e}")
    return negocios_batch


def main():
    os.chdir(Path(__file__).parent.parent)

    with open(DATA_FILE) as f:
        negocios = json.load(f)

    print(f"=== Corrección ortográfica + enriquecimiento ===")
    print(f"  Total: {len(negocios)}")

    batch_size = 12
    all_fixed = []

    for i in range(0, len(negocios), batch_size):
        batch = negocios[i:i + batch_size]
        print(f"\n  Batch {i // batch_size + 1}: {len(batch)} negocios...")
        fixed = fix_batch(batch)
        all_fixed.extend(fixed)
        print(f"    Procesados: {len(fixed)}")

    # Preservar campos que Gemini no debe cambiar
    for idx, original in enumerate(negocios):
        if idx < len(all_fixed):
            fixed = all_fixed[idx]
            # Mantener slug, category, zona sin cambios
            fixed["slug"] = original["slug"]
            fixed["category"] = original["category"]
            fixed["zona"] = original["zona"]
            # Mantener image, website, email, phone, rating, numReviews, featured
            for key in ["image", "website", "email", "phone", "rating",
                        "numReviews", "featured", "address"]:
                if key in original:
                    fixed[key] = original[key]

    with open(DATA_FILE, "w") as f:
        json.dump(all_fixed if len(all_fixed) == len(negocios) else negocios,
                  f, indent=2, ensure_ascii=False)

    print(f"\n=== Completado: {len(all_fixed)} negocios procesados ===")


if __name__ == "__main__":
    main()
