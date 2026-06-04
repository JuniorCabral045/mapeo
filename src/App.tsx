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
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans selection:bg-[#FF6B00]/30">
      {/* Header Bar */}
      <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 z-[100] shrink-0">
        <div className="flex items-center gap-4">
            <div className="w-9 h-9 bg-[#FF6B00] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#FF6B00]/20">
                <MapIcon size={20} strokeWidth={2.5} />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">POINT<span className="text-[#8A5CF5] not-italic ml-1">.</span></h1>
        </div>

        <nav className="flex items-center gap-1">
            {['Control Tower', 'Canvas', 'Events', 'Staff', 'KYC', 'Finance'].map((item) => (
                <button
                    key={item}
                    className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all uppercase tracking-tighter ${
                        item === 'Canvas' ? 'bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20' : 'text-slate-400 hover:text-[#FF6B00] hover:bg-slate-50'
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
        <main className="flex-1 relative bg-slate-100 touch-none group">
          {/* Sub-toolbar inside Canvas (Floating) */}
          <Toolbar />

          <VenueCanvas />

          {/* Canvas HUD Controls */}
          <div className="absolute bottom-12 right-6 flex flex-col gap-3 z-50">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden flex flex-col p-1.5">
                <button onClick={() => handleZoom(1.1)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-[#FF6B00] hover:bg-slate-50 transition-all rounded-xl" title="Aumentar Zoom"><Plus size={18} /></button>
                <div className="h-px bg-slate-100 mx-2" />
                <button onClick={() => handleZoom(0.9)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-[#FF6B00] hover:bg-slate-50 transition-all rounded-xl" title="Disminuir Zoom"><Minus size={18} /></button>
            </div>
            <button
                onClick={resetZoom}
                className="w-12 h-12 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/50 flex items-center justify-center text-slate-400 hover:text-[#FF6B00] hover:bg-slate-50 transition-all"
                title="Restablecer Vista"
            >
                <Maximize size={18} />
            </button>
          </div>

          {/* Status Bar (CAD Style) */}
          <footer className="absolute bottom-0 left-0 right-0 h-8 bg-white border-t border-slate-200 flex items-center justify-between px-6 z-[90]">
            <div className="flex items-center gap-6 text-[10px] font-bold text-slate-400 font-mono">
                <div className="flex gap-4">
                    <span>X: {Math.round(viewState.x)}m</span>
                    <span>Y: {Math.round(viewState.y)}m</span>
                </div>
                <div className="h-3 w-px bg-slate-200" />
                <span className="text-slate-500 uppercase tracking-tighter">Selección: {selectedIds.length > 0 ? `${selectedIds.length} Elementos` : 'Ninguno'}</span>
            </div>

            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-[#2DD4BF] rounded-full" /> Disponible
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-[#FF6B00] rounded-full" /> Seleccionado
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" /> Ocupado
                </div>
                <div className="h-3 w-px bg-slate-200 ml-2" />
                <span className="text-slate-900 ml-2">{Math.round(viewState.scale * 100)}%</span>
            </div>
          </footer>

          {/* View Mode Booking Summary */}
          {mode === 'view' && selectedIds.length > 0 && (
              <div className="absolute top-8 right-8 bottom-16 w-80 z-50 animate-in slide-in-from-right-10 duration-500">
                <div className="bg-white border border-slate-200 p-6 rounded-[2.5rem] shadow-2xl flex flex-col h-full overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex flex-col">
                            <h3 className="text-lg font-black text-slate-900">Tu Selección</h3>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{selectedIds.length} Asientos elegidos</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-[#FF6B00]/10 border border-[#FF6B00]/20 flex items-center justify-center text-[#FF6B00]">
                            <ShoppingBag size={20} />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                        {selectedIds.map(id => {
                            const el = elements[id];
                            return (
                                <div key={id} className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex items-center justify-between group hover:border-[#FF6B00]/30 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-[#2DD4BF]/10 flex items-center justify-center text-[#2DD4BF] text-[10px] font-black">
                                            {el?.type === 'seat' ? (el as any).number : '?'}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-slate-900">Fila {(el as any).row}</span>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase">Sector: {elements[(el as any).sectionId]?.name || 'General'}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-100">
                        <button className="w-full bg-[#FF6B00] hover:bg-[#E65A00] text-white py-4 rounded-2xl text-sm font-black shadow-lg shadow-[#FF6B00]/20 transition-all active:scale-95">
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
