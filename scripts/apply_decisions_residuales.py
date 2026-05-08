#!/usr/bin/env python3
"""Aplicar decisiones autónomas tras audit Places API (2026-05-08).

1. Corregir addresses verificadas en Places.
2. Eliminar 4 fichas: prolive (otro distrito), dentistaelcanaveral (portal SEO),
   ikigai v1 (duplicada de v2), megafruta-2 (fantasma).
3. Eliminar archivos de imagen de los slugs eliminados.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = ROOT / "src" / "data" / "negocios.json"
IMAGES_DIR = ROOT / "public" / "images" / "negocios"

ADDRESS_FIXES = {
    "los-fogones-canaveral": "C. de Enrique Urquijo, 170, Vicálvaro, 28052 Madrid",
    "clinica-muv-canaveral": "C. Victoria Kent, Local 8, Vicálvaro, 28052 Madrid",
    "estanco-el-canaveral": "Av. de Blas de Lezo, 74, Vicálvaro, 28052 Madrid",
    "supermercado-el-canaveral": "C. Ferenc Puskas, 245, Vicálvaro, 28052 Madrid",
    "mardones-y-martinez-dental": "C. Victoria Kent, 75, local 9, Vicálvaro, 28052 Madrid",
}

DELETE_SLUGS = {
    "clinica-fisioterapia-prolive",
    "dentistaelcanaveral-consultorio",
    "ikigai-dental-canaveral",
    "megafruta-2",
}


def main():
    data = json.load(open(DATA_FILE, encoding="utf-8"))
    print(f"Total negocios antes: {len(data)}")

    # 1. Corregir addresses
    fixed = 0
    for n in data:
        if n["slug"] in ADDRESS_FIXES:
            old = n.get("address", "")
            new = ADDRESS_FIXES[n["slug"]]
            if old != new:
                print(f"  ✓ address fix: {n['slug']}")
                print(f"      {old!r}")
                print(f"      → {new!r}")
                n["address"] = new
                fixed += 1
    print(f"Addresses corregidas: {fixed}")

    # 2. Eliminar fichas
    deleted_slugs = []
    new_data = []
    for n in data:
        if n["slug"] in DELETE_SLUGS:
            deleted_slugs.append(n["slug"])
            print(f"  ✗ DELETE ficha: {n['slug']} ({n['name']})")
        else:
            new_data.append(n)
    print(f"Fichas eliminadas: {len(deleted_slugs)}")
    print(f"Total negocios después: {len(new_data)}")

    # 3. Eliminar imágenes de slugs borrados
    img_count = 0
    for slug in deleted_slugs:
        for img in IMAGES_DIR.glob(f"{slug}.jpg"):
            img.unlink()
            print(f"    rm {img.name}")
            img_count += 1
        for img in IMAGES_DIR.glob(f"{slug}-*.jpg"):
            img.unlink()
            print(f"    rm {img.name}")
            img_count += 1
    print(f"Imágenes eliminadas: {img_count}")

    # 4. Guardar JSON
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(new_data, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"✓ {DATA_FILE} guardado")


if __name__ == "__main__":
    main()
