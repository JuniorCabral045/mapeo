import React from 'react';
import { Path, Group, Rect, Circle, Text } from 'react-konva';
import Konva from 'konva';
import { ShapeElement, CornerRadius } from '../../types';
import { createRoundedRectPath } from '../../utils/geometry';

interface CustomShapeProps {
  element: ShapeElement;
  isSelected: boolean;
  onSelect?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd?: (e: Konva.KonvaEventObject<Event>) => void;
  draggable?: boolean;
}

export const CustomShape: React.FC<CustomShapeProps> = ({
  element,
  isSelected,
  onSelect,
  onDragMove,
  onDragEnd,
  onTransformEnd,
  draggable = false,
}) => {
  const {
    id, x, y, width, height, rotation,
    fill, stroke, cornerRadius, sectionType, radius, name, isActive,
  } = element;

  const renderShape = () => {
    const commonProps = {
      id,
      fill: isActive ? (element.type === 'stage' ? '#6F3E8F' : fill) : '#C7CBD4',
      onClick: onSelect,
      onTap: onSelect,
    };

    if (sectionType === 'rectangle' || element.type === 'stage') {
      const strokeColor = isSelected ? '#FF6B01' : stroke || (isActive ? fill : '#9AA1AE');
      // El escenario se pinta sólido (texto blanco encima); los sectores translúcidos
      const shapeOpacity = element.type === 'stage' ? (isActive ? 0.95 : 0.4) : isActive ? 0.35 : 0.15;
      // Path para radios de esquina independientes; Rect para radio uniforme
      return typeof cornerRadius === 'object' ? (
        <Path
          {...commonProps}
          data={createRoundedRectPath(0, 0, width, height, cornerRadius as CornerRadius)}
          stroke={strokeColor}
          strokeWidth={isSelected ? 3 : 1.5}
          dash={isSelected ? [] : [10, 5]}
          opacity={shapeOpacity}
        />
      ) : (
        <Rect
          {...commonProps}
          width={width}
          height={height}
          cornerRadius={typeof cornerRadius === 'number' ? cornerRadius : 0}
          stroke={strokeColor}
          strokeWidth={isSelected ? 3 : 1.5}
          dash={isSelected ? [] : [10, 5]}
          opacity={shapeOpacity}
        />
      );
    }

    if (sectionType === 'circle') {
      return <Circle {...commonProps} radius={radius || width / 2} />;
    }

    return null;
  };

  return (
    <Group
      x={x}
      y={y}
      rotation={rotation}
      draggable={draggable && !element.locked}
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
