#!/usr/bin/env python3
"""
Programa la publicación escalonada (drip) de las guías del blog asignando
`publishedDate` a cada una. El build oculta las de fecha futura, y la
GitHub Action las publica cuando llega su día.

Ejemplos:
  # Ver el calendario actual:
  python scripts/schedule_posts.py --show

  # Dejar restaurantes ya publicado y gotear el resto, 1 cada 2 días desde mañana:
  python scripts/schedule_posts.py --start 2026-06-26 --every 2 \
      --keep mejores-restaurantes-el-canaveral --write
"""
import argparse, json
from datetime import date, timedelta
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "src" / "data" / "listicles.json"


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--start", help="fecha de la 1ª guía a gotear (YYYY-MM-DD)")
    p.add_argument("--every", type=int, default=2, help="días entre publicaciones (def: 2)")
    p.add_argument("--keep", default="", help="slugs que NO se re-programan (coma)")
    p.add_argument("--order", default="file", choices=["file", "size"],
                   help="orden de goteo: 'file' (orden del JSON) o 'size' (más fichas primero)")
    p.add_argument("--show", action="store_true", help="solo mostrar el calendario actual")
    p.add_argument("--write", action="store_true", help="persistir los cambios")
    args = p.parse_args()

    listicles = json.load(open(DATA, encoding="utf-8"))

    if args.show or not args.start:
        print("Calendario actual:")
        for l in sorted(listicles, key=lambda x: x.get("publishedDate", "")):
            d = l.get("publishedDate", "—")
            flag = " [borrador]" if l.get("draft") else ""
            print(f"  {d}  {l['slug']}{flag}")
        if not args.start:
            return

    keep = {s.strip() for s in args.keep.split(",") if s.strip()}
    start = date.fromisoformat(args.start)

    queue = [l for l in listicles if l["slug"] not in keep]
    if args.order == "size":
        # las más completas primero (mejor primera impresión)
        queue.sort(key=lambda l: -(l.get("topN") or 99))

    print(f"\nNuevo calendario (cada {args.every} día/s desde {start}):")
    for l in listicles:
        if l["slug"] in keep:
            print(f"  {l['publishedDate']}  {l['slug']}  (sin cambios)")
    for i, l in enumerate(queue):
        d = (start + timedelta(days=i * args.every)).isoformat()
        l["publishedDate"] = d
        print(f"  {d}  {l['slug']}")

    if args.write:
        json.dump(listicles, open(DATA, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        open(DATA, "a").write("\n")
        print(f"\n✓ Guardado en {DATA}")
    else:
        print("\n(dry-run — usa --write para guardar)")


if __name__ == "__main__":
    main()
