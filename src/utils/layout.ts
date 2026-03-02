import { Seat, ShapeElement } from '../types/venue';

export interface LayoutParams {
  rows: number;
  cols: number;
  rowSpacing: number;
  colSpacing: number;
  seatRadius: number;
  startRow: string;
  startNum: number;
}

export const generateRectLayout = (
  container: ShapeElement,
  params: LayoutParams
): Seat[] => {
  const seats: Seat[] = [];
  const { rows, cols, rowSpacing, colSpacing, seatRadius, startRow, startNum } = params;

  // Center the grid in the container
  const totalW = cols * (seatRadius * 2 + colSpacing) - colSpacing;
  const totalH = rows * (seatRadius * 2 + rowSpacing) - rowSpacing;
  
  const startX = container.x + (container.width - totalW) / 2 + seatRadius;
  const startY = container.y + (container.height - totalH) / 2 + seatRadius;

  for (let r = 0; r < rows; r++) {
    const rowLabel = String.fromCharCode(startRow.charCodeAt(0) + r);
    for (let c = 0; c < cols; c++) {
      const id = `seat-${container.id}-${r}-${c}`;
      seats.push({
        id,
        type: 'seat',
        name: `${rowLabel}${startNum + c}`,
        x: startX + c * (seatRadius * 2 + colSpacing),
        y: startY + r * (seatRadius * 2 + rowSpacing),
        rotation: 0,
        visible: true,
        locked: false,
        opacity: 1,
        zIndex: 10,
        sectionId: container.id,
        row: rowLabel,
        number: (startNum + c).toString(),
        status: 'available',
        radius: seatRadius,
      });
    }
  }

  return seats;
};

export const generateArcLayout = (
  container: ShapeElement,
  params: LayoutParams & { innerRadius: number, startAngle: number, endAngle: number }
): Seat[] => {
  const seats: Seat[] = [];
  const { rows, cols, rowSpacing, seatRadius, startRow, startNum, innerRadius, startAngle, endAngle } = params;

  const angleRange = endAngle - startAngle;
  const angleStep = angleRange / (cols - 1 || 1);

  for (let r = 0; r < rows; r++) {
    const rowLabel = String.fromCharCode(startRow.charCodeAt(0) + r);
    const radius = innerRadius + r * (seatRadius * 2 + rowSpacing);
    
    for (let c = 0; c < cols; c++) {
      const angle = startAngle + c * angleStep;
      const rad = (angle * Math.PI) / 180;
      
      const id = `seat-arc-${container.id}-${r}-${c}`;
      seats.push({
        id,
        type: 'seat',
        name: `${rowLabel}${startNum + c}`,
        x: container.x + radius * Math.cos(rad),
        y: container.y + radius * Math.sin(rad),
        rotation: angle + 90,
        visible: true,
        locked: false,
        opacity: 1,
        zIndex: 10,
        sectionId: container.id,
        row: rowLabel,
        number: (startNum + c).toString(),
        status: 'available',
        radius: seatRadius,
      });
    }
  }

  return seats;
};
