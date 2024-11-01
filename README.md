# userscript-helpers

Helper functions for userscript with server connection.

[![npm Package Version](https://img.shields.io/npm/v/userscript-helpers)](https://www.npmjs.com/package/userscript-helpers)

## Features

- Using child window to proxy connection to custom server
- Typescript support

## Installation

```bash
npm install userscript-helpers
```

You can also install `userscript-helpers` with [pnpm](https://pnpm.io/), [yarn](https://yarnpkg.com/), or [slnpm](https://github.com/beenotung/slnpm)

## Usage Example

Details see [server.ts](./example/server.ts) and [userscript.ts](./example/userscript.ts)

In express server:

```typescript
import { attachFrameRoute } from 'userscript-helpers'
import express from 'express'

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

app.listen(8100)
```

In userscript:

```typescript
import { setupFrame, sleep } from 'userscript-helpers'

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
        let json = await frame.fetchJSON('POST', '/img', { url })
        console.log('post img result:', json)
        imgs.add(img)
      }
    },
  })
}

main().catch(e => console.error(e))
```

## Typescript Signature

**Server-side functions**:

```typescript
export function attachFrameRoute(app: Router | Application): void
```

**Client-side functions for userscript**:

```typescript
export function setupFrame(options: {
  api_origin: string
  /**
   * @description overwrite `console.log()` and `console.error()` by `console.debug()`
   */
  wrap_console?: boolean
}): Promise<{
  proxyWindowPromise: Promise<Window>
  callAPI: <T>(url: string, init: RequestInit) => Promise<T>
  fetchJSON: <T>(method: string, url: string, body?: object) => Promise<T>
  postForm: <T>(url: string, formData: FormData) => Promise<T>
  startLoop: (options: {
    loop(): LoopResult | Promise<LoopResult>
    /**
     * @description default 1000
     */
    loop_interval?: number
    /**
     * @description default 3500
     */
    error_retry_interval?: number
  }) => void
  isCurrentIteration: () => boolean
  stopIteration: (context?: string) => void
}>

export type LoopResult = void | 'stop'

export declare function imageToDataUrl(
  img: HTMLImageElement,
  /** @description default is as-is for image with dataUrl, and "image/png" for image with src */
  mimeType?: ImageMimeType,
  /** @description between 0 and 1 */
  quality?: number,
): Promise<string>

export type ImageMimeType = 'image/png' | 'image/jpeg' | 'image/webp'
```

**Additional helper functions for any side**:

```typescript
/**
 * @description async version of setTimeout
 */
export function sleep(ms: number): Promise<void>

/**
 * @returns mimetype, e.g. "image/webp"
 */
export function dataUrlToMimeType(dataUrl: string): string

/**
 * @return extname without ".", e.g. "webp"
 */
export function dataUrlToExtname(dataUrl: string): string
```

## License

This project is licensed with [BSD-2-Clause](./LICENSE)

This is free, libre, and open-source software. It comes down to four essential freedoms [[ref]](https://seirdy.one/2021/01/27/whatsapp-and-the-domestication-of-users.html#fnref:2):

- The freedom to run the program as you wish, for any purpose
- The freedom to study how the program works, and change it so it does your computing as you wish
- The freedom to redistribute copies so you can help others
- The freedom to distribute copies of your modified versions to others
