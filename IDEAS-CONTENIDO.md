# Ideas de contenido y roadmap — elcanaveral.info

> Backlog para convertir el sitio en **EL hub de referencia de El Cañaveral**: no solo un
> directorio de negocios, sino todo lo que un vecino (o quien se plantea mudarse) necesita saber.
> Contenido de utilidad pura, evergreen, **sin competencia local**. Capturado el 2026-06-26.
> Las guías nuevas se publican en **DRIP** (ver HANDOFF.md). Construir con SEO-first.

## 🗺️ Pilares / ideas (priorizadas)

### 1. 🚌 Guía de transporte y movilidad — **DATOS YA INVESTIGADOS (abajo)**
Conexiones de El Cañaveral con Madrid, Coslada, San Fernando y Vicálvaro: autobuses (día y
noche/búhos), Cercanías, Metro cercano, taxi/radio-taxi, VTC (Uber/Cabify/Bolt), en coche/aparcamiento.
Muy buscado ("cómo llegar a El Cañaveral", "autobuses Cañaveral", "búho"). **Listo para montar.**

### 2. 🌳 Guía de espacios públicos
Parques infantiles públicos, parques para perros (pipican), áreas de disfrute, canchas/pistas
deportivas, caminerías — **con mapas de Google embebidos**. Muchos recién remodelados por el
ayuntamiento, con tráfico de gente de otras zonas. NO son negocios (estructura aparte de
`negocios.json`); descubribles con Apify/Maps; reutiliza el mapa con consentimiento (`CookieConsent.astro`).

### 3. 🔑 "Vivir en El Cañaveral" — guía para recién llegados (**KEYSTONE**)
Mega-hub que enlaza transporte + colegios + salud + parques + servicios + precios de vivienda.
Imán de SEO ("vivir en el cañaveral", "mudarse a", "comprar piso en el cañaveral") para un barrio
que crece a tope, y alimenta a las inmobiliarias del directorio.

### 4. 🏛️ Servicios públicos / civismo — **GAP (no están en el directorio de negocios)**
- **Colegios e institutos públicos** (CEIP/IES) — el directorio solo tiene guarderías/academias privadas.
- **Centro de salud público / SUMMA / urgencias**; Hospital del Henares (Coslada).
- **Farmacias de guardia (24h)** y su rotación (hay 24h en la zona, ej. Farmacia Coslada Lado Sur).
- Biblioteca, centro cultural/cívico, Correos, **punto limpio y reciclaje** (horarios contenedores),
  **teléfonos útiles** (policía local, SAMUR, ayuntamiento, averías), empadronamiento/trámites, mercadillo.

### 5. 📰 Blog de actualidad desde `/comunidad`
Minar los grupos/cuentas de FB/IG/X del barrio (ya catalogados en `/comunidad`) para sacar temas de
posts (de qué habla la gente). Sale en drip.

### 6. 🐶 Hubs por afinidad (cruzan categorías)
- **"Guía para dueños de perros"**: pipicanes + veterinarios (14 en datos) + peluquería canina + tiendas de mascotas.
- **"Familias con peques"**: guarderías + parques infantiles + pediatría + ocio infantil.

### 7. 🍽️ Listicles temáticos — **OJO: datos infra-etiquetados**
"con terraza" (solo 10), "a domicilio" (6), "menú del día" (4)… los campos booleanos están poco
poblados → saldrían incompletos. **Antes hay que re-enriquecer con Apify** (el actor trae `additionalInfo`
con amenities: terraza, delivery, accesibilidad…) y mapear esos campos.

### 8. 🖼️ Técnico — optimizar imágenes a WebP (Pack C)
`public/images/negocios/` pesa ~207 MB (1.174 fotos). Convertir a WebP mejora mucho el rendimiento móvil.

---

## 📦 DATOS YA INVESTIGADOS — Transporte de El Cañaveral
*(2026-06-26, fuentes oficiales. Horarios sujetos a cambios → verificar en CRTM/EMT antes de publicar; John confirma in situ.)*

**Autobuses (EMT / interurbanos):**
- **159** — El Cañaveral ↔ Metro **L2 (Alsacia)**; a su paso por **Vicálvaro** conecta con Cercanías y **Metro L9**.
- **E5 (exprés)** — **Manuel Becerra ↔ El Cañaveral** (Blas de Lezo – Ilusión), ~11 paradas, **~30-40 min** al centro.
- **290** — El Cañaveral ↔ **Coslada Central** (Metro L7 + Cercanías) y **CC Plenilunio**.
- **N6 (búho, nocturno)** — **Plaza de Cibeles ↔ El Cañaveral** (la EMT prolongó la N6 hasta el barrio;
  terminal nueva en C. Alcalde Andrés Madrid Dávila / Casa de Tilly). Salidas desde Cibeles dom-jue ~cada 35 min
  (0:00→5:10) y vie-sáb/vísperas mucho más frecuente (hasta 7:00). Verificar horario exacto en CRTM (línea 6506).

**Cercanías:** líneas **C2 y C7** — estación más cercana **Vicálvaro** (~17-19 min andando).
**Metro:** **no hay estación dentro del barrio** (reivindicación vecinal; hay **apeadero de Cercanías en El Cañaveral
planificado** por el Consorcio). Más cercanos: **Coslada Central (L7)** ~23 min, o **Vicálvaro (L9)**.
**Parada de bus más cercana al núcleo:** Miguel Delibes – Alto del Esparragal (~5 min).
**Taxi/VTC:** radio-taxi de la zona (Coslada/San Fernando) y VTC (Uber, Cabify, Bolt) operan en el barrio — confirmar paradas/teléfonos.

**Fuentes:** madrid.es (EMT prolonga búhos N6), comunidad.madrid / crtm.es (línea exprés E5, mejoras de transporte),
emtmadrid.es, moovitapp.com (líneas y paradas). Para horarios en vivo enlazar a CRTM y Moovit en la propia guía.
