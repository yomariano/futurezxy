"use client"

import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('black-and-white')
    else setTheme('light')
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:scale-0 black-and-white:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 black-and-white:scale-0" />
      <Monitor className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all black-and-white:rotate-0 black-and-white:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
} 