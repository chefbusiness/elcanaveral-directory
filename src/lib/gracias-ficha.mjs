// Resuelve «Volver a la ficha» solo contra rutas que el build conoce.
// Un ?ficha= o un referrer nunca se convierten en una URL externa.

const SLUG = /^[a-z0-9][a-z0-9-]*$/;

function rutaConocida(indice, clave) {
  const ruta = indice?.[clave];
  if (typeof ruta !== "string") return null;
  if (!ruta.startsWith("/") || ruta.startsWith("//") || ruta.includes("://") || ruta.includes("\\")) return null;
  return ruta;
}

function resolverValor(raw, indice) {
  if (typeof raw !== "string") return null;
  let value = raw.trim();
  if (!value || value.includes("\\") || value.includes("..") || value.startsWith("//")) return null;
  if (/^https?:\/\//i.test(value)) {
    try {
      value = new URL(value).pathname;
    } catch {
      return null;
    }
  }
  value = value.split("?")[0].split("#")[0].replace(/^\/+/, "").replace(/\/+$/, "").toLowerCase();
  if (!value) return null;
  const parts = value.split("/").filter(Boolean);
  if (parts.length < 1 || parts.length > 2) return null;
  if (!parts.every((part) => SLUG.test(part))) return null;
  return rutaConocida(indice, parts.join("/"));
}

function leerFicha(search) {
  const raw = String(search || "");
  const query = raw.startsWith("?") ? raw.slice(1) : raw;
  return new URLSearchParams(query).get("ficha");
}

/**
 * @param {string} search
 * @param {string} referrer
 * @param {string} origin
 * @param {Record<string, string>} indice  clave `slug` o `categoria/slug` → ruta interna
 * @returns {string | null}
 */
export function hrefVolverFicha(search, referrer, origin, indice) {
  const desdeQuery = resolverValor(leerFicha(search), indice);
  if (desdeQuery) return desdeQuery;
  if (!referrer) return null;
  let url;
  try {
    url = new URL(referrer);
  } catch {
    return null;
  }
  if (origin) {
    let esperado = origin;
    try {
      esperado = new URL(origin).origin;
    } catch {
      esperado = origin;
    }
    if (url.origin !== esperado) return null;
  }
  return resolverValor(url.pathname, indice);
}
