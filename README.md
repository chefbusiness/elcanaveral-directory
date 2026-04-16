# Tier 5 — Directory

Boilerplate para directorios de cualquier nicho. Astro 5, 100% estatico, SEO optimizado.

## Stack
- Astro 5 + Tailwind v4 + Sitemap
- Fuse.js (busqueda client-side)
- Schema.org LocalBusiness por ficha
- pSEO ready (categoria × ciudad)
- Deploy: Netlify

## Monetizacion
- **Directa:** Listados premium (destacados), leads, formulario de alta
- **Cruzada:** Trafico a tus servicios de consultoria/SaaS
- **Otros nichos:** Ads, affiliate links, sponsored entries

## Estructura
```
src/
├── pages/
│   ├── index.astro                # Home: buscador + categorias + destacados
│   ├── directorio/index.astro     # Listado completo con filtros
│   ├── [categoria]/index.astro    # Pagina de categoria
│   └── [categoria]/[slug].astro   # Ficha individual (schema LocalBusiness)
├── components/
│   ├── Header.astro
│   ├── Footer.astro
│   ├── EntryCard.astro            # Tarjeta de entrada
│   └── SearchBar.astro            # Busqueda con Fuse.js
├── layouts/
│   └── BaseLayout.astro
├── lib/
│   └── directory.ts               # Engine: load, filter, paths, schema
├── data/
│   ├── categories.json
│   └── entries.json
└── styles/
    └── global.css
```

## Setup
```bash
cp -r tier5-directory mi-directorio
cd mi-directorio
pnpm install
cp .env.example .env
pnpm data:seed    # Genera datos de ejemplo
pnpm dev
```

## Personalizar
1. Editar `src/data/categories.json` con tus categorias
2. Editar `src/data/entries.json` con tus entradas (o generar con script)
3. Buscar CAMBIAR en el codigo para textos y CTAs
4. Adaptar `scripts/seed-data.mjs` a tu fuente de datos
