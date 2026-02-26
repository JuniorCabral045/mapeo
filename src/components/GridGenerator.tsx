import React, { useState } from 'react';
import { Seat } from '../types/venue';

interface GridGeneratorProps {
  onGenerate: (seats: Seat[]) => void;
  onCancel: () => void;
}

export const GridGenerator: React.FC<GridGeneratorProps> = ({ onGenerate, onCancel }) => {
  const [rows, setRows] = useState(5);
  const [cols, setCols] = useState(10);
  const [rowPrefix, setRowPrefix] = useState('A');
  const [spacing, setSpacing] = useState(25);

  const handleGenerate = () => {
    const newSeats: Seat[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        newSeats.push({
          id: `seat-${Date.now()}-${r}-${c}`,
          x: 200 + c * spacing,
          y: 200 + r * spacing,
          row: String.fromCharCode(rowPrefix.charCodeAt(0) + r),
          number: String(c + 1),
          status: 'available',
          price: 50,
          radius: 8,
          opacity: 1,
        });
      }
    }
    onGenerate(newSeats);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-96">
        <h3 className="text-lg font-bold mb-4">Generador Masivo de Asientos</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700">Filas</label>
            <input type="number" value={rows} onChange={e => setRows(parseInt(e.target.value))} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Columnas por fila</label>
            <input type="number" value={cols} onChange={e => setCols(parseInt(e.target.value))} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Espaciado (px)</label>
            <input type="number" value={spacing} onChange={e => setSpacing(parseInt(e.target.value))} className="w-full border p-2 rounded" />
          </div>
          <div className="flex gap-2 pt-4">
            <button onClick={onCancel} className="flex-1 px-4 py-2 border rounded hover:bg-gray-50">Cancelar</button>
            <button onClick={handleGenerate} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Generar</button>
          </div>
        </div>
      </div>
    </div>
  );
};
