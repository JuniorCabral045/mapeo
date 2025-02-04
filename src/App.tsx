import React, { useState } from 'react';
import StadiumMap from './components/StadiumMap';

interface SelectedSeat {
  section: string;
  row: number;
  seat: number;
}

function App() {
  const [selectedSeat, setSelectedSeat] = useState<SelectedSeat | null>(null);

  const handleSeatSelect = (section: string, row: number, seat: number) => {
    setSelectedSeat({ section, row, seat });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Estadio Deportivo</h1>
        <StadiumMap
          onSeatSelect={handleSeatSelect}
          selectedSeat={selectedSeat}
        />
      </div>
    </div>
  );
}

export default App;