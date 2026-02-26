import React from 'react';
import {
  MousePointer2,
  Circle as CircleIcon,
  Square,
  Trash2,
  Undo2,
  Redo2,
  Save,
  Upload,
  Eye,
  Edit3,
  Plus
} from 'lucide-react';
import { EditorState } from '../types/venue';

interface ToolbarProps {
  state: EditorState;
  dispatch: any;
  onSave: () => void;
  onLoad: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ state, dispatch, onSave, onLoad }) => {
  const tools = [
    { id: 'select', icon: MousePointer2, label: 'Seleccionar' },
    { id: 'add-seat', icon: Plus, label: 'Añadir Asiento' },
    { id: 'add-section-rect', icon: Square, label: 'Sección Rect' },
    { id: 'add-section-circle', icon: CircleIcon, label: 'Sección Circ' },
  ];

  const handleAddSeat = () => {
    const id = `seat-${Date.now()}`;
    const offset = state.current.seats.length * 25;
    dispatch({
      type: 'ADD_SEAT',
      seat: {
        id,
        x: 100 + (offset % 500),
        y: 100 + (Math.floor(offset / 500) * 25),
        row: '1',
        number: String(state.current.seats.length + 1),
        status: 'available',
        price: 50,
      }
    });
  };

  const handleAddSection = (type: 'rectangle' | 'circle') => {
    const id = `section-${Date.now()}`;
    const offset = state.current.sections.length * 40;
    dispatch({
      type: 'ADD_SECTION',
      section: {
        id,
        name: 'Nueva Sección',
        type,
        x: 150 + offset,
        y: 150 + offset,
        width: type === 'rectangle' ? 200 : undefined,
        height: type === 'rectangle' ? 150 : undefined,
        radius: type === 'circle' ? 100 : undefined,
        color: '#3b82f6',
      }
    });
  };

  return (
    <div className="h-16 border-b bg-white flex items-center justify-between px-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="flex bg-gray-100 p-1 rounded-lg mr-4">
          <button
            onClick={() => dispatch({ type: 'SET_MODE', mode: 'edit' })}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              state.mode === 'edit' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Edit3 size={16} />
            Editor
          </button>
          <button
            onClick={() => dispatch({ type: 'SET_MODE', mode: 'view' })}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              state.mode === 'view' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Eye size={16} />
            Vista
          </button>
        </div>

        {state.mode === 'edit' && (
          <>
            <div className="h-6 w-px bg-gray-200 mx-2" />
            <div className="flex gap-1">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => {
                      if (tool.id === 'add-seat') handleAddSeat();
                      else if (tool.id === 'add-section-rect') handleAddSection('rectangle');
                      else if (tool.id === 'add-section-circle') handleAddSection('circle');
                      else dispatch({ type: 'SET_TOOL', tool: tool.id as any });
                  }}
                  className={`p-2 rounded-md transition-colors ${
                    state.tool === tool.id ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title={tool.label}
                >
                  <tool.icon size={20} />
                </button>
              ))}
            </div>
            <div className="h-6 w-px bg-gray-200 mx-2" />
            <div className="flex gap-1">
              <button
                onClick={() => dispatch({ type: 'UNDO' })}
                disabled={state.historyIndex < 0}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-md disabled:opacity-30"
                title="Deshacer"
              >
                <Undo2 size={20} />
              </button>
              <button
                onClick={() => dispatch({ type: 'REDO' })}
                disabled={state.historyIndex >= state.history.length - 1}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-md disabled:opacity-30"
                title="Rehacer"
              >
                <Redo2 size={20} />
              </button>
              <button
                onClick={() => dispatch({ type: 'DELETE_SELECTED' })}
                disabled={state.selectedIds.length === 0}
                className="p-2 text-red-600 hover:bg-red-50 rounded-md disabled:opacity-30"
                title="Eliminar seleccionado"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
            onClick={onLoad}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md"
        >
          <Upload size={18} />
          Importar JSON
        </button>
        <button
            onClick={onSave}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-md shadow-sm"
        >
          <Save size={18} />
          Exportar JSON
        </button>
      </div>
    </div>
  );
};
