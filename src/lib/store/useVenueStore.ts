import { create } from 'zustand';
import {
  BackgroundImage,
  EditorTool,
  GridConfig,
  HistorySnapshot,
  VenueElement,
  VenueMap,
  ViewState,
} from '../types';
import { deserializeVenue } from '../schema';
import { calculateBounds, fitView } from '../utils/bounds';

interface VenueStore {
  elements: Record<string, VenueElement>;
  elementIds: string[];
  selectedIds: string[];
  viewState: ViewState;
  gridConfig: GridConfig;
  venueName: string;
  currentTool: EditorTool;
  backgroundImage: BackgroundImage | null;
  /** Tamaño del lienzo en píxeles. Lo publica EditorCanvas; lo necesita fitToContent. */
  canvasSize: { width: number; height: number };
  /** Si EditorCanvas ya publicó una medición real del lienzo al menos una vez. */
  hasMeasuredCanvas: boolean;
  /** Si loadMap pidió encuadrar pero el lienzo todavía no fue medido. */
  pendingFit: boolean;

  history: HistorySnapshot[];
  historyIndex: number;

  // Elementos
  addElement: (element: VenueElement) => void;
  addElements: (elements: VenueElement[]) => void;
  updateElement: (id: string, updates: Partial<VenueElement>) => void;
  deleteElements: (ids: string[]) => void;

  // Selección
  selectElements: (ids: string[]) => void;
  clearSelection: () => void;

  // Vista / configuración
  setViewState: (updates: Partial<ViewState>) => void;
  setCanvasSize: (width: number, height: number) => void;
  /** Encuadra todo el contenido. Sin elementos no hace nada. */
  fitToContent: () => void;
  setGridConfig: (updates: Partial<GridConfig>) => void;
  setTool: (tool: EditorTool) => void;
  setVenueName: (name: string) => void;

  // Plano de fondo (solo editor)
  setBackgroundImage: (image: BackgroundImage) => void;
  removeBackgroundImage: () => void;
  updateBackgroundOpacity: (opacity: number) => void;

  // Carga de un mapeo guardado
  loadMap: (map: VenueMap) => void;
  reset: () => void;

  // Historial
  saveHistory: () => void;
  undo: () => void;
  redo: () => void;
}

const DEFAULT_GRID: GridConfig = {
  enabled: true,
  visible: true,
  size: 20,
};

const DEFAULT_VIEW: ViewState = {
  scale: 1,
  x: 100,
  y: 100,
};

export const useVenueStore = create<VenueStore>()((set, get) => ({
  elements: {},
  elementIds: [],
  selectedIds: [],
  viewState: DEFAULT_VIEW,
  gridConfig: DEFAULT_GRID,
  venueName: 'Nuevo Recinto',
  currentTool: 'select',
  backgroundImage: null,
  canvasSize: { width: 1000, height: 800 },
  hasMeasuredCanvas: false,
  pendingFit: false,

  history: [],
  historyIndex: -1,

  addElement: (element) => {
    set((state) => ({
      elements: { ...state.elements, [element.id]: element },
      elementIds: [...state.elementIds, element.id],
    }));
    get().saveHistory();
  },

  addElements: (newElements) => {
    set((state) => {
      const elements = { ...state.elements };
      const elementIds = [...state.elementIds];
      newElements.forEach((el) => {
        elements[el.id] = el;
        if (!state.elementIds.includes(el.id)) elementIds.push(el.id);
      });
      return { elements, elementIds };
    });
    get().saveHistory();
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

  deleteElements: (ids) => {
    set((state) => {
      const elements = { ...state.elements };
      ids.forEach((id) => delete elements[id]);
      return {
        elements,
        elementIds: state.elementIds.filter((id) => !ids.includes(id)),
        selectedIds: state.selectedIds.filter((id) => !ids.includes(id)),
      };
    });
    get().saveHistory();
  },

  selectElements: (ids) => set({ selectedIds: ids }),
  clearSelection: () => set({ selectedIds: [] }),

  setViewState: (updates) =>
    set((state) => ({ viewState: { ...state.viewState, ...updates } })),

  setCanvasSize: (width, height) => {
    const { pendingFit } = get();
    set({ canvasSize: { width, height }, hasMeasuredCanvas: true, pendingFit: false });
    // Si loadMap pidió encuadrar antes de que llegara esta medición, es el momento:
    // ya tenemos el tamaño real del lienzo.
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
    // El encuadre y la medición del lienzo llegan de componentes distintos
    // (VenueEditor dispara loadMap, EditorCanvas mide su contenedor) sin ningún orden
    // garantizado entre sí: hoy funciona porque React corre los efectos de los hijos
    // antes que los del padre, pero es una garantía implícita que se rompe apenas
    // EditorCanvas se monte condicionalmente, en Suspense o en un portal. Si ya tenemos
    // una medición real, encuadramos ahora; si no, dejamos el pedido pendiente para que
    // setCanvasSize lo resuelva en cuanto la medición llegue.
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
      hasMeasuredCanvas: false,
      pendingFit: false,
    }),

  saveHistory: () => {
    set((state) => {
      const snapshot: HistorySnapshot = JSON.parse(
        JSON.stringify({ elements: state.elements, elementIds: state.elementIds })
      );
      const history = state.history.slice(0, state.historyIndex + 1);
      history.push(snapshot);
      if (history.length > 50) history.shift();
      return { history, historyIndex: history.length - 1 };
    });
  },

  undo: () => {
    set((state) => {
      if (state.historyIndex <= 0) return state;
      const historyIndex = state.historyIndex - 1;
      const snapshot = JSON.parse(JSON.stringify(state.history[historyIndex]));
      return {
        elements: snapshot.elements,
        elementIds: snapshot.elementIds,
        historyIndex,
        selectedIds: [],
      };
    });
  },

  redo: () => {
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state;
      const historyIndex = state.historyIndex + 1;
      const snapshot = JSON.parse(JSON.stringify(state.history[historyIndex]));
      return {
        elements: snapshot.elements,
        elementIds: snapshot.elementIds,
        historyIndex,
        selectedIds: [],
      };
    });
  },
}));
