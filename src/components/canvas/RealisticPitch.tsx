import React from 'react';
import { Group, Rect, Circle, Line, Text } from 'react-konva';

interface RealisticPitchProps {
  id?: string;
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  draggable?: boolean;
  onClick?: (e: any) => void;
  onDragMove?: (e: any) => void;
  onDragEnd?: (e: any) => void;
}

export const RealisticPitch: React.FC<RealisticPitchProps> = ({
    id, name, x, y, width, height, rotation,
    draggable, onClick, onDragMove, onDragEnd
}) => {
  return (
    <Group
        id={id}
        x={x}
        y={y}
        rotation={rotation}
        draggable={draggable}
        onClick={onClick}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
    >
      {/* Outer Border (Concrete/Support Area) */}
      <Rect
        x={-width * 0.05}
        y={-height * 0.05}
        width={width * 1.1}
        height={height * 1.1}
        fill="#0f172a"
        stroke="#1e293b"
        strokeWidth={2}
        cornerRadius={8}
      />

      {/* Main Stage Area (Gray Theme) */}
      <Rect
        width={width}
        height={height}
        fill="#1e293b"
        stroke="#334155"
        strokeWidth={3}
        cornerRadius={4}
      />

      {/* Sub-Markings for better perspective (Grid-like) */}
      <Group opacity={0.1}>
        {Array.from({ length: 5 }).map((_, i) => (
            <React.Fragment key={i}>
                <Line points={[ (i+1) * (width/6), 0, (i+1) * (width/6), height]} stroke="white" strokeWidth={1} />
                <Line points={[ 0, (i+1) * (height/6), width, (i+1) * (height/6)]} stroke="white" strokeWidth={1} />
            </React.Fragment>
        ))}
      </Group>

      {/* Stage Layout Indicators (Abstracted) */}
      <Rect
        x={width * 0.1}
        y={height * 0.8}
        width={width * 0.8}
        height={height * 0.15}
        fill="#1E293B"
        cornerRadius={2}
        opacity={0.5}
      />

      {/* Center Detail */}
      <Circle
        x={width / 2}
        y={height / 2}
        radius={Math.min(width, height) * 0.1}
        stroke="#475569"
        strokeWidth={2}
        dash={[10, 5]}
        opacity={0.3}
      />

      {/* Dynamic Name Label */}
      <Text
        text={name?.toUpperCase() || 'ESCENARIO'}
        x={0}
        y={height / 2 - 10}
        width={width}
        align="center"
        fontSize={Math.max(14, width * 0.06)}
        fontFamily="monospace"
        fontStyle="bold"
        fill="#f8fafc"
        shadowColor="black"
        shadowBlur={10}
        shadowOpacity={0.5}
        opacity={1}
        listening={false}
      />
    </Group>
  );
};
