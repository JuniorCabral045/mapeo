import React from 'react';
import { EditorState, Seat, Section } from '../types/venue';

interface SidebarProps {
  state: EditorState;
  dispatch: any;
}

export const Sidebar: React.FC<SidebarProps> = ({ state, dispatch }) => {
  const selectedItems = [
    ...state.current.seats.filter(s => state.selectedIds.includes(s.id)),
    ...state.current.sections.filter(s => state.selectedIds.includes(s.id)),
  ];

  const updateProp = (id: string, prop: string, value: any, isSeat: boolean) => {
      if (isSeat) dispatch({ type: 'UPDATE_SEAT', seat: { id, [prop]: value } });
      else dispatch({ type: 'UPDATE_SECTION', section: { id, [prop]: value } });
  };

  const handleMultiUpdate = (prop: string, value: any) => {
      selectedItems.forEach(item => {
          updateProp(item.id, prop, value, 'row' in item);
      });
  };

  if (selectedItems.length === 0) {
    return (
      <div className="w-80 border-l bg-white p-6 shadow-sm overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Configuración Global</h2>
        <div className="space-y-6">
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nombre del Recinto</label>
                <input
                    type="text"
                    value={state.current.name}
                    onChange={(e) => dispatch({ type: 'SET_LAYOUT', layout: { ...state.current, name: e.target.value } })}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                />
            </div>
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Ajustar a Grilla</span>
                <input
                    type="checkbox"
                    checked={state.current.snapToGrid}
                    onChange={e => dispatch({ type: 'UPDATE_LAYOUT_PROP', prop: 'snapToGrid', value: e.target.checked })}
                    className="w-4 h-4 text-blue-600"
                />
            </div>
            {state.current.snapToGrid && (
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Tamaño Grilla (px)</label>
                    <input
                        type="number"
                        value={state.current.gridSize}
                        onChange={e => dispatch({ type: 'UPDATE_LAYOUT_PROP', prop: 'gridSize', value: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                    />
                </div>
            )}

            <div className="pt-6 border-t grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">{state.current.seats.length}</div>
                    <div className="text-xs text-blue-400 font-medium">Asientos</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">{state.current.sections.length}</div>
                    <div className="text-xs text-purple-400 font-medium">Secciones</div>
                </div>
            </div>
        </div>
      </div>
    );
  }

  const isMulti = selectedItems.length > 1;
  const item = selectedItems[0];
  const isSeat = 'row' in item;

  return (
    <div className="w-80 border-l bg-white p-6 shadow-sm overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4">
        {isMulti ? `Editando ${selectedItems.length} elementos` : (isSeat ? 'Editar Asiento' : 'Editar Elemento')}
      </h2>

      <div className="space-y-6">
        {isSeat && !isMulti && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Fila</label>
              <input
                type="text"
                value={(item as Seat).row}
                onChange={(e) => updateProp(item.id, 'row', e.target.value, true)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Número</label>
              <input
                type="text"
                value={(item as Seat).number}
                onChange={(e) => updateProp(item.id, 'number', e.target.value, true)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
          </div>
        )}

        {!isSeat && !isMulti && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              value={(item as Section).name}
              onChange={(e) => updateProp(item.id, 'name', e.target.value, false)}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Precio (€)</label>
                <input
                    type="number"
                    value={item.price || 0}
                    onChange={(e) => handleMultiUpdate('price', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Opacidad</label>
                <input
                    type="number" step="0.1" min="0" max="1"
                    value={item.opacity ?? 1}
                    onChange={(e) => handleMultiUpdate('opacity', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                />
            </div>
        </div>

        <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Rotación (grados)</label>
            <input
                type="range" min="0" max="360"
                value={item.rotation || 0}
                onChange={(e) => handleMultiUpdate('rotation', parseInt(e.target.value))}
                className="w-full"
            />
        </div>

        {!isSeat && (
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium text-gray-700">Sección Activa</span>
                <input
                    type="checkbox"
                    checked={(item as Section).isActive}
                    onChange={e => handleMultiUpdate('isActive', e.target.checked)}
                    className="w-4 h-4 text-blue-600"
                />
            </div>
        )}

        <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Color Principal</label>
            <div className="flex gap-2 flex-wrap">
                {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#475569'].map(color => (
                    <button
                        key={color}
                        className={`w-6 h-6 rounded-full border ${item.color === color ? 'ring-2 ring-offset-1 ring-blue-500' : 'border-gray-200'}`}
                        style={{ backgroundColor: color }}
                        onClick={() => handleMultiUpdate('color', color)}
                    />
                ))}
            </div>
        </div>

        {isSeat && (
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Estado</label>
                <select
                    value={(item as Seat).status}
                    onChange={(e) => handleMultiUpdate('status', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                >
                    <option value="available">Disponible</option>
                    <option value="occupied">Ocupado</option>
                    <option value="reserved">Reservado</option>
                    <option value="blocked">Bloqueado</option>
                </select>
            </div>
        )}

        <div className="pt-6 border-t space-y-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Bordes y Dimensiones</h3>
            {!isSeat && !isMulti && (item as Section).type === 'rectangle' && (
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Radio de Borde</label>
                    <input
                        type="number"
                        value={(item as Section).borderRadius || 0}
                        onChange={(e) => updateProp(item.id, 'borderRadius', parseInt(e.target.value), false)}
                        className="w-full px-2 py-1 border rounded text-sm"
                    />
                </div>
            )}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Color Borde</label>
                    <input type="color" value={item.borderColor || '#000000'} onChange={e => handleMultiUpdate('borderColor', e.target.value)} className="w-full h-8 p-1 rounded" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Ancho Borde</label>
                    <input type="number" value={item.borderWidth || 0} onChange={e => handleMultiUpdate('borderWidth', parseInt(e.target.value))} className="w-full px-2 py-1 border rounded text-sm" />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
