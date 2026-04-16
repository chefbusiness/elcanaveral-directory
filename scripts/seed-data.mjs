#!/usr/bin/env node
// Script para generar datos de ejemplo para el directorio
// Uso: pnpm data:seed
// CAMBIAR: adapta a tu fuente de datos (CSV, API, scraping, etc.)

import fs from "node:fs";
import path from "node:path";

// CAMBIAR: Tus categorias
const categories = [
  { slug: "proveedores", name: "Proveedores", description: "Proveedores del sector" },
  { slug: "servicios", name: "Servicios", description: "Empresas de servicios" },
  { slug: "fabricantes", name: "Fabricantes", description: "Fabricantes y productores" },
];

// CAMBIAR: Ciudades para generar entries de ejemplo
const cities = [
  { city: "Madrid", region: "Comunidad de Madrid" },
  { city: "Barcelona", region: "Cataluna" },
  { city: "Valencia", region: "Comunidad Valenciana" },
];

const entries = [];

categories.forEach((cat) => {
  cities.forEach((c, i) => {
    entries.push({
      slug: `${cat.slug}-${c.city.toLowerCase()}-ejemplo`,
      name: `${cat.name} ${c.city} Ejemplo`,
      description: `Empresa de ${cat.name.toLowerCase()} en ${c.city}. CAMBIAR con datos reales.`,
      category: cat.slug,
      categoryName: cat.name,
      city: c.city,
      region: c.region,
      tags: [cat.slug],
      featured: i === 0, // primera ciudad es featured
    });
  });
});

const dataDir = path.resolve("src/data");

fs.writeFileSync(
  path.join(dataDir, "categories.json"),
  JSON.stringify(categories, null, 2)
);
fs.writeFileSync(
  path.join(dataDir, "entries.json"),
  JSON.stringify(entries, null, 2)
);

console.log(`Seed: ${categories.length} categorias, ${entries.length} entries`);
