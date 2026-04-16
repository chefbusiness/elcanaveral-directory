#!/usr/bin/env python3
"""
Descarga TODAS las imagenes hero de negocios desde el WordPress de elcanaveral.info
y actualiza negocios.json con las rutas de imagenes.
"""

import json
import os
import requests
from pathlib import Path

IMAGES_DIR = Path("public/images/negocios")
DATA_FILE = Path("src/data/negocios.json")

# Mapeo completo: slug en nuestro JSON → URL de imagen hero en WP
IMAGE_MAP = {
    # Supermercados
    "hiper-canaveral": "https://elcanaveral.info/wp-content/uploads/2025/10/AC9h4nrbnw8UdhJFkUpu7zwQPUB0MGhLUeAuqt43EZ8ihYpVKMljfCbH8sJ3aRLUL6iV1_2nmpxVQq_oR7dvOXAWycsg5Uq1zaDquu5IAAE4J9tjDiCTzYlZADrrvrkgkc-j-tzbtOGWw408-h306-k-no.jpg",
    "supermercado-el-canaveral": "https://elcanaveral.info/wp-content/uploads/2025/10/AC9h4nr8-z0Cotx342-1uXScUoCaPTBFwNEuFgCz2pHEQzwYNlrsMuf1IzFJAt6tqjzCa5PGYQci-AxOK87AG8nThSyMOSqz7hWfN5k_ioAXZxfmEtC0wZpWnWeRl7jYyx9GAlbOB73Np4RPm6Oiw408-h544-k-no.jpg",
    "coviran-plus": "https://elcanaveral.info/wp-content/uploads/2025/10/AC9h4noFsxulj57j2_Pf2uH_9v3dY7QK1-BfTJapiqed1LbIo6mT_aqUF-iRmMrH4OLymtU0RrukRufuk8OTzP492CyZwGf8tZ-uohl1O_gxG-HZW1XTFQJC98lJawM0TjLBKTA7J22pdQw408-h306-k-no.jpg",
    "ahorramas": "https://elcanaveral.info/wp-content/uploads/2025/10/AC9h4npG-xxGwx_yUCCoewy7RLHx9DQpDbCH6_pF5cNPxeIWYE3R0qGRvdN0dzt3Gx11v67g-o1k9XHHjk1IgHOSUpDlu_goI7VNGkgqrb4ya-9HHfU_Ad0_d6-mSQ0HPh3HKr_daIPkw408-h543-k-no.jpg",
    "mi-alcampo": "https://elcanaveral.info/wp-content/uploads/2025/10/AF1QipM208Jq-jW3NxrjgsYO26i5WZ79EAfUCy_jRC88w430-h240-k-no.jpg",
    "mercadona-coslada": "https://elcanaveral.info/wp-content/uploads/2025/10/AC9h4npW6KedoiVRW9mNbKt1IE2L2Ukr51M6wzZC1t3aATi1zyHAIBBpujnA7JdwLO5p2i1PTx8Mnc7WLvVViJqBeyMpYFNMnOJ6zHAeTCRcLkMtuJL8jue9SrWccAPDes32TNDn30a5Dgw426-h240-k-no.jpg",
    "casa-elias": "https://elcanaveral.info/wp-content/uploads/2025/10/AC9h4nqtd0ktgzhYzeDs8VYBr-A9Bj0aRwmTxT21_5o1JpTZjf1gqE_1qQS_WRQiE7EP4unBLV8xZPCnF2yf9Bs8hneFALoYCr63nvUr8xnZnMhtc_iSpb8N4hSXGAzh8a8kwK980JcHxNVSOd7Fw408-h725-k-no.jpg",
    # Tiendas alimentacion
    "family-mini-market": "https://elcanaveral.info/wp-content/uploads/2025/10/AF1QipO7_qb3OfSBQTn7s9njmpdbZ6UvgsvmHBdD669ww408-h306-k-no.jpg",
    "alimentacion-y-bazar": "https://elcanaveral.info/wp-content/uploads/2025/10/AC9h4noHzVV9YnnVJsMAgnF3tLWtFtzUNKbLKXGq2wB_S61ZTdbJ1mq4agwdmIIhD_pAmpPxQfz7tnfuDGANH3C_lAcUCscVx56uPV5s6BeegKh7WUs8Uq03pgkS-KEzmWGCyqrCrC7w408-h267-k-no.jpg",
    "alimentacion-canaveral": "https://elcanaveral.info/wp-content/uploads/2025/10/AC9h4np55JMBASYRWqGQhzUMz_1YcB2UfUmccQcnTmmaJ2axb2ulOsJUxWCLiQUKlAHTVILyQwET9rhitNduKNMGErdIOB3xfJPQoM3fbkdIVa73iFrSIILySg_-_JiDo8Rp3VJR8s_Ew426-h240-k-no.jpg",
    # Fruterias
    "la-fruteria-de-mama": "https://elcanaveral.info/wp-content/uploads/2025/10/AF1QipN1C0QQ5mRmDSN9tU7XwVUFSeuD_BIfUPYmVvhRw408-h544-k-no.jpg",
    "megafruta-canaveral": "https://elcanaveral.info/wp-content/uploads/2025/10/AF1QipPZLDC3YHsKFp61wifhxaD0ja8I6QYe_dNx71aiw408-h306-k-no.jpg",
    "megafruta-2": "https://elcanaveral.info/wp-content/uploads/2025/10/AF1QipN400U4jpn3SKKGmmYJSJwjmPuSn4vnluFN034lw408-h306-k-no.jpg",
    "frutas-y-verduras-vida-sana": "https://elcanaveral.info/wp-content/uploads/2025/10/AF1QipOKb_o4XIvNi5IhszXM6KoXgT4cfVOYWVgfQzqMw408-h306-k-no.jpg",
    "fruteria-charcuteria-el-canaveral": "https://elcanaveral.info/wp-content/uploads/2025/10/AF1QipOXJKL7SQ6LjzwrKArj5D7JPCLBq0qdt6ftEvRJw408-h306-k-no.jpg",
    # Panaderias (ya descargadas, pero por completitud)
    "levaduramadre": "https://elcanaveral.info/wp-content/uploads/2025/10/AC9h4nphTKxb3QKzRG7vZsYzyQ9RDgA-MrII4hQueOSAo6K_8THe_FxteW-wrBp8JztFDV6U9v3pEu4M4gY9PTpgb1euojoKMrzscvz_AngYOkt7l3YXXWHnm-drJnHyxYIdnUWzepqOIgFlZTGBw408-h544-k-no.jpg",
    "el-horno-de-izan-iii": "https://elcanaveral.info/wp-content/uploads/2025/10/AF1QipM52cEjC5DqXB_7s8WXrbT2YaEIxQXbMk794hJrw426-h240-k-no.jpg",
    "caprichos-coffee-bakery": "https://elcanaveral.info/wp-content/uploads/2025/10/AF1QipPo2vwj9sNuny-iMA2J4OSvD9oBfE5eQ2zP3Ci6w408-h408-k-no.jpg",
    "obrador-de-goya": "https://elcanaveral.info/wp-content/uploads/2025/10/AC9h4nqX2OFZ5yJB6MxaABbIHFr4ny7TouYfXVIT6D6wzPhhRzArmeRVPBLy8-i9f5Tt0YubM28GqzsLH9S6oZnLSFoUU9v7edq0aBbA9w9t_k5lIs8GOe6AoUcluFxat9P-jLvlvc0w408-h306-k-no.jpg",
    "panaderia-bulevar": "https://elcanaveral.info/wp-content/uploads/2025/10/panaderia-vicalvaro.jpeg",
    "fabricacion-y-distribucion-panaderia": "https://elcanaveral.info/wp-content/uploads/2025/10/panaderia-vicalvaro.jpeg",
    # Cafeterias
    "mimarutxa": "https://elcanaveral.info/wp-content/uploads/2025/10/AF1QipMF62J2yNYiJ9zOeq9f-k-QAke7RaZyBILdslmSw408-h544-k-no.jpg",
    "le-petit-cafe-de-cryss": "https://elcanaveral.info/wp-content/uploads/2025/10/AC9h4nphTKxb3QKzRG7vZsYzyQ9RDgA-MrII4hQueOSAo6K_8THe_FxteW-wrBp8JztFDV6U9v3pEu4M4gY9PTpgb1euojoKMrzscvz_AngYOkt7l3YXXWHnm-drJnHyxYIdnUWzepqOIgFlZTGBw408-h544-k-no.jpg",
    # Deporte
    "padel-el-canaveral": "https://elcanaveral.info/wp-content/uploads/2025/10/AF1QipPI9n1o1rEyvrJLWHW3evO8DQWpcoutLNxgpZeew426-h240-k-no.jpg",
}


def download_image(url, filename):
    """Descarga imagen."""
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    filepath = IMAGES_DIR / filename
    if filepath.exists():
        print(f"  Ya existe: {filename}")
        return f"/images/negocios/{filename}"
    try:
        resp = requests.get(url, timeout=30)
        resp.raise_for_status()
        filepath.write_bytes(resp.content)
        size_kb = len(resp.content) / 1024
        print(f"  Descargada: {filename} ({size_kb:.0f} KB)")
        return f"/images/negocios/{filename}"
    except Exception as e:
        print(f"  ERROR: {filename} — {e}")
        return None


def main():
    os.chdir(Path(__file__).parent.parent)

    print(f"=== Descargando {len(IMAGE_MAP)} imagenes de negocios ===\n")

    # Descargar todas
    results = {}
    for slug, url in IMAGE_MAP.items():
        ext = ".jpg"
        if url.endswith(".jpeg"):
            ext = ".jpeg"
        filename = f"{slug}{ext}"
        path = download_image(url, filename)
        if path:
            results[slug] = path

    print(f"\n  Descargadas: {len(results)}/{len(IMAGE_MAP)}")

    # Actualizar negocios.json
    print("\n=== Actualizando negocios.json ===")
    with open(DATA_FILE) as f:
        negocios = json.load(f)

    updated = 0
    for negocio in negocios:
        slug = negocio["slug"]
        if slug in results:
            negocio["image"] = results[slug]
            updated += 1

    with open(DATA_FILE, "w") as f:
        json.dump(negocios, f, indent=2, ensure_ascii=False)

    print(f"  {updated} negocios con imagen actualizada")
    print(f"\n=== Completado ===")


if __name__ == "__main__":
    main()
