import React from 'react';
import {
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
} from 'lucide-react';
import { useVenueStore } from '../store/useVenueStore';
import type { AlignMode, DistributeAxis } from '../utils/align';

/** Aparece solo con dos o más elementos seleccionados. */
export const AlignBar: React.FC = () => {
  const { selectedIds, alignSelection, distributeSelection } = useVenueStore();
  if (selectedIds.length < 2) return null;

  const boton = 'p-2 text-gray-400 hover:text-[#6F3E8F] hover:bg-purple-50 rounded-xl transition-colors disabled:opacity-20';

  const alinear: { mode: AlignMode; icono: React.ReactNode; titulo: string }[] = [
    { mode: 'left', icono: <AlignStartVertical size={16} strokeWidth={3} />, titulo: 'Alinear a la izquierda' },
    { mode: 'center-x', icono: <AlignCenterVertical size={16} strokeWidth={3} />, titulo: 'Centrar horizontalmente' },
    { mode: 'right', icono: <AlignEndVertical size={16} strokeWidth={3} />, titulo: 'Alinear a la derecha' },
    { mode: 'top', icono: <AlignStartHorizontal size={16} strokeWidth={3} />, titulo: 'Alinear arriba' },
    { mode: 'center-y', icono: <AlignCenterHorizontal size={16} strokeWidth={3} />, titulo: 'Centrar verticalmente' },
    { mode: 'bottom', icono: <AlignEndHorizontal size={16} strokeWidth={3} />, titulo: 'Alinear abajo' },
  ];

  const distribuir: { axis: DistributeAxis; icono: React.ReactNode; titulo: string }[] = [
    { axis: 'x', icono: <AlignHorizontalJustifyCenter size={16} strokeWidth={3} />, titulo: 'Distribuir en horizontal' },
    { axis: 'y', icono: <AlignVerticalJustifyCenter size={16} strokeWidth={3} />, titulo: 'Distribuir en vertical' },
  ];

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[95] bg-white border border-gray-200 p-1.5 rounded-2xl shadow-lg flex items-center gap-1">
      {alinear.map((a) => (
        <button key={a.mode} onClick={() => alignSelection(a.mode)} className={boton} title={a.titulo}>
          {a.icono}
        </button>
      ))}
      <div className="w-px h-5 bg-gray-200 mx-1" />
      {distribuir.map((d) => (
        <button
          key={d.axis}
          onClick={() => distributeSelection(d.axis)}
          disabled={selectedIds.length < 3}
          className={boton}
          title={`${d.titulo} (3 o más)`}
        >
          {d.icono}
        </button>
      ))}
    </div>
  );
};
