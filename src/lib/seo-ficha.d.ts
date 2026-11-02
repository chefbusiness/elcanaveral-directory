export function mencionaCalleRestringida(texto: unknown): boolean;
export function omitirCalleRestringida(texto: unknown): string;
export function callePublica(address: unknown): string;
export function recortarMeta(texto: unknown, max?: number): string;
export function tituloDeFicha(
  negocio: {
    name?: string;
    categoryName?: string;
    zonaName?: string;
    address?: string;
  } | null | undefined,
  titleOverride?: string,
): string;
export function metaDeFicha(
  negocio: {
    name?: string;
    categoryName?: string;
    zonaName?: string;
    address?: string;
    description?: string;
  } | null | undefined,
  descriptionOverride?: string,
  max?: number,
): string;
