/**
 * CRM de formularios de elcanaveral.info.
 *
 * Pegar en Extensiones → Apps Script de la hoja (proyecto ligado a esa hoja,
 * no un script suelto). No hace falta el ID de la hoja: usa la hoja activa.
 *
 * Acepta el JSON que envía netlify/functions/submission-created.mjs y, por si
 * el webhook de Netlify apunta aquí directamente, el evento submission-created
 * crudo. Columnas, en este orden:
 * Fecha, Formulario, Negocio, Slug ficha, Contacto, Email, Teléfono,
 * Mensaje, Origen/UTM, Estado, Notas.
 */
var HEADERS = [
  "Fecha",
  "Formulario",
  "Negocio",
  "Slug ficha",
  "Contacto",
  "Email",
  "Teléfono",
  "Mensaje",
  "Origen/UTM",
  "Estado",
  "Notas",
];

var RESERVADOS = {
  zona: 1, zonas: 1, blog: 1, actualidad: 1, contacto: 1, alta: 1, anunciate: 1,
  sponsor: 1, planes: 1, gracias: 1, directorio: 1, "aviso-legal": 1, terminos: 1,
  privacidad: 1, cookies: 1, "el-canaveral": 1, vivienda: 1, transporte: 1,
  "espacios-publicos": 1, "servicios-publicos": 1, escapadas: 1, fiestas: 1,
  compras: 1, "comida-a-domicilio": 1, "con-perro": 1, "con-ninos": 1,
  mercadillos: 1, comunidad: 1, "abiertos-los-domingos": 1, "bares-y-tapas": 1,
  "farmacias-de-guardia": 1,
};

var OMITIR_NOTAS = {
  "form-name": 1, "bot-field": 1, ip: 1, user_agent: 1, "acepto-rgpd": 1,
  email: 1, negocio: 1, empresa: 1, contacto: 1, nombre: 1, telefono: 1, tel: 1,
  mensaje: 1, comentarios: 1, descripcion: 1, slug: 1, ficha: 1, "ficha-slug": 1,
  "ficha-url": 1, "ficha-existente": 1, referrer: 1, origen: 1,
};

function doGet() {
  return json({ ok: true, hint: "Este endpoint solo acepta POST." });
}

function doPost(e) {
  try {
    var raw = e && e.postData && e.postData.contents ? e.postData.contents : "{}";
    var body = JSON.parse(raw);
    var row = filaDe(body);
    hojaLeads().appendRow(row);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false });
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function hojaLeads() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error("Abre el script desde la hoja: Extensiones → Apps Script.");
  }
  var sheet = ss.getSheetByName("Leads");
  if (!sheet) sheet = ss.insertSheet("Leads");
  if (sheet.getLastRow() === 0 || !sheet.getRange(1, 1).getValue()) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function texto(value) {
  if (value === null || value === undefined) return "";
  if (Object.prototype.toString.call(value) === "[object Array]") {
    return value.map(texto).filter(Boolean).join(", ");
  }
  return String(value).replace(/\s+/g, " ").trim();
}

function esUtm(clave) {
  return /^utm_/i.test(clave) || clave === "gclid" || clave === "fbclid";
}

function formatearFecha(iso) {
  var fecha = iso ? new Date(iso) : new Date();
  if (isNaN(fecha.getTime())) return "";
  return Utilities.formatDate(fecha, "Europe/Madrid", "yyyy-MM-dd HH:mm");
}

function slugDesdeValor(value) {
  var raw = texto(value);
  if (!raw || raw.indexOf("\\") !== -1 || raw.indexOf("..") !== -1) return "";
  if (raw.indexOf("/") === -1 && raw.indexOf("://") === -1 && raw.indexOf("?") === -1 && raw.indexOf(" ") === -1) {
    return /^[a-z0-9][a-z0-9-]*$/i.test(raw) ? raw.toLowerCase() : "";
  }
  var pathname = raw;
  if (/^https?:\/\//i.test(raw)) {
    try {
      pathname = raw.replace(/^https?:\/\/[^/]+/i, "").split("?")[0];
    } catch (err) {
      return "";
    }
  } else if (raw.charAt(0) === "/") {
    pathname = raw.split("?")[0];
  } else {
    return "";
  }
  var parts = pathname.split("/").filter(function (part) { return part; });
  if (parts.length < 2) return "";
  if (RESERVADOS[parts[0].toLowerCase()]) return "";
  var slug = parts[parts.length - 1];
  return /^[a-z0-9][a-z0-9-]*$/i.test(slug) ? slug.toLowerCase() : "";
}

function slugDe(data) {
  var candidatos = [data.slug, data.ficha, data["ficha-slug"], data["ficha-url"], data["ficha-existente"], data.referrer];
  for (var i = 0; i < candidatos.length; i++) {
    var slug = slugDesdeValor(candidatos[i]);
    if (slug) return slug;
  }
  return "";
}

function origenDe(data) {
  var partes = [];
  var vistos = {};
  function anadir(clave, valor) {
    var limpio = texto(valor);
    if (!limpio) return;
    var token = clave + "=" + limpio;
    if (vistos[token]) return;
    vistos[token] = 1;
    partes.push(token);
  }
  Object.keys(data).forEach(function (clave) {
    if (esUtm(clave) || clave === "origen") anadir(clave, data[clave]);
  });
  var referrer = texto(data.referrer);
  if (referrer) {
    var query = "";
    var path = referrer;
    var q = referrer.indexOf("?");
    if (/^https?:\/\//i.test(referrer)) {
      var sinHost = referrer.replace(/^https?:\/\/[^/]+/i, "");
      q = sinHost.indexOf("?");
      path = q === -1 ? sinHost : sinHost.slice(0, q);
      query = q === -1 ? "" : sinHost.slice(q + 1);
    } else if (q !== -1) {
      path = referrer.slice(0, q);
      query = referrer.slice(q + 1);
    }
    if (query) {
      query.split("&").forEach(function (par) {
        var corte = par.split("=");
        var clave = decodeURIComponent(corte[0] || "");
        if (esUtm(clave)) anadir(clave, decodeURIComponent(corte.slice(1).join("=") || ""));
      });
    }
    if (partes.length === 0) partes.push("referrer=" + (path || "/"));
  }
  return partes.join(", ").slice(0, 500);
}

function notasDe(data) {
  var bits = [];
  Object.keys(data).forEach(function (clave) {
    if (OMITIR_NOTAS[clave] || esUtm(clave)) return;
    var limpio = texto(data[clave]);
    if (!limpio) return;
    bits.push(clave + ": " + limpio);
  });
  return bits.join(" · ").slice(0, 2000);
}

function filaNormalizada(body) {
  return [
    texto(body.fecha),
    texto(body.formulario),
    texto(body.negocio),
    texto(body.slug),
    texto(body.contacto),
    texto(body.email),
    texto(body.telefono),
    texto(body.mensaje),
    texto(body.origen),
    texto(body.estado) || "Nuevo",
    texto(body.notas),
  ];
}

function filaDesdeNetlify(body) {
  var payload = body && body.payload && typeof body.payload === "object" ? body.payload : {};
  var data = payload.data && typeof payload.data === "object" ? payload.data : {};
  if (!data.referrer && payload.referrer) data.referrer = payload.referrer;
  var creado = payload.created_at || body.created_at || new Date().toISOString();
  return [
    formatearFecha(creado),
    texto(data["form-name"] || payload.form_name || body.form_name),
    texto(data.negocio || data.empresa),
    slugDe(data),
    texto(data.contacto || data.nombre),
    texto(data.email || payload.email),
    texto(data.telefono || data.tel),
    texto(data.mensaje || data.comentarios || data.descripcion),
    origenDe(data),
    "Nuevo",
    notasDe(data),
  ];
}

function filaDe(body) {
  if (body && body.payload) return filaDesdeNetlify(body);
  if (body && (body.formulario || body.fecha || body.email || body.mensaje || body.negocio)) {
    var fila = filaNormalizada(body);
    fila[9] = "Nuevo";
    return fila;
  }
  return filaDesdeNetlify(body || {});
}
