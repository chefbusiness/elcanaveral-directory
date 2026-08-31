# El Cañaveral Info — directorio y hub del barrio

Directorio hiperlocal de **El Cañaveral** (Vicálvaro, Madrid) convertido en el hub de vivir y
disfrutar el barrio: negocios, guías «mejores X», actualidad y pilares de utilidad.

**En vivo:** https://www.elcanaveral.info/ (canonical `www`; apex 301 → www) · deploy **Netlify**.

## Stack
- Astro 5 + Tailwind v4 + pnpm — 100 % estático
- @astrojs/sitemap · Fuse.js (búsqueda client-side) · Sharp (WebP)
- Schema.org: LocalBusiness por ficha · ItemList por categoría/zona · FAQPage · NewsArticle
- Deploy: GitHub → Netlify (build en CI; no hace falta build local)

## Contenido (a 2026-08-31)
- **286 negocios** · 16 categorías · 4 zonas (El Cañaveral, Vicálvaro, Coslada, San Fernando)
- **32 guías** «mejores X» (motor de ranking bayesiano) con publicación drip programada
- **9 posts de actualidad** (`/actualidad`)
- Pilares: `/vivir-en-el-canaveral` (keystone) · `/transporte` · `/espacios-publicos` ·
  `/servicios-publicos` · `/escapadas` · `/fiestas` · `/compras` · `/comida-a-domicilio` ·
  `/con-perro` · `/mercadillos` · `/comunidad`
- Comerciales: `/planes` (4 tiers) · `/alta` · `/anunciate` · `/sponsor` · `/contacto`
- Imágenes en **WebP (q80)** · mapas de Google consent-gated (banner RGPD)

## Estructura
```
src/
├── pages/                  # index, [categoria]/, [categoria]/[slug], zona/, blog/, actualidad/, pilares, comerciales, legales
├── components/             # Header, Footer, NegocioCard, SearchBar, Galeria, filtros, CookieConsent…
├── layouts/BaseLayout.astro
├── lib/
│   ├── directory.ts        # engine: load, filter, paths, schema LocalBusiness
│   └── listicles.ts        # ranking bayesiano de guías
└── data/                   # TODO el contenido en JSON
    ├── negocios.json       # fichas (slug, name, rating, phone, placeId, lat/lng…)
    ├── categorias.json · zonas.json · listicles.json · actualidad.json
    ├── seo-overrides.json  # titles/meta/h1 + intro/FAQ por categoría y ficha
    └── escapadas.json · fiestas.json · espacios.json · comunidad.json
scripts/                    # pipelines de datos (Python) + copy-data.mjs
public/                     # imágenes WebP, _redirects (301), llms.txt, robots.txt, data/negocios.json
```

## Pipelines de datos
- `node scripts/copy-data.mjs` (corre en `pnpm dev`/`build`): copia `src/data/negocios.json` →
  `public/data/` para la búsqueda client-side.
- `scripts/apify_enrich.py` — enrich/discover por API REST de Apify (idempotente vía `placeId`).
- `scripts/fetch_photos_by_placeid.py` — fotos por `placeId` autoritativo (no buscar por texto).
- `scripts/schedule_posts.py` — calendario drip de guías (la GitHub Action diaria publica).
- `scripts/leads_prospecting.py` — capa de leads (salida en `prospecting/`, gitignored).

## Docs del proyecto (leer antes de tocar)
- **`handoff.md`** — hoja de arranque y estado: sesiones, verificaciones, auditorías GSC (#1-#3).
- **`memoria.md`** — fuente de verdad: identidad, decisiones, entorno/límites (receta de push,
  acceso GSC por API, por qué no hay build local) y reglas de contenido.
- **`roadmap.md`** — hecho/pendiente priorizado + decisiones pendientes del cliente.
- **`IDEAS-CONTENIDO.md`** — backlog de ideas y pilares de contenido.
- **`VERIFICAR-EN-PERSONA.md`** — datos dudosos a confirmar a pie de calle.

## Reglas del proyecto
- **SEO-first:** validar SERP/GSC (o el dato en la fuente) antes de publicar contenido.
- Actualidad: **solo hechos reales con fuente**; comprobar la fecha de la fuente y las cifras en ella.
- Párrafos de posts con `set:html`: **escapar `&`, `<` y `>`**.
- Sin secretos en el repo (`.env` gitignored; tokens de Apify/Google fuera de git).
- Cierre: commits por hito + gate UltraReview (`auto-gate.mjs`) + verificación del deploy en vivo.

## Setup
```bash
pnpm install
cp .env.example .env   # PUBLIC_SITE_* y GEMINI_API_KEY (pipeline de datos)
pnpm dev
```
