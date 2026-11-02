// Enlaces que tienen que existir para que un buscador llegue a hubs, listicles y guías.
// La fecha de publicación sigue la misma regla que isPublished en listicles.ts (día UTC del build).
import { readFileSync } from "node:fs";
import path from "node:path";

function leer(root, rel) {
  return JSON.parse(readFileSync(path.join(root, rel), "utf8"));
}

export function listiclePublicado(listicle, hoy = new Date().toISOString().slice(0, 10)) {
  if (!listicle || listicle.draft) return false;
  return (listicle.publishedDate || "9999-12-31") <= hoy;
}

export function enlacesDePortada(root = process.cwd(), hoy = new Date().toISOString().slice(0, 10)) {
  const categorias = leer(root, "src/data/categorias.json");
  const negocios = leer(root, "src/data/negocios.json");
  const listicles = leer(root, "src/data/listicles.json");
  const guias = leer(root, "src/data/guias.json");
  const conFichas = new Set(negocios.map((n) => n.category).filter(Boolean));

  const hubs = categorias
    .filter((c) => conFichas.has(c.slug))
    .map((c) => ({ href: `/${c.slug}/`, label: c.name }));

  const publicados = listicles.filter((l) => listiclePublicado(l, hoy));
  const listicleEnlaces = publicados.map((l) => ({
    href: `/blog/${l.slug}/`,
    label: l.breadcrumb || l.h1,
  }));

  const guiaEnlaces = [
    { href: "/guias/", label: "Guías" },
    ...guias.map((g) => ({ href: `/guias/${g.slug}/`, label: g.title })),
  ];

  return {
    hubs,
    listicles: listicleEnlaces,
    guias: guiaEnlaces,
    barrio: { href: "/el-canaveral/", label: "El Cañaveral" },
  };
}

/** Todos los listicles publicados de una categoría, generales primero. */
export function listiclesDeCategoria(category, root = process.cwd(), hoy = new Date().toISOString().slice(0, 10)) {
  const listicles = leer(root, "src/data/listicles.json");
  return listicles
    .filter((l) => l.category === category && listiclePublicado(l, hoy))
    .sort((a, b) => Number(Boolean(a.zona)) - Number(Boolean(b.zona)) || a.slug.localeCompare(b.slug, "es"))
    .map((l) => ({
      slug: l.slug,
      href: `/blog/${l.slug}/`,
      h1: l.h1,
    }));
}
