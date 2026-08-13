import { SeatElement, VenueElement } from '../types';

/**
 * Ids que el imán entre elementos debe excluir como candidatos al arrastrar
 * `id`: siempre el propio elemento, más el resto de la selección cuando `id`
 * forma parte de ella.
 *
 * Mirar solo el tamaño de la selección (`selectedIds.length > 1 ? selectedIds
 * : [id]`) no alcanza: si ya había una selección múltiple `[A, B]` y se
 * arrastra un tercer elemento `C` sin deseleccionar primero -Konva no dispara
 * `click` cuando el puntero se movió antes de soltar, así que la selección
 * React no se actualiza-, `selectedIds` seguía siendo `[A, B]` y `C` no
 * quedaba excluido: se enganchaba contra su propia caja y volvía a su
 * posición de origen. La condición correcta es pertenencia (`includes`), no
 * tamaño.
 */
export const idsToExcludeFromSnap = (id: string, selectedIds: string[]): string[] =>
  selectedIds.length > 1 && selectedIds.includes(id) ? selectedIds : [id];

/** Asientos que pertenecen a un sector, en el orden del lienzo. */
export const seatsOfSector = (
  elements: Record<string, VenueElement>,
  elementIds: string[],
  sectorId: string
): SeatElement[] =>
  elementIds
    .map((id) => elements[id])
    .filter(
      (el): el is SeatElement =>
        !!el && el.type === 'seat' && el.sectionId === sectorId
    );

/** Singular si `n === 1`, plural en cualquier otro caso (incluido 0). */
export const pluralizar = (n: number, singular: string, plural: string): string =>
  n === 1 ? singular : plural;

/** Conteo de lo que una selección se llevaría puesto al borrarla. */
export interface ResumenDeBorrado {
  sectores: number;
  escenarios: number;
  asientos: number;
}

/**
 * Cuenta sectores, escenarios y asientos afectados por separado.
 *
 * Antes esto filtraba por `type !== 'seat'` y llamaba "sector" a cualquier
 * elemento que pasara el filtro -incluidos los escenarios, que también son
 * `type !== 'seat'`. Un escenario y un sector con asientos seleccionados
 * juntos se contaban como "2 sectores", mintiéndole al usuario sobre qué
 * está por perder. Un escenario nunca tiene asientos propios
 * (`seatsOfSector` no encuentra ninguno para su id), así que separar los
 * tipos no cambia el conteo de asientos, solo lo que se dice que se borra.
 */
export const resumenDeBorrado = (
  elements: Record<string, VenueElement>,
  elementIds: string[],
  selectedIds: string[]
): ResumenDeBorrado => {
  const sectores = selectedIds.filter((id) => elements[id]?.type === 'section');
  const escenarios = selectedIds.filter((id) => elements[id]?.type === 'stage');
  const asientos = sectores.reduce(
    (n, id) => n + seatsOfSector(elements, elementIds, id).length,
    0
  );
  return { sectores: sectores.length, escenarios: escenarios.length, asientos };
};

/** Frase de consecuencia del aviso de borrado, con la misma función que la
 * del aviso de regenerar (QR ya impresos que dejan de servir) pero para
 * butacas que van a dejar de existir en vez de solo cambiar de lugar. */
const consecuenciaDeBorrado = (asientos: number): string =>
  asientos === 1
    ? 'Esa butaca deja de existir: su QR queda apuntando a la nada.'
    : 'Esas butacas dejan de existir: sus QR quedan apuntando a la nada.';

/**
 * Arma el texto del aviso de borrado a partir de un `ResumenDeBorrado`.
 * Cubre las cuatro combinaciones de composición (solo sectores, solo
 * escenarios, mezcla, y cualquiera de esas con o sin asientos) con
 * concordancia de número correcta en cada sustantivo y en el verbo -un
 * sector de 1×1 o un solo escenario seleccionado son casos alcanzables, no
 * un detalle cosmético.
 */
export const textoAvisoDeBorrado = (resumen: ResumenDeBorrado): string => {
  const { sectores, escenarios, asientos } = resumen;
  if (sectores === 0 && escenarios === 0) return '';

  const partes: string[] = [];
  if (sectores > 0) partes.push(`${sectores} ${pluralizar(sectores, 'sector', 'sectores')}`);
  if (escenarios > 0) partes.push(`${escenarios} ${pluralizar(escenarios, 'escenario', 'escenarios')}`);
  const elementos = partes.join(' y ');
  const verbo = pluralizar(sectores + escenarios, 'Se borra', 'Se borran');

  if (asientos === 0) return `${verbo} ${elementos}.`;

  const posesivo = pluralizar(asientos, 'su', 'sus');
  const sustantivo = pluralizar(asientos, 'asiento', 'asientos');
  return `${verbo} ${elementos} y ${posesivo} ${asientos} ${sustantivo}. ${consecuenciaDeBorrado(asientos)}`;
};

/**
 * De un conjunto de ids arrastrados en el mismo gesto, cuáles hay que mover
 * por su cuenta. Un asiento cuyo propio sector también está en `ids` queda
 * afuera: `moveSector` ya arrastra a todos los asientos del sector, así que
 * aplicarle el movimiento aparte lo desplazaría el doble (una vez como
 * asiento suelto, otra como parte del sector que lo contiene).
 *
 * La decisión mira solo pertenencia -si `sectionId` está en el propio
 * conjunto de ids-, nunca estado ya modificado, así que el resultado no
 * depende del orden en que `ids` traiga al asiento y a su sector.
 */
export const idsToMoveIndividually = (
  elements: Record<string, VenueElement>,
  ids: string[]
): string[] => {
  const seleccionados = new Set(ids);
  return ids.filter((id) => {
    const el = elements[id];
    if (el?.type === 'seat' && el.sectionId && seleccionados.has(el.sectionId)) {
      return false;
    }
    return true;
  });
};
