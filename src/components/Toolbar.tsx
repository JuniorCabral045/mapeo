import React from 'react';
import {
  Square,
  Circle as CircleIcon,
  Flag,
  Undo2,
  Redo2,
  Copy,
  ClipboardPaste,
  Trash2,
  LayoutGrid,
  Group as GroupIcon,
  Ungroup,
  Eye,
  PenLine,
  Download,
  Upload,
  Trophy,
  Mic2
} from 'lucide-react';
import { useVenueStore } from '../store/useVenueStore';
import { stadiumTemplate, theaterTemplate } from '../utils/templates';

export const Toolbar: React.FC = () => {
  const {
    mode, setMode,
    undo, redo, historyIndex, history,
    copy, paste,
    selectedIds, deleteElements,
    addElement, elements, elementIds,
    saveHistory
  } = useVenueStore();

  const handleAddSection = (type: 'rectangle' | 'circle' | 'stage') => {
    const id = `${type}-${Date.now()}`;
    addElement({
      id,
      type: type === 'stage' ? 'stage' : 'section',
      name: type.toUpperCase(),
      x: 200,
      y: 200,
      width: 200,
      height: 150,
      rotation: 0,
      visible: true,
      locked: false,
      opacity: type === 'stage' ? 1 : 0.4,
      zIndex: 5,
      fill: type === 'stage' ? '#475569' : '#3b82f6',
      isActive: true,
      sectionType: type === 'circle' ? 'circle' : 'rectangle',
      cornerRadius: 0,
      radius: type === 'circle' ? 100 : undefined
    });
  };

  const exportJSON = () => {
    const data = { elements, elementIds };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'recinto.json';
    link.click();
  };

  const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const data = JSON.parse(ev.target?.result as string);
            useVenueStore.setState({ elements: data.elements, elementIds: data.elementIds, selectedIds: [] });
            useVenueStore.getState().rebuildIndex();
            saveHistory();
        } catch {
            alert('Error al importar JSON');
        }
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-16 border-b bg-white flex items-center justify-between px-6 shadow-sm z-[100] sticky top-0 font-sans">
      <div className="flex items-center gap-1">
        <div className="flex items-center bg-gray-100 p-1 rounded-xl mr-8">
          <button
            onClick={() => setMode('edit')}
            className={`p-1.5 px-5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
              mode === 'edit' ? 'bg-white shadow-md text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <PenLine size={16} /> Editor
          </button>
          <button
            onClick={() => setMode('view')}
            className={`p-1.5 px-5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
              mode === 'view' ? 'bg-white shadow-md text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Eye size={16} /> Vista
          </button>
        </div>

        {mode === 'edit' && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-100 shadow-inner">
              <button onClick={() => handleAddSection('rectangle')} className="p-2 hover:bg-white hover:shadow-sm hover:text-blue-600 rounded-md text-gray-400 transition-all" title="Rectángulo"><Square size={18} /></button>
              <button onClick={() => handleAddSection('circle')} className="p-2 hover:bg-white hover:shadow-sm hover:text-blue-600 rounded-md text-gray-400 transition-all" title="Círculo"><CircleIcon size={18} /></button>
              <button onClick={() => handleAddSection('stage')} className="p-2 hover:bg-white hover:shadow-sm hover:text-blue-600 rounded-md text-gray-400 transition-all" title="Escenario/Cancha"><Flag size={18} /></button>
            </div>

            <div className="h-6 w-px bg-gray-200 mx-1" />

            <div className="flex items-center gap-1">
              <button onClick={undo} disabled={historyIndex <= 0} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 disabled:opacity-20 transition-all shadow-sm active:translate-y-px"><Undo2 size={18} /></button>
              <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 disabled:opacity-20 transition-all shadow-sm active:translate-y-px"><Redo2 size={18} /></button>
            </div>

            <div className="h-6 w-px bg-gray-200 mx-1" />

            <div className="flex items-center gap-1">
              <button
                onClick={() => useVenueStore.getState().group(selectedIds)}
                disabled={selectedIds.length < 2}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 disabled:opacity-20 transition-all shadow-sm active:translate-y-px"
                title="Agrupar"
              >
                <GroupIcon size={18} />
              </button>
              <button
                onClick={() => selectedIds.length === 1 && useVenueStore.getState().ungroup(selectedIds[0])}
                disabled={selectedIds.length !== 1 || !useVenueStore.getState().elements[selectedIds[0]]?.type.includes('group')}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 disabled:opacity-20 transition-all shadow-sm active:translate-y-px"
                title="Desagrupar"
              >
                <Ungroup size={18} />
              </button>
            </div>

            <div className="h-6 w-px bg-gray-200 mx-1" />

            <div className="flex items-center gap-1">
              <button onClick={copy} disabled={selectedIds.length === 0} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 disabled:opacity-20 transition-all shadow-sm active:translate-y-px" title="Copiar"><Copy size={18} /></button>
              <button onClick={() => paste()} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-all shadow-sm active:translate-y-px" title="Pegar"><ClipboardPaste size={18} /></button>
              <button onClick={() => deleteElements(selectedIds)} disabled={selectedIds.length === 0} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-20 transition-all shadow-sm active:translate-y-px" title="Eliminar"><Trash2 size={18} /></button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {mode === 'edit' && (
            <div className="flex items-center gap-2 mr-2">
                <button
                    onClick={() => {
                        const tmpl = stadiumTemplate();
                        Object.values(tmpl).forEach(el => addElement(el));
                        useVenueStore.getState().rebuildIndex();
                    }}
                    className="group relative px-4 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50/50 transition-all flex items-center gap-2 shadow-sm active:translate-y-0.5"
                >
                    <Trophy size={14} className="text-gray-400 group-hover:text-blue-500 transition-colors" /> Estadio
                </button>
                <button
                    onClick={() => {
                        const tmpl = theaterTemplate();
                        Object.values(tmpl).forEach(el => addElement(el));
                        useVenueStore.getState().rebuildIndex();
                    }}
                    className="group relative px-4 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50/50 transition-all flex items-center gap-2 shadow-sm active:translate-y-0.5"
                >
                    <Mic2 size={14} className="text-gray-400 group-hover:text-blue-500 transition-colors" /> Teatro
                </button>
            </div>
        )}

        <div className="flex items-center gap-1 mr-4">
            <label className="cursor-pointer p-2 text-gray-400 hover:text-blue-600 transition-colors" title="Importar JSON">
                <Upload size={20} />
                <input type="file" className="hidden" accept=".json" onChange={importJSON} />
            </label>

            <button
                onClick={exportJSON}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                title="Exportar JSON"
            >
            <Download size={20} />
            </button>
        </div>

        <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-md">
          Guardar Proyecto
        </button>
      </div>
    </div>
  );
};
