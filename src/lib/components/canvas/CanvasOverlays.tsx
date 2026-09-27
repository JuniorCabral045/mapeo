import React from 'react';
import { Circle, Line, Rect } from 'react-konva';
import type { Guide } from '../../utils/snapping';

const ACENTO = '#FF6B01';
const LARGO_GUIA = 10000;

/** Guías del imán a otros sectores, vigentes durante el arrastre. */
export const SnapGuides: React.FC<{ guias: Guide[]; scale: number }> = ({ guias, scale }) => (
  <>
    {guias.map((g, i) => (
      <Line
        key={`guia-${i}`}
        points={g.axis === 'v'
          ? [g.pos, -LARGO_GUIA, g.pos, LARGO_GUIA]
          : [-LARGO_GUIA, g.pos, LARGO_GUIA, g.pos]}
        stroke={ACENTO}
        strokeWidth={1 / scale}
        dash={[4 / scale, 4 / scale]}
        listening={false}
      />
    ))}
  </>
);

/** Polígono en dibujo: vértices puestos más una línea hasta el cursor. */
export const DraftPolygon: React.FC<{
  points: number[];
  cursor: { x: number; y: number } | null;
  scale: number;
}> = ({ points, cursor, scale }) => {
  if (points.length === 0) return null;
  const trazo = cursor ? [...points, cursor.x, cursor.y] : points;

  return (
    <>
      <Line points={trazo} stroke={ACENTO} strokeWidth={2 / scale} dash={[6, 4]} listening={false} />
      {points.map((_, i) =>
        i % 2 === 0 ? (
          <Circle key={i} x={points[i]} y={points[i + 1]} radius={4 / scale} fill={ACENTO} listening={false} />
        ) : null
      )}
    </>
  );
};

export interface CajaDeSeleccion {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** Rectángulo de la goma de selección. Llega en píxeles de pantalla y se dibuja en mundo. */
export const SelectionBox: React.FC<{
  caja: CajaDeSeleccion;
  view: { x: number; y: number; scale: number };
}> = ({ caja, view }) => (
  <Rect
    x={(Math.min(caja.x1, caja.x2) - view.x) / view.scale}
    y={(Math.min(caja.y1, caja.y2) - view.y) / view.scale}
    width={Math.abs(caja.x1 - caja.x2) / view.scale}
    height={Math.abs(caja.y1 - caja.y2) / view.scale}
    fill="rgba(255, 107, 1, 0.06)"
    stroke={ACENTO}
    strokeWidth={1 / view.scale}
    dash={[5, 3]}
  />
);
