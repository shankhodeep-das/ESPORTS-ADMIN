import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white p-6 text-center">
      <h1 className="text-3xl font-bold text-green-400">
        🎮 Esports Overlay Admin
      </h1>
      <p className="text-gray-400 mt-2">Welcome to the tournament control panel</p>

      <div className="mx-auto mt-8 flex flex-col gap-4 max-w-xs">
        <Link href="/match/create">
          <button className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg 
                            shadow-md hover:bg-blue-700 hover:shadow-lg 
                            active:scale-95 transition-all duration-200">
            ➕ Create New Match
          </button>
        </Link>

        <Link href="/dashboard">
          <button className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg 
                            shadow-md hover:bg-blue-700 hover:shadow-lg 
                            active:scale-95 transition-all duration-200">
            📊 Go to Dashboard
          </button>
        </Link>
      </div>
    </main>
  )
}