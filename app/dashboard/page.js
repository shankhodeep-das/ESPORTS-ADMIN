'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useParams } from 'next/navigation'
import ActivityLog from '@/app/components/ActivityLog'
import Link from 'next/link'

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyWQd9Ht1BtKQl-WiKqev37gQci2NGO5k_TeAJoDa_IYGRapwcWrpKqfF-2kUdDF1NbVA/exec'

export default function ManageMatch() {
  const { id } = useParams()
  const [match, setMatch] = useState(null)
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [addingTeam, setAddingTeam] = useState(false)
  const [settings, setSettings] = useState(null)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [syncingSheet, setSyncingSheet] = useState(false)
  const [generatingSheet, setGeneratingSheet] = useState(false)

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
    const { data: team } = await supabase
      .from('teams')
      .insert([{ match_id: id, slot_number: slotNumber, name: `Team ${slotNumber}`, total_kills: 0 }])
      .select().single()
    await supabase.from('players').insert([
      { team_id: team.id, name: 'P1' },
      { team_id: team.id, name: 'P2' },
      { team_id: team.id, name: 'P3' },
      { team_id: team.id, name: 'P4' }
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

  // ── GENERATE SHEET (if not yet created) ──────────────────────
  async function generateSheet() {
    setGeneratingSheet(true)
    try {
      const res  = await fetch(`${APPS_SCRIPT_URL}?action=create&match_id=${id}`)
      const json = await res.json()
      if (json.success) {
        await supabase.from('matches').update({ sheet_url: json.sheet_url, sheet_id: json.sheet_id }).eq('id', id)
        fetchMatch()
      } else {
        alert('Sheet generation failed: ' + (json.error || 'Unknown error'))
      }
    } catch (err) {
      alert('Error: ' + err.message)
    }
    setGeneratingSheet(false)
  }

  // ── SYNC SHEET (push current DB state to sheet) ───────────────
  async function syncSheet() {
    setSyncingSheet(true)
    try {
      const res  = await fetch(`${APPS_SCRIPT_URL}?action=sync&match_id=${id}`)
      const json = await res.json()
      if (!json.success) alert('Sync failed: ' + (json.error || 'Unknown'))
    } catch (err) {
      alert('Sync error: ' + err.message)
    }
    setSyncingSheet(false)
  }

  async function updateMatchStatus(newStatus) {
    await supabase.from('matches').update({ status: newStatus }).eq('id', id)
    await supabase.from('activity_logs').insert([{
      match_id: id,
      action: 'status_changed',
      message: `Match status changed to ${newStatus.toUpperCase()}`
    }])
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

        .mm-root { min-height:100vh; background:#060709; font-family:'Barlow Condensed',sans-serif; color:#e8f4ee; position:relative; overflow-x:hidden; isolation:isolate; }
        .mm-orb { position:fixed; border-radius:50%; pointer-events:none; z-index:0; }
        .mm-o1 { width:650px; height:650px; background:radial-gradient(circle,rgba(16,185,129,0.22) 0%,transparent 65%); top:-220px; left:-160px; filter:blur(60px); animation:oa 14s ease-in-out infinite alternate; }
        .mm-o2 { width:520px; height:520px; background:radial-gradient(circle,rgba(124,58,237,0.18) 0%,transparent 65%); top:-100px; right:-130px; filter:blur(62px); animation:ob 17s ease-in-out infinite alternate; }
        .mm-o3 { width:420px; height:420px; background:radial-gradient(circle,rgba(6,182,212,0.13) 0%,transparent 65%); bottom:15%; left:-80px; filter:blur(55px); animation:oc 11s ease-in-out infinite alternate; }
        .mm-o4 { width:460px; height:460px; background:radial-gradient(circle,rgba(16,185,129,0.14) 0%,transparent 65%); bottom:-120px; right:-90px; filter:blur(58px); animation:od 9s ease-in-out infinite alternate; }
        @keyframes oa { from{transform:translate(0,0) scale(1)} to{transform:translate(55px,-70px) scale(1.14)} }
        @keyframes ob { from{transform:translate(0,0) scale(1)} to{transform:translate(-65px,80px) scale(1.2)} }
        @keyframes oc { from{transform:translate(0,0) scale(1)} to{transform:translate(45px,-55px) scale(1.1)} }
        @keyframes od { from{transform:translate(0,0) scale(1)} to{transform:translate(-40px,60px) scale(1.18)} }

        .mm-grid { position:fixed; inset:0; pointer-events:none; z-index:0; background-image:repeating-linear-gradient(0deg,rgba(16,185,129,0.032) 0px,rgba(16,185,129,0.032) 1px,transparent 1px,transparent 44px),repeating-linear-gradient(90deg,rgba(16,185,129,0.024) 0px,rgba(16,185,129,0.024) 1px,transparent 1px,transparent 44px); }

        .mm-content { position:relative; z-index:2; padding:22px 26px 60px; }

        .mm-topbar { display:flex; align-items:center; justify-content:space-between; padding:10px 18px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:10px; backdrop-filter:blur(20px); margin-bottom:22px; opacity:0; animation:mmup 0.5s ease forwards 0.05s; }
        .mm-topbar::before { content:''; position:absolute; top:0; left:20px; right:20px; height:1px; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent); }

        .mm-back { display:flex; align-items:center; gap:8px; font-family:'Space Mono',monospace; font-size:10px; color:rgba(16,185,129,0.45); letter-spacing:0.14em; text-transform:uppercase; text-decoration:none; transition:color 0.2s; }
        .mm-back:hover { color:rgba(16,185,129,0.85); }
        .mm-back-arr { font-size:13px; transition:transform 0.2s; }
        .mm-back:hover .mm-back-arr { transform:translateX(-3px); }

        .mm-topbar-right { display:flex; align-items:center; gap:10px; }

        .mm-add-btn { display:inline-flex; align-items:center; gap:7px; padding:8px 18px; border-radius:6px; background:#10b981; color:#021a0e; font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; cursor:pointer; border:none; transition:background 0.2s, transform 0.15s, box-shadow 0.2s; box-shadow:0 4px 18px rgba(16,185,129,0.3); }
        .mm-add-btn:hover { background:#0ecf8e; transform:translateY(-2px); box-shadow:0 8px 26px rgba(16,185,129,0.4); }
        .mm-add-btn:disabled { opacity:0.45; cursor:not-allowed; transform:none; box-shadow:none; }

        /* ── SHEET PANEL ── */
        .mm-sheet-panel {
          position:relative; overflow:hidden;
          background:rgba(16,185,129,0.04);
          border:1px solid rgba(16,185,129,0.18);
          border-radius:14px; padding:22px 24px;
          backdrop-filter:blur(22px);
          box-shadow:0 4px 28px rgba(0,0,0,0.3), inset 0 1px 0 rgba(16,185,129,0.08);
          margin-bottom:20px;
          opacity:0; animation:mmup 0.5s ease forwards 0.15s;
          display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap;
        }

        .mm-sheet-panel::before { content:''; position:absolute; top:0; left:18px; right:18px; height:1px; background:linear-gradient(90deg,transparent,rgba(16,185,129,0.25),transparent); }

        .mm-sheet-left { display:flex; align-items:center; gap:14px; }

        .mm-sheet-icon { width:44px; height:44px; border-radius:10px; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.2); display:flex; align-items:center; justify-content:center; font-size:22px; flex-shrink:0; }

        .mm-sheet-info { display:flex; flex-direction:column; gap:3px; }

        .mm-sheet-lbl { font-family:'Space Mono',monospace; font-size:9px; color:rgba(16,185,129,0.45); letter-spacing:0.18em; text-transform:uppercase; }

        .mm-sheet-title { font-family:'Rajdhani',sans-serif; font-size:18px; font-weight:700; color:#fff; letter-spacing:0.04em; }

        .mm-sheet-sub { font-family:'Space Mono',monospace; font-size:9px; color:rgba(160,200,175,0.35); letter-spacing:0.1em; text-transform:uppercase; margin-top:2px; }

        .mm-sheet-btns { display:flex; gap:8px; flex-wrap:wrap; }

        .mm-sheet-open-btn {
          display:inline-flex; align-items:center; gap:7px;
          padding:10px 22px; border-radius:8px;
          background:#10b981; color:#021a0e;
          font-family:'Barlow Condensed',sans-serif; font-size:14px; font-weight:700;
          letter-spacing:0.1em; text-transform:uppercase;
          border:none; cursor:pointer; text-decoration:none;
          transition:background 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow:0 4px 18px rgba(16,185,129,0.35);
        }
        .mm-sheet-open-btn:hover { background:#0ecf8e; transform:translateY(-2px); box-shadow:0 8px 26px rgba(16,185,129,0.45); }

        .mm-sheet-sync-btn {
          display:inline-flex; align-items:center; gap:7px;
          padding:10px 18px; border-radius:8px;
          background:rgba(16,185,129,0.08); color:#10b981;
          border:1px solid rgba(16,185,129,0.22);
          font-family:'Barlow Condensed',sans-serif; font-size:14px; font-weight:600;
          letter-spacing:0.1em; text-transform:uppercase; cursor:pointer;
          transition:all 0.2s;
        }
        .mm-sheet-sync-btn:hover { background:rgba(16,185,129,0.15); border-color:rgba(16,185,129,0.4); }
        .mm-sheet-sync-btn:disabled { opacity:0.4; cursor:not-allowed; }

        .mm-sheet-gen-btn {
          display:inline-flex; align-items:center; gap:7px;
          padding:10px 20px; border-radius:8px;
          background:rgba(59,130,246,0.1); color:#60a5fa;
          border:1px solid rgba(59,130,246,0.25);
          font-family:'Barlow Condensed',sans-serif; font-size:14px; font-weight:600;
          letter-spacing:0.1em; text-transform:uppercase; cursor:pointer;
          transition:all 0.2s;
        }
        .mm-sheet-gen-btn:hover { background:rgba(59,130,246,0.18); }
        .mm-sheet-gen-btn:disabled { opacity:0.4; cursor:not-allowed; }

        /* ── HEADER ── */
        .mm-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:24px; opacity:0; animation:mmup 0.6s ease forwards 0.12s; }
        .mm-eyebrow { font-family:'Space Mono',monospace; font-size:10px; color:rgba(16,185,129,0.4); letter-spacing:0.22em; text-transform:uppercase; margin-bottom:6px; display:flex; align-items:center; gap:10px; }
        .mm-eyebrow::before { content:''; width:22px; height:1px; background:rgba(16,185,129,0.38); display:block; }
        .mm-title { font-family:'Rajdhani',sans-serif; font-size:44px; font-weight:700; line-height:0.9; letter-spacing:0.04em; text-transform:uppercase; color:#fff; }
        .mm-title span { color:#10b981; text-shadow:0 0 28px rgba(16,185,129,0.45); }
        .mm-meta { display:flex; align-items:center; gap:12px; margin-top:8px; }
        .mm-meta-item { font-family:'Space Mono',monospace; font-size:9px; color:rgba(160,200,175,0.4); letter-spacing:0.12em; text-transform:uppercase; }
        .mm-meta-sep { width:3px; height:3px; border-radius:50%; background:rgba(16,185,129,0.25); }
        .mm-status-row { display:flex; gap:8px; margin-top:14px; }
        .mm-status-btn { padding:6px 16px; border-radius:4px; border:none; cursor:pointer; font-family:'Space Mono',monospace; font-size:9px; font-weight:700; letter-spacing:0.14em; text-transform:uppercase; transition:all 0.2s; backdrop-filter:blur(8px); }
        .mm-status-btn.inactive { background:rgba(255,255,255,0.05); color:rgba(160,180,170,0.45); border:1px solid rgba(255,255,255,0.08); }
        .mm-status-btn.inactive:hover { background:rgba(255,255,255,0.09); color:rgba(200,220,210,0.7); }
        .mm-status-btn.s-waiting  { background:rgba(245,200,66,0.15); color:#f5c842; border:1px solid rgba(245,200,66,0.35); }
        .mm-status-btn.s-live     { background:rgba(232,64,64,0.15); color:#e84040; border:1px solid rgba(232,64,64,0.35); }
        .mm-status-btn.s-finished { background:rgba(16,185,129,0.12); color:#10b981; border:1px solid rgba(16,185,129,0.3); }
        .mm-live-pulse { display:inline-block; width:7px; height:7px; border-radius:50%; background:#e84040; margin-right:5px; animation:livep 1.2s ease-in-out infinite; }
        @keyframes livep { 0%,100%{transform:scale(1)} 50%{transform:scale(1.3)} }

        /* ── OVERLAY PANEL ── */
        .mm-overlay-panel { position:relative; overflow:hidden; background:rgba(255,255,255,0.045); border:1px solid rgba(255,255,255,0.1); border-radius:14px; padding:20px 22px; backdrop-filter:blur(22px); box-shadow:0 4px 28px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08); margin-bottom:28px; opacity:0; animation:mmup 0.5s ease forwards 0.2s; }
        .mm-overlay-panel::before { content:''; position:absolute; top:0; left:18px; right:18px; height:1px; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent); }
        .mm-overlay-title { font-family:'Space Mono',monospace; font-size:10px; color:rgba(16,185,129,0.45); letter-spacing:0.18em; text-transform:uppercase; margin-bottom:16px; display:flex; align-items:center; gap:8px; }
        .mm-overlay-title::before { content:''; width:16px; height:1px; background:rgba(16,185,129,0.35); display:block; }
        .mm-overlay-row { display:flex; flex-wrap:wrap; gap:20px; }
        .mm-ov-group { display:flex; flex-direction:column; gap:6px; }
        .mm-ov-lbl { font-family:'Space Mono',monospace; font-size:9px; color:rgba(160,200,175,0.35); letter-spacing:0.15em; text-transform:uppercase; }
        .mm-ov-btns { display:flex; gap:6px; }
        .mm-ov-btn { padding:7px 14px; border-radius:5px; cursor:pointer; font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; transition:all 0.2s; border:none; }
        .mm-ov-btn.active { background:#10b981; color:#021a0e; box-shadow:0 0 14px rgba(16,185,129,0.35); }
        .mm-ov-btn.inactive { background:rgba(255,255,255,0.05); color:rgba(160,180,170,0.5); border:1px solid rgba(255,255,255,0.08); }
        .mm-ov-btn.inactive:hover { background:rgba(255,255,255,0.09); color:#e8f4ee; }
        .mm-ov-btn.vis { background:rgba(16,185,129,0.12); color:#10b981; border:1px solid rgba(16,185,129,0.28); }
        .mm-ov-btn.vis:hover { background:rgba(16,185,129,0.2); }
        .mm-ov-btn.hid { background:rgba(232,64,64,0.1); color:#e84040; border:1px solid rgba(232,64,64,0.25); }
        .mm-ov-btn.hid:hover { background:rgba(232,64,64,0.18); }
        .mm-ov-btn.copy { background:rgba(59,130,246,0.1); color:#60a5fa; border:1px solid rgba(59,130,246,0.25); }
        .mm-ov-btn.copy:hover { background:rgba(59,130,246,0.18); }
        .mm-ov-btn.copied { background:rgba(16,185,129,0.15); color:#10b981; border:1px solid rgba(16,185,129,0.3); }

        /* ── TEAMS READ-ONLY GRID ── */
        .mm-teams-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:16px; margin-bottom:36px; }

        .mm-team-card { position:relative; overflow:hidden; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.09); border-radius:14px; padding:18px 20px 16px; backdrop-filter:blur(22px); box-shadow:0 4px 28px rgba(0,0,0,0.28); opacity:0; animation:mmup 0.5s ease forwards; }
        .mm-team-card::before { content:''; position:absolute; top:0; left:16px; right:16px; height:1px; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent); }
        .mm-slot-wm { position:absolute; right:-8px; bottom:-20px; font-family:'Rajdhani',sans-serif; font-size:100px; font-weight:700; color:rgba(16,185,129,0.04); line-height:1; pointer-events:none; letter-spacing:-0.04em; user-select:none; }
        .mm-card-orb { position:absolute; width:140px; height:140px; border-radius:50%; top:-50px; right:-30px; filter:blur(34px); pointer-events:none; }

        .mm-team-hd { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:12px; position:relative; z-index:1; }
        .mm-slot-badge { font-family:'Space Mono',monospace; font-size:9px; color:rgba(16,185,129,0.38); letter-spacing:0.18em; text-transform:uppercase; margin-bottom:4px; }
        .mm-team-name { font-family:'Rajdhani',sans-serif; font-size:20px; font-weight:700; color:#fff; letter-spacing:0.04em; text-transform:uppercase; }
        .mm-kills { display:flex; flex-direction:column; align-items:flex-end; gap:2px; }
        .mm-kills-val { font-family:'Space Mono',monospace; font-size:20px; font-weight:700; color:#10b981; text-shadow:0 0 16px rgba(16,185,129,0.5); line-height:1; }
        .mm-kills-lbl { font-family:'Space Mono',monospace; font-size:8px; color:rgba(16,185,129,0.3); letter-spacing:0.14em; text-transform:uppercase; }

        .mm-bars { display:flex; gap:4px; margin-bottom:10px; position:relative; z-index:1; }
        .mm-bar { height:4px; flex:1; border-radius:3px; transition:all 0.3s; }
        .mm-bar.alive { background:#10b981; box-shadow:0 0 6px rgba(16,185,129,0.5); }
        .mm-bar.dead  { background:rgba(255,255,255,0.07); }

        .mm-players-ro { display:flex; flex-direction:column; gap:5px; position:relative; z-index:1; }
        .mm-player-ro { display:flex; align-items:center; justify-content:space-between; padding:6px 10px; border-radius:7px; background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.05); }
        .mm-player-ro.alive { border-color:rgba(16,185,129,0.1); }
        .mm-player-ro.dead  { opacity:0.45; }
        .mm-pname { font-family:'Rajdhani',sans-serif; font-size:15px; font-weight:700; letter-spacing:0.04em; }
        .mm-pname.alive { color:#fff; }
        .mm-pname.dead  { color:rgba(160,180,170,0.4); text-decoration:line-through; }
        .mm-pkills { font-family:'Space Mono',monospace; font-size:11px; color:#10b981; }
        .mm-pstatus { font-family:'Space Mono',monospace; font-size:9px; letter-spacing:0.1em; text-transform:uppercase; padding:3px 8px; border-radius:4px; }
        .mm-pstatus.alive { background:rgba(16,185,129,0.1); color:#10b981; }
        .mm-pstatus.dead  { background:rgba(232,64,64,0.1); color:#e84040; }

        /* sheet edit note */
        .mm-sheet-note { text-align:center; padding:10px 0 0; }
        .mm-sheet-note-txt { font-family:'Space Mono',monospace; font-size:9px; color:rgba(16,185,129,0.25); letter-spacing:0.12em; text-transform:uppercase; }

        /* ── LOG ── */
        .mm-log-section { opacity:0; animation:mmup 0.6s ease forwards 0.5s; }
        .mm-log-head { display:flex; align-items:center; gap:10px; margin-bottom:14px; }
        .mm-log-title { font-family:'Rajdhani',sans-serif; font-size:24px; font-weight:700; color:#fff; letter-spacing:0.06em; text-transform:uppercase; }
        .mm-log-accent { color:#10b981; text-shadow:0 0 20px rgba(16,185,129,0.4); }
        .mm-log-wrap { position:relative; overflow:hidden; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.09); border-radius:14px; padding:20px 22px; backdrop-filter:blur(20px); box-shadow:0 4px 28px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.07); }
        .mm-log-wrap::before { content:''; position:absolute; top:0; left:18px; right:18px; height:1px; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.14),transparent); }

        @keyframes mmup { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin  { to{transform:rotate(360deg)} }

        @media (max-width:900px) {
          .mm-content { padding:16px 14px 48px; }
          .mm-teams-grid { grid-template-columns:1fr; }
          .mm-header { flex-direction:column; gap:14px; }
          .mm-title { font-size:34px; }
          .mm-sheet-panel { flex-direction:column; align-items:flex-start; }
        }
      `}</style>

      <div className="mm-root">
        <div className="mm-grid" />
        <div className="mm-orb mm-o1" />
        <div className="mm-orb mm-o2" />
        <div className="mm-orb mm-o3" />
        <div className="mm-orb mm-o4" />

        <div className="mm-content">

          {/* ── TOPBAR ── */}
          <div className="mm-topbar">
            <Link href="/dashboard" className="mm-back">
              <span className="mm-back-arr">←</span>
              Back to Dashboard
            </Link>
            <div className="mm-topbar-right">
              <button onClick={addTeam} disabled={addingTeam} className="mm-add-btn">
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

          {/* ── GOOGLE SHEET PANEL ── */}
          <div className="mm-sheet-panel">
            <div className="mm-sheet-left">
              <div className="mm-sheet-icon">📊</div>
              <div className="mm-sheet-info">
                <div className="mm-sheet-lbl">Match Control Sheet</div>
                <div className="mm-sheet-title">
                  {match?.sheet_url ? 'Google Sheet Active' : 'No Sheet Created Yet'}
                </div>
                <div className="mm-sheet-sub">
                  {match?.sheet_url
                    ? 'Operators can edit kills & player status directly in the sheet'
                    : 'Generate a sheet to enable operator-side management'}
                </div>
              </div>
            </div>

            <div className="mm-sheet-btns">
              {match?.sheet_url ? (
                <>
                  <a
                    href={match.sheet_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mm-sheet-open-btn"
                  >
                    ↗ Open Sheet
                  </a>
                  <button
                    onClick={syncSheet}
                    disabled={syncingSheet}
                    className="mm-sheet-sync-btn"
                  >
                    {syncingSheet ? '⟳ Syncing…' : '⟳ Sync DB → Sheet'}
                  </button>
                </>
              ) : (
                <button
                  onClick={generateSheet}
                  disabled={generatingSheet || teams.length === 0}
                  className="mm-sheet-gen-btn"
                >
                  {generatingSheet ? '⟳ Generating…' : '+ Generate Sheet'}
                </button>
              )}
            </div>
          </div>

          {/* ── OVERLAY CONTROLS ── */}
          <div className="mm-overlay-panel">
            <div className="mm-overlay-title">Overlay Controls</div>
            <div className="mm-overlay-row">
              <div className="mm-ov-group">
                <div className="mm-ov-lbl">Leaderboard Mode</div>
                <div className="mm-ov-btns">
                  <button onClick={() => updateOverlaySetting('leaderboard_mode', 'match')} className={`mm-ov-btn ${settings?.leaderboard_mode === 'match' || !settings ? 'active' : 'inactive'}`}>Match</button>
                  <button onClick={() => updateOverlaySetting('leaderboard_mode', 'overall')} className={`mm-ov-btn ${settings?.leaderboard_mode === 'overall' ? 'active' : 'inactive'}`}>Overall</button>
                </div>
              </div>
              <div className="mm-ov-group">
                <div className="mm-ov-lbl">Leaderboard</div>
                <div className="mm-ov-btns">
                  <button onClick={() => updateOverlaySetting('show_leaderboard', !settings?.show_leaderboard)} className={`mm-ov-btn ${settings?.show_leaderboard !== false ? 'vis' : 'hid'}`}>
                    {settings?.show_leaderboard !== false ? 'Visible' : 'Hidden'}
                  </button>
                </div>
              </div>
              <div className="mm-ov-group">
                <div className="mm-ov-lbl">Final 4</div>
                <div className="mm-ov-btns">
                  <button onClick={() => updateOverlaySetting('show_final4', !settings?.show_final4)} className={`mm-ov-btn ${settings?.show_final4 !== false ? 'vis' : 'hid'}`}>
                    {settings?.show_final4 !== false ? 'Visible' : 'Hidden'}
                  </button>
                </div>
              </div>
              <div className="mm-ov-group">
                <div className="mm-ov-lbl">Overlay URL</div>
                <div className="mm-ov-btns">
                  <button onClick={copyOverlayUrl} className={`mm-ov-btn ${copiedUrl ? 'copied' : 'copy'}`}>
                    {copiedUrl ? 'Copied!' : 'Copy URL'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── TEAMS READ-ONLY VIEW ── */}
          {teams.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px 20px', background:'rgba(255,255,255,0.03)', border:'1px dashed rgba(16,185,129,0.14)', borderRadius:14, marginBottom:28 }}>
              <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:32, fontWeight:700, color:'rgba(16,185,129,0.12)', letterSpacing:'0.1em' }}>NO TEAMS YET</div>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:'rgba(16,185,129,0.22)', letterSpacing:'0.16em', textTransform:'uppercase', marginTop:10 }}>Click "+ Add Team" to get started, then generate the sheet</div>
            </div>
          ) : (
            <>
              {/* Section label */}
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:'rgba(16,185,129,0.35)', letterSpacing:'0.18em', textTransform:'uppercase' }}>Live Team Status</div>
                <div style={{ flex:1, height:1, background:'rgba(16,185,129,0.08)' }} />
                <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:'rgba(16,185,129,0.22)', letterSpacing:'0.12em', textTransform:'uppercase' }}>Managed via Google Sheet</div>
              </div>

              <div className="mm-teams-grid">
                {teams.map((team, i) => {
                  const orbColors = ['rgba(16,185,129,0.16)','rgba(124,58,237,0.14)','rgba(6,182,212,0.14)','rgba(236,72,153,0.12)','rgba(245,200,66,0.12)','rgba(16,185,129,0.14)']
                  const alive = aliveCount(team)
                  const total = team.players?.length || 4
                  return (
                    <div key={team.id} className="mm-team-card" style={{ animationDelay:`${0.28+i*0.07}s` }}>
                      <div className="mm-card-orb" style={{ background:`radial-gradient(circle,${orbColors[i%orbColors.length]} 0%,transparent 70%)` }} />
                      <div className="mm-slot-wm">{String(team.slot_number).padStart(2,'0')}</div>

                      <div className="mm-team-hd">
                        <div>
                          <div className="mm-slot-badge">Slot {team.slot_number}</div>
                          <div className="mm-team-name">{team.name}</div>
                        </div>
                        <div className="mm-kills">
                          <div className="mm-kills-val">{team.total_kills}</div>
                          <div className="mm-kills-lbl">kills</div>
                        </div>
                      </div>

                      <div className="mm-bars">
                        {team.players?.map(p => (
                          <div key={p.id} className={`mm-bar ${p.alive ? 'alive' : 'dead'}`} />
                        ))}
                        <span style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:'rgba(16,185,129,0.35)', letterSpacing:'0.1em', marginLeft:6, alignSelf:'center', whiteSpace:'nowrap' }}>
                          {alive}/{total}
                        </span>
                      </div>

                      <div className="mm-players-ro">
                        {team.players?.map(player => (
                          <div key={player.id} className={`mm-player-ro ${player.alive ? 'alive' : 'dead'}`}>
                            <span className={`mm-pname ${player.alive ? 'alive' : 'dead'}`}>{player.name}</span>
                            <span className="mm-pkills">{player.kills || 0}K</span>
                            <span className={`mm-pstatus ${player.alive ? 'alive' : 'dead'}`}>
                              {player.alive ? 'Alive' : 'Elim'}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mm-sheet-note">
                        <span className="mm-sheet-note-txt">Edit via Google Sheet</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* ── ACTIVITY LOG ── */}
          <div className="mm-log-section">
            <div className="mm-log-head">
              <h2 className="mm-log-title">Activity <span className="mm-log-accent">Log</span></h2>
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