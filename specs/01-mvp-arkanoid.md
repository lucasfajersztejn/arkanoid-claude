# SPEC 01 — MVP jugable de Arkanoid

> **Estado:** aprobado
> **Depende de:** Ninguna
> **Fecha:** 2026-10-07
> **Objetivo:** Un Arkanoid jugable en el navegador con un único nivel, tres vidas, control con ratón y teclado, y un overlay de victoria o game over.

---

## Por qué existe esta spec

El repositorio solo contiene recursos (`assets/`). Esta spec define el mínimo que convierte esos recursos en un juego completo de principio a fin: se puede empezar, perder, ganar y volver a jugar. Todo lo demás (niveles, power-ups, récords) se construye encima en specs posteriores.

---

## Alcance

**Dentro:**

- Un canvas de 800×600 px con un único nivel fijo de 10 columnas × 6 filas de bloques.
- Pala controlada simultáneamente con ratón (sigue la X del cursor) y teclado (← → o A D).
- Pelota pegada a la pala al inicio de cada vida; se lanza con clic o Espacio.
- Rebote en paredes, techo, pala y bloques. El ángulo en la pala depende del punto de impacto y la velocidad es constante.
- Bloques de 1 golpe (red, yellow, cyan, magenta, green) y bloques grises de 2 golpes en la fila superior.
- Marcador de puntos (10 por bloque destruido) y de vidas (3 al inicio), visibles durante la partida.
- Overlay de victoria (sin bloques) y de game over (sin vidas), con reinicio por clic o Espacio.

**Fuera de alcance (para futuras specs):**

- Animación de explosión al destruir un bloque (`drawFrame` + `EXPLOSION_FRAMES`). En el MVP el bloque desaparece al instante.
- Sonidos (`ball-bounce.mp3`, `break-sound.mp3`). Se harán junto con las animaciones en una spec posterior.
- Varios niveles, formato de niveles y progresión.
- Power-ups, pelotas múltiples, láser y bloques indestructibles.
- Velocidad creciente de la pelota o dificultad progresiva.
- Pausa (P / Esc).
- Récord guardado en `localStorage` o cualquier persistencia.
- Control táctil y versión móvil.
- Menú de inicio, ajustes y control de volumen.
- Escalado responsivo del canvas a la ventana.

---

## Modelo de datos

```js
// Constantes (src/game.js)
const CANVAS_W = 800;
const CANVAS_H = 600;
const BLOCK_W = 64;            // 32 × 2 del spritesheet
const BLOCK_H = 32;            // 16 × 2 del spritesheet
const COLS = 10;
const ROWS = 6;
const GRID_X = 80;             // (800 - 10 × 64) / 2
const GRID_Y = 60;
const PADDLE_W = 162;          // tamaño nativo del sprite
const PADDLE_H = 14;
const PADDLE_Y = 560;
const PADDLE_KEY_SPEED = 600;  // px/s
const BALL_SIZE = 16;          // tamaño nativo del sprite
const BALL_SPEED = 400;        // px/s, constante
const MAX_BOUNCE_ANGLE = 60;   // grados respecto a la vertical
const START_LIVES = 3;
const POINTS_PER_BLOCK = 10;
const ROW_COLORS = ['gray', 'red', 'yellow', 'cyan', 'magenta', 'green'];

// Estado de la partida
const state = {
  phase: 'ready',   // 'ready' | 'playing' | 'won' | 'lost'
  score: 0,
  lives: START_LIVES,
  paddle: { x: 0, y: PADDLE_Y, w: PADDLE_W, h: PADDLE_H },
  ball: { x: 0, y: 0, vx: 0, vy: 0, size: BALL_SIZE, attached: true },
  blocks: [],       // { x, y, w, h, color, hits, alive }
};
```

Convenciones:

- Origen de coordenadas arriba a la izquierda; `x`, `y` son la esquina superior izquierda de cada elemento.
- Velocidades en px/s; el movimiento se escala con el `dt` real entre fotogramas (en segundos, con tope de 0,05 s).
- `hits` es el número de golpes que le quedan al bloque: 2 en `gray`, 1 en el resto.
- `alive` pasa a `false` cuando `hits` llega a 0; el bloque deja de dibujarse y de colisionar en ese mismo fotograma.
- Fase `ready`: la pelota está pegada a la pala. Fase `playing`: la pelota se mueve.

---

## Plan de implementación

1. Crear `index.html` con un `<canvas id="game" width="800" height="600">`, un `<div id="overlay">` oculto, `<link>` a `style.css` y los scripts `assets/spritesheet.js` y `src/game.js` en ese orden. Crear `style.css` (fondo oscuro, canvas centrado, estilo del overlay) y un `src/game.js` que solo arranca con `loadSpritesheet`. Prueba manual: abrir `index.html`, ver el canvas vacío sin errores en consola.
2. En `src/game.js`: constantes, `state`, `initBlocks()` y bucle `requestAnimationFrame` con `dt`. Dibujar bloques de las 6 filas con `drawSprite('block_<color>')` a 64×32. Prueba manual: se ve la rejilla de 10×6 con la fila gris arriba.
3. Pala: dibujarla con `drawSprite('paddle')`, moverla con el ratón (X del cursor relativa al canvas) y con ← → / A D, limitada a los bordes. Prueba manual: la pala se mueve con ambos controles sin salirse del canvas.
4. Pelota pegada a la pala (fase `ready`): seguirla y lanzarla con clic o Espacio hacia arriba con un ligero ángulo. Rebote en paredes laterales y techo. Prueba manual: la pelota sale y rebota en tres bordes.
5. Rebote en la pala con ángulo según el punto de impacto (centro = vertical, bordes = `MAX_BOUNCE_ANGLE`) y velocidad constante. Prueba manual: golpear en los extremos cambia la dirección de forma predecible.
6. Colisión con bloques: detectar el eje de impacto (horizontal o vertical) y rebotar. Bloques de 1 golpe se destruyen y desaparecen al instante; los grises pierden un golpe y se destruyen al segundo. Al destruir un bloque se suman 10 puntos. Prueba manual: los bloques se rompen, los grises aguantan dos golpes y el contador interno de puntos sube 10 por bloque destruido.
7. HUD en el canvas con puntos y vidas. Si la pelota cae por debajo del canvas, resta una vida y vuelve a `ready`. Prueba manual: el marcador sube 10 por bloque; tras perder la pelota, la vida baja y la pelota reaparece pegada a la pala.
8. Overlay de victoria (cuando no quedan bloques vivos) y de game over (vidas = 0), con reinicio por clic o Espacio que restablece `state` completo. Prueba manual: se puede ganar, perder y volver a jugar sin recargar.

---

## Criterios de aceptación

- [x ] Abrir `index.html` (con `file://` o con servidor estático) carga el juego sin errores en la consola.
- [x ] El canvas mide exactamente 800×600 px.
- [x ] Al empezar hay 60 bloques en 10 columnas × 6 filas; la fila superior es gris y las siguientes son red, yellow, cyan, magenta y green.
- [x ] La pala se mueve con el ratón y con ← → / A D, y nunca sale del canvas.
- [x ] La pelota empieza pegada a la pala y solo se lanza con clic o Espacio.
- [x ] La pelota rebota en las paredes laterales y en el techo.
- [x ] Golpear la pala en el centro envía la pelota en vertical y golpear en un extremo la envía con un ángulo de unos 60° respecto a la vertical.
- [x ] La velocidad de la pelota no cambia durante la partida.
- [x ] Un bloque de color se destruye al primer golpe y un bloque gris al segundo.
- [x ] Destruir un bloque suma exactamente 10 puntos; el primer golpe a un bloque gris no suma.
- [x ] Al destruir un bloque este desaparece al instante.
- [x ] Se empieza con 3 vidas; dejar caer la pelota resta 1 y la devuelve pegada a la pala.
- [x ] Al llegar a 0 vidas aparece el overlay de game over.
- [x ] Al destruir los 60 bloques aparece el overlay de victoria.
- [x ] Hacer clic o pulsar Espacio en un overlay reinicia la partida con 3 vidas, 0 puntos y los 60 bloques.
- [x ] El marcador de puntos y el de vidas son visibles durante la partida y se actualizan.

---

## Decisiones

- **Sí:** canvas fijo de 800×600 con una rejilla de 10×6. Lo pidió el usuario; evita el escalado responsivo.
- **Sí:** bloques dibujados a 64×32 (×2 del sprite de 32×16). Mantiene la proporción y deja 10 columnas centradas con 80 px de margen.
- **Sí:** pala (162×14) y pelota (16×16) a tamaño nativo. 162 px son ~20 % del ancho, una proporción adecuada sin escalar.
- **Sí:** rebote en la pala según el punto de impacto con velocidad constante. Es el comportamiento clásico del Arkanoid, predecible y permite apuntar. Se interpreta así la petición de «rebote simple con física predecible».
- **No:** aceleración de la pelota. Añade ajuste de dificultad y riesgo de atravesar bloques; va en otra spec.
- **Sí:** 3 vidas, un único nivel y una pantalla overlay de victoria o game over. Lo pidió el usuario.
- **Sí:** ratón y teclado activos a la vez; la última entrada recibida gana. Lo pidió el usuario.
- **Sí:** 10 puntos por bloque destruido, y los grises puntúan solo al destruirse. Es la lectura más literal de «10 puntos cada bloque».
- **Sí:** fila superior gris con 2 golpes. Es la única regla que da variedad al nivel sin añadir bloques nuevos.
- **Sí:** lanzamiento con clic o Espacio con la pelota pegada a la pala. Da tiempo al jugador al empezar y tras perder una vida.
- **Sí:** archivos `index.html`, `style.css` y `src/game.js` con un único script de ámbito global. Funciona abriendo el HTML directamente (`file://`) sin módulos ES, igual que `assets/spritesheet.js`.
- **Sí:** el overlay es un `<div>` HTML sobre el canvas, estilado en `style.css`.
- **No:** animación de explosión en el MVP. Se pospone a una spec posterior; los recursos (`EXPLOSION_FRAMES`, `drawFrame`) ya existen en `assets/spritesheet.js` y no se tocan.
- **No:** sonido en el MVP. Se pospone junto con las animaciones a una spec posterior; los archivos de `assets/sounds/` no se tocan.
- **No:** pausa, récord con `localStorage`, control táctil, menú de inicio y múltiples niveles. Cada uno merece su propia spec.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| La pelota atraviesa bloques o la pala a `dt` grandes | Tope de `dt` en 0,05 s y velocidad de 400 px/s (máx. 20 px por fotograma, menor que el alto de bloque de 32 px). |
| Rebote errático en las esquinas de los bloques | Rebotar solo en el eje de menor solapamiento y procesar como máximo un bloque por fotograma. |
| `loadSpritesheet` usa la ruta relativa `assets/spritesheet-breakout.png` | `index.html` debe estar en la raíz del proyecto, junto a la carpeta `assets/`. |

---

## Lo que **no** está en esta spec

- Animación de explosión de bloques.
- Sonidos.
- Varios niveles ni formato de niveles.
- Power-ups, pelotas múltiples ni bloques indestructibles.
- Velocidad creciente de la pelota.
- Pausa.
- Récord ni persistencia.
- Control táctil o móvil.
- Menú de inicio, ajustes o volumen.

Cada uno de ellos, si llega, va en su propia spec.
