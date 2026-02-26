import React from 'react';
import { Toolbar } from './components/Toolbar';
import { VenueCanvas } from './components/canvas/VenueCanvas';
import { PropertyPanel } from './components/PropertyPanel';

function App() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 relative">
          <VenueCanvas />
        </main>
        <PropertyPanel />
      </div>
    </div>
  );
}

export default App;
