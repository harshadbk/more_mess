import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // Ports and the API target come from .env (see .env.example). Mess uses 5174/4174/5001, so stall uses 5173/4173/5000.
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }
  const api = env.API_PROXY || 'http://localhost:5000'

  return {
    plugins: [react(), tailwindcss()],
    server: { port: Number(env.DEV_PORT) || 5173, strictPort: true, proxy: { '/api': api } },
    preview: { port: Number(env.PREVIEW_PORT) || 4173, strictPort: true, proxy: { '/api': api } },
    build: {
      target: 'es2022',
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return
            if (id.includes('gsap')) return 'gsap'
            if (id.includes('swiper')) return 'swiper'
            if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils')) return 'motion'
            if (id.includes('react-router')) return 'router'
            if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) return 'react'
          },
        },
      },
    },
  }
})
