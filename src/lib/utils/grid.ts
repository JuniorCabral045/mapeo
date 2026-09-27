/** Ajusta una coordenada a la grilla del editor. */
export const snapToGrid = (x: number, y: number, gridSize: number) => ({
  x: Math.round(x / gridSize) * gridSize,
  y: Math.round(y / gridSize) * gridSize,
});

/**
 * Paso con el que se dibuja la grilla: el menor múltiplo entero del paso elegido
 * que en pantalla no quede más fino que `minPixelSize`. Al ser múltiplo, el imán
 * sigue enganchando donde caen las líneas.
 */
export const effectiveGridStep = (step: number, scale: number, minPixelSize = 4): number => {
  const pixelsPerStep = step * scale;
  if (!(pixelsPerStep > 0)) return step;
  const factor = Math.max(1, Math.ceil(minPixelSize / pixelsPerStep));
  return step * factor;
};

/** Rectángulo visible, en coordenadas de mundo. */
export const visibleGridRect = (
  view: { x: number; y: number; scale: number },
  viewport: { width: number; height: number }
): { minX: number; minY: number; maxX: number; maxY: number } => {
  const worldWidth = viewport.width / view.scale;
  const worldHeight = viewport.height / view.scale;
  const originX = -view.x / view.scale;
  const originY = -view.y / view.scale;

  return {
    minX: originX,
    minY: originY,
    maxX: originX + worldWidth,
    maxY: originY + worldHeight,
  };
};
