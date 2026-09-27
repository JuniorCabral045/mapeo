import { describe, expect, it } from 'vitest';
import { alternarEnSeleccion, asientosElegidos } from './selection';
import { deserializeVenue } from '../schema';
import type { VenueMap } from '../types';

describe('clic sobre un elemento', () => {
  it('sin Shift deja seleccionado solo ese', () => {
    expect(alternarEnSeleccion(['a', 'b'], 'c', false)).toEqual(['c']);
  });

  it('con Shift lo suma a la selección', () => {
    expect(alternarEnSeleccion(['a'], 'b', true)).toEqual(['a', 'b']);
  });

  it('con Shift sobre uno ya seleccionado lo quita en vez de repetirlo', () => {
    expect(alternarEnSeleccion(['a', 'b'], 'a', true)).toEqual(['b']);
  });
});

describe('asientos elegidos en el visor', () => {
  const mapa: VenueMap = {
    version: 1,
    name: 'Recinto',
    sectors: [{
      id: 'norte', name: 'Norte', kind: 'section', shape: 'rectangle',
      x: 0, y: 0, width: 100, height: 100, rotation: 0, fill: '#000', active: true,
      seats: [{ id: 'a1', row: 'A', number: '1', x: 10, y: 10, radius: 4 }],
    }],
  };
  const { elements } = deserializeVenue(mapa);

  it('arma el contexto de cada asiento para el pedido', () => {
    expect(asientosElegidos(elements, { norte: 'Norte' }, ['a1'])).toEqual({
      ids: ['a1'],
      seats: [{ id: 'a1', row: 'A', number: '1', sectorId: 'norte', sectorName: 'Norte' }],
    });
  });

  it('descarta ids que no son asientos de este mapa en vez de romper', () => {
    expect(asientosElegidos(elements, { norte: 'Norte' }, ['viejo', 'a1', 'norte']).ids).toEqual(['a1']);
  });
});
