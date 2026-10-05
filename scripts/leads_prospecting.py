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
import re
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


# --- Presencia real en el sitio (se lee del build: es la verdad, no una estimación) -------------
def mapas_del_sitio():
    """slug -> [rutas donde aparece la ficha], leídas del HTML generado (dist/)."""
    dist = ROOT / "dist"
    presencia = {}
    if not dist.exists():
        return presencia
    for html in dist.rglob("index.html"):
        rel = html.relative_to(dist).parent.as_posix()
        if rel == "." or rel.count("/") > 0:
            # Solo se consideran páginas de primer nivel o de un segmento (listados y guías)
            if not rel.startswith("blog"):
                continue
        try:
            txt = html.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        for m in re.finditer(r'href="/([a-z0-9-]+)/([a-z0-9-]+)/"', txt):
            presencia.setdefault(f"{m.group(1)}/{m.group(2)}", set()).add(rel)
    return presencia


def datos_que_faltan(n, presencia_slug):
    """Lo que le falta a su ficha para salir en los listados y filtros del sitio.

    Ojo con el sentido común: pedirle «terraza» a una escuela infantil o a una asesoría hace que el
    informe parezca hecho por un robot delante del dueño. Los datos que se sugieren dependen de la
    categoría.
    """
    falta = []
    cat = n.get("category")
    if not n.get("horarioSemanal") and not n.get("horario"):
        falta.append("horario (sin él no aparece en «abierto ahora» ni en el listado de domingos)")
    if cat in GASTRO_CATS:
        if not n.get("terraza"):
            falta.append("terraza declarada (no sale en el filtro «con terraza»)")
        if not n.get("delivery"):
            falta.append("reparto a domicilio (no sale en el filtro «a domicilio»)")
    if not n.get("accesibilidad"):
        falta.append("accesibilidad")
    if not (n.get("images") or []):
        falta.append("fotos")
    if not n.get("phone"):
        falta.append("teléfono")
    if not n.get("website"):
        falta.append("web")
    return falta


def gancho(n, presencia_slug, falta):
    """Frase de 30 segundos para enseñarle al dueño (todo verificable en pantalla)."""
    paginas = len(presencia_slug)
    trozos = []
    if paginas:
        guias = len([p for p in presencia_slug if p.startswith("blog")])
        trozos.append(f"Tu ficha ya aparece en {paginas} páginas del directorio"
                      + (f" ({guias} de ellas guías)" if guias else ""))
    if n.get("rating"):
        revs = n.get("numReviews", 0)
        miles = f"{revs:,}".replace(",", ".")
        trozos.append(f"con {n['rating']}★ y {miles} {'reseña' if revs == 1 else 'reseñas'} de Google")
    frase = ", ".join(trozos) + "." if trozos else ""
    if falta:
        frase += " Lo que le falta para que trabaje más: " + ", ".join(falta[:3]) + "."
    return frase


def analyze(n, presencia=None):
    presencia = presencia or {}
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

    clave = f"{n.get('category')}/{n.get('slug')}"
    aparece = sorted(presencia.get(clave, set()))
    falta = datos_que_faltan(n, aparece)

    return {
        "slug": n["slug"], "name": n["name"], "category": n.get("category"),
        "googleCategory": n.get("googleCategory"), "zona": n.get("zonaName"),
        "address": n.get("address"), "phone": n.get("phone"),
        "rating": rating, "numReviews": revs, "photos": photos,
        "web_status": ws, "website": n.get("website"),
        "needs_web": needs_web, "weak_gbp": weak_gbp, "is_gastro": is_gastro,
        "servicios": servicios, "pitch": pitch, "score": score, "temp": temp,
        # Nuevo: lo que ya tiene montado el sitio y lo que le falta para rendir más
        "aparece_en": aparece, "paginas": len(aparece),
        "falta_datos": falta, "gancho": gancho(n, aparece, falta),
        "abre_domingo": bool(n.get("horarioSemanal")) and any(
            str(d.get("dia", "")).lower().startswith("dom") and "cerrado" not in str(d.get("horas", "")).lower()
            for d in (n.get("horarioSemanal") or [])
        ),
        "ninos": bool(n.get("ninos")),
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
    presencia = mapas_del_sitio()
    if not presencia:
        print("⚠ No se encontró dist/: ejecuta `pnpm build` antes para saber dónde aparece cada ficha.")
    leads = [analyze(n, presencia) for n in negocios]

    json.dump(leads, open(OUT / "leads.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)

    gastroseo = [l for l in leads if "GastroSEO" in l["servicios"]]
    gastrolocal = [l for l in leads if "GastroLocal" in l["servicios"]]
    chefbusiness = [l for l in leads if "ChefBusiness" in l["servicios"]]
    hot = [l for l in leads if l["score"] >= 5]
    sin_horario = [l for l in leads if any("horario" in f for f in l["falta_datos"])]

    with open(OUT / "prospeccion-elcanaveral.md", "w", encoding="utf-8") as f:
        f.write("# Prospección El Cañaveral — lista privada de leads\n\n")
        f.write("> Generado del directorio. **Privado, no publicar.** "
                "John vive en el barrio: visitas a pie. Ordenado por prioridad.\n\n")
        f.write("## El argumento nuevo (para enseñarlo en el móvil)\n\n")
        f.write("El directorio ya no es solo un listado: cada ficha tiene **horario estructurado**, "
                "badge de **«Abierto ahora»** calculado en vivo, **filtros** (terraza, a domicilio, "
                "accesible, acepta tarjeta, para ir con niños) y aparece en listados como el de "
                "**comercios que abren los domingos** (84 fichas), el de **bares y tapas**, el hub "
                "de **familias** y las **guías con ranking**.\n\n")
        f.write("Por eso el pitch cambia de «te hago una web» a algo que se demuestra en pantalla:\n\n")
        f.write("1. **Abre su ficha en el móvil** y enséñale dónde aparece ya (abajo tienes, por lead, "
                "en cuántas páginas está y cuáles son).\n")
        f.write("2. **Enséñale lo que le falta**: si no publica horario, no sale en «abierto ahora» ni en "
                "el listado de domingos; si no declara terraza, no aparece en el filtro de terrazas.\n")
        f.write("3. **Cierra con el dato**: reseñas, nota y fotos de su ficha de Google (lo que trabaja "
                "GastroLocal) o la ausencia de web propia (lo que trabaja GastroSEO).\n\n")
        f.write("## Resumen\n\n")
        f.write(f"- Negocios analizados: **{len(leads)}**\n")
        f.write(f"- 🔥 Leads calientes (puntuación ≥5): **{len(hot)}**\n")
        f.write(f"- **GastroSEO** (sin web propia): **{len(gastroseo)}**\n")
        f.write(f"- **GastroLocal** (ficha Google floja): **{len(gastrolocal)}**\n")
        f.write(f"- **ChefBusiness** (gastro): **{len(chefbusiness)}**\n")
        f.write(f"- Sin horario publicado (invisibles en «abierto ahora» y en domingos): **{len(sin_horario)}**\n")

        section(f, "🔥 Leads calientes — prioridad máxima", hot)
        section(f, "🌐 GastroSEO — negocios sin web propia", gastroseo)
        section(f, "📍 GastroLocal — fichas de Google flojas", gastrolocal)
        section(f, "👨‍🍳 ChefBusiness — negocios gastronómicos", chefbusiness)

        f.write(f"\n## 🎯 Gancho por lead — los 30 primeros por prioridad ({min(30, len(leads))})\n\n")
        f.write("Una frase por negocio, con lo que se puede enseñar en pantalla. "
                "Las cifras de páginas salen del build real del sitio.\n\n")
        for l in sorted(leads, key=lambda x: -x["score"])[: min(30, len(leads))]:
            f.write(f"### {l['temp']} {l['name']} ({l['zona']})\n\n")
            f.write(f"- **Servicios a ofrecer:** {', '.join(l['servicios']) or '—'}\n")
            f.write(f"- **Dónde aparece ya:** {l['paginas']} páginas"
                    + (f" → {', '.join(p for p in l['aparece_en'] if not p.startswith('blog'))[:220]}" if l["aparece_en"] else "")
                    + "\n")
            if l["abre_domingo"]:
                f.write("- ⚠ **Abre los domingos** y está en el listado de domingos: buen gancho para venderle visibilidad.\n")
            if l["ninos"]:
                f.write("- ⚠ Declara ser apto **para ir con niños**: ya está en el hub de familias.\n")
            if l["falta_datos"]:
                f.write(f"- **Le falta:** {', '.join(l['falta_datos'])}\n")
            f.write(f"- **Gancho:** {l['gancho']}\n")
            f.write(f"- **Ficha:** https://www.elcanaveral.info/{l['category']}/{l['slug']}/\n\n")

        f.write("\n---\n_Las cifras de Google cambian; re-ejecuta el script (tras `pnpm build`) para refrescar._\n")

    print(f"✓ {OUT/'leads.json'}")
    print(f"✓ {OUT/'prospeccion-elcanaveral.md'}")
    print(f"\nResumen: {len(hot)} calientes | GastroSEO {len(gastroseo)} | "
          f"GastroLocal {len(gastrolocal)} | ChefBusiness {len(chefbusiness)} | sin horario {len(sin_horario)}")
    if presencia:
        con_presencia = [l for l in leads if l["paginas"] >= 5]
        print(f"Leads que ya aparecen en 5+ páginas del sitio: {len(con_presencia)}")


if __name__ == "__main__":
    main()
