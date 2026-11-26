export function contieneMarcador(texto: unknown): boolean;
export function formatearNota(rating: unknown): string;
export function formatearResenas(numReviews: unknown): string;
export function formatearHorario(horario: unknown): string;
export function crearResolutorCifras(
  negocios: readonly { slug: string; [campo: string]: unknown }[],
): (texto: string) => string;
export function resolverEnProfundidad<T>(valor: T, resolverCifras: (texto: string) => string): T;
