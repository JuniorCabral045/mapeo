import { VenueElement } from '../types';
import { elementBounds } from './bounds';

export type AlignMode = 'left' | 'center-x' | 'right' | 'top' | 'center-y' | 'bottom';
export type DistributeAxis = 'x' | 'y';

/** Posiciones nuevas por id. Solo incluye lo que efectivamente se mueve. */
export type Movimientos = Record<string, { x: number; y: number }>;

const movibles = (elements: Record<string, VenueElement>, ids: string[]) =>
  ids.map((id) => elements[id]).filter((el): el is VenueElement => !!el && !el.locked);

/**
 * Alinea una selección.
 *
 * Trabaja sobre la caja de cada elemento, no sobre su x,y: un círculo se dibuja
 * centrado en su origen, así que alinear por origen lo dejaría corrido medio radio.
 */
export const alignElements = (
  elements: Record<string, VenueElement>,
  ids: string[],
  mode: AlignMode
): Movimientos => {
  const seleccion = movibles(elements, ids);
  if (seleccion.length < 2) return {};

  const cajas = seleccion.map((el) => ({ el, caja: elementBounds(el) }));
  const minX = Math.min(...cajas.map((c) => c.caja.minX));
  const maxX = Math.max(...cajas.map((c) => c.caja.maxX));
  const minY = Math.min(...cajas.map((c) => c.caja.minY));
  const maxY = Math.max(...cajas.map((c) => c.caja.maxY));
  const centroX = (minX + maxX) / 2;
  const centroY = (minY + maxY) / 2;

  const movimientos: Movimientos = {};

  for (const { el, caja } of cajas) {
    const ancho = caja.maxX - caja.minX;
    const alto = caja.maxY - caja.minY;
    let destinoX = caja.minX;
    let destinoY = caja.minY;

    if (mode === 'left') destinoX = minX;
    if (mode === 'right') destinoX = maxX - ancho;
    if (mode === 'center-x') destinoX = centroX - ancho / 2;
    if (mode === 'top') destinoY = minY;
    if (mode === 'bottom') destinoY = maxY - alto;
    if (mode === 'center-y') destinoY = centroY - alto / 2;

    // La caja puede estar corrida respecto del origen (círculos, arcos).
    movimientos[el.id] = {
      x: el.x + (destinoX - caja.minX),
      y: el.y + (destinoY - caja.minY),
    };
  }

  return movimientos;
};

/** Reparte los elementos del medio dejando huecos iguales. Los extremos no se mueven. */
export const distributeElements = (
  elements: Record<string, VenueElement>,
  ids: string[],
  axis: DistributeAxis
): Movimientos => {
  const seleccion = movibles(elements, ids);
  if (seleccion.length < 3) return {};

  const cajas = seleccion
    .map((el) => ({ el, caja: elementBounds(el) }))
    .sort((a, b) => (axis === 'x' ? a.caja.minX - b.caja.minX : a.caja.minY - b.caja.minY));

  const tamano = (c: (typeof cajas)[number]) =>
    axis === 'x' ? c.caja.maxX - c.caja.minX : c.caja.maxY - c.caja.minY;

  const inicio = axis === 'x' ? cajas[0].caja.minX : cajas[0].caja.minY;
  const ultimo = cajas[cajas.length - 1];
  const fin = axis === 'x' ? ultimo.caja.maxX : ultimo.caja.maxY;

  const ocupado = cajas.reduce((suma, c) => suma + tamano(c), 0);
  const hueco = (fin - inicio - ocupado) / (cajas.length - 1);

  const movimientos: Movimientos = {};
  let cursor = inicio + tamano(cajas[0]) + hueco;

  for (let i = 1; i < cajas.length - 1; i++) {
    const { el, caja } = cajas[i];
    const actual = axis === 'x' ? caja.minX : caja.minY;
    const delta = cursor - actual;
    movimientos[el.id] = {
      x: axis === 'x' ? el.x + delta : el.x,
      y: axis === 'y' ? el.y + delta : el.y,
    };
    cursor += tamano(cajas[i]) + hueco;
  }

  return movimientos;
};
