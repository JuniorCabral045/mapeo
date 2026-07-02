export const createRoundedRectPath = (
  x: number,
  y: number,
  width: number,
  height: number,
  radius: { topLeft: number; topRight: number; bottomLeft: number; bottomRight: number } | number
) => {
  const r = typeof radius === 'number'
    ? { topLeft: radius, topRight: radius, bottomLeft: radius, bottomRight: radius }
    : radius;

  // Ensure radii don't exceed dimensions
  const tl = Math.min(r.topLeft, width / 2, height / 2);
  const tr = Math.min(r.topRight, width / 2, height / 2);
  const bl = Math.min(r.bottomLeft, width / 2, height / 2);
  const br = Math.min(r.bottomRight, width / 2, height / 2);

  return [
    `M ${x + tl} ${y}`,
    `L ${x + width - tr} ${y}`,
    `Q ${x + width} ${y} ${x + width} ${y + tr}`,
    `L ${x + width} ${y + height - br}`,
    `Q ${x + width} ${y + height} ${x + width - br} ${y + height}`,
    `L ${x + bl} ${y + height}`,
    `Q ${x} ${y + height} ${x} ${y + height - bl}`,
    `L ${x} ${y + tl}`,
    `Q ${x} ${y} ${x + tl} ${y}`,
    'Z'
  ].join(' ');
};
