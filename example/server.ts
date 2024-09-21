import express from 'express'
import { print } from 'listening-on'
import { attachFrameRoute } from '../lib/server'

let app = express()

attachFrameRoute(app)
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

let urls = new Set<string>()

app.post('/img', (req, res) => {
  let url = req.body.url
  urls.add(url)
  res.json({ count: urls.size })
})

let port = 8100
app.listen(port, () => {
  print(port)
})
