"use client"

import { Moon, Sun } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

const ThemeToggle = () => {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Debug logging
    console.log('🎨 ThemeToggle (Switch) mounted:', {
      theme,
      resolvedTheme,
      htmlClasses: document.documentElement.className,
      localStorage: localStorage.getItem('theme-preference')
    })
  }, [theme, resolvedTheme])

  if (!mounted) {
    // Show skeleton with exact same structure
    return (
      <div className="flex items-center space-x-3" suppressHydrationWarning>
        <Sun className="h-4 w-4 text-gray-600" />
        <div className="h-6 w-11 rounded-full bg-gray-200 border-2 border-transparent flex items-center justify-start p-0.5">
          <div className="h-5 w-5 rounded-full bg-white shadow-md" />
        </div>
        <Moon className="h-4 w-4 text-gray-600" />
      </div>
    )
  }

  const isDark = theme === "dark"

  const handleToggle = (checked: boolean) => {
    const newTheme = checked ? "dark" : "light"
    console.log('🎨 Theme changing (Switch):', { from: theme, to: newTheme })
    setTheme(newTheme)
    
    // Force update HTML class immediately for better sync - More aggressive
    const forceUpdate = () => {
      const html = document.documentElement
      const classList = html.classList
      
      // Aggressively remove all theme classes
      classList.remove('light', 'dark')
      
      // Double-check for any remaining theme classes
      const classArray = Array.from(classList)
      classArray.forEach(className => {
        if (className === 'dark' || className === 'light') {
          classList.remove(className)
        }
      })
      
      // Force add the correct theme
      classList.add(newTheme)
      html.style.colorScheme = newTheme
      html.setAttribute('data-theme', newTheme)
      
      console.log('🎨 HTML force updated (Switch):', {
        classes: html.className,
        colorScheme: html.style.colorScheme,
        dataTheme: html.getAttribute('data-theme'),
        hasLight: html.classList.contains('light'),
        hasDark: html.classList.contains('dark')
      })
    }
    
    // Multiple force updates to ensure sync
    setTimeout(forceUpdate, 10)
    setTimeout(forceUpdate, 50)
    setTimeout(forceUpdate, 100)
  }

  return (
    <div className="flex items-center space-x-3">
      <Sun className={`h-4 w-4 transition-colors ${
        isDark ? 'text-gray-500' : 'text-yellow-600'
      }`} />
      <Switch
        checked={isDark}
        onCheckedChange={handleToggle}
        aria-label="Toggle theme"
        className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300"
      />
      <Moon className={`h-4 w-4 transition-colors ${
        isDark ? 'text-blue-400' : 'text-gray-500'
      }`} />
    </div>
  )
}

export { ThemeToggle }
