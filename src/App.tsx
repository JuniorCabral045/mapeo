import React from 'react';
import { Toolbar } from './components/Toolbar';
import { VenueCanvas } from './components/canvas/VenueCanvas';
import { PropertyPanel } from './components/PropertyPanel';
import { useVenueStore } from './store/useVenueStore';

function App() {
  const { selectedIds, mode } = useVenueStore();

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 relative">
          <VenueCanvas />
          {mode === 'view' && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm border border-gray-200 px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 z-50">
                  <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full" />
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Disponible</span>
                  </div>
                  <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full" />
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Ocupado</span>
                  </div>
                  <div className="h-4 w-px bg-gray-200" />
                  <div className="text-sm font-bold text-gray-900">
                      {selectedIds.length} Asientos Seleccionados
                  </div>
                  <button className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50" disabled={selectedIds.length === 0}>
                      Reservar Ahora
                  </button>
              </div>
          )}
        </main>
        <PropertyPanel />
      </div>
    </div>
  );
}

export default App;
