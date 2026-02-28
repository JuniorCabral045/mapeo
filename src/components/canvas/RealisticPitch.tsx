import React from 'react';
import { Group, Rect, Circle, Line } from 'react-konva';

interface RealisticPitchProps {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export const RealisticPitch: React.FC<RealisticPitchProps> = ({ x, y, width, height, rotation }) => {
  const stripeCount = 10;
  const stripeWidth = width / stripeCount;

  return (
    <Group x={x} y={y} rotation={rotation}>
      {/* Outer Border (Concrete/Track) */}
      <Rect
        x={-width * 0.1}
        y={-height * 0.1}
        width={width * 1.2}
        height={height * 1.2}
        fill="#f8fafc"
        stroke="#e2e8f0"
        strokeWidth={1}
        cornerRadius={width * 0.05}
        shadowBlur={20}
        shadowColor="rgba(0,0,0,0.03)"
      />

      {/* Grass Stripes */}
      <Group clipX={0} clipY={0} clipWidth={width} clipHeight={height}>
          {Array.from({ length: stripeCount }).map((_, i) => (
            <Rect
              key={i}
              x={i * stripeWidth}
              y={0}
              width={stripeWidth}
              height={height}
              fill={i % 2 === 0 ? '#10b981' : '#059669'}
            />
          ))}
      </Group>

      {/* Field Markings */}
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        stroke="rgba(255,255,255,0.8)"
        strokeWidth={2}
        listening={false}
      />

      {/* Half line */}
      <Line
        points={[width / 2, 0, width / 2, height]}
        stroke="rgba(255,255,255,0.8)"
        strokeWidth={2}
      />

      {/* Center Circle */}
      <Circle
        x={width / 2}
        y={height / 2}
        radius={height / 5}
        stroke="rgba(255,255,255,0.8)"
        strokeWidth={2}
      />
      <Circle
        x={width / 2}
        y={height / 2}
        radius={2}
        fill="rgba(255,255,255,0.8)"
      />

      {/* Penalty Areas */}
      <Group>
        {/* Left */}
        <Rect x={0} y={height / 4} width={width / 6} height={height / 2} stroke="rgba(255,255,255,0.8)" strokeWidth={2} />
        <Rect x={0} y={height * 0.35} width={width / 15} height={height * 0.3} stroke="rgba(255,255,255,0.8)" strokeWidth={2} />
        {/* Right */}
        <Rect x={width - width / 6} y={height / 4} width={width / 6} height={height / 2} stroke="rgba(255,255,255,0.8)" strokeWidth={2} />
        <Rect x={width - width / 15} y={height * 0.35} width={width / 15} height={height * 0.3} stroke="rgba(255,255,255,0.8)" strokeWidth={2} />
      </Group>

      {/* Corner Arcs */}
      <Group opacity={0.8}>
          <Circle x={0} y={0} radius={width/40} stroke="white" strokeWidth={2} />
          <Circle x={width} y={0} radius={width/40} stroke="white" strokeWidth={2} />
          <Circle x={0} y={height} radius={width/40} stroke="white" strokeWidth={2} />
          <Circle x={width} y={height} radius={width/40} stroke="white" strokeWidth={2} />
      </Group>
    </Group>
  );
};
