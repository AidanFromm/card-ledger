import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: './',  // Required for Capacitor - use relative paths
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Core React vendor chunk
          if (id.includes('node_modules/react/') || 
              id.includes('node_modules/react-dom/') || 
              id.includes('node_modules/react-router')) {
            return 'vendor-react';
          }
          // Charts - heavy library, lazy loaded
          if (id.includes('node_modules/recharts')) {
            return 'vendor-charts';
          }
          // Animation library
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-motion';
          }
          // Supabase
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase';
          }
          // Form handling
          if (id.includes('node_modules/react-hook-form') || 
              id.includes('node_modules/@hookform') || 
              id.includes('node_modules/zod')) {
            return 'vendor-forms';
          }
          // Data handling (TanStack)
          if (id.includes('node_modules/@tanstack')) {
            return 'vendor-data';
          }
          // Date utilities
          if (id.includes('node_modules/date-fns') || 
              id.includes('node_modules/react-day-picker')) {
            return 'vendor-date';
          }
          // PDF/Export - only load when needed
          if (id.includes('node_modules/jspdf') || 
              id.includes('node_modules/xlsx') || 
              id.includes('node_modules/papaparse')) {
            return 'vendor-export';
          }
          // Radix UI primitives
          if (id.includes('node_modules/@radix-ui')) {
            return 'vendor-ui';
          }
          // Utility libraries
          if (id.includes('node_modules/clsx') || 
              id.includes('node_modules/tailwind-merge') ||
              id.includes('node_modules/class-variance-authority')) {
            return 'vendor-utils';
          }
        },
      },
    },
    // Set reasonable warning limit
    chunkSizeWarningLimit: 300,
  },
}));
