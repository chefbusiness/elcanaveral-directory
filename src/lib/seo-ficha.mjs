// Title y meta de una ficha. No lee ni escribe JSON: solo compone el texto
// que va al <title> y a la meta description.
const CONECTORES = new Set(
  "a al con de del e el en la las le lo los o para por que su sus un una y".split(" "),
);

const RE_CALLE_RESTRINGIDA = /enrique\s+urquijo/i;

export function mencionaCalleRestringida(texto) {
  return RE_CALLE_RESTRINGIDA.test(String(texto || ""));
}

/** Quita la calle restringida del texto. El resto de la frase se conserva. */
export function omitirCalleRestringida(texto) {
  let s = String(texto || "").replace(/\s+/g, " ").trim();
  if (!mencionaCalleRestringida(s)) return s;
  s = s.replace(/\s*\([^)]*enrique\s+urquijo[^)]*\)/gi, "");
  s = s.replace(
    /(?:[,;]\s*)?(?:(?:calle|c\/|c\.|avda\.?|avenida)\s+(?:de\s+)?)?enrique\s+urquijo\b\s*,?\s*\d*/gi,
    "",
  );
  s = s.replace(/\(\s*\)/g, "");
  s = s.replace(/\s+,/g, ",");
  s = s.replace(/,\s*,/g, ",");
  s = s.replace(/\s{2,}/g, " ");
  s = s.replace(/\s+([.;])/g, "$1");
  return s.trim();
}

/** Calle y número, sin municipio ni código postal. Vacío si la calle está restringida. */
export function callePublica(address) {
  if (!address || mencionaCalleRestringida(address)) return "";
  let s = String(address).replace(/\s+/g, " ").trim();
  s = s.replace(/,?\s*España\s*$/i, "").trim();
  s = s.replace(/,?\s*\b28\d{3}\b.*$/, "").trim();
  s = s.replace(/,\s*$/, "");
  const parts = s.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2 && !/\d/.test(parts[parts.length - 1])) parts.pop();
  return parts.join(", ");
}

function ultimaPalabra(frase) {
  const limpia = String(frase || "").replace(/[.!?…]+$/u, "").trim();
  const partes = limpia.split(/\s+/);
  return (partes[partes.length - 1] || "").toLowerCase();
}

function acabaEnConector(frase) {
  return CONECTORES.has(ultimaPalabra(frase));
}

/**
 * Recorta a `max` caracteres por el final de una frase o, si no cabe ninguna,
 * por la última palabra completa. No deja un conector suelto ni un punto pegado.
 */
export function recortarMeta(texto, max = 155) {
  let s = omitirCalleRestringida(texto);
  if (!s) return "";

  while (s && acabaEnConector(s)) {
    s = s.replace(/[.!?…]+$/u, "").trim();
    s = s.replace(/\s+\S+$/u, "").trim();
  }

  // Las descripciones del directorio se cortaron cerca de 150 caracteres y se
  // les pegó un punto. Si queda una frase anterior, se tira esa cola.
  if (s.length <= 170) {
    const frases = s.match(/[^.!?…]+[.!?…]+/gu) || [];
    const cubierto = frases.join("").trim();
    const cola = s.slice(cubierto.length).trim();
    if (frases.length > 0 && cola) {
      s = cubierto;
    } else if (frases.length >= 2) {
      const ultima = frases[frases.length - 1].trim();
      const palabras = ultima.replace(/[.!?…]+$/u, "").split(/\s+/).filter(Boolean);
      if (palabras.length <= 6) s = frases.slice(0, -1).join("").trim();
    }
  }

  if (s.length <= max) return s;

  const trozo = s.slice(0, max + 1);
  let corteFrase = -1;
  for (const marca of [". ", "! ", "? ", "… "]) {
    corteFrase = Math.max(corteFrase, trozo.lastIndexOf(marca));
  }
  if (/[.!?…]$/u.test(s.slice(0, max))) corteFrase = Math.max(corteFrase, max - 1);
  if (corteFrase >= 40) {
    const frase = s.slice(0, corteFrase + 1).trim();
    if (!acabaEnConector(frase) && !mencionaCalleRestringida(frase)) return frase;
  }

  const limite = s.slice(0, max + 1);
  let corte = limite.lastIndexOf(" ");
  if (corte < 1) corte = Math.min(max, s.length);
  let palabras = s.slice(0, corte).trim().replace(/[.,;:]+$/u, "").trim();
  while (palabras && acabaEnConector(palabras)) {
    palabras = palabras.replace(/\s+\S+$/u, "").trim();
  }
  return mencionaCalleRestringida(palabras) ? omitirCalleRestringida(palabras) : palabras;
}

export function tituloDeFicha(negocio, titleOverride) {
  const override = typeof titleOverride === "string" ? titleOverride.trim() : "";
  if (override && !mencionaCalleRestringida(override)) return override;

  const name = (negocio?.name || "").trim();
  const categoria = (negocio?.categoryName || "").trim();
  const zona = (negocio?.zonaName || "").trim();
  const calle = callePublica(negocio?.address);
  const sitio = [zona, calle].filter(Boolean).join(", ");
  const titulo = categoria
    ? `${name} — ${categoria} en ${sitio}`
    : `${name} — ${sitio}`;
  return omitirCalleRestringida(titulo);
}

export function metaDeFicha(negocio, descriptionOverride, max = 155) {
  const override = typeof descriptionOverride === "string" ? descriptionOverride.trim() : "";
  const cruda = override || negocio?.description || "";
  let meta = recortarMeta(cruda, max);
  if (!meta) {
    const calle = callePublica(negocio?.address);
    const sitio = [negocio?.zonaName, calle].filter(Boolean).join(", ");
    const categoria = negocio?.categoryName ? `${negocio.categoryName} en ${sitio}` : sitio;
    meta = recortarMeta(`${negocio?.name || "Ficha"}. ${categoria}.`, max);
  }
  if (mencionaCalleRestringida(meta)) meta = omitirCalleRestringida(meta);
  return meta;
}
