// Estado «abierto ahora» en el navegador.
//
// Por qué en cliente: es lo único correcto en un sitio estático (en el build se quedaría congelado en
// la hora del deploy y el visitante puede llegar a cualquier hora). El horario ya viene normalizado
// por día desde el build en `data-horario` ({ "1": [["07:00","24:00"]], … }, 1 = lunes), así que al
// navegador solo le queda comparar horas. La lógica vive en @/lib/abierto para poder probarla.
import { estadoAbierto, diaYMinutosMadrid, type Semana } from "@/lib/abierto";

/** «1:0700-2030;5:0930-2400,1700-2000» → { "1": [["07:00","20:30"]], … } (formato compacto del build). */
function descompactar(txt: string | null): Semana | null {
  if (!txt) return null;
  const semana: Semana = {};
  for (const trozo of txt.split(";")) {
    const [dia, rangos] = trozo.split(":");
    if (!dia || !rangos) continue;
    const lista = rangos.split(",").map((r) => {
      const [a, b] = r.split("-");
      const hora = (x: string) => `${x.slice(0, 2)}:${x.slice(2, 4)}`;
      return [hora(a), b === "2400" ? "24:00" : hora(b)];
    });
    semana[dia] = lista;
  }
  return Object.keys(semana).length > 0 ? semana : null;
}

function pintar(el: HTMLElement) {
  const semana = descompactar(el.getAttribute("data-horario"));
  if (!semana) return;

  let estado;
  try {
    const { dia, minutos } = diaYMinutosMadrid();
    estado = estadoAbierto(semana, dia, minutos);
  } catch {
    return; // si el navegador no sabe la hora de Madrid, se deja el texto neutro
  }

  const texto = el.querySelector(".js-abierto-texto");
  const punto = el.querySelector(".js-abierto-punto");
  if (!texto || !punto) return;

  el.classList.remove("bg-warm-100", "text-gray-500", "bg-emerald-50", "text-emerald-700");
  punto.classList.remove("bg-gray-400", "bg-emerald-500");

  if (estado.abierto) {
    texto.textContent = estado.hasta === "24:00" ? "Abierto ahora" : `Abierto · hasta ${estado.hasta}`;
    el.classList.add("bg-emerald-50", "text-emerald-700");
    punto.classList.add("bg-emerald-500");
  } else {
    texto.textContent = estado.abre ? `Cerrado · abre ${estado.abre}` : "Cerrado ahora";
    el.classList.add("bg-warm-100", "text-gray-500");
    punto.classList.add("bg-gray-400");
  }
  el.setAttribute("data-abierto", estado.abierto ? "1" : "0");
  // El filtro de listados lee el estado de la tarjeta, no del badge.
  const tarjeta = el.closest("[data-negocio]");
  if (tarjeta) tarjeta.setAttribute("data-abierto", estado.abierto ? "1" : "0");
  // Avisa al filtro de servicios para que reevalúe (puede haber «Abierto ahora» activo).
  document.dispatchEvent(new CustomEvent("abierto:listo"));
}

export function iniciarAbiertoAhora() {
  const pintarTodos = () => {
    // Con la pestaña en segundo plano no se repinta: no se ve y solo gasta batería.
    if (typeof document !== "undefined" && document.hidden) return;
    document.querySelectorAll<HTMLElement>("[data-abierto-ahora]").forEach(pintar);
  };
  pintarTodos();
  // Se repinta cada minuto solo si la pestaña está visible (y al volver a ella).
  setInterval(pintarTodos, 60_000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) pintarTodos();
  });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarAbiertoAhora);
  } else {
    iniciarAbiertoAhora();
  }
}
