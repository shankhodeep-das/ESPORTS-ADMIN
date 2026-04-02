'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'

export default function Dashboard() {
  const router = useRouter()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMatches()
  }, [])

  async function fetchMatches() {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.log('Error:', error)
    } else {
      setMatches(data)
    }
    setLoading(false)
  }

  const supabase = createClientComponentClient()

  async function handleLogout() {
  await supabase.auth.signOut()
  router.refresh()
  router.push('/login')
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-green-400">
          📊 Dashboard
        </h1>
        <div className="flex items-center gap-4">
          <Link href="/match/create">
            <button className="bg-green-500 hover:bg-green-600 text-black font-bold px-4 py-2 rounded-lg">
              ➕ New Match
            </button>
          </Link>
          <button
            onClick={handleLogout}
            className="text-xs text-red-400 hover:text-red-300 font-bold uppercase tracking-widest"
          >
            Logout
          </button>
        </div>
      </div>

      {loading && (
        <p className="text-gray-400">Loading matches...</p>
      )}

      {!loading && matches.length === 0 && (
        <p className="text-gray-400">No matches yet. Create one!</p>
      )}

      <div className="flex flex-col gap-4 max-w-2xl">
        {matches.map((match) => (
          <div
            key={match.id}
            className="bg-gray-800 rounded-xl p-5 border border-gray-700"
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {match.title}
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  🗺️ {match.map} &nbsp;|&nbsp; 🔄 {match.round}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  match.status === 'live'
                    ? 'bg-red-500 text-white'
                    : match.status === 'waiting'
                    ? 'bg-yellow-500 text-black'
                    : 'bg-gray-600 text-white'
                }`}>
                  {match.status.toUpperCase()}
                </span>

                <Link href={`/match/${match.id}`}>
                  <button className="bg-green-500 hover:bg-green-600 text-black text-sm font-bold px-3 py-1 rounded-lg">
                    Manage →
                  </button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

    </main>
  )
}