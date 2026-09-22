import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="text-lg font-semibold text-gray-900">
          RSS News Collector
        </Link>
        <div className="flex gap-4 text-sm font-medium text-gray-600">
          <Link href="/dashboard" className="hover:text-blue-600">
            Dashboard
          </Link>
          <Link href="/sources" className="hover:text-blue-600">
            Sources
          </Link>
          <Link href="/news" className="hover:text-blue-600">
            News
          </Link>
        </div>
      </div>
    </nav>
  );
}