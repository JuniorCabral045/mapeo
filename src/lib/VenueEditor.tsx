import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Minus, Maximize } from 'lucide-react';
import { huboCambioConfirmado, mapaDelEditor, useVenueStore } from './store/useVenueStore';
import { useShallow } from 'zustand/react/shallow';
import { Toolbar } from './components/Toolbar';
import { PropertyPanel } from './components/PropertyPanel';
import { EditorCanvas } from './components/canvas/EditorCanvas';
import { AlignBar } from './components/AlignBar';
import { zoomAt } from './utils/bounds';
import { VenueMap } from './types';
import { resumenDeBorrado, textoAvisoDeBorrado } from './utils/sector';
import { useEditorShortcuts } from './hooks/useEditorShortcuts';

export interface VenueEditorProps {
  /** Mapeo guardado a cargar al montar el editor. */
  initialMap?: VenueMap;
  /** Se invoca al presionar GUARDAR, con el mapeo serializado listo para enviar al backend. */
  onSave?: (map: VenueMap) => void | Promise<void>;
  /** Se invoca en cada cambio confirmado (agregar/mover/eliminar elementos). */
  onChange?: (map: VenueMap) => void;
  className?: string;
}

/**
 * Editor de mapeos de recintos. Ocupa el 100% del contenedor padre
 * (darle una altura explícita, p.ej. `h-screen`).
 *
 * Nota: usa un store global — montar un solo editor por página.
 */
export const VenueEditor: React.FC<VenueEditorProps> = ({
  initialMap,
  onSave,
  onChange,
  className = '',
}) => {
  const { selectedIds, viewState, setViewState, fitToContent, elements, elementIds, deleteElements } = useVenueStore(
    useShallow((s) => ({ selectedIds: s.selectedIds, viewState: s.viewState, setViewState: s.setViewState, fitToContent: s.fitToContent, elements: s.elements, elementIds: s.elementIds, deleteElements: s.deleteElements }))
  );
  const initialLoaded = useRef(false);
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);

  const aBorrar = useMemo(
    () => resumenDeBorrado(elements, elementIds, selectedIds),
    [selectedIds, elements, elementIds]
  );

  // Lee la selección del store al invocarse: si cerrara sobre ella cambiaría de
  // identidad en cada clic y useEditorShortcuts reinstalaría su escuchador.
  const pedirBorrado = useCallback(() => {
    const { selectedIds, elements, elementIds, deleteElements } = useVenueStore.getState();
    const resumen = resumenDeBorrado(elements, elementIds, selectedIds);
    if (resumen.asientos > 0) setConfirmandoBorrado(true);
    else deleteElements(selectedIds);
  }, []);

  useEditorShortcuts(pedirBorrado);

  // El aviso cuenta la selección actual: si cambia, deja de ser cierto.
  useEffect(() => {
    setConfirmandoBorrado(false);
  }, [selectedIds]);

  useEffect(() => {
    const store = useVenueStore.getState();
    if (initialMap && !initialLoaded.current) {
      store.loadMap(initialMap);
    } else if (!initialLoaded.current) {
      store.reset();
      store.saveHistory();
    }
    initialLoaded.current = true;
  }, [initialMap]);

  useEffect(() => {
    if (!onChange) return;
    return useVenueStore.subscribe((state, prev) => {
      if (huboCambioConfirmado(state, prev)) onChange(mapaDelEditor(state));
    });
  }, [onChange]);

  const handleZoom = (delta: number) => {
    const { width, height } = useVenueStore.getState().canvasSize;
    setViewState(zoomAt(viewState, { x: width / 2, y: height / 2 }, delta));
  };

  return (
    <div className={`flex h-full w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 text-gray-700 selection:bg-orange-200/60 ${className}`}>
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden bg-[#F3F4F6] touch-none group">
        <Toolbar onSave={onSave} onDelete={pedirBorrado} />

        <div className="relative flex-1 min-h-0">
          <EditorCanvas />
          <AlignBar />

          <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-50">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col p-1">
              <button onClick={() => handleZoom(1.1)} className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-[#FF6B01] hover:bg-orange-50 transition-all rounded-lg" title="Aumentar Zoom"><Plus size={16} /></button>
              <div className="h-px bg-gray-200 mx-2" />
              <button onClick={() => handleZoom(0.9)} className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-[#FF6B01] hover:bg-orange-50 transition-all rounded-lg" title="Disminuir Zoom"><Minus size={16} /></button>
            </div>
            <button
              onClick={fitToContent}
              className="w-11 h-11 bg-white rounded-xl shadow-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#FF6B01] hover:bg-orange-50 transition-all"
              title="Encuadrar el recinto"
            >
              <Maximize size={16} />
            </button>
          </div>
        </div>

        <footer className="h-8 shrink-0 bg-white border-t border-gray-200 flex items-center justify-between px-4">
          {confirmandoBorrado ? (
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-amber-700">
                {textoAvisoDeBorrado(aBorrar)}
              </span>
              <button
                onClick={() => { deleteElements(selectedIds); setConfirmandoBorrado(false); }}
                className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-600"
              >
                Borrar
              </button>
              <button
                onClick={() => setConfirmandoBorrado(false)}
                className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <span className="text-[10px] font-bold text-gray-400">
              Selección: {selectedIds.length > 0 ? `${selectedIds.length} elementos` : 'Ninguna'}
            </span>
          )}
          <span className="text-[10px] font-bold text-[#6F3E8F]">{Math.round(viewState.scale * 100)}%</span>
        </footer>
      </main>

      <PropertyPanel />
    </div>
  );
};
