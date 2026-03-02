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
  Group as GroupIcon,
  Ungroup,
  Eye,
  PenLine,
  Download,
  Upload,
  Trophy,
  Mic2,
  MousePointer2,
  Hand,
  Plus
} from 'lucide-react';
import { useVenueStore } from '../store/useVenueStore';
import { stadiumTemplate, theaterTemplate } from '../utils/templates';

export const Toolbar: React.FC = () => {
  const {
    mode, setMode,
    currentTool, setTool,
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
      radius: type === 'circle' ? 100 : undefined
    });
    useVenueStore.getState().selectElements([id]);
  };

  const exportJSON = () => {
    const data = { elements, elementIds };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'venue-layout.json';
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
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-4">
        {/* Main Mode Toggle & Action Bar */}
        <div className="bg-[#1E293B]/80 backdrop-blur-xl border border-slate-700/50 p-2 rounded-2xl shadow-2xl flex items-center gap-2 ring-1 ring-white/5">
            <div className="flex items-center bg-slate-900/50 p-1 rounded-xl">
                <button
                    onClick={() => setMode('edit')}
                    className={`px-6 py-2 rounded-lg text-xs font-black flex items-center gap-2 transition-all ${
                        mode === 'edit' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                    <PenLine size={14} strokeWidth={3} /> Editor
                </button>
                <button
                    onClick={() => setMode('view')}
                    className={`px-6 py-2 rounded-lg text-xs font-black flex items-center gap-2 transition-all ${
                        mode === 'view' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                >
                    <Eye size={14} strokeWidth={3} /> Visualizador
                </button>
            </div>

            <div className="h-6 w-px bg-slate-700/50 mx-1" />

            {/* Quick Template Buttons */}
            {mode === 'edit' && (
                <>
                    <button
                        onClick={() => {
                            const tmpl = stadiumTemplate();
                            useVenueStore.getState().addElements(Object.values(tmpl));
                        }}
                        className="p-2.5 bg-slate-800/50 border border-slate-700/50 hover:border-blue-500/30 hover:bg-blue-500/10 text-slate-400 hover:text-blue-400 rounded-xl transition-all shadow-sm group"
                        title="Plantilla Estadio"
                    >
                        <Trophy size={18} className="group-hover:scale-110 transition-transform" />
                    </button>
                    <button
                        onClick={() => {
                            const tmpl = theaterTemplate();
                            useVenueStore.getState().addElements(Object.values(tmpl));
                        }}
                        className="p-2.5 bg-slate-800/50 border border-slate-700/50 hover:border-blue-500/30 hover:bg-blue-500/10 text-slate-400 hover:text-blue-400 rounded-xl transition-all shadow-sm group"
                        title="Plantilla Teatro"
                    >
                        <Mic2 size={18} className="group-hover:scale-110 transition-transform" />
                    </button>

                    <div className="h-6 w-px bg-slate-700/50 mx-1" />
                </>
            )}

            {/* File Operations */}
            <div className="flex items-center gap-1.5 px-1">
                <label className="cursor-pointer p-2.5 text-slate-400 hover:text-white transition-all hover:bg-slate-700/50 rounded-xl" title="Importar JSON">
                    <Upload size={18} />
                    <input type="file" className="hidden" accept=".json" onChange={importJSON} />
                </label>
                <button onClick={exportJSON} className="p-2.5 text-slate-400 hover:text-white transition-all hover:bg-slate-700/50 rounded-xl" title="Exportar JSON">
                    <Download size={18} />
                </button>
            </div>

            <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl text-xs font-black shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-md">
                GUARDAR PROYECTO
            </button>
        </div>

        {/* Secondary Toolbar (Editor Tools) */}
        {mode === 'edit' && (
            <div className="flex items-center gap-3 animate-in slide-in-from-top-4 duration-500">
                {/* Selection & Drawing Tools */}
                <div className="bg-[#1E293B]/60 backdrop-blur-md border border-slate-700/40 p-1.5 rounded-2xl flex items-center gap-1 shadow-xl">
                    <button
                        onClick={() => setTool('select')}
                        className={`p-2 rounded-xl transition-all ${
                            currentTool === 'select' ? 'bg-blue-600/30 text-blue-400' : 'text-slate-400 hover:text-white'
                        }`}
                        title="Herramienta de Selección"
                    >
                        <MousePointer2 size={16} strokeWidth={3}/>
                    </button>
                    <button
                        onClick={() => setTool('pan')}
                        className={`p-2 rounded-xl transition-all ${
                            currentTool === 'pan' ? 'bg-blue-600/30 text-blue-400' : 'text-slate-400 hover:text-white'
                        }`}
                        title="Herramienta de Mano"
                    >
                        <Hand size={16} strokeWidth={3}/>
                    </button>
                    <button onClick={() => handleAddSection('rectangle')} className="p-2 hover:bg-slate-700/50 text-slate-400 hover:text-white rounded-xl transition-colors" title="Rectángulo"><Plus size={16} strokeWidth={3}/></button>
                    <button onClick={() => handleAddSection('circle')} className="p-2 hover:bg-slate-700/50 text-slate-400 hover:text-white rounded-xl transition-colors" title="Círculo"><CircleIcon size={16} strokeWidth={3}/></button>
                    <button onClick={() => handleAddSection('stage')} className="p-2 hover:bg-slate-700/50 text-slate-400 hover:text-white rounded-xl transition-colors" title="Escenario"><Flag size={16} strokeWidth={3}/></button>
                </div>

                {/* History Controls */}
                <div className="bg-[#1E293B]/60 backdrop-blur-md border border-slate-700/40 p-1.5 rounded-2xl flex items-center gap-1 shadow-xl">
                    <button onClick={undo} disabled={historyIndex <= 0} className="p-2 text-slate-400 hover:text-white disabled:opacity-20 rounded-xl transition-colors"><Undo2 size={16} strokeWidth={3}/></button>
                    <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2 text-slate-400 hover:text-white disabled:opacity-20 rounded-xl transition-colors"><Redo2 size={16} strokeWidth={3}/></button>
                </div>

                {/* Operations */}
                <div className="bg-[#1E293B]/60 backdrop-blur-md border border-slate-700/40 p-1.5 rounded-2xl flex items-center gap-1 shadow-xl">
                    <button onClick={copy} disabled={selectedIds.length === 0} className="p-2 text-slate-400 hover:text-white disabled:opacity-20 rounded-xl transition-colors"><Copy size={16} strokeWidth={3}/></button>
                    <button onClick={() => paste()} className="p-2 text-slate-400 hover:text-white rounded-xl transition-colors"><ClipboardPaste size={16} strokeWidth={3}/></button>
                    <button onClick={() => useVenueStore.getState().group(selectedIds)} disabled={selectedIds.length < 2} className="p-2 text-slate-400 hover:text-white disabled:opacity-20 rounded-xl transition-colors"><GroupIcon size={16} strokeWidth={3}/></button>
                    <button onClick={() => deleteElements(selectedIds)} disabled={selectedIds.length === 0} className="p-2 text-red-500/70 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-20 rounded-xl transition-colors"><Trash2 size={16} strokeWidth={3}/></button>
                </div>
            </div>
        )}
    </div>
  );
};
