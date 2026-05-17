'use client'

import Image from 'next/image'
import { useLanguage } from '@/contexts/LanguageContext'

interface NavbarProps {
  onSettingsClick?: () => void
  hasApiKey: boolean
  showSettings?: boolean
}

export default function Navbar({ onSettingsClick, hasApiKey, showSettings = true }: NavbarProps) {
  const { language, setLanguage, t } = useLanguage()

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ka' : 'en')
  }

  return (
    <nav className="border-b border-gray-200 bg-white md:border-gray-200/50 md:bg-white/80 md:shadow-sm md:backdrop-blur-sm">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 md:max-w-7xl lg:px-8">
        <div className="flex h-[68px] items-center justify-between gap-3 md:h-16">
          <div className="flex min-w-0 items-center gap-2 md:gap-3">
            <Image
              src="/mkhedruli-logo.png"
              alt="Mkhedruli Logo"
              width={40}
              height={40}
              className="h-[34px] w-[34px] shrink-0 rounded md:h-10 md:w-10"
            />
            <h1
              className={[
                'truncate whitespace-nowrap font-extrabold leading-tight text-gray-950 md:cursor-default md:text-2xl md:font-bold md:text-gray-900',
                language === 'en' ? 'text-[1.15rem]' : 'text-[1.05rem]',
              ].join(' ')}
            >
              {t('appTitle')}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-800 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 md:h-auto md:w-auto md:gap-2 md:border-gray-200/50 md:bg-white/80 md:px-3 md:py-2 md:text-sm md:font-medium md:text-gray-700 md:shadow-sm md:hover:bg-white md:hover:shadow-md md:transition-all"
              title={language === 'en' ? t('switchToGeorgian') : t('switchToEnglish')}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              <span className="hidden font-semibold md:inline">
                {language === 'en' ? 'ქარ' : 'EN'}
              </span>
            </button>

            {/* Settings Button - Only show if settings are enabled */}
            {showSettings && onSettingsClick && (
              <button
                onClick={onSettingsClick}
                className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-800 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 md:h-auto md:w-auto md:gap-2 md:border-gray-200/50 md:bg-white/80 md:px-4 md:py-2 md:text-sm md:font-medium md:text-gray-700 md:shadow-sm md:hover:bg-white md:hover:shadow-md md:transition-all"
                title={t('settings')}
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="hidden md:inline">{t('settings')}</span>
                {!hasApiKey && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
