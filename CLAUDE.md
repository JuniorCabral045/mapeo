# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`venue-mapper` — a React **library** (npm package) for mapping venues (stadiums, theaters) with sectors and seats, built for a thesis project: a stadium ticket-ordering system whose backend is Laravel. The library is backend-agnostic — it receives maps via props and reports via callbacks. See `README.md` (Spanish) for usage and `docs/API-LARAVEL.md` for the suggested backend contract.

Two public components:
- `<VenueEditor initialMap onSave onChange>` — full editor (draw sectors, generate seats, save). Uses a global Zustand store, so only one editor per page.
- `<VenueViewer map availability selectedSeatIds onSelectionChange maxSeats>` — self-contained viewer (no store) for showing a saved map and letting customers pick available seats.

## Commands

```bash
npm run dev       # Vite dev server serving the demo app (src/demo + index.html)
npm run build     # builds the LIBRARY (vite lib mode + vite-plugin-dts) into dist/
npm run lint      # eslint .
```

```bash
npm test          # vitest run — pure logic only (layout + geometry)
```

The package is consumed locally via `npm install ../mapeo` (file: dependency); `react`/`react-dom` are peer deps, konva/react-konva/zustand/lucide-react stay as regular deps but are marked `external` in the lib build.

## El demo consume la librería

`src/demo/App.tsx` importa de `src/lib` — lo que ves en `npm run dev` es exactamente lo
que recibe el panel admin. Hasta 2026-08 existía bajo `src/` una copia paralela del
store, los componentes, los tipos y las utilidades, que ya no importaba nadie; se borró.
Si necesitás algo de ahí (agrupar, copiar/pegar, el índice espacial RBush, los tokens de
`theme.ts`), está en el historial: `git show 8892604:src/utils/snapping.ts`.

**Todo cambio va en `src/lib/`.** El demo es una pantalla delgada: pestañas
Editor/Tienda, persistencia en `localStorage` y disponibilidad simulada.

## Architecture

```
src/
  lib/                  ← the published package (entry: src/lib/index.ts)
    types.ts            ← public JSON schema types (VenueMap/SectorData/SeatData) + internal element types
    schema.ts           ← serializeVenue / deserializeVenue / createEmptyMap
    store/useVenueStore.ts  ← editor-only Zustand store (elements flat by id + elementIds order, undo/redo history)
    VenueEditor.tsx     ← composes Toolbar + EditorCanvas + PropertyPanel; onSave serializes store → VenueMap
    VenueViewer.tsx     ← standalone: deserializes `map` prop, local pan/zoom/selection state, auto-fits bounds on mount
    components/         ← Toolbar, PropertyPanel, canvas/{EditorCanvas,Seat,CustomShape}
    utils/              ← layout.ts (generateRectLayout/generateArcLayout), geometry.ts, grid.ts
    styles.css          ← Tailwind directives; emitted as dist/style.css, exported as 'venue-mapper/styles.css'
  demo/App.tsx          ← dev-only demo: Editor/Tienda tabs, localStorage persistence, simulated availability
```

### Key concepts

- **Two data representations**: the editor/canvas works on a *flat* `Record<string, VenueElement>` + `elementIds` (z-order); the backend-facing format is the hierarchical `VenueMap` (venue → sectors → seats). `schema.ts` converts between them; seat/sector `id`s are stable and are the keys the backend uses for orders/availability.
- **Seat coordinates are absolute canvas coords**, seats reference their sector via `sectionId`. Orphan seats are serialized into a synthetic "General" sector.
- **Availability is runtime data**, never stored in the map: the viewer merges `availability[seatId]` over each seat's design-time status when rendering; missing entries mean `available`. Seats that aren't `available` (or whose sector `active === false`) are not selectable.
- Canvas renders in two passes over `elementIds`: sections/stages first (`CustomShape`), then seats (`Seat`) — seats always sit visually above sections. `CustomShape` builds an SVG path (`createRoundedRectPath`) to support per-corner radii.
- History: `saveHistory()` deep-clones `{elements, elementIds}` (50-snapshot cap). Mutating store actions call it themselves; drag/transform handlers in `EditorCanvas` call it on gesture end so intermediate frames aren't recorded. `PropertyPanel.handleUpdate` intentionally does NOT snapshot (would spam history on keystrokes).
- Deliberately removed in the library simplification (don't re-add without need): grouping, copy/paste, RBush spatial index, element-to-element snapping (grid snap remains in `utils/grid.ts`), demo templates.

`ARQUITECTURA.md` (Spanish) documents the original design rationale of the pre-library editor; still useful for the snapping/seat-generation math but its file layout is outdated.

## Notes

- UI strings and venue naming are in Spanish (e.g. "Sector Norte", "Nuevo Recinto") — match this convention for UI-facing text.
- Use `lucide-react` for icons, Tailwind for styling; avoid other UI/icon libraries.
- `vite.config.ts` reads `process.env.PORT` for the dev server (needed by preview tooling); `.claude/launch.json` defines the `demo` server.
