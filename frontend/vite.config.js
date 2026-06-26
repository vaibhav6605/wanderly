import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  server: {
    port: 5173,
  },

  build: {
    // Target modern browsers — allows esbuild to emit smaller, cleaner output
    target: 'es2022',

    // Split CSS per chunk so pages only load the styles they need
    cssCodeSplit: true,

    // Raise the warning threshold; the Recharts chunk is intentionally large
    chunkSizeWarningLimit: 600,

    rollupOptions: {
      output: {
        /**
         * Manual chunk splitting puts stable, rarely-changing vendor code into
         * separate files with long-lived cache hashes. Browsers that already
         * have react-vendor or motion cached skip downloading them entirely on
         * subsequent visits — even when app code changes.
         */
        manualChunks(id) {
          // React runtime — changes least often, highest cache benefit
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-is/')) {
            return 'react-vendor'
          }
          // Routing
          if (id.includes('node_modules/react-router') || id.includes('node_modules/@remix-run/')) {
            return 'router'
          }
          // State management
          if (id.includes('node_modules/@reduxjs/') || id.includes('node_modules/react-redux/') || id.includes('node_modules/immer/')) {
            return 'redux'
          }
          // Animation — used by AppLayout + Button + Navbar (always loaded)
          if (id.includes('node_modules/framer-motion/')) {
            return 'motion'
          }
          // HTTP client
          if (id.includes('node_modules/axios/')) {
            return 'axios'
          }
          // Heavy charting library — already in a lazy admin chunk,
          // explicit split stops it leaking into other chunks
          if (id.includes('node_modules/recharts/') || id.includes('node_modules/d3-') || id.includes('node_modules/victory-vendor/')) {
            return 'charts'
          }
          // Stripe SDK
          if (id.includes('node_modules/@stripe/')) {
            return 'stripe'
          }
        },
      },
    },
  },
})
