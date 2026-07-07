'use client'

import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { useLanguage } from '@/contexts/LanguageContext'
import type { TranslationKey } from '@/utils/translations'

const JULY_2026_UPDATES: TranslationKey[] = [
  'updatesCoverage',
  'updatesShortTranslations',
  'updatesMkhedruli',
  'updatesReliability',
  'updatesPerformance',
]

export default function UpdatesPage() {
  const { t } = useLanguage()

  return (
    <>
      <Navbar hasApiKey showSettings={false} />
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 transition-colors hover:text-blue-900"
        >
          <span aria-hidden="true">&larr;</span>
          {t('updatesBack')}
        </Link>

        <header className="mt-8 border-b border-gray-200 pb-8">
          <h1 className="text-3xl font-bold text-gray-950">{t('updatesTitle')}</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-gray-600">
            {t('updatesDescription')}
          </p>
        </header>

        <section className="py-8" aria-labelledby="july-2026-heading">
          <time
            id="july-2026-heading"
            dateTime="2026-07"
            className="text-sm font-semibold text-blue-700"
          >
            {t('updatesJuly2026')}
          </time>
          <ul className="mt-5 space-y-4 text-base leading-7 text-gray-700">
            {JULY_2026_UPDATES.map((key) => (
              <li key={key} className="flex gap-3">
                <span aria-hidden="true" className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  )
}
