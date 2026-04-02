'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Dashboard() {
  const router = useRouter()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [time, setTime] = useState('')
  const [liveMatch, setLiveMatch] = useState(null)

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchMatches()
    checkLiveMatch()
  }, [])

  async function fetchMatches() {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) console.log('Error:', error)
    else setMatches(data)
    setLoading(false)
  }

  async function checkLiveMatch() {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'live')
      .limit(1)
      .single()
    setLiveMatch(data)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    router.push('/login')
  }

  return (
    <main className="min-h-screen bg-[#0a0a0c] text-white p-6">

      <div className="text-center mb-6">
        <p className="text-2xl font-black text-white tracking-widest font-mono">
          {time}
        </p>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">
          Indian Standard Time (IST)
        </p>
      </div>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#10b981]">
            📊 Dashboard
          </h1>
          {liveMatch && (
            <div className="mt-2 flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-3 py-1 w-fit">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/>
              <span className="text-red-400 text-xs font-bold uppercase tracking-widest">
                {liveMatch.title} is LIVE
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <Link href="/match/create">
            <button className="bg-[#10b981] hover:bg-[#1fd998] text-black font-bold px-4 py-2 rounded-lg text-sm uppercase tracking-widest transition-all hover:-translate-y-1">
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
        <p className="text-slate-400">Loading matches...</p>
      )}

      {!loading && matches.length === 0 && (
        <p className="text-slate-400">No matches yet. Create one!</p>
      )}

      <div className="flex flex-col gap-4 max-w-2xl">
        {matches.map((match) => (
          <div
            key={match.id}
            className="bg-white/5 rounded-xl p-5 border border-white/10 hover:border-[#10b981]/30 transition-all"
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {match.title}
                </h2>
                <p className="text-slate-400 text-sm mt-1">
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
                  <button className="bg-[#10b981] hover:bg-[#1fd998] text-black text-sm font-bold px-3 py-1 rounded-lg transition-all">
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
