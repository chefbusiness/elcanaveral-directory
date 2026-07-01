# Ideas de contenido y roadmap — elcanaveral.info

> Backlog para convertir el sitio en **EL hub de referencia de El Cañaveral**: no solo un
> directorio de negocios, sino todo lo que un vecino (o quien se plantea mudarse) necesita saber.
> Contenido de utilidad pura, evergreen, **sin competencia local**. Capturado el 2026-06-26.
> Las guías nuevas se publican en **DRIP** (ver HANDOFF.md). Construir con SEO-first.

## 🧱 Arquitectura de contenido (pilares del sitio)

Visión: de "directorio de negocios" a **hub de vivir + disfrutar El Cañaveral** (dónde comer, dónde ir, qué hacer, cuándo — todo desde el barrio).

| Pilar | Qué es | Estado |
|---|---|---|
| 🏪 **Directorio** | 256 negocios locales, 4 zonas, filtro de zona | ✅ |
| ⭐ **Guías "mejores X"** | rankings de negocios por categoría/zona (drip) | ✅ (29 guías) |
| 🧭 **Utilidad del barrio** | `/transporte` ✅ · `/espacios-publicos` ✅ · `/servicios-publicos` ✅ · keystone `/vivir-en-el-canaveral` ✅ | ✅ |
| 🗺️ **Planes y escapadas** | hub `/escapadas` + filtro afinidad ✅. Piloto **sureste** live; faltan centro/noreste/norte/oeste | 🟡 piloto |
| 🎉 **Fiestas y días especiales** | hub `/fiestas` ✅ (Vicálvaro, Dos de Mayo, San Isidro). Ampliar con más | 🟡 |
| 👥 **Comunidad** | cuentas/redes del barrio | ✅ |
| 📰 **Blog de actualidad** | posts temáticos (de /comunidad) | ⬜ pendiente |

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

### 8. 🖼️ Técnico — optimizar imágenes a WebP (Pack C) ✅ HECHO (2026-06-27)
Las 1.195 imágenes migradas de JPG a WebP (q80): **215 MB → 135 MB (-37%)**. Refs actualizadas en
negocios.json/espacios.json/og/hero, JPG eliminados, verificado visualmente. Mejora LCP en móvil.

### 9. 🗺️ Planes y escapadas DESDE El Cañaveral (idea de John, 2026-06-27) — PILAR NUEVO
Qué hacer y a dónde ir un finde/día, organizado por **regiones de Madrid relativas al barrio**:
**Guía del sureste / noreste / norte / oeste / centro de Madrid**. Dentro, cualquier tipo de sitio
(pueblo, parque, museo, complejo, hípica/equino, embalse, ruta…), siempre con el marco **"desde El Cañaveral"**
(distancia / cómo llegar). Caso de uso real de John: finde con su mujer, su hija y su perrita pomerania, sin
saber a dónde ir. → Clave: **filtros de afinidad** transversales: **con niños · con perro · gratis · naturaleza ·
cultura · plan de un día**. Estructura: hub `/escapadas` (o `/que-hacer`) → guía por región → fichas de sitio con mapa.
Contenido editorial + algunos descubribles por Apify/Maps (parques, museos). Imán de tráfico amplio (no solo barrio).

### 10. 🎉 Fiestas y días especiales del barrio y alrededores (idea de John, 2026-06-27) — PILAR NUEVO
Ferias y fiestas locales, **cada una en su propia guía** (no un feed mezclado): **Ferias de Vicálvaro**
(¡ahora mismo!), **Ferias de Coslada**, **Día de la Comunidad de Madrid** (2 may), San Isidro, día/fiestas de
cada localidad, y **Día del Cañaveral** si existe. Contenido evergreen (se repiten cada año) + se actualiza con
fechas; conecta con el **blog de actualidad** (cuando una feria está en marcha). Hub `/fiestas` (o `/agenda`).
**Timely:** las Ferias de Vicálvaro están ahora → primera ficha con tráfico inmediato.

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

---

## 🆕 Frentes "desde/cerca del Cañaveral" (idea de John, 2026-06-28)

Patrón potente de intención hiperlocal: contenido sobre salir/comprar/disfrutar **desde** El Cañaveral.

**✅ HECHOS (2026-06-28):**
- **☀️ Escapadas de verano y niños** → `/escapadas`: nueva afinidad 💦 *Piscinas y baño* + sitios reales
  (Faunia en Vicálvaro, Parque Europa Torrejón gratis, piscinas municipales Margot Moles / San Blas /
  San Fernando, Warner Beach, embalse de San Juan, Las Presillas).
- **🛍️ `/compras`** → outlets (Getafe Style Outlets/Nassica, Las Rozas Village, Las Rozas Style Outlets,
  SS Reyes) + centros comerciales cercanos (Plenilunio, Parque Corredor, La Gavia, Gran Plaza 2).
- **🛵 `/comida-a-domicilio`** → ranking bayesiano de restaurantes que reparten (datos reales Google;
  re-enriquecidos con Apify para flags `delivery` precisos) + editorial de apps (Glovo/Uber/Just Eat) +
  bloque de marcas virtuales a validar.
- **📰 `/actualidad`** (blog de noticias estrenado) → primer post: el mayor parque comercial de Madrid en
  El Cañaveral (77.000 m², Mercadona/Lidl/McDonald's, 13 pistas pádel, finales 2027, OMO Retail).
  **Regla: solo hechos reales con fuente.**

**⬜ Ideas guardadas del mismo patrón (para cuando toque):**
- ✅ 🛒 **Mercados y mercadillos** (`/mercadillos`, HECHO 2026-06-28): mercadillos semanales de Vicálvaro (jue), Coslada y San Fernando (vie) + mercado municipal + temáticos.
- ✅ 🎢 **Más planes con niños** (HECHO 2026-07-01): Zoo Aquarium, Parque de Atracciones, El Bosque Encantado y Atlantis Aquarium (Xanadú) añadidos a escapadas (40 sitios, 24 con-niños).
- 📰 **Alimentar `/actualidad`** (2 posts ya: parque comercial + verano/cine 2026): aperturas, eventos, obras, transporte — John aporta, se redacta con fuente. Fuentes locales útiles: nuevosureste.es, avelcanaveral.es, vibecanaveral.es, diario.madrid.es (Vicálvaro).
- ✅ 🐶 Hub **con perro** (`/con-perro`, HECHO 2026-06-28): áreas caninas + escapadas con-perro + veterinarios/tiendas/peluquerías del directorio (filtrando ruido). Pendiente: flag dog-friendly real en bares/terrazas (no existe aún).

**✅ 🧹 Calidad de datos (HECHO 2026-06-28):** recategorizadas las entradas mal clasificadas de `mascotas` → Rentokil a `hogar`, digitanimal a `servicios-profesionales`. La categoría `mascotas` queda limpia (18).
