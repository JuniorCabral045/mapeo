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
} from 'lucide-react';
import { useVenueStore } from '../store/useVenueStore';
import { serializeVenue } from '../schema';
import { VenueMap } from '../types';

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
  } = useVenueStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddSection = (type: 'rectangle' | 'circle' | 'stage') => {
    const id = `${type}-${Date.now()}`;
    addElement({
      id,
      type: type === 'stage' ? 'stage' : 'section',
      name: type === 'stage' ? 'Escenario' : `Sector ${elementIds.length + 1}`,
      x: 300,
      y: 300,
      width: 200,
      height: 150,
      rotation: 0,
      visible: true,
      locked: false,
      opacity: type === 'stage' ? 1 : 0.2,
      zIndex: 5,
      fill: type === 'stage' ? '#1E293B' : '#3b82f6',
      isActive: true,
      sectionType: type === 'circle' ? 'circle' : 'rectangle',
      cornerRadius: 0,
      radius: type === 'circle' ? 100 : undefined,
    });
    useVenueStore.getState().selectElements([id]);
  };

  const currentMap = () => serializeVenue(elements, elementIds, venueName);

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
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-4">
      <div className="bg-[#1E293B]/80 backdrop-blur-xl border border-slate-700/50 p-2 rounded-2xl shadow-2xl flex items-center gap-2 ring-1 ring-white/5">
        {/* Nombre del recinto */}
        <input
          type="text"
          value={venueName}
          onChange={(e) => setVenueName(e.target.value)}
          className="bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-2 text-xs font-black text-white w-48 focus:border-blue-500 outline-none"
          placeholder="Nombre del recinto"
          title="Nombre del recinto"
        />

        <div className="h-6 w-px bg-slate-700/50 mx-1" />

        {/* Archivo */}
        <div className="flex items-center gap-1.5 px-1">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-slate-400 hover:text-white transition-all hover:bg-slate-700/50 rounded-xl"
            title="Importar JSON"
          >
            <Upload size={18} />
          </button>
          <input ref={fileInputRef} type="file" className="hidden" accept=".json" onChange={importJSON} />
          <button onClick={exportJSON} className="p-2.5 text-slate-400 hover:text-white transition-all hover:bg-slate-700/50 rounded-xl" title="Exportar JSON">
            <Download size={18} />
          </button>
        </div>

        {onSave && (
          <button
            onClick={() => onSave(currentMap())}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl text-xs font-black shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-md flex items-center gap-2"
          >
            <Save size={14} /> GUARDAR
          </button>
        )}
      </div>

      {/* Herramientas de edición */}
      <div className="flex items-center gap-3">
        <div className="bg-[#1E293B]/60 backdrop-blur-md border border-slate-700/40 p-1.5 rounded-2xl flex items-center gap-1 shadow-xl">
          <button
            onClick={() => setTool('select')}
            className={`p-2 rounded-xl transition-all ${currentTool === 'select' ? 'bg-blue-600/30 text-blue-400' : 'text-slate-400 hover:text-white'}`}
            title="Herramienta de Selección"
          >
            <MousePointer2 size={16} strokeWidth={3} />
          </button>
          <button
            onClick={() => setTool('pan')}
            className={`p-2 rounded-xl transition-all ${currentTool === 'pan' ? 'bg-blue-600/30 text-blue-400' : 'text-slate-400 hover:text-white'}`}
            title="Herramienta de Mano"
          >
            <Hand size={16} strokeWidth={3} />
          </button>
          <div className="h-5 w-px bg-slate-700/50 mx-0.5" />
          <button onClick={() => handleAddSection('rectangle')} className="p-2 hover:bg-slate-700/50 text-slate-400 hover:text-white rounded-xl transition-colors" title="Sector Rectangular">
            <Square size={16} strokeWidth={3} />
          </button>
          <button onClick={() => handleAddSection('circle')} className="p-2 hover:bg-slate-700/50 text-slate-400 hover:text-white rounded-xl transition-colors" title="Sector Circular">
            <CircleIcon size={16} strokeWidth={3} />
          </button>
          <button onClick={() => handleAddSection('stage')} className="p-2 hover:bg-slate-700/50 text-slate-400 hover:text-white rounded-xl transition-colors" title="Escenario">
            <Flag size={16} strokeWidth={3} />
          </button>
        </div>

        <div className="bg-[#1E293B]/60 backdrop-blur-md border border-slate-700/40 p-1.5 rounded-2xl flex items-center gap-1 shadow-xl">
          <button onClick={undo} disabled={historyIndex <= 0} className="p-2 text-slate-400 hover:text-white disabled:opacity-20 rounded-xl transition-colors" title="Deshacer">
            <Undo2 size={16} strokeWidth={3} />
          </button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2 text-slate-400 hover:text-white disabled:opacity-20 rounded-xl transition-colors" title="Rehacer">
            <Redo2 size={16} strokeWidth={3} />
          </button>
          <div className="h-5 w-px bg-slate-700/50 mx-0.5" />
          <button
            onClick={() => deleteElements(selectedIds)}
            disabled={selectedIds.length === 0}
            className="p-2 text-red-500/70 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-20 rounded-xl transition-colors"
            title="Eliminar selección"
          >
            <Trash2 size={16} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
};
