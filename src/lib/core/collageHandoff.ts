import { checkHandoff, prepareHandoff } from './handoff'

/** How this tool names itself in a handoff payload. */
export const HANDOFF_SOURCE = 'color-extractor'

/** Display names of the tools that send images here; unknown ids are shown as sent. */
const SOURCE_LABELS: Record<string, string> = {
  bildergalerie: 'Bildergalerie',
  bildkonverter: 'Bildkonverter',
  collagemaker: 'Collage Maker',
  'bilder-batchbearbeitung': 'Bilder-Batchbearbeitung',
}

export function handoffSourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? source
}

/**
 * The pending handoff another tool left for this one, or null. A payload this
 * tool wrote itself (sent to the Collage Maker but not picked up there) does
 * not count, or coming back would open the gallery with our own images.
 */
export function checkIncomingHandoff(): ReturnType<typeof checkHandoff> {
  const data = checkHandoff()
  return data && data.source !== HANDOFF_SOURCE ? data : null
}

/**
 * Writes the canvases to the shared handoff slot for the Collage Maker.
 * Returns the Collage Maker URL to open, or null when there is nothing to
 * send or the browser refused to store it.
 */
export function sendToCollageMaker(
  canvases: { name: string; canvas: HTMLCanvasElement }[]
): string | null {
  if (!canvases.length) return null
  return prepareHandoff(canvases, 'collagemaker', HANDOFF_SOURCE)
}
