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
  /** Escala del lienzo. Se usa para no dibujar rótulos ilegibles. */
  scale?: number;
  /** Segunda línea bajo el nombre, p. ej. «320 asientos». */
  subtitle?: string;
  /**
   * Dibujar el nombre del sector sobre la figura. Apagado por omisión: con los
   * sectores llenos de butacas el texto encima estorba más de lo que ayuda, así
   * que se prende desde la barra cuando hace falta ubicarse. El escenario es la
   * excepción y siempre lleva su nombre — es una figura sólida y vacía.
   */
  showLabel?: boolean;
}

/** Tamaño de letra por debajo del cual el rótulo es una mancha y conviene no dibujarlo. */
const MINIMO_LEGIBLE_PX = 9;

/**
 * Dónde va el rótulo del sector, en coordenadas locales del grupo.
 *
 * Cada forma tiene su propio origen: los rectángulos y polígonos nacen en su
 * esquina, los círculos y los anillos están centrados en el origen. Sin esto,
 * el nombre de un sector curvo caía lejos de su tribuna.
 */
const ubicacionDelRotulo = (element: ShapeElement) => {
  const { width, height, sectionType } = element;

  if (sectionType === 'circle') {
    const r = element.radius || width / 2;
    return { cx: 0, cy: 0, ancho: r * 2, tamano: Math.max(10, r / 3) };
  }

  if (sectionType === 'arc') {
    const interior = element.innerRadius ?? 0;
    const exterior = element.outerRadius ?? width / 2;
    const grados = ((element.startAngle ?? 0) + (element.endAngle ?? 0)) / 2;
    const radio = (interior + exterior) / 2;
    const rad = (grados * Math.PI) / 180;
    const grosor = Math.max(10, exterior - interior);
    return {
      cx: radio * Math.cos(rad),
      cy: radio * Math.sin(rad),
      ancho: grosor * 2.5,
      tamano: Math.max(10, grosor / 3),
    };
  }

  return {
    cx: width / 2,
    cy: height / 2,
    ancho: width,
    tamano: Math.max(10, Math.min(width, height) / 6),
  };
};

export const CustomShape: React.FC<CustomShapeProps> = ({
  element,
  isSelected,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  onTransformEnd,
  draggable = false,
  scale = 1,
  subtitle,
  showLabel = false,
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

  // El rótulo se omite cuando el zoom lo dejaría en una mancha de píxeles.
  const candidato = ubicacionDelRotulo(element);
  const conRotulo = element.type === 'stage' || showLabel;
  const rotulo = conRotulo && candidato.tamano * scale >= MINIMO_LEGIBLE_PX ? candidato : null;

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
      {rotulo && (
        // El rótulo se contra-rota: si heredara la rotación del sector, una
        // tribuna girada lo mostraría de costado o cabeza abajo. Va en su propio
        // grupo centrado en el ancla, así que acompaña al sector sin torcerse.
        <Group x={rotulo.cx} y={rotulo.cy} rotation={-rotation} listening={false}>
          <Text
            text={element.type === 'stage' ? name.toUpperCase() : name}
            x={-rotulo.ancho / 2}
            y={subtitle ? -rotulo.tamano : -rotulo.tamano / 2}
            width={rotulo.ancho}
            align="center"
            fill={element.type === 'stage' ? '#FFFFFF' : '#3F3352'}
            fontStyle="bold"
            fontSize={rotulo.tamano}
            opacity={isActive ? 0.9 : 0.45}
          />
          {subtitle && (
            <Text
              text={subtitle}
              x={-rotulo.ancho / 2}
              y={rotulo.tamano * 0.25}
              width={rotulo.ancho}
              align="center"
              fill={element.type === 'stage' ? '#FFFFFF' : '#6F3E8F'}
              fontSize={rotulo.tamano * 0.62}
              opacity={0.65}
            />
          )}
        </Group>
      )}
    </Group>
  );
};
