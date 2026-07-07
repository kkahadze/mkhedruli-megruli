import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Updates - Mkhedruli',
  description: 'Recent improvements to the Mkhedruli Mingrelian Translator.',
  alternates: {
    canonical: '/updates',
  },
}

export default function UpdatesLayout({ children }: { children: React.ReactNode }) {
  return children
}
