# SPEC 02 — Animación de destrucción de bloques

> **Estado:** aprobado
> **Depende de:** SPEC 01
> **Fecha:** 2026-10-08
> **Objetivo:** Al destruir un bloque se reproduce su animación de explosión de 4 fotogramas (150 ms en total) en el lugar que ocupaba, sin afectar a la física ni a la puntuación.

---

## Por qué existe esta spec

SPEC 01 dejó fuera la animación: el bloque desaparece al instante. Los recursos ya existen (`EXPLOSION_FRAMES`, `EXPLOSION_DURATION`, `drawFrame` en `assets/spritesheet.js`). Esta spec los conecta al juego sin tocar la lógica de colisión, de puntos ni de victoria.

---

## Alcance

**Dentro:**

- Lista `state.explosions` con las explosiones en curso.
- Crear una explosión cuando un bloque pasa a `alive = false`.
- Avanzar cada explosión con el `dt` del bucle y eliminarla al terminar.
- Dibujar el fotograma actual con `drawFrame` a 64×32, en la posición del bloque. Los fotogramas salen de `assets/spritesheet-breakout.png` (región x 256–384, y 176–272, 32×16 por fotograma), a través de `EXPLOSION_FRAMES` y `loadSpritesheet`. No se crean ni se usan otras imágenes.
- Bloque gris: usa los fotogramas de `gray` (que reutilizan los de `red`, según `assets/spritesheet.js`) solo al destruirse. El primer golpe no muestra efecto.
- Descartar las explosiones en curso al reiniciar la partida.
- Las explosiones siguen avanzando en las fases `won` y `lost`, así la última animación termina de verse bajo el overlay.

**Fuera de alcance (para futuras specs):**

- Sonidos (`break-sound.mp3`, `ball-bounce.mp3`). Se hacen en una spec posterior.
- Efecto en el primer golpe a un bloque gris.
- Partículas, temblor de pantalla u otros efectos no incluidos en el spritesheet.
- Retrasar puntos o victoria hasta el fin de la animación.
- Colisión de la pelota con un bloque que está explotando.
- Cambios en `assets/` (no se modifica ningún recurso).

---

## Modelo de datos

```js
// Constante nueva (src/game.js)
const EXPLOSION_FRAME_COUNT = 4;   // fotogramas por color en EXPLOSION_FRAMES

// Campo nuevo en state
state.explosions = [];             // { x, y, w, h, color, elapsed }
```

Convenciones:

- `elapsed` está en segundos y empieza en 0. `EXPLOSION_DURATION` (150) está en ms y es la duración **total** de la animación.
- Índice de fotograma: `Math.floor(elapsed / (EXPLOSION_DURATION / 1000) * EXPLOSION_FRAME_COUNT)`. La explosión se elimina cuando `elapsed >= EXPLOSION_DURATION / 1000`.
- `x`, `y`, `w`, `h` y `color` se copian del bloque en el momento de destruirse.
- `state.blocks` no cambia: `alive` sigue siendo la única fuente de verdad de colisión, puntos y victoria.

---

## Plan de implementación

1. En `src/game.js`: añadir `EXPLOSION_FRAME_COUNT`, el campo `explosions: []` en `state` y vaciarlo en `resetGame()`. Prueba manual: el juego arranca y se reinicia sin errores en consola; nada cambia visualmente.
2. En `bounceBlocks()`: cuando `b.hits <= 0`, además de `alive = false` y los puntos, añadir a `state.explosions` un objeto con `x, y, w, h, color, elapsed: 0`. Prueba manual: en la consola, `state.explosions.length` sube al romper un bloque.
3. Crear `updateExplosions(dt)`: suma `dt` a `elapsed` y elimina las explosiones terminadas. Llamarla en `update(dt)` **antes** del `return` de las fases `won` y `lost`. Prueba manual: `state.explosions` vuelve a 0 unos 150 ms después de romper un bloque, también al romper el último.
4. Dibujar en `draw()`: para cada explosión, calcular el índice de fotograma y llamar a `drawFrame(ctx, EXPLOSION_FRAMES[e.color][i], e.x, e.y, e.w, e.h)`, junto al dibujo de bloques. `drawFrame` toma los fotogramas de `assets/spritesheet-breakout.png`, ya cargado por `loadSpritesheet`; no hace falta cargar nada nuevo. Prueba manual: al romper un bloque se ve la animación de 4 fotogramas del spritesheet en su sitio; el bloque gris solo explota al segundo golpe.

---

## Criterios de aceptación

- [x ] Abrir `index.html` carga el juego sin errores en la consola.
- [x ] Al destruir un bloque de color se muestra su animación de 4 fotogramas en la posición exacta del bloque.
- [x ] Un bloque gris no muestra ningún efecto al primer golpe y explota al segundo.
- [x ] Los fotogramas mostrados proceden de `assets/spritesheet-breakout.png` (la pestaña Red no muestra otras imágenes cargadas).
- [x ] La animación dura 150 ms en total y después el hueco queda vacío.
- [x ] `state.explosions` queda vacío tras 150 ms sin nuevas roturas.
- [x ] La pelota atraviesa el hueco de un bloque que está explotando sin rebotar.
- [x ] Destruir un bloque sigue sumando exactamente 10 puntos, en el momento del golpe.
- [x ] Al destruir el último bloque el overlay de victoria aparece sin esperar a la animación y la explosión termina de reproducirse.
- [x ] Varios bloques rotos en fotogramas consecutivos se animan a la vez sin interferir.
- [x ] Reiniciar la partida con una explosión en curso la descarta: `state.explosions` queda vacío.
- [x ] `git diff` no muestra cambios en `assets/`.

---

## Decisiones

- **Sí:** lista `state.explosions` separada de `state.blocks`. Mantiene la colisión, los puntos y la victoria de SPEC 01 intactos.
- **No:** mantener el bloque colisionable durante la animación. Complica la física y los golpes dobles sin aportar nada.
- **Sí:** puntos y victoria en el momento del golpe. Es el comportamiento actual; el usuario lo confirmó.
- **Sí:** 150 ms como duración total (~37,5 ms por fotograma). Es la lectura literal de `EXPLOSION_DURATION`; una explosión rápida no estorba al juego.
- **No:** 150 ms por fotograma (600 ms en total). Más lenta y no aporta claridad.
- **Sí:** las explosiones avanzan también en `won` y `lost`. Si no, la última animación quedaría congelada bajo el overlay.
- **Sí:** descartar las explosiones al reiniciar. Evita fantasmas sobre la partida nueva.
- **Sí:** el bloque gris usa `EXPLOSION_FRAMES.gray` (fotogramas de `red`). Así lo define `assets/spritesheet.js`; no se modifica.
- **No:** efecto en el primer golpe al gris. No hay sprite propio y amplía el alcance.
- **No:** sonidos en esta spec. El usuario los dejó fuera; van en otra spec.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Índice de fotograma fuera de rango en el último instante (`elapsed` casi igual a la duración) | Eliminar la explosión cuando `elapsed >= EXPLOSION_DURATION / 1000` y limitar el índice a `EXPLOSION_FRAME_COUNT - 1`. |
| `dt` con tope de 0,05 s alarga la animación si el fotograma es lento | Aceptable: el tope solo actúa en tirones y la animación es solo visual. |

---

## Lo que **no** está en esta spec

- Sonidos.
- Efecto en el primer golpe a un bloque gris.
- Partículas u otros efectos visuales.
- Cambios en la colisión, los puntos o la condición de victoria.
- Cambios en `assets/`.

Cada uno de ellos, si llega, va en su propia spec.
