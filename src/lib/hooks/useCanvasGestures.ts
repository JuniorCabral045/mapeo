import { RefObject, useRef, useState } from 'react';
import Konva from 'konva';
import { useVenueStore } from '../store/useVenueStore';
import { idsToExcludeFromSnap, idsToMoveIndividually } from '../utils/sector';
import { snapPosition, type Guide } from '../utils/snapping';
import { elementBounds } from '../utils/bounds';
import { geometriaEscalada } from '../utils/transformer';
import { ShapeElement } from '../types';

type Posiciones = Record<string, { x: number; y: number }>;

const mismasGuias = (a: Guide[], b: Guide[]) =>
  a.length === b.length && a.every((g, i) => g.axis === b[i].axis && g.pos === b[i].pos);

/**
 * Arrastre y transformación de elementos en el lienzo. Cada gesto deja un solo
 * paso de historial, sea cual sea la selección: las acciones del store se piden
 * sin guardar y el gesto cierra el paso al terminar.
 */
export const useCanvasGestures = (stageRef: RefObject<Konva.Stage>) => {
  const [guias, setGuias] = useState<Guide[]>([]);
  // Posiciones iniciales de toda la selección durante un arrastre grupal.
  const dragStart = useRef<Posiciones | null>(null);
  const transformPendiente = useRef(false);

  const actualizarGuias = (nuevas: Guide[]) =>
    setGuias((previas) => (mismasGuias(previas, nuevas) ? previas : nuevas));

  /** Imán a la grilla y a otros sectores. Con Alt se ignora. */
  const aplicarIman = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    if (e.evt.altKey) {
      actualizarGuias([]);
      return;
    }
    const { elements, elementIds, selectedIds, gridConfig, viewState } = useVenueStore.getState();
    const el = elements[id];
    if (!el) return;
    const caja = elementBounds(el);
    const r = snapPosition({
      x: e.target.x(),
      y: e.target.y(),
      width: caja.maxX - caja.minX,
      height: caja.maxY - caja.minY,
      offsetX: caja.minX - el.x,
      offsetY: caja.minY - el.y,
      excludedIds: idsToExcludeFromSnap(id, selectedIds),
      elements,
      elementIds,
      grid: gridConfig,
      scale: viewState.scale,
    });
    e.target.x(r.x);
    e.target.y(r.y);
    actualizarGuias(r.guides);
  };

  const onDragStart = (id: string) => {
    const { elements, selectedIds } = useVenueStore.getState();
    if (!selectedIds.includes(id) || selectedIds.length < 2) {
      dragStart.current = null;
      return;
    }
    const posiciones: Posiciones = {};
    for (const sid of selectedIds) {
      const el = elements[sid];
      if (el && !el.locked) posiciones[sid] = { x: el.x, y: el.y };
    }
    dragStart.current = posiciones;
  };

  const onDragMove = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    aplicarIman(id, e);
    const start = dragStart.current;
    if (!start?.[id]) return;
    const dx = e.target.x() - start[id].x;
    const dy = e.target.y() - start[id].y;
    for (const sid of Object.keys(start)) {
      if (sid === id) continue;
      stageRef.current?.findOne(`#${sid}`)?.position({ x: start[sid].x + dx, y: start[sid].y + dy });
    }
  };

  const onDragEnd = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const store = useVenueStore.getState();
    const mover = (sid: string, x: number, y: number) => {
      if (store.elements[sid]?.type === 'seat') store.updateElement(sid, { x, y });
      else store.moveSector(sid, x, y, false);
    };

    const start = dragStart.current;
    if (start?.[id]) {
      const dx = e.target.x() - start[id].x;
      const dy = e.target.y() - start[id].y;
      for (const sid of idsToMoveIndividually(store.elements, Object.keys(start))) {
        mover(sid, start[sid].x + dx, start[sid].y + dy);
      }
    } else {
      mover(id, e.target.x(), e.target.y());
    }
    dragStart.current = null;
    store.saveHistory();
    setGuias([]);
  };

  /**
   * Konva dispara un `transformend` por cada nodo del Transformer, de forma
   * síncrona dentro del mismo mouseup. El paso de historial se agenda en un
   * microtask para que corra una sola vez, después de todos.
   */
  const guardarTransformUnaVez = () => {
    if (transformPendiente.current) return;
    transformPendiente.current = true;
    queueMicrotask(() => {
      transformPendiente.current = false;
      useVenueStore.getState().saveHistory();
    });
  };

  const onTransformEnd = (id: string, e: Konva.KonvaEventObject<Event>) => {
    const store = useVenueStore.getState();
    const shape = store.elements[id] as ShapeElement | undefined;
    if (!shape) return;

    const node = e.currentTarget;
    const scaleX = node.scaleX();
    const { cambios, scaleY } = geometriaEscalada(shape, scaleX, node.scaleY());
    node.scaleX(1);
    node.scaleY(1);

    // transformSector lee la posición y rotación anteriores del store para
    // ubicar las butacas: tiene que correr antes que updateElement las pise.
    store.transformSector(id, { x: node.x(), y: node.y(), rotation: node.rotation(), scaleX, scaleY }, false);
    store.updateElement(id, cambios);
    guardarTransformUnaVez();
  };

  return { guias, onDragStart, onDragMove, onDragEnd, onTransformEnd };
};
