import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    vi.resetModules()
  })

  it('initializes with a valid theme', async () => {
    const { useTheme } = await import('../composables/useTheme')
    const { theme } = useTheme()
    expect(['light', 'dark']).toContain(theme.value)
  })

  it('reads stored theme from localStorage', async () => {
    localStorage.setItem('kodini-color-theme', 'dark')
    const { useTheme } = await import('../composables/useTheme')
    const { theme } = useTheme()
    expect(theme.value).toBe('dark')
  })

  it('setTheme updates theme value', async () => {
    const { useTheme } = await import('../composables/useTheme')
    const { theme, setTheme } = useTheme()
    setTheme('dark')
    expect(theme.value).toBe('dark')
  })

  it('setTheme persists to localStorage', async () => {
    const { useTheme } = await import('../composables/useTheme')
    const { setTheme } = useTheme()
    setTheme('light')
    expect(localStorage.getItem('kodini-color-theme')).toBe('light')
  })

  it('toggleTheme switches between light and dark', async () => {
    const { useTheme } = await import('../composables/useTheme')
    const { theme, setTheme, toggleTheme } = useTheme()
    setTheme('light')
    toggleTheme()
    expect(theme.value).toBe('dark')
    toggleTheme()
    expect(theme.value).toBe('light')
  })

  it('isDark returns correct value', async () => {
    const { useTheme } = await import('../composables/useTheme')
    const { setTheme, isDark } = useTheme()
    setTheme('dark')
    expect(isDark()).toBe(true)
    setTheme('light')
    expect(isDark()).toBe(false)
  })

  it('setTheme sets data-theme attribute on documentElement', async () => {
    const { useTheme } = await import('../composables/useTheme')
    const { setTheme } = useTheme()
    setTheme('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('getSystemTheme returns light or dark string', async () => {
    // jsdom doesn't implement matchMedia, so system theme defaults to 'light'
    localStorage.clear()
    const { useTheme } = await import('../composables/useTheme')
    const { theme } = useTheme()
    expect(['light', 'dark']).toContain(theme.value)
  })
})
