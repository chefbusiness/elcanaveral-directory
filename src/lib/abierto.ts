/**
 * Cálculo de «abierto ahora». Vive aparte del script del navegador para poder probarlo: es lógica de
 * fechas y horas, donde un error se ve como «Cerrado» en un local abierto (o al revés).
 *
 * `semana` es el horario normalizado por día: { "1": [["07:00","24:00"]], …, "7": [...] } con
 * 1 = lunes. Las claves ausentes significan «cerrado ese día».
 */

export type Semana = Record<string, string[][]>;
export interface Estado {
  abierto: boolean;
  /** Hora de cierre si está abierto (puede ser de madrugada). */
  hasta?: string;
  /** Hora de la próxima apertura HOY si está cerrado. */
  abre?: string | null;
}

const aMinutos = (h: string): number => {
  const [hh, mm] = (h || "0:00").split(":");
  return (parseInt(hh, 10) % 24) * 60 + parseInt(mm || "0", 10);
};
const aHora = (min: number): string =>
  `${String(Math.floor((min % 1440) / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
const cruzaMedianoche = (r: string[]): boolean => aMinutos(r[1]) <= aMinutos(r[0]) && r[1] !== "24:00";

/** Día ISO (1 = lunes … 7 = domingo) y minutos desde medianoche en Europe/Madrid. */
export function diaYMinutosMadrid(fecha: Date = new Date()): { dia: number; minutos: number } {
  const partes = new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(fecha);
  const buscar = (t: string) => partes.find((p) => p.type === t)?.value ?? "";
  const diaTexto = buscar("weekday").toLowerCase().replace(/\.$/, "");
  const DIAS: Record<string, number> = {
    lun: 1, lunes: 1, mar: 2, martes: 2, mié: 3, mie: 3, miércoles: 3, miercoles: 3,
    jue: 4, jueves: 4, vie: 5, viernes: 5, sáb: 6, sab: 6, sábado: 6, sabado: 6, dom: 7, domingo: 7,
  };
  const dia = DIAS[diaTexto];
  if (!dia) throw new Error(`día no reconocido: "${diaTexto}"`);
  const hh = parseInt(buscar("hour"), 10) % 24; // algunos motores devuelven «24» a medianoche
  const mm = parseInt(buscar("minute"), 10);
  return { dia, minutos: hh * 60 + mm };
}

export function estadoAbierto(semana: Semana, dia: number, minutos: number): Estado {
  const hoy = semana[String(dia)] || [];
  const ayer = semana[String(dia === 1 ? 7 : dia - 1)] || [];

  for (const r of hoy) {
    const ini = aMinutos(r[0]);
    const fin = r[1] === "24:00" ? 1440 : aMinutos(r[1]);
    if (cruzaMedianoche(r)) {
      if (minutos >= ini) return { abierto: true, hasta: r[1] };
    } else if (minutos >= ini && minutos < fin) {
      return { abierto: true, hasta: fin === 1440 ? "24:00" : r[1] };
    }
  }
  // Madrugada: puede seguir abierto por una franja de AYER que cruza medianoche.
  for (const r of ayer) {
    if (cruzaMedianoche(r) && minutos < aMinutos(r[1])) return { abierto: true, hasta: r[1] };
  }
  const proximas = hoy
    .map((r) => r[0])
    .map(aMinutos)
    .filter((m) => m > minutos)
    .sort((a, b) => a - b);
  return { abierto: false, abre: proximas.length ? aHora(proximas[0]) : null };
}
