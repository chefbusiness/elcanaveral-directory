#!/usr/bin/env python3
"""
Procesa el favicon-raw.png generado por Nano Banana 2 y produce los archivos finales:
- public/favicon.ico (16x16 + 32x32 multi-size)
- public/favicon-32.png
- public/favicon-16.png
- public/apple-touch-icon.png (180x180)
- public/favicon.svg (referencia simple, opcional)

Estrategia: recorte cuadrado centrado de la zona del pin + escalado con LANCZOS.
"""

from pathlib import Path

from PIL import Image

PUBLIC = Path(__file__).resolve().parent.parent / "public"
RAW = PUBLIC / "favicon-raw.png"

if not RAW.exists():
    raise SystemExit("Falta favicon-raw.png. Corre antes generate_favicon.py")


def crop_square_around_pin(img: Image.Image) -> Image.Image:
    """El pin esta centrado horizontalmente; recortamos un cuadrado ajustado."""
    w, h = img.size
    # El pin de Nano Banana queda centrado horizontalmente y ligeramente bajo el centro vertical.
    # Recorte cuadrado tomando 78% del lado mas corto, centrado un poco abajo del centro.
    side = int(min(w, h) * 0.78)
    cx = w // 2
    cy = int(h * 0.52)
    left = max(0, cx - side // 2)
    top = max(0, cy - side // 2)
    right = min(w, left + side)
    bottom = min(h, top + side)
    return img.crop((left, top, right, bottom))


def main():
    img = Image.open(RAW).convert("RGBA")
    print(f"RAW: {img.size}")

    cropped = crop_square_around_pin(img)
    print(f"Cropped: {cropped.size}")

    # 32x32 PNG
    f32 = cropped.resize((32, 32), Image.LANCZOS)
    f32.save(PUBLIC / "favicon-32.png", "PNG", optimize=True)

    # 16x16 PNG
    f16 = cropped.resize((16, 16), Image.LANCZOS)
    f16.save(PUBLIC / "favicon-16.png", "PNG", optimize=True)

    # 180x180 apple-touch-icon
    f180 = cropped.resize((180, 180), Image.LANCZOS)
    f180.save(PUBLIC / "apple-touch-icon.png", "PNG", optimize=True)

    # 512x512 PWA / OG fallback
    f512 = cropped.resize((512, 512), Image.LANCZOS)
    f512.save(PUBLIC / "favicon-512.png", "PNG", optimize=True)

    # ICO multi-size (16+32+48)
    f48 = cropped.resize((48, 48), Image.LANCZOS)
    f32.save(
        PUBLIC / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
        append_images=[f16, f48],
    )

    for name in ("favicon.ico", "favicon-16.png", "favicon-32.png",
                 "favicon-512.png", "apple-touch-icon.png"):
        p = PUBLIC / name
        print(f"  {name}: {p.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
