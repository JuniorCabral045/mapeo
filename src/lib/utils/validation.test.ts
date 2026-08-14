import { describe, expect, it } from 'vitest';
import { aforoTotal, validarMapa } from './validation';
import type { SeatData, SectorData, VenueMap } from '../types';

/**
 * Lo que se guarda acá es el contrato con el backend: los ids de asiento se
 * imprimen en los QR de las butacas. Un mapa incoherente no falla al guardar,
 * falla el día del partido — por eso conviene decirlo antes.
 */

const asiento = (id: string, extra: Partial<SeatData> = {}): SeatData => ({
  id, row: 'A', number: '1', x: 150, y: 250, radius: 5, ...extra,
});

const sector = (extra: Partial<SectorData> = {}): SectorData => ({
  id: 'sector-norte',
  name: 'Norte',
  kind: 'section',
  shape: 'rectangle',
  x: 100, y: 200, width: 200, height: 100, rotation: 0,
  fill: '#6F3E8F',
  active: true,
  seats: [],
  ...extra,
});

const mapa = (...sectors: SectorData[]): VenueMap => ({ version: 1, name: 'Recinto', sectors });

const mensajes = (m: VenueMap) => validarMapa(m).map((p) => p.mensaje);
const severidades = (m: VenueMap) => validarMapa(m).map((p) => p.severidad);

describe('un mapa sano no molesta', () => {
  it('no reporta nada', () => {
    expect(validarMapa(mapa(sector({ seats: [asiento('a1')] })))).toEqual([]);
  });

  it('un recinto vacio tampoco', () => {
    // Recién empezado a mapear no hay nada que avisar todavía.
    expect(validarMapa(mapa())).toEqual([]);
  });

  it('un sector sin asientos pero con capacidad declarada es valido', () => {
    // Es la gradería general: se vende por cupo, no por butaca.
    expect(validarMapa(mapa(sector({ capacity: 500 })))).toEqual([]);
  });

  it('un escenario sin asientos no necesita capacidad', () => {
    expect(validarMapa(mapa(sector({ kind: 'stage', name: 'Cancha' })))).toEqual([]);
  });
});

describe('identificadores de asiento repetidos', () => {
  it('son un error, no un aviso', () => {
    // Dos butacas con el mismo id responden al mismo QR: el pedido de uno le
    // llega al otro, y nada falla para avisarlo.
    const m = mapa(
      sector({ seats: [asiento('repetido')] }),
      sector({ id: 'sector-sur', name: 'Sur', seats: [asiento('repetido')] }),
    );

    expect(severidades(m)).toContain('error');
    expect(mensajes(m)[0]).toMatch(/mismo identificador/);
    expect(validarMapa(m)[0].ids).toEqual(['repetido']);
  });

  it('cuenta cuantos hay cuando son varios', () => {
    const m = mapa(
      sector({ seats: [asiento('x'), asiento('y')] }),
      sector({ id: 'sector-sur', name: 'Sur', seats: [asiento('x'), asiento('y')] }),
    );

    expect(mensajes(m)[0]).toMatch(/2 identificadores/);
  });
});

describe('el sector General', () => {
  it('es un error: son butacas que perdieron su tribuna', () => {
    const m = mapa(sector({ id: 'sector-general', name: 'General', seats: [asiento('a1')] }));

    expect(severidades(m)).toContain('error');
    expect(mensajes(m).some((t) => t.includes('sin sector'))).toBe(true);
  });
});

describe('sectores que no pueden vender', () => {
  it('avisa cuando no hay ni asientos ni capacidad', () => {
    const m = mapa(sector({ name: 'Platea' }));

    expect(severidades(m)).toEqual(['aviso']);
    expect(mensajes(m)[0]).toMatch(/«Platea»/);
  });

  it('a un sector sin nombre lo nombra como tal, sin comillas vacias', () => {
    const m = mapa(sector({ name: '' }));

    expect(mensajes(m).some((t) => t.startsWith('Un sector sin nombre no tiene asientos'))).toBe(true);
    expect(mensajes(m).some((t) => t.includes('«»'))).toBe(false);
  });

  it('los agrupa cuando son varios', () => {
    const m = mapa(sector(), sector({ id: 's2', name: 'Sur' }));

    expect(mensajes(m).some((t) => t.startsWith('2 sectores'))).toBe(true);
  });
});

describe('nombres', () => {
  it('avisa si dos sectores se llaman igual', () => {
    // El nombre es lo que ve el comprador al elegir y lo que lee el repartidor.
    const m = mapa(
      sector({ seats: [asiento('a1')] }),
      sector({ id: 's2', name: 'norte', seats: [asiento('a2')] }),
    );

    expect(mensajes(m).some((t) => t.includes('mismo nombre'))).toBe(true);
  });

  it('ignora mayusculas y espacios al comparar', () => {
    const m = mapa(
      sector({ seats: [asiento('a1')] }),
      sector({ id: 's2', name: '  NORTE ', seats: [asiento('a2')] }),
    );

    expect(mensajes(m).some((t) => t.includes('mismo nombre'))).toBe(true);
  });

  it('avisa si un sector quedo sin nombre', () => {
    const m = mapa(sector({ name: '   ', seats: [asiento('a1')] }));

    expect(mensajes(m).some((t) => t.includes('sin nombre'))).toBe(true);
  });
});

describe('asientos lejos de su sector', () => {
  it('avisa cuando una butaca quedo fuera de su tribuna', () => {
    const m = mapa(sector({ seats: [asiento('perdido', { x: 5000, y: 5000 })] }));

    expect(mensajes(m).some((t) => t.includes('lejos de su sector'))).toBe(true);
  });

  it('no molesta con las butacas que estan apenas en el borde', () => {
    // Los generadores dejan las butacas dentro, pero el borde exacto no puede
    // disparar un aviso en cada mapa correcto.
    const m = mapa(sector({ seats: [asiento('borde', { x: 300, y: 300 })] }));

    expect(mensajes(m)).toEqual([]);
  });

  it('un sector rotado no genera avisos falsos', () => {
    // La caja sin rotar no coincide con la huella real; el margen lo contempla.
    const m = mapa(sector({ rotation: 45, seats: [asiento('a1', { x: 320, y: 320 })] }));

    expect(mensajes(m)).toEqual([]);
  });

  it('un anillo se mide desde su centro, no desde una esquina', () => {
    const anillo = sector({
      shape: 'arc', x: 500, y: 500, width: 440, height: 440,
      innerRadius: 120, outerRadius: 220,
      seats: [asiento('a1', { x: 640, y: 500 })],
    });

    expect(mensajes(mapa(anillo))).toEqual([]);
  });
});

describe('orden de los problemas', () => {
  it('los errores van antes que los avisos', () => {
    const m = mapa(
      sector({ name: '', seats: [asiento('repetido')] }),
      sector({ id: 's2', name: 'Sur', seats: [asiento('repetido')] }),
    );

    expect(severidades(m)[0]).toBe('error');
  });
});

describe('aforo total', () => {
  it('suma las butacas dibujadas', () => {
    expect(aforoTotal(mapa(sector({ seats: [asiento('a1'), asiento('a2')] })))).toBe(2);
  });

  it('suma la capacidad declarada de los sectores sin butacas', () => {
    expect(aforoTotal(mapa(sector({ capacity: 500 })))).toBe(500);
  });

  it('cuando hay butacas dibujadas manda el conteo real, no la capacidad', () => {
    // Si no, una capacidad vieja y olvidada infla el aforo del recinto.
    expect(aforoTotal(mapa(sector({ capacity: 999, seats: [asiento('a1')] })))).toBe(1);
  });

  it('el escenario no aporta aforo', () => {
    expect(aforoTotal(mapa(sector({ kind: 'stage', capacity: 300 })))).toBe(0);
  });
});
