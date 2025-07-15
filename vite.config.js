import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  plugins: [],
  server: {
    host: '0.0.0.0',
    hmr: true, // das kannst du auch einfach weglassen, ist nur für lokale Dev
  },
  build: {
    outDir: 'dist',         // <--- wichtig! genau dieser Ordner wird von Express ausgeliefert
    emptyOutDir: true,      // vorher alles in dist löschen
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html') // falls Vite den Einstieg nicht erkennt
    }
  }
});
