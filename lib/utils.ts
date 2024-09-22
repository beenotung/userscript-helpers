/**
 * @description async version of setTimeout
 */
export function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}

/**
 * @returns mimetype, e.g. "image/webp"
 */
export function dataUrlToMimeType(dataUrl: string): string {
  // e.g. "data:image/webp;base64,..."
  // e.g. "data:text/html,..."
  if (!dataUrl.startsWith('data:')) {
    throw new Error('invalid dataUrl')
  }
  let index = dataUrl.indexOf(',')
  return dataUrl.slice('data:'.length, index).split(';')[0]
}

/**
 * @return extname without ".", e.g. "webp"
 */
export function dataUrlToExtname(dataUrl: string): string {
  let mimeType = dataUrlToMimeType(dataUrl)
  return mimeType.split('/')[1].split(';')[0]
}
