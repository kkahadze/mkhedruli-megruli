import type { Metadata } from 'next'
import { languageAlternates } from '@/utils/translatorUrls'
import { translations } from '@/utils/translations'

export const metadata: Metadata = {
  alternates: { canonical: '/', languages: languageAlternates },
}

export default function EnglishTranslatorPage() {
  return <p className="sr-only">{translations.en.introDescription}</p>
}
