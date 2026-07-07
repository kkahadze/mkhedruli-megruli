'use client'

import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'

export default function SiteFooter() {
  const { t } = useLanguage()

  return (
    <footer className="border-t border-gray-200/70 bg-white/60">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link href="/updates" className="transition-colors hover:text-gray-950">
            {t('footerUpdates')}
          </Link>
        </nav>
        <p className="text-xs text-gray-500">{t('footerLastUpdated')}</p>
      </div>
    </footer>
  )
}
