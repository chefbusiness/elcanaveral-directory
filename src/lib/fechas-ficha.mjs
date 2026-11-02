// Fechas opcionales de una ficha. Solo cuentan si son un día ISO real:
// no se inventan y no se sustituyen por la fecha del build.

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

/** YYYY-MM-DD válido, o el día de un ISO con hora. El día es el que está escrito, sin convertir de zona. */
export function fechaIsoValida(value) {
  if (typeof value !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(value.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

/** La más reciente de las fechas válidas, o null. */
export function masReciente(fechas) {
  const dias = [];
  for (const fecha of fechas) {
    const dia = fechaIsoValida(fecha);
    if (dia) dias.push(dia);
  }
  if (dias.length === 0) return null;
  dias.sort();
  return dias[dias.length - 1];
}

/** Fecha propia de la ficha: verificadoEn o actualizado, la que sea posterior. */
export function fechaLastmodFicha(negocio) {
  if (!negocio || typeof negocio !== "object") return null;
  return masReciente([negocio.verificadoEn, negocio.actualizado]);
}

/**
 * «Datos revisados el 5 de octubre de 2026», o null si la ficha no tiene fecha.
 * Usa la misma fecha que el lastmod de la ficha para no contradecir el sitemap.
 */
export function textoDatosRevisados(negocio) {
  const iso = fechaLastmodFicha(negocio);
  if (!iso) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const mes = MESES[Number(match[2]) - 1];
  if (!mes) return null;
  return `Datos revisados el ${Number(match[3])} de ${mes} de ${match[1]}`;
}
