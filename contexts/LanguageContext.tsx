'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { translatorUrls } from '@/utils/translatorUrls'
import { Language, translations, TranslationKey } from '@/utils/translations'
import { detectSiteDefaults } from '@/utils/siteDefaults'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const routeLanguage = pathname === translatorUrls.ka ? 'ka' : pathname === translatorUrls.en ? 'en' : null
  const [preferredLanguage, setLanguageState] = useState<Language>('en')
  const language = routeLanguage ?? preferredLanguage

  // The translator URL selects its language. Other pages use the saved preference.
  useEffect(() => {
    if (routeLanguage) {
      localStorage.setItem('mingrelian_language', routeLanguage)
      setLanguageState(routeLanguage)
      return
    }

    let cancelled = false

    const saved = localStorage.getItem('mingrelian_language')
    if (saved === 'en' || saved === 'ka') {
      setLanguageState(saved)
      return
    }

    void detectSiteDefaults().then((defaults) => {
      if (!cancelled) {
        setLanguageState(defaults.uiLanguage)
      }
    })

    return () => {
      cancelled = true
    }
  }, [routeLanguage])

  // Save language preference when it changes
  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('mingrelian_language', lang)
  }

  // Translation function
  const t = (key: TranslationKey): string => {
    return translations[language][key] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <html lang={language}>{children}</html>
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
