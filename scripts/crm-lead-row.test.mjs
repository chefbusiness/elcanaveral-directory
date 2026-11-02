import assert from "node:assert/strict";
import test from "node:test";
import { filaDesdeEventoNetlify, formatearFecha, webhookActivo } from "../netlify/functions/submission-created/lead-row.mjs";
import { enviarAlWebhook, handler } from "../netlify/functions/submission-created/index.mjs";

test("formatea la hora de Madrid y solo activa un webhook https", () => {
  assert.equal(formatearFecha("2026-11-02T11:37:00.000Z"), "2026-11-02 12:37");
  assert.equal(formatearFecha("2026-08-01T11:37:00.000Z"), "2026-08-01 13:37");
  assert.equal(webhookActivo(""), false);
  assert.equal(webhookActivo("   "), false);
  assert.equal(webhookActivo("http://script.google.com/macros/s/x/exec"), false);
  assert.equal(webhookActivo("https://script.google.com/macros/s/x/exec"), true);
});

test("contacto: slug, utm y sin ip en las notas", () => {
  const fila = filaDesdeEventoNetlify({
    payload: {
      form_name: "contacto",
      created_at: "2026-11-02T11:37:00.000Z",
      email: "ana@example.com",
      data: {
        "form-name": "contacto",
        nombre: "Ana",
        email: "ana@example.com",
        mensaje: "Hola",
        "ficha-url": "https://www.elcanaveral.info/cafeterias/bunbun-canaveral/",
        utm_source: "instagram",
        utm_medium: "bio",
        ip: "1.2.3.4",
        "bot-field": "no",
        "acepto-rgpd": "on",
        motivo: "Error en una ficha",
      },
    },
  });
  assert.deepEqual(fila, {
    fecha: "2026-11-02 12:37",
    formulario: "contacto",
    negocio: "",
    slug: "bunbun-canaveral",
    contacto: "Ana",
    email: "ana@example.com",
    telefono: "",
    mensaje: "Hola",
    origen: "utm_source=instagram, utm_medium=bio",
    estado: "Nuevo",
    notas: "motivo: Error en una ficha",
  });
  assert.equal(JSON.stringify(fila).includes("1.2.3.4"), false);
});

test("alta, sponsor y anunciate rellenan negocio, notas y slug si existen", () => {
  const alta = filaDesdeEventoNetlify({
    payload: {
      created_at: "2026-11-02T11:37:00.000Z",
      data: {
        "form-name": "alta-negocio",
        negocio: "Panadería",
        direccion: "Calle Falsa 1",
        categoria: "Panaderías",
        descripcion: "Pan",
        email: "p@p.es",
        ip: "9.9.9.9",
      },
    },
  });
  assert.equal(alta.negocio, "Panadería");
  assert.equal(alta.mensaje, "Pan");
  assert.equal(alta.slug, "");
  assert.match(alta.notas, /direccion: Calle Falsa 1/);
  assert.match(alta.notas, /categoria: Panaderías/);
  assert.equal(alta.notas.includes("9.9.9.9"), false);

  const sponsor = filaDesdeEventoNetlify({
    payload: {
      created_at: "2026-11-02T11:37:00.000Z",
      data: { "form-name": "sponsor", empresa: "SM Homes", contacto: "Luis", email: "l@l.es" },
    },
  });
  assert.equal(sponsor.negocio, "SM Homes");
  assert.equal(sponsor.contacto, "Luis");

  const anuncio = filaDesdeEventoNetlify({
    payload: {
      created_at: "2026-11-02T11:37:00.000Z",
      data: {
        "form-name": "anunciate",
        negocio: "Galerna",
        "ficha-existente": "https://www.elcanaveral.info/bares/cerveceria-la-galerna/?utm_source=ficha",
        comentarios: "Quiero destacado",
      },
    },
  });
  assert.equal(anuncio.slug, "cerveceria-la-galerna");
  assert.equal(anuncio.mensaje, "Quiero destacado");
  assert.equal(anuncio.estado, "Nuevo");
});

test("el referrer aporta utm o slug y el estado no se puede forzar", () => {
  const conUtm = filaDesdeEventoNetlify({
    payload: {
      created_at: "2026-11-02T11:37:00.000Z",
      data: { referrer: "https://www.elcanaveral.info/contacto/?utm_source=newsletter&utm_campaign=nov" },
    },
  });
  assert.equal(conUtm.origen, "utm_source=newsletter, utm_campaign=nov");
  assert.equal(conUtm.slug, "");

  const desdeFicha = filaDesdeEventoNetlify({
    payload: {
      created_at: "2026-11-02T11:37:00.000Z",
      data: { referrer: "https://www.elcanaveral.info/restaurantes/la-mesa/", estado: "Cerrado" },
    },
  });
  assert.equal(desdeFicha.slug, "la-mesa");
  assert.equal(desdeFicha.origen, "referrer=/restaurantes/la-mesa/");
  assert.equal(desdeFicha.estado, "Nuevo");

  const normalizada = filaDesdeEventoNetlify({ formulario: "contacto", estado: "Cerrado", email: "a@b.es" });
  assert.equal(normalizada.estado, "Nuevo");
  assert.equal(normalizada.email, "a@b.es");
});

test("sin SHEETS_WEBHOOK_URL la función no llama a la red", async () => {
  const anterior = process.env.SHEETS_WEBHOOK_URL;
  process.env.SHEETS_WEBHOOK_URL = "  ";
  const original = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("no debería llamar");
  };
  try {
    const respuesta = await handler({ body: JSON.stringify({ payload: { data: { email: "a@b.es" } } }) });
    assert.equal(respuesta.statusCode, 200);
    assert.match(respuesta.body, /skipped/);
    process.env.SHEETS_WEBHOOK_URL = "https://script.google.com/macros/s/abc/exec";
    const invalido = await handler({ body: "{", isBase64Encoded: false });
    assert.equal(invalido.statusCode, 400);
  } finally {
    process.env.SHEETS_WEBHOOK_URL = anterior;
    globalThis.fetch = original;
  }
});

test("reenvía el POST si Apps Script responde con una redirección https", async () => {
  const llamadas = [];
  const fetchImpl = async (url, init) => {
    llamadas.push({ url, init });
    if (llamadas.length === 1) {
      return { status: 302, headers: { get: (nombre) => (nombre === "location" ? "https://script.googleusercontent.com/exec" : null) } };
    }
    return { status: 200, headers: { get: () => null } };
  };
  const respuesta = await enviarAlWebhook("https://script.google.com/macros/s/abc/exec", { formulario: "contacto" }, fetchImpl);
  assert.equal(respuesta.status, 200);
  assert.equal(llamadas.length, 2);
  assert.equal(llamadas[1].url, "https://script.googleusercontent.com/exec");
  assert.equal(llamadas[1].init.method, "POST");
  assert.match(llamadas[1].init.body, /contacto/);

  const http = [];
  const respuestaHttp = await enviarAlWebhook(
    "https://script.google.com/macros/s/abc/exec",
    { formulario: "contacto" },
    async () => {
      http.push(1);
      return { status: 302, headers: { get: () => "http://inseguro.example/exec" } };
    },
  );
  assert.equal(respuestaHttp.status, 302);
  assert.equal(http.length, 1);
});
