export interface EnlaceInterno {
  href: string;
  label: string;
}

export interface PortadaEnlaces {
  hubs: EnlaceInterno[];
  listicles: EnlaceInterno[];
  guias: EnlaceInterno[];
  barrio: EnlaceInterno;
}

export function listiclePublicado(
  listicle: { draft?: boolean; publishedDate?: string } | null | undefined,
  hoy?: string,
): boolean;

export function enlacesDePortada(root?: string, hoy?: string): PortadaEnlaces;

export function listiclesDeCategoria(
  category: string,
  root?: string,
  hoy?: string,
): { slug: string; href: string; h1: string }[];
