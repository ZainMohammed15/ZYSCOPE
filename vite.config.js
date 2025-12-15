import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/health': 'http://localhost:3000',
      '/help': 'http://localhost:3000',
      '/cities': 'http://localhost:3000',
      '/compare': 'http://localhost:3000',
      '/explore': 'http://localhost:3000',
      '/reviews': 'http://localhost:3000',
      '/leaderboard': 'http://localhost:3000',
      '/visits': 'http://localhost:3000',
      '/user': 'http://localhost:3000',
    },
  },
});
