import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  contieneMarcador,
  crearResolutorCifras,
  formatearHorario,
  formatearNota,
  formatearResenas,
  resolverEnProfundidad,
} from "../src/lib/cifras-datos.mjs";
import { metaDeFicha } from "../src/lib/seo-ficha.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const negocios = JSON.parse(readFileSync(path.join(root, "src/data/negocios.json"), "utf8"));
const abiertos = negocios.filter((n) => n.estado !== "cerrado");
const seo = JSON.parse(readFileSync(path.join(root, "src/data/seo-overrides.json"), "utf8"));
const resolver = crearResolutorCifras(abiertos);
const porSlug = new Map(abiertos.map((n) => [n.slug, n]));

const sinMarcadores = (texto) => texto.replace(/\{\{[^}]*\}\}/g, "");
// «4,4 de 5», «(4,8 con 836)», «128 reseñas», «más de 1.100», «8:00-14:00».
const CIFRA_A_MANO = /\b\d(?:,\d)? de 5\b|\b\d(?:,\d)? con (?:más de |casi )?\d|\b\d[\d.]* (?:reseñas|opiniones)\b|más de \d|casi \d|\b\d{1,2}:\d{2}\b/;

test("formatos de nota, reseñas y horario", () => {
  assert.equal(formatearNota(4.4), "4,4");
  assert.equal(formatearNota(5), "5");
  assert.equal(formatearNota(undefined), "");
  assert.equal(formatearResenas(129), "129");
  assert.equal(formatearResenas(3625), "3.625");
  assert.equal(formatearResenas(1234567), "1.234.567");
  assert.equal(formatearResenas(null), "");
  assert.equal(
    formatearHorario("L-V 08:30-19:30, S 08:30-14:30, D 09:00-14:30"),
    "L-V 8:30-19:30, S 8:30-14:30, D 9:00-14:30",
  );
  assert.equal(formatearHorario("V-S 12:30-01:00, D Cerrado"), "V-S 12:30-1:00, D Cerrado");
});

test("el resolutor rellena desde la ficha y rompe ante un dato que no existe", () => {
  const r = crearResolutorCifras([
    { slug: "uno", rating: 4.4, numReviews: 1290, horario: "L-V 08:00-14:00" },
    { slug: "sin-datos" },
  ]);
  assert.equal(r("{{nota:uno}} de 5 con {{reseñas:uno}} reseñas. {{horario:uno}}"), "4,4 de 5 con 1.290 reseñas. L-V 8:00-14:00");
  assert.throws(() => r("{{nota:otro}}"), /otro/);
  assert.throws(() => r("{{reseñas:sin-datos}}"), /sin-datos/);
  assert.throws(() => r("{{telefono:uno}}"), /Marcador desconocido/);
  assert.equal(r("sin marcadores"), "sin marcadores");
});

test("un marcador hacia una ficha cerrada rompe el build", () => {
  const cerrada = negocios.find((n) => n.estado === "cerrado");
  assert.ok(cerrada);
  assert.throws(() => resolver(`{{nota:${cerrada.slug}}}`), new RegExp(cerrada.slug));
});

test("todos los marcadores de seo-overrides.json se resuelven", () => {
  const resuelto = resolverEnProfundidad(seo, resolver);
  assert.equal(contieneMarcador(JSON.stringify(resuelto)), false);
});

test("las metas de ficha no llevan nota, reseñas ni horario escritos a mano", () => {
  for (const [slug, ficha] of Object.entries(seo.fichas)) {
    for (const campo of ["title", "description"]) {
      const texto = sinMarcadores(ficha[campo] || "");
      assert.doesNotMatch(texto, CIFRA_A_MANO, `${slug}.${campo}`);
    }
  }
});

test("los textos de /restaurantes/ no llevan nota ni reseñas escritas a mano", () => {
  const r = seo.categorias.restaurantes;
  const textos = [r.title, r.description, ...(r.intro || []), ...(r.faq || []).flatMap((f) => [f.q, f.a])];
  for (const texto of textos) assert.doesNotMatch(sinMarcadores(texto), CIFRA_A_MANO, texto.slice(0, 80));
});

test("la meta de Panadería Bulevar publica nota, reseñas y horario de la ficha", () => {
  const ficha = porSlug.get("panaderia-bulevar");
  const meta = metaDeFicha(ficha, resolver(seo.fichas["panaderia-bulevar"].description));
  assert.ok(meta.includes(`${formatearNota(ficha.rating)} de 5 con ${formatearResenas(ficha.numReviews)} reseñas`), meta);
  assert.ok(meta.includes(formatearHorario(ficha.horario)), meta);
  assert.doesNotMatch(meta, /urquijo/i);
});

test("/bares-y-tapas/ no escribe a mano las reseñas de sus FAQ", () => {
  const fuente = readFileSync(path.join(root, "src/pages/bares-y-tapas.astro"), "utf8");
  const faq = fuente.slice(fuente.indexOf("const faq = ["), fuente.indexOf("const faqSchema"));
  assert.doesNotMatch(sinMarcadores(faq), /\b\d(?:,\d)? con (?:más de |casi )?\d|más de \d[\d.]*\)|casi \d/);
});
