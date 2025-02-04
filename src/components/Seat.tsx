import React from 'react';
import { Circle } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { SectionPrices } from './SectionPrices';

interface SeatProps {
  status: 'available' | 'selected' | 'unavailable';
  section: string;
  row: number;
  seat: number;
  onClick: () => void;
  isZoomed?: boolean;
}

export const Seat: React.FC<SeatProps> = ({ 
  status, 
  section, 
  row, 
  seat, 
  onClick,
  isZoomed = false,
}) => {
  const getColor = () => {
    switch (status) {
      case 'selected':
        return 'text-green-500';
      case 'available':
        return 'text-blue-500 hover:text-blue-600';
      case 'unavailable':
        return 'text-gray-300 cursor-not-allowed';
    }
  };

  const seatPrice = SectionPrices[section as keyof typeof SectionPrices];
  const tooltipContent = `Sección ${section} - Fila ${row} - Asiento ${seat}\nPrecio: €${seatPrice}`;

  return (
    <Tooltip content={tooltipContent}>
      <button
        onClick={onClick}
        className={`relative transition-all ${getColor()} ${
          isZoomed ? 'scale-125' : ''
        } hover:scale-105 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-blue-400`}
        disabled={status === 'unavailable'}
        aria-label={tooltipContent}
      >
        <Circle 
          className="w-5 h-5" 
          fill={status !== 'available' ? 'currentColor' : 'none'}
        />
        <span className="absolute inset-0 flex items-center justify-center text-[8px] font-medium">
          {seat}
        </span>
      </button>
    </Tooltip>
  );
};