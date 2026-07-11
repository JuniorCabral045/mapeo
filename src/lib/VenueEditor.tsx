import React, { useEffect, useRef } from 'react';
import { Plus, Minus, Maximize } from 'lucide-react';
import { useVenueStore } from './store/useVenueStore';
import { Toolbar } from './components/Toolbar';
import { PropertyPanel } from './components/PropertyPanel';
import { EditorCanvas } from './components/canvas/EditorCanvas';
import { serializeVenue } from './schema';
import { VenueMap } from './types';

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
  const { selectedIds, viewState, setViewState } = useVenueStore();
  const initialLoaded = useRef(false);

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
    // Notificar cambios confirmados observando el historial (no cada frame de drag)
    return useVenueStore.subscribe((state, prev) => {
      if (state.historyIndex !== prev.historyIndex || state.backgroundImage !== prev.backgroundImage) {
        onChange(serializeVenue(
          state.elements,
          state.elementIds,
          state.venueName,
          undefined,
          state.backgroundImage ?? undefined
        ));
      }
    });
  }, [onChange]);

  const handleZoom = (delta: number) => {
    setViewState({ scale: Math.max(0.05, Math.min(5, viewState.scale * delta)) });
  };

  const resetZoom = () => setViewState({ scale: 1, x: 100, y: 100 });

  return (
    <div className={`flex h-full w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 text-gray-700 selection:bg-orange-200/60 ${className}`}>
      <main className="flex-1 relative bg-[#F3F4F6] touch-none group">
        <Toolbar onSave={onSave} />
        <EditorCanvas />

        {/* Controles de zoom */}
        <div className="absolute bottom-12 right-6 flex flex-col gap-3 z-50">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col p-1">
            <button onClick={() => handleZoom(1.1)} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-[#FF6B01] hover:bg-orange-50 transition-all rounded-lg" title="Aumentar Zoom"><Plus size={18} /></button>
            <div className="h-px bg-gray-200 mx-2" />
            <button onClick={() => handleZoom(0.9)} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-[#FF6B01] hover:bg-orange-50 transition-all rounded-lg" title="Disminuir Zoom"><Minus size={18} /></button>
          </div>
          <button
            onClick={resetZoom}
            className="w-12 h-12 bg-white rounded-xl shadow-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#FF6B01] hover:bg-orange-50 transition-all"
            title="Restablecer Vista"
          >
            <Maximize size={18} />
          </button>
        </div>

        {/* Barra de estado */}
        <footer className="absolute bottom-0 left-0 right-0 h-8 bg-white/90 backdrop-blur-sm border-t border-gray-200 flex items-center justify-between px-4 z-[90]">
          <span className="text-[10px] font-bold text-gray-400">
            Selección: {selectedIds.length > 0 ? `${selectedIds.length} elementos` : 'Ninguna'}
          </span>
          <span className="text-[10px] font-bold text-[#6F3E8F]">{Math.round(viewState.scale * 100)}%</span>
        </footer>
      </main>

      <PropertyPanel />
    </div>
  );
};
