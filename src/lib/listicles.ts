// Motor de listicles ("mejores X en El Cañaveral") — El Canaveral Info
import fs from "node:fs";
import path from "node:path";
import { loadNegocios, type Negocio } from "./directory";

export interface ListicleFaq {
  q: string;
  a: string;
}

export interface Listicle {
  slug: string;
  category: string;        // categoria del directorio a rankear
  noun: string;            // plural para conteos: "restaurantes", "gimnasios"...
  breadcrumb: string;      // etiqueta corta breadcrumb: "Mejores restaurantes"
  ctaTitle: string;        // titular del gancho: "¿Tienes un restaurante...?"
  h1: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  topN?: number;           // tope opcional de items
  minRating?: number;      // nota minima para entrar (def: sin filtro)
  googleCategoryMatch?: string[]; // sub-filtro por categoria Google (ej. ["dental"])
  publishedDate: string;          // YYYY-MM-DD; si es futura, la guia no se publica aun
  updatedDate: string;
  draft?: boolean;                // true = nunca publicar (borrador), ignora la fecha
  faq?: ListicleFaq[];
}

export interface RankedNegocio {
  rank: number;
  score: number;
  negocio: Negocio;
}

const DATA_DIR = path.resolve("src/data");

export function loadListicles(): Listicle[] {
  const filePath = path.join(DATA_DIR, "listicles.json");
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

/** Una guia esta publicada si no es borrador y su fecha no es futura (hora del build). */
export function isPublished(l: Listicle): boolean {
  if (l.draft) return false;
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC del build)
  return (l.publishedDate || "9999-12-31") <= today;
}

/** Guias visibles ahora mismo: filtra borradores y fechas futuras. Es la que usa todo lo publico. */
export function loadPublishedListicles(): Listicle[] {
  return loadListicles().filter(isPublished);
}

/**
 * Ranking ponderado bayesiano (estilo IMDb): combina nota media (R) con
 * volumen de reseñas (v), de forma que una nota alta con muchas reseñas pesa
 * más que un 5 con 3 opiniones.  score = (v/(v+m))*R + (m/(v+m))*C
 *   C = nota media de la categoría · m = mediana de reseñas de la categoría
 * C y m se calculan sobre TODOS los negocios valorados de la categoría (estable);
 * el filtro minRating solo afecta a qué se muestra.
 */
const norm = (s: string) =>
  (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function getRankedNegocios(
  category: string,
  opts: { topN?: number; minRating?: number; googleCategoryMatch?: string[] } = {}
): RankedNegocio[] {
  let rated = loadNegocios().filter(
    (n) => n.category === category && typeof n.rating === "number" && typeof n.numReviews === "number"
  );
  if (opts.googleCategoryMatch && opts.googleCategoryMatch.length > 0) {
    const needles = opts.googleCategoryMatch.map(norm);
    rated = rated.filter((n) => {
      const g = norm((n.googleCategory as string) || "");
      return needles.some((nd) => g.includes(nd));
    });
  }
  if (rated.length === 0) return [];

  const C = rated.reduce((s, n) => s + (n.rating as number), 0) / rated.length;
  const reviews = rated.map((n) => n.numReviews as number).sort((a, b) => a - b);
  const mid = Math.floor(reviews.length / 2);
  const m = reviews.length % 2 ? reviews[mid] : (reviews[mid - 1] + reviews[mid]) / 2;

  const score = (n: Negocio) => {
    const v = n.numReviews as number;
    const R = n.rating as number;
    return (v / (v + m)) * R + (m / (v + m)) * C;
  };

  let ranked = rated
    .filter((n) => (opts.minRating ? (n.rating as number) >= opts.minRating : true))
    .map((n) => ({ negocio: n, score: score(n) }))
    .sort((a, b) => b.score - a.score);

  if (opts.topN) ranked = ranked.slice(0, opts.topN);

  return ranked.map((r, i) => ({ rank: i + 1, score: r.score, negocio: r.negocio }));
}

export function generateListiclePaths() {
  // Solo genera paginas de las guias ya publicadas (las futuras 404 hasta su fecha).
  return loadPublishedListicles().map((l) => ({ params: { slug: l.slug }, props: l }));
}

/** Devuelve la guia ("mejores X") PUBLICADA asociada a una categoria, si existe. */
export function getListicleByCategory(category: string): Listicle | undefined {
  return loadPublishedListicles().find((l) => l.category === category);
}
