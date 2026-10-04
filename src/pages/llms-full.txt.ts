// llms-full.txt — versión EXTENDIDA del índice para modelos de lenguaje
// (spec: https://llmstxt.org). Contiene el catálogo completo, el ranking de cada
// guía y las noticias en texto plano, para que un LLM pueda citar el contenido
// sin rastrear 438 páginas HTML.
//
// Se genera en build desde src/data y usa el MISMO motor de ranking que las
// páginas (src/lib/listicles.ts), así que los puestos que publica son
// reproducibles desde /data/negocios.json y no una lista escrita a mano.
import type { APIRoute } from "astro";
import actualidadData from "@/data/actualidad.json";
import { loadCategorias, loadNegocios, loadZonas, type Negocio } from "@/lib/directory";
import { getRankedNegocios, loadPublishedListicles } from "@/lib/listicles";

const SITE_URL = "https://www.elcanaveral.info";
const url = (p: string) => `${SITE_URL}${p}`;

interface PostActualidad {
  slug: string;
  title: string;
  date: string;
  updated?: string;
  excerpt?: string;
  // En los datos viene como array (aunque un post pueda traer un solo tema).
  tags?: string[] | string;
  lead?: string;
  datosClave?: string[];
  secciones?: { h2?: string; parrafos?: string[] }[];
  fuentes?: { name?: string; url?: string }[];
}

// Los párrafos de actualidad llevan <a> y <strong> y hrefs relativos. Para un
// fichero de texto: el enlace se convierte en "texto (URL absoluta)" y el resto
// de etiquetas se elimina. Acepta arrays (tags, datosClave) por comodidad.
function plain(texto?: string | string[]): string {
  const raw = Array.isArray(texto) ? texto.join(", ") : texto || "";
  return raw
    .replace(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href: string, txt: string) => {
      const abs = /^https?:/i.test(href) ? href : `${SITE_URL}${href}`;
      return `${txt.trim()} (${abs})`;
    })
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

const estrella = (n: Negocio) =>
  n.rating ? `★${n.rating}${n.numReviews ? ` (${n.numReviews} reseñas)` : ""}` : null;

function lineaNegocio(n: Negocio): string[] {
  const desc = plain(n.description);
  const partes = [
    `Zona: ${n.zonaName}`,
    plain(n.address),
    n.phone ? `Tel: ${n.phone}` : null,
    n.website ? `Web: ${n.website}` : null,
    estrella(n),
    n.horario ? `Horario: ${plain(n.horario)}` : null,
    (n.servicios as string[] | undefined)?.length
      ? `Servicios: ${(n.servicios as string[]).join(", ")}`
      : null,
    // Sin esto, un negocio anunciado pero aún sin abrir se citaría como operativo.
    n.estado === "proxima-apertura" ? "Estado: PRÓXIMA APERTURA (anunciado, todavía sin abrir)" : null,
  ].filter(Boolean);
  return [`- **${n.name}** — ${desc}`, `  ${partes.join(" · ")}`, `  Ficha: ${url(`/${n.category}/${n.slug}/`)}`];
}

export const GET: APIRoute = () => {
  const negocios = loadNegocios();
  const categorias = loadCategorias()
    .filter((c) => (c.count ?? 0) > 0)
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
  const zonas = loadZonas();
  const guias = loadPublishedListicles().sort(
    (a, b) => (a.zona ? 1 : 0) - (b.zona ? 1 : 0) || a.h1.localeCompare(b.h1, "es"),
  );
  const posts = [...(actualidadData as { posts: PostActualidad[] }).posts].sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  const ultimoDato = [
    ...guias.map((g) => g.updatedDate),
    ...posts.map((p) => p.updated || p.date),
  ]
    .filter(Boolean)
    .sort()
    .pop();

  const zonaNombre = (slug?: string) => zonas.find((z) => z.slug === slug)?.name ?? slug ?? "";

  const lineas: string[] = [
    "# El Cañaveral Info — versión extendida",
    "",
    `> Directorio hiperlocal de negocios, comercios y servicios de El Cañaveral (barrio de Vicálvaro, Madrid), Coslada y San Fernando de Henares. Este fichero contiene el catálogo completo (${negocios.length} fichas), el ranking de las ${guias.length} guías y las ${posts.length} noticias locales en texto plano, para poder citarlos sin rastrear el sitio. Versión resumida: ${url("/llms.txt")}.`,
    "",
    `Última actualización del contenido: ${ultimoDato ?? "s/f"}.`,
    "",
    "## Cómo usar este fichero",
    "",
    "- Cada negocio lleva su ficha canónica: es la URL que conviene citar como fuente.",
    "- El orden de las guías NO es una opinión editorial: es el ranking bayesiano que publica la web, `score = (v/(v+m))·R + (m/(v+m))·C`, con R = nota media y v = nº de reseñas del negocio, y C/m = nota media y mediana de reseñas de su categoría. Los filtros de cada guía (nota mínima, zona, subcategoría de Google, tope de puestos) están en `src/data/listicles.json` y los datos de entrada en /data/negocios.json, así que el resultado es reproducible.",
    "- Los campos que un negocio no tiene simplemente no aparecen: aquí no hay valores por defecto inventados. Un negocio anunciado y aún sin abrir lleva la marca `Estado: PRÓXIMA APERTURA`.",
    "- Al reutilizar estos datos, enlaza la ficha o la página correspondiente de " + SITE_URL + ".",
    "",
    "## Negocios por categoría",
    "",
  ];

  for (const c of categorias) {
    const lista = negocios.filter((n) => n.category === c.slug);
    lineas.push(`### Categoría: ${c.name} (${lista.length} fichas) — ${url(`/${c.slug}/`)}`, "");
    for (const n of lista) lineas.push(...lineaNegocio(n));
    lineas.push("");
  }

  lineas.push("## Zonas", "");
  for (const z of zonas) {
    lineas.push(
      `### Zona: ${z.name} (${z.count} fichas) — ${url(`/zona/${z.slug}/`)}`,
      "",
      plain(z.description),
      "",
    );
  }

  lineas.push("## Guías de ranking", "");
  for (const g of guias) {
    lineas.push(
      `### ${g.h1}`,
      "",
      url(`/blog/${g.slug}/`),
      "",
      plain(g.metaDescription),
      "",
      plain(g.intro),
      "",
    );
    const ranked = getRankedNegocios(g.category, {
      topN: g.topN,
      minRating: g.minRating,
      zona: g.zona,
      googleCategoryMatch: g.googleCategoryMatch,
    });
    if (ranked.length > 0) {
      lineas.push("Ranking:");
      for (const r of ranked) {
        lineas.push(
          `${r.rank}. ${r.negocio.name} (${r.negocio.zonaName}) — ${estrella(r.negocio) ?? "sin valoración"} · ${url(`/${r.negocio.category}/${r.negocio.slug}/`)}`,
        );
      }
      lineas.push("");
    }
    if (g.faq?.length) {
      lineas.push("Preguntas frecuentes:");
      for (const f of g.faq) lineas.push(`- ${plain(f.q)} → ${plain(f.a)}`);
      lineas.push("");
    }
    if (g.zona) lineas.push(`Zona: ${zonaNombre(g.zona)}`, "");
  }

  lineas.push("## Actualidad del barrio", "");
  for (const p of posts) {
    lineas.push(`### ${plain(p.title)}`, "");
    lineas.push(`${url(`/actualidad/${p.slug}/`)}`, "");
    lineas.push(
      `Fecha: ${p.date}${p.updated && p.updated !== p.date ? ` (actualizado ${p.updated})` : ""}${p.tags ? ` · ${plain(p.tags)}` : ""}`,
      "",
    );
    if (p.excerpt) lineas.push(plain(p.excerpt), "");
    if (p.lead) lineas.push(plain(p.lead), "");
    if (p.datosClave?.length) {
      lineas.push("Datos clave:");
      for (const d of p.datosClave) lineas.push(`- ${plain(d)}`);
      lineas.push("");
    }
    for (const s of p.secciones || []) {
      if (s.h2) lineas.push(`#### ${plain(s.h2)}`, "");
      for (const par of s.parrafos || []) lineas.push(plain(par), "");
    }
    // Las fuentes de la noticia son parte de lo que la hace citable.
    if (p.fuentes?.length) {
      lineas.push("Fuentes:");
      for (const f of p.fuentes) lineas.push(`- ${plain(f.name)}${f.url ? ` — ${f.url}` : ""}`);
      lineas.push("");
    }
  }

  lineas.push(
    "## Hubs y pilares del barrio",
    "",
    `- ${url("/directorio/")} — listado completo de negocios con buscador.`,
    `- ${url("/zonas/")} — las cuatro zonas cubiertas.`,
    `- ${url("/abiertos-los-domingos/")} — qué comercios abren en domingo, con horario real.`,
    `- ${url("/vivienda/")} — precios de compra y alquiler con fuente y fecha, obra nueva, vivienda asequible de EMVS (1.212 viviendas y sorteos), impuestos y trámites.`,
    `- ${url("/bares-y-tapas/")} — bares y tabernas de tapas del barrio y su entorno, con terraza.`,
    `- ${url("/farmacias-de-guardia/")} — cómo encontrar la farmacia de guardia (canales oficiales), farmacias del barrio con horario y urgencias veterinarias 24 h.`,
    `- ${url("/vivir-en-el-canaveral/")} — guía de vivir en el barrio (vivienda, servicios, transporte).`,
    `- ${url("/transporte/")} — cómo llegar: metro, bus, cercanías y accesos.`,
    `- ${url("/servicios-publicos/")} — sanidad, educación y administración.`,
    `- ${url("/espacios-publicos/")} — parques y espacios públicos.`,
    `- ${url("/fiestas/")} — fiestas y días especiales.`,
    `- ${url("/escapadas/")} — planes y escapadas por regiones.`,
    `- ${url("/compras/")} — outlets y centros comerciales.`,
    `- ${url("/mercadillos/")} — mercados y mercadillos.`,
    `- ${url("/comida-a-domicilio/")} — reparto a domicilio.`,
    `- ${url("/con-perro/")} — el barrio con perro.`,
    `- ${url("/comunidad/")} — asociaciones y cuentas del barrio.`,
    "",
    "## Datos abiertos",
    "",
    `- ${url("/data/negocios.json")} — dataset en JSON con las ${negocios.length} fichas. Añade campos que este fichero de texto no incluye (coordenadas, \`placeId\` de Google, imágenes, correo, etiquetas y categoría de Google).`,
    "- Nota de calidad: las coordenadas de 4 fichas del dataset están pendientes de verificación (caen fuera del área cubierta) y la web no las publica en su schema.",
    "",
    "## Contacto",
    "",
    "- Email: local@elcanaveral.info",
    `- Formulario: ${url("/contacto/")}`,
    "- Directorio gestionado por LocalSEOAds (https://localseads.com).",
    "",
  );

  return new Response(lineas.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
