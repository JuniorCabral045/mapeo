import React, { useMemo, useState } from 'react';
import { Map as MapIcon, PenLine, Eye, ShoppingBag } from 'lucide-react';
import { VenueEditor, VenueViewer } from '../lib';
import type { AvailabilityMap, SelectedSeat, VenueMap } from '../lib';

const STORAGE_KEY = 'venue-mapper-demo';

const loadSavedMap = (): VenueMap | undefined => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as VenueMap) : undefined;
  } catch {
    return undefined;
  }
};

/**
 * App demo: simula los dos lados del sistema de pedidos.
 * - "Editor": el administrador diseña el mapeo (en producción, onSave lo envía a la API Laravel).
 * - "Tienda": el cliente ve el mapa guardado y elige asientos (availability vendría de la API).
 */
function App() {
  const [tab, setTab] = useState<'editor' | 'store'>('editor');
  const [savedMap, setSavedMap] = useState<VenueMap | undefined>(loadSavedMap);
  const [cart, setCart] = useState<SelectedSeat[]>([]);

  // Disponibilidad simulada: ~20% de asientos ocupados, estable por mapa
  const availability = useMemo<AvailabilityMap>(() => {
    if (!savedMap) return {};
    const result: AvailabilityMap = {};
    savedMap.sectors.forEach((sector) => {
      sector.seats.forEach((seat, i) => {
        if ((i * 7919) % 10 < 2) result[seat.id] = 'occupied';
      });
    });
    return result;
  }, [savedMap]);

  const handleSave = (map: VenueMap) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    setSavedMap(map);
    alert(`Mapeo "${map.name}" guardado (${map.sectors.length} sectores, ${map.sectors.reduce((n, s) => n + s.seats.length, 0)} asientos).\nEn producción esto haría un PUT a tu API Laravel.`);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0B0F19] text-slate-300 font-sans">
      <header className="h-14 border-b border-slate-800 bg-[#0B1220] flex items-center justify-between px-6 z-[100] shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <MapIcon size={18} strokeWidth={2.5} />
          </div>
          <h1 className="text-sm font-black text-white tracking-tight uppercase">
            VenueMapper <span className="text-blue-500">Demo</span>
          </h1>
        </div>

        <nav className="flex items-center bg-slate-900/50 p-1 rounded-xl">
          <button
            onClick={() => setTab('editor')}
            className={`px-6 py-2 rounded-lg text-xs font-black flex items-center gap-2 transition-all ${
              tab === 'editor' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <PenLine size={14} strokeWidth={3} /> Editor (Admin)
          </button>
          <button
            onClick={() => setTab('store')}
            className={`px-6 py-2 rounded-lg text-xs font-black flex items-center gap-2 transition-all ${
              tab === 'store' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Eye size={14} strokeWidth={3} /> Tienda (Cliente)
          </button>
        </nav>

        <div className="w-40" />
      </header>

      <div className="flex-1 overflow-hidden">
        {tab === 'editor' ? (
          <VenueEditor initialMap={savedMap} onSave={handleSave} />
        ) : savedMap ? (
          <div className="flex h-full">
            <div className="flex-1 relative">
              <VenueViewer
                map={savedMap}
                availability={availability}
                onSelectionChange={(_ids, seats) => setCart(seats)}
                maxSeats={6}
              />
            </div>

            {/* Carrito de ejemplo: así consumiría la selección tu sistema de pedidos */}
            <aside className="w-80 border-l border-slate-800 bg-[#0B1220] flex flex-col p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-black text-white">Tu Selección</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                    {cart.length} asientos (máx. 6)
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <ShoppingBag size={20} />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {cart.map((seat) => (
                  <div key={seat.id} className="bg-slate-800/50 border border-slate-700/30 p-3 rounded-2xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#2DD4BF]/20 flex items-center justify-center text-[#2DD4BF] text-[10px] font-black">
                      {seat.number}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-white">Fila {seat.row} · Asiento {seat.number}</span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Sector: {seat.sectorName}</span>
                    </div>
                  </div>
                ))}
                {cart.length === 0 && (
                  <p className="text-xs text-slate-600 font-bold text-center py-12">
                    Haz clic en los asientos verdes para seleccionarlos
                  </p>
                )}
              </div>

              <button
                disabled={cart.length === 0}
                onClick={() => alert(`Pedido simulado: ${cart.map((s) => `${s.sectorName} ${s.row}${s.number}`).join(', ')}\nEn producción esto crearía el pedido en tu API Laravel.`)}
                className="mt-6 w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white py-4 rounded-2xl text-sm font-black shadow-lg shadow-blue-600/20 transition-all active:scale-95"
              >
                CONFIRMAR SELECCIÓN
              </button>
            </aside>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
            <MapIcon size={48} className="text-slate-700" />
            <p className="text-sm font-black text-slate-500 uppercase tracking-widest">No hay mapeo guardado</p>
            <p className="text-xs text-slate-600 max-w-sm">
              Ve a la pestaña <span className="text-blue-400 font-bold">Editor</span>, diseña un recinto
              (agrega un sector y genera asientos) y presiona GUARDAR.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
