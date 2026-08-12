import { SeatElement, ShapeElement } from '../types';
import { pointInPolygon } from './geometry';

export interface LayoutParams {
  rows: number;
  cols: number;
  rowSpacing: number;
  colSpacing: number;
  seatRadius: number;
  startRow: string;
  startNum: number;
  /** Dirección de numeración dentro de cada fila. Default 'ltr' (izq → der). */
  numberDirection?: 'ltr' | 'rtl';
}

/**
 * Etiqueta de fila: A…Z, AA, AB… desde la fila inicial indicada.
 *
 * La versión anterior sumaba al código del carácter, así que la fila 27 de una
 * tribuna se llamaba «[». Un estadio con 30 filas es lo normal, no el borde.
 */
export const rowLabel = (index: number, startRow = 'A'): string => {
  const base = (startRow.toUpperCase().charCodeAt(0) || 65) - 65;
  let n = base + index;
  let etiqueta = '';

  do {
    etiqueta = String.fromCharCode(65 + (n % 26)) + etiqueta;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);

  return etiqueta;
};

const makeSeat = (
  id: string,
  sectionId: string,
  rowLabel: string,
  num: number,
  x: number,
  y: number,
  rotation: number,
  radius: number
): SeatElement => ({
  id,
  type: 'seat',
  name: `${rowLabel}${num}`,
  x,
  y,
  rotation,
  visible: true,
  locked: false,
  opacity: 1,
  zIndex: 10,
  sectionId,
  row: rowLabel,
  number: num.toString(),
  status: 'available',
  radius,
});

/** Número de asiento según posición en la fila y dirección de numeración. */
const seatNum = (
  index: number,
  total: number,
  startNum: number,
  direction?: 'ltr' | 'rtl'
): number => (direction === 'rtl' ? startNum + (total - 1 - index) : startNum + index);

/** Genera asientos en grilla rectangular, centrados dentro del sector. */
export const generateRectLayout = (
  container: ShapeElement,
  params: LayoutParams
): SeatElement[] => {
  const seats: SeatElement[] = [];
  const { rows, cols, rowSpacing, colSpacing, seatRadius, startRow, startNum, numberDirection } = params;

  const totalW = cols * (seatRadius * 2 + colSpacing) - colSpacing;
  const totalH = rows * (seatRadius * 2 + rowSpacing) - rowSpacing;

  const startX = container.x + (container.width - totalW) / 2 + seatRadius;
  const startY = container.y + (container.height - totalH) / 2 + seatRadius;

  for (let r = 0; r < rows; r++) {
    const rowEtiqueta = rowLabel(r, startRow);
    for (let c = 0; c < cols; c++) {
      seats.push(
        makeSeat(
          `seat-${container.id}-${r}-${c}`,
          container.id,
          rowEtiqueta,
          seatNum(c, cols, startNum, numberDirection),
          startX + c * (seatRadius * 2 + colSpacing),
          startY + r * (seatRadius * 2 + rowSpacing),
          0,
          seatRadius
        )
      );
    }
  }

  return seats;
};

/** Genera asientos en arco radial alrededor del origen del sector (círculos). */
export const generateArcLayout = (
  container: ShapeElement,
  params: LayoutParams & { innerRadius: number; startAngle: number; endAngle: number }
): SeatElement[] => {
  const seats: SeatElement[] = [];
  const { rows, cols, rowSpacing, seatRadius, startRow, startNum, numberDirection, innerRadius, startAngle, endAngle } = params;

  const angleStep = (endAngle - startAngle) / (cols - 1 || 1);

  for (let r = 0; r < rows; r++) {
    const rowEtiqueta = rowLabel(r, startRow);
    const radius = innerRadius + r * (seatRadius * 2 + rowSpacing);

    for (let c = 0; c < cols; c++) {
      const angle = startAngle + c * angleStep;
      const rad = (angle * Math.PI) / 180;
      seats.push(
        makeSeat(
          `seat-arc-${container.id}-${r}-${c}`,
          container.id,
          rowEtiqueta,
          seatNum(c, cols, startNum, numberDirection),
          container.x + radius * Math.cos(rad),
          container.y + radius * Math.sin(rad),
          angle + 90,
          seatRadius
        )
      );
    }
  }

  return seats;
};

/** Asientos en grilla recortada a la forma del polígono del sector. */
export const generatePolygonLayout = (
  container: ShapeElement,
  params: LayoutParams
): SeatElement[] => {
  const { rowSpacing, colSpacing, seatRadius, startRow, startNum, numberDirection } = params;
  const points = container.points ?? [];
  if (points.length < 6) return [];

  const stepX = seatRadius * 2 + colSpacing;
  const stepY = seatRadius * 2 + rowSpacing;

  // Filas de la grilla que caen dentro del polígono (coordenadas relativas)
  const rows: { y: number; xs: number[] }[] = [];
  for (let py = seatRadius; py <= container.height - seatRadius; py += stepY) {
    const xs: number[] = [];
    for (let px = seatRadius; px <= container.width - seatRadius; px += stepX) {
      if (pointInPolygon(px, py, points)) xs.push(px);
    }
    if (xs.length > 0) rows.push({ y: py, xs });
  }

  const seats: SeatElement[] = [];
  rows.forEach((row, r) => {
    const rowEtiqueta = rowLabel(r, startRow);
    row.xs.forEach((px, c) => {
      seats.push(
        makeSeat(
          `seat-${container.id}-${r}-${c}`,
          container.id,
          rowEtiqueta,
          seatNum(c, row.xs.length, startNum, numberDirection),
          container.x + px,
          container.y + row.y,
          0,
          seatRadius
        )
      );
    });
  });

  return seats;
};

/** Filas concéntricas dentro de un sector arco (entre innerRadius y outerRadius). */
export const generateArcSectorLayout = (
  container: ShapeElement,
  params: LayoutParams
): SeatElement[] => {
  const { rows, rowSpacing, seatRadius, startRow, startNum, numberDirection } = params;
  const inner = (container.innerRadius ?? 100) + seatRadius * 2;
  const outer = (container.outerRadius ?? 200) - seatRadius * 2;
  const startAngle = container.startAngle ?? 200;
  const endAngle = container.endAngle ?? 340;
  if (outer <= inner) return [];

  const radiusStep = rows > 1 ? (outer - inner) / (rows - 1) : 0;
  const seats: SeatElement[] = [];

  for (let r = 0; r < rows; r++) {
    const rowEtiqueta = rowLabel(r, startRow);
    const radius = inner + r * radiusStep;
    const arcRad = ((endAngle - startAngle) * Math.PI) / 180;
    const count = Math.max(1, Math.floor((arcRad * radius) / (seatRadius * 2 + rowSpacing)));
    const angleStep = (endAngle - startAngle) / count;

    for (let c = 0; c < count; c++) {
      const angle = startAngle + angleStep * (c + 0.5);
      const rad = (angle * Math.PI) / 180;
      seats.push(
        makeSeat(
          `seat-arc-${container.id}-${r}-${c}`,
          container.id,
          rowEtiqueta,
          seatNum(c, count, startNum, numberDirection),
          container.x + radius * Math.cos(rad),
          container.y + radius * Math.sin(rad),
          angle + 90,
          seatRadius
        )
      );
    }
  }

  return seats;
};
