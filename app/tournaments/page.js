'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Tournaments() {
  const router = useRouter()
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTournaments()
  }, [])

  async function fetchTournaments() {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) console.log(error)
    else setTournaments(data)
    setLoading(false)
  }

  async function deleteTournament(id) {
    if (!confirm('Delete this tournament?')) return
    await supabase.from('tournaments').delete().eq('id', id)
    fetchTournaments()
  }

  return (
    <main className="min-h-screen bg-[#0a0a0c] text-white p-6">

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#10b981]">
            🏆 Tournaments
          </h1>
          <p className="text-slate-500 text-xs uppercase tracking-widest mt-1">
            Manage all tournaments
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard">
            <button className="text-xs text-slate-400 hover:text-white uppercase tracking-widest font-bold transition-colors">
              ← Dashboard
            </button>
          </Link>
          <Link href="/tournaments/create">
            <button className="bg-[#10b981] hover:bg-[#1fd998] text-black font-bold px-4 py-2 rounded-lg text-sm uppercase tracking-widest transition-all hover:-translate-y-1">
              ➕ New Tournament
            </button>
          </Link>
        </div>
      </div>

      {loading && <p className="text-slate-400">Loading...</p>}

      {!loading && tournaments.length === 0 && (
        <p className="text-slate-400">No tournaments yet. Create one!</p>
      )}

      <div className="flex flex-col gap-4 max-w-2xl">
        {tournaments.map((tournament) => (
          <div
            key={tournament.id}
            className="bg-white/5 rounded-xl p-5 border border-white/10 hover:border-[#10b981]/30 transition-all"
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {tournament.name}
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  🎮 {tournament.game}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  tournament.status === 'active'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                }`}>
                  {tournament.status.toUpperCase()}
                </span>

                <Link href={`/tournaments/${tournament.id}`}>
                  <button className="bg-[#10b981] hover:bg-[#1fd998] text-black text-sm font-bold px-3 py-1 rounded-lg transition-all">
                    Open →
                  </button>
                </Link>

                <button
                  onClick={() => deleteTournament(tournament.id)}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-bold px-3 py-1 rounded-lg transition-all border border-red-500/20"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

    </main>
  )
}