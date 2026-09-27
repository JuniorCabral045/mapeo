import { SeatElement, SelectedSeat, VenueElement } from '../types';

/**
 * Selección tras hacer clic en `id`. Sin `sumar` lo deja solo; con `sumar`
 * (Shift) lo agrega o, si ya estaba, lo quita. Nunca repite un id.
 */
export const alternarEnSeleccion = (
  selectedIds: string[],
  id: string,
  sumar: boolean
): string[] => {
  if (!sumar) return [id];
  return selectedIds.includes(id)
    ? selectedIds.filter((s) => s !== id)
    : [...selectedIds, id];
};

/**
 * Ids y datos de los asientos elegidos en el visor. Descarta los ids que no son
 * asientos de este mapa: una selección controlada puede traer uno de un mapa
 * anterior, y sin el filtro el visor rompía al leer su fila.
 */
export const asientosElegidos = (
  elements: Record<string, VenueElement>,
  sectorNames: Record<string, string>,
  ids: string[]
): { ids: string[]; seats: SelectedSeat[] } => {
  const seats: SelectedSeat[] = [];
  for (const id of ids) {
    const el = elements[id];
    if (el?.type !== 'seat') continue;
    const seat = el as SeatElement;
    seats.push({
      id,
      row: seat.row,
      number: seat.number,
      sectorId: seat.sectionId || '',
      sectorName: (seat.sectionId && sectorNames[seat.sectionId]) || 'General',
    });
  }
  return { ids: seats.map((s) => s.id), seats };
};
