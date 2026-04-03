'use client'

import { createContext, useContext, useEffect, useSyncExternalStore } from 'react'

type Theme = 'light' | 'dark'

interface ThemeStore {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeStore | undefined>(undefined)

function getThemeSnapshot(): Theme {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem('theme') as Theme | null
  if (stored) return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getServerSnapshot(): Theme {
  return 'light'
}

function subscribe(callback: () => void) {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', callback)
  return () => mediaQuery.removeEventListener('change', callback)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(
    subscribe,
    getThemeSnapshot,
    getServerSnapshot
  )

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    localStorage.setItem('theme', newTheme)
    const root = document.documentElement
    if (newTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    window.dispatchEvent(new Event('theme-change'))
  }

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
