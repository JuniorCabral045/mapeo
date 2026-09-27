import { describe, expect, it } from 'vitest';
import { crearForma, nombreDeSectorNuevo } from './elements';
import { generateRectLayout } from './layout';
import type { VenueElement } from '../types';

const escena = (...els: VenueElement[]) => ({
  elements: Object.fromEntries(els.map((e) => [e.id, e])) as Record<string, VenueElement>,
  elementIds: els.map((e) => e.id),
});

describe('nombre de un sector nuevo', () => {
  it('en un lienzo vacío es «Sector 1»', () => {
    const { elements, elementIds } = escena();
    expect(nombreDeSectorNuevo(elements, elementIds)).toBe('Sector 1');
  });

  it('cuenta sectores, no butacas', () => {
    const norte = crearForma('norte', 'Norte', 'section', { width: 200, height: 100 });
    const butacas = generateRectLayout(norte, {
      rows: 5, cols: 10, rowSpacing: 2, colSpacing: 2, seatRadius: 3, startRow: 'A', startNum: 1,
    });
    const { elements, elementIds } = escena(norte, ...butacas);

    expect(nombreDeSectorNuevo(elements, elementIds)).toBe('Sector 2');
  });

  it('no repite un nombre que ya existe', () => {
    const { elements, elementIds } = escena(
      crearForma('a', 'Sector 2', 'section'),
      crearForma('b', 'Sector 3', 'section'),
    );

    expect(nombreDeSectorNuevo(elements, elementIds)).toBe('Sector 4');
  });

  it('el escenario no cuenta como sector', () => {
    const { elements, elementIds } = escena(crearForma('e', 'Escenario', 'stage'));
    expect(nombreDeSectorNuevo(elements, elementIds)).toBe('Sector 1');
  });
});
