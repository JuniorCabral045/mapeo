import React, { useState } from 'react';
import { LayoutGrid, Maximize2 } from 'lucide-react';
import { useVenueStore } from '../../store/useVenueStore';
import { SeatGenerationParams, ShapeElement } from '../../types';
import { generarAsientosDelSector } from '../../utils/layout';
import { pluralizar } from '../../utils/sector';
import { inputClass, labelClass, rangeClass } from './styles';

type Parametros = Required<SeatGenerationParams>;

const POR_DEFECTO: Parametros = {
  rows: 5, cols: 10, seatRadius: 3.5, startRow: 'A', startNum: 1, numberDirection: 'ltr',
  arcRadius: 200, arcAngle: 120,
};

const entero = (valor: string, minimo: number) => Math.max(minimo, parseInt(valor) || minimo);

/**
 * Generador de butacas de un sector. Se monta con `key` por sector, así que
 * arranca con los parámetros con los que ese sector se generó la última vez.
 */
export const SeatGenerator: React.FC<{ sector: ShapeElement; asientos: number }> = ({ sector, asientos }) => {
  const [gen, setGen] = useState<Parametros>({ ...POR_DEFECTO, ...sector.generation });
  const [confirmando, setConfirmando] = useState(false);
  const circular = sector.sectionType === 'circle';
  const cambiar = (cambio: Partial<Parametros>) => setGen((g) => ({ ...g, ...cambio }));

  const generar = () => {
    setConfirmando(false);
    // Radio y ángulo del arco solo significan algo en un sector circular.
    const generation: SeatGenerationParams = { ...gen };
    if (!circular) {
      delete generation.arcRadius;
      delete generation.arcAngle;
    }
    useVenueStore.getState().regenerateSeats(sector.id, generarAsientosDelSector(sector, generation), generation);
  };

  const hecho = sector.generation;

  return (
    <section className="bg-purple-50 rounded-3xl border border-purple-100 p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-xl bg-[#6F3E8F]/10 flex items-center justify-center text-[#6F3E8F]">
          <LayoutGrid size={16} />
        </div>
        <div>
          <h3 className="text-xs font-bold text-[#6F3E8F] uppercase tracking-widest leading-none mb-1">Generador de Distribución</h3>
          <p className="text-[9px] text-[#6F3E8F]/60 font-bold">Auto-generar patrones de asientos</p>
        </div>
      </div>

      <div className="space-y-6">
        {circular && (
          <div className="space-y-3">
            <div className="flex justify-between">
              <label className={labelClass}>Radio / Curvatura</label>
              <span className="text-[10px] font-bold text-[#FF6B01]">{gen.arcRadius}m</span>
            </div>
            <input type="range" min="50" max="1000" value={gen.arcRadius} onChange={(e) => cambiar({ arcRadius: parseInt(e.target.value) })} className={rangeClass} />

            <div className="flex justify-between pt-2">
              <label className={labelClass}>Ángulo del Arco</label>
              <span className="text-[10px] font-bold text-[#FF6B01]">{gen.arcAngle}°</span>
            </div>
            <input type="range" min="30" max="360" value={gen.arcAngle} onChange={(e) => cambiar({ arcAngle: parseInt(e.target.value) })} className={rangeClass} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={labelClass}>Filas</label>
            <input type="number" min="1" value={gen.rows} onChange={(e) => cambiar({ rows: entero(e.target.value, 1) })} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>Asientos por Fila</label>
            <input type="number" min="1" value={gen.cols} onChange={(e) => cambiar({ cols: entero(e.target.value, 1) })} className={inputClass} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between">
            <label className={labelClass}>Tamaño de Asiento</label>
            <span className="text-[10px] font-bold text-[#FF6B01]">{gen.seatRadius}px</span>
          </div>
          <input type="range" min="2" max="15" step="0.5" value={gen.seatRadius} onChange={(e) => cambiar({ seatRadius: parseFloat(e.target.value) })} className={rangeClass} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={labelClass}>Fila inicial</label>
            <input
              type="text"
              maxLength={1}
              value={gen.startRow}
              onChange={(e) => cambiar({ startRow: e.target.value.toUpperCase().replace(/[^A-Z]/g, '') })}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>Número inicial</label>
            <input type="number" min="1" value={gen.startNum} onChange={(e) => cambiar({ startNum: entero(e.target.value, 1) })} className={inputClass} />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>Dirección de numeración</label>
          <select
            value={gen.numberDirection}
            onChange={(e) => cambiar({ numberDirection: e.target.value as Parametros['numberDirection'] })}
            className={inputClass}
          >
            <option value="ltr">Izquierda → Derecha</option>
            <option value="rtl">Derecha → Izquierda</option>
            <option value="ttb">Arriba → Abajo</option>
            <option value="btt">Abajo → Arriba</option>
          </select>
        </div>

        <div className="pt-2">
          {confirmando ? (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 space-y-3">
              <p className="text-[10px] font-bold text-amber-700 leading-relaxed">
                {pluralizar(asientos, 'Se reemplaza', 'Se reemplazan')} {asientos} {pluralizar(asientos, 'asiento', 'asientos')}.
                Los QR ya impresos de este sector dejan de coincidir con sus butacas.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={generar}
                  className="bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors"
                >
                  Regenerar
                </button>
                <button
                  onClick={() => setConfirmando(false)}
                  className="bg-white border border-gray-200 text-gray-500 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => (asientos > 0 ? setConfirmando(true) : generar())}
              className="w-full bg-[#FF6B01] hover:bg-[#e86000] text-white py-3 rounded-2xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 group"
            >
              {asientos > 0 ? 'REGENERAR DISTRIBUCIÓN' : 'GENERAR DISTRIBUCIÓN'}
              <Maximize2 size={14} className="group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>

        {hecho && (
          <p className="text-[9px] text-[#6F3E8F]/60 font-bold text-center pt-2">
            Generado {hecho.rows} × {hecho.cols}, desde {hecho.startRow}{hecho.startNum}
            {circular && hecho.arcRadius !== undefined && hecho.arcAngle !== undefined && (
              <>, radio {hecho.arcRadius}m, arco {hecho.arcAngle}°</>
            )}
          </p>
        )}
      </div>
    </section>
  );
};
