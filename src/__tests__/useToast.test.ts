import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.resetModules()
  })

  it('adds a toast with show()', async () => {
    const { useToast } = await import('../composables/useToast')
    const toast = useToast()
    const initialCount = toast.toasts.value.length
    toast.show('Hello', 'success', 9999)
    expect(toast.toasts.value.length).toBe(initialCount + 1)
    const t = toast.toasts.value.find(t => t.message === 'Hello')
    expect(t).toBeDefined()
    expect(t!.type).toBe('success')
  })

  it('removes toast after duration elapses', async () => {
    const { useToast } = await import('../composables/useToast')
    const toast = useToast()
    toast.show('Temp', 'info', 1000)
    expect(toast.toasts.value.some(t => t.message === 'Temp')).toBe(true)
    vi.advanceTimersByTime(1100)
    expect(toast.toasts.value.some(t => t.message === 'Temp')).toBe(false)
  })

  it('removes toast by id', async () => {
    const { useToast } = await import('../composables/useToast')
    const toast = useToast()
    const id = toast.show('Removable', 'error', 9999)
    expect(toast.toasts.value.some(t => t.id === id)).toBe(true)
    toast.remove(id)
    expect(toast.toasts.value.some(t => t.id === id)).toBe(false)
  })

  it('success() creates success toast', async () => {
    const { useToast } = await import('../composables/useToast')
    const toast = useToast()
    toast.success('All good', 9999)
    const t = toast.toasts.value.find(t => t.message === 'All good')
    expect(t?.type).toBe('success')
  })

  it('error() creates error toast', async () => {
    const { useToast } = await import('../composables/useToast')
    const toast = useToast()
    toast.error('Oops', 9999)
    const t = toast.toasts.value.find(t => t.message === 'Oops')
    expect(t?.type).toBe('error')
  })

  it('info() creates info toast', async () => {
    const { useToast } = await import('../composables/useToast')
    const toast = useToast()
    toast.info('FYI', 9999)
    const t = toast.toasts.value.find(t => t.message === 'FYI')
    expect(t?.type).toBe('info')
  })

  it('show() returns a numeric id', async () => {
    const { useToast } = await import('../composables/useToast')
    const toast = useToast()
    const id = toast.show('Test', 'success', 9999)
    expect(typeof id).toBe('number')
  })

  it('multiple toasts can exist simultaneously', async () => {
    const { useToast } = await import('../composables/useToast')
    const toast = useToast()
    const before = toast.toasts.value.length
    toast.show('A', 'success', 9999)
    toast.show('B', 'error', 9999)
    expect(toast.toasts.value.length).toBeGreaterThanOrEqual(before + 2)
  })
})
