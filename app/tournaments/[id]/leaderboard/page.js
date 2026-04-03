'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function TournamentLeaderboard() {
  const { id } = useParams()
  const [tournament, setTournament] = useState(null)
  const [matches, setMatches] = useState([])
  const [teamPoints, setTeamPoints] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data: tournamentData } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .single()
    setTournament(tournamentData)

    const { data: matchesData } = await supabase
      .from('matches')
      .select('*')
      .eq('tournament_id', id)
      .order('match_number')
    setMatches(matchesData || [])

    const { data: pointsData } = await supabase
      .from('match_points')
      .select('*')
      .eq('tournament_id', id)
    
    if (pointsData) {
      // Group points by team
      const teamMap = {}
      pointsData.forEach(p => {
        if (!teamMap[p.team_name]) {
          teamMap[p.team_name] = {
            team_name: p.team_name,
            team_id: p.team_id,
            matches: {},
            total: 0
          }
        }
        teamMap[p.team_name].matches[p.match_id] = p.total_points
        teamMap[p.team_name].total += p.total_points
      })

      const sorted = Object.values(teamMap)
        .sort((a, b) => b.total - a.total)
      setTeamPoints(sorted)
    }

    setLoading(false)
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
          <Link href={`/tournaments/${id}`}>
            <span className="text-slate-400 text-xs hover:text-white cursor-pointer uppercase tracking-widest font-bold">
              ← Back to Tournament
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-[#10b981] mt-1">
            📊 Overall Leaderboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            🏆 {tournament?.name} | 🎮 {tournament?.game}
          </p>
        </div>
      </div>

      {teamPoints.length === 0 && (
        <p className="text-slate-400">
          No points data yet. Complete matches first!
        </p>
      )}

      {/* Overall Leaderboard Table */}
      {teamPoints.length > 0 && (
        <div className="max-w-4xl overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Rank
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Team
                </th>
                {matches.map(match => (
                  <th
                    key={match.id}
                    className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest"
                  >
                    M{match.match_number}
                  </th>
                ))}
                <th className="text-center px-4 py-3 text-xs font-bold text-yellow-400 uppercase tracking-widest">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {teamPoints.map((team, index) => (
                <tr
                  key={team.team_id}
                  className={`border-b border-white/5 transition-all ${
                    index === 0 ? 'bg-yellow-500/5' :
                    index === 1 ? 'bg-slate-400/5' :
                    index === 2 ? 'bg-orange-500/5' :
                    'bg-transparent'
                  } hover:bg-white/5`}
                >
                  <td className="px-4 py-3">
                    <span className="font-black text-lg">
                      {index === 0 ? '🥇' :
                       index === 1 ? '🥈' :
                       index === 2 ? '🥉' :
                       `#${index + 1}`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-white">
                      {team.team_name}
                    </span>
                  </td>
                  {matches.map(match => (
                    <td
                      key={match.id}
                      className="px-4 py-3 text-center"
                    >
                      <span className="text-slate-300 font-bold">
                        {team.matches[match.id] || '-'}
                      </span>
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center">
                    <span className="text-yellow-400 font-black text-xl">
                      {team.total}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </main>
  )
}