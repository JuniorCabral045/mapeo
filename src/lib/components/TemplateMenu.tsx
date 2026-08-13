import React, { useState } from 'react';
import { LayoutTemplate } from 'lucide-react';
import { useVenueStore } from '../store/useVenueStore';
import { TEMPLATES } from '../utils/templates';

/** Inserta una plantilla. Nunca reemplaza: si ya hay contenido, avisa. */
export const TemplateMenu: React.FC = () => {
  const { elementIds, applyTemplate } = useVenueStore();
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setAbierto((v) => !v)}
        className={`p-2 rounded-xl transition-all ${abierto ? 'bg-[#FF6B01]/10 text-[#FF6B01]' : 'text-gray-400 hover:text-[#6F3E8F] hover:bg-purple-50'}`}
        title="Plantillas de recinto"
      >
        <LayoutTemplate size={16} strokeWidth={3} />
      </button>

      {abierto && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-64 bg-white border border-gray-200 rounded-2xl shadow-xl p-2 z-[110]">
          {elementIds.length > 0 && (
            <p className="text-[9px] font-bold text-amber-700 bg-amber-50 rounded-xl px-3 py-2 mb-2 leading-relaxed">
              La plantilla se agrega a lo que ya hay dibujado; no reemplaza nada.
            </p>
          )}
          {TEMPLATES.map((plantilla) => {
            const cantidad = plantilla.build().filter((e) => e.type === 'seat').length;
            return (
              <button
                key={plantilla.id}
                onClick={() => { applyTemplate(plantilla.build()); setAbierto(false); }}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-purple-50 transition-colors group"
              >
                <span className="block text-xs font-bold text-gray-700 group-hover:text-[#6F3E8F]">
                  {plantilla.name}
                </span>
                <span className="block text-[10px] text-gray-400 font-bold">
                  {plantilla.description} · {cantidad} asientos
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
