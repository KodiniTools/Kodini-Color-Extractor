import { ref, watch, onMounted } from 'vue'

const STORAGE_KEY = 'kodini-color-theme'

type Theme = 'light' | 'dark'

// Check system preference
function getSystemTheme(): Theme {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

// Get stored theme or system preference
function getInitialTheme(): Theme {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'dark' || stored === 'light') {
      return stored
    }
  }
  return getSystemTheme()
}

const currentTheme = ref<Theme>(getInitialTheme())

export function useTheme() {
  function setTheme(theme: Theme) {
    currentTheme.value = theme
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme)
      localStorage.setItem(STORAGE_KEY, theme)
    }
  }

  function toggleTheme() {
    setTheme(currentTheme.value === 'dark' ? 'light' : 'dark')
  }

  // Initialize theme on mount
  onMounted(() => {
    document.documentElement.setAttribute('data-theme', currentTheme.value)
  })

  // Watch for changes
  watch(currentTheme, (newTheme) => {
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', newTheme)
    }
  })

  return {
    theme: currentTheme,
    setTheme,
    toggleTheme,
    isDark: () => currentTheme.value === 'dark',
  }
}
