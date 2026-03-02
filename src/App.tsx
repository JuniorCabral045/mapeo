import React from 'react';
import { Toolbar } from './components/Toolbar';
import { VenueCanvas } from './components/canvas/VenueCanvas';
import { PropertyPanel } from './components/PropertyPanel';
import { useVenueStore } from './store/useVenueStore';
import { Plus, Minus, Maximize, ShoppingBag, Map as MapIcon, Circle as CircleIcon, Flag, Square } from 'lucide-react';

function App() {
  const { selectedIds, mode, viewState, setViewState, elements, elementIds, selectElements } = useVenueStore();

  const handleZoom = (delta: number) => {
    setViewState({ scale: Math.max(0.05, Math.min(5, viewState.scale * delta)) });
  };

  const resetZoom = () => {
      setViewState({ scale: 1, x: 100, y: 100 });
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0B0F19] text-slate-300 font-sans selection:bg-blue-500/30">
      {/* Header Bar */}
      <header className="h-14 border-b border-slate-800 bg-[#0B1220] flex items-center justify-between px-6 z-[100] shrink-0">
        <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <MapIcon size={18} strokeWidth={2.5} />
            </div>
            <h1 className="text-sm font-black text-white tracking-tight uppercase">VenueMaster <span className="text-blue-500">CAD</span></h1>
        </div>

        <nav className="flex items-center gap-1">
            {['Editor de Mapa'].map((item) => (
                <button
                    key={item}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        item === 'Editor de Mapa' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                >
                    {item}
                </button>
            ))}
        </nav>

        <div className="flex items-center gap-3">
            {/* Minimal Header (Profile Removed) */}
        </div>
      </header>

      {/* Main CAD Interface */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 relative bg-[#0F172A] touch-none group">
          {/* Sub-toolbar inside Canvas (Floating) */}
          <Toolbar />

          <VenueCanvas />

          {/* Canvas HUD Controls */}
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

          {/* Status Bar (CAD Style) */}
          <footer className="absolute bottom-0 left-0 right-0 h-8 bg-[#0B1220]/90 backdrop-blur-sm border-t border-slate-800 flex items-center justify-between px-4 z-[90]">
            <div className="flex items-center gap-6 text-[10px] font-bold text-slate-500 font-mono">
                <div className="flex gap-4">
                    <span>X: {Math.round(viewState.x)}m</span>
                    <span>Y: {Math.round(viewState.y)}m</span>
                </div>
                <div className="h-3 w-px bg-slate-800" />
                <span className="text-slate-400">Selección: {selectedIds.length > 0 ? `${selectedIds.length} Elementos` : 'Ninguno'}</span>
            </div>

            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-[#2DD4BF] rounded-full" /> Disponible
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-[#3B82F6] rounded-full" /> Seleccionado
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-slate-700 rounded-full" /> Ocupado
                </div>
                <div className="h-3 w-px bg-slate-800 ml-2" />
                <span className="text-slate-300 ml-2">{Math.round(viewState.scale * 100)}%</span>
            </div>
          </footer>

          {/* View Mode Booking Summary */}
          {mode === 'view' && selectedIds.length > 0 && (
              <div className="absolute top-6 right-6 bottom-14 w-80 z-50 animate-in slide-in-from-right-10 duration-500">
                <div className="bg-[#1E293B]/90 backdrop-blur-xl border border-slate-700/50 p-6 rounded-3xl shadow-2xl flex flex-col h-full overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex flex-col">
                            <h3 className="text-lg font-black text-white">Tu Selección</h3>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{selectedIds.length} Asientos elegidos</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                            <ShoppingBag size={20} />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                        {selectedIds.map(id => {
                            const el = elements[id];
                            return (
                                <div key={id} className="bg-slate-800/50 border border-slate-700/30 p-3 rounded-2xl flex items-center justify-between group hover:border-blue-500/30 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-[#2DD4BF]/20 flex items-center justify-center text-[#2DD4BF] text-[10px] font-black">
                                            {el?.type === 'seat' ? (el as any).number : '?'}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-white">Fila {(el as any).row}</span>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase">Sector: {elements[(el as any).sectionId]?.name || 'General'}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-800">
                        <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl text-sm font-black shadow-lg shadow-blue-600/20 transition-all active:scale-95">
                            CONFIRMAR SELECCIÓN
                        </button>
                    </div>
                </div>
              </div>
          )}
        </main>
        {mode === 'edit' && <PropertyPanel />}
      </div>
    </div>
  );
}

export default App;
