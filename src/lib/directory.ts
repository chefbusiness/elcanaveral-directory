// Directory engine — El Canaveral Info
import fs from "node:fs";
import path from "node:path";
import { stripBlockedWebsites, warnStripped } from "./website-guard.js";

export interface Negocio {
  slug: string;
  name: string;
  description: string;
  category: string;
  categoryName: string;
  zona: string;
  zonaName: string;
  // Contacto y ubicacion
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  image?: string;
  images?: string[];
  horario?: string;
  googleMapsUrl?: string;
  // Horario estructurado por día tal como lo publica Google (enriquecimiento con Apify):
  // [{ dia: "lunes", horas: "9 AM to 8 PM" }, { dia: "domingo", horas: "Cerrado" }]
  horarioSemanal?: { dia?: string; horas?: string }[];
  // Reputacion
  rating?: number;
  numReviews?: number;
  // Geolocalizacion (Google Places) — 283/286 fichas la traen
  lat?: number;
  lng?: number;
  placeId?: string;
  googleCategory?: string;
  // Clasificacion
  tags?: string[];
  featured?: boolean;
  estado?: "proxima-apertura";   // negocio anunciado que aun no ha abierto
  // Campos enriquecidos (comunes a todos)
  servicios?: string[];
  destacados?: string[];    // puntos fuertes / highlights
  precioRango?: string;     // "€" | "€€" | "€€€" | "€€€€"
  anoApertura?: number;
  redesSociales?: { instagram?: string; facebook?: string; tiktok?: string };
  // Campos especificos por categoria (flexibles)
  edades?: string;          // educacion: "0-3 anos"
  plazas?: number;          // educacion: 156
  tipoGestion?: string;     // educacion: "publica" | "privada" | "concertada"
  especialidades?: string[];// salud: ["ortodoncia", "implantes"]
  tiposCocina?: string[];   // restaurantes: ["asturiano", "venezolano"]
  menuDelDia?: boolean;     // restaurantes
  terraza?: boolean;        // restaurantes, cafeterias
  delivery?: boolean;       // restaurantes
  aparcamiento?: boolean;
  accesibilidad?: boolean;
  wifi?: boolean;
  // Catch-all
  [key: string]:
    | string
    | string[]
    | boolean
    | number
    | Record<string, string>
    | { dia?: string; horas?: string }[]
    | undefined;
}

export interface Categoria {
  slug: string;
  name: string;
  description: string;
  icon?: string;
  count?: number;
}

export interface Zona {
  slug: string;
  name: string;
  description: string;
  municipality?: string;
  district?: string;
  postalCodes?: string[];
  primary?: boolean;
  count?: number;
}

const DATA_DIR = path.resolve("src/data");
const SITE_URL = "https://www.elcanaveral.info";

// Zonas sin contadores: para el schema solo hacen falta municipio y CP, y
// loadZonas() recalcula counts recorriendo los 286 negocios en cada llamada.
let zonasRawCache: Zona[] | null = null;
function getZonasRaw(): Zona[] {
  if (zonasRawCache) return zonasRawCache;
  const filePath = path.join(DATA_DIR, "zonas.json");
  zonasRawCache = fs.existsSync(filePath)
    ? (JSON.parse(fs.readFileSync(filePath, "utf-8")) as Zona[])
    : [];
  return zonasRawCache;
}

// Caja del area cubierta (este de Madrid + Corredor del Henares). Filtro de
// cordura para las coordenadas de Google Places (hay fichas con lat/lng de otro
// pais). Exportada para que los endpoints que publican datos (llms.txt,
// llms-full.txt) informen exactamente de lo mismo que publica el schema.
const AREA = { latMin: 40.2, latMax: 40.6, lngMin: -3.95, lngMax: -3.2 };
export function coordenadasPlausibles(lat: number, lng: number): boolean {
  return lat >= AREA.latMin && lat <= AREA.latMax && lng >= AREA.lngMin && lng <= AREA.lngMax;
}

// ¿Abre en domingo? Los horarios de Google llegan en tres formatos:
//   · español abreviado: "L-S 9:00-21:30, D 10:00-15:00"
//   · Google (día primero, minúsculas): "do 10 AM to 5 PM, lu 9 AM to 5 PM…"
//   · Google separando días con punto medio: "do 7:30 AM to 1 a.m. · lu Cerrado · ma …"
// Se separa por coma, punto y coma, salto de línea Y punto medio (el error que hacía perder
// fichas: al no partir por "·" un solo día «Cerrado» invalidaba el fragmento ENTERO y con él el
// domingo). Dentro de cada fragmento se miran los tokens de día —incluidos los extremos de un
// rango («S-D», «L-D») y formas largas («Martes a Domingo: 9:00-21:00»)— y se ignoran los
// fragmentos que empiezan por hora, que continúan el día anterior ("…, 17:00-20:30").
const DIA_DOMINGO = /^(?:d|do|dom|domingo)$/i;
const SEPARADOR = /[,;\n\u00b7•|]+/; // · es U+00B7
function diaDelFragmento(fragmento: string): string[] {
  const antesDeLaHora = (fragmento.split(/\d/)[0] || "").trim();
  if (!antesDeLaHora) return [];
  return antesDeLaHora
    .split(/[/\s]+|\by\b|\ba\b/i)
    .flatMap((t) => t.split("-"))
    .map((t) => t.replace(/[.:;,]+$/, "").trim())
    .filter(Boolean);
}
export function abreDomingo(negocio: { horario?: string; horarioSemanal?: { dia?: string; horas?: string }[] }): boolean {
  // Si tenemos el horario estructurado por día (enriquecimiento de Apify), es la fuente fiable:
  // no hay que interpretar texto. "Cerrado" en el domingo = cerrado.
  const semanal = negocio.horarioSemanal;
  if (Array.isArray(semanal) && semanal.length > 0) {
    const dom = semanal.find((d) => /^dom/i.test((d.dia || "").trim()));
    if (dom) return !!dom.horas && !/cerrado|closed/i.test(dom.horas);
    return false;
  }
  const horario = (negocio.horario || "").trim();
  if (!horario) return false;
  for (const fragmento of horario.split(SEPARADOR).map((s) => s.trim())) {
    if (!fragmento) continue;
    const tokens = diaDelFragmento(fragmento);
    if (!tokens.some((t) => DIA_DOMINGO.test(t))) continue;
    // Cerrado solo cuenta si el fragmento NO trae una franja horaria después del día.
    const trasElDia = fragmento.replace(/^[^\d]*/, "");
    if (/cerrado|closed|tancat/i.test(fragmento) && !/\d/.test(trasElDia)) continue;
    return true;
  }
  return false;
}

// Perfil social -> URL absoluta. Acepta handle ("@bunbun_brunch"), handle sin @
// o URL completa ya pegada en los datos (caso real: bunbun-canaveral).
// --- Horario en formato ISO (schema.org) -------------------------------------
// `horario` es texto libre en español o en el formato de Google («L-S 9:00-21:30, D 10:00-15:00» /
// «do 10 AM to 5 PM · lu 9 AM to 5 PM»). Schema.org espera ISO («Mo-Sa 09:00-21:30») y, si no se
// convierte, Google ignora el campo. La conversión es CONSERVADORA: si un solo fragmento no se
// entiende con seguridad se devuelve undefined y no se publica nada para ese negocio, porque un
// horario mal traducido en un directorio local es peor que un campo ausente.
const DIAS_ISO: Record<string, string> = {
  l: "Mo", lu: "Mo", lun: "Mo", lunes: "Mo",
  m: "Tu", ma: "Tu", mar: "Tu", martes: "Tu",
  x: "We", mi: "We", mie: "We", "mié": "We", miercoles: "We", "miércoles": "We",
  j: "Th", ju: "Th", jue: "Th", jueves: "Th",
  v: "Fr", vi: "Fr", vie: "Fr", viernes: "Fr",
  s: "Sa", sa: "Sa", sab: "Sa", "sá": "Sa", "sáb": "Sa", sabado: "Sa", "sábado": "Sa",
  d: "Su", do: "Su", dom: "Su", "dóm": "Su", domingo: "Su",
};
const ORDEN_DIAS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function horaAIso(hora: string, pmPorContexto: boolean): string | null {
  const m = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.?\s?m\.?|p\.?\s?m\.?)?$/i.exec(hora.trim());
  if (!m) return null;
  let hh = parseInt(m[1], 10);
  const mm = m[2] || "00";
  const sufijo = (m[3] || "").toLowerCase().replace(/[.\s]/g, "");
  const esPm = sufijo.startsWith("p") || (pmPorContexto && sufijo === "");
  const esAm = sufijo.startsWith("a");
  if (hh > 23 || parseInt(mm, 10) > 59) return null;
  if (esPm && hh < 12) hh += 12;
  if (esAm && hh === 12) hh = 0;
  return `${String(hh).padStart(2, "0")}:${mm}`;
}

function diasDelFragmento(fragmento: string): string[] | null {
  const antes = (fragmento.split(/\d/)[0] || "").trim();
  if (!antes) return null; // empieza por hora: continúa los días anteriores
  const dias: string[] = [];
  for (const parte of antes.split(/\s+y\s+/i)) {
    const limpio = parte.replace(/[.:;,]+$/, "").trim().toLowerCase();
    const rango = limpio.split(/\s*-\s*|\s+a\s+/);
    if (rango.length === 2) {
      const a = DIAS_ISO[rango[0].trim()];
      const b = DIAS_ISO[rango[1].trim()];
      if (!a || !b) return null;
      const ia = ORDEN_DIAS.indexOf(a);
      const ib = ORDEN_DIAS.indexOf(b);
      if (ia < 0 || ib < 0 || ia > ib) return null;
      dias.push(`${a}-${b}`);
    } else {
      const d = DIAS_ISO[limpio];
      if (!d) return null;
      dias.push(d);
    }
  }
  return dias.length ? dias : null;
}

/** Horario libre -> ISO (varias cadenas). undefined si no se puede traducir con seguridad. */
export function horarioISO(negocio: {
  horario?: string;
  horarioSemanal?: { dia?: string; horas?: string }[];
}): string[] | undefined {
  // 1) Preferencia: el horario ESTRUCTURADO por día del enriquecimiento de Apify (viene directo del
  // perfil de Google, con el día cerrado ya marcado): no hay que adivinar nada leyendo texto.
  const semanal = negocio.horarioSemanal;
  if (Array.isArray(semanal) && semanal.length > 0) {
    const salida: string[] = [];
    for (const d of semanal) {
      const dia = DIAS_ISO[(d.dia || "").trim().toLowerCase()];
      const horas = (d.horas || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
      if (!dia || !horas || /cerrado|closed/i.test(horas)) continue;
      const partes: string[] = [];
      for (const fr of horas.split(/,\s*/).map((s) => s.trim()).filter(Boolean)) {
        const m = /^(.+?)\s*(?:-|\bto\b|\ba\b)\s*(.+)$/i.exec(fr);
        if (!m) return undefined;
        const pm = /pm|p\.?\s?m/i.test(m[1]) || /pm|p\.?\s?m/i.test(m[2]);
        const ini = horaAIso(m[1], pm);
        const fin = horaAIso(m[2], pm);
        if (!ini || !fin) return undefined;
        partes.push(`${ini}-${fin}`);
      }
      if (partes.length) salida.push(`${dia} ${partes.join(",")}`);
    }
    return salida.length ? salida : undefined;
  }

  // 2) Texto libre (formato español o el compacto de Google).
  const limpiar = (s: string) => s.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  const limpio = limpiar(negocio.horario || "");
  if (!limpio) return undefined;
  if (/^24\s?h/i.test(limpio) || /todos los d[ií]as.*24/i.test(limpio)) return ["Mo-Su 00:00-24:00"];

  const fragmentos = limpio.split(/[,;\n\u00b7•|]+/).map(limpiar).filter(Boolean);
  if (fragmentos.length === 0) return undefined;

  const salida: string[] = [];
  let diasPendientes: string[] | null = null;
  for (const f of fragmentos) {
    if (/cerrado|closed/i.test(f)) { diasPendientes = null; continue; }
    const dias = diasDelFragmento(f);
    // Un fragmento con prefijo de días que NO se reconoce (p. ej. una abreviatura nueva de Google)
    // no puede heredar los días del anterior: eso atribuía en silencio unas horas al día equivocado.
    // Si trae prefijo y no lo entendemos, se descarta el horario entero.
    const prefijo = (f.split(/\d/)[0] || "").trim();
    if (!dias && prefijo) return undefined;
    if (dias) diasPendientes = dias;
    if (!diasPendientes) return undefined;

    // OJO con el greedy: `^[^\d]*(?=\d)` se comía la primera franja de "do 9 AM to 11 PM"
    // (seguía buscando dígitos hasta el "11"). Tiene que parar en el primero.
    const trasDia = f.replace(/^[^\d]*/, "");
    const partes: string[] = [];
    if (/24\s?h/i.test(trasDia)) {
      partes.push("00:00-24:00");
    } else {
      for (const fr of trasDia.split(/\s+y\s+|,\s*/i).map((s) => s.trim()).filter(Boolean)) {
        // Los separadores van con límite de palabra: sin él, la alternativa «a» de «9 AM to 11 PM»
        // casaba con la A de AM y partía la hora en "9" / "M to 11 PM".
        const m = /^(.+?)\s*(?:-|\bto\b|\ba\b)\s*(.+)$/i.exec(fr);
        if (!m) continue;
        const pmEnLaFrase = /pm|p\.?\s?m/i.test(m[1]) || /pm|p\.?\s?m/i.test(m[2]);
        const ini = horaAIso(m[1], pmEnLaFrase);
        const fin = horaAIso(m[2], pmEnLaFrase);
        if (!ini || !fin) return undefined;
        partes.push(`${ini}-${fin}`);
      }
    }
    if (partes.length === 0) return undefined;
    salida.push(`${diasPendientes.join(",")} ${partes.join(",")}`);
  }
  return salida.length ? salida : undefined;
}

const SOCIAL_BASE: Record<string, string> = {
  instagram: "https://instagram.com/",
  facebook: "https://facebook.com/",
  tiktok: "https://tiktok.com/@",
};

export function socialProfileUrl(network: string, value?: string): string | undefined {
  const raw = (value || "").trim();
  if (!raw) return undefined;
  if (/^https?:\/\//i.test(raw)) return raw;
  const base = SOCIAL_BASE[network];
  const handle = raw.replace(/^@/, "").replace(/^\/+/, "");
  if (!base || !handle) return undefined;
  return base + handle;
}

export function normalizeSocialUrls(redes?: Record<string, string>): string[] {
  if (!redes || typeof redes !== "object") return [];
  return Object.keys(redes)
    .map((network) => socialProfileUrl(network, redes[network]))
    .filter((url): url is string => !!url);
}

export function loadNegocios(): Negocio[] {
  const filePath = path.join(DATA_DIR, "negocios.json");
  if (!fs.existsSync(filePath)) return [];
  const raw: Negocio[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  // Guard: webs bloqueadas por el titular nunca llegan a HTML/json-ld
  // (ver src/data/website-blocklist.json).
  const { negocios, stripped } = stripBlockedWebsites(raw);
  warnStripped(stripped, "website-guard");
  return negocios as Negocio[];
}

export function loadCategorias(): Categoria[] {
  const filePath = path.join(DATA_DIR, "categorias.json");
  if (!fs.existsSync(filePath)) return [];
  const cats: Categoria[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const negocios = loadNegocios();
  return cats.map((cat) => ({
    ...cat,
    count: negocios.filter((n) => n.category === cat.slug).length,
  }));
}

export function loadZonas(): Zona[] {
  const filePath = path.join(DATA_DIR, "zonas.json");
  if (!fs.existsSync(filePath)) return [];
  const zonas: Zona[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const negocios = loadNegocios();
  return zonas.map((z) => ({
    ...z,
    count: negocios.filter((n) => n.zona === z.slug).length,
  }));
}

export function getNegociosByCategoria(categoriaSlug: string): Negocio[] {
  return loadNegocios().filter((n) => n.category === categoriaSlug);
}

export function getNegociosByZona(zonaSlug: string): Negocio[] {
  return loadNegocios().filter((n) => n.zona === zonaSlug);
}

export function getNegociosByCategoriaYZona(
  categoriaSlug: string,
  zonaSlug: string
): Negocio[] {
  return loadNegocios().filter(
    (n) => n.category === categoriaSlug && n.zona === zonaSlug
  );
}

export function getNegocioBySlug(slug: string): Negocio | undefined {
  return loadNegocios().find((n) => n.slug === slug);
}

export function getFeaturedNegocios(limit = 6): Negocio[] {
  return loadNegocios()
    .filter((n) => n.featured)
    .slice(0, limit);
}

// Path generators for getStaticPaths
export function generateNegocioPaths() {
  const negocios = loadNegocios();
  return negocios.map((negocio) => ({
    params: { categoria: negocio.category, slug: negocio.slug },
    props: negocio,
  }));
}

export function generateCategoriaPaths() {
  const categorias = loadCategorias();
  return categorias
    .filter((cat) => (cat.count ?? 0) > 0)
    .map((cat) => ({
      params: { categoria: cat.slug },
      props: { ...cat, negocios: getNegociosByCategoria(cat.slug) },
    }));
}

export function generateZonaPaths() {
  const zonas = loadZonas();
  return zonas.map((zona) => ({
    params: { zona: zona.slug },
    props: { ...zona, negocios: getNegociosByZona(zona.slug) },
  }));
}

export function generateZonaCategoriaPaths() {
  const zonas = loadZonas();
  const categorias = loadCategorias();
  const paths: any[] = [];

  for (const zona of zonas) {
    for (const cat of categorias) {
      const negocios = getNegociosByCategoriaYZona(cat.slug, zona.slug);
      if (negocios.length > 0) {
        paths.push({
          params: { zona: zona.slug, categoria: cat.slug },
          props: { zona, categoria: cat, negocios },
        });
      }
    }
  }

  return paths;
}

// Schema.org — tipo especifico por categoria
const SCHEMA_TYPE_MAP: Record<string, string> = {
  "supermercados": "GroceryStore",
  "fruterias": "GroceryStore",
  "panaderias": "Bakery",
  "cafeterias": "CafeOrCoffeeShop",
  "restaurantes": "Restaurant",
  "tiendas-alimentacion": "ConvenienceStore",
  "salud": "MedicalBusiness",
  "belleza": "BeautySalon",
  "deporte": "SportsActivityLocation",
  "educacion": "EducationalOrganization",
  "mascotas": "VeterinaryCare",
  "hogar": "HardwareStore",
  "moda": "ClothingStore",
  "automocion": "AutoRepair",
  "servicios-profesionales": "ProfessionalService",
  "ocio": "EntertainmentBusiness",
};

export function generateLocalBusinessSchema(negocio: Negocio) {
  const schemaType = SCHEMA_TYPE_MAP[negocio.category] || "LocalBusiness";
  const servicios = (negocio.servicios as string[] | undefined) || [];
  const zona = getZonasRaw().find((z) => z.slug === negocio.zona);

  const fichaUrl = `${SITE_URL}/${negocio.category}/${negocio.slug}/`;
  const lat = Number(negocio.lat);
  const lng = Number(negocio.lng);
  // `geo` solo si las coordenadas caen dentro del area cubierta. Hay fichas con
  // lat/lng de otro pais (Alemania, Venezuela, Colombia, Cadiz) del mismo scrape
  // de Google Places: publicar ese geo es peor que no publicar ninguno.
  const tieneGeo =
    Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0 && coordenadasPlausibles(lat, lng);
  const municipio = zona?.municipality || negocio.zonaName || "Madrid";

  // CP: manda el que ya viene dentro de la direccion (lo traen las 286 fichas);
  // el de zonas.json solo es el fallback. Usar el generico de la zona producia
  // 60 direcciones autocontradictorias (streetAddress "…28820 Coslada" con
  // postalCode 28822).
  const cpEnDireccion = (negocio.address || "").match(/\b(28\d{3})\b/)?.[1];
  const postalCode = cpEnDireccion || zona?.postalCodes?.[0];

  // Mapa: place_id es el identificador estable del negocio en Google, pero si las
  // coordenadas de la misma ficha estan fuera del area, el scrape no es fiable y
  // se prefiere buscar por direccion antes que enlazar a un local equivocado.
  const mapsUrl = negocio.placeId && tieneGeo
    ? `https://www.google.com/maps/place/?q=place_id:${negocio.placeId}`
    : negocio.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(negocio.address)}`
      : undefined;

  // sameAs: URLs que identifican al MISMO negocio en otros sitios (perfiles
  // sociales). La web propia va en `url` y el mapa en `hasMap`, asi que ninguno
  // de los dos se repite aqui.
  const sameAs = normalizeSocialUrls(negocio.redesSociales as Record<string, string> | undefined);

  return {
    "@context": "https://schema.org",
    "@type": schemaType,
    // Identificador estable de la entidad tal como se documenta en esta ficha.
    "@id": `${fichaUrl}#localbusiness`,
    name: negocio.name,
    description: negocio.description,
    // url = web oficial del negocio; si no tiene, la ficha es su referencia publica.
    url: negocio.website || fichaUrl,
    ...(negocio.address && {
      address: {
        "@type": "PostalAddress",
        streetAddress: negocio.address,
        // addressLocality es el MUNICIPIO (no el barrio): Google y los LLM
        // resuelven la direccion contra municipios, no contra barrios.
        addressLocality: municipio,
        addressRegion: "Comunidad de Madrid",
        ...(postalCode && { postalCode }),
        addressCountry: "ES",
      },
    }),
    ...(tieneGeo && {
      geo: { "@type": "GeoCoordinates", latitude: lat, longitude: lng },
    }),
    ...(mapsUrl && { hasMap: mapsUrl }),
    ...(sameAs.length > 0 && { sameAs }),
    ...(negocio.phone && { telephone: negocio.phone }),
    ...(negocio.email && { email: negocio.email }),
    ...((negocio.images && negocio.images.length > 0)
      ? { image: negocio.images.map((img) => `https://www.elcanaveral.info${img}`) }
      : negocio.image && { image: `https://www.elcanaveral.info${negocio.image}` }),
    // aggregateRating exige al menos 1 resena: sin numReviews el markup es invalido.
    ...(negocio.rating && (negocio.numReviews || 0) > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: negocio.rating,
        bestRating: 5,
        reviewCount: negocio.numReviews,
      },
    }),
    // Horario en ISO cuando se puede traducir con seguridad (ver `horarioISO`): el texto libre que
    // había antes lo ignoran Google y los LLM. Si no se puede traducir, NO se publica el campo
    // (el horario sigue visible en la ficha para las personas): mejor ausente que equivocado.
    ...((horarioISO(negocio) ?? []).length > 0 && { openingHours: horarioISO(negocio) }),
    ...(negocio.precioRango && { priceRange: negocio.precioRango }),
    ...(servicios.length > 0 && {
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Servicios",
        itemListElement: servicios.map((s) => ({
          "@type": "Offer",
          itemOffered: { "@type": "Service", name: s },
        })),
      },
    }),
    // Ciudad + barrio cuando son distintos: en Coslada y San Fernando el nombre
    // de la zona ya ES el municipio, y repetirlo solo añade ruido.
    areaServed: [
      { "@type": "City", name: municipio },
      ...(negocio.zonaName && negocio.zonaName !== municipio
        ? [{ "@type": "Place", name: negocio.zonaName }]
        : []),
    ],
  };
}
