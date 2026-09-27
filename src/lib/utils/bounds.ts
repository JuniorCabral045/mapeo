import { SeatElement, ShapeElement, VenueElement, ViewState } from '../types';

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export const MIN_SCALE = 0.05;
export const MAX_SCALE = 5;

export const clampScale = (scale: number) => Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));

/** Formas que Konva dibuja centradas en el origen del grupo, no desde la esquina. */
export const esRadial = (el: ShapeElement) =>
  el.sectionType === 'circle' || el.sectionType === 'arc';

/**
 * Caja que ocupa un elemento en coordenadas de mundo.
 *
 * No contempla la rotación: para encuadrar alcanza, y evita rotar cuatro
 * esquinas en el camino caliente del render.
 */
export const elementBounds = (el: VenueElement): Bounds => {
  if (el.type === 'seat') {
    const { x, y, radius } = el as SeatElement;
    return { minX: x - radius, minY: y - radius, maxX: x + radius, maxY: y + radius };
  }

  const shape = el as ShapeElement;

  if (esRadial(shape)) {
    const r = shape.sectionType === 'circle'
      ? shape.radius ?? shape.width / 2
      : shape.outerRadius ?? shape.width / 2;
    return { minX: shape.x - r, minY: shape.y - r, maxX: shape.x + r, maxY: shape.y + r };
  }

  return {
    minX: shape.x,
    minY: shape.y,
    maxX: shape.x + shape.width,
    maxY: shape.y + shape.height,
  };
};

/** Punto alrededor del cual espejar o rotar un elemento. */
export const centerOf = (el: VenueElement): { x: number; y: number } => {
  if (el.type !== 'seat' && esRadial(el as ShapeElement)) {
    return { x: el.x, y: el.y };
  }
  const caja = elementBounds(el);
  return { x: (caja.minX + caja.maxX) / 2, y: (caja.minY + caja.maxY) / 2 };
};

/** Caja que abarca a todos los elementos indicados. `null` si no hay ninguno. */
export const calculateBounds = (
  elements: Record<string, VenueElement>,
  elementIds: string[]
): Bounds | null => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let hubo = false;

  for (const id of elementIds) {
    const el = elements[id];
    if (!el) continue;
    hubo = true;
    const caja = elementBounds(el);
    if (caja.minX < minX) minX = caja.minX;
    if (caja.minY < minY) minY = caja.minY;
    if (caja.maxX > maxX) maxX = caja.maxX;
    if (caja.maxY > maxY) maxY = caja.maxY;
  }

  return hubo ? { minX, minY, maxX, maxY } : null;
};

/** Vista que deja la caja centrada en un contenedor de `width` × `height`; `margin` < 1 deja aire. */
export const fitView = (
  bounds: Bounds,
  width: number,
  height: number,
  margin = 0.85
): ViewState => {
  const ancho = bounds.maxX - bounds.minX || 1;
  const alto = bounds.maxY - bounds.minY || 1;
  const scale = clampScale(Math.min(width / ancho, height / alto) * margin);

  return {
    scale,
    x: (width - ancho * scale) / 2 - bounds.minX * scale,
    y: (height - alto * scale) / 2 - bounds.minY * scale,
  };
};

/**
 * Vista escalada por `factor` dejando fijo el punto de pantalla `punto`: lo que
 * está bajo el mouse (o en el centro, para los botones) sigue ahí después del zoom.
 */
export const zoomAt = (
  view: ViewState,
  punto: { x: number; y: number },
  factor: number
): ViewState => {
  const scale = clampScale(view.scale * factor);
  return {
    scale,
    x: punto.x - ((punto.x - view.x) / view.scale) * scale,
    y: punto.y - ((punto.y - view.y) / view.scale) * scale,
  };
};
