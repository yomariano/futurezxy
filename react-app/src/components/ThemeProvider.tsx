import * as React from "react"

interface ThemeProviderProps {
  children: React.ReactNode
  attribute?: string
  defaultTheme?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

const ThemeContext = React.createContext<{
  theme: string
  setTheme: (theme: string) => void
  themes: string[]
  systemTheme?: string
}>({
  theme: 'system',
  setTheme: () => null,
  themes: ['light', 'dark', 'system'],
})

export const useTheme = () => {
  const context = React.useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export function ThemeProvider({ 
  children, 
  attribute = "class",
  defaultTheme = "system",
  enableSystem = true,
  disableTransitionOnChange = false 
}: ThemeProviderProps) {
  const [theme, setTheme] = React.useState(defaultTheme)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('theme') || defaultTheme
    setTheme(savedTheme)
    
    if (savedTheme === 'system' && enableSystem) {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      document.documentElement.setAttribute(attribute, systemTheme)
    } else {
      document.documentElement.setAttribute(attribute, savedTheme)
    }
  }, [attribute, defaultTheme, enableSystem])

  const changeTheme = (newTheme: string) => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    
    if (newTheme === 'system' && enableSystem) {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      document.documentElement.setAttribute(attribute, systemTheme)
    } else {
      document.documentElement.setAttribute(attribute, newTheme)
    }
  }

  const value = {
    theme,
    setTheme: changeTheme,
    themes: ['light', 'dark', 'system'],
    systemTheme: enableSystem ? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : undefined
  }

  if (!mounted) {
    return null
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}