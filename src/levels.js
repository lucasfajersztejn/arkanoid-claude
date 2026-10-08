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
