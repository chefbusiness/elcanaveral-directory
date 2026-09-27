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
  [key: string]: string | string[] | boolean | number | Record<string, string> | undefined;
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

// Caja del area cubierta (este de Madrid + Corredor del Henares). Sirve de
// filtro de cordura para las coordenadas de Google Places.
const AREA = { latMin: 40.2, latMax: 40.6, lngMin: -3.95, lngMax: -3.2 };
function dentroDelArea(lat: number, lng: number): boolean {
  return lat >= AREA.latMin && lat <= AREA.latMax && lng >= AREA.lngMin && lng <= AREA.lngMax;
}

// Perfil social -> URL absoluta. Acepta handle ("@bunbun_brunch"), handle sin @
// o URL completa ya pegada en los datos (caso real: bunbun-canaveral).
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
    Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0 && dentroDelArea(lat, lng);
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
    // OJO: `horario` es texto libre en español ("L-S 9:00-21:00, D 10:00-14:00").
    // Schema.org espera formato ISO ("Mo-Sa 09:00-21:00"). Se mantiene el texto
    // tal cual a proposito: traducirlo automaticamente podria publicar un horario
    // equivocado, que en un directorio local es peor que un campo ignorado.
    ...(negocio.horario && { openingHours: negocio.horario }),
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
