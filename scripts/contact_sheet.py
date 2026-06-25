#!/usr/bin/env python3
"""
Genera una hoja de contacto (grid etiquetado) de las fotos HERO de una
categoría, ordenada por puntuación bayesiana. Para validar a ojo que cada
foto corresponde al negocio correcto antes de publicar.

Uso:
  python scripts/contact_sheet.py --category restaurantes --out /tmp/sheet.png
"""
import argparse, json, statistics
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src" / "data" / "negocios.json"
PUB = ROOT / "public"

CELL_W, CELL_H, LABEL_H, PAD, COLS = 360, 240, 56, 14, 4

def font(sz, bold=False):
    base = "/usr/share/fonts/truetype/dejavu/"
    f = base + ("DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf")
    try: return ImageFont.truetype(f, sz)
    except Exception: return ImageFont.load_default()

def bayes_order(items):
    rated = [x for x in items if x.get("rating") and x.get("numReviews")]
    if not rated: return items
    C = sum(x["rating"] for x in rated) / len(rated)
    m = statistics.median(x["numReviews"] for x in rated)
    def sc(x): v, R = x["numReviews"], x["rating"]; return (v/(v+m))*R + (m/(v+m))*C
    rated.sort(key=sc, reverse=True)
    return rated + [x for x in items if x not in rated]

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--category", required=True)
    p.add_argument("--out", default="/tmp/contact_sheet.png")
    args = p.parse_args()

    negocios = json.load(open(DATA, encoding="utf-8"))
    items = bayes_order([n for n in negocios if n.get("category") == args.category])
    rows = (len(items) + COLS - 1) // COLS
    title_h = 60
    W = COLS * CELL_W + (COLS + 1) * PAD
    H = title_h + rows * (CELL_H + LABEL_H + PAD) + PAD

    canvas = Image.new("RGB", (W, H), (245, 243, 240))
    draw = ImageDraw.Draw(canvas)
    draw.text((PAD, 18), f"{args.category.upper()} El Cañaveral — fotos por placeId (orden = ranking bayesiano)",
              fill=(41, 82, 163), font=font(26, True))

    for i, n in enumerate(items):
        r, c = divmod(i, COLS)
        x = PAD + c * (CELL_W + PAD)
        y = title_h + r * (CELL_H + LABEL_H + PAD)
        img_path = PUB / (n.get("image") or "").lstrip("/")
        if img_path.exists():
            try:
                im = ImageOps.fit(Image.open(img_path).convert("RGB"),
                                  (CELL_W, CELL_H), Image.LANCZOS)
                canvas.paste(im, (x, y))
            except Exception:
                draw.rectangle([x, y, x+CELL_W, y+CELL_H], fill=(200,200,200))
        else:
            draw.rectangle([x, y, x+CELL_W, y+CELL_H], fill=(210,180,180))
            draw.text((x+10, y+10), "SIN FOTO", fill=(150,0,0), font=font(20, True))
        # etiqueta
        ly = y + CELL_H + 4
        rating = n.get("rating"); rev = n.get("numReviews")
        stars = f"  {rating}★ ({rev})" if rating else "  sin nota"
        draw.text((x, ly), f"#{i+1}  {n['name'][:34]}", fill=(20,20,20), font=font(18, True))
        draw.text((x, ly+24), f"{n.get('zonaName','')}{stars}  ·  {n.get('googleCategory','')[:24]}",
                  fill=(90,90,90), font=font(15))

    canvas.save(args.out, "PNG")
    print(f"  ✓ {args.out}  ({len(items)} fichas, {W}x{H})")

if __name__ == "__main__":
    main()
