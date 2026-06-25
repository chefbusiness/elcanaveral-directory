# SETUP-CLOUD — correr elcanaveral.info en la nube (Abacus SuperComputer / Claude Code)

**Objetivo:** mover el trabajo pesado (builds de Astro, runs de Apify) a la máquina Ubuntu de Abacus
para que el Mac de Madrid no se recaliente. El **código viaja por git**; los **secretos NO** (van aparte).

## Pasos en la sesión de Claude Code de Abacus

**1. Clonar el repo** (privado — requiere GitHub conectado en Abacus):
```bash
git clone https://github.com/chefbusiness/elcanaveral-directory.git
cd elcanaveral-directory
```

**2. Crear el `.env` desde la plantilla y rellenar los 2 secretos:**
```bash
cp .env.cloud.example .env
nano .env   # pega GOOGLE_PLACES_API_KEY y APIFY_TOKEN (de dónde sacarlos: ver comentarios del .env)
```
> Los valores están en tu Mac: `~/elcanaveral-directory/.env` (que ya tiene las dos claves).
> Cópialos a mano en el `.env` de la nube. No hace falta pasarlos por el chat.

**3. Instalar dependencias:**
```bash
corepack enable && pnpm install     # o:  npm i -g pnpm && pnpm install
```

**4. Verificar (esto ya en la nube, sin calentar tu Mac):**
```bash
pnpm dev      # arranca el dev server
# o build de prueba:
pnpm build
```

## Apify en la nube — 2 opciones
- **A) MCP (interactivo):** añadir el server `https://mcp.apify.com/` con header
  `Authorization: Bearer <APIFY_TOKEN>` a la config MCP de Claude Code (igual que en `chefbusiness-prospecting`).
  Claude Code puede entonces llamar a los actors de Apify como herramientas.
- **B) REST por script (batch / idempotente):** `scripts/apify_enrich.py` (pendiente de crear) leyendo
  `APIFY_TOKEN` del `.env`. Mejor para enriquecer las 107 fichas de forma repetible.

## Retomar el contexto del proyecto
Lee **`HANDOFF.md`** y, si tienes acceso, `memory/elcanaveral-directory.md`.
**Plan en curso:** Apify enrich + fill → listicles "mejores X cañaveral" (motor del blog) → blog.
Actor previsto: `compass/crawler-google-places`. Ranking de listicles: ponderado bayesiano (nota × volumen).
