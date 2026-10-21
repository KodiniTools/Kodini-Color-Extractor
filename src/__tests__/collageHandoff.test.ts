import { describe, it, expect, beforeEach } from 'vitest'
import { STORAGE_KEY } from '../lib/core/handoff'
import {
  HANDOFF_SOURCE,
  checkIncomingHandoff,
  sendToCollageMaker,
} from '../lib/core/collageHandoff'

// jsdom cannot encode canvases; the handoff only reads these fields.
function fakeCanvas(width: number, height: number) {
  return {
    width,
    height,
    toDataURL: () => `data:image/jpeg;base64,${width}x${height}`,
  } as unknown as HTMLCanvasElement
}

const stored = () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')

describe('collageHandoff', () => {
  beforeEach(() => localStorage.clear())

  it('sends the image and the palette card to the Collage Maker', () => {
    const url = sendToCollageMaker([
      { name: 'image', canvas: fakeCanvas(800, 600) },
      { name: 'palette', canvas: fakeCanvas(400, 120) },
    ])
    expect(url).toBe('/collagemaker/editor?handoff=kodinitools')
    const payload = stored()
    expect(payload.source).toBe(HANDOFF_SOURCE)
    expect(payload.images.map((i: { name: string }) => i.name)).toEqual(['image', 'palette'])
    expect(payload.images[0]).toMatchObject({ width: 800, height: 600 })
  })

  it('sends nothing without an image', () => {
    expect(sendToCollageMaker([])).toBeNull()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('reports a failed write instead of navigating', () => {
    const broken = {
      width: 10,
      height: 10,
      toDataURL: () => {
        throw new Error('tainted')
      },
    } as unknown as HTMLCanvasElement
    expect(sendToCollageMaker([{ name: 'image', canvas: broken }])).toBeNull()
  })

  it('ignores its own outgoing handoff but accepts other tools', () => {
    sendToCollageMaker([{ name: 'image', canvas: fakeCanvas(10, 10) }])
    expect(checkIncomingHandoff()).toBeNull()

    const images = [{ name: 'a', dataUrl: 'data:image/jpeg;base64,AAAA', width: 1, height: 1 }]
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ source: 'bildkonverter', timestamp: Date.now(), images })
    )
    expect(checkIncomingHandoff()).toMatchObject({ source: 'bildkonverter', images })
  })

  it('ignores a broken payload', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    expect(checkIncomingHandoff()).toBeNull()
  })
})
