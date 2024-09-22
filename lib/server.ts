import type { Application, Router } from 'express'

export function attachFrameRoute(app: Router | Application) {
  let { resolve, join } = eval('request("path")')
  let frame_file = resolve(join(__dirname, 'frame.html'))
  let router = app as Router
  router.get('/frame.html', (req, res) => {
    res.sendFile(frame_file)
  })
}
