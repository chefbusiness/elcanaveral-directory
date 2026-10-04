#!/usr/bin/env node
// Validador de enlaces internos contra el BUILD REAL (dist/).
//
// Antes vivía en .tmp/ con una lista de rutas escrita a mano: cada vez que se añadía o movía una
// página había que acordarse de actualizarla, y cuando no se hacía marcaba como rotos enlaces que
// funcionaban (pasó con /vivienda/, /el-canaveral/ y las páginas informativas de oct-2026).
// Ahora la verdad es dist/: si el fichero no está en el build, el enlace está roto.
//
// Uso: node scripts/validate-links.mjs   (requiere haber hecho `pnpm build`)
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
if (!fs.existsSync(DIST)) {
  console.error("No hay dist/. Ejecuta `pnpm build` antes de validar enlaces.");
  process.exit(1);
}

// 1. Recolectar todos los hrefs internos de: vistas .astro, lógica .ts, datos .json y contenido .md
const EXT = /\.(astro|ts|mjs|json|md)$/i;
const IGNORAR = new Set(["node_modules", "dist", ".astro", ".git", ".tmp", "prospecting", "__pycache__"]);
const hrefs = new Map(); // href -> ficheros donde aparece
const añade = (href, fichero) => {
  if (!href.startsWith("/")) return;
  if (href.startsWith("//")) return;
  const limpio = href.split("#")[0].split("?")[0];
  if (!limpio || limpio === "/") { hrefs.set("/", hrefs.get("/") || new Set()); return; }
  if (!hrefs.has(limpio)) hrefs.set(limpio, new Set());
  hrefs.get(limpio).add(fichero);
};

const recorrer = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORAR.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { recorrer(p); continue; }
    if (!EXT.test(e.name)) continue;
    const rel = path.relative(ROOT, p).replace(/\\/g, "/");
    if (rel === "scripts/validate-links.mjs") continue;
    const txt = fs.readFileSync(p, "utf-8");
    for (const m of txt.matchAll(/href=["'`{]?(\/[^"'`\s)]+)/g)) añade(m[1], rel);
    // rutas construidas con template literals: /${cat}/, /zona/${zona}/ ... no se pueden resolver aquí,
    // así que se ignoran (los enlaces reales salen en el HTML y se validan por otra vía más abajo).
  }
};
recorrer(ROOT);

// 2. Validar contra dist/ (directorio con index.html, fichero o recurso de public/)
const existe = (href) => {
  const limpio = href.replace(/^\//, "");
  const candidatos = [
    path.join(DIST, limpio),
    path.join(DIST, limpio, "index.html"),
    path.join(DIST, `${limpio}.html`),
  ];
  return candidatos.some((c) => fs.existsSync(c));
};

// 3. Además, validar TODOS los enlaces del HTML ya generado (captura los que se construyen con plantillas)
const htmls = [];
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith(".html") && !e.name.startsWith("__")) htmls.push(p);
  }
};
walk(DIST);
const rotosEnHtml = new Map();
for (const f of htmls) {
  const txt = fs.readFileSync(f, "utf-8");
  for (const m of txt.matchAll(/href="(\/[^"#?]*)/g)) {
    const href = m[1];
    if (href.startsWith("//")) continue;
    if (/\.(xml|xsl|txt|webp|png|jpg|jpeg|svg|ico|css|js|json)$/i.test(href)) continue;
    if (!existe(href)) {
      const clave = href;
      if (!rotosEnHtml.has(clave)) rotosEnHtml.set(clave, new Set());
      rotosEnHtml.get(clave).add(path.relative(DIST, f));
    }
  }
}

const rotosCodigo = [...hrefs.entries()]
  .filter(([href]) => !existe(href))
  // las rutas con segmentos dinámicos no resueltas no cuentan
  .filter(([href]) => !href.includes("${"))
  .map(([href, fs_]) => `${href}  ←  ${[...fs_].slice(0, 3).join(", ")}`);

console.log(`Enlaces internos distintos en el código: ${hrefs.size}`);
console.log(`Páginas HTML generadas: ${htmls.length}`);
console.log(
  rotosEnHtml.size === 0
    ? "✅ Ningún enlace interno roto en el HTML generado."
    : `❌ ROTOS EN EL HTML (${rotosEnHtml.size}):\n` +
        [...rotosEnHtml.entries()].map(([h, fs_]) => `  ${h}  ←  ${[...fs_].slice(0, 2).join(", ")}`).join("\n"),
);
if (rotosCodigo.length) {
  console.log(`⚠️  En el código fuente (puede ser una ruta dinámica no resuelta):\n${rotosCodigo.map((r) => "  " + r).join("\n")}`);
}
process.exit(rotosEnHtml.size === 0 ? 0 : 1);
