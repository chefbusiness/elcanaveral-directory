# HANDOFF — elcanaveral.info

> Backup de contexto en el repo (por riesgo de apagón térmico del equipo en verano de Madrid).
> Última actualización: **2026-06-25**. Si retomas, lee este archivo + `memory/elcanaveral-directory.md`.

## Identidad del proyecto

| | |
|---|---|
| **Qué** | Directorio hiperlocal del barrio El Cañaveral (Vicálvaro, Madrid) |
| **Live** | https://www.elcanaveral.info/ (canonical `www`, apex 301 → www) |
| **Local** | `/Users/johnguerrero/elcanaveral-directory/` |
| **Repo** | github.com/chefbusiness/elcanaveral-directory (privado) |
| **Stack** | Astro 5 + Tailwind v4 + pnpm · deploy Netlify |
| **Marca operadora** | LocalSEOAds.com · email contacto `local@elcanaveral.info` |
| **HEAD ref** | `8de260f` — 168 páginas, 107 negocios, monetización v1 LIVE (2026-05-08) |

## 🎯 Reenfoque estratégico (sesión 2026-06-25) — LO MÁS IMPORTANTE

El valor de este directorio **NO es la monetización directa** (107 negocios no dan para vivir de listados
premium). El valor es ser el **activo de prospección y captación de clientes a pie de calle** para los
servicios del grupo:

- **Restaurantes / bares / pizzerías / hamburgueserías** → consultoría gastronómica **ChefBusiness**
- **Negocios sin web (o con web mala)** → webs con **GastroSEO.com**
- **Negocios con ficha de Google Business Profile floja / sin tráfico / sin reseñas** → gestión GBP y
  publicidad en Google Maps con **GastroLocal.pro**

El barrio crece fuerte (15.000–25.000 hab., aperturas semanales). John vive aquí y puede visitar clientes
a 10–15 min andando y verificar datos en persona. El directorio le dice **qué negocios hay, cuáles no tienen
web y cuáles tienen GBP flojo** → esos son los leads.

## 🔎 Realidad GSC (28 días, a 2026-06-25)

`sc-domain:elcanaveral.info` — propiedad de dominio, recibe sitemap.

| Métrica | Valor | Lectura |
|---|---|---|
| Impresiones | ~1.295 (~46/día) | Indexado, entra por queries **perfectas** de barrio |
| Clicks | 7 | CTR 0,54% — casi nadie hace clic |
| Posición media | 9,5 | Página 1 baja / página 2 |

- Queries reales que ya entran: `fruteria el cañaveral`, `cafeteria cañaveral`, `ferreteria cañaveral`,
  `guarderia en cañaveral`, `gimnasio el cañaveral`, `cafeterias cañaveral`…
- **Problema 1:** en búsquedas locales el Map Pack se come el clic estando en pos. 6-10.
- **Problema 2:** category/zona pages que rankean mal (guardería pos. 63, gimnasio pos. 45) → huecos de contenido.
- **Conclusión:** la foundation SEO funciona, pero el tráfico es pequeño → hay que (a) subir autoridad/posiciones
  y (b) usar el sitio como activo de prospección.

## 🗺️ Plan elegido y su secuencia

**Lane A elegida por John: Apify — enriquecer + rellenar** (lo demás se encadena después).

### Secuencia integrada (Apify → Listicles → Blog)

1. **Apify enrich** de las 107 fichas: nota, nº reseñas, teléfono, web, horario real, coords (lat/lng),
   `place_id` (para refreshes idempotentes) + **descubrir negocios que faltan** (autoescuelas, farmacias, etc.).
2. **Sub-categorizar** con el `categoryName` que devuelve Google (pizzería, dentista, farmacia, uñas/manicura)
   — la gente busca por el término fino, no por "restaurantes".
3. **Generar listicles** "Top N mejores [X] en El Cañaveral" (motor del `/blog`), con mini-fichas embebidas,
   ordenados por **puntuación ponderada bayesiana** (estilo IMDb: combina nota × volumen de reseñas de forma
   justa — NO ordenar por nº de reseñas a pelo, que gana Mercadona; NI por nota a pelo, que gana 1 reseña 5★).
   Idea original de John tras ver un vídeo de SEO de directorios locales — patrón ganador validado.
4. **Gancho comercial** en cada listicle: "¿Tu negocio debería estar aquí?" → `/alta` + servicios del grupo.
   Compartibles en los grupos de Facebook del barrio.
5. **Capa de leads (privada):** marcar fichas sin web / GBP flojo (pocas reseñas, sin fotos) → lista de
   prospección para GastroSEO / GastroLocal / ChefBusiness. JSON interno, NO público.

**Regla previa a publicar cada listicle:** validar SERP/GSC de su query primero (regla de oro de John).

### Categorías con masa para Top 5 (count ≥5, a día de hoy)
restaurantes (20, incl. pizzerías/hamburgueserías) · salud (16 → dentistas/farmacias) · supermercados (10) ·
deporte/gimnasios (8) · inmobiliarias (8) · educación/guarderías (6) · panaderías (6) · belleza/uñas (6) ·
hogar (5). **Alta demanda pero poca masa** (rellenar con Apify antes): cafeterías (2), mascotas (2).

## 🔑 Apify — token YA LOCALIZADO (blocker resuelto)

- **Token:** `APIFY_TOKEN=apify_api_…` en `~/chefbusiness-prospecting/.env` (reutilizable, no exponer valor).
- **MCP Apify** configurado en `.claude.json` SOLO para el proyecto `chefbusiness-prospecting`
  (`https://mcp.apify.com/`, `Authorization: Bearer apify_api_…`). En `elcanaveral-directory` ese MCP NO está
  cargado → para el pipeline usaremos la **API REST de Apify con el token** desde un script Python (mejor que
  MCP para enriquecer/idempotencia, igual patrón que `scripts/fetch_places_photos.py` con Google).
- **Actor previsto:** `compass/crawler-google-places` (Google Maps Scraper). Devuelve: `title`, `address`,
  `phone`, `website`, `totalScore` (rating), `reviewsCount`, `categoryName`, `location {lat,lng}`,
  `openingHours`, `placeId`, `url`, `imageUrls`. Búsqueda por `searchStringsArray` + `locationQuery` +
  `maxCrawledPlacesPerSearch`.
- **PRIMER PASO de ejecución:** copiar `APIFY_TOKEN` al `.env` de este proyecto (gitignored) o exportarlo en
  `~/.zshrc` (patrón reutilizable como `GOOGLE_PLACES_API_KEY`). Luego **pilot acotado** (1 categoría o
  `maxCrawledPlaces` bajo) para validar coste en CU y calidad de match ANTES de escalar (disciplina UltraCode).

## 📊 Estado de los datos (gaps que justifican la pasada Apify)

De 107 negocios:

| Campo | Cobertura | Nota |
|---|---|---|
| `rating` (nota) | **13/107** | ← crítico para listicles |
| `numReviews` | **10/107** | ← crítico para listicles |
| `phone` | 53/107 | |
| `website` | 40/107 | ← su ausencia ES señal de lead para GastroSEO |
| `horario` | 107/107 | pero pueden ser aprox. (Gemini) — verificar con Apify |
| `images` | 104/107 | falta `escuela-infantil-conde-nino` (sin foto en Maps) |
| `place_id` / `lat,lng` | **0/107** | sin clave estable ni coords para mapas |

Esquema de ficha (`src/data/negocios.json`): `slug, name, description, category, categoryName, zona, zonaName,
address, rating, numReviews, tags, featured, image, servicios, destacados, horario, images`.

## 📁 Estado actual del sitio

- **107 negocios** · 16 categorías · 4 zonas (Cañaveral 72 · Vicálvaro 27 · Coslada 5 · S. Fernando 3) · 29 `featured`.
- **168 páginas:** `/`, `/[categoria]`, `/[categoria]/[slug]`, `/zona/[zona]`, `/zona/[zona]/[categoria]`,
  `/zonas`, `/directorio`, `/comunidad`, **`/blog` (VACÍO)**, comerciales (`/planes`, `/alta`, `/anunciate`,
  `/sponsor`, `/contacto`), legales (`/aviso-legal`, `/terminos`, `/privacidad`, `/cookies`).
- **Monetización v1 LIVE:** 4 tiers en `/planes` (Básico gratis · Verificado 19€/mes · Destacado 49€/mes ·
  Sponsor desde 800€/mes) · 4 forms Netlify (alta/anunciate/sponsor/contacto) → John factura manual ·
  kit DOCX sponsor SM Homes en `sponsorship-kit/`.
- **SEO:** canonical www, schema LocalBusiness por ficha, ItemList+BreadcrumbList en zona×categoría,
  FAQPage en /planes, robots con AI crawlers, llms.txt, sitemap en GSC.
- **UI:** paleta brand-900 #2952a3 / accent-500 #f97316 / warm-* · DM Sans + Inter · galería 5 fotos lightbox
  `<dialog>` · mobile-first · TopBanner site-wide → localseoads.com.

## 📜 Scripts (`scripts/`)
`fetch_places_photos.py` (Places API New, hero/gallery) · `audit_places_residuales.py` ·
`apply_decisions_residuales.py` · `migrate_wp_data.py` · `enrich_negocios.py` · `fix_missing_addresses.py` ·
`generate_category_images.py` · `generate_favicon.py` · `copy-data.mjs`. **Pendiente crear:** `apify_enrich.py`.

## ⏭️ Pendientes (orden tras Apify)
1. **[EN CURSO] Apify enrich + fill** → datos completos + capa de leads.
2. **Listicles "mejores X cañaveral"** (motor del blog), con SERP-validation previa.
3. **Quick wins SEO on-page:** reescribir titles/meta (CTR 0,5%) + arreglar category/zona en pos. 45-68.
4. **Audit GSC post-soak** (ya >3 semanas): dónde apretar.
5. **Cerrar go-live monetización:** legales LSSI-CE (NIF + domicilio fiscal — John pasa datos) ·
   notificaciones email de los 4 forms Netlify (panel Netlify de John) · test real de 1 envío por form ·
   anti-spam si hace falta.
6. **Reprocesar 21 fichas con galería <5 fotos** + `escuela-infantil-conde-nino`.
7. **Documentar boilerplate** replicable (Sanchinarro, Valdebebas, Rivas…).

## ⚠️ Restricciones de trabajo (verano Madrid)
- **CPU < 65 °C** — monitorizar con `istats cpu temp`; ralentizar si sube. **NO usar Playwright** (recalienta).
- Builds: preferir nube; evitar `astro build` local en calor.
- **Contenido largo:** SIEMPRE con `bridge.py` (DeepSeek) — nunca redactar a mano (regla global).
- **Imágenes:** skill `generate-images` (Nano Banana 2).
- **SEO-first:** keyword research + SERP research ANTES de crear cualquier página.

## 📚 Memoria relacionada (en `memory/`)
`elcanaveral-directory.md` (ficha maestra) · `feedback-elcanaveral-seo-first.md` (SERP antes de crear) ·
`reference-elcanaveral-facebook.md` (grupos FB del barrio para descubrir negocios).
