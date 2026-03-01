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
  MousePointer2,
  Settings2,
  DollarSign,
  Maximize2
} from 'lucide-react';

export const PropertyPanel: React.FC = () => {
  const { elements, selectedIds, updateElement, addElement, saveHistory } = useVenueStore();
  const selectedId = selectedIds.length === 1 ? selectedIds[0] : null;
  const element = selectedId ? elements[selectedId] : null;

  const [genRows, setGenRows] = useState(5);
  const [genCols, setGenCols] = useState(10);
  const [arcRadius, setArcRadius] = useState(200);
  const [arcAngle, setArcAngle] = useState(120);
  const [genSeatRadius, setGenSeatRadius] = useState(3.5);

  const { mode } = useVenueStore();

  if (mode === 'view') return null;

  if (!element) return (
    <aside className="w-96 border-l border-slate-800 bg-[#0B1220] flex flex-col shrink-0 font-sans shadow-2xl overflow-hidden">
      <div className="p-6 border-b border-slate-800 bg-slate-900/50">
        <h2 className="text-sm font-black text-white tracking-tight uppercase flex items-center gap-2">
            <LayoutGrid size={16} className="text-blue-500" /> Elementos
        </h2>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Total {useVenueStore.getState().elementIds.length} Capas</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
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
                    className={`group flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all border ${
                        isSelected
                        ? 'bg-blue-600/10 border-blue-500/30 text-blue-400 shadow-lg shadow-blue-900/20 translate-x-1'
                        : 'border-transparent bg-slate-800/20 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }`}
                >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                        isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-110' : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700'
                    }`}>
                        {el.type === 'seat' ? <CircleIcon size={12} strokeWidth={3} /> : el.type === 'stage' ? <Flag size={12} strokeWidth={3} /> : <Square size={12} strokeWidth={3} />}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-xs font-black truncate">{el.name}</span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase">{el.type === 'seat' ? 'asiento' : el.type === 'stage' ? 'escenario' : 'sector'}</span>
                    </div>
                    {el.locked && <Lock size={12} className="text-slate-600" />}
                </div>
            );
        })}
        {useVenueStore.getState().elementIds.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center opacity-20 grayscale">
                <LayoutGrid size={48} className="mb-4" />
                <p className="text-xs font-black uppercase tracking-widest">Lienzo Vacío</p>
            </div>
        )}
      </div>
    </aside>
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
    <aside className="w-96 border-l border-slate-800 bg-[#0B1220] flex flex-col shrink-0 font-sans shadow-2xl overflow-hidden animate-in slide-in-from-right-10 duration-500">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
        <button
            onClick={() => useVenueStore.getState().selectElements([])}
            className="flex items-center gap-2 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-blue-400 transition-colors"
        >
            <ChevronLeft size={16} /> Todas las Capas
        </button>
        <span className="text-[10px] font-black text-blue-500/50 uppercase tracking-[0.2em]">Configuración</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-slate-800 pb-20">
        {/* Basic Info Section */}
        <section>
          <div className="flex items-center gap-2 mb-4 text-white">
            <Settings2 size={16} className="text-blue-500" />
            <h2 className="text-xs font-black uppercase tracking-widest">Propiedades</h2>
          </div>
          <div className="space-y-4">
             <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Información de Selección</label>
                <div className="flex gap-2">
                    <div className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2">
                        <span className="text-[9px] text-slate-500 block">{element.type === 'seat' ? 'Asiento' : 'Sector'}</span>
                        <span className="text-xs font-black text-white">{element.name}</span>
                    </div>
                    <div className="w-20 bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2">
                        <span className="text-[9px] text-slate-500 block">Tipo</span>
                        <span className="text-xs font-black text-white uppercase">{element.type === 'seat' ? 'asiento' : element.type === 'stage' ? 'escenario' : 'sector'}</span>
                    </div>
                </div>
             </div>
             <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Nombre a Mostrar</label>
                <input
                    type="text"
                    value={element.name}
                    onChange={(e) => handleUpdate({ name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-xs font-black text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
                />
             </div>
          </div>
        </section>

        {/* Layout Generator Tool (Inspired by Image 1) */}
        {(element.type === 'section') && (
          <section className="bg-blue-600/5 rounded-[2rem] border border-blue-500/10 p-6 shadow-inner">
            <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500">
                    <LayoutGrid size={16} />
                </div>
                <div>
                    <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Generador de Distribución</h3>
                    <p className="text-[9px] text-blue-500/60 font-bold">Auto-generar patrones de asientos</p>
                </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Radio / Curvatura</label>
                    <span className="text-[10px] font-black text-blue-400">{arcRadius}m</span>
                </div>
                <input type="range" min="50" max="1000" value={arcRadius} onChange={e => setArcRadius(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"/>

                <div className="flex justify-between pt-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ángulo del Arco</label>
                    <span className="text-[10px] font-black text-blue-400">{arcAngle}°</span>
                </div>
                <input type="range" min="30" max="360" value={arcAngle} onChange={e => setArcAngle(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"/>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Filas</label>
                    <input type="number" value={genRows} onChange={e => setGenRows(parseInt(e.target.value))} className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-xs font-black text-white focus:border-blue-500 outline-none"/>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Asientos por Fila</label>
                    <input type="number" value={genCols} onChange={e => setGenCols(parseInt(e.target.value))} className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-xs font-black text-white focus:border-blue-500 outline-none"/>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tamaño de Asiento</label>
                    <span className="text-[10px] font-black text-blue-400">{genSeatRadius}px</span>
                </div>
                <input type="range" min="2" max="15" step="0.5" value={genSeatRadius} onChange={e => setGenSeatRadius(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"/>
              </div>

              <div className="pt-2">
                <button
                onClick={() => {
                    const currentIds = useVenueStore.getState().elementIds;
                    const seatsToRemove = currentIds.filter(id => {
                        const el = useVenueStore.getState().elements[id];
                        return el.type === 'seat' && (el as any).sectionId === element.id;
                    });
                    if (seatsToRemove.length > 0) useVenueStore.getState().deleteElements(seatsToRemove);

                    const seats = (element as ShapeElement).sectionType === 'rectangle'
                    ? generateRectLayout(element as ShapeElement, {
                        rows: genRows, cols: genCols, rowSpacing: genSeatRadius * 1.5, colSpacing: genSeatRadius * 1.5,
                        seatRadius: genSeatRadius, startRow: 'A', startNum: 1
                        })
                    : generateArcLayout(element as ShapeElement, {
                        rows: genRows, cols: genCols, rowSpacing: genSeatRadius * 2, colSpacing: genSeatRadius * 1.5,
                        seatRadius: genSeatRadius, startRow: 'A', startNum: 1,
                        innerRadius: arcRadius, startAngle: 180 - (arcAngle/2), endAngle: 180 + (arcAngle/2)
                    });
                    seats.forEach(s => addElement(s));
                    saveHistory();
                }}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-2xl text-xs font-black shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 group"
                >
                GENERAR DISTRIBUCIÓN <Maximize2 size={14} className="group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Appearance */}
        <section className="space-y-6">
            <div className="flex items-center gap-2 text-white">
                <Palette size={16} className="text-blue-500" />
                <h2 className="text-xs font-black uppercase tracking-widest">Apariencia</h2>
            </div>

            <div className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-500">Color del Elemento</span>
                    <input
                        type="color"
                        value={(element as any).fill || '#2DD4BF'}
                        onChange={(e) => handleUpdate({ fill: e.target.value })}
                        className="w-10 h-6 border-none p-0 cursor-pointer bg-transparent rounded overflow-hidden"
                    />
                </div>
            </div>
        </section>

        {/* Transformation Section */}
        <section>
          <div className="flex items-center gap-2 mb-4 text-white">
            <Sliders size={16} className="text-blue-500" />
            <h2 className="text-xs font-black uppercase tracking-widest">Transformación</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
                { label: 'POS X', value: element.x, key: 'x' },
                { label: 'POS Y', value: element.y, key: 'y' },
                { label: 'ANCHO', value: (element as any).width, key: 'width' },
                { label: 'ALTO', value: (element as any).height, key: 'height' },
            ].map(prop => prop.value !== undefined && (
                <div key={prop.key} className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{prop.label}</label>
                    <input
                        type="number"
                        value={Math.round(prop.value)}
                        onChange={(e) => handleUpdate({ [prop.key]: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-xs font-black text-white focus:border-blue-500 outline-none transition-colors"
                    />
                </div>
            ))}
          </div>
          <div className="mt-6 space-y-3">
            <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Rotación</label>
                <span className="text-xs font-black text-white">{Math.round(element.rotation)}°</span>
            </div>
            <input
                type="range" min="0" max="360"
                value={element.rotation}
                onChange={(e) => handleUpdate({ rotation: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </section>

        {/* Interaction Controls */}
        <section>
            <div className="flex items-center gap-2 mb-4 text-white">
                <MousePointer2 size={16} className="text-blue-500" />
                <h2 className="text-xs font-black uppercase tracking-widest">Interacción</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={() => handleUpdate({ locked: !element.locked })}
                    className={`flex items-center justify-center gap-2 px-3 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                        element.locked ? 'bg-amber-600/10 border-amber-500/30 text-amber-500 shadow-lg shadow-amber-900/10' : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                >
                    <Lock size={14} strokeWidth={3} /> {element.locked ? 'Bloqueado' : 'Desbloqueado'}
                </button>
                {(element.type === 'section') && (
                    <button
                        onClick={() => handleUpdate({ isActive: !(element as ShapeElement).isActive })}
                        className={`flex items-center justify-center gap-2 px-3 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                            (element as ShapeElement).isActive ? 'bg-blue-600/10 border-blue-500/30 text-blue-400 shadow-lg shadow-blue-900/10' : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-white opacity-50'
                        }`}
                    >
                        {(element as ShapeElement).isActive ? 'Activo' : 'Inactivo'}
                    </button>
                )}
            </div>
        </section>
      </div>
    </aside>
  );
};
