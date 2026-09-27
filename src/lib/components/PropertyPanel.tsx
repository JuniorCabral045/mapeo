import React from 'react';
import { ChevronLeft, Lock, Sliders, Palette, Settings2 } from 'lucide-react';
import { useVenueStore } from '../store/useVenueStore';
import { useShallow } from 'zustand/react/shallow';
import { ShapeElement, VenueElement } from '../types';
import { seatsOfSector } from '../utils/sector';
import { ElementList } from './panel/ElementList';
import { SeatGenerator } from './panel/SeatGenerator';
import { inputClass, labelClass } from './panel/styles';

const ASIDE = 'w-72 xl:w-96 border-l border-gray-200 bg-white flex flex-col shrink-0 shadow-lg overflow-hidden';

const Campo: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className={labelClass}>{label}</label>
    {children}
  </div>
);

const Encabezado: React.FC<{ icono: React.ReactNode; titulo: string }> = ({ icono, titulo }) => (
  <div className="flex items-center gap-2 mb-4 text-[#6F3E8F]">
    {icono}
    <h2 className="text-xs font-bold uppercase tracking-widest">{titulo}</h2>
  </div>
);

const Valor: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-gray-100 border border-gray-200 rounded-xl px-3 py-2">
    <span className="text-xs font-bold text-[#6F3E8F]">{children}</span>
  </div>
);

/** Radios y ángulos de un sector curvo, sin dejar que se crucen. */
const CamposDeArco: React.FC<{ arc: ShapeElement; onChange: (u: Partial<ShapeElement>) => void }> = ({ arc, onChange }) => {
  const acotar = (updates: Partial<ShapeElement>) => {
    const inner = updates.innerRadius ?? arc.innerRadius ?? 100;
    const outer = updates.outerRadius ?? arc.outerRadius ?? 200;
    const start = updates.startAngle ?? arc.startAngle ?? 200;
    const end = updates.endAngle ?? arc.endAngle ?? 340;
    onChange({
      innerRadius: Math.max(0, Math.min(inner, outer - 10)),
      outerRadius: Math.max(inner + 10, outer),
      startAngle: Math.min(start, end - 5),
      endAngle: Math.max(start + 5, end),
    });
  };
  const campos: { label: string; key: keyof ShapeElement; valor: number; minimo: number }[] = [
    { label: 'Radio interior', key: 'innerRadius', valor: arc.innerRadius ?? 100, minimo: 0 },
    { label: 'Radio exterior', key: 'outerRadius', valor: arc.outerRadius ?? 200, minimo: 10 },
    { label: 'Ángulo inicial', key: 'startAngle', valor: arc.startAngle ?? 200, minimo: 0 },
    { label: 'Ángulo final', key: 'endAngle', valor: arc.endAngle ?? 340, minimo: 0 },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {campos.map((c) => (
        <Campo key={c.key} label={c.label}>
          <input
            type="number"
            min={c.key.endsWith('Radius') ? c.minimo : undefined}
            value={Math.round(c.valor)}
            onChange={(e) => acotar({ [c.key]: parseInt(e.target.value) || c.minimo })}
            className={inputClass}
          />
        </Campo>
      ))}
    </div>
  );
};

/**
 * Panel lateral: lista de elementos sin selección, propiedades con uno solo.
 * Los cambios no guardan historial: se disparan en cada tecla.
 */
export const PropertyPanel: React.FC = () => {
  const { elements, elementIds, selectedIds, updateElement, placeElement, selectElements } = useVenueStore(
    useShallow((s) => ({ elements: s.elements, elementIds: s.elementIds, selectedIds: s.selectedIds, updateElement: s.updateElement, placeElement: s.placeElement, selectElements: s.selectElements }))
  );
  const selectedId = selectedIds.length === 1 ? selectedIds[0] : null;
  const element = selectedId ? elements[selectedId] : null;

  if (!element) {
    return (
      <aside className={ASIDE}>
        <ElementList />
      </aside>
    );
  }

  const shape = element.type !== 'seat' ? (element as ShapeElement) : null;
  const asientos = element.type === 'section' ? seatsOfSector(elements, elementIds, element.id).length : 0;
  const handleUpdate = (updates: Partial<VenueElement>) => updateElement(element.id, updates);
  const radial = shape?.sectionType === 'arc' || shape?.sectionType === 'circle';

  return (
    <aside className={ASIDE}>
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
        <section>
          <Encabezado icono={<Settings2 size={16} className="text-[#FF6B01]" />} titulo="Propiedades" />
          <div className="space-y-4">
            <Campo label="Tipo">
              <Valor>
                <span className="uppercase">
                  {element.type === 'seat' ? 'asiento' : element.type === 'stage' ? 'escenario' : 'sector'}
                </span>
              </Valor>
            </Campo>
            <Campo label="Nombre a Mostrar">
              <input type="text" value={element.name} onChange={(e) => handleUpdate({ name: e.target.value })} className={inputClass} />
            </Campo>
            {element.type === 'seat' && (
              <div className="grid grid-cols-2 gap-4">
                <Campo label="Fila">
                  <input type="text" value={element.row} onChange={(e) => handleUpdate({ row: e.target.value })} className={inputClass} />
                </Campo>
                <Campo label="Número">
                  <input type="text" value={element.number} onChange={(e) => handleUpdate({ number: e.target.value })} className={inputClass} />
                </Campo>
              </div>
            )}
            {element.type === 'section' && shape?.sectionType === 'arc' && (
              <CamposDeArco arc={shape} onChange={handleUpdate} />
            )}
            {element.type === 'section' && (asientos > 0 ? (
              <Campo label="Capacidad">
                <Valor>{asientos} asientos (calculada)</Valor>
              </Campo>
            ) : (
              <Campo label="Capacidad (Sin asientos numerados)">
                <input
                  type="number"
                  min="0"
                  value={shape?.capacity ?? ''}
                  onChange={(e) => handleUpdate({ capacity: e.target.value === '' ? undefined : Math.max(0, parseInt(e.target.value) || 0) })}
                  className={inputClass}
                  placeholder="Ej: 500"
                />
              </Campo>
            ))}
          </div>
        </section>

        {element.type === 'section' && shape && (
          <SeatGenerator key={element.id} sector={shape} asientos={asientos} />
        )}

        {shape && (
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
                  value={shape.fill || '#6F3E8F'}
                  onChange={(e) => handleUpdate({ fill: e.target.value })}
                  className="w-10 h-6 border-none p-0 cursor-pointer bg-transparent rounded overflow-hidden"
                />
              </div>
            </div>
          </section>
        )}

        <section>
          <Encabezado icono={<Sliders size={16} className="text-[#FF6B01]" />} titulo="Transformación" />
          <div className="grid grid-cols-2 gap-4">
            <Campo label="POS X">
              <input type="number" value={Math.round(element.x)} onChange={(e) => placeElement(element.id, { x: parseInt(e.target.value) || 0 })} className={inputClass} />
            </Campo>
            <Campo label="POS Y">
              <input type="number" value={Math.round(element.y)} onChange={(e) => placeElement(element.id, { y: parseInt(e.target.value) || 0 })} className={inputClass} />
            </Campo>
            {/* Arcos y círculos se dimensionan por radios, no por ancho/alto. */}
            {shape && !radial && (
              <>
                <Campo label="ANCHO">
                  <input type="number" value={Math.round(shape.width)} onChange={(e) => handleUpdate({ width: parseInt(e.target.value) || 0 })} className={inputClass} />
                </Campo>
                <Campo label="ALTO">
                  <input type="number" value={Math.round(shape.height)} onChange={(e) => handleUpdate({ height: parseInt(e.target.value) || 0 })} className={inputClass} />
                </Campo>
              </>
            )}
          </div>
          <div className="mt-6 space-y-3">
            <div className="flex justify-between items-center">
              <label className={labelClass}>Rotación</label>
              <span className="text-xs font-bold text-[#6F3E8F]">{Math.round(element.rotation)}°</span>
            </div>
            <input
              type="range" min="0" max="360"
              value={element.rotation}
              onChange={(e) => placeElement(element.id, { rotation: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#FF6B01]"
            />
          </div>
        </section>

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
            {element.type === 'section' && shape && (
              <button
                onClick={() => handleUpdate({ isActive: !shape.isActive })}
                className={`flex items-center justify-center gap-2 px-3 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
                  shape.isActive ? 'bg-orange-50 border-[#FF6B01]/30 text-[#FF6B01] shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100 opacity-70'
                }`}
              >
                {shape.isActive ? 'Activo' : 'Inactivo'}
              </button>
            )}
          </div>
        </section>
      </div>
    </aside>
  );
};
