'use client'

import { useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CreateTournament() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [game, setGame] = useState('BGMI')
  const [customGame, setCustomGame] = useState(null)
  const [loading, setLoading] = useState(false)

  const finalGame = customGame || game

  async function handleCreate(e) {
    e.preventDefault()
    if (!name) return alert('Please enter tournament name')
    setLoading(true)

    const { error } = await supabase
      .from('tournaments')
      .insert([{
        name,
        game: finalGame,
        status: 'active'
      }])

    if (error) {
      alert('Error: ' + error.message)
      setLoading(false)
      return
    }

    router.push('/tournaments')
  }

  return (
    <main className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-6">
      <div className="w-full max-w-lg p-10 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-2xl shadow-2xl relative overflow-hidden hover:shadow-[0_0_60px_-15px_rgba(16,185,129,0.15)] transition-all duration-500">

        <div className="absolute top-0 right-0 w-32 h-32 bg-[#10b981]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"/>

        <header className="mb-10 flex items-center gap-4 pb-6 border-b border-white/10">
          <div className="p-3 bg-[#10b981]/10 rounded-full text-[#10b981]">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"/><path d="M12 5v14"/>
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#10b981] uppercase">
              New Tournament
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              Create Tournament
            </p>
          </div>
        </header>

        <form onSubmit={handleCreate} className="flex flex-col gap-6">

          {/* Tournament Name */}
          <div className="flex flex-col gap-2 group/input">
            <label className="text-xs font-bold tracking-widest text-slate-400 uppercase ml-1 transition-colors group-focus-within/input:text-[#10b981]">
              Tournament Name
            </label>
            <input
              type="text"
              placeholder="e.g. FXAE OPEN 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-medium placeholder:text-slate-600
                         focus:outline-none focus:border-[#10b981] focus:ring-4 focus:ring-[#10b981]/10
                         transition-all duration-300"
            />
          </div>

          {/* Game Selector */}
          <div className="flex flex-col gap-3">
            <label className="text-xs font-bold tracking-widest text-slate-400 uppercase ml-1">
              Game
            </label>
            <div className="flex gap-3">
              {['BGMI', 'Free Fire'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => {
                    setGame(g)
                    setCustomGame(null)
                  }}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all duration-200 ${
                    finalGame === g && !customGame
                      ? 'bg-[#10b981] text-black shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                      : 'bg-white/5 border border-white/10 text-slate-400 hover:border-[#10b981]/50'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setCustomGame(customGame === null ? '' : null)}
              className="text-xs text-slate-500 hover:text-[#10b981] transition-colors text-left"
            >
              {customGame === null ? '+ Use custom game name' : '− Use preset games'}
            </button>

            {customGame !== null && (
              <input
                type="text"
                placeholder="Type custom game name..."
                value={customGame}
                onChange={(e) => setCustomGame(e.target.value)}
                className="w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm
                           placeholder:text-slate-600 focus:outline-none focus:border-[#10b981]
                           transition-all duration-300"
              />
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-4 mt-4">
            <Link
              href="/tournaments"
              className="px-6 py-4 text-xs font-bold text-slate-500 hover:text-white uppercase tracking-widest transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-4 bg-[#10b981] text-black font-black rounded-lg uppercase text-sm tracking-widest
                         hover:-translate-y-1.5 hover:bg-[#1fd998] hover:shadow-[0_15px_30px_-5px_rgba(16,185,129,0.5)]
                         active:translate-y-0.5 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Tournament'}
            </button>
          </div>

        </form>
      </div>
    </main>
  )
}