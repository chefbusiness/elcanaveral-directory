# ROADMAP — elcanaveral.info

> Actualizado: **SESIÓN 2026-09-27b** — **bloque GEO**: `Organization`+`WebSite` en la home, fichas con `geo`/`hasMap`/`sameAs`/`addressLocality` real, **`/llms.txt` generado en build** (87 enlaces verificados) y fix de un enlace de Instagram roto. Sesión anterior (27-sep a): retirada de la web de Farmacia Sonrisas + guard de webs bloqueadas. Próxima: **GSC #5 (~mediados de octubre)** y verificación in situ (John).

## Hecho ✅

- [x] **Directorio → hub del barrio** (jun 2026): 286 negocios · 16 categorías · 4 zonas · filtros zona/afinidad · páginas zona×categoría (pSEO).
- [x] **Guías «mejores X»**: 32 (motor bayesiano `src/lib/listicles.ts`) con **drip publishing** programado (GitHub Action diaria 06:15 UTC).
- [x] **Pilares de utilidad**: `/transporte` · `/espacios-publicos` · `/servicios-publicos` · keystone `/vivir-en-el-canaveral` (en vivo 2026-06-27).
- [x] **Pilar disfrutar**: `/escapadas` (5 regiones + afinidades) · `/fiestas` · `/compras` · `/comida-a-domicilio` · `/con-perro` · `/mercadillos` · `/comunidad`.
- [x] **Blog de actualidad `/actualidad`**: 9 posts (26-jun → 31-ago) — regla: hechos reales con fuente y fecha verificada.
- [x] **Datos**: enriquecimiento Apify (rating/telefono/website/placeId + discovery en rondas; coste disciplinado) + fotos por `placeId` autoritativo + migración WebP q80 (**215 → 135 MB, -37 %**).
- [x] **Monetización cerrada**: 4 tiers en `/planes` · 4 forms Netlify → email · cobro manual · cookies RGPD (mapas consent-gated).
- [x] **SEO fundacional**: sitemap 433 URLs (verificado en vivo) · schema por tipo de página · `seo-overrides.json` (categorías + fichas + intro/FAQ) · 301 de URLs legadas · canonical www · robots/llms.txt.
- [x] **Auditorías GSC**: #1 (15-jul) · #2 (20-jul) · **#3 (31-ago — API v3 directa, sin CSV; método documentado en memoria.md)**.
- [x] **Acciones CTR GSC #3**: overrides title/meta en **10 fichas** (obrador-de-goya, sanitas-dental, churreria-bernis, la-belle-vie, mr-kebab, levaduramadre, supermercado-el-canaveral, panaderia-bulevar, masruedas-coslada, dreamfit-valdebernardo) + **intro/FAQPage** en `/fruterias/` (4 preguntas) y `/tiendas-alimentacion/` (3 preguntas) — desplegadas y verificadas en vivo.
- [x] **Sesión 2026-08-31**: posts de Tapaveral 2026 + V Carrera Popular (2-4 oct) y vuelta al cole 2026/27 · infraestructura de entorno documentada (receta push sandbox, acceso GSC API) · repo sincronizado y deployado.
- [x] **Auditoría GSC #4 (23-sep)** — PRE 12 clics/1.162 impr/CTR 1,03 % → POST **19 clics/1.823 impr/CTR 1,04 %**; acumulado 53 clics · 6.609 impr · pos 10,7. **Aprendizaje estructural**: crecemos por amplitud (110 queries con impresiones vs 54), los title/meta de fichas de marca NO mueven CTR (Map Pack), y **convierten las páginas de listado** (`/cafeterias/` 2,02 %, `/tiendas-alimentacion/` 4,55 %, `/zona/el-canaveral/supermercados/` 2,99 %).
- [x] **Acciones GSC #4 (23-sep, commits `2eb2b17` + `3b859fc`)**: **7 categorías con intro + FAQPage** —`/supermercados/` (los 6 súpers que abren domingos), `/educacion/`, `/salud/`, `/mascotas/`, `/panaderias/` (además de `/fruterias/` y `/tiendas-alimentacion/`)— · **16 fichas con overrides** · **fix del render del FAQ** (enlaces escapados + HTML en el JSON-LD) · **validador de enlaces internos** (`.tmp/validate-links.mjs`, cazó 1 enlace roto de Nemomarlin).
- [x] **Retirada de web por solicitud del titular (27-sep)**: ficha de **Farmacia Sonrisas del Cañaveral** sin `website` (dominio `farmaciasonrisascanaveral.com` caducado y en manos de terceros) + **guard anti-reaparición** (`src/data/website-blocklist.json` + `src/lib/website-guard.js`, aplicado en `loadNegocios()` y `copy-data.mjs`).
- [x] **Bloque GEO (27-sep b, commits `2fcf6ee` · `ec96751` · `5f7a8eb`)**: **`Organization` + `WebSite`** en la home (la home no tenía ningún JSON-LD: no había entidad que un LLM pudiera atribuir) · **fichas** con `@id`, `url`, `geo` (283), `hasMap` por `place_id` (286), `sameAs`, `postalCode` y **`addressLocality` = municipio** (antes el barrio) · **`/llms.txt` generado en build** (`src/pages/llms.txt.ts`; el estático citaba un email equivocado, omitía `inmobiliarias` y no tenía enlaces) con **87 enlaces verificados y cobertura real de campos** · `public/_headers` con `text/plain; charset=utf-8` · **bug corregido**: enlace de Instagram roto en `bunbun-canaveral`. Verificado con build local escalado (438 páginas, 571 bloques JSON-LD sin errores) + gate propio 0 blockers.
- [x] **Contenido 23-sep**: **post #10** `canaveral-11-45-viviendas-publicas-alquiler-asequible` (Cañaveral 11: 45 viviendas, sorteo principios de 2027, 12,02 M€; fuente Nuevo Sureste 21-sep) + **post de Tapaveral refrescado** con el nombre oficial «V Feria de la Tapa» y la info de público (tapa + bebida a precio especial, premios). Sitemap en vivo: **434 URLs**.

## Pendiente ⬜

- [ ] **`llms-full.txt`** (bloque GEO, no pedido aún): versión extendida con el catálogo de fichas y las guías en markdown — es el mayor multiplicador de citabilidad, pero hay que generarlo desde `src/data` igual que `/llms.txt` para que no se desincronice.
- [ ] **Replicar `Organization` en todas las páginas** (hoy solo en la home) vía `BaseLayout` — refuerza la entidad para LLM a costa de ~1 KB por página.
- [ ] **Concordancia de las 7 guías de zona** («Las mejores restaurantes/veterinarios/talleres»): afecta a `h1` + `metaTitle` + `intro`. Arreglar en `scripts/generate_zone_listicles.py` (líneas 67-70) **y** en `src/data/listicles.json` (si solo se tocan los datos, la próxima regeneración lo revierte).
- [ ] **`openingHours` a formato ISO** (schema.org): hoy es texto libre español («L-S 9:00-21:00, D 10:00-14:00»). Requiere un mapeo de días/rangos revisado a mano: una traducción automática que falle publica un horario falso.
- [ ] **Decidir licencia/atribución del dataset** `/data/negocios.json` (hoy solo «cita la fuente y enlaza»): si se quiere que los LLM lo reutilicen masivamente, conviene una licencia explícita (CC BY / ODbL) escrita en `/llms.txt` y en el aviso legal.
- [ ] **GSC #5 (~mediados de octubre 2026)** — medir si el patrón «categoría/zona + FAQ» mueve el CTR (comparar `/supermercados/`, `/educacion/`, `/salud/`, `/mascotas/`, `/panaderias/`, `/fruterias/`); comprobar si guías (32) y `/actualidad` empiezan a clicar.
- [ ] **Replicar el patrón categoría+FAQ** en las categorías con impresiones y sin FAQ: `/restaurantes/`, `/belleza/`, `/deporte/`, `/inmobiliarias/` (con datos reales: horarios, domingos, mejor valorado).
- [ ] **Post-evento (después del 4-oct)**: balance de Tapaveral (tapas ganadoras, locales participantes) y de la V Carrera Popular; refrescar ambos posts con los resultados si hay fuente.
- [ ] **Verificación in situ (John)** — `VERIFICAR-EN-PERSONA.md`: Obramat (¿existe / otro rótulo?), Mediadores Inmobiliarios (¿= SM Homes?), **BunBun** (número exacto, calle «Elías», apertura — su web sigue sin incluir El Cañaveral), **Música de los Ríos** (QR del cartel, dirección, teléfono, fecha; el curso ya ha empezado).
- [ ] **Guía de terrazas — PARKED**: John aporta datos a medida que visita locales en persona (campos `terraza`/`delivery` ya se capturan con Apify desde `additionalInfo`).
- [ ] **Legales Opción B**: NIF + domicilio fiscal en aviso-legal/privacidad si John factura en serio (decisión del cliente; hoy = Opción A sin NIF).
- [ ] **Fiestas**: ampliar con más ferias reales de zonas cercanas cuando toque temporada (hub `/fiestas` ya operativo).
- [ ] **Hubs por afinidad**: «familias con peques» (guarderías + parques + pediatría) — el motor de afinidad ya existe (`AfinidadFilter`).
- [ ] **Leads**: refrescar `prospecting/` con `leads_prospecting.py` cuando se quiera una ronda nueva de prospección a pie de calle.
- [ ] **Boilerplate replicable**: documentar para nuevos barrios (Sanchinarro, Valdebebas, Rivas…) — el motor directorio+guías+drip+pilares es portable; referencia viva: azul-flojito (ya lo usó).
- [ ] **Guía de terrazas — PARKED**: John aporta datos a medida que visita locales en persona (campos `terraza`/`delivery` ya se capturan con Apify desde `additionalInfo`).
- [ ] **Legales Opción B**: NIF + domicilio fiscal en aviso-legal/privacidad si John factura en serio (decisión del cliente; hoy = Opción A sin NIF).
- [ ] **Fiestas**: ampliar con más ferias reales de zonas cercanas cuando toque temporada (hub `/fiestas` ya operativo).
- [ ] **Hubs por afinidad**: «familias con peques» (guarderías + parques + pediatría) — el motor de afinidad ya existe (`AfinidadFilter`).
- [ ] **Leads**: refrescar `prospecting/` con `leads_prospecting.py` cuando se quiera una ronda nueva de prospección a pie de calle.
- [ ] **Boilerplate replicable**: documentar para nuevos barrios (Sanchinarro, Valdebebas, Rivas…) — el motor directorio+guías+drip+pilares es portable; referencia viva: azul-flojito (ya lo usó).
- [ ] **Roadmap maestro de contenido**: `IDEAS-CONTENIDO.md` (pilares + frentes «desde el Cañaveral») sigue vivo como backlog.

## Nota entorno (resumen — detalle completo en `memoria.md`)

- **Build local NO corre** en el sandbox DSH (`spawn EPERM` de Vite) → la verificación es el **deploy de Netlify** (comprobar en vivo con Node fetch: página 200, sitemap, contenido).
- **Push**: receta de `memoria.md` — `GIT_CONFIG_GLOBAL` vacío + `http.sslBackend=openssl` + header con `gh auth token` (ssh.exe y schannel fallan dentro del sandbox; intentarlo por SSH es perder el tiempo).
- **GSC**: API v3 directa con la credencial de `~/mcp-gsc/` (auxiliar `.tmp/gsc-query.mjs`) — propiedad `sc-domain:elcanaveral.info`, dimensiones `page` fiables / `query` parcial.

## Decisiones pendientes del cliente

- ¿Legales Opción B (NIF + domicilio fiscal) ya, o seguir con Opción A?
- Prioridad del próximo frente: ¿SEO fino de fichas (segunda ronda) · actualidad estacional · terrazas · o boilerplate para otro barrio?
- ¿Aportar datos de calle para la guía de terrazas (visitas a locales) cuando tengas un rato?
