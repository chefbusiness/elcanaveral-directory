#!/usr/bin/env python3
"""
Capa de leads (PRIVADA) — convierte el directorio en lista de prospección a
pie de calle para los servicios del grupo:

  - GastroSEO.com   → negocios SIN web propia (o solo redes/booking)
  - GastroLocal.pro → negocios con ficha de Google floja (pocas reseñas,
                      nota baja, sin/pocas fotos, o sin nota)
  - ChefBusiness    → negocios gastro (restaurantes, cafeterías, panaderías),
                      sobre todo los que rinden flojo

Salida en prospecting/ (gitignored, NUNCA público):
  - leads.json                      datos estructurados por negocio
  - prospeccion-elcanaveral.md      informe para visitar puerta a puerta

Uso:  python scripts/leads_prospecting.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src" / "data" / "negocios.json"
OUT = ROOT / "prospecting"
OUT.mkdir(exist_ok=True)

# Dominios que NO son una web propia (redes, booking, page builders gratis)
NO_WEB_HOSTS = ("instagram.", "facebook.", "fresha.", "eatbu.", "menufy",
                "wixsite.", "metro.bar", "linktr.ee", "booksy.", "treatwell.",
                "wellhub.", "tiktok.")
GASTRO_CATS = ("restaurantes", "cafeterias", "panaderias")


def web_status(n):
    w = (n.get("website") or "").lower()
    if not w:
        return "sin_web"
    if any(h in w for h in NO_WEB_HOSTS):
        return "solo_redes"
    return "web_propia"


def analyze(n):
    ws = web_status(n)
    rating = n.get("rating")
    revs = n.get("numReviews")
    photos = len(n.get("images") or [])
    needs_web = ws in ("sin_web", "solo_redes")

    gbp_reasons = []
    if rating is None:
        gbp_reasons.append("sin nota en Google")
    if revs is None:
        gbp_reasons.append("sin reseñas en Google")
    elif revs < 20:
        gbp_reasons.append(f"muy pocas reseñas ({revs})")
    elif revs < 50:
        gbp_reasons.append(f"pocas reseñas ({revs})")
    if rating is not None and rating < 3.8:
        gbp_reasons.append(f"nota baja ({rating}★)")
    if photos < 3:
        gbp_reasons.append(f"pocas fotos ({photos})")
    weak_gbp = len(gbp_reasons) > 0

    is_gastro = n.get("category") in GASTRO_CATS

    # Puntuación: cuanto más alta, más caliente (necesita más, pitch más claro)
    score = 0
    if ws == "sin_web":
        score += 3
    elif ws == "solo_redes":
        score += 2
    if rating is None:
        score += 2
    if revs is not None and revs < 20:
        score += 1
    if revs is not None and revs < 50:
        score += 1
    if rating is not None and rating < 3.8:
        score += 1
    if photos < 3:
        score += 1
    if is_gastro:
        score += 1

    servicios = []
    pitch = []
    if needs_web:
        servicios.append("GastroSEO")
        pitch.append("web propia" + (" (ahora solo redes)" if ws == "solo_redes" else " (no tiene)"))
    if weak_gbp:
        servicios.append("GastroLocal")
        pitch.append("mejorar ficha Google: " + ", ".join(gbp_reasons))
    if is_gastro:
        servicios.append("ChefBusiness")
        if rating is not None and rating < 4.0:
            pitch.append("consultoría gastronómica (rinde flojo)")

    temp = "🔥 caliente" if score >= 5 else ("🟠 templado" if score >= 3 else "🟡 frío")

    return {
        "slug": n["slug"], "name": n["name"], "category": n.get("category"),
        "googleCategory": n.get("googleCategory"), "zona": n.get("zonaName"),
        "address": n.get("address"), "phone": n.get("phone"),
        "rating": rating, "numReviews": revs, "photos": photos,
        "web_status": ws, "website": n.get("website"),
        "needs_web": needs_web, "weak_gbp": weak_gbp, "is_gastro": is_gastro,
        "servicios": servicios, "pitch": pitch, "score": score, "temp": temp,
    }


def md_row(l):
    web = {"sin_web": "❌ sin web", "solo_redes": "🔗 solo redes", "web_propia": "✅ web"}[l["web_status"]]
    nota = f"{l['rating']}★/{l['numReviews']}" if l["rating"] else "sin nota"
    tel = l["phone"] or "—"
    return (f"| {l['name']} | {l['zona']} | {nota} | {web} | {tel} | "
            f"{l['address'] or '—'} | {'; '.join(l['pitch'])} |")


def section(f, title, leads):
    f.write(f"\n## {title} ({len(leads)})\n\n")
    if not leads:
        f.write("_Ninguno._\n"); return
    f.write("| Negocio | Zona | Google | Web | Teléfono | Dirección | Qué ofrecer |\n")
    f.write("|---|---|---|---|---|---|---|\n")
    for l in sorted(leads, key=lambda x: -x["score"]):
        f.write(md_row(l) + "\n")


def main():
    negocios = json.load(open(DATA, encoding="utf-8"))
    leads = [analyze(n) for n in negocios]

    json.dump(leads, open(OUT / "leads.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)

    gastroseo = [l for l in leads if "GastroSEO" in l["servicios"]]
    gastrolocal = [l for l in leads if "GastroLocal" in l["servicios"]]
    chefbusiness = [l for l in leads if "ChefBusiness" in l["servicios"]]
    hot = [l for l in leads if l["score"] >= 5]

    with open(OUT / "prospeccion-elcanaveral.md", "w", encoding="utf-8") as f:
        f.write("# Prospección El Cañaveral — lista privada de leads\n\n")
        f.write("> Generado del directorio. **Privado, no publicar.** "
                "John vive en el barrio: visitas a pie. Ordenado por prioridad.\n\n")
        f.write("## Resumen\n\n")
        f.write(f"- Negocios analizados: **{len(leads)}**\n")
        f.write(f"- 🔥 Leads calientes (puntuación ≥5): **{len(hot)}**\n")
        f.write(f"- **GastroSEO** (sin web propia): **{len(gastroseo)}**\n")
        f.write(f"- **GastroLocal** (ficha Google floja): **{len(gastrolocal)}**\n")
        f.write(f"- **ChefBusiness** (gastro): **{len(chefbusiness)}**\n")

        section(f, "🔥 Leads calientes — prioridad máxima", hot)
        section(f, "🌐 GastroSEO — negocios sin web propia", gastroseo)
        section(f, "📍 GastroLocal — fichas de Google flojas", gastrolocal)
        section(f, "👨‍🍳 ChefBusiness — negocios gastronómicos", chefbusiness)
        f.write("\n---\n_Las cifras de Google cambian; re-ejecuta el script para refrescar._\n")

    print(f"✓ {OUT/'leads.json'}")
    print(f"✓ {OUT/'prospeccion-elcanaveral.md'}")
    print(f"\nResumen: {len(hot)} calientes | GastroSEO {len(gastroseo)} | "
          f"GastroLocal {len(gastrolocal)} | ChefBusiness {len(chefbusiness)}")


if __name__ == "__main__":
    main()
