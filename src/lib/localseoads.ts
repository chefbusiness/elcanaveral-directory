// Enlaces a LocalSEOAds. Un solo sitio construye las UTM para que ficha, cabecera
// y pie no se desvíen. Las URLs de schema.org (@id, url de la Organization) no pasan
// por aquí: no son clics y no deben llevar parámetros de campaña.
import { loadNegocios } from "@/lib/directory";

export const LOCALSEOADS_ORIGIN = "https://localseoads.com";
export const UTM_SOURCE = "elcanaveral";
export const UTM_MEDIUM = "directorio";
export const UBICACION_POR_DEFECTO = "el-canaveral";

/**
 * WhatsApp del directorio para el enlace alternativo «Reclámala».
 * Vacío a propósito: en el repo no hay un número de la marca. Los únicos
 * WhatsApp son grupos de vecinos (comunidad.json) y wa.me de negocios
 * concretos, que no son el canal del directorio. Rellena solo dígitos
 * internacionales, sin + ni espacios (p. ej. "34600111222"), para mostrar
 * el enlace. Mientras esté vacío no se renderiza ningún wa.me.
 */
export const WHATSAPP_RECLAMAR = "";

export interface ContextoUtm {
  /** utm_campaign: slug de la zona o, si no hay, el-canaveral. */
  ubicacion: string;
  /** Slug de la ficha cuando la ruta es una ficha. Si no, utm_content es el hueco. */
  fichaSlug?: string;
}

/** utm_content cuando el enlace no está en una ficha. */
export type HuecoUtm = "banner-top" | "footer";

let fichasPorRuta: Map<string, { zona: string; slug: string }> | undefined;

function fichaPorRuta(category: string, slug: string): { zona: string; slug: string } | undefined {
  if (!fichasPorRuta) {
    fichasPorRuta = new Map();
    for (const negocio of loadNegocios()) {
      fichasPorRuta.set(`${negocio.category}/${negocio.slug}`, {
        zona: negocio.zona || UBICACION_POR_DEFECTO,
        slug: negocio.slug,
      });
    }
  }
  return fichasPorRuta.get(`${category}/${slug}`);
}

export function contextoDesdeRuta(pathname: string): ContextoUtm {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "zona" && parts[1]) {
    return { ubicacion: parts[1] };
  }
  if (parts.length >= 2) {
    const ficha = fichaPorRuta(parts[0], parts[1]);
    if (ficha) return { ubicacion: ficha.zona, fichaSlug: ficha.slug };
  }
  return { ubicacion: UBICACION_POR_DEFECTO };
}

/**
 * En una ficha, utm_content es el slug (así se sabe qué ficha genera el clic,
 * también si el clic sale del banner o del pie de esa página). Fuera de una
 * ficha, el hueco: banner-top o footer.
 */
export function contenidoUtm(ctx: ContextoUtm, hueco: HuecoUtm): string {
  return ctx.fichaSlug || hueco;
}

export function enlaceLocalseoads(opts: {
  path?: string;
  ubicacion: string;
  content: string;
  /** Parámetros propios, delante del bloque UTM (p. ej. ficha=slug). */
  query?: Record<string, string>;
}): string {
  let path = opts.path ?? "/";
  if (!path.startsWith("/")) path = `/${path}`;
  if (path !== "/" && !path.endsWith("/")) path = `${path}/`;

  const params = new URLSearchParams();
  if (opts.query) {
    for (const [key, value] of Object.entries(opts.query)) {
      if (value) params.set(key, value);
    }
  }
  params.set("utm_source", UTM_SOURCE);
  params.set("utm_medium", UTM_MEDIUM);
  params.set("utm_campaign", opts.ubicacion || UBICACION_POR_DEFECTO);
  params.set("utm_content", opts.content);
  return `${LOCALSEOADS_ORIGIN}${path}?${params.toString()}`;
}

/**
 * Landing publicada: https://localseoads.com/auditoria-gratis/el-canaveral/
 * La zona del negocio no va en el path (solo existe esta URL). Va en utm_campaign.
 */
export const AUDITORIA_GRATIS_PATH = "/auditoria-gratis/el-canaveral/";

/**
 * Activa por defecto. Solo PUBLIC_AUDIT_LANDING_LIVE="false" la apaga,
 * para que el CTA salga en Netlify sin variable de entorno.
 */
export function auditoriaLandingActiva(): boolean {
  return import.meta.env.PUBLIC_AUDIT_LANDING_LIVE !== "false";
}

/**
 * Enlace a la auditoría, con el mismo bloque UTM que el resto de la marca.
 * En una ficha: ficha=<slug>, utm_campaign=<ubicación>, utm_content=<slug>.
 * Fuera de una ficha: sin ficha, utm_content es el hueco (banner-top, footer, home…).
 */
export function enlaceAuditoriaGratis(opts: {
  ubicacion: string;
  content: string;
  ficha?: string;
}): string {
  return enlaceLocalseoads({
    path: AUDITORIA_GRATIS_PATH,
    ubicacion: opts.ubicacion,
    content: opts.content,
    query: opts.ficha ? { ficha: opts.ficha } : undefined,
  });
}

/**
 * CTA comercial. Con la landing activa apunta a la auditoría; con el kill
 * switch, a la home de LocalSEOAds (sin el parámetro ficha).
 */
export function enlaceCtaLocalseoads(opts: {
  ubicacion: string;
  content: string;
  ficha?: string;
}): string {
  if (auditoriaLandingActiva()) return enlaceAuditoriaGratis(opts);
  return enlaceLocalseoads({
    ubicacion: opts.ubicacion,
    content: opts.content,
  });
}

export function enlaceLocalseoadsEnPagina(pathname: string, hueco: HuecoUtm): string {
  const ctx = contextoDesdeRuta(pathname);
  return enlaceCtaLocalseoads({
    ubicacion: ctx.ubicacion,
    content: contenidoUtm(ctx, hueco),
    ficha: ctx.fichaSlug,
  });
}

export function enlaceWhatsappReclamar(negocio: { name: string; slug: string }): string | undefined {
  const numero = WHATSAPP_RECLAMAR.replace(/\D/g, "");
  if (!numero) return undefined;
  const texto = `Hola, quiero reclamar la ficha «${negocio.name}» (${negocio.slug}) en elcanaveral.info`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}
