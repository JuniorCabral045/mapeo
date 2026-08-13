import { useEffect, useRef } from 'react';
import { useVenueStore } from '../store/useVenueStore';
import { resolveShortcut } from '../utils/shortcuts';
import type { EditorTool } from '../types';

/** Espera sin teclas tras la cual el empuje con flechas se cierra como un paso. */
const AGRUPAR_EMPUJE_MS = 400;

const enCampoDeTexto = (target: EventTarget | null) =>
  ['INPUT', 'TEXTAREA', 'SELECT'].includes((target as HTMLElement)?.tagName ?? '');

/**
 * Cablea el teclado al store. La decisión de qué hace cada tecla vive en
 * `resolveShortcut`, que es pura y está probada; acá quedan las dos cosas que
 * necesitan estado y no se pueden resolver mirando una sola tecla: agrupar el
 * empuje con flechas en un paso de historial, y el paneo con la barra
 * espaciadora, que depende de soltar la tecla.
 *
 * El polígono en curso (`EditorCanvas`) y el menú de plantillas (`TemplateMenu`)
 * también escuchan el teclado por su cuenta. Con el polígono en curso, `Escape`
 * y las teclas de herramienta se ignoran acá para no interferir con su propio
 * manejo (cancelar/cerrar el polígono). El menú de plantillas escucha `Escape`
 * sobre `document` solo mientras está abierto y únicamente se cierra: que acá
 * también dispare `deselect` no pisa nada, es redundante como mucho.
 *
 * Corrección posterior a la revisión de la Tarea 16: `onDelete` tiene que ser
 * estable entre renders. El efecto lo lleva en sus dependencias, así que cada
 * vez que cambiaba de identidad se reinstalaba el escuchador -y la limpieza
 * del anterior cancelaba un empuje pendiente sin guardarlo. `VenueEditor` ya
 * no cierra sobre la selección para armar `pedirBorrado`: la lee del store en
 * el momento de invocar, así que su identidad no depende de la selección. Por
 * las dudas de que algún otro camino vuelva a reinstalar el efecto -o de que
 * el componente se desmonte- con un empuje a mitad de agrupar, la limpieza
 * también guarda el paso pendiente en vez de descartarlo (ver
 * `guardarEmpujePendiente` más abajo).
 */
export const useEditorShortcuts = (onDelete: () => void) => {
  const temporizadorEmpuje = useRef<ReturnType<typeof setTimeout> | null>(null);
  const herramientaPrevia = useRef<EditorTool | null>(null);

  useEffect(() => {
    // Si hay un empuje pendiente de cerrarse, lo cierra guardando el paso en
    // vez de descartarlo. La reinstala tanto la limpieza al desmontar como la
    // que corre cada vez que este efecto se reinstala (hoy solo pasa si
    // `onDelete` cambia de identidad) -sin esto, deseleccionar con Escape
    // antes de los 400 ms de un empuje con flechas dejaba el movimiento hecho
    // en pantalla pero fuera del historial: Ctrl+Z no lo revertía.
    const guardarEmpujePendiente = () => {
      if (temporizadorEmpuje.current) {
        clearTimeout(temporizadorEmpuje.current);
        temporizadorEmpuje.current = null;
        useVenueStore.getState().saveHistory();
      }
    };

    const cerrarEmpuje = () => {
      if (temporizadorEmpuje.current) clearTimeout(temporizadorEmpuje.current);
      temporizadorEmpuje.current = setTimeout(() => {
        useVenueStore.getState().saveHistory();
        temporizadorEmpuje.current = null;
      }, AGRUPAR_EMPUJE_MS);
    };

    const alSoltar = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || herramientaPrevia.current === null) return;
      useVenueStore.getState().setTool(herramientaPrevia.current);
      herramientaPrevia.current = null;
    };

    const alPresionar = (e: KeyboardEvent) => {
      // Barra espaciadora mantenida: panear y volver a la herramienta anterior al soltar.
      if (e.code === 'Space' && !enCampoDeTexto(e.target)) {
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
          targetTag: (e.target as HTMLElement)?.tagName ?? 'BODY',
        },
        { gridSize: store.gridConfig.size }
      );
      if (!accion) return;

      // El polígono en curso maneja su propio Escape (cancelar) y su propio
      // Enter (cerrar) en EditorCanvas; acá se ignoran deselect/tool mientras
      // se dibuja para no pisarle el manejo.
      if (store.currentTool === 'polygon' && (accion.kind === 'deselect' || accion.kind === 'tool')) {
        return;
      }

      e.preventDefault();

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
          cerrarEmpuje();
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
      guardarEmpujePendiente();
    };
  }, [onDelete]);
};
