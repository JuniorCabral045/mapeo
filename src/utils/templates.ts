import { VenueElement, Seat } from '../types/venue';
import { generateRectLayout } from './layout';

const DEFAULT_SEAT_RADIUS = 3.5;

export const stadiumTemplate = (): Record<string, VenueElement> => {
  const elements: Record<string, VenueElement> = {};

  // Center of the stadium around (600, 400)
  const centerX = 600;
  const centerY = 400;

  // Pitch (Cancha)
  const pitchId = 'pitch-' + Date.now();
  elements[pitchId] = {
    id: pitchId,
    type: 'stage',
    name: 'Estadio',
    x: centerX - 200,
    y: centerY - 125,
    width: 400,
    height: 250,
    rotation: 0,
    visible: true,
    locked: true,
    opacity: 1,
    zIndex: 1,
    fill: '#1e293b',
    isActive: true,
    sectionType: 'rectangle',
    cornerRadius: 8
  };

  // Sectores (Tribunas)
  const sectores = [
    { name: 'Sector Norte', x: centerX - 200, y: centerY - 260, w: 400, h: 120, color: '#3b82f6', radius: { topLeft: 20, topRight: 20, bottomLeft: 0, bottomRight: 0 } },
    { name: 'Sector Sur', x: centerX - 200, y: centerY + 140, w: 400, h: 120, color: '#3b82f6', radius: { topLeft: 0, topRight: 0, bottomLeft: 20, bottomRight: 20 } },
    { name: 'Sector Este', x: centerX + 220, y: centerY - 125, w: 150, h: 250, color: '#2563eb', radius: { topLeft: 0, topRight: 20, bottomLeft: 0, bottomRight: 20 } },
    { name: 'Sector Oeste', x: centerX - 370, y: centerY - 125, w: 150, h: 250, color: '#2563eb', radius: { topLeft: 20, topRight: 0, bottomLeft: 20, bottomRight: 0 } },
  ];

  sectores.forEach((t, i) => {
    const sectionId = `section-tribuna-${i}-${Date.now()}`;
    const section: any = {
      id: sectionId,
      type: 'section',
      name: t.name,
      x: t.x,
      y: t.y,
      width: t.w,
      height: t.h,
      rotation: 0,
      visible: true,
      locked: false,
      opacity: 0.4,
      zIndex: 2,
      fill: t.color,
      isActive: true,
      sectionType: 'rectangle',
      cornerRadius: t.radius as any
    };
    elements[sectionId] = section;

    // Mass generate seats for each section to show scale
    const rows = i < 2 ? 12 : 18;
    const cols = i < 2 ? 22 : 10;
    const seats = generateRectLayout(section, {
        rows,
        cols,
        rowSpacing: 4.5,
        colSpacing: 4.5,
        seatRadius: 3,
        startRow: 'A',
        startNum: 1
    });
    seats.forEach(s => elements[s.id] = s);
  });

  return elements;
};

export const theaterTemplate = (): Record<string, VenueElement> => {
  const elements: Record<string, VenueElement> = {};

  const centerX = 600;
  const startY = 100;

  // Escenario
  const stageId = 'stage-theater-' + Date.now();
  elements[stageId] = {
    id: stageId,
    type: 'stage',
    name: 'Escenario Principal',
    x: centerX - 200,
    y: startY,
    width: 400,
    height: 120,
    rotation: 0,
    visible: true,
    locked: true,
    opacity: 1,
    zIndex: 1,
    fill: '#1e293b',
    isActive: true,
    sectionType: 'rectangle',
    cornerRadius: { topLeft: 10, topRight: 10, bottomLeft: 100, bottomRight: 100 }
  };

  // Sectores (Plateas)
  const sectores = [
    { name: 'Sector VIP', x: centerX - 250, y: startY + 180, w: 500, h: 120, color: '#9333ea' },
    { name: 'Sector General', x: centerX - 300, y: startY + 320, w: 600, h: 150, color: '#3b82f6' },
  ];

  sectores.forEach((p, i) => {
    const sectionId = `section-platea-${i}-${Date.now()}`;
    const section: any = {
      id: sectionId,
      type: 'section',
      name: p.name,
      x: p.x,
      y: p.y,
      width: p.w,
      height: p.h,
      rotation: 0,
      visible: true,
      locked: false,
      opacity: 0.3,
      zIndex: 2,
      fill: p.color,
      isActive: true,
      sectionType: 'rectangle',
      cornerRadius: 15
    };
    elements[sectionId] = section;

    const seats = generateRectLayout(section, {
        rows: 8,
        cols: 20 + i * 5,
        rowSpacing: 5,
        colSpacing: 5,
        seatRadius: 3.5,
        startRow: 'A',
        startNum: 1
    });
    seats.forEach(s => elements[s.id] = s);
  });

  return elements;
};
