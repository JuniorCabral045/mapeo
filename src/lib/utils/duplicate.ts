import { SeatElement, ShapeElement, VenueElement } from '../types';
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

/** Formas que Konva dibuja centradas en `(x, y)`, no desde la esquina. */
const esRadial = (el: ShapeElement) =>
  el.sectionType === 'circle' || el.sectionType === 'arc';

/** Rota un vector `grados` alrededor del origen. Misma convención que usa Konva. */
const rotar = (p: { x: number; y: number }, grados: number) => {
  const rad = (grados * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return { x: p.x * cos - p.y * sin, y: p.x * sin + p.y * cos };
};

/**
 * Centro real de un sector, contemplando su rotación.
 *
 * A diferencia de `centerOf` (que usa la caja sin rotar, correcta para el
 * encuadre y el imán, que nunca la necesitan rotada), esto es lo que hace
 * falta para espejar: Konva pivota el `Group` en `(x, y)` -la esquina, para
 * rectángulo/polígono- así que el centro visual real es ese origen más el
 * centro local (ancho/2, alto/2) rotado. Para círculo/arco `(x, y)` ya es el
 * centro -Konva los dibuja pivotando ahí mismo- y la rotación no lo mueve.
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
  // Ids ya repartidos en esta llamada. El del sector nunca choca (sale de
  // `newId()`, a prueba de colisión), pero el de cada asiento se deriva de su
  // fila y número -texto libre, sin validar unicidad en el panel de
  // propiedades- así que dos asientos del sector original con la misma fila
  // y número generan el mismo id al duplicarse. `renumerarFilas` además
  // reescribe el id de cada asiento espejado a partir de fila y número, así
  // que una unicidad resuelta antes de esa reescritura no sobrevive: el
  // chequeo tiene que ser lo último que toca cada id, no una precondición.
  const idsAsignados = new Set<string>();

  for (const sectorId of sectorIds) {
    const original = elements[sectorId];
    if (!original || original.type === 'seat') continue;

    const sector = original as ShapeElement;
    // Centro real (contempla la rotación): Konva pivota el `Group` en
    // `(x, y)` -la esquina, no el centro de la caja sin rotar- y espejar
    // sobre el centro equivocado deja al sector rotado en una posición y una
    // orientación que no son el reflejo de nada. `centerOf`/`elementBounds`
    // no sirven acá a propósito: los usan el encuadre, el imán y alinear, que
    // no necesitan la rotación, y tocarlos para este caso los rompería para
    // esos otros usos.
    const centro = centroVerdadero(sector);
    const nuevoSectorId = `${sector.sectionType}-${newId()}`;
    idsAsignados.add(nuevoSectorId);

    const reflejarX = (x: number) => (mirror === 'horizontal' ? 2 * centro.x - x : x);
    const reflejarY = (y: number) => (mirror === 'vertical' ? 2 * centro.y - y : y);

    // Rotación invertida: M∘R(r) = R(−r)∘M. Vale igual para las cuatro formas
    // -la reflexión de un vector reflejado localmente dentro de su propia caja
    // (como ya hacían los vértices del polígono y los ángulos del arco, más
    // abajo) siempre cancela el signo distinto que tendría espejar en el otro
    // eje- así que no hace falta un caso por sectionType para esto.
    const rotacionNueva = mirror ? normalizar(-sector.rotation) : sector.rotation;

    // Origen reflejado sobre el centro real, y no directamente sobre el punto
    // reflejado: como el origen de rectángulo/polígono es una esquina (no el
    // centro), reflejarla tal cual desplaza la caja entera fuera de su lugar.
    // Hay que restarle además cuánto se corre esa esquina al invertir la
    // rotación -el mismo lado (ancho u alto) que ya se refleja localmente más
    // abajo (polígono, arco)-, medido con la rotación NUEVA. Para
    // círculo/arco el origen ya es el centro, así que el reflejo no lo mueve
    // y no hay corrección que aplicar.
    const radial = esRadial(sector);
    const origenReflejado = mirror
      ? { x: reflejarX(sector.x), y: reflejarY(sector.y) }
      : { x: sector.x, y: sector.y };
    const desplazamientoLocal =
      mirror && !radial
        ? mirror === 'horizontal' ? { x: sector.width, y: 0 } : { x: 0, y: sector.height }
        : { x: 0, y: 0 };
    const correccion = rotar(desplazamientoLocal, rotacionNueva);

    // ── El sector ──
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

    // Última palabra sobre el id de cada asiento: si dos coinciden (fila y
    // número repetidos en el original, o la reescritura de `renumerarFilas`
    // los volvió a igualar), el segundo recibe un sufijo. Ocurre después de
    // todo lo demás a propósito -es lo único que puede tocar el id sin que
    // algo posterior lo vuelva a pisar.
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
