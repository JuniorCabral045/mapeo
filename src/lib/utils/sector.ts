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
