# MEMORIA — elcanaveral.info

> Fuente de verdad del proyecto. Leer ANTES de cualquier sesión. Última actualización: **CIERRE DE SESIÓN 2026-08-31** (auditoría GSC #3, 2 posts, acciones CTR, trilogía de docs + push).
> Compañera de `handoff.md` (estado y sesiones) y `roadmap.md` (hecho/pendiente).

## Qué es (y qué NO es)

**El Cañaveral Info** — **directorio hiperlocal de El Cañaveral** (Vicálvaro, Madrid) convertido en el **hub de vivir y disfrutar el barrio** (dónde comer, qué hacer, cómo llegar). Grupo **ChefBusiness** (John Guerrero). Nació como boilerplate "Tier 5 — Directory" y creció con pipeline de datos + guías + actualidad (+ pilares de utilidad).

- **NO es la monetización directa**: el valor es ser el **activo de prospección a pie de calle** para los servicios del grupo — ChefBusiness (gastro), **GastroSEO.com** (negocios sin web), **GastroLocal.pro** (GBP flojo). El directorio dice qué negocios hay, cuáles no tienen web y cuáles tienen ficha débil → esos son los leads.
- **Taxonomía**: 16 categorías → 4 zonas (El Cañaveral, Vicálvaro, Coslada, San Fernando de Henares) + zona×categoría (pSEO).
- **Competencia real en el SERP**: el Map Pack se come el clic de las queries de marca hiperlocal → la apuesta es **contenido comparativo/informativo** (guías «mejores X», actualidad) donde Maps no compite.

## Decisiones arquitectónicas (NO cambiar sin consultar)

1. **Stack**: **Astro 5 + pnpm** + Tailwind 4 + fuse.js (búsqueda client-side) + sharp + `@astrojs/sitemap`. 100 % estático, deploy **Netlify** en CI (push a `master`).
2. **Data-driven**: todo el contenido en `src/data/*.json` leído con `fs` (`src/lib/directory.ts`, `src/lib/listicles.ts`). Sin content collections.
3. **Guías**: motor de **ranking bayesiano** (IMDb-style: nota × volumen de reseñas) en `src/lib/listicles.ts` + `src/data/listicles.json`; **drip publishing** con `publishedDate` futura (la fecha oculta la página) + GitHub Action diaria (06:15 UTC) que publica.
4. **SEO por capas**: `src/data/seo-overrides.json` — `categorias` (title/meta/h1 + `intro`/`faq` → FAQPage) y `fichas` (title/meta por slug). Schema: LocalBusiness/AggregateRating por ficha · ItemList (categoría/zona/guías) · FAQPage · NewsArticle · BreadcrumbList.
5. **Fichas**: fuente de datos = Apify (`compass/crawler-google-places`, API REST, idempotente por `placeId`) + fotos por `placeId` autoritativo (`fetch_photos_by_placeid.py`; **NO** usar `fetch_places_photos.py`, busca por texto y puede casar el local equivocado). Imágenes WebP q80.
6. **Monetización cerrada**: 4 tiers en `/planes` (Básico gratis · Verificado 19 €/mes · Destacado 49 €/mes · Sponsor 800 €/mes), forms Netlify → `local@elcanaveral.info`, cobro manual (Bizum/transferencia), legales = Opción A (sin NIF, decisión de John), cookies RGPD con mapas consent-gated.
7. **Sitio en producción**: `https://www.elcanaveral.info/` (canonical www; apex 301 → www), sitemap 433 URLs; verificación real de cada cambio = deploy de Netlify en vivo (fetch con Node).

## ENTORNO / LÍMITES (Windows + DSH — lo más importante)

### Git: receta de PUSH que sí funciona en el sandbox (probada 2026-08-31)
- `ssh.exe` no puede crear pipes de señal → **git por SSH está roto dentro del sandbox** (en la terminal normal del usuario sí funciona).
- El **gitconfig global** tiene `url."git@github.com:".insteadOf = https://github.com/` → reescribe https→ssh y rompe el push (y hace que `git remote -v` muestre ssh aunque el repo guarde https).
- **Receta:**
  ```powershell
  git remote set-url origin https://github.com/chefbusiness/elcanaveral-directory.git  # sin token embebido
  $env:GIT_CONFIG_GLOBAL = Join-Path $env:TEMP "elcanaveral-gitconfig-global"   # archivo VACÍO (bypass del insteadOf)
  New-Item -Force -ItemType File -Path $env:GIT_CONFIG_GLOBAL | Out-Null
  $tok = & 'C:\Program Files\GitHub CLI\gh.exe' auth token
  $b64 = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("x-access-token:$tok"))
  git -c http.sslBackend=openssl -c "http.https://github.com.extraHeader=Authorization: Basic $b64" push origin master
  ```
  El exit code 1 de pwsh es solo el wrapper de stderr; el push se completa.
- `gh` CLI: instalado y autenticado como **chefbusiness** (https, scopes repo/workflow/gist) — `C:\Program Files\GitHub CLI\gh.exe`.
- ⚠️ SEGURIDAD: nunca dejar un token embebido en el remote (ocurrió en azul-flojito; hubo que rotar el PAT). Los tokens viven en `gh auth` / `.env` (gitignored) / `~/mcp-gsc/`.

### Red y procesos
- **TLS schannel falla** (`SEC_E_NO_CREDENTIALS`) → `Invoke-WebRequest`/`curl.exe` NO sirven para HTTPS. Usar **Node fetch** (OpenSSL) para la web, sitemaps y fuentes externas.
- **`astro build` local falla** (`spawn EPERM` de vite, sandbox) → la verificación real es el deploy de Netlify tras push.
- Child-process con stdout piped: bloqueado (EPERM).

### Search Console — acceso DIRECTO (ya no hacen falta CSVs)
- Credenciales OAuth en `C:\Users\User\mcp-gsc\` (`token.json` + `client_secrets.json`); el servidor `gsc-mcp` no está instalado, pero la **Search Console API v3** se llama directo con Node (refresh en `oauth2.googleapis.com/token` → `searchconsole.googleapis.com/webmasters/v3/sites/{site}/searchAnalytics/query`).
- Helpers: `.tmp/gsc-query.mjs [desde] [hasta] [sufijo]` (raws en `.tmp/gsc-raw/`, gitignored) · `.tmp/gsc-analyze.mjs`.
- ⚠️ Usar SIEMPRE la propiedad **`sc-domain:elcanaveral.info`** (la URL-property `https://elcanaveral.info/` del mismo cuenta está VACÍA — da 0 datos si se elige por error).
- ⚠️ En propiedades de dominio la dimensión `query` devuelve datos PARCIALES → basar el análisis en la dimensión `page`.

### Otras claves
- `APIFY_TOKEN`: en `~/chefbusiness-prospecting/.env` (no en este repo). `GEMINI_API_KEY`: en `.env` local (gitignored).
- "Cockpit" global (respaldo de configuración entre máquinas): `~/.claude/bin/` → `secrets-pull` / `secrets-push` / `traer-proyecto`; `.claude.json` viaja cifrado en `secrets.enc`.
- Proyecto hermano de referencia: `azul-flojito-directorio-local-canarias` (Tenerife, azulflojito.com) — su app vive dentro de `_boilerplate/elcanaveral-directory` (adaptada de nuestro boilerplate; **NO es una copia nuestra**).

## Reglas de contenido (no romper)
- **SEO-first:** validar SERP/GSC antes de publicar cualquier página nueva.
- Actualidad: **solo hechos reales con fuente**; comprobar la FECHA de la fuente y las cifras EN la fuente (no en el resumen del buscador); si dos fuentes discrepan, afirmar solo lo coincidente.
- Párrafos de posts se renderizan con `set:html` → **escapar `&`, `<` y `>`** (mín. `&amp;`).
- No usar nombres visibles con acentos como claves de comparación (patrón del bug del emoji); usar slugs.
- Imágenes WebP q80 + `loading=lazy`; sin secretos en repo; commits por hito.

## Disciplina del grupo (NATIVA)
- Skills globales en `~/.dsh/skills/` y preset `~/.dsh/agent-presets/chefbusiness-workflow/`: **ultracode · ultra-review · model-routing** (L0 base DeepSeek → L1/L2 vía `model-routing.mjs` en tareas pesadas).
- Cierre de sesión: gate `ultrareview/auto-gate.mjs` + veredicto `ULTRA REVIEW: PASS/WARN/FAIL (n blockers, n avisos)` + `MODEL ROUTING: Lx`.
