import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePaletteStore } from '../stores/palette'

type Store = ReturnType<typeof usePaletteStore>

const color = (x: number, y: number) => ({
  r: 0,
  g: 0,
  b: 0,
  hex: '#000000',
  hsl: { h: 0, s: 0, l: 0 },
  position: { x, y },
})

// Without a loaded image the store skips re-sampling, so these tests cover
// the history itself: positions and adjustments in, the same values back out.
function setup(): Store {
  const store = usePaletteStore()
  store.colors = [color(1, 1), color(2, 2)]
  store.resetHistory()
  return store
}

function movePoint(store: Store, index: number, x: number, y: number) {
  store.colors[index] = color(x, y)
  store.commitHistory()
}

describe('palette store - undo/redo', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with nothing to undo or redo', () => {
    const store = setup()
    expect(store.canUndo).toBe(false)
    expect(store.canRedo).toBe(false)
  })

  it('undoes and redoes a moved color point', () => {
    const store = setup()
    movePoint(store, 0, 10, 20)
    expect(store.canUndo).toBe(true)

    store.undo()
    expect(store.colors[0].position).toEqual({ x: 1, y: 1 })
    expect(store.canRedo).toBe(true)

    store.redo()
    expect(store.colors[0].position).toEqual({ x: 10, y: 20 })
    expect(store.canRedo).toBe(false)
  })

  it('does not record a step when nothing changed', () => {
    const store = setup()
    store.commitHistory()
    expect(store.canUndo).toBe(false)
  })

  it('merges quick ticks of one slider into a single step', () => {
    const store = setup()
    store.setImageAdjustment('brightness', 110)
    vi.advanceTimersByTime(100)
    store.setImageAdjustment('brightness', 120)
    vi.advanceTimersByTime(100)
    store.setImageAdjustment('brightness', 130)

    store.undo()
    expect(store.imageAdjustments.brightness).toBe(100)
    expect(store.canUndo).toBe(false)
  })

  it('keeps separate steps for different sliders and pauses', () => {
    const store = setup()
    store.setImageAdjustment('brightness', 120)
    store.setImageAdjustment('contrast', 80)
    vi.advanceTimersByTime(1000)
    store.setImageAdjustment('contrast', 60)

    store.undo()
    expect(store.imageAdjustments.contrast).toBe(80)
    store.undo()
    expect(store.imageAdjustments.contrast).toBe(100)
    expect(store.imageAdjustments.brightness).toBe(120)
    store.undo()
    expect(store.imageAdjustments.brightness).toBe(100)
  })

  it('leaves zoom out of the history and keeps it on undo', () => {
    const store = setup()
    store.setImageAdjustment('zoom', 200)
    expect(store.canUndo).toBe(false)

    store.setImageAdjustment('saturation', 50)
    store.undo()
    expect(store.imageAdjustments.saturation).toBe(100)
    expect(store.imageAdjustments.zoom).toBe(200)
  })

  it('records resetting all adjustments as one step', () => {
    const store = setup()
    store.setImageAdjustment('hue', 90)
    vi.advanceTimersByTime(1000)
    store.resetImageAdjustments()
    expect(store.imageAdjustments.hue).toBe(0)

    store.undo()
    expect(store.imageAdjustments.hue).toBe(90)
  })

  it('drops the redo branch after a new change', () => {
    const store = setup()
    movePoint(store, 0, 10, 10)
    movePoint(store, 0, 20, 20)
    store.undo()
    movePoint(store, 1, 30, 30)

    expect(store.canRedo).toBe(false)
    store.undo()
    expect(store.colors[0].position).toEqual({ x: 10, y: 10 })
    expect(store.colors[1].position).toEqual({ x: 2, y: 2 })
  })

  it('caps the history at 60 steps', () => {
    const store = setup()
    for (let i = 1; i <= 70; i++) movePoint(store, 0, i, i)
    let steps = 0
    while (store.canUndo) {
      store.undo()
      steps++
    }
    expect(steps).toBe(59)
    expect(store.colors[0].position).toEqual({ x: 11, y: 11 })
  })

  it('a restored state is not changed by later edits', () => {
    const store = setup()
    movePoint(store, 0, 10, 10)
    store.undo()
    store.colors[0].position.x = 99
    store.redo()
    store.undo()
    expect(store.colors[0].position).toEqual({ x: 1, y: 1 })
  })

  it('clearing the image empties the history', () => {
    const store = setup()
    movePoint(store, 0, 10, 10)
    store.clearImage()
    expect(store.canUndo).toBe(false)
    expect(store.canRedo).toBe(false)
    store.commitHistory()
    expect(store.canUndo).toBe(false)
  })
})
