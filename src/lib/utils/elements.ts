import { ShapeElement, VenueElement } from '../types';

/** Sufijo para ids nuevos: marca de tiempo más azar, para no chocar dentro del mismo milisegundo. */
export const sufijoUnico = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/** Sector o escenario con los valores por omisión del editor. */
export const crearForma = (
  id: string,
  name: string,
  tipo: 'section' | 'stage',
  extra: Partial<ShapeElement> = {}
): ShapeElement => ({
  id,
  type: tipo,
  name,
  x: 0, y: 0, width: 100, height: 100, rotation: 0,
  visible: true,
  locked: false,
  opacity: tipo === 'stage' ? 1 : 0.2,
  zIndex: 5,
  fill: '#6F3E8F',
  isActive: true,
  sectionType: 'rectangle',
  ...extra,
});

/**
 * «Sector N» para un sector recién dibujado: N sigue a la cantidad de sectores
 * (no de elementos, que incluye miles de butacas) y salta los nombres en uso.
 */
export const nombreDeSectorNuevo = (
  elements: Record<string, VenueElement>,
  elementIds: string[]
): string => {
  const usados = new Set<string>();
  let sectores = 0;
  for (const id of elementIds) {
    const el = elements[id];
    if (el?.type !== 'section') continue;
    sectores += 1;
    usados.add(el.name.trim().toLowerCase());
  }

  let n = sectores + 1;
  while (usados.has(`sector ${n}`)) n += 1;
  return `Sector ${n}`;
};
