import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

// `npm run dev` sirve la app demo (index.html).
// `npm run build` compila la librería (src/lib) como paquete npm.
export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['src/lib'],
      insertTypesEntry: true,
      tsconfigPath: './tsconfig.app.json',
    }),
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: Number(process.env.PORT) || 5173,
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/lib/index.ts'),
      name: 'VenueMapper',
      formats: ['es'],
      fileName: 'venue-mapper',
    },
    rollupOptions: {
      // No empaquetar dependencias: las instala la app consumidora
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'konva',
        'react-konva',
        'zustand',
        'lucide-react',
      ],
    },
  },
});
