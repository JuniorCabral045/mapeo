import { BBox, VenueElement, GridConfig } from '../types/venue';
import RBush from 'rbush';

interface InternalBBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  id: string;
}

export interface SnappedPos {
  x: number;
  y: number;
  guides: { type: 'v' | 'h', pos: number }[];
}

const SNAP_THRESHOLD = 5;

export const calculateSnapping = (
  x: number,
  y: number,
  width: number,
  height: number,
  excludedIds: string[],
  spatialIndex: RBush<InternalBBox>,
  gridConfig: GridConfig
): SnappedPos => {
  let snappedX = x;
  let snappedY = y;
  const guides: { type: 'v' | 'h', pos: number }[] = [];

  // Grid Snap
  if (gridConfig.enabled) {
    snappedX = Math.round(x / gridConfig.size) * gridConfig.size;
    snappedY = Math.round(y / gridConfig.size) * gridConfig.size;
  }

  if (gridConfig.snapToElements) {
    // Search area
    const searchArea = {
      minX: x - 100,
      minY: y - 100,
      maxX: x + width + 100,
      maxY: y + height + 100
    };

    const nearby = spatialIndex.search(searchArea).filter(item => !excludedIds.includes(item.id));

    for (const item of nearby) {
      // Horizontal Snaps (y-axis)
      const yTargets = [item.minY, item.maxY, (item.minY + item.maxY) / 2];
      const myYTargets = [y, y + height, y + height / 2];

      for (const target of yTargets) {
        for (const myY of myYTargets) {
          if (Math.abs(myY - target) < SNAP_THRESHOLD) {
            snappedY = target - (myY - y);
            guides.push({ type: 'h', pos: target });
          }
        }
      }

      // Vertical Snaps (x-axis)
      const xTargets = [item.minX, item.maxX, (item.minX + item.maxX) / 2];
      const myXTargets = [x, x + width, x + width / 2];

      for (const target of xTargets) {
        for (const myX of myXTargets) {
          if (Math.abs(myX - target) < SNAP_THRESHOLD) {
            snappedX = target - (myX - x);
            guides.push({ type: 'v', pos: target });
          }
        }
      }
    }
  }

  return { x: snappedX, y: snappedY, guides };
};
