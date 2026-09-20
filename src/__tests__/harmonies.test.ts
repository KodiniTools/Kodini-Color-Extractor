import { describe, it, expect, beforeEach, vi } from 'vitest'

async function core() {
  return await import('../lib/core/colorGenerator')
}

/** Many samples, so a range assertion is not passed by luck. */
async function sample(mode: string, count: number, runs = 60) {
  const { harmonyColors } = await core()
  const out: { h: number; s: number; l: number }[] = []
  for (let i = 0; i < runs; i++) out.push(...harmonyColors(mode, count))
  return out
}

describe('harmonyModes', () => {
  beforeEach(() => vi.resetModules())

  it('lists the colour-theory modes and the five style presets', async () => {
    const { harmonyModes, harmonyGroups } = await core()
    expect(harmonyModes).toEqual([
      'random',
      'monochromatic',
      'analogous',
      'complementary',
      'triadic',
      'pastel',
      'neon',
      'earthy',
      'sunset',
      'darkui',
    ])
    expect(harmonyGroups.map((g) => g.modes.length)).toEqual([5, 5])
    expect(harmonyGroups.flatMap((g) => g.modes)).toEqual(harmonyModes)
  })

  it('every mode returns exactly the requested number of valid colours', async () => {
    const { harmonyModes, harmonyColors } = await core()
    for (const mode of harmonyModes) {
      for (const count of [1, 3, 5, 8]) {
        const colors = harmonyColors(mode, count)
        expect(colors, `${mode}/${count}`).toHaveLength(count)
        for (const c of colors) {
          expect(c.h).toBeGreaterThanOrEqual(0)
          expect(c.h).toBeLessThan(360)
          expect(c.s).toBeGreaterThanOrEqual(0)
          expect(c.s).toBeLessThanOrEqual(100)
          expect(c.l).toBeGreaterThanOrEqual(0)
          expect(c.l).toBeLessThanOrEqual(100)
          expect(Number.isInteger(c.s)).toBe(true)
          expect(Number.isInteger(c.l)).toBe(true)
        }
      }
    }
  })

  it('an unknown mode falls back to the random palette', async () => {
    const { harmonyColors } = await core()
    expect(harmonyColors('not-a-mode', 4)).toHaveLength(4)
  })
})

describe('harmonyModes - style presets stay in style', () => {
  beforeEach(() => vi.resetModules())

  it('pastel stays light and only lightly saturated', async () => {
    for (const c of await sample('pastel', 5)) {
      expect(c.l).toBeGreaterThanOrEqual(82)
      expect(c.s).toBeLessThanOrEqual(62)
    }
  })

  it('neon stays vivid and avoids the muddy orange band', async () => {
    for (const c of await sample('neon', 5)) {
      expect(c.s).toBeGreaterThanOrEqual(88)
      // 20-60deg is where "neon" turns into brown or mustard.
      expect(c.h < 20 || c.h > 60, `hue ${c.h}`).toBe(true)
    }
  })

  it('earthy stays warm and muted', async () => {
    for (const c of await sample('earthy', 5)) {
      expect(c.s).toBeLessThanOrEqual(52)
      expect(c.h, `hue ${c.h}`).toBeLessThanOrEqual(95)
    }
  })

  it('sunset sweeps from violet through red into gold', async () => {
    const { harmonyColors } = await core()
    for (let i = 0; i < 40; i++) {
      const colors = harmonyColors('sunset', 5)
      // Every hue sits on the violet -> gold arc (277..360 or 0..50).
      for (const c of colors) expect(c.h >= 277 || c.h <= 50, `hue ${c.h}`).toBe(true)
      // The ramp brightens towards the gold end.
      expect(colors[colors.length - 1].l).toBeGreaterThan(colors[0].l)
    }
  })

  it('darkui gives dark surfaces plus bright accents', async () => {
    const { harmonyColors } = await core()
    for (let i = 0; i < 40; i++) {
      const colors = harmonyColors('darkui', 5)
      const surfaces = colors.slice(0, 3)
      const accents = colors.slice(3)
      for (const c of surfaces) {
        expect(c.l, `surface l ${c.l}`).toBeLessThanOrEqual(28)
        expect(c.s, `surface s ${c.s}`).toBeLessThanOrEqual(20)
      }
      for (const c of accents) {
        expect(c.l, `accent l ${c.l}`).toBeGreaterThanOrEqual(55)
        expect(c.s, `accent s ${c.s}`).toBeGreaterThanOrEqual(70)
      }
    }
  })

  it('darkui keeps at least one surface and one accent at any count', async () => {
    const { harmonyColors } = await core()
    for (const count of [1, 2, 3, 8]) {
      const colors = harmonyColors('darkui', count)
      expect(colors).toHaveLength(count)
      if (count > 1) {
        expect(colors.some((c) => c.l <= 28)).toBe(true)
        expect(colors.some((c) => c.l >= 55)).toBe(true)
      }
    }
  })

  it('presets still vary between runs', async () => {
    const { harmonyColors } = await core()
    for (const mode of ['pastel', 'neon', 'earthy', 'sunset', 'darkui']) {
      const a = JSON.stringify(harmonyColors(mode, 5))
      const differs = Array.from({ length: 20 }, () => JSON.stringify(harmonyColors(mode, 5))).some(
        (b) => b !== a
      )
      expect(differs, `${mode} produced the same palette every time`).toBe(true)
    }
  })
})
