import { describe, expect, it } from 'vitest';
import { effectiveGridStep, visibleGridRect } from './grid';

/**
 * `effectiveGridStep` y `visibleGridRect` sostienen el redibujo de la grilla
 * en `EditorCanvas`, que en este repo no se testea por convención (es
 * componente). Se prueba acá la aritmética pura que decide "cada cuánto se
 * dibuja una línea" y "sobre qué rectángulo", separada del `sceneFunc`.
 */

// Mismo rango que ofrece la interfaz: el selector de paso limita a estos
// cuatro valores (Toolbar.tsx) y la rueda del mouse limita la escala a
// [0.05, 5] (handleWheel en EditorCanvas.tsx).
const PASOS = [5, 10, 20, 50];
const ESCALAS = [0.05, 0.1, 0.5, 1, 2, 3, 5];
const UMBRAL_PX = 4;

describe('effectiveGridStep', () => {
  it('nunca deja la grilla mas fina que el umbral, en toda combinacion alcanzable desde la interfaz', () => {
    // Antes: un factor fijo de 5 aplicado una sola vez alcanzaba el umbral en
    // casi todos los casos pero no en el peor -paso 5, escala 0.05-, donde el
    // paso en pantalla quedaba en 1.25px, muy por debajo de los 4px que el
    // comentario decia garantizar.
    for (const paso of PASOS) {
      for (const escala of ESCALAS) {
        const paso_efectivo = effectiveGridStep(paso, escala);
        expect(paso_efectivo * escala).toBeGreaterThanOrEqual(UMBRAL_PX);
      }
    }
  });

  it('en el peor caso alcanzable (paso 5, escala 0.05) corrige lo suficiente', () => {
    // Caso puntual que reproduce el defecto reportado: con el factor fijo
    // viejo el paso en pantalla daba 1.25px (5 * 5 * 0.05).
    const paso_efectivo = effectiveGridStep(5, 0.05);
    expect(paso_efectivo * 0.05).toBeGreaterThanOrEqual(UMBRAL_PX);
  });

  it('es siempre un multiplo entero del paso elegido por el usuario', () => {
    // El iman a la grilla (snapToGrid) engancha en múltiplos del paso
    // configurado; si el paso efectivo no fuera múltiplo del paso elegido,
    // las líneas dibujadas y los puntos donde engancha el imán se
    // desalinearían.
    for (const paso of PASOS) {
      for (const escala of ESCALAS) {
        const paso_efectivo = effectiveGridStep(paso, escala);
        expect(paso_efectivo % paso).toBe(0);
      }
    }
  });

  it('no corrige de mas cuando el paso ya se ve claro', () => {
    // A escala 1 con paso 10 el paso en pantalla ya es 10px, por encima del
    // umbral: no hace falta multiplicar y el paso efectivo debe ser el
    // elegido tal cual, para no dibujar de más ni desalinear el imán.
    expect(effectiveGridStep(10, 1)).toBe(10);
  });
});

describe('visibleGridRect', () => {
  it('contiene al rectangulo visible con un margen de un viewport en cada direccion', () => {
    // El margen es lo que evita que la grilla se vea cortada mientras se
    // sostiene un gesto de paneo: Konva mueve el Stage nativamente en cada
    // frame sin volver a renderizar React, así que el sceneFunc dibuja con
    // el viewState de antes del arrastre. Si el margen no cubre el gesto,
    // el borde por donde avanza el paneo queda sin grilla hasta soltar.
    const view = { x: -100, y: -50, scale: 2 };
    const viewport = { width: 800, height: 600 };
    const rect = visibleGridRect(view, viewport);

    // Rectángulo visible sin margen, en coordenadas de mundo.
    const visibleMinX = -view.x / view.scale;
    const visibleMinY = -view.y / view.scale;
    const visibleMaxX = visibleMinX + viewport.width / view.scale;
    const visibleMaxY = visibleMinY + viewport.height / view.scale;

    expect(rect.minX).toBeLessThanOrEqual(visibleMinX);
    expect(rect.minY).toBeLessThanOrEqual(visibleMinY);
    expect(rect.maxX).toBeGreaterThanOrEqual(visibleMaxX);
    expect(rect.maxY).toBeGreaterThanOrEqual(visibleMaxY);

    // El margen es del orden de un viewport completo, no un puñado de
    // píxeles: alcanza para cubrir un arrastre sostenido, no solo un frame.
    const margenX = visibleMinX - rect.minX;
    const margenY = visibleMinY - rect.minY;
    expect(margenX).toBeCloseTo(viewport.width / view.scale);
    expect(margenY).toBeCloseTo(viewport.height / view.scale);
  });

  it('el margen crece al alejar el zoom, en unidades de mundo', () => {
    // A menor escala, un mismo desplazamiento en pantalla (drag) recorre más
    // unidades de mundo; el margen tiene que escalar igual o el paneo vuelve
    // a descubrirse antes en zoom alejado.
    const viewport = { width: 800, height: 600 };
    const cerca = visibleGridRect({ x: 0, y: 0, scale: 2 }, viewport);
    const lejos = visibleGridRect({ x: 0, y: 0, scale: 0.5 }, viewport);

    const margenCerca = cerca.maxX - cerca.minX;
    const margenLejos = lejos.maxX - lejos.minX;
    expect(margenLejos).toBeGreaterThan(margenCerca);
  });
});
