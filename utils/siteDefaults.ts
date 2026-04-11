import type { Language } from '@/utils/translations'

export const TRANSLATION_LANGUAGES = ['mingrelian', 'georgian', 'english'] as const

export type TranslationLanguage = (typeof TRANSLATION_LANGUAGES)[number]

export interface SiteDefaults {
  uiLanguage: Language
  sourceLanguage: TranslationLanguage
  targetLanguage: TranslationLanguage
  countryCode: string | null
}

const GEO_LOOKUP_URL = 'https://free.freeipapi.com/api/json/'
const GEO_DEFAULTS_SESSION_KEY = 'mingrelian_geo_defaults_v1'

let siteDefaultsPromise: Promise<SiteDefaults> | null = null

export function isTranslationLanguage(value: string | null | undefined): value is TranslationLanguage {
  return TRANSLATION_LANGUAGES.includes(value as TranslationLanguage)
}

function normalizeCountryCode(value: string | null | undefined): string | null {
  if (!value) return null

  const normalized = value.trim().toUpperCase()
  return normalized.length === 2 ? normalized : null
}

function getEnglishToMingrelianDefaults(countryCode: string | null = null): SiteDefaults {
  return {
    uiLanguage: 'en',
    sourceLanguage: 'english',
    targetLanguage: 'mingrelian',
    countryCode,
  }
}

function getGeorgianDefaults(): SiteDefaults {
  return {
    uiLanguage: 'ka',
    sourceLanguage: 'georgian',
    targetLanguage: 'mingrelian',
    countryCode: 'GE',
  }
}

export function getSiteDefaultsForCountryCode(countryCode: string | null | undefined): SiteDefaults {
  return normalizeCountryCode(countryCode) === 'GE'
    ? getGeorgianDefaults()
    : getEnglishToMingrelianDefaults(normalizeCountryCode(countryCode))
}

export function getDefaultSiteDefaults(): SiteDefaults {
  return getEnglishToMingrelianDefaults()
}

function readCachedDefaults(): SiteDefaults | null {
  if (typeof window === 'undefined') return null

  const raw = window.sessionStorage.getItem(GEO_DEFAULTS_SESSION_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<SiteDefaults>
    if (
      (parsed.uiLanguage === 'en' || parsed.uiLanguage === 'ka') &&
      isTranslationLanguage(parsed.sourceLanguage) &&
      isTranslationLanguage(parsed.targetLanguage)
    ) {
      return {
        uiLanguage: parsed.uiLanguage,
        sourceLanguage: parsed.sourceLanguage,
        targetLanguage: parsed.targetLanguage,
        countryCode: normalizeCountryCode(parsed.countryCode ?? null),
      }
    }
  } catch {
    // Ignore malformed cache entries and fall back to a fresh lookup.
  }

  return null
}

function cacheDefaults(defaults: SiteDefaults) {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(GEO_DEFAULTS_SESSION_KEY, JSON.stringify(defaults))
}

async function fetchCountryCode(): Promise<string | null> {
  const response = await fetch(GEO_LOOKUP_URL, {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Geo lookup failed with status ${response.status}`)
  }

  const payload = (await response.json()) as { countryCode?: unknown }
  return typeof payload.countryCode === 'string' ? normalizeCountryCode(payload.countryCode) : null
}

export async function detectSiteDefaults(): Promise<SiteDefaults> {
  if (typeof window === 'undefined') {
    return getDefaultSiteDefaults()
  }

  const cachedDefaults = readCachedDefaults()
  if (cachedDefaults) {
    return cachedDefaults
  }

  if (!siteDefaultsPromise) {
    siteDefaultsPromise = fetchCountryCode()
      .then((countryCode) => {
        const defaults = getSiteDefaultsForCountryCode(countryCode)
        cacheDefaults(defaults)
        return defaults
      })
      .catch(() => getDefaultSiteDefaults())
  }

  return siteDefaultsPromise
}
