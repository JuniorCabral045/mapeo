import React from 'react';
import { Path, Group, Rect, Circle, Text } from 'react-konva';
import { ShapeElement, CornerRadius } from '../../types/venue';
import { createRoundedRectPath } from '../../utils/geometry';

interface CustomShapeProps {
  element: ShapeElement;
  isSelected: boolean;
  onSelect: (e: any) => void;
  onDragMove?: (e: any) => void;
  onDragEnd: (e: any) => void;
  onTransformEnd: (e: any) => void;
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
    strokeWidth,
    cornerRadius,
    opacity,
    sectionType,
    radius,
    name,
    isActive
  } = element;

  const renderShape = () => {
    const commonProps = {
      id,
      fill: isActive ? (element.type === 'stage' ? '#8A5CF5' : fill) : '#E2E8F0',
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
              stroke={isSelected ? '#FF6B00' : (stroke || (isActive ? fill : '#CBD5E1'))}
              strokeWidth={isSelected ? 3 : 1.5}
              dash={isSelected ? [] : [8, 4]}
              opacity={isActive ? 0.4 : 0.2}
            />
          ) : (
            <Rect
              {...commonProps}
              width={width}
              height={height}
              cornerRadius={typeof cornerRadius === 'number' ? cornerRadius : 0}
              stroke={isSelected ? '#FF6B00' : (stroke || (isActive ? fill : '#CBD5E1'))}
              strokeWidth={isSelected ? 3 : 1.5}
              dash={isSelected ? [] : [8, 4]}
              opacity={isActive ? 0.4 : 0.2}
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
          fontSize={Math.max(10, Math.min(width, height) / 8)}
          opacity={isActive ? 1 : 0.5}
        />
      )}
    </Group>
  );
};
