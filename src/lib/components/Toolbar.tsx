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
import { mapaDelEditor, useVenueStore } from '../store/useVenueStore';
import { useShallow } from 'zustand/react/shallow';
import { crearForma, nombreDeSectorNuevo } from '../utils/elements';
import { VenueMap } from '../types';
import { loadScaledImage } from '../utils/image';
import { TemplateMenu } from './TemplateMenu';
import { SaveButton } from './SaveButton';

interface ToolbarProps {
  onSave?: (map: VenueMap) => void | Promise<void>;
  onDelete: () => void;
}

/** Botón que queda resaltado mientras su opción está activa. */
const alternable = (activo: boolean) =>
  `p-2 rounded-xl transition-all ${activo ? 'bg-[#FF6B01]/10 text-[#FF6B01]' : 'text-gray-400 hover:text-[#6F3E8F] hover:bg-purple-50'}`;

export const Toolbar: React.FC<ToolbarProps> = ({ onSave, onDelete }) => {
  const { currentTool, setTool, undo, redo, historyIndex, history, selectedIds, addElement, elements, elementIds, venueName, setVenueName, loadMap, backgroundImage, setBackgroundImage, removeBackgroundImage, updateBackgroundOpacity, gridConfig, setGridConfig, sectorLabels, setSectorLabels, selectElements, duplicateSectors } = useVenueStore(
    useShallow((s) => ({ currentTool: s.currentTool, setTool: s.setTool, undo: s.undo, redo: s.redo, historyIndex: s.historyIndex, history: s.history, selectedIds: s.selectedIds, addElement: s.addElement, elements: s.elements, elementIds: s.elementIds, venueName: s.venueName, setVenueName: s.setVenueName, loadMap: s.loadMap, backgroundImage: s.backgroundImage, setBackgroundImage: s.setBackgroundImage, removeBackgroundImage: s.removeBackgroundImage, updateBackgroundOpacity: s.updateBackgroundOpacity, gridConfig: s.gridConfig, setGridConfig: s.setGridConfig, sectorLabels: s.sectorLabels, setSectorLabels: s.setSectorLabels, selectElements: s.selectElements, duplicateSectors: s.duplicateSectors }))
  );

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
    const arco = type === 'arc';
    addElement(crearForma(id, type === 'stage' ? 'Escenario' : nombreDeSectorNuevo(elements, elementIds), type === 'stage' ? 'stage' : 'section', {
      x: arco ? 400 : 300,
      y: arco ? 400 : 300,
      width: arco ? 440 : 200,
      height: arco ? 440 : 150,
      sectionType: type === 'circle' || arco ? type : 'rectangle',
      cornerRadius: 0,
      ...(type === 'circle' && { radius: 100 }),
      ...(arco && { innerRadius: 120, outerRadius: 220, startAngle: 200, endAngle: 340 }),
    }));
    selectElements([id]);
  };

  const currentMap = () => mapaDelEditor(useVenueStore.getState());

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

        {onSave && <SaveButton onSave={onSave} />}
      </div>

        <div className="flex items-center gap-0.5 pl-2 ml-1 border-l border-gray-200">
          <button
            onClick={() => setTool('select')}
            className={alternable(currentTool === 'select')}
            title="Herramienta de Selección"
          >
            <MousePointer2 size={16} strokeWidth={3} />
          </button>
          <button
            onClick={() => setTool('pan')}
            className={alternable(currentTool === 'pan')}
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
            className={alternable(currentTool === 'polygon')}
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
            className={alternable(gridConfig.visible)}
            title="Mostrar grilla"
          >
            <Grid3x3 size={16} strokeWidth={3} />
          </button>
          <button
            onClick={() => setGridConfig({ enabled: !gridConfig.enabled })}
            className={alternable(gridConfig.enabled)}
            title="Imán a la grilla"
          >
            <Magnet size={16} strokeWidth={3} />
          </button>
          <button
            onClick={() => setGridConfig({ snapToElements: !gridConfig.snapToElements })}
            className={alternable(gridConfig.snapToElements)}
            title="Imán a otros sectores (bordes y centros)"
          >
            <Boxes size={16} strokeWidth={3} />
          </button>
          <button
            onClick={() => setSectorLabels(!sectorLabels)}
            className={alternable(sectorLabels)}
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
    </div>
  );
};
