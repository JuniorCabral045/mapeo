import { describe, expect, it } from 'vitest';
import { anchorsFor } from './transformer';
import type { ShapeElement, VenueElement } from '../types';

/**
 * Antes el transformador exponía solo las cuatro esquinas y Konva mantiene la
 * proporción por omisión: no había forma de achicar una cancha solo a lo ancho.
 * Las formas radiales (círculo, arco) se dimensionan por radio, así que
 * deformarlas en un eje no tiene dónde guardarse en el formato.
 */

const forma = (sectionType: ShapeElement['sectionType']): ShapeElement => ({
  id: `s-${sectionType}`,
  type: 'section',
  name: sectionType,
  x: 0, y: 0, width: 100, height: 100, rotation: 0,
  visible: true, locked: false, opacity: 1, zIndex: 1,
  fill: '#6F3E8F', isActive: true, sectionType,
});

const ESQUINAS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

describe('anclas del transformador', () => {
  it('un rectángulo se puede estirar en un solo eje', () => {
    const anclas = anchorsFor([forma('rectangle')]);

    expect(anclas).toHaveLength(8);
    expect(anclas).toContain('middle-left');
    expect(anclas).toContain('top-center');
  });

  it('un polígono también', () => {
    expect(anchorsFor([forma('polygon')])).toHaveLength(8);
  });

  it('un círculo solo por las esquinas', () => {
    expect(anchorsFor([forma('circle')])).toEqual(ESQUINAS);
  });

  it('un arco solo por las esquinas', () => {
    expect(anchorsFor([forma('arc')])).toEqual(ESQUINAS);
  });

  it('con selección mixta gana la restricción', () => {
    // Si se estirara en un eje, el círculo quedaría sin representación válida.
    expect(anchorsFor([forma('rectangle'), forma('circle')])).toEqual(ESQUINAS);
  });

  it('sin selección devuelve las esquinas', () => {
    expect(anchorsFor([])).toEqual(ESQUINAS);
  });

  it('los asientos no se transforman, no restringen nada', () => {
    const asiento = { id: 'a1', type: 'seat' } as unknown as VenueElement;

    expect(anchorsFor([forma('rectangle'), asiento])).toHaveLength(8);
  });
});
