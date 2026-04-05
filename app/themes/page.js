'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import Link from 'next/link'

const PRESET_THEMES = {
  'Neon Green': {
    leaderboard: { panelBg:'#0a0a0c', borderColor:'#10b981', headerBg:'#064e3b', textPrimary:'#ffffff', textSecondary:'#6b7280', rankColor:'#fbbf24', killsColor:'#60a5fa', pointsColor:'#fbbf24', barAlive:'#10b981', barDead:'#374151', opacity:'95', borderRadius:'12', barHeight:'6', fontSize:'12', borderGlow:true },
    final4: { bg:'#000000', borderColor:'#fbbf24', cardBg:'#1a1a00', highlightColor:'#fbbf24', barColor:'#fbbf24', textColor:'#ffffff', glowIntensity:'medium', entryAnimation:'fade', pulseSpeed:'medium' },
    booyah: { bg:'#000000', booyahColor:'#10b981', glowColor:'#10b981', winnerColor:'#ffffff', killsColor:'#9ca3af', accentColor:'#10b981', entryAnimation:'slide_up', textAnimation:'glow', particles:true, confetti:false, glowIntensity:'high' }
  },
  'BGMI Purple': {
    leaderboard: { panelBg:'#0f0a1e', borderColor:'#7c3aed', headerBg:'#2e1065', textPrimary:'#ffffff', textSecondary:'#a78bfa', rankColor:'#fbbf24', killsColor:'#60a5fa', pointsColor:'#fbbf24', barAlive:'#7c3aed', barDead:'#374151', opacity:'95', borderRadius:'12', barHeight:'6', fontSize:'12', borderGlow:true },
    final4: { bg:'#0f0a1e', borderColor:'#7c3aed', cardBg:'#1e1040', highlightColor:'#a78bfa', barColor:'#7c3aed', textColor:'#ffffff', glowIntensity:'high', entryAnimation:'zoom', pulseSpeed:'fast' },
    booyah: { bg:'#0f0a1e', booyahColor:'#a78bfa', glowColor:'#7c3aed', winnerColor:'#ffffff', killsColor:'#a78bfa', accentColor:'#7c3aed', entryAnimation:'zoom', textAnimation:'pulse', particles:true, confetti:true, glowIntensity:'high' }
  },
  'Championship Gold': {
    leaderboard: { panelBg:'#0a0800', borderColor:'#f59e0b', headerBg:'#451a03', textPrimary:'#ffffff', textSecondary:'#d97706', rankColor:'#f59e0b', killsColor:'#fbbf24', pointsColor:'#f59e0b', barAlive:'#f59e0b', barDead:'#374151', opacity:'95', borderRadius:'8', barHeight:'8', fontSize:'12', borderGlow:true },
    final4: { bg:'#0a0800', borderColor:'#f59e0b', cardBg:'#1c1000', highlightColor:'#f59e0b', barColor:'#f59e0b', textColor:'#ffffff', glowIntensity:'high', entryAnimation:'slide', pulseSpeed:'slow' },
    booyah: { bg:'#0a0800', booyahColor:'#f59e0b', glowColor:'#f59e0b', winnerColor:'#ffffff', killsColor:'#d97706', accentColor:'#f59e0b', entryAnimation:'slide_up', textAnimation:'glow', particles:true, confetti:true, glowIntensity:'high' }
  },
  'Valorant': {
    leaderboard: { panelBg:'#0f1923', borderColor:'#ff4655', headerBg:'#1a2535', textPrimary:'#ffffff', textSecondary:'#ece8e1', rankColor:'#ff4655', killsColor:'#ff4655', pointsColor:'#fbbf24', barAlive:'#ff4655', barDead:'#374151', opacity:'95', borderRadius:'4', barHeight:'6', fontSize:'12', borderGlow:false },
    final4: { bg:'#0f1923', borderColor:'#ff4655', cardBg:'#1a2535', highlightColor:'#ff4655', barColor:'#ff4655', textColor:'#ece8e1', glowIntensity:'low', entryAnimation:'fade', pulseSpeed:'medium' },
    booyah: { bg:'#0f1923', booyahColor:'#ff4655', glowColor:'#ff4655', winnerColor:'#ece8e1', killsColor:'#9ca3af', accentColor:'#ff4655', entryAnimation:'fade', textAnimation:'static', particles:false, confetti:false, glowIntensity:'medium' }
  },
  'Minimal Dark': {
    leaderboard: { panelBg:'#000000', borderColor:'#374151', headerBg:'#111111', textPrimary:'#ffffff', textSecondary:'#6b7280', rankColor:'#ffffff', killsColor:'#9ca3af', pointsColor:'#ffffff', barAlive:'#ffffff', barDead:'#1f2937', opacity:'90', borderRadius:'8', barHeight:'4', fontSize:'11', borderGlow:false },
    final4: { bg:'#000000', borderColor:'#374151', cardBg:'#111111', highlightColor:'#ffffff', barColor:'#ffffff', textColor:'#ffffff', glowIntensity:'none', entryAnimation:'fade', pulseSpeed:'slow' },
    booyah: { bg:'#000000', booyahColor:'#ffffff', glowColor:'#ffffff', winnerColor:'#ffffff', killsColor:'#6b7280', accentColor:'#374151', entryAnimation:'fade', textAnimation:'static', particles:false, confetti:false, glowIntensity:'low' }
  },
  'Fire Red': {
    leaderboard: { panelBg:'#0a0000', borderColor:'#ef4444', headerBg:'#450a0a', textPrimary:'#ffffff', textSecondary:'#fca5a5', rankColor:'#fbbf24', killsColor:'#ef4444', pointsColor:'#fbbf24', barAlive:'#ef4444', barDead:'#374151', opacity:'95', borderRadius:'8', barHeight:'6', fontSize:'12', borderGlow:true },
    final4: { bg:'#0a0000', borderColor:'#ef4444', cardBg:'#1c0000', highlightColor:'#ef4444', barColor:'#ef4444', textColor:'#ffffff', glowIntensity:'high', entryAnimation:'zoom', pulseSpeed:'fast' },
    booyah: { bg:'#0a0000', booyahColor:'#ef4444', glowColor:'#ef4444', winnerColor:'#ffffff', killsColor:'#fca5a5', accentColor:'#ef4444', entryAnimation:'zoom', textAnimation:'pulse', particles:true, confetti:true, glowIntensity:'high' }
  }
}

export default function ThemeEditor() {
  const [matches, setMatches] = useState([])
  const [selectedMatch, setSelectedMatch] = useState('')
  const [activeTab, setActiveTab] = useState('leaderboard')
  const [theme, setTheme] = useState(PRESET_THEMES['Neon Green'])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState('Neon Green')

  useEffect(() => { fetchMatches() }, [])
  useEffect(() => { if (selectedMatch) fetchTheme() }, [selectedMatch])

  async function fetchMatches() {
    const { data } = await supabase.from('matches').select('*').order('created_at', { ascending: false })
    setMatches(data || [])
  }

  async function fetchTheme() {
    const { data } = await supabase.from('themes').select('*').eq('match_id', selectedMatch).single()
    if (data) setTheme({ leaderboard: data.leaderboard_theme, final4: data.final4_theme, booyah: data.booyah_theme })
  }

  async function saveTheme() {
    if (!selectedMatch) return
    setSaving(true)
    const { data: existing } = await supabase.from('themes').select('*').eq('match_id', selectedMatch).single()
    if (existing) {
      await supabase.from('themes').update({ leaderboard_theme: theme.leaderboard, final4_theme: theme.final4, booyah_theme: theme.booyah, updated_at: new Date().toISOString() }).eq('id', existing.id)
    } else {
      await supabase.from('themes').insert([{ match_id: selectedMatch, leaderboard_theme: theme.leaderboard, final4_theme: theme.final4, booyah_theme: theme.booyah }])
    }
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function applyPreset(name) { setTheme(PRESET_THEMES[name]); setSelectedPreset(name) }
  function updateLeaderboard(k, v) { setTheme(p => ({ ...p, leaderboard: { ...p.leaderboard, [k]: v } })) }
  function updateFinal4(k, v)      { setTheme(p => ({ ...p, final4: { ...p.final4, [k]: v } })) }
  function updateBooyah(k, v)      { setTheme(p => ({ ...p, booyah: { ...p.booyah, [k]: v } })) }

  const lb = theme.leaderboard
  const f4 = theme.final4
  const by = theme.booyah

  const presetAccents = {
    'Neon Green': '#10b981', 'BGMI Purple': '#7c3aed', 'Championship Gold': '#f59e0b',
    'Valorant': '#ff4655', 'Minimal Dark': '#6b7280', 'Fire Red': '#ef4444'
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Space+Mono:wght@400;700&family=Barlow+Condensed:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        /* ══ ROOT ══ */
        .te-root {
          height:100vh; display:flex; flex-direction:column;
          background:#060709; font-family:'Barlow Condensed',sans-serif;
          color:#e8f4ee; overflow:hidden; position:relative; isolation:isolate;
        }

        /* ══ AURORA ORBS (fixed, behind everything) ══ */
        .te-orb { position:fixed; border-radius:50%; pointer-events:none; z-index:0; }
        .te-o1 { width:600px; height:600px; background:radial-gradient(circle,rgba(16,185,129,0.18) 0%,transparent 65%); top:-220px; left:-150px; filter:blur(62px); animation:tea 15s ease-in-out infinite alternate; }
        .te-o2 { width:500px; height:500px; background:radial-gradient(circle,rgba(124,58,237,0.14) 0%,transparent 65%); top:-100px; right:-130px; filter:blur(60px); animation:teb 18s ease-in-out infinite alternate; }
        .te-o3 { width:380px; height:380px; background:radial-gradient(circle,rgba(6,182,212,0.1) 0%,transparent 65%); bottom:10%; left:20%; filter:blur(55px); animation:tec 11s ease-in-out infinite alternate; }
        .te-o4 { width:420px; height:420px; background:radial-gradient(circle,rgba(16,185,129,0.1) 0%,transparent 65%); bottom:-100px; right:-80px; filter:blur(58px); animation:ted 9s ease-in-out infinite alternate; }

        @keyframes tea { from{transform:translate(0,0) scale(1)} to{transform:translate(55px,-70px) scale(1.12)} }
        @keyframes teb { from{transform:translate(0,0) scale(1)} to{transform:translate(-60px,75px) scale(1.18)} }
        @keyframes tec { from{transform:translate(0,0) scale(1)} to{transform:translate(40px,-50px) scale(1.1)} }
        @keyframes ted { from{transform:translate(0,0) scale(1)} to{transform:translate(-35px,55px) scale(1.16)} }

        .te-grid { position:fixed; inset:0; pointer-events:none; z-index:0; background-image:repeating-linear-gradient(0deg,rgba(16,185,129,0.028) 0px,rgba(16,185,129,0.028) 1px,transparent 1px,transparent 44px),repeating-linear-gradient(90deg,rgba(16,185,129,0.02) 0px,rgba(16,185,129,0.02) 1px,transparent 1px,transparent 44px); }
        .te-noise { position:fixed; inset:0; pointer-events:none; z-index:0; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.88' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E"); background-size:180px 180px; mix-blend-mode:overlay; opacity:0.32; }

        /* ══ TOPBAR ══ */
        .te-topbar {
          position:relative; z-index:10;
          display:flex; align-items:center; justify-content:space-between;
          padding:10px 22px;
          background:rgba(255,255,255,0.04);
          border-bottom:1px solid rgba(255,255,255,0.08);
          backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px);
          flex-shrink:0;
        }

        .te-topbar::before { content:''; position:absolute; bottom:0; left:24px; right:24px; height:1px; background:linear-gradient(90deg,transparent,rgba(16,185,129,0.2),transparent); }

        .te-back { display:flex; align-items:center; gap:8px; font-family:'Space Mono',monospace; font-size:10px; color:rgba(16,185,129,0.45); letter-spacing:0.14em; text-transform:uppercase; text-decoration:none; transition:color 0.2s; }
        .te-back:hover { color:rgba(16,185,129,0.85); }
        .te-back-arr { transition:transform 0.2s; }
        .te-back:hover .te-back-arr { transform:translateX(-3px); }

        .te-topbar-center { display:flex; flex-direction:column; align-items:center; }
        .te-topbar-eyebrow { font-family:'Space Mono',monospace; font-size:9px; color:rgba(16,185,129,0.3); letter-spacing:0.2em; text-transform:uppercase; }
        .te-topbar-title { font-family:'Rajdhani',sans-serif; font-size:22px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:#fff; line-height:1; }
        .te-topbar-title span { color:#10b981; text-shadow:0 0 20px rgba(16,185,129,0.4); }

        .te-topbar-right { display:flex; align-items:center; gap:10px; }

        /* Match select */
        .te-match-select {
          background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1);
          border-radius:6px; padding:8px 14px; color:#e8f4ee;
          font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:500;
          letter-spacing:0.06em; outline:none; cursor:pointer;
          backdrop-filter:blur(8px); transition:border-color 0.2s;
          min-width:200px;
        }
        .te-match-select:focus { border-color:rgba(16,185,129,0.45); }
        .te-match-select option { background:#111; }

        /* Save button */
        .te-save-btn {
          display:inline-flex; align-items:center; gap:7px;
          padding:8px 22px; border-radius:6px; border:none; cursor:pointer;
          font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:600;
          letter-spacing:0.12em; text-transform:uppercase;
          position:relative; overflow:hidden; transition:all 0.2s;
        }

        .te-save-btn.idle { background:#10b981; color:#021a0e; box-shadow:0 4px 18px rgba(16,185,129,0.3); }
        .te-save-btn.idle:hover { background:#0ecf8e; transform:translateY(-2px); box-shadow:0 8px 26px rgba(16,185,129,0.4); }
        .te-save-btn.idle::after { content:''; position:absolute; top:0; left:-100%; width:50%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent); transition:left 0.4s; }
        .te-save-btn.idle:hover::after { left:160%; }

        .te-save-btn.saving { background:rgba(16,185,129,0.2); color:rgba(16,185,129,0.6); border:1px solid rgba(16,185,129,0.25); cursor:not-allowed; }
        .te-save-btn.done   { background:rgba(16,185,129,0.18); color:#10b981; border:1px solid rgba(16,185,129,0.35); box-shadow:0 0 18px rgba(16,185,129,0.2); }

        .te-save-spin { width:12px; height:12px; border:2px solid rgba(16,185,129,0.2); border-top:2px solid #10b981; border-radius:50%; animation:tespin 0.7s linear infinite; }
        @keyframes tespin { to { transform:rotate(360deg); } }

        /* No match warning */
        .te-no-match { display:inline-flex; align-items:center; gap:6px; font-family:'Space Mono',monospace; font-size:9px; color:rgba(245,200,66,0.5); letter-spacing:0.12em; text-transform:uppercase; }

        /* ══ BODY SPLIT ══ */
        .te-body { display:flex; flex:1; overflow:hidden; position:relative; z-index:2; }

        /* ══ LEFT PANEL — Controls ══ */
        .te-left {
          width:300px; flex-shrink:0;
          display:flex; flex-direction:column;
          background:rgba(255,255,255,0.03);
          border-right:1px solid rgba(255,255,255,0.07);
          overflow:hidden;
        }

        .te-left-scroll { flex:1; overflow-y:auto; padding:16px 14px; display:flex; flex-direction:column; gap:14px; }
        .te-left-scroll::-webkit-scrollbar { width:4px; }
        .te-left-scroll::-webkit-scrollbar-track { background:transparent; }
        .te-left-scroll::-webkit-scrollbar-thumb { background:rgba(16,185,129,0.2); border-radius:2px; }

        /* Preset section */
        .te-section-lbl { font-family:'Space Mono',monospace; font-size:9px; color:rgba(16,185,129,0.38); letter-spacing:0.2em; text-transform:uppercase; margin-bottom:8px; display:flex; align-items:center; gap:8px; }
        .te-section-lbl::before { content:''; width:14px; height:1px; background:rgba(16,185,129,0.3); display:block; }

        .te-presets { display:grid; grid-template-columns:1fr 1fr; gap:6px; }

        .te-preset-btn {
          padding:8px 10px; border-radius:7px; cursor:pointer; border:none;
          font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:600;
          letter-spacing:0.08em; text-transform:uppercase; transition:all 0.2s;
          text-align:center;
        }

        .te-preset-btn.active  { background:rgba(var(--pc),0.14); border:1px solid rgba(var(--pc),0.45); color:rgb(var(--pc)); box-shadow:0 0 12px rgba(var(--pc),0.15); }
        .te-preset-btn.inactive { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); color:rgba(160,180,170,0.5); }
        .te-preset-btn.inactive:hover { background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.16); color:#e8f4ee; }

        /* Tab row */
        .te-tabs { display:flex; gap:4px; background:rgba(255,255,255,0.04); border-radius:8px; padding:4px; }

        .te-tab {
          flex:1; padding:7px 8px; border-radius:5px; cursor:pointer; border:none;
          font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:600;
          letter-spacing:0.08em; text-transform:uppercase; transition:all 0.2s; text-align:center;
        }

        .te-tab.active   { background:#10b981; color:#021a0e; box-shadow:0 2px 10px rgba(16,185,129,0.3); }
        .te-tab.inactive { background:transparent; color:rgba(160,180,170,0.5); }
        .te-tab.inactive:hover { color:#e8f4ee; background:rgba(255,255,255,0.05); }

        /* Controls */
        .te-controls { display:flex; flex-direction:column; gap:10px; }

        .te-divider { height:1px; background:rgba(255,255,255,0.06); margin:2px 0; }

        /* Color control */
        .te-color-row { display:flex; align-items:center; justify-content:space-between; }
        .te-ctrl-lbl { font-family:'Space Mono',monospace; font-size:9px; color:rgba(160,200,175,0.4); letter-spacing:0.12em; text-transform:uppercase; }
        .te-color-right { display:flex; align-items:center; gap:8px; }
        .te-color-hex { font-family:'Space Mono',monospace; font-size:9px; color:rgba(160,180,170,0.35); letter-spacing:0.06em; }
        .te-color-swatch { width:28px; height:28px; border-radius:6px; border:1px solid rgba(255,255,255,0.12); cursor:pointer; overflow:hidden; position:relative; flex-shrink:0; }
        .te-color-swatch input[type=color] { position:absolute; inset:-4px; width:calc(100% + 8px); height:calc(100% + 8px); cursor:pointer; border:none; padding:0; opacity:0; }
        .te-color-preview { position:absolute; inset:0; border-radius:5px; }

        /* Slider control */
        .te-slider-row { display:flex; flex-direction:column; gap:5px; }
        .te-slider-head { display:flex; justify-content:space-between; align-items:center; }
        .te-slider-val { font-family:'Space Mono',monospace; font-size:9px; color:#10b981; font-weight:700; letter-spacing:0.06em; }
        .te-slider { width:100%; height:3px; appearance:none; -webkit-appearance:none; background:rgba(255,255,255,0.1); border-radius:2px; outline:none; cursor:pointer; }
        .te-slider::-webkit-slider-thumb { appearance:none; -webkit-appearance:none; width:14px; height:14px; border-radius:50%; background:#10b981; cursor:pointer; box-shadow:0 0 8px rgba(16,185,129,0.5); border:2px solid rgba(16,185,129,0.3); }
        .te-slider::-moz-range-thumb { width:14px; height:14px; border-radius:50%; background:#10b981; cursor:pointer; box-shadow:0 0 8px rgba(16,185,129,0.5); border:2px solid rgba(16,185,129,0.3); }

        /* Select control */
        .te-select-row { display:flex; align-items:center; justify-content:space-between; }
        .te-select {
          background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1);
          border-radius:5px; padding:5px 10px; color:#e8f4ee;
          font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:500;
          letter-spacing:0.06em; outline:none; cursor:pointer; transition:border-color 0.2s;
        }
        .te-select:focus { border-color:rgba(16,185,129,0.4); }
        .te-select option { background:#111; }

        /* Toggle */
        .te-toggle-row { display:flex; align-items:center; justify-content:space-between; }
        .te-toggle { width:36px; height:18px; border-radius:9px; cursor:pointer; border:none; position:relative; transition:background 0.2s; flex-shrink:0; }
        .te-toggle.on  { background:#10b981; box-shadow:0 0 10px rgba(16,185,129,0.35); }
        .te-toggle.off { background:rgba(255,255,255,0.1); }
        .te-toggle-knob { position:absolute; top:2px; width:14px; height:14px; background:#fff; border-radius:50%; transition:left 0.2s; box-shadow:0 1px 4px rgba(0,0,0,0.3); }
        .te-toggle.on  .te-toggle-knob { left:20px; }
        .te-toggle.off .te-toggle-knob { left:2px; }

        /* ══ RIGHT PANEL — Preview ══ */
        .te-right {
          flex:1; display:flex; flex-direction:column; overflow:hidden;
          background:rgba(0,0,0,0.18);
        }

        /* Preview tabs bar */
        .te-preview-bar {
          display:flex; align-items:center; justify-content:space-between;
          padding:10px 18px;
          background:rgba(255,255,255,0.03);
          border-bottom:1px solid rgba(255,255,255,0.07);
          flex-shrink:0;
        }

        .te-preview-lbl { font-family:'Space Mono',monospace; font-size:9px; color:rgba(16,185,129,0.38); letter-spacing:0.2em; text-transform:uppercase; }

        .te-preview-tabs { display:flex; gap:4px; }
        .te-preview-tab {
          padding:5px 14px; border-radius:5px; cursor:pointer; border:none;
          font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:600;
          letter-spacing:0.1em; text-transform:uppercase; transition:all 0.2s;
        }
        .te-preview-tab.active   { background:rgba(255,255,255,0.12); color:#fff; }
        .te-preview-tab.inactive { background:transparent; color:rgba(160,180,170,0.4); }
        .te-preview-tab.inactive:hover { color:#e8f4ee; }

        /* Preview area */
        .te-preview-area {
          flex:1; display:flex; align-items:center; justify-content:center;
          padding:32px; overflow:auto; position:relative;
        }

        /* Checkerboard bg for preview */
        .te-preview-area::before {
          content:''; position:absolute; inset:0;
          background-image:repeating-linear-gradient(45deg, rgba(255,255,255,0.012) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.012) 75%), repeating-linear-gradient(45deg, rgba(255,255,255,0.012) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.012) 75%);
          background-size:20px 20px; background-position:0 0, 10px 10px;
          pointer-events:none;
        }

        /* Preview watermark */
        .te-preview-wm { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-family:'Rajdhani',sans-serif; font-size:120px; font-weight:700; color:rgba(16,185,129,0.02); letter-spacing:0.1em; text-transform:uppercase; pointer-events:none; white-space:nowrap; }

        /* ── PREVIEW COMPONENTS ── */
        .te-lb-wrap { position:relative; z-index:1; width:300px; overflow:hidden; }
        .te-lb-header { padding:10px 12px; display:flex; justify-content:space-between; align-items:center; }
        .te-lb-hdr-title { font-family:'Rajdhani',sans-serif; font-weight:700; font-size:13px; text-transform:uppercase; letter-spacing:0.08em; }
        .te-lb-hdr-sub { font-size:10px; text-transform:uppercase; letter-spacing:0.1em; }
        .te-lb-col-row { display:flex; padding:4px 10px; }
        .te-lb-row { display:flex; align-items:center; padding:8px 10px; }
        .te-lb-name-col { display:flex; flex-direction:column; gap:3px; flex:1; margin:0 6px; }

        .te-f4-wrap { position:relative; z-index:1; width:260px; overflow:hidden; }
        .te-f4-header { padding:10px 14px; display:flex; align-items:center; gap:8px; }
        .te-f4-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
        .te-f4-title { font-family:'Rajdhani',sans-serif; font-size:14px; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; }
        .te-f4-teams { padding:8px 10px; display:flex; flex-direction:column; gap:8px; }
        .te-f4-team { padding:8px 12px; border-radius:8px; }
        .te-f4-team-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:5px; }
        .te-f4-team-left { display:flex; align-items:center; gap:6px; }
        .te-f4-rank { font-family:'Rajdhani',sans-serif; font-weight:700; font-size:16px; }
        .te-f4-name { font-family:'Rajdhani',sans-serif; font-weight:700; font-size:15px; }
        .te-f4-kills { font-family:'Space Mono',monospace; font-size:11px; font-weight:700; }
        .te-f4-bars { display:flex; gap:3px; }

        .te-by-wrap { position:relative; z-index:1; width:360px; height:220px; border-radius:20px; border-width:2px; border-style:solid; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; overflow:hidden; }
        .te-by-sub { font-family:'Space Mono',monospace; font-size:10px; text-transform:uppercase; letter-spacing:0.18em; }
        .te-by-main { font-family:'Rajdhani',sans-serif; font-size:56px; font-weight:700; line-height:1; }
        .te-by-winner { font-family:'Rajdhani',sans-serif; font-size:26px; font-weight:700; }
        .te-by-kills { font-family:'Space Mono',monospace; font-size:12px; margin-top:4px; }

        @keyframes teup { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div className="te-root">
        <div className="te-grid" />
        <div className="te-noise" />
        <div className="te-orb te-o1" />
        <div className="te-orb te-o2" />
        <div className="te-orb te-o3" />
        <div className="te-orb te-o4" />

        {/* ── TOPBAR ── */}
        <div className="te-topbar">
          <Link href="/dashboard" className="te-back">
            <span className="te-back-arr">←</span>
            Dashboard
          </Link>

          <div className="te-topbar-center">
            <div className="te-topbar-eyebrow">Overlay System</div>
            <div className="te-topbar-title">Theme <span>Editor</span></div>
          </div>

          <div className="te-topbar-right">
            {!selectedMatch && (
              <span className="te-no-match">⚠ Select a match</span>
            )}
            <select
              value={selectedMatch}
              onChange={e => setSelectedMatch(e.target.value)}
              className="te-match-select"
            >
              <option value="">Select Match...</option>
              {matches.map(m => (
                <option key={m.id} value={m.id}>{m.title} — {m.round}</option>
              ))}
            </select>

            <button
              onClick={saveTheme}
              disabled={saving || !selectedMatch}
              className={`te-save-btn ${saving ? 'saving' : saved ? 'done' : 'idle'}`}
            >
              {saving && <span className="te-save-spin" />}
              {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Theme'}
            </button>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="te-body">

          {/* ── LEFT: CONTROLS ── */}
          <div className="te-left">
            <div className="te-left-scroll">

              {/* Presets */}
              <div>
                <div className="te-section-lbl">Preset Themes</div>
                <div className="te-presets">
                  {Object.keys(PRESET_THEMES).map(name => {
                    const accent = presetAccents[name]
                    const hex = accent.replace('#','')
                    const r = parseInt(hex.slice(0,2),16)
                    const g = parseInt(hex.slice(2,4),16)
                    const b = parseInt(hex.slice(4,6),16)
                    return (
                      <button
                        key={name}
                        onClick={() => applyPreset(name)}
                        className={`te-preset-btn ${selectedPreset===name?'active':'inactive'}`}
                        style={selectedPreset===name ? {
                          background:`rgba(${r},${g},${b},0.14)`,
                          borderColor:`rgba(${r},${g},${b},0.5)`,
                          color:accent,
                          boxShadow:`0 0 12px rgba(${r},${g},${b},0.18)`
                        } : {}}
                      >
                        {name}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div style={{ height:1, background:'rgba(255,255,255,0.06)' }} />

              {/* Tabs */}
              <div className="te-tabs">
                {['leaderboard','final4','booyah'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`te-tab ${activeTab===tab?'active':'inactive'}`}
                  >
                    {tab==='leaderboard'?'Board':tab==='final4'?'Final 4':'Booyah'}
                  </button>
                ))}
              </div>

              {/* Controls */}
              <div className="te-controls">

                {activeTab === 'leaderboard' && (<>
                  <TeColor label="Panel BG"     value={lb.panelBg}     onChange={v=>updateLeaderboard('panelBg',v)} />
                  <TeColor label="Border"        value={lb.borderColor}  onChange={v=>updateLeaderboard('borderColor',v)} />
                  <TeColor label="Header BG"     value={lb.headerBg}     onChange={v=>updateLeaderboard('headerBg',v)} />
                  <div className="te-divider" />
                  <TeColor label="Text Primary"  value={lb.textPrimary}  onChange={v=>updateLeaderboard('textPrimary',v)} />
                  <TeColor label="Text Secondary"value={lb.textSecondary}onChange={v=>updateLeaderboard('textSecondary',v)} />
                  <TeColor label="Rank"          value={lb.rankColor}    onChange={v=>updateLeaderboard('rankColor',v)} />
                  <TeColor label="Kills"         value={lb.killsColor}   onChange={v=>updateLeaderboard('killsColor',v)} />
                  <TeColor label="Points"        value={lb.pointsColor}  onChange={v=>updateLeaderboard('pointsColor',v)} />
                  <div className="te-divider" />
                  <TeColor label="Bar Alive"     value={lb.barAlive}     onChange={v=>updateLeaderboard('barAlive',v)} />
                  <TeColor label="Bar Dead"      value={lb.barDead}      onChange={v=>updateLeaderboard('barDead',v)} />
                  <div className="te-divider" />
                  <TeSlider label="Opacity"       value={lb.opacity}      min="50" max="100" onChange={v=>updateLeaderboard('opacity',v)} />
                  <TeSlider label="Border Radius" value={lb.borderRadius} min="0"  max="24"  onChange={v=>updateLeaderboard('borderRadius',v)} />
                  <TeSlider label="Bar Height"    value={lb.barHeight}    min="2"  max="16"  onChange={v=>updateLeaderboard('barHeight',v)} />
                  <TeSlider label="Font Size"     value={lb.fontSize}     min="8"  max="18"  onChange={v=>updateLeaderboard('fontSize',v)} />
                  <TeToggle label="Border Glow"   value={lb.borderGlow}               onChange={v=>updateLeaderboard('borderGlow',v)} />
                </>)}

                {activeTab === 'final4' && (<>
                  <TeColor label="Background"    value={f4.bg}            onChange={v=>updateFinal4('bg',v)} />
                  <TeColor label="Border"        value={f4.borderColor}   onChange={v=>updateFinal4('borderColor',v)} />
                  <TeColor label="Card BG"       value={f4.cardBg}        onChange={v=>updateFinal4('cardBg',v)} />
                  <TeColor label="Highlight"     value={f4.highlightColor}onChange={v=>updateFinal4('highlightColor',v)} />
                  <TeColor label="Bar"           value={f4.barColor}      onChange={v=>updateFinal4('barColor',v)} />
                  <TeColor label="Text"          value={f4.textColor}     onChange={v=>updateFinal4('textColor',v)} />
                  <div className="te-divider" />
                  <TeSelect label="Entry Anim"   value={f4.entryAnimation} options={['fade','slide','zoom']}          onChange={v=>updateFinal4('entryAnimation',v)} />
                  <TeSelect label="Pulse Speed"  value={f4.pulseSpeed}     options={['slow','medium','fast']}         onChange={v=>updateFinal4('pulseSpeed',v)} />
                  <TeSelect label="Glow"         value={f4.glowIntensity}  options={['none','low','medium','high']}   onChange={v=>updateFinal4('glowIntensity',v)} />
                </>)}

                {activeTab === 'booyah' && (<>
                  <TeColor label="Background"    value={by.bg}           onChange={v=>updateBooyah('bg',v)} />
                  <TeColor label="BOOYAH Color"  value={by.booyahColor}  onChange={v=>updateBooyah('booyahColor',v)} />
                  <TeColor label="Glow"          value={by.glowColor}    onChange={v=>updateBooyah('glowColor',v)} />
                  <TeColor label="Winner Name"   value={by.winnerColor}  onChange={v=>updateBooyah('winnerColor',v)} />
                  <TeColor label="Kills"         value={by.killsColor}   onChange={v=>updateBooyah('killsColor',v)} />
                  <TeColor label="Accent"        value={by.accentColor}  onChange={v=>updateBooyah('accentColor',v)} />
                  <div className="te-divider" />
                  <TeSelect label="Entry Anim"   value={by.entryAnimation} options={['fade','slide_up','zoom']}         onChange={v=>updateBooyah('entryAnimation',v)} />
                  <TeSelect label="Text Anim"    value={by.textAnimation}  options={['static','pulse','glow']}          onChange={v=>updateBooyah('textAnimation',v)} />
                  <TeSelect label="Glow"         value={by.glowIntensity}  options={['none','low','medium','high']}     onChange={v=>updateBooyah('glowIntensity',v)} />
                  <div className="te-divider" />
                  <TeToggle label="Particles"    value={by.particles}    onChange={v=>updateBooyah('particles',v)} />
                  <TeToggle label="Confetti"     value={by.confetti}     onChange={v=>updateBooyah('confetti',v)} />
                </>)}

              </div>
            </div>
          </div>

          {/* ── RIGHT: PREVIEW ── */}
          <div className="te-right">
            <div className="te-preview-bar">
              <span className="te-preview-lbl">Live Preview</span>
              <div className="te-preview-tabs">
                {['leaderboard','final4','booyah'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`te-preview-tab ${activeTab===tab?'active':'inactive'}`}
                  >
                    {tab==='leaderboard'?'Leaderboard':tab==='final4'?'Final 4':'Booyah'}
                  </button>
                ))}
              </div>
            </div>

            <div className="te-preview-area">
              <div className="te-preview-wm">PREVIEW</div>

              {/* LEADERBOARD PREVIEW */}
              {activeTab === 'leaderboard' && (
                <div
                  className="te-lb-wrap"
                  style={{
                    backgroundColor: lb.panelBg,
                    border: `1px solid ${lb.borderColor}`,
                    borderRadius: `${lb.borderRadius}px`,
                    opacity: lb.opacity / 100,
                    boxShadow: lb.borderGlow ? `0 0 24px ${lb.borderColor}50` : '0 4px 32px rgba(0,0,0,0.6)'
                  }}
                >
                  <div className="te-lb-header" style={{ backgroundColor: lb.headerBg }}>
                    <span className="te-lb-hdr-title" style={{ color: lb.textPrimary, fontSize: `${lb.fontSize}px` }}>Leaderboard</span>
                    <span className="te-lb-hdr-sub" style={{ color: lb.textSecondary, fontSize: `${Math.max(8,lb.fontSize-2)}px` }}>Match Points</span>
                  </div>

                  <div className="te-lb-col-row" style={{ borderBottom:`1px solid ${lb.borderColor}30` }}>
                    {['#','Team','K','PTS'].map((h,i) => (
                      <span key={i} style={{ width:i===0?'28px':i===2?'28px':i===3?'36px':'auto', flex:i===1?1:undefined, fontSize:'9px', fontFamily:"'Space Mono',monospace", color:lb.textSecondary, textTransform:'uppercase', letterSpacing:'0.1em', textAlign:i>1?'center':undefined }}>
                        {h}
                      </span>
                    ))}
                  </div>

                  {[{rank:'01',name:'Team ATE',kills:7,pts:17},{rank:'02',name:'Team BLX',kills:5,pts:13},{rank:'03',name:'Team ITS',kills:3,pts:11},{rank:'04',name:'Team CME',kills:2,pts:9},{rank:'05',name:'Team RUG',kills:1,pts:7}].map((row,i) => (
                    <div key={i} className="te-lb-row" style={{ borderBottom:`1px solid ${lb.borderColor}18` }}>
                      <span style={{ width:'28px', fontFamily:"'Space Mono',monospace", fontSize:`${lb.fontSize}px`, fontWeight:700, color:lb.rankColor }}>{row.rank}</span>
                      <div className="te-lb-name-col">
                        <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:`${lb.fontSize}px`, fontWeight:700, color:lb.textPrimary }}>{row.name}</span>
                        <div style={{ display:'flex', gap:'3px' }}>
                          {[1,2,3,4].map(p => (
                            <div key={p} style={{ flex:1, height:`${lb.barHeight}px`, borderRadius:'2px', background:p<=4-i?lb.barAlive:lb.barDead }} />
                          ))}
                        </div>
                      </div>
                      <span style={{ width:'28px', fontFamily:"'Space Mono',monospace", fontSize:`${lb.fontSize}px`, fontWeight:700, color:lb.killsColor, textAlign:'center' }}>{row.kills}</span>
                      <span style={{ width:'36px', fontFamily:"'Space Mono',monospace", fontSize:`${lb.fontSize}px`, fontWeight:700, color:lb.pointsColor, textAlign:'center' }}>{row.pts}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* FINAL 4 PREVIEW */}
              {activeTab === 'final4' && (
                <div
                  className="te-f4-wrap"
                  style={{
                    backgroundColor: f4.bg,
                    border: `1px solid ${f4.borderColor}`,
                    borderRadius: '12px',
                    boxShadow: f4.glowIntensity !== 'none' ? `0 0 ${f4.glowIntensity==='low'?'14px':f4.glowIntensity==='medium'?'28px':'50px'} ${f4.borderColor}55` : '0 4px 32px rgba(0,0,0,0.6)'
                  }}
                >
                  <div className="te-f4-header" style={{ backgroundColor: f4.cardBg, borderBottom:`1px solid ${f4.borderColor}40` }}>
                    <div className="te-f4-dot" style={{ background: f4.highlightColor }} />
                    <span className="te-f4-title" style={{ color: f4.highlightColor }}>Final 4</span>
                    <div className="te-f4-dot" style={{ background: f4.highlightColor }} />
                  </div>
                  <div className="te-f4-teams">
                    {['Team ATE','Team BLX','Team ITS','Team CME'].map((name,i) => (
                      <div key={i} className="te-f4-team" style={{ background:f4.cardBg, border:`1px solid ${f4.borderColor}35` }}>
                        <div className="te-f4-team-row">
                          <div className="te-f4-team-left">
                            <span className="te-f4-rank" style={{ color:f4.highlightColor }}>#{i+1}</span>
                            <span className="te-f4-name" style={{ color:f4.textColor }}>{name}</span>
                          </div>
                          <span className="te-f4-kills" style={{ color:f4.highlightColor }}>{7-i*2}K</span>
                        </div>
                        <div className="te-f4-bars">
                          {[1,2,3,4].map(p => (
                            <div key={p} style={{ flex:1, height:'5px', borderRadius:'2px', background:p<=4-i?f4.barColor:'#374151' }} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BOOYAH PREVIEW */}
              {activeTab === 'booyah' && (
                <div
                  className="te-by-wrap"
                  style={{
                    backgroundColor: by.bg,
                    borderColor: by.accentColor,
                    boxShadow: by.glowIntensity !== 'none' ? `0 0 ${by.glowIntensity==='low'?'24px':by.glowIntensity==='medium'?'48px':'80px'} ${by.glowColor}50` : '0 4px 32px rgba(0,0,0,0.6)'
                  }}
                >
                  <div className="te-by-sub" style={{ color:by.killsColor }}>Winner Winner</div>
                  <div
                    className="te-by-main"
                    style={{
                      color: by.booyahColor,
                      textShadow: `0 0 30px ${by.glowColor}90, 0 0 60px ${by.glowColor}40`
                    }}
                  >BOOYAH!</div>
                  <div className="te-by-winner" style={{ color:by.winnerColor }}>Team ATE</div>
                  <div className="te-by-kills" style={{ color:by.killsColor }}>7 Kills</div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/* ── Control Components ── */
function TeColor({ label, value, onChange }) {
  return (
    <div className="te-color-row">
      <span className="te-ctrl-lbl">{label}</span>
      <div className="te-color-right">
        <span className="te-color-hex">{value}</span>
        <div className="te-color-swatch">
          <div className="te-color-preview" style={{ background: value }} />
          <input type="color" value={value} onChange={e => onChange(e.target.value)} />
        </div>
      </div>
    </div>
  )
}

function TeSlider({ label, value, min, max, onChange }) {
  return (
    <div className="te-slider-row">
      <div className="te-slider-head">
        <span className="te-ctrl-lbl">{label}</span>
        <span className="te-slider-val">{value}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={e => onChange(e.target.value)} className="te-slider" />
    </div>
  )
}

function TeSelect({ label, value, options, onChange }) {
  return (
    <div className="te-select-row">
      <span className="te-ctrl-lbl">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} className="te-select">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function TeToggle({ label, value, onChange }) {
  return (
    <div className="te-toggle-row">
      <span className="te-ctrl-lbl">{label}</span>
      <button onClick={() => onChange(!value)} className={`te-toggle ${value?'on':'off'}`}>
        <div className="te-toggle-knob" />
      </button>
    </div>
  )
}