import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/7-Simul-Memo-Trainer/',
  plugins: [react()],
  server: {
    host: true,
    port: parseInt(process.env.PORT || '5174'),
  },
})
