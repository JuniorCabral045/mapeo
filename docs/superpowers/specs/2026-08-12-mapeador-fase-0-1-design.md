# Mapeador — Fase 0 (piso confiable) y Fase 1 (comodidad al mapear)

**Fecha:** 2026-08-12
**Repo:** `mapeo` (`venue-mapper`), rama `dev`
**Estado:** diseño aprobado, pendiente de plan de implementación

## Por qué

El mapeador funciona, pero mapear un estadio con él es lento y arrastra una isla de
código muerto que confunde a cualquiera que lo lea. Además
hay cuatro defectos que no son cosméticos: mover un sector deja sus asientos atrás,
borrarlo los deja huérfanos, regenerarlo reasigna ids que están impresos en los QR, y
un escenario no se puede redimensionar en un solo eje.

Esta es la primera de cuatro entregas. Las fases 2 (estética y escala), 3 (paridad
móvil) y 4 (integridad al guardar) están decididas y van después, cada una con su
propio spec. Ver «Fuera de alcance».

## Contexto: quién consume esto

| Consumidor | Componente | Qué recibe |
|---|---|---|
| `point-web-admin` → Clientes (crear/editar) | `VenueEditor` | mapa completo; guarda `clientes.geometria_json` |
| `point-web-admin` → Eventos (detalle) | `VenueViewer` | mapa completo, solo lectura |
| `point-app-cliente` → ubicación | `VenueMiniViewer` (SVG propio) | mapa completo del recinto |
| `point-app-delivery` → pedido | `VenueMiniViewer` (SVG propio, copia divergida) | un sector recortado por la API |

`point-web-admin/node_modules/venue-mapper` es un symlink a `mapeo/`, y el panel lee
`mapeo/dist`. El ciclo de verificación es: `npm run build` en `mapeo` + recargar el panel.

**Los dos móviles no se tocan en esta entrega.** Todo campo nuevo del formato es
opcional, así que un mapa guardado con esta versión se sigue leyendo con el código
móvil actual. Su paridad es la Fase 3.

## Principio que ordena la entrega

Los cambios de formato son **aditivos y opcionales**. Un `VenueMap` viejo se abre sin
migración, y uno nuevo se lee con los consumidores viejos. No hay versión 2 del schema.

**Convención de nombres.** La librería es un paquete npm publicable y todo su código y
su formato están en inglés (`VenueMap`, `serializeVenue`, `sectors`, `seats`). Los
identificadores nuevos siguen esa convención; el español queda para los textos de
interfaz, los comentarios y los tests, como ya está hoy.

---

## 1. Borrar la copia muerta del demo

`mapeo/CLAUDE.md` advierte que `src/` (demo) y `src/lib/` (publicado) son dos programas
paralelos y que «lo que verificás en `npm run dev` no es lo que recibe el panel». **Eso
ya no es cierto:** `src/demo/App.tsx` importa de `../lib` desde el commit `8892604`.
Verificado con el grafo de imports: partiendo de `src/main.tsx`, nada alcanza a
`src/store/`, `src/components/`, `src/types/`, `src/utils/` ni `src/styles/`. Solo se
importan entre ellos. Son una isla muerta de unas 2.100 líneas.

**Qué se hace**

- Se borran los cinco directorios muertos.
- Se corrige `mapeo/CLAUDE.md`, que hoy documenta como activa una divergencia que ya no
  existe y manda a evitar un problema inexistente.
- De la isla se rescatan dos ideas, reescritas contra los tipos de la librería —no
  copiadas—: el imán entre elementos (§7) y las plantillas (§9). Los originales quedan
  accesibles con `git show HEAD:src/utils/snapping.ts` y `…/templates.ts`.
- `theme.ts` (tokens de color) queda en el historial; lo retoma la Fase 2.

**Riesgo aceptado:** se pierden agrupar, copiar/pegar y el índice espacial RBush, que
solo existían en la isla y que nadie podía usar. Copiar/pegar vuelve en §6 como
duplicar sector; agrupar y el índice espacial no vuelven (ver «Decisiones»).

---

## 2. Redimensionar en un eje

**Problema.** El `Transformer` expone solo las cuatro anclas de esquina
(`EditorCanvas.tsx:481`) y Konva usa `keepRatio: true` por defecto. Resultado: toda
figura se agranda proporcionalmente y no hay forma de cambiar solo el ancho de una
cancha o solo el alto de un escenario. `handleTransformEnd` ya sabe aplicar `scaleX` y
`scaleY` por separado para rectángulos y polígonos — solo faltaban las anclas.

**Diseño.** Las anclas dependen de la forma del elemento seleccionado:

| Forma | Anclas | Por qué |
|---|---|---|
| `rectangle`, `stage`, `polygon` | las 8 (4 esquinas + 4 medias) | tienen ancho y alto independientes |
| `circle`, `arc` | solo las 4 esquinas | su geometría es radial; deformarlas en un eje no tiene representación en el formato |

`keepRatio={false}`. Manteniendo `Shift` durante el arrastre se conserva la proporción
(comportamiento nativo de Konva). Con selección múltiple se cae al conjunto más
restrictivo: si hay un círculo o un arco seleccionado, solo esquinas.

---

## 3. Encuadrar al abrir

**Problema.** `loadMap` no toca `viewState` y el default del store es
`{ scale: 1, x: 100, y: 100 }`. Abrir un recinto guardado cuyos elementos viven en
x≈3000 muestra un lienzo vacío y hay que buscarlo a rueda. El visor sí auto-encuadra;
el editor no.

**Diseño.**

- `src/lib/utils/bounds.ts` nuevo: `calculateBounds(elements, elementIds)` y
  `fitView(bounds, width, height, margen)` → `ViewState`. Hoy ese cálculo está escrito
  a mano dentro de `VenueViewer` (`VenueViewer.tsx:80-100`); pasa a ser una sola
  definición que usan editor y visor.
- El editor encuadra al cargar un mapa con elementos, y al montar sin mapa deja la
  vista por defecto.
- El botón que hoy «restablece vista» a 100 %/(100,100) — que no sirve para nada —
  pasa a ser **Encuadrar**, con el mismo ícono.
- `encuadrar` acota la escala a `[0.05, 5]`, el mismo rango que la rueda.

---

## 4. El sector y sus asientos son una unidad

En el lienzo los asientos no son hijos del sector: son hermanos con coordenadas
absolutas, dibujados en una segunda pasada. Eso está bien para el render (los asientos
siempre quedan visualmente encima) pero hace que el sector y sus butacas se comporten
como cosas sueltas en las tres operaciones donde deberían ser una sola.

**4.1 Mover, redimensionar y rotar.** `handleDragEnd` (`EditorCanvas.tsx:318`)
actualiza solo el elemento arrastrado. Arrastrar una tribuna ya mapeada deja sus 500
butacas flotando donde estaban; lo mismo al redimensionarla o rotarla. Hoy solo se
mueven juntas si se las seleccionó a todas a mano.

Diseño: mover un sector traslada sus asientos; rotarlo los rota alrededor del origen
del sector (y suma a la rotación de cada butaca, §5.2); redimensionarlo reescala sus
posiciones proporcionalmente. La misma transformación afín que se le aplica al sector,
aplicada a sus asientos. Cambiar la *cantidad* de butacas sigue siendo cosa de
regenerar (§5.3) — esto solo preserva lo que ya está dibujado.

Se implementa en el store (`moveSector`, `transformSector`), no en los manejadores
del lienzo, para que valga también desde el panel de propiedades, desde los atajos de
flechas y desde alinear/distribuir.

**4.2 Borrado en cascada.** `deleteElements` (`useVenueStore.ts:113`) quita exactamente los ids que
recibe. Borrar un sector deja sus asientos con `sectionId` apuntando a nada, y
`serializeVenue` (`schema.ts:81`) los mete en un sector sintético «General» que el
backend después sincroniza como sector real. Se borra una tribuna y aparecen 500
butacas en un sector que nadie creó.

**Diseño.** `deleteElements(ids)` arrastra los asientos cuyo `sectionId` esté entre los
ids borrados. El editor avisa antes: al pedir borrar una selección que incluye sectores
con asientos, aparece una confirmación inline en la barra de estado —no un `confirm()`
del navegador— que dice cuántos sectores y cuántos asientos se van a borrar. Un solo
`saveHistory`, así deshacer devuelve todo junto.

---

## 5. Numeración y rotación de asientos

**5.1 Filas más allá de la Z.** `String.fromCharCode('A'.charCodeAt(0) + r)` con r=26
produce `[`, `\`, `]`. Un sector de 30 filas se numera con símbolos. Se agrega
`rowLabel(indice, filaInicial)` en `layout.ts`, con secuencia A…Z, AA, AB…, usada
por los cuatro generadores. Respeta la fila inicial elegida: empezando en «C», el
índice 0 es C.

**5.2 Rotación del asiento.** Los generadores de arco calculan la rotación de cada
butaca (`layout.ts:111`), `deserializeVenue` la fuerza a 0 y el componente `Seat` ni
siquiera la aplica: es dato que se calcula, se pierde y nunca se dibuja. Se agrega
`SeatData.rotation?: number` (opcional, ausente = 0), `deserializeVenue` deja de
forzarla y `<Seat>` la pasa al `<Group>`. Es lo que hace que un anillo se lea como un
anillo y no como butacas sueltas apuntando todas al norte.

**5.3 Regenerar no es gratis.** Los ids de asiento son posicionales
(`seat-${sectorId}-${fila}-${col}`, `layout.ts:70`) y son exactamente lo que codifican
los QR pegados en las butacas. Regenerar un sector con otra cantidad de filas reasigna
el mismo id a una butaca física distinta: los pedidos empiezan a llegar a otro asiento
y no falla nada en ningún lado.

No se cambia el esquema de ids en esta fase (cambiarlo invalidaría los mapas
existentes). Lo que se agrega es fricción informada: si el sector ya tiene asientos, el
botón «Generar distribución» pide confirmación inline dentro del panel, diciendo
cuántos asientos reemplaza y advirtiendo que los QR ya impresos de ese sector dejan de
ser válidos. Se puede seguir; no se puede hacerlo sin enterarse.

---

## 6. Duplicar y espejar sector con sus asientos

La operación que más tiempo ahorra en un estadio: se mapea la tribuna norte y la sur
sale de un clic.

**API del store**

```ts
duplicateSectors(
  ids: string[],
  opciones: { dx: number; dy: number; espejo: 'horizontal' | 'vertical' | null }
): string[]   // ids de los sectores nuevos, ya seleccionados
```

**Reglas**

- **Ids nuevos siempre.** Sector: `${tipo}-${sufijoUnico}`. Asientos:
  `seat-${idSectorNuevo}-${fila}-${col}`. Nunca se reusa un id del original — son los
  de los QR.
- **Las etiquetas se conservan, no se continúan.** El duplicado arranca en A1 igual que
  el original: la numeración de una tribuna es local a la tribuna, y dos butacas con la
  misma etiqueta en sectores distintos no se confunden porque el id lleva el sector
  adentro. (Al espejar cambia el *orden* dentro de la fila, no el conjunto de
  etiquetas; ver más abajo.)
- **El espejo refleja alrededor del centro del bounding box del sector**, e incluye:
  - posición de cada asiento,
  - los vértices de `points` en los polígonos,
  - los ángulos de un arco (`startAngle`/`endAngle` se reflejan sobre el eje
    correspondiente: horizontal → `180 - ángulo`; vertical → `-ángulo`; ambos
    normalizados a [0, 360) y reordenados para que `start < end`),
  - la rotación del elemento y la de cada asiento.
- **La numeración se normaliza al espejar.** Reflejar la geometría deja los números
  corriendo al revés en pantalla. Después del espejo se reasignan dentro de cada fila
  para que asciendan en la misma dirección visual que en el original: si la tribuna
  norte se lee 1→10 de izquierda a derecha, la sur espejada también.
  Esto además mantiene coherente el §8.2: los parámetros de generación se copian tal
  cual y regenerar el duplicado reproduce exactamente lo que se ve.
- Un solo `saveHistory` por operación.

**UI.** Botones en la barra de herramientas, activos con al menos un sector
seleccionado: duplicar (desplaza un paso de grilla), espejar horizontal, espejar
vertical. `Ctrl+D` es el atajo de duplicar.

---

## 7. Alinear, distribuir e imán entre elementos

**Alinear y distribuir.** Barra que aparece cuando hay dos o más elementos
seleccionados: alinear a izquierda, centro horizontal, derecha, arriba, centro
vertical, abajo; distribuir con espaciado parejo en horizontal y en vertical
(requiere tres o más). Opera sobre el bounding box de cada elemento y mueve los
sectores a través de `moveSector` (§4.1), así los asientos acompañan.

**Imán entre elementos.** Se porta la matemática de `src/utils/snapping.ts` con dos
cambios obligados:

1. **Sin RBush.** El original mantenía un índice espacial que la librería no tiene y
   que habría que sostener en cada mutación. Los candidatos a imán son solo sectores y
   escenarios —nunca asientos, que son miles y engancharían con todo— y en un recinto
   real son menos de cien: un barrido lineal alcanza y sobra. Se elimina la dependencia.
2. **Umbral en píxeles de pantalla, no de mundo.** El original usa un umbral fijo de 5
   unidades de mundo, así que a poco zoom no engancha nunca y a mucho zoom agarra todo.
   Pasa a ser `UMBRAL / viewState.scale`, de modo que la sensación es la misma en
   cualquier zoom.

Engancha a bordes y centros. Mientras se arrastra se dibujan las guías. Se desactiva
manteniendo `Alt`, o desde el interruptor de §8.

---

## 8. Grilla y generador bajo control

**8.1 La grilla no tiene interruptor.** `gridConfig` existe en el store desde siempre y
ningún botón la toca: el snap a grilla está permanentemente activo y no se puede apagar
ni cambiar de paso. Se agrega un grupo en la barra: mostrar grilla (sí/no), imán
(grilla / elementos / apagado) y tamaño de grilla. `GridConfig` suma
`snapToElements: boolean`, que el `snapping.ts` original ya esperaba y el tipo de la
librería no declara.

La grilla además se dibuja hoy como ~500 nodos `Rect` fijos entre 0 y 5000: panear
fuera de ese cuadro la hace desaparecer. Se redibuja como una sola figura con
`sceneFunc` cubriendo el viewport visible. Es un arreglo de correctitud, no de estética
—lo estético de la grilla es Fase 2.

**8.2 Los parámetros de generación se pierden.** Filas, columnas, radio de butaca,
fila inicial, número inicial y dirección son estado del componente `PropertyPanel`: se
cambia de sector y se pierden; se reabre el recinto y nadie sabe con qué se generó ese
sector. Se agrega a `SectorData`:

```ts
generation?: {
  rows: number;
  cols: number;
  seatRadius: number;
  startRow: string;
  startNum: number;
  numberDirection: 'ltr' | 'rtl';
}
```

Opcional y retrocompatible. Se escribe al generar; el panel lo lee al seleccionar el
sector, así regenerar es reproducible y la ficha puede decir «generado 5 × 10, desde
A1, izq→der».

---

## 9. Plantillas de recinto

Empezar de cero frente a un lienzo vacío es la parte más lenta. Se rescatan las
plantillas de la demo y se llevan a la librería, reescritas contra sus tipos y sus
generadores.

**Tres plantillas**

1. **Estadio (tribunas rectas)** — cancha más cuatro tribunas rectangulares. Es la que
   existía.
2. **Estadio (anillo curvo)** — cancha más cuatro sectores `arc` alrededor. Es la que
   corresponde al recinto real y la que ejercita los generadores de arco, que hoy nadie
   toca sin armarlos a mano.
3. **Teatro** — escenario más plateas. Es la que existía.

**Reglas**

- Una plantilla **inserta**, no reemplaza. Sobre un lienzo con contenido, pide
  confirmación inline diciendo qué va a agregar.
- Los ids son únicos por invocación (el original usaba `Date.now()` compartido dentro
  de la misma plantilla).
- Las butacas salen de los mismos generadores de `layout.ts`, no de coordenadas
  escritas a mano, así heredan §5.1 y §5.2 y quedan con su `generation` (§8.2)
  cargados: la plantilla es un punto de partida editable, no un dibujo congelado.
- Entran por un botón «Plantillas» en la barra, con vista previa del nombre y la
  capacidad que va a crear.

---

## 10. Atajos de teclado

Hook `useAtajosEditor`, montado en `VenueEditor`. **Inertes mientras el foco está en un
`input`, `textarea` o `select`** — si no, escribir el nombre de un sector borra la
selección.

| Tecla | Acción |
|---|---|
| `Supr` / `Backspace` | borrar selección (con la confirmación de §4.2) |
| `Ctrl+Z` / `Ctrl+Shift+Z`, `Ctrl+Y` | deshacer / rehacer |
| flechas | empujar 1 px |
| `Shift` + flechas | empujar un paso de grilla |
| `Ctrl+D` | duplicar sector (§6) |
| `Esc` | deseleccionar; cancela el polígono en curso |
| `Espacio` (mantenido) | panear temporalmente, vuelve a la herramienta anterior al soltar |
| `V` / `M` / `P` | selección / mano / polígono |

Empujar con flechas agrupa en un solo `saveHistory` tras 400 ms sin teclas, para que
deshacer no retroceda píxel por píxel.

---

## 11. Pruebas

Vitest en `mapeo`, sobre lógica. Sin regresión de captura, igual que el resto del repo.

| Archivo | Cubre |
|---|---|
| `utils/bounds.test.ts` (nuevo) | bounds con formas mixtas, encuadre, acotado de escala, lienzo vacío |
| `utils/layout.test.ts` (existente) | `rowLabel` más allá de Z y con fila inicial ≠ A; rotación de asientos en arcos |
| `utils/duplicate.test.ts` (nuevo) | ids nuevos y sin colisión, espejo de polígono y de arco, numeración invertida, `generation` copiada |
| `utils/snapping.test.ts` (nuevo) | enganche a bordes y centros, umbral escalado por zoom, asientos excluidos como candidatos |
| `store/useVenueStore.test.ts` (nuevo) | borrado en cascada; asientos que acompañan al mover, rotar y redimensionar su sector; un solo paso de historial por operación |
| `utils/templates.test.ts` (nuevo) | ids únicos, inserción no destructiva, capacidad esperada |

Antes de cerrar: `npm run lint`, `npm test` y `npm run build` en `mapeo`.

## 12. Verificación visual

No alcanza con que compile: la mitad de esto es cómo se siente.

1. Demo (`npm run dev` en `mapeo`) para iterar: ahora sí es la librería.
2. `npm run build` en `mapeo` y panel admin levantado, revisando el editor real
   (Clientes → mapa) y el visor real (Eventos → detalle).
3. Sobre un recinto con butacas generadas: mover, rotar y redimensionar un sector, y
   comprobar que las butacas acompañan en los tres casos.
4. Prueba de ida y vuelta: abrir un `geometria_json` guardado con la versión anterior,
   editarlo, guardarlo y volver a abrirlo. Sin pérdida de datos ni sectores «General»
   inventados.
5. Comprobar que un mapa guardado con esta versión se sigue leyendo en el
   `VenueMiniViewer` de los móviles (campos nuevos ignorados, nada rompe).

## Decisiones

**No se cambia el esquema de ids de asiento.** Es la raíz del riesgo de los QR, pero
cambiarlo ahora invalida los mapas ya guardados y los QR ya impresos. Esta fase agrega
la advertencia; la solución de fondo —ids estables e independientes de la posición— es
un cambio de formato con migración y pertenece a la Fase 4.

**No vuelve agrupar elementos.** La demo lo tenía. Con duplicar sector y alinear
resueltos, el caso de uso que lo justificaba desaparece, y agrupar agrega un nivel de
jerarquía al store que complica el serializado.

**No vuelve el índice espacial RBush.** Con los sectores como únicos candidatos a
imán (menos de cien en un recinto real), un barrido lineal es más simple y no hay
índice que mantener sincronizado en cada mutación.

**Las confirmaciones son inline, no `confirm()`.** Es una librería que se embebe en un
panel; un diálogo nativo del navegador rompe la estética del anfitrión y no es
testeable.

## Fuera de alcance (van después, en este orden)

- **Fase 2 — estética y escala:** tokens de color (hoy `#FF6B01` y `#6F3E8F` están
  incrustados en unos 40 lugares y la librería no se puede tematizar), nombre del
  sector dibujado en el lienzo (hoy solo el escenario tiene texto, así que en el visor
  no se distingue un sector de otro), panel de capas agrupado por sector y virtualizado
  (hoy lista cada asiento sin virtualizar: 20.000 butacas son 20.000 filas de DOM),
  leyenda y controles del visor, barra de herramientas que no tape el lienzo.
- **Fase 3 — paridad móvil:** un solo mini-visor compartido entre cliente y delivery
  (hoy son dos copias ya divergidas), soporte de sectores `arc` (hoy caen a un
  rectángulo desplazado, justo en la pantalla que sirve para encontrar la butaca),
  etiquetas `fila+número` en vez del id crudo (requiere que la API mande `row`/`number`
  en `VenueSeatData`), pinch para zoom.
- **Fase 4 — integridad:** validación antes de guardar (sectores sin asientos y sin
  capacidad, ids duplicados, asientos fuera de su sector), capacidad total del recinto
  a la vista, e ids de asiento estables con su migración.
