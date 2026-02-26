export type ElementType = 'seat' | 'section' | 'group' | 'stage' | 'shape';
export type SectionType = 'rectangle' | 'circle' | 'arc';
export type SeatStatus = 'available' | 'occupied' | 'blocked' | 'reserved' | 'selected';

export interface CornerRadius {
  topLeft: number;
  topRight: number;
  bottomLeft: number;
  bottomRight: number;
}

export interface BaseElement {
  id: string;
  type: ElementType;
  parentId?: string;
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
  type: 'section' | 'stage' | 'shape';
  width: number;
  height: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: CornerRadius | number; // Support for independent corners
  isActive: boolean; // For sections (gray out if inactive)
  sectionType: SectionType;
  radius?: number; // For circles/arcs
  innerRadius?: number; // For arcs (hollow)
  angle?: number; // For arcs
}

export interface Seat extends BaseElement {
  type: 'seat';
  sectionId?: string;
  row: string;
  number: string;
  status: SeatStatus;
  price: number;
  radius: number;
  color?: string;
}

export interface VenueGroup extends BaseElement {
  type: 'group';
  childrenIds: string[];
}

export type VenueElement = ShapeElement | Seat | VenueGroup;

export interface ViewState {
  scale: number;
  x: number;
  y: number;
}

export interface GridConfig {
  enabled: boolean;
  visible: boolean;
  size: number;
  snapToElements: boolean;
}

export interface VenueState {
  mode: 'edit' | 'view';
  elements: Record<string, VenueElement>;
  elementIds: string[]; // For Z-Index ordering
  selectedIds: string[];
  viewState: ViewState;
  gridConfig: GridConfig;
  venueName: string;

  // History
  history: Array<Record<string, VenueElement>>;
  historyIndex: number;

  // Clipboard
  clipboard: VenueElement[] | null;
}
