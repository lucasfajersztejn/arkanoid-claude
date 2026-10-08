# SPEC 03 — Sonidos y niveles

> **Estado:** aprobado
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-10-08
> **Objetivo:** El juego reproduce `ball-bounce.mp3` y `break-sound.mp3` (con un botón para silenciarlos) en los rebotes y roturas, y ofrece tres niveles (el actual más dos nuevos y más difíciles) que se eligen desde una pantalla de inicio y cambian solo la disposición de los bloques.

---

## Por qué existe esta spec

SPEC 01 y SPEC 02 dejaron fuera los sonidos y los niveles múltiples. Los dos archivos de audio ya existen en `assets/sounds/`. Esta spec los conecta al juego y añade la progresión mínima entre niveles. Se agrupan en una sola spec por decisión del usuario; el plan los separa en pasos independientes, de modo que cada paso se puede commitear solo.

---

## Alcance

**Dentro:**

- Sonido `assets/sounds/ball-bounce.mp3` en cada rebote de la pelota contra la pared izquierda, la derecha, el techo y la pala.
- Sonido `assets/sounds/break-sound.mp3` cuando un bloque se destruye (`hits` llega a 0), incluido el último bloque de un nivel.
- Los sonidos se solapan: cada evento reproduce su propia copia del audio y no corta a las anteriores.
- Nuevo archivo `src/levels.js` con 3 niveles definidos como mapas de texto. El nivel 1 reproduce exactamente la disposición actual (10×6, fila gris arriba); los niveles 2 y 3 son nuevos y más difíciles.
- Avance automático: al destruir el último bloque de un nivel que no es el último, se carga el siguiente conservando puntos y vidas, con la pelota pegada a la pala (fase `ready`).
- Overlay de victoria solo al limpiar el último nivel (nivel 3).
- Pantalla de inicio (fase nueva `menu`) con tres botones «Nivel 1», «Nivel 2» y «Nivel 3». Aparece al cargar la página y tras victoria o game over. Los tres niveles están disponibles siempre, sin desbloqueo.
- Elegir un botón empieza la partida en ese nivel con 0 puntos y 3 vidas, con la pelota pegada a la pala (fase `ready`).
- Al avanzar de nivel automáticamente se sigue la secuencia desde el elegido: elegir el nivel 2 y limpiarlo carga el 3; elegir el 3 y limpiarlo muestra la victoria.
- Botón para silenciar (`#mute`, 🔊/🔇) fuera del canvas, siempre visible, y tecla `M` con el mismo efecto. Silencia todos los sonidos del juego y funciona también en la pantalla de inicio. El estado vive solo en memoria y se restablece a «con sonido» al recargar.
- Texto `Nivel N/3` en el HUD del canvas, centrado arriba.

**Fuera de alcance (para futuras specs):**

- Sonido al primer golpe a un bloque gris (no destruye; queda en silencio).
- Sonido de pérdida de vida, victoria, game over o lanzamiento.
- Música de fondo, control de volumen (más allá del silenciar todo/nada) y precarga con barra de progreso.
- Guardar en `localStorage` el estado de silencio o el nivel elegido.
- Desbloqueo progresivo de niveles y récord por nivel.
- Cambios de velocidad de la pelota, vidas por nivel o cualquier regla distinta de SPEC 01.
- Bloques indestructibles u otros tipos de bloque nuevos.
- Overlay o pantalla intermedia entre niveles.
- Más de 3 niveles y editor de niveles.
- Cambiar de nivel durante una partida en curso (el selector solo aparece al inicio y tras terminar).
- Menú de ajustes, título o créditos más allá de la pantalla de selección.
- Récord o persistencia del progreso.
- Cambios en `assets/` (no se modifica ningún recurso).

---

## Modelo de datos

```js
// src/levels.js (script de ámbito global, se carga antes de src/game.js)
// Un carácter por bloque; '.' = hueco. Cada fila mide exactamente 10 caracteres.
// Máximo 8 filas por nivel.
const LEVEL_CHARS = {
  G: 'gray', R: 'red', Y: 'yellow', C: 'cyan', M: 'magenta', E: 'green',
};

const LEVELS = [
  [ // Nivel 1: igual que SPEC 01
    'GGGGGGGGGG',
    'RRRRRRRRRR',
    'YYYYYYYYYY',
    'CCCCCCCCCC',
    'MMMMMMMMMM',
    'EEEEEEEEEE',
  ],
  [ // Nivel 2: huecos y más grises
    'G.GGGGGG.G',
    'RRRR..RRRR',
    'Y.YYYYYY.Y',
    'CC.CCCC.CC',
    'M.MM..MM.M',
    'EEEEEEEEEE',
  ],
  [ // Nivel 3: núcleo protegido por un muro gris con una sola entrada
    'GGGGG.GGGG',
    'G........G',
    'G.RRYYRR.G',
    'G.RM..MR.G',
    'G.CCEECC.G',
    'G........G',
  ],
];
```

Las disposiciones de arriba son el punto de partida; se pueden ajustar al probarlas, siempre que cumplan las reglas de los criterios de aceptación.

```js
// Constantes y campos nuevos (src/game.js)
const SOUND_FILES = {
  bounce: 'assets/sounds/ball-bounce.mp3',
  break: 'assets/sounds/break-sound.mp3',
};

state.level = 0;   // índice en LEVELS (0 = nivel 1)
state.phase = 'menu'; // fase nueva: 'menu' | 'ready' | 'playing' | 'won' | 'lost'
state.muted = false;  // true = playSound no reproduce nada
```

Convenciones:

- `initBlocks()` pasa a leer `LEVELS[state.level]`: recorre filas y columnas, ignora `.` y crea cada bloque con el mismo formato `{ x, y, w, h, color, hits, alive }` de SPEC 01 (`hits` 2 en `gray`, 1 en el resto). Posición: `GRID_X + col * BLOCK_W`, `GRID_Y + row * BLOCK_H`.
- Constantes `COLS`, `ROWS`, `ROW_COLORS` de SPEC 01 dejan de usarse para construir el nivel; se eliminan si nada más las usa.
- `playSound(name)` sale sin hacer nada si `state.muted` es `true`; si no, crea un `new Audio(SOUND_FILES[name])` por evento y llama a `play()`; el rechazo de la promesa se captura y se ignora (política de autoplay del navegador).
- `state.phase` arranca en `'menu'`. En `menu` no se actualiza la pelota ni se puede lanzar; el canvas muestra el fondo y el HUD, y el overlay HTML muestra los tres botones (`<button data-level="0|1|2">`).
- `startGame(levelIndex)` sustituye a `resetGame()` como punto de entrada: restablece puntos, vidas y explosiones, fija `state.level = levelIndex`, genera los bloques y deja la fase en `ready`. `launchOrRestart()` en fase `won` o `lost` ya no reinicia: vuelve a `menu`.
- El botón `#mute` se añade a `index.html` fuera de `#wrapper` y se estila en `style.css`. Alterna `state.muted`, cambia su icono (🔊 con sonido, 🔇 silenciado) y su `aria-label`, y llama a `blur()` para que Espacio no lo reactive. La tecla `M` (sin repetición) hace lo mismo.
- Los sonidos se disparan solo en la lógica del juego (`updateBall`, `bouncePaddle`, `bounceBlocks`), nunca en `draw()`.
- `state.blocks` sigue siendo la única fuente de verdad de colisión, puntos y victoria. Las explosiones en curso (SPEC 02) no se descartan al cambiar de nivel; terminan de reproducirse sobre el nivel nuevo.

---

## Plan de implementación

1. Crear `src/levels.js` con `LEVEL_CHARS` y `LEVELS`, y añadir `<script src="src/levels.js">` en `index.html` entre `assets/spritesheet.js` y `src/game.js`. Añadir `state.level = 0` y hacer que `initBlocks()` construya los bloques desde `LEVELS[state.level]`. Prueba manual: el juego arranca con la misma disposición de 60 bloques de SPEC 01 y sin errores en consola.
2. Añadir `SOUND_FILES` y `playSound(name)` en `src/game.js`. Llamar a `playSound('bounce')` en los rebotes con pared izquierda, derecha y techo (`updateBall`) y con la pala (`bouncePaddle`). Prueba manual: tras lanzar con clic o Espacio, suena en cada rebote de borde y de pala, y no suena al rebotar en un bloque.
3. Llamar a `playSound('break')` en `bounceBlocks()` cuando `b.hits <= 0`. Prueba manual: suena al romper un bloque de color y al segundo golpe de un gris; el primer golpe al gris no suena; varios sonidos seguidos se solapan sin cortarse.
4. Avance de nivel: añadir `loadLevel(index)` que fija `state.level`, llama a `initBlocks()`, pega la pelota a la pala y vuelve a fase `ready`, sin tocar `score`, `lives` ni `state.explosions`. En `updateBall`, si no quedan bloques vivos: cargar el siguiente nivel si existe, o `endGame('won', '¡Victoria!')` si era el último. `resetGame()` sigue fijando `state.level = 0` (en el paso 6 lo sustituye `startGame`). Prueba manual: limpiar el nivel 1 carga el 2 con puntos y vidas intactos y la pelota pegada a la pala (la consola permite saltar el trabajo: `state.blocks.forEach(b => b.alive = false)`).
5. Dibujar `Nivel N/3` en `draw()` (centrado arriba, mismo estilo que `Puntos`). Calcular el total desde `LEVELS.length`. Prueba manual: el texto cambia de `Nivel 1/3` a `Nivel 2/3` y `Nivel 3/3` al avanzar, y vuelve a `Nivel 1/3` al reiniciar.
6. Pantalla de inicio: añadir la fase `menu` y `startGame(levelIndex)` (reemplaza a `resetGame()`). Al cargar, mostrar en `#overlay` el título y tres botones `data-level`, con estilo en `style.css`. Al hacer clic en un botón, llamar a `startGame` con ese nivel y ocultar el overlay. En `launchOrRestart()`, tras `won` o `lost` volver a `menu` en vez de reiniciar. Prueba manual: al abrir `index.html` aparece el selector; cada botón empieza en su nivel con 0 puntos y 3 vidas; tras ganar o perder reaparece el selector; en `menu` clic y Espacio no lanzan la pelota.
7. Botón de silencio: añadir `<button id="mute">` en `index.html` y su estilo en `style.css`; añadir `state.muted`, la función `toggleMute()` (botón y tecla `M`) y la comprobación en `playSound`. Prueba manual: pulsar el botón o `M` silencia los rebotes y roturas y cambia el icono a 🔇; volver a pulsar restablece el sonido; funciona también en la pantalla de inicio.

---

## Criterios de aceptación

- [ ] Abrir `index.html` carga el juego sin errores en la consola.
- [ ] La pelota emite `ball-bounce.mp3` al rebotar en la pared izquierda, la derecha, el techo y la pala.
- [ ] La pelota no emite `ball-bounce.mp3` al rebotar en un bloque.
- [ ] Destruir un bloque emite `break-sound.mp3` en el momento del golpe, también el último bloque de un nivel.
- [ ] El primer golpe a un bloque gris no emite ningún sonido y el segundo emite `break-sound.mp3`.
- [ ] Dos eventos de sonido en fotogramas consecutivos suenan a la vez sin cortarse.
- [ ] Si el navegador bloquea un audio, la consola no muestra errores sin capturar y el juego sigue funcionando.
- [ ] `src/levels.js` define exactamente 3 niveles; cada fila mide 10 caracteres y cada nivel tiene entre 1 y 8 filas.
- [ ] El nivel 1 genera 60 bloques con la misma posición y color que SPEC 01 (fila gris arriba; red, yellow, cyan, magenta y green debajo).
- [ ] El nivel 2 tiene más bloques grises que el nivel 1 y al menos 6 huecos dentro de su rejilla.
- [ ] El nivel 3 tiene un muro gris con una única entrada a los bloques del núcleo.
- [ ] Todos los bloques de los niveles 2 y 3 se pueden alcanzar con la pelota (ninguno queda sellado por completo).
- [ ] Destruir todos los bloques del nivel 1 carga el nivel 2, y los del nivel 2 cargan el nivel 3.
- [ ] Al cambiar de nivel `state.score` y `state.lives` conservan su valor y la pelota queda pegada a la pala en fase `ready`.
- [ ] Al cambiar de nivel una explosión en curso termina de reproducirse y no se descarta.
- [ ] Destruir todos los bloques del nivel 3 muestra el overlay de victoria; destruir los de los niveles 1 y 2 no lo muestra.
- [ ] Al abrir `index.html` aparece la pantalla de inicio con tres botones «Nivel 1», «Nivel 2» y «Nivel 3»; la pelota no se lanza con clic ni Espacio mientras se muestra.
- [ ] Pulsar «Nivel 2» empieza la partida en el nivel 2 (HUD `Nivel 2/3`) con 0 puntos, 3 vidas y la pelota pegada a la pala; igual con «Nivel 1» y «Nivel 3».
- [ ] Limpiar el nivel 2 elegido desde el selector carga el nivel 3; limpiar el nivel 3 elegido desde el selector muestra la victoria.
- [ ] Tras victoria o game over, hacer clic o pulsar Espacio en el overlay vuelve a la pantalla de inicio, sin reiniciar la partida directamente.
- [ ] Pulsar el botón `#mute` silencia todos los sonidos (rebote y rotura) y su icono pasa a 🔇; pulsarlo de nuevo los restablece y el icono vuelve a 🔊.
- [ ] La tecla `M` alterna el silencio igual que el botón; mantenerla pulsada no alterna repetidamente.
- [ ] El silencio también se aplica y se puede cambiar desde la pantalla de inicio, y se mantiene al empezar una partida o cambiar de nivel.
- [ ] Tras pulsar `#mute`, Espacio no lo reactiva (pierde el foco).
- [ ] Recargar la página restablece el estado «con sonido».
- [ ] El HUD muestra `Nivel 1/3`, `Nivel 2/3` y `Nivel 3/3` según el nivel actual.
- [ ] Destruir un bloque sigue sumando exactamente 10 puntos en los tres niveles.
- [ ] `git diff` no muestra cambios en `assets/`.

---

## Decisiones

- **Sí:** una sola spec para sonidos y niveles. Lo decidió el usuario; el plan separa los pasos (1 niveles-datos, 2–3 sonido, 4–5 progresión, 6 selector de nivel, 7 silencio) para poder commitearlos por separado.
- **Sí:** `ball-bounce.mp3` en paredes, techo y pala. Cubre lo que pidió el usuario (paredes) y el rebote más frecuente del juego (pala).
- **No:** sonido en el rebote contra bloques sin romper (primer golpe al gris). El usuario eligió dejarlo en silencio; el sonido de rotura ya cubre los bloques.
- **Sí:** sonidos solapados con un `Audio` nuevo por evento. Evita cortes en roturas seguidas; los archivos son cortos y el coste es despreciable.
- **No:** un único objeto `Audio` por efecto reiniciado en cada evento. Es más simple, pero corta el sonido anterior.
- **Sí:** capturar el rechazo de `play()`. El navegador puede bloquear audio sin gesto previo; el juego no debe fallar por eso. En la práctica el primer sonido llega tras el clic o Espacio de lanzamiento.
- **Sí:** niveles como mapas de texto en `src/levels.js`, un carácter por bloque. Se leen y se editan como una imagen; no hace falta editor.
- **Sí:** `src/levels.js` como script de ámbito global cargado antes de `src/game.js`. Mantiene el patrón de SPEC 01 (funciona con `file://`, sin módulos ES).
- **Sí:** 3 niveles en total (el actual más 2 nuevos). El usuario pidió «por lo menos dos más» y eligió 3.
- **Sí:** la dificultad sube solo con la disposición (huecos, más grises, núcleo protegido). Es lo que pidió el usuario: «lo que va a cambiar es dónde están los bloques».
- **No:** subir `BALL_SPEED` por nivel. Contradice la petición y SPEC 01 dejó la velocidad constante.
- **No:** bloques indestructibles. Son un tipo de bloque nuevo y SPEC 01 los dejó para otra spec.
- **Sí:** avance automático conservando puntos y vidas. Lo eligió el usuario; la pelota vuelve pegada a la pala para dar tiempo al jugador.
- **No:** overlay «Nivel completado» entre niveles. Añade una fase nueva a la máquina de estados sin aportar nada al juego.
- **No:** reponer vidas por nivel. Mantiene la dificultad acumulada.
- **Sí:** overlay de victoria solo tras el nivel 3.
- **Sí:** pantalla de inicio con tres botones, al cargar y tras victoria o game over. Lo pidió el usuario («seleccionador de nivel al principio»); volver a ella tras terminar evita reiniciar a ciegas.
- **No:** selector solo al cargar la página. Tras perder habría que recargar para cambiar de nivel.
- **No:** botones de nivel visibles durante la partida. Se pulsan sin querer y reiniciarían la partida.
- **Sí:** los 3 niveles libres desde el principio. El usuario quiere saltar a cualquier nivel; el desbloqueo exigiría persistencia, que queda fuera.
- **Sí:** elegir un nivel y seguir la secuencia desde ahí. Es el comportamiento más predecible; elegir el nivel 3 termina el juego al limpiarlo.
- **Sí:** empezar siempre con 0 puntos y 3 vidas, elijas el nivel que elijas. Mantiene las reglas de SPEC 01 y no regala ventajas.
- **Sí:** fase nueva `menu` en la máquina de estados. Evita lanzar la pelota o actualizar la física detrás del selector.
- **Sí:** botón HTML `#mute` fuera del canvas más la tecla `M`. El botón es descubrible y el atajo es cómodo en partida; ambos comparten `toggleMute()`.
- **Sí:** silenciar bloquea los sonidos en `playSound`, no pausa ni elimina audios ya en reproducción. Los efectos son muy cortos.
- **No:** guardar el silencio en `localStorage`. El usuario eligió no persistirlo; cada carga arranca con sonido.
- **No:** control de volumen deslizante. El usuario pidió «cancelar el sonido», un interruptor todo/nada.
- **Sí:** no descartar las explosiones al cambiar de nivel. SPEC 02 solo las descarta al reiniciar la partida; así la última animación del nivel termina de verse.
- **Sí:** `Nivel N/3` en el HUD, con el total derivado de `LEVELS.length`. Sin él el jugador no sabe que ha avanzado.
- **Sí:** máximo 8 filas por nivel. Con `GRID_Y = 60` y bloques de 32 px, la rejilla termina en y = 316 y deja espacio a la pelota hasta la pala (y = 560).

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El navegador bloquea `play()` sin gesto del usuario | El primer sonido llega tras el clic o Espacio de lanzamiento; además se captura el rechazo de la promesa y se ignora. |
| Crear un `Audio` por evento acumula objetos en roturas muy seguidas | Los archivos son cortos y el recolector de basura libera cada objeto al terminar; el límite natural son los bloques de un nivel. |
| Un nivel con un bloque inalcanzable deja la partida sin solución | Criterio de aceptación explícito: todos los bloques son alcanzables; revisar cada mapa al probarlo. |
| Rebote errático de la pelota en huecos estrechos (una sola columna de 64 px) | La lógica de colisión de SPEC 01 procesa un bloque por fotograma en el eje de menor solapamiento; los huecos de 64 px son mayores que la pelota (16 px). Comprobarlo jugando los niveles 2 y 3. |
| Espacio o clic activan el selector o el botón por error (el botón conserva el foco) | `#mute` llama a `blur()` tras pulsarse; en `menu` `launchBall` no hace nada porque la fase no es `ready`. |
| El overlay HTML de victoria/game over y el de selección comparten `#overlay` y se pisan | `endGame` y `showMenu` reescriben su contenido completo; solo hay un overlay visible a la vez. |
| El juego carga con rutas relativas (`assets/sounds/...`) | Igual que el spritesheet: `index.html` debe seguir en la raíz del proyecto, junto a `assets/`. |

---

## Lo que **no** está en esta spec

- Sonido al primer golpe a un bloque gris, de pérdida de vida, victoria, game over o lanzamiento.
- Música, control de volumen deslizante y precarga de audio.
- Guardar el silencio o el nivel elegido entre sesiones.
- Cambios de velocidad, de vidas o de reglas respecto a SPEC 01.
- Bloques indestructibles o de otros tipos.
- Pantalla intermedia entre niveles.
- Desbloqueo de niveles, cambio de nivel en mitad de la partida y editor de niveles.
- Más de 3 niveles.
- Récord o persistencia.
- Cambios en `assets/`.

Cada uno de ellos, si llega, va en su propia spec.
