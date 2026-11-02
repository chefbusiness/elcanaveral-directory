// Canonical y 301 de barra final. Los archivos (sitemap, llms.txt, .ics) no llevan barra.

export function canonicalPath(pathname) {
  if (!pathname || pathname === "/") return "/";
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (path === "/") return "/";
  const last = path.split("/").filter(Boolean).pop() || "";
  if (last.includes(".")) return path;
  return path.endsWith("/") ? path : `${path}/`;
}

export function canonicalHref(pathname, base = "https://www.elcanaveral.info") {
  const origin = base instanceof URL ? base.origin : String(base).replace(/\/$/, "");
  return new URL(canonicalPath(pathname), `${origin}/`).href;
}

/** GET /ruta (sin punto en el último segmento) tiene que ir a /ruta/. */
export function debeRedirigirABarra(pathname) {
  if (!pathname || pathname === "/" || pathname.startsWith("/.netlify")) return false;
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return canonicalPath(path) !== path;
}
