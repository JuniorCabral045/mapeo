import { describe, expect, it } from 'vitest';
import {
  idsToMoveIndividually,
  idsToExcludeFromSnap,
  resumenDeBorrado,
  textoAvisoDeBorrado,
} from './sector';
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

const escenario = (id: string, extra: Partial<ShapeElement> = {}): ShapeElement => ({
  id,
  type: 'stage',
  name: 'Escenario',
  x: 0,
  y: 0,
  width: 200,
  height: 100,
  rotation: 0,
  visible: true,
  locked: false,
  opacity: 1,
  zIndex: 0,
  fill: '#333333',
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

describe('idsToExcludeFromSnap', () => {
  /**
   * El defecto que esto cubre: con una seleccion multiple [A, B] ya hecha, si
   * se arrastra un tercer elemento C sin deseleccionar primero -Konva no
   * dispara `click` cuando el puntero se movio antes de soltar, asi que la
   * seleccion de React no se actualiza-, mirar solo el TAMANO de
   * `selectedIds` (> 1) dejaba a C fuera de los excluidos: se enganchaba
   * contra su propia caja. La condicion correcta es pertenencia.
   */
  it('excluye solo al propio elemento si arrastra algo fuera de una seleccion multiple existente', () => {
    expect(idsToExcludeFromSnap('c', ['a', 'b'])).toEqual(['c']);
  });

  it('excluye toda la seleccion si el elemento arrastrado es parte de ella', () => {
    expect(idsToExcludeFromSnap('a', ['a', 'b'])).toEqual(['a', 'b']);
  });

  it('con seleccion de uno solo, excluye unicamente ese elemento', () => {
    expect(idsToExcludeFromSnap('a', ['a'])).toEqual(['a']);
  });

  it('sin seleccion (arrastre libre), excluye solo el elemento arrastrado', () => {
    expect(idsToExcludeFromSnap('a', [])).toEqual(['a']);
  });
});

describe('resumenDeBorrado', () => {
  /**
   * El defecto que esto cubre: el conteo original filtraba por
   * `type !== 'seat'`, asi que un escenario -que tambien pasa ese filtro-
   * se contaba como sector. Seleccionar un escenario junto a un sector con
   * asientos decia "2 sectores" cuando uno de los dos no lo era.
   */
  it('separa sectores de escenarios en una seleccion mixta', () => {
    const elements: Record<string, VenueElement> = {
      'sector-1': sector('sector-1'),
      'escenario-1': escenario('escenario-1'),
      'seat-1': asiento('seat-1', { sectionId: 'sector-1' }),
      'seat-2': asiento('seat-2', { sectionId: 'sector-1' }),
    };
    const elementIds = ['sector-1', 'escenario-1', 'seat-1', 'seat-2'];

    const resumen = resumenDeBorrado(elements, elementIds, ['sector-1', 'escenario-1']);

    expect(resumen).toEqual({ sectores: 1, escenarios: 1, asientos: 2 });
  });

  it('cuenta solo sectores cuando no hay escenarios seleccionados', () => {
    const elements: Record<string, VenueElement> = {
      'sector-1': sector('sector-1'),
      'seat-1': asiento('seat-1', { sectionId: 'sector-1' }),
    };
    const elementIds = ['sector-1', 'seat-1'];

    expect(resumenDeBorrado(elements, elementIds, ['sector-1'])).toEqual({
      sectores: 1,
      escenarios: 0,
      asientos: 1,
    });
  });

  it('cuenta solo escenarios cuando no hay sectores seleccionados', () => {
    // Un escenario nunca tiene asientos propios: seatsOfSector no encuentra
    // ninguno para su id, asi que el conteo de asientos queda en 0.
    const elements: Record<string, VenueElement> = {
      'escenario-1': escenario('escenario-1'),
      'escenario-2': escenario('escenario-2'),
    };
    const elementIds = ['escenario-1', 'escenario-2'];

    expect(resumenDeBorrado(elements, elementIds, ['escenario-1', 'escenario-2'])).toEqual({
      sectores: 0,
      escenarios: 2,
      asientos: 0,
    });
  });

  it('un solo sector sin asientos no suma asientos', () => {
    const elements: Record<string, VenueElement> = {
      'sector-1': sector('sector-1'),
    };

    expect(resumenDeBorrado(elements, ['sector-1'], ['sector-1'])).toEqual({
      sectores: 1,
      escenarios: 0,
      asientos: 0,
    });
  });
});

describe('textoAvisoDeBorrado', () => {
  it('un solo sector con un solo asiento concuerda en singular en todo', () => {
    // El caso que motivo el defecto de redaccion menor: un sector 1x1 es
    // perfectamente alcanzable y "1 asientos" salta a la vista como error.
    expect(textoAvisoDeBorrado({ sectores: 1, escenarios: 0, asientos: 1 })).toBe(
      'Se borra 1 sector y su 1 asiento. Esa butaca deja de existir: su QR queda apuntando a la nada.'
    );
  });

  it('varios sectores con varios asientos concuerda en plural', () => {
    expect(textoAvisoDeBorrado({ sectores: 2, escenarios: 0, asientos: 50 })).toBe(
      'Se borran 2 sectores y sus 50 asientos. Esas butacas dejan de existir: sus QR quedan apuntando a la nada.'
    );
  });

  it('un escenario y un sector con asientos: la mezcla no llama "sectores" al escenario', () => {
    // Es exactamente el caso del defecto principal: antes esto decia
    // "Se borran 2 sectores y sus 50 asientos", mintiendo sobre el escenario.
    expect(textoAvisoDeBorrado({ sectores: 1, escenarios: 1, asientos: 50 })).toBe(
      'Se borran 1 sector y 1 escenario y sus 50 asientos. Esas butacas dejan de existir: sus QR quedan apuntando a la nada.'
    );
  });

  it('solo escenarios, sin asientos: no menciona asientos ni QR', () => {
    expect(textoAvisoDeBorrado({ sectores: 0, escenarios: 2, asientos: 0 })).toBe(
      'Se borran 2 escenarios.'
    );
  });

  it('un solo escenario, sin asientos: concuerda en singular', () => {
    expect(textoAvisoDeBorrado({ sectores: 0, escenarios: 1, asientos: 0 })).toBe(
      'Se borra 1 escenario.'
    );
  });

  it('sector sin asientos: no agrega la frase de QR porque no hay nada que perder', () => {
    expect(textoAvisoDeBorrado({ sectores: 1, escenarios: 0, asientos: 0 })).toBe(
      'Se borra 1 sector.'
    );
  });

  it('sin sectores ni escenarios devuelve texto vacio', () => {
    // No deberia poder pasar desde la UI (el aviso solo se muestra si hay
    // algo que borrar), pero la funcion no debe inventar un mensaje falso.
    expect(textoAvisoDeBorrado({ sectores: 0, escenarios: 0, asientos: 0 })).toBe('');
  });
});
