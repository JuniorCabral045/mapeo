// ============================================================
// Esquema público del mapeo (lo que viaja hacia/desde el backend)
// ============================================================

/** Estado de un asiento en tiempo de venta (lo provee el backend por evento). */
export type SeatStatus = 'available' | 'occupied' | 'blocked' | 'reserved';

/** Mapa de disponibilidad: id de asiento -> estado. */
export type AvailabilityMap = Record<string, SeatStatus>;

export type SectorShape = 'rectangle' | 'circle' | 'arc' | 'polygon';

export interface CornerRadius {
  topLeft: number;
  topRight: number;
  bottomLeft: number;
  bottomRight: number;
}

/** Un asiento dentro de un sector. Coordenadas absolutas del lienzo. */
export interface SeatData {
  id: string;
  row: string;
  number: string;
  x: number;
  y: number;
  radius: number;
}

/** Un sector (polígono/forma) del recinto, con sus asientos. */
export interface SectorData {
  id: string;
  name: string;
  /** 'section' = sector vendible; 'stage' = escenario/cancha (sin asientos). */
  kind: 'section' | 'stage';
  shape: SectorShape;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fill: string;
  /** Radio para shape 'circle'. */
  radius?: number;
  cornerRadius?: CornerRadius | number;
  /** Sector inactivo = visible pero no vendible. */
  active: boolean;
  /** Capacidad manual para sectores sin asientos dibujados (p.ej. gradería general). */
  capacity?: number;
  /** Vértices x,y relativos al origen del elemento (shape 'polygon'). */
  points?: number[];
  /** Anillo/arco (shape 'arc'): radios y ángulos en grados (0° = derecha, horario). */
  innerRadius?: number;
  outerRadius?: number;
  startAngle?: number;
  endAngle?: number;
  seats: SeatData[];
}

/** Plano de referencia para calcar el recinto. Solo se muestra en el editor. */
export interface BackgroundImage {
  src: string;
  width: number;
  height: number;
  x: number;
  y: number;
  opacity: number;
}

/** Documento completo de un mapeo de recinto. Es lo que se guarda en el backend. */
export interface VenueMap {
  version: 1;
  /** Id del recinto en el backend (opcional, lo asigna tu API). */
  id?: string;
  name: string;
  sectors: SectorData[];
  /** Plano de fondo del editor (data URL reducido). El visor lo ignora. */
  backgroundImage?: BackgroundImage;
}

/** Asiento seleccionado en el visor, con contexto para armar el pedido. */
export interface SelectedSeat {
  id: string;
  row: string;
  number: string;
  sectorId: string;
  sectorName: string;
}

// ============================================================
// Modelo interno del editor (almacenamiento plano para el canvas)
// ============================================================

export type ElementType = 'seat' | 'section' | 'stage';

export interface BaseElement {
  id: string;
  type: ElementType;
  name: string;
  x: number;
  y: number;
  rotation: number;
  visible: boolean;
  locked: boolean;
  opacity: number;
  zIndex: number;
}

export interface ShapeElement extends BaseElement {
  type: 'section' | 'stage';
  width: number;
  height: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: CornerRadius | number;
  isActive: boolean;
  capacity?: number;
  /** Vértices x,y relativos al origen del elemento (sectionType 'polygon'). */
  points?: number[];
  /** Anillo/arco (sectionType 'arc'): radios y ángulos en grados. */
  innerRadius?: number;
  outerRadius?: number;
  startAngle?: number;
  endAngle?: number;
  sectionType: SectorShape;
  radius?: number;
}

export interface SeatElement extends BaseElement {
  type: 'seat';
  sectionId?: string;
  row: string;
  number: string;
  status: SeatStatus;
  radius: number;
  color?: string;
}

export type VenueElement = ShapeElement | SeatElement;

export interface ViewState {
  scale: number;
  x: number;
  y: number;
}

export interface GridConfig {
  enabled: boolean;
  visible: boolean;
  size: number;
}

export type EditorTool = 'select' | 'pan' | 'polygon';

export interface HistorySnapshot {
  elements: Record<string, VenueElement>;
  elementIds: string[];
}
