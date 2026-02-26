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

  if (selectedItems.length === 0) {
    return (
      <div className="w-80 border-l bg-white p-6 shadow-sm overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Propiedades</h2>
        <p className="text-gray-500 text-sm italic">Selecciona un asiento o sección para editar sus propiedades.</p>

        <div className="mt-8">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Información del Recinto</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Nombre del Recinto</label>
                    <input
                        type="text"
                        value={state.current.name}
                        onChange={(e) => dispatch({ type: 'SET_LAYOUT', layout: { ...state.current, name: e.target.value } })}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
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
      </div>
    );
  }

  const isMulti = selectedItems.length > 1;
  const item = selectedItems[0];
  const isSeat = 'row' in item;

  return (
    <div className="w-80 border-l bg-white p-6 shadow-sm overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4">
        {isMulti ? `Editando ${selectedItems.length} elementos` : (isSeat ? 'Editar Asiento' : 'Editar Sección')}
      </h2>

      <div className="space-y-6">
        {isSeat && !isMulti && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Fila</label>
                <input
                  type="text"
                  value={(item as Seat).row}
                  onChange={(e) => dispatch({ type: 'UPDATE_SEAT', seat: { ...item as Seat, row: e.target.value } })}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Número</label>
                <input
                  type="text"
                  value={(item as Seat).number}
                  onChange={(e) => dispatch({ type: 'UPDATE_SEAT', seat: { ...item as Seat, number: e.target.value } })}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>
            </div>
          </>
        )}

        {!isSeat && !isMulti && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nombre de Sección</label>
            <input
              type="text"
              value={(item as Section).name}
              onChange={(e) => dispatch({ type: 'UPDATE_SECTION', section: { ...item as Section, name: e.target.value } })}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Precio (€)</label>
          <input
            type="number"
            value={item.price || 0}
            onChange={(e) => {
                const price = parseFloat(e.target.value);
                selectedItems.forEach(i => {
                    if ('row' in i) dispatch({ type: 'UPDATE_SEAT', seat: { ...i as Seat, price } });
                    else dispatch({ type: 'UPDATE_SECTION', section: { ...i as Section, price } });
                });
            }}
            className="w-full px-3 py-2 border rounded-md text-sm"
          />
        </div>

        {!isSeat && !isMulti && (
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Color de Sección</label>
                <div className="flex gap-2">
                    {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map(color => (
                        <button
                            key={color}
                            className={`w-8 h-8 rounded-full border-2 ${item.color === color ? 'border-black' : 'border-transparent'}`}
                            style={{ backgroundColor: color }}
                            onClick={() => dispatch({ type: 'UPDATE_SECTION', section: { ...item as Section, color } })}
                        />
                    ))}
                    <input
                        type="color"
                        value={item.color}
                        onChange={(e) => dispatch({ type: 'UPDATE_SECTION', section: { ...item as Section, color: e.target.value } })}
                        className="w-8 h-8 p-0 border-0 rounded-full cursor-pointer"
                    />
                </div>
            </div>
        )}

        {isSeat && !isMulti && (
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Estado</label>
                <select
                    value={(item as Seat).status}
                    onChange={(e) => dispatch({ type: 'UPDATE_SEAT', seat: { ...item as Seat, status: e.target.value as any } })}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                >
                    <option value="available">Disponible</option>
                    <option value="occupied">Ocupado</option>
                    <option value="reserved">Reservado</option>
                </select>
            </div>
        )}

        <div className="pt-6 border-t">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Posición y Tamaño</h3>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-[10px] text-gray-500 uppercase">X</label>
                    <div className="text-sm font-mono">{Math.round(item.x)}px</div>
                </div>
                <div>
                    <label className="block text-[10px] text-gray-500 uppercase">Y</label>
                    <div className="text-sm font-mono">{Math.round(item.y)}px</div>
                </div>
                {!isSeat && !isMulti && (item as Section).type === 'rectangle' && (
                    <>
                        <div>
                            <label className="block text-[10px] text-gray-500 uppercase">Ancho</label>
                            <input
                                type="number"
                                value={(item as Section).width}
                                onChange={(e) => dispatch({ type: 'UPDATE_SECTION', section: { ...item as Section, width: parseInt(e.target.value) } })}
                                className="w-full px-2 py-1 border rounded text-xs"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] text-gray-500 uppercase">Alto</label>
                            <input
                                type="number"
                                value={(item as Section).height}
                                onChange={(e) => dispatch({ type: 'UPDATE_SECTION', section: { ...item as Section, height: parseInt(e.target.value) } })}
                                className="w-full px-2 py-1 border rounded text-xs"
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
