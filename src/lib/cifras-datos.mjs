// Cifras de una ficha dentro de textos editoriales (seo-overrides.json).
// En lugar de escribir «4,4 de 5 con 128 reseñas» a mano, el texto lleva
// {{nota:slug}}, {{reseñas:slug}} o {{horario:slug}} y se rellena en el build
// con los datos de negocios.json. Un slug que no existe o un dato que falta
// rompe el build: es preferible a publicar una cifra inventada o vacía.
const RE_MARCADOR = /\{\{\s*(nota|reseñas|horario)\s*:\s*([a-z0-9-]+)\s*\}\}/g;

export function contieneMarcador(texto) {
  return typeof texto === "string" && /\{\{[^}]*\}\}/.test(texto);
}

/** 4.4 → «4,4»; 5 → «5». */
export function formatearNota(rating) {
  if (typeof rating !== "number" || !Number.isFinite(rating)) return "";
  return Number.isInteger(rating) ? String(rating) : rating.toFixed(1).replace(".", ",");
}

/** 3625 → «3.625». Mismo formato que el resto de textos del sitio. */
export function formatearResenas(numReviews) {
  if (typeof numReviews !== "number" || !Number.isInteger(numReviews) || numReviews < 0) return "";
  return String(numReviews).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** «L-V 08:30-19:30, D Cerrado» → «L-V 8:30-19:30, D Cerrado». */
export function formatearHorario(horario) {
  if (typeof horario !== "string") return "";
  return horario.replace(/\s+/g, " ").trim().replace(/\b0(\d):/g, "$1:");
}

const FORMATOS = {
  nota: (n) => formatearNota(n.rating),
  reseñas: (n) => formatearResenas(n.numReviews),
  horario: (n) => formatearHorario(n.horario),
};

/**
 * Devuelve una función que sustituye los marcadores de un texto. `negocios`
 * debe ser la lista de fichas abiertas: un marcador hacia una ficha cerrada
 * también rompe el build.
 */
export function crearResolutorCifras(negocios) {
  const porSlug = new Map((negocios || []).map((n) => [n.slug, n]));
  return function resolverCifras(texto) {
    if (typeof texto !== "string") return texto;
    const resuelto = texto.replace(RE_MARCADOR, (marcador, tipo, slug) => {
      const negocio = porSlug.get(slug);
      if (!negocio) throw new Error(`${marcador}: no hay ninguna ficha abierta con el slug «${slug}»`);
      const valor = FORMATOS[tipo](negocio);
      if (!valor) throw new Error(`${marcador}: la ficha «${slug}» no tiene ${tipo}`);
      return valor;
    });
    if (contieneMarcador(resuelto)) throw new Error(`Marcador desconocido en: ${resuelto}`);
    return resuelto;
  };
}

/** Aplica el resolutor a todas las cadenas de un objeto o lista (title, intro, faq...). */
export function resolverEnProfundidad(valor, resolverCifras) {
  if (typeof valor === "string") return resolverCifras(valor);
  if (Array.isArray(valor)) return valor.map((v) => resolverEnProfundidad(v, resolverCifras));
  if (valor && typeof valor === "object") {
    return Object.fromEntries(
      Object.entries(valor).map(([k, v]) => [k, resolverEnProfundidad(v, resolverCifras)]),
    );
  }
  return valor;
}
