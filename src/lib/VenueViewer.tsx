import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import Konva from 'konva';
import { Seat } from './components/canvas/Seat';
import { CustomShape } from './components/canvas/CustomShape';
import { ControlesDeVista, Leyenda } from './components/ViewerOverlays';
import { useContainerSize } from './hooks/useContainerSize';
import { deserializeVenue } from './schema';
import { calculateBounds, fitView, zoomAt } from './utils/bounds';
import { seatLabelMode, subtitulosDeSector } from './utils/labels';
import { asientosElegidos } from './utils/selection';
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

const SIN_DISPONIBILIDAD: AvailabilityMap = {};

/**
 * Visor interactivo de un mapeo guardado: muestra sectores y asientos,
 * permite al cliente elegir asientos disponibles. Ocupa el 100% del
 * contenedor padre (darle una altura explícita).
 */
export const VenueViewer: React.FC<VenueViewerProps> = ({
  map,
  availability = SIN_DISPONIBILIDAD,
  selectedSeatIds,
  onSelectionChange,
  maxSeats,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const dimensions = useContainerSize(containerRef, { width: 800, height: 600 });
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const [internalSelection, setInternalSelection] = useState<string[]>([]);
  const [mostrarNombres, setMostrarNombres] = useState(false);

  const isControlled = selectedSeatIds !== undefined;
  const selection = isControlled ? selectedSeatIds : internalSelection;

  const { elements, elementIds } = useMemo(() => deserializeVenue(map), [map]);

  const sectorNames = useMemo(
    () => Object.fromEntries(map.sectors.map((s) => [s.id, s.name])),
    [map]
  );

  const subtitulos = useMemo(() => subtitulosDeSector(elements, elementIds), [elements, elementIds]);

  const estadosPresentes = useMemo(() => {
    const presentes = new Set<string>();
    for (const s of map.sectors) {
      if (s.active === false) presentes.add('inactivo');
      for (const asiento of s.seats) presentes.add(availability[asiento.id] || 'available');
    }
    return presentes;
  }, [map, availability]);

  const encuadrar = useCallback(() => {
    const caja = calculateBounds(elements, elementIds);
    if (caja) setView(fitView(caja, dimensions.width, dimensions.height));
  }, [elements, elementIds, dimensions]);

  useEffect(encuadrar, [encuadrar]);

  const applySelection = (ids: string[]) => {
    if (!isControlled) setInternalSelection(ids);
    if (onSelectionChange) {
      const elegidos = asientosElegidos(elements, sectorNames, ids);
      onSelectionChange(elegidos.ids, elegidos.seats);
    }
  };

  const toggleSeat = (seat: SeatElement) => {
    if ((availability[seat.id] || 'available') !== 'available') return;
    const section = seat.sectionId ? (elements[seat.sectionId] as ShapeElement | undefined) : undefined;
    if (section?.isActive === false) return;

    if (selection.includes(seat.id)) {
      applySelection(selection.filter((id) => id !== seat.id));
    } else if (maxSeats === undefined || selection.length < maxSeats) {
      applySelection([...selection, seat.id]);
    }
  };

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    const pointer = stage?.getPointerPosition();
    if (!stage || !pointer) return;
    const vista = { scale: stage.scaleX(), x: stage.x(), y: stage.y() };
    setView(zoomAt(vista, pointer, e.evt.deltaY > 0 ? 0.9 : 1.1));
  };

  const labels = seatLabelMode(view.scale);

  return (
    <div ref={containerRef} className={`relative w-full h-full bg-[#F3F4F6] overflow-hidden cursor-grab active:cursor-grabbing ${className}`}>
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

          {elementIds.map((id) => {
            const el = elements[id];
            if (el.type === 'seat') return null;
            return (
              <CustomShape
                key={id}
                element={el as ShapeElement}
                isSelected={false}
                scale={view.scale}
                showLabel={mostrarNombres}
                subtitle={mostrarNombres ? subtitulos[id] : undefined}
              />
            );
          })}

          {elementIds.map((id) => {
            const el = elements[id];
            if (el.type !== 'seat') return null;
            const seat = el as SeatElement;
            const section = seat.sectionId ? (elements[seat.sectionId] as ShapeElement | undefined) : undefined;

            return (
              <Seat
                key={id}
                element={{ ...seat, status: availability[id] || 'available' }}
                isSelected={selection.includes(id)}
                draggable={false}
                showLabels={labels}
                isInactive={section?.isActive === false}
                onSelect={(e) => {
                  e.cancelBubble = true;
                  toggleSeat(seat);
                }}
              />
            );
          })}
        </Layer>
      </Stage>

      <Leyenda presentes={estadosPresentes} elegidos={selection.length} maxSeats={maxSeats} />
      <ControlesDeVista
        onZoom={(factor) =>
          setView((v) => zoomAt(v, { x: dimensions.width / 2, y: dimensions.height / 2 }, factor))
        }
        onEncuadrar={encuadrar}
        mostrarNombres={mostrarNombres}
        onAlternarNombres={() => setMostrarNombres((v) => !v)}
      />
    </div>
  );
};
