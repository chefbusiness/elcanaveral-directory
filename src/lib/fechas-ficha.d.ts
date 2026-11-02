export function fechaIsoValida(value: unknown): string | null;
export function masReciente(fechas: Array<unknown>): string | null;
export function fechaLastmodFicha(
  negocio: { verificadoEn?: string; actualizado?: string } | null | undefined,
): string | null;
export function textoDatosRevisados(
  negocio: { verificadoEn?: string; actualizado?: string } | null | undefined,
): string | null;
