// Convierte un evento submission-created de Netlify en la fila del CRM.
// La hoja no se toca aquí: solo se prepara el JSON que recibe el Apps Script.

const RESERVADOS = new Set([
  "zona",
  "zonas",
  "blog",
  "actualidad",
  "contacto",
  "alta",
  "anunciate",
  "sponsor",
  "planes",
  "gracias",
  "directorio",
  "aviso-legal",
  "terminos",
  "privacidad",
  "cookies",
  "el-canaveral",
  "vivienda",
  "transporte",
  "espacios-publicos",
  "servicios-publicos",
  "escapadas",
  "fiestas",
  "compras",
  "comida-a-domicilio",
  "con-perro",
  "con-ninos",
  "mercadillos",
  "comunidad",
  "abiertos-los-domingos",
  "bares-y-tapas",
  "farmacias-de-guardia",
]);

const OMITIR_NOTAS = new Set([
  "form-name",
  "bot-field",
  "ip",
  "user_agent",
  "acepto-rgpd",
  "email",
  "negocio",
  "empresa",
  "contacto",
  "nombre",
  "telefono",
  "tel",
  "mensaje",
  "comentarios",
  "descripcion",
  "slug",
  "ficha",
  "ficha-slug",
  "ficha-url",
  "ficha-existente",
  "referrer",
  "origen",
]);

const SLUG = /^[a-z0-9][a-z0-9-]*$/i;

export function texto(value) {
  if (value == null) return "";
  if (Array.isArray(value)) return value.map(texto).filter(Boolean).join(", ");
  return String(value).replace(/\s+/g, " ").trim();
}

export function webhookActivo(url) {
  return (url || "").trim().startsWith("https://");
}

export function formatearFecha(iso) {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(fecha);
  const leer = (tipo) => parts.find((part) => part.type === tipo)?.value || "";
  const hora = leer("hour") === "24" ? "00" : leer("hour");
  return `${leer("year")}-${leer("month")}-${leer("day")} ${hora}:${leer("minute")}`;
}

function esUtm(clave) {
  return /^utm_/i.test(clave) || clave === "gclid" || clave === "fbclid";
}

function slugDesdeValor(value) {
  const raw = texto(value);
  if (!raw || raw.includes("\\") || raw.includes("..")) return "";
  if (!raw.includes("/") && !raw.includes("://") && !raw.includes("?") && !raw.includes(" ")) {
    return SLUG.test(raw) ? raw.toLowerCase() : "";
  }
  let pathname = raw;
  try {
    if (/^https?:\/\//i.test(raw)) pathname = new URL(raw).pathname;
    else if (raw.startsWith("/")) pathname = raw.split("?")[0];
    else return "";
  } catch {
    return "";
  }
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 2) return "";
  if (RESERVADOS.has(parts[0].toLowerCase())) return "";
  const slug = parts[parts.length - 1];
  return SLUG.test(slug) ? slug.toLowerCase() : "";
}

function slugDe(data) {
  const candidatos = [
    data.slug,
    data.ficha,
    data["ficha-slug"],
    data["ficha-url"],
    data["ficha-existente"],
    data.referrer,
  ];
  for (const candidato of candidatos) {
    const slug = slugDesdeValor(candidato);
    if (slug) return slug;
  }
  return "";
}

function anadir(partes, vistos, clave, valor) {
  const limpio = texto(valor);
  if (!limpio) return;
  const token = `${clave}=${limpio}`;
  if (vistos.has(token)) return;
  vistos.add(token);
  partes.push(token);
}

function origenDe(data) {
  const partes = [];
  const vistos = new Set();
  for (const [clave, valor] of Object.entries(data)) {
    if (esUtm(clave) || clave === "origen") anadir(partes, vistos, clave, valor);
  }
  const referrer = texto(data.referrer);
  if (referrer) {
    try {
      const url = new URL(referrer);
      for (const [clave, valor] of url.searchParams) {
        if (esUtm(clave)) anadir(partes, vistos, clave, valor);
      }
      if (partes.length === 0) partes.push(`referrer=${url.pathname || "/"}`);
    } catch {
      if (partes.length === 0) partes.push(`referrer=${referrer.slice(0, 200)}`);
    }
  }
  return partes.join(", ").slice(0, 500);
}

function notasDe(data) {
  const bits = [];
  for (const [clave, valor] of Object.entries(data)) {
    if (OMITIR_NOTAS.has(clave) || esUtm(clave)) continue;
    const limpio = texto(valor);
    if (!limpio) continue;
    bits.push(`${clave}: ${limpio}`);
  }
  return bits.join(" · ").slice(0, 2000);
}

function datosDelEvento(body) {
  const payload = body && typeof body.payload === "object" && body.payload ? body.payload : {};
  const data = payload.data && typeof payload.data === "object" && !Array.isArray(payload.data) ? { ...payload.data } : {};
  if (!data.referrer && payload.referrer) data.referrer = payload.referrer;
  return {
    formulario: texto(data["form-name"] || payload.form_name || body.form_name),
    creado: payload.created_at || body.created_at || "",
    data,
    email: texto(data.email || payload.email),
  };
}

/**
 * @param {unknown} body cuerpo del evento submission-created, o una fila ya normalizada
 * @param {Date} [ahora] solo si el evento no trae created_at
 */
export function filaDesdeEventoNetlify(body, ahora = new Date()) {
  const evento = body && typeof body === "object" ? body : {};
  if (!evento.payload && (evento.formulario || evento.fecha || evento.email || evento.mensaje)) {
    return {
      fecha: texto(evento.fecha) || formatearFecha(ahora.toISOString()),
      formulario: texto(evento.formulario),
      negocio: texto(evento.negocio),
      slug: texto(evento.slug),
      contacto: texto(evento.contacto),
      email: texto(evento.email),
      telefono: texto(evento.telefono),
      mensaje: texto(evento.mensaje),
      origen: texto(evento.origen),
      estado: "Nuevo",
      notas: texto(evento.notas),
    };
  }
  const { formulario, creado, data, email } = datosDelEvento(evento);
  const momento = creado || ahora.toISOString();
  return {
    fecha: formatearFecha(momento),
    formulario,
    negocio: texto(data.negocio || data.empresa),
    slug: slugDe(data),
    contacto: texto(data.contacto || data.nombre),
    email,
    telefono: texto(data.telefono || data.tel),
    mensaje: texto(data.mensaje || data.comentarios || data.descripcion),
    origen: origenDe(data),
    estado: "Nuevo",
    notas: notasDe(data),
  };
}
