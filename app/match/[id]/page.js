'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useParams } from 'next/navigation'
import ActivityLog from '@/app/components/ActivityLog'
import Link from 'next/link'

export default function ManageMatch() {
  const { id } = useParams()
  const [match, setMatch] = useState(null)
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingTeamId, setEditingTeamId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [addingTeam, setAddingTeam] = useState(false)
  const [settings, setSettings] = useState(null)

  useEffect(() => {
    fetchMatch()
    fetchTeams()
    fetchSettings()
  }, [])

  async function fetchMatch() {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .eq('id', id)
      .single()
    setMatch(data)
  }

  async function fetchSettings() {
    const { data } = await supabase
      .from('overlay_settings')
      .select('*')
      .eq('match_id', id)
      .single()
    setSettings(data)
  }

  async function fetchTeams() {
    const { data } = await supabase
      .from('teams')
      .select('*, players(*)')
      .eq('match_id', id)
      .order('slot_number')
    setTeams(data || [])
    setLoading(false)
  }

  async function addTeam() {
    if (addingTeam) return
    setAddingTeam(true)
    const slotNumber = teams.length + 1
    const { data: team } = await supabase
      .from('teams')
      .insert([{
        match_id: id,
        slot_number: slotNumber,
        name: `Team ${slotNumber}`,
        total_kills: 0
      }])
      .select()
      .single()

    await supabase.from('players').insert([
      { team_id: team.id, name: 'P1' },
      { team_id: team.id, name: 'P2' },
      { team_id: team.id, name: 'P3' },
      { team_id: team.id, name: 'P4' },
    ])

    await supabase.from('activity_logs').insert([{
      match_id: id,
      team_name: team.name,
      action: 'team_added',
      message: `Team ${team.name} added to slot ${slotNumber}`
    }])

    await fetchTeams()
    setAddingTeam(false)
  }

  async function eliminatePlayer(player, team) {
    await supabase
      .from('players')
      .update({ alive: false })
      .eq('id', player.id)

    await supabase.from('activity_logs').insert([{
      match_id: id,
      team_id: team.id,
      team_name: team.name,
      player_name: player.name,
      action: 'eliminated',
      message: `${player.name} eliminated from ${team.name}`
    }])

    fetchTeams()
  }

  async function revivePlayer(player, team) {
    await supabase
      .from('players')
      .update({ alive: true })
      .eq('id', player.id)

    await supabase.from('activity_logs').insert([{
      match_id: id,
      team_id: team.id,
      team_name: team.name,
      player_name: player.name,
      action: 'revived',
      message: `${player.name} revived in ${team.name}`
    }])

    fetchTeams()
  }

  async function updatePlayerKills(player, team, value) {
    const kills = parseInt(value) || 0
    await supabase
      .from('players')
      .update({ kills })
      .eq('id', player.id)

    const updatedPlayers = team.players.map(p =>
      p.id === player.id ? { ...p, kills } : p
    )
    const totalKills = updatedPlayers.reduce((sum, p) => sum + (p.kills || 0), 0)

    await supabase
      .from('teams')
      .update({ total_kills: totalKills })
      .eq('id', team.id)

    await supabase.from('activity_logs').insert([{
      match_id: id,
      team_id: team.id,
      team_name: team.name,
      player_name: player.name,
      action: 'kill_added',
      message: `${player.name} kills updated to ${kills} in ${team.name} (Total: ${totalKills})`
    }])

    fetchTeams()
  }

  async function declareWinner(team) {
    await supabase
      .from('matches')
      .update({ status: 'finished' })
      .eq('id', id)

    await supabase
      .from('teams')
      .update({ placement: 1 })
      .eq('id', team.id)

    await supabase.from('activity_logs').insert([{
      match_id: id,
      team_name: team.name,
      action: 'winner',
      message: `🏆 Winner declared: ${team.name}`
    }])

    fetchTeams()
    fetchMatch()
  }

  async function updateTeamName(team) {
    if (!editingName.trim()) return
    await supabase
      .from('teams')
      .update({ name: editingName })
      .eq('id', team.id)

    await supabase.from('activity_logs').insert([{
      match_id: id,
      team_id: team.id,
      team_name: editingName,
      action: 'team_renamed',
      message: `Team renamed from ${team.name} to ${editingName}`
    }])

    setEditingTeamId(null)
    setEditingName('')
    fetchTeams()
  }

  async function updateMatchStatus(newStatus) {
    await supabase
      .from('matches')
      .update({ status: newStatus })
      .eq('id', id)

    await supabase.from('activity_logs').insert([{
      match_id: id,
      action: 'status_changed',
      message: `Match status changed to ${newStatus.toUpperCase()}`
    }])

    fetchMatch()
  }

  async function getOrCreateSettings() {
    const { data } = await supabase
      .from('overlay_settings')
      .select('*')
      .eq('match_id', id)
      .single()
    if (data) return data
    const { data: newSettings } = await supabase
      .from('overlay_settings')
      .insert([{ match_id: id }])
      .select()
      .single()
    return newSettings
  }

  async function updateOverlaySetting(key, value) {
    const s = await getOrCreateSettings()
    await supabase
      .from('overlay_settings')
      .update({ [key]: value })
      .eq('id', s.id)
    fetchSettings()
  }

  if (loading) return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <p className="text-gray-400">Loading...</p>
    </main>
  )

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href="/dashboard">
            <span className="text-gray-400 text-sm hover:text-white cursor-pointer">
              ← Back to Dashboard
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-green-400 mt-1">
            {match?.title}
          </h1>
          <p className="text-slate-400 text-sm mb-3">
            🗺️ {match?.map} &nbsp;|&nbsp; 🔄 {match?.round}
          </p>

          {/* Status Buttons */}
          <div className="flex gap-2">
            {['waiting', 'live', 'finished'].map((s) => (
              <button
                key={s}
                onClick={() => updateMatchStatus(s)}
                className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest transition-all ${
                  match?.status === s
                    ? s === 'live'
                      ? 'bg-red-500 text-white'
                      : s === 'waiting'
                      ? 'bg-yellow-500 text-black'
                      : 'bg-gray-500 text-white'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {s === 'live' && '🔴 '}{s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={addTeam}
            disabled={addingTeam}
            className="bg-green-500 hover:bg-green-600 text-black font-bold px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {addingTeam ? 'Adding...' : '➕ Add Team'}
          </button>
        </div>
      </div>

      {/* Overlay Controls */}
      <div className="max-w-2xl mb-6 bg-white/5 rounded-xl p-4 border border-white/10">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
          🎮 Overlay Controls
        </h3>
        <div className="flex flex-wrap gap-3">

          {/* Leaderboard Mode */}
          <div className="flex flex-col gap-1">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">
              Leaderboard Mode
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => updateOverlaySetting('leaderboard_mode', 'match')}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-widest transition-all ${
                  settings?.leaderboard_mode === 'match' || !settings
                    ? 'bg-[#10b981] text-black'
                    : 'bg-white/5 text-slate-400 border border-white/10'
                }`}
              >
                Match
              </button>
              <button
                onClick={() => updateOverlaySetting('leaderboard_mode', 'overall')}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-widest transition-all ${
                  settings?.leaderboard_mode === 'overall'
                    ? 'bg-[#10b981] text-black'
                    : 'bg-white/5 text-slate-400 border border-white/10'
                }`}
              >
                Overall
              </button>
            </div>
          </div>

          {/* Show/Hide Leaderboard */}
          <div className="flex flex-col gap-1">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">
              Leaderboard
            </p>
            <button
              onClick={() => updateOverlaySetting('show_leaderboard', !settings?.show_leaderboard)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-widest transition-all ${
                settings?.show_leaderboard !== false
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}
            >
              {settings?.show_leaderboard !== false ? '👁️ Visible' : '🙈 Hidden'}
            </button>
          </div>

          {/* Show/Hide Final 4 */}
          <div className="flex flex-col gap-1">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">
              Final 4
            </p>
            <button
              onClick={() => updateOverlaySetting('show_final4', !settings?.show_final4)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-widest transition-all ${
                settings?.show_final4 !== false
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}
            >
              {settings?.show_final4 !== false ? '👁️ Visible' : '🙈 Hidden'}
            </button>
          </div>

          {/* Copy Overlay URL */}
          <div className="flex flex-col gap-1">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">
              Overlay URL
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/overlay/main?match=${id}`)
                alert('Copied!')
              }}
              className="text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-widest bg-blue-500/20 text-blue-400 border border-blue-500/30 transition-all hover:bg-blue-500/30"
            >
              📋 Copy URL
            </button>
          </div>

        </div>
      </div>

      {teams.length === 0 && (
        <p className="text-gray-400">No teams yet. Click "Add Team" to start.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teams.map((team) => (
          <div key={team.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">

            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-sm font-bold">
                  SLOT {team.slot_number}
                </span>
                {editingTeamId === team.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && updateTeamName(team)}
                      className="bg-gray-700 border border-green-500 rounded px-2 py-1 text-white text-sm font-bold focus:outline-none w-32"
                      autoFocus
                    />
                    <button
                      onClick={() => updateTeamName(team)}
                      className="text-green-400 text-xs font-bold hover:text-green-300"
                    >
                      ✓ Save
                    </button>
                    <button
                      onClick={() => setEditingTeamId(null)}
                      className="text-red-400 text-xs font-bold hover:text-red-300"
                    >
                      ✗
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingTeamId(team.id)
                      setEditingName(team.name)
                    }}
                    className="font-bold text-lg text-white hover:text-[#10b981] transition-colors"
                  >
                    {team.name} ✏️
                  </button>
                )}
              </div>
              <span className="text-green-400 font-bold text-lg">
                🎯 {team.total_kills} kills
              </span>
            </div>

            {/* Player bars */}
            <div className="flex gap-2 mb-3">
              {team.players?.map((player) => (
                <div
                  key={player.id}
                  className={`h-3 flex-1 rounded ${
                    player.alive ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>

            {/* Players */}
            <div className="flex flex-col gap-2">
              {team.players?.map((player) => (
                <div
                  key={player.id}
                  className="flex justify-between items-center gap-2"
                >
                  <span className={`text-sm w-8 font-bold ${
                    player.alive ? 'text-white' : 'text-gray-500 line-through'
                  }`}>
                    {player.name}
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={player.kills || 0}
                    onChange={(e) => updatePlayerKills(player, team, e.target.value)}
                    disabled={!player.alive}
                    className={`w-14 text-center py-1 rounded-lg text-sm font-bold border transition-all ${
                      player.alive
                        ? 'bg-gray-700 border-gray-600 text-green-400 focus:outline-none focus:border-green-500'
                        : 'bg-gray-800 border-gray-700 text-gray-600 cursor-not-allowed'
                    }`}
                  />
                  <button
                    onClick={() => player.alive
                      ? eliminatePlayer(player, team)
                      : revivePlayer(player, team)
                    }
                    className={`text-xs px-2 py-1 rounded font-bold flex-1 ${
                      player.alive
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-gray-600 hover:bg-gray-500 text-white'
                    }`}
                  >
                    {player.alive ? '❌ Eliminate' : '♻️ Revive'}
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => declareWinner(team)}
              className="mt-3 w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 rounded-lg text-sm"
            >
              🏆 Declare Winner
            </button>

          </div>
        ))}
      </div>

      {/* Activity Log */}
      <div className="mt-8 max-w-2xl">
        <h2 className="text-xl font-bold text-green-400 mb-3">
          📋 Activity Log
        </h2>
        <ActivityLog matchId={id} />
      </div>

    </main>
  )
}