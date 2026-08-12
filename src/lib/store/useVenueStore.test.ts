import { beforeEach, describe, expect, it } from 'vitest';
import { useVenueStore } from './useVenueStore';
import type { SeatElement, ShapeElement, VenueMap } from '../types';

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

  it('reset() no debe olvidar que el lienzo ya fue medido: editor vacio -> importar JSON', () => {
    // Camino real de VenueEditor sin initialMap: EditorCanvas ya midio y publico el
    // tamaño del lienzo (el <canvas> sigue montado, no desaparece con un reset), y
    // recien despues VenueEditor llama reset() al montarse. Si reset() pisara
    // hasMeasuredCanvas a false, el boton "Importar JSON" de la barra (que llama a
    // loadMap directo) creeria que el lienzo nunca fue medido, dejaria el encuadre
    // pendiente, y nada volveria a llamar setCanvasSize (su efecto no se re-ejecuta
    // sin un resize real): el mapa importado quedaria sin encuadrar.
    useVenueStore.getState().setCanvasSize(800, 600);
    expect(useVenueStore.getState().hasMeasuredCanvas).toBe(true);

    useVenueStore.getState().reset();

    useVenueStore.getState().loadMap(mapaConSector());

    expect(useVenueStore.getState().pendingFit).toBe(false);
    expect(useVenueStore.getState().viewState).toEqual(VISTA_ENCUADRADA);
  });
});

/**
 * En el lienzo los asientos no son hijos del sector: son hermanos con coordenadas
 * absolutas. Estas pruebas fijan que, para el usuario, se comporten como una sola
 * cosa — mover una tribuna con 500 butacas y que las butacas se queden atrás es
 * el tipo de bug que se descubre después de guardar.
 */

const sector: ShapeElement = {
  id: 'sector-1',
  type: 'section',
  name: 'Norte',
  x: 100,
  y: 100,
  width: 200,
  height: 100,
  rotation: 0,
  visible: true,
  locked: false,
  opacity: 0.2,
  zIndex: 5,
  fill: '#6F3E8F',
  isActive: true,
  sectionType: 'rectangle',
};

const asiento = (id: string, x: number, y: number): SeatElement => ({
  id,
  type: 'seat',
  name: id,
  x,
  y,
  rotation: 0,
  visible: true,
  locked: false,
  opacity: 1,
  zIndex: 10,
  sectionId: 'sector-1',
  row: 'A',
  number: id.slice(-1),
  status: 'available',
  radius: 5,
});

const escenario = () => {
  useVenueStore.getState().reset();
  useVenueStore.getState().addElements([
    sector,
    asiento('a1', 120, 120),
    asiento('a2', 140, 120),
  ]);
};

describe('sector y asientos como una unidad', () => {
  beforeEach(escenario);

  describe('mover un sector', () => {
    it('lleva sus asientos con él', () => {
      useVenueStore.getState().moveSector('sector-1', 300, 400);
      const { elements } = useVenueStore.getState();

      expect([elements['a1'].x, elements['a1'].y]).toEqual([320, 420]);
      expect([elements['a2'].x, elements['a2'].y]).toEqual([340, 420]);
    });

    it('no toca asientos de otro sector', () => {
      useVenueStore.getState().updateElement('a2', { sectionId: 'otro' });
      useVenueStore.getState().moveSector('sector-1', 300, 400);

      expect(useVenueStore.getState().elements['a2'].x).toBe(140);
    });

    it('deja un solo paso de historial', () => {
      const antes = useVenueStore.getState().historyIndex;
      useVenueStore.getState().moveSector('sector-1', 300, 400);

      expect(useVenueStore.getState().historyIndex).toBe(antes + 1);
    });
  });

  describe('transformar un sector', () => {
    it('reescala la posición de los asientos', () => {
      useVenueStore.getState().transformSector('sector-1', {
        x: 100, y: 100, rotation: 0, scaleX: 2, scaleY: 1,
      });

      // a1 estaba 20px a la derecha del origen del sector; al duplicar el ancho, 40.
      expect(useVenueStore.getState().elements['a1'].x).toBeCloseTo(140);
      expect(useVenueStore.getState().elements['a1'].y).toBeCloseTo(120);
    });

    it('rota los asientos alrededor del origen del sector y los orienta', () => {
      useVenueStore.getState().transformSector('sector-1', {
        x: 100, y: 100, rotation: 90, scaleX: 1, scaleY: 1,
      });
      const a1 = useVenueStore.getState().elements['a1'];

      // (20,20) rotado 90° alrededor del origen del sector → (-20,20)
      expect(a1.x).toBeCloseTo(80);
      expect(a1.y).toBeCloseTo(120);
      expect(a1.rotation).toBeCloseTo(90);
    });
  });

  describe('borrar un sector', () => {
    it('borra también sus asientos', () => {
      // Sin cascada quedaban huérfanos y el serializador los metía en un sector
      // «General» que nadie creó y que el backend después daba de alta.
      useVenueStore.getState().deleteElements(['sector-1']);
      const { elements, elementIds } = useVenueStore.getState();

      expect(elementIds).toEqual([]);
      expect(elements).toEqual({});
    });

    it('borrar un asiento suelto no toca al sector', () => {
      useVenueStore.getState().deleteElements(['a1']);

      expect(useVenueStore.getState().elementIds).toEqual(['sector-1', 'a2']);
    });

    it('deja un solo paso de historial, así deshacer devuelve todo junto', () => {
      const antes = useVenueStore.getState().historyIndex;
      useVenueStore.getState().deleteElements(['sector-1']);

      expect(useVenueStore.getState().historyIndex).toBe(antes + 1);

      useVenueStore.getState().undo();
      expect(useVenueStore.getState().elementIds.length).toBe(3);
    });
  });
});
