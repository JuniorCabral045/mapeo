# Mapeador Fase 0 + Fase 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dejar el editor de recintos sin los cuatro defectos que rompen datos, y agregarle las operaciones que hacen que mapear un estadio sea rápido (duplicar/espejar, alinear, imán, atajos, plantillas).

**Architecture:** Toda la lógica nueva vive en módulos puros bajo `src/lib/utils/` (bounds, snapping, align, duplicate, templates, shortcuts) y se prueba con Vitest sin DOM. El store (`src/lib/store/useVenueStore.ts`) expone acciones que componen esos módulos, y los componentes de Konva solo cablean eventos a esas acciones. Ningún componente calcula geometría por su cuenta.

**Tech Stack:** React 18, TypeScript, Konva/react-konva, Zustand 5, Tailwind 3, Vitest 3, Vite 5 (modo librería).

**Spec:** `docs/superpowers/specs/2026-08-12-mapeador-fase-0-1-design.md`

## Global Constraints

- **Repo y rama:** todo el trabajo va en `mapeo`, rama `dev`. `mapeo` es su propio repositorio git; nunca correr git desde la raíz `tesis/`.
- **Commitear cada tarea en `dev`.** El usuario autorizó explícitamente los commits en esta rama, que es descartable: al final rearma o aplasta los commits como quiera antes de integrar. Cada tarea deja un commit con el mensaje que indica su paso «Commit». **No** hacer merge, rebase, push ni tocar ninguna otra rama.
- **Los cambios de formato son aditivos y opcionales.** Todo campo nuevo en `VenueMap`/`SectorData`/`SeatData` lleva `?`. Un mapa viejo se abre sin migración y uno nuevo se lee con los consumidores viejos. No existe versión 2 del schema; `version` sigue siendo `1`.
- **Idioma:** **la superficie pública en inglés** — nombres exportados, tipos, props y campos del formato de datos (la librería es un paquete npm publicable: `VenueMap`, `serializeVenue`, `sectors`). Textos de interfaz, comentarios y tests en español. Las variables locales dentro de una función no son superficie pública: seguí el código del bloque que te da el brief y no las renombres.
- **Solo se toca `src/lib/`** (más el borrado de la isla muerta en la Task 1 y el `CLAUDE.md` del repo). No se tocan `point-api`, `point-web-admin`, `point-app-cliente` ni `point-app-delivery`.
- **Íconos:** `lucide-react`. **Estilos:** Tailwind. No agregar otras librerías de UI ni de iconos.
- **No agregar dependencias nuevas.** En particular, el imán entre elementos se implementa sin `rbush`.
- **Paleta existente:** naranja de acción `#FF6B01`, violeta de marca `#6F3E8F`, fondo del lienzo `#F3F4F6`. Los tokens de color son Fase 2; hasta entonces se usan estos literales, como el resto del archivo que se esté tocando.
- **Comandos de cierre de cada task:** `npm run lint`, `npm test` y `npm run build`, corridos desde `mapeo/`.

---

## Estructura de archivos

**Se crean**

| Archivo | Responsabilidad |
|---|---|
| `src/lib/utils/bounds.ts` | caja contenedora de elementos y cálculo de encuadre |
| `src/lib/utils/bounds.test.ts` | tests de lo anterior |
| `src/lib/utils/transformer.ts` | qué anclas de redimensión corresponden a una selección |
| `src/lib/utils/transformer.test.ts` | tests de lo anterior |
| `src/lib/utils/snapping.ts` | imán a bordes/centros de otros sectores, con guías |
| `src/lib/utils/snapping.test.ts` | tests de lo anterior |
| `src/lib/utils/align.ts` | alinear y distribuir una selección |
| `src/lib/utils/align.test.ts` | tests de lo anterior |
| `src/lib/utils/duplicate.ts` | duplicar y espejar sectores con sus asientos |
| `src/lib/utils/duplicate.test.ts` | tests de lo anterior |
| `src/lib/utils/templates.ts` | plantillas de recinto (estadio recto, estadio curvo, teatro) |
| `src/lib/utils/templates.test.ts` | tests de lo anterior |
| `src/lib/utils/shortcuts.ts` | traducción de un evento de teclado a una acción del editor |
| `src/lib/utils/shortcuts.test.ts` | tests de lo anterior |
| `src/lib/hooks/useEditorShortcuts.ts` | cableado del teclado al store |
| `src/lib/store/useVenueStore.test.ts` | tests de las acciones del store |
| `src/lib/components/AlignBar.tsx` | barra de alinear/distribuir |
| `src/lib/components/TemplateMenu.tsx` | menú de plantillas |

**Se modifican**

| Archivo | Cambio |
|---|---|
| `src/lib/types.ts` | `SeatData.rotation?`, `SectorData.generation?`, `GridConfig.snapToElements` |
| `src/lib/schema.ts` | serializar/deserializar los campos nuevos |
| `src/lib/utils/layout.ts` | `rowLabel`, usado por los cuatro generadores |
| `src/lib/utils/layout.test.ts` | casos de `rowLabel` y de rotación |
| `src/lib/store/useVenueStore.ts` | `moveSector`, `transformSector`, `deleteElements` en cascada, `duplicateSectors`, `applyTemplate`, `fitToContent`, `nudgeSelection` |
| `src/lib/components/canvas/EditorCanvas.tsx` | cablear las acciones nuevas, guías del imán, anclas |
| `src/lib/components/canvas/Seat.tsx` | aplicar la rotación |
| `src/lib/components/Toolbar.tsx` | grilla, duplicar/espejar, plantillas |
| `src/lib/components/PropertyPanel.tsx` | `generation` persistida, confirmación al regenerar |
| `src/lib/VenueEditor.tsx` | encuadrar, atajos, barra de alinear, confirmación de borrado |
| `src/lib/VenueViewer.tsx` | usar `bounds.ts` |
| `src/lib/index.ts` | exportar lo nuevo que sea de uso externo |
| `CLAUDE.md` | corregir la sección de la divergencia demo/lib |

**Se borran** (Task 1): `src/store/`, `src/components/`, `src/types/`, `src/utils/`, `src/styles/`.

---

### Task 1: Borrar la isla muerta y corregir CLAUDE.md

`src/demo/App.tsx` ya importa de `../lib`. Partiendo de `src/main.tsx`, nada alcanza a los cinco directorios de la raíz de `src/`: solo se importan entre ellos. Son ~2.100 líneas muertas, y `CLAUDE.md` las documenta como si fueran una copia viva que hay que evitar.

**Files:**
- Delete: `src/store/`, `src/components/`, `src/types/`, `src/utils/`, `src/styles/`
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: nada
- Produces: nada. Deja el árbol sin código muerto para las tasks siguientes.

- [ ] **Step 1: Comprobar que la isla está muerta antes de borrar**

Run:
```bash
grep -rn "from '\.\./\(store\|components\|types\|utils\|styles\)" src/demo src/main.tsx
```
Expected: sin resultados. Si aparece alguno, **detenerse**: la premisa del plan no se cumple y hay que revisarla con el usuario.

- [ ] **Step 2: Guardar copia de referencia de los dos módulos que se rescatan más adelante**

No se copian al árbol: se rescatan reescritos en las Tasks 10 y 15. Solo verificar que siguen accesibles en el historial.

Run:
```bash
git show HEAD:src/utils/snapping.ts | head -5 && git show HEAD:src/utils/templates.ts | head -5
```
Expected: imprime las primeras líneas de ambos archivos.

- [ ] **Step 3: Borrar los cinco directorios**

Run:
```bash
git rm -r --quiet src/store src/components src/types src/utils src/styles
```
Expected: sin salida.

- [ ] **Step 4: Verificar que todo sigue en pie**

Run:
```bash
npm run lint && npm test && npm run build
```
Expected: lint sin errores, tests en verde, `dist/venue-mapper.js`, `dist/index.d.ts` y `dist/style.css` generados.

- [ ] **Step 5: Corregir CLAUDE.md**

Reemplazar la sección `## ⚠️ The demo and the library are two different programs` completa (desde ese encabezado hasta justo antes de `## Architecture`) por:

```markdown
## El demo consume la librería

`src/demo/App.tsx` importa de `src/lib` — lo que ves en `npm run dev` es exactamente lo
que recibe el panel admin. Hasta 2026-08 existía bajo `src/` una copia paralela del
store, los componentes, los tipos y las utilidades, que ya no importaba nadie; se borró.
Si necesitás algo de ahí (agrupar, copiar/pegar, el índice espacial RBush, los tokens de
`theme.ts`), está en el historial: `git show <commit-anterior>:src/utils/snapping.ts`.

**Todo cambio va en `src/lib/`.** El demo es una pantalla delgada: pestañas
Editor/Tienda, persistencia en `localStorage` y disponibilidad simulada.
```

En la tabla de `## Architecture`, borrar la fila de `utils/` que compara demo y lib si quedó desactualizada, y verificar que el árbol descrito no mencione los directorios borrados.

- [ ] **Step 6: Commit** *(solo si el usuario lo pidió — ver Global Constraints)*

```bash
git add -A
git commit -m "chore: borrar la copia muerta del demo y corregir CLAUDE.md"
```

---

### Task 2: `bounds.ts` — caja contenedora y encuadre

El cálculo está hoy escrito a mano dentro de `VenueViewer` y tiene un error: trata a los asientos como si su `x,y` fuera la esquina superior izquierda (`minX = el.x`, `maxX = el.x + radius*2`), cuando `Seat` los dibuja **centrados** en `x,y`. El encuadre queda corrido medio asiento. Y los círculos y arcos también se dibujan centrados en el origen del grupo, así que su caja tampoco es `x..x+width`.

**Files:**
- Create: `src/lib/utils/bounds.ts`
- Test: `src/lib/utils/bounds.test.ts`

**Interfaces:**
- Consumes: `VenueElement`, `SeatElement`, `ShapeElement`, `ViewState` de `../types`
- Produces:
  - `interface Bounds { minX: number; minY: number; maxX: number; maxY: number }`
  - `elementBounds(el: VenueElement): Bounds`
  - `centerOf(el: VenueElement): { x: number; y: number }`
  - `calculateBounds(elements: Record<string, VenueElement>, elementIds: string[]): Bounds | null`
  - `fitView(bounds: Bounds, width: number, height: number, margin?: number): ViewState`

- [ ] **Step 1: Escribir el test que falla**

Create `src/lib/utils/bounds.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { calculateBounds, centerOf, elementBounds, fitView } from './bounds';
import type { SeatElement, ShapeElement, VenueElement } from '../types';

/**
 * El encuadre es lo primero que ve quien abre un recinto guardado. Si la caja
 * está mal calculada el mapa aparece corrido o directamente fuera de pantalla, y
 * la reacción natural es creer que el mapa se perdió.
 *
 * El detalle que importa: los asientos, los círculos y los arcos se dibujan
 * CENTRADOS en su x,y; los rectángulos y polígonos nacen en su esquina.
 */

const sector = (extra: Partial<ShapeElement> = {}): ShapeElement => ({
  id: 'sector-1',
  type: 'section',
  name: 'Norte',
  x: 100,
  y: 200,
  width: 400,
  height: 300,
  rotation: 0,
  visible: true,
  locked: false,
  opacity: 1,
  zIndex: 1,
  fill: '#6F3E8F',
  isActive: true,
  sectionType: 'rectangle',
  ...extra,
});

const asiento = (extra: Partial<SeatElement> = {}): SeatElement => ({
  id: 'seat-1',
  type: 'seat',
  name: 'A1',
  x: 50,
  y: 60,
  rotation: 0,
  visible: true,
  locked: false,
  opacity: 1,
  zIndex: 10,
  sectionId: 'sector-1',
  row: 'A',
  number: '1',
  status: 'available',
  radius: 10,
  ...extra,
});

describe('caja de un elemento', () => {
  it('un rectángulo va de su esquina a su esquina más el tamaño', () => {
    expect(elementBounds(sector())).toEqual({ minX: 100, minY: 200, maxX: 500, maxY: 500 });
  });

  it('un asiento se dibuja centrado en su x,y', () => {
    // Este era el error del cálculo viejo del visor: lo tomaba como esquina.
    expect(elementBounds(asiento())).toEqual({ minX: 40, minY: 50, maxX: 60, maxY: 70 });
  });

  it('un círculo se dibuja centrado en su x,y', () => {
    const circulo = sector({ sectionType: 'circle', radius: 50 });

    expect(elementBounds(circulo)).toEqual({ minX: 50, minY: 150, maxX: 150, maxY: 250 });
  });

  it('un arco se acota por su radio exterior alrededor de su x,y', () => {
    const arco = sector({ sectionType: 'arc', innerRadius: 120, outerRadius: 220 });

    expect(elementBounds(arco)).toEqual({ minX: -120, minY: -20, maxX: 320, maxY: 420 });
  });
});

describe('centro de un elemento', () => {
  it('el de un rectángulo es el medio de su caja', () => {
    expect(centerOf(sector())).toEqual({ x: 300, y: 350 });
  });

  it('el de un círculo o un arco es su propio origen', () => {
    expect(centerOf(sector({ sectionType: 'circle', radius: 50 }))).toEqual({ x: 100, y: 200 });
    expect(centerOf(sector({ sectionType: 'arc', outerRadius: 220 }))).toEqual({ x: 100, y: 200 });
  });
});

describe('caja de todo el recinto', () => {
  it('abarca a todos los elementos', () => {
    const elements: Record<string, VenueElement> = {
      'sector-1': sector(),
      'seat-1': asiento({ x: 1000, y: 1000, radius: 5 }),
    };

    expect(calculateBounds(elements, ['sector-1', 'seat-1'])).toEqual({
      minX: 100, minY: 200, maxX: 1005, maxY: 1005,
    });
  });

  it('sin elementos devuelve null en vez de una caja infinita', () => {
    // Un lienzo vacío no se encuadra: se deja la vista por defecto.
    expect(calculateBounds({}, [])).toBeNull();
  });

  it('ignora ids que ya no existen', () => {
    expect(calculateBounds({ 'sector-1': sector() }, ['sector-1', 'borrado'])).toEqual({
      minX: 100, minY: 200, maxX: 500, maxY: 500,
    });
  });
});

describe('encuadre', () => {
  const caja = { minX: 0, minY: 0, maxX: 1000, maxY: 500 };

  it('deja el contenido centrado en el contenedor', () => {
    const vista = fitView(caja, 800, 600, 1);

    // Con margen 1 el ancho manda: 800/1000 = 0.8
    expect(vista.scale).toBeCloseTo(0.8);
    expect(vista.x).toBeCloseTo(0);
    expect(vista.y).toBeCloseTo((600 - 500 * 0.8) / 2);
  });

  it('descuenta el margen pedido', () => {
    expect(fitView(caja, 800, 600, 0.85).scale).toBeCloseTo(0.68);
  });

  it('compensa el desplazamiento de una caja lejos del origen', () => {
    const lejos = { minX: 2000, minY: 3000, maxX: 3000, maxY: 3500 };
    const vista = fitView(lejos, 800, 600, 1);

    // El punto (2000,3000) tiene que caer dentro del contenedor, no fuera.
    expect(2000 * vista.scale + vista.x).toBeGreaterThanOrEqual(0);
    expect(3000 * vista.scale + vista.y).toBeGreaterThanOrEqual(0);
  });

  it('acota la escala al mismo rango que la rueda del mouse', () => {
    const minuscula = { minX: 0, minY: 0, maxX: 1, maxY: 1 };
    const gigante = { minX: 0, minY: 0, maxX: 100000, maxY: 100000 };

    expect(fitView(minuscula, 800, 600, 1).scale).toBeLessThanOrEqual(5);
    expect(fitView(gigante, 800, 600, 1).scale).toBeGreaterThanOrEqual(0.05);
  });

  it('una caja sin superficie no divide por cero', () => {
    const punto = { minX: 10, minY: 10, maxX: 10, maxY: 10 };

    expect(Number.isFinite(fitView(punto, 800, 600).scale)).toBe(true);
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npx vitest run src/lib/utils/bounds.test.ts`
Expected: FAIL — `Failed to resolve import "./bounds"`.

- [ ] **Step 3: Implementar**

Create `src/lib/utils/bounds.ts`:

```ts
import { SeatElement, ShapeElement, VenueElement, ViewState } from '../types';

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** Escala mínima y máxima del lienzo. Es el mismo rango que aplica la rueda. */
const MIN_SCALE = 0.05;
const MAX_SCALE = 5;

const clamp = (valor: number, min: number, max: number) =>
  Math.max(min, Math.min(max, valor));

/** Formas que Konva dibuja centradas en el origen del grupo, no desde la esquina. */
const esRadial = (el: ShapeElement) =>
  el.sectionType === 'circle' || el.sectionType === 'arc';

/**
 * Caja que ocupa un elemento en coordenadas de mundo.
 *
 * No contempla la rotación: la caja de un sector rotado queda algo más chica que
 * su huella real. Para encuadrar alcanza, y evita tener que rotar cuatro esquinas
 * en el camino caliente del render.
 */
export const elementBounds = (el: VenueElement): Bounds => {
  if (el.type === 'seat') {
    const { x, y, radius } = el as SeatElement;
    return { minX: x - radius, minY: y - radius, maxX: x + radius, maxY: y + radius };
  }

  const shape = el as ShapeElement;

  if (shape.sectionType === 'circle') {
    const r = shape.radius ?? shape.width / 2;
    return { minX: shape.x - r, minY: shape.y - r, maxX: shape.x + r, maxY: shape.y + r };
  }

  if (shape.sectionType === 'arc') {
    const r = shape.outerRadius ?? shape.width / 2;
    return { minX: shape.x - r, minY: shape.y - r, maxX: shape.x + r, maxY: shape.y + r };
  }

  return {
    minX: shape.x,
    minY: shape.y,
    maxX: shape.x + shape.width,
    maxY: shape.y + shape.height,
  };
};

/** Punto alrededor del cual espejar o rotar un elemento. */
export const centerOf = (el: VenueElement): { x: number; y: number } => {
  if (el.type !== 'seat' && esRadial(el as ShapeElement)) {
    return { x: el.x, y: el.y };
  }
  const caja = elementBounds(el);
  return { x: (caja.minX + caja.maxX) / 2, y: (caja.minY + caja.maxY) / 2 };
};

/** Caja que abarca a todos los elementos indicados. `null` si no hay ninguno. */
export const calculateBounds = (
  elements: Record<string, VenueElement>,
  elementIds: string[]
): Bounds | null => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let hubo = false;

  for (const id of elementIds) {
    const el = elements[id];
    if (!el) continue;
    hubo = true;
    const caja = elementBounds(el);
    if (caja.minX < minX) minX = caja.minX;
    if (caja.minY < minY) minY = caja.minY;
    if (caja.maxX > maxX) maxX = caja.maxX;
    if (caja.maxY > maxY) maxY = caja.maxY;
  }

  return hubo ? { minX, minY, maxX, maxY } : null;
};

/**
 * Vista que deja la caja centrada dentro de un contenedor de `width` × `height`.
 * `margin` < 1 deja aire alrededor.
 */
export const fitView = (
  bounds: Bounds,
  width: number,
  height: number,
  margin = 0.85
): ViewState => {
  const ancho = bounds.maxX - bounds.minX || 1;
  const alto = bounds.maxY - bounds.minY || 1;
  const scale = clamp(
    Math.min(width / ancho, height / alto) * margin,
    MIN_SCALE,
    MAX_SCALE
  );

  return {
    scale,
    x: (width - ancho * scale) / 2 - bounds.minX * scale,
    y: (height - alto * scale) / 2 - bounds.minY * scale,
  };
};
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npx vitest run src/lib/utils/bounds.test.ts`
Expected: PASS, 15 tests.

- [ ] **Step 5: Usarlo en el visor**

En `src/lib/VenueViewer.tsx`, agregar el import:

```ts
import { calculateBounds, fitView } from './utils/bounds';
```

y reemplazar el `useEffect` de encuadre (el que arranca en `// Encuadrar el mapa completo al montar / cambiar de mapa`) por:

```tsx
  // Encuadrar el mapa completo al montar / cambiar de mapa
  useEffect(() => {
    const caja = calculateBounds(elements, elementIds);
    if (!caja) return;
    setView(fitView(caja, dimensions.width, dimensions.height));
  }, [elements, elementIds, dimensions]);
```

- [ ] **Step 6: Verificar**

Run: `npm run lint && npm test && npm run build`
Expected: todo en verde.

- [ ] **Step 7: Commit**

```bash
git add src/lib/utils/bounds.ts src/lib/utils/bounds.test.ts src/lib/VenueViewer.tsx
git commit -m "feat: caja contenedora y encuadre en un solo modulo, con los asientos centrados"
```

---

### Task 3: Encuadrar al abrir el editor

**Files:**
- Modify: `src/lib/store/useVenueStore.ts`, `src/lib/components/canvas/EditorCanvas.tsx`, `src/lib/VenueEditor.tsx`

**Interfaces:**
- Consumes: `calculateBounds`, `fitView` (Task 2)
- Produces: en el store, `canvasSize: { width: number; height: number }`, `setCanvasSize(width, height)` y `fitToContent()`.

El store necesita saber el tamaño del lienzo para encuadrar, y hoy ese dato solo vive dentro de `EditorCanvas`. Se sube al store.

- [ ] **Step 1: Agregar el estado y la acción al store**

En `src/lib/store/useVenueStore.ts`, agregar al import:

```ts
import { calculateBounds, fitView } from '../utils/bounds';
```

En la interfaz `VenueStore`, después de `backgroundImage: BackgroundImage | null;`:

```ts
  /** Tamaño del lienzo en píxeles. Lo publica EditorCanvas; lo necesita fitToContent. */
  canvasSize: { width: number; height: number };
```

y en la sección de acciones de vista, junto a `setViewState`:

```ts
  setCanvasSize: (width: number, height: number) => void;
  /** Encuadra todo el contenido. Sin elementos no hace nada. */
  fitToContent: () => void;
```

En el objeto del store, junto a `backgroundImage: null,`:

```ts
  canvasSize: { width: 1000, height: 800 },
```

y junto a `setViewState`:

```ts
  setCanvasSize: (width, height) => set({ canvasSize: { width, height } }),

  fitToContent: () => {
    const { elements, elementIds, canvasSize } = get();
    const caja = calculateBounds(elements, elementIds);
    if (!caja) return;
    set({ viewState: fitView(caja, canvasSize.width, canvasSize.height) });
  },
```

Y en `loadMap`, después del `set({...})` existente y antes de `get().saveHistory();`:

```ts
    get().fitToContent();
```

- [ ] **Step 2: Publicar el tamaño del lienzo desde el canvas**

En `src/lib/components/canvas/EditorCanvas.tsx`, agregar `setCanvasSize` al destructuring del store:

```ts
    selectElements, updateElement, addElement, setCanvasSize,
```

y dentro del `updateSize` del `useEffect` de medición, después del `setDimensions({...})`:

```ts
        setCanvasSize(containerRef.current.offsetWidth, containerRef.current.offsetHeight);
```

- [ ] **Step 3: Cambiar el botón «restablecer vista» por «encuadrar»**

En `src/lib/VenueEditor.tsx`, cambiar el destructuring:

```ts
  const { selectedIds, viewState, setViewState, fitToContent } = useVenueStore();
```

borrar `const resetZoom = () => setViewState({ scale: 1, x: 100, y: 100 });` y cambiar el botón:

```tsx
          <button
            onClick={fitToContent}
            className="w-12 h-12 bg-white rounded-xl shadow-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#FF6B01] hover:bg-orange-50 transition-all"
            title="Encuadrar el recinto"
          >
            <Maximize size={18} />
          </button>
```

- [ ] **Step 4: Verificar a mano**

Run: `npm run dev`
Abrir el demo, crear un sector, arrastrarlo bien lejos, guardar, recargar la página.
Expected: al volver, el sector aparece encuadrado y centrado — no un lienzo vacío. El botón de encuadrar lo vuelve a centrar en cualquier momento.

- [ ] **Step 5: Verificar**

Run: `npm run lint && npm test && npm run build`
Expected: todo en verde.

- [ ] **Step 6: Commit**

```bash
git add src/lib/store/useVenueStore.ts src/lib/components/canvas/EditorCanvas.tsx src/lib/VenueEditor.tsx
git commit -m "feat: el editor encuadra el recinto al abrirlo"
```

---

### Task 4: `rowLabel` — filas más allá de la Z

`String.fromCharCode('A'.charCodeAt(0) + r)` con r=26 devuelve `[`. Un sector de 30 filas se numera con símbolos.

**Files:**
- Modify: `src/lib/utils/layout.ts`, `src/lib/utils/layout.test.ts`

**Interfaces:**
- Produces: `rowLabel(index: number, startRow?: string): string` exportada desde `utils/layout.ts`.

- [ ] **Step 1: Escribir el test que falla**

Agregar al final de `src/lib/utils/layout.test.ts` (y sumar `rowLabel` al import de `./layout`):

```ts
describe('etiquetas de fila', () => {
  it('usa letras mientras alcanzan', () => {
    expect([0, 1, 25].map(i => rowLabel(i))).toEqual(['A', 'B', 'Z']);
  });

  it('sigue con dos letras después de la Z', () => {
    // Una tribuna de 30 filas es normal. Antes esto devolvía '[', '\' y ']'.
    expect([26, 27, 51].map(i => rowLabel(i))).toEqual(['AA', 'AB', 'AZ']);
  });

  it('respeta la fila inicial elegida', () => {
    expect([0, 1].map(i => rowLabel(i, 'C'))).toEqual(['C', 'D']);
  });

  it('desde una fila inicial alta también pasa a dos letras', () => {
    expect(rowLabel(1, 'Z')).toBe('AA');
  });

  it('un sector de 30 filas no usa ningún símbolo raro', () => {
    const etiquetas = Array.from({ length: 30 }, (_, i) => rowLabel(i));

    for (const etiqueta of etiquetas) {
      expect(etiqueta).toMatch(/^[A-Z]+$/);
    }
  });

  it('los generadores la usan: la fila 27 de un sector es AA', () => {
    const asientos = generateRectLayout(contenedor, params({ rows: 27, cols: 1 }));

    expect(asientos[26].row).toBe('AA');
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npx vitest run src/lib/utils/layout.test.ts`
Expected: FAIL — `rowLabel is not exported` y el último caso con `'['`.

- [ ] **Step 3: Implementar**

En `src/lib/utils/layout.ts`, agregar después de la definición de `LayoutParams`:

```ts
/**
 * Etiqueta de fila: A…Z, AA, AB… desde la fila inicial indicada.
 *
 * La versión anterior sumaba al código del carácter, así que la fila 27 de una
 * tribuna se llamaba «[». Un estadio con 30 filas es lo normal, no el borde.
 */
export const rowLabel = (index: number, startRow = 'A'): string => {
  const base = (startRow.toUpperCase().charCodeAt(0) || 65) - 65;
  let n = base + index;
  let etiqueta = '';

  do {
    etiqueta = String.fromCharCode(65 + (n % 26)) + etiqueta;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);

  return etiqueta;
};
```

y reemplazar las cuatro apariciones de

```ts
    const rowLabel = String.fromCharCode(startRow.charCodeAt(0) + r);
```

por

```ts
    const rowEtiqueta = rowLabel(r, startRow);
```

renombrando su uso dentro de cada bucle (`makeSeat(..., rowLabel, ...)` pasa a `makeSeat(..., rowEtiqueta, ...)`). En `generatePolygonLayout` la variable está dentro del `rows.forEach((row, r) => {`; aplica igual.

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npx vitest run src/lib/utils/layout.test.ts`
Expected: PASS.

- [ ] **Step 5: Exportar desde el índice**

En `src/lib/index.ts`, agregar `rowLabel` a la lista que ya exporta los generadores:

```ts
export {
  generateRectLayout,
  generateArcLayout,
  generatePolygonLayout,
  generateArcSectorLayout,
  rowLabel,
} from './utils/layout';
```

- [ ] **Step 6: Verificar**

Run: `npm run lint && npm test && npm run build`
Expected: todo en verde.

- [ ] **Step 7: Commit**

```bash
git add src/lib/utils/layout.ts src/lib/utils/layout.test.ts src/lib/index.ts
git commit -m "fix: las filas siguen con AA despues de la Z en vez de simbolos"
```

---

### Task 5: La rotación del asiento se guarda y se dibuja

Los generadores de arco calculan la rotación de cada butaca, `deserializeVenue` la fuerza a 0 y `Seat` ni la aplica: dato que se calcula, se pierde y nunca se ve.

**Files:**
- Modify: `src/lib/types.ts`, `src/lib/schema.ts`, `src/lib/components/canvas/Seat.tsx`, `src/lib/utils/layout.test.ts`

**Interfaces:**
- Produces: `SeatData.rotation?: number` en el formato público. Ausente = 0.

- [ ] **Step 1: Escribir el test que falla**

Crear `src/lib/schema.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { deserializeVenue, serializeVenue } from './schema';
import { generateArcSectorLayout } from './utils/layout';
import type { ShapeElement, VenueElement } from './types';

/**
 * Ida y vuelta del formato. Lo que se pierde acá no se pierde en pantalla: se
 * pierde en el JSON que queda guardado en el backend, y no vuelve.
 */

const arco: ShapeElement = {
  id: 'sector-arco',
  type: 'section',
  name: 'Anillo',
  x: 500,
  y: 500,
  width: 440,
  height: 440,
  rotation: 0,
  visible: true,
  locked: false,
  opacity: 0.2,
  zIndex: 5,
  fill: '#6F3E8F',
  isActive: true,
  sectionType: 'arc',
  innerRadius: 120,
  outerRadius: 220,
  startAngle: 200,
  endAngle: 340,
};

describe('ida y vuelta del mapeo', () => {
  it('conserva la rotación de los asientos de un anillo', () => {
    // Sin esto, las butacas de una tribuna curva vuelven todas mirando al norte.
    const asientos = generateArcSectorLayout(arco, {
      rows: 2, cols: 10, rowSpacing: 4, colSpacing: 4,
      seatRadius: 4, startRow: 'A', startNum: 1,
    });
    const elements: Record<string, VenueElement> = { [arco.id]: arco };
    asientos.forEach(a => { elements[a.id] = a; });
    const ids = [arco.id, ...asientos.map(a => a.id)];

    const mapa = serializeVenue(elements, ids, 'Estadio');
    const vuelta = deserializeVenue(mapa);

    for (const a of asientos) {
      expect(vuelta.elements[a.id].rotation).toBeCloseTo(a.rotation);
    }
    expect(asientos.some(a => a.rotation !== 0)).toBe(true);
  });

  it('un mapa viejo sin rotación se lee con rotación 0', () => {
    const vuelta = deserializeVenue({
      version: 1,
      name: 'Viejo',
      sectors: [{
        id: 's1', name: 'Norte', kind: 'section', shape: 'rectangle',
        x: 0, y: 0, width: 100, height: 100, rotation: 0,
        fill: '#6F3E8F', active: true,
        seats: [{ id: 'a1', row: 'A', number: '1', x: 10, y: 10, radius: 4 }],
      }],
    });

    expect(vuelta.elements['a1'].rotation).toBe(0);
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npx vitest run src/lib/schema.test.ts`
Expected: FAIL — las rotaciones vuelven en 0.

- [ ] **Step 3: Implementar**

En `src/lib/types.ts`, dentro de `SeatData`, después de `radius: number;`:

```ts
  /** Orientación de la butaca en grados. Ausente = 0 (mapas anteriores a 2026-08). */
  rotation?: number;
```

En `src/lib/schema.ts`, en el objeto `data: SeatData`, agregar:

```ts
      rotation: seat.rotation || undefined,
```

y en `deserializeVenue`, cambiar `rotation: 0,` por:

```ts
        rotation: seat.rotation ?? 0,
```

En `src/lib/components/canvas/Seat.tsx`, agregar `rotation` al destructuring:

```ts
  const { id, x, y, radius, status, locked, opacity, color, number, rotation } = element;
```

y pasarlo al `<Group>`:

```tsx
    <Group
      id={id}
      x={x}
      y={y}
      rotation={rotation}
      ref={groupRef}
```

Agregar `rotation` a las dependencias del `useEffect` de cache, para que un cambio de orientación invalide el cacheado:

```ts
  }, [isSelected, draggable, status, color, opacity, showLabels, isInactive, rotation]);
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npx vitest run src/lib/schema.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Verificar a ojo**

Run: `npm run dev`
Crear un sector curvo (ícono de la curva), generar asientos y mirar el anillo.
Expected: las butacas siguen la curva en vez de estar todas alineadas con la pantalla.

- [ ] **Step 6: Verificar**

Run: `npm run lint && npm test && npm run build`
Expected: todo en verde.

- [ ] **Step 7: Commit**

```bash
git add src/lib/types.ts src/lib/schema.ts src/lib/schema.test.ts src/lib/components/canvas/Seat.tsx
git commit -m "feat: la orientacion de las butacas se guarda y se dibuja"
```

---

### Task 6: El store trata al sector y sus asientos como una unidad

**Files:**
- Modify: `src/lib/store/useVenueStore.ts`
- Test: `src/lib/store/useVenueStore.test.ts` (nuevo)

**Interfaces:**
- Consumes: `calculateBounds` no; usa solo aritmética propia.
- Produces:
  - `seatsOfSector(elements, elementIds, sectorId): SeatElement[]` exportada desde `src/lib/utils/sector.ts` (nuevo, para que la puedan usar también las Tasks 12 y 13).
  - En el store: `moveSector(id, x, y)`, `transformSector(id, cambio)` con
    `cambio: { x: number; y: number; rotation: number; scaleX: number; scaleY: number }`,
    y `deleteElements(ids)` con cascada.

- [ ] **Step 1: Escribir el test que falla**

Create `src/lib/store/useVenueStore.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { useVenueStore } from './useVenueStore';
import type { SeatElement, ShapeElement } from '../types';

/**
 * En el lienzo los asientos no son hijos del sector: son hermanos con coordenadas
 * absolutas. Estas pruebas fijan que, para el usuario, se comporten como una sola
 * cosa — mover una tribuna con 500 butacas y que las butacas se queden atrás es
 * el tipo de bug que se descubre después de guardar.
 */

const sector: ShapeElement = {
  id: 'sector-1',
  type: 'section',
  name: 'Norte',
  x: 100,
  y: 100,
  width: 200,
  height: 100,
  rotation: 0,
  visible: true,
  locked: false,
  opacity: 0.2,
  zIndex: 5,
  fill: '#6F3E8F',
  isActive: true,
  sectionType: 'rectangle',
};

const asiento = (id: string, x: number, y: number): SeatElement => ({
  id,
  type: 'seat',
  name: id,
  x,
  y,
  rotation: 0,
  visible: true,
  locked: false,
  opacity: 1,
  zIndex: 10,
  sectionId: 'sector-1',
  row: 'A',
  number: id.slice(-1),
  status: 'available',
  radius: 5,
});

const escenario = () => {
  useVenueStore.getState().reset();
  useVenueStore.getState().addElements([
    sector,
    asiento('a1', 120, 120),
    asiento('a2', 140, 120),
  ]);
};

beforeEach(escenario);

describe('mover un sector', () => {
  it('lleva sus asientos con él', () => {
    useVenueStore.getState().moveSector('sector-1', 300, 400);
    const { elements } = useVenueStore.getState();

    expect([elements['a1'].x, elements['a1'].y]).toEqual([320, 420]);
    expect([elements['a2'].x, elements['a2'].y]).toEqual([340, 420]);
  });

  it('no toca asientos de otro sector', () => {
    useVenueStore.getState().updateElement('a2', { sectionId: 'otro' });
    useVenueStore.getState().moveSector('sector-1', 300, 400);

    expect(useVenueStore.getState().elements['a2'].x).toBe(140);
  });

  it('deja un solo paso de historial', () => {
    const antes = useVenueStore.getState().historyIndex;
    useVenueStore.getState().moveSector('sector-1', 300, 400);

    expect(useVenueStore.getState().historyIndex).toBe(antes + 1);
  });
});

describe('transformar un sector', () => {
  it('reescala la posición de los asientos', () => {
    useVenueStore.getState().transformSector('sector-1', {
      x: 100, y: 100, rotation: 0, scaleX: 2, scaleY: 1,
    });

    // a1 estaba 20px a la derecha del origen del sector; al duplicar el ancho, 40.
    expect(useVenueStore.getState().elements['a1'].x).toBeCloseTo(140);
    expect(useVenueStore.getState().elements['a1'].y).toBeCloseTo(120);
  });

  it('rota los asientos alrededor del origen del sector y los orienta', () => {
    useVenueStore.getState().transformSector('sector-1', {
      x: 100, y: 100, rotation: 90, scaleX: 1, scaleY: 1,
    });
    const a1 = useVenueStore.getState().elements['a1'];

    // (20,20) rotado 90° alrededor del origen del sector → (-20,20)
    expect(a1.x).toBeCloseTo(80);
    expect(a1.y).toBeCloseTo(120);
    expect(a1.rotation).toBeCloseTo(90);
  });
});

describe('borrar un sector', () => {
  it('borra también sus asientos', () => {
    // Sin cascada quedaban huérfanos y el serializador los metía en un sector
    // «General» que nadie creó y que el backend después daba de alta.
    useVenueStore.getState().deleteElements(['sector-1']);
    const { elements, elementIds } = useVenueStore.getState();

    expect(elementIds).toEqual([]);
    expect(elements).toEqual({});
  });

  it('borrar un asiento suelto no toca al sector', () => {
    useVenueStore.getState().deleteElements(['a1']);

    expect(useVenueStore.getState().elementIds).toEqual(['sector-1', 'a2']);
  });

  it('deja un solo paso de historial, así deshacer devuelve todo junto', () => {
    const antes = useVenueStore.getState().historyIndex;
    useVenueStore.getState().deleteElements(['sector-1']);

    expect(useVenueStore.getState().historyIndex).toBe(antes + 1);

    useVenueStore.getState().undo();
    expect(useVenueStore.getState().elementIds.length).toBe(3);
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npx vitest run src/lib/store/useVenueStore.test.ts`
Expected: FAIL — `moveSector is not a function`.

- [ ] **Step 3: Crear el ayudante de sector**

Create `src/lib/utils/sector.ts`:

```ts
import { SeatElement, VenueElement } from '../types';

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
```

- [ ] **Step 4: Implementar las acciones del store**

En `src/lib/store/useVenueStore.ts`, agregar el import:

```ts
import { seatsOfSector } from '../utils/sector';
```

En la interfaz `VenueStore`, en la sección de elementos:

```ts
  /** Mueve un sector con todos sus asientos. */
  moveSector: (id: string, x: number, y: number) => void;
  /** Aplica al sector y a sus asientos la misma transformación afín. */
  transformSector: (
    id: string,
    cambio: { x: number; y: number; rotation: number; scaleX: number; scaleY: number }
  ) => void;
```

En el objeto del store, después de `updateElement`:

```ts
  moveSector: (id, x, y) => {
    set((state) => {
      const sector = state.elements[id];
      if (!sector || sector.type === 'seat') return state;
      const dx = x - sector.x;
      const dy = y - sector.y;

      const elements = { ...state.elements, [id]: { ...sector, x, y } };
      for (const asiento of seatsOfSector(state.elements, state.elementIds, id)) {
        elements[asiento.id] = {
          ...asiento,
          x: asiento.x + dx,
          y: asiento.y + dy,
        };
      }
      return { elements };
    });
    get().saveHistory();
  },

  transformSector: (id, cambio) => {
    set((state) => {
      const sector = state.elements[id];
      if (!sector || sector.type === 'seat') return state;

      const dRot = cambio.rotation - sector.rotation;
      const rad = (dRot * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      const elements = {
        ...state.elements,
        [id]: { ...sector, x: cambio.x, y: cambio.y, rotation: cambio.rotation },
      };

      for (const asiento of seatsOfSector(state.elements, state.elementIds, id)) {
        // Posición relativa al origen del sector, escalada y luego rotada.
        const rx = (asiento.x - sector.x) * cambio.scaleX;
        const ry = (asiento.y - sector.y) * cambio.scaleY;
        elements[asiento.id] = {
          ...asiento,
          x: cambio.x + rx * cos - ry * sin,
          y: cambio.y + rx * sin + ry * cos,
          rotation: asiento.rotation + dRot,
        };
      }
      return { elements };
    });
    get().saveHistory();
  },
```

Y reemplazar `deleteElements` por:

```ts
  deleteElements: (ids) => {
    set((state) => {
      // Cascada: un sector se lleva sus asientos. Sin esto quedaban huérfanos y
      // el serializador los agrupaba en un sector «General» inventado.
      const aBorrar = new Set(ids);
      for (const id of state.elementIds) {
        const el = state.elements[id];
        if (el?.type === 'seat' && el.sectionId && aBorrar.has(el.sectionId)) {
          aBorrar.add(id);
        }
      }

      const elements = { ...state.elements };
      aBorrar.forEach((id) => delete elements[id]);
      return {
        elements,
        elementIds: state.elementIds.filter((id) => !aBorrar.has(id)),
        selectedIds: state.selectedIds.filter((id) => !aBorrar.has(id)),
      };
    });
    get().saveHistory();
  },
```

- [ ] **Step 5: Correr el test para verificar que pasa**

Run: `npx vitest run src/lib/store/useVenueStore.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 6: Verificar**

Run: `npm run lint && npm test && npm run build`
Expected: todo en verde.

- [ ] **Step 7: Commit**

```bash
git add src/lib/utils/sector.ts src/lib/store/useVenueStore.ts src/lib/store/useVenueStore.test.ts
git commit -m "fix: el sector y sus asientos se mueven, transforman y borran juntos"
```

---

### Task 7: Cablear el lienzo a las acciones nuevas

Las acciones ya existen; el canvas todavía llama a `updateElement` directo.

**Files:**
- Modify: `src/lib/components/canvas/EditorCanvas.tsx`

**Interfaces:**
- Consumes: `moveSector`, `transformSector` (Task 6)

- [ ] **Step 1: Usar `moveSector` al terminar un arrastre**

En `EditorCanvas.tsx`, agregar `moveSector, transformSector` al destructuring del store y reemplazar `handleDragEnd` por:

```tsx
  /** Mueve un elemento; si es un sector, `moveSector` arrastra sus asientos. */
  const aplicarMovimiento = (id: string, x: number, y: number) => {
    const el = elements[id];
    if (el && el.type !== 'seat') moveSector(id, x, y);
    else updateElement(id, { x, y });
  };

  const handleDragEnd = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const start = dragStart.current;
    if (start && start[id]) {
      const dx = e.target.x() - start[id].x;
      const dy = e.target.y() - start[id].y;
      Object.keys(start).forEach((sid) => {
        aplicarMovimiento(sid, start[sid].x + dx, start[sid].y + dy);
      });
    } else {
      aplicarMovimiento(id, e.target.x(), e.target.y());
    }
    dragStart.current = null;
    setGuias([]);
  };
```

El `useVenueStore.getState().saveHistory()` que había al final de `handleDragEnd` se elimina: `moveSector` ya guarda el suyo, y para el asiento suelto lo guarda `aplicarMovimiento`. (`setGuias` lo agrega la Task 10; hasta entonces, omitir esa línea.)

- [ ] **Step 2: Usar `transformSector` al terminar una transformación**

Reemplazar el final de `handleTransformEnd` — desde `updateElement(id, updates);` hasta `useVenueStore.getState().saveHistory();` — por:

```tsx
    // Los radiales escalan por scaleX en los dos ejes: su geometría es un radio,
    // no un ancho y un alto. Es la misma decisión que toma el bloque de arriba al
    // calcular `radius` y `outerRadius`.
    const esRadial = shape.sectionType === 'circle' || shape.sectionType === 'arc';

    // El orden importa: `transformSector` lee la posición y la rotación ANTERIORES
    // del sector para calcular cuánto moverle los asientos. Si `updateElement`
    // corriera primero, ya las habría pisado y el delta de rotación daría 0.
    transformSector(id, {
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
      scaleX,
      scaleY: esRadial ? scaleX : scaleY,
    });
    updateElement(id, updates);
```

`updateElement` aplica los cambios de forma (ancho, alto, radios, vértices) y `transformSector` mueve los asientos; `transformSector` guarda el historial una sola vez.

- [ ] **Step 3: Verificar a mano**

Run: `npm run dev`
Crear un sector rectangular, generar 5×10 asientos, y después: arrastrar el sector, rotarlo con el manejador de rotación y redimensionarlo.
Expected: en los tres casos las butacas acompañan al sector. `Ctrl+Z` deshace cada operación completa de una sola vez.

- [ ] **Step 4: Verificar**

Run: `npm run lint && npm test && npm run build`
Expected: todo en verde.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/canvas/EditorCanvas.tsx
git commit -m "fix: arrastrar y transformar un sector en el lienzo lleva sus asientos"
```

---

### Task 8: Anclas de redimensión según la forma

**Files:**
- Create: `src/lib/utils/transformer.ts`, `src/lib/utils/transformer.test.ts`
- Modify: `src/lib/components/canvas/EditorCanvas.tsx`

**Interfaces:**
- Produces: `anchorsFor(elements: VenueElement[]): string[]`

- [ ] **Step 1: Escribir el test que falla**

Create `src/lib/utils/transformer.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { anchorsFor } from './transformer';
import type { ShapeElement, VenueElement } from '../types';

/**
 * Antes el transformador exponía solo las cuatro esquinas y Konva mantiene la
 * proporción por omisión: no había forma de achicar una cancha solo a lo ancho.
 * Las formas radiales (círculo, arco) se dimensionan por radio, así que
 * deformarlas en un eje no tiene dónde guardarse en el formato.
 */

const forma = (sectionType: ShapeElement['sectionType']): ShapeElement => ({
  id: `s-${sectionType}`,
  type: 'section',
  name: sectionType,
  x: 0, y: 0, width: 100, height: 100, rotation: 0,
  visible: true, locked: false, opacity: 1, zIndex: 1,
  fill: '#6F3E8F', isActive: true, sectionType,
});

const ESQUINAS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

describe('anclas del transformador', () => {
  it('un rectángulo se puede estirar en un solo eje', () => {
    const anclas = anchorsFor([forma('rectangle')]);

    expect(anclas).toHaveLength(8);
    expect(anclas).toContain('middle-left');
    expect(anclas).toContain('top-center');
  });

  it('un polígono también', () => {
    expect(anchorsFor([forma('polygon')])).toHaveLength(8);
  });

  it('un círculo solo por las esquinas', () => {
    expect(anchorsFor([forma('circle')])).toEqual(ESQUINAS);
  });

  it('un arco solo por las esquinas', () => {
    expect(anchorsFor([forma('arc')])).toEqual(ESQUINAS);
  });

  it('con selección mixta gana la restricción', () => {
    // Si se estirara en un eje, el círculo quedaría sin representación válida.
    expect(anchorsFor([forma('rectangle'), forma('circle')])).toEqual(ESQUINAS);
  });

  it('sin selección devuelve las esquinas', () => {
    expect(anchorsFor([])).toEqual(ESQUINAS);
  });

  it('los asientos no se transforman, no restringen nada', () => {
    const asiento = { id: 'a1', type: 'seat' } as unknown as VenueElement;

    expect(anchorsFor([forma('rectangle'), asiento])).toHaveLength(8);
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npx vitest run src/lib/utils/transformer.test.ts`
Expected: FAIL — no existe `./transformer`.

- [ ] **Step 3: Implementar**

Create `src/lib/utils/transformer.ts`:

```ts
import { ShapeElement, VenueElement } from '../types';

const ESQUINAS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
const ESQUINAS_Y_MEDIOS = [
  'top-left', 'top-center', 'top-right',
  'middle-left', 'middle-right',
  'bottom-left', 'bottom-center', 'bottom-right',
];

/**
 * Anclas que corresponden a una selección.
 *
 * Círculos y arcos se dimensionan por radio: estirarlos en un solo eje daría una
 * elipse, que el formato no sabe representar. Con selección mixta se cae al
 * conjunto más restrictivo.
 */
export const anchorsFor = (elements: VenueElement[]): string[] => {
  const hayRadial = elements.some((el) => {
    if (!el || el.type === 'seat') return false;
    const tipo = (el as ShapeElement).sectionType;
    return tipo === 'circle' || tipo === 'arc';
  });

  const hayDeformable = elements.some((el) => {
    if (!el || el.type === 'seat') return false;
    const tipo = (el as ShapeElement).sectionType;
    return tipo !== 'circle' && tipo !== 'arc';
  });

  return hayRadial || !hayDeformable ? ESQUINAS : ESQUINAS_Y_MEDIOS;
};
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npx vitest run src/lib/utils/transformer.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Usarlo en el lienzo**

En `EditorCanvas.tsx`, agregar el import:

```ts
import { anchorsFor } from '../../utils/transformer';
```

y calcular las anclas de la selección actual, junto a `showLabels`:

```ts
  const anclas = useMemo(
    () => anchorsFor(selectedIds.map((id) => elements[id]).filter(Boolean)),
    [selectedIds, elements]
  );
```

y en el `<Transformer>`, reemplazar la prop `enabledAnchors` y agregar `keepRatio`:

```tsx
          <Transformer
            ref={transformerRef}
            rotateEnabled
            keepRatio={false}
            enabledAnchors={anclas}
```

- [ ] **Step 6: Verificar a mano**

Run: `npm run dev`
Crear un escenario, seleccionarlo y arrastrar el ancla del medio del costado.
Expected: cambia solo el ancho. Con `Shift` mantenido, vuelve a ser proporcional. Seleccionando un sector curvo, las anclas del medio no aparecen.

- [ ] **Step 7: Verificar**

Run: `npm run lint && npm test && npm run build`
Expected: todo en verde.

- [ ] **Step 8: Commit**

```bash
git add src/lib/utils/transformer.ts src/lib/utils/transformer.test.ts src/lib/components/canvas/EditorCanvas.tsx
git commit -m "feat: el escenario y los sectores rectos se redimensionan en un solo eje"
```

---

### Task 9: Interruptores de grilla en la barra

`gridConfig` existe en el store desde siempre y ningún botón lo toca: el imán a grilla está permanentemente encendido y no se puede cambiar el paso.

**Files:**
- Modify: `src/lib/types.ts`, `src/lib/components/Toolbar.tsx`

**Interfaces:**
- Produces: `GridConfig.snapToElements: boolean` (lo consume la Task 10).

- [ ] **Step 1: Ampliar el tipo**

En `src/lib/types.ts`, reemplazar `GridConfig`:

```ts
export interface GridConfig {
  /** Imán a la grilla. */
  enabled: boolean;
  /** Dibujar la grilla. */
  visible: boolean;
  /** Paso de la grilla, en unidades de mundo. */
  size: number;
  /** Imán a bordes y centros de otros sectores. */
  snapToElements: boolean;
}
```

En `src/lib/store/useVenueStore.ts`, en `DEFAULT_GRID`:

```ts
const DEFAULT_GRID: GridConfig = {
  enabled: true,
  visible: true,
  size: 20,
  snapToElements: true,
};
```

- [ ] **Step 2: Agregar los controles a la barra**

En `src/lib/components/Toolbar.tsx`, agregar a los imports de `lucide-react`: `Grid3x3`, `Magnet`. Agregar `gridConfig, setGridConfig` al destructuring del store.

Insertar este grupo entre el de las herramientas de dibujo y el del plano de fondo:

```tsx
        {/* Grilla e imán */}
        <div className="bg-white border border-gray-200 p-1.5 rounded-2xl flex items-center gap-1 shadow-lg">
          <button
            onClick={() => setGridConfig({ visible: !gridConfig.visible })}
            className={`p-2 rounded-xl transition-all ${gridConfig.visible ? 'bg-[#FF6B01]/10 text-[#FF6B01]' : 'text-gray-400 hover:text-[#6F3E8F] hover:bg-purple-50'}`}
            title="Mostrar grilla"
          >
            <Grid3x3 size={16} strokeWidth={3} />
          </button>
          <button
            onClick={() => setGridConfig({ enabled: !gridConfig.enabled })}
            className={`p-2 rounded-xl transition-all ${gridConfig.enabled ? 'bg-[#FF6B01]/10 text-[#FF6B01]' : 'text-gray-400 hover:text-[#6F3E8F] hover:bg-purple-50'}`}
            title="Imán a la grilla"
          >
            <Magnet size={16} strokeWidth={3} />
          </button>
          <select
            value={gridConfig.size}
            onChange={(e) => setGridConfig({ size: parseInt(e.target.value) })}
            className="bg-indigo-50 border border-transparent rounded-xl px-2 py-1.5 text-[10px] font-bold text-gray-600 focus:border-[#FF6B01] outline-none"
            title="Paso de la grilla"
          >
            {[5, 10, 20, 50].map((paso) => (
              <option key={paso} value={paso}>{paso} px</option>
            ))}
          </select>
        </div>
```

- [ ] **Step 3: Que la grilla cubra lo que se ve**

Hoy la grilla son ~500 nodos `Rect` fijos entre 0 y 5000: al panear fuera de ese cuadro desaparece, y al alejar el zoom se dibujan cientos de líneas de menos de un píxel. Se redibuja como una sola figura sobre el viewport visible.

En `src/lib/components/canvas/EditorCanvas.tsx`, agregar `Shape` al import de `react-konva` y reemplazar el bloque `const Grid = useMemo(...)` completo por:

```tsx
  /**
   * Grilla dibujada sobre el rectángulo visible, no sobre un cuadro fijo: antes
   * desaparecía al panear más allá de 5000 y saturaba de líneas al alejarse.
   */
  const Grid = useMemo(() => {
    if (!gridConfig.visible) return null;

    const paso = gridConfig.size;
    // Por debajo de 4 px en pantalla la grilla es ruido: se dibuja cada 5 líneas.
    const pasoEfectivo = paso * viewState.scale < 4 ? paso * 5 : paso;

    return (
      <Shape
        listening={false}
        sceneFunc={(ctx) => {
          const desde = {
            x: -viewState.x / viewState.scale,
            y: -viewState.y / viewState.scale,
          };
          const hasta = {
            x: desde.x + dimensions.width / viewState.scale,
            y: desde.y + dimensions.height / viewState.scale,
          };
          const primeraX = Math.floor(desde.x / pasoEfectivo) * pasoEfectivo;
          const primeraY = Math.floor(desde.y / pasoEfectivo) * pasoEfectivo;

          ctx.setAttr('strokeStyle', '#DCE0E8');
          ctx.setAttr('lineWidth', 1 / viewState.scale);
          ctx.beginPath();
          for (let x = primeraX; x <= hasta.x; x += pasoEfectivo) {
            ctx.moveTo(x, desde.y);
            ctx.lineTo(x, hasta.y);
          }
          for (let y = primeraY; y <= hasta.y; y += pasoEfectivo) {
            ctx.moveTo(desde.x, y);
            ctx.lineTo(hasta.x, y);
          }
          ctx.stroke();
        }}
      />
    );
  }, [gridConfig, viewState, dimensions]);
```

- [ ] **Step 4: Verificar a mano**

Run: `npm run dev`
Expected: la grilla se apaga y se prende; con el imán apagado un sector se arrastra a cualquier posición; cambiar el paso a 50 hace que salte de a 50; **panear muy lejos y alejar el zoom siguen mostrando grilla**, sin que se vuelva una mancha.

- [ ] **Step 5: Verificar**

Run: `npm run lint && npm test && npm run build`
Expected: todo en verde.

- [ ] **Step 6: Commit**

```bash
git add src/lib/types.ts src/lib/store/useVenueStore.ts src/lib/components/Toolbar.tsx src/lib/components/canvas/EditorCanvas.tsx
git commit -m "feat: la grilla se puede regular y cubre siempre lo que se ve"
```

---

### Task 10: Imán entre elementos, con guías

Se rehace la idea de `src/utils/snapping.ts` (borrado en la Task 1) con dos cambios: sin `rbush`, y con el umbral en píxeles de pantalla en vez de unidades de mundo — el original usaba 5 unidades fijas, así que a poco zoom no enganchaba nunca y a mucho zoom agarraba todo.

**Files:**
- Create: `src/lib/utils/snapping.ts`, `src/lib/utils/snapping.test.ts`
- Modify: `src/lib/components/canvas/EditorCanvas.tsx`

**Interfaces:**
- Consumes: `elementBounds` (Task 2), `GridConfig` con `snapToElements` (Task 9)
- Produces:
  - `interface Guide { axis: 'v' | 'h'; pos: number }`
  - `interface SnapResult { x: number; y: number; guides: Guide[] }`
  - `snapPosition(args): SnapResult` con
    `args: { x, y, width, height, excludedIds, elements, elementIds, grid, scale }`

- [ ] **Step 1: Escribir el test que falla**

Create `src/lib/utils/snapping.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { snapPosition } from './snapping';
import type { GridConfig, SeatElement, ShapeElement, VenueElement } from '../types';

/**
 * El imán es lo que hace que dos tribunas queden alineadas sin pelearse con el
 * mouse. Lo que se prueba acá es que enganche donde corresponde y, sobre todo,
 * que NO enganche donde molesta: los asientos son miles y si fueran candidatos
 * arrastrar cualquier cosa sería imposible.
 */

const sector = (id: string, x: number, y: number): ShapeElement => ({
  id,
  type: 'section',
  name: id,
  x, y, width: 100, height: 100, rotation: 0,
  visible: true, locked: false, opacity: 1, zIndex: 1,
  fill: '#6F3E8F', isActive: true, sectionType: 'rectangle',
});

const asiento = (id: string, x: number, y: number): SeatElement => ({
  id, type: 'seat', name: id, x, y, rotation: 0,
  visible: true, locked: false, opacity: 1, zIndex: 10,
  sectionId: 's1', row: 'A', number: '1', status: 'available', radius: 5,
});

const grilla = (extra: Partial<GridConfig> = {}): GridConfig => ({
  enabled: false, visible: true, size: 20, snapToElements: true, ...extra,
});

const escena = (...els: VenueElement[]) => ({
  elements: Object.fromEntries(els.map(e => [e.id, e])) as Record<string, VenueElement>,
  elementIds: els.map(e => e.id),
});

describe('imán entre elementos', () => {
  it('engancha el borde izquierdo con el de otro sector', () => {
    const { elements, elementIds } = escena(sector('s1', 200, 0));

    const r = snapPosition({
      x: 197, y: 500, width: 100, height: 100,
      excludedIds: [], elements, elementIds, grid: grilla(), scale: 1,
    });

    expect(r.x).toBe(200);
    expect(r.guides).toContainEqual({ axis: 'v', pos: 200 });
  });

  it('engancha centro con centro', () => {
    const { elements, elementIds } = escena(sector('s1', 200, 0));

    const r = snapPosition({
      x: 202, y: 500, width: 100, height: 100,
      excludedIds: [], elements, elementIds, grid: grilla(), scale: 1,
    });

    expect(r.x).toBe(200);
  });

  it('no engancha si está lejos', () => {
    const { elements, elementIds } = escena(sector('s1', 200, 0));

    const r = snapPosition({
      x: 40, y: 500, width: 100, height: 100,
      excludedIds: [], elements, elementIds, grid: grilla(), scale: 1,
    });

    expect(r.x).toBe(40);
    expect(r.guides).toEqual([]);
  });

  it('el umbral se mide en pantalla, no en mundo', () => {
    // A la mitad de zoom, 6 unidades de mundo son 3 píxeles: sigue enganchando.
    const { elements, elementIds } = escena(sector('s1', 200, 0));

    const cerca = snapPosition({
      x: 194, y: 500, width: 100, height: 100,
      excludedIds: [], elements, elementIds, grid: grilla(), scale: 0.5,
    });
    const lejos = snapPosition({
      x: 194, y: 500, width: 100, height: 100,
      excludedIds: [], elements, elementIds, grid: grilla(), scale: 4,
    });

    expect(cerca.x).toBe(200);
    expect(lejos.x).toBe(194);
  });

  it('los asientos no son candidatos', () => {
    // Son miles: si engancharan, arrastrar sería imposible.
    const { elements, elementIds } = escena(asiento('a1', 200, 500));

    const r = snapPosition({
      x: 198, y: 498, width: 10, height: 10,
      excludedIds: [], elements, elementIds, grid: grilla(), scale: 1,
    });

    expect(r.x).toBe(198);
  });

  it('un elemento no se engancha consigo mismo', () => {
    const { elements, elementIds } = escena(sector('s1', 200, 0));

    const r = snapPosition({
      x: 198, y: 0, width: 100, height: 100,
      excludedIds: ['s1'], elements, elementIds, grid: grilla(), scale: 1,
    });

    expect(r.x).toBe(198);
  });

  it('apagado, no engancha con nada', () => {
    const { elements, elementIds } = escena(sector('s1', 200, 0));

    const r = snapPosition({
      x: 198, y: 0, width: 100, height: 100,
      excludedIds: [], elements, elementIds,
      grid: grilla({ snapToElements: false }), scale: 1,
    });

    expect(r.x).toBe(198);
  });

  it('con imán a grilla encendido redondea al paso', () => {
    const { elements, elementIds } = escena();

    const r = snapPosition({
      x: 47, y: 92, width: 10, height: 10,
      excludedIds: [], elements, elementIds,
      grid: grilla({ enabled: true, snapToElements: false, size: 20 }), scale: 1,
    });

    expect([r.x, r.y]).toEqual([40, 100]);
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npx vitest run src/lib/utils/snapping.test.ts`
Expected: FAIL — no existe `./snapping`.

- [ ] **Step 3: Implementar**

Create `src/lib/utils/snapping.ts`:

```ts
import { GridConfig, ShapeElement, VenueElement } from '../types';
import { elementBounds } from './bounds';

export interface Guide {
  axis: 'v' | 'h';
  pos: number;
}

export interface SnapResult {
  x: number;
  y: number;
  guides: Guide[];
}

export interface SnapArgs {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Ids que no cuentan como candidatos (lo que se está arrastrando). */
  excludedIds: string[];
  elements: Record<string, VenueElement>;
  elementIds: string[];
  grid: GridConfig;
  /** Escala del lienzo, para medir el umbral en píxeles de pantalla. */
  scale: number;
}

/** Distancia de enganche, en píxeles de pantalla. */
const UMBRAL_PX = 6;

/**
 * Ajusta una posición al imán de grilla y al de otros sectores.
 *
 * Candidatos: solo sectores y escenarios. Los asientos quedan afuera a propósito
 * — son miles y engancharían con todo. Con menos de cien candidatos en un recinto
 * real, un barrido lineal alcanza y evita mantener un índice espacial.
 */
export const snapPosition = ({
  x, y, width, height, excludedIds, elements, elementIds, grid, scale,
}: SnapArgs): SnapResult => {
  let snappedX = x;
  let snappedY = y;
  const guides: Guide[] = [];

  if (grid.enabled) {
    snappedX = Math.round(x / grid.size) * grid.size;
    snappedY = Math.round(y / grid.size) * grid.size;
  }

  if (!grid.snapToElements) return { x: snappedX, y: snappedY, guides };

  const umbral = UMBRAL_PX / (scale || 1);
  const excluidos = new Set(excludedIds);

  // Bordes y centro de lo que se arrastra.
  const misX = [x, x + width / 2, x + width];
  const misY = [y, y + height / 2, y + height];

  for (const id of elementIds) {
    const el = elements[id];
    if (!el || excluidos.has(id)) continue;
    if (el.type === 'seat') continue;
    if ((el as ShapeElement).locked) continue;

    const caja = elementBounds(el);
    const objetivosX = [caja.minX, (caja.minX + caja.maxX) / 2, caja.maxX];
    const objetivosY = [caja.minY, (caja.minY + caja.maxY) / 2, caja.maxY];

    for (const objetivo of objetivosX) {
      for (const mio of misX) {
        if (Math.abs(mio - objetivo) <= umbral) {
          snappedX = objetivo - (mio - x);
          guides.push({ axis: 'v', pos: objetivo });
        }
      }
    }

    for (const objetivo of objetivosY) {
      for (const mio of misY) {
        if (Math.abs(mio - objetivo) <= umbral) {
          snappedY = objetivo - (mio - y);
          guides.push({ axis: 'h', pos: objetivo });
        }
      }
    }
  }

  return { x: snappedX, y: snappedY, guides };
};
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npx vitest run src/lib/utils/snapping.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Usarlo en el arrastre y dibujar las guías**

En `EditorCanvas.tsx`:

Importar y agregar estado para las guías:

```ts
import { snapPosition, type Guide } from '../../utils/snapping';
```

```ts
  const [guias, setGuias] = useState<Guide[]>([]);
```

Reemplazar `handleGridSnap` por:

```tsx
  /** Aplica el imán durante el arrastre. Con Alt se ignora. */
  const aplicarIman = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    if (e.evt.altKey) {
      setGuias([]);
      return;
    }
    const el = elements[id];
    if (!el) return;
    const caja = elementBounds(el);
    const r = snapPosition({
      x: e.target.x(),
      y: e.target.y(),
      width: caja.maxX - caja.minX,
      height: caja.maxY - caja.minY,
      excludedIds: selectedIds.length > 1 ? selectedIds : [id],
      elements,
      elementIds,
      grid: gridConfig,
      scale: viewState.scale,
    });
    e.target.x(r.x);
    e.target.y(r.y);
    setGuias(r.guides);
  };
```

(agregar `import { elementBounds } from '../../utils/bounds';`)

En `handleDragMove`, cambiar `handleGridSnap(e);` por `aplicarIman(id, e);`, y en `handleDragEnd` agregar `setGuias([]);` al final.

Dibujar las guías dentro del `<Layer>`, justo antes del borrador de polígono:

```tsx
          {guias.map((g, i) => (
            <Line
              key={`guia-${i}`}
              points={g.axis === 'v'
                ? [g.pos, -10000, g.pos, 10000]
                : [-10000, g.pos, 10000, g.pos]}
              stroke="#FF6B01"
              strokeWidth={1 / viewState.scale}
              dash={[4 / viewState.scale, 4 / viewState.scale]}
              listening={false}
            />
          ))}
```

- [ ] **Step 6: Verificar a mano**

Run: `npm run dev`
Crear dos sectores y arrastrar uno cerca del borde del otro.
Expected: engancha y aparece una guía naranja punteada; manteniendo `Alt` no engancha; con el imán apagado en la barra tampoco.

- [ ] **Step 7: Verificar**

Run: `npm run lint && npm test && npm run build`
Expected: todo en verde.

- [ ] **Step 8: Commit**

```bash
git add src/lib/utils/snapping.ts src/lib/utils/snapping.test.ts src/lib/components/canvas/EditorCanvas.tsx
git commit -m "feat: iman a bordes y centros de otros sectores, con guias"
```

---

### Task 11: Alinear y distribuir

**Files:**
- Create: `src/lib/utils/align.ts`, `src/lib/utils/align.test.ts`, `src/lib/components/AlignBar.tsx`
- Modify: `src/lib/store/useVenueStore.ts`, `src/lib/VenueEditor.tsx`

**Interfaces:**
- Consumes: `elementBounds` (Task 2), `moveSector` (Task 6)
- Produces:
  - `type AlignMode = 'left' | 'center-x' | 'right' | 'top' | 'center-y' | 'bottom'`
  - `type DistributeAxis = 'x' | 'y'`
  - `alignElements(elements, ids, mode): Record<string, { x: number; y: number }>`
  - `distributeElements(elements, ids, axis): Record<string, { x: number; y: number }>`
  - En el store: `alignSelection(mode)`, `distributeSelection(axis)`

- [ ] **Step 1: Escribir el test que falla**

Create `src/lib/utils/align.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { alignElements, distributeElements } from './align';
import type { ShapeElement, VenueElement } from '../types';

const sector = (id: string, x: number, y: number, w = 100, h = 50): ShapeElement => ({
  id, type: 'section', name: id,
  x, y, width: w, height: h, rotation: 0,
  visible: true, locked: false, opacity: 1, zIndex: 1,
  fill: '#6F3E8F', isActive: true, sectionType: 'rectangle',
});

const escena = (...els: VenueElement[]) =>
  Object.fromEntries(els.map(e => [e.id, e])) as Record<string, VenueElement>;

describe('alinear', () => {
  it('a la izquierda lleva todo al menor x', () => {
    const elements = escena(sector('a', 10, 0), sector('b', 50, 0), sector('c', 90, 0));

    const r = alignElements(elements, ['a', 'b', 'c'], 'left');

    expect([r['a'].x, r['b'].x, r['c'].x]).toEqual([10, 10, 10]);
  });

  it('a la derecha alinea los bordes derechos, no los orígenes', () => {
    const elements = escena(sector('a', 0, 0, 100), sector('b', 0, 0, 40));

    const r = alignElements(elements, ['a', 'b'], 'right');

    expect(r['b'].x).toBe(60);
  });

  it('al centro horizontal usa el centro de la selección', () => {
    const elements = escena(sector('a', 0, 0, 100), sector('b', 200, 0, 100));

    const r = alignElements(elements, ['a', 'b'], 'center-x');

    // Centro de la selección: (0 + 300) / 2 = 150 → cada uno arranca en 100.
    expect([r['a'].x, r['b'].x]).toEqual([100, 100]);
  });

  it('arriba y abajo funcionan sobre el eje y', () => {
    const elements = escena(sector('a', 0, 10, 100, 50), sector('b', 0, 90, 100, 30));

    expect(alignElements(elements, ['a', 'b'], 'top')['b'].y).toBe(10);
    expect(alignElements(elements, ['a', 'b'], 'bottom')['b'].y).toBe(30);
  });

  it('no mueve elementos bloqueados', () => {
    const elements = escena(sector('a', 10, 0), { ...sector('b', 50, 0), locked: true });

    expect(alignElements(elements, ['a', 'b'], 'left')['b']).toBeUndefined();
  });

  it('con un solo elemento no hay nada que alinear', () => {
    expect(alignElements(escena(sector('a', 10, 0)), ['a'], 'left')).toEqual({});
  });
});

describe('distribuir', () => {
  it('deja huecos iguales entre los elementos del medio', () => {
    const elements = escena(sector('a', 0, 0, 100), sector('b', 120, 0, 100), sector('c', 400, 0, 100));

    const r = distributeElements(elements, ['a', 'b', 'c'], 'x');

    // Extremos quietos; el del medio queda con el mismo hueco a cada lado.
    expect(r['a']).toBeUndefined();
    expect(r['c']).toBeUndefined();
    expect(r['b'].x).toBe(150);
  });

  it('con menos de tres no hay nada que distribuir', () => {
    const elements = escena(sector('a', 0, 0), sector('b', 200, 0));

    expect(distributeElements(elements, ['a', 'b'], 'x')).toEqual({});
  });

  it('en vertical usa el eje y', () => {
    const elements = escena(sector('a', 0, 0, 100, 50), sector('b', 0, 60, 100, 50), sector('c', 0, 300, 100, 50));

    expect(distributeElements(elements, ['a', 'b', 'c'], 'y')['b'].y).toBe(150);
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npx vitest run src/lib/utils/align.test.ts`
Expected: FAIL — no existe `./align`.

- [ ] **Step 3: Implementar**

Create `src/lib/utils/align.ts`:

```ts
import { VenueElement } from '../types';
import { elementBounds } from './bounds';

export type AlignMode = 'left' | 'center-x' | 'right' | 'top' | 'center-y' | 'bottom';
export type DistributeAxis = 'x' | 'y';

/** Posiciones nuevas por id. Solo incluye lo que efectivamente se mueve. */
export type Movimientos = Record<string, { x: number; y: number }>;

const movibles = (elements: Record<string, VenueElement>, ids: string[]) =>
  ids.map((id) => elements[id]).filter((el): el is VenueElement => !!el && !el.locked);

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
  const seleccion = movibles(elements, ids);
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
  const seleccion = movibles(elements, ids);
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
  const hueco = (fin - inicio - ocupado) / (cajas.length - 1);

  const movimientos: Movimientos = {};
  let cursor = inicio + tamano(cajas[0]) + hueco;

  for (let i = 1; i < cajas.length - 1; i++) {
    const { el, caja } = cajas[i];
    const actual = axis === 'x' ? caja.minX : caja.minY;
    const delta = cursor - actual;
    movimientos[el.id] = {
      x: axis === 'x' ? el.x + delta : el.x,
      y: axis === 'y' ? el.y + delta : el.y,
    };
    cursor += tamano(cajas[i]) + hueco;
  }

  return movimientos;
};
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npx vitest run src/lib/utils/align.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 5: Acciones en el store**

En `src/lib/store/useVenueStore.ts`, importar:

```ts
import { alignElements, distributeElements, type AlignMode, type DistributeAxis, type Movimientos } from '../utils/align';
```

Agregar a la interfaz:

```ts
  alignSelection: (mode: AlignMode) => void;
  distributeSelection: (axis: DistributeAxis) => void;
```

e implementar (reusando `moveSector` para que los asientos acompañen):

```ts
  alignSelection: (mode) => {
    const { elements, elementIds, selectedIds } = get();
    aplicarMovimientos(get, alignElements(elements, selectedIds, mode), elements, elementIds);
  },

  distributeSelection: (axis) => {
    const { elements, elementIds, selectedIds } = get();
    aplicarMovimientos(get, distributeElements(elements, selectedIds, axis), elements, elementIds);
  },
```

y arriba del `create(...)`, la función auxiliar:

```ts
/**
 * Aplica un conjunto de movimientos en un solo paso de historial.
 * Los sectores se mueven con seatsOfSector para que sus asientos acompañen.
 *
 * `guardarHistorial` en false lo usa el empuje con flechas, que agrupa el paso
 * cuando el usuario suelta la tecla: si no, mantener una flecha apretada llenaría
 * los 50 lugares del historial y borraría todo lo anterior.
 */
const aplicarMovimientos = (
  get: () => VenueStore,
  movimientos: Movimientos,
  elements: Record<string, VenueElement>,
  elementIds: string[],
  guardarHistorial = true
) => {
  const ids = Object.keys(movimientos);
  if (ids.length === 0) return;

  const nuevos = { ...elements };
  for (const id of ids) {
    const el = nuevos[id];
    if (!el) continue;
    const dx = movimientos[id].x - el.x;
    const dy = movimientos[id].y - el.y;
    nuevos[id] = { ...el, x: movimientos[id].x, y: movimientos[id].y };
    if (el.type !== 'seat') {
      for (const asiento of seatsOfSector(elements, elementIds, id)) {
        nuevos[asiento.id] = { ...asiento, x: asiento.x + dx, y: asiento.y + dy };
      }
    }
  }

  useVenueStore.setState({ elements: nuevos });
  if (guardarHistorial) get().saveHistory();
};
```

- [ ] **Step 6: La barra**

Create `src/lib/components/AlignBar.tsx`:

```tsx
import React from 'react';
import {
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
} from 'lucide-react';
import { useVenueStore } from '../store/useVenueStore';
import type { AlignMode, DistributeAxis } from '../utils/align';

/** Aparece solo con dos o más elementos seleccionados. */
export const AlignBar: React.FC = () => {
  const { selectedIds, alignSelection, distributeSelection } = useVenueStore();
  if (selectedIds.length < 2) return null;

  const boton = 'p-2 text-gray-400 hover:text-[#6F3E8F] hover:bg-purple-50 rounded-xl transition-colors disabled:opacity-20';

  const alinear: { mode: AlignMode; icono: React.ReactNode; titulo: string }[] = [
    { mode: 'left', icono: <AlignStartVertical size={16} strokeWidth={3} />, titulo: 'Alinear a la izquierda' },
    { mode: 'center-x', icono: <AlignCenterVertical size={16} strokeWidth={3} />, titulo: 'Centrar horizontalmente' },
    { mode: 'right', icono: <AlignEndVertical size={16} strokeWidth={3} />, titulo: 'Alinear a la derecha' },
    { mode: 'top', icono: <AlignStartHorizontal size={16} strokeWidth={3} />, titulo: 'Alinear arriba' },
    { mode: 'center-y', icono: <AlignCenterHorizontal size={16} strokeWidth={3} />, titulo: 'Centrar verticalmente' },
    { mode: 'bottom', icono: <AlignEndHorizontal size={16} strokeWidth={3} />, titulo: 'Alinear abajo' },
  ];

  const distribuir: { axis: DistributeAxis; icono: React.ReactNode; titulo: string }[] = [
    { axis: 'x', icono: <AlignHorizontalJustifyCenter size={16} strokeWidth={3} />, titulo: 'Distribuir en horizontal' },
    { axis: 'y', icono: <AlignVerticalJustifyCenter size={16} strokeWidth={3} />, titulo: 'Distribuir en vertical' },
  ];

  return (
    <div className="absolute left-6 top-1/2 -translate-y-1/2 z-[95] bg-white border border-gray-200 p-1.5 rounded-2xl shadow-lg flex flex-col gap-1">
      {alinear.map((a) => (
        <button key={a.mode} onClick={() => alignSelection(a.mode)} className={boton} title={a.titulo}>
          {a.icono}
        </button>
      ))}
      <div className="h-px w-5 bg-gray-200 mx-auto my-0.5" />
      {distribuir.map((d) => (
        <button
          key={d.axis}
          onClick={() => distributeSelection(d.axis)}
          disabled={selectedIds.length < 3}
          className={boton}
          title={`${d.titulo} (3 o más)`}
        >
          {d.icono}
        </button>
      ))}
    </div>
  );
};
```

En `src/lib/VenueEditor.tsx`, importar `AlignBar` y montarla dentro del `<main>`, después de `<EditorCanvas />`:

```tsx
        <AlignBar />
```

- [ ] **Step 7: Verificar a mano**

Run: `npm run dev`
Crear tres sectores desparejos, seleccionarlos con la goma de selección y probar alinear a la izquierda y distribuir en horizontal.
Expected: la barra aparece al costado con dos o más seleccionados; distribuir se habilita recién con tres; los asientos de cada sector acompañan.

- [ ] **Step 8: Verificar**

Run: `npm run lint && npm test && npm run build`
Expected: todo en verde.

- [ ] **Step 9: Commit**

```bash
git add src/lib/utils/align.ts src/lib/utils/align.test.ts src/lib/components/AlignBar.tsx src/lib/store/useVenueStore.ts src/lib/VenueEditor.tsx
git commit -m "feat: alinear y distribuir la seleccion"
```

---

### Task 12: Duplicar y espejar un sector con sus asientos

**Files:**
- Create: `src/lib/utils/duplicate.ts`, `src/lib/utils/duplicate.test.ts`
- Modify: `src/lib/store/useVenueStore.ts`, `src/lib/components/Toolbar.tsx`

**Interfaces:**
- Consumes: `centerOf` (Task 2), `seatsOfSector` (Task 6)
- Produces:
  - `type MirrorAxis = 'horizontal' | 'vertical' | null`
  - `duplicateSectors(elements, elementIds, sectorIds, options): VenueElement[]` con
    `options: { dx: number; dy: number; mirror: MirrorAxis; newId?: () => string }`
  - En el store: `duplicateSectors(sectorIds, options)` que agrega los elementos y los deja seleccionados.

- [ ] **Step 1: Escribir el test que falla**

Create `src/lib/utils/duplicate.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { duplicateSectors } from './duplicate';
import type { SeatElement, ShapeElement, VenueElement } from '../types';

/**
 * Duplicar una tribuna es la operación que más tiempo ahorra en un estadio, y la
 * que más fácil corrompe datos: si el duplicado reusara los ids del original,
 * dos butacas distintas responderían al mismo QR.
 */

const sector = (extra: Partial<ShapeElement> = {}): ShapeElement => ({
  id: 'sector-norte',
  type: 'section',
  name: 'Norte',
  x: 100, y: 100, width: 200, height: 100, rotation: 0,
  visible: true, locked: false, opacity: 0.2, zIndex: 5,
  fill: '#6F3E8F', isActive: true, sectionType: 'rectangle',
  generation: { rows: 1, cols: 4, seatRadius: 5, startRow: 'A', startNum: 1, numberDirection: 'ltr' },
  ...extra,
});

const asiento = (id: string, x: number, numero: string): SeatElement => ({
  id, type: 'seat', name: `A${numero}`, x, y: 150, rotation: 0,
  visible: true, locked: false, opacity: 1, zIndex: 10,
  sectionId: 'sector-norte', row: 'A', number: numero,
  status: 'available', radius: 5,
});

const escena = (s: ShapeElement, asientos: SeatElement[]) => ({
  elements: Object.fromEntries([[s.id, s], ...asientos.map(a => [a.id, a])]) as Record<string, VenueElement>,
  elementIds: [s.id, ...asientos.map(a => a.id)],
});

const fila = [asiento('a1', 120, '1'), asiento('a2', 160, '2'), asiento('a3', 200, '3'), asiento('a4', 240, '4')];
const ids = { newId: (() => { let n = 0; return () => `x${++n}`; })() };

describe('duplicar un sector', () => {
  it('crea ids nuevos para el sector y para cada asiento', () => {
    // Reusar un id mandaría dos butacas al mismo QR.
    const { elements, elementIds } = escena(sector(), fila);

    const nuevos = duplicateSectors(elements, elementIds, ['sector-norte'], {
      dx: 0, dy: 300, mirror: null, newId: () => 'sur',
    });

    for (const el of nuevos) {
      expect(elementIds).not.toContain(el.id);
    }
  });

  it('los asientos del duplicado apuntan al sector duplicado', () => {
    const { elements, elementIds } = escena(sector(), fila);

    const nuevos = duplicateSectors(elements, elementIds, ['sector-norte'], {
      dx: 0, dy: 300, mirror: null, newId: () => 'sur',
    });
    const nuevoSector = nuevos.find(e => e.type !== 'seat')!;
    const nuevosAsientos = nuevos.filter((e): e is SeatElement => e.type === 'seat');

    expect(nuevosAsientos).toHaveLength(4);
    for (const a of nuevosAsientos) {
      expect(a.sectionId).toBe(nuevoSector.id);
    }
  });

  it('desplaza sector y asientos por igual', () => {
    const { elements, elementIds } = escena(sector(), fila);

    const nuevos = duplicateSectors(elements, elementIds, ['sector-norte'], {
      dx: 20, dy: 300, mirror: null, newId: () => 'sur',
    });

    expect(nuevos.find(e => e.type !== 'seat')!.y).toBe(400);
    expect(nuevos.filter(e => e.type === 'seat').map(e => e.y)).toEqual([450, 450, 450, 450]);
  });

  it('conserva fila y número: la numeración es local a la tribuna', () => {
    const { elements, elementIds } = escena(sector(), fila);

    const nuevos = duplicateSectors(elements, elementIds, ['sector-norte'], {
      dx: 0, dy: 300, mirror: null, newId: () => 'sur',
    });

    expect((nuevos.filter(e => e.type === 'seat') as SeatElement[]).map(a => a.number))
      .toEqual(['1', '2', '3', '4']);
  });

  it('copia los parámetros de generación', () => {
    const { elements, elementIds } = escena(sector(), fila);

    const [nuevo] = duplicateSectors(elements, elementIds, ['sector-norte'], {
      dx: 0, dy: 300, mirror: null, newId: () => 'sur',
    }) as ShapeElement[];

    expect(nuevo.generation).toEqual(sector().generation);
  });
});

describe('espejar', () => {
  it('refleja las posiciones alrededor del centro del sector', () => {
    const { elements, elementIds } = escena(sector(), fila);

    const nuevos = duplicateSectors(elements, elementIds, ['sector-norte'], {
      dx: 0, dy: 0, mirror: 'horizontal', newId: () => 'sur',
    });
    const xs = (nuevos.filter(e => e.type === 'seat') as SeatElement[]).map(a => a.x).sort((a, b) => a - b);

    // Centro del sector: 100 + 200/2 = 200. El de 120 va a 280 y viceversa.
    expect(xs).toEqual([120, 160, 200, 240]);
  });

  it('renumera para que la fila siga ascendiendo hacia la derecha', () => {
    // Reflejar sin renumerar deja la fila leyéndose 4,3,2,1 en pantalla.
    const { elements, elementIds } = escena(sector(), fila);

    const nuevos = duplicateSectors(elements, elementIds, ['sector-norte'], {
      dx: 0, dy: 0, mirror: 'horizontal', newId: () => 'sur',
    });
    const porX = (nuevos.filter(e => e.type === 'seat') as SeatElement[]).sort((a, b) => a.x - b.x);

    expect(porX.map(a => a.number)).toEqual(['1', '2', '3', '4']);
  });

  it('refleja los vértices de un polígono', () => {
    const poligono = sector({ sectionType: 'polygon', points: [0, 0, 200, 0, 200, 100] });
    const { elements, elementIds } = escena(poligono, []);

    const [nuevo] = duplicateSectors(elements, elementIds, ['sector-norte'], {
      dx: 0, dy: 0, mirror: 'horizontal', newId: () => 'sur',
    }) as ShapeElement[];

    expect(nuevo.points).toEqual([200, 0, 0, 0, 0, 100]);
  });

  it('refleja los ángulos de un arco', () => {
    // Asimétrico a propósito: con un arco simétrico el espejo y no hacer nada dan
    // el mismo resultado, y la prueba no probaría nada.
    const arco = sector({ sectionType: 'arc', innerRadius: 100, outerRadius: 200, startAngle: 200, endAngle: 300 });
    const { elements, elementIds } = escena(arco, []);

    const [nuevo] = duplicateSectors(elements, elementIds, ['sector-norte'], {
      dx: 0, dy: 0, mirror: 'horizontal', newId: () => 'sur',
    }) as ShapeElement[];

    // Espejo horizontal: θ → 180 − θ, y el final pasa a ser el inicial.
    expect(nuevo.startAngle).toBeCloseTo(240);
    expect(nuevo.endAngle).toBeCloseTo(340);
  });

  it('el espejo conserva la amplitud del arco', () => {
    const arco = sector({ sectionType: 'arc', startAngle: 200, endAngle: 300 });
    const { elements, elementIds } = escena(arco, []);

    const [nuevo] = duplicateSectors(elements, elementIds, ['sector-norte'], {
      dx: 0, dy: 0, mirror: 'vertical', newId: () => 'sur',
    }) as ShapeElement[];

    expect(nuevo.endAngle! - nuevo.startAngle!).toBeCloseTo(100);
  });

  it('el espejo vertical invierte la orientación de las butacas', () => {
    const conRotacion = [{ ...asiento('a1', 120, '1'), rotation: 30 }];
    const { elements, elementIds } = escena(sector(), conRotacion);

    const nuevos = duplicateSectors(elements, elementIds, ['sector-norte'], {
      dx: 0, dy: 0, mirror: 'vertical', newId: () => 'sur',
    });

    expect((nuevos.find(e => e.type === 'seat') as SeatElement).rotation).toBeCloseTo(330);
  });
});

describe('varios sectores a la vez', () => {
  it('duplica cada uno con sus propios ids', () => {
    const otro = sector({ id: 'sector-este', name: 'Este', x: 500 });
    const { elements, elementIds } = escena(sector(), fila);
    elements['sector-este'] = otro;
    elementIds.push('sector-este');

    const nuevos = duplicateSectors(elements, elementIds, ['sector-norte', 'sector-este'], {
      dx: 0, dy: 300, mirror: null, ...ids,
    });
    const sectores = nuevos.filter(e => e.type !== 'seat');

    expect(sectores).toHaveLength(2);
    expect(new Set(nuevos.map(e => e.id)).size).toBe(nuevos.length);
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npx vitest run src/lib/utils/duplicate.test.ts`
Expected: FAIL — no existe `./duplicate`.

- [ ] **Step 3: Implementar**

Create `src/lib/utils/duplicate.ts`:

```ts
import { SeatElement, ShapeElement, VenueElement } from '../types';
import { centerOf } from './bounds';
import { seatsOfSector } from './sector';

export type MirrorAxis = 'horizontal' | 'vertical' | null;

export interface DuplicateOptions {
  dx: number;
  dy: number;
  mirror: MirrorAxis;
  /** Sufijo único. Inyectable para que los tests sean deterministas. */
  newId?: () => string;
}

const sufijoPorDefecto = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/** Normaliza un ángulo a [0, 360). */
const normalizar = (grados: number) => ((grados % 360) + 360) % 360;

/**
 * Duplica sectores enteros, con sus asientos.
 *
 * Siempre genera ids nuevos: los del original son los que están impresos en los
 * QR de las butacas, y reusarlos mandaría dos asientos distintos al mismo pedido.
 *
 * Al espejar se refleja la geometría (posiciones, vértices, ángulos, orientación
 * de cada butaca) y después se renumera cada fila para que ascienda en la misma
 * dirección visual que en el original — reflejar sin renumerar deja la fila
 * leyéndose al revés.
 */
export const duplicateSectors = (
  elements: Record<string, VenueElement>,
  elementIds: string[],
  sectorIds: string[],
  { dx, dy, mirror, newId = sufijoPorDefecto }: DuplicateOptions
): VenueElement[] => {
  const salida: VenueElement[] = [];

  for (const sectorId of sectorIds) {
    const original = elements[sectorId];
    if (!original || original.type === 'seat') continue;

    const sector = original as ShapeElement;
    const centro = centerOf(sector);
    const nuevoSectorId = `${sector.sectionType}-${newId()}`;

    const reflejarX = (x: number) => (mirror === 'horizontal' ? 2 * centro.x - x : x);
    const reflejarY = (y: number) => (mirror === 'vertical' ? 2 * centro.y - y : y);

    // ── El sector ──
    const nuevoSector: ShapeElement = {
      ...sector,
      id: nuevoSectorId,
      name: `${sector.name} (copia)`,
      x: sector.x + dx,
      y: sector.y + dy,
    };

    if (mirror && sector.sectionType === 'polygon' && sector.points) {
      nuevoSector.points = sector.points.map((valor, i) =>
        i % 2 === 0
          ? mirror === 'horizontal' ? sector.width - valor : valor
          : mirror === 'vertical' ? sector.height - valor : valor
      );
    }

    if (mirror && sector.sectionType === 'arc') {
      const inicio = sector.startAngle ?? 0;
      const fin = sector.endAngle ?? 0;
      // Reflejar invierte el sentido: el ángulo final pasa a ser el inicial.
      const a = mirror === 'horizontal' ? 180 - fin : -fin;
      const b = mirror === 'horizontal' ? 180 - inicio : -inicio;
      const inicioNuevo = normalizar(a);
      nuevoSector.startAngle = inicioNuevo;
      nuevoSector.endAngle = inicioNuevo + (b - a);
    }

    salida.push(nuevoSector);

    // ── Los asientos ──
    const asientos = seatsOfSector(elements, elementIds, sectorId);
    const nuevos: SeatElement[] = asientos.map((asiento) => ({
      ...asiento,
      id: `seat-${nuevoSectorId}-${asiento.row}-${asiento.number}`,
      sectionId: nuevoSectorId,
      x: reflejarX(asiento.x) + dx,
      y: reflejarY(asiento.y) + dy,
      rotation: mirror
        ? normalizar(mirror === 'horizontal' ? 180 - asiento.rotation : -asiento.rotation)
        : asiento.rotation,
    }));

    if (mirror) renumerarFilas(asientos, nuevos, mirror);

    salida.push(...nuevos);
  }

  return salida;
};

/**
 * Devuelve a cada fila la dirección de numeración que tenía en pantalla.
 *
 * Se toman los números de la fila original ordenados por su posición, y se
 * reparten sobre los asientos espejados ordenados por su posición nueva.
 */
const renumerarFilas = (
  originales: SeatElement[],
  espejados: SeatElement[],
  mirror: Exclude<MirrorAxis, null>
) => {
  const eje = mirror === 'horizontal' ? 'x' : 'y';
  const porFila = new Map<string, number[]>();

  for (const fila of new Set(originales.map((a) => a.row))) {
    const numeros = originales
      .filter((a) => a.row === fila)
      .sort((a, b) => a[eje] - b[eje])
      .map((a) => a.number);
    porFila.set(fila, numeros as unknown as number[]);
  }

  for (const fila of porFila.keys()) {
    const numeros = porFila.get(fila) as unknown as string[];
    espejados
      .filter((a) => a.row === fila)
      .sort((a, b) => a[eje] - b[eje])
      .forEach((asiento, i) => {
        asiento.number = numeros[i];
        asiento.name = `${asiento.row}${numeros[i]}`;
        asiento.id = `seat-${asiento.sectionId}-${asiento.row}-${numeros[i]}`;
      });
  }
};
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npx vitest run src/lib/utils/duplicate.test.ts`
Expected: PASS, 12 tests.

- [ ] **Step 5: Acción del store**

En `src/lib/store/useVenueStore.ts`, importar:

```ts
import { duplicateSectors as calcularDuplicados, type DuplicateOptions } from '../utils/duplicate';
```

Agregar a la interfaz:

```ts
  /** Duplica los sectores indicados (con sus asientos) y los deja seleccionados. */
  duplicateSectors: (sectorIds: string[], options: DuplicateOptions) => void;
```

e implementar:

```ts
  duplicateSectors: (sectorIds, options) => {
    const { elements, elementIds } = get();
    const nuevos = calcularDuplicados(elements, elementIds, sectorIds, options);
    if (nuevos.length === 0) return;

    get().addElements(nuevos);
    set({ selectedIds: nuevos.filter((el) => el.type !== 'seat').map((el) => el.id) });
  },
```

- [ ] **Step 6: Botones en la barra**

En `src/lib/components/Toolbar.tsx`, agregar a los imports de `lucide-react`: `Copy`, `FlipHorizontal2`, `FlipVertical2`. Agregar `duplicateSectors, gridConfig` al destructuring (si `gridConfig` no está ya de la Task 9).

Calcular los sectores seleccionados y agregar el grupo después del de deshacer/rehacer:

```tsx
  const sectoresSeleccionados = selectedIds.filter((id) => elements[id] && elements[id].type !== 'seat');

  const duplicar = (mirror: 'horizontal' | 'vertical' | null) => {
    const paso = gridConfig.size * 2;
    duplicateSectors(sectoresSeleccionados, {
      dx: mirror === 'vertical' ? 0 : paso,
      dy: mirror === 'vertical' ? paso : 0,
      mirror,
    });
  };
```

```tsx
        {/* Duplicar y espejar */}
        <div className="bg-white border border-gray-200 p-1.5 rounded-2xl flex items-center gap-1 shadow-lg">
          <button
            onClick={() => duplicar(null)}
            disabled={sectoresSeleccionados.length === 0}
            className="p-2 text-gray-400 hover:text-[#6F3E8F] hover:bg-purple-50 disabled:opacity-20 rounded-xl transition-colors"
            title="Duplicar sector (Ctrl+D)"
          >
            <Copy size={16} strokeWidth={3} />
          </button>
          <button
            onClick={() => duplicar('horizontal')}
            disabled={sectoresSeleccionados.length === 0}
            className="p-2 text-gray-400 hover:text-[#6F3E8F] hover:bg-purple-50 disabled:opacity-20 rounded-xl transition-colors"
            title="Duplicar espejado en horizontal"
          >
            <FlipHorizontal2 size={16} strokeWidth={3} />
          </button>
          <button
            onClick={() => duplicar('vertical')}
            disabled={sectoresSeleccionados.length === 0}
            className="p-2 text-gray-400 hover:text-[#6F3E8F] hover:bg-purple-50 disabled:opacity-20 rounded-xl transition-colors"
            title="Duplicar espejado en vertical"
          >
            <FlipVertical2 size={16} strokeWidth={3} />
          </button>
        </div>
```

- [ ] **Step 7: Verificar a mano**

Run: `npm run dev`
Crear un sector, generar 3×8 asientos, seleccionarlo y usar «duplicar espejado en vertical».
Expected: aparece una segunda tribuna abajo, con sus butacas, numerada 1→8 de izquierda a derecha igual que la original. Guardar y recargar: los ids del duplicado son distintos de los del original.

- [ ] **Step 8: Verificar**

Run: `npm run lint && npm test && npm run build`
Expected: todo en verde.

- [ ] **Step 9: Commit**

```bash
git add src/lib/utils/duplicate.ts src/lib/utils/duplicate.test.ts src/lib/store/useVenueStore.ts src/lib/components/Toolbar.tsx
git commit -m "feat: duplicar y espejar un sector con sus asientos"
```

---

### Task 13: Los parámetros de generación viven en el sector

Filas, columnas, radio, fila inicial, número inicial y dirección son estado de `PropertyPanel`: se cambia de sector y se pierden; se reabre el recinto y nadie sabe con qué se generó.

**Files:**
- Modify: `src/lib/types.ts`, `src/lib/schema.ts`, `src/lib/components/PropertyPanel.tsx`

**Interfaces:**
- Produces: `SectorData.generation?` y `ShapeElement.generation?`, ambos con la forma
  `{ rows: number; cols: number; seatRadius: number; startRow: string; startNum: number; numberDirection: 'ltr' | 'rtl' }`

- [ ] **Step 1: Agregar el tipo**

En `src/lib/types.ts`, antes de `SectorData`:

```ts
/** Parámetros con los que se generaron los asientos de un sector. */
export interface SeatGeneration {
  rows: number;
  cols: number;
  seatRadius: number;
  startRow: string;
  startNum: number;
  numberDirection: 'ltr' | 'rtl';
}
```

Agregar en `SectorData`, antes de `seats`:

```ts
  /** Con qué parámetros se generaron los asientos. Ausente en mapas anteriores a 2026-08. */
  generation?: SeatGeneration;
```

y en `ShapeElement`, antes de `sectionType`:

```ts
  generation?: SeatGeneration;
```

- [ ] **Step 2: Serializarlo**

En `src/lib/schema.ts`, agregar al objeto `sector: SectorData`:

```ts
      generation: shape.generation,
```

y al objeto `shape: ShapeElement` de `deserializeVenue`:

```ts
      generation: sector.generation,
```

- [ ] **Step 3: Leerlo y escribirlo desde el panel**

En `src/lib/components/PropertyPanel.tsx`:

Reemplazar los `useState` de generación por un estado derivado del sector seleccionado:

```tsx
const GENERACION_POR_DEFECTO: SeatGeneration = {
  rows: 5, cols: 10, seatRadius: 3.5, startRow: 'A', startNum: 1, numberDirection: 'ltr',
};
```

```tsx
  const [gen, setGen] = useState<SeatGeneration>(GENERACION_POR_DEFECTO);
  const [arcRadius, setArcRadius] = useState(200);
  const [arcAngle, setArcAngle] = useState(120);

  // Al cambiar de sector se muestran los parámetros con los que se generó ese
  // sector, no los del anterior.
  useEffect(() => {
    if (element?.type === 'section') {
      setGen((element as ShapeElement).generation ?? GENERACION_POR_DEFECTO);
    }
  }, [selectedId]);
```

(agregar `useEffect` al import de React y `SeatGeneration` al import de `../types`)

Reemplazar en `generateSeats` la construcción de `base`:

```tsx
    const base = {
      rows: gen.rows, cols: gen.cols,
      rowSpacing: gen.seatRadius * 1.5, colSpacing: gen.seatRadius * 1.5,
      seatRadius: gen.seatRadius,
      startRow: (gen.startRow || 'A').toUpperCase(),
      startNum: gen.startNum,
      numberDirection: gen.numberDirection,
    };
```

y, al final de `generateSeats`, después de `addElements(seats)`:

```tsx
    // Queda registrado en el sector: regenerar más adelante reproduce lo mismo.
    updateElement(element.id, { generation: gen });
```

Cambiar cada control para que escriba en `gen`. Por ejemplo, filas:

```tsx
<input type="number" min="1" value={gen.rows}
  onChange={(e) => setGen({ ...gen, rows: Math.max(1, parseInt(e.target.value) || 1) })}
  className={inputClass} />
```

y equivalente para `cols` (`Asientos por Fila`), `seatRadius` (el `range` de Tamaño de Asiento, con `parseFloat`), `startRow`, `startNum` y `numberDirection` (el `select`).

Agregar debajo del botón de generar, cuando el sector ya tenga `generation`:

```tsx
              {(element as ShapeElement).generation && (
                <p className="text-[9px] text-[#6F3E8F]/60 font-bold text-center pt-2">
                  Generado {(element as ShapeElement).generation!.rows} × {(element as ShapeElement).generation!.cols},
                  desde {(element as ShapeElement).generation!.startRow}{(element as ShapeElement).generation!.startNum}
                </p>
              )}
```

- [ ] **Step 4: Verificar a mano**

Run: `npm run dev`
Generar 4×12 en un sector, seleccionar otro sector y volver al primero.
Expected: el panel vuelve a mostrar 4×12, y la leyenda dice «Generado 4 × 12, desde A1». Guardar, recargar y comprobar que sigue ahí.

- [ ] **Step 5: Verificar**

Run: `npm run lint && npm test && npm run build`
Expected: todo en verde.

- [ ] **Step 6: Commit**

```bash
git add src/lib/types.ts src/lib/schema.ts src/lib/components/PropertyPanel.tsx
git commit -m "feat: los parametros de generacion quedan guardados en el sector"
```

---

### Task 14: Confirmación al regenerar y al borrar

Los ids de asiento son posicionales y son lo que codifican los QR de las butacas. Regenerar un sector con otra cantidad de filas reasigna el mismo id a una butaca física distinta, sin que falle nada. No se cambia el esquema de ids en esta fase (eso invalidaría los mapas ya guardados; es Fase 4): se agrega fricción informada.

**Files:**
- Modify: `src/lib/components/PropertyPanel.tsx`, `src/lib/VenueEditor.tsx`

**Interfaces:**
- Consumes: `seatsOfSector` (Task 6)

- [ ] **Step 1: Confirmación al regenerar**

En `PropertyPanel.tsx`, agregar estado y el conteo de asientos existentes:

```tsx
  const [confirmandoRegenerar, setConfirmandoRegenerar] = useState(false);
```

```tsx
  const asientosDelSector = element && element.type === 'section'
    ? seatsOfSector(elements, elementIds, element.id).length
    : 0;
```

(importar `seatsOfSector` desde `../utils/sector`)

Reemplazar el botón de generar por:

```tsx
              <div className="pt-2">
                {confirmandoRegenerar ? (
                  <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 space-y-3">
                    <p className="text-[10px] font-bold text-amber-700 leading-relaxed">
                      Se reemplazan {asientosDelSector} asientos.
                      Los QR ya impresos de este sector dejan de coincidir con sus butacas.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => { setConfirmandoRegenerar(false); generateSeats(); }}
                        className="bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors"
                      >
                        Regenerar
                      </button>
                      <button
                        onClick={() => setConfirmandoRegenerar(false)}
                        className="bg-white border border-gray-200 text-gray-500 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => (asientosDelSector > 0 ? setConfirmandoRegenerar(true) : generateSeats())}
                    className="w-full bg-[#FF6B01] hover:bg-[#e86000] text-white py-3 rounded-2xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 group"
                  >
                    {asientosDelSector > 0 ? 'REGENERAR DISTRIBUCIÓN' : 'GENERAR DISTRIBUCIÓN'}
                    <Maximize2 size={14} className="group-hover:scale-110 transition-transform" />
                  </button>
                )}
              </div>
```

Cerrar la confirmación al cambiar de sector, dentro del `useEffect` de la Task 13:

```tsx
    setConfirmandoRegenerar(false);
```

- [ ] **Step 2: Confirmación al borrar, en la barra de estado**

En `src/lib/VenueEditor.tsx`, agregar el estado y el conteo:

```tsx
  const { selectedIds, viewState, setViewState, fitToContent, elements, elementIds, deleteElements } = useVenueStore();
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);

  const aBorrar = useMemo(() => {
    const sectores = selectedIds.filter((id) => elements[id] && elements[id].type !== 'seat');
    const asientos = sectores.reduce(
      (n, id) => n + seatsOfSector(elements, elementIds, id).length,
      0
    );
    return { sectores: sectores.length, asientos };
  }, [selectedIds, elements, elementIds]);

  const pedirBorrado = () => {
    if (aBorrar.asientos > 0) setConfirmandoBorrado(true);
    else deleteElements(selectedIds);
  };
```

(importar `useMemo`, `useState` y `seatsOfSector`)

Reemplazar el `<footer>` por:

```tsx
        <footer className="absolute bottom-0 left-0 right-0 h-8 bg-white/90 backdrop-blur-sm border-t border-gray-200 flex items-center justify-between px-4 z-[90]">
          {confirmandoBorrado ? (
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-amber-700">
                Se borran {aBorrar.sectores} {aBorrar.sectores === 1 ? 'sector' : 'sectores'} y sus {aBorrar.asientos} asientos.
              </span>
              <button
                onClick={() => { deleteElements(selectedIds); setConfirmandoBorrado(false); }}
                className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-600"
              >
                Borrar
              </button>
              <button
                onClick={() => setConfirmandoBorrado(false)}
                className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <span className="text-[10px] font-bold text-gray-400">
              Selección: {selectedIds.length > 0 ? `${selectedIds.length} elementos` : 'Ninguna'}
            </span>
          )}
          <span className="text-[10px] font-bold text-[#6F3E8F]">{Math.round(viewState.scale * 100)}%</span>
        </footer>
```

En `src/lib/components/Toolbar.tsx`, el botón de la papelera pasa a recibir la orden desde el editor. Para no duplicar la lógica, exportar `pedirBorrado` por props:

```tsx
interface ToolbarProps {
  onSave?: (map: VenueMap) => void | Promise<void>;
  onDelete: () => void;
}
```

y en el botón: `onClick={onDelete}`. En `VenueEditor.tsx`: `<Toolbar onSave={onSave} onDelete={pedirBorrado} />`.

- [ ] **Step 3: Verificar a mano**

Run: `npm run dev`
Generar asientos en un sector, seleccionar el sector y apretar la papelera. Después, con asientos ya generados, apretar «Regenerar distribución».
Expected: en ambos casos aparece la advertencia con el número de asientos afectados, y se puede cancelar. Borrar un sector vacío no pregunta nada.

- [ ] **Step 4: Verificar**

Run: `npm run lint && npm test && npm run build`
Expected: todo en verde.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/PropertyPanel.tsx src/lib/VenueEditor.tsx src/lib/components/Toolbar.tsx
git commit -m "feat: avisar cuantos asientos se pierden al regenerar o borrar un sector"
```

---

### Task 15: Plantillas de recinto

**Files:**
- Create: `src/lib/utils/templates.ts`, `src/lib/utils/templates.test.ts`, `src/lib/components/TemplateMenu.tsx`
- Modify: `src/lib/store/useVenueStore.ts`, `src/lib/components/Toolbar.tsx`, `src/lib/index.ts`

**Interfaces:**
- Consumes: `generateRectLayout`, `generateArcSectorLayout` (`utils/layout`), `SeatGeneration` (Task 13)
- Produces:
  - `type TemplateId = 'estadio-recto' | 'estadio-curvo' | 'teatro'`
  - `interface VenueTemplate { id: TemplateId; name: string; description: string; build(newId?: () => string): VenueElement[] }`
  - `TEMPLATES: VenueTemplate[]`
  - En el store: `applyTemplate(elements: VenueElement[])`

- [ ] **Step 1: Escribir el test que falla**

Create `src/lib/utils/templates.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { TEMPLATES } from './templates';
import type { SeatElement, ShapeElement } from '../types';

/**
 * Una plantilla es un punto de partida editable, no un dibujo congelado: sus
 * butacas salen de los mismos generadores que usa el panel, así que heredan la
 * numeración y la orientación correctas y se pueden regenerar.
 */

describe('plantillas', () => {
  it('hay tres', () => {
    expect(TEMPLATES.map(t => t.id)).toEqual(['estadio-recto', 'estadio-curvo', 'teatro']);
  });

  for (const plantilla of TEMPLATES) {
    describe(plantilla.name, () => {
      it('no repite ningún id', () => {
        const ids = plantilla.build().map(e => e.id);

        expect(new Set(ids).size).toBe(ids.length);
      });

      it('dos invocaciones no colisionan entre sí', () => {
        // Insertar la misma plantilla dos veces es un caso real.
        const a = plantilla.build(() => 'uno').map(e => e.id);
        const b = plantilla.build(() => 'dos').map(e => e.id);

        expect(a.filter(id => b.includes(id))).toEqual([]);
      });

      it('genera sectores y asientos', () => {
        const els = plantilla.build();

        expect(els.some(e => e.type === 'section')).toBe(true);
        expect(els.filter(e => e.type === 'seat').length).toBeGreaterThan(0);
      });

      it('cada asiento apunta a un sector que existe en la plantilla', () => {
        const els = plantilla.build();
        const sectores = new Set(els.filter(e => e.type !== 'seat').map(e => e.id));

        for (const a of els.filter((e): e is SeatElement => e.type === 'seat')) {
          expect(sectores.has(a.sectionId!)).toBe(true);
        }
      });

      it('los sectores llevan sus parámetros de generación', () => {
        const conAsientos = plantilla.build()
          .filter((e): e is ShapeElement => e.type === 'section')
          .filter(s => s.generation);

        expect(conAsientos.length).toBeGreaterThan(0);
      });

      it('trae un escenario o cancha', () => {
        expect(plantilla.build().some(e => e.type === 'stage')).toBe(true);
      });
    });
  }

  it('el estadio curvo usa sectores de arco, que es lo que distingue a un estadio', () => {
    const curvo = TEMPLATES.find(t => t.id === 'estadio-curvo')!;
    const arcos = curvo.build().filter(
      (e): e is ShapeElement => e.type === 'section' && e.sectionType === 'arc'
    );

    expect(arcos.length).toBe(4);
  });

  it('las butacas del estadio curvo salen orientadas hacia la cancha', () => {
    const curvo = TEMPLATES.find(t => t.id === 'estadio-curvo')!;
    const asientos = curvo.build().filter((e): e is SeatElement => e.type === 'seat');

    expect(asientos.some(a => a.rotation !== 0)).toBe(true);
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npx vitest run src/lib/utils/templates.test.ts`
Expected: FAIL — no existe `./templates`.

- [ ] **Step 3: Implementar**

Create `src/lib/utils/templates.ts`:

```ts
import { SeatGeneration, ShapeElement, VenueElement } from '../types';
import { generateArcSectorLayout, generateRectLayout } from './layout';

export type TemplateId = 'estadio-recto' | 'estadio-curvo' | 'teatro';

export interface VenueTemplate {
  id: TemplateId;
  name: string;
  description: string;
  /** `newId` se inyecta en los tests para que los ids sean deterministas. */
  build: (newId?: () => string) => VenueElement[];
}

const sufijoPorDefecto = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const CENTRO_X = 600;
const CENTRO_Y = 400;

const base = (
  id: string,
  name: string,
  tipo: 'section' | 'stage',
  extra: Partial<ShapeElement>
): ShapeElement => ({
  id,
  type: tipo,
  name,
  x: 0, y: 0, width: 100, height: 100, rotation: 0,
  visible: true,
  locked: false,
  opacity: tipo === 'stage' ? 1 : 0.2,
  zIndex: tipo === 'stage' ? 1 : 5,
  fill: tipo === 'stage' ? '#1F2937' : '#6F3E8F',
  isActive: true,
  sectionType: 'rectangle',
  ...extra,
});

const generacion = (extra: Partial<SeatGeneration> = {}): SeatGeneration => ({
  rows: 8, cols: 20, seatRadius: 3.5, startRow: 'A', startNum: 1, numberDirection: 'ltr',
  ...extra,
});

/** Sector rectangular con sus butacas, ya con los parámetros registrados. */
const sectorConAsientos = (
  sector: ShapeElement,
  gen: SeatGeneration
): VenueElement[] => {
  const conGeneracion = { ...sector, generation: gen };
  const asientos = generateRectLayout(conGeneracion, {
    rows: gen.rows,
    cols: gen.cols,
    rowSpacing: gen.seatRadius * 1.5,
    colSpacing: gen.seatRadius * 1.5,
    seatRadius: gen.seatRadius,
    startRow: gen.startRow,
    startNum: gen.startNum,
    numberDirection: gen.numberDirection,
  });
  return [conGeneracion, ...asientos];
};

const estadioRecto = (newId = sufijoPorDefecto): VenueElement[] => {
  const s = newId();
  const cancha = base(`stage-${s}`, 'Cancha', 'stage', {
    x: CENTRO_X - 200, y: CENTRO_Y - 125, width: 400, height: 250, cornerRadius: 8, locked: true,
  });

  const tribunas: { nombre: string; x: number; y: number; w: number; h: number; gen: SeatGeneration }[] = [
    { nombre: 'Tribuna Norte', x: CENTRO_X - 200, y: CENTRO_Y - 260, w: 400, h: 120, gen: generacion({ rows: 8, cols: 22 }) },
    { nombre: 'Tribuna Sur', x: CENTRO_X - 200, y: CENTRO_Y + 140, w: 400, h: 120, gen: generacion({ rows: 8, cols: 22 }) },
    { nombre: 'Tribuna Este', x: CENTRO_X + 220, y: CENTRO_Y - 125, w: 150, h: 250, gen: generacion({ rows: 12, cols: 8 }) },
    { nombre: 'Tribuna Oeste', x: CENTRO_X - 370, y: CENTRO_Y - 125, w: 150, h: 250, gen: generacion({ rows: 12, cols: 8 }) },
  ];

  return [
    cancha,
    ...tribunas.flatMap((t, i) =>
      sectorConAsientos(
        base(`rectangle-${s}-${i}`, t.nombre, 'section', { x: t.x, y: t.y, width: t.w, height: t.h }),
        t.gen
      )
    ),
  ];
};

const estadioCurvo = (newId = sufijoPorDefecto): VenueElement[] => {
  const s = newId();
  const cancha = base(`stage-${s}`, 'Cancha', 'stage', {
    x: CENTRO_X - 180, y: CENTRO_Y - 110, width: 360, height: 220, cornerRadius: 8, locked: true,
  });

  // Cuatro anillos alrededor de la cancha. Los ángulos van en grados, 0° a la
  // derecha y en sentido horario.
  const anillos = [
    { nombre: 'Anillo Norte', inicio: 200, fin: 340 },
    { nombre: 'Anillo Sur', inicio: 20, fin: 160 },
    { nombre: 'Anillo Este', inicio: -70, fin: 70 },
    { nombre: 'Anillo Oeste', inicio: 110, fin: 250 },
  ];

  const salida: VenueElement[] = [cancha];

  anillos.forEach((anillo, i) => {
    const gen = generacion({ rows: 6, cols: 0, seatRadius: 4 });
    const sector = base(`arc-${s}-${i}`, anillo.nombre, 'section', {
      x: CENTRO_X,
      y: CENTRO_Y,
      width: 620,
      height: 620,
      sectionType: 'arc',
      innerRadius: 240,
      outerRadius: 310,
      startAngle: anillo.inicio,
      endAngle: anillo.fin,
      generation: gen,
    });
    const asientos = generateArcSectorLayout(sector, {
      rows: gen.rows,
      cols: gen.cols,
      rowSpacing: gen.seatRadius * 2,
      colSpacing: gen.seatRadius * 1.5,
      seatRadius: gen.seatRadius,
      startRow: gen.startRow,
      startNum: gen.startNum,
      numberDirection: gen.numberDirection,
    });
    salida.push(sector, ...asientos);
  });

  return salida;
};

const teatro = (newId = sufijoPorDefecto): VenueElement[] => {
  const s = newId();
  const escenario = base(`stage-${s}`, 'Escenario', 'stage', {
    x: CENTRO_X - 200, y: 100, width: 400, height: 120,
    cornerRadius: { topLeft: 10, topRight: 10, bottomLeft: 100, bottomRight: 100 },
    locked: true,
  });

  const plateas = [
    { nombre: 'Platea VIP', x: CENTRO_X - 250, y: 280, w: 500, h: 120, gen: generacion({ rows: 6, cols: 24, seatRadius: 4 }) },
    { nombre: 'Platea General', x: CENTRO_X - 300, y: 420, w: 600, h: 150, gen: generacion({ rows: 8, cols: 28, seatRadius: 4 }) },
  ];

  return [
    escenario,
    ...plateas.flatMap((p, i) =>
      sectorConAsientos(
        base(`rectangle-${s}-${i}`, p.nombre, 'section', { x: p.x, y: p.y, width: p.w, height: p.h }),
        p.gen
      )
    ),
  ];
};

export const TEMPLATES: VenueTemplate[] = [
  {
    id: 'estadio-recto',
    name: 'Estadio (tribunas rectas)',
    description: 'Cancha con cuatro tribunas rectangulares',
    build: estadioRecto,
  },
  {
    id: 'estadio-curvo',
    name: 'Estadio (anillo curvo)',
    description: 'Cancha con cuatro anillos curvos alrededor',
    build: estadioCurvo,
  },
  {
    id: 'teatro',
    name: 'Teatro',
    description: 'Escenario con platea VIP y general',
    build: teatro,
  },
];
```

Nota sobre `cols: 0` en el estadio curvo: `generateArcSectorLayout` calcula por sí misma cuántas butacas entran en cada fila según el radio, así que `cols` no interviene. Se deja en 0 para que quede explícito que ese generador no lo usa.

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npx vitest run src/lib/utils/templates.test.ts`
Expected: PASS.

- [ ] **Step 5: Acción del store y menú**

En `src/lib/store/useVenueStore.ts`, agregar a la interfaz y al objeto:

```ts
  /** Inserta los elementos de una plantilla sin borrar lo que ya hay. */
  applyTemplate: (elements: VenueElement[]) => void;
```

```ts
  applyTemplate: (nuevos) => {
    get().addElements(nuevos);
    get().fitToContent();
  },
```

Create `src/lib/components/TemplateMenu.tsx`:

```tsx
import React, { useState } from 'react';
import { LayoutTemplate } from 'lucide-react';
import { useVenueStore } from '../store/useVenueStore';
import { TEMPLATES } from '../utils/templates';

/** Inserta una plantilla. Nunca reemplaza: si ya hay contenido, avisa. */
export const TemplateMenu: React.FC = () => {
  const { elementIds, applyTemplate } = useVenueStore();
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setAbierto((v) => !v)}
        className={`p-2 rounded-xl transition-all ${abierto ? 'bg-[#FF6B01]/10 text-[#FF6B01]' : 'text-gray-400 hover:text-[#6F3E8F] hover:bg-purple-50'}`}
        title="Plantillas de recinto"
      >
        <LayoutTemplate size={16} strokeWidth={3} />
      </button>

      {abierto && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-64 bg-white border border-gray-200 rounded-2xl shadow-xl p-2 z-[110]">
          {elementIds.length > 0 && (
            <p className="text-[9px] font-bold text-amber-700 bg-amber-50 rounded-xl px-3 py-2 mb-2 leading-relaxed">
              La plantilla se agrega a lo que ya hay dibujado; no reemplaza nada.
            </p>
          )}
          {TEMPLATES.map((plantilla) => {
            const cantidad = plantilla.build().filter((e) => e.type === 'seat').length;
            return (
              <button
                key={plantilla.id}
                onClick={() => { applyTemplate(plantilla.build()); setAbierto(false); }}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-purple-50 transition-colors group"
              >
                <span className="block text-xs font-bold text-gray-700 group-hover:text-[#6F3E8F]">
                  {plantilla.name}
                </span>
                <span className="block text-[10px] text-gray-400 font-bold">
                  {plantilla.description} · {cantidad} asientos
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
```

En `src/lib/components/Toolbar.tsx`, importar `TemplateMenu` y montarlo dentro del grupo de herramientas de dibujo, después del botón de escenario:

```tsx
          <div className="h-5 w-px bg-gray-200 mx-0.5" />
          <TemplateMenu />
```

En `src/lib/index.ts`, exportar:

```ts
export { TEMPLATES } from './utils/templates';
export type { VenueTemplate, TemplateId } from './utils/templates';
```

- [ ] **Step 6: Verificar a mano**

Run: `npm run dev`
Sobre un lienzo vacío, insertar «Estadio (anillo curvo)».
Expected: aparece la cancha con cuatro anillos de butacas orientadas hacia el centro, encuadrado. Insertar una segunda plantilla no borra la primera y muestra el aviso.

- [ ] **Step 7: Verificar**

Run: `npm run lint && npm test && npm run build`
Expected: todo en verde.

- [ ] **Step 8: Commit**

```bash
git add src/lib/utils/templates.ts src/lib/utils/templates.test.ts src/lib/components/TemplateMenu.tsx src/lib/store/useVenueStore.ts src/lib/components/Toolbar.tsx src/lib/index.ts
git commit -m "feat: plantillas de estadio recto, estadio curvo y teatro"
```

---

### Task 16: Atajos de teclado

**Files:**
- Create: `src/lib/utils/shortcuts.ts`, `src/lib/utils/shortcuts.test.ts`, `src/lib/hooks/useEditorShortcuts.ts`
- Modify: `src/lib/store/useVenueStore.ts`, `src/lib/VenueEditor.tsx`

**Interfaces:**
- Consumes: `moveSector` (Task 6), `duplicateSectors` del store (Task 12)
- Produces:
  - `type EditorAction = { kind: 'delete' } | { kind: 'undo' } | { kind: 'redo' } | { kind: 'duplicate' } | { kind: 'deselect' } | { kind: 'nudge'; dx: number; dy: number } | { kind: 'tool'; tool: EditorTool }`
  - `resolveShortcut(evento, opciones): EditorAction | null` con
    `evento: { key: string; ctrlKey: boolean; metaKey: boolean; shiftKey: boolean; targetTag: string }`
    y `opciones: { gridSize: number }`
  - En el store: `nudgeSelection(dx, dy)`

- [ ] **Step 1: Escribir el test que falla**

Create `src/lib/utils/shortcuts.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { resolveShortcut } from './shortcuts';

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
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npx vitest run src/lib/utils/shortcuts.test.ts`
Expected: FAIL — no existe `./shortcuts`.

- [ ] **Step 3: Implementar la función pura**

Create `src/lib/utils/shortcuts.ts`:

```ts
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
  if (CAMPOS.has(evento.targetTag.toUpperCase())) return null;

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
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npx vitest run src/lib/utils/shortcuts.test.ts`
Expected: PASS, 10 tests.

- [ ] **Step 5: `nudgeSelection` en el store**

En `src/lib/store/useVenueStore.ts`, agregar a la interfaz y al objeto:

```ts
  /** Empuja la selección. Los sectores llevan sus asientos. */
  nudgeSelection: (dx: number, dy: number) => void;
```

```ts
  nudgeSelection: (dx, dy) => {
    const { elements, elementIds, selectedIds } = get();
    const movimientos: Movimientos = {};
    for (const id of selectedIds) {
      const el = elements[id];
      if (!el || el.locked) continue;
      movimientos[id] = { x: el.x + dx, y: el.y + dy };
    }
    // Sin historial: lo agrupa el hook cuando el usuario deja de empujar.
    aplicarMovimientos(get, movimientos, elements, elementIds, false);
  },
```

- [ ] **Step 6: El hook**

Create `src/lib/hooks/useEditorShortcuts.ts`:

```ts
import { useEffect, useRef } from 'react';
import { useVenueStore } from '../store/useVenueStore';
import { resolveShortcut } from '../utils/shortcuts';
import type { EditorTool } from '../types';

/** Espera sin teclas tras la cual el empuje con flechas se cierra como un paso. */
const AGRUPAR_EMPUJE_MS = 400;

/**
 * Cablea el teclado al store. La decisión de qué hace cada tecla vive en
 * `resolveShortcut`, que es pura y está probada; acá quedan las dos cosas que
 * necesitan estado y no se pueden resolver mirando una sola tecla: agrupar el
 * empuje con flechas en un paso de historial, y el paneo con la barra
 * espaciadora, que depende de soltar la tecla.
 */
export const useEditorShortcuts = (onDelete: () => void) => {
  const temporizadorEmpuje = useRef<ReturnType<typeof setTimeout> | null>(null);
  const herramientaPrevia = useRef<EditorTool | null>(null);

  useEffect(() => {
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
      // Barra espaciadora mantenida: panear y volver a la herramienta anterior.
      const enCampo = ['INPUT', 'TEXTAREA', 'SELECT'].includes(
        (e.target as HTMLElement)?.tagName ?? ''
      );
      if (e.code === 'Space' && !enCampo) {
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

      // El polígono en curso maneja su propio Escape y su propio Enter.
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
      if (temporizadorEmpuje.current) clearTimeout(temporizadorEmpuje.current);
    };
  }, [onDelete]);
};
```

En `src/lib/VenueEditor.tsx`, importar el hook y usarlo con la confirmación de borrado de la Task 14:

```tsx
  useEditorShortcuts(pedirBorrado);
```

`pedirBorrado` tiene que ser estable: envolverlo en `useCallback` con dependencias `[aBorrar.asientos, selectedIds, deleteElements]`.

- [ ] **Step 7: Verificar a mano**

Run: `npm run dev`
Probar: seleccionar un sector y mover con flechas; `Shift`+flecha; `Ctrl+D`; `Ctrl+Z`; `Supr`; mantener la barra espaciadora y arrastrar; escribir en el campo del nombre del recinto letras como «v», «m», «d».
Expected: todo responde; con la barra espaciadora mantenida el cursor panea y al soltarla vuelve la herramienta anterior; empujar diez veces con la flecha y después `Ctrl+Z` deshace **el empuje entero, no un píxel**; y **escribir en el campo del nombre no dispara ningún atajo**.

- [ ] **Step 8: Verificar**

Run: `npm run lint && npm test && npm run build`
Expected: todo en verde.

- [ ] **Step 9: Commit**

```bash
git add src/lib/utils/shortcuts.ts src/lib/utils/shortcuts.test.ts src/lib/hooks/useEditorShortcuts.ts src/lib/store/useVenueStore.ts src/lib/VenueEditor.tsx
git commit -m "feat: atajos de teclado del editor"
```

---

### Task 17: Verificación de punta a punta

Nada de esto vale si el panel admin no lo recibe bien o si un mapa guardado deja de leerse en los móviles.

**Files:** ninguno (solo verificación); si algo falla, se corrige en el archivo que corresponda.

- [ ] **Step 1: Construir la librería**

Run:
```bash
npm run lint && npm test && npm run build
```
Expected: todo en verde; `dist/venue-mapper.js`, `dist/index.d.ts` y `dist/style.css` regenerados.

- [ ] **Step 2: Comprobar que el panel admin compila contra la librería nueva**

Run:
```bash
cd ../point-web-admin && npx tsc -b --force && npm run build
```
Expected: sin errores de tipos. `point-web-admin/node_modules/venue-mapper` es un symlink a `mapeo/`, así que toma el `dist` recién construido.

- [ ] **Step 3: Probar el editor real**

Levantar el panel (`npm run dev` en `point-web-admin`, puerto 5173) con la API corriendo, entrar a Clientes → un cliente → mapa.
Expected: encuadra al abrir; se puede duplicar y espejar un sector; los atajos responden; guardar y volver a entrar conserva todo.

- [ ] **Step 4: Probar el visor real**

Entrar a Eventos → detalle de un evento con recinto mapeado.
Expected: el visor encuadra bien (los asientos ya no quedan corridos medio radio) y las butacas de un anillo se ven orientadas.

- [ ] **Step 5: Ida y vuelta con un mapa viejo**

Abrir un `geometria_json` guardado antes de estos cambios, editarlo, guardarlo y volver a abrirlo.
Expected: sin pérdida de datos y **sin sectores «General» inventados**. Los campos nuevos (`rotation`, `generation`) aparecen solo donde corresponde.

- [ ] **Step 6: Compatibilidad con los móviles**

Tomar el `geometria_json` guardado con la versión nueva y comprobar que `VenueMiniViewer` lo sigue leyendo. La comprobación mínima es de tipos: los campos nuevos son opcionales y los móviles ignoran los que no conocen.

Run:
```bash
cd ../point-app-cliente && npx tsc --noEmit && npm test
cd ../point-app-delivery && npx tsc --noEmit && npm test
```
Expected: sin errores. (Los móviles no se modifican en esta entrega; esto solo confirma que nada de lo nuevo los rompe.)

- [ ] **Step 7: Actualizar la documentación del repo**

En `mapeo/CLAUDE.md`, agregar a la sección de arquitectura los módulos nuevos de `utils/` (bounds, snapping, align, duplicate, templates, shortcuts, sector, transformer) y el hook `hooks/useEditorShortcuts.ts`. En la lista de «deliberadamente removido», sacar el imán entre elementos —ahora existe— y dejar agrupar, copiar/pegar y el índice espacial.

- [ ] **Step 8: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: documentar los modulos nuevos del editor"
```

---

## Notas para quien ejecute

- **El orden importa.** Las Tasks 2, 4 y 6 producen módulos que consumen las siguientes. La 7 depende de la 6; la 10, de la 2 y la 9; la 11, de la 2 y la 6; la 12, de la 2 y la 6; la 14, de la 13; la 16, de la 11 (usa `aplicarMovimientos`) y de la 12 (usa `duplicateSectors` del store). Las Tasks 1, 3, 4, 5, 8, 9 y 13 no dependen entre sí y se pueden reordenar.
- **Si un test manual no da lo esperado, parar.** Estos cambios tocan datos que después se serializan al backend; un defecto acá se guarda en `geometria_json` y no vuelve solo.
