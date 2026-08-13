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

/**
 * Corrección posterior a la revisión de la Tarea 11: `alignSelection` y
 * `distributeSelection` reusan `aplicarMovimientos`, que movía sectores y
 * asientos sueltos a la vez sumando deltas sin filtrar pertenencia. Si un
 * asiento y su propio sector estaban los dos en la selección -fácil con la
 * goma, que agarra por posición- el asiento recibía dos movimientos: el suyo
 * propio (calculado por `alignElements`) y el que le aplica su sector al
 * arrastrar sus asientos. Cuál ganaba dependía del orden de iteración de
 * `Object.keys(movimientos)», que sigue el orden de inserción de `selectedIds`.
 * `idsToMoveIndividually` (ya usado por el arrastre del lienzo para el mismo
 * problema) es la que decide por pertenencia, no por orden.
 */
describe('alinear y distribuir la seleccion (store)', () => {
  beforeEach(escenario);

  describe('alinear', () => {
    it('una seleccion de sectores deja un solo paso de historial y los asientos acompañan', () => {
      useVenueStore.getState().addElements([sector2, { ...asiento('b1', 520, 520), sectionId: 'sector-2' }]);
      const antes = useVenueStore.getState().historyIndex;

      useVenueStore.getState().selectElements(['sector-1', 'sector-2']);
      useVenueStore.getState().alignSelection('left');

      // sector-1 esta en x=100 (mas a la izquierda que sector-2 en x=500):
      // sector-2 se mueve a x=100, arrastrando a b1 con el mismo delta (-400).
      expect(useVenueStore.getState().elements['sector-2'].x).toBe(100);
      expect(useVenueStore.getState().elements['b1'].x).toBe(120);
      // sector-1 no se movio (ya era el mas a la izquierda) y sus asientos tampoco.
      expect(useVenueStore.getState().elements['a1'].x).toBe(120);

      // Un solo paso de historial para toda la operacion, no uno por elemento.
      expect(useVenueStore.getState().historyIndex).toBe(antes + 1);
    });
  });

  describe('distribuir', () => {
    it('una seleccion de sectores deja un solo paso de historial y los asientos acompañan', () => {
      useVenueStore.getState().addElements([
        sector2,
        { ...asiento('b1', 520, 520), sectionId: 'sector-2' },
        { ...sector, id: 'sector-3', name: 'Centro', x: 800 },
      ]);
      const antes = useVenueStore.getState().historyIndex;

      useVenueStore.getState().selectElements(['sector-1', 'sector-2', 'sector-3']);
      useVenueStore.getState().distributeSelection('x');

      // sector-1 (100-300) y sector-3 (800-1000) son los extremos: no se mueven.
      // ocupado=600, hueco=(1000-100-600)/2=150; sector-2 pasa de 500 a 450.
      expect(useVenueStore.getState().elements['sector-2'].x).toBe(450);
      // b1 acompaña a sector-2 con el mismo delta (450-500=-50).
      expect(useVenueStore.getState().elements['b1'].x).toBe(470);

      expect(useVenueStore.getState().historyIndex).toBe(antes + 1);
    });
  });

  describe('defecto: un sector y un asiento propio seleccionados juntos', () => {
    // Reproduce el caso del informe: sector S en x=0 con un asiento en x=50 (S se
    // queda quieto porque ya es el más a la izquierda), más un sector T en
    // x=-50. Los tres seleccionados, alinear a la izquierda: el asiento tiene
    // que terminar en x=-45 (acompañando a S, que no se mueve), sin importar en
    // qué orden vengan los ids en la selección.
    const construirEscenario = () => {
      useVenueStore.getState().reset();
      useVenueStore.getState().addElements([
        { ...sector, id: 'S', name: 'S', x: 0 },
        { ...asiento('asiento-de-S', 50, 20), sectionId: 'S' },
        { ...sector, id: 'T', name: 'T', x: -50 },
      ]);
    };

    it('el asiento queda donde corresponde con un orden de seleccion', () => {
      construirEscenario();
      useVenueStore.getState().selectElements(['S', 'asiento-de-S', 'T']);
      useVenueStore.getState().alignSelection('left');

      expect(useVenueStore.getState().elements['S'].x).toBe(-50);
      expect(useVenueStore.getState().elements['asiento-de-S'].x).toBe(0);
    });

    it('el resultado no depende del orden de la seleccion', () => {
      construirEscenario();
      // Mismo escenario, orden de seleccion distinto: el asiento antes que su sector.
      useVenueStore.getState().selectElements(['asiento-de-S', 'S', 'T']);
      useVenueStore.getState().alignSelection('left');

      expect(useVenueStore.getState().elements['S'].x).toBe(-50);
      expect(useVenueStore.getState().elements['asiento-de-S'].x).toBe(0);
    });
  });

  describe('elemento bloqueado', () => {
    it('no se mueve pero ancla el calculo de los demas', () => {
      useVenueStore.getState().addElements([{ ...sector2, locked: true }]);
      // sector-1 (100-300, con a1 y a2) sin bloquear; sector-2 (500-700)
      // bloqueado. Alinear a la derecha: el borde derecho de la selección lo
      // pone sector-2 (700) precisamente porque participa del cálculo -si se
      // lo hubiera ignorado del todo, como antes de la corrección, el único
      // elemento movible quedaría solo en la selección (largo 1) y
      // `alignElements` no haría nada-.
      useVenueStore.getState().selectElements(['sector-1', 'sector-2']);
      useVenueStore.getState().alignSelection('right');

      // sector-2 esta bloqueado: nunca recibe movimiento, sigue en 500.
      expect(useVenueStore.getState().elements['sector-2'].x).toBe(500);
      // sector-1 (ancho 200) se corre para que su borde derecho llegue a 700:
      // x = 700 - 200 = 500. Sus asientos lo acompañan con el mismo delta (+400).
      expect(useVenueStore.getState().elements['sector-1'].x).toBe(500);
      expect(useVenueStore.getState().elements['a1'].x).toBe(520);
    });
  });

  describe('undo', () => {
    it('revierte la operacion entera: sectores y asientos', () => {
      useVenueStore.getState().addElements([sector2, { ...asiento('b1', 520, 520), sectionId: 'sector-2' }]);
      const posicionPreviaSector2 = { ...useVenueStore.getState().elements['sector-2'] };
      const posicionPreviaB1 = { ...useVenueStore.getState().elements['b1'] };

      useVenueStore.getState().selectElements(['sector-1', 'sector-2']);
      useVenueStore.getState().alignSelection('left');
      expect(useVenueStore.getState().elements['sector-2'].x).toBe(100);

      useVenueStore.getState().undo();

      expect(useVenueStore.getState().elements['sector-2'].x).toBe(posicionPreviaSector2.x);
      expect(useVenueStore.getState().elements['b1'].x).toBe(posicionPreviaB1.x);
    });
  });
});

/**
 * Corrección posterior a la revisión de la Tarea 12: falta de cobertura de
 * `duplicateSectors` a nivel del store. `calcularDuplicados` (utils/duplicate.ts)
 * ya tiene su batería propia; lo que hace falta fijar acá es lo que el store le
 * agrega encima -que el duplicado quede seleccionado, listo para moverlo, y que
 * toda la operación (sector + asientos) sea un solo paso de historial, como el
 * resto de las operaciones múltiples de este archivo.
 */
describe('duplicateSectors (store)', () => {
  beforeEach(escenario);

  it('deja seleccionado el sector duplicado, no el original', () => {
    useVenueStore.getState().duplicateSectors(['sector-1'], { dx: 0, dy: 300, mirror: null });

    const { selectedIds, elementIds } = useVenueStore.getState();
    const idNuevo = elementIds.find((id) => id !== 'sector-1' && id !== 'a1' && id !== 'a2' && !id.startsWith('seat-'));

    expect(idNuevo).toBeDefined();
    expect(selectedIds).toEqual([idNuevo]);
  });

  it('agrega el sector y sus asientos duplicados a la escena', () => {
    useVenueStore.getState().duplicateSectors(['sector-1'], { dx: 0, dy: 300, mirror: null });

    const { elements, elementIds } = useVenueStore.getState();
    // 3 originales (sector-1, a1, a2) + 3 duplicados (sector + 2 asientos).
    expect(elementIds).toHaveLength(6);
    const nuevoSector = elementIds
      .map((id) => elements[id])
      .find((el) => el.type !== 'seat' && el.id !== 'sector-1')!;
    expect(nuevoSector.x).toBe(100);
    expect(nuevoSector.y).toBe(400);
  });

  it('deja un solo paso de historial para todo el duplicado (sector + asientos)', () => {
    const antes = useVenueStore.getState().historyIndex;

    useVenueStore.getState().duplicateSectors(['sector-1'], { dx: 0, dy: 300, mirror: null });

    expect(useVenueStore.getState().historyIndex).toBe(antes + 1);
  });

  it('un solo undo() revierte el duplicado entero: sector y asientos desaparecen juntos', () => {
    const elementsPrevios = useVenueStore.getState().elements;

    useVenueStore.getState().duplicateSectors(['sector-1'], { dx: 0, dy: 300, mirror: null });
    expect(useVenueStore.getState().elementIds).toHaveLength(6);

    useVenueStore.getState().undo();

    const { elementIds, elements, selectedIds } = useVenueStore.getState();
    expect(elementIds).toEqual(['sector-1', 'a1', 'a2']);
    expect(elements).toEqual(elementsPrevios);
    // El undo no deja seleccionado el sector duplicado, que ya no existe.
    expect(selectedIds).toEqual([]);
  });
});

/**
 * Corrección posterior a la revisión de la Tarea 16: empujar la selección con
 * las flechas mueve sin guardar historial (`nudgeSelection` llama a
 * `aplicarMovimientos` con `guardarHistorial` en false) y es
 * `useEditorShortcuts` quien cierra el paso con un `saveHistory()` propio
 * cuando el usuario deja de apretar teclas por 400 ms -si cada empuje guardara
 * su propio paso, mantener una flecha apretada llenaría el historial de
 * pasos de un solo píxel y desplazaría todo lo anterior fuera de la ventana
 * de 50.
 *
 * El agrupamiento en sí (el temporizador de 400 ms, `useEffect`, `window`)
 * vive en el hook y no se probó por separado: es puro cableado de un
 * `setTimeout` a `saveHistory()`, no tiene lógica propia que extraer. Lo que
 * sí es responsabilidad del store -y lo que se rompió cuando la limpieza del
 * hook canceló un empuje sin guardar el paso- es este contrato: empujar sin
 * guardar no dejar rastro en el historial, y guardar después de una ráfaga
 * deja exactamente un paso que un solo `undo()` revierte entero.
 */
describe('empuje con flechas y agrupamiento del historial (store)', () => {
  beforeEach(escenarioDosSectores);

  it('empujar la selección sin guardar historial mueve los elementos pero no agrega pasos', () => {
    const antes = useVenueStore.getState().historyIndex;

    useVenueStore.getState().selectElements(['sector-1']);
    useVenueStore.getState().nudgeSelection(10, 0);

    // El movimiento se aplicó...
    expect(useVenueStore.getState().elements['sector-1'].x).toBe(110);
    // ...los asientos del sector lo acompañaron...
    expect(useVenueStore.getState().elements['a1'].x).toBe(130);
    // ...pero no quedó registrado en el historial.
    expect(useVenueStore.getState().historyIndex).toBe(antes);
  });

  it('varios empujes seguidos sin guardar tampoco agregan pasos (la ráfaga completa)', () => {
    const antes = useVenueStore.getState().historyIndex;

    useVenueStore.getState().selectElements(['sector-1']);
    useVenueStore.getState().nudgeSelection(10, 0);
    useVenueStore.getState().nudgeSelection(10, 0);
    useVenueStore.getState().nudgeSelection(0, 10);

    expect(useVenueStore.getState().elements['sector-1'].x).toBe(120);
    expect(useVenueStore.getState().elements['sector-1'].y).toBe(110);
    expect(useVenueStore.getState().historyIndex).toBe(antes);
  });

  it('cerrar la ráfaga con saveHistory() deja exactamente un paso, y undo() devuelve todo a la posición previa', () => {
    const antes = useVenueStore.getState().historyIndex;
    const posicionPreviaSector = { ...useVenueStore.getState().elements['sector-1'] };
    const posicionPreviaA1 = { ...useVenueStore.getState().elements['a1'] };
    const posicionPreviaA2 = { ...useVenueStore.getState().elements['a2'] };

    useVenueStore.getState().selectElements(['sector-1']);
    // La ráfaga: varios empujes sin guardar, como haría el usuario manteniendo
    // apretada la flecha, y el hook cerrando el paso una sola vez al soltar.
    useVenueStore.getState().nudgeSelection(10, 0);
    useVenueStore.getState().nudgeSelection(10, 0);
    useVenueStore.getState().nudgeSelection(0, 10);
    useVenueStore.getState().saveHistory();

    // Un solo paso para toda la ráfaga, no uno por tecla.
    expect(useVenueStore.getState().historyIndex).toBe(antes + 1);

    // undo() devuelve el sector y sus asientos juntos a la posición previa al empuje.
    useVenueStore.getState().undo();
    expect(useVenueStore.getState().elements['sector-1'].x).toBe(posicionPreviaSector.x);
    expect(useVenueStore.getState().elements['sector-1'].y).toBe(posicionPreviaSector.y);
    expect(useVenueStore.getState().elements['a1'].x).toBe(posicionPreviaA1.x);
    expect(useVenueStore.getState().elements['a1'].y).toBe(posicionPreviaA1.y);
    expect(useVenueStore.getState().elements['a2'].x).toBe(posicionPreviaA2.x);
    expect(useVenueStore.getState().elements['a2'].y).toBe(posicionPreviaA2.y);
  });
});
