import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// -------------------------------------------------
// Vite Configuration
// -------------------------------------------------
// Configures the build tool for React development
// Uses @vitejs/plugin-react for Fast Refresh support
// -------------------------------------------------
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Enable CORS for local development with backend
    cors: true
  }
})
