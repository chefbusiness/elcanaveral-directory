// Fechas, caducidad y calendario de aperturas y agenda.
// La hora de un evento con sinHora no se enseña: el ISO con zona solo fija el día en Madrid.
import { fechaIsoValida } from "./fechas-ficha.mjs";

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const RE_INSTANTE = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(Z|[+-]\d{2}:\d{2})$/;

export function hoyMadrid(ahora = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ahora);
}

/** YYYY-MM-DD, o null. Acepta un día suelto o un instante ISO. */
export function diaDe(value) {
  return fechaIsoValida(value);
}

/** Instante con zona (Z o ±HH:MM) y calendario real, o null. */
export function instanteConZona(value) {
  if (typeof value !== "string") return null;
  const m = RE_INSTANTE.exec(value.trim());
  if (!m || !fechaIsoValida(m[1])) return null;
  const hh = Number(m[2]);
  const mm = Number(m[3]);
  const ss = Number(m[4]);
  if (hh > 23 || mm > 59 || ss > 59) return null;
  return value.trim();
}

export function diasEntre(desde, hasta) {
  const a = fechaIsoValida(desde);
  const b = fechaIsoValida(hasta);
  if (!a || !b) return null;
  const [y1, m1, d1] = a.split("-").map(Number);
  const [y2, m2, d2] = b.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}

export function sumarDias(iso, dias) {
  const dia = fechaIsoValida(iso);
  if (!dia) return null;
  const [y, m, d] = dia.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + dias);
  return dt.toISOString().slice(0, 10);
}

export function textoFechaLarga(value) {
  const dia = fechaIsoValida(value);
  if (!dia) return null;
  const [y, m, d] = dia.split("-").map(Number);
  const mes = MESES[m - 1];
  if (!mes) return null;
  return `${d} de ${mes} de ${y}`;
}

/** Más de 90 días desde verificadoEn. El día 90 todavía no. */
export function porReverificar(verificadoEn, hoy = hoyMadrid()) {
  const n = diasEntre(verificadoEn, hoy);
  return n != null && n > 90;
}

/** Abierta, con fecha confirmada, en los últimos 90 días (inclusive). */
export function esAbiertaReciente(item, hoy = hoyMadrid()) {
  if (!item || item.estado !== "abierto") return false;
  const fecha = fechaIsoValida(item.fechaApertura);
  if (!fecha) return false;
  const n = diasEntre(fecha, hoy);
  return n != null && n >= 0 && n <= 90;
}

export function esProximamente(item) {
  return item?.estado === "anunciado" || item?.estado === "obras";
}

function inicioSemana(dia) {
  const [y, m, d] = dia.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  const dow = utc.getUTCDay();
  const delta = dow === 0 ? 6 : dow - 1;
  utc.setUTCDate(utc.getUTCDate() - delta);
  return utc.toISOString().slice(0, 10);
}

function finDeMes(dia) {
  const [y, m] = dia.split("-").map(Number);
  const ultimo = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${dia.slice(0, 7)}-${String(ultimo).padStart(2, "0")}`;
}

function porInicio(a, b) {
  return (fechaIsoValida(a.inicio) || "").localeCompare(fechaIsoValida(b.inicio) || "");
}

/**
 * Parte la agenda en vistas. Un evento cuyo último día ya pasó no entra en
 * semana, mes ni próximos: va al archivo.
 */
export function clasificarAgenda(eventos, hoy = hoyMadrid()) {
  const dia = fechaIsoValida(hoy) || hoyMadrid();
  const lunes = inicioSemana(dia);
  const domingo = sumarDias(lunes, 6);
  const mesInicio = `${dia.slice(0, 7)}-01`;
  const mesFin = finDeMes(dia);
  const semana = [];
  const mes = [];
  const proximos = [];
  const archivo = [];
  for (const ev of eventos || []) {
    const ini = fechaIsoValida(ev?.inicio);
    const fin = fechaIsoValida(ev?.fin) || ini;
    if (!ini || !fin) continue;
    if (fin < dia) {
      archivo.push(ev);
      continue;
    }
    const enSemana = ini <= domingo && fin >= lunes;
    const enMes = ini <= mesFin && fin >= mesInicio;
    if (enSemana) semana.push(ev);
    else if (enMes) mes.push(ev);
    else proximos.push(ev);
  }
  semana.sort(porInicio);
  mes.sort(porInicio);
  proximos.sort(porInicio);
  archivo.sort((a, b) => porInicio(b, a));
  return { hoy: dia, lunes, domingo, mesInicio, mesFin, semana, mes, proximos, archivo };
}

export function admiteSchemaEvento(ev) {
  if (!fechaIsoValida(ev?.inicio)) return false;
  const nombre = ev?.lugar?.nombre;
  if (typeof nombre !== "string" || !nombre.trim()) return false;
  if (!Array.isArray(ev.fuentes) || ev.fuentes.length === 0) return false;
  return ev.fuentes.some((f) => typeof f?.url === "string" && /^https?:\/\//i.test(f.url.trim()));
}

export function fechaSchema(iso, sinHora) {
  const dia = fechaIsoValida(iso);
  if (!dia) return null;
  if (sinHora) return dia;
  return typeof iso === "string" ? iso.trim() : dia;
}

export function textoIntervalo(inicio, fin, sinHora) {
  const a = fechaIsoValida(inicio);
  const b = fechaIsoValida(fin) || a;
  if (!a || !b) return null;
  if (sinHora) {
    if (a === b) return textoFechaLarga(a);
    return `Del ${textoFechaLarga(a)} al ${textoFechaLarga(b)}`;
  }
  const ha = horaDe(inicio);
  const hb = horaDe(fin);
  if (a === b) return `${textoFechaLarga(a)}${ha ? `, ${ha}` : ""}${hb && hb !== ha ? `–${hb}` : ""}`;
  return `Del ${textoFechaLarga(a)}${ha ? ` ${ha}` : ""} al ${textoFechaLarga(b)}${hb ? ` ${hb}` : ""}`;
}

function horaDe(iso) {
  if (typeof iso !== "string") return null;
  const m = /T(\d{2}):(\d{2})/.exec(iso);
  if (!m) return null;
  return `${m[1]}:${m[2]}`;
}

function escaparIcs(valor) {
  return String(valor ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\n|\r/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function doblar(linea) {
  const bytes = Buffer.from(linea, "utf8");
  if (bytes.length <= 73) return linea;
  const partes = [];
  let actual = "";
  let cuenta = 0;
  for (const ch of linea) {
    const n = Buffer.byteLength(ch, "utf8");
    if (cuenta + n > 73) {
      partes.push(actual);
      actual = ch;
      cuenta = 1 + n;
    } else {
      actual += ch;
      cuenta += n;
    }
  }
  if (actual) partes.push(actual);
  return partes.join("\r\n ");
}

function estadoIcs(estado) {
  if (estado === "confirmado") return "CONFIRMED";
  if (estado === "anunciado" || estado === "aplazado") return "TENTATIVE";
  if (estado === "cancelado") return "CANCELLED";
  throw new Error(`Estado de agenda sin mapeo ICS: ${estado}`);
}

function sello(verificadoEn) {
  const dia = fechaIsoValida(verificadoEn);
  if (!dia) return null;
  return `${dia.replace(/-/g, "")}T120000Z`;
}

/** Texto .ics de un evento. El día entero usa VALUE=DATE; DTEND es exclusivo. */
export function textoIcs(ev, urlPagina) {
  const ini = fechaIsoValida(ev.inicio);
  const fin = fechaIsoValida(ev.fin) || ini;
  if (!ini || !fin) throw new Error(`El evento ${ev?.id || ""} no tiene inicio para el calendario`);
  const lineas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//elcanaveral.info//agenda//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escaparIcs(ev.id)}@elcanaveral.info`,
    `DTSTAMP:${sello(ev.verificadoEn) || sello(ini)}`,
    `SUMMARY:${escaparIcs(ev.nombre)}`,
    `STATUS:${estadoIcs(ev.estado)}`,
  ];
  if (ev.sinHora) {
    lineas.push(`DTSTART;VALUE=DATE:${ini.replace(/-/g, "")}`);
    lineas.push(`DTEND;VALUE=DATE:${sumarDias(fin, 1).replace(/-/g, "")}`);
  } else {
    const start = new Date(ev.inicio);
    const end = new Date(ev.fin);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new Error(`Hora no interpretable en ${ev.id}`);
    }
    const basico = (dt) => dt.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    lineas.push(`DTSTART:${basico(start)}`);
    lineas.push(`DTEND:${basico(end)}`);
  }
  const lugar = [ev.lugar?.nombre, ev.lugar?.direccion].filter(Boolean).join(", ");
  if (lugar) lineas.push(`LOCATION:${escaparIcs(lugar)}`);
  const descripcion = [ev.resumen, ...(ev.fuentes || []).map((f) => `${f.nombre}: ${f.url}`)]
    .filter(Boolean)
    .join("\n");
  if (descripcion) lineas.push(`DESCRIPTION:${escaparIcs(descripcion)}`);
  if (urlPagina) lineas.push(`URL:${escaparIcs(urlPagina)}`);
  lineas.push("END:VEVENT", "END:VCALENDAR");
  return `${lineas.map(doblar).join("\r\n")}\r\n`;
}
