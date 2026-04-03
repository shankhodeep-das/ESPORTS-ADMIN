'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const PLACEMENT_POINTS = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]

export default function MatchLeaderboard() {
  const { id } = useParams()
  const [match, setMatch] = useState(null)
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data: matchData } = await supabase
      .from('matches')
      .select('*')
      .eq('id', id)
      .single()
    setMatch(matchData)

    const { data: teamsData } = await supabase
      .from('teams')
      .select('*, players(*)')
      .eq('match_id', id)
      .order('placement', { ascending: true })
    setTeams(teamsData || [])
    setLoading(false)
  }

  async function setPlacement(teamId, placement) {
    const placementPts = PLACEMENT_POINTS[placement - 1] || 0
    const team = teams.find(t => t.id === teamId)
    const killPts = team?.total_kills || 0
    const totalPts = placementPts + killPts

    await supabase
      .from('teams')
      .update({ placement })
      .eq('id', teamId)

    // Save to match_points
    const existing = await supabase
      .from('match_points')
      .select('*')
      .eq('match_id', id)
      .eq('team_id', teamId)
      .single()

    if (existing.data) {
      await supabase
        .from('match_points')
        .update({
          placement,
          placement_points: placementPts,
          kill_points: killPts,
          total_points: totalPts
        })
        .eq('id', existing.data.id)
    } else {
      await supabase
        .from('match_points')
        .insert([{
          match_id: id,
          tournament_id: match?.tournament_id,
          team_id: teamId,
          team_name: team?.name,
          placement,
          placement_points: placementPts,
          kill_points: killPts,
          total_points: totalPts
        }])
    }

    fetchData()
  }

  async function autoCalculatePlacements() {
    // Sort by alive players first, then kills
    const sorted = [...teams].sort((a, b) => {
      const aAlive = a.players?.filter(p => p.alive).length || 0
      const bAlive = b.players?.filter(p => p.alive).length || 0
      if (bAlive !== aAlive) return bAlive - aAlive
      return b.total_kills - a.total_kills
    })

    for (let i = 0; i < sorted.length; i++) {
      await setPlacement(sorted[i].id, i + 1)
    }

    fetchData()
  }

  // Calculate points for display
  const teamsWithPoints = teams.map(team => {
    const placement = team.placement || 0
    const placementPts = PLACEMENT_POINTS[placement - 1] || 0
    const killPts = team.total_kills || 0
    return {
      ...team,
      placementPts,
      killPts,
      totalPts: placementPts + killPts
    }
  }).sort((a, b) => b.totalPts - a.totalPts)

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
          <Link href={`/match/${id}`}>
            <span className="text-slate-400 text-xs hover:text-white cursor-pointer uppercase tracking-widest font-bold">
              ← Back to Match
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-[#10b981] mt-1">
            🏆 Match Leaderboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {match?.title} | {match?.map} | {match?.round}
          </p>
        </div>

        <button
          onClick={autoCalculatePlacements}
          className="bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 font-bold px-4 py-2 rounded-lg text-sm uppercase tracking-widest transition-all border border-yellow-500/30"
        >
          ⚡ Auto Calculate
        </button>
      </div>

      {/* Points Info */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-6 max-w-3xl">
        <p className="text-slate-400 text-xs uppercase tracking-widest mb-2 font-bold">
          Points System
        </p>
        <div className="flex gap-3 flex-wrap">
          {PLACEMENT_POINTS.map((pts, i) => (
            <span key={i} className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1">
              <span className="text-slate-400">#{i + 1}</span>
              <span className="text-[#10b981] font-bold ml-1">{pts}pts</span>
            </span>
          ))}
          <span className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1">
            <span className="text-slate-400">Kill</span>
            <span className="text-[#10b981] font-bold ml-1">1pt</span>
          </span>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="max-w-3xl overflow-hidden rounded-xl border border-white/10">
        <table className="w-full">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
                Rank
              </th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
                Team
              </th>
              <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
                Alive
              </th>
              <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
                Placement
              </th>
              <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
                Place Pts
              </th>
              <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
                Kills
              </th>
              <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
                Total
              </th>
              <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
                Set
              </th>
            </tr>
          </thead>
          <tbody>
            {teamsWithPoints.map((team, index) => (
              <tr
                key={team.id}
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
                    {team.name}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-center">
                    {team.players?.map(p => (
                      <div
                        key={p.id}
                        className={`w-3 h-3 rounded-sm ${
                          p.alive ? 'bg-green-500' : 'bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-slate-300 font-bold">
                    {team.placement ? `#${team.placement}` : '-'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-[#10b981] font-bold">
                    {team.placementPts}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-blue-400 font-bold">
                    {team.total_kills}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-yellow-400 font-black text-lg">
                    {team.totalPts}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="number"
                    min="1"
                    max={teams.length}
                    placeholder="-"
                    defaultValue={team.placement || ''}
                    onBlur={(e) => {
                      if (e.target.value)
                        setPlacement(team.id, parseInt(e.target.value))
                    }}
                    className="w-12 text-center bg-white/5 border border-white/10 rounded-lg py-1 text-white text-sm focus:outline-none focus:border-[#10b981]"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </main>
  )
}