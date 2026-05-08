#!/usr/bin/env python3
"""Verificacion Places API para los 6 grupos residuales.

Para cada slug, Text Search con su (name, address) y reporta:
  place_id, displayName, formattedAddress, websiteUri, n_photos

Permite decidir identidad real cruzando place_ids.
"""
import json, os, sys
from pathlib import Path
import requests
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")
API_KEY = os.environ["GOOGLE_PLACES_API_KEY"]
DATA_FILE = ROOT / "src" / "data" / "negocios.json"

SLUGS = [
    "cerveceria-la-galerna",
    "los-fogones-canaveral",
    "clinica-fisioterapia-prolive",
    "clinica-muv-canaveral",
    "mardones-y-martinez-dental",
    "dentistaelcanaveral-consultorio",
    "ikigai-dental-canaveral",
    "ikigai-dental-canaveral-v2",
    "megafruta-2",
    "megafruta-canaveral",
    "estanco-el-canaveral",
    "supermercado-el-canaveral",
]

URL = "https://places.googleapis.com/v1/places:searchText"
LOCATION_BIAS = {
    "circle": {"center": {"latitude": 40.4300, "longitude": -3.5790}, "radius": 10000.0}
}
FIELDS = "places.id,places.displayName,places.formattedAddress,places.websiteUri,places.photos,places.nationalPhoneNumber"


def search(name, address, override_query=None):
    q = override_query or (f"{name} {address}" if address else f"{name} El Cañaveral Madrid")
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask": FIELDS,
    }
    payload = {
        "textQuery": q,
        "languageCode": "es",
        "regionCode": "es",
        "locationBias": LOCATION_BIAS,
        "maxResultCount": 3,  # ver alternativas
    }
    r = requests.post(URL, json=payload, headers=headers, timeout=20)
    if r.status_code != 200:
        return {"error": f"{r.status_code}: {r.text[:200]}"}
    return r.json()


def main():
    data = json.load(open(DATA_FILE))
    by_slug = {n["slug"]: n for n in data}
    print(f"Audit Places API — {len(SLUGS)} slugs residuales\n")
    overrides = {
        # Los Fogones address corregido por John
        "los-fogones-canaveral": "Los Fogones Calle Enrique Urquijo 170 Madrid",
        # Megafruta-2 con address explícito Victoria Kent 5
        "megafruta-2": "Megafruta Calle Victoria Kent 5 Madrid",
    }
    for slug in SLUGS:
        n = by_slug[slug]
        name = n["name"]
        addr = n.get("address", "")
        q_override = overrides.get(slug)
        q_used = q_override or f"{name} {addr}".strip()
        print(f"=== {slug}")
        print(f"  json: name={name!r}")
        print(f"        address={addr!r}")
        print(f"        web={n.get('website', '-')}")
        print(f"  query → {q_used!r}")
        res = search(name, addr, q_override)
        if "error" in res:
            print(f"  ERROR: {res['error']}")
            continue
        places = res.get("places") or []
        if not places:
            print("  ✗ NO RESULTS")
            continue
        for i, p in enumerate(places):
            dn = (p.get("displayName") or {}).get("text", "?")
            print(f"  [{i}] place_id={p.get('id')}")
            print(f"      name={dn!r}")
            print(f"      addr={p.get('formattedAddress')!r}")
            print(f"      web={p.get('websiteUri', '-')}")
            print(f"      tel={p.get('nationalPhoneNumber', '-')}")
            print(f"      photos={len(p.get('photos') or [])}")
        print()


if __name__ == "__main__":
    main()
