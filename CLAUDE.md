# CLAUDE.md

Este archivo ofrece orientación a Claude Code (claude.ai/code) cuando trabaja con el código de este repositorio.

## Estado del proyecto

Juego Arkanoid en HTML, CSS y JavaScript puros — **cero dependencias** (según `readme.md`, escrito en español). El juego en sí todavía no está implementado: solo existen los recursos (assets). No hay `index.html`, sistema de build, gestor de paquetes, linter ni configuración de tests, por lo que no hay comandos de build/lint/test. Cuando exista un `index.html`, ábrelo directamente en el navegador (o sirve la carpeta de forma estática, ya que el spritesheet se carga mediante `Image`).

## Recursos (`assets/`)

- `spritesheet-breakout.png` — spritesheet único para la paleta, la pelota, los bloques y las animaciones de explosión.
- `spritesheet.js` — script simple de ámbito global (sin módulos). Debe cargarse mediante `<script>` antes del código del juego. Define:
  - `SPRITES` — rectángulos de origen (`sx, sy, sw, sh`) para `paddle`, `ball` y `blocks.<color>` (gray, red, yellow, cyan, magenta, hotpink, green). Los bloques miden 32×16.
  - `EXPLOSION_FRAMES` / `EXPLOSION_DURATION` (150) — animación de rotura de 4 fotogramas por color de bloque. Nota: `gray` reutiliza los fotogramas de `red`.
  - `loadSpritesheet(cb)` — carga asíncrona; copia la imagen a un canvas fuera de pantalla y llama a `cb` cuando está lista (se puede llamar varias veces sin problema). La ruta `assets/spritesheet-breakout.png` es relativa a la página HTML.
  - `drawSprite(ctx, name, x, y, w, h)` — `name` es una clave de `SPRITES` o `block_<color>`; `drawFrame(ctx, frame, x, y, w, h)` dibuja los fotogramas de explosión. Ambas no hacen nada (sin error) hasta que el spritesheet se ha cargado, así que inicia el bucle del juego desde el callback de `loadSpritesheet`.
- `sounds/ball-bounce.mp3`, `sounds/break-sound.mp3` — efectos de sonido para los rebotes de la pelota y la rotura de bloques.
