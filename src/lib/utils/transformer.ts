import { ShapeElement, VenueElement } from '../types';
import { esRadial } from './bounds';

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
 * Anclas y `keepRatio` para una selección. Círculos y arcos se dimensionan por
 * radio: estirarlos en un solo eje daría una elipse que el formato no sabe
 * representar, así que si hay alguno en la selección manda esa restricción.
 */
export const transformerConfigFor = (elements: VenueElement[]): TransformerConfig => {
  const formas = elements.filter((el): el is ShapeElement => !!el && el.type !== 'seat');
  const hayRadial = formas.some(esRadial);
  const hayDeformable = formas.some((el) => !esRadial(el));

  return {
    anchors: hayRadial || !hayDeformable ? ESQUINAS : ESQUINAS_Y_MEDIOS,
    keepRatio: hayRadial,
  };
};

/**
 * Cómo se traduce la escala que dejó el Transformer en la geometría del sector.
 * Konva escala el nodo; el formato guarda medidas, así que la escala se hornea
 * en ancho, alto, radios o vértices. Los radiales escalan por `scaleX` en los
 * dos ejes: su geometría es un radio.
 */
export const geometriaEscalada = (
  shape: ShapeElement,
  scaleX: number,
  scaleY: number
): { cambios: Partial<ShapeElement>; scaleY: number } => {
  switch (shape.sectionType) {
    case 'circle': {
      const radius = Math.max(5, (shape.radius ?? shape.width / 2) * scaleX);
      return { cambios: { radius, width: radius * 2, height: radius * 2 }, scaleY: scaleX };
    }
    case 'arc':
      return {
        cambios: {
          innerRadius: Math.max(0, (shape.innerRadius ?? 100) * scaleX),
          outerRadius: Math.max(10, (shape.outerRadius ?? 200) * scaleX),
        },
        scaleY: scaleX,
      };
    case 'polygon':
      return {
        cambios: {
          points: (shape.points ?? []).map((p, i) => (i % 2 === 0 ? p * scaleX : p * scaleY)),
          width: Math.max(5, shape.width * scaleX),
          height: Math.max(5, shape.height * scaleY),
        },
        scaleY,
      };
    default:
      return {
        cambios: {
          width: Math.max(5, shape.width * scaleX),
          height: Math.max(5, shape.height * scaleY),
        },
        scaleY,
      };
  }
};
