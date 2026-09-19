/* Test harnesses below define throwaway host components, not real SFCs. */
/* eslint-disable vue/one-component-per-file */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

// Minimal palette entry shaped like makeColor() output.
function color(locked = false) {
  return { base: { r: 120, g: 80, b: 60 }, adj: neutral(), locked }
}
function neutral() {
  return { brightness: 100, contrast: 100, saturation: 100, hue: 0 }
}

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

describe('AdjustmentsPanel - spinner wiring', () => {
  // The spinner's own mechanics (typing, clamping, press-and-hold) live in
  // NumberSpinner.test.ts; what matters here is that the panel hands each
  // field the right range and turns the spinner's value into set-adjust.
  beforeEach(() => vi.resetModules())

  it("gives every adjustment field a spinner with that field's range", async () => {
    const wrapper = await mountPanel()
    const spinners = wrapper.findAllComponents({ name: 'NumberSpinner' })
    expect(spinners).toHaveLength(FIELDS.length)
    for (let i = 0; i < FIELDS.length; i++) {
      expect(spinners[i].props()).toMatchObject({
        modelValue: FIELDS[i].def,
        min: FIELDS[i].min,
        max: FIELDS[i].max,
        step: FIELDS[i].step,
        unit: FIELDS[i].unit,
        disabled: false,
      })
    }
  })

  it('turns a spinner value into set-adjust for its field', async () => {
    const wrapper = await mountPanel()
    const spinners = wrapper.findAllComponents({ name: 'NumberSpinner' })
    await spinners[0].vm.$emit('update:modelValue', 140)
    await spinners[3].vm.$emit('update:modelValue', 200)
    expect(wrapper.emitted('set-adjust')).toEqual([
      ['brightness', 140],
      ['hue', 200],
    ])
  })

  it('the slider keeps emitting its value', async () => {
    const wrapper = await mountPanel()
    const slider = wrapper.findAll('input.adjust-slider')[0]
    ;(slider.element as HTMLInputElement).value = '77'
    await slider.trigger('input')
    expect(wrapper.emitted('set-adjust')).toEqual([['brightness', '77']])
  })

  it('disables the spinners while every targeted color is locked', async () => {
    const wrapper = await mountPanel({ activeLocked: true })
    const spinners = wrapper.findAllComponents({ name: 'NumberSpinner' })
    for (const s of spinners) expect(s.props('disabled')).toBe(true)
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
