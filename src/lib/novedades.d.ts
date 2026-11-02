export interface Fuente {
  nombre: string;
  url: string;
  tipo: string;
}

export type EstadoApertura = "anunciado" | "obras" | "abierto" | "cerrado";

export interface Apertura {
  id: string;
  nombre: string;
  estado: EstadoApertura;
  categoria: string;
  zona: string;
  direccion: string;
  fichaSlug: string | null;
  fechaPrevista: string | null;
  fechaApertura: string | null;
  resumen: string;
  fuentes: Fuente[];
  verificadoEn: string;
}

export interface AperturasFile {
  lastReview: string;
  items: Apertura[];
}

export type EstadoAgenda = "confirmado" | "anunciado" | "cancelado" | "aplazado";

export interface EventoAgenda {
  id: string;
  nombre: string;
  estado: EstadoAgenda;
  inicio: string;
  fin: string;
  sinHora: boolean;
  lugar: { nombre: string; direccion: string; zona: string };
  organizador: { nombre: string; url: string | null };
  gratis: boolean;
  precio: string | null;
  entradasUrl: string | null;
  categoria: string;
  resumen: string;
  fichasRelacionadas: string[];
  fiestaSlug: string | null;
  fuentes: Fuente[];
  verificadoEn: string;
}

export interface AgendaFile {
  items: EventoAgenda[];
}

export function hoyMadrid(ahora?: Date): string;
export function diaDe(value: unknown): string | null;
export function instanteConZona(value: unknown): string | null;
export function diasEntre(desde: unknown, hasta: unknown): number | null;
export function sumarDias(iso: unknown, dias: number): string | null;
export function textoFechaLarga(value: unknown): string | null;
export function porReverificar(verificadoEn: unknown, hoy?: string): boolean;
export function esAbiertaReciente(item: { estado?: string; fechaApertura?: unknown } | null | undefined, hoy?: string): boolean;
export function esProximamente(item: { estado?: string } | null | undefined): boolean;
export function clasificarAgenda<T extends { inicio?: string; fin?: string }>(
  eventos: T[],
  hoy?: string,
): {
  hoy: string;
  lunes: string;
  domingo: string;
  mesInicio: string;
  mesFin: string;
  semana: T[];
  mes: T[];
  proximos: T[];
  archivo: T[];
};
export function admiteSchemaEvento(ev: {
  inicio?: unknown;
  lugar?: { nombre?: unknown };
  fuentes?: { url?: unknown }[];
} | null | undefined): boolean;
export function fechaSchema(iso: unknown, sinHora: boolean): string | null;
export function textoIntervalo(inicio: unknown, fin: unknown, sinHora: boolean): string | null;
export function textoIcs(
  ev: {
    id: string;
    nombre: string;
    estado: string;
    inicio: string;
    fin: string;
    sinHora: boolean;
    verificadoEn?: string;
    resumen?: string;
    lugar?: { nombre?: string; direccion?: string };
    fuentes?: { nombre?: string; url?: string }[];
  },
  urlPagina?: string,
): string;
