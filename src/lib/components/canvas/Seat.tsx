import React, { useRef, useEffect } from 'react';
import { Circle, Rect, Group, Text } from 'react-konva';
import Konva from 'konva';
import { SeatElement } from '../../types';

interface SeatProps {
  element: SeatElement;
  isSelected: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  draggable: boolean;
  showLabels?: 'none' | 'row' | 'all';
  isInactive?: boolean;
}

export const Seat: React.FC<SeatProps> = ({
  element,
  isSelected,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  draggable,
  showLabels = 'none',
  isInactive = false,
}) => {
  const groupRef = useRef<Konva.Group>(null);
  const { id, x, y, radius, status, locked, opacity, color, number, rotation } = element;

  useEffect(() => {
    // Cache para rendimiento cuando el asiento no está en interacción
    if (groupRef.current && !isSelected && !draggable && showLabels === 'none') {
      groupRef.current.cache();
    } else if (groupRef.current) {
      groupRef.current.clearCache();
    }
  }, [isSelected, draggable, status, color, opacity, showLabels, isInactive, rotation]);

  const getStatusColor = () => {
    if (isSelected) return '#FF6B01';
    if (color) return color;
    switch (status) {
      case 'available': return '#6F3E8F';
      case 'occupied': return '#C7CBD4';
      case 'blocked': return '#9AA1AE';
      case 'reserved': return '#F59E0B';
      default: return '#6F3E8F';
    }
  };

  const seatColor = getStatusColor();

  return (
    <Group
      id={id}
      x={x}
      y={y}
      rotation={rotation}
      ref={groupRef}
      draggable={draggable && !locked}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onClick={onSelect}
      onTap={onSelect}
    >
      {isSelected && (
        <Rect
          x={-(radius * 1.3)}
          y={-(radius * 1.3)}
          width={radius * 2.6}
          height={radius * 2.6}
          cornerRadius={radius * 0.6}
          fill="#FF6B01"
          opacity={0.18}
          listening={false}
        />
      )}

      <Rect
        x={-radius}
        y={-radius}
        width={radius * 2}
        height={radius * 2}
        cornerRadius={radius * 0.4}
        fill={isInactive ? '#C7CBD4' : seatColor}
        opacity={isInactive ? 0.35 : status === 'occupied' ? 0.6 : opacity}
        stroke={isSelected ? '#FF8A3D' : status === 'occupied' ? '#9AA1AE' : isInactive ? 'transparent' : '#FFFFFF'}
        strokeWidth={isSelected ? 1.5 : status === 'occupied' ? 0.5 : 0.1}
        shadowBlur={isSelected ? 8 : 0}
        shadowColor="#FF6B01"
        shadowOpacity={0.4}
        perfectDrawEnabled={false}
      />

      {showLabels === 'row' && (
        <Circle radius={radius * 0.2} fill="white" opacity={0.3} listening={false} />
      )}

      {showLabels === 'all' && (
        <Text
          text={number}
          x={-radius}
          y={-radius}
          width={radius * 2}
          height={radius * 2}
          align="center"
          verticalAlign="middle"
          fontSize={radius * 0.8}
          fill={status === 'occupied' ? '#6B7280' : 'white'}
          fontFamily="monospace"
          fontStyle="bold"
          listening={false}
          opacity={status === 'occupied' ? 0.5 : 0.8}
        />
      )}
    </Group>
  );
};
