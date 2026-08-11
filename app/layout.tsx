import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { LanguageProvider } from '@/contexts/LanguageContext'
import SiteFooter from '@/components/SiteFooter'

const inter = Inter({ subsets: ['latin'] })
const SITE_URL = 'https://www.mkhedruli.com'
const SITE_NAME = 'Mkhedruli Mingrelian Translator'
const SITE_DESCRIPTION =
  'Free Mingrelian translator for English and Georgian. Translate Mingrelian (Megrelian / Megruli) instantly with automatic Georgian-script transliteration.'
const SITE_LOGO = `${SITE_URL}/mkhedruli-logo.png`

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: SITE_NAME,
      alternateName: ['Mingrelian Translator', 'Mkhedruli Translator'],
      description: SITE_DESCRIPTION,
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      logo: {
        '@type': 'ImageObject',
        url: SITE_LOGO,
        width: 1024,
        height: 1024,
      },
    },
    {
      '@type': 'WebApplication',
      '@id': `${SITE_URL}/#translator`,
      name: 'Mingrelian Translator',
      url: `${SITE_URL}/`,
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Any',
      inLanguage: ['en', 'ka', 'xmf'],
      description: SITE_DESCRIPTION,
      provider: { '@id': `${SITE_URL}/#organization` },
    },
  ],
}

export const metadata: Metadata = {
  title: 'Mingrelian Translator (Megrelian / Megruli) — Mkhedruli',
  description: SITE_DESCRIPTION,
  keywords: [
    'Mingrelian translator',
    'Megrelian translator',
    'Megruli translator',
    'Megruli targmani',
    'margaluri',
    'Mingrelian',
    'Megrelian',
    'Megruli',
    'Georgian translator',
    'English to Mingrelian',
    'Mingrelian to English',
    'Mingrelian to Georgian',
  ],
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-48x48.png', type: 'image/png', sizes: '48x48' },
    ],
    apple: [{ url: '/apple-touch-icon.png', type: 'image/png', sizes: '180x180' }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    title: 'Mingrelian Translator (Megrelian / Megruli) — Mkhedruli',
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    images: [
      {
        url: SITE_LOGO,
        width: 1024,
        height: 1024,
        alt: 'Mkhedruli Mingrelian Translator logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mingrelian Translator (Megrelian / Megruli) — Mkhedruli',
    description: SITE_DESCRIPTION,
    images: [SITE_LOGO],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
        />
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-1B6NY0YVJH"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-1B6NY0YVJH');
          `}
        </Script>

        <LanguageProvider>
          <div className="flex min-h-screen flex-col">
            <div className="flex-1">{children}</div>
            <SiteFooter />
          </div>
        </LanguageProvider>
      </body>
    </html>
  )
}
