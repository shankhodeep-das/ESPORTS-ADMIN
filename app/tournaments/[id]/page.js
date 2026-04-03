'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function TournamentPage() {
  const { id } = useParams()
  const [tournament, setTournament] = useState(null)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTournament()
    fetchMatches()
  }, [])

  async function fetchTournament() {
    const { data } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .single()
    setTournament(data)
  }

  async function fetchMatches() {
    const { data } = await supabase
      .from('matches')
      .select('*, teams(*)')
      .eq('tournament_id', id)
      .order('match_number')
    setMatches(data || [])
    setLoading(false)
  }

  async function createMatch() {
    const matchNumber = matches.length + 1
    const { error } = await supabase
      .from('matches')
      .insert([{
        title: tournament?.name,
        game: tournament?.game,
        map: '',
        round: `Match ${matchNumber}`,
        status: 'waiting',
        tournament_id: id,
        match_number: matchNumber
      }])

    if (error) {
      alert('Error: ' + error.message)
      return
    }

    fetchMatches()
  }

  async function deleteMatch(matchId) {
    if (!confirm('Delete this match?')) return
    await supabase.from('matches').delete().eq('id', matchId)
    fetchMatches()
  }

  if (loading) return (
    <main className="min-h-screen bg-[#0a0a0c] text-white p-6">
      <p className="text-slate-400">Loading...</p>
    </main>
  )

  return (
    <main className="min-h-screen bg-[#0a0a0c] text-white p-6">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <Link href="/tournaments">
            <span className="text-slate-400 text-xs hover:text-white cursor-pointer uppercase tracking-widest font-bold">
              ← Tournaments
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-[#10b981] mt-1">
            🏆 {tournament?.name}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            🎮 {tournament?.game}
          </p>
        </div>

        <button
          onClick={createMatch}
          className="bg-[#10b981] hover:bg-[#1fd998] text-black font-bold px-4 py-2 rounded-lg text-sm uppercase tracking-widest transition-all hover:-translate-y-1"
        >
          ➕ Add Match
        </button>
      </div>

      {matches.length === 0 && (
        <p className="text-slate-400">No matches yet. Click Add Match!</p>
      )}

      {/* Overall Leaderboard Button */}
      {matches.length > 0 && (
        <div className="mb-6">
          <Link href={`/tournaments/${id}/leaderboard`}>
            <button className="bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 font-bold px-4 py-2 rounded-lg text-sm uppercase tracking-widest transition-all border border-yellow-500/30">
              📊 Overall Leaderboard
            </button>
          </Link>
        </div>
      )}

      {/* Matches List */}
      <div className="flex flex-col gap-4 max-w-2xl">
        {matches.map((match) => (
          <div
            key={match.id}
            className="bg-white/5 rounded-xl p-5 border border-white/10 hover:border-[#10b981]/30 transition-all"
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Match {match.match_number}
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  🗺️ {match.map || 'No map set'} &nbsp;|&nbsp;
                  👥 {match.teams?.length || 0} teams
                </p>
              </div>

              <div className="flex items-center gap-2">
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
                  <button className="bg-[#10b981] hover:bg-[#1fd998] text-black text-sm font-bold px-3 py-1 rounded-lg transition-all">
                    Manage →
                  </button>
                </Link>

                <button
                  onClick={() => deleteMatch(match.id)}
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