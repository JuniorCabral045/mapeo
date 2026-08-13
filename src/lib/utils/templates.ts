import { SeatGenerationParams, ShapeElement, VenueElement } from '../types';
import { generateArcSectorLayout, generateRectLayout } from './layout';

export type TemplateId = 'estadio-recto' | 'estadio-curvo' | 'teatro';

export interface VenueTemplate {
  id: TemplateId;
  name: string;
  description: string;
  /** `newId` se inyecta en los tests para que los ids sean deterministas. */
  build: (newId?: () => string) => VenueElement[];
}

const sufijoPorDefecto = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const CENTRO_X = 600;
const CENTRO_Y = 400;

const base = (
  id: string,
  name: string,
  tipo: 'section' | 'stage',
  extra: Partial<ShapeElement>
): ShapeElement => ({
  id,
  type: tipo,
  name,
  x: 0, y: 0, width: 100, height: 100, rotation: 0,
  visible: true,
  locked: false,
  opacity: tipo === 'stage' ? 1 : 0.2,
  zIndex: tipo === 'stage' ? 1 : 5,
  fill: tipo === 'stage' ? '#1F2937' : '#6F3E8F',
  isActive: true,
  sectionType: 'rectangle',
  ...extra,
});

const generacion = (extra: Partial<SeatGenerationParams> = {}): SeatGenerationParams => ({
  rows: 8, cols: 20, seatRadius: 3.5, startRow: 'A', startNum: 1, numberDirection: 'ltr',
  ...extra,
});

/** Sector rectangular con sus butacas, ya con los parámetros registrados. */
const sectorConAsientos = (
  sector: ShapeElement,
  gen: SeatGenerationParams
): VenueElement[] => {
  const conGeneracion = { ...sector, generation: gen };
  const asientos = generateRectLayout(conGeneracion, {
    rows: gen.rows,
    cols: gen.cols,
    rowSpacing: gen.seatRadius * 1.5,
    colSpacing: gen.seatRadius * 1.5,
    seatRadius: gen.seatRadius,
    startRow: gen.startRow,
    startNum: gen.startNum,
    numberDirection: gen.numberDirection,
  });
  return [conGeneracion, ...asientos];
};

const estadioRecto = (newId = sufijoPorDefecto): VenueElement[] => {
  const s = newId();
  const cancha = base(`stage-${s}`, 'Cancha', 'stage', {
    x: CENTRO_X - 200, y: CENTRO_Y - 125, width: 400, height: 250, cornerRadius: 8, locked: true,
  });

  const tribunas: { nombre: string; x: number; y: number; w: number; h: number; gen: SeatGenerationParams }[] = [
    { nombre: 'Tribuna Norte', x: CENTRO_X - 200, y: CENTRO_Y - 260, w: 400, h: 120, gen: generacion({ rows: 8, cols: 22 }) },
    { nombre: 'Tribuna Sur', x: CENTRO_X - 200, y: CENTRO_Y + 140, w: 400, h: 120, gen: generacion({ rows: 8, cols: 22 }) },
    { nombre: 'Tribuna Este', x: CENTRO_X + 220, y: CENTRO_Y - 125, w: 150, h: 250, gen: generacion({ rows: 12, cols: 8 }) },
    { nombre: 'Tribuna Oeste', x: CENTRO_X - 370, y: CENTRO_Y - 125, w: 150, h: 250, gen: generacion({ rows: 12, cols: 8 }) },
  ];

  return [
    cancha,
    ...tribunas.flatMap((t, i) =>
      sectorConAsientos(
        base(`rectangle-${s}-${i}`, t.nombre, 'section', { x: t.x, y: t.y, width: t.w, height: t.h }),
        t.gen
      )
    ),
  ];
};

const estadioCurvo = (newId = sufijoPorDefecto): VenueElement[] => {
  const s = newId();
  const cancha = base(`stage-${s}`, 'Cancha', 'stage', {
    x: CENTRO_X - 180, y: CENTRO_Y - 110, width: 360, height: 220, cornerRadius: 8, locked: true,
  });

  // Cuatro anillos alrededor de la cancha. Los ángulos van en grados, 0° a la
  // derecha y en sentido horario.
  const anillos = [
    { nombre: 'Anillo Norte', inicio: 200, fin: 340 },
    { nombre: 'Anillo Sur', inicio: 20, fin: 160 },
    { nombre: 'Anillo Este', inicio: -70, fin: 70 },
    { nombre: 'Anillo Oeste', inicio: 110, fin: 250 },
  ];

  const salida: VenueElement[] = [cancha];

  anillos.forEach((anillo, i) => {
    const gen = generacion({ rows: 6, cols: 0, seatRadius: 4 });
    const sector = base(`arc-${s}-${i}`, anillo.nombre, 'section', {
      x: CENTRO_X,
      y: CENTRO_Y,
      width: 620,
      height: 620,
      sectionType: 'arc',
      innerRadius: 240,
      outerRadius: 310,
      startAngle: anillo.inicio,
      endAngle: anillo.fin,
      generation: gen,
    });
    const asientos = generateArcSectorLayout(sector, {
      rows: gen.rows,
      cols: gen.cols,
      rowSpacing: gen.seatRadius * 2,
      colSpacing: gen.seatRadius * 1.5,
      seatRadius: gen.seatRadius,
      startRow: gen.startRow,
      startNum: gen.startNum,
      numberDirection: gen.numberDirection,
    });
    salida.push(sector, ...asientos);
  });

  return salida;
};

const teatro = (newId = sufijoPorDefecto): VenueElement[] => {
  const s = newId();
  const escenario = base(`stage-${s}`, 'Escenario', 'stage', {
    x: CENTRO_X - 200, y: 100, width: 400, height: 120,
    cornerRadius: { topLeft: 10, topRight: 10, bottomLeft: 100, bottomRight: 100 },
    locked: true,
  });

  const plateas = [
    { nombre: 'Platea VIP', x: CENTRO_X - 250, y: 280, w: 500, h: 120, gen: generacion({ rows: 6, cols: 24, seatRadius: 4 }) },
    { nombre: 'Platea General', x: CENTRO_X - 300, y: 420, w: 600, h: 150, gen: generacion({ rows: 8, cols: 28, seatRadius: 4 }) },
  ];

  return [
    escenario,
    ...plateas.flatMap((p, i) =>
      sectorConAsientos(
        base(`rectangle-${s}-${i}`, p.nombre, 'section', { x: p.x, y: p.y, width: p.w, height: p.h }),
        p.gen
      )
    ),
  ];
};

export const TEMPLATES: VenueTemplate[] = [
  {
    id: 'estadio-recto',
    name: 'Estadio (tribunas rectas)',
    description: 'Cancha con cuatro tribunas rectangulares',
    build: estadioRecto,
  },
  {
    id: 'estadio-curvo',
    name: 'Estadio (anillo curvo)',
    description: 'Cancha con cuatro anillos curvos alrededor',
    build: estadioCurvo,
  },
  {
    id: 'teatro',
    name: 'Teatro',
    description: 'Escenario con platea VIP y general',
    build: teatro,
  },
];
