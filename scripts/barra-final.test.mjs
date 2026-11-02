import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { canonicalHref, canonicalPath, debeRedirigirABarra } from "../src/lib/canonical.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("la canonical de una página lleva barra y la de un archivo no", () => {
  assert.equal(canonicalPath("/educacion"), "/educacion/");
  assert.equal(canonicalPath("/educacion/"), "/educacion/");
  assert.equal(canonicalPath("/"), "/");
  assert.equal(canonicalPath("/supermercados/coviran-plus"), "/supermercados/coviran-plus/");
  assert.equal(canonicalPath("/zona/el-canaveral/supermercados"), "/zona/el-canaveral/supermercados/");
  assert.equal(canonicalPath("/sitemap-0.xml"), "/sitemap-0.xml");
  assert.equal(canonicalPath("/llms.txt"), "/llms.txt");
  assert.equal(canonicalPath("/agenda/tapaveral-2026.ics"), "/agenda/tapaveral-2026.ics");
  assert.equal(
    canonicalHref("/salud/fisioterapia-escalante"),
    "https://www.elcanaveral.info/salud/fisioterapia-escalante/",
  );
});

test("el 301 solo aplica a páginas sin barra", () => {
  assert.equal(debeRedirigirABarra("/hogar/obramat-canaveral"), true);
  assert.equal(debeRedirigirABarra("/hogar/obramat-canaveral/"), false);
  assert.equal(debeRedirigirABarra("/"), false);
  assert.equal(debeRedirigirABarra("/robots.txt"), false);
  assert.equal(debeRedirigirABarra("/.netlify/functions/submission-created"), false);
});

test("Astro, Netlify y el layout declaran barra final", () => {
  const astro = readFileSync(path.join(root, "astro.config.mjs"), "utf8");
  const toml = readFileSync(path.join(root, "netlify.toml"), "utf8");
  const edge = readFileSync(path.join(root, "netlify/edge-functions/barra-final.js"), "utf8");
  const layout = readFileSync(path.join(root, "src/layouts/BaseLayout.astro"), "utf8");
  assert.match(astro, /trailingSlash:\s*"always"/);
  assert.match(toml, /pretty_urls\s*=\s*true/);
  assert.match(toml, /function\s*=\s*"barra-final"/);
  assert.match(edge, /301/);
  assert.match(edge, /debeRedirigirABarra/);
  assert.match(layout, /canonicalHref\(/);
});
