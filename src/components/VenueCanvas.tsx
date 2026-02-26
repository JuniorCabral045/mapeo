import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Rect, Circle, Group, Transformer } from 'react-konva';
import Konva from 'konva';
import { Seat, Section, EditorState } from '../types/venue';

interface VenueCanvasProps {
  state: EditorState;
  dispatch: any; // Ideally typed action
}

export const VenueCanvas: React.FC<VenueCanvasProps> = ({ state, dispatch }) => {
  const stageRef = useRef<Konva.Stage>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selectionBox, setSelectionBox] = useState<{ x1: number, y1: number, x2: number, y2: number } | null>(null);

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

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // If we click on empty space, start selection box or clear selection
    if (e.target === stageRef.current) {
      const pos = stageRef.current.getPointerPosition();
      if (pos) {
        setSelectionBox({ x1: (pos.x - position.x) / scale, y1: (pos.y - position.y) / scale, x2: (pos.x - position.x) / scale, y2: (pos.y - position.y) / scale });
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

  const handleMouseUp = () => {
    if (selectionBox) {
        // Calculate which items are inside the selection box
        const { x1, y1, x2, y2 } = selectionBox;
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);

        const selectedSeats = state.current.seats.filter(s => s.x >= minX && s.x <= maxX && s.y >= minY && s.y <= maxY).map(s => s.id);
        const selectedSections = state.current.sections.filter(s => s.x >= minX && s.x <= maxX && s.y >= minY && s.y <= maxY).map(s => s.id);

        const ids = [...selectedSeats, ...selectedSections];
        if (ids.length > 0) {
            if (window.event && (window.event as any).shiftKey) {
                const combined = Array.from(new Set([...state.selectedIds, ...ids]));
                dispatch({ type: 'SELECT_ITEMS', ids: combined });
            } else {
                dispatch({ type: 'SELECT_ITEMS', ids });
            }
        }
        setSelectionBox(null);
    }
  };

  return (
    <div className="w-full h-full bg-gray-200 overflow-hidden">
      <Stage
        width={window.innerWidth - 300} // Sidebar width
        height={window.innerHeight - 64} // Toolbar height
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
            {/* Render Grid or Background if needed */}
            <Rect
                width={5000}
                height={5000}
                x={-2500}
                y={-2500}
                fill="#f8f9fa"
                listening={false}
            />

            {/* Sections */}
            {state.current.sections.map((section) => (
                <Rect
                    key={section.id}
                    id={section.id}
                    x={section.x}
                    y={section.y}
                    width={section.width || 100}
                    height={section.height || 100}
                    fill={section.color}
                    opacity={0.3}
                    stroke={state.selectedIds.includes(section.id) ? '#3b82f6' : '#ccc'}
                    strokeWidth={2}
                    draggable={state.mode === 'edit'}
                    onDragEnd={(e) => {
                        dispatch({
                            type: 'UPDATE_SECTION',
                            section: { ...section, x: e.target.x(), y: e.target.y() }
                        });
                    }}
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
            ))}

            {/* Seats */}
            {state.current.seats.map((seat) => (
                <Circle
                    key={seat.id}
                    id={seat.id}
                    x={seat.x}
                    y={seat.y}
                    radius={8}
                    fill={state.selectedIds.includes(seat.id) ? '#10b981' : (seat.status === 'available' ? '#3b82f6' : '#d1d5db')}
                    stroke={state.selectedIds.includes(seat.id) ? '#059669' : 'transparent'}
                    strokeWidth={2}
                    draggable={state.mode === 'edit'}
                    onDragEnd={(e) => {
                        dispatch({
                            type: 'UPDATE_SEAT',
                            seat: { ...seat, x: e.target.x(), y: e.target.y() }
                        });
                    }}
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
                            if (seat.status === 'available') {
                                const newSelection = state.selectedIds.includes(seat.id)
                                    ? state.selectedIds.filter(id => id !== seat.id)
                                    : [...state.selectedIds, seat.id];
                                dispatch({ type: 'SELECT_ITEMS', ids: newSelection });
                            }
                        }
                    }}
                />
            ))}

            {/* Selection Box */}
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
