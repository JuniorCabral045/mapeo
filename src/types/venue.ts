export type SeatStatus = 'available' | 'occupied' | 'reserved' | 'selected';

export interface Seat {
  id: string;
  x: number;
  y: number;
  row: string;
  number: string;
  status: SeatStatus;
  price: number;
  sectionId?: string;
  rotation?: number;
}

export type SectionType = 'rectangle' | 'circle' | 'polygon';

export interface Section {
  id: string;
  name: string;
  type: SectionType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  points?: number[]; // For polygon or custom shapes
  rotation?: number;
  color: string;
  price?: number; // Default price for seats in this section
}

export interface VenueLayout {
  id: string;
  name: string;
  seats: Seat[];
  sections: Section[];
}

export interface EditorState {
  history: VenueLayout[];
  historyIndex: number;
  current: VenueLayout;
  selectedIds: string[];
  mode: 'edit' | 'view';
  tool: 'select' | 'add-seat' | 'add-section-rect' | 'add-section-circle';
}
