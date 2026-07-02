# Contrato de API sugerido (Laravel)

Este documento define los endpoints y el modelo de datos que tu backend Laravel necesita para
persistir los mapeos creados con `venue-mapper` y servir la disponibilidad de asientos al visor.

La estrategia recomendada es **híbrida**:

1. Guardar el documento `VenueMap` completo como JSON (columna `map_json`) — es lo que el editor
   produce y lo que el visor consume, sin transformaciones.
2. Además, **normalizar sectores y asientos en tablas** — para que los pedidos referencien
   asientos por clave foránea y puedas consultar disponibilidad con SQL.

Los `id` de sector y asiento que genera la librería son strings estables: úsalos como clave
(`external_id`) para sincronizar.

## Migraciones sugeridas

```php
Schema::create('venues', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->json('map_json');          // documento VenueMap completo
    $table->timestamps();
});

Schema::create('sectors', function (Blueprint $table) {
    $table->id();
    $table->foreignId('venue_id')->constrained()->cascadeOnDelete();
    $table->string('external_id');     // id del sector en el JSON
    $table->string('name');
    $table->boolean('active')->default(true);
    $table->timestamps();
    $table->unique(['venue_id', 'external_id']);
});

Schema::create('seats', function (Blueprint $table) {
    $table->id();
    $table->foreignId('sector_id')->constrained()->cascadeOnDelete();
    $table->string('external_id');     // id del asiento en el JSON (clave para disponibilidad)
    $table->string('row');
    $table->string('number');
    $table->timestamps();
    $table->unique(['sector_id', 'external_id']);
});

// Disponibilidad por evento (un mismo recinto sirve para muchos eventos)
Schema::create('event_seats', function (Blueprint $table) {
    $table->id();
    $table->foreignId('event_id')->constrained()->cascadeOnDelete();
    $table->foreignId('seat_id')->constrained()->cascadeOnDelete();
    $table->enum('status', ['available', 'occupied', 'blocked', 'reserved'])->default('available');
    $table->foreignId('order_id')->nullable();
    $table->timestamps();
    $table->unique(['event_id', 'seat_id']);
});
```

## Endpoints

### Mapeos (admin)

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/venues` | Lista recintos (id, name) |
| `POST` | `/api/venues` | Crea recinto. Body: `VenueMap`. Devuelve el mapa con `id` asignado |
| `GET` | `/api/venues/{id}` | Devuelve el `VenueMap` (columna `map_json`, inyectando `id`) |
| `PUT` | `/api/venues/{id}` | Reemplaza el mapeo y re-sincroniza sectores/asientos |
| `DELETE` | `/api/venues/{id}` | Elimina el recinto |

Al guardar (`POST`/`PUT`), el controlador debe:

```php
public function update(Request $request, Venue $venue)
{
    $map = $request->validate([
        'version' => 'required|integer',
        'name'    => 'required|string',
        'sectors' => 'required|array',
    ]);

    DB::transaction(function () use ($venue, $map) {
        $venue->update(['name' => $map['name'], 'map_json' => $map]);

        foreach ($map['sectors'] as $sectorData) {
            $sector = $venue->sectors()->updateOrCreate(
                ['external_id' => $sectorData['id']],
                ['name' => $sectorData['name'], 'active' => $sectorData['active']]
            );
            foreach ($sectorData['seats'] as $seatData) {
                $sector->seats()->updateOrCreate(
                    ['external_id' => $seatData['id']],
                    ['row' => $seatData['row'], 'number' => $seatData['number']]
                );
            }
        }
        // Opcional: eliminar sectores/asientos que ya no estén en el JSON
    });

    return response()->json($venue->map_json);
}
```

### Disponibilidad (tienda)

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/events/{id}/availability` | Estado de cada asiento para el evento |

Respuesta — exactamente el formato del prop `availability` del visor
(los asientos no incluidos se asumen `available`):

```json
{
  "seat-rectangle-1730-0-0": "occupied",
  "seat-rectangle-1730-0-1": "reserved"
}
```

```php
public function availability(Event $event)
{
    return $event->eventSeats()
        ->with('seat:id,external_id')
        ->get()
        ->pluck('status', 'seat.external_id');
}
```

### Pedidos

Al crear un pedido, el frontend envía los `id` de asiento seleccionados (los `SelectedSeat.id`
que entrega `onSelectionChange`). El backend debe validar y ocupar los asientos **dentro de una
transacción con bloqueo** para evitar dobles ventas:

```php
DB::transaction(function () use ($event, $seatExternalIds, $order) {
    $seats = Seat::whereIn('external_id', $seatExternalIds)->pluck('id');

    $updated = EventSeat::where('event_id', $event->id)
        ->whereIn('seat_id', $seats)
        ->where('status', 'available')
        ->lockForUpdate()
        ->update(['status' => 'occupied', 'order_id' => $order->id]);

    if ($updated !== count($seatExternalIds)) {
        throw new SeatsNoLongerAvailableException();
    }
});
```

## Flujo completo

```
ADMIN                                      CLIENTE
─────                                      ───────
<VenueEditor onSave={...}>                 GET /api/venues/{id}        → map
  └─ PUT /api/venues/{id}  (VenueMap)      GET /api/events/{id}/availability → availability
                                           <VenueViewer map availability onSelectionChange>
                                             └─ POST /api/orders  { event_id, seat_ids: [...] }
```
