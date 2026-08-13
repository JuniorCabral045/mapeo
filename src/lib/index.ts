import './styles.css';

// Componentes públicos
export { VenueEditor } from './VenueEditor';
export type { VenueEditorProps } from './VenueEditor';
export { VenueViewer } from './VenueViewer';
export type { VenueViewerProps } from './VenueViewer';

// Esquema y serialización
export { serializeVenue, deserializeVenue, createEmptyMap } from './schema';

// Tipos del esquema público
export type {
  VenueMap,
  SectorData,
  SeatData,
  SectorShape,
  SeatStatus,
  AvailabilityMap,
  SelectedSeat,
  CornerRadius,
  BackgroundImage,
} from './types';

// Utilidades de generación de asientos (por si se necesitan fuera del editor)
export {
  generateRectLayout,
  generateArcLayout,
  generatePolygonLayout,
  generateArcSectorLayout,
  rowLabel,
} from './utils/layout';
export type { LayoutParams } from './utils/layout';
export { pointInPolygon } from './utils/geometry';

// Plantillas de recinto
export { TEMPLATES } from './utils/templates';
export type { VenueTemplate, TemplateId } from './utils/templates';
