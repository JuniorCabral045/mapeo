import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import Konva from 'konva';
import { Seat } from './components/canvas/Seat';
import { CustomShape } from './components/canvas/CustomShape';
import { deserializeVenue } from './schema';
import { calculateBounds, fitView } from './utils/bounds';
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
  // Los nombres de sector se prenden a pedido: encima de las butacas estorban
  // más de lo que ayudan, y el comprador ya sabe a qué tribuna va.
  const [mostrarNombres, setMostrarNombres] = useState(false);

  const isControlled = selectedSeatIds !== undefined;
  const selection = isControlled ? selectedSeatIds : internalSelection;

  const { elements, elementIds } = useMemo(() => deserializeVenue(map), [map]);

  const sectorNames = useMemo(() => {
    const names: Record<string, string> = {};
    map.sectors.forEach((s) => { names[s.id] = s.name; });
    return names;
  }, [map]);

  /** Cuántas butacas tiene cada sector, para el rótulo que se dibuja encima. */
  const subtitulosDeSector = useMemo(() => {
    const subtitulos: Record<string, string> = {};
    map.sectors.forEach((s) => {
      const total = s.seats.length;
      if (total > 0) {
        subtitulos[s.id] = `${total} ${total === 1 ? 'asiento' : 'asientos'}`;
      } else if (s.capacity) {
        subtitulos[s.id] = `${s.capacity} de capacidad`;
      }
    });
    return subtitulos;
  }, [map]);

  /** Qué estados aparecen de verdad en este mapa: la leyenda no inventa filas. */
  const leyenda = useMemo(() => {
    const presentes = new Set<string>();
    map.sectors.forEach((s) => {
      if (s.active === false) presentes.add('inactivo');
      s.seats.forEach((asiento) => presentes.add(availability[asiento.id] || 'available'));
    });
    return [
      { clave: 'available', texto: 'Disponible', color: '#6F3E8F' },
      { clave: 'occupied', texto: 'Ocupado', color: '#C7CBD4' },
      { clave: 'reserved', texto: 'Reservado', color: '#F59E0B' },
      { clave: 'blocked', texto: 'Bloqueado', color: '#9AA1AE' },
      { clave: 'inactivo', texto: 'Sector cerrado', color: '#C7CBD4' },
    ].filter((fila) => presentes.has(fila.clave));
  }, [map, availability]);

  const encuadrar = () => {
    const caja = calculateBounds(elements, elementIds);
    if (caja) setView(fitView(caja, dimensions.width, dimensions.height));
  };

  const zoom = (factor: number) =>
    setView((v) => {
      const escala = Math.max(0.05, Math.min(5, v.scale * factor));
      // Se acerca sobre el centro de lo que se está mirando, no sobre el origen
      // del mapa: si no, el zoom manda el recinto fuera de la pantalla.
      const centro = { x: dimensions.width / 2, y: dimensions.height / 2 };
      return {
        scale: escala,
        x: centro.x - ((centro.x - v.x) / v.scale) * escala,
        y: centro.y - ((centro.y - v.y) / v.scale) * escala,
      };
    });

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
    const caja = calculateBounds(elements, elementIds);
    if (!caja) return;
    setView(fitView(caja, dimensions.width, dimensions.height));
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

  const botonControl =
    'w-9 h-9 flex items-center justify-center text-gray-500 hover:text-[#FF6B01] hover:bg-orange-50 ' +
    'transition-colors text-base font-bold leading-none select-none';

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

          {/* Sectores */}
          {elementIds.map((id) => {
            const el = elements[id];
            if (el.type !== 'section' && el.type !== 'stage') return null;
            return (
              <CustomShape
                key={id}
                element={el as ShapeElement}
                isSelected={false}
                scale={view.scale}
                showLabel={mostrarNombres}
                subtitle={mostrarNombres ? subtitulosDeSector[id] : undefined}
              />
            );
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

      {/* Leyenda: qué significa cada color. Solo lista los estados que este
          mapa realmente tiene, para no explicar cosas que no están. */}
      {leyenda.length > 0 && (
        <div className="absolute left-4 bottom-4 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-lg px-4 py-3 flex flex-col gap-2">
          {leyenda.map((fila) => (
            <div key={fila.clave} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-[3px] shrink-0"
                style={{ backgroundColor: fila.color, opacity: fila.clave === 'available' ? 1 : 0.6 }}
              />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                {fila.texto}
              </span>
            </div>
          ))}
          {selection.length > 0 && (
            <div className="flex items-center gap-2 pt-1 border-t border-gray-200">
              <span className="w-3 h-3 rounded-[3px] shrink-0 bg-[#FF6B01]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF6B01]">
                {selection.length} {selection.length === 1 ? 'elegido' : 'elegidos'}
                {maxSeats !== undefined && ` de ${maxSeats}`}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Controles de vista: sin esto, en una pantalla táctil sin rueda no había
          forma de acercarse ni de recuperar el encuadre. */}
      <div className="absolute right-4 bottom-4 flex flex-col gap-2">
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden flex flex-col">
          <button type="button" onClick={() => zoom(1.2)} className={botonControl} title="Acercar" aria-label="Acercar">+</button>
          <div className="h-px bg-gray-200 mx-2" />
          <button type="button" onClick={() => zoom(0.8)} className={botonControl} title="Alejar" aria-label="Alejar">−</button>
        </div>
        <button
          type="button"
          onClick={() => setMostrarNombres((v) => !v)}
          className={`border rounded-xl shadow-lg w-9 h-9 flex items-center justify-center text-[9px] font-bold uppercase tracking-wider transition-colors ${
            mostrarNombres
              ? 'bg-[#FF6B01] border-[#FF6B01] text-white'
              : 'bg-white border-gray-200 text-gray-500 hover:text-[#FF6B01] hover:bg-orange-50'
          }`}
          title={mostrarNombres ? 'Ocultar los nombres de sector' : 'Mostrar los nombres de sector'}
          aria-pressed={mostrarNombres}
        >
          Abc
        </button>
        <button
          type="button"
          onClick={encuadrar}
          className="bg-white border border-gray-200 rounded-xl shadow-lg w-9 h-9 flex items-center justify-center text-[9px] font-bold uppercase tracking-wider text-gray-500 hover:text-[#FF6B01] hover:bg-orange-50 transition-colors"
          title="Ver todo el recinto"
          aria-label="Ver todo el recinto"
        >
          Todo
        </button>
      </div>
    </div>
  );
};
