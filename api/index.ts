import app from '../src/server/coreApp.js'

export default function handler(req: any, res: any) {
  return app(req, res)
}
