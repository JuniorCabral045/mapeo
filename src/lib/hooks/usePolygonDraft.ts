import { useCallback, useEffect, useRef, useState } from 'react';
import { useVenueStore } from '../store/useVenueStore';
import { poligonoDesdeBorrador } from '../utils/geometry';
import { crearForma, nombreDeSectorNuevo } from '../utils/elements';

type Punto = { x: number; y: number };

const SIN_PUNTOS: number[] = [];

/**
 * Dibujo de un sector poligonal: clic agrega un vértice, doble clic o Enter lo
 * cierra, Escape lo cancela. Las coordenadas son de mundo.
 */
export const usePolygonDraft = () => {
  const currentTool = useVenueStore((s) => s.currentTool);
  const [points, setPoints] = useState<number[]>(SIN_PUNTOS);
  const [cursor, setCursor] = useState<Punto | null>(null);

  // `close` lee los puntos de una ref: si dependiera de ellos cambiaría de
  // identidad en cada vértice y el efecto de teclado se reinstalaría en bucle.
  const pointsRef = useRef(points);
  pointsRef.current = points;

  const addPoint = useCallback((p: Punto) => setPoints((pts) => [...pts, p.x, p.y]), []);

  const close = useCallback(() => {
    const poligono = poligonoDesdeBorrador(pointsRef.current);
    setPoints(SIN_PUNTOS);
    if (!poligono) return;

    const store = useVenueStore.getState();
    const id = `polygon-${Date.now()}`;
    store.addElement(
      crearForma(id, nombreDeSectorNuevo(store.elements, store.elementIds), 'section', {
        ...poligono,
        sectionType: 'polygon',
        cornerRadius: 0,
      })
    );
    store.setTool('select');
    store.selectElements([id]);
  }, []);

  // Al dejar la herramienta se descarta el borrador. El mismo arreglo vacío no
  // vuelve a renderizar.
  useEffect(() => {
    if (currentTool === 'polygon') return;
    setPoints(SIN_PUNTOS);
    setCursor(null);
  }, [currentTool]);

  useEffect(() => {
    if (currentTool !== 'polygon') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') close();
      if (e.key === 'Escape') useVenueStore.getState().setTool('select');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentTool, close]);

  return { points, cursor, setCursor, addPoint, close };
};
