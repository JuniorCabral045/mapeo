import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect, Transformer } from 'react-konva';
import Konva from 'konva';
import { useVenueStore } from '../../store/useVenueStore';
import { useShallow } from 'zustand/react/shallow';
import { Seat } from './Seat';
import { CustomShape } from './CustomShape';
import { BackgroundLayer } from './BackgroundLayer';
import { GridLayer } from './GridLayer';
import { DraftPolygon, SelectionBox, SnapGuides, type CajaDeSeleccion } from './CanvasOverlays';
import { useContainerSize } from '../../hooks/useContainerSize';
import { usePolygonDraft } from '../../hooks/usePolygonDraft';
import { useCanvasGestures } from '../../hooks/useCanvasGestures';
import { transformerConfigFor } from '../../utils/transformer';
import { seatLabelMode, subtitulosDeSector } from '../../utils/labels';
import { alternarEnSeleccion } from '../../utils/selection';
import { zoomAt } from '../../utils/bounds';
import { ShapeElement, SeatElement } from '../../types';

export const EditorCanvas: React.FC = () => {
  const { elements, elementIds, selectedIds, viewState, setViewState, gridConfig, currentTool, sectorLabels, selectElements, setCanvasSize } = useVenueStore(
    useShallow((s) => ({ elements: s.elements, elementIds: s.elementIds, selectedIds: s.selectedIds, viewState: s.viewState, setViewState: s.setViewState, gridConfig: s.gridConfig, currentTool: s.currentTool, sectorLabels: s.sectorLabels, selectElements: s.selectElements, setCanvasSize: s.setCanvasSize }))
  );

  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dimensions = useContainerSize(containerRef, { width: 1000, height: 800 }, setCanvasSize);
  const [selectionBox, setSelectionBox] = useState<CajaDeSeleccion | null>(null);
  const borrador = usePolygonDraft();
  const gestos = useCanvasGestures(stageRef);

  // Los asientos se mueven pero no se escalan: el transformer solo toma sectores y escenarios.
  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;
    const nodes = selectedIds
      .filter((id) => elements[id] && elements[id].type !== 'seat')
      .map((id) => stageRef.current?.findOne(`#${id}`))
      .filter((n): n is Konva.Node => !!n);
    transformer.nodes(nodes);
    transformer.getLayer()?.batchDraw();
  }, [selectedIds, elements]);

  const toWorld = (pointer: { x: number; y: number }) => ({
    x: (pointer.x - viewState.x) / viewState.scale,
    y: (pointer.y - viewState.y) / viewState.scale,
  });

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    const pointer = stage?.getPointerPosition();
    if (!stage || !pointer) return;
    const vista = { scale: stage.scaleX(), x: stage.x(), y: stage.y() };
    setViewState(zoomAt(vista, pointer, e.evt.deltaY > 0 ? 0.9 : 1.1));
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (currentTool === 'pan') return;
    const pointer = e.target.getStage()?.getPointerPosition();
    if (!pointer) return;

    if (currentTool === 'polygon') {
      borrador.addPoint(toWorld(pointer));
      return;
    }
    if (e.target === e.target.getStage()) {
      setSelectionBox({ x1: pointer.x, y1: pointer.y, x2: pointer.x, y2: pointer.y });
      selectElements([]);
    }
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const pointer = e.target.getStage()?.getPointerPosition();
    if (!pointer) return;
    if (currentTool === 'polygon') {
      borrador.setCursor(toWorld(pointer));
      return;
    }
    if (currentTool === 'pan' || !selectionBox) return;
    setSelectionBox({ ...selectionBox, x2: pointer.x, y2: pointer.y });
  };

  const handleMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!selectionBox) return;
    const stage = e.target.getStage()!;
    const minX = Math.min(selectionBox.x1, selectionBox.x2);
    const maxX = Math.max(selectionBox.x1, selectionBox.x2);
    const minY = Math.min(selectionBox.y1, selectionBox.y2);
    const maxY = Math.max(selectionBox.y1, selectionBox.y2);

    selectElements(elementIds.filter((id) => {
      const pos = stage.findOne(`#${id}`)?.getAbsolutePosition();
      return !!pos && pos.x >= minX && pos.x <= maxX && pos.y >= minY && pos.y <= maxY;
    }));
    setSelectionBox(null);
  };

  const subtitulos = useMemo(
    () => (sectorLabels ? subtitulosDeSector(elements, elementIds) : {}),
    [sectorLabels, elements, elementIds]
  );

  const transformerConfig = useMemo(
    () => transformerConfigFor(selectedIds.map((id) => elements[id]).filter(Boolean)),
    [selectedIds, elements]
  );

  const alSeleccionar = (id: string) => (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (currentTool !== 'select') return;
    e.cancelBubble = true;
    selectElements(alternarEnSeleccion(selectedIds, id, e.evt.shiftKey));
  };

  const labels = seatLabelMode(viewState.scale);
  const cursorClass = currentTool === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair';

  return (
    <div ref={containerRef} className={`w-full h-full bg-[#F3F4F6] overflow-hidden ${cursorClass}`}>
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        scaleX={viewState.scale}
        scaleY={viewState.scale}
        x={viewState.x}
        y={viewState.y}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDblClick={() => currentTool === 'polygon' && borrador.close()}
        ref={stageRef}
        draggable={currentTool === 'pan'}
        onDragEnd={(e) => {
          if (e.target === stageRef.current) setViewState({ x: e.target.x(), y: e.target.y() });
        }}
      >
        <Layer>
          <Rect x={-2500} y={-2500} width={10000} height={10000} fill="#F3F4F6" listening={false} />
          <BackgroundLayer />
          {gridConfig.visible && <GridLayer step={gridConfig.size} view={viewState} viewport={dimensions} />}

          {elementIds.map((id) => {
            const el = elements[id];
            if (!el || el.type === 'seat') return null;
            return (
              <CustomShape
                key={id}
                element={el as ShapeElement}
                isSelected={selectedIds.includes(id)}
                scale={viewState.scale}
                showLabel={sectorLabels}
                subtitle={subtitulos[id]}
                draggable={currentTool === 'select'}
                onSelect={alSeleccionar(id)}
                onDragStart={() => gestos.onDragStart(id)}
                onDragMove={(e) => gestos.onDragMove(id, e)}
                onDragEnd={(e) => gestos.onDragEnd(id, e)}
                onTransformEnd={(e) => gestos.onTransformEnd(id, e)}
              />
            );
          })}

          {elementIds.map((id) => {
            const el = elements[id];
            if (el?.type !== 'seat') return null;
            const seat = el as SeatElement;
            const section = seat.sectionId ? (elements[seat.sectionId] as ShapeElement | undefined) : undefined;
            const isInactive = section?.isActive === false;

            return (
              <Seat
                key={id}
                element={seat}
                isSelected={selectedIds.includes(id)}
                draggable={currentTool === 'select' && !isInactive}
                showLabels={labels}
                isInactive={isInactive}
                onSelect={alSeleccionar(id)}
                onDragStart={() => gestos.onDragStart(id)}
                onDragMove={(e) => gestos.onDragMove(id, e)}
                onDragEnd={(e) => gestos.onDragEnd(id, e)}
              />
            );
          })}

          <SnapGuides guias={gestos.guias} scale={viewState.scale} />
          <DraftPolygon points={borrador.points} cursor={borrador.cursor} scale={viewState.scale} />
          {selectionBox && <SelectionBox caja={selectionBox} view={viewState} />}

          <Transformer
            ref={transformerRef}
            rotateEnabled
            keepRatio={transformerConfig.keepRatio}
            enabledAnchors={transformerConfig.anchors}
            boundBoxFunc={(oldBox, newBox) => (newBox.width < 10 || newBox.height < 10 ? oldBox : newBox)}
            anchorFill="#FF6B01"
            anchorStroke="#FFFFFF"
            anchorCornerRadius={3}
            borderStroke="#FF6B01"
          />
        </Layer>
      </Stage>
    </div>
  );
};
