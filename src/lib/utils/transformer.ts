import { ShapeElement, VenueElement } from '../types';

const ESQUINAS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
const ESQUINAS_Y_MEDIOS = [
  'top-left', 'top-center', 'top-right',
  'middle-left', 'middle-right',
  'bottom-left', 'bottom-center', 'bottom-right',
];

export interface TransformerConfig {
  anchors: string[];
  keepRatio: boolean;
}

/**
 * Anclas y `keepRatio` que corresponden a una selección.
 *
 * Son la misma decisión: círculos y arcos se dimensionan por radio, así que
 * estirarlos en un solo eje daría una elipse que el formato no sabe
 * representar. Por eso solo exponen las cuatro esquinas y, mientras se
 * arrastra una, el Transformer debe mantener la proporción -si no la
 * mantiene, el Group se escala distinto en X e Y y la figura se ve como una
 * elipse durante todo el gesto, aunque al soltar el dato guardado no se
 * corrompa (handleTransformEnd descarta scaleY).
 *
 * Con selección mixta manda la restricción: si hay una forma radial, se
 * usan las esquinas y se mantiene la proporción aunque también haya
 * formas deformables. Sin ninguna forma radial no hay nada que proteger,
 * así que `keepRatio` es `false` incluso si tampoco hay nada deformable
 * (selección vacía o de solo asientos).
 */
export const transformerConfigFor = (elements: VenueElement[]): TransformerConfig => {
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

  return {
    anchors: hayRadial || !hayDeformable ? ESQUINAS : ESQUINAS_Y_MEDIOS,
    keepRatio: hayRadial,
  };
};
