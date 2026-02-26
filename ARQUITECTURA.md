# Arquitectura del Sistema de Mapeo de Recintos

Este sistema está diseñado para ser una herramienta profesional de diseño y visualización de recintos, utilizando tecnologías modernas y escalables.

## 1. Stack Tecnológico
- **Frontend**: React 18 con TypeScript para un desarrollo robusto y tipado.
- **Renderizado**: `react-konva` (basado en HTML5 Canvas), ideal para manejar miles de elementos interactivos con alto rendimiento.
- **Estilos**: Tailwind CSS para una interfaz moderna y responsiva.
- **Iconografía**: Lucide React.

## 2. Arquitectura de Estado
El sistema utiliza un patrón de **Unidirectional Data Flow** con un hook personalizado `useVenueStore`.

- **State Object**: Contiene el layout actual (asientos, secciones), historial para deshacer/rehacer, y el estado de la UI (herramientas, selección).
- **Reducer**: Maneja transformaciones inmutables del estado.
- **History**: Implementado mediante un stack de estados anteriores, permitiendo `Undo` y `Redo` de forma nativa.

## 3. Modelo de Datos (JSON)
El diseño se guarda en un formato JSON estructurado:

```json
{
  "id": "venue-1",
  "name": "Estadio Nacional",
  "gridSize": 20,
  "snapToGrid": true,
  "seats": [
    {
      "id": "seat-1",
      "x": 100,
      "y": 100,
      "rotation": 0,
      "row": "A",
      "number": "1",
      "status": "available",
      "price": 50,
      "opacity": 1
    }
  ],
  "sections": [
    {
      "id": "section-1",
      "name": "Platea VIP",
      "type": "rectangle",
      "x": 50,
      "y": 50,
      "width": 300,
      "height": 200,
      "color": "#3b82f6",
      "isActive": true,
      "borderRadius": 10
    }
  ]
}
```

## 4. Funcionalidades de Escalabilidad
- **Snap to Grid**: Garantiza alineación automática de elementos.
- **Multi-selección**: Permite editar propiedades de cientos de asientos simultáneamente.
- **Transformer**: Manejo visual de redimensionamiento y rotación.
- **Modos Segregados**: El modo visualización desactiva todas las funciones de edición y optimiza la interacción para el usuario final.

## 5. Recomendaciones para Producción
1. **Optimización de Canvas**: Para recintos de >10,000 asientos, implementar "Layering" (capas) para separar elementos estáticos de dinámicos.
2. **Backend**: Implementar una API REST o GraphQL para persistir los JSON en una base de datos NoSQL (MongoDB/PostgreSQL JSONB).
3. **Colaboración**: Usar WebSockets (Socket.io) si se requiere edición multi-usuario en tiempo real.
4. **Accesibilidad**: Añadir etiquetas ARIA y navegación por teclado para los modos de visualización.
