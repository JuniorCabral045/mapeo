# venue-mapper

Librería React para **mapear recintos** (estadios, teatros) con sectores y asientos, y **mostrar los mapeos guardados** en un sistema de venta/pedidos de entradas.

Expone dos componentes:

| Componente | Uso | Quién lo usa |
|---|---|---|
| `<VenueEditor>` | Diseñar el mapa: dibujar sectores (rectángulo/círculo/arco), generar asientos por filas y columnas, guardar | El administrador |
| `<VenueViewer>` | Mostrar un mapa guardado, aplicar disponibilidad por evento y dejar que el cliente elija asientos | El cliente final |

La librería es **agnóstica del backend**: recibe el mapeo por props y avisa por callbacks. El contrato de API sugerido para Laravel está en [docs/API-LARAVEL.md](docs/API-LARAVEL.md).

## Instalación (desarrollo local)

```bash
# 1. Compilar la librería en este repo
npm install
npm run build          # genera dist/

# 2. Instalarla en tu sistema de pedidos (React 18)
cd ../tu-sistema-de-pedidos
npm install ../mapeo
```

## Uso

### Editor (panel de administración)

```tsx
import { VenueEditor, VenueMap } from 'venue-mapper';
import 'venue-mapper/styles.css';

function AdminMapa({ recinto }: { recinto?: VenueMap }) {
  const guardar = async (map: VenueMap) => {
    await fetch(`/api/venues/${map.id ?? ''}`, {
      method: map.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(map),
    });
  };

  // El editor ocupa el 100% del contenedor: darle altura explícita
  return (
    <div style={{ height: '100vh' }}>
      <VenueEditor initialMap={recinto} onSave={guardar} />
    </div>
  );
}
```

> Nota: `VenueEditor` usa un store global — montar **un solo editor por página**.

### Visor (tienda / selección de asientos)

```tsx
import { VenueViewer, VenueMap, AvailabilityMap, SelectedSeat } from 'venue-mapper';
import 'venue-mapper/styles.css';

function ElegirAsientos({ map, availability }: { map: VenueMap; availability: AvailabilityMap }) {
  const [seleccion, setSeleccion] = useState<SelectedSeat[]>([]);

  return (
    <div style={{ height: 600 }}>
      <VenueViewer
        map={map}                          // GET /api/venues/{id}
        availability={availability}        // GET /api/events/{id}/availability
        maxSeats={6}
        onSelectionChange={(_ids, seats) => setSeleccion(seats)}
      />
      {/* seleccion => tu carrito / creación del pedido */}
    </div>
  );
}
```

- Solo los asientos con estado `available` (y de sectores activos) son seleccionables.
- `availability` es un objeto `{ [seatId]: 'available' | 'occupied' | 'blocked' | 'reserved' }`; los asientos ausentes se asumen disponibles.
- La selección puede ser controlada (prop `selectedSeatIds`) o interna.

## Esquema JSON del mapeo (`VenueMap`)

Es el documento que se guarda/carga del backend:

```jsonc
{
  "version": 1,
  "id": "uuid-del-backend",        // opcional
  "name": "Estadio Municipal",
  "sectors": [
    {
      "id": "rectangle-1730000000",
      "name": "Tribuna Norte",
      "kind": "section",           // 'section' vendible | 'stage' escenario/cancha
      "shape": "rectangle",        // 'rectangle' | 'circle' | 'arc'
      "x": 300, "y": 300, "width": 200, "height": 150,
      "rotation": 0,
      "fill": "#3b82f6",
      "active": true,
      "seats": [
        { "id": "seat-...-0-0", "row": "A", "number": "1", "x": 344.8, "y": 350.5, "radius": 3.5 }
      ]
    }
  ]
}
```

Los `id` de asiento son estables: son la clave que tu backend usa para pedidos y disponibilidad.

También se exportan `serializeVenue` / `deserializeVenue` / `createEmptyMap` y los generadores `generateRectLayout` / `generateArcLayout` por si necesitas manipular mapeos por código.

## Demo

```bash
npm run dev
```

Abre una app demo con dos pestañas: **Editor (Admin)** para diseñar y guardar (en localStorage) y **Tienda (Cliente)** que muestra el mapa guardado con disponibilidad simulada y un carrito de ejemplo.

## Scripts

```bash
npm run dev       # app demo con hot-reload
npm run build     # compila la librería a dist/ (ES module + tipos + CSS)
npm run lint      # eslint
```
