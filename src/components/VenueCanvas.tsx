import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Rect, Circle, Group, Transformer, Line, Text } from 'react-konva';
import Konva from 'konva';
import { EditorState } from '../types/venue';

interface VenueCanvasProps {
  state: EditorState;
  dispatch: any;
}

export const VenueCanvas: React.FC<VenueCanvasProps> = ({ state, dispatch }) => {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const dragStartPos = useRef<{ x: number, y: number } | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selectionBox, setSelectionBox] = useState<{ x1: number, y1: number, x2: number, y2: number } | null>(null);

  useEffect(() => {
    if (transformerRef.current) {
        const stage = transformerRef.current.getStage();
        if (!stage) return;
        const selectedNodes = state.selectedIds.map(id => stage.findOne('#' + id)).filter(Boolean) as Konva.Node[];
        transformerRef.current.nodes(selectedNodes);
        transformerRef.current.getLayer()?.batchDraw();
    }
  }, [state.selectedIds, state.current]);

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
    setScale(newScale);

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    setPosition(newPos);
  };

  const snapValue = (val: number) => {
    if (!state.current.snapToGrid) return val;
    return Math.round(val / state.current.gridSize) * state.current.gridSize;
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === stageRef.current) {
      const pos = stageRef.current.getPointerPosition();
      if (pos) {
        setSelectionBox({
            x1: (pos.x - position.x) / scale,
            y1: (pos.y - position.y) / scale,
            x2: (pos.x - position.x) / scale,
            y2: (pos.y - position.y) / scale
        });
      }
      if (!e.evt.shiftKey) {
        dispatch({ type: 'SELECT_ITEMS', ids: [] });
      }
    }
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!selectionBox || !stageRef.current) return;
    const pos = stageRef.current.getPointerPosition();
    if (pos) {
        setSelectionBox({ ...selectionBox, x2: (pos.x - position.x) / scale, y2: (pos.y - position.y) / scale });
    }
  };

  const handleMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (selectionBox) {
        const { x1, y1, x2, y2 } = selectionBox;
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);

        const selectedSeats = state.current.seats.filter(s => s.x >= minX && s.x <= maxX && s.y >= minY && s.y <= maxY).map(s => s.id);
        const selectedSections = state.current.sections.filter(s => s.x >= minX && s.x <= maxX && s.y >= minY && s.y <= maxY).map(s => s.id);

        const ids = [...selectedSeats, ...selectedSections];
        if (ids.length > 0) {
            if (e.evt.shiftKey) {
                const combined = Array.from(new Set([...state.selectedIds, ...ids]));
                dispatch({ type: 'SELECT_ITEMS', ids: combined });
            } else {
                dispatch({ type: 'SELECT_ITEMS', ids });
            }
        }
        setSelectionBox(null);
    }
  };

  const handleDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
    dragStartPos.current = { x: e.target.x(), y: e.target.y() };
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>, id: string, type: 'seat' | 'section') => {
    if (!dragStartPos.current) return;

    const dx = snapValue(e.target.x()) - snapValue(dragStartPos.current.x);
    const dy = snapValue(e.target.y()) - snapValue(dragStartPos.current.y);

    if (state.selectedIds.includes(id) && state.selectedIds.length > 1) {
        dispatch({ type: 'MOVE_ITEMS', ids: state.selectedIds, dx, dy });
    } else {
        if (type === 'seat') {
            dispatch({
                type: 'UPDATE_SEAT',
                seat: { id, x: snapValue(e.target.x()), y: snapValue(e.target.y()) }
            });
        } else {
            dispatch({
                type: 'UPDATE_SECTION',
                section: { id, x: snapValue(e.target.x()), y: snapValue(e.target.y()) }
            });
        }
    }
    dragStartPos.current = null;
  };

  return (
    <div className="w-full h-full bg-gray-100 overflow-hidden">
      <Stage
        width={window.innerWidth - 320}
        height={window.innerHeight - 64}
        ref={stageRef}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        draggable={state.tool === 'select' && !selectionBox}
      >
        <Layer>
            {/* Grid */}
            {state.current.snapToGrid && (
                <Group listening={false}>
                    {Array.from({ length: 100 }).map((_, i) => (
                        <React.Fragment key={i}>
                            <Line
                                points={[i * state.current.gridSize - 1000, -1000, i * state.current.gridSize - 1000, 1000]}
                                stroke="#eee"
                                strokeWidth={1}
                            />
                            <Line
                                points={[-1000, i * state.current.gridSize - 1000, 1000, i * state.current.gridSize - 1000]}
                                stroke="#eee"
                                strokeWidth={1}
                            />
                        </React.Fragment>
                    ))}
                </Group>
            )}

            {/* Sections & Stages */}
            {state.current.sections.map((section) => (
                <Group
                    key={section.id}
                    id={section.id}
                    x={section.x}
                    y={section.y}
                    rotation={section.rotation}
                    draggable={state.mode === 'edit'}
                    onDragStart={handleDragStart}
                    onDragEnd={(e) => handleDragEnd(e, section.id, 'section')}
                    onTransformEnd={(e) => {
                        const node = e.target;
                        const update: any = {
                            id: section.id,
                            x: snapValue(node.x()),
                            y: snapValue(node.y()),
                            rotation: node.rotation()
                        };

                        if (section.type === 'circle') {
                            update.radius = Math.max(5, (node.width() * node.scaleX()) / 2);
                        } else {
                            update.width = Math.max(5, node.width() * node.scaleX());
                            update.height = Math.max(5, node.height() * node.scaleY());
                        }

                        dispatch({
                            type: 'UPDATE_SECTION',
                            section: update
                        });
                        node.scaleX(1);
                        node.scaleY(1);
                    }}
                >
                    {section.type === 'rectangle' || section.type === 'stage' ? (
                        <Rect
                            width={section.width || 100}
                            height={section.height || 100}
                            fill={section.isActive ? (section.type === 'stage' ? '#475569' : section.color) : '#cbd5e1'}
                            opacity={section.opacity ?? (section.type === 'stage' ? 1 : 0.4)}
                            cornerRadius={section.borderRadius || 0}
                            stroke={state.selectedIds.includes(section.id) ? '#3b82f6' : (section.borderColor || 'transparent')}
                            strokeWidth={section.borderWidth || (state.selectedIds.includes(section.id) ? 2 : 0)}
                            onClick={(e) => {
                                if (state.mode === 'edit') {
                                    if (e.evt.shiftKey) {
                                        const newSelection = state.selectedIds.includes(section.id)
                                            ? state.selectedIds.filter(id => id !== section.id)
                                            : [...state.selectedIds, section.id];
                                        dispatch({ type: 'SELECT_ITEMS', ids: newSelection });
                                    } else {
                                        dispatch({ type: 'SELECT_ITEMS', ids: [section.id] });
                                    }
                                }
                            }}
                        />
                    ) : (
                        <Circle
                            radius={section.radius || 50}
                            fill={section.isActive ? section.color : '#cbd5e1'}
                            opacity={section.opacity ?? 0.4}
                            stroke={state.selectedIds.includes(section.id) ? '#3b82f6' : (section.borderColor || 'transparent')}
                            strokeWidth={section.borderWidth || (state.selectedIds.includes(section.id) ? 2 : 0)}
                            onClick={(e) => {
                                if (state.mode === 'edit') {
                                    if (e.evt.shiftKey) {
                                        const newSelection = state.selectedIds.includes(section.id)
                                            ? state.selectedIds.filter(id => id !== section.id)
                                            : [...state.selectedIds, section.id];
                                        dispatch({ type: 'SELECT_ITEMS', ids: newSelection });
                                    } else {
                                        dispatch({ type: 'SELECT_ITEMS', ids: [section.id] });
                                    }
                                }
                            }}
                        />
                    )}
                    {section.type === 'stage' && (
                        <Text
                            text={section.name.toUpperCase()}
                            width={section.width}
                            height={section.height}
                            align="center"
                            verticalAlign="middle"
                            fill="white"
                            fontStyle="bold"
                            listening={false}
                        />
                    )}
                </Group>
            ))}

            {/* Seats */}
            {state.current.seats.map((seat) => (
                <Circle
                    key={seat.id}
                    id={seat.id}
                    x={seat.x}
                    y={seat.y}
                    radius={seat.radius || 8}
                    rotation={seat.rotation}
                    fill={state.selectedIds.includes(seat.id) ? '#10b981' :
                          (seat.status === 'available' ? '#3b82f6' :
                           seat.status === 'blocked' ? '#64748b' :
                           seat.status === 'occupied' ? '#ef4444' : '#d1d5db')}
                    opacity={seat.opacity ?? 1}
                    stroke={state.selectedIds.includes(seat.id) ? '#059669' : (seat.borderColor || 'transparent')}
                    strokeWidth={seat.borderWidth || (state.selectedIds.includes(seat.id) ? 2 : 0)}
                    draggable={state.mode === 'edit'}
                    onDragStart={handleDragStart}
                    onDragEnd={(e) => handleDragEnd(e, seat.id, 'seat')}
                    onClick={(e) => {
                        e.cancelBubble = true;
                        if (state.mode === 'edit') {
                            if (e.evt.shiftKey) {
                                const newSelection = state.selectedIds.includes(seat.id)
                                    ? state.selectedIds.filter(id => id !== seat.id)
                                    : [...state.selectedIds, seat.id];
                                dispatch({ type: 'SELECT_ITEMS', ids: newSelection });
                            } else {
                                dispatch({ type: 'SELECT_ITEMS', ids: [seat.id] });
                            }
                        } else if (state.mode === 'view') {
                            const section = state.current.sections.find(s => s.id === seat.sectionId);
                            if (seat.status === 'available' && (!section || section.isActive)) {
                                const newSelection = state.selectedIds.includes(seat.id)
                                    ? state.selectedIds.filter(id => id !== seat.id)
                                    : [...state.selectedIds, seat.id];
                                dispatch({ type: 'SELECT_ITEMS', ids: newSelection });
                            }
                        }
                    }}
                />
            ))}

            {state.mode === 'edit' && (
                <Transformer
                    ref={transformerRef}
                    boundBoxFunc={(oldBox, newBox) => {
                        if (newBox.width < 5 || newBox.height < 5) {
                            return oldBox;
                        }
                        return newBox;
                    }}
                />
            )}

            {selectionBox && (
                <Rect
                    x={Math.min(selectionBox.x1, selectionBox.x2)}
                    y={Math.min(selectionBox.y1, selectionBox.y2)}
                    width={Math.abs(selectionBox.x2 - selectionBox.x1)}
                    height={Math.abs(selectionBox.y2 - selectionBox.y1)}
                    fill="rgba(59, 130, 246, 0.2)"
                    stroke="#3b82f6"
                    strokeWidth={1}
                />
            )}
        </Layer>
      </Stage>
    </div>
  );
};
