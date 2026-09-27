import React from 'react';
import { Shape } from 'react-konva';
import { effectiveGridStep, visibleGridRect } from '../../utils/grid';
import { ViewState } from '../../types';

interface GridLayerProps {
  step: number;
  view: ViewState;
  viewport: { width: number; height: number };
}

/**
 * Grilla sobre el rectángulo visible. Lee la transformación en vivo del stage y
 * no `view`: al panear con la mano Konva redibuja cada frame sin pasar por
 * React, y `view` recién se actualiza al soltar. `view` queda de respaldo para
 * el primer render, cuando todavía no hay stage.
 */
export const GridLayer: React.FC<GridLayerProps> = React.memo(({ step, view, viewport }) => (
  <Shape
    listening={false}
    sceneFunc={(ctx, shape) => {
      const stage = shape.getStage();
      const vista = stage ? { x: stage.x(), y: stage.y(), scale: stage.scaleX() } : view;

      const paso = effectiveGridStep(step, vista.scale);
      const { minX, minY, maxX, maxY } = visibleGridRect(vista, viewport);
      const primeraX = Math.floor(minX / paso) * paso;
      const primeraY = Math.floor(minY / paso) * paso;

      ctx.setAttr('strokeStyle', '#DCE0E8');
      ctx.setAttr('lineWidth', 1 / vista.scale);
      ctx.beginPath();
      for (let x = primeraX; x <= maxX; x += paso) {
        ctx.moveTo(x, minY);
        ctx.lineTo(x, maxY);
      }
      for (let y = primeraY; y <= maxY; y += paso) {
        ctx.moveTo(minX, y);
        ctx.lineTo(maxX, y);
      }
      ctx.stroke();
    }}
  />
));
