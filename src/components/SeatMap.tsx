import React, { useState } from 'react';
import { Circle, ZoomIn, ZoomOut, ArrowLeft, Euro } from 'lucide-react';
import { StadiumSection } from './StadiumSection';
import { SectionPrices } from './SectionPrices';

interface SeatMapProps {
  onSeatSelect: (section: string, row: number, seat: number) => void;
  selectedSeat: { section: string; row: number; seat: number } | null;
}

const SeatMap: React.FC<SeatMapProps> = ({ onSeatSelect, selectedSeat }) => {
  const [zoomedSection, setZoomedSection] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleZoomIn = () => {
    if (zoomLevel < 2) setZoomLevel(prev => prev + 0.2);
  };

  const handleZoomOut = () => {
    if (zoomLevel > 0.6) setZoomLevel(prev => prev - 0.2);
  };

  const handleSectionClick = (section: string) => {
    setZoomedSection(section);
    setZoomLevel(1.5);
  };

  const handleBackToOverview = () => {
    setZoomedSection(null);
    setZoomLevel(1);
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm p-4 border-b">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            {zoomedSection && (
              <button
                onClick={handleBackToOverview}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                aria-label="Volver a vista general"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Vista General</span>
              </button>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomOut}
                className="p-2 rounded-full hover:bg-gray-100"
                disabled={zoomLevel <= 0.6}
                aria-label="Reducir zoom"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <button
                onClick={handleZoomIn}
                className="p-2 rounded-full hover:bg-gray-100"
                disabled={zoomLevel >= 2}
                aria-label="Aumentar zoom"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Asientos seleccionados: {selectedSeat ? 1 : 0}
            </span>
            {selectedSeat && (
              <div className="flex items-center gap-2 text-green-600">
                <Euro className="w-4 h-4" />
                <span>{SectionPrices[selectedSeat.section]}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="relative p-4" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center top' }}>
        {/* Stage */}
        <div className="relative z-10 mx-auto w-[400px] h-16 mb-12">
          <div className="absolute inset-0 bg-gray-800 rounded-lg shadow-md">
            <div className="absolute inset-0 flex items-center justify-center text-white font-semibold">
              ESCENARIO
            </div>
          </div>
        </div>

        {/* Sections Container */}
        <div className="space-y-8 transition-all duration-300">
          {(!zoomedSection || zoomedSection === 'A') && (
            <div className="relative" onClick={() => handleSectionClick('A')}>
              <div className="text-center font-medium text-gray-600 mb-2 flex justify-center items-center gap-2">
                <span>Sección A</span>
                <span className="text-sm text-green-600">€{SectionPrices.A}</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                <StadiumSection
                  section="A"
                  sectionIndex={0}
                  onSeatSelect={onSeatSelect}
                  selectedSeat={selectedSeat}
                  isZoomed={zoomedSection === 'A'}
                />
              </div>
            </div>
          )}

          {(!zoomedSection || zoomedSection === 'B') && (
            <div className="relative" onClick={() => handleSectionClick('B')}>
              <div className="text-center font-medium text-gray-600 mb-2 flex justify-center items-center gap-2">
                <span>Sección B</span>
                <span className="text-sm text-green-600">€{SectionPrices.B}</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                <StadiumSection
                  section="B"
                  sectionIndex={1}
                  onSeatSelect={onSeatSelect}
                  selectedSeat={selectedSeat}
                  isZoomed={zoomedSection === 'B'}
                />
              </div>
            </div>
          )}

          {(!zoomedSection || zoomedSection === 'C') && (
            <div className="relative" onClick={() => handleSectionClick('C')}>
              <div className="text-center font-medium text-gray-600 mb-2 flex justify-center items-center gap-2">
                <span>Sección C</span>
                <span className="text-sm text-green-600">€{SectionPrices.C}</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                <StadiumSection
                  section="C"
                  sectionIndex={2}
                  onSeatSelect={onSeatSelect}
                  selectedSeat={selectedSeat}
                  isZoomed={zoomedSection === 'C'}
                />
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-8 mt-8 bg-white/80 backdrop-blur-sm p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Circle className="w-5 h-5 text-blue-500" />
            <span className="text-gray-600">Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <Circle className="w-5 h-5 text-green-500" fill="currentColor" />
            <span className="text-gray-600">Seleccionado</span>
          </div>
          <div className="flex items-center gap-2">
            <Circle className="w-5 h-5 text-gray-300" fill="currentColor" />
            <span className="text-gray-600">No disponible</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatMap;