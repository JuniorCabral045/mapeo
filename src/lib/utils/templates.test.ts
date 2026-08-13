import { describe, expect, it } from 'vitest';
import { TEMPLATES } from './templates';
import type { SeatElement, ShapeElement } from '../types';

/**
 * Una plantilla es un punto de partida editable, no un dibujo congelado: sus
 * butacas salen de los mismos generadores que usa el panel, así que heredan la
 * numeración y la orientación correctas y se pueden regenerar.
 */

describe('plantillas', () => {
  it('hay tres', () => {
    expect(TEMPLATES.map(t => t.id)).toEqual(['estadio-recto', 'estadio-curvo', 'teatro']);
  });

  for (const plantilla of TEMPLATES) {
    describe(plantilla.name, () => {
      it('no repite ningún id', () => {
        const ids = plantilla.build().map(e => e.id);

        expect(new Set(ids).size).toBe(ids.length);
      });

      it('dos invocaciones no colisionan entre sí', () => {
        // Insertar la misma plantilla dos veces es un caso real.
        const a = plantilla.build(() => 'uno').map(e => e.id);
        const b = plantilla.build(() => 'dos').map(e => e.id);

        expect(a.filter(id => b.includes(id))).toEqual([]);
      });

      it('genera sectores y asientos', () => {
        const els = plantilla.build();

        expect(els.some(e => e.type === 'section')).toBe(true);
        expect(els.filter(e => e.type === 'seat').length).toBeGreaterThan(0);
      });

      it('cada asiento apunta a un sector que existe en la plantilla', () => {
        const els = plantilla.build();
        const sectores = new Set(els.filter(e => e.type !== 'seat').map(e => e.id));

        for (const a of els.filter((e): e is SeatElement => e.type === 'seat')) {
          expect(sectores.has(a.sectionId!)).toBe(true);
        }
      });

      it('los sectores llevan sus parámetros de generación', () => {
        const conAsientos = plantilla.build()
          .filter((e): e is ShapeElement => e.type === 'section')
          .filter(s => s.generation);

        expect(conAsientos.length).toBeGreaterThan(0);
      });

      it('trae un escenario o cancha', () => {
        expect(plantilla.build().some(e => e.type === 'stage')).toBe(true);
      });
    });
  }

  it('el estadio curvo usa sectores de arco, que es lo que distingue a un estadio', () => {
    const curvo = TEMPLATES.find(t => t.id === 'estadio-curvo')!;
    const arcos = curvo.build().filter(
      (e): e is ShapeElement => e.type === 'section' && e.sectionType === 'arc'
    );

    expect(arcos.length).toBe(4);
  });

  it('las butacas del estadio curvo salen orientadas hacia la cancha', () => {
    const curvo = TEMPLATES.find(t => t.id === 'estadio-curvo')!;
    const asientos = curvo.build().filter((e): e is SeatElement => e.type === 'seat');

    expect(asientos.some(a => a.rotation !== 0)).toBe(true);
  });
});
