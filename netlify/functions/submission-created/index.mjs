// Evento submission-created de Netlify Forms.
// Si SHEETS_WEBHOOK_URL está vacía, no hace nada: el CRM queda apagado
// y las notificaciones por email siguen su camino, este archivo no las toca.
import { filaDesdeEventoNetlify, webhookActivo } from "./lead-row.mjs";

function leerCuerpo(event) {
  if (!event?.body) return {};
  const raw = event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body;
  return JSON.parse(raw);
}

/** Apps Script responde 302 y un fetch que sigue el redirect convierte el POST en GET. Reenviamos el POST. */
export async function enviarAlWebhook(url, fila, fetchImpl = fetch) {
  const payload = JSON.stringify(fila);
  const init = {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: payload,
    redirect: "manual",
  };
  const primero = await fetchImpl(url, init);
  if (primero.status >= 200 && primero.status < 300) return primero;
  if (primero.status >= 300 && primero.status < 400) {
    const destino = primero.headers.get("location") || "";
    if (!destino.startsWith("https://")) return primero;
    return fetchImpl(destino, { ...init, redirect: "follow" });
  }
  return primero;
}

export async function handler(event) {
  const url = (process.env.SHEETS_WEBHOOK_URL || "").trim();
  if (!webhookActivo(url)) {
    return { statusCode: 200, body: JSON.stringify({ ok: true, skipped: true }) };
  }
  let fila;
  try {
    fila = filaDesdeEventoNetlify(leerCuerpo(event));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ ok: false }) };
  }
  try {
    const respuesta = await enviarAlWebhook(url, fila);
    if (respuesta.status < 200 || respuesta.status >= 300) {
      console.error("sheets webhook status", respuesta.status);
      return { statusCode: 502, body: JSON.stringify({ ok: false }) };
    }
  } catch {
    console.error("sheets webhook error");
    return { statusCode: 502, body: JSON.stringify({ ok: false }) };
  }
  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
}
