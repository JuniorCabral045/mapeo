import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Stage, Layer, Rect, Group, Transformer, Line, Circle, Image as KonvaImage } from 'react-konva';
import Konva from 'konva';
import { useVenueStore } from '../../store/useVenueStore';
import { Seat } from './Seat';
import { CustomShape } from './CustomShape';
import { snapToGrid } from '../../utils/grid';
import { idsToMoveIndividually } from '../../utils/sector';
import { anchorsFor } from '../../utils/transformer';
import { ShapeElement, SeatElement } from '../../types';

/** Capa del plano de referencia (solo editor, no interactiva). */
const BackgroundLayer: React.FC = () => {
  const backgroundImage = useVenueStore((s) => s.backgroundImage);
  const [img, setImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!backgroundImage) {
      setImg(null);
      return;
    }
    const image = new window.Image();
    image.onload = () => setImg(image);
    image.src = backgroundImage.src;
  }, [backgroundImage?.src]);

  if (!backgroundImage || !img) return null;
  return (
    <KonvaImage
      image={img}
      x={backgroundImage.x}
      y={backgroundImage.y}
      width={backgroundImage.width}
      height={backgroundImage.height}
      opacity={backgroundImage.opacity}
      listening={false}
    />
  );
};

export const EditorCanvas: React.FC = () => {
  const {
    elements, elementIds, selectedIds,
    viewState, setViewState,
    gridConfig, currentTool, setTool,
    selectElements, updateElement, addElement, setCanvasSize,
    moveSector, transformSector,
  } = useVenueStore();

  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 800 });
  const [selectionBox, setSelectionBox] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  // Dibujo de polígono: vértices en coordenadas de mundo + posición del cursor
  const [draftPoints, setDraftPoints] = useState<number[]>([]);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  // Drag grupal: posiciones iniciales de toda la selección
  const dragStart = useRef<Record<string, { x: number; y: number }> | null>(null);

  // Konva dispara un `transformend` por cada nodo del Transformer (ver
  // Transformer._removeEvents en la librería), así que en una selección múltiple
  // handleTransformEnd se llama varias veces de forma síncrona -una por sector-
  // dentro del mismo gesto de mouseup. Este flag agrupa esas llamadas en un solo
  // paso de historial: cada llamada pide un guardado, pero solo la primera agenda
  // el microtask, que corre recién cuando ya se ejecutaron todas las llamadas
  // síncronas de este gesto.
  const transformHistoryPending = useRef(false);
  const scheduleTransformHistorySave = () => {
    if (transformHistoryPending.current) return;
    transformHistoryPending.current = true;
    queueMicrotask(() => {
      transformHistoryPending.current = false;
      useVenueStore.getState().saveHistory();
    });
  };

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
        setCanvasSize(containerRef.current.offsetWidth, containerRef.current.offsetHeight);
      }
    };
    updateSize();
    // ResizeObserver: el canvas sigue al contenedor (sidebar colapsado,
    // pantallas chicas, paneles), no solo al resize de la ventana
    const observer = new ResizeObserver(updateSize);
    if (containerRef.current) observer.observe(containerRef.current);
    window.addEventListener('resize', updateSize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, [setCanvasSize]);

  useEffect(() => {
    if (transformerRef.current) {
      // Los asientos se mueven pero no se escalan: el transformer solo toma sectores/escenarios
      const nodes = selectedIds
        .filter((id) => elements[id] && elements[id].type !== 'seat')
        .map((id) => stageRef.current?.findOne(`#${id}`))
        .filter((n): n is Konva.Node => !!n);
      transformerRef.current.nodes(nodes);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedIds, elements]);

  // Cerrar/cancelar el dibujo de polígono con teclado
  useEffect(() => {
    if (currentTool !== 'polygon') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') closeDraftPolygon();
      if (e.key === 'Escape') {
        setDraftPoints([]);
        setTool('select');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTool, draftPoints]);

  const toWorld = (pointer: { x: number; y: number }) => ({
    x: (pointer.x - viewState.x) / viewState.scale,
    y: (pointer.y - viewState.y) / viewState.scale,
  });

  const closeDraftPolygon = () => {
    if (draftPoints.length < 6) {
      setDraftPoints([]);
      return;
    }
    const xs = draftPoints.filter((_, i) => i % 2 === 0);
    const ys = draftPoints.filter((_, i) => i % 2 === 1);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const width = Math.max(5, Math.max(...xs) - minX);
    const height = Math.max(5, Math.max(...ys) - minY);
    const points = draftPoints.map((p, i) => (i % 2 === 0 ? p - minX : p - minY));
    const id = `polygon-${Date.now()}`;
    addElement({
      id,
      type: 'section',
      name: `Sector ${elementIds.length + 1}`,
      x: minX,
      y: minY,
      width,
      height,
      rotation: 0,
      visible: true,
      locked: false,
      opacity: 0.2,
      zIndex: 5,
      fill: '#6F3E8F',
      isActive: true,
      sectionType: 'polygon',
      cornerRadius: 0,
      points,
    });
    setDraftPoints([]);
    setTool('select');
    useVenueStore.getState().selectElements([id]);
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

    setViewState({
      scale: newScale,
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (currentTool === 'pan') return;

    if (currentTool === 'polygon') {
      const pointer = e.target.getStage()!.getPointerPosition()!;
      const world = toWorld(pointer);
      setDraftPoints((pts) => [...pts, world.x, world.y]);
      return;
    }

    if (e.target === e.target.getStage()) {
      const pos = e.target.getStage()!.getPointerPosition()!;
      setSelectionBox({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
      selectElements([]);
    }
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (currentTool === 'polygon') {
      const pointer = e.target.getStage()!.getPointerPosition();
      if (pointer) setCursorPos(toWorld(pointer));
      return;
    }
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

  const handleDblClick = () => {
    if (currentTool === 'polygon') closeDraftPolygon();
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
          fill={i % 5 === 0 ? '#C9CEDA' : '#E2E5EC'}
          opacity={0.6}
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
          fill={j % 5 === 0 ? '#C9CEDA' : '#E2E5EC'}
          opacity={0.6}
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

  const anclas = useMemo(
    () => anchorsFor(selectedIds.map((id) => elements[id]).filter(Boolean)),
    [selectedIds, elements]
  );

  const cursorClass = currentTool === 'pan'
    ? 'cursor-grab active:cursor-grabbing'
    : 'cursor-crosshair';

  const handleGridSnap = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (gridConfig.enabled) {
      const { x, y } = snapToGrid(e.target.x(), e.target.y(), gridConfig.size);
      e.target.x(x);
      e.target.y(y);
    }
  };

  // ── Drag grupal: toda la selección sigue al elemento arrastrado ──
  const handleDragStart = (id: string) => {
    if (selectedIds.includes(id) && selectedIds.length > 1) {
      const positions: Record<string, { x: number; y: number }> = {};
      selectedIds.forEach((sid) => {
        const el = elements[sid];
        if (el && !el.locked) positions[sid] = { x: el.x, y: el.y };
      });
      dragStart.current = positions;
    } else {
      dragStart.current = null;
    }
  };

  const handleDragMove = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    handleGridSnap(e);
    const start = dragStart.current;
    if (!start || !start[id]) return;
    const dx = e.target.x() - start[id].x;
    const dy = e.target.y() - start[id].y;
    Object.keys(start).forEach((sid) => {
      if (sid === id) return;
      const node = stageRef.current?.findOne(`#${sid}`);
      node?.position({ x: start[sid].x + dx, y: start[sid].y + dy });
    });
  };

  /**
   * Mueve un elemento; si es un sector, `moveSector` arrastra sus asientos.
   * Durante un gesto del lienzo se pide sin guardar historial: el gesto entero
   * -uno o varios sectores, más asientos sueltos- cierra con un solo
   * `saveHistory()` al final de `handleDragEnd`, cubriendo también el caso del
   * asiento suelto (que via `updateElement` nunca guarda historial por sí solo).
   */
  const aplicarMovimiento = (id: string, x: number, y: number) => {
    const el = elements[id];
    if (el && el.type !== 'seat') moveSector(id, x, y, false);
    else updateElement(id, { x, y });
  };

  const handleDragEnd = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const start = dragStart.current;
    if (start && start[id]) {
      const dx = e.target.x() - start[id].x;
      const dy = e.target.y() - start[id].y;
      // Un asiento cuyo propio sector también está seleccionado se excluye:
      // moveSector ya lo arrastra al mover el sector, así que aplicarle el
      // movimiento acá también lo desplazaría el doble. La exclusión mira la
      // selección, no el orden en que se recorre `start` (ver idsToMoveIndividually).
      idsToMoveIndividually(elements, Object.keys(start)).forEach((sid) => {
        aplicarMovimiento(sid, start[sid].x + dx, start[sid].y + dy);
      });
    } else {
      aplicarMovimiento(id, e.target.x(), e.target.y());
    }
    dragStart.current = null;
    // Un solo paso de historial por gesto de arrastre, sea un asiento suelto,
    // uno o varios sectores, o una selección mixta.
    useVenueStore.getState().saveHistory();
  };

  // ── Transform (el nodo es el Group del elemento) ──
  const handleTransformEnd = (id: string, shape: ShapeElement, e: Konva.KonvaEventObject<Event>) => {
    const node = e.currentTarget;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    const updates: Partial<ShapeElement> = {
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
    };
    if (shape.sectionType === 'circle') {
      const radius = Math.max(5, (shape.radius ?? shape.width / 2) * scaleX);
      updates.radius = radius;
      updates.width = radius * 2;
      updates.height = radius * 2;
    } else if (shape.sectionType === 'arc') {
      updates.innerRadius = Math.max(0, (shape.innerRadius ?? 100) * scaleX);
      updates.outerRadius = Math.max(10, (shape.outerRadius ?? 200) * scaleX);
    } else if (shape.sectionType === 'polygon') {
      updates.points = (shape.points ?? []).map((p, i) => (i % 2 === 0 ? p * scaleX : p * scaleY));
      updates.width = Math.max(5, shape.width * scaleX);
      updates.height = Math.max(5, shape.height * scaleY);
    } else {
      updates.width = Math.max(5, shape.width * scaleX);
      updates.height = Math.max(5, shape.height * scaleY);
    }
    // Los radiales escalan por scaleX en los dos ejes: su geometría es un radio,
    // no un ancho y un alto. Es la misma decisión que toma el bloque de arriba al
    // calcular `radius` y `outerRadius`.
    const esRadial = shape.sectionType === 'circle' || shape.sectionType === 'arc';

    // Orden obligatorio: transformSector lee la posición/rotación del sector
    // TODAVÍA vigentes en el store para calcular cuánto se movió cada butaca;
    // si updateElement corriera antes, ya las habría pisado con los valores
    // nuevos y la resta (nuevo - nuevo) daría siempre cero. Verificado a mano:
    // con el orden updateElement→transformSector, rotar o redimensionar un
    // sector reposicionaba las butacas en lugares sin relación con el sector.
    transformSector(id, {
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
      scaleX,
      scaleY: esRadial ? scaleX : scaleY,
    }, false);
    updateElement(id, updates);

    // Ver el comentario de `scheduleTransformHistorySave`: agrupa las llamadas
    // síncronas de este gesto (una por sector seleccionado) en un solo paso.
    scheduleTransformHistorySave();
  };

  // Puntos del borrador de polígono + línea al cursor
  const draftPreview = draftPoints.length > 0
    ? (cursorPos ? [...draftPoints, cursorPos.x, cursorPos.y] : draftPoints)
    : [];

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
        onDblClick={handleDblClick}
        ref={stageRef}
        draggable={currentTool === 'pan'}
        onDragEnd={(e) => {
          if (e.target === stageRef.current) {
            setViewState({ x: e.target.x(), y: e.target.y() });
          }
        }}
      >
        <Layer>
          <Rect x={-2500} y={-2500} width={10000} height={10000} fill="#F3F4F6" listening={false} />
          <BackgroundLayer />
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
                  if (currentTool !== 'select') return;
                  e.cancelBubble = true;
                  selectElements(e.evt.shiftKey ? [...selectedIds, id] : [id]);
                }}
                onDragStart={() => handleDragStart(id)}
                onDragMove={(e) => handleDragMove(id, e)}
                onDragEnd={(e) => handleDragEnd(id, e)}
                onTransformEnd={(e) => handleTransformEnd(id, shape, e)}
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
                  if (currentTool !== 'select') return;
                  e.cancelBubble = true;
                  selectElements(e.evt.shiftKey ? [...selectedIds, id] : [id]);
                }}
                onDragStart={() => handleDragStart(id)}
                onDragMove={(e) => handleDragMove(id, e)}
                onDragEnd={(e) => handleDragEnd(id, e)}
              />
            );
          })}

          {/* Borrador del polígono en dibujo */}
          {draftPreview.length >= 2 && (
            <>
              <Line
                points={draftPreview}
                stroke="#FF6B01"
                strokeWidth={2 / viewState.scale}
                dash={[6, 4]}
                listening={false}
              />
              {draftPoints.map((_, i) =>
                i % 2 === 0 ? (
                  <Circle
                    key={i}
                    x={draftPoints[i]}
                    y={draftPoints[i + 1]}
                    radius={4 / viewState.scale}
                    fill="#FF6B01"
                    listening={false}
                  />
                ) : null
              )}
            </>
          )}

          {selectionBox && (
            <Rect
              x={Math.min(selectionBox.x1, selectionBox.x2) / viewState.scale - viewState.x / viewState.scale}
              y={Math.min(selectionBox.y1, selectionBox.y2) / viewState.scale - viewState.y / viewState.scale}
              width={Math.abs(selectionBox.x1 - selectionBox.x2) / viewState.scale}
              height={Math.abs(selectionBox.y1 - selectionBox.y2) / viewState.scale}
              fill="rgba(255, 107, 1, 0.06)"
              stroke="#FF6B01"
              strokeWidth={1 / viewState.scale}
              dash={[5, 3]}
            />
          )}

          <Transformer
            ref={transformerRef}
            rotateEnabled
            keepRatio={false}
            enabledAnchors={anclas}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 10 || newBox.height < 10) return oldBox;
              return newBox;
            }}
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
