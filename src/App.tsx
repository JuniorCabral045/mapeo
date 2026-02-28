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
        <main className="flex-1 relative bg-slate-100/50 touch-none">
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

          {/* Booking / View Mode HUD (Mobile Bottom Sheet) */}
          {mode === 'view' && (
              <div className={`absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 p-6 rounded-t-[3rem] shadow-[0_-20px_60px_rgba(0,0,0,0.08)] z-50 transition-all transform duration-500 ease-out ${selectedIds.length > 0 ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
                  <div className="max-w-xl mx-auto flex flex-col gap-6">
                      {/* Pull Indicator */}
                      <div className="w-16 h-1.5 bg-slate-200 rounded-full mx-auto" />

                      <div className="flex items-center justify-between px-2">
                          <div className="flex flex-col">
                              <div className="flex items-center gap-3 mb-1">
                                  <div className="text-3xl font-black text-slate-900 tabular-nums">
                                      {selectedIds.length}
                                  </div>
                                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Asientos</span>
                              </div>
                              <div className="flex gap-4">
                                  <div className="flex items-center gap-1.5">
                                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                      <span className="text-[10px] font-bold text-slate-400 uppercase">Disponible</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                      <div className="w-2 h-2 bg-slate-200 rounded-full" />
                                      <span className="text-[10px] font-bold text-slate-400 uppercase">Ocupado</span>
                                  </div>
                              </div>
                          </div>

                          <div className="text-right">
                              <div className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Precio Total</div>
                              <div className="text-3xl font-black text-blue-600 tabular-nums">
                                  ${selectedIds.length * 45}
                              </div>
                          </div>
                      </div>

                      <button
                        className="w-full bg-indigo-600 text-white py-5 rounded-3xl text-lg font-black hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 flex items-center justify-center gap-3 group disabled:opacity-30 disabled:grayscale disabled:shadow-none"
                        disabled={selectedIds.length === 0}
                      >
                          {selectedIds.length > 0 ? (
                              <>
                                CONTINUAR <ShoppingBag size={20} className="group-hover:translate-x-1 transition-transform" />
                              </>
                          ) : (
                              <>
                                SELECCIONA TUS ASIENTOS <CheckCircle2 size={20} className="opacity-40" />
                              </>
                          )}
                      </button>

                      {/* Selected Items Detail (Optional) */}
                      {selectedIds.length > 0 && (
                          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                              {selectedIds.slice(0, 10).map(id => (
                                  <div key={id} className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full text-[10px] font-bold text-slate-600 whitespace-nowrap">
                                      {useVenueStore.getState().elements[id]?.name || id}
                                  </div>
                              ))}
                              {selectedIds.length > 10 && (
                                  <div className="bg-slate-50 px-3 py-1.5 rounded-full text-[10px] font-bold text-slate-400">
                                      +{selectedIds.length - 10} más
                                  </div>
                              )}
                          </div>
                      )}
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
