import express from 'express'
import { print } from 'listening-on'
import { attachFrameRoute } from '../lib/server'
import { mkdirSync, writeFileSync } from 'fs'
import { createHash } from 'crypto'
import { dataUrlToExtname } from '../lib/utils'
import { join } from 'path'

let app = express()

attachFrameRoute(app)
app.use(express.json({ limit: '25mb' }))
app.use(express.urlencoded({ extended: false }))

let imgDir = 'images'
mkdirSync(imgDir, { recursive: true })

app.post('/img', async (req, res) => {
  let { url, alt, dataUrl } = req.body
  console.log('img', { url, alt })
  let hash = createHash('sha256')
  hash.write(dataUrl)
  let digest = hash.digest().toString('hex')
  let filename = digest + '.' + dataUrlToExtname(dataUrl)
  {
    let file = join(imgDir, filename)
    let res = await fetch(dataUrl)
    let arrayBuffer = await res.arrayBuffer()
    let buffer = Buffer.from(arrayBuffer)
    writeFileSync(file, buffer)
  }
  {
    let file = join(imgDir, digest + '.json')
    let text = JSON.stringify({ filename, url, alt }, null, 2) + '\n'
    writeFileSync(file, text)
  }
  res.json({ digest })
})

let port = 8100
app.listen(port, () => {
  print(port)
})
