import { describe, expect, it } from 'vitest';
import { generateRectLayout, type LayoutParams } from './layout';
import type { ShapeElement } from '../types';

/**
 * La generación de asientos es lo que más barato se prueba y peor se revisa a
 * ojo.
 *
 * Un asiento corrido dos píxeles no se ve en el lienzo, y dos asientos con el
 * mismo identificador tampoco: lo que se rompe es el QR de esa butaca, y eso se
 * descubre recién cuando alguien lo escanea en la tribuna y el pedido le llega
 * al asiento de otro.
 *
 * Se prueba lo que **exporta la biblioteca**, que es lo que reciben los webs.
 * Ojo: el demo de este mismo repositorio tiene su propia copia de estas
 * funciones, y las dos divergieron — ver `CLAUDE.md`.
 */

const contenedor: ShapeElement = {
  id: 'sector-norte',
  type: 'shape',
  shape: 'rect',
  name: 'Norte',
  x: 100,
  y: 200,
  width: 400,
  height: 300,
  rotation: 0,
  visible: true,
  locked: false,
  opacity: 1,
  zIndex: 1,
  fill: '#fff',
  stroke: '#000',
  strokeWidth: 1,
} as ShapeElement;

const params = (extra: Partial<LayoutParams> = {}): LayoutParams => ({
  rows: 3,
  cols: 4,
  rowSpacing: 10,
  colSpacing: 10,
  seatRadius: 8,
  startRow: 'A',
  startNum: 1,
  ...extra,
});

describe('generación de asientos rectangulares', () => {
  it('genera exactamente filas por columnas', () => {
    expect(generateRectLayout(contenedor, params()).length).toBe(12);
  });

  it('cada asiento tiene un identificador único', () => {
    // Es lo que se firma en el QR: repetirlo manda dos butacas al mismo lugar.
    const ids = generateRectLayout(contenedor, params({ rows: 10, cols: 20 })).map(s => s.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('etiqueta las filas con letras consecutivas desde la indicada', () => {
    const asientos = generateRectLayout(contenedor, params({ rows: 3, cols: 1, startRow: 'C' }));

    expect(asientos.map(s => s.row)).toEqual(['C', 'D', 'E']);
  });

  it('numera de izquierda a derecha por omisión', () => {
    const primeraFila = generateRectLayout(contenedor, params({ rows: 1, cols: 4 }));

    expect(primeraFila.map(s => s.number)).toEqual(['1', '2', '3', '4']);
  });

  it('numera al revés cuando se pide de derecha a izquierda', () => {
    // Las tribunas se numeran hacia el centro de la cancha; sin esto habría que
    // dibujar el sector espejado para que el número cayera donde corresponde.
    const primeraFila = generateRectLayout(contenedor, params({ rows: 1, cols: 4, numberDirection: 'rtl' }));

    expect(primeraFila.map(s => s.number)).toEqual(['4', '3', '2', '1']);
  });

  it('respeta el número inicial', () => {
    const primeraFila = generateRectLayout(contenedor, params({ rows: 1, cols: 3, startNum: 101 }));

    expect(primeraFila.map(s => s.number)).toEqual(['101', '102', '103']);
  });

  it('el nombre combina fila y número, que es lo que se lee en la butaca', () => {
    const [primero] = generateRectLayout(contenedor, params({ rows: 1, cols: 1, startRow: 'B', startNum: 7 }));

    expect(primero.name).toBe('B7');
  });

  // ── Posición ────────────────────────────────────────────────────────

  it('centra la grilla dentro del contenedor', () => {
    const asientos = generateRectLayout(contenedor, params({ rows: 2, cols: 2 }));

    const xs = asientos.map(s => s.x);
    const ys = asientos.map(s => s.y);
    const centroX = (Math.min(...xs) + Math.max(...xs)) / 2;
    const centroY = (Math.min(...ys) + Math.max(...ys)) / 2;

    expect(centroX).toBeCloseTo(contenedor.x + contenedor.width / 2);
    expect(centroY).toBeCloseTo(contenedor.y + contenedor.height / 2);
  });

  it('separa los asientos por su diámetro más el espaciado pedido', () => {
    const [a, b] = generateRectLayout(contenedor, params({ rows: 1, cols: 2, seatRadius: 8, colSpacing: 10 }));

    expect(b.x - a.x).toBe(8 * 2 + 10);
  });

  it('ningún asiento se sale del contenedor', () => {
    const asientos = generateRectLayout(contenedor, params({ rows: 5, cols: 8, seatRadius: 6, rowSpacing: 4, colSpacing: 4 }));

    for (const s of asientos) {
      expect(s.x).toBeGreaterThanOrEqual(contenedor.x);
      expect(s.x).toBeLessThanOrEqual(contenedor.x + contenedor.width);
      expect(s.y).toBeGreaterThanOrEqual(contenedor.y);
      expect(s.y).toBeLessThanOrEqual(contenedor.y + contenedor.height);
    }
  });

  // ── Bordes ──────────────────────────────────────────────────────────

  it('una sola butaca queda en el centro exacto', () => {
    const [unico] = generateRectLayout(contenedor, params({ rows: 1, cols: 1 }));

    expect(unico.x).toBeCloseTo(contenedor.x + contenedor.width / 2);
    expect(unico.y).toBeCloseTo(contenedor.y + contenedor.height / 2);
  });

  it('sin filas ni columnas no genera nada', () => {
    expect(generateRectLayout(contenedor, params({ rows: 0, cols: 0 }))).toEqual([]);
  });

  it('todos los asientos nacen disponibles y atados a su sector', () => {
    const asientos = generateRectLayout(contenedor, params({ rows: 2, cols: 2 }));

    for (const s of asientos) {
      expect(s.status).toBe('available');
      expect(s.sectionId).toBe(contenedor.id);
    }
  });
});
