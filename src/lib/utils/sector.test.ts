import { describe, expect, it } from 'vitest';
import { idsToMoveIndividually } from './sector';
import type { SeatElement, ShapeElement, VenueElement } from '../types';

/**
 * El defecto que esto cubre: un asiento y su propio sector seleccionados a la
 * vez terminaban moviéndose el doble. `moveSector` ya arrastra a todos los
 * asientos del sector; si además el asiento se mueve por su cuenta -algo que
 * antes dependía del orden en que `Object.keys(selectedIds)` los recorría-
 * el asiento queda desplazado el doble que el resto y la butaca guardada no
 * coincide con su lugar real.
 */

const sector = (id: string, extra: Partial<ShapeElement> = {}): ShapeElement => ({
  id,
  type: 'section',
  name: 'Norte',
  x: 100,
  y: 100,
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

const asiento = (id: string, extra: Partial<SeatElement> = {}): SeatElement => ({
  id,
  type: 'seat',
  name: 'A1',
  x: 120,
  y: 120,
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

describe('idsToMoveIndividually', () => {
  it('excluye un asiento cuyo sector tambien esta seleccionado', () => {
    // Es exactamente el caso del defecto: clic en el asiento y despues
    // shift-clic en su sector. moveSector ya lo arrastra; incluirlo aca lo
    // desplazaria el doble.
    const elements: Record<string, VenueElement> = {
      'sector-1': sector('sector-1'),
      'seat-1': asiento('seat-1', { sectionId: 'sector-1' }),
    };

    expect(idsToMoveIndividually(elements, ['seat-1', 'sector-1'])).toEqual(['sector-1']);
  });

  it('incluye un asiento suelto, sin sector', () => {
    const elements: Record<string, VenueElement> = {
      'seat-1': asiento('seat-1', { sectionId: undefined }),
    };

    expect(idsToMoveIndividually(elements, ['seat-1'])).toEqual(['seat-1']);
  });

  it('incluye un asiento cuyo sector no esta en la seleccion', () => {
    // El sector existe pero no fue seleccionado junto al asiento: nadie mas
    // lo va a mover, asi que el asiento tiene que moverse por su cuenta.
    const elements: Record<string, VenueElement> = {
      'sector-1': sector('sector-1'),
      'seat-1': asiento('seat-1', { sectionId: 'sector-1' }),
    };

    expect(idsToMoveIndividually(elements, ['seat-1'])).toEqual(['seat-1']);
  });

  it('no depende del orden de los ids seleccionados', () => {
    // El bug original SI dependia del orden (Object.keys de un objeto
    // construido siguiendo selectedIds). Esta funcion tiene que dar el mismo
    // resultado sin importar en que orden llegue el asiento respecto de su
    // sector.
    const elements: Record<string, VenueElement> = {
      'sector-1': sector('sector-1'),
      'seat-1': asiento('seat-1', { sectionId: 'sector-1' }),
    };

    const conAsientoPrimero = idsToMoveIndividually(elements, ['seat-1', 'sector-1']);
    const conSectorPrimero = idsToMoveIndividually(elements, ['sector-1', 'seat-1']);

    expect(conAsientoPrimero).toEqual(conSectorPrimero);
    expect(conAsientoPrimero).toEqual(['sector-1']);
  });
});
