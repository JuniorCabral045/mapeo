import React, { useState } from 'react';
import { ZoomIn, ZoomOut, ArrowLeft, Compass, Coffee, Bath } from 'lucide-react';
import { StadiumSection } from './StadiumSection';
import { Tooltip } from './Tooltip';

interface StadiumMapProps {
  onSeatSelect: (section: string, row: number, seat: number) => void;
  selectedSeat: { section: string; row: number; seat: number } | null;
}

const StadiumMap: React.FC<StadiumMapProps> = ({ onSeatSelect, selectedSeat }) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  const sections = {
    TRIBUNA_PRINCIPAL: { 
      color: 'from-red-500/80 to-red-600/80', 
      price: '€150-200',
      available: true,
      capacity: 5000
    },
    PLATEA_ESTE: { 
      color: 'from-blue-500/80 to-blue-600/80', 
      price: '€100-130',
      available: true,
      capacity: 3000
    },
    PLATEA_OESTE: { 
      color: 'from-blue-500/80 to-blue-600/80', 
      price: '€100-130',
      available: true,
      capacity: 3000
    },
    POPULAR_NORTE: { 
      color: 'from-white/80 to-gray-200/80', 
      price: '€50-70',
      available: true,
      capacity: 4000
    },
    POPULAR_SUR: { 
      color: 'from-white/80 to-gray-200/80', 
      price: '€50-70',
      available: false,
      capacity: 4000
    }
  };

  const handleSectionClick = (section: string) => {
    if (sections[section as keyof typeof sections].available) {
      setActiveSection(section);
      setZoomLevel(1.5);
    }
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto">
      {/* Controls */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm p-4 border-b shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            {activeSection && (
              <button
                onClick={() => setActiveSection(null)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Vista General</span>
              </button>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoomLevel(Math.max(0.6, zoomLevel - 0.2))}
                className="p-2 rounded-full hover:bg-gray-100"
                disabled={zoomLevel <= 0.6}
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <button
                onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.2))}
                className="p-2 rounded-full hover:bg-gray-100"
                disabled={zoomLevel >= 2}
              >
                <ZoomIn className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={() => setRotation(prev => (prev + 90) % 360)}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <Compass className="w-5 h-5" />
            </button>
          </div>
          
          {/* Servicios */}
          <div className="flex items-center gap-4">
            <Tooltip content="Cafetería y Restaurantes">
              <div className="flex items-center gap-1 text-gray-600">
                <Coffee className="w-4 h-4" />
                <span className="text-sm">4 ubicaciones</span>
              </div>
            </Tooltip>
            <Tooltip content="Baños">
              <div className="flex items-center gap-1 text-gray-600">
                <Bath className="w-4 h-4" />
                <span className="text-sm">8 ubicaciones</span>
              </div>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Stadium Visualization */}
      <div 
        className="relative p-8 transition-all duration-300"
        style={{ 
          transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
          transformOrigin: 'center center'
        }}
      >
        <div className="relative w-full aspect-[16/9] bg-gradient-to-b from-gray-50 to-gray-100 rounded-[100px] overflow-hidden shadow-xl">
          {/* Campo */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[80%] bg-gradient-to-b from-green-500 to-green-600 rounded-[60px] border-[8px] border-white shadow-inner">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[80%] h-[90%] border-2 border-white/50 rounded-[50px]" />
            </div>
          </div>

          {/* Secciones del Estadio */}
          {Object.entries(sections).map(([sectionId, data]) => {
            const isDisabled = !data.available;
            const baseClasses = `
              absolute transition-all duration-300 cursor-pointer
              bg-gradient-to-b ${data.color}
              hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-blue-400
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
            `;

            let positionClasses = '';
            switch (sectionId) {
              case 'TRIBUNA_PRINCIPAL':
                positionClasses = 'top-0 left-1/2 -translate-x-1/2 w-[80%] h-[15%] rounded-t-[80px]';
                break;
              case 'POPULAR_SUR':
                positionClasses = 'bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[15%] rounded-b-[80px]';
                break;
              case 'PLATEA_ESTE':
                positionClasses = 'top-1/2 right-0 -translate-y-1/2 w-[15%] h-[70%]';
                break;
              case 'PLATEA_OESTE':
                positionClasses = 'top-1/2 left-0 -translate-y-1/2 w-[15%] h-[70%]';
                break;
              case 'POPULAR_NORTE':
                positionClasses = 'top-[15%] left-1/2 -translate-x-1/2 w-[80%] h-[15%]';
                break;
            }

            return (
              <Tooltip
                key={sectionId}
                content={`
                  ${sectionId.replace('_', ' ')}
                  Precio: ${data.price}
                  Capacidad: ${data.capacity} personas
                  ${isDisabled ? '(No disponible)' : ''}
                `}
              >
                <button
                  className={`${baseClasses} ${positionClasses}`}
                  onClick={() => !isDisabled && handleSectionClick(sectionId)}
                  disabled={isDisabled}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-bold text-white text-shadow">
                      {sectionId.replace('_', ' ')}
                    </span>
                  </div>
                </button>
              </Tooltip>
            );
          })}

          {/* Entradas */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 mb-4">
            <div className="px-4 py-2 bg-yellow-400 rounded-full text-sm font-bold">
              ENTRADA PRINCIPAL
            </div>
          </div>
        </div>

        {/* Leyenda */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {Object.entries(sections).map(([section, { color, price }]) => (
            <div key={section} className="flex items-center gap-2 p-2 rounded-lg bg-white shadow-sm">
              <div className={`w-4 h-4 rounded bg-gradient-to-b ${color}`} />
              <span className="font-medium text-sm">{section.replace('_', ' ')}</span>
              <span className="ml-auto text-green-600 font-semibold text-sm">{price}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StadiumMap;