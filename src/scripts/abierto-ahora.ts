// Estado «abierto ahora» en el navegador.
//
// Por qué en cliente: es lo único correcto en un sitio estático (en el build se quedaría congelado en
// la hora del deploy y el visitante puede llegar a cualquier hora). El horario ya viene normalizado
// por día desde el build en `data-horario` ({ "1": [["07:00","24:00"]], … }, 1 = lunes), así que al
// navegador solo le queda comparar horas. La lógica vive en @/lib/abierto para poder probarla.
import { estadoAbierto, diaYMinutosMadrid, type Semana } from "@/lib/abierto";

function pintar(el: HTMLElement) {
  let semana: Semana | null = null;
  try {
    semana = JSON.parse(el.getAttribute("data-horario") || "null");
  } catch {
    semana = null;
  }
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
  const pintarTodos = () => document.querySelectorAll<HTMLElement>("[data-abierto-ahora]").forEach(pintar);
  pintarTodos();
  // Se repinta cada minuto: si alguien deja la página abierta, el estado no se queda obsoleto.
  setInterval(pintarTodos, 60_000);
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarAbiertoAhora);
  } else {
    iniciarAbiertoAhora();
  }
}
