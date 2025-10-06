import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import serveStatic from 'serve-static'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'static-public-middleware',
      configureServer(server) {
        const publicRoot = process.env.PUBLIC_CONTENT_DIR
          ? path.resolve(process.env.PUBLIC_CONTENT_DIR)
          : path.resolve(process.cwd(), 'public')

        server.middlewares.use('/public', serveStatic(publicRoot, { index: false }))
      },
    },
  ],
})
