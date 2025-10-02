import Image from 'next/image'

export default function Navbar() {
  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center">
          <div className="flex items-center gap-3">
            <Image
              src="/mkhedruli-logo.png"
              alt="Mkhedruli Logo"
              width={40}
              height={40}
              className="rounded"
            />
            <h1 className="text-2xl font-bold text-gray-900">Mkhedruli</h1>
          </div>
        </div>
      </div>
    </nav>
  )
}

