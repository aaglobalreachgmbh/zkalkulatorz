import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Security Build Configuration
  build: {
    // Disable source maps in production
    sourcemap: mode === "development",
    // Use esbuild for minification (default, no extra dependency)
    minify: "esbuild",
    // Target ES2022 for top-level await support (required by pdfjs-dist)
    target: "es2022",
    // Chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          pdf: ["pdfjs-dist"],
        },
      },
    },
  },
  // Optimize deps to handle pdfjs-dist correctly
  optimizeDeps: {
    esbuildOptions: {
      target: "es2022",
    },
  },
  // Remove console/debugger in production
  esbuild: {
    drop: mode === "production" ? ["console", "debugger"] : [],
  },
}));
