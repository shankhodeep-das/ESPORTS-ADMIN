'use client'

import { useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'

export default function CreateMatch() {
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [map, setMap] = useState('')
  const [round, setRound] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    if (!title) return alert('Please enter a match title')
    setLoading(true)

    const { data, error } = await supabase
      .from('matches')
      .insert([{ title, map, round, status: 'waiting' }])
      .select()

    if (error) {
      alert('Error creating match: ' + error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <h1 className="text-2xl font-bold text-green-400 mb-6">
        ➕ Create New Match
      </h1>

      <div className="max-w-md flex flex-col gap-4">

        <div>
          <label className="text-gray-400 text-sm">Match Title</label>
          <input
            className="w-full mt-1 p-3 bg-gray-800 rounded-lg border border-gray-700 text-white"
            placeholder="e.g. BGMI / FREE FIRE, etc"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="text-gray-400 text-sm">Map</label>
          <input
            className="w-full mt-1 p-3 bg-gray-800 rounded-lg border border-gray-700 text-white"
            placeholder="e.g. Erangel / Bermuda, etc"
            value={map}
            onChange={(e) => setMap(e.target.value)}
          />
        </div>

        <div>
          <label className="text-gray-400 text-sm">Round</label>
          <input
            className="w-full mt-1 p-3 bg-gray-800 rounded-lg border border-gray-700 text-white"
            placeholder="e.g. R1 / league, Finals, etc"
            value={round}
            onChange={(e) => setRound(e.target.value)}
          />
        </div>

        <button
          onClick={handleCreate}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 text-black font-bold py-3 rounded-lg mt-2"
        >
          {loading ? 'Creating...' : 'Create Match'}
        </button>

      </div>
    </main>
  )
}
