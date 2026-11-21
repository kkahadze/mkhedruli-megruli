import type { Metadata } from 'next'
import { languageAlternates } from '@/utils/translatorUrls'
import { translations } from '@/utils/translations'

const { appTitle, introDescription } = translations.ka
const title = `${appTitle} — მხედრული`

export const metadata: Metadata = {
  title,
  description: introDescription,
  keywords: null,
  alternates: { canonical: '/ka', languages: languageAlternates },
  openGraph: {
    type: 'website',
    locale: 'ka_GE',
    url: '/ka',
    siteName: 'მხედრული',
    title,
    description: introDescription,
    images: [{ url: '/social-preview.png', width: 1200, height: 630, alt: 'მხედრული' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description: introDescription,
    images: ['/social-preview.png'],
  },
}

export default function GeorgianTranslatorPage() {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">{appTitle}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--muted)] sm:text-base">{introDescription}</p>
    </header>
  )
}
