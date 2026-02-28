import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Group, Line, Rect, Transformer } from 'react-konva';
import Konva from 'konva';
import { useVenueStore } from '../../store/useVenueStore';
import { CustomShape } from './CustomShape';
import { Seat as SeatComponent } from './Seat';
import { RealisticPitch } from './RealisticPitch';
import { calculateSnapping, SnappedPos } from '../../utils/snapping';

export const VenueCanvas: React.FC = () => {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  const {
    mode,
    elements,
    elementIds,
    selectedIds,
    viewState,
    gridConfig,
    spatialIndex,
    setViewState,
    selectElements,
    updateElement,
    moveElements,
    rebuildIndex,
    saveHistory
  } = useVenueStore();

  const [selectionBox, setSelectionBox] = useState<{ x1: number, y1: number, x2: number, y2: number } | null>(null);
  const [snapGuides, setSnapGuides] = useState<{ type: 'v' | 'h', pos: number }[]>([]);
  const dragStartPos = useRef<{ x: number, y: number } | null>(null);

  // Sync transformer
  useEffect(() => {
    if (transformerRef.current) {
      const stage = stageRef.current;
      if (!stage) return;
      const nodes = selectedIds
        .map(id => stage.findOne('#' + id))
        .filter(Boolean) as Konva.Node[];
      transformerRef.current.nodes(nodes);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedIds, elements]);

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

    const newScale = e.evt.deltaY < 0 ? oldScale * 1.1 : oldScale / 1.1;

    setViewState({
      scale: newScale,
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const isStage = e.target === stageRef.current;
    if (isStage) {
      const pos = stageRef.current?.getRelativePointerPosition();
      if (pos) {
        setSelectionBox({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
      }
      if (!e.evt.shiftKey) {
        selectElements([]);
      }
    }
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!selectionBox || !stageRef.current) return;
    const pos = stageRef.current.getRelativePointerPosition();
    if (pos) {
      setSelectionBox({ ...selectionBox, x2: pos.x, y2: pos.y });
    }
  };

  const handleMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (selectionBox) {
      const x1 = Math.min(selectionBox.x1, selectionBox.x2);
      const x2 = Math.max(selectionBox.x1, selectionBox.x2);
      const y1 = Math.min(selectionBox.y1, selectionBox.y2);
      const y2 = Math.max(selectionBox.y1, selectionBox.y2);

      const newlySelected = elementIds.filter(id => {
        const el = elements[id];
        if (!el) return false;

        let ex1, ey1, ex2, ey2;

        if (el.type === 'seat' || (el.type === 'section' && el.sectionType === 'circle')) {
            const r = (el as any).radius || 8;
            ex1 = el.x - r;
            ey1 = el.y - r;
            ex2 = el.x + r;
            ey2 = el.y + r;
        } else {
            const w = (el as any).width || 20;
            const h = (el as any).height || 20;
            ex1 = el.x;
            ey1 = el.y;
            ex2 = el.x + w;
            ey2 = el.y + h;
        }

        return ex1 >= x1 && ex2 <= x2 && ey1 >= y1 && ey2 <= y2;
      });

      if (e.evt.shiftKey) {
        selectElements([...selectedIds, ...newlySelected]);
      } else {
        selectElements(newlySelected);
      }
      setSelectionBox(null);
    }
  };

  const handleDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
    dragStartPos.current = { x: e.target.x(), y: e.target.y() };
  };

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>, id: string) => {
    if (mode !== 'edit') return;
    const el = elements[id];
    if (!el) return;

    const w = (el as any).width || (el as any).radius * 2 || 20;
    const h = (el as any).height || (el as any).radius * 2 || 20;

    const snapped = calculateSnapping(
      e.target.x(),
      e.target.y(),
      w,
      h,
      [id],
      spatialIndex,
      gridConfig
    );

    const dx = snapped.x - (dragStartPos.current?.x || e.target.x());
    const dy = snapped.y - (dragStartPos.current?.y || e.target.y());

    e.target.x(snapped.x);
    e.target.y(snapped.y);

    if (selectedIds.includes(id) && selectedIds.length > 1) {
        moveElements(selectedIds.filter(sid => sid !== id), dx, dy);
        dragStartPos.current = { x: snapped.x, y: snapped.y };
    }

    setSnapGuides(snapped.guides);
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>, id: string) => {
    if (!dragStartPos.current) return;

    updateElement(id, { x: e.target.x(), y: e.target.y() });
    setSnapGuides([]);
    rebuildIndex();
    saveHistory();
    dragStartPos.current = null;
  };

  const renderGrid = () => {
    if (!gridConfig.visible) return null;
    const size = gridConfig.size;
    const lines = [];
    const width = 5000;
    const height = 5000;

    for (let i = 0; i <= width / size; i++) {
      lines.push(
        <Line
          key={`v-${i}`}
          points={[i * size, 0, i * size, height]}
          stroke="#f3f4f6"
          strokeWidth={1 / viewState.scale}
          listening={false}
        />
      );
    }
    for (let i = 0; i <= height / size; i++) {
      lines.push(
        <Line
          key={`h-${i}`}
          points={[0, i * size, width, i * size]}
          stroke="#f3f4f6"
          strokeWidth={1 / viewState.scale}
          listening={false}
        />
      );
    }
    return <Group>{lines}</Group>;
  };

  const renderElement = (id: string) => {
    const el = elements[id];
    if (!el) return null;

    if (el.type === 'group') {
      return (
        <Group
          key={id}
          id={id}
          x={el.x}
          y={el.y}
          rotation={el.rotation}
          draggable={mode === 'edit'}
          onDragStart={handleDragStart}
          onDragMove={(e) => handleDragMove(e, id)}
          onDragEnd={(e) => handleDragEnd(e, id)}
          onClick={(e) => {
            if (mode !== 'edit') return;
            e.cancelBubble = true;
            selectElements([id], e.evt.shiftKey);
          }}
        >
          {(el as any).childrenIds.map((childId: string) => renderElement(childId))}
        </Group>
      );
    }

    if (el.type === 'section' || el.type === 'stage' || el.type === 'shape') {
      if (el.type === 'stage' && el.name.toLowerCase().includes('cancha')) {
          return (
              <RealisticPitch
                  key={id}
                  x={el.x}
                  y={el.y}
                  width={el.width}
                  height={el.height}
                  rotation={el.rotation}
              />
          );
      }
      return (
        <CustomShape
          key={id}
          element={el as any}
          isSelected={selectedIds.includes(id)}
              draggable={mode === 'edit'}
          onSelect={(e) => {
                if (mode !== 'edit') return;
            e.cancelBubble = true;
            selectElements([id], e.evt.shiftKey);
          }}
              onDragStart={handleDragStart}
          onDragMove={(e) => handleDragMove(e, id)}
              onDragEnd={(e) => handleDragEnd(e, id)}
          onTransformEnd={(e) => {
            const node = e.target;
            updateElement(id, {
              x: node.x(),
              y: node.y(),
              width: Math.max(5, node.width() * node.scaleX()),
              height: Math.max(5, node.height() * node.scaleY()),
              rotation: node.rotation()
            });
            node.scaleX(1);
            node.scaleY(1);
            rebuildIndex();
            saveHistory();
          }}
        />
      );
    }

    if (el.type === 'seat') {
      return (
        <SeatComponent
          key={id}
          element={el as any}
          isSelected={selectedIds.includes(id)}
              draggable={mode === 'edit'}
          onSelect={(e) => {
            e.cancelBubble = true;
                if (mode === 'edit') {
                    selectElements([id], e.evt.shiftKey);
                } else {
                    // Selection in view mode (booking)
                    if (el.type === 'seat' && (el as any).status === 'available') {
                        selectElements([id], true);
                    }
                }
          }}
              onDragStart={handleDragStart}
          onDragMove={(e) => handleDragMove(e, id)}
              onDragEnd={(e) => handleDragEnd(e, id)}
        />
      );
    }

    return null;
  };

  const isZoomedOut = viewState.scale < 0.4;
  const isVeryZoomedOut = viewState.scale < 0.15;
  const isExtremeZoomedOut = viewState.scale < 0.08;

  return (
    <div className="w-full h-full bg-[#f8fafc] overflow-hidden outline-none">
      <Stage
        width={window.innerWidth - 320}
        height={window.innerHeight - 56}
        ref={stageRef}
        scaleX={viewState.scale}
        scaleY={viewState.scale}
        x={viewState.x}
        y={viewState.y}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        draggable={!selectionBox}
      >
        <Layer>
          {renderGrid()}

          {elementIds.map(id => {
            const el = elements[id];
            if (!el || el.parentId) return null;
            return renderElement(id);
          })}

          {/* Snap Guides */}
          {snapGuides.map((guide, i) => (
            <Line
              key={i}
              points={guide.type === 'v' ? [guide.pos, -5000, guide.pos, 5000] : [-5000, guide.pos, 5000, guide.pos]}
              stroke="#3b82f6"
              strokeWidth={1 / viewState.scale}
              dash={[5, 5]}
            />
          ))}

          <Transformer
            ref={transformerRef}
            rotateEnabled={true}
            anchorSize={8 / viewState.scale}
            borderStroke="#3b82f6"
            anchorStroke="#3b82f6"
            anchorFill="white"
            anchorCornerRadius={2}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 5 || newBox.height < 5) return oldBox;
              return newBox;
            }}
          />

          {selectionBox && (
            <Rect
              x={Math.min(selectionBox.x1, selectionBox.x2)}
              y={Math.min(selectionBox.y1, selectionBox.y2)}
              width={Math.abs(selectionBox.x2 - selectionBox.x1)}
              height={Math.abs(selectionBox.y2 - selectionBox.y1)}
              fill="rgba(59, 130, 246, 0.1)"
              stroke="#3b82f6"
              strokeWidth={1 / viewState.scale}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
};
