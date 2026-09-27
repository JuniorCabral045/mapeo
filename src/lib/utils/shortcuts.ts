import { EditorTool } from '../types';

export type EditorAction =
  | { kind: 'delete' }
  | { kind: 'undo' }
  | { kind: 'redo' }
  | { kind: 'duplicate' }
  | { kind: 'deselect' }
  | { kind: 'nudge'; dx: number; dy: number }
  | { kind: 'tool'; tool: EditorTool };

export interface ShortcutEvent {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  /** `tagName` del elemento con foco. */
  targetTag: string;
}

export interface ShortcutOptions {
  gridSize: number;
}

const CAMPOS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

export const esCampoDeTexto = (tag: string) => CAMPOS.has(tag.toUpperCase());

const FLECHAS: Record<string, { dx: number; dy: number }> = {
  ArrowLeft: { dx: -1, dy: 0 },
  ArrowRight: { dx: 1, dy: 0 },
  ArrowUp: { dx: 0, dy: -1 },
  ArrowDown: { dx: 0, dy: 1 },
};

const HERRAMIENTAS: Record<string, EditorTool> = {
  v: 'select',
  m: 'pan',
  p: 'polygon',
};

/**
 * Traduce una tecla a una acción del editor.
 *
 * Devuelve `null` mientras el foco está en un campo de texto: si no, escribir el
 * nombre de un sector dispararía atajos.
 */
export const resolveShortcut = (
  evento: ShortcutEvent,
  { gridSize }: ShortcutOptions
): EditorAction | null => {
  if (esCampoDeTexto(evento.targetTag)) return null;

  const conModificador = evento.ctrlKey || evento.metaKey;
  const tecla = evento.key.length === 1 ? evento.key.toLowerCase() : evento.key;

  if (conModificador) {
    if (tecla === 'z') return { kind: evento.shiftKey ? 'redo' : 'undo' };
    if (tecla === 'y') return { kind: 'redo' };
    if (tecla === 'd') return { kind: 'duplicate' };
    return null;
  }

  if (tecla === 'Delete' || tecla === 'Backspace') return { kind: 'delete' };
  if (tecla === 'Escape') return { kind: 'deselect' };

  const flecha = FLECHAS[tecla];
  if (flecha) {
    const paso = evento.shiftKey ? gridSize : 1;
    return { kind: 'nudge', dx: flecha.dx * paso, dy: flecha.dy * paso };
  }

  const herramienta = HERRAMIENTAS[tecla];
  if (herramienta) return { kind: 'tool', tool: herramienta };

  return null;
};

/**
 * Agrupa una ráfaga de empujes con flechas en un solo `guardar()`, que corre
 * `ms` después del último. `vaciar()` guarda ya lo pendiente: hay que llamarlo
 * antes de cualquier otra acción, o un deshacer dentro del plazo saltaba el
 * empuje entero y deshacía además el paso anterior.
 */
export const crearAgrupador = (guardar: () => void, ms: number) => {
  let temporizador: ReturnType<typeof setTimeout> | null = null;

  const vaciar = () => {
    if (!temporizador) return;
    clearTimeout(temporizador);
    temporizador = null;
    guardar();
  };

  const programar = () => {
    if (temporizador) clearTimeout(temporizador);
    temporizador = setTimeout(() => {
      temporizador = null;
      guardar();
    }, ms);
  };

  return { programar, vaciar };
};
