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
  it('nunca deja la grilla mas fina que el umbral, en la formula que rige todo el rango continuo de la interfaz', () => {
    // Los PASOS y ESCALAS de abajo son puntos discretos de muestreo, no el
    // dominio real: el selector de paso limita a esos cuatro valores, pero la
    // rueda del mouse multiplica la escala por 0.9 o 1.1 en cada tick
    // (handleWheel en EditorCanvas.tsx), asi que en uso real la escala toma
    // valores continuos como 0.055 o 0.1331, no solo los de esta lista. La
    // garantia no viene de este muestreo sino de la formula misma
    // (factor = ceil(minPixelSize / (step*scale))), que por construccion
    // redondea siempre hacia arriba al proximo multiplo que alcanza el
    // umbral; el muestreo de abajo es una verificacion adicional sobre casos
    // representativos, no la prueba de cobertura.
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
  it('coincide exactamente con el rectangulo visible, sin margen', () => {
    // El margen que tenia antes esta funcion compensaba que el sceneFunc de
    // la grilla dibujaba con el viewState de React, desactualizado durante un
    // arrastre nativo del Stage. Ahora el sceneFunc lee la posicion y escala
    // en vivo del stage en cada frame (ver EditorCanvas.tsx), asi que este
    // rectangulo ya es exactamente lo visible en todo momento y dibujar de
    // mas no suma cobertura.
    const view = { x: -100, y: -50, scale: 2 };
    const viewport = { width: 800, height: 600 };
    const rect = visibleGridRect(view, viewport);

    const visibleMinX = -view.x / view.scale;
    const visibleMinY = -view.y / view.scale;
    const visibleMaxX = visibleMinX + viewport.width / view.scale;
    const visibleMaxY = visibleMinY + viewport.height / view.scale;

    expect(rect.minX).toBeCloseTo(visibleMinX);
    expect(rect.minY).toBeCloseTo(visibleMinY);
    expect(rect.maxX).toBeCloseTo(visibleMaxX);
    expect(rect.maxY).toBeCloseTo(visibleMaxY);
  });

  it('el rectangulo crece al alejar el zoom, en unidades de mundo', () => {
    // A menor escala, el mismo viewport en pantalla cubre mas unidades de
    // mundo: el rectangulo tiene que escalar igual, sin depender de un
    // margen fijo para hacerlo.
    const viewport = { width: 800, height: 600 };
    const cerca = visibleGridRect({ x: 0, y: 0, scale: 2 }, viewport);
    const lejos = visibleGridRect({ x: 0, y: 0, scale: 0.5 }, viewport);

    const anchoCerca = cerca.maxX - cerca.minX;
    const anchoLejos = lejos.maxX - lejos.minX;
    expect(anchoLejos).toBeGreaterThan(anchoCerca);
  });
});
