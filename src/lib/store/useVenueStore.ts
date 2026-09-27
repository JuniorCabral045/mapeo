import { create } from 'zustand';
import {
  BackgroundImage,
  EditorTool,
  GridConfig,
  HistorySnapshot,
  SeatElement,
  SeatGenerationParams,
  ShapeElement,
  VenueElement,
  VenueMap,
  ViewState,
} from '../types';
import { deserializeVenue, serializeVenue } from '../schema';
import { calculateBounds, fitView } from '../utils/bounds';
import { idsToMoveIndividually, seatsOfSector } from '../utils/sector';
import { alignElements, distributeElements, type AlignMode, type DistributeAxis, type Movimientos } from '../utils/align';
import { duplicateSectors as calcularDuplicados, type DuplicateOptions } from '../utils/duplicate';

export interface Transformacion {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

interface VenueStore {
  elements: Record<string, VenueElement>;
  elementIds: string[];
  selectedIds: string[];
  viewState: ViewState;
  gridConfig: GridConfig;
  venueName: string;
  currentTool: EditorTool;
  /** Preferencia de vista: no se guarda ni entra al historial. */
  sectorLabels: boolean;
  backgroundImage: BackgroundImage | null;
  /** Tamaño del lienzo en píxeles. Lo publica EditorCanvas; lo necesita fitToContent. */
  canvasSize: { width: number; height: number };
  /**
   * Si EditorCanvas ya midió el lienzo. Describe el <canvas> físico, no el mapa:
   * reset() no la toca, porque el lienzo sigue montado y medido.
   */
  hasMeasuredCanvas: boolean;
  /** loadMap pidió encuadrar antes de que el lienzo estuviera medido. */
  pendingFit: boolean;

  history: HistorySnapshot[];
  historyIndex: number;

  addElement: (element: VenueElement) => void;
  addElements: (elements: VenueElement[]) => void;
  /** Inserta los elementos de una plantilla sin borrar lo que ya hay. */
  applyTemplate: (elements: VenueElement[]) => void;
  /** Sin historial: el panel de propiedades lo llama en cada tecla. */
  updateElement: (id: string, updates: Partial<VenueElement>) => void;
  /**
   * Cambia posición o rotación desde el panel. A un sector lo acompañan sus
   * asientos, como al arrastrarlo. Sin historial, igual que `updateElement`.
   */
  placeElement: (id: string, cambio: Partial<Pick<VenueElement, 'x' | 'y' | 'rotation'>>) => void;
  deleteElements: (ids: string[]) => void;
  /** Reemplaza los asientos de un sector y registra con qué se generaron, en un solo paso. */
  regenerateSeats: (sectorId: string, seats: SeatElement[], generation: SeatGenerationParams) => void;
  /** Duplica los sectores indicados (con sus asientos) y los deja seleccionados. */
  duplicateSectors: (sectorIds: string[], options: DuplicateOptions) => void;
  /**
   * Mueve un sector con todos sus asientos. `guardarHistorial` en false deja que
   * quien llama cierre el paso una sola vez por gesto.
   */
  moveSector: (id: string, x: number, y: number, guardarHistorial?: boolean) => void;
  /** Empuja la selección sin historial: el hook de atajos agrupa la ráfaga. */
  nudgeSelection: (dx: number, dy: number) => void;
  /** Aplica al sector y a sus asientos la misma transformación afín. */
  transformSector: (id: string, cambio: Transformacion, guardarHistorial?: boolean) => void;

  selectElements: (ids: string[]) => void;
  clearSelection: () => void;
  alignSelection: (mode: AlignMode) => void;
  distributeSelection: (axis: DistributeAxis) => void;

  setViewState: (updates: Partial<ViewState>) => void;
  setCanvasSize: (width: number, height: number) => void;
  /** Encuadra todo el contenido. Sin elementos no hace nada. */
  fitToContent: () => void;
  setGridConfig: (updates: Partial<GridConfig>) => void;
  setTool: (tool: EditorTool) => void;
  setSectorLabels: (visible: boolean) => void;
  setVenueName: (name: string) => void;

  setBackgroundImage: (image: BackgroundImage) => void;
  removeBackgroundImage: () => void;
  updateBackgroundOpacity: (opacity: number) => void;

  loadMap: (map: VenueMap) => void;
  reset: () => void;

  saveHistory: () => void;
  undo: () => void;
  redo: () => void;
}

const DEFAULT_GRID: GridConfig = {
  enabled: true,
  visible: true,
  size: 20,
  snapToElements: true,
};

const DEFAULT_VIEW: ViewState = {
  scale: 1,
  x: 100,
  y: 100,
};

const HISTORIAL_MAXIMO = 50;

const clonar = <T,>(valor: T): T => JSON.parse(JSON.stringify(valor));

/** Lleva `id` a (x, y) y desplaza sus asientos lo mismo, sobre una copia de `elements`. */
const desplazarConAsientos = (
  origen: Record<string, VenueElement>,
  destino: Record<string, VenueElement>,
  elementIds: string[],
  id: string,
  x: number,
  y: number
) => {
  const el = origen[id];
  const dx = x - el.x;
  const dy = y - el.y;
  destino[id] = { ...el, x, y };
  if (el.type === 'seat') return;
  for (const asiento of seatsOfSector(origen, elementIds, id)) {
    destino[asiento.id] = { ...asiento, x: asiento.x + dx, y: asiento.y + dy };
  }
};

/**
 * Aplica un conjunto de movimientos en un solo paso de historial. Un asiento
 * cuyo sector también se mueve queda fuera (`idsToMoveIndividually`): si no, el
 * resultado dependería del orden de los ids.
 */
const aplicarMovimientos = (
  get: () => VenueStore,
  set: (parcial: Partial<VenueStore>) => void,
  movimientos: Movimientos,
  guardarHistorial = true
) => {
  const { elements, elementIds } = get();
  const ids = idsToMoveIndividually(elements, Object.keys(movimientos)).filter((id) => elements[id]);
  if (ids.length === 0) return;

  const nuevos = { ...elements };
  for (const id of ids) {
    desplazarConAsientos(elements, nuevos, elementIds, id, movimientos[id].x, movimientos[id].y);
  }

  set({ elements: nuevos });
  if (guardarHistorial) get().saveHistory();
};

/**
 * Konva pivota el grupo en su origen: un punto del sector es
 * `origen + R(rotación) · S(escala) · local`. Para cada asiento se recupera su
 * posición local con la transformación vieja y se aplica la nueva. Rotar y
 * escalar no conmutan con escalas distintas por eje, así que escalar en ejes de
 * mundo sacaba de su tribuna los asientos de un sector girado.
 */
const transformarAsiento = (
  asiento: SeatElement,
  sector: ShapeElement,
  cambio: Transformacion
): SeatElement => {
  const antes = (sector.rotation * Math.PI) / 180;
  const despues = (cambio.rotation * Math.PI) / 180;
  const rx = asiento.x - sector.x;
  const ry = asiento.y - sector.y;
  const localX = (rx * Math.cos(antes) + ry * Math.sin(antes)) * cambio.scaleX;
  const localY = (-rx * Math.sin(antes) + ry * Math.cos(antes)) * cambio.scaleY;
  return {
    ...asiento,
    x: cambio.x + localX * Math.cos(despues) - localY * Math.sin(despues),
    y: cambio.y + localX * Math.sin(despues) + localY * Math.cos(despues),
    rotation: asiento.rotation + cambio.rotation - sector.rotation,
  };
};

/** Mapa serializado con el estado actual del editor. */
export const mapaDelEditor = (
  state: Pick<VenueStore, 'elements' | 'elementIds' | 'venueName' | 'backgroundImage'>
): VenueMap =>
  serializeVenue(state.elements, state.elementIds, state.venueName, undefined, state.backgroundImage ?? undefined);

/**
 * Si entre dos estados hubo un cambio confirmado del mapa: un paso de historial
 * nuevo, un deshacer/rehacer o un plano de fondo distinto. Compara el arreglo de
 * historial y no solo el índice, que con el historial lleno ya no cambia.
 */
export const huboCambioConfirmado = (
  state: Pick<VenueStore, 'history' | 'historyIndex' | 'backgroundImage'>,
  prev: Pick<VenueStore, 'history' | 'historyIndex' | 'backgroundImage'>
): boolean =>
  state.history !== prev.history ||
  state.historyIndex !== prev.historyIndex ||
  state.backgroundImage !== prev.backgroundImage;

export const useVenueStore = create<VenueStore>()((set, get) => {
  const irAlPaso = (historyIndex: number) =>
    set((state) => {
      if (historyIndex < 0 || historyIndex >= state.history.length) return state;
      const { elements, elementIds } = clonar(state.history[historyIndex]);
      return { elements, elementIds, historyIndex, selectedIds: [] };
    });

  return {
    elements: {},
    elementIds: [],
    selectedIds: [],
    viewState: DEFAULT_VIEW,
    gridConfig: DEFAULT_GRID,
    venueName: 'Nuevo Recinto',
    currentTool: 'select',
    sectorLabels: false,
    backgroundImage: null,
    canvasSize: { width: 1000, height: 800 },
    hasMeasuredCanvas: false,
    pendingFit: false,

    history: [],
    historyIndex: -1,

    addElement: (element) => get().addElements([element]),

    addElements: (newElements) => {
      set((state) => {
        const elements = { ...state.elements };
        const elementIds = [...state.elementIds];
        const presentes = new Set(state.elementIds);
        for (const el of newElements) {
          elements[el.id] = el;
          if (!presentes.has(el.id)) {
            presentes.add(el.id);
            elementIds.push(el.id);
          }
        }
        return { elements, elementIds };
      });
      get().saveHistory();
    },

    applyTemplate: (nuevos) => {
      get().addElements(nuevos);
      get().fitToContent();
    },

    updateElement: (id, updates) => {
      set((state) => {
        const element = state.elements[id];
        if (!element) return state;
        return {
          elements: { ...state.elements, [id]: { ...element, ...updates } as VenueElement },
        };
      });
    },

    placeElement: (id, cambio) => {
      const el = get().elements[id];
      if (!el) return;
      if (el.type === 'seat') {
        get().updateElement(id, cambio);
        return;
      }
      get().transformSector(id, {
        x: cambio.x ?? el.x,
        y: cambio.y ?? el.y,
        rotation: cambio.rotation ?? el.rotation,
        scaleX: 1,
        scaleY: 1,
      }, false);
    },

    deleteElements: (ids) => {
      set((state) => {
        // Un sector se lleva sus asientos: huérfanos, el serializador los
        // agruparía en un sector «General» inventado.
        const aBorrar = new Set(ids);
        for (const id of state.elementIds) {
          const el = state.elements[id];
          if (el?.type === 'seat' && el.sectionId && aBorrar.has(el.sectionId)) {
            aBorrar.add(id);
          }
        }

        const elements = { ...state.elements };
        aBorrar.forEach((id) => delete elements[id]);
        return {
          elements,
          elementIds: state.elementIds.filter((id) => !aBorrar.has(id)),
          selectedIds: state.selectedIds.filter((id) => !aBorrar.has(id)),
        };
      });
      get().saveHistory();
    },

    regenerateSeats: (sectorId, seats, generation) => {
      set((state) => {
        const sector = state.elements[sectorId];
        if (!sector || sector.type === 'seat') return state;

        const viejos = new Set(seatsOfSector(state.elements, state.elementIds, sectorId).map((a) => a.id));
        const elements = { ...state.elements, [sectorId]: { ...sector, generation } };
        viejos.forEach((id) => delete elements[id]);
        const elementIds = state.elementIds.filter((id) => !viejos.has(id));
        for (const asiento of seats) {
          if (!elements[asiento.id]) elementIds.push(asiento.id);
          elements[asiento.id] = asiento;
        }
        return {
          elements,
          elementIds,
          selectedIds: state.selectedIds.filter((id) => !viejos.has(id)),
        };
      });
      get().saveHistory();
    },

    duplicateSectors: (sectorIds, options) => {
      const { elements, elementIds } = get();
      const nuevos = calcularDuplicados(elements, elementIds, sectorIds, options);
      if (nuevos.length === 0) return;

      get().addElements(nuevos);
      set({ selectedIds: nuevos.filter((el) => el.type !== 'seat').map((el) => el.id) });
    },

    moveSector: (id, x, y, guardarHistorial = true) => {
      const sector = get().elements[id];
      if (!sector || sector.type === 'seat') return;
      aplicarMovimientos(get, set, { [id]: { x, y } }, guardarHistorial);
    },

    transformSector: (id, cambio, guardarHistorial = true) => {
      set((state) => {
        const sector = state.elements[id];
        if (!sector || sector.type === 'seat') return state;

        const elements = {
          ...state.elements,
          [id]: { ...sector, x: cambio.x, y: cambio.y, rotation: cambio.rotation },
        };
        for (const asiento of seatsOfSector(state.elements, state.elementIds, id)) {
          elements[asiento.id] = transformarAsiento(asiento, sector as ShapeElement, cambio);
        }
        return { elements };
      });
      if (guardarHistorial) get().saveHistory();
    },

    nudgeSelection: (dx, dy) => {
      const { elements, selectedIds } = get();
      const movimientos: Movimientos = {};
      for (const id of selectedIds) {
        const el = elements[id];
        if (!el || el.locked) continue;
        movimientos[id] = { x: el.x + dx, y: el.y + dy };
      }
      aplicarMovimientos(get, set, movimientos, false);
    },

    selectElements: (ids) => set({ selectedIds: ids }),
    clearSelection: () => set({ selectedIds: [] }),

    alignSelection: (mode) => {
      const { elements, selectedIds } = get();
      aplicarMovimientos(get, set, alignElements(elements, selectedIds, mode));
    },

    distributeSelection: (axis) => {
      const { elements, selectedIds } = get();
      aplicarMovimientos(get, set, distributeElements(elements, selectedIds, axis));
    },

    setViewState: (updates) =>
      set((state) => ({ viewState: { ...state.viewState, ...updates } })),

    setCanvasSize: (width, height) => {
      const { pendingFit, canvasSize, hasMeasuredCanvas } = get();
      // La misma medida no notifica: cada aviso re-renderiza todo el editor.
      if (hasMeasuredCanvas && !pendingFit && canvasSize.width === width && canvasSize.height === height) return;
      set({ canvasSize: { width, height }, hasMeasuredCanvas: true, pendingFit: false });
      if (pendingFit) get().fitToContent();
    },

    fitToContent: () => {
      const { elements, elementIds, canvasSize } = get();
      const caja = calculateBounds(elements, elementIds);
      if (!caja) return;
      set({ viewState: fitView(caja, canvasSize.width, canvasSize.height) });
    },

    setGridConfig: (updates) =>
      set((state) => ({ gridConfig: { ...state.gridConfig, ...updates } })),
    setTool: (tool) => set({ currentTool: tool }),
    setSectorLabels: (sectorLabels) => set({ sectorLabels }),
    setVenueName: (name) => set({ venueName: name }),

    setBackgroundImage: (image) => set({ backgroundImage: image }),
    removeBackgroundImage: () => set({ backgroundImage: null }),
    updateBackgroundOpacity: (opacity) =>
      set((state) =>
        state.backgroundImage
          ? { backgroundImage: { ...state.backgroundImage, opacity } }
          : state
      ),

    loadMap: (map) => {
      const { elements, elementIds, name, backgroundImage } = deserializeVenue(map);
      set({
        elements,
        elementIds,
        venueName: name,
        backgroundImage,
        selectedIds: [],
        history: [],
        historyIndex: -1,
      });
      // VenueEditor carga el mapa y EditorCanvas mide el lienzo sin orden
      // garantizado entre sí: si todavía no hay medida, setCanvasSize encuadra.
      if (get().hasMeasuredCanvas) {
        get().fitToContent();
      } else {
        set({ pendingFit: true });
      }
      get().saveHistory();
    },

    reset: () =>
      set({
        elements: {},
        elementIds: [],
        selectedIds: [],
        venueName: 'Nuevo Recinto',
        backgroundImage: null,
        history: [],
        historyIndex: -1,
        viewState: DEFAULT_VIEW,
        pendingFit: false,
      }),

    saveHistory: () => {
      set((state) => {
        const snapshot: HistorySnapshot = clonar({ elements: state.elements, elementIds: state.elementIds });
        const history = [...state.history.slice(0, state.historyIndex + 1), snapshot];
        if (history.length > HISTORIAL_MAXIMO) history.shift();
        return { history, historyIndex: history.length - 1 };
      });
    },

    undo: () => irAlPaso(get().historyIndex - 1),
    redo: () => irAlPaso(get().historyIndex + 1),
  };
});
