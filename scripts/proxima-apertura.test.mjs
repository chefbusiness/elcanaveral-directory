import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const negocios = JSON.parse(readFileSync(path.join(root, "src/data/negocios.json"), "utf8"));

test("una ficha en próxima apertura no publica horario", () => {
  for (const n of negocios.filter((n) => n.estado === "proxima-apertura")) {
    assert.equal(n.horario, undefined, `${n.slug}: no puede tener horario`);
    assert.equal(n.horarioSemanal, undefined, `${n.slug}: no puede tener horarioSemanal`);
  }
});

test("aperturaPrevista solo acompaña al estado proxima-apertura", () => {
  for (const n of negocios.filter((n) => n.aperturaPrevista !== undefined)) {
    assert.equal(n.estado, "proxima-apertura", `${n.slug}: aperturaPrevista sin estado proxima-apertura`);
    assert.equal(typeof n.aperturaPrevista, "string");
    assert.ok(n.aperturaPrevista.trim(), `${n.slug}: aperturaPrevista vacía`);
  }
});

test("Obramat El Cañaveral es una próxima apertura sin datos de tienda abierta", () => {
  const obramat = negocios.find((n) => n.slug === "obramat-canaveral");
  assert.ok(obramat, "falta la ficha obramat-canaveral");
  assert.equal(obramat.estado, "proxima-apertura");
  assert.equal(obramat.aperturaPrevista, "finales de 2027");
  assert.equal(obramat.featured, false);
  assert.equal(obramat.address, "Omo Cañaveral Retail Park, El Cañaveral (en obras)");
  for (const campo of ["horario", "horarioSemanal", "phone", "placeId", "lat", "lng", "image", "images", "servicios", "precioRango"]) {
    assert.equal(obramat[campo], undefined, `obramat-canaveral no puede tener ${campo}`);
  }
  const texto = JSON.stringify(obramat);
  assert.doesNotMatch(texto, /Miguel Delibes/i);
  assert.doesNotMatch(texto, /\bgratis\b/i);
  assert.doesNotMatch(texto, /€/);
  const urls = (obramat.fuentes || []).map((f) => f.url);
  assert.ok(urls.some((u) => u.startsWith("https://www.alimarket.es/")), "falta la fuente de Alimarket");
  assert.ok(urls.some((u) => u.startsWith("https://canaldis.com/mediahubs/obramat/")), "falta la nota de prensa de Obramat");
  assert.ok(urls.some((u) => u.startsWith("https://omoretail.es/")), "falta la ficha del parque en Omo Retail");
});
