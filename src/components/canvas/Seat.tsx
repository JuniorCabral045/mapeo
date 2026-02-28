import React, { useRef, useEffect } from 'react';
import { Circle, Rect, Group } from 'react-konva';
import { Seat as SeatType } from '../../types/venue';
import Konva from 'konva';

interface SeatProps {
  element: SeatType;
  isSelected: boolean;
  onSelect: (e: any) => void;
  onDragMove?: (e: any) => void;
  onDragEnd: (e: any) => void;
  draggable: boolean;
  simplified?: boolean;
}

export const Seat: React.FC<SeatProps> = ({
  element,
  isSelected,
  onSelect,
  onDragMove,
  onDragEnd,
  draggable,
  simplified = false
}) => {
  const groupRef = useRef<Konva.Group>(null);
  const { id, x, y, radius, status, locked, opacity, color } = element;

  useEffect(() => {
    if (groupRef.current && !isSelected && !draggable) {
      groupRef.current.cache();
    } else if (groupRef.current) {
      groupRef.current.clearCache();
    }
  }, [isSelected, draggable, status, color, opacity]);

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

  if (simplified) {
    return (
      <Circle
        id={id}
        x={x}
        y={y}
        radius={radius * 1.2}
        fill={getStatusColor()}
        listening={false}
      />
    );
  }

  return (
    <Group
      id={id}
      x={x}
      y={y}
      ref={groupRef}
      draggable={draggable && !locked}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onClick={onSelect}
      onTap={onSelect}
    >
      {/* Subtle Shadow */}
      <Circle
        radius={radius}
        fill="black"
        opacity={0.1}
        offsetY={-1}
        listening={false}
      />
      {/* Seat Base */}
      <Rect
        x={-radius}
        y={-radius}
        width={radius * 2}
        height={radius * 2}
        cornerRadius={radius * 0.4}
        fill={getStatusColor()}
        opacity={opacity}
        stroke={isSelected ? '#059669' : 'rgba(0,0,0,0.1)'}
        strokeWidth={isSelected ? 1.5 : 0.5}
        perfectDrawEnabled={false}
      />
      {/* Seat Detail (Backrest line) */}
      <Rect
        x={-radius * 0.7}
        y={-radius * 0.8}
        width={radius * 1.4}
        height={radius * 0.4}
        cornerRadius={radius * 0.1}
        fill="white"
        opacity={0.2}
        listening={false}
      />
    </Group>
  );
};
