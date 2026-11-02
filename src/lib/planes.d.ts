export const PLANES: readonly ["ninguno", "presencia", "destacado", "crecimiento", "sponsor"];
export const MAX_DESTACADO_POR_CATEGORIA: number;
export const MAX_FOTOS_PAGO: number;
export const MAX_FOTOS_GRATIS: number;
export const MAX_PATROCINADOS_HOME: number;

export type Plan = "ninguno" | "presencia" | "destacado" | "crecimiento" | "sponsor";

export function planDe(negocio: { plan?: string } | null | undefined): Plan;
export function esPlanPago(negocio: { plan?: string } | null | undefined): boolean;
export function esPatrocinado(negocio: { plan?: string } | null | undefined): boolean;
export function ordenarPorPlan<T extends { plan?: string }>(lista: readonly T[]): T[];
export function fotosDeFicha(
  negocio: { plan?: string; image?: string; images?: string[] } | null | undefined,
): string[];
export function fichasPatrocinadas<T extends { plan?: string }>(lista: readonly T[], limit?: number): T[];
export function urlHttp(value: unknown): boolean;
export function ctaPublicable(
  negocio: { plan?: string; cta?: { texto?: string; url?: string } } | null | undefined,
): { texto: string; url: string } | null;
export function erroresPlanes(negocios: unknown): string[];
