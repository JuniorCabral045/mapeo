import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Stage, Layer, Rect, Group, Transformer } from 'react-konva';
import Konva from 'konva';
import { useVenueStore } from '../../store/useVenueStore';
import { Seat } from './Seat';
import { CustomShape } from './CustomShape';
import { snapToGrid } from '../../utils/grid';
import { ShapeElement, SeatElement } from '../../types';

export const EditorCanvas: React.FC = () => {
  const {
    elements, elementIds, selectedIds,
    viewState, setViewState,
    gridConfig, currentTool,
    selectElements, updateElement,
  } = useVenueStore();

  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 800 });
  const [selectionBox, setSelectionBox] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (transformerRef.current) {
      const nodes = selectedIds
        .map((id) => stageRef.current?.findOne(`#${id}`))
        .filter((n): n is Konva.Node => !!n);
      transformerRef.current.nodes(nodes);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedIds]);

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const delta = e.evt.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.05, Math.min(5, oldScale * delta));

    setViewState({
      scale: newScale,
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (currentTool === 'pan') return;
    if (e.target === e.target.getStage()) {
      const pos = e.target.getStage()!.getPointerPosition()!;
      setSelectionBox({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
      selectElements([]);
    }
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (currentTool === 'pan' || !selectionBox) return;
    const pos = e.target.getStage()!.getPointerPosition()!;
    setSelectionBox({ ...selectionBox, x2: pos.x, y2: pos.y });
  };

  const handleMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!selectionBox) return;
    const stage = e.target.getStage()!;
    const box = {
      x: Math.min(selectionBox.x1, selectionBox.x2),
      y: Math.min(selectionBox.y1, selectionBox.y2),
      width: Math.abs(selectionBox.x1 - selectionBox.x2),
      height: Math.abs(selectionBox.y1 - selectionBox.y2),
    };

    const selected = elementIds.filter((id) => {
      const node = stage.findOne(`#${id}`);
      if (!node) return false;
      const pos = node.getAbsolutePosition();
      return (
        pos.x >= box.x && pos.x <= box.x + box.width &&
        pos.y >= box.y && pos.y <= box.y + box.height
      );
    });

    selectElements(selected);
    setSelectionBox(null);
  };

  const Grid = useMemo(() => {
    if (!gridConfig.visible) return null;
    const size = gridConfig.size;
    const lines = [];
    const width = 5000;
    const height = 5000;

    for (let i = 0; i < width / size; i++) {
      lines.push(
        <Rect
          key={`v-${i}`}
          x={i * size} y={0}
          width={0.5} height={height}
          fill={i % 5 === 0 ? '#1E293B' : '#0F172A'}
          opacity={0.3}
          listening={false}
        />
      );
    }
    for (let j = 0; j < height / size; j++) {
      lines.push(
        <Rect
          key={`h-${j}`}
          x={0} y={j * size}
          width={width} height={0.5}
          fill={j % 5 === 0 ? '#1E293B' : '#0F172A'}
          opacity={0.3}
          listening={false}
        />
      );
    }
    return <Group opacity={0.5}>{lines}</Group>;
  }, [gridConfig]);

  const showLabels = useMemo(() => {
    if (viewState.scale > 1.2) return 'all' as const;
    if (viewState.scale > 0.6) return 'row' as const;
    return 'none' as const;
  }, [viewState.scale]);

  const cursorClass = currentTool === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair';

  const handleGridSnap = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (gridConfig.enabled) {
      const { x, y } = snapToGrid(e.target.x(), e.target.y(), gridConfig.size);
      e.target.x(x);
      e.target.y(y);
    }
  };

  return (
    <div ref={containerRef} className={`w-full h-full bg-[#0B0F19] overflow-hidden ${cursorClass}`}>
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
        ref={stageRef}
        draggable={currentTool === 'pan' || !selectionBox}
        onDragEnd={(e) => {
          if (e.target === stageRef.current) {
            setViewState({ x: e.target.x(), y: e.target.y() });
          }
        }}
      >
        <Layer>
          <Rect x={-2500} y={-2500} width={10000} height={10000} fill="#0B0F19" listening={false} />
          {Grid}

          {/* Sectores y escenarios primero */}
          {elementIds.map((id) => {
            const el = elements[id];
            if (!el || (el.type !== 'section' && el.type !== 'stage')) return null;
            const shape = el as ShapeElement;
            const isSelected = selectedIds.includes(id);

            return (
              <CustomShape
                key={id}
                element={shape}
                isSelected={isSelected}
                draggable={currentTool === 'select'}
                onSelect={(e) => {
                  if (currentTool === 'pan') return;
                  e.cancelBubble = true;
                  selectElements(e.evt.shiftKey ? [...selectedIds, id] : [id]);
                }}
                onDragMove={handleGridSnap}
                onDragEnd={(e) => {
                  updateElement(id, { x: e.target.x(), y: e.target.y() });
                  useVenueStore.getState().saveHistory();
                }}
                onTransformEnd={(e) => {
                  const node = e.target;
                  const scaleX = node.scaleX();
                  const scaleY = node.scaleY();
                  node.scaleX(1);
                  node.scaleY(1);
                  updateElement(id, {
                    x: node.x(),
                    y: node.y(),
                    width: Math.max(5, node.width() * scaleX),
                    height: Math.max(5, node.height() * scaleY),
                    rotation: node.rotation(),
                  });
                  useVenueStore.getState().saveHistory();
                }}
              />
            );
          })}

          {/* Asientos encima */}
          {elementIds.map((id) => {
            const el = elements[id];
            if (!el || el.type !== 'seat') return null;
            const seat = el as SeatElement;
            const isSelected = selectedIds.includes(id);
            const section = seat.sectionId ? (elements[seat.sectionId] as ShapeElement | undefined) : undefined;
            const isInactive = !!section && section.isActive === false;

            return (
              <Seat
                key={id}
                element={seat}
                isSelected={isSelected}
                draggable={currentTool === 'select' && !isInactive}
                showLabels={showLabels}
                isInactive={isInactive}
                onSelect={(e) => {
                  if (currentTool === 'pan') return;
                  e.cancelBubble = true;
                  selectElements(e.evt.shiftKey ? [...selectedIds, id] : [id]);
                }}
                onDragMove={handleGridSnap}
                onDragEnd={(e) => {
                  updateElement(id, { x: e.target.x(), y: e.target.y() });
                  useVenueStore.getState().saveHistory();
                }}
              />
            );
          })}

          {selectionBox && (
            <Rect
              x={Math.min(selectionBox.x1, selectionBox.x2) / viewState.scale - viewState.x / viewState.scale}
              y={Math.min(selectionBox.y1, selectionBox.y2) / viewState.scale - viewState.y / viewState.scale}
              width={Math.abs(selectionBox.x1 - selectionBox.x2) / viewState.scale}
              height={Math.abs(selectionBox.y1 - selectionBox.y2) / viewState.scale}
              fill="rgba(59, 130, 246, 0.05)"
              stroke="#3B82F6"
              strokeWidth={1 / viewState.scale}
              dash={[5, 3]}
            />
          )}

          <Transformer
            ref={transformerRef}
            rotateEnabled
            enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 10 || newBox.height < 10) return oldBox;
              return newBox;
            }}
            anchorFill="#3B82F6"
            anchorStroke="#FFFFFF"
            anchorCornerRadius={3}
            borderStroke="#3B82F6"
          />
        </Layer>
      </Stage>
    </div>
  );
};
