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
  const [cardBgImage, setCardBgImage] = useState('')
  const [cardImageOpacity, setCardImageOpacity] = useState(30)
  const [uploading, setUploading] = useState(false)
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
    if (data) {
      setTheme({ leaderboard: data.leaderboard_theme, final4: data.final4_theme, booyah: data.booyah_theme })
      setCardBgImage(data.card_bg_image || '')
      setCardImageOpacity(data.card_image_opacity || 30)
    }
  }

  async function saveTheme() {
    if (!selectedMatch) return
    setSaving(true)
    const { data: existing } = await supabase.from('themes').select('*').eq('match_id', selectedMatch).single()
    if (existing) {
      await supabase.from('themes').update({
        leaderboard_theme: theme.leaderboard,
        final4_theme: theme.final4,
        booyah_theme: theme.booyah,
        card_bg_image: cardBgImage,
        card_image_opacity: cardImageOpacity,
        updated_at: new Date().toISOString()
      }).eq('id', existing.id)
    } else {
      await supabase.from('themes').insert([{
        match_id: selectedMatch,
        leaderboard_theme: theme.leaderboard,
        final4_theme: theme.final4,
        booyah_theme: theme.booyah,
        card_bg_image: cardBgImage,
        card_image_opacity: cardImageOpacity
      }])
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function uploadCardBg(file) {
    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `card-bg-${Date.now()}.${fileExt}`
    const { error: uploadError } = await supabase.storage
      .from('team-logos')
      .upload(fileName, file, { upsert: true })
    if (uploadError) {
      alert('Upload error: ' + uploadError.message)
      setUploading(false)
      return
    }
    const { data } = supabase.storage.from('team-logos').getPublicUrl(fileName)
    setCardBgImage(data.publicUrl)
    setUploading(false)
  }

  function applyPreset(name) { setTheme(PRESET_THEMES[name]); setSelectedPreset(name) }
  function updateLeaderboard(k, v) { setTheme(p => ({ ...p, leaderboard: { ...p.leaderboard, [k]: v } })) }
  function updateFinal4(k, v) { setTheme(p => ({ ...p, final4: { ...p.final4, [k]: v } })) }
  function updateBooyah(k, v) { setTheme(p => ({ ...p, booyah: { ...p.booyah, [k]: v } })) }

  const lb = theme.leaderboard
  const f4 = theme.final4
  const by = theme.booyah

  const presetAccents = {
    'Neon Green': '#10b981', 'BGMI Purple': '#7c3aed', 'Championship Gold': '#f59e0b',
    'Valorant': '#ff4655', 'Minimal Dark': '#6b7280', 'Fire Red': '#ef4444'
  }

  // Preview card bg style helper
  const cardBgStyle = cardBgImage ? {
    backgroundImage: `url(${cardBgImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  } : {}

  const cardOverlayStyle = cardBgImage ? {
    position: 'absolute',
    inset: 0,
    background: `rgba(0,0,0,${1 - cardImageOpacity / 100})`,
    borderRadius: 'inherit',
    pointerEvents: 'none'
  } : {}

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Space+Mono:wght@400;700&family=Barlow+Condensed:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        .te-root { height:100vh; display:flex; flex-direction:column; background:#060709; font-family:'Barlow Condensed',sans-serif; color:#e8f4ee; overflow:hidden; position:relative; isolation:isolate; }
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
        .te-topbar { position:relative; z-index:10; display:flex; align-items:center; justify-content:space-between; padding:10px 22px; background:rgba(255,255,255,0.04); border-bottom:1px solid rgba(255,255,255,0.08); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); flex-shrink:0; }
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
        .te-match-select { background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:6px; padding:8px 14px; color:#e8f4ee; font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:500; letter-spacing:0.06em; outline:none; cursor:pointer; backdrop-filter:blur(8px); transition:border-color 0.2s; min-width:200px; }
        .te-match-select:focus { border-color:rgba(16,185,129,0.45); }
        .te-match-select option { background:#111; }
        .te-save-btn { display:inline-flex; align-items:center; gap:7px; padding:8px 22px; border-radius:6px; border:none; cursor:pointer; font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; position:relative; overflow:hidden; transition:all 0.2s; }
        .te-save-btn.idle { background:#10b981; color:#021a0e; box-shadow:0 4px 18px rgba(16,185,129,0.3); }
        .te-save-btn.idle:hover { background:#0ecf8e; transform:translateY(-2px); box-shadow:0 8px 26px rgba(16,185,129,0.4); }
        .te-save-btn.saving { background:rgba(16,185,129,0.2); color:rgba(16,185,129,0.6); border:1px solid rgba(16,185,129,0.25); cursor:not-allowed; }
        .te-save-btn.done { background:rgba(16,185,129,0.18); color:#10b981; border:1px solid rgba(16,185,129,0.35); box-shadow:0 0 18px rgba(16,185,129,0.2); }
        .te-save-spin { width:12px; height:12px; border:2px solid rgba(16,185,129,0.2); border-top:2px solid #10b981; border-radius:50%; animation:tespin 0.7s linear infinite; }
        @keyframes tespin { to { transform:rotate(360deg); } }
        .te-no-match { display:inline-flex; align-items:center; gap:6px; font-family:'Space Mono',monospace; font-size:9px; color:rgba(245,200,66,0.5); letter-spacing:0.12em; text-transform:uppercase; }
        .te-body { display:flex; flex:1; overflow:hidden; position:relative; z-index:2; }
        .te-left { width:300px; flex-shrink:0; display:flex; flex-direction:column; background:rgba(255,255,255,0.03); border-right:1px solid rgba(255,255,255,0.07); overflow:hidden; }
        .te-left-scroll { flex:1; overflow-y:auto; padding:16px 14px; display:flex; flex-direction:column; gap:14px; }
        .te-left-scroll::-webkit-scrollbar { width:4px; }
        .te-left-scroll::-webkit-scrollbar-track { background:transparent; }
        .te-left-scroll::-webkit-scrollbar-thumb { background:rgba(16,185,129,0.2); border-radius:2px; }
        .te-section-lbl { font-family:'Space Mono',monospace; font-size:9px; color:rgba(16,185,129,0.38); letter-spacing:0.2em; text-transform:uppercase; margin-bottom:8px; display:flex; align-items:center; gap:8px; }
        .te-section-lbl::before { content:''; width:14px; height:1px; background:rgba(16,185,129,0.3); display:block; }
        .te-presets { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
        .te-preset-btn { padding:8px 10px; border-radius:7px; cursor:pointer; border:none; font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; transition:all 0.2s; text-align:center; }
        .te-preset-btn.active { background:rgba(var(--pc),0.14); border:1px solid rgba(var(--pc),0.45); color:rgb(var(--pc)); box-shadow:0 0 12px rgba(var(--pc),0.15); }
        .te-preset-btn.inactive { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); color:rgba(160,180,170,0.5); }
        .te-preset-btn.inactive:hover { background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.16); color:#e8f4ee; }
        .te-tabs { display:flex; gap:4px; background:rgba(255,255,255,0.04); border-radius:8px; padding:4px; }
        .te-tab { flex:1; padding:7px 8px; border-radius:5px; cursor:pointer; border:none; font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; transition:all 0.2s; text-align:center; }
        .te-tab.active { background:#10b981; color:#021a0e; box-shadow:0 2px 10px rgba(16,185,129,0.3); }
        .te-tab.inactive { background:transparent; color:rgba(160,180,170,0.5); }
        .te-tab.inactive:hover { color:#e8f4ee; background:rgba(255,255,255,0.05); }
        .te-controls { display:flex; flex-direction:column; gap:10px; }
        .te-divider { height:1px; background:rgba(255,255,255,0.06); margin:2px 0; }
        .te-color-row { display:flex; align-items:center; justify-content:space-between; }
        .te-ctrl-lbl { font-family:'Space Mono',monospace; font-size:9px; color:rgba(160,200,175,0.4); letter-spacing:0.12em; text-transform:uppercase; }
        .te-color-right { display:flex; align-items:center; gap:8px; }
        .te-color-hex { font-family:'Space Mono',monospace; font-size:9px; color:rgba(160,180,170,0.35); letter-spacing:0.06em; }
        .te-color-swatch { width:28px; height:28px; border-radius:6px; border:1px solid rgba(255,255,255,0.12); cursor:pointer; overflow:hidden; position:relative; flex-shrink:0; }
        .te-color-swatch input[type=color] { position:absolute; inset:-4px; width:calc(100% + 8px); height:calc(100% + 8px); cursor:pointer; border:none; padding:0; opacity:0; }
        .te-color-preview { position:absolute; inset:0; border-radius:5px; }
        .te-slider-row { display:flex; flex-direction:column; gap:5px; }
        .te-slider-head { display:flex; justify-content:space-between; align-items:center; }
        .te-slider-val { font-family:'Space Mono',monospace; font-size:9px; color:#10b981; font-weight:700; letter-spacing:0.06em; }
        .te-slider { width:100%; height:3px; appearance:none; -webkit-appearance:none; background:rgba(255,255,255,0.1); border-radius:2px; outline:none; cursor:pointer; }
        .te-slider::-webkit-slider-thumb { appearance:none; -webkit-appearance:none; width:14px; height:14px; border-radius:50%; background:#10b981; cursor:pointer; box-shadow:0 0 8px rgba(16,185,129,0.5); border:2px solid rgba(16,185,129,0.3); }
        .te-slider::-moz-range-thumb { width:14px; height:14px; border-radius:50%; background:#10b981; cursor:pointer; box-shadow:0 0 8px rgba(16,185,129,0.5); border:2px solid rgba(16,185,129,0.3); }
        .te-select-row { display:flex; align-items:center; justify-content:space-between; }
        .te-select { background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:5px; padding:5px 10px; color:#e8f4ee; font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:500; letter-spacing:0.06em; outline:none; cursor:pointer; transition:border-color 0.2s; }
        .te-select:focus { border-color:rgba(16,185,129,0.4); }
        .te-select option { background:#111; }
        .te-toggle-row { display:flex; align-items:center; justify-content:space-between; }
        .te-toggle { width:36px; height:18px; border-radius:9px; cursor:pointer; border:none; position:relative; transition:background 0.2s; flex-shrink:0; }
        .te-toggle.on { background:#10b981; box-shadow:0 0 10px rgba(16,185,129,0.35); }
        .te-toggle.off { background:rgba(255,255,255,0.1); }
        .te-toggle-knob { position:absolute; top:2px; width:14px; height:14px; background:#fff; border-radius:50%; transition:left 0.2s; box-shadow:0 1px 4px rgba(0,0,0,0.3); }
        .te-toggle.on .te-toggle-knob { left:20px; }
        .te-toggle.off .te-toggle-knob { left:2px; }
        .te-right { flex:1; display:flex; flex-direction:column; overflow:hidden; background:rgba(0,0,0,0.18); }
        .te-preview-bar { display:flex; align-items:center; justify-content:space-between; padding:10px 18px; background:rgba(255,255,255,0.03); border-bottom:1px solid rgba(255,255,255,0.07); flex-shrink:0; }
        .te-preview-lbl { font-family:'Space Mono',monospace; font-size:9px; color:rgba(16,185,129,0.38); letter-spacing:0.2em; text-transform:uppercase; }
        .te-preview-tabs { display:flex; gap:4px; }
        .te-preview-tab { padding:5px 14px; border-radius:5px; cursor:pointer; border:none; font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; transition:all 0.2s; }
        .te-preview-tab.active { background:rgba(255,255,255,0.12); color:#fff; }
        .te-preview-tab.inactive { background:transparent; color:rgba(160,180,170,0.4); }
        .te-preview-tab.inactive:hover { color:#e8f4ee; }
        .te-preview-area { flex:1; display:flex; align-items:center; justify-content:center; padding:32px; overflow:auto; position:relative; }
        .te-preview-area::before { content:''; position:absolute; inset:0; background-image:repeating-linear-gradient(45deg, rgba(255,255,255,0.012) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.012) 75%), repeating-linear-gradient(45deg, rgba(255,255,255,0.012) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.012) 75%); background-size:20px 20px; background-position:0 0, 10px 10px; pointer-events:none; }
        .te-preview-wm { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-family:'Rajdhani',sans-serif; font-size:120px; font-weight:700; color:rgba(16,185,129,0.02); letter-spacing:0.1em; text-transform:uppercase; pointer-events:none; white-space:nowrap; }
        .te-lb-wrap { position:relative; z-index:1; width:300px; overflow:hidden; }
        .te-lb-header { padding:10px 12px; display:flex; justify-content:space-between; align-items:center; }
        .te-lb-hdr-title { font-family:'Rajdhani',sans-serif; font-weight:700; font-size:13px; text-transform:uppercase; letter-spacing:0.08em; }
        .te-lb-hdr-sub { font-size:10px; text-transform:uppercase; letter-spacing:0.1em; }
        .te-lb-col-row { display:flex; padding:4px 10px; }
        .te-lb-row { display:flex; align-items:center; padding:8px 10px; position:relative; overflow:hidden; }
        .te-lb-name-col { display:flex; flex-direction:column; gap:3px; flex:1; margin:0 6px; position:relative; z-index:1; }
        .te-f4-wrap { position:relative; z-index:1; width:260px; overflow:hidden; }
        .te-f4-header { padding:10px 14px; display:flex; align-items:center; gap:8px; }
        .te-f4-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
        .te-f4-title { font-family:'Rajdhani',sans-serif; font-size:14px; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; }
        .te-f4-teams { padding:8px 10px; display:flex; flex-direction:column; gap:8px; }
        .te-f4-team { padding:8px 12px; border-radius:8px; position:relative; overflow:hidden; }
        .te-f4-team-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:5px; position:relative; z-index:1; }
        .te-f4-team-left { display:flex; align-items:center; gap:6px; }
        .te-f4-rank { font-family:'Rajdhani',sans-serif; font-weight:700; font-size:16px; }
        .te-f4-name { font-family:'Rajdhani',sans-serif; font-weight:700; font-size:15px; }
        .te-f4-kills { font-family:'Space Mono',monospace; font-size:11px; font-weight:700; }
        .te-f4-bars { display:flex; gap:3px; position:relative; z-index:1; }
        .te-by-wrap { position:relative; z-index:1; width:360px; height:220px; border-radius:20px; border-width:2px; border-style:solid; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; overflow:hidden; }
        .te-by-sub { font-family:'Space Mono',monospace; font-size:10px; text-transform:uppercase; letter-spacing:0.18em; position:relative; z-index:1; }
        .te-by-main { font-family:'Rajdhani',sans-serif; font-size:56px; font-weight:700; line-height:1; position:relative; z-index:1; }
        .te-by-winner { font-family:'Rajdhani',sans-serif; font-size:26px; font-weight:700; position:relative; z-index:1; }
        .te-by-kills { font-family:'Space Mono',monospace; font-size:12px; margin-top:4px; position:relative; z-index:1; }
        .te-upload-area { border:1px dashed rgba(16,185,129,0.3); border-radius:8px; padding:12px; text-align:center; cursor:pointer; transition:all 0.2s; position:relative; }
        .te-upload-area:hover { border-color:rgba(16,185,129,0.6); background:rgba(16,185,129,0.05); }
        .te-upload-lbl { font-family:'Space Mono',monospace; font-size:9px; color:rgba(16,185,129,0.5); letter-spacing:0.12em; text-transform:uppercase; }
        .te-url-input { width:100%; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:5px; padding:7px 10px; color:#e8f4ee; font-family:'Space Mono',monospace; font-size:9px; outline:none; letter-spacing:0.06em; transition:border-color 0.2s; }
        .te-url-input:focus { border-color:rgba(16,185,129,0.4); }
        .te-url-input::placeholder { color:rgba(160,180,170,0.25); }
        .te-img-preview { width:100%; height:60px; object-fit:cover; border-radius:6px; border:1px solid rgba(16,185,129,0.3); }
        .te-remove-btn { background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); color:#ef4444; font-family:'Space Mono',monospace; font-size:9px; padding:4px 10px; border-radius:4px; cursor:pointer; letter-spacing:0.1em; text-transform:uppercase; transition:all 0.2s; width:100%; margin-top:6px; }
        .te-remove-btn:hover { background:rgba(239,68,68,0.25); }
        .te-or-divider { display:flex; align-items:center; gap:8px; }
        .te-or-line { flex:1; height:1px; background:rgba(255,255,255,0.08); }
        .te-or-text { font-family:'Space Mono',monospace; font-size:9px; color:rgba(160,180,170,0.2); letter-spacing:0.1em; }
      `}</style>

      <div className="te-root">
        <div className="te-grid" />
        <div className="te-noise" />
        <div className="te-orb te-o1" />
        <div className="te-orb te-o2" />
        <div className="te-orb te-o3" />
        <div className="te-orb te-o4" />

        {/* TOPBAR */}
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
            {!selectedMatch && <span className="te-no-match">⚠ Select a match</span>}
            <select value={selectedMatch} onChange={e => setSelectedMatch(e.target.value)} className="te-match-select">
              <option value="">Select Match...</option>
              {matches.map(m => <option key={m.id} value={m.id}>{m.title} — {m.round}</option>)}
            </select>
            <button onClick={saveTheme} disabled={saving || !selectedMatch} className={`te-save-btn ${saving?'saving':saved?'done':'idle'}`}>
              {saving && <span className="te-save-spin" />}
              {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Theme'}
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="te-body">

          {/* LEFT CONTROLS */}
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
                      <button key={name} onClick={() => applyPreset(name)}
                        className={`te-preset-btn ${selectedPreset===name?'active':'inactive'}`}
                        style={selectedPreset===name ? { background:`rgba(${r},${g},${b},0.14)`, borderColor:`rgba(${r},${g},${b},0.5)`, color:accent, boxShadow:`0 0 12px rgba(${r},${g},${b},0.18)` } : {}}>
                        {name}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div style={{ height:1, background:'rgba(255,255,255,0.06)' }} />

              {/* Card Background Image Section */}
              <div>
                <div className="te-section-lbl">Card Background Image</div>

                {cardBgImage ? (
                  <div>
                    <img src={cardBgImage} alt="Card BG Preview" className="te-img-preview" />
                    <button onClick={() => setCardBgImage('')} className="te-remove-btn">
                      ✕ Remove Image
                    </button>
                  </div>
                ) : (
                  <label className="te-upload-area">
                    <div className="te-upload-lbl">
                      {uploading ? '⟳ Uploading...' : '↑ Upload Image'}
                    </div>
                    <input type="file" accept="image/*" style={{ display:'none' }}
                      onChange={e => e.target.files[0] && uploadCardBg(e.target.files[0])} />
                  </label>
                )}

                <div className="te-or-divider" style={{ margin:'8px 0' }}>
                  <div className="te-or-line" />
                  <span className="te-or-text">OR</span>
                  <div className="te-or-line" />
                </div>

                <input
                  type="text"
                  placeholder="Paste image URL here..."
                  value={cardBgImage}
                  onChange={e => setCardBgImage(e.target.value)}
                  className="te-url-input"
                />

                {/* Opacity slider */}
                {cardBgImage && (
                  <div style={{ marginTop:'10px' }}>
                    <TeSlider
                      label="Image Opacity"
                      value={cardImageOpacity}
                      min="10"
                      max="100"
                      onChange={v => setCardImageOpacity(v)}
                    />
                  </div>
                )}
              </div>

              <div style={{ height:1, background:'rgba(255,255,255,0.06)' }} />

              {/* Tabs */}
              <div className="te-tabs">
                {['leaderboard','final4','booyah'].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`te-tab ${activeTab===tab?'active':'inactive'}`}>
                    {tab==='leaderboard'?'Board':tab==='final4'?'Final 4':'Booyah'}
                  </button>
                ))}
              </div>

              {/* Controls */}
              <div className="te-controls">
                {activeTab === 'leaderboard' && (<>
                  <TeColor label="Panel BG"      value={lb.panelBg}      onChange={v=>updateLeaderboard('panelBg',v)} />
                  <TeColor label="Border"         value={lb.borderColor}   onChange={v=>updateLeaderboard('borderColor',v)} />
                  <TeColor label="Header BG"      value={lb.headerBg}      onChange={v=>updateLeaderboard('headerBg',v)} />
                  <div className="te-divider" />
                  <TeColor label="Text Primary"   value={lb.textPrimary}   onChange={v=>updateLeaderboard('textPrimary',v)} />
                  <TeColor label="Text Secondary" value={lb.textSecondary} onChange={v=>updateLeaderboard('textSecondary',v)} />
                  <TeColor label="Rank"           value={lb.rankColor}     onChange={v=>updateLeaderboard('rankColor',v)} />
                  <TeColor label="Kills"          value={lb.killsColor}    onChange={v=>updateLeaderboard('killsColor',v)} />
                  <TeColor label="Points"         value={lb.pointsColor}   onChange={v=>updateLeaderboard('pointsColor',v)} />
                  <div className="te-divider" />
                  <TeColor label="Bar Alive"      value={lb.barAlive}      onChange={v=>updateLeaderboard('barAlive',v)} />
                  <TeColor label="Bar Dead"       value={lb.barDead}       onChange={v=>updateLeaderboard('barDead',v)} />
                  <div className="te-divider" />
                  <TeSlider label="Opacity"        value={lb.opacity}       min="50" max="100" onChange={v=>updateLeaderboard('opacity',v)} />
                  <TeSlider label="Border Radius"  value={lb.borderRadius}  min="0"  max="24"  onChange={v=>updateLeaderboard('borderRadius',v)} />
                  <TeSlider label="Bar Height"     value={lb.barHeight}     min="2"  max="16"  onChange={v=>updateLeaderboard('barHeight',v)} />
                  <TeSlider label="Font Size"      value={lb.fontSize}      min="8"  max="18"  onChange={v=>updateLeaderboard('fontSize',v)} />
                  <TeToggle label="Border Glow"    value={lb.borderGlow}                onChange={v=>updateLeaderboard('borderGlow',v)} />
                </>)}

                {activeTab === 'final4' && (<>
                  <TeColor label="Background"   value={f4.bg}             onChange={v=>updateFinal4('bg',v)} />
                  <TeColor label="Border"        value={f4.borderColor}    onChange={v=>updateFinal4('borderColor',v)} />
                  <TeColor label="Card BG"       value={f4.cardBg}         onChange={v=>updateFinal4('cardBg',v)} />
                  <TeColor label="Highlight"     value={f4.highlightColor} onChange={v=>updateFinal4('highlightColor',v)} />
                  <TeColor label="Bar"           value={f4.barColor}       onChange={v=>updateFinal4('barColor',v)} />
                  <TeColor label="Text"          value={f4.textColor}      onChange={v=>updateFinal4('textColor',v)} />
                  <div className="te-divider" />
                  <TeSelect label="Entry Anim"  value={f4.entryAnimation}  options={['fade','slide','zoom']}        onChange={v=>updateFinal4('entryAnimation',v)} />
                  <TeSelect label="Pulse Speed" value={f4.pulseSpeed}      options={['slow','medium','fast']}       onChange={v=>updateFinal4('pulseSpeed',v)} />
                  <TeSelect label="Glow"        value={f4.glowIntensity}   options={['none','low','medium','high']} onChange={v=>updateFinal4('glowIntensity',v)} />
                </>)}

                {activeTab === 'booyah' && (<>
                  <TeColor label="Background"   value={by.bg}           onChange={v=>updateBooyah('bg',v)} />
                  <TeColor label="BOOYAH Color" value={by.booyahColor}  onChange={v=>updateBooyah('booyahColor',v)} />
                  <TeColor label="Glow"         value={by.glowColor}    onChange={v=>updateBooyah('glowColor',v)} />
                  <TeColor label="Winner Name"  value={by.winnerColor}  onChange={v=>updateBooyah('winnerColor',v)} />
                  <TeColor label="Kills"        value={by.killsColor}   onChange={v=>updateBooyah('killsColor',v)} />
                  <TeColor label="Accent"       value={by.accentColor}  onChange={v=>updateBooyah('accentColor',v)} />
                  <div className="te-divider" />
                  <TeSelect label="Entry Anim"  value={by.entryAnimation} options={['fade','slide_up','zoom']}      onChange={v=>updateBooyah('entryAnimation',v)} />
                  <TeSelect label="Text Anim"   value={by.textAnimation}  options={['static','pulse','glow']}       onChange={v=>updateBooyah('textAnimation',v)} />
                  <TeSelect label="Glow"        value={by.glowIntensity}  options={['none','low','medium','high']}  onChange={v=>updateBooyah('glowIntensity',v)} />
                  <div className="te-divider" />
                  <TeToggle label="Particles"   value={by.particles}    onChange={v=>updateBooyah('particles',v)} />
                  <TeToggle label="Confetti"    value={by.confetti}     onChange={v=>updateBooyah('confetti',v)} />
                </>)}
              </div>

            </div>
          </div>

          {/* RIGHT PREVIEW */}
          <div className="te-right">
            <div className="te-preview-bar">
              <span className="te-preview-lbl">Live Preview</span>
              <div className="te-preview-tabs">
                {['leaderboard','final4','booyah'].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`te-preview-tab ${activeTab===tab?'active':'inactive'}`}>
                    {tab==='leaderboard'?'Leaderboard':tab==='final4'?'Final 4':'Booyah'}
                  </button>
                ))}
              </div>
            </div>

            <div className="te-preview-area">
              <div className="te-preview-wm">PREVIEW</div>

              {/* LEADERBOARD PREVIEW */}
              {activeTab === 'leaderboard' && (
                <div style={{ width: 340, fontFamily: "'Barlow Condensed', sans-serif" }}>
                  {/* Match label */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'4px 12px', background:'linear-gradient(90deg,rgba(10,8,4,0.98),rgba(20,15,5,0.95))', borderLeft:'3px solid #c9a84c' }}>
                      <span style={{ fontSize:9, letterSpacing:'3px', textTransform:'uppercase', color:'#c9a84c', fontWeight:700 }}>Match Points</span>
                      <span style={{ fontSize:9, letterSpacing:'2px', color:'rgba(200,170,80,0.5)', fontWeight:600 }}>5 Teams</span>
                    </div>
                    {/* Gold header */}
                    <div style={{ display:'grid', gridTemplateColumns:'42px 1fr 44px 54px', alignItems:'center', padding:'7px 10px', background:'linear-gradient(90deg,#b8974a 0%,#e8c96a 40%,#c9a84c 100%)', clipPath:'polygon(0 0,100% 0,100% 100%,8px 100%)' }}>
                      {['RANK','TEAM','ELIMS','ALIVE'].map((h,i) => (
                        <span key={h} style={{ fontSize:9, fontWeight:800, letterSpacing:'2.5px', textTransform:'uppercase', color:'rgba(20,10,0,0.75)', textAlign:i<=1?'left':'center' }}>{h}</span>
                      ))}
                    </div>
                    {/* Rows */}
                    {[{rank:1,name:'Team ATE',kills:7,alive:4,elim:false},{rank:2,name:'Team BLX',kills:5,alive:3,elim:false},{rank:3,name:'Team ITS',kills:3,alive:2,elim:false},{rank:4,name:'Team CME',kills:0,alive:0,elim:true},{rank:5,name:'Team RUG',kills:0,alive:0,elim:true}].map((row,i) => {
                      const rc = i===0?'#FFD700':i===1?'#D4D4D4':i===2?'#cd7f32':'rgba(180,190,210,0.5)'
                    return (
                      <div key={i} style={{
                        display:'grid', gridTemplateColumns:'42px 1fr 44px 54px',
                        alignItems:'center',
                        background: cardBgImage
                          ? `linear-gradient(rgba(0,0,0,${1-cardImageOpacity/100}),rgba(0,0,0,${1-cardImageOpacity/100})),url(${cardBgImage})`
                          : i===0?'linear-gradient(90deg,rgba(30,22,0,0.97),rgba(10,8,4,0.93))'
                          : i===1?'linear-gradient(90deg,rgba(20,20,22,0.97),rgba(8,8,12,0.93))'
                          : i===2?'linear-gradient(90deg,rgba(22,14,4,0.97),rgba(8,8,12,0.93))'
                          : row.elim?'linear-gradient(90deg,rgba(20,5,5,0.95),rgba(8,8,12,0.90))'
                          : 'linear-gradient(90deg,rgba(12,9,4,0.96),rgba(8,8,12,0.92))',
                        backgroundSize:'cover', backgroundPosition:'center',
                        borderLeft:`3px solid ${rc}`,
                        padding:'6px 10px 6px 0',
                        marginTop:1,
                        opacity: row.elim?0.65:1
                      }}>
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:1, padding:'0 4px' }}>
                          <span style={{ fontSize:row.rank<=3?16:13, fontWeight:800, color:rc, lineHeight:1 }}>{row.rank}</span>
                          <span style={{ fontSize:7, fontWeight:700, color:rc, opacity:0.7 }}>{['','ST','ND','RD','TH','TH'][row.rank]}</span>
                        </div>
                        <div style={{ padding:'0 8px' }}>
                          <p style={{ fontSize:14, fontWeight:800, letterSpacing:'1.5px', textTransform:'uppercase', color:row.elim?'rgba(240,236,224,0.35)':'#f0ece0', lineHeight:1 }}>{row.name}</p>
                        </div>
                        <div style={{ textAlign:'center' }}>
                          <span style={{ fontSize:17, fontWeight:800, color:rc, lineHeight:1 }}>{row.kills}</span>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
                          {row.elim ? (
                            <span style={{ fontSize:8, fontWeight:800, letterSpacing:'2px', color:'#ff4444', border:'1px solid rgba(255,60,60,0.3)', padding:'1px 5px', background:'rgba(255,0,0,0.07)' }}>ELIM</span>
                          ) : (
                            <div style={{ display:'flex', gap:3 }}>
                              {[0,1,2,3].map(p => (
                                <div key={p} style={{ width:6, height:6, borderRadius:'50%', background:p<row.alive?rc:'rgba(255,255,255,0.1)' }}/>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                })}
                {/* Footer */}
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 12px', background:'linear-gradient(90deg,rgba(184,151,74,0.15),transparent)', borderTop:'1px solid rgba(184,151,74,0.2)' }}>
                  <div style={{ width:5, height:5, borderRadius:'50%', background:'#f70707' }}/>
                  <span style={{ fontSize:8, letterSpacing:'2px', textTransform:'uppercase', color:'rgba(241,49,49,0.96)', fontWeight:700 }}>Live — Match</span>
                </div>
              </div>
            )}

              {/* FINAL 4 PREVIEW */}
              {activeTab === 'final4' && (
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", width:'100%', maxWidth:700 }}>
                  {/* Header strip */}
                  <div style={{ background:'linear-gradient(90deg,#0a0600,#1a0e00,#0a0600)', borderBottom:'2px solid #c9a84c', padding:'5px 0', display:'flex', alignItems:'center', justifyContent:'center', gap:16 }}>
                    <div style={{ flex:1, height:1, background:'linear-gradient(90deg,transparent,#c9a84c)', maxWidth:120 }}/>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:6, height:6, borderRadius:'50%', background:'#ff4444' }}/>
                      <span style={{ fontSize:11, fontWeight:800, letterSpacing:'5px', textTransform:'uppercase', color:'#c9a84c' }}>Final 4 Teams Alive</span>
                      <div style={{ width:6, height:6, borderRadius:'50%', background:'#ff4444' }}/>
                    </div>
                    <div style={{ flex:1, height:1, background:'linear-gradient(90deg,#c9a84c,transparent)', maxWidth:120 }}/>
                  </div>
                  {/* Team cards */}
                  <div style={{ display:'flex', gap:6, padding:'8px 20px 10px', background:'linear-gradient(180deg,rgba(8,5,0,0.97),rgba(4,3,0,0.95))', borderBottom:'1px solid rgba(201,168,76,0.2)', justifyContent:'center' }}>
                    {[{name:'Team ATE',kills:7,rank:0},{name:'Team BLX',kills:5,rank:1},{name:'Team ITS',kills:3,rank:2},{name:'Team CME',kills:1,rank:3}].map((team,i) => {
                      const rc = ['#FFD700','#C0C0C0','#cd7f32','#e8c96a'][i]
                      return (
                        <div key={i} style={{
                          flex:1, maxWidth:180, minWidth:120, position:'relative', overflow:'hidden',
                            background: cardBgImage
                              ? `linear-gradient(rgba(0,0,0,${1-cardImageOpacity/100}),rgba(0,0,0,${1-cardImageOpacity/100})),url(${cardBgImage})`
                              : i===0?'linear-gradient(160deg,rgba(40,28,0,0.98),rgba(20,14,0,0.97))':'linear-gradient(160deg,rgba(14,11,4,0.98),rgba(8,6,2,0.97))',
                            backgroundSize:'cover', backgroundPosition:'center',
                            border:`1px solid ${rc}40`, borderTop:`3px solid ${rc}`, padding:'10px 14px'
                          }}>
                            <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:5 }}>
                              <span style={{ fontSize:10, fontWeight:900, letterSpacing:'2px', color:rc }}>#{i+1}</span>
                              <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${rc}50,transparent)` }}/>
                              <span style={{ fontSize:10, fontWeight:800, color:rc, background:`${rc}15`, padding:'1px 6px', border:`1px solid ${rc}30` }}>{team.kills}K</span>
                            </div>
                            <div style={{ fontSize:i===0?20:18, fontWeight:900, letterSpacing:'2px', textTransform:'uppercase', color:i===0?'#fff8e1':'#f0ece0', lineHeight:1, marginBottom:8 }}>{team.name}</div>
                            <div style={{ display:'flex', gap:4 }}>
                              {[0,1,2,3].map(p => (
                                <div key={p} style={{ flex:1, height:p<4-i?5:3, borderRadius:2, background:p<4-i?rc:'rgba(255,255,255,0.1)' }}/>
                              ))}
                            </div>
                            <div style={{ marginTop:6, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                              <span style={{ fontSize:9, letterSpacing:'2px', textTransform:'uppercase', color:'rgba(201,168,76,0.4)' }}>PTS</span>
                              <span style={{ fontSize:14, fontWeight:900, color:rc }}>{17-i*4}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

              {/* BOOYAH PREVIEW */}
              {activeTab === 'booyah' && (
                <div className="te-by-wrap" style={{
                  backgroundColor: by.bg,
                  backgroundImage: cardBgImage ? `url(${cardBgImage})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderColor: by.accentColor,
                  boxShadow: by.glowIntensity !== 'none' ? `0 0 ${by.glowIntensity==='low'?'24px':by.glowIntensity==='medium'?'48px':'80px'} ${by.glowColor}50` : '0 4px 32px rgba(0,0,0,0.6)'
                }}>
                  {cardBgImage && (
                    <div style={{ position:'absolute', inset:0, background:`rgba(0,0,0,${1 - cardImageOpacity/100})`, borderRadius:'18px', zIndex:0 }} />
                  )}
                  <div className="te-by-sub" style={{ color:by.killsColor }}>Winner Winner</div>
                  <div className="te-by-main" style={{ color:by.booyahColor, textShadow:`0 0 30px ${by.glowColor}90, 0 0 60px ${by.glowColor}40` }}>BOOYAH!</div>
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