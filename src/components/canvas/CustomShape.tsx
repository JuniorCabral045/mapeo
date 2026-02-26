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
      fill: isActive ? fill : '#e2e8f0',
      stroke: isSelected ? '#3b82f6' : (stroke || 'transparent'),
      strokeWidth: isSelected ? Math.max(1, strokeWidth || 0) : (strokeWidth || 0),
      opacity: isActive ? opacity : 0.6,
      onClick: onSelect,
      onTap: onSelect,
    };

    if (sectionType === 'rectangle' || element.type === 'stage') {
      if (typeof cornerRadius === 'object') {
        const pathData = createRoundedRectPath(0, 0, width, height, cornerRadius as CornerRadius);
        return <Path {...commonProps} data={pathData} />;
      }
      return (
        <Rect
          {...commonProps}
          width={width}
          height={height}
          cornerRadius={typeof cornerRadius === 'number' ? cornerRadius : 0}
        />
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
