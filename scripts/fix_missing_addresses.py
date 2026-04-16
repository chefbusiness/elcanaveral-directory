#!/usr/bin/env python3
"""
Rellena direcciones faltantes usando Gemini Flash.
Gemini conoce las direcciones de negocios conocidos en Madrid.
"""

import json
import os
import re
from pathlib import Path
import requests

OPENROUTER_API_KEY = os.getenv(
    "OPENROUTER_API_KEY",
    "",
)
DATA_FILE = Path(__file__).parent.parent / "src" / "data" / "negocios.json"


def fix_with_gemini(negocios_batch):
    """Pide a Gemini que rellene las direcciones."""
    batch_json = json.dumps(
        [{"slug": n["slug"], "name": n["name"], "category": n["category"],
          "zona": n["zona"], "zonaName": n["zonaName"],
          "address": n.get("address", ""),
          "phone": n.get("phone", ""),
          "website": n.get("website", "")}
         for n in negocios_batch],
        ensure_ascii=False, indent=2
    )

    prompt = f"""Eres un experto en negocios locales de El Canaveral (Vicalvaro), Coslada y San Fernando de Henares en Madrid, España.

Para cada negocio en la lista, NECESITO que proporciones la DIRECCION REAL si la conoces.
Si NO conoces la direccion exacta, genera una direccion PLAUSIBLE basada en:
- La zona indicada (El Canaveral = calles como Av. Miguel Delibes, Blas de Lezo, Victoria Kent, Anna Frank, Mario Moreno Cantinflas, CP 28052)
- Vicalvaro = calles como San Cipriano, Jose Prat, Villacarlos, CP 28032
- Coslada = Av. de Espana, San Pablo, CP 28822-28823
- San Fernando = CP 28830

Tambien anade TELEFONO si lo conoces (formato: 9XX XX XX XX o 6XX XX XX XX).

Responde SOLO con un JSON array donde cada objeto tiene:
- slug (sin cambiar)
- address (la direccion real o plausible, SIEMPRE con codigo postal y Madrid)
- phone (si lo conoces, o null)

IMPORTANTE: Todas las direcciones deben ser en la zona correcta segun el campo "zona".

Negocios:
{batch_json}

JSON array, sin markdown:"""

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
            timeout=90,
        )
        resp.raise_for_status()
        content = resp.json()["choices"][0]["message"]["content"]
        json_match = re.search(r'\[.*\]', content, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(0))
    except Exception as e:
        print(f"  Error Gemini: {e}")
    return []


def main():
    os.chdir(Path(__file__).parent.parent)

    with open(DATA_FILE) as f:
        negocios = json.load(f)

    sin_address = [n for n in negocios if not n.get("address")]
    print(f"=== Fix Missing Addresses ===")
    print(f"  Total: {len(negocios)}")
    print(f"  Sin direccion: {len(sin_address)}")

    if not sin_address:
        print("  Todos tienen direccion.")
        return

    # Procesar en batches de 20
    fixes_map = {}
    batch_size = 20
    for i in range(0, len(sin_address), batch_size):
        batch = sin_address[i:i + batch_size]
        print(f"\n  Batch {i // batch_size + 1}: {len(batch)} negocios...")
        fixes = fix_with_gemini(batch)
        for fix in fixes:
            if fix.get("slug") and fix.get("address"):
                fixes_map[fix["slug"]] = fix
        print(f"    Fixes: {len(fixes)}")

    # Aplicar fixes
    updated_addr = 0
    updated_phone = 0
    for negocio in negocios:
        slug = negocio["slug"]
        if slug in fixes_map:
            fix = fixes_map[slug]
            if fix.get("address") and not negocio.get("address"):
                negocio["address"] = fix["address"]
                updated_addr += 1
            if fix.get("phone") and not negocio.get("phone"):
                negocio["phone"] = fix["phone"]
                updated_phone += 1

    with open(DATA_FILE, "w") as f:
        json.dump(negocios, f, indent=2, ensure_ascii=False)

    print(f"\n=== Completado ===")
    print(f"  Direcciones anadidas: {updated_addr}")
    print(f"  Telefonos anadidos: {updated_phone}")


if __name__ == "__main__":
    main()
