import React, { useState } from 'react';
import { useVenueStore } from '../store/useVenueStore';
import { CornerRadius, ShapeElement, VenueElement } from '../types/venue';
import { generateRectLayout } from '../utils/layout';
import { Circle as CircleIcon, Square, ChevronLeft } from 'lucide-react';

export const PropertyPanel: React.FC = () => {
  const { elements, selectedIds, updateElement, addElement, saveHistory } = useVenueStore();
  const selectedId = selectedIds.length === 1 ? selectedIds[0] : null;
  const element = selectedId ? elements[selectedId] : null;

  const [genRows, setGenRows] = useState(5);
  const [genCols, setGenCols] = useState(10);

  const { mode } = useVenueStore();

  if (mode === 'view') return null;

  if (!element) return (
    <div className="w-80 border-l bg-white p-6 shadow-sm overflow-y-auto font-sans">
      <h2 className="text-lg font-bold mb-6 text-gray-800">Escena</h2>
      <div className="space-y-2">
        {useVenueStore.getState().elementIds.map(id => {
            const el = useVenueStore.getState().elements[id];
            if (!el || el.parentId) return null;
            return (
                <div
                    key={id}
                    onClick={() => useVenueStore.getState().selectElements([id])}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-100"
                >
                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                        {el.type === 'seat' ? <CircleIcon size={14} /> : <Square size={14} />}
                    </div>
                    <span className="text-sm font-medium text-gray-600">{el.name}</span>
                </div>
            );
        })}
      </div>
      {useVenueStore.getState().elementIds.length === 0 && (
          <p className="text-gray-400 text-sm mt-4 text-center">No hay elementos en el lienzo.</p>
      )}
    </div>
  );

  const handleUpdate = (updates: Partial<VenueElement>) => {
    if (selectedId) updateElement(selectedId, updates);
  };

  const handleCornerRadius = (corner: keyof CornerRadius, value: number) => {
    const shape = element as ShapeElement;
    const current = shape.cornerRadius || { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 };
    const next = typeof current === 'number'
        ? { topLeft: current, topRight: current, bottomLeft: current, bottomRight: current }
        : { ...current };
    (next as any)[corner] = value;
    handleUpdate({ cornerRadius: next } as Partial<ShapeElement>);
  };

  return (
    <div className="w-80 border-l bg-white p-6 shadow-sm overflow-y-auto font-sans">
      <button
        onClick={() => useVenueStore.getState().selectElements([])}
        className="flex items-center gap-1 text-blue-600 font-bold text-xs uppercase mb-4 hover:underline"
      >
        <ChevronLeft size={14} /> Volver a Escena
      </button>
      <h2 className="text-lg font-bold mb-6 text-gray-800">Propiedades</h2>

      <div className="space-y-4">
        <section>
          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Posición y Tamaño</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-400">X</label>
              <input
                type="number"
                value={Math.round(element.x)}
                onChange={(e) => handleUpdate({ x: parseInt(e.target.value) })}
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400">Y</label>
              <input
                type="number"
                value={Math.round(element.y)}
                onChange={(e) => handleUpdate({ y: parseInt(e.target.value) })}
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
            {(element as any).width !== undefined && (
              <>
                <div>
                  <label className="text-[10px] text-gray-400">W</label>
                  <input
                    type="number"
                    value={Math.round((element as any).width)}
                    onChange={(e) => handleUpdate({ width: parseInt(e.target.value) })}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400">H</label>
                  <input
                    type="number"
                    value={Math.round((element as any).height)}
                    onChange={(e) => handleUpdate({ height: parseInt(e.target.value) })}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
              </>
            )}
          </div>
        </section>

        <section>
          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Rotación</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={Math.round(element.rotation)}
              onChange={(e) => handleUpdate({ rotation: parseInt(e.target.value) })}
              className="w-32 px-2 py-1 border rounded text-sm"
            />
            <span className="text-gray-400">°</span>
          </div>
        </section>

        {(element.type === 'section' || element.type === 'stage') && (
          <section>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Border Radius</label>
            <div className="grid grid-cols-2 gap-2">
              {(['topLeft', 'topRight', 'bottomLeft', 'bottomRight'] as const).map((corner) => (
                <div key={corner}>
                  <label className="text-[10px] text-gray-400">{corner}</label>
                  <input
                    type="number"
                    value={((element as ShapeElement).cornerRadius as CornerRadius)?.[corner] || 0}
                    onChange={(e) => handleCornerRadius(corner, parseInt(e.target.value))}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {(element.type === 'section') && (
          <section className="pt-4 border-t">
            <label className="block text-xs font-bold uppercase text-blue-600 mb-2">Generador de Asientos</label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="text-[10px] text-gray-400">Filas</label>
                <input type="number" value={genRows} onChange={e => setGenRows(parseInt(e.target.value))} className="w-full px-2 py-1 border rounded text-sm"/>
              </div>
              <div>
                <label className="text-[10px] text-gray-400">Columnas</label>
                <input type="number" value={genCols} onChange={e => setGenCols(parseInt(e.target.value))} className="w-full px-2 py-1 border rounded text-sm"/>
              </div>
            </div>
            <button
              onClick={() => {
                const seats = (element as ShapeElement).sectionType === 'rectangle'
                  ? generateRectLayout(element as ShapeElement, {
                      rows: genRows, cols: genCols, rowSpacing: 10, colSpacing: 10,
                      seatRadius: 8, startRow: 'A', startNum: 1
                    })
                  : []; // Arc generation would need more params
                seats.forEach(s => addElement(s));
                saveHistory();
              }}
              className="w-full bg-blue-50 text-blue-600 py-1.5 rounded text-xs font-bold hover:bg-blue-100 transition-colors"
            >
              Generar Cuadrícula
            </button>
          </section>
        )}

        <section>
          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Estado y Bloqueo</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={element.locked}
                onChange={e => handleUpdate({ locked: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-700 font-medium">Bloqueado</span>
            </label>
            {(element.type === 'section') && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(element as ShapeElement).isActive}
                  onChange={e => handleUpdate({ isActive: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-700 font-medium">Activa</span>
              </label>
            )}
          </div>
        </section>

        <section>
          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Apariencia</label>
          <div className="flex items-center gap-4">
            <div>
              <label className="text-[10px] text-gray-400">Color</label>
              <input
                type="color"
                value={(element as any).fill || '#3b82f6'}
                onChange={(e) => handleUpdate({ fill: e.target.value })}
                className="block w-8 h-8 border-none p-0 cursor-pointer"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-gray-400">Opacidad {Math.round(element.opacity * 100)}%</label>
              <input
                type="range" min="0" max="1" step="0.1"
                value={element.opacity}
                onChange={(e) => handleUpdate({ opacity: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
