# HANDOFF — elcanaveral.info

> Hoja de arranque y estado del proyecto. Última actualización: **2026-09-27 (sesión c — concordancia de guías + llms-full.txt)**.
> 👉 Trilogía de contexto: `handoff.md` (estado/sesiones) · `memoria.md` (contexto, entorno y límites — leer
> antes de retomar) · `roadmap.md` (hecho/pendiente priorizado). La receta de push del sandbox y el acceso
> GSC por API están en `memoria.md`.

## Identidad del proyecto

| | |
|---|---|
| **Qué** | Directorio hiperlocal del barrio El Cañaveral (Vicálvaro, Madrid) |
| **Live** | https://www.elcanaveral.info/ (canonical `www`, apex 301 → www) |
| **Local (Windows/DSH)** | `C:\Users\User\Documents\elcanaveral-directory` |
| **Repo** | github.com/chefbusiness/elcanaveral-directory (privado) |
| **Stack** | Astro 5 + Tailwind v4 + pnpm · deploy Netlify |
| **Marca operadora** | LocalSEOAds.com · email contacto `local@elcanaveral.info` |
| **HEAD ref** | `02272ed` (fixes del review de llms-full) · `a5e91cf` (llms-full) · `e34fcd6`/`2a6e35f` (concordancia) — 286 negocios, 32 guías, 10 posts, sitemap **434 URLs** · JSON-LD Organization/WebSite en home · `/llms.txt` + `/llms-full.txt` generados en build |

## ✅ Sesión 2026-09-27c (Windows local, DSH) — concordancia de las guías + `llms-full.txt`

**Los dos frentes pendientes del cierre anterior, pedidos por John: «¡adelante con todo!».**

### 1. Concordancia de género en las guías «mejores X» (commits `2a6e35f` · `e34fcd6`)

El generador de guías de zona (`scripts/generate_zone_listicles.py`), pese a tener el campo `el`/`la` por
configuración, fijaba el prefijo **«Las mejores»** → **7 guías con el título roto**: «Las mejores
**restaurantes** de Coslada», «Las mejores **veterinarios** de Vicálvaro», «Las mejores **talleres mecánicos**
de San Fernando»… Afectaba a **`h1` + `metaTitle` + `metaDescription` + `intro`** (28 campos) y, en las 18 guías
de zona, al cierre «Solo aparecen **las** que mantienen 4 estrellas» (→ «los negocios»).

- **Migración campo a campo** (`.tmp/fix-concordancia.mjs`, 47 líneas de datos): el género se deduce **del propio
  campo**, no del campo `noun`, porque hay guías legítimas con `h1` femenino y `metaTitle` masculino
  (`mejores-veterinarios-el-canaveral`: «Las mejores **clínicas veterinarias**» / «Los mejores **veterinarios**»)
  — arreglar por `noun` habría **creado** errores nuevos. Dos trampas más que cazó el propio audit:
  «panaderías **y obradores** mejor **valorados**» (grupo mixto → masculino, RAE) y «tiendas de ropa **y moda**
  mejor **valoradas**» (la cabeza es `tiendas`; `moda` es complemento, no segundo núcleo).
- **Generador corregido** (`Los/Las`, `los/las`, `Estos/Estas`, `-o/-a en participios`), probado con el Python
  del runtime: `restaurantes` → «Los mejores restaurantes», `clínicas dentales` → «Las mejores clínicas dentales».
- **Auditoría propia**: 0 discordancias en 32 guías × 7 campos; en `dist`, **0 `h1` discordantes** en las 438
  páginas. Las femeninas correctas quedaron intactas (`mejores-clinicas-dentales-coslada`) — verificado.

### 2. `llms-full.txt` — versión extendida para LLM (commit `a5e91cf`)

Endpoint `src/pages/llms-full.txt.ts` (generado en build, imposible de desincronizar). **342 KB, 2.127 líneas**:

- **286 fichas** con descripción, zona, dirección, teléfono, web, ★valoración + nº de reseñas, horario y
  servicios, cada una con su **URL canónica**.
- **32 guías** con metaDescription, intro, FAQ y el **ranking real** (mismo motor bayesiano que la web vía
  `getRankedNegocios` → reproducible desde `/data/negocios.json`, no una lista escrita a mano).
- **10 noticias** con fecha, entradilla, datos clave y **cuerpo completo** en texto plano; los enlaces internos
  se convierten a `texto (URL absoluta)`.
- **Verificado**: 365 enlaces únicos, **0 rotos** contra `dist`; **0** etiquetas HTML o entidades residuales;
  `llms.txt` enlaza la versión extendida (**88 enlaces**) y `public/_headers` sirve ambas como
  `text/plain; charset=utf-8` con caché de 1 h.

**Revisión adversarial de cierre (subagente) → 1 grave + 5 menores, TODOS corregidos** (commit `02272ed`):

1. *Grave*: las fichas con `estado: "proxima-apertura"` (BunBun y Música de los Ríos) salían como negocios
   operativos → un LLM las citaría como abiertas. Ahora llevan `Estado: PRÓXIMA APERTURA (anunciado, todavía sin
   abrir)`.
2. Menores: faltaban las **fuentes** de las 10 noticias (22 URLs externas, ya volcadas) · la frase «el dataset
   tiene el mismo contenido que este fichero» era falsa (añade coordenadas, `placeId`, imágenes…) · la cifra de
   coordenadas de `llms.txt` (283) parecía contradecir la nota de las 4 descartadas → ahora «283 en el dataset,
   **279 publicadas** en el schema» (el guard de coordenadas se expone como `coordenadasPlausibles()` para no
   duplicar constantes) · las secciones de categoría y de zona compartían el patrón `### Nombre (N fichas)`, lo
   que hacía que un parser contase 20 categorías y sumase las 286 fichas dos veces → ahora `### Categoría: …` /
   `### Zona: …` · la descripción del ranking citaba «nota media × volumen» cuando la fórmula es
   `score = (v/(v+m))·R + (m/(v+m))·C` con C/m por categoría (ya se explica así, con los filtros de cada guía).

**Lo que el reviewer confirmó sin hallazgo**: el ranking de `llms-full.txt` es **idéntico** (orden, nombres,
notas y nº de reseñas) al que renderizan las 32 páginas de guía · 286/286 fichas y 32/32 guías volcadas ·
**376/376 URLs responden 200** en vivo · sin emails de terceros, `placeId`, coordenadas ni el dominio
`farmaciasonrisascanaveral.com` (blocklist) · 0 concordancias de género pendientes en 32 guías y 439 páginas.


## ✅ Sesión 2026-09-27b (Windows local, DSH) — bloque GEO: entidad, fichas y llms.txt

**Punto de partida:** pregunta de John — «además del sitemap, ¿tenemos todo preparado para GEO, llms.txt, etc.?».
Auditoría del repo: los cimientos estaban (robots con `GPTBot`/`ClaudeBot`/`PerplexityBot`/`Google-Extended`/
`Applebot-Extended`, llms.txt, schema por tipo de página) pero con **4 huecos de peso** para citación por LLM.

**El hallazgo que más dolía:** el `public/llms.txt` **estático** se había desincronizado → citaba
`info@localseads.com` cuando el email real es **`local@elcanaveral.info`** (verificado en 18 sitios del código),
omitía la categoría **inmobiliarias**, estaba en ASCII sin eñes («El Canaveral») y **no incluía ni un enlace**,
cuando el estándar llms.txt es precisamente un índice de enlaces.

**Desplegado (commits `2fcf6ee` · `ec96751` · `5f7a8eb`):**

1. **Home sin ningún JSON-LD** → `Organization` + `WebSite` (`src/pages/index.astro`): nombre + `alternateName`
   sin eñe, logo, email, `areaServed` (Madrid · Coslada · San Fernando de Henares), `knowsAbout` con las 17
   categorías, `parentOrganization` LocalSEOAds y `publisher` cruzado por `@id`. **Sin `SearchAction` a
   propósito**: la búsqueda es client-side (Fuse.js sobre `/data/negocios.json`) y no existe URL de resultados
   con parámetro → declararla sería una señal falsa.
2. **Fichas** (`generateLocalBusinessSchema`, `src/lib/directory.ts`): `@id` estable por ficha · `url` = web
   oficial (o la ficha si el negocio no tiene web) · **`addressLocality` = MUNICIPIO** (antes ponía el barrio,
   que Google no resuelve) + `postalCode` desde `zonas.json` · **`geo`** (283 fichas) · **`hasMap` por
   `place_id`** (286) · **`sameAs`** (Maps + redes normalizadas) · `areaServed` [City + barrio cuando difieren]
   · guard de `aggregateRating` sin reseñas (markup inválido).
3. **`/llms.txt` generado en build** (`src/pages/llms.txt.ts`; se borró el estático): 87 enlaces (hubs, 16
   categorías, 4 zonas, 32 guías, 10 noticias, dataset y contacto), UTF-8 con tildes, fecha real del contenido
   más reciente y **cobertura de campos declarada con números reales** (dirección 286 · teléfono 260 · web 206 ·
   horario 123 · valoración 280 · coordenadas 283, sobre 286) — prometer los cinco campos para las 286 fichas
   era un dato falso que un LLM podía repetir.
4. **`public/_headers`**: `text/plain; charset=utf-8` + caché de 1 h para `/llms.txt`.

**Bug colateral corregido:** el enlace de Instagram de la ficha incrustaba el dato tal cual
(`https://instagram.com/${valor}`) y una ficha trae URL completa (`bunbun-canaveral`) → **enlace roto en
producción**. Nuevo `socialProfileUrl()` en `src/lib/directory.ts` normaliza handle/`@`/URL y lo comparten el
HTML y el `sameAs` del schema.

**Verificación:** el build local **sí corre** en el sandbox si se concede el retry con acceso total
(ver `memoria.md`: `spawn EPERM` de Vite es del modo confinado, no del proyecto) → **438 páginas en 12 s**.
Validaciones propias en `.tmp/` (scratch, gitignored): `validate-geo.mjs` (571 bloques JSON-LD, **0 errores de
parseo**; geo 283 · hasMap 286 · sameAs 286 · postalCode 286 · municipio 286 · 0 `aggregateRating` sin reseñas),
`validate-llms-links.mjs` (**87 enlaces, 0 rotos** contra `dist/`) y `gate.mjs` (canonical, h1, lang, title,
robots/sitemap/llms, secretos → **438 páginas, 0 blockers, 0 avisos**).

**Deuda consciente detectada y NO tocada (candidata a próxima sesión):**

- **Revisión adversarial (subagente) antes de cerrar → 1 bloqueante y 1 grave, YA CORREGIDOS** (commit `2880e93`):
  1. *Bloqueante*: yo tomaba el `postalCode` del genérico de la zona y **contradecía el CP que ya lleva la
     propia dirección en 60 fichas** (58 de Coslada: se emitía 28822 a direcciones 28820/28821/28823) → ahora el
     CP sale de `streetAddress` (lo traen las 286) y el de `zonas.json` queda solo como fallback. **0 contradicciones.**
  2. *Grave*: `geo` con coordenadas imposibles en **4 fichas** (Alemania, Venezuela, Bogotá, Cádiz) del mismo
     scrape → nueva caja de cordura del área (lat 40.2-40.6 / lng −3,95 a −3,2): sin `geo` fuera de ella y,
     en esas fichas, `hasMap` se resuelve **por dirección** en vez de por un `placeId` del que ya no nos fiamos.
     Detectado y anotado en `VERIFICAR-EN-PERSONA.md` para re-enriquecer. `geo`: 283 → **279** (los 4 corruptos).
  3. Menores corregidos: `sameAs` ya no duplica la URL de `hasMap` · el `publisher`/`author` de las 10 noticias
     apunta por `@id` a la misma `Organization` de la home (antes eran dos organizaciones distintas; se conserva
     `name`+`logo` porque el rich result de Article los exige) · la cifra de «web propia» de `llms.txt` ya no
     cuenta los 16 perfiles sociales como web (190 reales) · fallback de `municipio` para que `areaServed` nunca
     emita una `City` sin `name`.
- **Concordancia rota en 7 guías de zona**: «Las mejores **restaurantes** de Coslada», «Las mejores
  **veterinarios**…», «Las mejores **talleres mecánicos**…» → afecta a `h1`, `metaTitle` e `intro` (7 + 7 + 7
  campos). Nace del prefijo fijo `"Las mejores {pl}"` de `scripts/generate_zone_listicles.py` (líneas 67-70) →
  arreglar en el **generador + datos**, no a mano (la próxima regeneración lo revertiría).
- **`openingHours` sigue en texto libre español** («L-S 9:00-21:00, D 10:00-14:00»); schema.org espera ISO
  («Mo-Sa 09:00-21:00»). Se deja tal cual **a propósito**: traducirlo automáticamente puede publicar un horario
  equivocado, y en un directorio local eso es peor que un campo que Google ignora. Requiere mapeo revisado.
- **16 fichas guardan un perfil social en `website`** y el HTML lo rotula «Visitar web»: el `url` del schema
  apunta al perfil (como antes), pero la etiqueta engaña. Arreglo = mover ese dato a `redesSociales` (migración
  de datos + `sameAs` con cobertura de 1/286 → 17/286).
- **`Organization` sin `sameAs`**: el sitio no tiene perfiles sociales propios verificados (las cuentas de
  `comunidad.json` son de terceros del barrio) → no se inventan.
- **Bloque GEO pendiente**: `llms-full.txt` (no pedido en esta sesión) y replicar `Organization` en todas las
  páginas en vez de solo la home.


## ✅ Sesión 2026-09-27 (Windows local, DSH) — retirada de la web de una ficha (solicitud del titular)

**Petición recibida** (email a LocalSEOAds/elcanaveral.info): **Mª Lourdes Pulido López, titular de Farmacia
Sonrisas del Cañaveral** (C/ Anna Frank, 10 — `farmacia-sonrisas-canaveral`), pide **eliminar cualquier
referencia a `farmaciasonrisascanaveral.com`** como web de la farmacia: el dominio caducó, lo registró un
tercero y ya no está bajo su control (Google sigue asociándolo por páginas externas). Mientras no se
resuelva, **la ficha no debe llevar ningún enlace a una web**.

1. **Dato retirado:** campo `website` eliminado de la ficha en `src/data/negocios.json`. Con eso la ficha se
   renderiza sin enlace (`{negocio.website && …}` en `[categoria]/[slug].astro`) y sin `url` en el JSON-LD
   `LocalBusiness` (`generateLocalBusinessSchema`). Eran las dos únicas apariciones en el sitio.
2. **Guard anti-reaparición** (el enriquecimiento de Google/Apify repone webs): nuevo
   `src/data/website-blocklist.json` + `src/lib/website-guard.js`, aplicado en `loadNegocios()`
   (`src/lib/directory.ts`) y en `scripts/copy-data.mjs` → el dominio bloqueado no puede publicarse ni en
   HTML/JSON-LD ni en `/data/negocios.json`, aunque vuelva a entrar en el JSON fuente.
3. `public/data/negocios.json` regenerado (diff de 1 línea: copia byte a byte cuando la fuente ya está limpia).
4. ✅ **Verificado en vivo (27-sep, tras deploy):** ficha 200 **sin** enlace, sin botón «Visitar web» y sin `url`
   en el JSON-LD; `/data/negocios.json` limpio; teléfono/dirección/horario intactos. (El build local sigue sin
   correr en este sandbox — `spawn EPERM` de Vite — así que la verificación es contra producción.)
5. **Alcance:** lo nuestro termina en el sitio (no enlazar el dominio). Que Google lo siga asociando por
   **páginas externas de terceros** no es competencia nuestra; si la titular quiere, ella misma pide la
   reindexación en Search Console. Nada pendiente por nuestra parte.
6. **Cierre:** commits `eb57149` (datos + guard) y `056646b` (alcance en docs), pusheados a `master`; repo
   limpio y sincronizado. Sitemap en vivo: 434 URLs · ficha 200.

## ✅ Sesión 2026-09-23 (Windows local, DSH) — auditoría GSC #4 + clusters nuevos

1. **GSC #4 (API directa, ventanas de 28 días).** PRE (29-jul→25-ago): 12 clics · 1.162 impr · CTR 1,03 % ·
   pos 10,6. POST (26-ago→23-sep): **19 clics · 1.823 impr · CTR 1,04 % · pos 12,2**. Acumulado desde
   16-abr: **53 clics · 6.609 impr · CTR 0,80 % · pos 10,7**.
   → **Lectura clave: el sitio crece por AMPLITUD** (+58 % clics, +57 % impresiones; 110 queries con
   impresiones en POST vs 54 en PRE), **no por CTR**. Los overrides de title/meta del 31-ago **no movieron
   el CTR** de las fichas objetivo (siguen ~0 %; alguna incluso perdió impresiones) y la posición media baja
   al entrar queries nuevas más lejanas.
   → **Lo que SÍ convierte**: páginas de **categoría/zona** (`/cafeterias/` 2,02 %, `/tiendas-alimentacion/`
   4,55 %, `/zona/el-canaveral/supermercados/` 2,99 %) frente al **~0 % de las fichas de marca** (el Map
   Pack se lleva el clic). El ROI está en listados/comparativas, no en fichas de marca.
2. **Clusters nuevos detectados (buena posición, 0 clics):** `estanco el cañaveral` (88 impr pos 6),
   `alcampo / ahorramas / mi alcampo cañaveral` (~150 impr pos 6-7), `escuela infantil aupa` (39 impr),
   `farmacia sonrisas del cañaveral` (34 impr), `panaderia bulevar` (16 impr).
3. **Acciones desplegadas (commit `2eb2b17`, verificadas en vivo):**
   - **`/supermercados/`** — intro + FAQPage (4 preguntas) con el dato de **los 6 supermercados que abren
     los domingos** (Ahorramas, Lidl, Mi Alcampo, Hiper Cañaveral, Covirán Plus, Casa Elías) + title/description
     nuevos con el gancho «domingos». Ataca el cluster de mayor volumen detectado.
   - **`/educacion/`** — intro + FAQPage (4 preguntas: escuelas infantiles 0-3, la mejor valorada,
     academias de inglés, escuela de música).
   - **6 fichas nuevas con overrides** (ya son 16): estanco-el-canaveral, mi-alcampo, ahorramas,
     escuela-infantil-aupa, farmacia-sonrisas-canaveral, vicalcan-veterinario.
   - 🐛 **Bug corregido en producción:** las respuestas de FAQ con enlaces internos se mostraban como
     **HTML escapado** (`&lt;a href=…`, visible en `/fruterias/` desde el 31-ago) y metían HTML crudo en el
     JSON-LD. Ahora: respuesta con `set:html` (enlace clicable) y schema con **texto plano** (`stripHtml`).
4. **Segunda tanda de la sesión (commits `3b859fc`, verificado en vivo):**
   - **Post #10** `canaveral-11-45-viviendas-publicas-alquiler-asequible` — obras terminadas de **Cañaveral 11**
     (45 viviendas, 64 garajes, 45 trasteros; sorteo **principios de 2027**; 12,02 M€ con 2,1 M€ de fondos
     Next Generation; requisitos 3,5 × IPREM y renta ≤ 30 % de los ingresos). Fuente: **Nuevo Sureste
     (21-sep-2026)** + Diario de Madrid para el contexto de EMVS (1.212 viviendas en 13 promociones).
   - **Post de Tapaveral refrescado**: el evento se anuncia oficialmente como **«V Feria de la Tapa»** y ya
     con la información de público (tapa + bebida a precio especial, votación y premios: 2 cenas para dos +
     cesta gourmet). Se añadió la página del evento a las fuentes.
   - **3 categorías más con intro + FAQPage** → ya son **7** con FAQ: `/supermercados/`, `/educacion/`,
     `/salud/` (7 farmacias, 6 dentales, 6 de fisio), `/mascotas/` (urgencias 24 h, peluquerías caninas),
     `/panaderias/` (4 abren domingos, pan de leña y masa madre), `/fruterias/`, `/tiendas-alimentacion/`.
   - 🐛 **Enlace roto corregido**: `/educacion/escuela-infantil-nemomarlin-canaveral/` → `/educacion/nemomarlin-canaveral/`
     (detectado por el nuevo validador de enlaces internos de `.tmp/validate-links.mjs`).
   - ✅ **BunBun sigue sin confirmar**: su web oficial no incluye El Cañaveral (solo Moratalaz, Sanse y
     Metropolitano) → la ficha se mantiene en `estado: proxima-apertura`.
5. **Pendiente (GSC #5, ~mediados de octubre):** medir si el patrón «categoría/zona + FAQ» mueve el CTR;
   si funciona, replicarlo en las categorías con más impresiones (`/restaurantes/`, `/belleza/`, `/deporte/`)
   y no seguir invirtiendo en fichas de marca. Balance post-evento de Tapaveral/Carrera (después del 4-oct).

## ✅ Sesión 2026-08-31 (Windows local, DSH) — auditoría GSC #3 + post de Tapaveral/Carrera

**Entorno nuevo:** el trabajo pasa a DSH en Windows (`C:\Users\User\Documents\elcanaveral-directory`).
⚠️ **Restricciones del sandbox DSH (no del proyecto):** `astro build` local falla con `spawn EPERM`
(Vite) → la verificación real sigue siendo el deploy verde de Netlify (CI). **Git push: RECETA
PROBADA en este sandbox** (idéntica a `azul-flojito-directorio-local-canarias/memoria.md`):
remote a https sin token (`git remote set-url origin https://github.com/chefbusiness/elcanaveral-directory.git`)
+ `$env:GIT_CONFIG_GLOBAL = <archivo vacío en $TEMP>` (bypass del gitconfig global: su
`insteadOf https→ssh` rompe el push) + `git -c http.sslBackend=openssl -c "http.https://github.com.extraHeader=Authorization: Basic $b64" push origin master`
con `$b64` = base64(`x-access-token:` + `gh auth token`). (schannel falla `SEC_E_NO_CREDENTIALS`;
ssh.exe falla `signal pipe`; el exit 1 de pwsh es solo el wrapper de stderr.)

- **GSC: acceso DIRECTO ya restaurado (sin CSVs).** El MCP `gscServer` no está corriendo en este
  entorno, pero las credenciales viven en `~/mcp-gsc/` (`token.json` + `client_secrets.json`).
  Con ellas se llama a la **Search Console API v3** (webmasters) desde Node y se extrae todo el
  rendimiento: helper `.tmp/gsc-query.mjs` + raws en `.tmp/gsc-raw/` (gitignored). Propiedad:
  `sc-domain:elcanaveral.info` (¡ojo: la URL property `https://elcanaveral.info/` del mismo
  cuenta está vacía; hay que usar la de dominio).
1. **Auditoría GSC #3** (sección abajo): 35 clics · 4.965 impr · CTR 0,70 % · pos 10,5
   (16-abr→31-ago). Ventana nueva (20-jul→31-ago): 17 clics · 1.698 impr · **CTR 1,00 %**.
   El CTR casi se dobla vs #2 (0,58 %) — la apuesta por contenido comparativo/informativo paga.
2. **Post de actualidad (8º)** `tapaveral-2026-y-v-carrera-popular-el-canaveral`: Tapaveral 2026
   (2-4 oct; inscripción de locales hasta 6-sep 23:59) + V Carrera Popular «Corre para Dar Vida»
   (4 oct, 10K/5K/infantiles, 12 €). Fuentes: vibecanaveral.es (2 páginas verificadas hoy).
   Enlaces internos a `/restaurantes/`, `/cafeterias/`, `/deporte/`, `/comunidad/`.
2b. **Post de actualidad (9º)** `vuelta-al-cole-2026-2027-el-canaveral` (31-ago): calendario oficial
   BOCM — 7-sep Infantil/Primaria/EE, 8-sep ESO/Bach/FP, fin 18-jun-2027 — + contexto local
   (CEIPSO 2º curso, IES curso 27/28, academias de inglés ⭐4,8+, Música de los Ríos, 3ª escuela
   infantil). Fuentes verificadas: madridinforma + gacetinmadrid (26-ago). ⚠️ Los medios difieren en
   los rangos exactos de Navidad/Semana Santa → el post solo afirma los datos coincidentes.
3. **Acciones CTR de la auditoría DESPLEGADAS (commits `c62a5e0` y `6c3b949`, verificado en vivo):**
   nuevo bloque `fichas` en `seo-overrides.json` + soporte en `[categoria]/[slug].astro` → title/meta
   propios para **10 fichas** con impresiones y 0 % CTR (obrador-de-goya, sanitas-dental, churreria-bernis,
   la-belle-vie, mr-kebab, levaduramadre, supermercado-el-canaveral, **panaderia-bulevar, masruedas-coslada,
   dreamfit-valdebernardo**). Y en `[categoria]/index.astro` soporte `intro` + `faq` por categoría →
   intro con cross-links + FAQPage en `/fruterias/` (4 preguntas) y en `/tiendas-alimentacion/` (3 preguntas).
4. **Único build fallido esperado:** el sandbox impide build local; sin cambios de código, el
   commit siguiente lo verifica Netlify por push de John.
5. **Pendiente accionable de la auditoría (próxima sesión):** re-evaluar en GSC tras 4-6 semanas
   si las 7 fichas y `/fruterias/` ganan CTR; seguir con el resto de fichas con >30 impr si funcionó.


## ✅ Sesión 2026-08-21 (local) — 2 aperturas nuevas + estado `proxima-apertura`

⚠️ **CAMBIO DE ENTORNO:** la VM de **Abacus ya NO se usa**. El trabajo continuado pasa a la **VPS propia de
Hostinger** (Claude Code instalado allí, varios proyectos) y el **Mac local** se usa para sesiones puntuales.
**GitHub es SIEMPRE la última versión:** toda sesión empieza con `git pull --ff-only` y termina con `push`.
Recordatorio: el repo se mueve solo — la Action `publish-scheduled.yml` pushea a diario (06:15 UTC).

1. **Dos negocios anunciados en el barrio, dados de alta antes de abrir** (fuente: @hug0nES en X, 20-21 ago):
   - **BunBun — Açaí, Brunch & Bakery** (`/cafeterias/bunbun-canaveral/`), Av. de Miguel Delibes esq. calle
     Elías. Cadena real (bunbun.es) con locales en Moratalaz, Sanse y Metropolitano (este abrió el 7-ago-2026).
     ⚠️ El Cañaveral **no figura aún en su web** ni en Google Maps: sin fecha de apertura confirmada.
   - **Música de los Ríos** (`/educacion/musica-de-los-rios-canaveral/`), Av. de Blas de Lezo esq. calle
     Diálogo. Cartel de próxima apertura: curso 2026/2027, música para bebés, música y movimiento, canto,
     piano, violín, guitarra y percusión, QR con 50 % dto. de matrícula. Sería la **primera escuela de música
     del barrio**. ⚠️ Hay una escuela homónima en Chamberí (Fernández de los Ríos, 30) pero **NO está
     confirmado** que sea la misma marca — no afirmarlo hasta verificarlo.
2. **Nuevo estado `estado: "proxima-apertura"`** en el esquema de negocio (`src/lib/directory.ts`) + badge azul
   en `NegocioCard.astro` y en la ficha. Un negocio sin `rating`/`numReviews` **ya quedaba fuera de las guías**
   por el filtro de `src/lib/listicles.ts:72` → no contamina el ranking bayesiano. No hizo falta tocar el motor.
3. **Post de actualidad (7º)** `nuevas-aperturas-el-canaveral-agosto-2026`, con enlaces contextuales a las dos
   fichas, a `/cafeterias/` y a `/educacion/`. Para que los enlaces funcionen, los párrafos de
   `actualidad/[slug].astro` pasan a renderizarse con `set:html` (y se escapó el `&` de "Lilo &amp; Stitch" del
   post del cine). **Al escribir párrafos nuevos: escapar `&`, `<` y `>`.**
4. 🐛 **Bug corregido en `NegocioCard.astro`:** el emoji de respaldo (fichas sin foto) se elegía comparando
   `categoryName` **escrito sin tildes** (`"Educacion e Infantil"`, `"Belleza y Peluquerias"`) contra unos datos
   que **sí las llevan** → nunca coincidía, y `Cafeterías` ni estaba en el mapa. **7 de las 9 fichas sin foto
   mostraban el 🏪 genérico.** Ahora el mapa se indexa por **slug de categoría** (estable y sin tildes) y cubre
   las 16. 💡 Patrón: no usar nunca un nombre visible con acentos como clave de comparación.
5. **GSC (28 d, vía MCP `gscServer` — el agente YA tiene acceso, no hacen falta CSVs):** 14 clics · 1.098 impr ·
   **CTR 1,28 %** (era 0,58 % el 20-jul, más que dobla) · pos. media 9,6. Mejor página `/cafeterias/`
   (212 impr, 2,83 % CTR); peor conversión `/fruterias/` (262 impr, 0,38 %, queries de marca de Megafruta).
   Las 32 guías aún no asoman. `brunch cañaveral` ya recibe impresiones → BunBun encaja en el hueco.

### ✅ Verificación en producción (2026-08-21, sin build local por la regla térmica)
Deploy de Netlify **verde**, comprobado contra la web en vivo: las 3 URLs nuevas responden 200 · badge
"Próxima apertura" presente en ambas fichas · los 4 enlaces internos del post renderizados por `set:html` ·
`Lilo &amp; Stitch` bien escapado en el post del cine · emoji correcto en las tarjetas sin foto (☕ y 📚) ·
BunBun **no** aparece en la guía de cafeterías (correcto: sin nota) · sitemap 428 → **431 URLs**.

### Pendiente de VERIFICAR EN PERSONA (ver `VERIFICAR-EN-PERSONA.md`)
- **BunBun:** número exacto de Miguel Delibes y qué calle es "Elías"; fecha de apertura.
- **Música de los Ríos:** escanear el QR del cartel para confirmar si es la escuela de Chamberí; dirección
  exacta, teléfono y fecha de apertura.

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

- **267 negocios** (eran 107) · 16 categorías · 4 zonas. Poblado con Apify discover + `add_discovered.py` (rondas 2026-06-26 y 2026-07-07). Rutina repetible: `apify_enrich.py --mode discover` → `add_discovered.py --write` → `fetch_photos_by_placeid.py --only-missing --write` → convertir nuevas fotos a WebP.
- **📰 Blog de actualidad con ritmo** (`/actualidad`, 4 posts): parque comercial, verano/cine 2026, +15 M€ equipamientos, primer instituto (IES). **Rutina "día como hoy": buscar novedades reales (nuevosureste.es, avelcanaveral.es, vibecanaveral.es, diario.madrid.es) → publicar con fuente + actualizar posts antiguos.** REGLA: solo hechos reales con fuente.
- **Menú superior** con desplegable "Guías del barrio" (todos los pilares) + Actualidad — antes solo estaban en el footer.
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
1. **📰 Blog de actualidad** — ✅ ESTRENADO (2026-06-28) y con **6 posts** a 20-jul. `/actualidad` + `/actualidad/[slug]`, datos en `src/data/actualidad.json` (drip-aware, schema NewsArticle). **REGLA: solo hechos reales con fuente, NO inventar noticias; comprobar la FECHA de la fuente y confirmar las cifras en la fuente (no en el resumen del buscador).** Rutina repetible: buscar novedades → publicar con fuente → refrescar posts antiguos.
2. **Auditoría GSC** — ✅ #1 (15-jul) · ✅ #2 (20-jul) · ✅ **#3 (31-ago, sección abajo)**.
   Método nuevo: API v3 directa con credenciales de `~/mcp-gsc/` (sin CSV). **Próxima: ~finales de
   septiembre** (maduracion de guías + actualidad + vuelta al cole).
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

## 📊 Auditoría GSC #1 — 2026-07-15 (export "Performance on Search", datos reales desde 16-abr)
CSVs guardados en `~/gsc-elcanaveral-2026-07-15/`. **Baseline: 17 clics · 2.752 impr · CTR 0,62% · pos media ~11-12.**
- **Historia:** impresiones creciendo bien (indexación OK), pero casi todo en página 2 (pos 6-12) y queries de marca hiperlocal → el pack de Maps se come el clic. Motor de impresiones = páginas de categoría (`/fruterias/` 338, `/cafeterias/` 286).
- **✅ Fix desplegado (commit 1d325ae):** URLs viejas de WordPress daban 404 pese a rankear — `/directory/family-mini-market-2/` rankeaba **#1 y era 404** → 301 en `public/_redirects` a destinos vivos. (non-www→www y trailing-slash ya redirigían bien.)
- **✅ Contenido sobre demanda GSC (commit 7645785):** creadas `mejores-cafeterias-el-canaveral` y `mejores-veterinarios-el-canaveral` (huecos con demanda), reforzada guarderías con ángulo inglés/bilingüe. Palanca "optimizar categorías": ya estaba hecha en `seo-overrides.json`.
- **Oportunidades abiertas:** guarderías/gimnasios rankean pág. 5 (demanda de padres/deporte) — guías reforzadas, falta ganar autoridad. **Re-auditar GSC en ~4-6 semanas.**

## 🎓 Pack "vuelta al cole" — 2026-07-20
Jugada estacional: el cluster de inglés/guarderías de GSC (~70 impresiones en posiciones 22-65) se ataca **ahora** para que madure antes del pico de septiembre.
- **Nueva guía** `mejores-academias-ingles-el-canaveral` — 4 academias del barrio, todas ⭐4,8-5 (lidera Larry and Andy ⭐5/50; English Connection ⭐4,9/74 es la de más reseñas).
- **Limpieza de `/educacion/`:** 3 negocios caninos movidos a `mascotas` (+301 de sus URLs). Ares Baby se queda (la categoría es "Educación e Infantil").
- **Actualidad (6º post):** ampliación del CEIPSO Rudyard Kipling (**12,4 M€**, 42+6+6+4 aulas; 1.000 plazas públicas con el IES). Post del IES corregido: fin de obras → **principios de 2027**.
- **`/transporte`:** añadido el **BRT (línea BR2)** a plaza de Felipe II. Iba a ser noticia, pero la fuente era de abril → contenido evergreen, no post.
- ⚠️ **Regla:** comprobar la FECHA de la fuente antes de tratar algo como actualidad, y no publicar cifras que solo salen en el resumen del buscador sin confirmarlas en la fuente.

### Discovery del 20-jul (+10 negocios → 284)
Ángulos nuevos (fisioterapia, óptica, lavandería, asesoría, gestoría, autoescuela), coste $0,09.
Altas: Óptica Cañaveral ⭐5/125 · GALA Autoescuela ⭐5/220 · Clínica Impulso ⭐5/184 · Fisen ⭐4,9 · 2 fisios pequeños · **Mascotiti Hospital Veterinario urgencias 24 h** ⭐4,1/673 · Lavandería OpenBlue24h · Logopedas «anda Conmigo» · Lavapeludos.
Descartados: Academia Arcana (es consultoría de RRHH), Excom (proveedor de internet), Locker SEUR (2,3★).
- ⚠️ **El término de búsqueda NO dice qué es el negocio**: "asesoría" trajo un hospital veterinario y "lavandería" una peluquería canina → inspeccionar `categoryName` antes de dar de alta.
- ⚠️ **Efecto dominó**: al entrar Mascotiti hubo que corregir la FAQ de la guía de veterinarios (decía que el barrio apenas tenía clínicas propias) y añadir un aviso de urgencias 24 h en `/con-perro` (por nota no entraba en el top-8, pero es información crítica). **Cuando entra un negocio importante, revisar qué contenido queda desactualizado.**

## 🐛 Bug UX resuelto — buscador de la home (2026-07-20, commit `b1bc480`)
El desplegable de resultados quedaba **oculto tras las tarjetas de zonas** y recortado.
**Causa:** la `<section>` del hero tenía `overflow-hidden isolate` → `isolate` creaba un stacking context que atrapaba el `z-[100]` del desplegable (hacia fuera el hero valía `z-auto` y las tarjetas `relative z-10`, posteriores en el DOM, lo tapaban); `overflow-hidden` además lo recortaba al salir.
**Fix:** recorte y aislamiento movidos a un envoltorio solo para el fondo decorativo (`absolute inset-0 -z-10 overflow-hidden isolate`) y contenido del hero a `relative z-20`. Verificado con capturas antes/después en escritorio (1200px), móvil (390px) y sobre producción; fondo del hero sin cambios.
- 💡 **Patrón a recordar:** `isolate` / `overflow-hidden` en secciones contenedoras rompen cualquier dropdown, tooltip o menú que deba salirse de su caja.

## 📊 Auditoría GSC #2 — 2026-07-20 (`~/gsc-elcanaveral-2026-07-20/`)
17 clics · 2.941 impr · CTR 0,58% (91 días). **Los 5 días nuevos: 0 clics, +201 impresiones** → demasiado pronto para ver el efecto de los 301 y las guías (necesitan 4-6 semanas); ninguna página nueva asoma aún.
- ✅ **Señal buena:** la **posición media mejora sostenidamente** — sem 21-22 ≈ 13,6/11,3 → sem 27-29 ≈ **8,8-9,2**. De página 2 baja al borde de página 1.
- 🔑 **Diagnóstico central:** CTR 0,58% con posición ~9 es anormalmente bajo (lo normal: 1,5-2,5%). No es falta de visibilidad, es que **las queries son de marca hiperlocal y el pack de Maps se lleva el clic**. → La vía NO es pelear esas búsquedas, sino el contenido comparativo/informativo donde Maps no compite ("mejores X" + guías del barrio). Es el pilar que ya estamos construyendo.
- Julio baja vs junio (36,4 vs 47,1 impr/día): probable estacionalidad de verano en Madrid.
- Schema **ya cubierto** (fichas con LocalBusiness/MedicalBusiness + AggregateRating; categorías con ItemList) → no es la palanca.
- 🗓️ **Próxima auditoría: finales de agosto** (cambios madurados + vuelta del tráfico + pico de vuelta al cole).
- ℹ️ El sitemap **no se reenvía** a GSC: Google re-rastrea solo `sitemap-index.xml`. John exporta el CSV (el agente no tiene acceso a Search Console).

## 📊 Auditoría GSC #3 — 2026-08-31 (Search Console API v3, propiedad `sc-domain:elcanaveral.info`)

**Método nuevo:** ya no hace falta CSV — credenciales en `~/mcp-gsc/` (`token.json`) + API v3
`webmasters` desde Node. Raws en `.tmp/gsc-raw/` (gitignored). Recordar: en propiedades de dominio
la dimensión `query` devuelve datos parciales; usar `page` como fuente fiable.

| Métrica | #2 (16-abr→20-jul) | #3 (16-abr→31-ago) | Lectura |
|---|---|---|---|
| Clicks | 17 | **35** | ×2 en 6 semanas |
| Impresiones | 2.941 | **4.965** | +69 % |
| CTR | 0,58 % | **0,70 %** | hacia el rango normal (1,5-2,5 %) |
| Posición media | ~11-12 | **10,5** | borde de página 1 |

**Últimos 42 días (20-jul→31-ago):** 17 clics · 1.698 impr · **CTR 1,00 %** · pos 11,4.
Semanas mejores: 27-jul (4 clics, 1,67 %) y 24-ago (3 clics, 1,21 %). Sin caída estival:
~250-310 impr/semana estable. Mejor página: `/cafeterias/` (326 impr, 7 clics, **CTR 2,15 %**, pos 9,7).
Peor: `/fruterias/` (342 impr, 1 clic, CTR 0,29 % — queries de marca «megafruta cañaveral»
79 impr pos 7,6 y «megafruta» 74 impr pos 11,5). Queries (parciales en dominio): hiperlocal de
marca otra vez (panaderia bulevar 31 impr, la fruteria de mama 22, levadura madre 11…);
«el cañaveral» genérico a pos 86 (43 impr) — no es nuestro mercado, bien ignorarlo.

**Señales nuevas:** `/actualidad/` (44 impr, pos 87) y `/blog/` (9 impr) ya asoman — el contenido
informativo empieza a indexarse; las 29 guías aún no suman (maduracion 4-6 semanas, normal).
**URLs no-canónicas con impresiones** (non-www, slashless, `/directory/…`, `/novedades-urbanas…`):
todas tienen 301 (o los datos son pre-redirect) → **no hay 301 urgentes nuevos**.

**Acciones propuestas (próxima sesión):**
1. **CTR de fichas con impresiones y 0 %** — ~7 fichas con ≥30 impr en 42 días (obrador-de-goya 121,
   sanitas-dental 89, churreria-bernis 49, la-belle-vie 48, mr-kebab 41, levaduramadre 38,
   supermercado-el-canaveral 36): revisar title/meta de ficha (¿incluyen zona/barrio?) y valorar
   FAQPage en las de mayor demanda (salud/dental 89 impr).
2. **`/fruterias/`** — añadir intro + FAQ anti-marca (es la página con más impresiones del sitio y
   peor CTR; queries «megafruta» no van a convertirse, pero la genérica «fruteria cañaveral» sí).
3. Confirmar en la próxima auditoría si guías + actualidad empiezan a clicar (ahí está la apuesta).

## ⚠️ Restricciones de trabajo (verano Madrid)
- **CPU < 65 °C** — monitorizar con `istats cpu temp`; ralentizar si sube. **NO usar Playwright** (recalienta).
- Builds: preferir nube; evitar `astro build` local en calor.
- **Contenido largo:** SIEMPRE con `bridge.py` (DeepSeek) — nunca redactar a mano (regla global).
- **Imágenes:** skill `generate-images` (Nano Banana 2).
- **SEO-first:** keyword research + SERP research ANTES de crear cualquier página.

## 📚 Memoria relacionada (en `memory/`)
`elcanaveral-directory.md` (ficha maestra) · `feedback-elcanaveral-seo-first.md` (SERP antes de crear) ·
`reference-elcanaveral-facebook.md` (grupos FB del barrio para descubrir negocios).
