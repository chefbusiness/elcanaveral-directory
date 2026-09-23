# ROADMAP — elcanaveral.info

> Actualizado: **SESIÓN 2026-09-23** — auditoría **GSC #4** (crecimiento por amplitud: +58 % clics, +57 % impr; el CTR de fichas de marca sigue a 0 % → el ROI está en categorías/zonas/FAQ), acciones sobre los clusters nuevos (`/supermercados/` y `/educacion/` con intro+FAQPage, 6 fichas más con overrides) y **bug de render del FAQ corregido**. Próxima: **GSC #5 (~mediados de octubre)** y verificación in situ (John).

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
- [x] **Acciones GSC #4 (23-sep, commit `2eb2b17`)**: `/supermercados/` intro + FAQPage con el dato de **los 6 súpers que abren los domingos** (cluster alcampo/ahorramas, ~150 impr pos 6-7) · `/educacion/` intro + FAQPage · **6 fichas nuevas con overrides** (estanco, mi-alcampo, ahorramas, aupa, farmacia-sonrisas, vicalcan) → 16 en total · **fix del render del FAQ** (los enlaces internos salían como HTML escapado y ensuciaban el JSON-LD).

## Pendiente ⬜

- [ ] **GSC #5 (~mediados de octubre 2026)** — medir si el patrón «categoría/zona + FAQ» mueve el CTR (comparar `/supermercados/`, `/educacion/`, `/fruterias/`, `/tiendas-alimentacion/`); comprobar si guías (32) y `/actualidad` (pos 83, 82 impr) empiezan a clicar.
- [ ] **Replicar el patrón categoría+FAQ** en las categorías con impresiones y sin FAQ: `/salud/`, `/mascotas/`, `/panaderias/`, `/restaurantes/` (con datos reales: horarios, domingos, mejor valorado).
- [ ] **Verificación in situ (John)** — `VERIFICAR-EN-PERSONA.md`: Obramat (¿existe / otro rótulo?), Mediadores Inmobiliarios (¿= SM Homes?), **BunBun** (número exacto de Miguel Delibes, calle «Elías», fecha de apertura), **Música de los Ríos** (escanear QR del cartel, dirección exacta, teléfono, fecha). *(El curso 2026/27 ya ha empezado: comprobar si abrió la escuela de música o el local de BunBun.)*
- [ ] **Contenido estacional**: Tapaveral + V Carrera Popular (2-4 oct) — refrescar con el programa/programa de tapas cuando se publique y balance después; vuelta al cole (curso ya arrancado: datos reales del inicio si hay algo con fuente).
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
