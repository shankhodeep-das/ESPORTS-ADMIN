'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function ManageMatch() {
  const { id } = useParams()
  const [match, setMatch] = useState(null)
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [addingTeam, setAddingTeam] = useState(false)
  const [settings, setSettings] = useState(null)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [toast, setToast] = useState(null)
  const [editingCell, setEditingCell] = useState(null) // { teamIdx, playerIdx, field }
  const [editingValue, setEditingValue] = useState('')
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [booyahTeamId, setBooyahTeamId] = useState(null)
  const [logs, setLogs] = useState([])
  const killTimers = useRef({})
  const [localKills, setLocalKills] = useState({})
  const inputRef = useRef(null)

  useEffect(() => { fetchMatch(); fetchTeams(); fetchSettings(); fetchLogs() }, [])

  useEffect(() => {
    const channel = supabase
      .channel('sheet-logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, () => fetchLogs())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  useEffect(() => {
    if (editingCell && inputRef.current) inputRef.current.focus()
  }, [editingCell])

  async function fetchMatch() {
    const { data } = await supabase.from('matches').select('*').eq('id', id).single()
    setMatch(data)
  }
  async function fetchSettings() {
    const { data } = await supabase.from('overlay_settings').select('*').eq('match_id', id).single()
    setSettings(data)
  }
  async function fetchTeams() {
    const { data } = await supabase.from('teams').select('*, players(*)').eq('match_id', id).order('slot_number')
    setTeams(data || [])
    setLoading(false)
  }
  async function fetchLogs() {
    const { data } = await supabase.from('activity_logs').select('*').eq('match_id', id).order('created_at', { ascending: false }).limit(30)
    setLogs(data || [])
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  async function addTeam() {
    if (addingTeam) return
    setAddingTeam(true)
    const slotNumber = teams.length + 1
    const { data: team } = await supabase.from('teams').insert([{ match_id: id, slot_number: slotNumber, name: `Team ${slotNumber}`, total_kills: 0 }]).select().single()
    await supabase.from('players').insert([{ team_id: team.id, name: 'P1', alive: true, kills: 0 }, { team_id: team.id, name: 'P2', alive: true, kills: 0 }, { team_id: team.id, name: 'P3', alive: true, kills: 0 }, { team_id: team.id, name: 'P4', alive: true, kills: 0 }])
    await supabase.from('activity_logs').insert([{ match_id: id, team_name: team.name, action: 'team_added', message: `Team "${team.name}" added to slot ${slotNumber}` }])
    await fetchTeams()
    setAddingTeam(false)
    showToast(`Team ${slotNumber} added`)
  }

  async function updateMatchStatus(newStatus) {
    await supabase.from('matches').update({ status: newStatus }).eq('id', id)
    await supabase.from('activity_logs').insert([{ match_id: id, action: 'status_changed', message: `Match status → ${newStatus.toUpperCase()}` }])
    fetchMatch()
    showToast(`Status: ${newStatus}`)
  }

  async function updateTeamName(team, newName) {
    if (!newName.trim()) return
    await supabase.from('teams').update({ name: newName }).eq('id', team.id)
    await supabase.from('activity_logs').insert([{ match_id: id, team_id: team.id, team_name: newName, action: 'team_renamed', message: `Team renamed: "${team.name}" → "${newName}"` }])
    fetchTeams()
  }

  async function updatePlayerName(player, team, newName) {
    if (!newName.trim()) return
    await supabase.from('players').update({ name: newName }).eq('id', player.id)
    fetchTeams()
  }

  function handleKillInput(player, team, value) {
    const kills = parseInt(value) || 0
    setLocalKills(prev => ({ ...prev, [player.id]: kills }))
    if (killTimers.current[player.id]) clearTimeout(killTimers.current[player.id])
    killTimers.current[player.id] = setTimeout(async () => {
      await supabase.from('players').update({ kills }).eq('id', player.id)
      const updatedPlayers = team.players.map(p => p.id === player.id ? { ...p, kills } : p)
      const totalKills = updatedPlayers.reduce((sum, p) => {
        const k = localKills[p.id] !== undefined ? localKills[p.id] : (p.kills || 0)
        return sum + k
      }, 0)
      await supabase.from('teams').update({ total_kills: totalKills }).eq('id', team.id)
      await supabase.from('activity_logs').insert([{ match_id: id, team_id: team.id, team_name: team.name, player_name: player.name, action: 'kill_added', message: `${player.name} (${team.name}): kills → ${kills} | Team total: ${totalKills}` }])
      fetchTeams()
    }, 600)
  }

  async function toggleElim(player, team) {
    const newAlive = !player.alive
    await supabase.from('players').update({ alive: newAlive }).eq('id', player.id)
    const action = newAlive ? 'revived' : 'eliminated'
    await supabase.from('activity_logs').insert([{ match_id: id, team_id: team.id, team_name: team.name, player_name: player.name, action, message: `${player.name} (${team.name}) ${action}` }])
    fetchTeams()
    showToast(`${player.name} ${newAlive ? 'revived' : 'eliminated'}`, newAlive ? 'success' : 'danger')
  }

  async function eliminateAllInTeam(team) {
    await Promise.all(team.players.map(p => supabase.from('players').update({ alive: false }).eq('id', p.id)))
    await supabase.from('activity_logs').insert([{ match_id: id, team_id: team.id, team_name: team.name, action: 'eliminated', message: `All players in "${team.name}" eliminated` }])
    fetchTeams()
    showToast(`${team.name}: all eliminated`, 'danger')
  }

  async function reviveAllInTeam(team) {
    await Promise.all(team.players.map(p => supabase.from('players').update({ alive: true }).eq('id', p.id)))
    await supabase.from('activity_logs').insert([{ match_id: id, team_id: team.id, team_name: team.name, action: 'revived', message: `All players in "${team.name}" revived` }])
    fetchTeams()
    showToast(`${team.name}: all revived`, 'success')
  }

  async function declareBooyah(team) {
    setBooyahTeamId(team.id)
    await supabase.from('matches').update({ status: 'finished' }).eq('id', id)
    await supabase.from('teams').update({ placement: 1 }).eq('id', team.id)
    await supabase.from('activity_logs').insert([{ match_id: id, team_name: team.name, action: 'winner', message: `BOOYAH! Winner: "${team.name}"` }])
    fetchTeams(); fetchMatch()
    showToast(`🏆 ${team.name} wins!`, 'success')
  }

  async function getOrCreateSettings() {
    const { data } = await supabase.from('overlay_settings').select('*').eq('match_id', id).single()
    if (data) return data
    const { data: ns } = await supabase.from('overlay_settings').insert([{ match_id: id }]).select().single()
    return ns
  }
  async function updateOverlaySetting(key, value) {
    const s = await getOrCreateSettings()
    await supabase.from('overlay_settings').update({ [key]: value }).eq('id', s.id)
    fetchSettings()
  }
  function copyOverlayUrl() {
    navigator.clipboard.writeText(`${window.location.origin}/overlay/main?match=${id}`)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
    showToast('Overlay URL copied!')
  }

  function startEdit(teamIdx, playerIdx, field, currentValue) {
    setEditingCell({ teamIdx, playerIdx, field })
    setEditingValue(String(currentValue))
  }
  function cancelEdit() { setEditingCell(null); setEditingValue('') }
  function commitEdit() {
    if (!editingCell) return
    const { teamIdx, playerIdx, field } = editingCell
    const team = teams[teamIdx]
    if (field === 'teamName') {
      updateTeamName(team, editingValue)
    } else if (field === 'playerName') {
      const player = team.players[playerIdx]
      updatePlayerName(player, team, editingValue)
    } else if (field === 'kills') {
      const player = team.players[playerIdx]
      handleKillInput(player, team, editingValue)
    }
    cancelEdit()
  }

  const aliveCount = (team) => team.players?.filter(p => p.alive).length ?? 0
  const teamKills = (team) => team.players?.reduce((s, p) => s + (localKills[p.id] !== undefined ? localKills[p.id] : (p.kills || 0)), 0) ?? 0

  const statusColor = { waiting: '#f5c842', live: '#e84040', finished: '#10b981' }
  const statusBg = { waiting: 'rgba(245,200,66,0.12)', live: 'rgba(232,64,64,0.12)', finished: 'rgba(16,185,129,0.12)' }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0c0f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Mono', monospace" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '2px solid rgba(16,185,129,0.2)', borderTop: '2px solid #10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
        <div style={{ fontSize: 10, color: 'rgba(16,185,129,0.4)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Loading Match</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Space+Mono:wght@400;700&family=Barlow+Condensed:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .sh-root {
          min-height: 100vh;
          background: #0a0c0f;
          font-family: 'Barlow Condensed', sans-serif;
          color: #e2e8e4;
        }

        /* ── TOPBAR ── */
        .sh-topbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 16px;
          height: 44px;
          background: #12151a;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          position: sticky; top: 0; z-index: 100;
        }
        .sh-topbar-left { display: flex; align-items: center; gap: 0; }
        .sh-breadcrumb { font-family: 'Space Mono', monospace; font-size: 10px; color: rgba(16,185,129,0.4); letter-spacing: 0.14em; text-transform: uppercase; text-decoration: none; transition: color 0.2s; }
        .sh-breadcrumb:hover { color: rgba(16,185,129,0.8); }
        .sh-sep { font-size: 11px; color: rgba(255,255,255,0.15); margin: 0 8px; }
        .sh-filetitle { font-family: 'Space Mono', monospace; font-size: 10px; color: rgba(255,255,255,0.6); letter-spacing: 0.1em; }
        .sh-topbar-actions { display: flex; align-items: center; gap: 8px; }

        .sh-status-chip {
          padding: 4px 12px; border-radius: 3px; cursor: pointer;
          font-family: 'Space Mono', monospace; font-size: 9px; font-weight: 700;
          letter-spacing: 0.14em; text-transform: uppercase; transition: all 0.15s; border: none;
        }
        .sh-icon-btn {
          padding: 6px 12px; border-radius: 4px; cursor: pointer; font-family: 'Barlow Condensed', sans-serif;
          font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; border: none;
          background: rgba(255,255,255,0.06); color: rgba(220,230,225,0.65);
          border: 1px solid rgba(255,255,255,0.1); transition: all 0.15s; white-space: nowrap;
        }
        .sh-icon-btn:hover { background: rgba(255,255,255,0.1); color: #e2e8e4; }
        .sh-icon-btn.primary { background: #10b981; color: #021a0e; border-color: #10b981; }
        .sh-icon-btn.primary:hover { background: #0ecf8e; }
        .sh-icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* ── SHEET TOOLBAR ── */
        .sh-toolbar {
          display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
          padding: 7px 14px;
          background: #0f1217;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .sh-toolbar-sep { width: 1px; height: 20px; background: rgba(255,255,255,0.1); margin: 0 4px; }
        .sh-toolbar-btn {
          padding: 4px 10px; border-radius: 3px; cursor: pointer; border: none;
          background: transparent; color: rgba(220,230,225,0.55);
          font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 0.08em;
          transition: all 0.15s; white-space: nowrap;
        }
        .sh-toolbar-btn:hover { background: rgba(255,255,255,0.07); color: #e2e8e4; }
        .sh-toolbar-btn.danger { color: rgba(232,64,64,0.7); }
        .sh-toolbar-btn.danger:hover { background: rgba(232,64,64,0.1); color: #e84040; }
        .sh-toolbar-btn.success { color: rgba(16,185,129,0.7); }
        .sh-toolbar-btn.success:hover { background: rgba(16,185,129,0.1); color: #10b981; }
        .sh-toolbar-btn.gold { color: rgba(245,200,66,0.7); }
        .sh-toolbar-btn.gold:hover { background: rgba(245,200,66,0.1); color: #f5c842; }

        .sh-ov-btn {
          padding: 4px 10px; border-radius: 3px; cursor: pointer; border: none;
          font-family: 'Space Mono', monospace; font-size: 9px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
          transition: all 0.15s;
        }
        .sh-ov-on  { background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.25); }
        .sh-ov-off { background: rgba(255,255,255,0.04); color: rgba(180,200,190,0.4); border: 1px solid rgba(255,255,255,0.08); }
        .sh-ov-on:hover  { background: rgba(16,185,129,0.25); }
        .sh-ov-off:hover { background: rgba(255,255,255,0.08); color: rgba(220,235,228,0.7); }

        /* ── LAYOUT ── */
        .sh-body { display: flex; height: calc(100vh - 88px); overflow: hidden; }
        .sh-main { flex: 1; overflow: auto; }
        .sh-sidebar { width: 260px; flex-shrink: 0; border-left: 1px solid rgba(255,255,255,0.07); overflow-y: auto; background: #0d1014; }

        /* ── SPREADSHEET TABLE ── */
        .sh-table-wrap { min-width: 100%; }
        table.sh-table { border-collapse: collapse; width: 100%; min-width: 900px; font-size: 13px; }

        /* Col header row */
        .sh-col-hd {
          position: sticky; top: 0; z-index: 10;
          background: #12151a;
          border-bottom: 2px solid rgba(16,185,129,0.2);
        }
        .sh-col-hd th {
          padding: 8px 10px; text-align: left;
          font-family: 'Space Mono', monospace; font-size: 9px; font-weight: 700;
          color: rgba(16,185,129,0.4); letter-spacing: 0.2em; text-transform: uppercase;
          border-right: 1px solid rgba(255,255,255,0.05);
          white-space: nowrap; user-select: none;
        }
        .sh-col-hd th:first-child { width: 36px; background: #10151a; }
        .sh-col-hd th.center { text-align: center; }

        /* Row number column */
        .sh-rownum {
          width: 36px; text-align: center;
          font-family: 'Space Mono', monospace; font-size: 9px;
          color: rgba(255,255,255,0.18); background: #10151a;
          border-right: 1px solid rgba(255,255,255,0.07);
          user-select: none; cursor: default;
        }

        /* Team header row */
        .sh-team-row {
          background: #141820;
          border-top: 2px solid rgba(16,185,129,0.12);
        }
        .sh-team-row td {
          padding: 8px 10px; border-right: 1px solid rgba(255,255,255,0.04);
        }
        .sh-team-name-cell {
          font-family: 'Rajdhani', sans-serif; font-size: 18px; font-weight: 700;
          color: #fff; letter-spacing: 0.04em; text-transform: uppercase;
          cursor: pointer; user-select: none;
          display: flex; align-items: center; gap: 8px;
        }
        .sh-team-name-cell .pencil { font-size: 11px; opacity: 0.3; transition: opacity 0.2s; }
        .sh-team-name-cell:hover .pencil { opacity: 0.7; }

        /* Player data rows */
        .sh-player-row { border-bottom: 1px solid rgba(255,255,255,0.04); transition: background 0.1s; }
        .sh-player-row:hover { background: rgba(255,255,255,0.025); }
        .sh-player-row.selected { background: rgba(16,185,129,0.06); }
        .sh-player-row.dead-row { opacity: 0.5; }
        .sh-player-row td { padding: 0; border-right: 1px solid rgba(255,255,255,0.04); }

        .sh-cell {
          padding: 7px 10px; min-height: 36px; display: flex; align-items: center;
          cursor: cell; user-select: none; min-width: 0;
        }
        .sh-cell.editing { padding: 0; }
        .sh-cell input {
          width: 100%; height: 36px; padding: 0 10px;
          background: rgba(16,185,129,0.1); border: 2px solid #10b981;
          color: #e2e8e4; font-family: 'Barlow Condensed', sans-serif; font-size: 14px; font-weight: 600;
          outline: none; letter-spacing: 0.04em;
        }
        .sh-cell input[type="number"] { text-align: center; font-family: 'Space Mono', monospace; font-size: 13px; }

        .sh-kills-val {
          font-family: 'Space Mono', monospace; font-size: 14px; font-weight: 700;
          color: #10b981; text-align: center; width: 100%; cursor: pointer;
        }
        .sh-kills-val:hover { color: #5fffd4; }

        /* Status cells */
        .sh-alive-pill {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 3px 10px; border-radius: 3px; cursor: pointer;
          font-family: 'Space Mono', monospace; font-size: 9px; font-weight: 700; letter-spacing: 0.1em;
          transition: all 0.15s; border: none; white-space: nowrap;
        }
        .sh-alive-pill.alive { background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3); }
        .sh-alive-pill.alive:hover { background: rgba(232,64,64,0.15); color: #e84040; border-color: rgba(232,64,64,0.3); }
        .sh-alive-pill.dead { background: rgba(232,64,64,0.1); color: #e84040; border: 1px solid rgba(232,64,64,0.25); }
        .sh-alive-pill.dead:hover { background: rgba(16,185,129,0.15); color: #10b981; border-color: rgba(16,185,129,0.3); }

        /* Team summary cells */
        .sh-team-total {
          font-family: 'Space Mono', monospace; font-size: 15px; font-weight: 700;
          color: #10b981; text-align: center;
        }
        .sh-team-alive-bar {
          display: flex; align-items: center; gap: 4px;
        }
        .sh-bar { height: 6px; flex: 1; border-radius: 2px; }
        .sh-bar.alive { background: #10b981; }
        .sh-bar.dead { background: rgba(255,255,255,0.1); }

        /* Booyah button */
        .sh-booyah-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 14px; border-radius: 3px; cursor: pointer; border: none;
          background: rgba(245,200,66,0.1); color: #f5c842;
          border: 1px solid rgba(245,200,66,0.28);
          font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase; transition: all 0.2s; white-space: nowrap;
        }
        .sh-booyah-btn:hover { background: rgba(245,200,66,0.2); border-color: rgba(245,200,66,0.5); box-shadow: 0 0 16px rgba(245,200,66,0.15); }
        .sh-booyah-btn.declared { background: rgba(245,200,66,0.25); color: #f5c842; }

        /* Team action buttons */
        .sh-team-actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .sh-team-act-btn {
          padding: 4px 10px; border-radius: 3px; cursor: pointer; border: none;
          font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase; transition: all 0.15s;
        }

        /* SIDEBAR */
        .sh-sidebar-section { padding: 14px 14px 0; }
        .sh-sidebar-title {
          font-family: 'Space Mono', monospace; font-size: 9px; font-weight: 700;
          color: rgba(16,185,129,0.38); letter-spacing: 0.2em; text-transform: uppercase;
          margin-bottom: 10px; display: flex; align-items: center; gap: 8px;
        }
        .sh-sidebar-title::before { content: ''; width: 12px; height: 1px; background: rgba(16,185,129,0.3); display: block; }

        .sh-stat-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .sh-stat-lbl { font-family: 'Space Mono', monospace; font-size: 9px; color: rgba(180,200,190,0.35); letter-spacing: 0.1em; }
        .sh-stat-val { font-family: 'Space Mono', monospace; font-size: 13px; font-weight: 700; color: #10b981; }
        .sh-stat-val.red { color: #e84040; }
        .sh-stat-val.yellow { color: #f5c842; }

        /* Log */
        .sh-log-item { display: flex; gap: 8px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04); align-items: flex-start; }
        .sh-log-icon { font-size: 13px; flex-shrink: 0; margin-top: 1px; }
        .sh-log-msg { font-size: 11px; color: rgba(200,220,210,0.7); line-height: 1.4; flex: 1; }
        .sh-log-time { font-family: 'Space Mono', monospace; font-size: 9px; color: rgba(180,200,190,0.25); flex-shrink: 0; margin-top: 2px; }

        /* Toast */
        .sh-toast {
          position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
          padding: 10px 22px; border-radius: 6px; z-index: 999;
          font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          animation: toastin 0.25s ease;
          backdrop-filter: blur(12px);
        }
        .sh-toast.success { background: rgba(16,185,129,0.2); color: #10b981; border: 1px solid rgba(16,185,129,0.35); }
        .sh-toast.danger { background: rgba(232,64,64,0.2); color: #e84040; border: 1px solid rgba(232,64,64,0.35); }
        @keyframes toastin { from { opacity:0; transform:translateX(-50%) translateY(10px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }

        @media (max-width: 900px) {
          .sh-body { flex-direction: column; height: auto; }
          .sh-sidebar { width: 100%; border-left: none; border-top: 1px solid rgba(255,255,255,0.07); }
        }
      `}</style>

      <div className="sh-root">

        {/* ── TOPBAR ── */}
        <div className="sh-topbar">
          <div className="sh-topbar-left">
            <Link href="/dashboard" className="sh-breadcrumb">Dashboard</Link>
            <span className="sh-sep">/</span>
            <span className="sh-filetitle">{match?.title || 'Match'} — Control Sheet</span>
          </div>
          <div className="sh-topbar-actions">
            {['waiting', 'live', 'finished'].map(s => (
              <button
                key={s}
                onClick={() => updateMatchStatus(s)}
                className="sh-status-chip"
                style={{
                  background: match?.status === s ? statusBg[s] : 'rgba(255,255,255,0.04)',
                  color: match?.status === s ? statusColor[s] : 'rgba(180,200,190,0.35)',
                  border: `1px solid ${match?.status === s ? statusColor[s] + '40' : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: match?.status === s && s === 'live' ? '0 0 12px rgba(232,64,64,0.2)' : 'none',
                }}
              >
                {s === 'live' && match?.status === 'live' && (
                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#e84040', marginRight: 5, animation: 'pulse 1.2s ease-in-out infinite', boxShadow: '0 0 6px #e84040' }} />
                )}
                {s}
              </button>
            ))}
            <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)' }} />
            <button onClick={addTeam} disabled={addingTeam} className="sh-icon-btn primary">
              {addingTeam ? 'Adding…' : '+ Add Team'}
            </button>
            <button onClick={copyOverlayUrl} className="sh-icon-btn">
              {copiedUrl ? '✓ Copied' : 'Copy Overlay URL'}
            </button>
          </div>
        </div>

        {/* ── TOOLBAR ── */}
        <div className="sh-toolbar">
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: 'rgba(16,185,129,0.3)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
            {match?.map} · {match?.round} · {teams.length} teams
          </span>
          <div className="sh-toolbar-sep" />
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: 'rgba(180,200,190,0.3)', letterSpacing: '0.12em' }}>Overlay:</span>
          <button onClick={() => updateOverlaySetting('show_leaderboard', !(settings?.show_leaderboard !== false))} className={`sh-ov-btn ${settings?.show_leaderboard !== false ? 'sh-ov-on' : 'sh-ov-off'}`}>
            Leaderboard {settings?.show_leaderboard !== false ? 'ON' : 'OFF'}
          </button>
          <button onClick={() => updateOverlaySetting('show_final4', !(settings?.show_final4 !== false))} className={`sh-ov-btn ${settings?.show_final4 !== false ? 'sh-ov-on' : 'sh-ov-off'}`}>
            Final4 {settings?.show_final4 !== false ? 'ON' : 'OFF'}
          </button>
          <button onClick={() => updateOverlaySetting('leaderboard_mode', settings?.leaderboard_mode === 'overall' ? 'match' : 'overall')} className="sh-ov-btn sh-ov-off">
            Mode: {settings?.leaderboard_mode === 'overall' ? 'OVERALL' : 'MATCH'}
          </button>
        </div>

        {/* ── BODY ── */}
        <div className="sh-body">

          {/* ── SPREADSHEET ── */}
          <div className="sh-main">
            <div className="sh-table-wrap">
              <table className="sh-table">
                <thead className="sh-col-hd">
                  <tr>
                    <th>#</th>
                    <th style={{ minWidth: 160 }}>Team / Player</th>
                    <th style={{ minWidth: 80 }} className="center">Kills</th>
                    <th style={{ minWidth: 100 }} className="center">Status</th>
                    <th style={{ minWidth: 100 }} className="center">Alive Count</th>
                    <th style={{ minWidth: 120 }} className="center">Team Kills</th>
                    <th style={{ minWidth: 180 }}>Team Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: '60px 20px', textAlign: 'center' }}>
                        <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 28, fontWeight: 700, color: 'rgba(16,185,129,0.1)', letterSpacing: '0.1em' }}>NO TEAMS</div>
                        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: 'rgba(16,185,129,0.2)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 8 }}>Click "+ Add Team" in the top bar</div>
                      </td>
                    </tr>
                  )}

                  {teams.map((team, ti) => {
                    const alive = aliveCount(team)
                    const total = team.players?.length || 4
                    const kills = teamKills(team)
                    const isBooyah = booyahTeamId === team.id

                    let rowNum = 1
                    teams.slice(0, ti).forEach(t => { rowNum += (t.players?.length || 0) + 1 })

                    return [
                      /* Team row */
                      <tr key={`team-${team.id}`} className="sh-team-row">
                        <td className="sh-rownum" style={{ padding: '8px 0', verticalAlign: 'middle' }}>{rowNum}</td>

                        {/* Team name — editable */}
                        <td style={{ padding: 0 }}>
                          {editingCell?.teamIdx === ti && editingCell?.field === 'teamName' ? (
                            <div className="sh-cell editing">
                              <input
                                ref={inputRef}
                                value={editingValue}
                                onChange={e => setEditingValue(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit() }}
                                onBlur={commitEdit}
                              />
                            </div>
                          ) : (
                            <div className="sh-cell" onDoubleClick={() => startEdit(ti, null, 'teamName', team.name)}>
                              <span className="sh-team-name-cell">
                                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: 'rgba(16,185,129,0.35)', letterSpacing: '0.14em', fontWeight: 400 }}>S{String(team.slot_number).padStart(2,'0')}</span>
                                {team.name}
                                <span className="pencil">✎</span>
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Kills total */}
                        <td style={{ textAlign: 'center', padding: '8px 10px' }}>
                          <span className="sh-team-total">{kills}</span>
                        </td>

                        {/* Alive bar */}
                        <td style={{ padding: '8px 10px' }}>
                          <div className="sh-team-alive-bar">
                            {Array.from({ length: total }, (_, i) => (
                              <div key={i} className={`sh-bar ${i < alive ? 'alive' : 'dead'}`} />
                            ))}
                          </div>
                        </td>

                        {/* Alive count */}
                        <td style={{ textAlign: 'center', padding: '8px 10px' }}>
                          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700, color: alive > 0 ? '#10b981' : 'rgba(232,64,64,0.6)' }}>
                            {alive}/{total}
                          </span>
                        </td>

                        {/* Team kills (same col) */}
                        <td style={{ textAlign: 'center', padding: '8px 10px' }}>
                          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: 'rgba(16,185,129,0.4)', letterSpacing: '0.1em' }}>TOTAL KILLS</span>
                        </td>

                        {/* Team actions */}
                        <td style={{ padding: '6px 10px' }}>
                          <div className="sh-team-actions">
                            <button onClick={() => eliminateAllInTeam(team)} className="sh-team-act-btn" style={{ background: 'rgba(232,64,64,0.1)', color: '#e84040', border: '1px solid rgba(232,64,64,0.22)' }}>Elim All</button>
                            <button onClick={() => reviveAllInTeam(team)} className="sh-team-act-btn" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.22)' }}>Revive All</button>
                            <button onClick={() => declareBooyah(team)} className={`sh-booyah-btn ${isBooyah ? 'declared' : ''}`}>
                              🏆 BOOYAH
                            </button>
                          </div>
                        </td>
                      </tr>,

                      /* Player rows */
                      ...(team.players || []).map((player, pi) => {
                        const playerRow = rowNum + pi + 1
                        const killVal = localKills[player.id] !== undefined ? localKills[player.id] : (player.kills || 0)
                        const isEditingName = editingCell?.teamIdx === ti && editingCell?.playerIdx === pi && editingCell?.field === 'playerName'
                        const isEditingKills = editingCell?.teamIdx === ti && editingCell?.playerIdx === pi && editingCell?.field === 'kills'

                        return (
                          <tr key={player.id} className={`sh-player-row ${!player.alive ? 'dead-row' : ''}`}>
                            <td className="sh-rownum">{playerRow}</td>

                            {/* Player name */}
                            <td style={{ padding: 0, paddingLeft: 24 }}>
                              {isEditingName ? (
                                <div className="sh-cell editing">
                                  <input
                                    ref={inputRef}
                                    value={editingValue}
                                    onChange={e => setEditingValue(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit() }}
                                    onBlur={commitEdit}
                                  />
                                </div>
                              ) : (
                                <div className="sh-cell" onDoubleClick={() => startEdit(ti, pi, 'playerName', player.name)}>
                                  <span style={{
                                    fontSize: 14, fontWeight: 600, letterSpacing: '0.04em',
                                    color: player.alive ? '#d8e8e0' : 'rgba(180,200,190,0.4)',
                                    textDecoration: player.alive ? 'none' : 'line-through',
                                    cursor: 'pointer',
                                  }}>
                                    {player.name}
                                  </span>
                                  <span style={{ fontSize: 9, color: 'rgba(16,185,129,0.2)', marginLeft: 6 }}>dbl-click to edit</span>
                                </div>
                              )}
                            </td>

                            {/* Kills */}
                            <td style={{ padding: 0, textAlign: 'center' }}>
                              {isEditingKills ? (
                                <div className="sh-cell editing">
                                  <input
                                    ref={inputRef}
                                    type="number" min="0" max="99"
                                    value={editingValue}
                                    onChange={e => setEditingValue(e.target.value)}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') { handleKillInput(player, team, editingValue); cancelEdit() }
                                      if (e.key === 'Escape') cancelEdit()
                                    }}
                                    onBlur={() => { handleKillInput(player, team, editingValue); cancelEdit() }}
                                  />
                                </div>
                              ) : (
                                <div className="sh-cell" style={{ justifyContent: 'center' }} onClick={() => startEdit(ti, pi, 'kills', killVal)}>
                                  <span className="sh-kills-val">{killVal}</span>
                                </div>
                              )}
                            </td>

                            {/* Alive toggle */}
                            <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                              <button onClick={() => toggleElim(player, team)} className={`sh-alive-pill ${player.alive ? 'alive' : 'dead'}`}>
                                {player.alive ? '● ALIVE' : '✕ ELIM'}
                              </button>
                            </td>

                            {/* Empty cells to align */}
                            <td />
                            <td />
                            <td />
                          </tr>
                        )
                      })
                    ]
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── SIDEBAR ── */}
          <div className="sh-sidebar">

            {/* Match stats */}
            <div className="sh-sidebar-section" style={{ paddingTop: 16 }}>
              <div className="sh-sidebar-title">Match Stats</div>
              {[
                { lbl: 'Total Teams', val: teams.length, cls: '' },
                { lbl: 'Teams Alive', val: teams.filter(t => t.players?.some(p => p.alive)).length, cls: 'success' },
                { lbl: 'Total Kills', val: teams.reduce((s, t) => s + teamKills(t), 0), cls: '' },
                { lbl: 'Status', val: match?.status?.toUpperCase() || '—', cls: match?.status === 'live' ? 'red' : '' },
              ].map(r => (
                <div key={r.lbl} className="sh-stat-row">
                  <span className="sh-stat-lbl">{r.lbl}</span>
                  <span className={`sh-stat-val ${r.cls}`}>{r.val}</span>
                </div>
              ))}
            </div>

            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '16px 0 0' }} />

            {/* Team leaderboard preview */}
            <div className="sh-sidebar-section" style={{ paddingTop: 14 }}>
              <div className="sh-sidebar-title">Live Rankings</div>
              {[...teams]
                .sort((a, b) => teamKills(b) - teamKills(a))
                .slice(0, 10)
                .map((team, i) => (
                  <div key={team.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, fontWeight: 700, color: i === 0 ? '#f5c842' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'rgba(180,200,190,0.25)', width: 20, flexShrink: 0, textAlign: 'right' }}>
                      {i + 1}
                    </span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', color: '#d8e8e0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
                      {team.name}
                    </span>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, color: '#10b981', flexShrink: 0 }}>
                      {teamKills(team)}K
                    </span>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: aliveCount(team) > 0 ? 'rgba(16,185,129,0.5)' : 'rgba(232,64,64,0.5)', flexShrink: 0 }}>
                      {aliveCount(team)}/{team.players?.length || 4}
                    </span>
                  </div>
                ))}
            </div>

            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '16px 0 0' }} />

            {/* Activity log */}
            <div className="sh-sidebar-section" style={{ paddingTop: 14, paddingBottom: 16 }}>
              <div className="sh-sidebar-title">Activity Log</div>
              {logs.length === 0 && (
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: 'rgba(180,200,190,0.2)', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '12px 0' }}>No activity yet</div>
              )}
              {logs.map(log => (
                <div key={log.id} className="sh-log-item">
                  <span className="sh-log-icon">
                    {log.action === 'eliminated' ? '🔴' : log.action === 'kill_added' ? '🎯' : log.action === 'revived' ? '🟢' : log.action === 'winner' ? '🏆' : log.action === 'team_added' ? '➕' : '📝'}
                  </span>
                  <span className="sh-log-msg">{log.message}</span>
                  <span className="sh-log-time">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Toast */}
        {toast && <div className={`sh-toast ${toast.type}`}>{toast.msg}</div>}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.3)} }
      `}</style>
    </>
  )
}