import path from 'path'
import { fileURLToPath } from 'url'
import { app } from './src/server/coreApp.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function startApp() {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000
  const isProduction = process.env.NODE_ENV === 'production'

  if (isProduction) {
    const distPath = path.resolve(__dirname, 'dist')
    const express = (await import('express')).default
    app.use(express.static(distPath))
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'))
    })
  } else {
    // Dynamic import to prevent Vite from being bundled in production serverless environments
    const { createServer: createViteServer } = await import('vite')
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port,
      },
      appType: 'spa',
    })
    app.use(vite.middlewares)
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[OrthoSmile-Medic] Server running on http://0.0.0.0:${port}`)
  })
}

if (!process.env.VERCEL) {
  startApp().catch((err) => {
    console.error('[OrthoSmile-Medic] Failed to start server:', err)
    process.exit(1)
  })
}

export { app }
export default app
