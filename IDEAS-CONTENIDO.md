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

---

## 🏠 DATOS VERIFICADOS DE VIVIENDA (investigación 2026-10-05) — base para la guía P4

Todo con fuente y fecha. **Ojo con la población: son 27.014 empadronados (ago-2026), no «más de 30.000»** — el
sitio ya está corregido.

**Precio de compra** · Obra nueva libre en El Cañaveral: **4.112 €/m²** (+11,3 % anual) y media de vivienda nueva
**427.000 €** (+18,4 %); es el barrio más caro del sureste (Foro Consultores vía idealista/news, 9-feb-2026).
Comparativa: Ensanche de Vallecas 4.638 €/m², Los Ahijones 4.232, Los Berrocales 4.061, Valdecarros ~3.900.
Segunda mano en la zona estadística «El Cañaveral-Los Berrocales»: 4.666 €/m² (ago-2026) — **agrega Los
Berrocales, no atribuir solo al barrio** (Idílico Realty/Idealista). Solo distrito Vicálvaro: Ambroz 3.667 €/m²,
Casco Histórico 3.606, Valdebernardo-Valderribas 4.120. ⚠️ **No existe dato público de precio medio de un piso
concreto de 2-3 dormitorios en el barrio.**

**Alquiler** · Distrito de Vicálvaro: **1.709 €/mes** (sep-2026, muestra de 82 viviendas; Madrid capital
2.443 €/mes) — Enalquiler. En el barrio no hay media publicada: oferta real de 2 dorm. y 53 m² construidos
**1.021 €/mes** (19 €/m²), VPPL con garaje y trastero, promoción Tectum Cañaveral I (210 viviendas VPPL de 1-3
dorm., comercializa Alkira Living; anuncio de sep-2026 en pisos.com).

**Obra nueva** · AEDAS Homes: promoción **Elion** (90 viviendas de 2-4 dorm., ya vendida) y Freya (vendida)
(aedashomes.com, oct-2026). Grupo Avintia: 9 promociones / 689 viviendas en la Comunidad con promociones en
Vicálvaro, El Cañaveral y Los Ahijones (3-oct-2025). Sureste: 2.414 viviendas iniciadas en 2025 (+37 %) y 1.136
en stock (Foro Consultores, ene-2026).

**Vivienda pública (el gran diferencial del barrio)** · EMVS Madrid: **1.212 viviendas de alquiler asequible en
13 promociones** en El Cañaveral; 868 sorteadas (may-2026), 1.078 finalizadas y 8 promociones entregadas a
sep-2026; los sorteos de **Cañaveral 10 y 11** son a principios de **2027** (Observatorio Inmobiliario 6-may-2026 ·
Nuevo Sureste 21-sep-2026). Renta media 590 €/mes (Cañaveral 5) y horquilla 300-800 €/mes (Cañaveral 9), nunca
más del 30 % de los ingresos. Requisitos EMVS: ingresos ≤3,5 veces el IPREM (referencia: pareja con 2 hijos hasta
~44.000 € brutos/año); 80 % de las viviendas para jóvenes y familias con hijos. Requisitos VPPL (Decreto
74/2009): ingresos ≤7,5 × IPREM y no ser titular de otra vivienda en España. Plan Vive (Decreto 84/2020
modificado el 8-abr-2026): 1,5-5,5 × IPREM (precio básico) y 1,5-7,5 (limitado), con preferencia por 5 años de
empadronamiento en el municipio.

**Trámites** · Empadronamiento: Junta Municipal de Vicálvaro (plaza de Don Antonio de Andrés, s/n). **Cédula de
habitabilidad: en la Comunidad de Madrid no se emite con carácter general** — el control final es la licencia o
declaración responsable de primera ocupación. **IVA obra nueva: 10 %** (4 % para VPO de régimen especial o
promoción pública). **ITP vivienda usada: 6 %** (4 % familia numerosa; 5,4 % efectivo para menores de 35 años
hasta 250.000 €) y AJD 0,75 %; plazo de 30 días hábiles, modelo 600.

**Contexto** · PAU: barrio administrativo desde 2017, ámbito de **538 ha** (100 de zonas verdes); el plan parcial
prevé **14.000 viviendas, 53 % con algún régimen de protección**; primeros vecinos en el 1T de 2016. A 1-jun-2025:
142 promociones entregadas, 19 en construcción, 9 en comercialización. **Población: 27.014 (ago-2026)**. Educación:
la Comunidad creará 1.000 plazas escolares públicas en el barrio; IES con 24 aulas de ESO + 8 de Bachillerato (fin
previsto curso 2026/27 o principios de 2027 según la fuente). Parque comercial OMO Retail: 77.000 m², >50 locales,
2.200 plazas de aparcamiento, 13 pistas de pádel cubiertas, apertura objetivo Navidad 2027.

**A EVITAR al escribir (evita repetir el error de los 30.000)** · No presentar 427.000 € como precio de un 2-3
dormitorios. No atribuir los 4.666 €/m² solo a El Cañaveral (incluye Los Berrocales). No dar una única fecha
cerrada para el instituto. No publicar «futura estación de metro» (solo es reclamo comercial de una promotora,
sin fuente oficial). No citar promotoras sin promoción verificada en el barrio. Las páginas de sede.madrid.es y
madrid.es bloquean el acceso automatizado: sus URLs se citan como ubicación oficial, sin verificar contenido.

---

## 📏 VOLUMEN REAL medido con DataForSEO (2026-10-05) — esto reordena el backlog

51 keywords medidas (Google Ads vía DataForSEO, España/español, **$0,09**; raw en `.tmp/kw-measured.json`).
⚠️ Y ojo con la conclusión: **el formato «mejores X» tiene CERO volumen** («mejores cafeterías cañaveral» 0,
«mejores restaurantes cañaveral» 0) — las guías no fallan por SEO, fallan porque nadie busca eso.

| Keyword | Vol/mes | CPC | Qué implica |
|---|---|---|---|
| **el cañaveral** | **40.500** | 0,20 | Estamos en **pos 88**. El mayor hueco del sitio con diferencia. |
| el cañaveral madrid | 6.600 | 0,17 | Refuerza lo mismo: página «El Cañaveral (Madrid)». |
| **restaurantes cañaveral** | **1.900** | 0,67 | `/restaurantes/` tiene 45 fichas y **2 impresiones** → arreglo de categoría (P5). |
| pisos en el cañaveral | 1.600 | 0,12 | + obra nueva 260 + alquiler 170 + pisos cañaveral madrid 170 + comprar piso 140 → **~2.340/mes de intención de vivienda** (CPC alto en «comprar piso» y «alquiler»). |
| estanco el cañaveral | 1.300 | 0,02 | Ya rankeamos 6,9 y el Map Pack se lleva el clic → pieza informativa (horarios/domingos/sellos). |
| **bares cañaveral** | **590** | — | **No hay ninguna página que lo cubra.** |
| megafruta | 590 | 0,02 | Marca (ficha). |
| ahorramas cañaveral | 320 | 0,05 | Marca (ficha, 0 clics). |
| **que supermercados abren los domingos** | **320** | 0,12 | + «supermercados abiertos los domingos» 210 (**CPC 2,20**) → **~530/mes**: P1a validada. |
| **peluquerías cañaveral** | **320** | 0,23 | Categoría con volumen y sin intro/FAQ (P5). |
| obra nueva el cañaveral | 260 | 0,68 | P4. |
| supermercado cañaveral | 210 | — | P5 (ya tiene FAQ). |
| farmacia de guardia coslada | 210 | 0,04 | + farmacia 24 h Coslada 170 + farmacia de guardia Vicálvaro 110 → **~490/mes**: P1b validada. |
| gimnasios cañaveral | 210 | 0,29 | P5 (`/deporte/`). |
| alquiler el cañaveral / pisos cañaveral madrid / comprar piso el cañaveral | 170 / 170 / 140 | 1,32 / 0,12 / 0,08 | P4. |
| colegios el cañaveral | 110 | 0,59 | P5 (`/educacion/`) + contenido de servicios públicos. |
| veterinario cañaveral | 90 | 1,31 | CPC alto y volumen real: la pieza de urgencias debe incluir el veterinario general. |
| inmobiliarias cañaveral | 40 | 1,05 | P5. |
| terrazas (cañaveral+vicalvaro+coslada) + brunch | **~50** | — | **P1c se cae**: no da para página propia, va como sección/bloque dentro de otra pieza. |
| el cañaveral vicalvaro · barrio el cañaveral · vivir en el cañaveral | 70 / 90 / 20 | | Colas del head term. |
| **que ver en el cañaveral · cuanto cuesta vivir en el cañaveral · parking · piscina** | **0-10** | | Descartados: no se buscan (no inventar páginas). |
| **mejores cafeterías cañaveral · mejores restaurantes cañaveral** | **0** | | **El formato de las 32 guías no tiene demanda.** |

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
