import { defineConfig }   from 'vite'
import react              from '@vitejs/plugin-react'

// Renderer process — standard React + Vite SPA
export default defineConfig({
  plugins: [react()],
})
