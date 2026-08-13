import { GridConfig, ShapeElement, VenueElement } from '../types';
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
  x: number;
  y: number;
  width: number;
  height: number;
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

/**
 * Ajusta una posición al imán de grilla y al de otros sectores.
 *
 * Candidatos: solo sectores y escenarios. Los asientos quedan afuera a propósito
 * — son miles y engancharían con todo. Con menos de cien candidatos en un recinto
 * real, un barrido lineal alcanza y evita mantener un índice espacial.
 */
export const snapPosition = ({
  x, y, width, height, excludedIds, elements, elementIds, grid, scale,
}: SnapArgs): SnapResult => {
  let snappedX = x;
  let snappedY = y;
  const guides: Guide[] = [];

  if (grid.enabled) {
    const ajustado = snapToGrid(x, y, grid.size);
    snappedX = ajustado.x;
    snappedY = ajustado.y;
  }

  if (!grid.snapToElements) return { x: snappedX, y: snappedY, guides };

  const umbral = UMBRAL_PX / (scale || 1);
  const excluidos = new Set(excludedIds);

  // Bordes y centro de lo que se arrastra.
  const misX = [x, x + width / 2, x + width];
  const misY = [y, y + height / 2, y + height];

  for (const id of elementIds) {
    const el = elements[id];
    if (!el || excluidos.has(id)) continue;
    if (el.type === 'seat') continue;
    if ((el as ShapeElement).locked) continue;

    const caja = elementBounds(el);
    const objetivosX = [caja.minX, (caja.minX + caja.maxX) / 2, caja.maxX];
    const objetivosY = [caja.minY, (caja.minY + caja.maxY) / 2, caja.maxY];

    for (const objetivo of objetivosX) {
      for (const mio of misX) {
        if (Math.abs(mio - objetivo) <= umbral) {
          snappedX = objetivo - (mio - x);
          guides.push({ axis: 'v', pos: objetivo });
        }
      }
    }

    for (const objetivo of objetivosY) {
      for (const mio of misY) {
        if (Math.abs(mio - objetivo) <= umbral) {
          snappedY = objetivo - (mio - y);
          guides.push({ axis: 'h', pos: objetivo });
        }
      }
    }
  }

  return { x: snappedX, y: snappedY, guides };
};
