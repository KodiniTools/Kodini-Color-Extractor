import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  filesToGalleryImages,
  galleryImageName,
  isGalleryImageFile,
} from '../lib/core/galleryUpload'

// jsdom decodes no images: report a fixed size for every data URL that loads.
class FakeImage {
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  naturalWidth = 640
  naturalHeight = 480
  set src(value: string) {
    queueMicrotask(() => (value.startsWith('data:image/') ? this.onload?.() : this.onerror?.()))
  }
}

const file = (name: string, type: string) => new File(['x'], name, { type })

describe('galleryUpload', () => {
  beforeEach(() => vi.stubGlobal('Image', FakeImage))
  afterEach(() => vi.unstubAllGlobals())

  it('accepts raster images and rejects SVG and other files', () => {
    expect(isGalleryImageFile(file('a.jpg', 'image/jpeg'))).toBe(true)
    expect(isGalleryImageFile(file('a.webp', 'image/webp'))).toBe(true)
    expect(isGalleryImageFile(file('a.svg', 'image/svg+xml'))).toBe(false)
    expect(isGalleryImageFile(file('a.pdf', 'application/pdf'))).toBe(false)
  })

  it('uses the file name without extension as card title', () => {
    expect(galleryImageName('Urlaub 2026.final.jpg')).toBe('Urlaub 2026.final')
    expect(galleryImageName('ohne-endung')).toBe('ohne-endung')
    expect(galleryImageName('.jpg')).toBe('.jpg')
  })

  it('reads several files in order and counts the skipped ones', async () => {
    const { images, skipped } = await filesToGalleryImages([
      file('eins.png', 'image/png'),
      file('notiz.txt', 'text/plain'),
      file('zwei.jpg', 'image/jpeg'),
    ])
    expect(images.map((img) => img.name)).toEqual(['eins', 'zwei'])
    expect(images[0]).toMatchObject({ width: 640, height: 480 })
    expect(images[0].dataUrl).toMatch(/^data:image\/png;base64,/)
    expect(skipped).toBe(1)
  })
})
