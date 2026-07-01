# HANDOFF — elcanaveral.info

> Backup de contexto en el repo. Última actualización: **2026-06-27** (sesión en la VM de Abacus).
> Si retomas: lee este archivo. La memoria del agente con el setup de Abacus (SSH, build, drip, pipelines)
> está en `memory/elcanaveral-directory-abacus.md`.

## Identidad del proyecto

| | |
|---|---|
| **Qué** | Directorio hiperlocal del barrio El Cañaveral (Vicálvaro, Madrid) |
| **Live** | https://www.elcanaveral.info/ (canonical `www`, apex 301 → www) |
| **Local** | `/Users/johnguerrero/elcanaveral-directory/` |
| **Repo** | github.com/chefbusiness/elcanaveral-directory (privado) |
| **Stack** | Astro 5 + Tailwind v4 + pnpm · deploy Netlify |
| **Marca operadora** | LocalSEOAds.com · email contacto `local@elcanaveral.info` |
| **HEAD ref** | `11e4aa1` — 382 páginas, 256 negocios, 29 guías + frentes nuevos (escapadas verano+niños, /compras, /comida-a-domicilio, /actualidad ×2 posts, /con-perro, /mercadillos), WebP (2026-07-01) |

## ✅ Sesión 2026-06-25 (Abacus) — COMPLETADO

Migrado el trabajo a la VM de Abacus (SSH propio; ver `memory/elcanaveral-directory-abacus.md`). Ejecutada **toda** la secuencia del plan:

1. **Apify enrich de las 107 fichas** — `scripts/apify_enrich.py` (actor `compass/crawler-google-places`, API REST idempotente vía placeId). Cobertura: rating 13→102, numReviews 10→102, placeId/coords 0→106, googleCategory 0→103, phone 53→95, website 40→84. Coste ~$0.35. Teléfonos inventados por la IA previa sustituidos por reales; limpiados matches extranjeros erróneos (Lidl +49, García +57, Family Market +58).
2. **Fix de fotos por placeId** — `scripts/fetch_photos_by_placeid.py`. Las fotos viejas (búsqueda por texto) podían mostrar OTRO negocio: caso real, la ficha "McDonald's" era en realidad **Burger King** (renombrada, redirect 301) y su foto era de Clínica Sastre. Re-bajadas TODAS las fotos por placeId autoritativo (**142 imágenes**). 6 negocios sin foto en Google conservan la anterior. `scripts/contact_sheet.py` para validación visual.
3. **Blog con 11 guías** "mejores X en El Cañaveral y alrededores" (`/blog`): restaurantes(14), clínicas dentales(5), gimnasios(6), peluquerías(5), panaderías(3), inmobiliarias(7), supermercados(8), guarderías(4), fruterías(4), talleres(3), tiendas de ropa(4). Motor en `src/lib/listicles.ts` (**ranking bayesiano**) + `src/data/listicles.json`. Cada query SERP-validada (todas con hueco local). Mini-fichas + gancho `/alta` + FAQ + schema (ItemList/FAQPage/Breadcrumb).
4. **Publicación programada (drip)** para contenido FUTURO: `publishedDate` futura oculta la guía; GitHub Action diaria (`.github/workflows/publish-scheduled.yml`) la publica al llegar la fecha; `scripts/schedule_posts.py` fija el calendario. Las 11 actuales quedaron en vivo (no re-programar lo publicado).
5. **Quick-wins SEO**: cross-linking categoría↔guía (banners en `[categoria]` y zona×categoría), `seo-overrides.json` reescrito (+inmobiliarias), descripciones de zona×categoría diferenciadas (anti-canibalización).
6. **Capa de leads** — `scripts/leads_prospecting.py`, salida en `prospecting/` (**GITIGNORED, privado**): 12 calientes, 35 GastroSEO (sin web), 37 GastroLocal (GBP flojo), 28 ChefBusiness. Informe markdown para visitar puerta a puerta.
7. **Monetización CERRADA**: legales = **Opción A** (sin NIF, igual nivel que miselup.pro — John lo decidió así de momento). Netlify Forms detectados (vía `public/__forms.html`) + notificaciones email activas + **test de los 4 forms OK**. Cobro **manual por transferencia/Bizum** (términos 3.2 y `/planes` alineados). **Banner de cookies RGPD** (`src/components/CookieConsent.astro`): los mapas de Google solo cargan con consentimiento.

## ✅ Sesión 2026-06-26/27 (Abacus) — DE DIRECTORIO A HUB DEL BARRIO

Transformación de "directorio" a **EL hub de vivir y disfrutar El Cañaveral**. Todo commiteado y en vivo.

1. **Directorio 107 → 256 negocios** (4 zonas: Cañaveral 90 · Coslada 76 · S.Fernando 48 · Vicálvaro 42). Apify discover + `scripts/add_discovered.py` (umbral ≥4.3★/≥30 reseñas, categoría/zona por código postal, descripciones LLM Abacus `gemini-3.5-flash`, fotos por placeId). Coste Apify disciplinado (~$0.05–0.48/run).
2. **29 guías "mejores X"** (eran 11): 11 generales "El Cañaveral y alrededores" + 18 por zona, en **drip** escalonado (2026-06-26→07-30).
3. **Filtro de zonas** en el directorio (multi-select, semántica OR) + filtro de afinidad (semántica AND) reutilizables — `ZonaFilter.astro`, `AfinidadFilter.astro`.
4. **Pilar "Utilidad del barrio" COMPLETO y EN VIVO:**
   - `/transporte` — autobuses (159, E5 exprés, 290), búho N6, Cercanías, taxi/VTC (datos reales con fuentes).
   - `/espacios-publicos` — 17 espacios (parques infantiles, pipicanes, deportivos, senderismo) con mapas consent-gated. Datos en `src/data/espacios.json`.
   - `/servicios-publicos` — colegio público CEIPSO Rudyard Kipling (abrió sept 2025), salud/urgencias (no hay centro de salud propio aún; atención en C.S. Villablanca, urgencias Hospital del Henares), farmacias de guardia (COFM), teléfonos útiles. Honesta sobre el GAP.
   - `/vivir-en-el-canaveral` — **KEYSTONE** que enlaza todo el barrio (hub de 10 secciones + FAQ).
5. **Pilar "Disfrutar":** `/escapadas` (5 regiones de Madrid sureste/centro/noreste/norte/oeste, 31 sitios, filtros con-niños/con-perro/gratis/naturaleza/cultura — `src/data/escapadas.json`) + `/fiestas` (hub + Vicálvaro/Dos de Mayo/San Isidro — `src/data/fiestas.json`).
6. **Optimización WebP (Pack C):** las 1.195 imágenes migradas JPG→WebP (q80), **215→135 MB (-37%)**, refs actualizadas, JPG borrados, verificado visualmente. Mejor LCP móvil.
7. **Fixes responsive:** menú hamburguesa móvil (`Header.astro`), `overflow-x: clip`, banner cookies con safe-area, cards `/comunidad` sin desbordar. Categoría "ocio" vacía (0 negocios) ya no se enlaza (filtro `count>0` en home).

**Backlog/roadmap maestro en `IDEAS-CONTENIDO.md`** (committeado, actualizado). **Terrazas PARKED**: John aporta datos de terrazas a medida que visita locales en persona.

## 🎯 Reenfoque estratégico — LO MÁS IMPORTANTE (sigue vigente)

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

## 📊 Estado de los datos (tras Apify, 2026-06-25)

De 107 negocios:

| Campo | Antes → Ahora | Nota |
|---|---|---|
| `rating` (nota) | 13 → **102** | los 5 sin nota no aparecen en listicles |
| `numReviews` | 10 → **102** | |
| `phone` | 53 → **95** | falsos de la IA previa sustituidos por reales |
| `website` | 40 → **84** | su ausencia ES señal de lead para GastroSEO |
| `googleCategory` | 0 → **103** | sub-categoría fina de Google (para listicles finos) |
| `place_id` / `lat,lng` | 0 → **106** | clave estable para re-fetch idempotente |
| `images` | re-bajadas por placeId | 6 sin foto en Google conservan la anterior |

Esquema de ficha (`src/data/negocios.json`): `slug, name, description, category, categoryName, zona, zonaName,
address, rating, numReviews, phone, website, tags, featured, image, images, servicios, destacados, horario,
placeId, lat, lng, googleCategory`.
Refrescar todo: `python scripts/apify_enrich.py --mode enrich --write` (coste ~$0.35).

## 📁 Estado actual del sitio

- **256 negocios** (eran 107) · 16 categorías · 4 zonas (Cañaveral 90 · Coslada 76 · San Fernando 48 · Vicálvaro 42). Zonas pobladas con Apify discover + `add_discovered.py` el 2026-06-26.
- **376 páginas:** `/`, `/[categoria]`, `/[categoria]/[slug]`, `/zona/[zona]`, `/zona/[zona]/[categoria]`,
  `/zonas`, `/directorio` (con **filtro de zonas** multi-select), `/comunidad`, **`/blog` + 29 guías "mejores X"**,
  **`/actualidad` + `/actualidad/[slug]` (blog de noticias)**, **`/compras`** (outlets y centros comerciales),
  **`/comida-a-domicilio`** (ranking delivery), **`/con-perro`** (hub dog-friendly), **`/mercadillos`** (mercados), **pilares de contenido** (`/vivir-en-el-canaveral` keystone,
  `/transporte`, `/espacios-publicos`, `/servicios-publicos`, `/escapadas` + `/escapadas/[region]` con afinidad
  💦 piscinas, `/fiestas` + `/fiestas/[slug]`),
  comerciales (`/planes`, `/alta`, `/anunciate`, `/sponsor`, `/contacto`), legales (`/aviso-legal`,
  `/terminos`, `/privacidad`, `/cookies`).
- **Blog:** `/blog` con 29 listicles (motor `src/lib/listicles.ts` + `src/data/listicles.json`),
  ranking bayesiano, fotos por placeId, drip-publishing para futuros. Categoría↔guía cross-enlazadas.
- **Imágenes:** todo en **WebP** (q80, ~135 MB) — migrado el 2026-06-27, `<img>` con `loading=lazy`.
- **Monetización CERRADA:** 4 tiers en `/planes` (Básico gratis · Verificado 19€/mes · Destacado 49€/mes ·
  Sponsor desde 800€/mes) · 4 forms Netlify detectados + notificación email a `local@elcanaveral.info` ·
  cobro **manual por transferencia/Bizum** · kit DOCX sponsor SM Homes en `sponsorship-kit/`.
- **SEO:** canonical www, schema LocalBusiness por ficha, ItemList+BreadcrumbList en zona×categoría y guías,
  FAQPage en /planes y guías, robots con AI crawlers, llms.txt, sitemap en GSC.
- **Privacidad/cookies:** sin analítica de terceros; banner de consentimiento (`CookieConsent.astro`),
  los mapas de Google solo cargan tras aceptar. Legales = Opción A (sin NIF publicado, decisión de John).
- **UI:** paleta brand-900 #2952a3 / accent-500 #f97316 / warm-* · DM Sans + Inter · galería 5 fotos lightbox
  `<dialog>` · mobile-first · TopBanner site-wide → localseoads.com.

## 📜 Scripts (`scripts/`)
**Nuevos (sesión 2026-06-25):**
- `apify_enrich.py` — enrich/discover por API REST de Apify (idempotente vía placeId; `--from-run` reusa runs ya pagados; `--refresh-contacto`, `--location-bias`, `--slugs`).
- `fetch_photos_by_placeid.py` — fotos por placeId autoritativo (`--slug`/`--category`/`--all`). **Usar este, no `fetch_places_photos.py`** (el viejo busca por texto y puede casar el local equivocado).
- `contact_sheet.py` — hoja de contacto (grid etiquetado por categoría, orden bayesiano) para validar fotos.
- `schedule_posts.py` — fija el calendario drip de las guías (`--start`/`--every`/`--keep`).
- `leads_prospecting.py` — capa de leads (salida privada en `prospecting/`).

**Previos:** `fetch_places_photos.py` (legacy, búsqueda por texto) · `migrate_wp_data.py` · `enrich_negocios.py` · `fix_missing_addresses.py` · `generate_category_images.py` · `generate_favicon.py` · `copy-data.mjs` · `audit_places_residuales.py` · `apply_decisions_residuales.py`.

## ⏭️ Pendientes
- ✅ ~~Apify enrich + fill~~ (hecho)
- ✅ ~~Listicles "mejores X cañaveral" con SERP-validation~~ (11 guías + drip)
- ✅ ~~Quick wins SEO on-page (titles/meta + cross-linking)~~ (hecho)
- ✅ ~~Cerrar go-live monetización~~ (forms+email+test+cobro+cookies; legales = Opción A sin NIF)
- ✅ ~~Capa de leads~~ (`prospecting/`)

- ✅ ~~Pilar utilidad (transporte, espacios, servicios públicos, keystone)~~ (en vivo 2026-06-27)
- ✅ ~~Pilar disfrutar (escapadas, fiestas)~~ · ✅ ~~Directorio 107→256 + filtro zonas~~ · ✅ ~~29 guías~~
- ✅ ~~Optimización WebP (Pack C)~~ (2026-06-27, -37%)

**Queda:**
1. **📰 Blog de actualidad** — ✅ ESTRENADO (2026-06-28): `/actualidad` + `/actualidad/[slug]`, datos en `src/data/actualidad.json` (drip-aware, schema NewsArticle), primer post = parque comercial de El Cañaveral. **REGLA: solo hechos reales con fuente, NO inventar noticias.** Queda ALIMENTARLO: John aporta temas locales (aperturas, eventos, obras) y se redactan con fuentes.
2. **Auditoría GSC post-soak** — **~mediados de julio 2026** (John comparte Search Console en ~2 semanas). Medir efecto de guías+pilares; ver qué category/zona/pilar apretar.
3. **🍹 Guía de terrazas — PARKED**: John aporta datos a medida que visita locales en persona. No enfocarse hasta que él lo pida. (Campos `terraza`/`delivery` ya se capturan en `apify_enrich.py` desde `additionalInfo`.)
4. **Ampliar fiestas** (opcional): más ferias reales de la zona cuando toque.
5. **Verificar in situ** (`VERIFICAR-EN-PERSONA.md`): Obramat (¿existe/otro rótulo?) y Mediadores (¿= SM Homes?).
6. **Legales Opción B** (si John factura en serio): añadir NIF + domicilio fiscal a aviso-legal y privacidad.
7. **Documentar boilerplate** replicable (Sanchinarro, Valdebebas, Rivas…) — el motor directorio+listicles+drip+pilares ya es bastante portable.

## 💡 Ideas de contenido y roadmap → ver **`IDEAS-CONTENIDO.md`** (documento maestro)

Estrategia: pasar de "directorio" a **EL hub de referencia de El Cañaveral** — **YA LOGRADO en su mayor parte**. Estado de los pilares (detalle en `IDEAS-CONTENIDO.md`):
- ✅ 🚌 **Transporte** (`/transporte`) · ✅ 🌳 **Espacios públicos** (`/espacios-publicos`) · ✅ 🔑 **Keystone "Vivir en El Cañaveral"** (`/vivir-en-el-canaveral`) · ✅ 🏛️ **Servicios públicos** (`/servicios-publicos`).
- ✅ 🗺️ **Escapadas** (`/escapadas`, 5 regiones + afinidades) · ✅ 🎉 **Fiestas** (`/fiestas`).
- ✅ 🖼️ **WebP** (Pack C) — hecho 2026-06-27 (-37%).
- ✅ 📰 **Blog de actualidad** (`/actualidad`) — estrenado 2026-06-28; alimentar con hechos reales que aporte John.
- ✅ 🛍️ **Compras** (`/compras`) · ✅ 🛵 **Delivery** (`/comida-a-domicilio`) · ✅ ☀️ **Escapadas de verano** (afinidad piscinas).
- ⬜ 🍽️ Listicles temáticos (terraza/delivery): datos infra-etiquetados → guía de terrazas PARKED (John aporta in situ).
- 💡 🐶 Hubs por afinidad (perros, familias) — el motor de afinidad ya existe (`AfinidadFilter`), ampliable.

## ⚠️ Restricciones de trabajo (verano Madrid)
- **CPU < 65 °C** — monitorizar con `istats cpu temp`; ralentizar si sube. **NO usar Playwright** (recalienta).
- Builds: preferir nube; evitar `astro build` local en calor.
- **Contenido largo:** SIEMPRE con `bridge.py` (DeepSeek) — nunca redactar a mano (regla global).
- **Imágenes:** skill `generate-images` (Nano Banana 2).
- **SEO-first:** keyword research + SERP research ANTES de crear cualquier página.

## 📚 Memoria relacionada (en `memory/`)
`elcanaveral-directory.md` (ficha maestra) · `feedback-elcanaveral-seo-first.md` (SERP antes de crear) ·
`reference-elcanaveral-facebook.md` (grupos FB del barrio para descubrir negocios).
