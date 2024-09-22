export type LoopResult = void | 'stop'

export async function setupFrame(options: {
  api_origin: string
  /**
   * @description overwrite `console.log()` and `console.error()` by `console.debug()`
   */
  wrap_console?: boolean
}) {
  let { api_origin } = options

  if (options.wrap_console !== false) {
    console.log = console.debug
    console.error = console.debug
  }

  type WindowExtra = {
    _frame_iteration_?: number
  }
  let win = window as WindowExtra
  let current_iteration = win._frame_iteration_ || 0
  current_iteration++
  win._frame_iteration_ = current_iteration

  let onmessage: (event: MessageEvent) => void

  let messageListeners = new Set<(event: MessageEvent) => void>()

  function stopIteration(context: string) {
    console.log('detected next iteration, stop ' + context)
    window.removeEventListener('message', onmessage)
    proxyWindowPromise.then(proxyWindow => proxyWindow.close())
  }

  let proxyWindowPromise = new Promise<Window>(resolve => {
    const proxyWindow = window.open(api_origin + '/frame.html')
    if (!proxyWindow) {
      console.log('window.open() not supported')
      return
    }
    onmessage = event => {
      if (win._frame_iteration_ != current_iteration) {
        stopIteration('onmessage()')
        return
      }
      if (event.origin != api_origin) {
        return
      }
      if (event.data.type == 'frame-ready') {
        proxyWindow.postMessage({ type: 'host-ready' }, api_origin)
        resolve(proxyWindow)
        return
      }
      messageListeners.forEach(listener => listener(event))
    }
    window.addEventListener('message', onmessage)
  })

  let messageCount = 0

  function callAPI<T>(url: string, init: RequestInit) {
    return new Promise<T>((resolve, reject) => {
      messageCount++
      let id = messageCount
      let listener = (event: MessageEvent) => {
        let { json, type } = event.data
        if (event.data.id != id || type != 'fetch-result') {
          return
        }
        messageListeners.delete(listener)
        if (json.error) {
          reject(json.error)
        } else {
          resolve(json)
        }
      }
      messageListeners.add(listener)
      proxyWindowPromise.then(proxyWindow => {
        proxyWindow.postMessage({ type: 'fetch', id, url, init }, api_origin)
      })
    })
  }

  function fetchJSON<T>(method: string, url: string, body?: object) {
    if (body) {
      return callAPI<T>(url, {
        method,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
    } else {
      return callAPI<T>(url, {
        method,
        headers: {
          Accept: 'application/json',
        },
      })
    }
  }

  function postForm<T>(url: string, formData: FormData) {
    return callAPI<T>(url, { method: 'POST', body: formData })
  }

  function startLoop(options: {
    loop(): LoopResult | Promise<LoopResult>
    /**
     * @description default 1000
     */
    loop_interval?: number
    /**
     * @description default 3500
     */
    error_retry_interval?: number
  }) {
    let loop_interval = options.loop_interval || 1000
    let error_retry_interval = options.error_retry_interval || 3500

    async function loop() {
      if (win._frame_iteration_ != current_iteration) {
        stopIteration('loop()')
        return
      }
      try {
        let result = await options.loop()
        if (result == 'stop') {
          return
        }
        setTimeout(loop, loop_interval)
      } catch (error) {
        console.error('loop error:', error)
        setTimeout(loop, error_retry_interval)
      }
    }

    loop()
  }

  return {
    proxyWindowPromise,
    callAPI,
    fetchJSON,
    postForm,
    startLoop,
  }
}

export type ImageMimeType = 'image/png' | 'image/jpeg' | 'image/webp'

export async function imageToDataUrl(
  img: HTMLImageElement,
  /** @description default is as-is for image with dataUrl, and "image/png" for image with src */
  mimeType?: ImageMimeType,
  /** @description between 0 and 1 */
  quality?: number,
): Promise<string> {
  if (
    mimeType
      ? img.src.startsWith('data:' + mimeType)
      : img.src.startsWith('data:')
  ) {
    return img.src
  }
  try {
    let canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    let context = canvas.getContext('2d')!
    context.drawImage(img, 0, 0)
    let dataUrl = canvas.toDataURL(mimeType, quality)
    return dataUrl
  } catch (error) {
    let res = await fetch(img.src)
    let blob = await res.blob()
    let reader = new FileReader()
    return new Promise<string>((resolve, reject) => {
      reader.onload = () => {
        let image = new Image()
        image.onload = () => {
          imageToDataUrl(image).then(resolve).catch(reject)
        }
        image.onerror = reject
        image.src = reader.result as string
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }
}
