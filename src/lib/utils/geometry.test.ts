import { describe, expect, it } from 'vitest';
import { pointInPolygon } from './geometry';

/**
 * `pointInPolygon` decide si una butaca cae dentro de un sector dibujado a mano.
 *
 * De eso depende a qué sector queda asignado un asiento, y el sector es lo que
 * el backend usa para saber qué locales atienden esa ubicación. Un punto mal
 * clasificado no se ve en el lienzo: se ve cuando alguien escanea su QR y el
 * catálogo que le aparece es el de otra tribuna.
 *
 * Los polígonos van como lista plana `[x0, y0, x1, y1, …]`, que es como los
 * guarda Konva.
 */

/** Un cuadrado de 10×10 con esquina en el origen. */
const cuadrado = [0, 0, 10, 0, 10, 10, 0, 10];

/** Una «L», para probar un contorno cóncavo. */
const ele = [0, 0, 10, 0, 10, 4, 4, 4, 4, 10, 0, 10];

describe('un punto dentro de un sector dibujado', () => {
    it('reconoce el centro del cuadrado', () => {
        expect(pointInPolygon(5, 5, cuadrado)).toBe(true);
    });

    it('descarta lo que queda afuera', () => {
        expect(pointInPolygon(15, 5, cuadrado)).toBe(false);
        expect(pointInPolygon(-1, 5, cuadrado)).toBe(false);
        expect(pointInPolygon(5, 20, cuadrado)).toBe(false);
    });

    it('descarta un punto alineado con el polígono pero fuera de él', () => {
        // El caso que rompe las implementaciones ingenuas del trazado de rayos:
        // la horizontal cruza el polígono, pero el punto está a la derecha.
        expect(pointInPolygon(50, 5, cuadrado)).toBe(false);
    });

    it('resuelve un contorno cóncavo', () => {
        // Dentro del brazo bajo de la L.
        expect(pointInPolygon(2, 8, ele)).toBe(true);
        // En la escotadura: está en la caja envolvente pero fuera de la figura.
        expect(pointInPolygon(8, 8, ele)).toBe(false);
    });

    it('un polígono sin área no contiene nada', () => {
        expect(pointInPolygon(0, 0, [])).toBe(false);
        expect(pointInPolygon(1, 1, [0, 0, 5, 5])).toBe(false);
    });

    it('la decisión no depende de la escala del dibujo', () => {
        // El mismo punto relativo en un recinto diez veces más grande.
        const grande = cuadrado.map(v => v * 100);

        expect(pointInPolygon(500, 500, grande)).toBe(true);
        expect(pointInPolygon(1500, 500, grande)).toBe(false);
    });
});
