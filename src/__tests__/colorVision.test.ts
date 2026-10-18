import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import {
  CONFUSION_DELTA_E,
  VISION_TYPES,
  colorVisionReport,
  deltaE,
  simulateColorVision,
} from '../lib/core/colorVision'
import ColorVisionDialog from '../components/ColorVisionDialog.vue'

describe('colorVision - simulation', () => {
  it('leaves black and white unchanged for every type', () => {
    for (const type of VISION_TYPES) {
      expect(simulateColorVision('#000000', type)).toBe('#000000')
      expect(simulateColorVision('#FFFFFF', type)).toBe('#FFFFFF')
    }
  })

  it('turns everything grey for achromatopsia, keeping luminance', () => {
    expect(simulateColorVision('#FF0000', 'achromatopsia')).toBe('#7F7F7F')
    const out = simulateColorVision('#2A9D8F', 'achromatopsia')!
    expect(out.slice(1, 3)).toBe(out.slice(3, 5))
    expect(out.slice(3, 5)).toBe(out.slice(5, 7))
  })

  it('maps red and green towards the same yellow axis for red-green types', () => {
    for (const type of ['protanopia', 'deuteranopia']) {
      const red = simulateColorVision('#FF0000', type)!
      const green = simulateColorVision('#00FF00', type)!
      // Red and green channels close, blue far below both: a yellow/olive hue.
      for (const hex of [red, green]) {
        const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
        expect(Math.abs(r - g)).toBeLessThan(60)
        expect(b).toBeLessThan(0.3 * Math.min(r, g))
      }
    }
  })

  it('keeps pure red reddish for tritanopia', () => {
    expect(simulateColorVision('#FF0000', 'tritanopia')).toMatch(/^#FF0/)
  })

  it('returns null for invalid input and the color itself for an unknown type', () => {
    expect(simulateColorVision('nope', 'protanopia')).toBeNull()
    expect(simulateColorVision('#2a9d8f', 'unknown')).toBe('#2A9D8F')
  })

  it('measures color difference in CIE Lab', () => {
    expect(deltaE('#000000', '#FFFFFF')).toBeCloseTo(100, 3)
    expect(deltaE('#2A9D8F', '#2A9D8F')).toBe(0)
  })
})

describe('colorVision - palette report', () => {
  it('reports every type with the simulated palette', () => {
    const report = colorVisionReport(['#264653', '#2a9d8f', '#264653', 'bad'])
    expect(report.map((r) => r.type)).toEqual(VISION_TYPES)
    for (const row of report) {
      expect(row.colors.map((c) => c.hex)).toEqual(['#264653', '#2A9D8F'])
    }
  })

  it('flags red/green as confusable for deuteranopia only where they collapse', () => {
    const report = colorVisionReport(['#D62728', '#2CA02C', '#1F77B4'])
    const deutan = report.find((r) => r.type === 'deuteranopia')!
    expect(deutan.confusable).toEqual([['#D62728', '#2CA02C']])
    const tritan = report.find((r) => r.type === 'tritanopia')!
    expect(tritan.confusable).toEqual([])
  })

  it('does not flag colors that already look alike with normal vision', () => {
    const near = ['#808080', '#828282']
    expect(deltaE(near[0], near[1])).toBeLessThan(CONFUSION_DELTA_E)
    for (const row of colorVisionReport(near)) expect(row.confusable).toEqual([])
  })
})

describe('ColorVisionDialog', () => {
  function mountDialog(colors: string[]) {
    return mount(ColorVisionDialog, {
      props: { show: true, colors },
      global: { stubs: { teleport: true } },
    })
  }

  it('shows a row per vision type and lists confusable pairs', () => {
    const wrapper = mountDialog(['#D62728', '#2CA02C', '#1F77B4'])
    for (const type of VISION_TYPES) {
      expect(wrapper.find(`[data-testid="vision-${type}"]`).exists()).toBe(true)
    }
    const deutan = wrapper.find('[data-testid="vision-deuteranopia"]')
    expect(deutan.findAll('[data-testid="vision-pair"]')).toHaveLength(1)
    expect(deutan.text()).toContain('#D62728 / #2CA02C')
  })

  it('asks for a second color when the palette has fewer than two', () => {
    const wrapper = mountDialog(['#D62728'])
    expect(wrapper.find('[data-testid="vision-protanopia"]').exists()).toBe(false)
  })

  it('names the dialog after its title and closes on Escape', async () => {
    const wrapper = mountDialog(['#000000', '#FFFFFF'])
    const dialog = wrapper.find('[role="dialog"]')
    const title = wrapper.find(`#${dialog.attributes('aria-labelledby')}`)
    expect(title.text()).toBe('Vorschau bei Farbsehschwäche')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(wrapper.emitted('close')).toHaveLength(1)
    wrapper.unmount()
  })
})
