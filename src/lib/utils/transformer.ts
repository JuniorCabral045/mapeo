import { ShapeElement, VenueElement } from '../types';

const ESQUINAS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
const ESQUINAS_Y_MEDIOS = [
  'top-left', 'top-center', 'top-right',
  'middle-left', 'middle-right',
  'bottom-left', 'bottom-center', 'bottom-right',
];

/**
 * Anclas que corresponden a una selección.
 *
 * Círculos y arcos se dimensionan por radio: estirarlos en un solo eje daría una
 * elipse, que el formato no sabe representar. Con selección mixta se cae al
 * conjunto más restrictivo.
 */
export const anchorsFor = (elements: VenueElement[]): string[] => {
  const hayRadial = elements.some((el) => {
    if (!el || el.type === 'seat') return false;
    const tipo = (el as ShapeElement).sectionType;
    return tipo === 'circle' || tipo === 'arc';
  });

  const hayDeformable = elements.some((el) => {
    if (!el || el.type === 'seat') return false;
    const tipo = (el as ShapeElement).sectionType;
    return tipo !== 'circle' && tipo !== 'arc';
  });

  return hayRadial || !hayDeformable ? ESQUINAS : ESQUINAS_Y_MEDIOS;
};
