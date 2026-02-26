import { useReducer } from 'react';
import { VenueLayout, EditorState, Seat, Section } from '../types/venue';

type Action =
  | { type: 'SET_LAYOUT'; layout: VenueLayout }
  | { type: 'UPDATE_SEAT'; seat: Partial<Seat> & { id: string } }
  | { type: 'UPDATE_SECTION'; section: Partial<Section> & { id: string } }
  | { type: 'ADD_SEAT'; seat: Seat }
  | { type: 'ADD_SECTION'; section: Section }
  | { type: 'ADD_SEATS'; seats: Seat[] }
  | { type: 'DELETE_SELECTED' }
  | { type: 'SELECT_ITEMS'; ids: string[] }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SET_MODE'; mode: 'edit' | 'view' }
  | { type: 'SET_TOOL'; tool: EditorState['tool'] }
  | { type: 'MOVE_ITEMS'; dx: number; dy: number; ids: string[] }
  | { type: 'UPDATE_LAYOUT_PROP'; prop: keyof VenueLayout; value: any };

const initialState: EditorState = {
  history: [],
  historyIndex: -1,
  current: {
    id: 'venue-1',
    name: 'Nuevo Recinto',
    seats: [],
    sections: [],
    gridSize: 20,
    snapToGrid: true,
  },
  selectedIds: [],
  mode: 'edit',
  tool: 'select',
};

function reducer(state: EditorState, action: Action): EditorState {
  const saveHistory = (newLayout: VenueLayout) => {
    if (JSON.stringify(newLayout) === JSON.stringify(state.current)) {
        return state;
    }
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(state.current);
    return {
      ...state,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      current: newLayout,
    };
  };

  switch (action.type) {
    case 'SET_LAYOUT':
      return { ...state, current: action.layout, history: [], historyIndex: -1 };

    case 'UPDATE_SEAT': {
      const newLayout = {
        ...state.current,
        seats: state.current.seats.map(s => s.id === action.seat.id ? { ...s, ...action.seat } : s),
      };
      return saveHistory(newLayout);
    }

    case 'UPDATE_SECTION': {
        const newLayout = {
          ...state.current,
          sections: state.current.sections.map(s => s.id === action.section.id ? { ...s, ...action.section } : s),
        };
        return saveHistory(newLayout);
    }

    case 'ADD_SEAT': {
      const newLayout = {
        ...state.current,
        seats: [...state.current.seats, action.seat],
      };
      return saveHistory(newLayout);
    }

    case 'ADD_SEATS': {
        const newLayout = {
          ...state.current,
          seats: [...state.current.seats, ...action.seats],
        };
        return saveHistory(newLayout);
    }

    case 'ADD_SECTION': {
        const newLayout = {
          ...state.current,
          sections: [...state.current.sections, action.section],
        };
        return saveHistory(newLayout);
    }

    case 'DELETE_SELECTED': {
      const newLayout = {
        ...state.current,
        seats: state.current.seats.filter(s => !state.selectedIds.includes(s.id)),
        sections: state.current.sections.filter(s => !state.selectedIds.includes(s.id)),
      };
      return { ...saveHistory(newLayout), selectedIds: [] };
    }

    case 'SELECT_ITEMS':
      return { ...state, selectedIds: action.ids };

    case 'MOVE_ITEMS': {
      const newLayout = {
        ...state.current,
        seats: state.current.seats.map(s =>
          action.ids.includes(s.id) ? { ...s, x: s.x + action.dx, y: s.y + action.dy } : s
        ),
        sections: state.current.sections.map(s =>
          action.ids.includes(s.id) ? { ...s, x: s.x + action.dx, y: s.y + action.dy } : s
        ),
      };

      const sectionIds = state.current.sections
        .filter(s => action.ids.includes(s.id))
        .map(s => s.id);

      if (sectionIds.length > 0) {
          newLayout.seats = newLayout.seats.map(s =>
            (s.sectionId && sectionIds.includes(s.sectionId) && !action.ids.includes(s.id))
            ? { ...s, x: s.x + action.dx, y: s.y + action.dy }
            : s
          );
      }

      return saveHistory(newLayout);
    }

    case 'UNDO': {
      if (state.historyIndex < 0) return state;
      const prevLayout = state.history[state.historyIndex];
      const newHistory = [...state.history];
      newHistory[state.historyIndex + 1] = state.current;
      return {
        ...state,
        current: prevLayout,
        historyIndex: state.historyIndex - 1,
      };
    }

    case 'REDO': {
      if (state.historyIndex + 1 >= state.history.length - 1) return state;
      const nextLayout = state.history[state.historyIndex + 2];
      if (!nextLayout) return state;
      return {
        ...state,
        current: nextLayout,
        historyIndex: state.historyIndex + 1,
      };
    }

    case 'SET_MODE':
      return { ...state, mode: action.mode, selectedIds: [] };

    case 'SET_TOOL':
      return { ...state, tool: action.tool };

    case 'UPDATE_LAYOUT_PROP':
      return saveHistory({ ...state.current, [action.prop]: action.value });

    default:
      return state;
  }
}

export function useVenueStore() {
  const [state, dispatch] = useReducer(reducer, initialState);

  return { state, dispatch };
}
