import React from 'react';
import {
  MousePointer2,
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
  Ungroup
} from 'lucide-react';
import { useVenueStore } from '../store/useVenueStore';
import { stadiumTemplate, theaterTemplate } from '../utils/templates';

export const Toolbar: React.FC = () => {
  const {
    undo, redo, historyIndex, history,
    copy, paste,
    selectedIds, deleteElements,
    addElement, saveHistory
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

  return (
    <div className="h-14 border-b bg-white flex items-center justify-between px-4 shadow-sm z-[100] sticky top-0">
      <div className="flex items-center gap-1">
        <div className="flex items-center bg-gray-100 p-1 rounded-md mr-4">
          <button className="p-1.5 px-3 bg-white shadow-sm rounded text-blue-600 text-sm font-medium flex items-center gap-2">
            <MousePointer2 size={16} /> Select
          </button>
        </div>

        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <button onClick={() => handleAddSection('rectangle')} className="p-2 hover:bg-gray-100 rounded" title="Rectángulo"><Square size={20} /></button>
          <button onClick={() => handleAddSection('circle')} className="p-2 hover:bg-gray-100 rounded" title="Círculo"><CircleIcon size={20} /></button>
          <button onClick={() => handleAddSection('stage')} className="p-2 hover:bg-gray-100 rounded" title="Escenario/Cancha"><Flag size={20} /></button>
        </div>

        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <button onClick={undo} disabled={historyIndex <= 0} className="p-2 hover:bg-gray-100 rounded disabled:opacity-30"><Undo2 size={20} /></button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2 hover:bg-gray-100 rounded disabled:opacity-30"><Redo2 size={20} /></button>
        </div>

        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <button
            onClick={() => useVenueStore.getState().group(selectedIds)}
            disabled={selectedIds.length < 2}
            className="p-2 hover:bg-gray-100 rounded disabled:opacity-30"
            title="Agrupar"
          >
            <GroupIcon size={20} />
          </button>
          <button
            onClick={() => selectedIds.length === 1 && useVenueStore.getState().ungroup(selectedIds[0])}
            disabled={selectedIds.length !== 1 || !useVenueStore.getState().elements[selectedIds[0]]?.type.includes('group')}
            className="p-2 hover:bg-gray-100 rounded disabled:opacity-30"
            title="Desagrupar"
          >
            <Ungroup size={20} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={copy} disabled={selectedIds.length === 0} className="p-2 hover:bg-gray-100 rounded disabled:opacity-30" title="Copiar"><Copy size={20} /></button>
          <button onClick={() => paste()} className="p-2 hover:bg-gray-100 rounded" title="Pegar"><ClipboardPaste size={20} /></button>
          <button onClick={() => deleteElements(selectedIds)} disabled={selectedIds.length === 0} className="p-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-30"><Trash2 size={20} /></button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            const tmpl = stadiumTemplate();
            Object.values(tmpl).forEach(el => useVenueStore.getState().addElement(el));
          }}
          className="text-xs font-medium bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded flex items-center gap-2"
        >
          <LayoutGrid size={14} /> Estadio
        </button>
        <button
          onClick={() => {
            const tmpl = theaterTemplate();
            Object.values(tmpl).forEach(el => useVenueStore.getState().addElement(el));
          }}
          className="text-xs font-medium bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded flex items-center gap-2"
        >
          <LayoutGrid size={14} /> Teatro
        </button>
        <button className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-blue-700 shadow-sm">
          Guardar Proyecto
        </button>
      </div>
    </div>
  );
};
