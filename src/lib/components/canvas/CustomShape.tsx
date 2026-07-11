import React from 'react';
import { Path, Group, Rect, Circle, Text, Line, Arc } from 'react-konva';
import Konva from 'konva';
import { ShapeElement, CornerRadius } from '../../types';
import { createRoundedRectPath } from '../../utils/geometry';

interface CustomShapeProps {
  element: ShapeElement;
  isSelected: boolean;
  onSelect?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd?: (e: Konva.KonvaEventObject<Event>) => void;
  draggable?: boolean;
}

export const CustomShape: React.FC<CustomShapeProps> = ({
  element,
  isSelected,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  onTransformEnd,
  draggable = false,
}) => {
  const {
    id, x, y, width, height, rotation,
    fill, stroke, cornerRadius, sectionType, radius, name, isActive,
  } = element;

  const fillColor = isActive ? (element.type === 'stage' ? '#6F3E8F' : fill) : '#C7CBD4';
  const strokeColor = isSelected ? '#FF6B01' : stroke || (isActive ? fill : '#9AA1AE');
  // El escenario se pinta sólido (texto blanco encima); los sectores translúcidos
  const shapeOpacity = element.type === 'stage' ? (isActive ? 0.95 : 0.4) : isActive ? 0.35 : 0.15;

  const renderShape = () => {
    if (sectionType === 'polygon' && element.points && element.points.length >= 6) {
      return (
        <Line
          points={element.points}
          closed
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={isSelected ? 3 : 1.5}
          dash={isSelected ? [] : [10, 5]}
          opacity={shapeOpacity}
        />
      );
    }

    if (sectionType === 'arc') {
      return (
        <Arc
          innerRadius={element.innerRadius ?? 100}
          outerRadius={element.outerRadius ?? 200}
          angle={(element.endAngle ?? 340) - (element.startAngle ?? 200)}
          rotation={element.startAngle ?? 200}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={isSelected ? 3 : 1.5}
          dash={isSelected ? [] : [10, 5]}
          opacity={shapeOpacity}
        />
      );
    }

    if (sectionType === 'rectangle' || element.type === 'stage') {
      // Path para radios de esquina independientes; Rect para radio uniforme
      return typeof cornerRadius === 'object' ? (
        <Path
          data={createRoundedRectPath(0, 0, width, height, cornerRadius as CornerRadius)}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={isSelected ? 3 : 1.5}
          dash={isSelected ? [] : [10, 5]}
          opacity={shapeOpacity}
        />
      ) : (
        <Rect
          width={width}
          height={height}
          cornerRadius={typeof cornerRadius === 'number' ? cornerRadius : 0}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={isSelected ? 3 : 1.5}
          dash={isSelected ? [] : [10, 5]}
          opacity={shapeOpacity}
        />
      );
    }

    if (sectionType === 'circle') {
      return (
        <Circle
          radius={radius || width / 2}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={isSelected ? 3 : 1.5}
          dash={isSelected ? [] : [10, 5]}
          opacity={shapeOpacity}
        />
      );
    }

    return null;
  };

  return (
    <Group
      id={id}
      x={x}
      y={y}
      rotation={rotation}
      draggable={draggable && !element.locked}
      onClick={onSelect}
      onTap={onSelect}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onTransformEnd={onTransformEnd}
    >
      {renderShape()}
      {element.type === 'stage' && (
        <Text
          text={name.toUpperCase()}
          width={width}
          height={height}
          align="center"
          verticalAlign="middle"
          fill="white"
          fontStyle="bold"
          listening={false}
          fontSize={Math.max(10, Math.min(width, height) / 6)}
          opacity={0.9}
        />
      )}
    </Group>
  );
};
