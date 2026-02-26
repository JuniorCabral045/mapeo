import { VenueElement } from '../types/venue';

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
    name: 'Cancha de Fútbol',
    x: centerX - 200,
    y: centerY - 125,
    width: 400,
    height: 250,
    rotation: 0,
    visible: true,
    locked: true,
    opacity: 1,
    zIndex: 1,
    fill: '#16a34a',
    isActive: true,
    sectionType: 'rectangle',
    cornerRadius: 8
  };

  // Tribunas (Sections)
  const tribunas = [
    { name: 'Tribuna Norte', x: centerX - 225, y: centerY - 250, w: 450, h: 100, color: '#3b82f6', radius: { topLeft: 50, topRight: 50, bottomLeft: 0, bottomRight: 0 } },
    { name: 'Tribuna Sur', x: centerX - 225, y: centerY + 150, w: 450, h: 100, color: '#3b82f6', radius: { topLeft: 0, topRight: 0, bottomLeft: 50, bottomRight: 50 } },
    { name: 'Tribuna Este', x: centerX + 225, y: centerY - 125, w: 120, h: 250, color: '#2563eb', radius: { topLeft: 0, topRight: 50, bottomLeft: 0, bottomRight: 50 } },
    { name: 'Tribuna Oeste', x: centerX - 345, y: centerY - 125, w: 120, h: 250, color: '#2563eb', radius: { topLeft: 50, topRight: 0, bottomLeft: 50, bottomRight: 0 } },
  ];

  tribunas.forEach((t, i) => {
    const id = `section-tribuna-${i}-${Date.now()}`;
    elements[id] = {
      id,
      type: 'section',
      name: t.name,
      x: t.x,
      y: t.y,
      width: t.w,
      height: t.h,
      rotation: 0,
      visible: true,
      locked: false,
      opacity: 0.6,
      zIndex: 2,
      fill: t.color,
      isActive: true,
      sectionType: 'rectangle',
      cornerRadius: t.radius as any
    };
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

  // Plateas (Sections)
  const plateas = [
    { name: 'Platea VIP', x: centerX - 250, y: startY + 180, w: 500, h: 120, color: '#9333ea' },
    { name: 'Platea General', x: centerX - 300, y: startY + 320, w: 600, h: 150, color: '#3b82f6' },
  ];

  plateas.forEach((p, i) => {
    const id = `section-platea-${i}-${Date.now()}`;
    elements[id] = {
      id,
      type: 'section',
      name: p.name,
      x: p.x,
      y: p.y,
      width: p.w,
      height: p.h,
      rotation: 0,
      visible: true,
      locked: false,
      opacity: 0.5,
      zIndex: 2,
      fill: p.color,
      isActive: true,
      sectionType: 'rectangle',
      cornerRadius: 15
    };
  });

  return elements;
};
