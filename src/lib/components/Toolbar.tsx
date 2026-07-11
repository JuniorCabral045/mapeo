import React, { useRef } from 'react';
import {
  Circle as CircleIcon,
  Flag,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Upload,
  MousePointer2,
  Hand,
  Square,
  Save,
  Hexagon,
  Spline,
  ImagePlus,
  ImageOff,
} from 'lucide-react';
import { useVenueStore } from '../store/useVenueStore';
import { serializeVenue } from '../schema';
import { VenueMap } from '../types';
import { loadScaledImage } from '../utils/image';

interface ToolbarProps {
  onSave?: (map: VenueMap) => void | Promise<void>;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onSave }) => {
  const {
    currentTool, setTool,
    undo, redo, historyIndex, history,
    selectedIds, deleteElements,
    addElement, elements, elementIds,
    venueName, setVenueName, loadMap,
    backgroundImage, setBackgroundImage, removeBackgroundImage, updateBackgroundOpacity,
  } = useVenueStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const planoInputRef = useRef<HTMLInputElement>(null);

  const handlePlanoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    loadScaledImage(file)
      .then(setBackgroundImage)
      .catch(() => alert('No se pudo cargar el plano'));
    e.target.value = '';
  };

  const handleAddSection = (type: 'rectangle' | 'circle' | 'stage' | 'arc') => {
    const id = `${type}-${Date.now()}`;
    addElement({
      id,
      type: type === 'stage' ? 'stage' : 'section',
      name: type === 'stage' ? 'Escenario' : `Sector ${elementIds.length + 1}`,
      x: type === 'arc' ? 400 : 300,
      y: type === 'arc' ? 400 : 300,
      width: type === 'arc' ? 440 : 200,
      height: type === 'arc' ? 440 : 150,
      rotation: 0,
      visible: true,
      locked: false,
      opacity: type === 'stage' ? 1 : 0.2,
      zIndex: 5,
      fill: '#6F3E8F',
      isActive: true,
      sectionType: type === 'circle' ? 'circle' : type === 'arc' ? 'arc' : 'rectangle',
      cornerRadius: 0,
      radius: type === 'circle' ? 100 : undefined,
      innerRadius: type === 'arc' ? 120 : undefined,
      outerRadius: type === 'arc' ? 220 : undefined,
      startAngle: type === 'arc' ? 200 : undefined,
      endAngle: type === 'arc' ? 340 : undefined,
    });
    useVenueStore.getState().selectElements([id]);
  };

  const currentMap = () => serializeVenue(elements, elementIds, venueName, undefined, backgroundImage ?? undefined);

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(currentMap(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${venueName.toLowerCase().replace(/\s+/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const map = JSON.parse(ev.target?.result as string) as VenueMap;
        if (!map.version || !Array.isArray(map.sectors)) throw new Error('formato inválido');
        loadMap(map);
      } catch {
        alert('Error al importar: el archivo no es un mapeo válido');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-3">
      <div className="bg-white border border-gray-200 p-2 rounded-2xl shadow-lg flex items-center gap-2">
        {/* Nombre del recinto */}
        <input
          type="text"
          value={venueName}
          onChange={(e) => setVenueName(e.target.value)}
          className="bg-indigo-50 border border-transparent rounded-xl px-4 py-2 text-xs font-bold text-gray-800 w-48 focus:border-[#FF6B01] outline-none transition-colors placeholder:text-gray-400"
          placeholder="Nombre del recinto"
          title="Nombre del recinto"
        />

        <div className="h-6 w-px bg-gray-200 mx-1" />

        {/* Archivo */}
        <div className="flex items-center gap-1.5 px-1">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-gray-400 hover:text-[#6F3E8F] transition-all hover:bg-purple-50 rounded-xl"
            title="Importar JSON"
          >
            <Upload size={18} />
          </button>
          <input ref={fileInputRef} type="file" className="hidden" accept=".json" onChange={importJSON} />
          <button onClick={exportJSON} className="p-2.5 text-gray-400 hover:text-[#6F3E8F] transition-all hover:bg-purple-50 rounded-xl" title="Exportar JSON">
            <Download size={18} />
          </button>
        </div>

        {onSave && (
          <button
            onClick={() => onSave(currentMap())}
            className="bg-[#FF6B01] hover:bg-[#e86000] text-white px-6 py-2 rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm flex items-center gap-2"
          >
            <Save size={14} /> GUARDAR
          </button>
        )}
      </div>

      {/* Herramientas de edición */}
      <div className="flex items-center gap-3">
        <div className="bg-white border border-gray-200 p-1.5 rounded-2xl flex items-center gap-1 shadow-lg">
          <button
            onClick={() => setTool('select')}
            className={`p-2 rounded-xl transition-all ${currentTool === 'select' ? 'bg-[#FF6B01]/10 text-[#FF6B01]' : 'text-gray-400 hover:text-[#6F3E8F] hover:bg-purple-50'}`}
            title="Herramienta de Selección"
          >
            <MousePointer2 size={16} strokeWidth={3} />
          </button>
          <button
            onClick={() => setTool('pan')}
            className={`p-2 rounded-xl transition-all ${currentTool === 'pan' ? 'bg-[#FF6B01]/10 text-[#FF6B01]' : 'text-gray-400 hover:text-[#6F3E8F] hover:bg-purple-50'}`}
            title="Herramienta de Mano"
          >
            <Hand size={16} strokeWidth={3} />
          </button>
          <div className="h-5 w-px bg-gray-200 mx-0.5" />
          <button onClick={() => handleAddSection('rectangle')} className="p-2 hover:bg-purple-50 text-gray-400 hover:text-[#6F3E8F] rounded-xl transition-colors" title="Sector Rectangular">
            <Square size={16} strokeWidth={3} />
          </button>
          <button onClick={() => handleAddSection('circle')} className="p-2 hover:bg-purple-50 text-gray-400 hover:text-[#6F3E8F] rounded-xl transition-colors" title="Sector Circular">
            <CircleIcon size={16} strokeWidth={3} />
          </button>
          <button onClick={() => handleAddSection('arc')} className="p-2 hover:bg-purple-50 text-gray-400 hover:text-[#6F3E8F] rounded-xl transition-colors" title="Sector Curvo (estadio)">
            <Spline size={16} strokeWidth={3} />
          </button>
          <button
            onClick={() => setTool('polygon')}
            className={`p-2 rounded-xl transition-all ${currentTool === 'polygon' ? 'bg-[#FF6B01]/10 text-[#FF6B01]' : 'text-gray-400 hover:text-[#6F3E8F] hover:bg-purple-50'}`}
            title="Sector Poligonal (clic para vértices, doble clic o Enter para cerrar)"
          >
            <Hexagon size={16} strokeWidth={3} />
          </button>
          <button onClick={() => handleAddSection('stage')} className="p-2 hover:bg-purple-50 text-gray-400 hover:text-[#6F3E8F] rounded-xl transition-colors" title="Escenario">
            <Flag size={16} strokeWidth={3} />
          </button>
        </div>

        {/* Plano de fondo para calcar */}
        <div className="bg-white border border-gray-200 p-1.5 rounded-2xl flex items-center gap-1 shadow-lg">
          <input ref={planoInputRef} type="file" className="hidden" accept="image/*" onChange={handlePlanoUpload} />
          <button
            onClick={() => planoInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-[#6F3E8F] hover:bg-purple-50 rounded-xl transition-colors"
            title="Subir plano de referencia"
          >
            <ImagePlus size={16} strokeWidth={3} />
          </button>
          {backgroundImage && (
            <>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={backgroundImage.opacity}
                onChange={(e) => updateBackgroundOpacity(parseFloat(e.target.value))}
                className="w-16 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#FF6B01]"
                title="Opacidad del plano"
              />
              <button
                onClick={removeBackgroundImage}
                className="p-2 text-red-500/70 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                title="Quitar plano"
              >
                <ImageOff size={16} strokeWidth={3} />
              </button>
            </>
          )}
        </div>

        <div className="bg-white border border-gray-200 p-1.5 rounded-2xl flex items-center gap-1 shadow-lg">
          <button onClick={undo} disabled={historyIndex <= 0} className="p-2 text-gray-400 hover:text-[#6F3E8F] hover:bg-purple-50 disabled:opacity-20 rounded-xl transition-colors" title="Deshacer">
            <Undo2 size={16} strokeWidth={3} />
          </button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2 text-gray-400 hover:text-[#6F3E8F] hover:bg-purple-50 disabled:opacity-20 rounded-xl transition-colors" title="Rehacer">
            <Redo2 size={16} strokeWidth={3} />
          </button>
          <div className="h-5 w-px bg-gray-200 mx-0.5" />
          <button
            onClick={() => deleteElements(selectedIds)}
            disabled={selectedIds.length === 0}
            className="p-2 text-red-500/70 hover:text-red-500 hover:bg-red-50 disabled:opacity-20 rounded-xl transition-colors"
            title="Eliminar selección"
          >
            <Trash2 size={16} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
};
