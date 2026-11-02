import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { enlacesDePortada, listiclesDeCategoria } from "../src/lib/enlaces-internos.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hoy = "2026-11-02";

function leer(rel) {
  return JSON.parse(readFileSync(path.join(root, rel), "utf8"));
}

test("la portada enlaza todos los hubs con fichas, los listicles, las guías y el barrio", () => {
  const indice = enlacesDePortada(root, hoy);
  const negocios = leer("src/data/negocios.json");
  const categorias = leer("src/data/categorias.json");
  const conFichas = new Set(negocios.map((n) => n.category));
  const hubsEsperados = categorias.filter((c) => conFichas.has(c.slug)).map((c) => `/${c.slug}/`);

  assert.deepEqual(
    indice.hubs.map((h) => h.href),
    hubsEsperados,
  );
  assert.ok(!indice.hubs.some((h) => h.href === "/ocio/"));

  const listicles = leer("src/data/listicles.json").filter(
    (l) => !l.draft && (l.publishedDate || "9999-12-31") <= hoy,
  );
  assert.deepEqual(
    indice.listicles.map((l) => l.href),
    listicles.map((l) => `/blog/${l.slug}/`),
  );
  assert.ok(indice.listicles.length >= 32);

  const guias = leer("src/data/guias.json");
  assert.deepEqual(indice.guias.map((g) => g.href), [
    "/guias/",
    ...guias.map((g) => `/guias/${g.slug}/`),
  ]);
  assert.equal(indice.barrio.href, "/el-canaveral/");

  const hrefs = [
    ...indice.hubs.map((h) => h.href),
    ...indice.listicles.map((l) => l.href),
    ...indice.guias.map((g) => g.href),
    indice.barrio.href,
  ];
  assert.ok(hrefs.every((href) => href.endsWith("/")));
});

test("cada hub recupera todos sus listicles, generales primero", () => {
  const educacion = listiclesDeCategoria("educacion", root, hoy).map((l) => l.href);
  assert.deepEqual(educacion, [
    "/blog/mejores-academias-ingles-el-canaveral/",
    "/blog/mejores-guarderias-el-canaveral/",
  ]);

  const hogar = listiclesDeCategoria("hogar", root, hoy).map((l) => l.slug);
  assert.deepEqual(hogar, ["mejores-ferreterias-coslada", "mejores-ferreterias-vicalvaro"]);

  const listicles = leer("src/data/listicles.json");
  const categorias = new Set(listicles.map((l) => l.category));
  for (const category of categorias) {
    const esperados = listicles
      .filter((l) => l.category === category && !l.draft && l.publishedDate <= hoy)
      .map((l) => l.slug)
      .sort();
    const reales = listiclesDeCategoria(category, root, hoy)
      .map((l) => l.slug)
      .sort();
    assert.deepEqual(reales, esperados, category);
  }
});

test("la home y el hub usan esos enlaces", () => {
  const home = readFileSync(path.join(root, "src/pages/index.astro"), "utf8");
  const hub = readFileSync(path.join(root, "src/pages/[categoria]/index.astro"), "utf8");
  assert.match(home, /enlacesDePortada\(/);
  assert.match(hub, /listiclesDeCategoria\(/);
});
