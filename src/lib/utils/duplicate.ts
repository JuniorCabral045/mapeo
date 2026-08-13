import { SeatElement, ShapeElement, VenueElement } from '../types';
import { centerOf } from './bounds';
import { seatsOfSector } from './sector';

export type MirrorAxis = 'horizontal' | 'vertical' | null;

export interface DuplicateOptions {
  dx: number;
  dy: number;
  mirror: MirrorAxis;
  /** Sufijo único. Inyectable para que los tests sean deterministas. */
  newId?: () => string;
}

const sufijoPorDefecto = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/** Normaliza un ángulo a [0, 360). */
const normalizar = (grados: number) => ((grados % 360) + 360) % 360;

/**
 * Duplica sectores enteros, con sus asientos.
 *
 * Siempre genera ids nuevos: los del original son los que están impresos en los
 * QR de las butacas, y reusarlos mandaría dos asientos distintos al mismo pedido.
 *
 * Al espejar se refleja la geometría (posiciones, vértices, ángulos, orientación
 * de cada butaca) y después se renumera cada fila para que ascienda en la misma
 * dirección visual que en el original — reflejar sin renumerar deja la fila
 * leyéndose al revés.
 */
export const duplicateSectors = (
  elements: Record<string, VenueElement>,
  elementIds: string[],
  sectorIds: string[],
  { dx, dy, mirror, newId = sufijoPorDefecto }: DuplicateOptions
): VenueElement[] => {
  const salida: VenueElement[] = [];

  for (const sectorId of sectorIds) {
    const original = elements[sectorId];
    if (!original || original.type === 'seat') continue;

    const sector = original as ShapeElement;
    const centro = centerOf(sector);
    const nuevoSectorId = `${sector.sectionType}-${newId()}`;

    const reflejarX = (x: number) => (mirror === 'horizontal' ? 2 * centro.x - x : x);
    const reflejarY = (y: number) => (mirror === 'vertical' ? 2 * centro.y - y : y);

    // ── El sector ──
    const nuevoSector: ShapeElement = {
      ...sector,
      id: nuevoSectorId,
      name: `${sector.name} (copia)`,
      x: sector.x + dx,
      y: sector.y + dy,
    };

    if (mirror && sector.sectionType === 'polygon' && sector.points) {
      nuevoSector.points = sector.points.map((valor, i) =>
        i % 2 === 0
          ? mirror === 'horizontal' ? sector.width - valor : valor
          : mirror === 'vertical' ? sector.height - valor : valor
      );
    }

    if (mirror && sector.sectionType === 'arc') {
      const inicio = sector.startAngle ?? 0;
      const fin = sector.endAngle ?? 0;
      // Reflejar invierte el sentido: el ángulo final pasa a ser el inicial.
      const a = mirror === 'horizontal' ? 180 - fin : -fin;
      const b = mirror === 'horizontal' ? 180 - inicio : -inicio;
      const inicioNuevo = normalizar(a);
      nuevoSector.startAngle = inicioNuevo;
      nuevoSector.endAngle = inicioNuevo + (b - a);
    }

    salida.push(nuevoSector);

    // ── Los asientos ──
    const asientos = seatsOfSector(elements, elementIds, sectorId);
    const nuevos: SeatElement[] = asientos.map((asiento) => ({
      ...asiento,
      id: `seat-${nuevoSectorId}-${asiento.row}-${asiento.number}`,
      sectionId: nuevoSectorId,
      x: reflejarX(asiento.x) + dx,
      y: reflejarY(asiento.y) + dy,
      rotation: mirror
        ? normalizar(mirror === 'horizontal' ? 180 - asiento.rotation : -asiento.rotation)
        : asiento.rotation,
    }));

    if (mirror) renumerarFilas(asientos, nuevos, mirror);

    salida.push(...nuevos);
  }

  return salida;
};

/**
 * Devuelve a cada fila la dirección de numeración que tenía en pantalla.
 *
 * Se toman los números de la fila original ordenados por su posición, y se
 * reparten sobre los asientos espejados ordenados por su posición nueva.
 */
const renumerarFilas = (
  originales: SeatElement[],
  espejados: SeatElement[],
  mirror: Exclude<MirrorAxis, null>
) => {
  const eje = mirror === 'horizontal' ? 'x' : 'y';
  const porFila = new Map<string, number[]>();

  for (const fila of new Set(originales.map((a) => a.row))) {
    const numeros = originales
      .filter((a) => a.row === fila)
      .sort((a, b) => a[eje] - b[eje])
      .map((a) => a.number);
    porFila.set(fila, numeros as unknown as number[]);
  }

  for (const fila of porFila.keys()) {
    const numeros = porFila.get(fila) as unknown as string[];
    espejados
      .filter((a) => a.row === fila)
      .sort((a, b) => a[eje] - b[eje])
      .forEach((asiento, i) => {
        asiento.number = numeros[i];
        asiento.name = `${asiento.row}${numeros[i]}`;
        asiento.id = `seat-${asiento.sectionId}-${asiento.row}-${numeros[i]}`;
      });
  }
};
