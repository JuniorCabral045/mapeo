import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import Konva from 'konva';
import { Seat } from './components/canvas/Seat';
import { CustomShape } from './components/canvas/CustomShape';
import { deserializeVenue } from './schema';
import {
  AvailabilityMap,
  SeatElement,
  SelectedSeat,
  ShapeElement,
  VenueMap,
} from './types';

export interface VenueViewerProps {
  /** Mapeo del recinto (tal como lo devuelve el backend). */
  map: VenueMap;
  /** Disponibilidad por asiento para el evento actual. Los asientos ausentes se asumen 'available'. */
  availability?: AvailabilityMap;
  /** Selección controlada (opcional). Si se omite, el visor maneja la selección internamente. */
  selectedSeatIds?: string[];
  /** Se invoca cuando el usuario selecciona/deselecciona asientos. */
  onSelectionChange?: (seatIds: string[], seats: SelectedSeat[]) => void;
  /** Máximo de asientos seleccionables (p.ej. límite por pedido). */
  maxSeats?: number;
  className?: string;
}

/**
 * Visor interactivo de un mapeo guardado: muestra sectores y asientos,
 * permite al cliente elegir asientos disponibles. Ocupa el 100% del
 * contenedor padre (darle una altura explícita).
 */
export const VenueViewer: React.FC<VenueViewerProps> = ({
  map,
  availability = {},
  selectedSeatIds,
  onSelectionChange,
  maxSeats,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const [internalSelection, setInternalSelection] = useState<string[]>([]);

  const isControlled = selectedSeatIds !== undefined;
  const selection = isControlled ? selectedSeatIds : internalSelection;

  const { elements, elementIds } = useMemo(() => deserializeVenue(map), [map]);

  const sectorNames = useMemo(() => {
    const names: Record<string, string> = {};
    map.sectors.forEach((s) => { names[s.id] = s.name; });
    return names;
  }, [map]);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    updateSize();
    // El canvas sigue el tamaño del contenedor, no solo el de la ventana
    const observer = new ResizeObserver(updateSize);
    if (containerRef.current) observer.observe(containerRef.current);
    window.addEventListener('resize', updateSize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Encuadrar el mapa completo al montar / cambiar de mapa
  useEffect(() => {
    if (elementIds.length === 0) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    elementIds.forEach((id) => {
      const el = elements[id];
      const w = 'width' in el ? el.width : el.radius * 2;
      const h = 'height' in el ? el.height : el.radius * 2;
      minX = Math.min(minX, el.x);
      minY = Math.min(minY, el.y);
      maxX = Math.max(maxX, el.x + w);
      maxY = Math.max(maxY, el.y + h);
    });
    const bw = maxX - minX || 1;
    const bh = maxY - minY || 1;
    const scale = Math.min(dimensions.width / bw, dimensions.height / bh) * 0.85;
    setView({
      scale,
      x: (dimensions.width - bw * scale) / 2 - minX * scale,
      y: (dimensions.height - bh * scale) / 2 - minY * scale,
    });
  }, [elements, elementIds, dimensions]);

  const showLabels = view.scale > 1.2 ? 'all' : view.scale > 0.6 ? 'row' : 'none';

  const applySelection = (ids: string[]) => {
    if (!isControlled) setInternalSelection(ids);
    if (onSelectionChange) {
      const seats: SelectedSeat[] = ids.map((id) => {
        const el = elements[id] as SeatElement;
        return {
          id,
          row: el.row,
          number: el.number,
          sectorId: el.sectionId || '',
          sectorName: (el.sectionId && sectorNames[el.sectionId]) || 'General',
        };
      });
      onSelectionChange(ids, seats);
    }
  };

  const toggleSeat = (seat: SeatElement) => {
    const status = availability[seat.id] || 'available';
    if (status !== 'available') return;

    const section = seat.sectionId ? (elements[seat.sectionId] as ShapeElement | undefined) : undefined;
    if (section && section.isActive === false) return;

    if (selection.includes(seat.id)) {
      applySelection(selection.filter((id) => id !== seat.id));
    } else {
      if (maxSeats !== undefined && selection.length >= maxSeats) return;
      applySelection([...selection, seat.id]);
    }
  };

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
    setView({
      scale: newScale,
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  return (
    <div ref={containerRef} className={`w-full h-full bg-[#F3F4F6] overflow-hidden cursor-grab active:cursor-grabbing ${className}`}>
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        scaleX={view.scale}
        scaleY={view.scale}
        x={view.x}
        y={view.y}
        draggable
        onWheel={handleWheel}
        onDragEnd={(e) => {
          if (e.target === stageRef.current) {
            setView((v) => ({ ...v, x: e.target.x(), y: e.target.y() }));
          }
        }}
      >
        <Layer>
          <Rect x={-5000} y={-5000} width={20000} height={20000} fill="#F3F4F6" listening={false} />

          {/* Sectores */}
          {elementIds.map((id) => {
            const el = elements[id];
            if (el.type !== 'section' && el.type !== 'stage') return null;
            return <CustomShape key={id} element={el as ShapeElement} isSelected={false} />;
          })}

          {/* Asientos con disponibilidad aplicada */}
          {elementIds.map((id) => {
            const el = elements[id];
            if (el.type !== 'seat') return null;
            const seat = el as SeatElement;
            const status = availability[id] || 'available';
            const section = seat.sectionId ? (elements[seat.sectionId] as ShapeElement | undefined) : undefined;
            const isInactive = !!section && section.isActive === false;

            return (
              <Seat
                key={id}
                element={{ ...seat, status }}
                isSelected={selection.includes(id)}
                draggable={false}
                showLabels={showLabels}
                isInactive={isInactive}
                onSelect={(e) => {
                  e.cancelBubble = true;
                  toggleSeat(seat);
                }}
              />
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
};
