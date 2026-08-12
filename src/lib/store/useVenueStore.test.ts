import { beforeEach, describe, expect, it } from 'vitest';
import { useVenueStore } from './useVenueStore';
import type { VenueMap } from '../types';

/**
 * El encuadre al abrir un recinto depende de dos piezas que llegan de componentes
 * distintos y sin orden garantizado entre sí: `loadMap` (disparado por VenueEditor)
 * y `setCanvasSize` (publicado por EditorCanvas al medir su contenedor). Hoy el
 * orden real lo da React al correr los efectos de los hijos antes que los del
 * padre, pero eso es un detalle de implementación, no un contrato. Estos tests
 * fijan el comportamiento correcto en los dos órdenes posibles.
 */

const mapaConSector = (): VenueMap => ({
  version: 1,
  name: 'Recinto de prueba',
  sectors: [
    {
      id: 'sector-1',
      name: 'Norte',
      kind: 'section',
      shape: 'rectangle',
      x: 0,
      y: 0,
      width: 400,
      height: 300,
      rotation: 0,
      fill: '#6F3E8F',
      active: true,
      seats: [],
    },
  ],
});

// bounds del sector: {minX:0, minY:0, maxX:400, maxY:300}
// fitView(bounds, 800, 600) con el margen por defecto (0.85):
//   escala = min(800/400, 600/300) * 0.85 = 1.7
//   x = (800 - 400*1.7)/2 = 60 ; y = (600 - 300*1.7)/2 = 45
const VISTA_ENCUADRADA = { scale: 1.7, x: 60, y: 45 };

describe('encuadre al cargar un mapa (orden entre loadMap y setCanvasSize)', () => {
  beforeEach(() => {
    useVenueStore.getState().reset();
  });

  it('si el mapa se carga antes de medir el lienzo, encuadra recien cuando llega la medida', () => {
    useVenueStore.getState().loadMap(mapaConSector());

    // Todavia no hay medicion real: el encuadre queda pendiente, no se aplica
    // con el tamaño por defecto del store.
    expect(useVenueStore.getState().pendingFit).toBe(true);
    expect(useVenueStore.getState().viewState).toEqual({ scale: 1, x: 100, y: 100 });

    // Llega la medicion real del contenedor (lo que hace EditorCanvas).
    useVenueStore.getState().setCanvasSize(800, 600);

    expect(useVenueStore.getState().pendingFit).toBe(false);
    expect(useVenueStore.getState().hasMeasuredCanvas).toBe(true);
    expect(useVenueStore.getState().viewState).toEqual(VISTA_ENCUADRADA);
  });

  it('si el lienzo ya fue medido, cargar el mapa encuadra de inmediato', () => {
    // El lienzo ya publico su tamaño real antes de que exista un mapa que encuadrar.
    useVenueStore.getState().setCanvasSize(800, 600);
    expect(useVenueStore.getState().hasMeasuredCanvas).toBe(true);

    useVenueStore.getState().loadMap(mapaConSector());

    expect(useVenueStore.getState().pendingFit).toBe(false);
    expect(useVenueStore.getState().viewState).toEqual(VISTA_ENCUADRADA);
  });
});
