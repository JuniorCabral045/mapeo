import { SeatElement, VenueElement } from '../types';

/**
 * Ids que el imán debe ignorar al arrastrar `id`: el propio elemento y, si forma
 * parte de la selección, el resto de ella.
 *
 * Se decide por pertenencia y no por tamaño: Konva no dispara `click` si el
 * puntero se movió, así que se puede arrastrar un `C` con `[A, B]` todavía
 * seleccionados, y `C` se engancharía contra su propia caja.
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

/** Sectores y escenarios se cuentan aparte: un escenario no es «un sector más». */
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

const consecuenciaDeBorrado = (asientos: number): string =>
  asientos === 1
    ? 'Esa butaca deja de existir: su QR queda apuntando a la nada.'
    : 'Esas butacas dejan de existir: sus QR quedan apuntando a la nada.';

/** Texto del aviso de borrado, con concordancia de número en cada sustantivo y en el verbo. */
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
 * De los ids arrastrados en un mismo gesto, cuáles mover por su cuenta. Un
 * asiento cuyo sector también está en `ids` queda afuera: el sector ya lo
 * arrastra, y moverlo aparte lo desplazaría el doble. Mira solo pertenencia,
 * así que no depende del orden de `ids`.
 */
export const idsToMoveIndividually = (
  elements: Record<string, VenueElement>,
  ids: string[]
): string[] => {
  const seleccionados = new Set(ids);
  return ids.filter((id) => {
    const el = elements[id];
    return !(el?.type === 'seat' && el.sectionId && seleccionados.has(el.sectionId));
  });
};
