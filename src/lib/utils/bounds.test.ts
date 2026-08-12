import { describe, expect, it } from 'vitest';
import { calculateBounds, centerOf, elementBounds, fitView } from './bounds';
import type { SeatElement, ShapeElement, VenueElement } from '../types';

/**
 * El encuadre es lo primero que ve quien abre un recinto guardado. Si la caja
 * está mal calculada el mapa aparece corrido o directamente fuera de pantalla, y
 * la reacción natural es creer que el mapa se perdió.
 *
 * El detalle que importa: los asientos, los círculos y los arcos se dibujan
 * CENTRADOS en su x,y; los rectángulos y polígonos nacen en su esquina.
 */

const sector = (extra: Partial<ShapeElement> = {}): ShapeElement => ({
  id: 'sector-1',
  type: 'section',
  name: 'Norte',
  x: 100,
  y: 200,
  width: 400,
  height: 300,
  rotation: 0,
  visible: true,
  locked: false,
  opacity: 1,
  zIndex: 1,
  fill: '#6F3E8F',
  isActive: true,
  sectionType: 'rectangle',
  ...extra,
});

const asiento = (extra: Partial<SeatElement> = {}): SeatElement => ({
  id: 'seat-1',
  type: 'seat',
  name: 'A1',
  x: 50,
  y: 60,
  rotation: 0,
  visible: true,
  locked: false,
  opacity: 1,
  zIndex: 10,
  sectionId: 'sector-1',
  row: 'A',
  number: '1',
  status: 'available',
  radius: 10,
  ...extra,
});

describe('caja de un elemento', () => {
  it('un rectángulo va de su esquina a su esquina más el tamaño', () => {
    expect(elementBounds(sector())).toEqual({ minX: 100, minY: 200, maxX: 500, maxY: 500 });
  });

  it('un asiento se dibuja centrado en su x,y', () => {
    // Este era el error del cálculo viejo del visor: lo tomaba como esquina.
    expect(elementBounds(asiento())).toEqual({ minX: 40, minY: 50, maxX: 60, maxY: 70 });
  });

  it('un círculo se dibuja centrado en su x,y', () => {
    const circulo = sector({ sectionType: 'circle', radius: 50 });

    expect(elementBounds(circulo)).toEqual({ minX: 50, minY: 150, maxX: 150, maxY: 250 });
  });

  it('un arco se acota por su radio exterior alrededor de su x,y', () => {
    const arco = sector({ sectionType: 'arc', innerRadius: 120, outerRadius: 220 });

    expect(elementBounds(arco)).toEqual({ minX: -120, minY: -20, maxX: 320, maxY: 420 });
  });
});

describe('centro de un elemento', () => {
  it('el de un rectángulo es el medio de su caja', () => {
    expect(centerOf(sector())).toEqual({ x: 300, y: 350 });
  });

  it('el de un círculo o un arco es su propio origen', () => {
    expect(centerOf(sector({ sectionType: 'circle', radius: 50 }))).toEqual({ x: 100, y: 200 });
    expect(centerOf(sector({ sectionType: 'arc', outerRadius: 220 }))).toEqual({ x: 100, y: 200 });
  });
});

describe('caja de todo el recinto', () => {
  it('abarca a todos los elementos', () => {
    const elements: Record<string, VenueElement> = {
      'sector-1': sector(),
      'seat-1': asiento({ x: 1000, y: 1000, radius: 5 }),
    };

    expect(calculateBounds(elements, ['sector-1', 'seat-1'])).toEqual({
      minX: 100, minY: 200, maxX: 1005, maxY: 1005,
    });
  });

  it('sin elementos devuelve null en vez de una caja infinita', () => {
    // Un lienzo vacío no se encuadra: se deja la vista por defecto.
    expect(calculateBounds({}, [])).toBeNull();
  });

  it('ignora ids que ya no existen', () => {
    expect(calculateBounds({ 'sector-1': sector() }, ['sector-1', 'borrado'])).toEqual({
      minX: 100, minY: 200, maxX: 500, maxY: 500,
    });
  });
});

describe('encuadre', () => {
  const caja = { minX: 0, minY: 0, maxX: 1000, maxY: 500 };

  it('deja el contenido centrado en el contenedor', () => {
    const vista = fitView(caja, 800, 600, 1);

    // Con margen 1 el ancho manda: 800/1000 = 0.8
    expect(vista.scale).toBeCloseTo(0.8);
    expect(vista.x).toBeCloseTo(0);
    expect(vista.y).toBeCloseTo((600 - 500 * 0.8) / 2);
  });

  it('descuenta el margen pedido', () => {
    expect(fitView(caja, 800, 600, 0.85).scale).toBeCloseTo(0.68);
  });

  it('compensa el desplazamiento de una caja lejos del origen', () => {
    const lejos = { minX: 2000, minY: 3000, maxX: 3000, maxY: 3500 };
    const vista = fitView(lejos, 800, 600, 1);

    // El punto (2000,3000) tiene que caer dentro del contenedor, no fuera.
    expect(2000 * vista.scale + vista.x).toBeGreaterThanOrEqual(0);
    expect(3000 * vista.scale + vista.y).toBeGreaterThanOrEqual(0);
  });

  it('acota la escala al mismo rango que la rueda del mouse', () => {
    const minuscula = { minX: 0, minY: 0, maxX: 1, maxY: 1 };
    const gigante = { minX: 0, minY: 0, maxX: 100000, maxY: 100000 };

    expect(fitView(minuscula, 800, 600, 1).scale).toBeLessThanOrEqual(5);
    expect(fitView(gigante, 800, 600, 1).scale).toBeGreaterThanOrEqual(0.05);
  });

  it('una caja sin superficie no divide por cero', () => {
    const punto = { minX: 10, minY: 10, maxX: 10, maxY: 10 };

    expect(Number.isFinite(fitView(punto, 800, 600).scale)).toBe(true);
  });
});
