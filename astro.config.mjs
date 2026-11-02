import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import { createLastmodLookup } from "./scripts/sitemap-lastmod.mjs";

const lastmodDe = createLastmodLookup();

export default defineConfig({
  site: "https://www.elcanaveral.info",
  // Las páginas viven en dist/<ruta>/index.html. La canonical y el 301 usan esa forma.
  trailingSlash: "always",
  integrations: [
    sitemap({
      // Fuera del sitemap las páginas noindex (legales y la confirmación de formularios).
      filter: (page) =>
        !/\.ics$/.test(page) && !/\/(aviso-legal|terminos|privacidad|cookies|gracias)\/?$/.test(page),
      // lastmod = fecha de la ficha, o el commit del dato o de la página. Nunca «hoy» para todo.
      serialize(item) {
        const lastmod = lastmodDe(item.url);
        if (lastmod) item.lastmod = lastmod;
        return item;
      },
      // Hoja de estilo XSL: hace legible el sitemap en el navegador (los buscadores usan el XML crudo).
      xslURL: "/sitemap.xsl",
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  i18n: {
    defaultLocale: "es",
    locales: ["es"],
    routing: { prefixDefaultLocale: false },
  },
});
