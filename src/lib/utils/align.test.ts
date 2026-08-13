import { describe, expect, it } from 'vitest';
import { alignElements, distributeElements } from './align';
import type { ShapeElement, VenueElement } from '../types';

const sector = (id: string, x: number, y: number, w = 100, h = 50): ShapeElement => ({
  id, type: 'section', name: id,
  x, y, width: w, height: h, rotation: 0,
  visible: true, locked: false, opacity: 1, zIndex: 1,
  fill: '#6F3E8F', isActive: true, sectionType: 'rectangle',
});

const escena = (...els: VenueElement[]) =>
  Object.fromEntries(els.map(e => [e.id, e])) as Record<string, VenueElement>;

describe('alinear', () => {
  it('a la izquierda lleva todo al menor x', () => {
    const elements = escena(sector('a', 10, 0), sector('b', 50, 0), sector('c', 90, 0));

    const r = alignElements(elements, ['a', 'b', 'c'], 'left');

    expect([r['a'].x, r['b'].x, r['c'].x]).toEqual([10, 10, 10]);
  });

  it('a la derecha alinea los bordes derechos, no los orígenes', () => {
    const elements = escena(sector('a', 0, 0, 100), sector('b', 0, 0, 40));

    const r = alignElements(elements, ['a', 'b'], 'right');

    expect(r['b'].x).toBe(60);
  });

  it('al centro horizontal usa el centro de la selección', () => {
    const elements = escena(sector('a', 0, 0, 100), sector('b', 200, 0, 100));

    const r = alignElements(elements, ['a', 'b'], 'center-x');

    // Centro de la selección: (0 + 300) / 2 = 150 → cada uno arranca en 100.
    expect([r['a'].x, r['b'].x]).toEqual([100, 100]);
  });

  it('arriba y abajo funcionan sobre el eje y', () => {
    const elements = escena(sector('a', 0, 10, 100, 50), sector('b', 0, 90, 100, 30));

    expect(alignElements(elements, ['a', 'b'], 'top')['b'].y).toBe(10);
    expect(alignElements(elements, ['a', 'b'], 'bottom')['b'].y).toBe(90);
  });

  it('no mueve elementos bloqueados', () => {
    const elements = escena(sector('a', 10, 0), { ...sector('b', 50, 0), locked: true });

    expect(alignElements(elements, ['a', 'b'], 'left')['b']).toBeUndefined();
  });

  it('con un solo elemento no hay nada que alinear', () => {
    expect(alignElements(escena(sector('a', 10, 0)), ['a'], 'left')).toEqual({});
  });
});

describe('distribuir', () => {
  it('deja huecos iguales entre los elementos del medio', () => {
    const elements = escena(sector('a', 0, 0, 100), sector('b', 120, 0, 100), sector('c', 400, 0, 100));

    const r = distributeElements(elements, ['a', 'b', 'c'], 'x');

    // Extremos quietos; el del medio queda con el mismo hueco a cada lado.
    expect(r['a']).toBeUndefined();
    expect(r['c']).toBeUndefined();
    expect(r['b'].x).toBe(200);
  });

  it('con menos de tres no hay nada que distribuir', () => {
    const elements = escena(sector('a', 0, 0), sector('b', 200, 0));

    expect(distributeElements(elements, ['a', 'b'], 'x')).toEqual({});
  });

  it('en vertical usa el eje y', () => {
    const elements = escena(sector('a', 0, 0, 100, 50), sector('b', 0, 60, 100, 50), sector('c', 0, 300, 100, 50));

    expect(distributeElements(elements, ['a', 'b', 'c'], 'y')['b'].y).toBe(150);
  });
});
