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
  Plus,
  Grid3X3,
  Flag
} from 'lucide-react';
import { EditorState } from '../types/venue';

interface ToolbarProps {
  state: EditorState;
  dispatch: any;
  onSave: () => void;
  onLoad: () => void;
  onOpenGridGenerator: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ state, dispatch, onSave, onLoad, onOpenGridGenerator }) => {
  const tools = [
    { id: 'select', icon: MousePointer2, label: 'Seleccionar' },
    { id: 'add-seat', icon: Plus, label: 'Añadir Asiento' },
    { id: 'add-section-rect', icon: Square, label: 'Sección Rect' },
    { id: 'add-section-circle', icon: CircleIcon, label: 'Sección Circ' },
    { id: 'add-stage', icon: Flag, label: 'Añadir Escenario' },
  ];

  const handleAddSeat = () => {
    const id = `seat-${Date.now()}`;
    dispatch({
      type: 'ADD_SEAT',
      seat: {
        id,
        x: 100,
        y: 100,
        row: '1',
        number: '1',
        status: 'available',
        price: 50,
        radius: 8,
        opacity: 1,
      }
    });
  };

  const handleAddSection = (type: 'rectangle' | 'circle' | 'stage') => {
    const id = `section-${Date.now()}`;
    dispatch({
      type: 'ADD_SECTION',
      section: {
        id,
        name: type === 'stage' ? 'Escenario' : 'Nueva Sección',
        type: type === 'stage' ? 'stage' : type,
        x: 150,
        y: 150,
        width: type === 'circle' ? undefined : 200,
        height: type === 'circle' ? undefined : 150,
        radius: type === 'circle' ? 100 : undefined,
        color: type === 'stage' ? '#475569' : '#3b82f6',
        isActive: true,
        opacity: type === 'stage' ? 1 : 0.4,
      }
    });
  };

  return (
    <div className="h-16 border-b bg-white flex items-center justify-between px-4 shadow-sm z-50">
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
                      else if (tool.id === 'add-stage') handleAddSection('stage');
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
              <button
                onClick={onOpenGridGenerator}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
                title="Generador de Grilla"
              >
                <Grid3X3 size={20} />
              </button>
            </div>
            <div className="h-6 w-px bg-gray-200 mx-2" />
            <div className="flex gap-1">
              <button
                onClick={() => dispatch({ type: 'UNDO' })}
                disabled={state.historyIndex < 0}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-md disabled:opacity-30"
              >
                <Undo2 size={20} />
              </button>
              <button
                onClick={() => dispatch({ type: 'REDO' })}
                disabled={state.historyIndex >= state.history.length - 1}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-md disabled:opacity-30"
              >
                <Redo2 size={20} />
              </button>
              <button
                onClick={() => dispatch({ type: 'DELETE_SELECTED' })}
                disabled={state.selectedIds.length === 0}
                className="p-2 text-red-600 hover:bg-red-50 rounded-md disabled:opacity-30"
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
          Importar
        </button>
        <button
            onClick={onSave}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-md shadow-sm"
        >
          <Save size={18} />
          Guardar
        </button>
      </div>
    </div>
  );
};
