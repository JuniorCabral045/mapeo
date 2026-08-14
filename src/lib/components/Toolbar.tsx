import React, { useRef, useState } from 'react';
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
  Grid3x3,
  Tag,
  Magnet,
  Boxes,
  Copy,
  FlipHorizontal2,
  FlipVertical2,
} from 'lucide-react';
import { useVenueStore } from '../store/useVenueStore';
import { serializeVenue } from '../schema';
import { VenueMap } from '../types';
import { loadScaledImage } from '../utils/image';
import { validarMapa, type Problema } from '../utils/validation';
import { TemplateMenu } from './TemplateMenu';

interface ToolbarProps {
  onSave?: (map: VenueMap) => void | Promise<void>;
  onDelete: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onSave, onDelete }) => {
  const {
    currentTool, setTool,
    undo, redo, historyIndex, history,
    selectedIds,
    addElement, elements, elementIds,
    venueName, setVenueName, loadMap,
    backgroundImage, setBackgroundImage, removeBackgroundImage, updateBackgroundOpacity,
    gridConfig, setGridConfig, sectorLabels, setSectorLabels,
    selectElements,
    duplicateSectors,
  } = useVenueStore();

  // Problemas detectados al intentar guardar. Vacío = no se está preguntando nada.
  const [revision, setRevision] = useState<Problema[] | null>(null);

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

  const sectoresSeleccionados = selectedIds.filter((id) => elements[id] && elements[id].type !== 'seat');

  const duplicar = (mirror: 'horizontal' | 'vertical' | null) => {
    const paso = gridConfig.size * 2;
    duplicateSectors(sectoresSeleccionados, {
      dx: mirror === 'vertical' ? 0 : paso,
      dy: mirror === 'vertical' ? paso : 0,
      mirror,
    });
  };

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
    <div className="shrink-0 bg-white border-b border-gray-200 px-3 py-1.5 flex items-center gap-x-1 gap-y-1.5 flex-wrap">
      <div className="flex items-center gap-2">
        {/* Nombre del recinto */}
        <input
          type="text"
          value={venueName}
          onChange={(e) => setVenueName(e.target.value)}
          className="bg-indigo-50 border border-transparent rounded-lg px-3 py-1.5 text-xs font-bold text-gray-800 w-36 focus:border-[#FF6B01] outline-none transition-colors placeholder:text-gray-400"
          placeholder="Nombre del recinto"
          title="Nombre del recinto"
        />

        <div className="h-6 w-px bg-gray-200 mx-1" />

        {/* Archivo */}
        <div className="flex items-center gap-1.5 px-1">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-[#6F3E8F] transition-all hover:bg-purple-50 rounded-xl"
            title="Importar JSON"
          >
            <Upload size={18} />
          </button>
          <input ref={fileInputRef} type="file" className="hidden" accept=".json" onChange={importJSON} />
          <button onClick={exportJSON} className="p-2 text-gray-400 hover:text-[#6F3E8F] transition-all hover:bg-purple-50 rounded-xl" title="Exportar JSON">
            <Download size={18} />
          </button>
        </div>

        {onSave && (
          <div className="relative">
            <button
              onClick={() => {
                // Revisar antes de guardar: lo que sale de acá es el contrato con
                // el backend y los ids que se imprimen en los QR de las butacas.
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
        )}
      </div>

      {/* Herramientas de edición */}
      <>
        <div className="flex items-center gap-0.5 pl-2 ml-1 border-l border-gray-200">
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
          <div className="h-5 w-px bg-gray-200 mx-0.5" />
          <TemplateMenu />
        </div>

        {/* Grilla e imán */}
        <div className="flex items-center gap-0.5 pl-2 ml-1 border-l border-gray-200">
          <button
            onClick={() => setGridConfig({ visible: !gridConfig.visible })}
            className={`p-2 rounded-xl transition-all ${gridConfig.visible ? 'bg-[#FF6B01]/10 text-[#FF6B01]' : 'text-gray-400 hover:text-[#6F3E8F] hover:bg-purple-50'}`}
            title="Mostrar grilla"
          >
            <Grid3x3 size={16} strokeWidth={3} />
          </button>
          <button
            onClick={() => setGridConfig({ enabled: !gridConfig.enabled })}
            className={`p-2 rounded-xl transition-all ${gridConfig.enabled ? 'bg-[#FF6B01]/10 text-[#FF6B01]' : 'text-gray-400 hover:text-[#6F3E8F] hover:bg-purple-50'}`}
            title="Imán a la grilla"
          >
            <Magnet size={16} strokeWidth={3} />
          </button>
          <button
            onClick={() => setGridConfig({ snapToElements: !gridConfig.snapToElements })}
            className={`p-2 rounded-xl transition-all ${gridConfig.snapToElements ? 'bg-[#FF6B01]/10 text-[#FF6B01]' : 'text-gray-400 hover:text-[#6F3E8F] hover:bg-purple-50'}`}
            title="Imán a otros sectores (bordes y centros)"
          >
            <Boxes size={16} strokeWidth={3} />
          </button>
          <button
            onClick={() => setSectorLabels(!sectorLabels)}
            className={`p-2 rounded-xl transition-all ${sectorLabels ? 'bg-[#FF6B01]/10 text-[#FF6B01]' : 'text-gray-400 hover:text-[#6F3E8F] hover:bg-purple-50'}`}
            title="Mostrar el nombre de cada sector sobre el lienzo"
          >
            <Tag size={16} strokeWidth={3} />
          </button>
          <select
            value={gridConfig.size}
            onChange={(e) => setGridConfig({ size: parseInt(e.target.value) })}
            className="bg-indigo-50 border border-transparent rounded-xl px-2 py-1.5 text-[10px] font-bold text-gray-600 focus:border-[#FF6B01] outline-none"
            title="Paso de la grilla"
          >
            {[5, 10, 20, 50].map((paso) => (
              <option key={paso} value={paso}>{paso} px</option>
            ))}
          </select>
        </div>

        {/* Plano de fondo para calcar */}
        <div className="flex items-center gap-0.5 pl-2 ml-1 border-l border-gray-200">
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

        <div className="flex items-center gap-0.5 pl-2 ml-1 border-l border-gray-200">
          <button onClick={undo} disabled={historyIndex <= 0} className="p-2 text-gray-400 hover:text-[#6F3E8F] hover:bg-purple-50 disabled:opacity-20 rounded-xl transition-colors" title="Deshacer">
            <Undo2 size={16} strokeWidth={3} />
          </button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2 text-gray-400 hover:text-[#6F3E8F] hover:bg-purple-50 disabled:opacity-20 rounded-xl transition-colors" title="Rehacer">
            <Redo2 size={16} strokeWidth={3} />
          </button>
          <div className="h-5 w-px bg-gray-200 mx-0.5" />
          <button
            onClick={onDelete}
            disabled={selectedIds.length === 0}
            className="p-2 text-red-500/70 hover:text-red-500 hover:bg-red-50 disabled:opacity-20 rounded-xl transition-colors"
            title="Eliminar selección"
          >
            <Trash2 size={16} strokeWidth={3} />
          </button>
        </div>

        {/* Duplicar y espejar */}
        <div className="flex items-center gap-0.5 pl-2 ml-1 border-l border-gray-200">
          <button
            onClick={() => duplicar(null)}
            disabled={sectoresSeleccionados.length === 0}
            className="p-2 text-gray-400 hover:text-[#6F3E8F] hover:bg-purple-50 disabled:opacity-20 rounded-xl transition-colors"
            title="Duplicar sector (Ctrl+D)"
          >
            <Copy size={16} strokeWidth={3} />
          </button>
          <button
            onClick={() => duplicar('horizontal')}
            disabled={sectoresSeleccionados.length === 0}
            className="p-2 text-gray-400 hover:text-[#6F3E8F] hover:bg-purple-50 disabled:opacity-20 rounded-xl transition-colors"
            title="Duplicar espejado en horizontal"
          >
            <FlipHorizontal2 size={16} strokeWidth={3} />
          </button>
          <button
            onClick={() => duplicar('vertical')}
            disabled={sectoresSeleccionados.length === 0}
            className="p-2 text-gray-400 hover:text-[#6F3E8F] hover:bg-purple-50 disabled:opacity-20 rounded-xl transition-colors"
            title="Duplicar espejado en vertical"
          >
            <FlipVertical2 size={16} strokeWidth={3} />
          </button>
        </div>
      </>
    </div>
  );
};
