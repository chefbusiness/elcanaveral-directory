export function esCalleRestringida(texto: unknown): boolean;
export function esEducacionInfantil(negocio: {
  category?: string;
  googleCategory?: string;
  tags?: string[];
  edades?: string;
} | null | undefined): boolean;

export interface ItemGuiaEducacion {
  id: string;
  grupo: string;
  zona?: string;
  nombre: string;
  resumen: string;
  direccion?: string;
  telefono?: string;
  fichaCategoria: string;
  fichaSlug: string;
  fuentes: { nombre: string; url: string; tipo: string }[];
}

export function guiaEducacionInfantil(root?: string): {
  slug: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  grupos: Record<string, string>;
  enlaces: { href: string; label: string }[];
  items: ItemGuiaEducacion[];
  faq: { q: string; a: string }[];
};
