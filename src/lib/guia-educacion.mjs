// Guía de guarderías a partir de las fichas de educación infantil que ya existen.
// No añade centros ni datos: edad, plazas, gestión, horario y dirección salen de la ficha.
import { readFileSync } from "node:fs";
import path from "node:path";

const SLUG = "guarderias-y-escuelas-infantiles-el-canaveral";
const RE_INFANTIL = /guarder[ií]a|preescolar|jard[ií]n de infancia|educaci[oó]n infantil/i;
const RE_OTRO = /academia|autoescuela|idioma|m[uú]sica|art[ií]culos para beb/i;
const RE_CALLE = /enrique\s+urquijo/i;
const CONECTOR = /^(?:a|al|con|de|del|e|el|en|la|las|le|lo|los|o|para|por|que|su|sus|un|una|y)$/i;

export function esCalleRestringida(texto) {
  return RE_CALLE.test(String(texto || ""));
}

export function esEducacionInfantil(negocio) {
  if (!negocio || negocio.category !== "educacion") return false;
  const google = negocio.googleCategory || "";
  if (RE_OTRO.test(google)) return false;
  if (RE_INFANTIL.test(google)) return true;
  if ((negocio.tags || []).some((tag) => /guarder/i.test(tag))) return true;
  return /^0\s*[-–a]\s*3/i.test(negocio.edades || "");
}

function grupoDe(negocio) {
  const gestion = String(negocio.tipoGestion || "").toLowerCase();
  if (gestion.startsWith("púb") || gestion.startsWith("pub")) return "publica";
  if (gestion.startsWith("priv")) return "privada";
  return "otra";
}

function resumenDe(negocio) {
  const texto = String(negocio.description || "").replace(/\s+/g, " ").trim();
  const frases = [];
  for (const match of texto.matchAll(/[^.!?]+[.!?]+/g)) {
    const frase = match[0].trim();
    const ultima = frase.replace(/[.!?]+$/g, "").trim().split(/\s+/).pop() || "";
    if (CONECTOR.test(ultima)) break;
    if (esCalleRestringida(frase)) continue;
    frases.push(frase);
  }
  let base = frases.join(" ");
  if (base.length <= 170 && frases.length >= 2) {
    const palabras = frases[frases.length - 1].replace(/[.!?]+$/g, "").trim().split(/\s+/);
    if (palabras.length <= 6) base = frases.slice(0, -1).join(" ");
  }

  const extras = [];
  if (negocio.edades && !base.includes(negocio.edades)) extras.push(`Edades: ${negocio.edades}.`);
  if (typeof negocio.plazas === "number" && !base.includes(String(negocio.plazas))) {
    extras.push(`Plazas: ${negocio.plazas}.`);
  }
  if (negocio.tipoGestion && !base.toLowerCase().includes(String(negocio.tipoGestion).toLowerCase())) {
    extras.push(`Gestión: ${negocio.tipoGestion}.`);
  }
  if (negocio.horario && !base.includes(negocio.horario)) extras.push(`Horario: ${negocio.horario}.`);
  if (typeof negocio.rating === "number" && typeof negocio.numReviews === "number") {
    const nota = String(negocio.rating);
    if (!base.includes(nota)) extras.push(`Nota en la ficha: ${negocio.rating} con ${negocio.numReviews} reseñas.`);
  }
  if (negocio.zonaName && !base.includes(negocio.zonaName)) extras.push(`Zona: ${negocio.zonaName}.`);
  return [base, ...extras].filter(Boolean).join(" ");
}

function fuentesDe(negocio, restringida) {
  const fuentes = [];
  if (typeof negocio.website === "string" && /^https?:\/\//i.test(negocio.website) && !esCalleRestringida(negocio.website)) {
    fuentes.push({ nombre: "Web indicada en la ficha", url: negocio.website, tipo: "web" });
  }
  if (!restringida && typeof negocio.placeId === "string" && negocio.placeId) {
    fuentes.push({
      nombre: "Ficha de Google Maps indicada en la ficha",
      url: `https://maps.google.com/?q=place_id:${encodeURIComponent(negocio.placeId)}`,
      tipo: "web",
    });
  }
  return fuentes;
}

function leerNegocios(root) {
  return JSON.parse(readFileSync(path.join(root, "src/data/negocios.json"), "utf8"));
}

export function guiaEducacionInfantil(root = process.cwd()) {
  const negocios = leerNegocios(root).filter(esEducacionInfantil);
  const ordenGrupo = { publica: 0, privada: 1, otra: 2 };
  const items = negocios
    .map((negocio) => {
      const restringida = esCalleRestringida(negocio.address) || esCalleRestringida(negocio.description);
      const item = {
        id: negocio.slug,
        grupo: grupoDe(negocio),
        zona: negocio.zona,
        nombre: negocio.name,
        resumen: resumenDe(negocio),
        fichaCategoria: negocio.category,
        fichaSlug: negocio.slug,
        fuentes: fuentesDe(negocio, restringida),
      };
      if (!restringida && negocio.address) item.direccion = negocio.address;
      if (negocio.phone) item.telefono = negocio.phone;
      return item;
    })
    .sort((a, b) => {
      const grupo = ordenGrupo[a.grupo] - ordenGrupo[b.grupo];
      if (grupo) return grupo;
      const barrio = Number(a.zona !== "el-canaveral") - Number(b.zona !== "el-canaveral");
      if (barrio) return barrio;
      return a.nombre.localeCompare(b.nombre, "es");
    });

  const publicas = items.filter((item) => item.grupo === "publica").map((item) => item.nombre);
  const privadas = items.filter((item) => item.grupo === "privada").map((item) => item.nombre);
  const enBarrio = items.filter((item) => item.zona === "el-canaveral").map((item) => item.nombre);

  return {
    slug: SLUG,
    title: "Guarderías y escuelas infantiles en El Cañaveral",
    description:
      "Guarderías y escuelas infantiles que ya están en el directorio de El Cañaveral y alrededores, con la fuente de cada ficha. Sin centros nuevos.",
    h1: "Guarderías y escuelas infantiles en El Cañaveral",
    intro:
      "Solo entran las fichas de educación infantil que ya están en el directorio: guardería, escuela infantil, preescolar o jardín de infancia. Edad, plazas, gestión y horario se copian si la ficha los trae. Cada una enlaza su ficha y la fuente que ya tenía (la web o la ficha de Google). No se añaden centros. Si la ficha está en una calle que no publicamos, el centro sale sin dirección y sin mapa.",
    grupos: {
      publica: "Escuelas infantiles públicas",
      privada: "Escuelas infantiles privadas",
      otra: "Otras fichas de educación infantil",
    },
    enlaces: [
      { href: "/educacion/", label: "Educación en El Cañaveral" },
      { href: "/blog/mejores-guarderias-el-canaveral/", label: "Ranking de guarderías" },
    ],
    items,
    faq: [
      {
        q: "¿Qué escuelas infantiles públicas y privadas hay en el directorio?",
        a: `Con el tipo de gestión que trae la ficha, las públicas son ${publicas.join(", ") || "ninguna"}. Las privadas son ${privadas.join(", ") || "ninguna"}. Las demás fichas de esta guía no traen ese dato y no se clasifican.`,
      },
      {
        q: "¿Cuáles de estas fichas están en El Cañaveral?",
        a: `${enBarrio.join(", ")}.`,
      },
    ],
  };
}
