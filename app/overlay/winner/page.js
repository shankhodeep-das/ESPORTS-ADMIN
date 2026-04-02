'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'

export default function WinnerOverlay() {
  const [winner, setWinner] = useState(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    fetchWinner()

    const channel = supabase
      .channel('overlay-winner')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'matches'
      }, () => fetchWinner())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchWinner() {
    const { data } = await supabase
      .from('matches')
      .select('*, teams(*)')
      .eq('status', 'finished')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (data?.teams) {
      const winnerTeam = data.teams.find(t => t.placement === 1)
      if (winnerTeam) {
        setWinner(winnerTeam)
        setTimeout(() => setShow(true), 300)
      }
    }
  }

  if (!winner) return (
    <main className="min-h-screen bg-transparent" />
  )

  return (
    <main className="min-h-screen bg-transparent flex items-center justify-center">
      <div
        className={`transition-all duration-700 ${
          show ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
        }`}
      >
        <div className="bg-gray-900 bg-opacity-95 border-2 border-green-500 rounded-2xl p-10 text-center">
          <p className="text-yellow-400 font-bold text-lg tracking-widest mb-2">
            WINNER WINNER
          </p>
          <h1 className="text-6xl font-black text-green-400 mb-2">
            BOOYAH!
          </h1>
          <h2 className="text-4xl font-bold text-white mb-4">
            {winner.name}
          </h2>
          <p className="text-gray-400 text-xl">
            🎯 {winner.total_kills} Kills
          </p>
        </div>
      </div>
    </main>
  )
}