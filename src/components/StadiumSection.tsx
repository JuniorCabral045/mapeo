import React from 'react';
import { Seat } from './Seat';

interface StadiumSectionProps {
  section: string;
  sectionIndex: number;
  onSeatSelect: (section: string, row: number, seat: number) => void;
  selectedSeat: { section: string; row: number; seat: number } | null;
  isZoomed?: boolean;
}

export const StadiumSection: React.FC<StadiumSectionProps> = ({
  section,
  sectionIndex,
  onSeatSelect,
  selectedSeat,
  isZoomed = false,
}) => {
  const rows = 5;
  const seatsPerRow = 15;

  // Simulate some seats as not available
  const isAvailable = (seatNumber: number) => {
    return (seatNumber % 7) !== 0; // Every 7th seat is unavailable
  };

  return (
    <div className="flex flex-col items-center gap-1">
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div
          key={`${section}-${rowIndex}`}
          className="flex gap-1"
          role="row"
          aria-label={`Fila ${rowIndex + 1}`}
        >
          <div className="flex items-center mr-2 text-sm text-gray-500 w-6">
            {rowIndex + 1}
          </div>
          {Array.from({ length: seatsPerRow }, (_, seatIndex) => {
            const seatNumber = (sectionIndex * 100) + (rowIndex * seatsPerRow) + seatIndex + 1;
            const isSelected = selectedSeat?.section === section && 
                            selectedSeat?.row === rowIndex + 1 && 
                            selectedSeat?.seat === seatNumber;
            
            return (
              <Seat
                key={`${section}-${rowIndex}-${seatIndex}`}
                status={isSelected ? 'selected' : isAvailable(seatNumber) ? 'available' : 'unavailable'}
                section={section}
                row={rowIndex + 1}
                seat={seatNumber}
                onClick={() => isAvailable(seatNumber) && onSeatSelect(section, rowIndex + 1, seatNumber)}
                isZoomed={isZoomed}
              />
            );
          })}
          <div className="flex items-center ml-2 text-sm text-gray-500 w-6">
            {rowIndex + 1}
          </div>
        </div>
      ))}
    </div>
  );
};