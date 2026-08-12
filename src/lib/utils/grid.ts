/** Ajusta una coordenada a la grilla del editor. */
export const snapToGrid = (x: number, y: number, gridSize: number) => ({
  x: Math.round(x / gridSize) * gridSize,
  y: Math.round(y / gridSize) * gridSize,
});

/**
 * Paso con el que se dibuja la grilla, en unidades de mundo, garantizando que
 * en pantalla nunca quede más fina que `minPixelSize`. A diferencia de
 * multiplicar por un factor fijo una sola vez (que alcanza en la mayoría de
 * los casos pero no en el zoom mínimo con el paso mínimo), acá se calcula el
 * múltiplo entero justo y necesario del paso elegido por el usuario, así el
 * imán a la grilla sigue enganchando donde caen las líneas.
 */
export const effectiveGridStep = (step: number, scale: number, minPixelSize = 4): number => {
  const pixelsPerStep = step * scale;
  if (!(pixelsPerStep > 0)) return step;
  const factor = Math.max(1, Math.ceil(minPixelSize / pixelsPerStep));
  return step * factor;
};

/**
 * Rectángulo, en coordenadas de mundo, sobre el que se dibuja la grilla:
 * el viewport visible más un margen de un viewport entero en cada dirección.
 * El margen existe para que un gesto de paneo sostenido -que Konva anima de
 * forma nativa sin re-renderizar React- encuentre grilla ya dibujada en el
 * borde hacia el que avanza, en vez de recalcular en cada frame.
 */
export const visibleGridRect = (
  view: { x: number; y: number; scale: number },
  viewport: { width: number; height: number }
): { minX: number; minY: number; maxX: number; maxY: number } => {
  const worldWidth = viewport.width / view.scale;
  const worldHeight = viewport.height / view.scale;
  const originX = -view.x / view.scale;
  const originY = -view.y / view.scale;

  return {
    minX: originX - worldWidth,
    minY: originY - worldHeight,
    maxX: originX + worldWidth * 2,
    maxY: originY + worldHeight * 2,
  };
};
