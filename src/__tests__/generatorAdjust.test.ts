/* Test harnesses below define throwaway host components, not real SFCs. */
/* eslint-disable vue/one-component-per-file */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { defineComponent, h, reactive } from 'vue'
import { mount, type DOMWrapper } from '@vue/test-utils'

// Minimal palette entry shaped like makeColor() output.
function color(locked = false) {
  return { base: { r: 120, g: 80, b: 60 }, adj: neutral(), locked }
}
function neutral() {
  return { brightness: 100, contrast: 100, saturation: 100, hue: 0 }
}

// Mirrors HOLD_DELAY in AdjustmentsPanel.vue.
const HOLD_DELAY = 400

const FIELDS = [
  { key: 'brightness', min: 0, max: 200, step: 1, unit: '%', def: 100 },
  { key: 'contrast', min: 0, max: 200, step: 1, unit: '%', def: 100 },
  { key: 'saturation', min: 0, max: 200, step: 1, unit: '%', def: 100 },
  { key: 'hue', min: 0, max: 360, step: 1, unit: '°', def: 0 },
]

async function mountPanel(overrides: Record<string, unknown> = {}) {
  const { default: AdjustmentsPanel } =
    await import('../components/features/generator/AdjustmentsPanel.vue')
  return mount(AdjustmentsPanel, {
    props: {
      palette: [color(), color()],
      scope: 'all',
      selectedCount: 0,
      anyLocked: false,
      activeAdjust: neutral(),
      activeLocked: false,
      canPick: false,
      pickerHex: '#000000',
      hasActiveAdjust: false,
      adjustFields: FIELDS,
      isSelected: () => false,
      canUndo: false,
      canRedo: false,
      ...overrides,
    },
  })
}

// Mounts the panel under a parent that writes back what it emits, so a
// press-and-hold walks a real value instead of re-stepping a frozen prop.
async function mountLive(initial: Record<string, number> = neutral()) {
  const { default: AdjustmentsPanel } =
    await import('../components/features/generator/AdjustmentsPanel.vue')
  const state = reactive(initial)
  const Parent = defineComponent({
    setup() {
      return () =>
        h(AdjustmentsPanel, {
          palette: [color(), color()],
          scope: 'all',
          selectedCount: 0,
          anyLocked: false,
          activeAdjust: state,
          activeLocked: false,
          canPick: false,
          pickerHex: '#000000',
          hasActiveAdjust: false,
          adjustFields: FIELDS,
          isSelected: () => false,
          canUndo: false,
          canRedo: false,
          onSetAdjust: (key: string, value: number | string) => {
            state[key] = Number(value)
          },
        })
    },
  })
  return { wrapper: mount(Parent), state }
}

describe('colorGenerator - ADJUST_FIELDS / clampAdjust', () => {
  beforeEach(() => vi.resetModules())

  it('every field carries range, step, unit and neutral default', async () => {
    const { ADJUST_FIELDS, neutralAdjust } = await import('../lib/core/colorGenerator')
    const defaults = neutralAdjust()
    expect(ADJUST_FIELDS).toHaveLength(4)
    for (const f of ADJUST_FIELDS) {
      expect(typeof f.min).toBe('number')
      expect(typeof f.max).toBe('number')
      expect(f.step).toBeGreaterThan(0)
      expect(f.unit.length).toBeGreaterThan(0)
      // The per-field reset target must match the neutral adjustment object.
      expect(f.def).toBe(defaults[f.key as keyof typeof defaults])
    }
  })

  it('clamps values into the field range and rounds to whole units', async () => {
    const { clampAdjust } = await import('../lib/core/colorGenerator')
    expect(clampAdjust('brightness', 250)).toBe(200)
    expect(clampAdjust('brightness', -20)).toBe(0)
    expect(clampAdjust('brightness', '140')).toBe(140)
    expect(clampAdjust('brightness', 140.6)).toBe(141)
    expect(clampAdjust('hue', 400)).toBe(360)
  })

  it('returns null for unknown fields and non-numeric input', async () => {
    const { clampAdjust } = await import('../lib/core/colorGenerator')
    expect(clampAdjust('nope', 10)).toBeNull()
    expect(clampAdjust('brightness', '')).toBeNull()
    expect(clampAdjust('brightness', 'abc')).toBeNull()
    expect(clampAdjust('brightness', NaN)).toBeNull()
  })
})

describe('AdjustmentsPanel - number spinner', () => {
  beforeEach(() => vi.resetModules())

  it('renders one number input per adjustment field', async () => {
    const wrapper = await mountPanel()
    const inputs = wrapper.findAll('input.adjust-spin-input')
    expect(inputs).toHaveLength(FIELDS.length)
    expect((inputs[0].element as HTMLInputElement).value).toBe('100')
    expect(inputs[0].attributes('min')).toBe('0')
    expect(inputs[0].attributes('max')).toBe('200')
  })

  it('the arrows step the value by one unit on press', async () => {
    const wrapper = await mountPanel()
    const arrows = wrapper.findAll('.adjust-field')[0].findAll('.adjust-spin-arrow')
    await arrows[0].trigger('pointerdown') // up
    await arrows[0].trigger('pointerup')
    await arrows[1].trigger('pointerdown') // down
    await arrows[1].trigger('pointerup')
    expect(wrapper.emitted('set-adjust')).toEqual([
      ['brightness', 101],
      ['brightness', 99],
    ])
  })

  it('a short press does not auto-repeat', async () => {
    vi.useFakeTimers()
    try {
      const wrapper = await mountPanel()
      const up = wrapper.findAll('.adjust-spin-arrow')[0]
      await up.trigger('pointerdown')
      vi.advanceTimersByTime(200) // released before the repeat delay is up
      await up.trigger('pointerup')
      vi.advanceTimersByTime(3000)
      expect(wrapper.emitted('set-adjust')).toHaveLength(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('disables the arrows at the ends of the range', async () => {
    const wrapper = await mountPanel({
      activeAdjust: { brightness: 200, contrast: 0, saturation: 100, hue: 0 },
    })
    const fields = wrapper.findAll('.adjust-field')
    const up = fields[0].findAll('.adjust-spin-arrow')[0]
    const down = fields[1].findAll('.adjust-spin-arrow')[1]
    expect(up.attributes('disabled')).toBeDefined()
    expect(down.attributes('disabled')).toBeDefined()
    await up.trigger('pointerdown')
    await down.trigger('pointerdown')
    expect(wrapper.emitted('set-adjust')).toBeUndefined()
  })

  it('holding an arrow repeats slowly at first, then accelerates', async () => {
    vi.useFakeTimers()
    try {
      const { wrapper, state } = await mountLive()
      // Hue (0-360) leaves room for the fast phase without hitting the limit.
      const up = wrapper.findAll('.adjust-field')[3].findAll('.adjust-spin-arrow')[0]

      await up.trigger('pointerdown')
      expect(state.hue).toBe(1) // one step on press

      // The initial pause: a press that is not held changes nothing more.
      vi.advanceTimersByTime(HOLD_DELAY - 20)
      expect(state.hue).toBe(1)

      vi.advanceTimersByTime(20)
      const slowStart = state.hue
      vi.advanceTimersByTime(420)
      const slowGain = state.hue - slowStart

      // Keep holding into the fast phase, then measure the same time window.
      vi.advanceTimersByTime(2200)
      const fastStart = state.hue
      vi.advanceTimersByTime(420)
      const fastGain = state.hue - fastStart

      expect(slowGain).toBeGreaterThan(0)
      expect(slowGain).toBeLessThanOrEqual(4) // still nudging, ~1 per 140ms
      expect(fastGain).toBeGreaterThan(slowGain * 3)

      // Releasing stops it for good.
      await up.trigger('pointerup')
      const settled = state.hue
      vi.advanceTimersByTime(5000)
      expect(state.hue).toBe(settled)
    } finally {
      vi.useRealTimers()
    }
  })

  it('stops the repeat once the value reaches the limit', async () => {
    vi.useFakeTimers()
    try {
      const { wrapper, state } = await mountLive()
      const up = wrapper.findAll('.adjust-field')[0].findAll('.adjust-spin-arrow')[0]
      await up.trigger('pointerdown')
      vi.advanceTimersByTime(20000) // hold far longer than the range needs
      expect(state.brightness).toBe(200) // clamped, and the timer stopped there
      await up.trigger('pointerup')
    } finally {
      vi.useRealTimers()
    }
  })

  it('a release outside the button still ends the hold', async () => {
    vi.useFakeTimers()
    try {
      const { wrapper, state } = await mountLive()
      const up = wrapper.findAll('.adjust-field')[3].findAll('.adjust-spin-arrow')[0]
      await up.trigger('pointerdown')
      vi.advanceTimersByTime(HOLD_DELAY + 300)
      expect(state.hue).toBeGreaterThan(1)
      // Pointer released somewhere else on the page.
      window.dispatchEvent(new Event('pointerup'))
      const settled = state.hue
      vi.advanceTimersByTime(3000)
      expect(state.hue).toBe(settled)
    } finally {
      vi.useRealTimers()
    }
  })

  // wrapper.setValue() fires input AND change; typing only fires input, so the
  // two paths are driven explicitly here.
  async function type(input: DOMWrapper<Element>, value: string) {
    ;(input.element as HTMLInputElement).value = value
    await input.trigger('input')
  }

  it('applies every keystroke live, clamped to the field range', async () => {
    const wrapper = await mountPanel()
    const input = wrapper.findAll('input.adjust-spin-input')[0]
    await type(input, '150')
    await type(input, '') // cleared field: nothing to apply yet
    await type(input, '999') // above max: applied as the maximum, live
    expect(wrapper.emitted('set-adjust')).toEqual([
      ['brightness', 150],
      ['brightness', 200],
    ])
  })

  it('keeps the typed text while the palette follows the clamped value', async () => {
    const wrapper = await mountPanel()
    const input = wrapper.findAll('input.adjust-spin-input')[0]
    const el = input.element as HTMLInputElement
    await type(input, '1005')
    // Palette went live to the maximum...
    expect(wrapper.emitted('set-adjust')).toEqual([['brightness', 200]])
    // ...but the caret is not yanked around: the field still shows what was typed.
    await wrapper.setProps({
      activeAdjust: { brightness: 200, contrast: 100, saturation: 100, hue: 0 },
    })
    expect(el.value).toBe('1005')
    // Leaving the field snaps it to the value the palette holds.
    await input.trigger('blur')
    expect(el.value).toBe('200')
  })

  it('the arrows and the slider take the field out of typing mode', async () => {
    const wrapper = await mountPanel()
    const field = wrapper.findAll('.adjust-field')[0]
    const input = field.find('input.adjust-spin-input')
    const el = input.element as HTMLInputElement

    await type(input, '1005')
    await field.findAll('.adjust-spin-arrow')[1].trigger('pointerdown')
    await field.findAll('.adjust-spin-arrow')[1].trigger('pointerup')
    expect(el.value).toBe('100') // model value, not the stale draft

    await type(input, '1005')
    const slider = field.find('input.adjust-slider')
    ;(slider.element as HTMLInputElement).value = '120'
    await slider.trigger('input')
    expect(el.value).toBe('100')
  })

  it('clamps an out-of-range value on change and resyncs the field', async () => {
    const wrapper = await mountPanel()
    const input = wrapper.findAll('input.adjust-spin-input')[0]
    const el = input.element as HTMLInputElement
    el.value = '999'
    await input.trigger('change')
    expect(wrapper.emitted('set-adjust')).toEqual([['brightness', 200]])

    // Parent applied the clamped value: committing 999 again changes nothing,
    // but the field still has to snap back to what the model holds.
    await wrapper.setProps({
      activeAdjust: { brightness: 200, contrast: 100, saturation: 100, hue: 0 },
    })
    el.value = '999'
    await input.trigger('change')
    expect(wrapper.emitted('set-adjust')).toHaveLength(1)
    expect(el.value).toBe('200')
  })

  it('the slider keeps emitting its value', async () => {
    const wrapper = await mountPanel()
    const slider = wrapper.findAll('input.adjust-slider')[0]
    ;(slider.element as HTMLInputElement).value = '77'
    await slider.trigger('input')
    expect(wrapper.emitted('set-adjust')).toEqual([['brightness', '77']])
  })

  it('restores the model value when the field is left empty', async () => {
    const wrapper = await mountPanel({
      activeAdjust: { brightness: 140, contrast: 100, saturation: 100, hue: 0 },
    })
    const input = wrapper.findAll('input.adjust-spin-input')[0]
    const el = input.element as HTMLInputElement
    el.value = ''
    await input.trigger('blur')
    expect(wrapper.emitted('set-adjust')).toBeUndefined()
    expect(el.value).toBe('140')
  })

  it('disables the spinner while every targeted color is locked', async () => {
    const wrapper = await mountPanel({ activeLocked: true })
    const input = wrapper.findAll('input.adjust-spin-input')[0]
    expect(input.attributes('disabled')).toBeDefined()
    await wrapper.findAll('.adjust-spin-arrow')[0].trigger('click')
    expect(wrapper.emitted('set-adjust')).toBeUndefined()
  })
})

describe('AdjustmentsPanel - per-field reset', () => {
  beforeEach(() => vi.resetModules())

  it('is disabled while the field sits at its neutral value', async () => {
    const wrapper = await mountPanel()
    const buttons = wrapper.findAll('.adjust-field-reset')
    expect(buttons).toHaveLength(FIELDS.length)
    for (const b of buttons) expect(b.attributes('disabled')).toBeDefined()
  })

  it('enables and emits reset-field only for the modified field', async () => {
    const wrapper = await mountPanel({
      activeAdjust: { brightness: 140, contrast: 100, saturation: 100, hue: 0 },
    })
    const buttons = wrapper.findAll('.adjust-field-reset')
    expect(buttons[0].attributes('disabled')).toBeUndefined()
    expect(buttons[0].classes()).toContain('adjust-field-reset--active')
    expect(buttons[1].attributes('disabled')).toBeDefined()

    await buttons[0].trigger('click')
    expect(wrapper.emitted('reset-field')).toEqual([['brightness']])
  })

  it('stays disabled for locked colors', async () => {
    const wrapper = await mountPanel({
      activeAdjust: { brightness: 140, contrast: 100, saturation: 100, hue: 0 },
      activeLocked: true,
    })
    expect(wrapper.findAll('.adjust-field-reset')[0].attributes('disabled')).toBeDefined()
  })
})

describe('useColorGenerator - resetAdjustField', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  async function setup() {
    const { useColorGenerator } = await import('../composables/useColorGenerator')
    let api: ReturnType<typeof useColorGenerator>
    const wrapper = mount(
      defineComponent({
        setup() {
          api = useColorGenerator()
          return () => h('div')
        },
      })
    )
    return { api: api!, wrapper }
  }

  it('resets only the given field and leaves the others alone', async () => {
    const { api } = await setup()
    api.setAdjust('brightness', 140)
    api.setAdjust('hue', 90)
    api.resetAdjustField('brightness')

    expect(api.activeAdjust.value.brightness).toBe(100)
    expect(api.activeAdjust.value.hue).toBe(90)
    for (const c of api.palette.value) {
      expect(c.adj.brightness).toBe(100)
      expect(c.adj.hue).toBe(90)
    }
    expect(api.hasActiveAdjust.value).toBe(true)
  })

  it('ignores an unknown field key', async () => {
    const { api } = await setup()
    api.setAdjust('contrast', 130)
    api.resetAdjustField('nope')
    expect(api.activeAdjust.value.contrast).toBe(130)
  })

  it('leaves locked colors untouched', async () => {
    const { api } = await setup()
    api.setAdjust('brightness', 140)
    api.toggleLock(0)
    api.resetAdjustField('brightness')
    expect(api.palette.value[0].adj.brightness).toBe(140)
    expect(api.palette.value[1].adj.brightness).toBe(100)
  })

  it('setAdjust clamps values coming from the spinner', async () => {
    const { api } = await setup()
    api.setAdjust('brightness', 999)
    expect(api.activeAdjust.value.brightness).toBe(200)
    api.setAdjust('brightness', '')
    expect(api.activeAdjust.value.brightness).toBe(200)
    api.setAdjust('hue', -30)
    expect(api.activeAdjust.value.hue).toBe(0)
  })

  it('a per-field reset is undoable', async () => {
    const { api } = await setup()
    api.setAdjust('brightness', 140)
    api.resetAdjustField('brightness')
    expect(api.activeAdjust.value.brightness).toBe(100)
    api.undo()
    expect(api.activeAdjust.value.brightness).toBe(140)
  })
})
