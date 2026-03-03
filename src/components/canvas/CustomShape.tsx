import React from 'react';
import { Path, Group, Rect, Circle, Text } from 'react-konva';
import { ShapeElement, CornerRadius } from '../../types/venue';
import { createRoundedRectPath } from '../../utils/geometry';
import Konva from 'konva';

interface CustomShapeProps {
  element: ShapeElement;
  isSelected: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd: (e: Konva.KonvaEventObject<Event>) => void;
  draggable: boolean;
}

export const CustomShape: React.FC<CustomShapeProps> = ({
  element,
  isSelected,
  onSelect,
  onDragMove,
  onDragEnd,
  onTransformEnd,
  draggable
}) => {
  const {
    id,
    x,
    y,
    width,
    height,
    rotation,
    fill,
    stroke,
    cornerRadius,
    sectionType,
    radius,
    name,
    isActive
  } = element;

  const renderShape = () => {
    const commonProps = {
      id,
      fill: isActive ? (element.type === 'stage' ? '#1e293b' : fill) : '#334155',
      onClick: onSelect,
      onTap: onSelect,
    };

    if (sectionType === 'rectangle' || element.type === 'stage') {
      return (
        <Group>
          {/* Main Shape */}
          {typeof cornerRadius === 'object' ? (
            <Path 
              {...commonProps} 
              data={createRoundedRectPath(0, 0, width, height, cornerRadius as CornerRadius)} 
              stroke={isSelected ? '#3B82F6' : (stroke || (isActive ? fill : '#94a3b8'))}
              strokeWidth={isSelected ? 3 : 1.5}
              dash={isSelected ? [] : [10, 5]}
              opacity={isActive ? 0.3 : 0.1}
            />
          ) : (
            <Rect
              {...commonProps}
              width={width}
              height={height}
              cornerRadius={0}
              stroke={isSelected ? '#3B82F6' : (stroke || (isActive ? fill : '#94a3b8'))}
              strokeWidth={isSelected ? 3 : 1.5}
              dash={isSelected ? [] : [10, 5]}
              opacity={isActive ? 0.3 : 0.1}
            />
          )}
          
        </Group>
      );
    }

    if (sectionType === 'circle') {
      return (
        <Circle
          {...commonProps}
          radius={radius || width / 2}
        />
      );
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
