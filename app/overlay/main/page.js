'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'

export default function MainOverlay() {
  const [teams, setTeams] = useState([])
  const [overlayState, setOverlayState] = useState('slotlist')
  const [winner, setWinner] = useState(null)

  useEffect(() => {
    fetchTeams()
    checkMatchStatus()

    const channel = supabase
      .channel('main-overlay')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'teams'
      }, () => {
        fetchTeams()
        checkMatchStatus()
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'players'
      }, () => fetchTeams())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'matches'
      }, () => {
        fetchTeams()
        checkMatchStatus()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchTeams() {
    const { data: liveMatch, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'live')
      .limit(1)
      .single()

    if (matchError || !liveMatch) {
      console.log('No live match found')
      setTeams([])
      return
    }

    const { data, error } = await supabase
      .from('teams')
      .select('*, players(*)')
      .eq('match_id', liveMatch.id)
      .order('total_kills', { ascending: false })

    if (error || !data) {
      setTeams([])
      return
    }

    setTeams(data)

    const aliveTeams = data.filter(t =>
      t.players?.some(p => p.alive === true)
    )

    if (aliveTeams.length <= 4 && aliveTeams.length > 0) {
      setOverlayState('final4')
    } else {
      setOverlayState('slotlist')
    }
  }

  async function checkMatchStatus() {
    // Find finished match
    const { data: finishedMatch } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'finished')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!finishedMatch) return

    // Find winner team directly
    const { data: winnerTeam } = await supabase
      .from('teams')
      .select('*')
      .eq('match_id', finishedMatch.id)
      .eq('placement', 1)
      .single()

    if (winnerTeam) {
      setWinner(winnerTeam)
      setOverlayState('booyah')
    }
  }

  const aliveTeams = teams.filter(t =>
    t.players?.some(p => p.alive === true)
  )

  if (overlayState === 'slotlist') {
    return (
      <main className="min-h-screen bg-transparent p-4">
        <div className="flex flex-col gap-2 w-72">
          {teams.map((team, index) => (
            <div
              key={team.id}
              className="bg-gray-900/90 rounded-lg px-3 py-2 border border-gray-700"
            >
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400 text-xs font-bold">
                    #{index + 1}
                  </span>
                  <span className="text-white text-sm font-bold">
                    {team.name}
                  </span>
                </div>
                <span className="text-green-400 text-sm font-bold">
                  {team.total_kills} kills
                </span>
              </div>
              <div className="flex gap-1">
                {team.players?.map(player => (
                  <div
                    key={player.id}
                    className={`h-2 flex-1 rounded-sm transition-all duration-500 ${
                      player.alive ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    )
  }

  if (overlayState === 'final4') {
    return (
      <main className="min-h-screen bg-black/80 flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 w-full max-w-lg p-8">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"/>
            <h1 className="text-yellow-400 text-2xl font-black uppercase tracking-widest">
              ⚡ Final {aliveTeams.length} Teams
            </h1>
            <span className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"/>
          </div>

          <div className="flex flex-col gap-3 w-full">
            {aliveTeams.map((team, index) => (
              <div
                key={team.id}
                className="bg-yellow-500/10 border border-yellow-500/40 rounded-xl px-5 py-3"
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-yellow-400 font-black text-xl">
                      #{index + 1}
                    </span>
                    <span className="text-white font-black text-xl">
                      {team.name}
                    </span>
                  </div>
                  <span className="text-yellow-400 font-bold">
                    {team.total_kills} kills
                  </span>
                </div>
                <div className="flex gap-1">
                  {team.players?.map(player => (
                    <div
                      key={player.id}
                      className={`h-3 flex-1 rounded-sm transition-all duration-500 ${
                        player.alive ? 'bg-yellow-400' : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    )
  }

  if (overlayState === 'booyah') {
    return (
      <main className="min-h-screen bg-black/90 flex items-center justify-center">
        <div className="text-center">
          <p className="text-yellow-400 font-bold text-xl tracking-widest uppercase mb-4">
            Winner Winner
          </p>
          <h1 className="text-8xl font-black text-green-400 mb-6 drop-shadow-[0_0_30px_rgba(16,185,129,0.8)]">
            BOOYAH!
          </h1>
          <h2 className="text-5xl font-black text-white mb-4">
            {winner?.name}
          </h2>
          <p className="text-2xl text-gray-400">
            🎯 {winner?.total_kills} Kills
          </p>
        </div>
      </main>
    )
  }

  return null
}