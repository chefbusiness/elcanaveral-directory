import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { esEducacionInfantil, guiaEducacionInfantil } from "../src/lib/guia-educacion.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const negocios = JSON.parse(readFileSync(path.join(root, "src/data/negocios.json"), "utf8"));
const FUERA = [
  "english-connection-canaveral",
  "ares-baby",
  "larry-and-andy-language-academy",
  "kids-us-el-canaveral",
  "ms-mr-language-el-canaveral",
  "canaveral-gala-autoescuela",
  "musica-de-los-rios-canaveral",
];

test("la guía solo lista fichas de educación infantil que ya existen, con sus fuentes", () => {
  const guia = guiaEducacionInfantil(root);
  const infantil = negocios.filter(esEducacionInfantil);
  assert.deepEqual(
    guia.items.map((item) => item.fichaSlug).sort(),
    infantil.map((n) => n.slug).sort(),
  );
  assert.ok(guia.items.length >= 8);
  for (const slug of FUERA) {
    assert.equal(esEducacionInfantil(negocios.find((n) => n.slug === slug)), false, slug);
    assert.equal(guia.items.some((item) => item.fichaSlug === slug), false, slug);
  }

  for (const item of guia.items) {
    const ficha = negocios.find((n) => n.slug === item.fichaSlug);
    assert.ok(ficha, item.fichaSlug);
    assert.equal(item.nombre, ficha.name);
    assert.equal(item.fichaCategoria, "educacion");
    assert.ok(item.fuentes.length >= 1, item.fichaSlug);
    for (const fuente of item.fuentes) {
      const esWeb = fuente.url === ficha.website;
      const esPlace = ficha.placeId && fuente.url === `https://maps.google.com/?q=place_id:${encodeURIComponent(ficha.placeId)}`;
      assert.ok(esWeb || esPlace, `${item.fichaSlug} ${fuente.url}`);
    }
    if (typeof ficha.plazas === "number") assert.match(item.resumen, new RegExp(String(ficha.plazas)));
    if (ficha.edades) assert.match(item.resumen, new RegExp(ficha.edades.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("un centro de la calle restringida sale sin dirección, sin mapa y sin esa calle en el texto", () => {
  const guia = guiaEducacionInfantil(root);
  const restringidas = negocios.filter((n) => /enrique\s+urquijo/i.test(n.address || ""));
  const enGuia = restringidas.filter((n) => guia.items.some((item) => item.fichaSlug === n.slug));
  assert.ok(enGuia.length >= 1);
  for (const ficha of enGuia) {
    const item = guia.items.find((entrada) => entrada.fichaSlug === ficha.slug);
    assert.equal(item.direccion, undefined);
    assert.equal(item.fuentes.some((fuente) => /maps\.google/.test(fuente.url)), false);
    assert.equal(/enrique\s+urquijo/i.test(JSON.stringify(item)), false);
  }
  assert.equal(/urquijo/i.test(JSON.stringify(guia)), false);
});

test("la guía se publica en /guias/ y /educacion/ la enlaza", () => {
  const guia = guiaEducacionInfantil(root);
  const slugPage = readFileSync(path.join(root, "src/pages/guias/[slug].astro"), "utf8");
  const indice = readFileSync(path.join(root, "src/pages/guias/index.astro"), "utf8");
  const seo = readFileSync(path.join(root, "src/data/seo-overrides.json"), "utf8");
  assert.match(slugPage, /guiaEducacionInfantil\(/);
  assert.match(indice, /guiaEducacionInfantil\(/);
  assert.match(seo, new RegExp(`/guias/${guia.slug}/`));
  assert.ok(guia.enlaces.some((enlace) => enlace.href === "/educacion/"));
  assert.ok(guia.items.every((item) => item.fuentes.every((fuente) => /^https?:\/\//.test(fuente.url))));
});
