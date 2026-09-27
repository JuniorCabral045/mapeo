import { describe, expect, it } from 'vitest';
import { geometriaEscalada, transformerConfigFor } from './transformer';
import type { ShapeElement, VenueElement } from '../types';

/**
 * Antes el transformador exponía solo las cuatro esquinas y Konva mantiene la
 * proporción por omisión: no había forma de achicar una cancha solo a lo ancho.
 * Las formas radiales (círculo, arco) se dimensionan por radio, así que
 * deformarlas en un eje no tiene dónde guardarse en el formato.
 *
 * Anclas y `keepRatio` son la misma decisión -depende de si hay una forma
 * radial en la selección- así que se calculan juntas: separarlas dejó, en su
 * momento, un `keepRatio={false}` incondicional que deshacía para círculos y
 * arcos la protección que las anclas querían dar.
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

describe('configuración del transformador', () => {
  it('un rectángulo se puede estirar en un solo eje, sin mantener proporción', () => {
    const config = transformerConfigFor([forma('rectangle')]);

    expect(config.anchors).toHaveLength(8);
    expect(config.anchors).toContain('middle-left');
    expect(config.anchors).toContain('top-center');
    expect(config.keepRatio).toBe(false);
  });

  it('un polígono también', () => {
    const config = transformerConfigFor([forma('polygon')]);

    expect(config.anchors).toHaveLength(8);
    expect(config.keepRatio).toBe(false);
  });

  it('un círculo solo por las esquinas, manteniendo proporción', () => {
    // Si se deformara en un eje, el Group escalado dibujaría una elipse
    // durante el gesto y handleTransformEnd descartaría scaleY en silencio.
    const config = transformerConfigFor([forma('circle')]);

    expect(config.anchors).toEqual(ESQUINAS);
    expect(config.keepRatio).toBe(true);
  });

  it('un arco solo por las esquinas, manteniendo proporción', () => {
    const config = transformerConfigFor([forma('arc')]);

    expect(config.anchors).toEqual(ESQUINAS);
    expect(config.keepRatio).toBe(true);
  });

  it('con selección mixta gana la restricción: esquinas y proporción mantenida', () => {
    // Si se estirara en un eje, el círculo quedaría sin representación válida.
    const config = transformerConfigFor([forma('rectangle'), forma('circle')]);

    expect(config.anchors).toEqual(ESQUINAS);
    expect(config.keepRatio).toBe(true);
  });

  it('sin selección devuelve las esquinas sin mantener proporción', () => {
    // Estado neutro: no hay ninguna forma radial que proteger, así que no hay
    // motivo para forzar keepRatio y dejar al usuario sin poder redimensionar
    // en un solo eje la próxima vez que seleccione algo deformable.
    const config = transformerConfigFor([]);

    expect(config.anchors).toEqual(ESQUINAS);
    expect(config.keepRatio).toBe(false);
  });

  it('los asientos no se transforman, no restringen nada', () => {
    const asiento = { id: 'a1', type: 'seat' } as unknown as VenueElement;

    const config = transformerConfigFor([forma('rectangle'), asiento]);

    expect(config.anchors).toHaveLength(8);
    expect(config.keepRatio).toBe(false);
  });

  it('una selección de solo asientos no mantiene proporción ni restringe anclas', () => {
    // Los asientos no tienen sectionType: no deben leerse como "radial" por
    // accidente y dejar al usuario con un Transformer que fuerza proporción
    // sin ninguna forma que lo justifique.
    const asiento = { id: 'a1', type: 'seat' } as unknown as VenueElement;

    const config = transformerConfigFor([asiento]);

    expect(config.anchors).toEqual(ESQUINAS);
    expect(config.keepRatio).toBe(false);
  });
});

describe('escala horneada en la geometría', () => {
  it('un rectángulo cambia ancho y alto por separado', () => {
    const r = geometriaEscalada(forma('rectangle'), 2, 0.5);
    expect(r.cambios).toEqual({ width: 200, height: 50 });
    expect(r.scaleY).toBe(0.5);
  });

  it('un círculo escala su radio y descarta scaleY', () => {
    const r = geometriaEscalada({ ...forma('circle'), radius: 40 }, 2, 3);
    expect(r.cambios).toEqual({ radius: 80, width: 160, height: 160 });
    expect(r.scaleY).toBe(2);
  });

  it('un polígono escala cada vértice en su eje', () => {
    const r = geometriaEscalada({ ...forma('polygon'), points: [0, 0, 10, 0, 10, 20] }, 2, 3);
    expect(r.cambios.points).toEqual([0, 0, 20, 0, 20, 60]);
  });
});
