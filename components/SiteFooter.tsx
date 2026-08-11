'use client'

import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'

export default function SiteFooter() {
  const { t } = useLanguage()

  return (
    <footer className="border-t border-[color:var(--border)] bg-[var(--surface)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link href="/updates" className="transition-colors hover:text-[var(--accent)]">
            {t('footerUpdates')}
          </Link>
        </nav>
        <p className="text-xs text-[var(--muted)]">{t('footerLastUpdated')}</p>
      </div>
    </footer>
  )
}
