import { describe, it, expect, beforeEach } from 'vitest'
import { ref, computed } from 'vue'
import { useCanvasPan } from '../composables/useCanvasPan'

type Store = {
  imageAdjustments: { zoom: number }
  panPosition: { x: number; y: number }
  setImageAdjustment: (prop: string, value: number) => void
  setPanPosition: (x: number, y: number) => void
}

function makeStore(zoom = 100): Store {
  const store: Store = {
    imageAdjustments: { zoom },
    panPosition: { x: 0, y: 0 },
    setImageAdjustment(prop, value) {
      if (prop === 'zoom') store.imageAdjustments.zoom = value
    },
    setPanPosition(x, y) {
      store.panPosition = { x, y }
    },
  }
  return store
}

type PointerInit = {
  pointerId: number
  pointerType?: string
  button?: number
  x: number
  y: number
}

// jsdom has no PointerEvent; the handlers only read these fields.
function pointer(
  type: string,
  { pointerId, pointerType = 'touch', button = 0, x, y }: PointerInit
) {
  const e = new Event(type, { cancelable: true, bubbles: true })
  return Object.assign(e, {
    pointerId,
    pointerType,
    button,
    clientX: x,
    clientY: y,
  }) as unknown as PointerEvent
}

function setup(zoom = 100) {
  const store = makeStore(zoom)
  const rect = { width: 400, height: 300, left: 0, top: 0 } as DOMRect
  const pan = useCanvasPan({
    imageRect: ref(rect),
    containerRect: ref({ ...rect, width: 200, height: 150 } as DOMRect),
    store,
    isDragging: ref(false),
    isZoomed: computed(() => store.imageAdjustments.zoom > 100),
  })
  const down = (init: PointerInit) => pan.startPan(pointer('pointerdown', init))
  const move = (init: PointerInit) => document.dispatchEvent(pointer('pointermove', init))
  const up = (init: PointerInit, type = 'pointerup') => document.dispatchEvent(pointer(type, init))
  return { store, pan, down, move, up }
}

describe('useCanvasPan', () => {
  beforeEach(() => {
    document.body.style.cursor = ''
  })

  it('zooms in when two fingers spread, at 100%', () => {
    const { store, pan, down, move, up } = setup()
    down({ pointerId: 1, x: 100, y: 100 })
    down({ pointerId: 2, x: 120, y: 100 })
    expect(pan.isPinching.value).toBe(true)

    move({ pointerId: 2, x: 140, y: 100 })
    expect(store.imageAdjustments.zoom).toBe(200)

    up({ pointerId: 1, x: 100, y: 100 })
    up({ pointerId: 2, x: 140, y: 100 })
    expect(pan.isPinching.value).toBe(false)
  })

  it('keeps zoom within its limits', () => {
    const { store, down, move } = setup()
    down({ pointerId: 1, x: 0, y: 0 })
    down({ pointerId: 2, x: 10, y: 0 })
    move({ pointerId: 2, x: 1000, y: 0 })
    expect(store.imageAdjustments.zoom).toBe(400)
    move({ pointerId: 2, x: 1, y: 0 })
    expect(store.imageAdjustments.zoom).toBe(25)
  })

  it('does not pan a single pointer at 100%', () => {
    const { store, pan, down, move } = setup()
    down({ pointerId: 1, pointerType: 'mouse', x: 50, y: 50 })
    move({ pointerId: 1, pointerType: 'mouse', x: 80, y: 80 })
    expect(pan.isPanning.value).toBe(false)
    expect(store.panPosition).toEqual({ x: 0, y: 0 })
  })

  it('pans with the mouse when zoomed, but not with the right button', () => {
    const { store, pan, down, move, up } = setup(200)
    down({ pointerId: 1, pointerType: 'mouse', button: 2, x: 50, y: 50 })
    expect(pan.isPanning.value).toBe(false)

    down({ pointerId: 1, pointerType: 'mouse', x: 50, y: 50 })
    expect(document.body.style.cursor).toBe('grabbing')
    move({ pointerId: 1, pointerType: 'mouse', x: 70, y: 60 })
    expect(store.panPosition).toEqual({ x: 10, y: 5 })

    up({ pointerId: 1, pointerType: 'mouse', x: 70, y: 60 })
    expect(pan.isPanning.value).toBe(false)
    expect(document.body.style.cursor).toBe('')
    move({ pointerId: 1, pointerType: 'mouse', x: 200, y: 200 })
    expect(store.panPosition).toEqual({ x: 10, y: 5 })
  })

  it('continues as a pan when one finger of a pinch lifts', () => {
    const { store, pan, down, move, up } = setup(200)
    down({ pointerId: 1, x: 100, y: 100 })
    down({ pointerId: 2, x: 140, y: 100 })
    up({ pointerId: 2, x: 140, y: 100 })
    expect(pan.isPinching.value).toBe(false)
    expect(pan.isPanning.value).toBe(true)

    move({ pointerId: 1, x: 80, y: 100 })
    expect(store.panPosition.x).toBe(-10)
  })

  it('ends everything on pointercancel', () => {
    const { pan, down, up } = setup(200)
    down({ pointerId: 1, x: 100, y: 100 })
    up({ pointerId: 1, x: 100, y: 100 }, 'pointercancel')
    expect(pan.isPanning.value).toBe(false)
  })
})
