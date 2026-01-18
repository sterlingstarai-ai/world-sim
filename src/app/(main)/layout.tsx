import Link from 'next/link';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="font-bold text-xl">
            🌍 World Sim
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              대시보드
            </Link>
            <Link
              href="/leaderboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              리더보드
            </Link>
            <Link
              href="/challenges"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              챌린지
            </Link>
            <Link
              href="/decks"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              덱
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
