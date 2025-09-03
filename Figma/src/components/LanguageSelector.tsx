import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { useTranslation, Language } from '../contexts/TranslationContext'
import { Globe, Check } from 'lucide-react'

interface LanguageSelectorProps {
  variant?: 'select' | 'dropdown' | 'compact'
  className?: string
}

const languageNames: Record<Language, { name: string, nativeName: string, flag: string }> = {
  en: { name: 'English', nativeName: 'English', flag: '🇺🇸' },
  tr: { name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  de: { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  fr: { name: 'French', nativeName: 'Français', flag: '🇫🇷' }
}

export function LanguageSelector({ variant = 'select', className }: LanguageSelectorProps) {
  const { language, setLanguage, t } = useTranslation()

  if (variant === 'compact') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className={className}>
            <Globe className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">{languageNames[language].flag}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {Object.entries(languageNames).map(([code, info]) => (
            <DropdownMenuItem
              key={code}
              onClick={() => setLanguage(code as Language)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{info.flag}</span>
                <span className="font-medium">{info.nativeName}</span>
              </div>
              {language === code && <Check className="w-4 h-4 text-primary" />}
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
            <Globe className="w-4 h-4 mr-2" />
            {languageNames[language].nativeName}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {Object.entries(languageNames).map(([code, info]) => (
            <DropdownMenuItem
              key={code}
              onClick={() => setLanguage(code as Language)}
              className="flex items-center justify-between py-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{info.flag}</span>
                <div>
                  <div className="font-medium">{info.nativeName}</div>
                  <div className="text-sm text-muted-foreground">{info.name}</div>
                </div>
              </div>
              {language === code && <Check className="w-4 h-4 text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className={className}>
      <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
        <SelectTrigger className="w-full">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(languageNames).map(([code, info]) => (
            <SelectItem key={code} value={code}>
              <div className="flex items-center gap-3 py-1">
                <span className="text-lg">{info.flag}</span>
                <div>
                  <div className="font-medium">{info.nativeName}</div>
                  <div className="text-sm text-muted-foreground">{info.name}</div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}