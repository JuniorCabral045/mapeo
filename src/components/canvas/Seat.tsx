import React, { useRef, useEffect } from 'react';
import { Circle, Rect, Group, Text } from 'react-konva';
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
  showLabels?: 'none' | 'row' | 'all';
}

export const Seat: React.FC<SeatProps> = ({
  element,
  isSelected,
  onSelect,
  onDragMove,
  onDragEnd,
  draggable,
  simplified = false,
  showLabels = 'none'
}) => {
  const groupRef = useRef<Konva.Group>(null);
  const { id, x, y, radius, status, locked, opacity, color, row, number } = element;

  useEffect(() => {
    if (groupRef.current && !isSelected && !draggable && showLabels === 'none') {
      groupRef.current.cache();
    } else if (groupRef.current) {
      groupRef.current.clearCache();
    }
  }, [isSelected, draggable, status, color, opacity, showLabels]);

  const getStatusColor = () => {
    if (isSelected) return '#10b981'; // Green for selected
    if (color) return color;
    switch (status) {
      case 'available': return '#6366f1'; // Modern Indigo for available
      case 'occupied': return '#cbd5e1'; // Soft Gray for occupied
      case 'blocked': return '#94a3b8';  // Muted Slate for blocked
      case 'reserved': return '#f59e0b'; // Amber for reserved
      default: return '#e2e8f0';
    }
  };

  const seatColor = getStatusColor();

  if (simplified) {
    return (
      <Circle
        id={id}
        x={x}
        y={y}
        radius={radius * 1.1}
        fill={seatColor}
        opacity={status === 'occupied' ? 0.4 : 1}
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
      {/* Soft Glow for Selected */}
      {isSelected && (
          <Circle
            radius={radius * 1.5}
            fill="#10b981"
            opacity={0.2}
            listening={false}
          />
      )}

      {/* Seat Base - Simple Rounded Rect */}
      <Rect
        x={-radius}
        y={-radius}
        width={radius * 2}
        height={radius * 2}
        cornerRadius={radius * 0.5}
        fill={seatColor}
        opacity={status === 'occupied' ? 0.5 : opacity}
        stroke={isSelected ? '#059669' : 'white'}
        strokeWidth={isSelected ? 1.5 : 0.5}
        shadowBlur={isSelected ? 10 : 0}
        shadowColor="#10b981"
        perfectDrawEnabled={false}
      />

      {/* Subtle Dot instead of full labels when row is needed */}
      {showLabels === 'row' && (
          <Circle
            radius={radius * 0.3}
            fill="white"
            opacity={0.5}
            listening={false}
          />
      )}

      {/* High-quality Label when zoomed in */}
      {showLabels === 'all' && (
          <Text
            text={number}
            x={-radius}
            y={-radius}
            width={radius * 2}
            height={radius * 2}
            align="center"
            verticalAlign="middle"
            fontSize={radius * 0.9}
            fill="white"
            fontStyle="bold"
            listening={false}
            opacity={0.9}
          />
      )}
    </Group>
  );
};
