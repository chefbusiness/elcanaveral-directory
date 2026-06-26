import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://www.elcanaveral.info",
  integrations: [
    sitemap({
      // Fuera del sitemap las páginas noindex (legales): no enviar señales contradictorias a Google.
      filter: (page) => !/\/(aviso-legal|terminos|privacidad|cookies)\/?$/.test(page),
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
