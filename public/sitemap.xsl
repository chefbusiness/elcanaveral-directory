<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"
    doctype-system="about:legacy-compat"/>

  <!-- Agrupa las URLs por su primera sección de ruta (categoría) -->
  <xsl:key name="sections" match="sitemap:url"
    use="substring-before(concat(substring-after(sitemap:loc,'elcanaveral.info/'),'/'),'/')"/>

  <xsl:template match="/">
    <html lang="es">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <meta name="robots" content="noindex,follow"/>
        <title>Mapa del sitio · El Cañaveral Info</title>
        <style>
          :root{--brand:#2952a3;--brand900:#1e3a72;--accent:#f97316;--bg:#f7f7f5;--card:#fff;--line:#e7e5e4;--muted:#78716c;--text:#1c1917}
          *{box-sizing:border-box}
          body{margin:0;background:var(--bg);color:var(--text);font-family:system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;line-height:1.5}
          a{color:var(--brand);text-decoration:none}
          a:hover{text-decoration:underline}
          .wrap{max-width:1040px;margin:0 auto;padding:24px 18px 64px}
          header.top{display:flex;align-items:center;gap:12px;padding:6px 0 18px;border-bottom:2px solid var(--brand);margin-bottom:22px}
          .logo{width:38px;height:38px;border-radius:9px;background:var(--brand);color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center;font-size:15px;letter-spacing:-.5px}
          .brand b{color:var(--brand900)}
          h1{font-size:22px;margin:0;color:var(--brand900)}
          .lead{color:var(--muted);font-size:14px;margin:4px 0 0}
          .meta{display:flex;flex-wrap:wrap;gap:10px;margin:18px 0 8px}
          .pill{background:var(--card);border:1px solid var(--line);border-radius:999px;padding:5px 12px;font-size:13px;color:var(--muted)}
          .pill b{color:var(--brand900)}
          .nav{display:flex;flex-wrap:wrap;gap:6px;margin:14px 0 26px}
          .nav a{background:#eef2fb;border:1px solid #dbe4f7;border-radius:7px;padding:4px 10px;font-size:12.5px;color:var(--brand900)}
          .nav a:hover{background:var(--brand);color:#fff;text-decoration:none}
          section.grp{background:var(--card);border:1px solid var(--line);border-radius:12px;margin:0 0 16px;overflow:hidden}
          .grp h2{margin:0;font-size:15px;padding:12px 16px;background:linear-gradient(90deg,#eef2fb,#fff);border-bottom:1px solid var(--line);color:var(--brand900);display:flex;justify-content:space-between;align-items:center}
          .grp h2 .n{font-weight:600;color:var(--muted);font-size:12.5px;background:#fff;border:1px solid var(--line);border-radius:999px;padding:2px 9px}
          table{width:100%;border-collapse:collapse;font-size:13.5px}
          td{padding:8px 16px;border-top:1px solid #f1efec;vertical-align:top}
          tr:first-child td{border-top:0}
          tr:hover td{background:#fafaf9}
          td.idx{color:#a8a29e;width:42px;text-align:right;font-variant-numeric:tabular-nums}
          td.url{word-break:break-all}
          .path{color:var(--muted)}
          footer{margin-top:30px;color:var(--muted);font-size:12.5px;text-align:center;border-top:1px solid var(--line);padding-top:16px}
          .idxlist td{padding:10px 16px}
        </style>
      </head>
      <body>
        <div class="wrap">
          <header class="top">
            <div class="logo">EC</div>
            <div class="brand">
              <h1>Mapa del sitio (sitemap)</h1>
              <p class="lead"><b>elcanaveral.info</b> — vista legible del sitemap. Los buscadores leen el XML; esta página es para navegar la estructura.</p>
            </div>
          </header>
          <xsl:apply-templates select="sitemap:sitemapindex"/>
          <xsl:apply-templates select="sitemap:urlset"/>
          <footer>
            Generado automáticamente en cada publicación · El Cañaveral Info
          </footer>
        </div>
      </body>
    </html>
  </xsl:template>

  <!-- ÍNDICE de sitemaps -->
  <xsl:template match="sitemap:sitemapindex">
    <div class="meta">
      <span class="pill"><b><xsl:value-of select="count(sitemap:sitemap)"/></b> sitemaps</span>
    </div>
    <section class="grp">
      <h2>Sitemaps <span class="n"><xsl:value-of select="count(sitemap:sitemap)"/></span></h2>
      <table class="idxlist">
        <xsl:for-each select="sitemap:sitemap">
          <tr>
            <td class="idx"><xsl:value-of select="position()"/></td>
            <td class="url"><a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a></td>
          </tr>
        </xsl:for-each>
      </table>
    </section>
  </xsl:template>

  <!-- LISTA de URLs agrupada por categoría -->
  <xsl:template match="sitemap:urlset">
    <div class="meta">
      <span class="pill"><b><xsl:value-of select="count(sitemap:url)"/></b> URLs</span>
      <span class="pill"><b><xsl:value-of select="count(sitemap:url[generate-id() = generate-id(key('sections', substring-before(concat(substring-after(sitemap:loc,'elcanaveral.info/'),'/'),'/'))[1])])"/></b> secciones</span>
    </div>

    <!-- Navegación por secciones -->
    <nav class="nav">
      <xsl:for-each select="sitemap:url[generate-id() = generate-id(key('sections', substring-before(concat(substring-after(sitemap:loc,'elcanaveral.info/'),'/'),'/'))[1])]">
        <xsl:sort select="substring-before(concat(substring-after(sitemap:loc,'elcanaveral.info/'),'/'),'/')"/>
        <xsl:variable name="sec" select="substring-before(concat(substring-after(sitemap:loc,'elcanaveral.info/'),'/'),'/')"/>
        <a href="#s-{$sec}">
          <xsl:choose>
            <xsl:when test="$sec = ''">Inicio</xsl:when>
            <xsl:otherwise><xsl:value-of select="translate($sec,'-',' ')"/></xsl:otherwise>
          </xsl:choose>
          <xsl:text> (</xsl:text><xsl:value-of select="count(key('sections',$sec))"/><xsl:text>)</xsl:text>
        </a>
      </xsl:for-each>
    </nav>

    <!-- Un bloque por sección -->
    <xsl:for-each select="sitemap:url[generate-id() = generate-id(key('sections', substring-before(concat(substring-after(sitemap:loc,'elcanaveral.info/'),'/'),'/'))[1])]">
      <xsl:sort select="substring-before(concat(substring-after(sitemap:loc,'elcanaveral.info/'),'/'),'/')"/>
      <xsl:variable name="sec" select="substring-before(concat(substring-after(sitemap:loc,'elcanaveral.info/'),'/'),'/')"/>
      <section class="grp" id="s-{$sec}">
        <h2>
          <span>
            <xsl:choose>
              <xsl:when test="$sec = ''">Inicio y páginas raíz</xsl:when>
              <xsl:otherwise>/<xsl:value-of select="$sec"/>/</xsl:otherwise>
            </xsl:choose>
          </span>
          <span class="n"><xsl:value-of select="count(key('sections',$sec))"/><xsl:choose><xsl:when test="count(key('sections',$sec)) = 1"> URL</xsl:when><xsl:otherwise> URLs</xsl:otherwise></xsl:choose></span>
        </h2>
        <table>
          <xsl:for-each select="key('sections',$sec)">
            <xsl:sort select="sitemap:loc"/>
            <tr>
              <td class="idx"><xsl:value-of select="position()"/></td>
              <td class="url">
                <a href="{sitemap:loc}">
                  <xsl:value-of select="sitemap:loc"/>
                </a>
              </td>
            </tr>
          </xsl:for-each>
        </table>
      </section>
    </xsl:for-each>
  </xsl:template>

</xsl:stylesheet>
