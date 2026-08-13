import { describe, expect, it } from 'vitest';
import { duplicateSectors } from './duplicate';
import type { SeatElement, ShapeElement, VenueElement } from '../types';

/**
 * Duplicar una tribuna es la operación que más tiempo ahorra en un estadio, y la
 * que más fácil corrompe datos: si el duplicado reusara los ids del original,
 * dos butacas distintas responderían al mismo QR.
 */

const sector = (extra: Partial<ShapeElement> = {}): ShapeElement => ({
  id: 'sector-norte',
  type: 'section',
  name: 'Norte',
  x: 100, y: 100, width: 200, height: 100, rotation: 0,
  visible: true, locked: false, opacity: 0.2, zIndex: 5,
  fill: '#6F3E8F', isActive: true, sectionType: 'rectangle',
  generation: { rows: 1, cols: 4, seatRadius: 5, startRow: 'A', startNum: 1, numberDirection: 'ltr' },
  ...extra,
});

const asiento = (id: string, x: number, numero: string): SeatElement => ({
  id, type: 'seat', name: `A${numero}`, x, y: 150, rotation: 0,
  visible: true, locked: false, opacity: 1, zIndex: 10,
  sectionId: 'sector-norte', row: 'A', number: numero,
  status: 'available', radius: 5,
});

const escena = (s: ShapeElement, asientos: SeatElement[]) => ({
  elements: Object.fromEntries([[s.id, s], ...asientos.map(a => [a.id, a])]) as Record<string, VenueElement>,
  elementIds: [s.id, ...asientos.map(a => a.id)],
});

const fila = [asiento('a1', 120, '1'), asiento('a2', 160, '2'), asiento('a3', 200, '3'), asiento('a4', 240, '4')];
const ids = { newId: (() => { let n = 0; return () => `x${++n}`; })() };

describe('duplicar un sector', () => {
  it('crea ids nuevos para el sector y para cada asiento', () => {
    // Reusar un id mandaría dos butacas al mismo QR.
    const { elements, elementIds } = escena(sector(), fila);

    const nuevos = duplicateSectors(elements, elementIds, ['sector-norte'], {
      dx: 0, dy: 300, mirror: null, newId: () => 'sur',
    });

    for (const el of nuevos) {
      expect(elementIds).not.toContain(el.id);
    }
  });

  it('los asientos del duplicado apuntan al sector duplicado', () => {
    const { elements, elementIds } = escena(sector(), fila);

    const nuevos = duplicateSectors(elements, elementIds, ['sector-norte'], {
      dx: 0, dy: 300, mirror: null, newId: () => 'sur',
    });
    const nuevoSector = nuevos.find(e => e.type !== 'seat')!;
    const nuevosAsientos = nuevos.filter((e): e is SeatElement => e.type === 'seat');

    expect(nuevosAsientos).toHaveLength(4);
    for (const a of nuevosAsientos) {
      expect(a.sectionId).toBe(nuevoSector.id);
    }
  });

  it('desplaza sector y asientos por igual', () => {
    const { elements, elementIds } = escena(sector(), fila);

    const nuevos = duplicateSectors(elements, elementIds, ['sector-norte'], {
      dx: 20, dy: 300, mirror: null, newId: () => 'sur',
    });

    expect(nuevos.find(e => e.type !== 'seat')!.y).toBe(400);
    expect(nuevos.filter(e => e.type === 'seat').map(e => e.y)).toEqual([450, 450, 450, 450]);
  });

  it('conserva fila y número: la numeración es local a la tribuna', () => {
    const { elements, elementIds } = escena(sector(), fila);

    const nuevos = duplicateSectors(elements, elementIds, ['sector-norte'], {
      dx: 0, dy: 300, mirror: null, newId: () => 'sur',
    });

    expect((nuevos.filter(e => e.type === 'seat') as SeatElement[]).map(a => a.number))
      .toEqual(['1', '2', '3', '4']);
  });

  it('copia los parámetros de generación', () => {
    const { elements, elementIds } = escena(sector(), fila);

    const [nuevo] = duplicateSectors(elements, elementIds, ['sector-norte'], {
      dx: 0, dy: 300, mirror: null, newId: () => 'sur',
    }) as ShapeElement[];

    expect(nuevo.generation).toEqual(sector().generation);
  });
});

describe('espejar', () => {
  it('refleja las posiciones alrededor del centro del sector', () => {
    const { elements, elementIds } = escena(sector(), fila);

    const nuevos = duplicateSectors(elements, elementIds, ['sector-norte'], {
      dx: 0, dy: 0, mirror: 'horizontal', newId: () => 'sur',
    });
    const xs = (nuevos.filter(e => e.type === 'seat') as SeatElement[]).map(a => a.x).sort((a, b) => a - b);

    // Centro del sector: 100 + 200/2 = 200. El de 120 va a 280, el de 160 a 240, etc.
    expect(xs).toEqual([160, 200, 240, 280]);
  });

  it('renumera para que la fila siga ascendiendo hacia la derecha', () => {
    // Reflejar sin renumerar deja la fila leyéndose 4,3,2,1 en pantalla.
    const { elements, elementIds } = escena(sector(), fila);

    const nuevos = duplicateSectors(elements, elementIds, ['sector-norte'], {
      dx: 0, dy: 0, mirror: 'horizontal', newId: () => 'sur',
    });
    const porX = (nuevos.filter(e => e.type === 'seat') as SeatElement[]).sort((a, b) => a.x - b.x);

    expect(porX.map(a => a.number)).toEqual(['1', '2', '3', '4']);
  });

  it('refleja los vértices de un polígono', () => {
    const poligono = sector({ sectionType: 'polygon', points: [0, 0, 200, 0, 200, 100] });
    const { elements, elementIds } = escena(poligono, []);

    const [nuevo] = duplicateSectors(elements, elementIds, ['sector-norte'], {
      dx: 0, dy: 0, mirror: 'horizontal', newId: () => 'sur',
    }) as ShapeElement[];

    expect(nuevo.points).toEqual([200, 0, 0, 0, 0, 100]);
  });

  it('refleja los ángulos de un arco', () => {
    // Asimétrico a propósito: con un arco simétrico el espejo y no hacer nada dan
    // el mismo resultado, y la prueba no probaría nada.
    const arco = sector({ sectionType: 'arc', innerRadius: 100, outerRadius: 200, startAngle: 200, endAngle: 300 });
    const { elements, elementIds } = escena(arco, []);

    const [nuevo] = duplicateSectors(elements, elementIds, ['sector-norte'], {
      dx: 0, dy: 0, mirror: 'horizontal', newId: () => 'sur',
    }) as ShapeElement[];

    // Espejo horizontal: θ → 180 − θ, y el final pasa a ser el inicial.
    expect(nuevo.startAngle).toBeCloseTo(240);
    expect(nuevo.endAngle).toBeCloseTo(340);
  });

  it('el espejo conserva la amplitud del arco', () => {
    const arco = sector({ sectionType: 'arc', startAngle: 200, endAngle: 300 });
    const { elements, elementIds } = escena(arco, []);

    const [nuevo] = duplicateSectors(elements, elementIds, ['sector-norte'], {
      dx: 0, dy: 0, mirror: 'vertical', newId: () => 'sur',
    }) as ShapeElement[];

    expect(nuevo.endAngle! - nuevo.startAngle!).toBeCloseTo(100);
  });

  it('el espejo vertical invierte la orientación de las butacas', () => {
    const conRotacion = [{ ...asiento('a1', 120, '1'), rotation: 30 }];
    const { elements, elementIds } = escena(sector(), conRotacion);

    const nuevos = duplicateSectors(elements, elementIds, ['sector-norte'], {
      dx: 0, dy: 0, mirror: 'vertical', newId: () => 'sur',
    });

    expect((nuevos.find(e => e.type === 'seat') as SeatElement).rotation).toBeCloseTo(330);
  });
});

describe('varios sectores a la vez', () => {
  it('duplica cada uno con sus propios ids', () => {
    const otro = sector({ id: 'sector-este', name: 'Este', x: 500 });
    const { elements, elementIds } = escena(sector(), fila);
    elements['sector-este'] = otro;
    elementIds.push('sector-este');

    const nuevos = duplicateSectors(elements, elementIds, ['sector-norte', 'sector-este'], {
      dx: 0, dy: 300, mirror: null, ...ids,
    });
    const sectores = nuevos.filter(e => e.type !== 'seat');

    expect(sectores).toHaveLength(2);
    expect(new Set(nuevos.map(e => e.id)).size).toBe(nuevos.length);
  });
});
