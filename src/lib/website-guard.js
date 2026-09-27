// Website guard — El Canaveral Info
// Retira de las fichas cualquier web incluida en src/data/website-blocklist.json.
// Se usa desde el motor del directorio (src/lib/directory.ts) y desde
// scripts/copy-data.mjs, para que un dominio bloqueado no pueda publicarse
// ni en el HTML/JSON-LD ni en /data/negocios.json, aunque vuelva a entrar en
// src/data/negocios.json por un enriquecimiento (Google Places / Apify).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const BLOCKLIST_PATH = path.resolve(here, "..", "data", "website-blocklist.json");

/** Host normalizado (sin www, sin esquema, sin barra final, en minusculas). */
export function normalizeHost(url) {
  if (typeof url !== "string" || !url.trim()) return "";
  return url
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .replace(/\/+$/, "");
}

/** Mapa dominio -> entrada del blocklist. Devuelve un Map vacio si no hay fichero. */
export function loadBlockedDomains() {
  if (!fs.existsSync(BLOCKLIST_PATH)) return new Map();
  try {
    const raw = JSON.parse(fs.readFileSync(BLOCKLIST_PATH, "utf-8"));
    const entries = raw?.dominios_bloqueados ?? {};
    return new Map(
      Object.entries(entries).map(([domain, meta]) => [normalizeHost(domain), meta ?? {}]),
    );
  } catch (err) {
    console.warn(`[website-guard] no se pudo leer ${BLOCKLIST_PATH}: ${err.message}`);
    return new Map();
  }
}

/** true si la web pertenece a un dominio bloqueado (match exacto o subdominio). */
export function isBlockedWebsite(website, blocked = loadBlockedDomains()) {
  const host = normalizeHost(website);
  if (!host) return false;
  if (blocked.has(host)) return true;
  for (const domain of blocked.keys()) {
    if (domain && host.endsWith(`.${domain}`)) return true;
  }
  return false;
}

/**
 * Devuelve una copia de la lista sin las webs bloqueadas.
 * { negocios, stripped } — stripped: [{ slug, website, motivo }]
 */
export function stripBlockedWebsites(negocios, blocked = loadBlockedDomains()) {
  const stripped = [];
  if (!Array.isArray(negocios)) return { negocios: [], stripped };
  if (blocked.size === 0) return { negocios, stripped };

  const clean = negocios.map((n) => {
    if (!n || !isBlockedWebsite(n.website, blocked)) return n;
    const host = normalizeHost(n.website);
    const meta = blocked.get(host) ?? {};
    stripped.push({ slug: n.slug, website: n.website, motivo: meta.motivo ?? "dominio bloqueado" });
    const { website, ...rest } = n;
    return rest;
  });

  return { negocios: clean, stripped };
}

/** Aviso unico y legible en el log del build/copia. */
export function warnStripped(stripped, context = "website-guard") {
  for (const s of stripped) {
    console.warn(`[${context}] web bloqueada retirada de "${s.slug}": ${s.website}`);
  }
}
