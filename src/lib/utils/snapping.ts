import { GridConfig, VenueElement } from '../types';
import { elementBounds } from './bounds';
import { snapToGrid } from './grid';

export interface Guide {
  axis: 'v' | 'h';
  pos: number;
}

export interface SnapResult {
  x: number;
  y: number;
  guides: Guide[];
}

export interface SnapArgs {
  /** Posición del nodo arrastrado (su origen, no su caja). */
  x: number;
  y: number;
  width: number;
  height: number;
  /**
   * Distancia del origen a la esquina de su caja. Cero para rectángulos y
   * polígonos; `-radio` para círculos y arcos, que se dibujan centrados.
   */
  offsetX?: number;
  offsetY?: number;
  /** Ids que no cuentan como candidatos (lo que se está arrastrando). */
  excludedIds: string[];
  elements: Record<string, VenueElement>;
  elementIds: string[];
  grid: GridConfig;
  /** Escala del lienzo, para medir el umbral en píxeles de pantalla. */
  scale: number;
}

/** Distancia de enganche, en píxeles de pantalla. */
const UMBRAL_PX = 6;

interface Enganche {
  distancia: number;
  desplazamiento: number;
  guias: number[];
}

/** El objetivo más cercano dentro del umbral, con todas las guías que coinciden con él. */
const mejorEnganche = (mios: number[], objetivos: number[], umbral: number): Enganche | null => {
  let mejor: Enganche | null = null;
  for (const objetivo of objetivos) {
    for (const mio of mios) {
      const distancia = Math.abs(objetivo - mio);
      if (distancia > umbral) continue;
      const desplazamiento = objetivo - mio;
      if (!mejor || distancia < mejor.distancia) {
        mejor = { distancia, desplazamiento, guias: [objetivo] };
      } else if (desplazamiento === mejor.desplazamiento && !mejor.guias.includes(objetivo)) {
        mejor.guias.push(objetivo);
      }
    }
  }
  return mejor;
};

/**
 * Ajusta una posición al imán de grilla y al de otros sectores.
 *
 * Candidatos: solo sectores y escenarios. Los asientos quedan afuera a propósito
 * — son miles y engancharían con todo. Con menos de cien candidatos en un recinto
 * real, un barrido lineal alcanza y evita mantener un índice espacial.
 */
export const snapPosition = ({
  x, y, width, height, offsetX = 0, offsetY = 0,
  excludedIds, elements, elementIds, grid, scale,
}: SnapArgs): SnapResult => {
  let snappedX = x;
  let snappedY = y;

  if (grid.enabled) {
    const ajustado = snapToGrid(x, y, grid.size);
    snappedX = ajustado.x;
    snappedY = ajustado.y;
  }

  if (!grid.snapToElements) return { x: snappedX, y: snappedY, guides: [] };

  const umbral = UMBRAL_PX / (scale || 1);
  const excluidos = new Set(excludedIds);

  const izquierda = x + offsetX;
  const arriba = y + offsetY;
  const misX = [izquierda, izquierda + width / 2, izquierda + width];
  const misY = [arriba, arriba + height / 2, arriba + height];

  const objetivosX: number[] = [];
  const objetivosY: number[] = [];
  for (const id of elementIds) {
    const el = elements[id];
    if (!el || excluidos.has(id) || el.type === 'seat' || el.locked) continue;
    const caja = elementBounds(el);
    objetivosX.push(caja.minX, (caja.minX + caja.maxX) / 2, caja.maxX);
    objetivosY.push(caja.minY, (caja.minY + caja.maxY) / 2, caja.maxY);
  }

  const guides: Guide[] = [];
  const enX = mejorEnganche(misX, objetivosX, umbral);
  if (enX) {
    snappedX = x + enX.desplazamiento;
    guides.push(...enX.guias.map((pos) => ({ axis: 'v' as const, pos })));
  }
  const enY = mejorEnganche(misY, objetivosY, umbral);
  if (enY) {
    snappedY = y + enY.desplazamiento;
    guides.push(...enY.guias.map((pos) => ({ axis: 'h' as const, pos })));
  }

  return { x: snappedX, y: snappedY, guides };
};
