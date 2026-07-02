import { SeatElement, ShapeElement } from '../types';

export interface LayoutParams {
  rows: number;
  cols: number;
  rowSpacing: number;
  colSpacing: number;
  seatRadius: number;
  startRow: string;
  startNum: number;
}

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

/** Genera asientos en grilla rectangular, centrados dentro del sector. */
export const generateRectLayout = (
  container: ShapeElement,
  params: LayoutParams
): SeatElement[] => {
  const seats: SeatElement[] = [];
  const { rows, cols, rowSpacing, colSpacing, seatRadius, startRow, startNum } = params;

  const totalW = cols * (seatRadius * 2 + colSpacing) - colSpacing;
  const totalH = rows * (seatRadius * 2 + rowSpacing) - rowSpacing;

  const startX = container.x + (container.width - totalW) / 2 + seatRadius;
  const startY = container.y + (container.height - totalH) / 2 + seatRadius;

  for (let r = 0; r < rows; r++) {
    const rowLabel = String.fromCharCode(startRow.charCodeAt(0) + r);
    for (let c = 0; c < cols; c++) {
      seats.push(
        makeSeat(
          `seat-${container.id}-${r}-${c}`,
          container.id,
          rowLabel,
          startNum + c,
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

/** Genera asientos en arco radial (curvas de estadio) alrededor del origen del sector. */
export const generateArcLayout = (
  container: ShapeElement,
  params: LayoutParams & { innerRadius: number; startAngle: number; endAngle: number }
): SeatElement[] => {
  const seats: SeatElement[] = [];
  const { rows, cols, rowSpacing, seatRadius, startRow, startNum, innerRadius, startAngle, endAngle } = params;

  const angleStep = (endAngle - startAngle) / (cols - 1 || 1);

  for (let r = 0; r < rows; r++) {
    const rowLabel = String.fromCharCode(startRow.charCodeAt(0) + r);
    const radius = innerRadius + r * (seatRadius * 2 + rowSpacing);

    for (let c = 0; c < cols; c++) {
      const angle = startAngle + c * angleStep;
      const rad = (angle * Math.PI) / 180;
      seats.push(
        makeSeat(
          `seat-arc-${container.id}-${r}-${c}`,
          container.id,
          rowLabel,
          startNum + c,
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
