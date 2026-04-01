import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <h1 className="text-3xl font-bold text-green-400">
        🎮 Esports Overlay Admin
      </h1>
      <p className="text-gray-400 mt-2">Welcome to the tournament control panel</p>

      <div className="mt-8 flex flex-col gap-4 max-w-xs">
        <Link href="/match/create">
          <button className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-3 rounded-lg">
            ➕ Create New Match
          </button>
        </Link>

        <Link href="/dashboard">
          <button className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg">
            📊 Go to Dashboard
          </button>
        </Link>
      </div>
    </main>
  )
}