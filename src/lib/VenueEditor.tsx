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
      if (state.historyIndex !== prev.historyIndex) {
        onChange(serializeVenue(state.elements, state.elementIds, state.venueName));
      }
    });
  }, [onChange]);

  const handleZoom = (delta: number) => {
    setViewState({ scale: Math.max(0.05, Math.min(5, viewState.scale * delta)) });
  };

  const resetZoom = () => setViewState({ scale: 1, x: 100, y: 100 });

  return (
    <div className={`flex h-full w-full overflow-hidden bg-[#0B0F19] text-slate-300 font-sans selection:bg-blue-500/30 ${className}`}>
      <main className="flex-1 relative bg-[#0F172A] touch-none group">
        <Toolbar onSave={onSave} />
        <EditorCanvas />

        {/* Controles de zoom */}
        <div className="absolute bottom-12 right-6 flex flex-col gap-3 z-50">
          <div className="bg-[#1E293B]/80 backdrop-blur-md rounded-xl shadow-2xl border border-slate-700/50 overflow-hidden flex flex-col p-1">
            <button onClick={() => handleZoom(1.1)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-blue-400 hover:bg-slate-700/50 transition-all rounded-lg" title="Aumentar Zoom"><Plus size={18} /></button>
            <div className="h-px bg-slate-700/50 mx-2" />
            <button onClick={() => handleZoom(0.9)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-blue-400 hover:bg-slate-700/50 transition-all rounded-lg" title="Disminuir Zoom"><Minus size={18} /></button>
          </div>
          <button
            onClick={resetZoom}
            className="w-12 h-12 bg-[#1E293B]/80 backdrop-blur-md rounded-xl shadow-2xl border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-blue-400 hover:bg-slate-700 transition-all"
            title="Restablecer Vista"
          >
            <Maximize size={18} />
          </button>
        </div>

        {/* Barra de estado */}
        <footer className="absolute bottom-0 left-0 right-0 h-8 bg-[#0B1220]/90 backdrop-blur-sm border-t border-slate-800 flex items-center justify-between px-4 z-[90]">
          <span className="text-[10px] font-bold text-slate-500 font-mono">
            Selección: {selectedIds.length > 0 ? `${selectedIds.length} elementos` : 'Ninguna'}
          </span>
          <span className="text-[10px] font-bold text-slate-300">{Math.round(viewState.scale * 100)}%</span>
        </footer>
      </main>

      <PropertyPanel />
    </div>
  );
};
