import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Stage, Layer, Rect, Group, Transformer, Circle } from 'react-konva';
import { useVenueStore } from '../../store/useVenueStore';
import { Seat } from './Seat';
import { RealisticPitch } from './RealisticPitch';
import { snapToGrid } from '../../utils/snapping';
import Konva from 'konva';
import { ShapeElement } from '../../types/venue';

export const VenueCanvas: React.FC = () => {
  const {
    elements, elementIds, selectedIds,
    viewState, setViewState,
    gridConfig, mode, currentTool,
    moveElements, selectElements, updateElement
  } = useVenueStore();

  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  // Selection Logic (Marquee)
  const [selectionBox, setSelectionBox] = useState<{ x1: number, y1: number, x2: number, y2: number } | null>(null);

  // Update Transformer Selection
  useEffect(() => {
    if (transformerRef.current) {
        const nodes = selectedIds
            .map(id => stageRef.current?.findOne(`#${id}`))
            .filter((n): n is Konva.Node => !!n);
        transformerRef.current.nodes(nodes);
        transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedIds]);

  const handleWheel = (e: any) => {
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

  const handleMouseDown = (e: any) => {
    if (currentTool === 'pan') return;

    if (e.target === e.target.getStage()) {
      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();
      setSelectionBox({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
      selectElements([]);
    }
  };

  const handleMouseMove = (e: any) => {
    if (currentTool === 'pan') return;

    if (selectionBox) {
      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();
      setSelectionBox({ ...selectionBox, x2: pos.x, y2: pos.y });
    }
  };

  const handleMouseUp = (e: any) => {
    if (selectionBox) {
      const stage = e.target.getStage();
      const box = {
        x: Math.min(selectionBox.x1, selectionBox.x2),
        y: Math.min(selectionBox.y1, selectionBox.y2),
        width: Math.abs(selectionBox.x1 - selectionBox.x2),
        height: Math.abs(selectionBox.y1 - selectionBox.y2),
      };

      const selected = elementIds.filter(id => {
        const node = stage.findOne(`#${id}`);
        if (!node) return false;
        const pos = node.getAbsolutePosition();
        return (
          pos.x >= box.x &&
          pos.x <= box.x + box.width &&
          pos.y >= box.y &&
          pos.y <= box.y + box.height
        );
      });

      selectElements(selected);
      setSelectionBox(null);
    }
  };

  // Modern CAD Grid
  const Grid = useMemo(() => {
    if (!gridConfig.visible || mode === 'view') return null;
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
                fill={i % 5 === 0 ? "#1E293B" : "#0F172A"}
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
                fill={j % 5 === 0 ? "#1E293B" : "#0F172A"}
                opacity={0.3}
                listening={false}
            />
        );
    }
    return <Group opacity={0.5}>{lines}</Group>;
  }, [gridConfig, mode]);

  const showLabels = useMemo(() => {
    if (viewState.scale > 1.2) return 'all';
    if (viewState.scale > 0.6) return 'row';
    return 'none';
  }, [viewState.scale]);

  const cursorClass = currentTool === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair';

  return (
    <div className={`w-full h-full bg-[#0B0F19] overflow-hidden ${cursorClass}`}>
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
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
          {/* Subtle Background Layer */}
          <Rect
            x={-2500} y={-2500}
            width={10000} height={10000}
            fill="#0B0F19"
            listening={false}
          />
          {Grid}

          {/* Render Sections (Shapes) first */}
          {elementIds.map(id => {
            const el = elements[id];
            if (el.type !== 'section' && el.type !== 'stage') return null;
            const shape = el as ShapeElement;
            const isSelected = selectedIds.includes(id);

            return (
              <Group
                key={id}
                id={id}
                x={el.x}
                y={el.y}
                rotation={el.rotation}
                draggable={mode === 'edit' && currentTool === 'select' && !el.locked}
                onClick={(e) => {
                    if (currentTool === 'pan') return;
                    e.cancelBubble = true;
                    if (mode === 'edit') selectElements(e.evt.shiftKey ? [...selectedIds, id] : [id]);
                }}
                onDragMove={(e) => {
                    if (gridConfig.enabled) {
                        const { x, y } = snapToGrid(e.target.x(), e.target.y(), gridConfig.size);
                        e.target.x(x);
                        e.target.y(y);
                    }
                }}
                onDragEnd={(e) => {
                    updateElement(id, { x: e.target.x(), y: e.target.y() });
                    useVenueStore.getState().saveHistory();
                }}
                opacity={shape.isActive ? el.opacity : el.opacity * 0.3}
              >
                {el.type === 'stage' ? (
                   <RealisticPitch
                     id={id}
                     x={0} y={0}
                     width={shape.width} height={shape.height}
                     rotation={0}
                   />
                ) : (
                  <Rect
                    width={shape.width}
                    height={shape.height}
                    fill={shape.fill || '#3b82f6'}
                    opacity={0.1}
                    stroke={isSelected ? '#3B82F6' : (shape.fill || '#3b82f6')}
                    strokeWidth={isSelected ? 2 : 1}
                    dash={isSelected ? [] : [10, 5]}
                    cornerRadius={typeof shape.cornerRadius === 'number' ? shape.cornerRadius : 8}
                  />
                )}
              </Group>
            );
          })}

          {/* Render Seats on top */}
          {elementIds.map(id => {
            const el = elements[id];
            if (el.type !== 'seat') return null;
            const isSelected = selectedIds.includes(id);

            return (
              <Seat
                key={id}
                element={el as any}
                isSelected={isSelected}
                draggable={mode === 'edit' && currentTool === 'select'}
                showLabels={showLabels}
                onSelect={(e) => {
                    if (currentTool === 'pan') return;
                    e.cancelBubble = true;
                    if (mode === 'edit') selectElements(e.evt.shiftKey ? [...selectedIds, id] : [id]);
                    else {
                        // User Interaction: Toggle Selection
                        const current = new Set(selectedIds);
                        if (current.has(id)) current.delete(id);
                        else current.add(id);
                        selectElements(Array.from(current));
                    }
                }}
                onDragMove={(e) => {
                    if (gridConfig.enabled) {
                        const { x, y } = snapToGrid(e.target.x(), e.target.y(), gridConfig.size);
                        e.target.x(x);
                        e.target.y(y);
                    }
                }}
                onDragEnd={(e) => {
                    updateElement(id, { x: e.target.x(), y: e.target.y() });
                    useVenueStore.getState().saveHistory();
                }}
              />
            );
          })}

          {/* Marquee Selection Box */}
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

          {/* Transformers Layer */}
          {mode === 'edit' && (
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
          )}
        </Layer>
      </Stage>
    </div>
  );
};
