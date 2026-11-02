// Planes de las fichas. El campo es opcional: si falta, la ficha es editorial («ninguno»).
// Ningún negocio real lleva un plan de pago; los casos de pago viven en los tests.

export const PLANES = ["ninguno", "presencia", "destacado", "crecimiento", "sponsor"];
export const MAX_DESTACADO_POR_CATEGORIA = 5;
export const MAX_FOTOS_PAGO = 5;
export const MAX_FOTOS_GRATIS = 1;
export const MAX_PATROCINADOS_HOME = 6;

const RANGO = {
  sponsor: 0,
  crecimiento: 1,
  destacado: 2,
  presencia: 3,
  ninguno: 4,
};

const PATROCINADOS = new Set(["destacado", "crecimiento", "sponsor"]);

function esObjeto(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function planDe(negocio) {
  const plan = esObjeto(negocio) ? negocio.plan : undefined;
  return PLANES.includes(plan) ? plan : "ninguno";
}

export function esPlanPago(negocio) {
  return planDe(negocio) !== "ninguno";
}

export function esPatrocinado(negocio) {
  return PATROCINADOS.has(planDe(negocio));
}

export function ordenarPorPlan(lista) {
  return lista
    .map((negocio, index) => ({ negocio, index }))
    .sort((a, b) => {
      const diff = RANGO[planDe(a.negocio)] - RANGO[planDe(b.negocio)];
      return diff !== 0 ? diff : a.index - b.index;
    })
    .map((item) => item.negocio);
}

function fotosDeclaradas(negocio) {
  if (!esObjeto(negocio)) return [];
  const images = Array.isArray(negocio.images)
    ? negocio.images.filter((img) => typeof img === "string" && img.trim())
    : [];
  if (images.length > 0) return images;
  if (typeof negocio.image === "string" && negocio.image.trim()) return [negocio.image];
  return [];
}

export function fotosDeFicha(negocio) {
  const max = esPlanPago(negocio) ? MAX_FOTOS_PAGO : MAX_FOTOS_GRATIS;
  return fotosDeclaradas(negocio).slice(0, max);
}

export function fichasPatrocinadas(lista, limit = MAX_PATROCINADOS_HOME) {
  return ordenarPorPlan(lista.filter((negocio) => esPatrocinado(negocio))).slice(0, limit);
}

export function urlHttp(value) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function ctaPublicable(negocio) {
  if (!esPlanPago(negocio) || !esObjeto(negocio) || !esObjeto(negocio.cta)) return null;
  const texto = typeof negocio.cta.texto === "string" ? negocio.cta.texto.trim() : "";
  const url = typeof negocio.cta.url === "string" ? negocio.cta.url.trim() : "";
  if (!texto || !urlHttp(url)) return null;
  return { texto, url };
}

export function erroresPlanes(negocios) {
  if (!Array.isArray(negocios)) return ["negocios.json: hace falta un array"];
  const errores = [];
  const destacados = new Map();
  negocios.forEach((negocio, i) => {
    const ruta = `negocios[${i}]`;
    if (!esObjeto(negocio)) {
      errores.push(`${ruta}: no es un objeto`);
      return;
    }
    const slug = typeof negocio.slug === "string" && negocio.slug ? negocio.slug : ruta;
    if (Object.prototype.hasOwnProperty.call(negocio, "plan") && !PLANES.includes(negocio.plan)) {
      errores.push(`${slug}: plan no válido (${String(negocio.plan)})`);
    }
    if (Object.prototype.hasOwnProperty.call(negocio, "cta")) {
      const cta = negocio.cta;
      if (!esObjeto(cta)) {
        errores.push(`${slug}: cta tiene que ser {texto, url}`);
      } else {
        if (typeof cta.texto !== "string" || !cta.texto.trim()) errores.push(`${slug}: cta.texto vacío`);
        if (!urlHttp(cta.url)) errores.push(`${slug}: cta.url tiene que ser http(s)`);
      }
      if (planDe(negocio) === "ninguno") errores.push(`${slug}: cta solo se publica en un plan de pago`);
    }
    if (planDe(negocio) === "destacado") {
      const categoria = typeof negocio.category === "string" && negocio.category
        ? negocio.category
        : "(sin categoría)";
      destacados.set(categoria, (destacados.get(categoria) || 0) + 1);
    }
  });
  for (const [categoria, total] of destacados) {
    if (total > MAX_DESTACADO_POR_CATEGORIA) {
      errores.push(
        `categoría ${categoria}: ${total} fichas con plan destacado (máximo ${MAX_DESTACADO_POR_CATEGORIA})`,
      );
    }
  }
  return errores;
}
