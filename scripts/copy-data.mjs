#!/usr/bin/env node
// Copia negocios.json a public/data/ para la busqueda client-side
import fs from "node:fs";
import path from "node:path";

const src = path.resolve("src/data/negocios.json");
const destDir = path.resolve("public/data");
const dest = path.join(destDir, "negocios.json");

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

fs.copyFileSync(src, dest);
console.log(`Copiado: ${src} → ${dest}`);
