import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  callePublica,
  metaDeFicha,
  omitirCalleRestringida,
  recortarMeta,
  tituloDeFicha,
} from "../src/lib/seo-ficha.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const negocios = JSON.parse(readFileSync(path.join(root, "src/data/negocios.json"), "utf8"));
const overrides = JSON.parse(readFileSync(path.join(root, "src/data/seo-overrides.json"), "utf8")).fichas;

const CONECTOR = /^(?:a|al|con|de|del|e|el|en|la|las|le|lo|los|o|para|por|que|su|sus|un|una|y)$/i;

function tokens(texto) {
  return String(texto)
    .replace(/[.!?…,;:()]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

test("la calle restringida no entra en el title ni en la meta de ninguna ficha", () => {
  for (const negocio of negocios) {
    const seo = overrides[negocio.slug] || {};
    const title = tituloDeFicha(negocio, seo.title);
    const description = metaDeFicha(negocio, seo.description);
    const junto = `${title}\n${description}`;
    assert.doesNotMatch(junto, /urquijo/i, negocio.slug);
    assert.ok(description.length <= 155, `${negocio.slug} meta ${description.length}`);
    assert.equal(description, description.trim(), negocio.slug);
    const palabras = description.split(/\s+/).filter(Boolean);
    const ultima = (palabras[palabras.length - 1] || "").replace(/[.!?…,;:]+$/u, "");
    assert.equal(CONECTOR.test(ultima), false, `${negocio.slug} acaba en «${ultima}»`);
    if (!seo.description) {
      const limpia = omitirCalleRestringida(negocio.description || "");
      const metaTokens = tokens(description);
      const fuenteTokens = tokens(limpia);
      assert.deepEqual(fuenteTokens.slice(0, metaTokens.length), metaTokens, negocio.slug);
    }
  }
});

test("sin override el title usa categoría, barrio y calle pública", () => {
  const negocio = negocios.find((n) => n.slug === "megafruta-canaveral");
  const title = tituloDeFicha(negocio);
  assert.match(title, /^Megafruta/);
  assert.match(title, /—/);
  assert.ok(title.includes(negocio.categoryName));
  assert.ok(title.includes(negocio.zonaName));
  const calle = callePublica(negocio.address);
  assert.ok(calle.length > 0);
  assert.ok(title.includes(calle));
  assert.equal(title.includes("— El Cañaveral") && !title.includes(negocio.categoryName), false);
});

test("el patrón por defecto ya no es solo nombre y zona", () => {
  const sinOverride = negocios.filter((n) => !overrides[n.slug]?.title);
  assert.ok(sinOverride.length > 250);
  for (const negocio of sinOverride) {
    const title = tituloDeFicha(negocio);
    assert.ok(title.includes(negocio.categoryName), negocio.slug);
    assert.ok(title.includes(negocio.zonaName), negocio.slug);
    assert.notEqual(title, `${negocio.name} — ${negocio.zonaName}`);
    if (negocio.address && !/urquijo/i.test(negocio.address)) {
      const calle = callePublica(negocio.address);
      if (calle) assert.ok(title.includes(calle), `${negocio.slug}: ${calle}`);
    }
  }
});

test("un override útil se conserva y uno con la calle restringida no", () => {
  const estanco = negocios.find((n) => n.slug === "estanco-el-canaveral");
  assert.equal(tituloDeFicha(estanco, overrides[estanco.slug].title), overrides[estanco.slug].title);

  const mediadores = negocios.find((n) => n.slug === "mediadores-inmobiliarios-canaveral");
  const title = tituloDeFicha(mediadores, "Mediadores — oficina en Calle Enrique Urquijo 134");
  assert.doesNotMatch(title, /urquijo/i);
  assert.ok(title.includes(mediadores.categoryName));
  assert.ok(title.includes(mediadores.zonaName));
  assert.equal(callePublica(mediadores.address), "");
});

test("la meta de Mediadores pierde la dirección y se corta por frase", () => {
  const mediadores = negocios.find((n) => n.slug === "mediadores-inmobiliarios-canaveral");
  const meta = metaDeFicha(mediadores);
  assert.doesNotMatch(meta, /urquijo/i);
  assert.match(meta, /compraventa/);
  assert.ok(meta.endsWith("."));
  assert.ok(meta.length <= 155);
});

test("un corte a media frase no deja la palabra a medias ni un conector con punto", () => {
  const cortada = "Su compromiso es ofrecer producto fresco de temporada y.";
  const meta = recortarMeta(cortada, 155);
  assert.equal(meta, "Su compromiso es ofrecer producto fresco de temporada");
  assert.equal(meta.endsWith(" y"), false);

  const pegada = "Megafruta es una frutería con surtido amplio. Su compromiso es ofrecer producto.";
  assert.equal(recortarMeta(pegada, 155), "Megafruta es una frutería con surtido amplio.");

  const larga = `${"Frase completa del negocio, con horario de mañana. ".repeat(4)}Y sigue por`;
  const recorte = recortarMeta(larga, 80);
  assert.ok(recorte.length <= 80);
  assert.ok(recorte.endsWith("."));
  assert.equal(tokens(larga.replace(/\s+/g, " ")).slice(0, tokens(recorte).length).join(" "), tokens(recorte).join(" "));
});
