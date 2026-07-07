import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { LanguageProvider } from '@/contexts/LanguageContext'
import SiteFooter from '@/components/SiteFooter'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Mingrelian Translator (Megrelian / Megruli) — Mkhedruli',
  description:
    'Translate Mingrelian (Megrelian / Megruli) to English and Georgian. Translate Georgian ↔ English. Megruli targmani / margaluri translator.',
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
  metadataBase: new URL('https://www.mkhedruli.com'),
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/mkhedruli-logo.png',
    apple: '/mkhedruli-logo.png',
  },
  openGraph: {
    type: 'website',
    url: 'https://www.mkhedruli.com',
    title: 'Mingrelian Translator (Megrelian / Megruli) — Mkhedruli',
    description:
      'Translate Mingrelian (Megrelian / Megruli) to English and Georgian. Translate Georgian ↔ English.',
    siteName: 'Mkhedruli',
  },
  twitter: {
    card: 'summary',
    title: 'Mingrelian Translator (Megrelian / Megruli) — Mkhedruli',
    description:
      'Translate Mingrelian (Megrelian / Megruli) to English and Georgian. Translate Georgian ↔ English.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50`}>
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

