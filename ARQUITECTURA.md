# Arquitectura Profesional: Editor de Recintos v2

Esta arquitectura ha sido diseñada para ofrecer una experiencia similar a herramientas como Figma, priorizando la **precisión**, el **rendimiento** (soporte para +5,000 elementos) y la **extensibilidad**.

## 🚀 Tecnologías Core
- **React + TypeScript**: Base sólida y tipado estricto.
- **Konva + React-Konva**: Motor de renderizado en Canvas 2D de alto rendimiento.
- **Zustand**: Gestión de estado global ligera y optimizada para eventos de alta frecuencia.
- **RBush**: Indexación espacial (R-Tree) para snapping y colisiones ultra-rápidas.

## 🏗️ Estructura de Datos (Jerarquía)
El sistema utiliza un modelo de datos plano (`Record<string, Element>`) para acceso O(1), pero mantiene una jerarquía lógica mediante `parentId` y `childrenIds`.

```typescript
interface BaseElement {
  id: string;
  type: 'seat' | 'section' | 'group' | 'stage';
  x: number;
  y: number;
  rotation: number;
  parentId?: string;
}
```

## 🛠️ Sistemas Implementados

### 0. Layout Responsive (CAD Layout)
- El entorno de trabajo se adapta automáticamente al tamaño del contenedor mediante un `ResizeObserver` integrado en `VenueCanvas`.
- Estructura de tres paneles: Listado de Capas (Izquierda), Canvas (Centro), Panel de Propiedades (Derecha).

### 1. Motor de Snapping Inteligente
Utiliza una estructura R-Tree (RBush) para encontrar elementos cercanos en microsegundos.
- **Snap a Grilla**: Redondeo dinámico basado en configuración.
- **Snap entre Elementos**: Alineación automática de bordes y centros (vertical/horizontal).
- **Guías Visuales**: Líneas dinámicas que aparecen al detectar una alineación.

### 2. Formas Personalizadas y Border Radius
Para superar la limitación de Konva de un solo valor de radio, se utiliza el componente `CustomShape` basado en `SVG Path commands`.
- Soporte para `topLeft`, `topRight`, `bottomLeft`, `bottomRight` independientes mediante `createRoundedRectPath`.
- Integración nativa con el motor de transformaciones de Konva para redimensionado preciso.
- Permite crear formas complejas como escenarios en arco o secciones irregulares.

### 3. Engine de Generación de Asientos
- **Layout Rectangular**: Distribución basada en filas y columnas con espaciado ajustable.
- **Layout en Arco**: Distribución radial para teatros y estadios circulares/ovalados.

### 4. Gestión de Estado y UX
- **Undo/Redo**: Sistema robusto de snapshots que sincroniza el estado de los elementos y su orden de apilado (z-index), evitando desincronización de IDs.
- **Clipboard**: Sistema de copiar/pegar con soporte para offsets estilo Figma.
- **Multi-selección**: Selección mediante caja (marquee) y Shift+Click.

## 📈 Recomendaciones para Escalar
1. **Capa de Selección**: Mantener el Transformer en una capa separada o usar `listening={false}` en elementos estáticos durante el drag.
2. **Caching**: Utilizar `element.cache()` en grupos de asientos que no cambian frecuentemente para reducir el número de llamadas de dibujo.
3. **Virtualización**: Para >10,000 asientos, implementar una lógica que solo renderice elementos dentro del viewport del usuario (basado en el index espacial).
