// Directory engine — El Canaveral Info
import fs from "node:fs";
import path from "node:path";

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
  horario?: string;
  googleMapsUrl?: string;
  // Reputacion
  rating?: number;
  numReviews?: number;
  // Clasificacion
  tags?: string[];
  featured?: boolean;
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

export function loadNegocios(): Negocio[] {
  const filePath = path.join(DATA_DIR, "negocios.json");
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
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

// Schema.org LocalBusiness
export function generateLocalBusinessSchema(negocio: Negocio) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: negocio.name,
    description: negocio.description,
    ...(negocio.address && {
      address: {
        "@type": "PostalAddress",
        streetAddress: negocio.address,
        addressLocality: negocio.zonaName,
        addressRegion: "Comunidad de Madrid",
        addressCountry: "ES",
      },
    }),
    ...(negocio.phone && { telephone: negocio.phone }),
    ...(negocio.email && { email: negocio.email }),
    ...(negocio.website && { url: negocio.website }),
    ...(negocio.image && { image: negocio.image }),
    ...(negocio.rating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: negocio.rating,
        reviewCount: negocio.numReviews || 0,
      },
    }),
  };
}
