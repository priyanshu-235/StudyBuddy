import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',   // <-- important for production
    }),
    tailwindcss(),
  ],
  base: '/', // ensures assets resolve correctly
})
