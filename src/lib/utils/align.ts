import { VenueElement } from '../types';
import { elementBounds } from './bounds';

export type AlignMode = 'left' | 'center-x' | 'right' | 'top' | 'center-y' | 'bottom';
export type DistributeAxis = 'x' | 'y';

/** Posiciones nuevas por id. Solo incluye lo que efectivamente se mueve. */
export type Movimientos = Record<string, { x: number; y: number }>;

/**
 * Elementos de la selección con caja calculable. A diferencia del antiguo
 * `movibles`, esto NO excluye a los bloqueados: un elemento bloqueado sigue
 * ocupando lugar y tiene que participar del cálculo del conjunto, aunque
 * nunca reciba un movimiento propio. Excluirlo del todo -como hacía
 * `movibles`- dejaba que los demás se alinearan o distribuyeran usando solo
 * sus propios extremos, montándose encima del bloqueado.
 *
 * Cuánto pesa esa participación no es lo mismo en las dos funciones de abajo:
 * en `alignElements` el bloqueado es una ancla real -los demás terminan
 * tocando su borde-; en `distributeElements` solo aporta su tamaño al reparto
 * y su posición real nunca se lee, así que puede quedar lejos de donde el
 * cálculo lo supone. El comentario de cada función detalla su caso.
 */
const conCaja = (elements: Record<string, VenueElement>, ids: string[]) =>
  ids.map((id) => elements[id]).filter((el): el is VenueElement => !!el);

/**
 * Alinea una selección.
 *
 * Trabaja sobre la caja de cada elemento, no sobre su x,y: un círculo se dibuja
 * centrado en su origen, así que alinear por origen lo dejaría corrido medio radio.
 */
export const alignElements = (
  elements: Record<string, VenueElement>,
  ids: string[],
  mode: AlignMode
): Movimientos => {
  const seleccion = conCaja(elements, ids);
  if (seleccion.length < 2) return {};

  const cajas = seleccion.map((el) => ({ el, caja: elementBounds(el) }));
  const minX = Math.min(...cajas.map((c) => c.caja.minX));
  const maxX = Math.max(...cajas.map((c) => c.caja.maxX));
  const minY = Math.min(...cajas.map((c) => c.caja.minY));
  const maxY = Math.max(...cajas.map((c) => c.caja.maxY));
  const centroX = (minX + maxX) / 2;
  const centroY = (minY + maxY) / 2;

  const movimientos: Movimientos = {};

  for (const { el, caja } of cajas) {
    // Ancla real: su destino se calcula igual que el de cualquier otro, y como
    // nunca se mueve, los demás terminan tocando su borde efectivo.
    if (el.locked) continue;

    const ancho = caja.maxX - caja.minX;
    const alto = caja.maxY - caja.minY;
    let destinoX = caja.minX;
    let destinoY = caja.minY;

    if (mode === 'left') destinoX = minX;
    if (mode === 'right') destinoX = maxX - ancho;
    if (mode === 'center-x') destinoX = centroX - ancho / 2;
    if (mode === 'top') destinoY = minY;
    if (mode === 'bottom') destinoY = maxY - alto;
    if (mode === 'center-y') destinoY = centroY - alto / 2;

    // La caja puede estar corrida respecto del origen (círculos, arcos).
    movimientos[el.id] = {
      x: el.x + (destinoX - caja.minX),
      y: el.y + (destinoY - caja.minY),
    };
  }

  return movimientos;
};

/** Reparte los elementos del medio dejando huecos iguales. Los extremos no se mueven. */
export const distributeElements = (
  elements: Record<string, VenueElement>,
  ids: string[],
  axis: DistributeAxis
): Movimientos => {
  const seleccion = conCaja(elements, ids);
  if (seleccion.length < 3) return {};

  const cajas = seleccion
    .map((el) => ({ el, caja: elementBounds(el) }))
    .sort((a, b) => (axis === 'x' ? a.caja.minX - b.caja.minX : a.caja.minY - b.caja.minY));

  const tamano = (c: (typeof cajas)[number]) =>
    axis === 'x' ? c.caja.maxX - c.caja.minX : c.caja.maxY - c.caja.minY;

  const inicio = axis === 'x' ? cajas[0].caja.minX : cajas[0].caja.minY;
  const ultimo = cajas[cajas.length - 1];
  const fin = axis === 'x' ? ultimo.caja.maxX : ultimo.caja.maxY;

  const ocupado = cajas.reduce((suma, c) => suma + tamano(c), 0);
  // Si los elementos no entran en el espacio disponible entre los extremos, esta
  // resta da negativa. No se trata como error: repartir el faltante en partes
  // iguales es, matemáticamente, la misma cuenta que repartir un sobrante -es
  // la definición de «distribuir parejo»-, así que no se cambia la fórmula.
  // Lo que se decide acá es no ocultarlo: con hueco negativo el resultado es un
  // solapamiento visible, previsible e igual entre todos los elementos del
  // medio -una decisión tomada a propósito, no un accidente en silencio-. Ver
  // el caso «hueco negativo» en align.test.ts.
  const hueco = (fin - inicio - ocupado) / (cajas.length - 1);

  const movimientos: Movimientos = {};
  let cursor = inicio + tamano(cajas[0]) + hueco;

  for (let i = 1; i < cajas.length - 1; i++) {
    const { el, caja } = cajas[i];
    const actual = axis === 'x' ? caja.minX : caja.minY;
    const delta = cursor - actual;
    // A diferencia de alignElements, acá "ancla" es una palabra más débil: el
    // cursor solo toma el tamaño del bloqueado para seguir avanzando -el reparto
    // uniforme es una sola pasada de izquierda a derecha, sin una segunda vuelta
    // que reubique el cursor sobre su posición real-, así que su x/y real nunca
    // se lee. Si el bloqueado no cae exactamente donde el reparto uniforme lo
    // hubiera puesto, los elementos siguientes se calculan igual respecto de un
    // punto donde el bloqueado no está, y los huecos a su alrededor quedan
    // desparejos. Es una limitación conocida y aceptada, no un olvido: fijarla
    // exigiría segmentar la distribución en tramos alrededor de cada bloqueado,
    // un algoritmo distinto y más grande que el de esta función. Ver el caso
    // «bloqueado en el medio» en align.test.ts.
    if (!el.locked) {
      movimientos[el.id] = {
        x: axis === 'x' ? el.x + delta : el.x,
        y: axis === 'y' ? el.y + delta : el.y,
      };
    }
    cursor += tamano(cajas[i]) + hueco;
  }

  return movimientos;
};
