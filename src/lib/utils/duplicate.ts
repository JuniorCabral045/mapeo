import { SeatElement, ShapeElement, VenueElement } from '../types';
import { esRadial } from './bounds';
import { sufijoUnico } from './elements';
import { seatsOfSector } from './sector';

export type MirrorAxis = 'horizontal' | 'vertical' | null;

export interface DuplicateOptions {
  dx: number;
  dy: number;
  mirror: MirrorAxis;
  /** Sufijo único. Inyectable para que los tests sean deterministas. */
  newId?: () => string;
}

/** Normaliza un ángulo a [0, 360). */
const normalizar = (grados: number) => ((grados % 360) + 360) % 360;

/** Rota un vector `grados` alrededor del origen. Misma convención que usa Konva. */
const rotar = (p: { x: number; y: number }, grados: number) => {
  const rad = (grados * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return { x: p.x * cos - p.y * sin, y: p.x * sin + p.y * cos };
};

/**
 * Centro visual de un sector, contemplando su rotación. Konva pivota el `Group`
 * en `(x, y)`, que para rectángulo y polígono es la esquina: el centro es ese
 * origen más el centro local rotado. `centerOf` usa la caja sin rotar y no sirve
 * para espejar.
 */
const centroVerdadero = (sector: ShapeElement): { x: number; y: number } => {
  if (esRadial(sector)) return { x: sector.x, y: sector.y };
  const local = rotar({ x: sector.width / 2, y: sector.height / 2 }, sector.rotation);
  return { x: sector.x + local.x, y: sector.y + local.y };
};

/**
 * Duplica sectores enteros, con sus asientos.
 *
 * Siempre genera ids nuevos: los del original son los que están impresos en los
 * QR de las butacas, y reusarlos mandaría dos asientos distintos al mismo pedido.
 *
 * Al espejar se refleja la geometría (posiciones, vértices, ángulos, orientación
 * de cada butaca) y después se renumera cada fila para que ascienda en la misma
 * dirección visual que en el original.
 */
export const duplicateSectors = (
  elements: Record<string, VenueElement>,
  elementIds: string[],
  sectorIds: string[],
  { dx, dy, mirror, newId = sufijoUnico }: DuplicateOptions
): VenueElement[] => {
  const salida: VenueElement[] = [];
  // El id de cada asiento sale de su fila y número, que son texto libre: dos
  // asientos pueden chocar. Se garantiza unicidad al final de todo.
  const idsAsignados = new Set<string>();

  for (const sectorId of sectorIds) {
    const original = elements[sectorId];
    if (!original || original.type === 'seat') continue;

    const sector = original as ShapeElement;
    const centro = centroVerdadero(sector);
    const nuevoSectorId = `${sector.sectionType}-${newId()}`;
    idsAsignados.add(nuevoSectorId);

    const reflejarX = (x: number) => (mirror === 'horizontal' ? 2 * centro.x - x : x);
    const reflejarY = (y: number) => (mirror === 'vertical' ? 2 * centro.y - y : y);

    // M∘R(r) = R(−r)∘M, para las cuatro formas.
    const rotacionNueva = mirror ? normalizar(-sector.rotation) : sector.rotation;

    // El origen de rectángulo y polígono es una esquina: reflejado, pasa a ser la
    // esquina opuesta, así que se corre un ancho (o un alto) medido con la
    // rotación nueva. Círculo y arco tienen el origen en el centro.
    const origenReflejado = mirror
      ? { x: reflejarX(sector.x), y: reflejarY(sector.y) }
      : { x: sector.x, y: sector.y };
    const desplazamientoLocal =
      mirror && !esRadial(sector)
        ? mirror === 'horizontal' ? { x: sector.width, y: 0 } : { x: 0, y: sector.height }
        : { x: 0, y: 0 };
    const correccion = rotar(desplazamientoLocal, rotacionNueva);

    const nuevoSector: ShapeElement = {
      ...sector,
      id: nuevoSectorId,
      name: `${sector.name} (copia)`,
      x: origenReflejado.x - correccion.x + dx,
      y: origenReflejado.y - correccion.y + dy,
      rotation: rotacionNueva,
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

    for (const asiento of nuevos) {
      let candidato = asiento.id;
      let sufijo = 2;
      while (idsAsignados.has(candidato)) {
        candidato = `${asiento.id}-${sufijo++}`;
      }
      asiento.id = candidato;
      idsAsignados.add(candidato);
    }

    salida.push(...nuevos);
  }

  return salida;
};

/**
 * Devuelve a cada fila la dirección de numeración que tenía en pantalla: los
 * números de la fila original ordenados por posición se reparten sobre los
 * asientos espejados ordenados por su posición nueva.
 */
const renumerarFilas = (
  originales: SeatElement[],
  espejados: SeatElement[],
  mirror: Exclude<MirrorAxis, null>
) => {
  const eje = mirror === 'horizontal' ? 'x' : 'y';
  const enOrden = (asientos: SeatElement[], fila: string) =>
    asientos.filter((a) => a.row === fila).sort((a, b) => a[eje] - b[eje]);

  for (const fila of new Set(originales.map((a) => a.row))) {
    const numeros = enOrden(originales, fila).map((a) => a.number);
    enOrden(espejados, fila).forEach((asiento, i) => {
      asiento.number = numeros[i];
      asiento.name = `${asiento.row}${numeros[i]}`;
      asiento.id = `seat-${asiento.sectionId}-${asiento.row}-${numeros[i]}`;
    });
  }
};
