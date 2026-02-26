export type SeatStatus = 'available' | 'occupied' | 'reserved' | 'blocked' | 'selected';

export interface BaseElement {
  id: string;
  x: number;
  y: number;
  rotation?: number;
  opacity?: number;
  price?: number;
  color?: string;
  borderColor?: string;
  borderWidth?: number;
}

export interface Seat extends BaseElement {
  row: string;
  number: string;
  status: SeatStatus;
  sectionId?: string;
  radius?: number; // Size
}

export type SectionType = 'rectangle' | 'circle' | 'polygon' | 'stage';

export interface Section extends BaseElement {
  name: string;
  type: SectionType;
  width?: number;
  height?: number;
  radius?: number;
  borderRadius?: number;
  points?: number[]; // For polygon
  isActive: boolean;
}

export interface VenueLayout {
  id: string;
  name: string;
  seats: Seat[];
  sections: Section[];
  gridSize: number;
  snapToGrid: boolean;
}

export interface EditorState {
  history: VenueLayout[];
  historyIndex: number;
  current: VenueLayout;
  selectedIds: string[];
  mode: 'edit' | 'view';
  tool: 'select' | 'add-seat' | 'add-section-rect' | 'add-section-circle' | 'add-section-polygon' | 'add-stage';
}
