import type { HandoffImage } from '../../stores/handoff'

/** Raster images only: SVG can carry scripts and has no fixed pixel size. */
export function isGalleryImageFile(file: File): boolean {
  return file.type.startsWith('image/') && file.type !== 'image/svg+xml'
}

/** The file name without its extension, as the gallery card title. */
export function galleryImageName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '')
  return base || fileName || 'image'
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error('read failed'))
    reader.readAsDataURL(file)
  })
}

function imageSize(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => reject(new Error('decode failed'))
    img.src = dataUrl
  })
}

/** Reads one uploaded file into a gallery entry; rejects when it is not a decodable image. */
export async function fileToGalleryImage(file: File): Promise<HandoffImage> {
  if (!isGalleryImageFile(file)) throw new Error('not an image')
  const dataUrl = await readAsDataUrl(file)
  const { width, height } = await imageSize(dataUrl)
  return { name: galleryImageName(file.name), dataUrl, width, height }
}

/**
 * Reads all files, skipping the ones that are not images or fail to load.
 * Returns the gallery entries in file order and how many files were skipped.
 */
export async function filesToGalleryImages(
  files: Iterable<File>
): Promise<{ images: HandoffImage[]; skipped: number }> {
  const results = await Promise.allSettled([...files].map(fileToGalleryImage))
  const images = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []))
  return { images, skipped: results.length - images.length }
}
