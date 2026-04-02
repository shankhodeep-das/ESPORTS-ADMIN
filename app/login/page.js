'use client'

import { useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      setError('Wrong email or password')
      setLoading(false)
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      document.cookie = `sb-access-token=${session.access_token}; path=/`
      document.cookie = `sb-refresh-token=${session.refresh_token}; path=/`
    }

    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-6">
      <div className="w-full max-w-md p-10 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-2xl shadow-2xl">

        <header className="mb-10 text-center">
          <h1 className="text-3xl font-extrabold text-[#10b981] uppercase tracking-tight">
            Admin Login
          </h1>
          <p className="text-slate-500 text-xs uppercase tracking-widest mt-2">
            Tournament Control Panel
          </p>
        </header>

        <form onSubmit={handleLogin} className="flex flex-col gap-6">

          <div className="flex flex-col gap-2 group/input">
            <label className="text-xs font-bold tracking-widest text-slate-400 uppercase ml-1 transition-colors group-focus-within/input:text-[#10b981]">
              Email
            </label>
            <input
              type="email"
              placeholder="admin@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-medium placeholder:text-slate-600
                         focus:outline-none focus:border-[#10b981] focus:ring-4 focus:ring-[#10b981]/10
                         transition-all duration-300"
            />
          </div>

          <div className="flex flex-col gap-2 group/input">
            <label className="text-xs font-bold tracking-widest text-slate-400 uppercase ml-1 transition-colors group-focus-within/input:text-[#10b981]">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-medium placeholder:text-slate-600
                         focus:outline-none focus:border-[#10b981] focus:ring-4 focus:ring-[#10b981]/10
                         transition-all duration-300"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center font-bold">
              ❌ {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#10b981] text-black font-black rounded-lg uppercase text-sm tracking-widest
                       hover:-translate-y-1.5 hover:bg-[#1fd998] hover:shadow-[0_15px_30px_-5px_rgba(16,185,129,0.5)]
                       active:translate-y-0.5 transition-all duration-200 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

        </form>
      </div>
    </main>
  )
}