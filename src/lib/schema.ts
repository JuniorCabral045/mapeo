import {
  SeatData,
  SeatElement,
  SectorData,
  ShapeElement,
  VenueElement,
  VenueMap,
} from './types';

/** Crea un mapeo vacío listo para el editor. */
export const createEmptyMap = (name = 'Nuevo Recinto'): VenueMap => ({
  version: 1,
  name,
  sectors: [],
});

/**
 * Convierte el estado plano del editor al documento `VenueMap`
 * (recinto -> sectores -> asientos) que se persiste en el backend.
 */
export const serializeVenue = (
  elements: Record<string, VenueElement>,
  elementIds: string[],
  name: string,
  venueId?: string
): VenueMap => {
  const sectors: SectorData[] = [];
  const sectorIndex: Record<string, SectorData> = {};

  for (const id of elementIds) {
    const el = elements[id];
    if (!el || (el.type !== 'section' && el.type !== 'stage')) continue;
    const shape = el as ShapeElement;
    const sector: SectorData = {
      id: shape.id,
      name: shape.name,
      kind: shape.type,
      shape: shape.sectionType,
      x: shape.x,
      y: shape.y,
      width: shape.width,
      height: shape.height,
      rotation: shape.rotation,
      fill: shape.fill,
      radius: shape.radius,
      cornerRadius: shape.cornerRadius,
      active: shape.isActive,
      capacity: shape.capacity,
      seats: [],
    };
    sectors.push(sector);
    sectorIndex[sector.id] = sector;
  }

  // Asientos sin sector conocido caen en un sector "General" sintético.
  let generalSector: SectorData | null = null;

  for (const id of elementIds) {
    const el = elements[id];
    if (!el || el.type !== 'seat') continue;
    const seat = el as SeatElement;
    const data: SeatData = {
      id: seat.id,
      row: seat.row,
      number: seat.number,
      x: seat.x,
      y: seat.y,
      radius: seat.radius,
    };
    const parent = seat.sectionId ? sectorIndex[seat.sectionId] : undefined;
    if (parent) {
      parent.seats.push(data);
    } else {
      if (!generalSector) {
        generalSector = {
          id: 'sector-general',
          name: 'General',
          kind: 'section',
          shape: 'rectangle',
          x: seat.x,
          y: seat.y,
          width: 0,
          height: 0,
          rotation: 0,
          fill: '#3b82f6',
          active: true,
          seats: [],
        };
        sectors.push(generalSector);
      }
      generalSector.seats.push(data);
    }
  }

  return { version: 1, id: venueId, name, sectors };
};

/**
 * Convierte un `VenueMap` guardado al estado plano que consume el editor/canvas.
 */
export const deserializeVenue = (
  map: VenueMap
): { elements: Record<string, VenueElement>; elementIds: string[]; name: string } => {
  const elements: Record<string, VenueElement> = {};
  const elementIds: string[] = [];

  map.sectors.forEach((sector, i) => {
    const shape: ShapeElement = {
      id: sector.id,
      type: sector.kind,
      name: sector.name,
      x: sector.x,
      y: sector.y,
      width: sector.width,
      height: sector.height,
      rotation: sector.rotation,
      visible: true,
      locked: false,
      opacity: sector.kind === 'stage' ? 1 : 0.2,
      zIndex: i,
      fill: sector.fill,
      cornerRadius: sector.cornerRadius,
      isActive: sector.active,
      capacity: sector.capacity,
      sectionType: sector.shape,
      radius: sector.radius,
    };
    elements[shape.id] = shape;
    elementIds.push(shape.id);
  });

  map.sectors.forEach((sector) => {
    sector.seats.forEach((seat) => {
      const el: SeatElement = {
        id: seat.id,
        type: 'seat',
        name: `${seat.row}${seat.number}`,
        x: seat.x,
        y: seat.y,
        rotation: 0,
        visible: true,
        locked: false,
        opacity: 1,
        zIndex: 10,
        sectionId: sector.id,
        row: seat.row,
        number: seat.number,
        status: 'available',
        radius: seat.radius,
      };
      elements[el.id] = el;
      elementIds.push(el.id);
    });
  });

  return { elements, elementIds, name: map.name };
};
