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
    // Use terser for better minification and code removal
    minify: "terser",
    terserOptions: {
      compress: {
        // Remove console.* in production
        drop_console: mode === "production",
        // Remove debugger statements
        drop_debugger: true,
        // Remove dead code
        dead_code: true,
      },
      mangle: {
        // Mangle property names in production for obfuscation
        properties: mode === "production" ? { regex: /^_/ } : false,
      },
    },
    // Chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-tabs"],
        },
      },
    },
  },
  // Prevent sensitive info in error messages
  esbuild: {
    drop: mode === "production" ? ["console", "debugger"] : [],
  },
}));
