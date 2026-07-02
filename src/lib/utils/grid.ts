/** Ajusta una coordenada a la grilla del editor. */
export const snapToGrid = (x: number, y: number, gridSize: number) => ({
  x: Math.round(x / gridSize) * gridSize,
  y: Math.round(y / gridSize) * gridSize,
});
