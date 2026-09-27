import { SeatStatus, VenueElement } from '../types';
import { pluralizar } from './sector';

export const COLOR_POR_ESTADO: Record<SeatStatus, string> = {
  available: '#6F3E8F',
  occupied: '#C7CBD4',
  blocked: '#9AA1AE',
  reserved: '#F59E0B',
};

export type SeatLabelMode = 'none' | 'row' | 'all';

/** Cuánto detalle dibujar sobre cada butaca según el zoom. */
export const seatLabelMode = (scale: number): SeatLabelMode => {
  if (scale > 1.2) return 'all';
  if (scale > 0.6) return 'row';
  return 'none';
};

/**
 * Segunda línea del rótulo de cada sector: sus butacas o, si no tiene ninguna,
 * la capacidad declarada. Se cuenta en una sola pasada sobre el recinto.
 */
export const subtitulosDeSector = (
  elements: Record<string, VenueElement>,
  elementIds: string[]
): Record<string, string> => {
  const cuenta: Record<string, number> = {};
  for (const id of elementIds) {
    const el = elements[id];
    if (el?.type === 'seat' && el.sectionId) {
      cuenta[el.sectionId] = (cuenta[el.sectionId] ?? 0) + 1;
    }
  }

  const subtitulos: Record<string, string> = {};
  for (const id of elementIds) {
    const el = elements[id];
    if (!el || el.type === 'seat') continue;
    const asientos = cuenta[id];
    if (asientos) {
      subtitulos[id] = `${asientos} ${pluralizar(asientos, 'asiento', 'asientos')}`;
    } else if (el.type === 'section' && el.capacity) {
      subtitulos[id] = `${el.capacity} de capacidad`;
    }
  }
  return subtitulos;
};
