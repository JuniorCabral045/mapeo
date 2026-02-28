import React from 'react';
import { Toolbar } from './components/Toolbar';
import { VenueCanvas } from './components/canvas/VenueCanvas';
import { PropertyPanel } from './components/PropertyPanel';
import { useVenueStore } from './store/useVenueStore';
import { Plus, Minus, Maximize, ShoppingBag, CheckCircle2 } from 'lucide-react';

function App() {
  const { selectedIds, mode, viewState, setViewState } = useVenueStore();

  const handleZoom = (delta: number) => {
    setViewState({ scale: Math.max(0.05, Math.min(5, viewState.scale * delta)) });
  };

  const resetZoom = () => {
      setViewState({ scale: 0.8, x: 100, y: 100 });
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F8FAFC]">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 relative bg-slate-100/50">
          <VenueCanvas />

          {/* Zoom Controls */}
          <div className="absolute bottom-8 right-8 flex flex-col gap-2 z-50">
            <div className="bg-white rounded-xl shadow-2xl shadow-blue-900/10 border border-slate-200 overflow-hidden flex flex-col">
                <button
                    onClick={() => handleZoom(1.2)}
                    className="w-12 h-12 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition-all border-b border-slate-100"
                    title="Aumentar Zoom"
                >
                    <Plus size={20} strokeWidth={2.5} />
                </button>
                <button
                    onClick={() => handleZoom(0.8)}
                    className="w-12 h-12 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition-all"
                    title="Disminuir Zoom"
                >
                    <Minus size={20} strokeWidth={2.5} />
                </button>
            </div>
            <button
                onClick={resetZoom}
                className="w-12 h-12 bg-white rounded-xl shadow-2xl shadow-blue-900/10 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition-all"
                title="Restablecer Vista"
            >
                <Maximize size={18} strokeWidth={2.5} />
            </button>
          </div>

          {/* Booking / View Mode HUD */}
          {mode === 'view' && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-white/95 backdrop-blur-md border border-slate-200/60 p-4 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center justify-between gap-6 z-50 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-6 px-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Disponible</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 bg-slate-200 rounded-full" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ocupado</span>
                        </div>
                      </div>
                      <div className="h-10 w-px bg-slate-100" />
                      <div>
                        <div className="text-xl font-black text-slate-900 tabular-nums">
                            {selectedIds.length}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                            Asientos Seleccionados
                        </div>
                      </div>
                  </div>

                  <div className="flex items-center gap-3">
                      {selectedIds.length > 0 && (
                          <div className="text-right mr-2">
                              <div className="text-[10px] font-bold text-slate-400 uppercase">Subtotal</div>
                              <div className="text-lg font-black text-blue-600">${selectedIds.length * 45}</div>
                          </div>
                      )}
                      <button
                        className="bg-blue-600 text-white pl-6 pr-4 py-3 rounded-2xl text-sm font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-3 group disabled:opacity-30 disabled:grayscale disabled:shadow-none"
                        disabled={selectedIds.length === 0}
                      >
                          {selectedIds.length > 0 ? (
                              <>
                                CONTINUAR <ShoppingBag size={18} className="group-hover:translate-x-1 transition-transform" />
                              </>
                          ) : (
                              <>
                                SELECCIONA TUS ASIENTOS <CheckCircle2 size={18} className="opacity-40" />
                              </>
                          )}
                      </button>
                  </div>
              </div>
          )}
        </main>
        <PropertyPanel />
      </div>
    </div>
  );
}

export default App;
