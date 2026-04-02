"use client"

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabase'

export default function Home() {
  const [title, setTitle] = useState('FXAE')
  const [isEditing, setIsEditing] = useState(false)
  const [time, setTime] = useState('')
  const [liveMatch, setLiveMatch] = useState(null)

  // Live Clock
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

  // Check for live match
  useEffect(() => {
    checkLiveMatch()
  }, [])

  async function checkLiveMatch() {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'live')
      .limit(1)
      .single()
    setLiveMatch(data)
  }

  return (
    <main className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center p-6 font-sans">

      {/* Live Clock Top */}
      <div className="mb-6 text-center">
        <p className="text-3xl font-black text-white tracking-widest font-mono">
          {time}
        </p>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">
          THIS TIME IS ACCORDING TO INDIAN STANDARD TIME (IST)
        </p>
      </div>

      <div className="relative w-full max-w-md p-10 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl
                      transition-all duration-500 ease-in-out
                      hover:shadow-[0_0_60px_-15px_rgba(37,99,235,0.2)]">

        {/* Pencil Icon */}
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer group/pencil"
          title="Edit Title"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18" height="18"
            viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            className={`${isEditing ? 'text-[#10b981]' : 'text-slate-400'} group-hover/pencil:scale-110 transition-transform`}
          >
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
            <path d="m15 5 4 4"/>
          </svg>
        </button>

        <header className="mb-10 text-center">
          <h1 className="text-5xl font-extrabold tracking-tighter text-[#10b981] drop-shadow-[0_0_20px_rgba(16,185,129,0.6)] uppercase break-words">
            {title}
          </h1>
          <div className="h-[2px] w-16 bg-[#10b981] mx-auto mt-4 mb-2"></div>

          {/* Editable Title Input */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isEditing ? 'max-h-20 opacity-100 mt-6' : 'max-h-0 opacity-0'}`}>
            <input
              type="text"
              placeholder="Enter org name..."
              maxLength={12}
              autoFocus
              className="w-full bg-white/10 border border-white/20 rounded-md py-2 px-3 text-sm text-center text-white
                         focus:outline-none focus:border-[#10b981] transition-all shadow-inner"
              onChange={(e) => setTitle(e.target.value || 'F X AE')}
            />
          </div>

          <p className="text-[10px] mt-4 text-slate-500 uppercase tracking-widest font-semibold">
            Tournament Control Panel
          </p>

          {/* Live Match Status Indicator */}
          {liveMatch && (
            <div className="mt-4 flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-4 py-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/>
              <span className="text-red-400 text-xs font-bold uppercase tracking-widest">
                {liveMatch.title} is LIVE
              </span>
            </div>
          )}
        </header>

        <div className="flex flex-col gap-6">
          <Link href="/match/create" className="w-full">
            <button className="w-full py-4 bg-[#2563eb] text-white font-bold rounded-md uppercase text-sm tracking-widest
                             cursor-pointer transition-all duration-200 ease-out
                             hover:-translate-y-1.5 hover:bg-[#3b82f6]
                             hover:shadow-[0_15px_30px_-5px_rgba(37,99,235,0.6)]
                             active:translate-y-0.5 active:scale-[0.97]">
              Create New Match
            </button>
          </Link>

          <Link href="/dashboard" className="w-full">
            <button className="w-full py-4 bg-transparent border-2 border-[#2563eb] text-[#2563eb] font-bold rounded-md uppercase text-sm tracking-widest
                             cursor-pointer transition-all duration-200 ease-out
                             hover:-translate-y-1.5 hover:bg-[#2563eb]/10
                             hover:shadow-[0_10px_20px_rgba(37,99,235,0.3)]
                             active:translate-y-0.5 active:scale-[0.97]">
              Go to Dashboard
            </button>
          </Link>
        </div>
      </div>
    </main> 
  )
}