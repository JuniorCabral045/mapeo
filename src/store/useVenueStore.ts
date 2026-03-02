import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import RBush from 'rbush';
import { 
  VenueElement, 
  VenueState, 
  ViewState, 
  GridConfig, 
  SeatStatus,
  SeatState
} from '../types/venue';
import { InternalBBox } from '../utils/snapping';

interface VenueStore extends VenueState {
  // Actions
  addElement: (element: VenueElement) => void;
  addElements: (elements: VenueElement[]) => void;
  updateElement: (id: string, updates: Partial<VenueElement>) => void;
  moveElements: (ids: string[], dx: number, dy: number) => void;
  deleteElements: (ids: string[]) => void;
  
  selectElements: (ids: string[], toggle?: boolean) => void;
  clearSelection: () => void;
  
  setViewState: (updates: Partial<ViewState>) => void;
  setGridConfig: (updates: Partial<GridConfig>) => void;
  setMode: (mode: 'edit' | 'view') => void;
  setTool: (tool: 'select' | 'pan') => void;
  setLiveState: (updates: Record<string, SeatState>) => void;
  updateSeatStatus: (id: string, status: SeatStatus) => void;
  
  // History
  saveHistory: () => void;
  undo: () => void;
  redo: () => void;
  
  // Clipboard
  copy: () => void;
  paste: (atMouse?: { x: number, y: number }) => void;
  
  // Spatial Index
  spatialIndex: RBush<InternalBBox>;
  rebuildIndex: () => void;
  
  setState: (state: Partial<VenueStore>) => void;

  // Hierarchy
  group: (ids: string[]) => void;
  ungroup: (groupId: string) => void;
  
  // Selection/Interaction helper
  isDragging: boolean;
  setDragging: (dragging: boolean) => void;
}

const DEFAULT_GRID: GridConfig = {
  enabled: true,
  visible: true,
  size: 20,
  snapToElements: true,
};

const DEFAULT_VIEW: ViewState = {
  scale: 1,
  x: 0,
  y: 0,
};

export const useVenueStore = create<VenueStore>()(
  subscribeWithSelector((set, get) => ({
    mode: 'edit',
    currentTool: 'select',
    elements: {},
    elementIds: [],
    selectedIds: [],
    viewState: DEFAULT_VIEW,
    gridConfig: DEFAULT_GRID,
    venueName: 'Nuevo Recinto',
    liveState: {},
    
    history: [],
    historyIndex: -1,
    clipboard: null,
    
    spatialIndex: new RBush<InternalBBox>(),
    isDragging: false,

    addElement: (element) => {
      set((state) => {
        const newElements = { ...state.elements, [element.id]: element };
        const newIds = [...state.elementIds, element.id];
        return { elements: newElements, elementIds: newIds };
      });
      get().rebuildIndex();
      get().saveHistory();
    },

    addElements: (newElementsArray) => {
      set((state) => {
        const nextElements = { ...state.elements };
        const nextIds = [...state.elementIds];
        newElementsArray.forEach(el => {
          nextElements[el.id] = el;
          if (!state.elementIds.includes(el.id)) {
            nextIds.push(el.id);
          }
        });
        return { elements: nextElements, elementIds: nextIds };
      });
      get().rebuildIndex();
      get().saveHistory();
    },

    updateElement: (id, updates) => {
      set((state) => {
        const element = state.elements[id];
        if (!element) return state;
        const updated = { ...element, ...updates } as VenueElement;
        return {
          elements: { ...state.elements, [id]: updated }
        };
      });
      
      // If position/size changed, rebuild index
      if ('x' in updates || 'y' in updates || 'width' in updates || 'height' in updates || 'radius' in updates) {
        get().rebuildIndex();
      }
    },

    moveElements: (ids, dx, dy) => {
      set((state) => {
        const newElements = { ...state.elements };
        ids.forEach(id => {
          if (newElements[id]) {
            newElements[id] = {
              ...newElements[id],
              x: newElements[id].x + dx,
              y: newElements[id].y + dy
            };
          }
        });
        return { elements: newElements };
      });
    },

    deleteElements: (ids) => {
      set((state) => {
        const newElements = { ...state.elements };
        ids.forEach(id => delete newElements[id]);
        const newIds = state.elementIds.filter(id => !ids.includes(id));
        const newSelected = state.selectedIds.filter(id => !ids.includes(id));
        return { elements: newElements, elementIds: newIds, selectedIds: newSelected };
      });
      get().rebuildIndex();
      get().saveHistory();
    },

    selectElements: (ids, toggle = false) => {
      set((state) => {
        if (toggle) {
          const current = new Set(state.selectedIds);
          ids.forEach(id => {
            if (current.has(id)) current.delete(id);
            else current.add(id);
          });
          return { selectedIds: Array.from(current) };
        }
        return { selectedIds: ids };
      });
    },

    clearSelection: () => set({ selectedIds: [] }),

    setViewState: (updates) => set((state) => ({ viewState: { ...state.viewState, ...updates } })),
    
    setGridConfig: (updates) => set((state) => ({ gridConfig: { ...state.gridConfig, ...updates } })),
    
    setMode: (mode) => set({ mode, selectedIds: [] }),

    setTool: (tool) => set({ currentTool: tool }),

    setLiveState: (liveState) => set({ liveState }),

    updateSeatStatus: (id, status) => set(state => ({
      liveState: {
        ...state.liveState,
        [id]: { ...state.liveState[id], status }
      }
    })),

    saveHistory: () => {
      set((state) => {
        const snapshot = JSON.parse(JSON.stringify({
          elements: state.elements,
          elementIds: state.elementIds
        }));
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(snapshot);
        if (newHistory.length > 50) newHistory.shift();
        return {
          history: newHistory,
          historyIndex: newHistory.length - 1
        };
      });
    },

    undo: () => {
      set((state) => {
        if (state.historyIndex <= 0) return state;
        const newIndex = state.historyIndex - 1;
        const snapshot = JSON.parse(JSON.stringify(state.history[newIndex]));
        return {
          elements: snapshot.elements,
          elementIds: snapshot.elementIds,
          historyIndex: newIndex,
          selectedIds: []
        };
      });
      get().rebuildIndex();
    },

    redo: () => {
      set((state) => {
        if (state.historyIndex >= state.history.length - 1) return state;
        const newIndex = state.historyIndex + 1;
        const snapshot = JSON.parse(JSON.stringify(state.history[newIndex]));
        return {
          elements: snapshot.elements,
          elementIds: snapshot.elementIds,
          historyIndex: newIndex,
          selectedIds: []
        };
      });
      get().rebuildIndex();
    },

    copy: () => {
      const { elements, selectedIds } = get();
      const selected = selectedIds.map(id => elements[id]).filter(Boolean);
      set({ clipboard: JSON.parse(JSON.stringify(selected)) });
    },

    paste: (atMouse) => {
      const { clipboard, elements, elementIds } = get();
      if (!clipboard) return;

      const newElements = { ...elements };
      const newIds = [...elementIds];
      const newSelection: string[] = [];

      clipboard.forEach(el => {
        const id = `${el.type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const pasted: VenueElement = {
          ...el,
          id,
          x: atMouse ? atMouse.x : el.x + 20,
          y: atMouse ? atMouse.y : el.y + 20,
        };
        newElements[id] = pasted;
        newIds.push(id);
        newSelection.push(id);
      });

      set({ elements: newElements, elementIds: newIds, selectedIds: newSelection });
      get().rebuildIndex();
      get().saveHistory();
    },

    rebuildIndex: () => {
      const { elements, elementIds } = get();
      const index = new RBush<InternalBBox>();
      const items: InternalBBox[] = elementIds.map(id => {
        const el = elements[id];
        const w = ('width' in el ? el.width : ('radius' in el ? (el.radius || 0) * 2 : 20));
        const h = ('height' in el ? el.height : ('radius' in el ? (el.radius || 0) * 2 : 20));
        return {
          minX: el.x,
          minY: el.y,
          maxX: el.x + w,
          maxY: el.y + h,
          id: el.id
        };
      });
      index.load(items);
      set({ spatialIndex: index });
    },

    group: (ids) => {
      if (ids.length < 2) return;
      const { elements, elementIds } = get();
      
      const groupId = `group-${Date.now()}`;
      let minX = Infinity, minY = Infinity;
      let maxZ = 0;
      ids.forEach(id => {
        const el = elements[id];
        if (el) {
            minX = Math.min(minX, el.x);
            minY = Math.min(minY, el.y);
            maxZ = Math.max(maxZ, el.zIndex);
        }
      });

      const newGroup: VenueElement = {
        id: groupId,
        type: 'group',
        name: 'Nuevo Grupo',
        x: minX,
        y: minY,
        rotation: 0,
        visible: true,
        locked: false,
        opacity: 1,
        zIndex: maxZ + 1,
        childrenIds: ids,
      };

      set((state) => {
        const nextElements = { ...state.elements, [groupId]: newGroup };
        ids.forEach(id => {
            if (nextElements[id]) nextElements[id].parentId = groupId;
        });
        return {
          elements: nextElements,
          elementIds: [...elementIds, groupId],
          selectedIds: [groupId]
        };
      });
      get().saveHistory();
    },

    ungroup: (groupId) => {
      set((state) => {
        const group = state.elements[groupId];
        if (!group || group.type !== 'group') return state;
        
        const nextElements = { ...state.elements };
        group.childrenIds.forEach(id => {
          if (nextElements[id]) nextElements[id].parentId = undefined;
        });
        delete nextElements[groupId];
        
        return {
          elements: nextElements,
          elementIds: state.elementIds.filter(id => id !== groupId),
          selectedIds: group.childrenIds
        };
      });
      get().saveHistory();
    },

    setState: (updates) => set(updates),

    setDragging: (dragging) => set({ isDragging: dragging }),
  }))
);
