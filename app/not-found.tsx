import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-4 py-16 text-gray-950 sm:px-6">
      <p className="mb-3 text-sm font-semibold uppercase text-gray-500">404</p>
      <h1 className="mb-4 text-3xl font-extrabold">Page not found</h1>
      <p className="mb-8 max-w-xl text-gray-600">
        This page does not exist. Return to the translator to keep working.
      </p>
      <Link
        href="/"
        className="inline-flex h-12 w-fit items-center rounded-lg bg-blue-700 px-5 text-sm font-bold text-white transition-colors hover:bg-blue-600"
      >
        Back to translator
      </Link>
    </main>
  )
}
