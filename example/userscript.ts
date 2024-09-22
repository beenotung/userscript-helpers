import { imageToDataUrl, setupFrame } from '../lib/client'
import { sleep } from '../lib/utils'

async function main() {
  let frame = await setupFrame({
    api_origin: 'http://localhost:8100',
  })
  let imgs = new Set<HTMLImageElement>()
  frame.startLoop({
    async loop() {
      let new_imgs = document.querySelectorAll('img')
      for (let img of new_imgs) {
        let url = img.src
        if (!url || imgs.has(img)) continue
        img.scrollIntoView({ behavior: 'smooth' })
        await sleep(500)
        let json = await frame.fetchJSON('POST', '/img', {
          url: url.startsWith('data:') ? 'inline' : url,
          alt: img.alt,
          dataUrl: await imageToDataUrl(img, 'image/webp', 0.5),
        })
        console.log('post img result:', json)
        imgs.add(img)
      }
    },
  })
}

main().catch(e => console.error(e))
