'use client'

import { useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CreateMatch() {
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [map, setMap] = useState('')
  const [round, setRound] = useState('')
  const [game, setGame] = useState('BGMI')
  const [customGame, setCustomGame] = useState('')
  const [loading, setLoading] = useState(false)

  const finalGame = customGame || game

  async function handleCreate(e) {
    e.preventDefault()
    if (!title) return alert('Please enter a match title')
    setLoading(true)

    const { error } = await supabase
      .from('matches')
      .insert([{ title, map, round, status: 'waiting', game: finalGame }])
      .select()

    if (error) {
      alert('Error creating match: ' + error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen bg-[#0a0a0c] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#111827] via-[#0a0a0c] to-[#0a0a0c] flex flex-col items-center justify-center p-6 font-sans">

      <div className="w-full max-w-lg p-10 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-2xl shadow-2xl relative overflow-hidden hover:shadow-[0_0_60px_-15px_rgba(16,185,129,0.15)] transition-all duration-500">

        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#10b981]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"/>

        {/* Header */}
        <header className="mb-10 flex items-center gap-4 pb-6 border-b border-white/10">
          <div className="p-3 bg-[#10b981]/10 rounded-full text-[#10b981] shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"/><path d="M12 5v14"/>
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#10b981] drop-shadow-[0_0_15px_rgba(16,185,129,0.4)] uppercase">
              New Match
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              Initialize Tournament Data
            </p>
          </div>
        </header>

        <form onSubmit={handleCreate} className="flex flex-col gap-6">

          {/* Match Title */}
          <div className="flex flex-col gap-2 group/input">
            <label className="text-xs font-bold tracking-widest text-slate-400 uppercase ml-1 transition-colors group-focus-within/input:text-[#10b981]">
              Match Title
            </label>
            <input
              type="text"
              placeholder="e.g. BGMI FINALS / FREE FIRE CUP"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-medium placeholder:text-slate-600
                         focus:outline-none focus:border-[#10b981] focus:ring-4 focus:ring-[#10b981]/10 focus:bg-white/10
                         transition-all duration-300 shadow-inner"
            />
          </div>

          {/* Game Selector */}
          <div className="flex flex-col gap-3 group/input">
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
                    setCustomGame('')
                    setMap('')
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

            {/* Custom Game Input */}
            <input
              type="text"
              placeholder="Or type a custom game name..."
              value={customGame}
              onChange={(e) => {
                setCustomGame(e.target.value)
                setMap('')
              }}
              className="w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm
                         placeholder:text-slate-600 focus:outline-none focus:border-[#10b981] focus:ring-4 focus:ring-[#10b981]/10
                         transition-all duration-300"
            />
          </div>

          {/* Map Input with Datalist */}
          <div className="flex flex-col gap-2 group/input">
            <label className="text-xs font-bold tracking-widest text-slate-400 uppercase ml-1 transition-colors group-focus-within/input:text-[#10b981]">
              Map
            </label>
            <input
              type="text"
              list="map-options"
              placeholder="Select or type a map name..."
              value={map}
              onChange={(e) => setMap(e.target.value)}
              className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-medium placeholder:text-slate-600
                         focus:outline-none focus:border-[#10b981] focus:ring-4 focus:ring-[#10b981]/10 focus:bg-white/10
                         transition-all duration-300 shadow-inner"
            />
            <datalist id="map-options">
              {!customGame && game === 'BGMI' && (
                <>
                  <option value="Erangel" />
                  <option value="Miramar" />
                  <option value="Sanhok" />
                  <option value="Vikendi" />
                  <option value="Livik" />
                </>
              )}
              {!customGame && game === 'Free Fire' && (
                <>
                  <option value="Bermuda" />
                  <option value="Purgatory" />
                  <option value="Kalahari" />
                  <option value="Alpine" />
                  <option value="Nexterra" />
                </>
              )}
            </datalist>
          </div>

          {/* Round */}
          <div className="flex flex-col gap-2 group/input">
            <label className="text-xs font-bold tracking-widest text-slate-400 uppercase ml-1 transition-colors group-focus-within/input:text-[#10b981]">
              Match Name / Round
            </label>
            <input
              type="text"
              placeholder="e.g. Qualifiers / Finals / R1"
              value={round}
              onChange={(e) => setRound(e.target.value)}
              className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-medium placeholder:text-slate-600
                         focus:outline-none focus:border-[#10b981] focus:ring-4 focus:ring-[#10b981]/10 focus:bg-white/10
                         transition-all duration-300 shadow-inner"
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-4 text-xs font-bold text-slate-500 hover:text-white uppercase tracking-widest transition-colors text-center"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#10b981] text-[#0a0a0c] font-black rounded-lg uppercase text-sm tracking-widest
                         cursor-pointer transition-all duration-200 ease-out
                         hover:-translate-y-1.5 hover:bg-[#1fd998] hover:shadow-[0_15px_30px_-5px_rgba(16,185,129,0.5)]
                         active:translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Match'}
            </button>
          </div>

        </form>
      </div>
    </main>
  )
}
