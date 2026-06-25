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
  h1: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  topN?: number;           // tope opcional de items
  minRating?: number;      // nota minima para entrar (def: sin filtro)
  publishedDate: string;
  updatedDate: string;
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

/**
 * Ranking ponderado bayesiano (estilo IMDb): combina nota media (R) con
 * volumen de reseñas (v), de forma que una nota alta con muchas reseñas pesa
 * más que un 5 con 3 opiniones.  score = (v/(v+m))*R + (m/(v+m))*C
 *   C = nota media de la categoría · m = mediana de reseñas de la categoría
 * C y m se calculan sobre TODOS los negocios valorados de la categoría (estable);
 * el filtro minRating solo afecta a qué se muestra.
 */
export function getRankedNegocios(
  category: string,
  opts: { topN?: number; minRating?: number } = {}
): RankedNegocio[] {
  const rated = loadNegocios().filter(
    (n) => n.category === category && typeof n.rating === "number" && typeof n.numReviews === "number"
  );
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
  return loadListicles().map((l) => ({ params: { slug: l.slug }, props: l }));
}
