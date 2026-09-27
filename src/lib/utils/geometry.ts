import { CornerRadius } from '../types';

/** Test punto-en-polígono (ray casting). points = pares x,y. */
export const pointInPolygon = (px: number, py: number, points: number[]): boolean => {
  let inside = false;
  const n = points.length / 2;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = points[i * 2], yi = points[i * 2 + 1];
    const xj = points[j * 2], yj = points[j * 2 + 1];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
};

export const createRoundedRectPath = (
  x: number,
  y: number,
  width: number,
  height: number,
  radius: CornerRadius | number
) => {
  const r = typeof radius === 'number'
    ? { topLeft: radius, topRight: radius, bottomLeft: radius, bottomRight: radius }
    : radius;

  const tope = Math.min(width / 2, height / 2);
  const tl = Math.min(r.topLeft, tope);
  const tr = Math.min(r.topRight, tope);
  const bl = Math.min(r.bottomLeft, tope);
  const br = Math.min(r.bottomRight, tope);

  return [
    `M ${x + tl} ${y}`,
    `L ${x + width - tr} ${y}`,
    `Q ${x + width} ${y} ${x + width} ${y + tr}`,
    `L ${x + width} ${y + height - br}`,
    `Q ${x + width} ${y + height} ${x + width - br} ${y + height}`,
    `L ${x + bl} ${y + height}`,
    `Q ${x} ${y + height} ${x} ${y + height - bl}`,
    `L ${x} ${y + tl}`,
    `Q ${x} ${y} ${x + tl} ${y}`,
    'Z'
  ].join(' ');
};

export interface PoligonoCerrado {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Vértices relativos a (x, y). */
  points: number[];
}

/**
 * Convierte los clics del dibujo de polígono (coordenadas de mundo) en un sector.
 *
 * El doble clic que cierra el dibujo también dispara dos `mousedown`, así que el
 * último vértice llega repetido: se descartan los consecutivos iguales antes de
 * contar. Con menos de tres vértices distintos no hay polígono.
 */
export const poligonoDesdeBorrador = (borrador: number[]): PoligonoCerrado | null => {
  const vertices: number[] = [];
  for (let i = 0; i + 1 < borrador.length; i += 2) {
    const x = borrador[i];
    const y = borrador[i + 1];
    const n = vertices.length;
    if (n >= 2 && vertices[n - 2] === x && vertices[n - 1] === y) continue;
    vertices.push(x, y);
  }
  const n = vertices.length;
  if (n >= 4 && vertices[0] === vertices[n - 2] && vertices[1] === vertices[n - 1]) {
    vertices.splice(n - 2, 2);
  }
  if (vertices.length < 6) return null;

  const xs = vertices.filter((_, i) => i % 2 === 0);
  const ys = vertices.filter((_, i) => i % 2 === 1);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);

  return {
    x: minX,
    y: minY,
    width: Math.max(5, Math.max(...xs) - minX),
    height: Math.max(5, Math.max(...ys) - minY),
    points: vertices.map((p, i) => (i % 2 === 0 ? p - minX : p - minY)),
  };
};
