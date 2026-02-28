import React, { useState } from 'react';
import { useVenueStore } from '../store/useVenueStore';
import { CornerRadius, ShapeElement, VenueElement } from '../types/venue';
import { generateRectLayout, generateArcLayout } from '../utils/layout';
import {
  Circle as CircleIcon,
  Square,
  ChevronLeft,
  Flag,
  Lock,
  LayoutGrid,
  Sliders,
  Type,
  Palette,
  Layout,
  MousePointer2
} from 'lucide-react';

export const PropertyPanel: React.FC = () => {
  const { elements, selectedIds, updateElement, addElement, saveHistory } = useVenueStore();
  const selectedId = selectedIds.length === 1 ? selectedIds[0] : null;
  const element = selectedId ? elements[selectedId] : null;

  const [genRows, setGenRows] = useState(5);
  const [genCols, setGenCols] = useState(10);

  const { mode } = useVenueStore();

  if (mode === 'view') return null;

  if (!element) return (
    <div className="w-80 border-l bg-white flex flex-col shadow-sm overflow-hidden font-sans">
      <div className="p-6 border-b">
        <h2 className="text-lg font-bold text-gray-900 tracking-tight">Escena</h2>
        <p className="text-xs text-gray-500 mt-1">Gestiona las capas y elementos</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {useVenueStore.getState().elementIds.map(id => {
            const el = useVenueStore.getState().elements[id];
            if (!el || el.parentId) return null;
            const isSelected = selectedIds.includes(id);
            return (
                <div
                    key={id}
                    onClick={(e) => {
                        if (e.shiftKey) {
                            useVenueStore.getState().selectElements([...selectedIds, id]);
                        } else {
                            useVenueStore.getState().selectElements([id]);
                        }
                    }}
                    className={`group flex items-center gap-3 p-2 rounded-md cursor-pointer transition-all border ${
                        isSelected
                        ? 'bg-blue-50 border-blue-100 text-blue-700 shadow-sm'
                        : 'border-transparent hover:bg-gray-50 text-gray-600 hover:text-gray-900'
                    }`}
                >
                    <div className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                    }`}>
                        {el.type === 'seat' ? <CircleIcon size={10} /> : el.type === 'stage' ? <Flag size={10} /> : <Square size={10} />}
                    </div>
                    <span className="text-sm font-semibold truncate flex-1">{el.name}</span>
                    {el.locked && <Lock size={12} className="text-gray-400" />}
                </div>
            );
        })}
        {useVenueStore.getState().elementIds.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                <LayoutGrid size={48} className="mb-2" />
                <p className="text-sm">Lienzo vacío</p>
            </div>
        )}
      </div>
      <div className="p-4 bg-gray-50 border-t text-[10px] text-gray-400 uppercase font-bold tracking-widest text-center">
        {useVenueStore.getState().elementIds.length} Objetos en Total
      </div>
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
    <div className="w-80 border-l bg-white shadow-sm overflow-hidden flex flex-col font-sans">
      <div className="p-4 border-b flex items-center justify-between bg-gray-50/50">
        <button
            onClick={() => useVenueStore.getState().selectElements([])}
            className="flex items-center gap-1 text-gray-500 font-bold text-[10px] uppercase hover:text-blue-600 transition-colors"
        >
            <ChevronLeft size={14} /> Escena
        </button>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Editor</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <section>
          <div className="flex items-center gap-2 mb-4 text-gray-900">
            <Type size={16} className="text-blue-600" />
            <h2 className="text-lg font-bold tracking-tight">Propiedades</h2>
          </div>
          <div className="space-y-1">
             <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Nombre del Objeto</label>
             <input
                type="text"
                value={element.name}
                onChange={(e) => handleUpdate({ name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
             />
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <Sliders size={14} className="text-blue-600" />
            <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Transformación</label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase">X</label>
              <input
                type="number"
                value={Math.round(element.x)}
                onChange={(e) => handleUpdate({ x: parseInt(e.target.value) })}
                className="w-full px-2 py-1.5 bg-gray-50 border border-gray-100 rounded text-sm font-medium focus:border-blue-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase">Y</label>
              <input
                type="number"
                value={Math.round(element.y)}
                onChange={(e) => handleUpdate({ y: parseInt(e.target.value) })}
                className="w-full px-2 py-1.5 bg-gray-50 border border-gray-100 rounded text-sm font-medium focus:border-blue-500 outline-none"
              />
            </div>
            {(element as any).width !== undefined && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-bold uppercase">W</label>
                  <input
                    type="number"
                    value={Math.round((element as any).width)}
                    onChange={(e) => handleUpdate({ width: parseInt(e.target.value) })}
                    className="w-full px-2 py-1.5 bg-gray-50 border border-gray-100 rounded text-sm font-medium focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-bold uppercase">H</label>
                  <input
                    type="number"
                    value={Math.round((element as any).height)}
                    onChange={(e) => handleUpdate({ height: parseInt(e.target.value) })}
                    className="w-full px-2 py-1.5 bg-gray-50 border border-gray-100 rounded text-sm font-medium focus:border-blue-500 outline-none"
                  />
                </div>
              </>
            )}
          </div>
          <div className="mt-4 space-y-1">
            <label className="text-[10px] text-gray-400 font-bold uppercase">Rotación</label>
            <div className="flex items-center gap-2">
                <input
                    type="range" min="0" max="360"
                    value={element.rotation}
                    onChange={(e) => handleUpdate({ rotation: parseInt(e.target.value) })}
                    className="flex-1"
                />
                <input
                    type="number"
                    value={Math.round(element.rotation)}
                    onChange={(e) => handleUpdate({ rotation: parseInt(e.target.value) })}
                    className="w-16 px-2 py-1 bg-gray-50 border border-gray-100 rounded text-xs font-bold text-center"
                />
            </div>
          </div>
        </section>

        {(element.type === 'section' || element.type === 'stage') && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Layout size={14} className="text-blue-600" />
              <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Geometría</label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(['topLeft', 'topRight', 'bottomLeft', 'bottomRight'] as const).map((corner) => (
                <div key={corner} className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-bold uppercase">{corner}</label>
                  <input
                    type="number"
                    value={((element as ShapeElement).cornerRadius as CornerRadius)?.[corner] || 0}
                    onChange={(e) => handleCornerRadius(corner, parseInt(e.target.value))}
                    className="w-full px-2 py-1.5 bg-gray-50 border border-gray-100 rounded text-xs font-medium focus:border-blue-500 outline-none"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {(element.type === 'section') && (
          <section className="p-4 bg-blue-50/50 rounded-xl border border-blue-100/50">
            <div className="flex items-center gap-2 mb-4">
                <LayoutGrid size={14} className="text-blue-600" />
                <label className="text-[10px] font-bold uppercase text-blue-600 tracking-wider">Generador</label>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="space-y-1">
                <label className="text-[10px] text-blue-400 font-bold uppercase">Filas</label>
                <input type="number" value={genRows} onChange={e => setGenRows(parseInt(e.target.value))} className="w-full px-2 py-1.5 bg-white border border-blue-100 rounded text-sm font-bold text-blue-700 focus:ring-2 focus:ring-blue-500/20 outline-none"/>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-blue-400 font-bold uppercase">Cols</label>
                <input type="number" value={genCols} onChange={e => setGenCols(parseInt(e.target.value))} className="w-full px-2 py-1.5 bg-white border border-blue-100 rounded text-sm font-bold text-blue-700 focus:ring-2 focus:ring-blue-500/20 outline-none"/>
              </div>
            </div>
            <div className="space-y-3">
                <button
                onClick={() => {
                    // Remove existing seats for this section first
                    const currentIds = useVenueStore.getState().elementIds;
                    const seatsToRemove = currentIds.filter(id => {
                        const el = useVenueStore.getState().elements[id];
                        return el.type === 'seat' && (el as any).sectionId === element.id;
                    });
                    if (seatsToRemove.length > 0) useVenueStore.getState().deleteElements(seatsToRemove);

                    const seats = (element as ShapeElement).sectionType === 'rectangle'
                    ? generateRectLayout(element as ShapeElement, {
                        rows: genRows, cols: genCols, rowSpacing: 10, colSpacing: 10,
                        seatRadius: 8, startRow: 'A', startNum: 1
                        })
                    : [];
                    seats.forEach(s => addElement(s));
                    saveHistory();
                }}
                className="w-full bg-blue-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-200"
                >
                Generar Rectangular
                </button>
                <button
                onClick={() => {
                    const currentIds = useVenueStore.getState().elementIds;
                    const seatsToRemove = currentIds.filter(id => {
                        const el = useVenueStore.getState().elements[id];
                        return el.type === 'seat' && (el as any).sectionId === element.id;
                    });
                    if (seatsToRemove.length > 0) useVenueStore.getState().deleteElements(seatsToRemove);

                    const seats = generateArcLayout(element as ShapeElement, {
                        rows: genRows, cols: genCols, rowSpacing: 15, colSpacing: 10,
                        seatRadius: 8, startRow: 'A', startNum: 1,
                        innerRadius: 200, startAngle: 180, endAngle: 360
                    });
                    seats.forEach(s => addElement(s));
                    saveHistory();
                }}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
                >
                Generar Curva (Arco)
                </button>
            </div>
          </section>
        )}

        <section>
            <div className="flex items-center gap-2 mb-4">
                <MousePointer2 size={14} className="text-blue-600" />
                <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Interacción</label>
            </div>
            <div className="space-y-3">
                <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-transparent">
                    <span className="text-xs text-gray-700 font-bold uppercase tracking-tight">Bloqueado</span>
                    <input
                        type="checkbox"
                        checked={element.locked}
                        onChange={e => handleUpdate({ locked: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                </label>
                {(element.type === 'section') && (
                <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-transparent">
                    <span className="text-xs text-gray-700 font-bold uppercase tracking-tight">Zona Activa</span>
                    <input
                        type="checkbox"
                        checked={(element as ShapeElement).isActive}
                        onChange={e => handleUpdate({ isActive: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                </label>
                )}
            </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <Palette size={14} className="text-blue-600" />
            <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Apariencia</label>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <label className="text-xs font-bold text-gray-600 uppercase">Relleno</label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-gray-400 uppercase">{(element as any).fill || '#000'}</span>
                <input
                    type="color"
                    value={(element as any).fill || '#3b82f6'}
                    onChange={(e) => handleUpdate({ fill: e.target.value })}
                    className="w-6 h-6 border-none p-0 cursor-pointer bg-transparent"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-xs font-bold text-gray-600 uppercase">Opacidad</label>
                <span className="text-xs font-bold text-blue-600">{Math.round(element.opacity * 100)}%</span>
              </div>
              <input
                type="range" min="0" max="1" step="0.1"
                value={element.opacity}
                onChange={(e) => handleUpdate({ opacity: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
