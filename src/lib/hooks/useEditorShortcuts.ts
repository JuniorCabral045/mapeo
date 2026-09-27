import { useEffect, useRef } from 'react';
import { useVenueStore } from '../store/useVenueStore';
import { crearAgrupador, esCampoDeTexto, resolveShortcut } from '../utils/shortcuts';
import type { EditorTool } from '../types';

/** Espera sin teclas tras la cual el empuje con flechas se cierra como un paso. */
const AGRUPAR_EMPUJE_MS = 400;

const etiquetaDe = (target: EventTarget | null) => (target as HTMLElement)?.tagName ?? 'BODY';

/**
 * Cablea el teclado al store. Qué hace cada tecla lo decide `resolveShortcut`;
 * acá queda lo que necesita estado: agrupar el empuje con flechas en un paso de
 * historial y el paneo mientras se mantiene la barra espaciadora.
 *
 * `onDelete` tiene que ser estable: cada cambio reinstala el efecto.
 */
export const useEditorShortcuts = (onDelete: () => void) => {
  const herramientaPrevia = useRef<EditorTool | null>(null);

  useEffect(() => {
    const empuje = crearAgrupador(() => useVenueStore.getState().saveHistory(), AGRUPAR_EMPUJE_MS);

    const alSoltar = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || herramientaPrevia.current === null) return;
      useVenueStore.getState().setTool(herramientaPrevia.current);
      herramientaPrevia.current = null;
    };

    const alPresionar = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !esCampoDeTexto(etiquetaDe(e.target))) {
        e.preventDefault();
        const store = useVenueStore.getState();
        if (herramientaPrevia.current === null && store.currentTool !== 'pan') {
          herramientaPrevia.current = store.currentTool;
          store.setTool('pan');
        }
        return;
      }

      const store = useVenueStore.getState();
      const accion = resolveShortcut(
        {
          key: e.key,
          ctrlKey: e.ctrlKey,
          metaKey: e.metaKey,
          shiftKey: e.shiftKey,
          targetTag: etiquetaDe(e.target),
        },
        { gridSize: store.gridConfig.size }
      );
      if (!accion) return;

      // Mientras se dibuja un polígono, Escape y las teclas de herramienta son suyos.
      if (store.currentTool === 'polygon' && (accion.kind === 'deselect' || accion.kind === 'tool')) {
        return;
      }

      e.preventDefault();
      if (accion.kind !== 'nudge') empuje.vaciar();

      switch (accion.kind) {
        case 'delete':
          onDelete();
          break;
        case 'undo':
          store.undo();
          break;
        case 'redo':
          store.redo();
          break;
        case 'duplicate': {
          const sectores = store.selectedIds.filter(
            (id) => store.elements[id] && store.elements[id].type !== 'seat'
          );
          if (sectores.length > 0) {
            const paso = store.gridConfig.size * 2;
            store.duplicateSectors(sectores, { dx: paso, dy: paso, mirror: null });
          }
          break;
        }
        case 'deselect':
          store.clearSelection();
          break;
        case 'nudge':
          store.nudgeSelection(accion.dx, accion.dy);
          empuje.programar();
          break;
        case 'tool':
          store.setTool(accion.tool);
          break;
      }
    };

    window.addEventListener('keydown', alPresionar);
    window.addEventListener('keyup', alSoltar);
    return () => {
      window.removeEventListener('keydown', alPresionar);
      window.removeEventListener('keyup', alSoltar);
      empuje.vaciar();
    };
  }, [onDelete]);
};
