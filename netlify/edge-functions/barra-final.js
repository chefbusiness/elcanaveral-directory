import { canonicalPath, debeRedirigirABarra } from "../../src/lib/canonical.mjs";

// 301 de /ruta a /ruta/. Netlify iguala las dos formas antes de evaluar
// _redirects, así que una regla splat entra en bucle; esto mira la ruta cruda.
export default async (request, context) => {
  if (request.method !== "GET" && request.method !== "HEAD") return context.next();
  const url = new URL(request.url);
  if (!debeRedirigirABarra(url.pathname)) return context.next();
  url.pathname = canonicalPath(url.pathname);
  return Response.redirect(url, 301);
};
