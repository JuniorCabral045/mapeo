import { SectorData, VenueMap } from '../types';

/**
 * Revisión del mapeo antes de guardarlo.
 *
 * Lo que se guarda acá termina siendo el contrato con el backend: los ids de
 * asiento se imprimen en los QR de las butacas y los sectores son lo que se
 * pone a la venta. Un mapa incoherente no falla al guardar — falla el día del
 * partido, cuando alguien escanea y el pedido llega a otro asiento, o cuando un
 * sector no vende nada porque no tiene ni butacas ni capacidad.
 */

export type Severidad = 'error' | 'aviso';

export interface Problema {
  severidad: Severidad;
  /** Qué pasa, en el idioma de quien mapea. */
  mensaje: string;
  /** Ids de los elementos involucrados, para poder seleccionarlos. */
  ids: string[];
}

const vendible = (s: SectorData) => s.kind === 'section';

/** Cómo referirse a un sector en un mensaje: por su nombre, si tiene. */
const nombrar = (s: SectorData) =>
  s.name.trim() === '' ? 'Un sector sin nombre' : `El sector «${s.name.trim()}»`;

/** Los asientos duplicados son el problema más caro: dos butacas, un mismo QR. */
const idsRepetidos = (map: VenueMap): Problema[] => {
  const vistos = new Map<string, number>();
  for (const sector of map.sectors) {
    for (const asiento of sector.seats) {
      vistos.set(asiento.id, (vistos.get(asiento.id) ?? 0) + 1);
    }
  }

  const repetidos = [...vistos.entries()].filter(([, veces]) => veces > 1).map(([id]) => id);
  if (repetidos.length === 0) return [];

  return [{
    severidad: 'error',
    mensaje: repetidos.length === 1
      ? 'Hay dos asientos con el mismo identificador: sus códigos QR llevarían al mismo lugar.'
      : `Hay ${repetidos.length} identificadores de asiento repetidos: sus códigos QR llevarían al mismo lugar.`,
    ids: repetidos,
  }];
};

/** Un sector de venta sin butacas ni capacidad no puede vender nada. */
const sinAforo = (map: VenueMap): Problema[] => {
  const vacios = map.sectors.filter((s) => vendible(s) && s.seats.length === 0 && !s.capacity);
  if (vacios.length === 0) return [];

  return [{
    severidad: 'aviso',
    mensaje: vacios.length === 1
      ? `${nombrar(vacios[0])} no tiene asientos ni capacidad declarada: no se le puede vender nada.`
      : `${vacios.length} sectores no tienen asientos ni capacidad declarada: no se les puede vender nada.`,
    ids: vacios.map((s) => s.id),
  }];
};

/**
 * Dos sectores con el mismo nombre.
 *
 * El nombre es lo que ve el comprador al elegir y lo que lee el repartidor al
 * salir con el pedido; repetido, no hay forma de distinguirlos en pantalla.
 */
const nombresRepetidos = (map: VenueMap): Problema[] => {
  const porNombre = new Map<string, string[]>();
  for (const sector of map.sectors) {
    const clave = sector.name.trim().toLowerCase();
    porNombre.set(clave, [...(porNombre.get(clave) ?? []), sector.id]);
  }

  const repetidos = [...porNombre.values()].filter((ids) => ids.length > 1);
  if (repetidos.length === 0) return [];

  return [{
    severidad: 'aviso',
    mensaje: 'Hay sectores con el mismo nombre: el comprador y el repartidor no van a poder distinguirlos.',
    ids: repetidos.flat(),
  }];
};

/** Un sector sin nombre aparece en blanco en las dos apps. */
const sinNombre = (map: VenueMap): Problema[] => {
  const anonimos = map.sectors.filter((s) => s.name.trim() === '');
  if (anonimos.length === 0) return [];

  return [{
    severidad: 'aviso',
    mensaje: anonimos.length === 1
      ? 'Hay un sector sin nombre.'
      : `Hay ${anonimos.length} sectores sin nombre.`,
    ids: anonimos.map((s) => s.id),
  }];
};

/**
 * Butacas que quedaron fuera de la figura de su sector.
 *
 * Pasa al mover un asiento suelto o al achicar un sector después de generarlo.
 * No rompe nada al guardar, pero en el visor la butaca aparece flotando lejos
 * de su tribuna y el repartidor la busca donde no está.
 */
const asientosFuera = (map: VenueMap): Problema[] => {
  const sueltos: string[] = [];

  for (const sector of map.sectors) {
    if (sector.seats.length === 0) continue;

    // Los círculos y los anillos se dibujan centrados en su origen; los
    // rectángulos y polígonos nacen en su esquina.
    const radial = sector.shape === 'circle' || sector.shape === 'arc';
    const r = sector.shape === 'circle'
      ? (sector.radius ?? sector.width / 2)
      : (sector.outerRadius ?? sector.width / 2);

    const minX = radial ? sector.x - r : sector.x;
    const minY = radial ? sector.y - r : sector.y;
    const maxX = radial ? sector.x + r : sector.x + sector.width;
    const maxY = radial ? sector.y + r : sector.y + sector.height;

    // Un sector rotado tiene una huella distinta de su caja sin rotar: se deja
    // un margen generoso para no llenar de avisos falsos un mapa correcto.
    const margen = Math.max(sector.width, sector.height) * (sector.rotation ? 0.5 : 0.1);

    for (const asiento of sector.seats) {
      const fuera =
        asiento.x < minX - margen || asiento.x > maxX + margen ||
        asiento.y < minY - margen || asiento.y > maxY + margen;
      if (fuera) sueltos.push(asiento.id);
    }
  }

  if (sueltos.length === 0) return [];

  return [{
    severidad: 'aviso',
    mensaje: sueltos.length === 1
      ? 'Hay un asiento lejos de su sector: en el visor va a aparecer flotando.'
      : `Hay ${sueltos.length} asientos lejos de su sector: en el visor van a aparecer flotando.`,
    ids: sueltos,
  }];
};

/**
 * El sector sintético «General».
 *
 * Lo arma el serializador con los asientos que quedaron sin sector. No debería
 * existir nunca: si aparece, algo separó unas butacas de su tribuna.
 */
const sectorGeneral = (map: VenueMap): Problema[] => {
  const general = map.sectors.find((s) => s.id === 'sector-general');
  if (!general) return [];

  return [{
    severidad: 'error',
    mensaje: `${general.seats.length} asientos quedaron sin sector y se agruparon en uno llamado «General».`,
    ids: [general.id],
  }];
};

/** Revisa el mapa entero. Devuelve los errores primero. */
export const validarMapa = (map: VenueMap): Problema[] => {
  const problemas = [
    ...idsRepetidos(map),
    ...sectorGeneral(map),
    ...sinAforo(map),
    ...nombresRepetidos(map),
    ...sinNombre(map),
    ...asientosFuera(map),
  ];

  return problemas.sort((a, b) => (a.severidad === b.severidad ? 0 : a.severidad === 'error' ? -1 : 1));
};

/** Aforo total del recinto: butacas dibujadas más capacidades declaradas. */
export const aforoTotal = (map: VenueMap): number =>
  map.sectors.reduce(
    (total, s) => total + (s.seats.length > 0 ? s.seats.length : (vendible(s) ? s.capacity ?? 0 : 0)),
    0,
  );
