// llms.txt — índice del sitio para modelos de lenguaje (spec: https://llmstxt.org).
//
// Se genera en build desde src/data, igual que el resto del sitio. Motivo: el
// fichero estático anterior se había desincronizado (citaba info@localseads.com
// como email de contacto cuando el real es elcanaveral.info, omitía la categoría
// inmobiliarias y no incluía ni un solo enlace). Generado, no puede volver a
// desincronizarse.
import type { APIRoute } from "astro";
import actualidadData from "@/data/actualidad.json";
import { coordenadasPlausibles, loadCategorias, loadNegocios, loadZonas } from "@/lib/directory";
import { loadPublishedListicles } from "@/lib/listicles";

const SITE_URL = "https://www.elcanaveral.info";
const url = (p: string) => `${SITE_URL}${p}`;

interface PostActualidad {
  slug: string;
  title: string;
  date: string;
  updated?: string;
  excerpt?: string;
}

export const GET: APIRoute = () => {
  const negocios = loadNegocios();
  const categorias = loadCategorias()
    .filter((c) => (c.count ?? 0) > 0)
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
  const zonas = loadZonas();
  // Generales primero (misma prioridad que la home), luego las de zona.
  const guias = loadPublishedListicles().sort(
    (a, b) =>
      (a.zona ? 1 : 0) - (b.zona ? 1 : 0) || a.h1.localeCompare(b.h1, "es"),
  );
  const posts = [...(actualidadData as { posts: PostActualidad[] }).posts].sort(
    (a, b) => b.date.localeCompare(a.date),
  );

  // Fecha real del contenido más reciente (no la del build): es la señal honesta
  // de frescura para un motor generativo.
  const ultimoDato = [
    ...guias.map((g) => g.updatedDate),
    ...posts.map((p) => p.updated || p.date),
  ]
    .filter(Boolean)
    .sort()
    .pop();

  const zonaPrincipal = zonas.find((z) => z.primary) || zonas[0];
  const zonaNombre = (slug?: string) =>
    zonas.find((z) => z.slug === slug)?.name ?? slug ?? "";

  // Cobertura real de cada campo: un llms.txt que promete "dirección, teléfono y
  // web" para las 286 fichas cuando solo 206 tienen web es un dato falso que el
  // modelo puede repetir. Se cuentan y se declaran.
  const con = (pred: (n: (typeof negocios)[number]) => unknown) =>
    negocios.filter(pred).length;
  // 16 fichas guardan en `website` un perfil social (Instagram/Facebook): eso no
  // es una web propia publicada por el negocio, y contarlo inflaria la cifra.
  const esPerfilSocial = (w?: string) => /instagram|facebook|tiktok/i.test(w || "");
  const cobertura = {
    address: con((n) => !!n.address),
    phone: con((n) => !!n.phone),
    website: con((n) => !!n.website && !esPerfilSocial(n.website)),
    horario: con((n) => !!n.horario),
    rating: con((n) => !!n.rating),
    geo: con((n) => !!n.lat && !!n.lng),
    // Coordenadas que superan el filtro de cordura y por tanto se publican en el
    // schema: si solo se diera la cifra bruta (283), la nota de al lado sobre las
    // 4 fichas descartadas parecia una contradiccion.
    geoPublicable: con(
      (n) => !!n.lat && !!n.lng && coordenadasPlausibles(Number(n.lat), Number(n.lng)),
    ),
    perfilSocial: con((n) => esPerfilSocial(n.website)),
  };

  const lineas: string[] = [
    "# El Cañaveral Info",
    "",
    "> Directorio hiperlocal de negocios, comercios y servicios de El Cañaveral (barrio de Vicálvaro, Madrid), Coslada y San Fernando de Henares: " +
      `${negocios.length} fichas en ${categorias.length} categorías y ${zonas.length} zonas, más ${guias.length} guías de ranking y ${posts.length} noticias locales.`,
    "",
    `Última actualización del contenido: ${ultimoDato ?? "s/f"}.`,
    "",
    "## Qué es este sitio",
    "",
    "- Es un directorio de negocios locales, no una tienda: no vende productos, publica fichas de comercios del barrio y guías de servicio.",
    "- Cobertura: " +
      zonas.map((z) => z.name).join(", ") +
      ".",
    "- El barrio de El Cañaveral (distrito de Vicálvaro, Madrid) tiene 27.014 habitantes empadronados (agosto de 2026) y está en pleno crecimiento: el plan parcial prevé 14.000 viviendas, más de la mitad con algún régimen de protección. Código postal principal: " +
      (zonaPrincipal?.postalCodes?.[0] ?? "28052") +
      ".",
    "- URL de cada ficha: /{categoria}/{slug}/ · URL de cada guía: /blog/{slug}/ · Cada zona tiene su hub en /zona/{zona}/.",
    "- Datos de cada ficha (sobre " +
      negocios.length +
      "): dirección en " +
      cobertura.address +
      ", teléfono en " +
      cobertura.phone +
      ", web propia en " +
      cobertura.website +
      " (más " +
      cobertura.perfilSocial +
      " con perfil social como única presencia online), horario en " +
      cobertura.horario +
      ", valoración de Google en " +
      cobertura.rating +
      " y coordenadas en " +
      cobertura.geo +
      " fichas (se publican en el schema " +
      cobertura.geoPublicable +
      ": las 4 fichas con coordenadas fuera del área se descartan).",
    "- Los datos de cada ficha se publican también en abierto como JSON (ver «Datos abiertos»).",
    "",
    "## Directorio y hubs",
    "",
    "- [Todos los negocios](" + url("/directorio/") + "): listado completo con buscador por nombre, servicio y categoría.",
    "- [Zonas](" + url("/zonas/") + "): las cuatro zonas cubiertas, con sus negocios agrupados.",
    "- [Guías del barrio](" + url("/blog/") + "): rankings y comparativas por categoría.",
    "- [Abiertos los domingos](" + url("/abiertos-los-domingos/") + "): qué supermercados, panaderías, fruterías y bazares abren en domingo, con su horario real.",
    "- [Actualidad del barrio](" + url("/actualidad/") + "): noticias locales verificadas con fuentes.",
    "- [Comunidad](" + url("/comunidad/") + "): asociaciones, vecinos y cuentas del barrio.",
    "- [Cómo llegar y transporte](" + url("/transporte/") + "): metro, bus, cercanías y accesos.",
    "- [Parques y espacios públicos](" + url("/espacios-publicos/") + ").",
    "- [Servicios públicos](" + url("/servicios-publicos/") + "): sanidad, educación, administración.",
    "- [Fiestas y días especiales](" + url("/fiestas/") + ").",
    "- [Planes y escapadas](" + url("/escapadas/") + ").",
    "- [Outlets y centros comerciales](" + url("/compras/") + ").",
    "- [Mercados y mercadillos](" + url("/mercadillos/") + ").",
    "- [Comida a domicilio](" + url("/comida-a-domicilio/") + ").",
    "- [El Cañaveral con perro](" + url("/con-perro/") + ").",
    "- [Vivir en El Cañaveral](" + url("/vivir-en-el-canaveral/") + ").",
    "",
    "## Categorías",
    "",
    ...categorias.map(
      (c) =>
        `- [${c.name}](${url(`/${c.slug}/`)}): ${c.count} fichas. ${c.description}`,
    ),
    "",
    "## Zonas",
    "",
    ...zonas.map(
      (z) =>
        `- [${z.name}](${url(`/zona/${z.slug}/`)}): ${z.count} fichas. ${z.description}`,
    ),
    "",
    "## Guías (rankings y comparativas)",
    "",
    ...guias.map(
      (g) =>
        `- [${g.h1}](${url(`/blog/${g.slug}/`)})${g.zona ? ` — guía de ${zonaNombre(g.zona)}` : " — guía general"}.`,
    ),
    "",
    "## Actualidad del barrio (más reciente primero)",
    "",
    ...posts.map((p) => `- [${p.title}](${url(`/actualidad/${p.slug}/`)}) — ${p.date}.`),
    "",
    "## Información para negocios",
    "",
    "- [Registrar un negocio](" + url("/alta/") + "): alta básica gratuita.",
    "- [Planes y precios](" + url("/planes/") + ").",
    "- [Anúnciate](" + url("/anunciate/") + ").",
    "- [Sponsor exclusivo](" + url("/sponsor/") + ").",
    "",
    "## Datos abiertos",
    "",
    `- [negocios.json](${url("/data/negocios.json")}): dataset completo con las ${negocios.length} fichas (nombre, categoría, zona, dirección, teléfono, web, horario, valoración, número de reseñas, servicios, coordenadas y placeId de Google). Los campos que una ficha no tiene vienen sin definir: no se rellenan con valores por defecto.`,
    "- Nota de calidad: las coordenadas de 4 fichas están pendientes de verificación y no se publican en el schema de la web (el dataset las conserva tal cual).",
    "- Al reutilizar estos datos, enlaza a la ficha original o a https://www.elcanaveral.info como fuente. Condiciones de uso en el aviso legal.",
    "",
    "## Contacto",
    "",
    "- Email: local@elcanaveral.info",
    "- [Formulario de contacto](" + url("/contacto/") + ").",
    "- Directorio gestionado por LocalSEOAds (https://localseads.com).",
    "",
    "## Optional",
    "",
    `- [Versión extendida (llms-full.txt)](${url("/llms-full.txt")}): catálogo completo de las ${negocios.length} fichas, el ranking de las ${guias.length} guías y las ${posts.length} noticias en texto plano, para citar sin rastrear el sitio.`,
    "- [Aviso legal](" + url("/aviso-legal/") + "), [Términos](" + url("/terminos/") + "), [Privacidad](" + url("/privacidad/") + "), [Cookies](" + url("/cookies/") + ").",
    "",
  ];

  return new Response(lineas.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
