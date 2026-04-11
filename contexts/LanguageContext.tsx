'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Language, translations, TranslationKey } from '@/utils/translations'
import { detectSiteDefaults, getDefaultSiteDefaults } from '@/utils/siteDefaults'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getDefaultSiteDefaults().uiLanguage)

  // Load saved language preference on mount
  useEffect(() => {
    let cancelled = false

    const saved = localStorage.getItem('mingrelian_language')
    if (saved === 'en' || saved === 'ka') {
      setLanguageState(saved)
      return () => {
        cancelled = true
      }
    }

    void detectSiteDefaults().then((defaults) => {
      if (!cancelled) {
        setLanguageState(defaults.uiLanguage)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

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
      {children}
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
