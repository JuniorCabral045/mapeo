import React, { useState } from 'react';
import { useVenueStore } from './hooks/useVenueStore';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { VenueCanvas } from './components/VenueCanvas';
import { GridGenerator } from './components/GridGenerator';

function App() {
  const { state, dispatch } = useVenueStore();
  const [showGridGen, setShowGridGen] = useState(false);

  const handleSave = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.current, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${state.current.name.replace(/\s+/g, '_')}_layout.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleLoad = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event: any) => {
        try {
          const layout = JSON.parse(event.target.result);
          dispatch({ type: 'SET_LAYOUT', layout });
        } catch (err) {
          alert('Error al cargar el archivo JSON');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      <Toolbar
        state={state}
        dispatch={dispatch}
        onSave={handleSave}
        onLoad={handleLoad}
        onOpenGridGenerator={() => setShowGridGen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 relative">
            <VenueCanvas state={state} dispatch={dispatch} />

            {state.mode === 'view' && (
                <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur p-4 rounded-xl shadow-lg border border-gray-100 flex gap-6 z-10">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-xs font-medium text-gray-600">Disponible</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-xs font-medium text-gray-600">Ocupado</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                        <span className="text-xs font-medium text-gray-600">Bloqueado</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-xs font-medium text-gray-600">Tu Selección</span>
                    </div>
                </div>
            )}
        </main>

        <Sidebar state={state} dispatch={dispatch} />
      </div>

      {showGridGen && (
          <GridGenerator
            onGenerate={(seats) => {
                dispatch({ type: 'ADD_SEATS', seats });
                setShowGridGen(false);
            }}
            onCancel={() => setShowGridGen(false)}
          />
      )}
    </div>
  );
}

export default App;
