import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Button } from './ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { useTheme, Theme } from '../contexts/ThemeContext'
import { useTranslation } from '../contexts/TranslationContext'
import { Sun, Moon, Monitor, Check, Palette } from 'lucide-react'

interface ThemeSelectorProps {
  variant?: 'select' | 'dropdown' | 'toggle' | 'compact'
  className?: string
}

export function ThemeSelector({ variant = 'select', className }: ThemeSelectorProps) {
  const { theme, setTheme, actualTheme } = useTheme()
  const { t } = useTranslation()

  const themeOptions: Record<Theme, { icon: React.ReactNode, label: string }> = {
    light: { icon: <Sun className="w-4 h-4" />, label: t('settings.lightMode') },
    dark: { icon: <Moon className="w-4 h-4" />, label: t('settings.darkMode') },
    system: { icon: <Monitor className="w-4 h-4" />, label: t('settings.systemDefault') }
  }

  if (variant === 'toggle') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme(actualTheme === 'dark' ? 'light' : 'dark')}
        className={className}
      >
        {actualTheme === 'dark' ? (
          <Moon className="w-4 h-4" />
        ) : (
          <Sun className="w-4 h-4" />
        )}
      </Button>
    )
  }

  if (variant === 'compact') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className={className}>
            <Palette className="w-4 h-4 mr-2" />
            {themeOptions[theme].icon}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {Object.entries(themeOptions).map(([key, option]) => (
            <DropdownMenuItem
              key={key}
              onClick={() => setTheme(key as Theme)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                {option.icon}
                <span>{option.label}</span>
              </div>
              {theme === key && <Check className="w-4 h-4 text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  if (variant === 'dropdown') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className={className}>
            {themeOptions[theme].icon}
            <span className="ml-2">{themeOptions[theme].label}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {Object.entries(themeOptions).map(([key, option]) => (
            <DropdownMenuItem
              key={key}
              onClick={() => setTheme(key as Theme)}
              className="flex items-center justify-between py-3"
            >
              <div className="flex items-center gap-3">
                {option.icon}
                <span className="font-medium">{option.label}</span>
              </div>
              {theme === key && <Check className="w-4 h-4 text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className={className}>
      <Select value={theme} onValueChange={(value) => setTheme(value as Theme)}>
        <SelectTrigger className="w-full">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(themeOptions).map(([key, option]) => (
            <SelectItem key={key} value={key}>
              <div className="flex items-center gap-2 py-1">
                {option.icon}
                <span className="font-medium">{option.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}