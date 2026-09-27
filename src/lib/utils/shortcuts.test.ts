import { describe, expect, it, vi } from 'vitest';
import { crearAgrupador, resolveShortcut } from './shortcuts';

/**
 * Los atajos se resuelven en una función pura para poder probar el caso que más
 * duele: escribir el nombre de un sector en un input y que la tecla «d» duplique
 * el sector, o que Supr borre la selección en vez de un carácter.
 */

const evento = (extra: Partial<Parameters<typeof resolveShortcut>[0]> = {}) => ({
  key: 'a', ctrlKey: false, metaKey: false, shiftKey: false, targetTag: 'BODY',
  ...extra,
});

const opciones = { gridSize: 20 };

describe('atajos del editor', () => {
  it('Supr borra la selección', () => {
    expect(resolveShortcut(evento({ key: 'Delete' }), opciones)).toEqual({ kind: 'delete' });
    expect(resolveShortcut(evento({ key: 'Backspace' }), opciones)).toEqual({ kind: 'delete' });
  });

  it('Ctrl+Z deshace y Ctrl+Shift+Z rehace', () => {
    expect(resolveShortcut(evento({ key: 'z', ctrlKey: true }), opciones)).toEqual({ kind: 'undo' });
    expect(resolveShortcut(evento({ key: 'z', ctrlKey: true, shiftKey: true }), opciones)).toEqual({ kind: 'redo' });
    expect(resolveShortcut(evento({ key: 'y', ctrlKey: true }), opciones)).toEqual({ kind: 'redo' });
  });

  it('en Mac vale la tecla de comando', () => {
    expect(resolveShortcut(evento({ key: 'z', metaKey: true }), opciones)).toEqual({ kind: 'undo' });
  });

  it('Ctrl+D duplica', () => {
    expect(resolveShortcut(evento({ key: 'd', ctrlKey: true }), opciones)).toEqual({ kind: 'duplicate' });
  });

  it('las flechas empujan un píxel', () => {
    expect(resolveShortcut(evento({ key: 'ArrowLeft' }), opciones)).toEqual({ kind: 'nudge', dx: -1, dy: 0 });
    expect(resolveShortcut(evento({ key: 'ArrowDown' }), opciones)).toEqual({ kind: 'nudge', dx: 0, dy: 1 });
  });

  it('con Shift empujan un paso de grilla', () => {
    expect(resolveShortcut(evento({ key: 'ArrowRight', shiftKey: true }), opciones))
      .toEqual({ kind: 'nudge', dx: 20, dy: 0 });
  });

  it('Escape deselecciona', () => {
    expect(resolveShortcut(evento({ key: 'Escape' }), opciones)).toEqual({ kind: 'deselect' });
  });

  it('V, M y P cambian de herramienta', () => {
    expect(resolveShortcut(evento({ key: 'v' }), opciones)).toEqual({ kind: 'tool', tool: 'select' });
    expect(resolveShortcut(evento({ key: 'm' }), opciones)).toEqual({ kind: 'tool', tool: 'pan' });
    expect(resolveShortcut(evento({ key: 'p' }), opciones)).toEqual({ kind: 'tool', tool: 'polygon' });
  });

  it('no hace nada mientras se escribe en un campo', () => {
    // Escribir «Tribuna Sur» no puede borrar el sector ni cambiar de herramienta.
    for (const tag of ['INPUT', 'TEXTAREA', 'SELECT']) {
      expect(resolveShortcut(evento({ key: 'Delete', targetTag: tag }), opciones)).toBeNull();
      expect(resolveShortcut(evento({ key: 'v', targetTag: tag }), opciones)).toBeNull();
      expect(resolveShortcut(evento({ key: 'd', ctrlKey: true, targetTag: tag }), opciones)).toBeNull();
    }
  });

  it('una tecla sin atajo no devuelve nada', () => {
    expect(resolveShortcut(evento({ key: 'q' }), opciones)).toBeNull();
  });
});

describe('agrupar el empuje con flechas', () => {
  it('una ráfaga guarda una sola vez, al final', () => {
    vi.useFakeTimers();
    const guardar = vi.fn();
    const empuje = crearAgrupador(guardar, 400);

    empuje.programar();
    vi.advanceTimersByTime(300);
    empuje.programar();
    vi.advanceTimersByTime(399);
    expect(guardar).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(guardar).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('vaciar guarda lo pendiente ya y el temporizador no vuelve a guardar', () => {
    vi.useFakeTimers();
    const guardar = vi.fn();
    const empuje = crearAgrupador(guardar, 400);

    empuje.programar();
    empuje.vaciar();
    expect(guardar).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1000);
    expect(guardar).toHaveBeenCalledTimes(1);
    empuje.vaciar();
    expect(guardar).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
