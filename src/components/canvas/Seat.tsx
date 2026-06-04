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
  isInactive?: boolean;
}

export const Seat: React.FC<SeatProps> = ({
  element,
  isSelected,
  onSelect,
  onDragMove,
  onDragEnd,
  draggable,
  simplified = false,
  showLabels = 'none',
  isInactive = false
}) => {
  const groupRef = useRef<Konva.Group>(null);
  const { id, x, y, radius, status, locked, opacity, color, row, number } = element;

  useEffect(() => {
    // We only cache if it's not being interacted with or selected
    if (groupRef.current && !isSelected && !draggable && showLabels === 'none') {
      groupRef.current.cache();
    } else if (groupRef.current) {
      groupRef.current.clearCache();
    }
  }, [isSelected, draggable, status, color, opacity, showLabels, isInactive]);

  const getStatusColor = () => {
    if (isSelected) return '#FF6B00'; // Point Orange for selected
    if (color) return color;
    switch (status) {
      case 'available': return '#2DD4BF'; // Teal for available
      case 'occupied': return '#CBD5E1';  // Light Gray for occupied
      case 'blocked': return '#94A3B8';   // Slate for blocked
      case 'reserved': return '#F59E0B';  // Amber
      default: return '#CBD5E1';
    }
  };

  const seatColor = getStatusColor();

  if (simplified) {
    return (
      <Rect
        id={id}
        x={x - radius}
        y={y - radius}
        width={radius * 2}
        height={radius * 2}
        cornerRadius={radius * 0.4}
        fill={seatColor}
        opacity={status === 'occupied' ? 0.3 : 1}
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
      {/* Outer Glow for Selected */}
      {isSelected && (
          <Rect
            x={-(radius * 1.3)}
            y={-(radius * 1.3)}
            width={radius * 2.6}
            height={radius * 2.6}
            cornerRadius={radius * 0.6}
            fill="#FF6B00"
            opacity={0.15}
            listening={false}
          />
      )}

      {/* Seat Base - High Fidelity Rounded Rect */}
      <Rect
        x={-radius}
        y={-radius}
        width={radius * 2}
        height={radius * 2}
        cornerRadius={radius * 0.4}
        fill={isInactive ? '#E2E8F0' : seatColor}
        opacity={isInactive ? 0.3 : (status === 'occupied' ? 0.6 : opacity)}
        stroke={isSelected ? '#FF6B00' : (status === 'occupied' ? '#CBD5E1' : (isInactive ? 'transparent' : '#FFFFFF'))}
        strokeWidth={isSelected ? 1.5 : (status === 'occupied' ? 0.5 : 0.1)}
        shadowBlur={isSelected ? 8 : 0}
        shadowColor="#FF6B00"
        shadowOpacity={0.4}
        perfectDrawEnabled={false}
      />

      {/* Subtle Marker for Zoomed Out */}
      {showLabels === 'row' && (
          <Circle
            radius={radius * 0.2}
            fill="white"
            opacity={0.3}
            listening={false}
          />
      )}

      {/* Seat Number - Modern Monospace font for CAD look */}
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
            fill={status === 'occupied' ? '#475569' : 'white'}
            fontFamily="monospace"
            fontStyle="bold"
            listening={false}
            opacity={status === 'occupied' ? 0.5 : 0.8}
          />
      )}
    </Group>
  );
};
