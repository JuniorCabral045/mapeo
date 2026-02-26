import { VenueElement } from '../types/venue';

export const stadiumTemplate = (): Record<string, VenueElement> => {
  const elements: Record<string, VenueElement> = {};

  // Pitch
  const pitchId = 'pitch-1';
  elements[pitchId] = {
    id: pitchId,
    type: 'stage',
    name: 'Cancha',
    x: 400,
    y: 300,
    width: 400,
    height: 250,
    rotation: 0,
    visible: true,
    locked: true,
    opacity: 1,
    zIndex: 1,
    fill: '#22c55e',
    isActive: true,
    sectionType: 'rectangle',
    cornerRadius: 10
  };

  // Sections
  const sections = [
    { name: 'Norte', x: 400, y: 150, w: 450, h: 100 },
    { name: 'Sur', x: 400, y: 700, w: 450, h: 100 },
    { name: 'Este', x: 150, y: 425, w: 100, h: 300 },
    { name: 'Oeste', x: 1050, y: 425, w: 100, h: 300 },
  ];

  sections.forEach((s, i) => {
    const id = `section-stadium-${i}`;
    elements[id] = {
      id,
      type: 'section',
      name: s.name,
      x: s.x,
      y: s.y,
      width: s.w,
      height: s.h,
      rotation: 0,
      visible: true,
      locked: false,
      opacity: 0.4,
      zIndex: 2,
      fill: '#3b82f6',
      isActive: true,
      sectionType: 'rectangle',
      cornerRadius: 5
    };
  });

  return elements;
};

export const theaterTemplate = (): Record<string, VenueElement> => {
  const elements: Record<string, VenueElement> = {};

  // Stage
  const stageId = 'stage-theater';
  elements[stageId] = {
    id: stageId,
    type: 'stage',
    name: 'ESCENARIO',
    x: 500,
    y: 100,
    width: 300,
    height: 80,
    rotation: 0,
    visible: true,
    locked: true,
    opacity: 1,
    zIndex: 1,
    fill: '#475569',
    isActive: true,
    sectionType: 'rectangle',
    cornerRadius: { topLeft: 0, topRight: 0, bottomLeft: 40, bottomRight: 40 }
  };

  return elements;
};
