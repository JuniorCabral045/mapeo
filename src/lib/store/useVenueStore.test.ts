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

/**
 * Corrección posterior a la revisión de la Tarea 7: `moveSector` y
 * `transformSector` aceptan un `guardarHistorial` opcional (default true, así
 * los tests y llamadores de arriba no cambian de comportamiento). El lienzo lo
 * usa en false mientras mueve varios elementos dentro de un mismo gesto del
 * usuario -uno o varios sectores, más asientos sueltos- y cierra el gesto con
 * un solo `saveHistory()` propio. Sin el flag, arrastrar dos sectores juntos
 * dejaba dos pasos de historial (uno por sector) y hacían falta dos "deshacer"
 * para volver atrás.
 */
const sector2: ShapeElement = {
  ...sector,
  id: 'sector-2',
  name: 'Sur',
  x: 500,
  y: 500,
};

const escenarioDosSectores = () => {
  useVenueStore.getState().reset();
  useVenueStore.getState().addElements([
    sector,
    asiento('a1', 120, 120),
    asiento('a2', 140, 120),
    sector2,
    { ...asiento('b1', 520, 520), sectionId: 'sector-2' },
  ]);
};

describe('guardarHistorial opcional (uso real del lienzo)', () => {
  beforeEach(escenarioDosSectores);

  it('mover un sector con el flag en false no agrega un paso de historial', () => {
    const antes = useVenueStore.getState().historyIndex;

    useVenueStore.getState().moveSector('sector-1', 300, 400, false);

    // El movimiento sí se aplicó...
    expect([useVenueStore.getState().elements['a1'].x, useVenueStore.getState().elements['a1'].y])
      .toEqual([320, 420]);
    // ...pero no quedó registrado en el historial.
    expect(useVenueStore.getState().historyIndex).toBe(antes);
  });

  it('transformar un sector con el flag en false no agrega un paso de historial', () => {
    const antes = useVenueStore.getState().historyIndex;

    useVenueStore.getState().transformSector('sector-1', {
      x: 100, y: 100, rotation: 90, scaleX: 1, scaleY: 1,
    }, false);

    expect(useVenueStore.getState().elements['a1'].rotation).toBeCloseTo(90);
    expect(useVenueStore.getState().historyIndex).toBe(antes);
  });

  it('mover dos sectores omitiendo historial y cerrar con un saveHistory() deja un solo paso, y undo() los devuelve juntos', () => {
    // Esta es la secuencia real que corre EditorCanvas.handleDragEnd cuando el
    // usuario arrastra una selección de varios sectores: Konva no dispara un
    // evento de arrastre por nodo (solo el nodo tocado lo emite), así que el
    // manejador mueve todo con el flag en false y cierra el gesto una sola vez.
    const antes = useVenueStore.getState().historyIndex;
    const posicionPreviaA1 = { ...useVenueStore.getState().elements['a1'] };
    const posicionPreviaB1 = { ...useVenueStore.getState().elements['b1'] };

    useVenueStore.getState().moveSector('sector-1', 300, 400, false);
    useVenueStore.getState().moveSector('sector-2', 900, 900, false);
    useVenueStore.getState().saveHistory();

    // Un solo paso, no dos.
    expect(useVenueStore.getState().historyIndex).toBe(antes + 1);

    // Ambos sectores se movieron de verdad, con sus asientos.
    expect([useVenueStore.getState().elements['a1'].x, useVenueStore.getState().elements['a1'].y])
      .toEqual([320, 420]);
    expect([useVenueStore.getState().elements['b1'].x, useVenueStore.getState().elements['b1'].y])
      .toEqual([920, 920]);

    // Un solo undo() basta para volver los dos sectores (y sus asientos) atrás.
    useVenueStore.getState().undo();
    expect([useVenueStore.getState().elements['a1'].x, useVenueStore.getState().elements['a1'].y])
      .toEqual([posicionPreviaA1.x, posicionPreviaA1.y]);
    expect([useVenueStore.getState().elements['b1'].x, useVenueStore.getState().elements['b1'].y])
      .toEqual([posicionPreviaB1.x, posicionPreviaB1.y]);
  });

  it('lo mismo para transformSector: dos sectores, un solo paso, un solo undo() los devuelve juntos', () => {
    const antes = useVenueStore.getState().historyIndex;
    const rotacionPreviaA1 = useVenueStore.getState().elements['a1'].rotation;
    const rotacionPreviaB1 = useVenueStore.getState().elements['b1'].rotation;

    useVenueStore.getState().transformSector('sector-1', {
      x: 100, y: 100, rotation: 90, scaleX: 1, scaleY: 1,
    }, false);
    useVenueStore.getState().transformSector('sector-2', {
      x: 500, y: 500, rotation: 90, scaleX: 1, scaleY: 1,
    }, false);
    useVenueStore.getState().saveHistory();

    expect(useVenueStore.getState().historyIndex).toBe(antes + 1);
    expect(useVenueStore.getState().elements['a1'].rotation).toBeCloseTo(90);
    expect(useVenueStore.getState().elements['b1'].rotation).toBeCloseTo(90);

    useVenueStore.getState().undo();
    expect(useVenueStore.getState().elements['a1'].rotation).toBeCloseTo(rotacionPreviaA1);
    expect(useVenueStore.getState().elements['b1'].rotation).toBeCloseTo(rotacionPreviaB1);
  });
});
