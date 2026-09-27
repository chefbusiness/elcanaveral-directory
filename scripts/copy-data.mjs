#!/usr/bin/env node
// Copia negocios.json a public/data/ para la busqueda client-side.
// Aplica el guard de webs bloqueadas (src/data/website-blocklist.json): el JSON
// publicado nunca debe contener una web retirada a peticion de su titular.
import fs from "node:fs";
import path from "node:path";
import { stripBlockedWebsites, warnStripped } from "../src/lib/website-guard.js";

const src = path.resolve("src/data/negocios.json");
const destDir = path.resolve("public/data");
const dest = path.join(destDir, "negocios.json");

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const negocios = JSON.parse(fs.readFileSync(src, "utf-8"));
const { negocios: clean, stripped } = stripBlockedWebsites(negocios);

if (stripped.length === 0) {
  // Caso normal: la fuente ya esta limpia -> copia byte a byte (sin reformatear).
  fs.copyFileSync(src, dest);
} else {
  // La fuente traia una web bloqueada (p. ej. tras un enriquecimiento): se publica
  // la version saneada para que el dominio no quede expuesto en /data/negocios.json.
  warnStripped(stripped, "copy-data");
  fs.writeFileSync(dest, `${JSON.stringify(clean, null, 2)}\n`, "utf-8");
}
console.log(`Copiado: ${src} → ${dest} (${clean.length} negocios)`);
