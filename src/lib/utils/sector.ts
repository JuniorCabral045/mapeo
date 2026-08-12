import { SeatElement, VenueElement } from '../types';

/** Asientos que pertenecen a un sector, en el orden del lienzo. */
export const seatsOfSector = (
  elements: Record<string, VenueElement>,
  elementIds: string[],
  sectorId: string
): SeatElement[] =>
  elementIds
    .map((id) => elements[id])
    .filter(
      (el): el is SeatElement =>
        !!el && el.type === 'seat' && el.sectionId === sectorId
    );

/**
 * De un conjunto de ids arrastrados en el mismo gesto, cuáles hay que mover
 * por su cuenta. Un asiento cuyo propio sector también está en `ids` queda
 * afuera: `moveSector` ya arrastra a todos los asientos del sector, así que
 * aplicarle el movimiento aparte lo desplazaría el doble (una vez como
 * asiento suelto, otra como parte del sector que lo contiene).
 *
 * La decisión mira solo pertenencia -si `sectionId` está en el propio
 * conjunto de ids-, nunca estado ya modificado, así que el resultado no
 * depende del orden en que `ids` traiga al asiento y a su sector.
 */
export const idsToMoveIndividually = (
  elements: Record<string, VenueElement>,
  ids: string[]
): string[] => {
  const seleccionados = new Set(ids);
  return ids.filter((id) => {
    const el = elements[id];
    if (el?.type === 'seat' && el.sectionId && seleccionados.has(el.sectionId)) {
      return false;
    }
    return true;
  });
};
