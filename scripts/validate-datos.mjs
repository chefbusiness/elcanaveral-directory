// Falla el build si una apertura o un evento de la agenda no tiene fuente o verificadoEn.
// Un array vacío es válido: la página enseña el estado vacío y el formulario.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { diaDe, instanteConZona } from "../src/lib/novedades.mjs";

const ESTADOS_APERTURA = new Set(["anunciado", "obras", "abierto", "cerrado"]);
const ESTADOS_AGENDA = new Set(["confirmado", "anunciado", "cancelado", "aplazado"]);
const TIPOS_FUENTE = new Set(["web", "red-social", "noticia", "institucional"]);

function esObjeto(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function urlHttp(value) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function erroresFuente(fuente, ruta) {
  const errores = [];
  if (!esObjeto(fuente)) return [`${ruta}: cada fuente tiene que ser un objeto {nombre, url, tipo}`];
  if (typeof fuente.nombre !== "string" || !fuente.nombre.trim()) errores.push(`${ruta}: falta nombre`);
  if (!urlHttp(fuente.url)) errores.push(`${ruta}: falta url http(s)`);
  if (typeof fuente.tipo !== "string" || !TIPOS_FUENTE.has(fuente.tipo)) {
    errores.push(`${ruta}: tipo de fuente no válido (${fuente.tipo})`);
  }
  return errores;
}

function erroresFuentesYFecha(item, ruta) {
  const errores = [];
  if (!Array.isArray(item.fuentes) || item.fuentes.length < 1) {
    errores.push(`${ruta}: sin fuentes (hace falta al menos una)`);
  } else {
    item.fuentes.forEach((fuente, i) => errores.push(...erroresFuente(fuente, `${ruta}.fuentes[${i}]`)));
  }
  if (!diaDe(item.verificadoEn)) errores.push(`${ruta}: falta verificadoEn (fecha ISO)`);
  return errores;
}

function fechaOpcional(value, ruta, errores) {
  if (value === null) return;
  if (!diaDe(value)) errores.push(`${ruta}: la fecha tiene que ser null o un día ISO`);
}

export function erroresAperturas(datos, indice) {
  const errores = [];
  if (!esObjeto(datos) || !Array.isArray(datos.items)) {
    return ["aperturas.json: hace falta { lastReview, items }"];
  }
  if (!diaDe(datos.lastReview)) errores.push("aperturas.json: lastReview no es una fecha ISO");
  datos.items.forEach((item, i) => {
    const ruta = `aperturas.items[${i}]`;
    if (!esObjeto(item)) {
      errores.push(`${ruta}: no es un objeto`);
      return;
    }
    if (typeof item.id !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id)) {
      errores.push(`${ruta}: id vacío o no es un slug`);
    }
    if (typeof item.nombre !== "string" || !item.nombre.trim()) errores.push(`${ruta}: falta nombre`);
    if (!ESTADOS_APERTURA.has(item.estado)) errores.push(`${ruta}: estado no válido`);
    if (typeof item.categoria !== "string" || !indice.categorias.has(item.categoria)) {
      errores.push(`${ruta}: categoria desconocida`);
    }
    if (typeof item.zona !== "string" || !indice.zonas.has(item.zona)) errores.push(`${ruta}: zona desconocida`);
    if (typeof item.direccion !== "string" || !item.direccion.trim()) errores.push(`${ruta}: falta direccion`);
    if (item.fichaSlug !== null && (typeof item.fichaSlug !== "string" || !indice.fichas.has(`${item.categoria}/${item.fichaSlug}`))) {
      errores.push(`${ruta}: fichaSlug no existe en el directorio`);
    }
    fechaOpcional(item.fechaPrevista, `${ruta}.fechaPrevista`, errores);
    // fechaApertura es opcional también con estado abierto: sin fuente de la fecha
    // no se inventa el día. fuentes y verificadoEn siguen siendo obligatorios.
    fechaOpcional(item.fechaApertura, `${ruta}.fechaApertura`, errores);
    if (typeof item.resumen !== "string" || !item.resumen.trim()) errores.push(`${ruta}: falta resumen`);
    errores.push(...erroresFuentesYFecha(item, ruta));
  });
  return errores;
}

export function erroresAgenda(datos, indice) {
  const errores = [];
  if (!esObjeto(datos) || !Array.isArray(datos.items)) {
    return ["agenda.json: hace falta { items }"];
  }
  const ids = new Set();
  datos.items.forEach((item, i) => {
    const ruta = `agenda.items[${i}]`;
    if (!esObjeto(item)) {
      errores.push(`${ruta}: no es un objeto`);
      return;
    }
    if (typeof item.id !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id)) {
      errores.push(`${ruta}: id vacío o no es un slug`);
    } else if (ids.has(item.id)) {
      errores.push(`${ruta}: id repetido`);
    } else {
      ids.add(item.id);
    }
    if (typeof item.nombre !== "string" || !item.nombre.trim()) errores.push(`${ruta}: falta nombre`);
    if (!ESTADOS_AGENDA.has(item.estado)) errores.push(`${ruta}: estado no válido`);
    if (!instanteConZona(item.inicio)) errores.push(`${ruta}: inicio tiene que ser ISO con zona`);
    if (!instanteConZona(item.fin)) errores.push(`${ruta}: fin tiene que ser ISO con zona`);
    if (diaDe(item.inicio) && diaDe(item.fin) && diaDe(item.fin) < diaDe(item.inicio)) {
      errores.push(`${ruta}: fin anterior a inicio`);
    }
    if (typeof item.sinHora !== "boolean") errores.push(`${ruta}: sinHora tiene que ser true o false`);
    if (!esObjeto(item.lugar) || typeof item.lugar.nombre !== "string" || !item.lugar.nombre.trim()) {
      errores.push(`${ruta}: falta lugar.nombre`);
    } else if (typeof item.lugar.direccion !== "string" || !indice.zonas.has(item.lugar.zona)) {
      errores.push(`${ruta}: lugar.direccion o lugar.zona no válidos`);
    }
    if (!esObjeto(item.organizador) || typeof item.organizador.nombre !== "string" || !item.organizador.nombre.trim()) {
      errores.push(`${ruta}: falta organizador.nombre`);
    } else if (item.organizador.url !== null && !urlHttp(item.organizador.url)) {
      errores.push(`${ruta}: organizador.url tiene que ser null o http(s)`);
    }
    if (typeof item.gratis !== "boolean") errores.push(`${ruta}: gratis tiene que ser true o false`);
    if (item.precio !== null && (typeof item.precio !== "string" || !item.precio.trim())) {
      errores.push(`${ruta}: precio tiene que ser null o texto`);
    }
    if (item.entradasUrl !== null && !urlHttp(item.entradasUrl)) {
      errores.push(`${ruta}: entradasUrl tiene que ser null o http(s)`);
    }
    if (typeof item.categoria !== "string" || !item.categoria.trim()) errores.push(`${ruta}: falta categoria`);
    if (typeof item.resumen !== "string" || !item.resumen.trim()) errores.push(`${ruta}: falta resumen`);
    if (!Array.isArray(item.fichasRelacionadas)) {
      errores.push(`${ruta}: fichasRelacionadas tiene que ser un array`);
    } else {
      for (const slug of item.fichasRelacionadas) {
        if (typeof slug !== "string" || !indice.slugs.has(slug)) {
          errores.push(`${ruta}: ficha relacionada desconocida (${slug})`);
        }
      }
    }
    if (item.fiestaSlug !== null && (typeof item.fiestaSlug !== "string" || !indice.fiestas.has(item.fiestaSlug))) {
      errores.push(`${ruta}: fiestaSlug desconocido`);
    }
    errores.push(...erroresFuentesYFecha(item, ruta));
  });
  return errores;
}

export function indiceDesde({ negocios = [], categorias = [], zonas = [], fiestas = [] } = {}) {
  return {
    fichas: new Set(negocios.filter((n) => n?.category && n?.slug).map((n) => `${n.category}/${n.slug}`)),
    slugs: new Set(negocios.filter((n) => n?.slug).map((n) => n.slug)),
    categorias: new Set(categorias.filter((c) => c?.slug).map((c) => c.slug)),
    zonas: new Set(zonas.filter((z) => z?.slug).map((z) => z.slug)),
    fiestas: new Set(fiestas.filter((f) => f?.slug).map((f) => f.slug)),
  };
}

function leer(root, rel) {
  return JSON.parse(readFileSync(path.join(root, rel), "utf8"));
}

export function validarRaiz(root) {
  const indice = indiceDesde({
    negocios: leer(root, "src/data/negocios.json"),
    categorias: leer(root, "src/data/categorias.json"),
    zonas: leer(root, "src/data/zonas.json"),
    fiestas: leer(root, "src/data/fiestas.json"),
  });
  return [
    ...erroresAperturas(leer(root, "src/data/aperturas.json"), indice),
    ...erroresAgenda(leer(root, "src/data/agenda.json"), indice),
  ];
}

const esCli = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (esCli) {
  const errores = validarRaiz(path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));
  if (errores.length > 0) {
    console.error(`validate-datos: ${errores.length} error(es)`);
    for (const error of errores) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log("validate-datos: aperturas y agenda ok");
}
