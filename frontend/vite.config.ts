import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['@rollup/rollup-win32-x64-msvc']
  },
  build: {
    rollupOptions: {
      external: ['@rollup/rollup-win32-x64-msvc']
    }
  },
  // Windows compatibility
  define: {
    global: 'globalThis',
  }
}));
