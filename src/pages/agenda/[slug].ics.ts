import type { APIRoute } from "astro";
import agendaData from "@/data/agenda.json";
import type { AgendaFile } from "@/lib/novedades.mjs";
import { textoIcs } from "@/lib/novedades.mjs";

export function getStaticPaths() {
  const datos = agendaData as AgendaFile;
  return datos.items.map((evento) => ({ params: { slug: evento.id }, props: { evento } }));
}

export const GET: APIRoute = ({ props, site }) => {
  const evento = props.evento as AgendaFile["items"][number];
  const origen = site ?? new URL("https://www.elcanaveral.info");
  const pagina = new URL(`/agenda/${evento.id}/`, origen).href;
  return new Response(textoIcs(evento, pagina), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${evento.id}.ics"`,
    },
  });
};
