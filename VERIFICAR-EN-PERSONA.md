# Verificar a pie de calle (El Cañaveral)

Negocios con datos dudosos que conviene confirmar in situ (John vive en el barrio).

| Negocio | slug | Duda | Acción |
|---|---|---|---|
| **Obramat El Cañaveral** | `obramat-canaveral` | **Resuelto (2026-11-26).** No existe todavía: es una apertura prevista a finales de 2027 en el Omo Cañaveral Retail Park (en obras). La dirección «Av. de Miguel Delibes, 150» y el horario que tenía la ficha no estaban verificados. Fuentes: [Alimarket, 25-nov-2026](https://www.alimarket.es/construccion/noticia/435060/obramat-reforzara-su-presencia-en-madrid-con-la-apertura-de-su-septimo-almacen) y [nota de prensa de Obramat, 24-nov-2026](https://canaldis.com/mediahubs/obramat/notas-de-prensa/obramat-abre-el-proceso-de-seleccion-para-su-nuevo-almacen-de-el-canaveral). | Hecho: ficha convertida en «próxima apertura» (`estado: proxima-apertura`, `aperturaPrevista: finales de 2027`), sin horario, sin dirección con número, sin fotos de otros almacenes y `featured: false`. Revisar cuando abra. |
| **Mediadores Inmobiliarios El Cañaveral** | `mediadores-inmobiliarios-canaveral` | La búsqueda en Google lo cruzó con **SM Homes** (mismo teléfono que `sm-homes-el-canaveral`). Sin ficha propia en Google. | Confirmar si es un negocio distinto de SM Homes o un duplicado. Si es duplicado → fusionar/eliminar. |

## Datos geográficos corruptos (detectado 2026-09-27 al montar el JSON-LD)

Cuatro fichas traen **coordenadas de otro país/ciudad** (mismo scrape de Google Places → el `placeId` de esas
fichas tampoco es fiable). El schema ya no publica `geo` en ellas y busca el mapa **por dirección**, pero el
dato de origen sigue mal: conviene confirmar el local real y, si toca, re-enriquecer la ficha.

| Ficha | slug | Coordenadas guardadas | Qué son en realidad |
|---|---|---|---|
| Lidl El Cañaveral | `lidl-canaveral` | 50.71708, 10.46791 | Alemania |
| Family Mini Market | `family-mini-market` | 10.9912, −63.8208 | Venezuela |
| García y Asociados Asesoría | `garcia-asociados-asesoria` | 4.6070, −74.0739 | Bogotá (Colombia) |
| Mercadona San Fernando | `mercadona-san-fernando` | 36.4758, −6.2006 | Cádiz |

> Regla añadida al código: `generateLocalBusinessSchema` (`src/lib/directory.ts`) descarta `geo` fuera de la
> caja del área cubierta (lat 40.2-40.6 / lng −3.95 a −3.2) y, en esas fichas, deja de fiarse del `placeId`.

> Resuelto el 2026-06-25: la ficha "McDonald's El Cañaveral" era en realidad **Burger King** → renombrada a `burger-king-canaveral` con redirect 301.
> Corregido el 2026-11-04: esa ficha no está en la avenida Miguel Delibes 80 (esa dirección es Obrador de Goya). Burger King está en la avenida Miguel Delibes, 55.

## Aperturas anunciadas (alta 2026-08-21, sin abrir todavía)

- [ ] **BunBun — Açaí, Brunch & Bakery** (`/cafeterias/bunbun-canaveral/`) — Av. de Miguel Delibes, "esquina
      de Elías" según una vecina en X. Falta: **número exacto**, qué calle es "Elías" y **fecha de apertura**.
      No aparece aún en bunbun.es ni en Google Maps.
- [ ] **Música de los Ríos** (`/educacion/musica-de-los-rios-canaveral/`) — Av. de Blas de Lezo esq. calle
      Diálogo. Falta: **escanear el QR del cartel** para confirmar si es la misma escuela que la de Chamberí
      (Fernández de los Ríos, 30), + dirección exacta, teléfono y fecha de apertura.
