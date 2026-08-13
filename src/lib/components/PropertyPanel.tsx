import React, { useEffect, useState } from 'react';
import {
  Circle as CircleIcon,
  Square,
  ChevronLeft,
  Flag,
  Lock,
  LayoutGrid,
  Sliders,
  Palette,
  Settings2,
  Maximize2,
} from 'lucide-react';
import { useVenueStore } from '../store/useVenueStore';
import { SeatGenerationParams, ShapeElement, VenueElement } from '../types';
import { generateRectLayout, generateArcLayout, generatePolygonLayout, generateArcSectorLayout } from '../utils/layout';

const GENERACION_POR_DEFECTO: Required<SeatGenerationParams> = {
  rows: 5, cols: 10, seatRadius: 3.5, startRow: 'A', startNum: 1, numberDirection: 'ltr',
};

export const PropertyPanel: React.FC = () => {
  const { elements, elementIds, selectedIds, updateElement, selectElements } = useVenueStore();
  const selectedId = selectedIds.length === 1 ? selectedIds[0] : null;
  const element = selectedId ? elements[selectedId] : null;

  const [gen, setGen] = useState<Required<SeatGenerationParams>>(GENERACION_POR_DEFECTO);
  const [arcRadius, setArcRadius] = useState(200);
  const [arcAngle, setArcAngle] = useState(120);

  // Al cambiar de sector se muestran los parámetros con los que se generó ese
  // sector, no los del anterior.
  useEffect(() => {
    if (element?.type === 'section') {
      const generation = (element as ShapeElement).generation;
      setGen(generation ? { ...GENERACION_POR_DEFECTO, ...generation } : GENERACION_POR_DEFECTO);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  if (!element) return (
    <aside className="w-72 xl:w-96 border-l border-gray-200 bg-white flex flex-col shrink-0 shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <h2 className="text-sm font-bold text-[#6F3E8F] tracking-tight uppercase flex items-center gap-2">
          <LayoutGrid size={16} className="text-[#FF6B01]" /> Elementos
        </h2>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Total {elementIds.length} Capas</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
        {elementIds.map((id) => {
          const el = elements[id];
          if (!el) return null;
          const isSelected = selectedIds.includes(id);
          return (
            <div
              key={id}
              onClick={(e) => {
                if (e.shiftKey) selectElements([...selectedIds, id]);
                else selectElements([id]);
              }}
              className={`group flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all border ${
                isSelected
                  ? 'bg-orange-50 border-[#FF6B01]/30 text-[#FF6B01] shadow-sm translate-x-1'
                  : 'border-transparent bg-gray-50 text-gray-500 hover:bg-purple-50 hover:text-[#6F3E8F]'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                isSelected ? 'bg-[#FF6B01] text-white shadow-md shadow-orange-500/30 scale-110' : 'bg-gray-200 text-gray-500 group-hover:bg-[#6F3E8F] group-hover:text-white'
              }`}>
                {el.type === 'seat' ? <CircleIcon size={12} strokeWidth={3} /> : el.type === 'stage' ? <Flag size={12} strokeWidth={3} /> : <Square size={12} strokeWidth={3} />}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-xs font-bold truncate">{el.name}</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase">{el.type === 'seat' ? 'asiento' : el.type === 'stage' ? 'escenario' : 'sector'}</span>
              </div>
              {el.locked && <Lock size={12} className="text-gray-400" />}
            </div>
          );
        })}
        {elementIds.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center text-gray-300">
            <LayoutGrid size={48} className="mb-4" />
            <p className="text-xs font-bold uppercase tracking-widest">Lienzo Vacío</p>
          </div>
        )}
      </div>
    </aside>
  );

  const handleUpdate = (updates: Partial<VenueElement>) => {
    if (selectedId) updateElement(selectedId, updates);
  };

  const generateSeats = () => {
    // Regenerar: elimina los asientos previos del sector y crea los nuevos
    const seatsToRemove = elementIds.filter((id) => {
      const el = elements[id];
      return el?.type === 'seat' && el.sectionId === element.id;
    });
    if (seatsToRemove.length > 0) useVenueStore.getState().deleteElements(seatsToRemove);

    const shape = element as ShapeElement;
    const base = {
      rows: gen.rows, cols: gen.cols,
      rowSpacing: gen.seatRadius * 1.5, colSpacing: gen.seatRadius * 1.5,
      seatRadius: gen.seatRadius,
      startRow: (gen.startRow || 'A').toUpperCase(),
      startNum: gen.startNum,
      numberDirection: gen.numberDirection,
    };
    const seats = shape.sectionType === 'rectangle'
      ? generateRectLayout(shape, base)
      : shape.sectionType === 'polygon'
        ? generatePolygonLayout(shape, base)
        : shape.sectionType === 'arc'
          ? generateArcSectorLayout(shape, { ...base, rowSpacing: gen.seatRadius * 2 })
          : generateArcLayout(shape, {
              ...base,
              rowSpacing: gen.seatRadius * 2,
              innerRadius: arcRadius,
              startAngle: 180 - arcAngle / 2,
              endAngle: 180 + arcAngle / 2,
            });
    useVenueStore.getState().addElements(seats);
    // Queda registrado en el sector: regenerar más adelante reproduce lo mismo.
    updateElement(element.id, { generation: gen });
  };

  const inputClass = 'w-full px-4 py-2 bg-indigo-50 border border-transparent rounded-xl text-xs font-bold text-gray-800 focus:border-[#FF6B01] outline-none transition-colors';
  const labelClass = 'text-[10px] font-bold uppercase text-gray-400 tracking-widest';

  return (
    <aside className="w-72 xl:w-96 border-l border-gray-200 bg-white flex flex-col shrink-0 shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
        <button
          onClick={() => selectElements([])}
          className="flex items-center gap-2 text-gray-400 font-bold text-[10px] uppercase tracking-widest hover:text-[#FF6B01] transition-colors"
        >
          <ChevronLeft size={16} /> Todas las Capas
        </button>
        <span className="text-[10px] font-bold text-[#6F3E8F]/60 uppercase tracking-[0.2em]">Configuración</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-20">
        {/* Propiedades básicas */}
        <section>
          <div className="flex items-center gap-2 mb-4 text-[#6F3E8F]">
            <Settings2 size={16} className="text-[#FF6B01]" />
            <h2 className="text-xs font-bold uppercase tracking-widest">Propiedades</h2>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className={labelClass}>Tipo</label>
              <div className="bg-gray-100 border border-gray-200 rounded-xl px-3 py-2">
                <span className="text-xs font-bold text-[#6F3E8F] uppercase">
                  {element.type === 'seat' ? 'asiento' : element.type === 'stage' ? 'escenario' : 'sector'}
                </span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Nombre a Mostrar</label>
              <input
                type="text"
                value={element.name}
                onChange={(e) => handleUpdate({ name: e.target.value })}
                className={inputClass}
              />
            </div>
            {element.type === 'seat' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>Fila</label>
                  <input
                    type="text"
                    value={element.row}
                    onChange={(e) => handleUpdate({ row: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Número</label>
                  <input
                    type="text"
                    value={element.number}
                    onChange={(e) => handleUpdate({ number: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
            )}
            {element.type === 'section' && (element as ShapeElement).sectionType === 'arc' && (() => {
              const arc = element as ShapeElement;
              const clampArc = (updates: Partial<ShapeElement>) => {
                const inner = updates.innerRadius ?? arc.innerRadius ?? 100;
                const outer = updates.outerRadius ?? arc.outerRadius ?? 200;
                const start = updates.startAngle ?? arc.startAngle ?? 200;
                const end = updates.endAngle ?? arc.endAngle ?? 340;
                handleUpdate({
                  innerRadius: Math.max(0, Math.min(inner, outer - 10)),
                  outerRadius: Math.max(inner + 10, outer),
                  startAngle: Math.min(start, end - 5),
                  endAngle: Math.max(start + 5, end),
                });
              };
              return (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Radio interior</label>
                    <input type="number" min="0" value={Math.round(arc.innerRadius ?? 100)}
                      onChange={(e) => clampArc({ innerRadius: parseInt(e.target.value) || 0 })}
                      className={inputClass} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Radio exterior</label>
                    <input type="number" min="10" value={Math.round(arc.outerRadius ?? 200)}
                      onChange={(e) => clampArc({ outerRadius: parseInt(e.target.value) || 10 })}
                      className={inputClass} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Ángulo inicial</label>
                    <input type="number" value={Math.round(arc.startAngle ?? 200)}
                      onChange={(e) => clampArc({ startAngle: parseInt(e.target.value) || 0 })}
                      className={inputClass} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Ángulo final</label>
                    <input type="number" value={Math.round(arc.endAngle ?? 340)}
                      onChange={(e) => clampArc({ endAngle: parseInt(e.target.value) || 0 })}
                      className={inputClass} />
                  </div>
                </div>
              );
            })()}
            {element.type === 'section' && (() => {
              const seatCount = elementIds.filter((sid) => {
                const s = elements[sid];
                return s?.type === 'seat' && s.sectionId === element.id;
              }).length;
              return seatCount > 0 ? (
                <div className="space-y-1.5">
                  <label className={labelClass}>Capacidad</label>
                  <div className="bg-gray-100 border border-gray-200 rounded-xl px-3 py-2">
                    <span className="text-xs font-bold text-[#6F3E8F]">
                      {seatCount} asientos (calculada)
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className={labelClass}>Capacidad (sin asientos)</label>
                  <input
                    type="number"
                    min="0"
                    value={(element as ShapeElement).capacity ?? ''}
                    onChange={(e) => handleUpdate({ capacity: e.target.value === '' ? undefined : Math.max(0, parseInt(e.target.value) || 0) })}
                    className={inputClass}
                    placeholder="Ej: 500"
                  />
                </div>
              );
            })()}
          </div>
        </section>

        {/* Generador de asientos */}
        {element.type === 'section' && (
          <section className="bg-purple-50 rounded-3xl border border-purple-100 p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-xl bg-[#6F3E8F]/10 flex items-center justify-center text-[#6F3E8F]">
                <LayoutGrid size={16} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#6F3E8F] uppercase tracking-widest leading-none mb-1">Generador de Distribución</h3>
                <p className="text-[9px] text-[#6F3E8F]/60 font-bold">Auto-generar patrones de asientos</p>
              </div>
            </div>

            <div className="space-y-6">
              {(element as ShapeElement).sectionType === 'circle' && (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className={labelClass}>Radio / Curvatura</label>
                    <span className="text-[10px] font-bold text-[#FF6B01]">{arcRadius}m</span>
                  </div>
                  <input type="range" min="50" max="1000" value={arcRadius} onChange={(e) => setArcRadius(parseInt(e.target.value))} className="w-full h-1.5 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-[#FF6B01]" />

                  <div className="flex justify-between pt-2">
                    <label className={labelClass}>Ángulo del Arco</label>
                    <span className="text-[10px] font-bold text-[#FF6B01]">{arcAngle}°</span>
                  </div>
                  <input type="range" min="30" max="360" value={arcAngle} onChange={(e) => setArcAngle(parseInt(e.target.value))} className="w-full h-1.5 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-[#FF6B01]" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>Filas</label>
                  <input type="number" min="1" value={gen.rows}
                    onChange={(e) => setGen({ ...gen, rows: Math.max(1, parseInt(e.target.value) || 1) })}
                    className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Asientos por Fila</label>
                  <input type="number" min="1" value={gen.cols}
                    onChange={(e) => setGen({ ...gen, cols: Math.max(1, parseInt(e.target.value) || 1) })}
                    className={inputClass} />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className={labelClass}>Tamaño de Asiento</label>
                  <span className="text-[10px] font-bold text-[#FF6B01]">{gen.seatRadius}px</span>
                </div>
                <input type="range" min="2" max="15" step="0.5" value={gen.seatRadius}
                  onChange={(e) => setGen({ ...gen, seatRadius: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-[#FF6B01]" />
              </div>

              {/* Numeración */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>Fila inicial</label>
                  <input
                    type="text"
                    maxLength={1}
                    value={gen.startRow}
                    onChange={(e) => setGen({ ...gen, startRow: e.target.value.toUpperCase().replace(/[^A-Z]/g, '') })}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Número inicial</label>
                  <input
                    type="number"
                    min="1"
                    value={gen.startNum}
                    onChange={(e) => setGen({ ...gen, startNum: Math.max(1, parseInt(e.target.value) || 1) })}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Dirección de numeración</label>
                <select
                  value={gen.numberDirection}
                  onChange={(e) => setGen({ ...gen, numberDirection: e.target.value as 'ltr' | 'rtl' })}
                  className={inputClass}
                >
                  <option value="ltr">Izquierda → Derecha</option>
                  <option value="rtl">Derecha → Izquierda</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  onClick={generateSeats}
                  className="w-full bg-[#FF6B01] hover:bg-[#e86000] text-white py-3 rounded-2xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 group"
                >
                  GENERAR DISTRIBUCIÓN <Maximize2 size={14} className="group-hover:scale-110 transition-transform" />
                </button>
              </div>

              {(element as ShapeElement).generation && (
                <p className="text-[9px] text-[#6F3E8F]/60 font-bold text-center pt-2">
                  Generado {(element as ShapeElement).generation!.rows} × {(element as ShapeElement).generation!.cols},
                  desde {(element as ShapeElement).generation!.startRow}{(element as ShapeElement).generation!.startNum}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Apariencia */}
        {element.type !== 'seat' && (
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-[#6F3E8F]">
              <Palette size={16} className="text-[#FF6B01]" />
              <h2 className="text-xs font-bold uppercase tracking-widest">Apariencia</h2>
            </div>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-gray-400">Color del Elemento</span>
                <input
                  type="color"
                  value={(element as ShapeElement).fill || '#6F3E8F'}
                  onChange={(e) => handleUpdate({ fill: e.target.value })}
                  className="w-10 h-6 border-none p-0 cursor-pointer bg-transparent rounded overflow-hidden"
                />
              </div>
            </div>
          </section>
        )}

        {/* Transformación */}
        <section>
          <div className="flex items-center gap-2 mb-4 text-[#6F3E8F]">
            <Sliders size={16} className="text-[#FF6B01]" />
            <h2 className="text-xs font-bold uppercase tracking-widest">Transformación</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'POS X', value: element.x, key: 'x' },
              { label: 'POS Y', value: element.y, key: 'y' },
              // Arcos y círculos se dimensionan por radios, no por ancho/alto
              ...(!['arc', 'circle'].includes((element as ShapeElement).sectionType ?? '') ? [
                { label: 'ANCHO', value: (element as ShapeElement).width, key: 'width' },
                { label: 'ALTO', value: (element as ShapeElement).height, key: 'height' },
              ] : []),
            ].map((prop) => prop.value !== undefined && (
              <div key={prop.key} className="space-y-1.5">
                <label className={labelClass}>{prop.label}</label>
                <input
                  type="number"
                  value={Math.round(prop.value)}
                  onChange={(e) => handleUpdate({ [prop.key]: parseInt(e.target.value) || 0 })}
                  className={inputClass}
                />
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-3">
            <div className="flex justify-between items-center">
              <label className={labelClass}>Rotación</label>
              <span className="text-xs font-bold text-[#6F3E8F]">{Math.round(element.rotation)}°</span>
            </div>
            <input
              type="range" min="0" max="360"
              value={element.rotation}
              onChange={(e) => handleUpdate({ rotation: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#FF6B01]"
            />
          </div>
        </section>

        {/* Interacción */}
        <section>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleUpdate({ locked: !element.locked })}
              className={`flex items-center justify-center gap-2 px-3 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
                element.locked ? 'bg-amber-50 border-amber-300 text-amber-600 shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              <Lock size={14} strokeWidth={3} /> {element.locked ? 'Bloqueado' : 'Desbloqueado'}
            </button>
            {element.type === 'section' && (
              <button
                onClick={() => handleUpdate({ isActive: !(element as ShapeElement).isActive })}
                className={`flex items-center justify-center gap-2 px-3 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
                  (element as ShapeElement).isActive ? 'bg-orange-50 border-[#FF6B01]/30 text-[#FF6B01] shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100 opacity-70'
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
