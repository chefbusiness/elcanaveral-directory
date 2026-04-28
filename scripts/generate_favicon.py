#!/usr/bin/env python3
"""
Genera el favicon de elcanaveral.info con Nano Banana 2 (Gemini 3.1 Flash Image Preview).

Concepto: pin de ubicacion azul (#2952a3) sobre un fragmento de mapa estilizado del barrio,
fondo limpio compatible con tabs claros y oscuros. Cuadrado, alto contraste, legible a 16px.

Uso:
    GEMINI_API_KEY=... python3 scripts/generate_favicon.py
"""

import base64
import os
import sys
from pathlib import Path

import requests

API_KEY = os.environ.get("GEMINI_API_KEY", "")
if not API_KEY:
    print("ERROR: GEMINI_API_KEY no esta definida en el entorno", file=sys.stderr)
    sys.exit(1)

ENDPOINT = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-3.1-flash-image-preview:generateContent?key=" + API_KEY
)
PUBLIC = Path(__file__).resolve().parent.parent / "public"
RAW_OUT = PUBLIC / "favicon-raw.png"

PROMPT = (
    "Vector flat illustration of a single bold map location pin, color hex #2952a3 "
    "(deep royal blue), with a small white circle in its center, casting a soft subtle shadow. "
    "The pin is centered over a stylized minimalist map fragment showing 3-4 light gray "
    "geometric streets crossing in a grid pattern (PAU urban district). "
    "Background is pure white with a very subtle warm cream tint. "
    "High contrast, ultra clean, modern flat design, no text, no letters, no labels. "
    "Square 1:1 composition, the pin occupies 60% of the canvas height and is perfectly centered. "
    "Designed to remain legible at 16x16 pixels as a website favicon. "
    "Sharp edges, vector style, premium tech directory branding. Avoid clutter and tiny details."
)


def main():
    print("Generando favicon con Nano Banana 2...")
    resp = requests.post(
        ENDPOINT,
        json={
            "contents": [{"parts": [{"text": PROMPT}]}],
            "generationConfig": {"responseModalities": ["IMAGE", "TEXT"]},
        },
        timeout=120,
    )
    if resp.status_code != 200:
        print(f"ERROR HTTP {resp.status_code}: {resp.text[:500]}", file=sys.stderr)
        sys.exit(2)

    data = resp.json()
    parts = data["candidates"][0]["content"]["parts"]
    img_b64 = None
    for part in parts:
        inline = part.get("inlineData") or part.get("inline_data")
        if inline and "data" in inline:
            img_b64 = inline["data"]
            break
    if not img_b64:
        print("ERROR: respuesta sin imagen", file=sys.stderr)
        print(data, file=sys.stderr)
        sys.exit(3)

    RAW_OUT.write_bytes(base64.b64decode(img_b64))
    print(f"Guardado RAW: {RAW_OUT} ({RAW_OUT.stat().st_size / 1024:.1f} KB)")
    print("Siguiente paso: redimensionar con Pillow a 16/32/180px y empaquetar en .ico/.png")


if __name__ == "__main__":
    main()
