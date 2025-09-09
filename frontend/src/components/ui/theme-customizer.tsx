import { useState, useEffect } from 'react'
import { Palette, Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ThemeCustomizerProps {
  className?: string
}

export function ThemeCustomizer({ className }: ThemeCustomizerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [accentColor, setAccentColor] = useState('#3b82f6')
  const [fontSize, setFontSize] = useState('medium')
  const [spacing, setSpacing] = useState('medium')

  const accentColors = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#10b981' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Orange', value: '#f59e0b' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Teal', value: '#14b8a6' }
  ]

  const fontSizes = [
    { name: 'Small', value: 'small', class: 'text-sm' },
    { name: 'Medium', value: 'medium', class: 'text-base' },
    { name: 'Large', value: 'large', class: 'text-lg' }
  ]

  const spacingOptions = [
    { name: 'Compact', value: 'compact', class: 'p-2' },
    { name: 'Medium', value: 'medium', class: 'p-4' },
    { name: 'Relaxed', value: 'relaxed', class: 'p-6' }
  ]

  useEffect(() => {
    // Apply theme
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else if (theme === 'light') {
      root.classList.remove('dark')
    } else {
      // System theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  }, [theme])

  useEffect(() => {
    // Apply accent color
    const root = document.documentElement
    root.style.setProperty('--accent-color', accentColor)
  }, [accentColor])

  useEffect(() => {
    // Apply font size
    const root = document.documentElement
    const fontSizeClass = fontSizes.find(f => f.value === fontSize)?.class || 'text-base'
    root.className = root.className.replace(/text-(sm|base|lg)/g, '')
    root.classList.add(fontSizeClass)
  }, [fontSize])

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <Palette className="h-4 w-4" />
        Customize
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-slate-200 bg-white shadow-lg">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Theme Customizer</h3>
              
              {/* Theme Mode */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Theme Mode
                </label>
                <div className="flex gap-2">
                  {[
                    { value: 'light', icon: Sun, label: 'Light' },
                    { value: 'dark', icon: Moon, label: 'Dark' },
                    { value: 'system', icon: Monitor, label: 'System' }
                  ].map(({ value, icon: Icon, label }) => (
                    <button
                      key={value}
                      onClick={() => setTheme(value as any)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        theme === value
                          ? "bg-slate-100 text-slate-900"
                          : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Color */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Accent Color
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {accentColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setAccentColor(color.value)}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 transition-all",
                        accentColor === color.value
                          ? "border-slate-900 scale-110"
                          : "border-slate-200 hover:scale-105"
                      )}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              {/* Font Size */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Font Size
                </label>
                <div className="flex gap-2">
                  {fontSizes.map((size) => (
                    <button
                      key={size.value}
                      onClick={() => setFontSize(size.value)}
                      className={cn(
                        "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        fontSize === size.value
                          ? "bg-slate-100 text-slate-900"
                          : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {size.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Spacing */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Spacing
                </label>
                <div className="flex gap-2">
                  {spacingOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSpacing(option.value)}
                      className={cn(
                        "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        spacing === option.value
                          ? "bg-slate-100 text-slate-900"
                          : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {option.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset Button */}
              <button
                onClick={() => {
                  setTheme('system')
                  setAccentColor('#3b82f6')
                  setFontSize('medium')
                  setSpacing('medium')
                }}
                className="w-full px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
              >
                Reset to Default
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
