'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'

export default function SlotListOverlay() {
  const [teams, setTeams] = useState([])

  useEffect(() => {
    fetchTeams()

    const channel = supabase
      .channel('overlay-teams')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'teams'
      }, () => fetchTeams())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'players'
      }, () => fetchTeams())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchTeams() {
    const { data } = await supabase
      .from('teams')
      .select('*, players(*)')
      .order('total_kills', { ascending: false })

    setTeams(data || [])
  }

  return (
    <main className="min-h-screen bg-transparent p-4">
      <div className="flex flex-col gap-2 w-64">
        {teams.map((team, index) => (
          <div
            key={team.id}
            className="bg-gray-900 bg-opacity-90 rounded-lg px-3 py-2 border border-gray-700"
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

            {/* Player bars */}
            <div className="flex gap-1">
              {team.players?.map((player) => (
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