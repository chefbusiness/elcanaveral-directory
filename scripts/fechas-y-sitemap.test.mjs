import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { fechaIsoValida, fechaLastmodFicha, masReciente, textoDatosRevisados } from "../src/lib/fechas-ficha.mjs";
import { hrefVolverFicha } from "../src/lib/gracias-ficha.mjs";
import {
  createLastmodLookup,
  indexarPaginas,
  normalizarRuta,
  paginaDe,
  parseGitLog,
} from "./sitemap-lastmod.mjs";

test("solo acepta fechas ISO de calendario", () => {
  assert.equal(fechaIsoValida("2026-10-05"), "2026-10-05");
  assert.equal(fechaIsoValida(" 2026-10-05T22:06:24+02:00 "), "2026-10-05");
  assert.equal(fechaIsoValida(""), null);
  assert.equal(fechaIsoValida("ayer"), null);
  assert.equal(fechaIsoValida("2026-02-31"), null);
  assert.equal(fechaIsoValida(undefined), null);
});

test("la ficha usa la fecha propia más reciente y el texto solo si existe", () => {
  assert.equal(fechaLastmodFicha({}), null);
  assert.equal(textoDatosRevisados({}), null);
  assert.equal(textoDatosRevisados({ actualizado: "" }), null);
  assert.equal(fechaLastmodFicha({ verificadoEn: "2024-03-15", actualizado: "2023-01-01" }), "2024-03-15");
  assert.equal(fechaLastmodFicha({ actualizado: "2022-11-09" }), "2022-11-09");
  assert.equal(textoDatosRevisados({ verificadoEn: "2026-10-05" }), "Datos revisados el 5 de octubre de 2026");
  assert.equal(textoDatosRevisados({ actualizado: "2022-11-09" }), "Datos revisados el 9 de noviembre de 2022");
});

test("el lastmod de una ficha no se sustituye por una fecha git más nueva ni por hoy", () => {
  const lookup = createLastmodLookup({
    gitDates: new Map([
      ["src/data/negocios.json", "2020-01-01"],
      ["src/pages/[categoria]/[slug].astro", "2025-01-01"],
      ["src/data/seo-overrides.json", "2025-08-01"],
      ["src/pages/transporte.astro", "2019-03-03"],
    ]),
    negocios: [
      { category: "cafeterias", slug: "con-fecha", verificadoEn: "2024-03-15" },
      { category: "cafeterias", slug: "sin-fecha" },
      { category: "cafeterias", slug: "solo-actualizado", actualizado: "2022-11-09" },
    ],
    overrides: new Set(["con-fecha"]),
  });
  assert.equal(lookup("https://www.elcanaveral.info/cafeterias/con-fecha/"), "2024-03-15");
  assert.equal(lookup("/cafeterias/sin-fecha"), "2025-01-01");
  assert.equal(lookup("/cafeterias/solo-actualizado/"), "2022-11-09");
  assert.equal(lookup("/transporte/"), "2019-03-03");
  assert.equal(masReciente(["2020-01-01", "2025-01-01"]), "2025-01-01");
  assert.notEqual(lookup("/transporte/"), "2026-11-02");
});

test("las rutas estáticas ganan a las dinámicas y el blog no se confunde con una ficha", () => {
  const { exactas, dinamicas } = indexarPaginas([
    "src/pages/blog/[slug].astro",
    "src/pages/[categoria]/[slug].astro",
    "src/pages/zona/[zona]/[categoria].astro",
    "src/pages/transporte.astro",
    "src/pages/llms.txt.ts",
    "src/pages/directorio/index.astro",
  ]);
  assert.equal(paginaDe("/blog/foo/", exactas, dinamicas), "src/pages/blog/[slug].astro");
  assert.equal(paginaDe("/zona/el-canaveral/supermercados/", exactas, dinamicas), "src/pages/zona/[zona]/[categoria].astro");
  assert.equal(paginaDe("/transporte/", exactas, dinamicas), "src/pages/transporte.astro");
  assert.equal(paginaDe("/directorio/", exactas, dinamicas), "src/pages/directorio/index.astro");
  assert.equal(paginaDe("/llms.txt", exactas, dinamicas), "src/pages/llms.txt.ts");
  assert.equal(normalizarRuta("https://www.elcanaveral.info/transporte"), "/transporte/");
});

test("el historial git se queda con el commit más reciente de cada archivo", () => {
  const fechas = parseGitLog(`---2026-11-02T10:00:00+01:00
src/pages/index.astro

---2024-01-01T00:00:00+01:00
src/pages/index.astro
src/pages/transporte.astro
`);
  assert.equal(fechas.get("src/pages/index.astro"), "2026-11-02");
  assert.equal(fechas.get("src/pages/transporte.astro"), "2024-01-01");
});

test("volver a la ficha solo enlaza una ruta conocida", () => {
  const indice = {
    "bunbun-canaveral": "/cafeterias/bunbun-canaveral/",
    "cafeterias/bunbun-canaveral": "/cafeterias/bunbun-canaveral/",
    "centro-veterinario-los-delfines-clinica-veterinaria-en-": "/mascotas/centro-veterinario-los-delfines-clinica-veterinaria-en-/",
  };
  const origen = "https://www.elcanaveral.info";
  assert.equal(
    hrefVolverFicha("?ficha=bunbun-canaveral", "https://www.elcanaveral.info/contacto/", origen, indice),
    "/cafeterias/bunbun-canaveral/",
  );
  assert.equal(
    hrefVolverFicha("?ficha=/cafeterias/bunbun-canaveral/", "", origen, indice),
    "/cafeterias/bunbun-canaveral/",
  );
  assert.equal(
    hrefVolverFicha("", "https://www.elcanaveral.info/cafeterias/bunbun-canaveral/", origen, indice),
    "/cafeterias/bunbun-canaveral/",
  );
  assert.equal(hrefVolverFicha("", "https://www.elcanaveral.info/contacto/", origen, indice), null);
  assert.equal(hrefVolverFicha("", "https://evil.example/cafeterias/bunbun-canaveral/", origen, indice), null);
  assert.equal(hrefVolverFicha("?ficha=https://evil.example/robar", "", origen, indice), null);
  assert.equal(hrefVolverFicha("?ficha=//evil.example", "", origen, indice), null);
  assert.equal(hrefVolverFicha("?ficha=no-existe", "", origen, indice), null);
  assert.equal(
    hrefVolverFicha("?ficha=centro-veterinario-los-delfines-clinica-veterinaria-en-", "", origen, indice),
    "/mascotas/centro-veterinario-los-delfines-clinica-veterinaria-en-/",
  );
});

test("el sitemap real usa la fecha git, no el día del build", () => {
  const dia = (archivo) =>
    execFileSync("git", ["log", "-1", "--format=%cI", "--", archivo], { encoding: "utf8" }).trim().slice(0, 10);
  const lookup = createLastmodLookup();
  assert.equal(lookup("https://www.elcanaveral.info/transporte/"), dia("src/pages/transporte.astro"));
  const ficha = lookup("https://www.elcanaveral.info/supermercados/mercadona-coslada/");
  assert.equal(ficha, masReciente([dia("src/data/negocios.json"), dia("src/pages/[categoria]/[slug].astro")]));
  assert.ok(ficha);
});
