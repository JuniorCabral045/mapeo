import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { mapaDelEditor, useVenueStore } from '../store/useVenueStore';
import { VenueMap } from '../types';
import { validarMapa, type Problema } from '../utils/validation';

/**
 * Guardar pasa por `validarMapa`: lo que sale de acá es el contrato con el
 * backend y los ids impresos en los QR. No bloquea, informa y deja guardar igual.
 */
export const SaveButton: React.FC<{ onSave: (map: VenueMap) => void | Promise<void> }> = ({ onSave }) => {
  const [revision, setRevision] = useState<Problema[] | null>(null);
  const currentMap = () => mapaDelEditor(useVenueStore.getState());
  const selectElements = useVenueStore((s) => s.selectElements);

  return (
    <div className="relative">
      <button
        onClick={() => {
          const mapa = currentMap();
          const problemas = validarMapa(mapa);
          if (problemas.length === 0) onSave(mapa);
          else setRevision(problemas);
        }}
        className="bg-[#FF6B01] hover:bg-[#e86000] text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm shadow-orange-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm flex items-center gap-2"
      >
        <Save size={14} /> GUARDAR
      </button>

      {revision && (
        <div className="absolute top-10 right-0 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl p-3 z-[120]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
            Antes de guardar
          </p>
          <ul className="space-y-2 max-h-52 overflow-y-auto">
            {revision.map((problema, i) => (
              <li key={i} className="flex gap-2">
                <span
                  className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${
                    problema.severidad === 'error' ? 'bg-red-500' : 'bg-amber-400'
                  }`}
                />
                <button
                  onClick={() => { selectElements(problema.ids); setRevision(null); }}
                  className="text-left text-[11px] leading-snug text-gray-600 hover:text-[#6F3E8F]"
                  title="Seleccionar en el lienzo"
                >
                  {problema.mensaje}
                </button>
              </li>
            ))}
          </ul>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              onClick={() => { setRevision(null); onSave(currentMap()); }}
              className="bg-[#FF6B01] hover:bg-[#e86000] text-white py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors"
            >
              Guardar igual
            </button>
            <button
              onClick={() => setRevision(null)}
              className="bg-white border border-gray-200 text-gray-500 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors"
            >
              Revisar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
