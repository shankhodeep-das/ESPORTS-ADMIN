'use client'

import { useEffect, useState } from 'react'
import { useEffect, useState, useRef } from 'react'
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
  const [copiedUrl, setCopiedUrl] = useState(false)

  useEffect(() => { fetchMatch(); fetchTeams(); fetchSettings() }, [])

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

  async function addTeam() {
    if (addingTeam) return
    setAddingTeam(true)
    const slotNumber = teams.length + 1
    const { data: team } = await supabase.from('teams').insert([{ match_id: id, slot_number: slotNumber, name: `Team ${slotNumber}`, total_kills: 0 }]).select().single()
    await supabase.from('players').insert([{ team_id: team.id, name: 'P1' }, { team_id: team.id, name: 'P2' }, { team_id: team.id, name: 'P3' }, { team_id: team.id, name: 'P4' }])
    await supabase.from('activity_logs').insert([{ match_id: id, team_name: team.name, action: 'team_added', message: `Team ${team.name} added to slot ${slotNumber}` }])
    await fetchTeams()
    setAddingTeam(false)
  }

  async function eliminatePlayer(player, team) {
    await supabase.from('players').update({ alive: false }).eq('id', player.id)
    await supabase.from('activity_logs').insert([{ match_id: id, team_id: team.id, team_name: team.name, player_name: player.name, action: 'eliminated', message: `${player.name} eliminated from ${team.name}` }])
    fetchTeams()
  }

  async function revivePlayer(player, team) {
    await supabase.from('players').update({ alive: true }).eq('id', player.id)
    await supabase.from('activity_logs').insert([{ match_id: id, team_id: team.id, team_name: team.name, player_name: player.name, action: 'revived', message: `${player.name} revived in ${team.name}` }])
    fetchTeams()
  }

  const killTimers = useRef({})
const [localKills, setLocalKills] = useState({})

function handleKillInput(player, team, value) {
  const kills = parseInt(value) || 0

  // Update local state instantly - no lag
  setLocalKills(prev => ({ ...prev, [player.id]: kills }))

  // Clear existing timer for this player
  if (killTimers.current[player.id]) {
    clearTimeout(killTimers.current[player.id])
  }

  // Save to DB after 800ms of no typing
  killTimers.current[player.id] = setTimeout(async () => {
    await supabase
      .from('players')
      .update({ kills })
      .eq('id', player.id)

    const updatedPlayers = team.players.map(p =>
      p.id === player.id ? { ...p, kills } : p
    )
    const totalKills = updatedPlayers.reduce((sum, p) => {
      const k = localKills[p.id] !== undefined ? localKills[p.id] : (p.kills || 0)
      return sum + k
    }, 0)

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
  }, 800)
  }

  async function declareWinner(team) {
    await supabase.from('matches').update({ status: 'finished' }).eq('id', id)
    await supabase.from('teams').update({ placement: 1 }).eq('id', team.id)
    await supabase.from('activity_logs').insert([{ match_id: id, team_name: team.name, action: 'winner', message: `Winner declared: ${team.name}` }])
    fetchTeams(); fetchMatch()
  }

  async function updateTeamName(team) {
    if (!editingName.trim()) return
    await supabase.from('teams').update({ name: editingName }).eq('id', team.id)
    await supabase.from('activity_logs').insert([{ match_id: id, team_id: team.id, team_name: editingName, action: 'team_renamed', message: `Team renamed from ${team.name} to ${editingName}` }])
    setEditingTeamId(null); setEditingName(''); fetchTeams()
  }

  async function updateMatchStatus(newStatus) {
    await supabase.from('matches').update({ status: newStatus }).eq('id', id)
    await supabase.from('activity_logs').insert([{ match_id: id, action: 'status_changed', message: `Match status changed to ${newStatus.toUpperCase()}` }])
    fetchMatch()
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
  }

  const aliveCount = (team) => team.players?.filter(p => p.alive).length ?? 0

  if (loading) return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Space+Mono:wght@400;700&family=Barlow+Condensed:wght@400;500;600&display=swap');
        body { background: #060709; }
        .mm-load { min-height:100vh; display:flex; align-items:center; justify-content:center; background:#060709; font-family:'Space Mono',monospace; }
        .mm-load-inner { text-align:center; }
        .mm-load-ring { width:48px; height:48px; border:2px solid rgba(16,185,129,0.15); border-top:2px solid #10b981; border-radius:50%; animation:spin 0.8s linear infinite; margin:0 auto 16px; }
        .mm-load-txt { font-size:10px; color:rgba(16,185,129,0.4); letter-spacing:0.18em; text-transform:uppercase; }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>
      <div className="mm-load">
        <div className="mm-load-inner">
          <div className="mm-load-ring" />
          <div className="mm-load-txt">Loading Match</div>
        </div>
      </div>
    </>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Space+Mono:wght@400;700&family=Barlow+Condensed:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        /* ══ ROOT ══ */
        .mm-root {
          min-height:100vh; background:#060709;
          font-family:'Barlow Condensed',sans-serif;
          color:#e8f4ee; position:relative;
          overflow-x:hidden; isolation:isolate;
        }

        /* ══ AURORA ORBS ══ */
        .mm-orb { position:fixed; border-radius:50%; pointer-events:none; z-index:0; }
        .mm-o1 { width:650px; height:650px; background:radial-gradient(circle,rgba(16,185,129,0.22) 0%,transparent 65%); top:-220px; left:-160px; filter:blur(60px); animation:oa 14s ease-in-out infinite alternate; }
        .mm-o2 { width:520px; height:520px; background:radial-gradient(circle,rgba(124,58,237,0.18) 0%,transparent 65%); top:-100px; right:-130px; filter:blur(62px); animation:ob 17s ease-in-out infinite alternate; }
        .mm-o3 { width:420px; height:420px; background:radial-gradient(circle,rgba(6,182,212,0.13) 0%,transparent 65%); bottom:15%; left:-80px; filter:blur(55px); animation:oc 11s ease-in-out infinite alternate; }
        .mm-o4 { width:460px; height:460px; background:radial-gradient(circle,rgba(16,185,129,0.14) 0%,transparent 65%); bottom:-120px; right:-90px; filter:blur(58px); animation:od 9s ease-in-out infinite alternate; }
        .mm-o5 { width:300px; height:300px; background:radial-gradient(circle,rgba(236,72,153,0.08) 0%,transparent 65%); top:50%; left:45%; filter:blur(52px); animation:oa 13s ease-in-out infinite alternate-reverse; }

        @keyframes oa { from{transform:translate(0,0) scale(1)} to{transform:translate(55px,-70px) scale(1.14)} }
        @keyframes ob { from{transform:translate(0,0) scale(1)} to{transform:translate(-65px,80px) scale(1.2)} }
        @keyframes oc { from{transform:translate(0,0) scale(1)} to{transform:translate(45px,-55px) scale(1.1)} }
        @keyframes od { from{transform:translate(0,0) scale(1)} to{transform:translate(-40px,60px) scale(1.18)} }

        /* Grid + noise */
        .mm-grid { position:fixed; inset:0; pointer-events:none; z-index:0; background-image:repeating-linear-gradient(0deg,rgba(16,185,129,0.032) 0px,rgba(16,185,129,0.032) 1px,transparent 1px,transparent 44px),repeating-linear-gradient(90deg,rgba(16,185,129,0.024) 0px,rgba(16,185,129,0.024) 1px,transparent 1px,transparent 44px); }
        .mm-noise { position:fixed; inset:0; pointer-events:none; z-index:0; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.88' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E"); background-size:180px 180px; mix-blend-mode:overlay; opacity:0.35; }

        /* ══ CONTENT ══ */
        .mm-content { position:relative; z-index:2; padding:22px 26px 60px; }

        /* ══ TOPBAR ══ */
        .mm-topbar {
          display:flex; align-items:center; justify-content:space-between;
          padding:10px 18px;
          background:rgba(255,255,255,0.04);
          border:1px solid rgba(255,255,255,0.08);
          border-radius:10px; backdrop-filter:blur(20px);
          margin-bottom:22px; position:relative; overflow:hidden;
          opacity:0; animation:mmup 0.5s ease forwards 0.05s;
        }
        .mm-topbar::before { content:''; position:absolute; top:0; left:20px; right:20px; height:1px; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent); }

        .mm-back {
          display:flex; align-items:center; gap:8px;
          font-family:'Space Mono',monospace; font-size:10px;
          color:rgba(16,185,129,0.45); letter-spacing:0.14em; text-transform:uppercase;
          text-decoration:none; transition:color 0.2s;
        }
        .mm-back:hover { color:rgba(16,185,129,0.85); }

        .mm-back-arr { font-size:13px; transition:transform 0.2s; }
        .mm-back:hover .mm-back-arr { transform:translateX(-3px); }

        .mm-topbar-right { display:flex; align-items:center; gap:10px; }

        .mm-add-btn {
          display:inline-flex; align-items:center; gap:7px;
          padding:8px 18px; border-radius:6px;
          background:#10b981; color:#021a0e;
          font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:600;
          letter-spacing:0.1em; text-transform:uppercase; cursor:pointer; border:none;
          position:relative; overflow:hidden;
          transition:background 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow:0 4px 18px rgba(16,185,129,0.3);
        }
        .mm-add-btn::after { content:''; position:absolute; top:0; left:-100%; width:50%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent); transition:left 0.4s; }
        .mm-add-btn:hover::after { left:160%; }
        .mm-add-btn:hover { background:#0ecf8e; transform:translateY(-2px); box-shadow:0 8px 26px rgba(16,185,129,0.4); }
        .mm-add-btn:disabled { opacity:0.45; cursor:not-allowed; transform:none; box-shadow:none; }

        /* ══ MATCH HEADER ══ */
        .mm-header {
          display:flex; align-items:flex-start; justify-content:space-between;
          margin-bottom:24px;
          opacity:0; animation:mmup 0.6s ease forwards 0.12s;
        }

        .mm-eyebrow { font-family:'Space Mono',monospace; font-size:10px; color:rgba(16,185,129,0.4); letter-spacing:0.22em; text-transform:uppercase; margin-bottom:6px; display:flex; align-items:center; gap:10px; }
        .mm-eyebrow::before { content:''; width:22px; height:1px; background:rgba(16,185,129,0.38); display:block; }

        .mm-title { font-family:'Rajdhani',sans-serif; font-size:44px; font-weight:700; line-height:0.9; letter-spacing:0.04em; text-transform:uppercase; color:#fff; }
        .mm-title span { color:#10b981; text-shadow:0 0 28px rgba(16,185,129,0.45); }

        .mm-meta { display:flex; align-items:center; gap:12px; margin-top:8px; }
        .mm-meta-item { font-family:'Space Mono',monospace; font-size:9px; color:rgba(160,200,175,0.4); letter-spacing:0.12em; text-transform:uppercase; }
        .mm-meta-sep { width:3px; height:3px; border-radius:50%; background:rgba(16,185,129,0.25); }

        /* Status buttons */
        .mm-status-row { display:flex; gap:8px; margin-top:14px; }

        .mm-status-btn {
          padding:6px 16px; border-radius:4px; border:none; cursor:pointer;
          font-family:'Space Mono',monospace; font-size:9px; font-weight:700;
          letter-spacing:0.14em; text-transform:uppercase; transition:all 0.2s;
          backdrop-filter:blur(8px);
        }

        .mm-status-btn.inactive { background:rgba(255,255,255,0.05); color:rgba(160,180,170,0.45); border:1px solid rgba(255,255,255,0.08); }
        .mm-status-btn.inactive:hover { background:rgba(255,255,255,0.09); color:rgba(200,220,210,0.7); }
        .mm-status-btn.s-waiting  { background:rgba(245,200,66,0.15); color:#f5c842; border:1px solid rgba(245,200,66,0.35); box-shadow:0 0 14px rgba(245,200,66,0.15); }
        .mm-status-btn.s-live     { background:rgba(232,64,64,0.15); color:#e84040; border:1px solid rgba(232,64,64,0.35); box-shadow:0 0 14px rgba(232,64,64,0.2); }
        .mm-status-btn.s-finished { background:rgba(16,185,129,0.12); color:#10b981; border:1px solid rgba(16,185,129,0.3); box-shadow:0 0 14px rgba(16,185,129,0.12); }

        .mm-live-pulse { display:inline-block; width:7px; height:7px; border-radius:50%; background:#e84040; margin-right:5px; animation:livep 1.2s ease-in-out infinite; box-shadow:0 0 8px rgba(232,64,64,0.8); }
        @keyframes livep { 0%,100%{transform:scale(1)} 50%{transform:scale(1.3)} }

        /* ══ OVERLAY CONTROLS ══ */
        .mm-overlay-panel {
          position:relative; overflow:hidden;
          background:rgba(255,255,255,0.045);
          border:1px solid rgba(255,255,255,0.1);
          border-radius:14px; padding:20px 22px;
          backdrop-filter:blur(22px); -webkit-backdrop-filter:blur(22px);
          box-shadow:0 4px 28px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08);
          margin-bottom:28px;
          opacity:0; animation:mmup 0.5s ease forwards 0.2s;
        }

        .mm-overlay-panel::before { content:''; position:absolute; top:0; left:18px; right:18px; height:1px; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent); }

        /* Orb inside overlay panel */
        .mm-overlay-orb { position:absolute; width:200px; height:200px; border-radius:50%; background:radial-gradient(circle,rgba(6,182,212,0.12) 0%,transparent 70%); top:-80px; right:-60px; filter:blur(40px); pointer-events:none; }

        .mm-overlay-title { font-family:'Space Mono',monospace; font-size:10px; color:rgba(16,185,129,0.45); letter-spacing:0.18em; text-transform:uppercase; margin-bottom:16px; display:flex; align-items:center; gap:8px; }
        .mm-overlay-title::before { content:''; width:16px; height:1px; background:rgba(16,185,129,0.35); display:block; }

        .mm-overlay-row { display:flex; flex-wrap:wrap; gap:20px; }

        .mm-ov-group { display:flex; flex-direction:column; gap:6px; }
        .mm-ov-lbl { font-family:'Space Mono',monospace; font-size:9px; color:rgba(160,200,175,0.35); letter-spacing:0.15em; text-transform:uppercase; }
        .mm-ov-btns { display:flex; gap:6px; }

        .mm-ov-btn {
          padding:7px 14px; border-radius:5px; cursor:pointer;
          font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:600;
          letter-spacing:0.1em; text-transform:uppercase; transition:all 0.2s; border:none;
        }

        .mm-ov-btn.active { background:#10b981; color:#021a0e; box-shadow:0 0 14px rgba(16,185,129,0.35); }
        .mm-ov-btn.inactive { background:rgba(255,255,255,0.05); color:rgba(160,180,170,0.5); border:1px solid rgba(255,255,255,0.08); }
        .mm-ov-btn.inactive:hover { background:rgba(255,255,255,0.09); color:#e8f4ee; }

        .mm-ov-btn.vis  { background:rgba(16,185,129,0.12); color:#10b981; border:1px solid rgba(16,185,129,0.28); }
        .mm-ov-btn.vis:hover { background:rgba(16,185,129,0.2); }
        .mm-ov-btn.hid  { background:rgba(232,64,64,0.1); color:#e84040; border:1px solid rgba(232,64,64,0.25); }
        .mm-ov-btn.hid:hover { background:rgba(232,64,64,0.18); }

        .mm-ov-btn.copy { background:rgba(59,130,246,0.1); color:#60a5fa; border:1px solid rgba(59,130,246,0.25); }
        .mm-ov-btn.copy:hover { background:rgba(59,130,246,0.18); }
        .mm-ov-btn.copied { background:rgba(16,185,129,0.15); color:#10b981; border:1px solid rgba(16,185,129,0.3); }

        /* ══ TEAMS GRID ══ */
        .mm-teams-grid {
          display:grid; grid-template-columns:repeat(2,1fr); gap:16px;
          margin-bottom:36px;
        }

        /* ══ TEAM CARD ══ */
        .mm-team-card {
          position:relative; overflow:hidden;
          background:rgba(255,255,255,0.05);
          border:1px solid rgba(255,255,255,0.1);
          border-radius:16px; padding:20px 20px 18px;
          backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px);
          box-shadow:0 6px 36px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.09);
          transition:border-color 0.25s, box-shadow 0.25s;
          opacity:0; animation:mmup 0.5s ease forwards;
        }

        .mm-team-card::before { content:''; position:absolute; top:0; left:18px; right:18px; height:1px; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent); }

        .mm-team-card:hover { border-color:rgba(16,185,129,0.22); box-shadow:0 10px 44px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1); }

        /* Ghost slot watermark */
        .mm-slot-wm {
          position:absolute; right:-8px; bottom:-20px;
          font-family:'Rajdhani',sans-serif; font-size:110px; font-weight:700;
          color:rgba(16,185,129,0.045); line-height:1; pointer-events:none;
          letter-spacing:-0.04em; user-select:none;
        }

        /* Inner aurora orb per card — unique per index via inline style */
        .mm-card-orb {
          position:absolute; width:160px; height:160px; border-radius:50%;
          top:-60px; right:-40px; filter:blur(36px); pointer-events:none;
        }

        /* ── TEAM HEADER ── */
        .mm-team-hd { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:14px; position:relative; z-index:1; }

        .mm-team-hd-left { display:flex; flex-direction:column; gap:4px; }

        .mm-slot-badge { font-family:'Space Mono',monospace; font-size:9px; color:rgba(16,185,129,0.38); letter-spacing:0.18em; text-transform:uppercase; }

        .mm-team-name-btn {
          background:none; border:none; cursor:pointer; padding:0;
          font-family:'Rajdhani',sans-serif; font-size:22px; font-weight:700;
          color:#fff; letter-spacing:0.04em; text-transform:uppercase;
          transition:color 0.2s; text-align:left;
          display:flex; align-items:center; gap:8px;
        }

        .mm-team-name-btn:hover { color:#10b981; }

        .mm-edit-icon { font-size:13px; opacity:0.4; transition:opacity 0.2s; }
        .mm-team-name-btn:hover .mm-edit-icon { opacity:0.8; }

        /* Inline name edit */
        .mm-name-edit { display:flex; align-items:center; gap:8px; }
        .mm-name-input {
          background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.4);
          border-radius:4px; padding:5px 10px; color:#e8f4ee;
          font-family:'Rajdhani',sans-serif; font-size:18px; font-weight:700;
          letter-spacing:0.04em; width:140px; outline:none;
          box-shadow:0 0 12px rgba(16,185,129,0.1);
        }

        .mm-save-btn { background:none; border:none; cursor:pointer; color:#10b981; font-family:'Space Mono',monospace; font-size:10px; letter-spacing:0.1em; padding:0; transition:color 0.2s; }
        .mm-save-btn:hover { color:#5fffd4; }
        .mm-cancel-btn { background:none; border:none; cursor:pointer; color:rgba(232,64,64,0.6); font-family:'Space Mono',monospace; font-size:10px; padding:0; transition:color 0.2s; }
        .mm-cancel-btn:hover { color:#e84040; }

        /* Kill count */
        .mm-kills {
          display:flex; flex-direction:column; align-items:flex-end; gap:2px;
        }

        .mm-kills-val {
          font-family:'Space Mono',monospace; font-size:22px; font-weight:700;
          color:#10b981; text-shadow:0 0 18px rgba(16,185,129,0.5);
          line-height:1;
        }

        .mm-kills-lbl { font-family:'Space Mono',monospace; font-size:8px; color:rgba(16,185,129,0.3); letter-spacing:0.14em; text-transform:uppercase; }

        /* ── ALIVE BARS ── */
        .mm-bars { display:flex; gap:5px; margin-bottom:14px; position:relative; z-index:1; }

        .mm-bar {
          height:5px; flex:1; border-radius:3px; transition:all 0.3s;
        }

        .mm-bar.alive { background:#10b981; box-shadow:0 0 8px rgba(16,185,129,0.6); }
        .mm-bar.dead  { background:rgba(255,255,255,0.08); }

        /* ── PLAYERS ── */
        .mm-players { display:flex; flex-direction:column; gap:8px; position:relative; z-index:1; }

        .mm-player-row {
          display:flex; align-items:center; gap:10px;
          padding:8px 12px; border-radius:8px;
          background:rgba(255,255,255,0.03);
          border:1px solid rgba(255,255,255,0.06);
          transition:all 0.2s;
        }

        .mm-player-row.alive-row:hover { background:rgba(16,185,129,0.05); border-color:rgba(16,185,129,0.15); }
        .mm-player-row.dead-row { opacity:0.5; }

        .mm-pname {
          font-family:'Rajdhani',sans-serif; font-size:16px; font-weight:700;
          letter-spacing:0.04em; min-width:28px; flex-shrink:0;
        }

        .mm-pname.alive { color:#fff; }
        .mm-pname.dead  { color:rgba(160,180,170,0.4); text-decoration:line-through; }

        /* Kill input */
        .mm-kills-input {
          width:48px; text-align:center; padding:5px 4px;
          background:rgba(16,185,129,0.07); border:1px solid rgba(16,185,129,0.2);
          border-radius:5px; color:#10b981;
          font-family:'Space Mono',monospace; font-size:13px; font-weight:700;
          outline:none; transition:all 0.2s; flex-shrink:0;
        }

        .mm-kills-input:focus { border-color:rgba(16,185,129,0.55); background:rgba(16,185,129,0.1); box-shadow:0 0 10px rgba(16,185,129,0.12); }
        .mm-kills-input:disabled { background:rgba(255,255,255,0.03); border-color:rgba(255,255,255,0.06); color:rgba(160,180,170,0.25); cursor:not-allowed; }

        /* Elim / revive button */
        .mm-elim-btn {
          flex:1; padding:6px 10px; border-radius:5px; border:none; cursor:pointer;
          font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:600;
          letter-spacing:0.1em; text-transform:uppercase; transition:all 0.2s;
        }

        .mm-elim-btn.elim { background:rgba(232,64,64,0.12); color:#e84040; border:1px solid rgba(232,64,64,0.25); }
        .mm-elim-btn.elim:hover { background:rgba(232,64,64,0.22); border-color:rgba(232,64,64,0.45); box-shadow:0 0 12px rgba(232,64,64,0.2); }

        .mm-elim-btn.revive { background:rgba(245,200,66,0.1); color:#f5c842; border:1px solid rgba(245,200,66,0.22); }
        .mm-elim-btn.revive:hover { background:rgba(245,200,66,0.18); border-color:rgba(245,200,66,0.4); }

        /* Winner button */
        .mm-winner-btn {
          width:100%; margin-top:14px; padding:11px 16px;
          background:rgba(245,200,66,0.1); color:#f5c842;
          border:1px solid rgba(245,200,66,0.28); border-radius:8px;
          font-family:'Rajdhani',sans-serif; font-size:16px; font-weight:700;
          letter-spacing:0.1em; text-transform:uppercase; cursor:pointer;
          transition:all 0.2s; position:relative; z-index:1;
          backdrop-filter:blur(8px);
          display:flex; align-items:center; justify-content:center; gap:8px;
        }

        .mm-winner-btn:hover { background:rgba(245,200,66,0.18); border-color:rgba(245,200,66,0.5); box-shadow:0 0 22px rgba(245,200,66,0.18); transform:translateY(-1px); }

        /* Trophy icon */
        .mm-trophy { font-size:15px; }

        /* ══ ACTIVITY LOG ══ */
        .mm-log-section {
          opacity:0; animation:mmup 0.6s ease forwards 0.5s;
        }

        .mm-log-head {
          display:flex; align-items:center; gap:10px; margin-bottom:14px;
        }

        .mm-log-title { font-family:'Rajdhani',sans-serif; font-size:24px; font-weight:700; color:#fff; letter-spacing:0.06em; text-transform:uppercase; }
        .mm-log-accent { color:#10b981; text-shadow:0 0 20px rgba(16,185,129,0.4); }

        .mm-log-wrap {
          position:relative; overflow:hidden;
          background:rgba(255,255,255,0.04);
          border:1px solid rgba(255,255,255,0.09);
          border-radius:14px; padding:20px 22px;
          backdrop-filter:blur(20px);
          box-shadow:0 4px 28px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.07);
        }

        .mm-log-wrap::before { content:''; position:absolute; top:0; left:18px; right:18px; height:1px; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.14),transparent); }

        /* ── KEYFRAMES ── */
        @keyframes mmup {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }

        @keyframes spin { to { transform:rotate(360deg); } }

        /* Responsive */
        @media (max-width:900px) {
          .mm-content { padding:16px 14px 48px; }
          .mm-teams-grid { grid-template-columns:1fr; }
          .mm-header { flex-direction:column; gap:14px; }
          .mm-title { font-size:34px; }
        }
      `}</style>

      <div className="mm-root">
        {/* Background */}
        <div className="mm-grid" />
        <div className="mm-noise" />
        <div className="mm-orb mm-o1" />
        <div className="mm-orb mm-o2" />
        <div className="mm-orb mm-o3" />
        <div className="mm-orb mm-o4" />
        <div className="mm-orb mm-o5" />

        <div className="mm-content">

          {/* ── TOPBAR ── */}
          <div className="mm-topbar">
            <Link href="/dashboard" className="mm-back">
              <span className="mm-back-arr">←</span>
              Back to Dashboard
            </Link>
            <div className="mm-topbar-right">
              <button
                onClick={addTeam}
                disabled={addingTeam}
                className="mm-add-btn"
              >
                {addingTeam ? 'Adding...' : '+ Add Team'}
              </button>
            </div>
          </div>

          {/* ── MATCH HEADER ── */}
          <div className="mm-header">
            <div>
              <div className="mm-eyebrow">Match Control</div>
              <h1 className="mm-title">
                {match?.title?.split(' ').map((word, i) =>
                  i === match.title.split(' ').length - 1
                    ? <span key={i}>{word}</span>
                    : <span key={i} style={{ color: '#fff' }}>{word} </span>
                )}
              </h1>
              <div className="mm-meta">
                <span className="mm-meta-item">{match?.map}</span>
                <div className="mm-meta-sep" />
                <span className="mm-meta-item">{match?.round}</span>
                <div className="mm-meta-sep" />
                <span className="mm-meta-item">{teams.length} teams</span>
              </div>
              <div className="mm-status-row">
                {['waiting', 'live', 'finished'].map(s => (
                  <button
                    key={s}
                    onClick={() => updateMatchStatus(s)}
                    className={`mm-status-btn ${match?.status === s ? `s-${s}` : 'inactive'}`}
                  >
                    {s === 'live' && match?.status === 'live' && <span className="mm-live-pulse" />}
                    {s.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── OVERLAY CONTROLS ── */}
          <div className="mm-overlay-panel">
            <div className="mm-overlay-orb" />
            <div className="mm-overlay-title">Overlay Controls</div>
            <div className="mm-overlay-row">

              {/* Leaderboard mode */}
              <div className="mm-ov-group">
                <div className="mm-ov-lbl">Leaderboard Mode</div>
                <div className="mm-ov-btns">
                  <button
                    onClick={() => updateOverlaySetting('leaderboard_mode', 'match')}
                    className={`mm-ov-btn ${settings?.leaderboard_mode === 'match' || !settings ? 'active' : 'inactive'}`}
                  >Match</button>
                  <button
                    onClick={() => updateOverlaySetting('leaderboard_mode', 'overall')}
                    className={`mm-ov-btn ${settings?.leaderboard_mode === 'overall' ? 'active' : 'inactive'}`}
                  >Overall</button>
                </div>
              </div>

              {/* Show leaderboard */}
              <div className="mm-ov-group">
                <div className="mm-ov-lbl">Leaderboard</div>
                <div className="mm-ov-btns">
                  <button
                    onClick={() => updateOverlaySetting('show_leaderboard', !settings?.show_leaderboard)}
                    className={`mm-ov-btn ${settings?.show_leaderboard !== false ? 'vis' : 'hid'}`}
                  >
                    {settings?.show_leaderboard !== false ? 'Visible' : 'Hidden'}
                  </button>
                </div>
              </div>

              {/* Show final 4 */}
              <div className="mm-ov-group">
                <div className="mm-ov-lbl">Final 4</div>
                <div className="mm-ov-btns">
                  <button
                    onClick={() => updateOverlaySetting('show_final4', !settings?.show_final4)}
                    className={`mm-ov-btn ${settings?.show_final4 !== false ? 'vis' : 'hid'}`}
                  >
                    {settings?.show_final4 !== false ? 'Visible' : 'Hidden'}
                  </button>
                </div>
              </div>

              {/* Copy URL */}
              <div className="mm-ov-group">
                <div className="mm-ov-lbl">Overlay URL</div>
                <div className="mm-ov-btns">
                  <button
                    onClick={copyOverlayUrl}
                    className={`mm-ov-btn ${copiedUrl ? 'copied' : 'copy'}`}
                  >
                    {copiedUrl ? 'Copied!' : 'Copy URL'}
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* ── TEAMS ── */}
          {teams.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px 20px', background:'rgba(255,255,255,0.03)', border:'1px dashed rgba(16,185,129,0.14)', borderRadius:14, marginBottom:28 }}>
              <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:32, fontWeight:700, color:'rgba(16,185,129,0.12)', letterSpacing:'0.1em' }}>NO TEAMS YET</div>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:'rgba(16,185,129,0.22)', letterSpacing:'0.16em', textTransform:'uppercase', marginTop:10 }}>Click "+ Add Team" to get started</div>
            </div>
          ) : (
            <div className="mm-teams-grid">
              {teams.map((team, i) => {
                const orbColors = [
                  'rgba(16,185,129,0.18)', 'rgba(124,58,237,0.16)',
                  'rgba(6,182,212,0.16)', 'rgba(236,72,153,0.14)',
                  'rgba(245,200,66,0.14)', 'rgba(16,185,129,0.16)',
                ]
                const orbColor = orbColors[i % orbColors.length]
                const alive = aliveCount(team)
                const total = team.players?.length || 4

                return (
                  <div
                    key={team.id}
                    className="mm-team-card"
                    style={{ animationDelay: `${0.28 + i * 0.07}s` }}
                  >
                    {/* Inner orb */}
                    <div className="mm-card-orb" style={{ background: `radial-gradient(circle, ${orbColor} 0%, transparent 70%)` }} />

                    {/* Slot watermark */}
                    <div className="mm-slot-wm">{String(team.slot_number).padStart(2, '0')}</div>

                    {/* Header */}
                    <div className="mm-team-hd">
                      <div className="mm-team-hd-left">
                        <div className="mm-slot-badge">Slot {team.slot_number}</div>

                        {editingTeamId === team.id ? (
                          <div className="mm-name-edit">
                            <input
                              value={editingName}
                              onChange={e => setEditingName(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && updateTeamName(team)}
                              className="mm-name-input"
                              autoFocus
                            />
                            <button onClick={() => updateTeamName(team)} className="mm-save-btn">Save</button>
                            <button onClick={() => setEditingTeamId(null)} className="mm-cancel-btn">✕</button>
                          </div>
                        ) : (
                          <button
                            className="mm-team-name-btn"
                            onClick={() => { setEditingTeamId(team.id); setEditingName(team.name) }}
                          >
                            {team.name}
                            <span className="mm-edit-icon">✎</span>
                          </button>
                        )}
                      </div>

                      <div className="mm-kills">
                        <div className="mm-kills-val">{team.total_kills}</div>
                        <div className="mm-kills-lbl">kills</div>
                      </div>
                    </div>

                    {/* Alive bars */}
                    <div className="mm-bars">
                      {team.players?.map(p => (
                        <div key={p.id} className={`mm-bar ${p.alive ? 'alive' : 'dead'}`} />
                      ))}
                      <span style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:'rgba(16,185,129,0.35)', letterSpacing:'0.1em', marginLeft:6, alignSelf:'center', whiteSpace:'nowrap' }}>
                        {alive}/{total}
                      </span>
                    </div>

                    {/* Players */}
                    <div className="mm-players">
                      {team.players?.map(player => (
                        <div key={player.id} className={`mm-player-row ${player.alive ? 'alive-row' : 'dead-row'}`}>
                          <span className={`mm-pname ${player.alive ? 'alive' : 'dead'}`}>
                            {player.name}
                          </span>
                          <input
                            type="number"
                            min="0"
                            max="99"
                            value={localKills[player.id] !== undefined ? localKills[player.id] : (player.kills || 0)}
                            onChange={(e) => handleKillInput(player, team, e.target.value)}
                          />  
                          <button
                            onClick={() => player.alive ? eliminatePlayer(player, team) : revivePlayer(player, team)}
                            className={`mm-elim-btn ${player.alive ? 'elim' : 'revive'}`}
                          >
                            {player.alive ? 'Eliminate' : 'Revive'}
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Winner button */}
                    <button onClick={() => declareWinner(team)} className="mm-winner-btn">
                      <span className="mm-trophy">🏆</span>
                      Declare Winner
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── ACTIVITY LOG ── */}
          <div className="mm-log-section">
            <div className="mm-log-head">
              <h2 className="mm-log-title">
                Activity <span className="mm-log-accent">Log</span>
              </h2>
            </div>
            <div className="mm-log-wrap">
              <ActivityLog matchId={id} />
            </div>
          </div>

        </div>
      </div>
    </>
  )
}