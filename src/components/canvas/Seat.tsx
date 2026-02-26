import React from 'react';
import { Circle } from 'react-konva';
import { Seat as SeatType } from '../../types/venue';

interface SeatProps {
  element: SeatType;
  isSelected: boolean;
  onSelect: (e: any) => void;
  onDragMove?: (e: any) => void;
  onDragEnd: (e: any) => void;
  draggable: boolean;
}

export const Seat: React.FC<SeatProps> = ({
  element,
  isSelected,
  onSelect,
  onDragMove,
  onDragEnd,
  draggable
}) => {
  const { id, x, y, radius, status, locked, opacity, color } = element;

  const getStatusColor = () => {
    if (isSelected) return '#10b981';
    if (color) return color;
    switch (status) {
      case 'available': return '#3b82f6';
      case 'occupied': return '#ef4444';
      case 'blocked': return '#64748b';
      case 'reserved': return '#f59e0b';
      default: return '#d1d5db';
    }
  };

  return (
    <Circle
      id={id}
      x={x}
      y={y}
      radius={radius}
      fill={getStatusColor()}
      opacity={opacity}
      stroke={isSelected ? '#059669' : 'rgba(0,0,0,0.1)'}
      strokeWidth={isSelected ? 1.5 : 0.5}
      draggable={draggable && !locked}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onClick={onSelect}
      onTap={onSelect}
    />
  );
};
