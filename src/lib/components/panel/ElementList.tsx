import React, { useMemo, useState } from 'react';
import { Circle as CircleIcon, ChevronDown, Flag, LayoutGrid, Lock, Square } from 'lucide-react';
import { useVenueStore } from '../../store/useVenueStore';
import { useShallow } from 'zustand/react/shallow';
import { SeatElement, ShapeElement } from '../../types';
import { pluralizar } from '../../utils/sector';
import { alternarEnSeleccion } from '../../utils/selection';

/** Cuántas butacas se listan al desplegar un sector antes de cortar. */
const ASIENTOS_VISIBLES = 50;

/** Id ficticio del grupo que junta los asientos sin sector. */
const SIN_SECTOR = '__sin-sector__';

type Grupo = { contenedor: ShapeElement; asientos: SeatElement[] };

/**
 * Sectores y escenarios con sus butacas plegadas adentro: una fila por butaca
 * hacía inusable el panel en un recinto de veinte mil asientos. Los huérfanos
 * se juntan aparte para que no desaparezcan de la lista sin que nadie lo note.
 */
export const ElementList: React.FC = () => {
  const { elements, elementIds, selectedIds, selectElements } = useVenueStore(
    useShallow((s) => ({ elements: s.elements, elementIds: s.elementIds, selectedIds: s.selectedIds, selectElements: s.selectElements }))
  );
  const [desplegado, setDesplegado] = useState<string | null>(null);

  const grupos = useMemo(() => {
    const porId = new Map<string, Grupo>();
    const huerfanos: SeatElement[] = [];

    for (const id of elementIds) {
      const el = elements[id];
      if (el && el.type !== 'seat') porId.set(id, { contenedor: el as ShapeElement, asientos: [] });
    }
    for (const id of elementIds) {
      const el = elements[id];
      if (el?.type !== 'seat') continue;
      const grupo = el.sectionId ? porId.get(el.sectionId) : undefined;
      if (grupo) grupo.asientos.push(el as SeatElement);
      else huerfanos.push(el as SeatElement);
    }

    const lista = [...porId.values()];
    if (huerfanos.length > 0) {
      lista.push({
        contenedor: { id: SIN_SECTOR, type: 'section', name: 'Asientos sueltos', locked: false } as ShapeElement,
        asientos: huerfanos,
      });
    }
    return lista;
  }, [elements, elementIds]);

  /** Butacas dibujadas más la capacidad declarada de los sectores sin butacas. */
  const resumen = useMemo(() => {
    let sectores = 0;
    let lugares = 0;
    for (const { contenedor, asientos } of grupos) {
      if (contenedor.id !== SIN_SECTOR && contenedor.type === 'section') sectores += 1;
      lugares += asientos.length || (contenedor.capacity ?? 0);
    }
    if (sectores === 0 && lugares === 0) return 'Lienzo vacío';
    return `${sectores} ${pluralizar(sectores, 'sector', 'sectores')} · ${lugares.toLocaleString('es')} ${pluralizar(lugares, 'lugar', 'lugares')}`;
  }, [grupos]);

  const alClic = (id: string) => (e: React.MouseEvent) =>
    selectElements(alternarEnSeleccion(selectedIds, id, e.shiftKey));

  return (
    <>
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <h2 className="text-sm font-bold text-[#6F3E8F] tracking-tight uppercase flex items-center gap-2">
          <LayoutGrid size={16} className="text-[#FF6B01]" /> Elementos
        </h2>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{resumen}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
        {grupos.map(({ contenedor, asientos }) => {
          const id = contenedor.id;
          const isSelected = selectedIds.includes(id);
          const abierto = desplegado === id;

          return (
            <div key={id} className="space-y-1">
              <div
                onClick={alClic(id)}
                className={`group flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-orange-50 border-[#FF6B01]/30 text-[#FF6B01] shadow-sm translate-x-1'
                    : 'border-transparent bg-gray-50 text-gray-500 hover:bg-purple-50 hover:text-[#6F3E8F]'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                  isSelected ? 'bg-[#FF6B01] text-white shadow-md shadow-orange-500/30 scale-110' : 'bg-gray-200 text-gray-500 group-hover:bg-[#6F3E8F] group-hover:text-white'
                }`}>
                  {contenedor.type === 'stage' ? <Flag size={12} strokeWidth={3} /> : <Square size={12} strokeWidth={3} />}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-xs font-bold truncate">{contenedor.name}</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">
                    {contenedor.type === 'stage' ? 'escenario' : 'sector'}
                    {asientos.length > 0 && ` · ${asientos.length} asientos`}
                  </span>
                </div>
                {contenedor.locked && <Lock size={12} className="text-gray-400" />}
                {asientos.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDesplegado(abierto ? null : id);
                    }}
                    className="p-1 text-gray-400 hover:text-[#6F3E8F] transition-colors"
                    title={abierto ? 'Ocultar asientos' : 'Ver asientos'}
                  >
                    <ChevronDown size={14} className={`transition-transform ${abierto ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>

              {abierto && asientos.slice(0, ASIENTOS_VISIBLES).map((asiento) => (
                <div
                  key={asiento.id}
                  onClick={alClic(asiento.id)}
                  className={`ml-6 flex items-center gap-2 px-3 py-1.5 rounded-xl cursor-pointer text-[11px] font-bold transition-colors ${
                    selectedIds.includes(asiento.id)
                      ? 'bg-orange-50 text-[#FF6B01]'
                      : 'text-gray-400 hover:bg-purple-50 hover:text-[#6F3E8F]'
                  }`}
                >
                  <CircleIcon size={9} strokeWidth={3} />
                  <span className="truncate">{asiento.name}</span>
                </div>
              ))}

              {abierto && asientos.length > ASIENTOS_VISIBLES && (
                <p className="ml-6 px-3 text-[10px] font-bold uppercase tracking-widest text-gray-300">
                  y {asientos.length - ASIENTOS_VISIBLES} más — se eligen en el lienzo
                </p>
              )}
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
    </>
  );
};
