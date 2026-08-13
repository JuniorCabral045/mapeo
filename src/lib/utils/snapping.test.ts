import { describe, expect, it } from 'vitest';
import { snapPosition } from './snapping';
import type { GridConfig, SeatElement, ShapeElement, VenueElement } from '../types';

/**
 * El imán es lo que hace que dos tribunas queden alineadas sin pelearse con el
 * mouse. Lo que se prueba acá es que enganche donde corresponde y, sobre todo,
 * que NO enganche donde molesta: los asientos son miles y si fueran candidatos
 * arrastrar cualquier cosa sería imposible.
 */

const sector = (id: string, x: number, y: number): ShapeElement => ({
  id,
  type: 'section',
  name: id,
  x, y, width: 100, height: 100, rotation: 0,
  visible: true, locked: false, opacity: 1, zIndex: 1,
  fill: '#6F3E8F', isActive: true, sectionType: 'rectangle',
});

const asiento = (id: string, x: number, y: number): SeatElement => ({
  id, type: 'seat', name: id, x, y, rotation: 0,
  visible: true, locked: false, opacity: 1, zIndex: 10,
  sectionId: 's1', row: 'A', number: '1', status: 'available', radius: 5,
});

const grilla = (extra: Partial<GridConfig> = {}): GridConfig => ({
  enabled: false, visible: true, size: 20, snapToElements: true, ...extra,
});

const escena = (...els: VenueElement[]) => ({
  elements: Object.fromEntries(els.map(e => [e.id, e])) as Record<string, VenueElement>,
  elementIds: els.map(e => e.id),
});

describe('imán entre elementos', () => {
  it('engancha el borde izquierdo con el de otro sector', () => {
    const { elements, elementIds } = escena(sector('s1', 200, 0));

    const r = snapPosition({
      x: 197, y: 500, width: 100, height: 100,
      excludedIds: [], elements, elementIds, grid: grilla(), scale: 1,
    });

    expect(r.x).toBe(200);
    expect(r.guides).toContainEqual({ axis: 'v', pos: 200 });
  });

  it('engancha centro con centro', () => {
    const { elements, elementIds } = escena(sector('s1', 200, 0));

    const r = snapPosition({
      x: 202, y: 500, width: 100, height: 100,
      excludedIds: [], elements, elementIds, grid: grilla(), scale: 1,
    });

    expect(r.x).toBe(200);
  });

  it('no engancha si está lejos', () => {
    const { elements, elementIds } = escena(sector('s1', 200, 0));

    const r = snapPosition({
      x: 40, y: 500, width: 100, height: 100,
      excludedIds: [], elements, elementIds, grid: grilla(), scale: 1,
    });

    expect(r.x).toBe(40);
    expect(r.guides).toEqual([]);
  });

  it('el umbral se mide en pantalla, no en mundo', () => {
    // A la mitad de zoom, 6 unidades de mundo son 3 píxeles: sigue enganchando.
    const { elements, elementIds } = escena(sector('s1', 200, 0));

    const cerca = snapPosition({
      x: 194, y: 500, width: 100, height: 100,
      excludedIds: [], elements, elementIds, grid: grilla(), scale: 0.5,
    });
    const lejos = snapPosition({
      x: 194, y: 500, width: 100, height: 100,
      excludedIds: [], elements, elementIds, grid: grilla(), scale: 4,
    });

    expect(cerca.x).toBe(200);
    expect(lejos.x).toBe(194);
  });

  it('los asientos no son candidatos', () => {
    // Son miles: si engancharan, arrastrar sería imposible.
    const { elements, elementIds } = escena(asiento('a1', 200, 500));

    const r = snapPosition({
      x: 198, y: 498, width: 10, height: 10,
      excludedIds: [], elements, elementIds, grid: grilla(), scale: 1,
    });

    expect(r.x).toBe(198);
  });

  it('un elemento no se engancha consigo mismo', () => {
    const { elements, elementIds } = escena(sector('s1', 200, 0));

    const r = snapPosition({
      x: 198, y: 0, width: 100, height: 100,
      excludedIds: ['s1'], elements, elementIds, grid: grilla(), scale: 1,
    });

    expect(r.x).toBe(198);
  });

  it('apagado, no engancha con nada', () => {
    const { elements, elementIds } = escena(sector('s1', 200, 0));

    const r = snapPosition({
      x: 198, y: 0, width: 100, height: 100,
      excludedIds: [], elements, elementIds,
      grid: grilla({ snapToElements: false }), scale: 1,
    });

    expect(r.x).toBe(198);
  });

  it('con imán a grilla encendido redondea al paso', () => {
    const { elements, elementIds } = escena();

    const r = snapPosition({
      x: 47, y: 92, width: 10, height: 10,
      excludedIds: [], elements, elementIds,
      grid: grilla({ enabled: true, snapToElements: false, size: 20 }), scale: 1,
    });

    expect([r.x, r.y]).toEqual([40, 100]);
  });
});
