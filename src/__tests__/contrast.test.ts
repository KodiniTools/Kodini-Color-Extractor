import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import {
  bestPairs,
  contrastMatrix,
  contrastRatio,
  formatRatio,
  relativeLuminance,
  textSuggestions,
  wcagLevel,
} from '../lib/core/contrast'
import ContrastDialog from '../components/ContrastDialog.vue'

describe('contrast - WCAG math', () => {
  it('relative luminance spans 0 (black) to 1 (white)', () => {
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBe(0)
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 10)
  })

  it('black on white is 21:1, a color on itself 1:1, order-independent', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 10)
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 10)
    expect(contrastRatio('#336699', '#336699')).toBe(1)
  })

  it('matches published reference ratios', () => {
    // Reference values from the WebAIM contrast checker.
    expect(formatRatio(contrastRatio('#767676', '#FFFFFF')!)).toBe('4.54')
    expect(formatRatio(contrastRatio('#777777', '#FFFFFF')!)).toBe('4.47')
    expect(formatRatio(contrastRatio('#0000FF', '#FFFFFF')!)).toBe('8.59')
  })

  it('returns null for invalid colors', () => {
    expect(contrastRatio('nope', '#FFFFFF')).toBeNull()
    expect(wcagLevel(null)).toBe('fail')
  })

  it('assigns levels on the unrounded thresholds', () => {
    expect(wcagLevel(7)).toBe('AAA')
    expect(wcagLevel(6.99)).toBe('AA')
    expect(wcagLevel(4.5)).toBe('AA')
    expect(wcagLevel(4.499)).toBe('AA18')
    expect(wcagLevel(3)).toBe('AA18')
    expect(wcagLevel(2.99)).toBe('fail')
  })

  it('never rounds a ratio up across a threshold', () => {
    expect(formatRatio(4.499)).toBe('4.49')
    expect(formatRatio(21)).toBe('21.00')
  })
})

describe('contrast - palette pairings', () => {
  const palette = ['#264653', '#2a9d8f', '#E9C46A', '#F4A261', '#e76f51']

  it('builds a square matrix with an empty diagonal', () => {
    const { colors, rows } = contrastMatrix(palette)
    expect(colors).toEqual(['#264653', '#2A9D8F', '#E9C46A', '#F4A261', '#E76F51'])
    expect(rows).toHaveLength(5)
    rows.forEach((row, i) => {
      expect(row).toHaveLength(5)
      expect(row[i]).toBeNull()
    })
    expect(rows[0][2]).toMatchObject({ text: '#264653', background: '#E9C46A' })
    expect(rows[0][2]!.ratio).toBeCloseTo(rows[2][0]!.ratio, 10)
  })

  it('drops invalid and repeated colors', () => {
    expect(contrastMatrix(['#000000', 'xyz', '#000000', 'ffffff']).colors).toEqual([
      '#000000',
      '#FFFFFF',
    ])
  })

  it('lists each passing pair once, best first, lighter color as background', () => {
    const pairs = bestPairs(palette)
    expect(pairs.length).toBeGreaterThan(0)
    expect(pairs[0]).toMatchObject({ text: '#264653', background: '#E9C46A' })
    for (let i = 1; i < pairs.length; i++) {
      expect(pairs[i - 1].ratio).toBeGreaterThanOrEqual(pairs[i].ratio)
    }
    for (const p of pairs) expect(p.level).not.toBe('fail')
  })

  it('returns no pairs when nothing reaches 3:1', () => {
    expect(bestPairs(['#777777', '#888888'])).toEqual([])
  })

  it('suggests a palette text color, falling back to white or black', () => {
    const [onDark, onMid] = textSuggestions(['#000000', '#777777', '#FFFFFF'])
    expect(onDark).toMatchObject({ background: '#000000', text: '#FFFFFF', fromPalette: true })
    expect(onMid.fromPalette).toBe(true)

    const [onGray] = textSuggestions(['#777777', '#888888'])
    expect(onGray).toMatchObject({ background: '#777777', text: '#000000', fromPalette: false })
  })
})

describe('ContrastDialog', () => {
  function mountDialog(colors: string[]) {
    return mount(ContrastDialog, {
      props: { show: true, colors },
      global: { stubs: { teleport: true } },
    })
  }

  it('renders a cell per combination and a suggestion per color', () => {
    const wrapper = mountDialog(['#264653', '#E9C46A', '#E76F51'])
    expect(wrapper.findAll('[data-testid="contrast-cell"]')).toHaveLength(6)
    expect(wrapper.findAll('[data-testid="contrast-suggestion"]')).toHaveLength(3)
    expect(wrapper.find('[data-testid="contrast-cell"]').attributes('aria-label')).toMatch(
      /^#264653 \/ #E9C46A: \d+\.\d\d:1, /
    )
  })

  it('asks for a second color when the palette has fewer than two', () => {
    const wrapper = mountDialog(['#264653'])
    expect(wrapper.findAll('[data-testid="contrast-cell"]')).toHaveLength(0)
    expect(wrapper.find('.contrast-empty').exists()).toBe(true)
  })

  it('closes on Escape and on the close button', async () => {
    const wrapper = mountDialog(['#000000', '#FFFFFF'])
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.find('.close-btn').trigger('click')
    const closes = wrapper.emitted('close')!
    expect(closes).toHaveLength(2)
    // The listener goes away with the dialog.
    wrapper.unmount()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(closes).toHaveLength(2)
  })
})
