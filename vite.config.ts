import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "runtime/src/index.ts",
      name: "LeuFramework",
      fileName: "index",
      formats: ["es"],
    },
    outDir: "dist",
    rollupOptions: {
      external: [],
      output: {
        globals: {},
      },
    },
    sourcemap: true,
  },
  resolve: {
    alias: {
      "@": "./runtime/src",
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  // Важно: указываем, что index.html - это точка входа
  root: ".",
  publicDir: false,
});
