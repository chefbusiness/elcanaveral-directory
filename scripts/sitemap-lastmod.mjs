// lastmod del sitemap a partir de fechas de ficha o del historial git.
// Nunca usa la fecha del build: si no hay commit que citar, la URL se queda sin lastmod.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fechaLastmodFicha, masReciente } from "../src/lib/fechas-ficha.mjs";

const CON_NEGOCIOS = new Set([
  "src/pages/index.astro",
  "src/pages/directorio/index.astro",
  "src/pages/el-canaveral.astro",
  "src/pages/abiertos-los-domingos.astro",
  "src/pages/bares-y-tapas.astro",
  "src/pages/comida-a-domicilio.astro",
  "src/pages/con-ninos.astro",
  "src/pages/con-perro.astro",
  "src/pages/farmacias-de-guardia.astro",
  "src/pages/vivienda.astro",
  "src/pages/[categoria]/index.astro",
  "src/pages/[categoria]/[slug].astro",
  "src/pages/zona/[zona]/index.astro",
  "src/pages/zona/[zona]/[categoria].astro",
  "src/pages/blog/[slug].astro",
  "src/pages/blog/index.astro",
  "src/pages/llms.txt.ts",
  "src/pages/llms-full.txt.ts",
]);

export function parseGitLog(text) {
  const map = new Map();
  let actual = null;
  for (const line of String(text).split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("---")) {
      const dia = /^---(\d{4}-\d{2}-\d{2})/.exec(trimmed);
      actual = dia ? dia[1] : null;
      continue;
    }
    if (actual && !map.has(trimmed)) map.set(trimmed, actual);
  }
  return map;
}

export function normalizarRuta(url) {
  let pathname;
  try {
    pathname = new URL(url, "https://www.elcanaveral.info").pathname;
  } catch {
    return "/";
  }
  try {
    pathname = decodeURIComponent(pathname);
  } catch {
    // La ruta ya viene decodificada.
  }
  if (!pathname.startsWith("/")) pathname = `/${pathname}`;
  pathname = pathname.replace(/\/{2,}/g, "/");
  if (pathname !== "/" && !pathname.endsWith("/") && !/\.[a-z0-9]+$/i.test(pathname)) pathname += "/";
  return pathname;
}

export function rutaDeArchivo(file) {
  if (!/^src\/pages\/.+\.(astro|ts)$/.test(file)) return null;
  let rel = file.slice("src/pages/".length).replace(/\.(astro|ts)$/, "");
  if (rel.endsWith("/index")) rel = rel.slice(0, -"/index".length);
  else if (rel === "index") rel = "";
  const segmentos = rel.split("/").filter((segmento) => segmento.length > 0);
  const dinamica = segmentos.some((segmento) => segmento.startsWith("["));
  if (dinamica) {
    const cuerpo = segmentos
      .map((segmento) => {
        if (/^\[\.\.\.[^\]]+\]$/.test(segmento)) return ".+";
        if (/^\[[^\]]+\]$/.test(segmento)) return "[^/]+";
        return segmento.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      })
      .join("/");
    const literales = segmentos.filter((segmento) => !segmento.startsWith("[")).length;
    return {
      tipo: "dyn",
      re: new RegExp(`^/${cuerpo}/$`),
      file,
      specificity: literales * 10 + segmentos.length,
    };
  }
  const pathPublico = rel.includes(".") ? `/${rel}` : rel ? `/${rel}/` : "/";
  return { tipo: "exact", path: pathPublico, file };
}

export function indexarPaginas(archivos) {
  const exactas = new Map();
  const dinamicas = [];
  for (const file of archivos) {
    const ruta = rutaDeArchivo(file);
    if (!ruta) continue;
    if (ruta.tipo === "exact") exactas.set(ruta.path, file);
    else dinamicas.push(ruta);
  }
  dinamicas.sort((a, b) => b.specificity - a.specificity);
  return { exactas, dinamicas };
}

export function paginaDe(ruta, exactas, dinamicas) {
  if (exactas.has(ruta)) return exactas.get(ruta);
  for (const dinamica of dinamicas) {
    if (dinamica.re.test(ruta)) return dinamica.file;
  }
  return null;
}

export function datosAsociados(archivo) {
  if (!archivo) return [];
  const out = [];
  const add = (file) => {
    if (!out.includes(file)) out.push(file);
  };
  if (CON_NEGOCIOS.has(archivo)) add("src/data/negocios.json");
  if (
    archivo.startsWith("src/pages/blog/") ||
    archivo.startsWith("src/pages/zona/") ||
    archivo === "src/pages/index.astro" ||
    archivo === "src/pages/[categoria]/index.astro"
  ) {
    add("src/data/listicles.json");
  }
  if (archivo === "src/pages/[categoria]/index.astro" || archivo === "src/pages/[categoria]/[slug].astro") {
    add("src/data/seo-overrides.json");
  }
  if (archivo.startsWith("src/pages/actualidad/")) add("src/data/actualidad.json");
  if (archivo.startsWith("src/pages/fiestas/")) add("src/data/fiestas.json");
  if (archivo.startsWith("src/pages/escapadas/") || archivo === "src/pages/con-perro.astro") add("src/data/escapadas.json");
  if (
    archivo === "src/pages/espacios-publicos.astro" ||
    archivo === "src/pages/con-ninos.astro" ||
    archivo === "src/pages/con-perro.astro"
  ) {
    add("src/data/espacios.json");
  }
  if (archivo === "src/pages/comunidad/index.astro") add("src/data/comunidad.json");
  if (
    archivo === "src/pages/index.astro" ||
    archivo === "src/pages/directorio/index.astro" ||
    archivo === "src/pages/el-canaveral.astro" ||
    archivo === "src/pages/zonas/index.astro" ||
    archivo.startsWith("src/pages/zona/") ||
    archivo === "src/pages/[categoria]/index.astro"
  ) {
    add("src/data/zonas.json");
    add("src/data/categorias.json");
  }
  if (archivo === "src/pages/abiertos-los-domingos.astro") add("src/data/categorias.json");
  if (archivo === "src/pages/llms.txt.ts" || archivo === "src/pages/llms-full.txt.ts") {
    add("src/data/actualidad.json");
    add("src/data/listicles.json");
    add("src/data/categorias.json");
    add("src/data/zonas.json");
  }
  if (archivo === "src/pages/con-ninos.astro" || archivo.startsWith("src/pages/guias/")) {
    add("src/data/guias.json");
  }
  if (archivo === "src/pages/nuevas-aperturas.astro") add("src/data/aperturas.json");
  if (archivo === "src/pages/agenda/index.astro" || archivo === "src/pages/agenda/[slug].astro") {
    add("src/data/agenda.json");
  }
  return out;
}

function leerJson(root, rel) {
  try {
    return JSON.parse(readFileSync(path.join(root, rel), "utf8"));
  } catch {
    return null;
  }
}

function asegurarHistoria(root) {
  try {
    const shallow = execFileSync("git", ["rev-parse", "--is-shallow-repository"], {
      cwd: root,
      encoding: "utf8",
      timeout: 15000,
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
    }).trim();
    if (shallow !== "true") return;
    execFileSync("git", ["fetch", "--filter=blob:none", "--unshallow"], {
      cwd: root,
      stdio: "ignore",
      timeout: 180000,
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
    });
  } catch {
    // Sin historial no hay lastmod. No se rellena con hoy.
  }
}

export function leerHistorialGit(root) {
  asegurarHistoria(root);
  try {
    const text = execFileSync("git", ["log", "--pretty=format:---%cI", "--name-only", "--", "src/pages", "src/data"], {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      timeout: 120000,
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
    });
    return parseGitLog(text);
  } catch {
    return new Map();
  }
}

export function createLastmodLookup(opts = {}) {
  const root = opts.root || process.cwd();
  const gitDates = opts.gitDates || leerHistorialGit(root);
  const negocios = opts.negocios || JSON.parse(readFileSync(path.join(root, "src/data/negocios.json"), "utf8"));
  let overrides = opts.overrides;
  if (!overrides) {
    try {
      const seo = JSON.parse(readFileSync(path.join(root, "src/data/seo-overrides.json"), "utf8"));
      overrides = new Set(Object.keys(seo.fichas || {}));
    } catch {
      overrides = new Set();
    }
  }
  const fichas = new Map();
  for (const negocio of negocios) {
    if (!negocio?.category || !negocio?.slug) continue;
    fichas.set(`/${negocio.category}/${negocio.slug}/`, negocio);
  }
  const archivos = [];
  for (const file of gitDates.keys()) {
    if (!file.startsWith("src/pages/")) continue;
    if (!existsSync(path.join(root, file))) continue;
    archivos.push(file);
  }
  const { exactas, dinamicas } = indexarPaginas(archivos);
  const aperturas = opts.aperturas ?? leerJson(root, "src/data/aperturas.json");
  const agenda = opts.agenda ?? leerJson(root, "src/data/agenda.json");
  const guias = opts.guias ?? leerJson(root, "src/data/guias.json");

  return function lastmodDe(url) {
    const ruta = normalizarRuta(url);
    if (ruta === "/nuevas-aperturas/") {
      const items = Array.isArray(aperturas?.items) ? aperturas.items : [];
      const propia = masReciente([aperturas?.lastReview, ...items.map((item) => item?.verificadoEn)]);
      if (propia) return propia;
      return masReciente([
        gitDates.get("src/pages/nuevas-aperturas.astro"),
        gitDates.get("src/data/aperturas.json"),
      ]);
    }
    if (ruta === "/guias/" || ruta.startsWith("/guias/")) {
      const lista = Array.isArray(guias) ? guias : [];
      const slug = ruta === "/guias/" ? null : ruta.slice("/guias/".length, -1);
      const propias = slug ? lista.filter((guia) => guia?.slug === slug) : lista;
      const fechas = [];
      for (const guia of propias) {
        fechas.push(guia?.actualizado, guia?.verificadoEn);
        const items = Array.isArray(guia?.items) ? guia.items : [];
        for (const item of items) fechas.push(item?.verificadoEn);
      }
      const propia = masReciente(fechas);
      if (propia) return propia;
      return masReciente([
        gitDates.get(slug ? "src/pages/guias/[slug].astro" : "src/pages/guias/index.astro"),
        gitDates.get("src/data/guias.json"),
      ]);
    }
    if (ruta === "/agenda/" || ruta.startsWith("/agenda/")) {
      const items = Array.isArray(agenda?.items) ? agenda.items : [];
      const slug = ruta === "/agenda/" ? null : ruta.slice("/agenda/".length, -1);
      const propios = slug ? items.filter((item) => item?.id === slug) : items;
      const propia = masReciente(propios.map((item) => item?.verificadoEn));
      if (propia) return propia;
      return masReciente([
        gitDates.get(slug ? "src/pages/agenda/[slug].astro" : "src/pages/agenda/index.astro"),
        gitDates.get("src/data/agenda.json"),
      ]);
    }
    const negocio = fichas.get(ruta);
    if (negocio) {
      const propia = fechaLastmodFicha(negocio);
      if (propia) return propia;
      const fallback = [
        gitDates.get("src/data/negocios.json"),
        gitDates.get("src/pages/[categoria]/[slug].astro"),
      ];
      if (overrides.has(negocio.slug)) fallback.push(gitDates.get("src/data/seo-overrides.json"));
      return masReciente(fallback);
    }
    const archivo = paginaDe(ruta, exactas, dinamicas);
    const fechas = [archivo ? gitDates.get(archivo) : null, ...datosAsociados(archivo).map((file) => gitDates.get(file))];
    return masReciente(fechas);
  };
}
