import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  ctaPublicable,
  erroresPlanes,
  esPatrocinado,
  esPlanPago,
  fichasPatrocinadas,
  fotosDeFicha,
  ordenarPorPlan,
  planDe,
} from "../src/lib/planes.mjs";
import { validarRaiz } from "./validate-datos.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const negocios = JSON.parse(readFileSync(path.join(root, "src/data/negocios.json"), "utf8"));

function ficha(partial) {
  return {
    slug: partial.slug,
    name: partial.slug,
    category: partial.category || "cafeterias",
    image: "/images/negocios/fixture.webp",
    images: [
      "/images/negocios/fixture-1.webp",
      "/images/negocios/fixture-2.webp",
      "/images/negocios/fixture-3.webp",
      "/images/negocios/fixture-4.webp",
      "/images/negocios/fixture-5.webp",
      "/images/negocios/fixture-6.webp",
    ],
    ...partial,
  };
}

test("sin campo plan la ficha es ninguno y no es de pago ni patrocinada", () => {
  assert.equal(planDe({}), "ninguno");
  assert.equal(planDe(undefined), "ninguno");
  assert.equal(planDe({ plan: "ninguno" }), "ninguno");
  assert.equal(esPlanPago({}), false);
  assert.equal(esPatrocinado({ plan: "presencia" }), false);
  assert.equal(esPatrocinado({ plan: "destacado" }), true);
  assert.equal(esPatrocinado({ plan: "crecimiento" }), true);
  assert.equal(esPatrocinado({ plan: "sponsor" }), true);
  assert.equal(esPlanPago({ plan: "presencia" }), true);
});

test("el orden de listado agrupa por plan y conserva el orden dentro del grupo", () => {
  const lista = [
    ficha({ slug: "a", plan: "ninguno" }),
    ficha({ slug: "b", plan: "presencia" }),
    ficha({ slug: "c" }),
    ficha({ slug: "d", plan: "sponsor" }),
    ficha({ slug: "e", plan: "destacado" }),
    ficha({ slug: "f", plan: "crecimiento" }),
    ficha({ slug: "g", plan: "ninguno" }),
    ficha({ slug: "h", plan: "destacado" }),
  ];
  assert.deepEqual(
    ordenarPorPlan(lista).map((n) => n.slug),
    ["d", "f", "e", "h", "b", "a", "c", "g"],
  );
  assert.equal(lista[0].slug, "a");
});

test("la home solo lista destacado, crecimiento y sponsor, hasta 6 y en ese orden", () => {
  const lista = [
    ficha({ slug: "libre" }),
    ficha({ slug: "presencia", plan: "presencia" }),
    ficha({ slug: "d1", plan: "destacado" }),
    ficha({ slug: "s1", plan: "sponsor" }),
    ficha({ slug: "c1", plan: "crecimiento" }),
    ficha({ slug: "d2", plan: "destacado" }),
    ficha({ slug: "d3", plan: "destacado" }),
    ficha({ slug: "d4", plan: "destacado" }),
    ficha({ slug: "d5", plan: "destacado" }),
    ficha({ slug: "c2", plan: "crecimiento" }),
  ];
  assert.deepEqual(
    fichasPatrocinadas(lista).map((n) => n.slug),
    ["s1", "c1", "c2", "d1", "d2", "d3"],
  );
  assert.deepEqual(fichasPatrocinadas([]), []);
});

test("la galería enseña 1 foto sin plan y hasta 5 en un plan de pago", () => {
  const fotos = [
    "/images/negocios/fixture-1.webp",
    "/images/negocios/fixture-2.webp",
    "/images/negocios/fixture-3.webp",
    "/images/negocios/fixture-4.webp",
    "/images/negocios/fixture-5.webp",
    "/images/negocios/fixture-6.webp",
  ];
  assert.deepEqual(fotosDeFicha({ images: fotos }), [fotos[0]]);
  assert.deepEqual(fotosDeFicha({ plan: "presencia", images: fotos }), fotos.slice(0, 5));
  assert.deepEqual(fotosDeFicha({ plan: "sponsor", images: fotos.slice(0, 2) }), fotos.slice(0, 2));
  assert.deepEqual(fotosDeFicha({ image: fotos[0] }), [fotos[0]]);
  assert.deepEqual(fotosDeFicha({ plan: "destacado" }), []);
});

test("el cta solo se publica en un plan de pago y con url http(s)", () => {
  const cta = { texto: "Pide cita", url: "https://ejemplo.test/cita" };
  assert.deepEqual(ctaPublicable({ plan: "presencia", cta }), cta);
  assert.equal(ctaPublicable({ cta }), null);
  assert.equal(ctaPublicable({ plan: "destacado", cta: { texto: "Hola", url: "javascript:alert(1)" } }), null);
  assert.equal(ctaPublicable({ plan: "crecimiento", cta: { texto: "  ", url: "https://ejemplo.test" } }), null);
});

test("el validador rechaza un plan desconocido, un cta mal formado y 6 destacados en una categoría", () => {
  const base = Array.from({ length: 5 }, (_, i) => ficha({ slug: `ok-${i}`, category: "panaderias", plan: "destacado" }));
  assert.deepEqual(erroresPlanes(base), []);
  const seis = [
    ...Array.from({ length: 6 }, (_, i) => ficha({ slug: `d-${i}`, category: "cafeterias", plan: "destacado" })),
    ficha({ slug: "crece", category: "cafeterias", plan: "crecimiento" }),
    ficha({ slug: "sponsor", category: "cafeterias", plan: "sponsor" }),
  ];
  const tope = erroresPlanes(seis);
  assert.equal(tope.length, 1);
  assert.match(tope[0], /cafeterias/);
  assert.match(tope[0], /6 fichas con plan destacado/);

  const invalido = erroresPlanes([
    ficha({ slug: "raro", plan: "oro" }),
    ficha({ slug: "cta-libre", cta: { texto: "Pide cita", url: "https://ejemplo.test" } }),
    ficha({ slug: "cta-mal", plan: "presencia", cta: { texto: "", url: "no-es-url" } }),
  ]);
  assert.ok(invalido.some((e) => e.includes("raro") && e.includes("plan no válido")));
  assert.ok(invalido.some((e) => e.includes("cta-libre") && e.includes("plan de pago")));
  assert.ok(invalido.some((e) => e.includes("cta-mal") && e.includes("cta.texto")));
  assert.ok(invalido.some((e) => e.includes("cta-mal") && e.includes("cta.url")));
});

test("los negocios reales siguen sin plan de pago y el directorio pasa el validador", () => {
  assert.equal(erroresPlanes(negocios).length, 0);
  assert.equal(fichasPatrocinadas(negocios).length, 0);
  for (const negocio of negocios) {
    assert.ok(negocio.plan == null || negocio.plan === "ninguno");
    assert.equal(negocio.cta, undefined);
    assert.equal(esPlanPago(negocio), false);
    assert.equal(esPatrocinado(negocio), false);
  }
  const categorias = [...new Set(negocios.map((n) => n.category))];
  for (const categoria of categorias) {
    const grupo = negocios.filter((n) => n.category === categoria);
    assert.deepEqual(
      ordenarPorPlan(grupo).map((n) => n.slug),
      grupo.map((n) => n.slug),
    );
  }
  const conFotos = negocios.find((n) => Array.isArray(n.images) && n.images.length > 1);
  assert.ok(conFotos);
  assert.equal(fotosDeFicha(conFotos).length, 1);
  assert.equal(fotosDeFicha({ images: conFotos.images, plan: "presencia" }).length, Math.min(5, conFotos.images.length));
  assert.deepEqual(validarRaiz(root), []);
});
