import React, { useEffect, useState } from 'react';
import { Image as KonvaImage } from 'react-konva';
import { useVenueStore } from '../../store/useVenueStore';

/** Plano de referencia para calcar (solo editor, no interactivo). */
export const BackgroundLayer: React.FC = () => {
  const backgroundImage = useVenueStore((s) => s.backgroundImage);
  const src = backgroundImage?.src;
  const [img, setImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    setImg(null);
    if (!src) return;
    // Si el plano cambia antes de que termine de cargar, la carga vieja no debe pisar a la nueva.
    let vigente = true;
    const image = new window.Image();
    image.onload = () => {
      if (vigente) setImg(image);
    };
    image.src = src;
    return () => {
      vigente = false;
    };
  }, [src]);

  if (!backgroundImage || !img) return null;
  return (
    <KonvaImage
      image={img}
      x={backgroundImage.x}
      y={backgroundImage.y}
      width={backgroundImage.width}
      height={backgroundImage.height}
      opacity={backgroundImage.opacity}
      listening={false}
    />
  );
};
