import assert from "node:assert/strict";
import test from "node:test";
import {
  admiteSchemaEvento,
  clasificarAgenda,
  esAbiertaReciente,
  instanteConZona,
  porReverificar,
  textoIcs,
} from "../src/lib/novedades.mjs";
import { erroresAgenda, erroresAperturas, indiceDesde } from "./validate-datos.mjs";

const indice = indiceDesde({
  negocios: [{ category: "cafeterias", slug: "bunbun-canaveral" }],
  categorias: [{ slug: "cafeterias" }],
  zonas: [{ slug: "el-canaveral" }],
  fiestas: [],
});

const aperturaOk = {
  id: "bunbun-canaveral",
  nombre: "BunBun",
  estado: "anunciado",
  categoria: "cafeterias",
  zona: "el-canaveral",
  direccion: "Av. de Miguel Delibes",
  fichaSlug: "bunbun-canaveral",
  fechaPrevista: null,
  fechaApertura: null,
  resumen: "Anunciado, sin fecha.",
  fuentes: [{ nombre: "@hug0nES en X", url: "https://x.com/hug0nES", tipo: "red-social" }],
  verificadoEn: "2026-08-21",
};

test("una ficha sin fuente o sin verificadoEn rompe la validación", () => {
  const sinFuente = erroresAperturas(
    { lastReview: "2026-08-21", items: [{ ...aperturaOk, fuentes: [] }] },
    indice,
  );
  assert.ok(sinFuente.some((e) => e.includes("sin fuentes")));
  const sinFecha = erroresAperturas(
    { lastReview: "2026-08-21", items: [{ ...aperturaOk, verificadoEn: "" }] },
    indice,
  );
  assert.ok(sinFecha.some((e) => e.includes("verificadoEn")));
  assert.deepEqual(erroresAperturas({ lastReview: "2026-08-21", items: [] }, indice), []);
});

test("la agenda vacía pasa y un evento sin fuente no", () => {
  assert.deepEqual(erroresAgenda({ items: [] }, indice), []);
  const errores = erroresAgenda(
    {
      items: [
        {
          id: "tapaveral-2026",
          nombre: "Tapaveral",
          estado: "confirmado",
          inicio: "2026-10-02T00:00:00+02:00",
          fin: "2026-10-04T00:00:00+02:00",
          sinHora: true,
          lugar: { nombre: "El Cañaveral", direccion: "El Cañaveral", zona: "el-canaveral" },
          organizador: { nombre: "ViBe", url: "https://vibecanaveral.es/" },
          gratis: false,
          precio: null,
          entradasUrl: null,
          categoria: "gastronomia",
          resumen: "Se celebró.",
          fichasRelacionadas: [],
          fiestaSlug: null,
          fuentes: [],
          verificadoEn: "2026-09-23",
        },
      ],
    },
    indice,
  );
  assert.ok(errores.some((e) => e.includes("sin fuentes")));
  assert.equal(instanteConZona("2026-10-02"), null);
  assert.equal(instanteConZona("2026-10-02T00:00:00+02:00"), "2026-10-02T00:00:00+02:00");
});

test("reverificar a los 90 días y abiertas recientes", () => {
  assert.equal(porReverificar("2026-08-21", "2026-11-19"), false);
  assert.equal(porReverificar("2026-08-21", "2026-11-20"), true);
  assert.equal(esAbiertaReciente({ estado: "abierto", fechaApertura: "2026-08-21" }, "2026-11-02"), true);
  assert.equal(esAbiertaReciente({ estado: "abierto", fechaApertura: "2026-07-01" }, "2026-11-02"), false);
  assert.equal(esAbiertaReciente({ estado: "anunciado", fechaApertura: null }, "2026-11-02"), false);
});

test("los pasados van al archivo y no a la semana", () => {
  const vistas = clasificarAgenda(
    [
      { id: "pasado", inicio: "2026-10-02T00:00:00+02:00", fin: "2026-10-04T00:00:00+02:00" },
      { id: "semana", inicio: "2026-11-03T18:00:00+01:00", fin: "2026-11-03T20:00:00+01:00" },
      { id: "mes", inicio: "2026-11-20T18:00:00+01:00", fin: "2026-11-20T20:00:00+01:00" },
      { id: "luego", inicio: "2026-12-01T18:00:00+01:00", fin: "2026-12-01T20:00:00+01:00" },
    ],
    "2026-11-02",
  );
  assert.deepEqual(vistas.archivo.map((e) => e.id), ["pasado"]);
  assert.deepEqual(vistas.semana.map((e) => e.id), ["semana"]);
  assert.deepEqual(vistas.mes.map((e) => e.id), ["mes"]);
  assert.deepEqual(vistas.proximos.map((e) => e.id), ["luego"]);
});

test("el ics de un día entero no publica la medianoche y el schema exige fuente", () => {
  const ics = textoIcs(
    {
      id: "tapaveral-2026",
      nombre: "Tapaveral",
      estado: "confirmado",
      inicio: "2026-10-02T00:00:00+02:00",
      fin: "2026-10-04T00:00:00+02:00",
      sinHora: true,
      verificadoEn: "2026-09-23",
      resumen: "Se celebró del 2 al 4 de octubre.",
      lugar: { nombre: "El Cañaveral", direccion: "El Cañaveral, Madrid" },
      fuentes: [{ nombre: "ViBe", url: "https://vibecanaveral.es/eventos/tapa" }],
    },
    "https://www.elcanaveral.info/agenda/tapaveral-2026/",
  );
  assert.match(ics, /DTSTART;VALUE=DATE:20261002/);
  assert.match(ics, /DTEND;VALUE=DATE:20261005/);
  assert.doesNotMatch(ics, /T000000/);
  assert.equal(admiteSchemaEvento({ inicio: "2026-10-02", lugar: { nombre: "X" }, fuentes: [] }), false);
  assert.equal(
    admiteSchemaEvento({
      inicio: "2026-10-02",
      lugar: { nombre: "X" },
      fuentes: [{ url: "https://vibecanaveral.es/" }],
    }),
    true,
  );
});
