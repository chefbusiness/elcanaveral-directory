# AGENTS.md

## Regla de imagen

**Vigente desde el 20-nov-2026.** Sustituye a cualquier regla anterior de imágenes.

#### 1. Modelo
- **GPT Image 2.6 en Higgsfield (`gpt_image_2_6`), `quality: high`, `resolution: 2k`**, para webs e Instagram.
- Una imagen por hueco. Solo se repite (máximo 1 vez) si hay un defecto claro (ver lista de comprobación). Sin variantes «por si acaso».
- No usar otros modelos para imágenes publicables. El modelo por defecto de calidad baja/1K no vale para publicar.

#### 2. Resolución y formatos
- Resolución mínima de generación: **2K**. Nunca se publica una imagen reescalada desde algo menor.
- **Web:** la relación de aspecto del hueco (normalmente 16:9; si el hueco es otro, genera con la relación más cercana y recorta). Exportar con el nombre, formato y dimensiones exactos que espera el repositorio.
- **Instagram (feed):** 4:5, **1080×1350**.
- **Stories / Reels:** 9:16, 1080×1920.
- **LinkedIn:** 4:5 o 2:3.
- **X:** 4:5 o 1:1.
- **En redes sociales no se publica 16:9 horizontal.**
- Guardar siempre el original de 2K junto a la copia exportada.

#### 3. Prohibido el stock
- **Prohibidos los bancos de imágenes** (Pexels, Unsplash, Pixabay, Freepik, Shutterstock, etc.), también «gratuitos» y también para fondos o detalles.
- **Se permiten personas y manos.**

#### 4. Plantilla base de prompt (en inglés)
Cambiar solo lo que va entre `[ ]`. Una escena, un sujeto principal, un tipo de luz.

```
[Documentary editorial | Candid documentary | Reportage] photograph [SCENE: who does what, where, in which Spanish setting, at what time of day]. [KEY DETAILS: 3-5 concrete objects, food or textures, described as slightly imperfect]. [LIGHT: real sources and their colour, e.g. warm tungsten pendant lamps mixed with cool dusk light from a window on the left], uneven natural shadows. Shot on a [CAMERA BODY, e.g. Canon EOS R5 / Sony A7 III / Nikon Z6] with a [LENS, e.g. 35mm f/1.8], handheld, ISO [800-3200], [shallow depth of field], subtle natural film grain, natural colour with slightly crushed shadows, [people: true-to-life skin with pores and small imperfections, relaxed natural expressions, correct hands and fingers]. No text, no logos, no signs, no readable writing anywhere. Not a stock photo, not glossy, not over-saturated, no HDR, no plastic skin.
```
Reglas del prompt: ambientar en España cuando tenga sentido (calle, barra, mercado, comedor); describir la comida de forma creíble y algo irregular; nombrar cámara y objetivo reales; los tickets, cartas y rótulos se piden «blurry paper strips» o en blanco.

#### 5. Lo que hace que una imagen parezca de IA (evitar)
- Luz uniforme y «de estudio» o excesivamente cinematográfica (naranja/azul) en toda la escena.
- Piel lisa, simétrica, de cera; caras idénticas repetidas; sonrisas de anuncio.
- Manos con dedos de más o de menos, fusionados o que atraviesan objetos.
- Texto o logotipos inventados en carteles, cartas, delantales, tickets o pizarras.
- Escenas demasiado limpias y ordenadas, sin ninguna imperfección real.
- Comida perfecta (queso o salsas idénticos, brillos de plástico, formas simétricas).
- Fondos desenfocados «de cartón», objetos que se funden entre sí, sillas o mesas con patas incoherentes.
- Colores saturados, aspecto HDR, bordes con halo, grano artificial.
- Composición de póster: sujeto centrado, todo perfectamente encuadrado y mirando a cámara.
- Look de banco de imágenes: sonrisas posadas, camisas impecables, cocinas de catálogo.

#### 6. Lista de comprobación antes de publicar
Abrir la imagen a tamaño completo (no la miniatura) y comprobar:
1. **Manos:** cinco dedos, proporciones normales, agarran bien el objeto.
2. **Caras:** distintas entre sí, con expresiones naturales, ojos y dientes correctos.
3. **Texto y logos:** ninguno legible, ninguno inventado (revisar delantales, pizarras, cartas, tickets, cajas).
4. **Comida creíble:** forma, textura y cocción verosímiles; cubiertos y platos coherentes.
5. **Luz:** fuentes reales y coherentes, sombras en su sitio, sin brillos de plástico ni aspecto HDR.
6. **Escena española creíble:** mobiliario, utensilios, señalización y arquitectura coherentes con el lugar.
7. **Formato:** dimensiones, relación de aspecto, formato de archivo, nombre y texto alternativo en español correctos.
8. **Sin stock** y con el original de 2K guardado.
Si falla algo evidente, se repite como máximo 1 vez. Si vuelve a fallar, no se publica.

#### 7. Si no se puede generar
Si no se puede generar con el modelo de esta regla, no se usa otro modelo ni se publica una imagen de menor calidad. El hueco queda pendiente: se deja la imagen anterior o el hueco sin cambiar.
