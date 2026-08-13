import { describe, expect, it } from 'vitest';
import { deserializeVenue, serializeVenue } from './schema';
import { generateArcSectorLayout } from './utils/layout';
import type { ShapeElement, VenueElement } from './types';

/**
 * Ida y vuelta del formato. Lo que se pierde acá no se pierde en pantalla: se
 * pierde en el JSON que queda guardado en el backend, y no vuelve.
 */

const arco: ShapeElement = {
  id: 'sector-arco',
  type: 'section',
  name: 'Anillo',
  x: 500,
  y: 500,
  width: 440,
  height: 440,
  rotation: 0,
  visible: true,
  locked: false,
  opacity: 0.2,
  zIndex: 5,
  fill: '#6F3E8F',
  isActive: true,
  sectionType: 'arc',
  innerRadius: 120,
  outerRadius: 220,
  startAngle: 200,
  endAngle: 340,
};

describe('ida y vuelta del mapeo', () => {
  it('conserva la rotación de los asientos de un anillo', () => {
    // Sin esto, las butacas de una tribuna curva vuelven todas mirando al norte.
    const asientos = generateArcSectorLayout(arco, {
      rows: 2, cols: 10, rowSpacing: 4, colSpacing: 4,
      seatRadius: 4, startRow: 'A', startNum: 1,
    });
    const elements: Record<string, VenueElement> = { [arco.id]: arco };
    asientos.forEach(a => { elements[a.id] = a; });
    const ids = [arco.id, ...asientos.map(a => a.id)];

    const mapa = serializeVenue(elements, ids, 'Estadio');
    const vuelta = deserializeVenue(mapa);

    for (const a of asientos) {
      expect(vuelta.elements[a.id].rotation).toBeCloseTo(a.rotation);
    }
    expect(asientos.some(a => a.rotation !== 0)).toBe(true);
  });

  it('un mapa viejo sin rotación se lee con rotación 0', () => {
    const vuelta = deserializeVenue({
      version: 1,
      name: 'Viejo',
      sectors: [{
        id: 's1', name: 'Norte', kind: 'section', shape: 'rectangle',
        x: 0, y: 0, width: 100, height: 100, rotation: 0,
        fill: '#6F3E8F', active: true,
        seats: [{ id: 'a1', row: 'A', number: '1', x: 10, y: 10, radius: 4 }],
      }],
    });

    expect(vuelta.elements['a1'].rotation).toBe(0);
  });

  it('conserva los parámetros de generación de un sector', () => {
    const sector: ShapeElement = {
      ...arco,
      id: 'sector-gen',
      generation: { rows: 4, cols: 12, seatRadius: 3.5, startRow: 'A', startNum: 1, numberDirection: 'ltr' },
    };
    const elements: Record<string, VenueElement> = { [sector.id]: sector };
    const mapa = serializeVenue(elements, [sector.id], 'Estadio');
    const vuelta = deserializeVenue(mapa);

    expect((vuelta.elements[sector.id] as ShapeElement).generation).toEqual(sector.generation);
  });

  it('un mapa viejo sin campo generation se lee sin problema (retrocompatibilidad)', () => {
    const vuelta = deserializeVenue({
      version: 1,
      name: 'Viejo',
      sectors: [{
        id: 's1', name: 'Norte', kind: 'section', shape: 'rectangle',
        x: 0, y: 0, width: 100, height: 100, rotation: 0,
        fill: '#6F3E8F', active: true,
        seats: [],
      }],
    });

    expect((vuelta.elements['s1'] as ShapeElement).generation).toBeUndefined();
  });
});
