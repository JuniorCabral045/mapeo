import React from 'react';
import { COLOR_POR_ESTADO } from '../utils/labels';

const FILAS = [
  { clave: 'available', texto: 'Disponible', color: COLOR_POR_ESTADO.available },
  { clave: 'occupied', texto: 'Ocupado', color: COLOR_POR_ESTADO.occupied },
  { clave: 'reserved', texto: 'Reservado', color: COLOR_POR_ESTADO.reserved },
  { clave: 'blocked', texto: 'Bloqueado', color: COLOR_POR_ESTADO.blocked },
  { clave: 'inactivo', texto: 'Sector cerrado', color: '#C7CBD4' },
];

/** Qué significa cada color. Solo lista los estados que el mapa tiene de verdad. */
export const Leyenda: React.FC<{
  presentes: Set<string>;
  elegidos: number;
  maxSeats?: number;
}> = ({ presentes, elegidos, maxSeats }) => {
  const filas = FILAS.filter((fila) => presentes.has(fila.clave));
  if (filas.length === 0) return null;

  return (
    <div className="absolute left-4 bottom-4 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-lg px-4 py-3 flex flex-col gap-2">
      {filas.map((fila) => (
        <div key={fila.clave} className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-[3px] shrink-0"
            style={{ backgroundColor: fila.color, opacity: fila.clave === 'available' ? 1 : 0.6 }}
          />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            {fila.texto}
          </span>
        </div>
      ))}
      {elegidos > 0 && (
        <div className="flex items-center gap-2 pt-1 border-t border-gray-200">
          <span className="w-3 h-3 rounded-[3px] shrink-0 bg-[#FF6B01]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF6B01]">
            {elegidos} {elegidos === 1 ? 'elegido' : 'elegidos'}
            {maxSeats !== undefined && ` de ${maxSeats}`}
          </span>
        </div>
      )}
    </div>
  );
};

const botonControl =
  'w-9 h-9 flex items-center justify-center text-gray-500 hover:text-[#FF6B01] hover:bg-orange-50 ' +
  'transition-colors text-base font-bold leading-none select-none';

const botonTexto =
  'border rounded-xl shadow-lg w-9 h-9 flex items-center justify-center text-[9px] font-bold uppercase tracking-wider transition-colors';

const botonTextoInactivo = 'bg-white border-gray-200 text-gray-500 hover:text-[#FF6B01] hover:bg-orange-50';

/** Zoom, nombres de sector y encuadre: en una pantalla táctil sin rueda no hay otra forma de acercarse. */
export const ControlesDeVista: React.FC<{
  onZoom: (factor: number) => void;
  onEncuadrar: () => void;
  mostrarNombres: boolean;
  onAlternarNombres: () => void;
}> = ({ onZoom, onEncuadrar, mostrarNombres, onAlternarNombres }) => (
  <div className="absolute right-4 bottom-4 flex flex-col gap-2">
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden flex flex-col">
      <button type="button" onClick={() => onZoom(1.2)} className={botonControl} title="Acercar" aria-label="Acercar">+</button>
      <div className="h-px bg-gray-200 mx-2" />
      <button type="button" onClick={() => onZoom(0.8)} className={botonControl} title="Alejar" aria-label="Alejar">−</button>
    </div>
    <button
      type="button"
      onClick={onAlternarNombres}
      className={`${botonTexto} ${mostrarNombres ? 'bg-[#FF6B01] border-[#FF6B01] text-white' : botonTextoInactivo}`}
      title={mostrarNombres ? 'Ocultar los nombres de sector' : 'Mostrar los nombres de sector'}
      aria-pressed={mostrarNombres}
    >
      Abc
    </button>
    <button
      type="button"
      onClick={onEncuadrar}
      className={`${botonTexto} ${botonTextoInactivo}`}
      title="Ver todo el recinto"
      aria-label="Ver todo el recinto"
    >
      Todo
    </button>
  </div>
);
