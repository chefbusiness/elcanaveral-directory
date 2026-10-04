# Ideas de contenido y roadmap — elcanaveral.info

> Backlog para convertir el sitio en **EL hub de referencia de El Cañaveral**: no solo un
> directorio de negocios, sino todo lo que un vecino (o quien se plantea mudarse) necesita saber.
> Contenido de utilidad pura, evergreen, **sin competencia local**. Capturado el 2026-06-26.
> Las guías nuevas se publican en **DRIP** (ver handoff.md). Construir con SEO-first.
> **Actualizado 2026-10-05 tras GSC #5**: la demanda medida (sección «Demanda REAL medida» más abajo) reordena
> este backlog — primero lo que la gente ya busca (domingos/horarios, urgencias, vivienda, «El Cañaveral»), y las
> guías «mejores X» pasan a ser capa de apoyo de la categoría, no la apuesta principal.

## 🧱 Arquitectura de contenido (pilares del sitio)

Visión: de "directorio de negocios" a **hub de vivir + disfrutar El Cañaveral** (dónde comer, dónde ir, qué hacer, cuándo — todo desde el barrio).

| Pilar | Qué es | Estado |
|---|---|---|
| 🏪 **Directorio** | 286 negocios locales, 4 zonas, filtros zona/afinidad + zona×categoría | ✅ |
| ⭐ **Guías "mejores X"** | rankings de negocios por categoría/zona (drip) | ✅ (32 guías) |
| 🧭 **Utilidad del barrio** | `/transporte` ✅ · `/espacios-publicos` ✅ · `/servicios-publicos` ✅ · keystone `/vivir-en-el-canaveral` ✅ | ✅ |
| 🗺️ **Planes y escapadas** | hub `/escapadas` + filtros de afinidad (5 regiones: sureste/centro/noreste/norte/oeste) | ✅ |
| 🎉 **Fiestas y días especiales** | hub `/fiestas` ✅ (Vicálvaro, Dos de Mayo, San Isidro) — ampliar con más ferias | 🟡 |
| 👥 **Comunidad** | cuentas/redes del barrio | ✅ |
| 📰 **Blog de actualidad** | `/actualidad` + posts (9) con fuente y fecha verificada — rutina repetible | ✅ |

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

## 📊 Demanda REAL medida en GSC #5 (2026-10-05) — construir sobre esto, no sobre intuición

Base: 90 días (07-jul→04-oct), 179 queries visibles (⚠️ Google oculta ~77 % de las impresiones en propiedades de
dominio, así que esto es el mínimo, no el total) + dimensiones de página. **Conclusión estructural: la gente
busca MARCA y CATEGORÍA+barrio, no «los mejores X»** — por eso las 32 guías tienen 0 impresiones.

### Clúster 1 · «¿Abre los domingos / a qué hora?» (el más rentable: el Map Pack no lo responde)
Evidencia: «ahorramas cañaveral» 182i · «alcampo/mi alcampo» 158i · «supermercado cañaveral» 54i · «hiper
cañaveral» 72i · «panaderia bulevar» 43i · «fruteria cañaveral» 41i — **todos con 0-2 clics a posición 6**.
Datos disponibles: **35 fichas con horario de domingo**; 39 con `terraza`; 39 con `delivery`.
→ **Piezas**: «Qué supermercados abren los domingos en El Cañaveral (2026)» · «Panaderías abiertas el domingo» ·
«Fruterías y mercados: horarios y días de mercado». Formato: respuesta directa arriba + tabla con nombre, horario
y teléfono + enlace a la ficha.

### Clúster 2 · Urgencias y servicios fuera de horario
Evidencia: 179 queries visibles incluyen «clinica veterinaria vicalvaro villardondiego 17», «farmacia sonrisas
del cañaveral» (61i, único con clic de salud) y «estanco cerca de mi» (pos 1).
Datos: 2 fichas con 24 h (Mascotiti veterinario urgencias 24 h; Dreamfit).
→ **Piezas**: «Veterinarios con urgencias 24 h cerca de El Cañaveral» · «Farmacias de guardia en El Cañaveral y
Vicálvaro» (gap ya anotado en el punto 4 de arriba) · «Dónde comprar tabaco y sellos: estancos».

### Clúster 3 · Vivienda (intención de alto valor, YA convierte y NO hay página)
Evidencia: «pisos cañaveral alquiler» y «pisos de alquiler en el cañaveral» → **clic en posición 3** ·
«compra de casas con acompañamiento profesional en coslada» pos 3.
Datos: 17 inmobiliarias (todas con teléfono y web) + posts de Cañaveral 11 (45 viviendas públicas) y del parque
comercial. → **Pieza**: «Comprar o alquilar en El Cañaveral: precios, promociones y qué mirar (2026)» (hub que
alimenta a las inmobiliarias del directorio).

### Clúster 4 · «El Cañaveral» como barrio (head term a 88 → cero visibilidad)
Evidencia: «el cañaveral» 88i **pos 88** · «cañaveral tiendas» pos 3 · «cañaveral cerca de mi» · ruido de
desambiguación («cañaveral las gabias» Granada, «meson cañaveral las gabias», «bazar el cañaveral de albacete»).
→ **Pieza**: reforzar `/vivir-en-el-canaveral/` como «El Cañaveral (Vicálvaro, Madrid): guía completa del barrio»
+ nota de desambiguación + enlaces fuertes desde home/hubs y desde `llms.txt`.

### Clúster 5 · Familias (guarderías, inglés, extraescolares)
Evidencia: «escuela infantil aupa» 51i · «mejor guarderia cañaveral» 12i **pos 25** · «escuela infantil ingles
cañaveral» 7i **pos 28** · «escuela infantil el cañaveral» 4i pos 25 · `/educacion/` 147i **pos 19,4**.
→ **Pieza**: retitular la guía de guarderías a «Guarderías y escuelas infantiles en El Cañaveral (0-3 años):
plazas, inglés y cuál elegir» y reforzar `/educacion/` (hoy a 19,4).

### Clúster 6 · Bares, tapas y ocio (sin página que lo cubra)
Evidencia: «bares en el cañaveral madrid» (pos 56) · «bar - cañaveral tapas» · Tapaveral es un evento anual con
tráfico propio. Datos: 24 restaurantes + 12 cafeterías con señales de bar/tapas.
→ **Pieza**: «Bares y tapas en El Cañaveral: dónde tapear» (se refuerza con el post-evento de Tapaveral).

### Lo que NO hay que hacer (aprendizaje GSC #4 + #5 confirmado)
**No invertir más en title/meta de fichas de marca**: `mi-alcampo` 250i/0 clics, `ahorramas` 286i/2c,
`panaderia-bulevar` 190i/0c, `obrador-de-goya` 158i/0c, `escuela-infantil-aupa` 144i/0c — todas a posición 6 y
todas ignoradas porque el Map Pack se lleva el clic. El CTR de una ficha de marca no se arregla con un title.


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
