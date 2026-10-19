import { extractDominantColors, type DominantColor } from '../lib/core/dominantColors'

export interface ExtractRequest {
  pixelBuffer: ArrayBuffer
  width: number
  colorCount: number
}

export interface ExtractResponse {
  sorted: DominantColor[]
}

// The project compiles against the DOM library, not the WebWorker one; the
// worker scope offers the same onmessage/postMessage pair as a Worker handle.
const scope = self as unknown as Worker

scope.onmessage = ({ data }: MessageEvent<ExtractRequest>) => {
  const { pixelBuffer, width, colorCount } = data
  const sorted = extractDominantColors(new Uint8ClampedArray(pixelBuffer), width, colorCount)
  scope.postMessage({ sorted } satisfies ExtractResponse)
}
