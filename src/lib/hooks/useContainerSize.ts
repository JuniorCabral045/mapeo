import { RefObject, useEffect, useRef, useState } from 'react';

/**
 * Tamaño en píxeles de un contenedor, siguiéndolo con ResizeObserver: el lienzo
 * tiene que acompañar al panel que lo contiene (sidebar colapsado, pantallas
 * chicas), no solo a la ventana.
 */
export const useContainerSize = (
  ref: RefObject<HTMLElement>,
  inicial: { width: number; height: number },
  alMedir?: (width: number, height: number) => void
) => {
  const [size, setSize] = useState(inicial);
  const alMedirRef = useRef(alMedir);
  alMedirRef.current = alMedir;

  useEffect(() => {
    const medir = () => {
      const el = ref.current;
      if (!el) return;
      const width = el.offsetWidth;
      const height = el.offsetHeight;
      // Sin cambio de medida no hay render: el observador también avisa por nada.
      setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
      alMedirRef.current?.(width, height);
    };
    medir();
    const observer = new ResizeObserver(medir);
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);

  return size;
};
