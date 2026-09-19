import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'

// Mirrors HOLD_DELAY in NumberSpinner.vue.
const HOLD_DELAY = 400

async function mountSpinner(props: Record<string, unknown> = {}) {
  const { default: NumberSpinner } = await import('../components/ui/NumberSpinner.vue')
  return mount(NumberSpinner, {
    props: { modelValue: 100, min: 0, max: 200, step: 1, unit: '%', label: 'Brightness', ...props },
  })
}

/**
 * Feeds the emitted value back into the prop, the way a v-model parent does.
 * Without it a held arrow would re-step a frozen value forever.
 */
function live(wrapper: VueWrapper) {
  return {
    async tick(ms: number) {
      vi.advanceTimersByTime(ms)
      // Untyped lookup: a bare VueWrapper types emitted() keys as never.
      const all = wrapper.emitted() as Record<string, unknown[][]>
      const events = all['update:modelValue'] || []
      const last = events[events.length - 1]
      if (last) await wrapper.setProps({ modelValue: last[0] as number })
    },
    value: () => (wrapper.props() as Record<string, unknown>).modelValue as number,
  }
}

const input = (w: VueWrapper) => w.find('input.spin-input')
const arrows = (w: VueWrapper) => w.findAll('.spin-arrow')

async function type(w: VueWrapper, value: string) {
  ;(input(w).element as HTMLInputElement).value = value
  await input(w).trigger('input')
}

describe('NumberSpinner - value entry', () => {
  beforeEach(() => vi.resetModules())

  it('renders the value, the unit and both arrows', async () => {
    const w = await mountSpinner()
    expect((input(w).element as HTMLInputElement).value).toBe('100')
    expect(w.find('.spin-unit').text()).toBe('%')
    expect(arrows(w)).toHaveLength(2)
  })

  it('applies every keystroke live, clamped to the range', async () => {
    const w = await mountSpinner()
    await type(w, '150')
    await type(w, '') // cleared field: nothing to apply yet
    await type(w, '999') // above max: applied as the maximum
    expect(w.emitted('update:modelValue')).toEqual([[150], [200]])
  })

  it('keeps the typed text while the value follows clamped', async () => {
    const w = await mountSpinner()
    const el = input(w).element as HTMLInputElement
    await type(w, '1005')
    expect(w.emitted('update:modelValue')).toEqual([[200]])
    await w.setProps({ modelValue: 200 })
    expect(el.value).toBe('1005') // caret is not yanked around
    await input(w).trigger('blur')
    expect(el.value).toBe('200')
  })

  it('drops the typed text when the value changes from outside', async () => {
    const w = await mountSpinner()
    const el = input(w).element as HTMLInputElement
    await type(w, '1005')
    await w.setProps({ modelValue: 200 }) // parent applied the clamped value
    expect(el.value).toBe('1005') // still the caret's text
    await w.setProps({ modelValue: 100 }) // reset button / slider / undo
    expect(el.value).toBe('100') // stale draft dropped
  })

  it('restores the model value when the field is left empty', async () => {
    const w = await mountSpinner({ modelValue: 140 })
    const el = input(w).element as HTMLInputElement
    el.value = ''
    await input(w).trigger('blur')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(el.value).toBe('140')
  })

  it('snaps typed values onto a fractional step grid', async () => {
    const w = await mountSpinner({ modelValue: 0, min: 0, max: 8, step: 0.5, unit: 'px' })
    await type(w, '2.3') // nearest 0.5 step is 2.5
    await type(w, '2.8') // nearest 0.5 step is 3
    expect(w.emitted('update:modelValue')).toEqual([[2.5], [3]])
  })

  it('snaps typed values onto a coarse step grid', async () => {
    const w = await mountSpinner({ modelValue: 100, min: 25, max: 400, step: 5 })
    await type(w, '137')
    expect(w.emitted('update:modelValue')).toEqual([[135]])
  })

  it('supports a negative range', async () => {
    const w = await mountSpinner({ modelValue: 0, min: -180, max: 180 })
    await type(w, '-90')
    await type(w, '-999')
    expect(w.emitted('update:modelValue')).toEqual([[-90], [-180]])
  })
})

describe('NumberSpinner - arrows', () => {
  beforeEach(() => vi.resetModules())

  it('steps by one unit on press', async () => {
    const w = await mountSpinner()
    await arrows(w)[0].trigger('pointerdown')
    await arrows(w)[0].trigger('pointerup')
    expect(w.emitted('update:modelValue')).toEqual([[101]])
  })

  it('steps by the step size, not by one', async () => {
    const w = await mountSpinner({ modelValue: 100, min: 25, max: 400, step: 5 })
    await arrows(w)[0].trigger('pointerdown')
    await arrows(w)[0].trigger('pointerup')
    expect(w.emitted('update:modelValue')).toEqual([[105]])
  })

  it('keeps fractional steps exact', async () => {
    const w = await mountSpinner({ modelValue: 0, min: 0, max: 8, step: 0.5 })
    await arrows(w)[0].trigger('pointerdown')
    await arrows(w)[0].trigger('pointerup')
    expect(w.emitted('update:modelValue')).toEqual([[0.5]])
  })

  it('disables the arrows at the ends of the range', async () => {
    const max = await mountSpinner({ modelValue: 200 })
    expect(arrows(max)[0].attributes('disabled')).toBeDefined()
    const min = await mountSpinner({ modelValue: 0 })
    expect(arrows(min)[1].attributes('disabled')).toBeDefined()
  })

  it('a short press does not auto-repeat', async () => {
    vi.useFakeTimers()
    try {
      const w = await mountSpinner()
      await arrows(w)[0].trigger('pointerdown')
      vi.advanceTimersByTime(200)
      await arrows(w)[0].trigger('pointerup')
      vi.advanceTimersByTime(3000)
      expect(w.emitted('update:modelValue')).toHaveLength(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('holding repeats slowly at first, then accelerates', async () => {
    vi.useFakeTimers()
    try {
      const w = await mountSpinner({ modelValue: 0, min: -180, max: 180 })
      const parent = live(w)
      const up = arrows(w)[0]

      await up.trigger('pointerdown')
      await parent.tick(0)
      expect(parent.value()).toBe(1)

      await parent.tick(HOLD_DELAY - 20)
      expect(parent.value()).toBe(1) // initial pause, a click never repeats

      await parent.tick(20)
      const slowStart = parent.value()
      for (let i = 0; i < 3; i++) await parent.tick(140)
      const slowGain = parent.value() - slowStart
      expect(slowGain).toBeGreaterThan(0)
      expect(slowGain).toBeLessThanOrEqual(4) // still nudging

      for (let i = 0; i < 60; i++) await parent.tick(40) // into the fast phase
      const fastStart = parent.value()
      for (let i = 0; i < 10; i++) await parent.tick(40)
      expect(parent.value() - fastStart).toBeGreaterThan(slowGain * 3)

      await up.trigger('pointerup')
      const settled = parent.value()
      await parent.tick(5000)
      expect(parent.value()).toBe(settled)
    } finally {
      vi.useRealTimers()
    }
  })

  it('stops the repeat once the value reaches the limit', async () => {
    vi.useFakeTimers()
    try {
      const w = await mountSpinner({ modelValue: 0, min: 0, max: 200 })
      const parent = live(w)
      await arrows(w)[0].trigger('pointerdown')
      for (let i = 0; i < 400; i++) await parent.tick(40)
      expect(parent.value()).toBe(200)
      await arrows(w)[0].trigger('pointerup')
    } finally {
      vi.useRealTimers()
    }
  })

  it('a release outside the button still ends the hold', async () => {
    vi.useFakeTimers()
    try {
      const w = await mountSpinner({ modelValue: 0, min: -180, max: 180 })
      const parent = live(w)
      await arrows(w)[0].trigger('pointerdown')
      for (let i = 0; i < 10; i++) await parent.tick(140)
      expect(parent.value()).toBeGreaterThan(1)

      window.dispatchEvent(new Event('pointerup')) // released somewhere else
      const settled = parent.value()
      for (let i = 0; i < 10; i++) await parent.tick(140)
      expect(parent.value()).toBe(settled)
    } finally {
      vi.useRealTimers()
    }
  })

  it('does nothing at all while disabled', async () => {
    const w = await mountSpinner({ disabled: true })
    expect(input(w).attributes('disabled')).toBeDefined()
    await arrows(w)[0].trigger('pointerdown')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })
})
