#!/usr/bin/env python3
"""
Enriquece negocios.json con datos REALES de Google Maps via Apify
(actor compass/crawler-google-places), e idempotente vía place_id.

Resuelve los gaps críticos para los listicles:
  rating (totalScore), numReviews (reviewsCount), phone, website,
  googleCategory, horario (openingHours), placeId, lat, lng.

Modos:
  --mode enrich    (default) Busca cada negocio existente por "nombre, dirección"
                   (1 resultado/search) y rellena/refresca sus campos.
  --mode discover  Busca por término + zona y lista negocios que AÚN NO están
                   en negocios.json (para descubrir lo que falta). No escribe.

Disciplina de pilot (validar coste en CU ANTES de escalar):
  - Por defecto NO escribe: usa --write para persistir.
  - Acota con --limit / --category / --slug.
  - Imprime el coste del run (USD + compute units) que reporta Apify.

Ejemplos:
  # Pilot acotado, dry-run (no escribe, no toca datos):
  python scripts/apify_enrich.py --mode enrich --category restaurantes --limit 5

  # Igual pero persistiendo los cambios:
  python scripts/apify_enrich.py --mode enrich --category restaurantes --limit 5 --write

  # Descubrir farmacias/autoescuelas que faltan:
  python scripts/apify_enrich.py --mode discover --search "farmacia" --location "El Cañaveral, Madrid"
"""

import argparse
import json
import os
import sys
import time
import unicodedata
from pathlib import Path

import requests
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

APIFY_TOKEN = os.environ.get("APIFY_TOKEN")
if not APIFY_TOKEN:
    sys.exit("ERROR: falta APIFY_TOKEN en .env (ver .env.cloud.example)")

DATA_FILE = ROOT / "src" / "data" / "negocios.json"
ACTOR = "compass~crawler-google-places"  # Google Maps Scraper
API = "https://api.apify.com/v2"
DEFAULT_LOCATION = "El Cañaveral, Madrid, España"


# ----------------------------- utilidades --------------------------------- #
def norm(s: str) -> str:
    """minúsculas, sin acentos, sin signos — para casar nombres."""
    s = unicodedata.normalize("NFKD", str(s or "")).encode("ascii", "ignore").decode()
    return "".join(c for c in s.lower() if c.isalnum() or c == " ").strip()


def fmt_hours(opening) -> str | None:
    """openingHours del actor → string compacto 'L-D ...' o None."""
    if not opening or not isinstance(opening, list):
        return None
    dias = {"Monday": "L", "Tuesday": "M", "Wednesday": "X", "Thursday": "J",
            "Friday": "V", "Saturday": "S", "Sunday": "D"}
    partes = []
    for d in opening:
        day = dias.get(d.get("day"), d.get("day", "")[:2])
        hrs = d.get("hours", "")
        if hrs:
            partes.append(f"{day} {hrs}")
    return " · ".join(partes) if partes else None


# ----------------------------- Apify -------------------------------------- #
def run_actor(run_input: dict, wait_secs: int = 600) -> tuple[list, dict]:
    """Lanza el actor, espera, y devuelve (items, stats). stats incluye coste."""
    print(f"  → lanzando actor {ACTOR} …")
    r = requests.post(
        f"{API}/acts/{ACTOR}/runs",
        params={"token": APIFY_TOKEN},
        json=run_input,
        timeout=30,
    )
    r.raise_for_status()
    run = r.json()["data"]
    run_id, ds_id = run["id"], run["defaultDatasetId"]
    print(f"    run id: {run_id}")

    waited = 0
    status = run["status"]
    while status in ("READY", "RUNNING") and waited < wait_secs:
        time.sleep(5)
        waited += 5
        s = requests.get(f"{API}/actor-runs/{run_id}",
                         params={"token": APIFY_TOKEN}, timeout=30).json()["data"]
        status = s["status"]
        print(f"    … {status} ({waited}s)")

    info = requests.get(f"{API}/actor-runs/{run_id}",
                        params={"token": APIFY_TOKEN}, timeout=30).json()["data"]
    stats = {
        "status": info["status"],
        "usd": info.get("usageTotalUsd"),
        "computeUnits": (info.get("stats") or {}).get("computeUnits"),
    }

    items = requests.get(f"{API}/datasets/{ds_id}/items",
                         params={"token": APIFY_TOKEN, "clean": "true"},
                         timeout=60).json()
    return items, stats


def fetch_run_items(run_id: str) -> tuple[list, dict]:
    """Re-usa los resultados de un run YA pagado (sin re-crawlear → gratis)."""
    info = requests.get(f"{API}/actor-runs/{run_id}",
                        params={"token": APIFY_TOKEN}, timeout=30).json()["data"]
    ds_id = info["defaultDatasetId"]
    items = requests.get(f"{API}/datasets/{ds_id}/items",
                         params={"token": APIFY_TOKEN, "clean": "true"},
                         timeout=60).json()
    stats = {"status": info["status"], "usd": 0.0, "computeUnits": 0.0}
    return items, stats


# --------------------------- modo enrich ---------------------------------- #
def select_targets(negocios, args):
    if args.slug:
        return [n for n in negocios if n["slug"] == args.slug]
    if args.slugs:
        wanted = {s.strip() for s in args.slugs.split(",") if s.strip()}
        return [n for n in negocios if n["slug"] in wanted]
    targets = negocios
    if args.category:
        targets = [n for n in targets if n.get("category") == args.category]
    if args.only_missing:
        targets = [n for n in targets if not n.get("rating") or not n.get("numReviews")]
    if args.limit:
        targets = targets[: args.limit]
    return targets


def build_diff(n: dict, place: dict, refresh_horario: bool,
               refresh_contacto: bool = False) -> dict:
    """Campos a actualizar para un negocio dado su match de Google Maps."""
    diff = {}

    def setif(key, val, fill_only=False):
        if val in (None, "", []):
            return
        if fill_only and n.get(key):
            return
        if n.get(key) != val:
            diff[key] = val

    # con --refresh-contacto el dato de Google manda (sustituye teléfonos/webs
    # inventados por la IA en enriquecimientos previos).
    fill_contacto = not refresh_contacto
    setif("rating", place.get("totalScore"))               # refresca
    setif("numReviews", place.get("reviewsCount"))         # refresca
    setif("phone", place.get("phone"), fill_only=fill_contacto)
    setif("website", place.get("website"), fill_only=fill_contacto)
    setif("placeId", place.get("placeId"))                 # clave estable
    setif("googleCategory", place.get("categoryName"))     # NO pisar categoryName del sitio
    loc = place.get("location") or {}
    setif("lat", loc.get("lat"))
    setif("lng", loc.get("lng"))
    if refresh_horario:
        h = fmt_hours(place.get("openingHours"))
        setif("horario", h)
    return diff


def match_item(n: dict, items: list) -> dict | None:
    """Empareja un negocio con el item de Apify (por searchString o por nombre)."""
    target_q = norm(f"{n['name']}, {n.get('address','')}")
    nm = norm(n["name"])
    # 1) por searchString exacto del query
    for it in items:
        if norm(it.get("searchString", "")) == target_q:
            return it
    # 2) por nombre contenido
    best = None
    for it in items:
        t = norm(it.get("title", ""))
        if t and (t == nm or nm in t or t in nm):
            best = it
            break
    return best


def mode_enrich(negocios, args):
    targets = select_targets(negocios, args)
    if not targets:
        print("No hay negocios que encajen con el filtro."); return
    print(f"Negocios a enriquecer: {len(targets)} "
          f"(de {len(negocios)}){' [solo gaps]' if args.only_missing else ''}")
    queries = [f"{n['name']}, {n.get('address','')}" for n in targets]

    run_input = {
        "searchStringsArray": queries,
        "maxCrawledPlacesPerSearch": 1,
        "language": "es",
        "maxImages": 0,            # las fotos van por fetch_places_photos.py
        "scrapeReviewsPersonalData": False,
        "skipClosedPlaces": False,
    }
    if args.location_bias:
        # constriñe la búsqueda al barrio → evita matchear fichas corporativas globales
        run_input["locationQuery"] = args.location or DEFAULT_LOCATION
    if args.from_run:
        print(f"  ♻️  re-usando run {args.from_run} (sin coste Apify)")
        items, stats = fetch_run_items(args.from_run)
    else:
        items, stats = run_actor(run_input, wait_secs=args.wait)
    print(f"\n  Apify status={stats['status']}  coste≈${stats['usd']}  "
          f"CU={stats['computeUnits']}  resultados={len(items)}\n")
    if stats["status"] != "SUCCEEDED":
        print("  Run no exitoso — abortando sin tocar datos."); return

    by_slug = {n["slug"]: n for n in negocios}
    updated, nomatch = 0, []
    for n in targets:
        it = match_item(n, items)
        if not it:
            nomatch.append(n["slug"]); print(f"  ✗ sin match: {n['slug']}"); continue
        diff = build_diff(n, it, args.refresh_horario, args.refresh_contacto)
        if not diff:
            print(f"  · {n['slug']}: ya al día"); continue
        resumen = ", ".join(f"{k}={v}" for k, v in diff.items()
                            if k not in ("lat", "lng", "placeId"))
        print(f"  ✓ {n['slug']}: {resumen or 'coords/placeId'}")
        if args.write:
            by_slug[n["slug"]].update(diff)
        updated += 1

    print(f"\n=== enrich {'(ESCRITO)' if args.write else '(dry-run)'} ===")
    print(f"  Actualizables: {updated}  ·  Sin match: {len(nomatch)}")
    if nomatch:
        print(f"  Sin match: {', '.join(nomatch)}")
    if args.write and updated:
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(negocios, f, indent=2, ensure_ascii=False)
            f.write("\n")
        print(f"  → guardado {DATA_FILE}")
    elif updated:
        print("  (usa --write para persistir)")


# --------------------------- modo discover -------------------------------- #
def mode_discover(negocios, args):
    terms = ([s.strip() for s in args.searches.split(",") if s.strip()]
             if args.searches else ([args.search] if args.search else None))
    if not terms:
        sys.exit("--mode discover requiere --search 'término' o --searches 'a,b,c'")
    location = args.location or DEFAULT_LOCATION
    print(f"Descubriendo {len(terms)} términos en '{location}' (máx {args.max_places}/término)")
    run_input = {
        "searchStringsArray": terms,
        "locationQuery": location,
        "maxCrawledPlacesPerSearch": args.max_places,
        "language": "es",
        "maxImages": 0,
        "skipClosedPlaces": True,
    }
    items, stats = run_actor(run_input, wait_secs=args.wait)
    print(f"\n  Apify status={stats['status']}  coste≈${stats['usd']}  "
          f"CU={stats['computeUnits']}  crawleados={len(items)}\n")

    known = {norm(n["name"]) for n in negocios}
    known_pid = {n.get("placeId") for n in negocios if n.get("placeId")}
    seen, nuevos = set(), []
    for it in items:
        pid, t = it.get("placeId"), it.get("title", "")
        if pid in known_pid or norm(t) in known:      # ya en el directorio
            continue
        if pid and pid in seen:                        # duplicado entre términos
            continue
        if pid:
            seen.add(pid)
        nuevos.append(it)

    from collections import defaultdict
    groups = defaultdict(list)
    for it in nuevos:
        groups[it.get("searchString", "?")].append(it)

    print(f"=== NUEVOS (no en el directorio): {len(nuevos)} / {len(items)} crawleados ===")
    for term in terms:
        g = groups.get(term, [])
        print(f"\n  [{term}] — {len(g)} nuevos")
        for it in sorted(g, key=lambda x: -(x.get("reviewsCount") or 0)):
            web = "web" if it.get("website") else "SIN WEB"
            print(f"    + {it.get('title')} | ⭐{it.get('totalScore')} "
                  f"({it.get('reviewsCount')}) | {web} | {it.get('address','')}")

    out = Path(args.out) if args.out else (ROOT / "prospecting" / "descubrimientos.json")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(nuevos, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n  → {len(nuevos)} candidatos volcados a {out}")


# ------------------------------- main ------------------------------------- #
def main():
    p = argparse.ArgumentParser()
    p.add_argument("--mode", choices=["enrich", "discover"], default="enrich")
    p.add_argument("--category", help="(enrich) filtra por category del sitio")
    p.add_argument("--slug", help="(enrich) un solo negocio")
    p.add_argument("--slugs", help="(enrich) lista de slugs separados por coma")
    p.add_argument("--location-bias", action="store_true",
                   help="(enrich) añade locationQuery del barrio a la búsqueda")
    p.add_argument("--limit", type=int, help="(enrich) tope de negocios")
    p.add_argument("--only-missing", action="store_true",
                   help="(enrich) solo los que no tienen rating/numReviews")
    p.add_argument("--refresh-horario", action="store_true",
                   help="(enrich) sobrescribe horario con el real de Google")
    p.add_argument("--refresh-contacto", action="store_true",
                   help="(enrich) phone/website: el dato de Google manda (pisa los inventados)")
    p.add_argument("--from-run", help="(enrich) re-usa un run de Apify ya hecho (gratis)")
    p.add_argument("--write", action="store_true",
                   help="(enrich) persiste en negocios.json (por defecto dry-run)")
    p.add_argument("--search", help="(discover) un término a buscar")
    p.add_argument("--searches", help="(discover) varios términos separados por coma")
    p.add_argument("--location", help="(discover) zona; def: El Cañaveral, Madrid")
    p.add_argument("--max-places", type=int, default=10, help="(discover) tope de sitios")
    p.add_argument("--out", help="(discover) ruta JSON para volcar los nuevos")
    p.add_argument("--wait", type=int, default=600,
                   help="segundos máx. de espera al run de Apify (def: 600)")
    args = p.parse_args()

    with open(DATA_FILE, encoding="utf-8") as f:
        negocios = json.load(f)

    if args.mode == "enrich":
        mode_enrich(negocios, args)
    else:
        mode_discover(negocios, args)


if __name__ == "__main__":
    main()
