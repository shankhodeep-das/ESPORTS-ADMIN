'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import Link from 'next/link'

const PRESET_THEMES = {
  'Neon Green': {
    leaderboard: {
      panelBg: '#0a0a0c',
      borderColor: '#10b981',
      headerBg: '#064e3b',
      textPrimary: '#ffffff',
      textSecondary: '#6b7280',
      rankColor: '#fbbf24',
      killsColor: '#60a5fa',
      pointsColor: '#fbbf24',
      barAlive: '#10b981',
      barDead: '#374151',
      opacity: '95',
      borderRadius: '12',
      barHeight: '6',
      fontSize: '12',
      borderGlow: true,
    },
    final4: {
      bg: '#000000',
      borderColor: '#fbbf24',
      cardBg: '#1a1a00',
      highlightColor: '#fbbf24',
      barColor: '#fbbf24',
      textColor: '#ffffff',
      glowIntensity: 'medium',
      entryAnimation: 'fade',
      pulseSpeed: 'medium',
    },
    booyah: {
      bg: '#000000',
      booyahColor: '#10b981',
      glowColor: '#10b981',
      winnerColor: '#ffffff',
      killsColor: '#9ca3af',
      accentColor: '#10b981',
      entryAnimation: 'slide_up',
      textAnimation: 'glow',
      particles: true,
      confetti: false,
      glowIntensity: 'high',
    }
  },
  'BGMI Purple': {
    leaderboard: {
      panelBg: '#0f0a1e',
      borderColor: '#7c3aed',
      headerBg: '#2e1065',
      textPrimary: '#ffffff',
      textSecondary: '#a78bfa',
      rankColor: '#fbbf24',
      killsColor: '#60a5fa',
      pointsColor: '#fbbf24',
      barAlive: '#7c3aed',
      barDead: '#374151',
      opacity: '95',
      borderRadius: '12',
      barHeight: '6',
      fontSize: '12',
      borderGlow: true,
    },
    final4: {
      bg: '#0f0a1e',
      borderColor: '#7c3aed',
      cardBg: '#1e1040',
      highlightColor: '#a78bfa',
      barColor: '#7c3aed',
      textColor: '#ffffff',
      glowIntensity: 'high',
      entryAnimation: 'zoom',
      pulseSpeed: 'fast',
    },
    booyah: {
      bg: '#0f0a1e',
      booyahColor: '#a78bfa',
      glowColor: '#7c3aed',
      winnerColor: '#ffffff',
      killsColor: '#a78bfa',
      accentColor: '#7c3aed',
      entryAnimation: 'zoom',
      textAnimation: 'pulse',
      particles: true,
      confetti: true,
      glowIntensity: 'high',
    }
  },
  'Championship Gold': {
    leaderboard: {
      panelBg: '#0a0800',
      borderColor: '#f59e0b',
      headerBg: '#451a03',
      textPrimary: '#ffffff',
      textSecondary: '#d97706',
      rankColor: '#f59e0b',
      killsColor: '#fbbf24',
      pointsColor: '#f59e0b',
      barAlive: '#f59e0b',
      barDead: '#374151',
      opacity: '95',
      borderRadius: '8',
      barHeight: '8',
      fontSize: '12',
      borderGlow: true,
    },
    final4: {
      bg: '#0a0800',
      borderColor: '#f59e0b',
      cardBg: '#1c1000',
      highlightColor: '#f59e0b',
      barColor: '#f59e0b',
      textColor: '#ffffff',
      glowIntensity: 'high',
      entryAnimation: 'slide',
      pulseSpeed: 'slow',
    },
    booyah: {
      bg: '#0a0800',
      booyahColor: '#f59e0b',
      glowColor: '#f59e0b',
      winnerColor: '#ffffff',
      killsColor: '#d97706',
      accentColor: '#f59e0b',
      entryAnimation: 'slide_up',
      textAnimation: 'glow',
      particles: true,
      confetti: true,
      glowIntensity: 'high',
    }
  },
  'Valorant': {
    leaderboard: {
      panelBg: '#0f1923',
      borderColor: '#ff4655',
      headerBg: '#1a2535',
      textPrimary: '#ffffff',
      textSecondary: '#ece8e1',
      rankColor: '#ff4655',
      killsColor: '#ff4655',
      pointsColor: '#fbbf24',
      barAlive: '#ff4655',
      barDead: '#374151',
      opacity: '95',
      borderRadius: '4',
      barHeight: '6',
      fontSize: '12',
      borderGlow: false,
    },
    final4: {
      bg: '#0f1923',
      borderColor: '#ff4655',
      cardBg: '#1a2535',
      highlightColor: '#ff4655',
      barColor: '#ff4655',
      textColor: '#ece8e1',
      glowIntensity: 'low',
      entryAnimation: 'fade',
      pulseSpeed: 'medium',
    },
    booyah: {
      bg: '#0f1923',
      booyahColor: '#ff4655',
      glowColor: '#ff4655',
      winnerColor: '#ece8e1',
      killsColor: '#9ca3af',
      accentColor: '#ff4655',
      entryAnimation: 'fade',
      textAnimation: 'static',
      particles: false,
      confetti: false,
      glowIntensity: 'medium',
    }
  },
  'Minimal Dark': {
    leaderboard: {
      panelBg: '#000000',
      borderColor: '#374151',
      headerBg: '#111111',
      textPrimary: '#ffffff',
      textSecondary: '#6b7280',
      rankColor: '#ffffff',
      killsColor: '#9ca3af',
      pointsColor: '#ffffff',
      barAlive: '#ffffff',
      barDead: '#1f2937',
      opacity: '90',
      borderRadius: '8',
      barHeight: '4',
      fontSize: '11',
      borderGlow: false,
    },
    final4: {
      bg: '#000000',
      borderColor: '#374151',
      cardBg: '#111111',
      highlightColor: '#ffffff',
      barColor: '#ffffff',
      textColor: '#ffffff',
      glowIntensity: 'none',
      entryAnimation: 'fade',
      pulseSpeed: 'slow',
    },
    booyah: {
      bg: '#000000',
      booyahColor: '#ffffff',
      glowColor: '#ffffff',
      winnerColor: '#ffffff',
      killsColor: '#6b7280',
      accentColor: '#374151',
      entryAnimation: 'fade',
      textAnimation: 'static',
      particles: false,
      confetti: false,
      glowIntensity: 'low',
    }
  },
  'Fire Red': {
    leaderboard: {
      panelBg: '#0a0000',
      borderColor: '#ef4444',
      headerBg: '#450a0a',
      textPrimary: '#ffffff',
      textSecondary: '#fca5a5',
      rankColor: '#fbbf24',
      killsColor: '#ef4444',
      pointsColor: '#fbbf24',
      barAlive: '#ef4444',
      barDead: '#374151',
      opacity: '95',
      borderRadius: '8',
      barHeight: '6',
      fontSize: '12',
      borderGlow: true,
    },
    final4: {
      bg: '#0a0000',
      borderColor: '#ef4444',
      cardBg: '#1c0000',
      highlightColor: '#ef4444',
      barColor: '#ef4444',
      textColor: '#ffffff',
      glowIntensity: 'high',
      entryAnimation: 'zoom',
      pulseSpeed: 'fast',
    },
    booyah: {
      bg: '#0a0000',
      booyahColor: '#ef4444',
      glowColor: '#ef4444',
      winnerColor: '#ffffff',
      killsColor: '#fca5a5',
      accentColor: '#ef4444',
      entryAnimation: 'zoom',
      textAnimation: 'pulse',
      particles: true,
      confetti: true,
      glowIntensity: 'high',
    }
  }
}

const FONTS = ['Inter', 'Rajdhani', 'Orbitron', 'Barlow', 'Oxanium', 'Exo 2']

export default function ThemeEditor() {
  const [matches, setMatches] = useState([])
  const [selectedMatch, setSelectedMatch] = useState('')
  const [activeTab, setActiveTab] = useState('leaderboard')
  const [theme, setTheme] = useState(PRESET_THEMES['Neon Green'])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState('Neon Green')

  useEffect(() => {
    fetchMatches()
  }, [])

  useEffect(() => {
    if (selectedMatch) fetchTheme()
  }, [selectedMatch])

  async function fetchMatches() {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .order('created_at', { ascending: false })
    setMatches(data || [])
  }

  async function fetchTheme() {
    const { data } = await supabase
      .from('themes')
      .select('*')
      .eq('match_id', selectedMatch)
      .single()

    if (data) {
      setTheme({
        leaderboard: data.leaderboard_theme,
        final4: data.final4_theme,
        booyah: data.booyah_theme
      })
    }
  }

  async function saveTheme() {
    if (!selectedMatch) return alert('Please select a match first')
    setSaving(true)

    const { data: existing } = await supabase
      .from('themes')
      .select('*')
      .eq('match_id', selectedMatch)
      .single()

    if (existing) {
      await supabase
        .from('themes')
        .update({
          leaderboard_theme: theme.leaderboard,
          final4_theme: theme.final4,
          booyah_theme: theme.booyah,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('themes')
        .insert([{
          match_id: selectedMatch,
          leaderboard_theme: theme.leaderboard,
          final4_theme: theme.final4,
          booyah_theme: theme.booyah
        }])
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function applyPreset(presetName) {
    setTheme(PRESET_THEMES[presetName])
    setSelectedPreset(presetName)
  }

  function updateLeaderboard(key, value) {
    setTheme(prev => ({
      ...prev,
      leaderboard: { ...prev.leaderboard, [key]: value }
    }))
  }

  function updateFinal4(key, value) {
    setTheme(prev => ({
      ...prev,
      final4: { ...prev.final4, [key]: value }
    }))
  }

  function updateBooyah(key, value) {
    setTheme(prev => ({
      ...prev,
      booyah: { ...prev.booyah, [key]: value }
    }))
  }

  const lb = theme.leaderboard
  const f4 = theme.final4
  const by = theme.booyah

  return (
    <main className="min-h-screen bg-[#0a0a0c] text-white">

      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-white/10">
        <div>
          <Link href="/dashboard">
            <span className="text-slate-400 text-xs hover:text-white cursor-pointer uppercase tracking-widest font-bold">
              ← Dashboard
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-[#10b981] mt-1">
            🎨 Theme Editor
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Match Selector */}
          <select
            value={selectedMatch}
            onChange={(e) => setSelectedMatch(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#10b981]"
          >
            <option value="">Select Match...</option>
            {matches.map(m => (
              <option key={m.id} value={m.id} className="bg-gray-900">
                {m.title} — {m.round}
              </option>
            ))}
          </select>

          <button
            onClick={saveTheme}
            disabled={saving}
            className="bg-[#10b981] hover:bg-[#1fd998] text-black font-black px-6 py-2 rounded-lg uppercase tracking-widest text-sm transition-all hover:-translate-y-0.5 disabled:opacity-50"
          >
            {saving ? 'Saving...' : saved ? '✅ Saved!' : 'Save Theme'}
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">

        {/* LEFT — Controls */}
        <div className="w-80 border-r border-white/10 overflow-y-auto p-4 flex flex-col gap-4">

          {/* Preset Themes */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              Preset Themes
            </p>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(PRESET_THEMES).map(name => (
                <button
                  key={name}
                  onClick={() => applyPreset(name)}
                  className={`p-2 rounded-lg text-xs font-bold border transition-all ${
                    selectedPreset === name
                      ? 'border-[#10b981] bg-[#10b981]/10 text-[#10b981]'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/30'
                  }`}
                  style={{
                    borderColor: selectedPreset === name
                      ? PRESET_THEMES[name].leaderboard.borderColor
                      : undefined,
                    color: selectedPreset === name
                      ? PRESET_THEMES[name].leaderboard.borderColor
                      : undefined
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white/5 rounded-lg p-1">
            {['leaderboard', 'final4', 'booyah'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md uppercase tracking-widest transition-all ${
                  activeTab === tab
                    ? 'bg-[#10b981] text-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab === 'leaderboard' ? '📊' : tab === 'final4' ? '⚡' : '🏆'} {tab}
              </button>
            ))}
          </div>

          {/* LEADERBOARD CONTROLS */}
          {activeTab === 'leaderboard' && (
            <div className="flex flex-col gap-4">
              <ColorControl label="Panel Background" value={lb.panelBg} onChange={v => updateLeaderboard('panelBg', v)} />
              <ColorControl label="Border Color" value={lb.borderColor} onChange={v => updateLeaderboard('borderColor', v)} />
              <ColorControl label="Header Background" value={lb.headerBg} onChange={v => updateLeaderboard('headerBg', v)} />
              <ColorControl label="Text Primary" value={lb.textPrimary} onChange={v => updateLeaderboard('textPrimary', v)} />
              <ColorControl label="Text Secondary" value={lb.textSecondary} onChange={v => updateLeaderboard('textSecondary', v)} />
              <ColorControl label="Rank Color" value={lb.rankColor} onChange={v => updateLeaderboard('rankColor', v)} />
              <ColorControl label="Kills Color" value={lb.killsColor} onChange={v => updateLeaderboard('killsColor', v)} />
              <ColorControl label="Points Color" value={lb.pointsColor} onChange={v => updateLeaderboard('pointsColor', v)} />
              <ColorControl label="Bar Alive" value={lb.barAlive} onChange={v => updateLeaderboard('barAlive', v)} />
              <ColorControl label="Bar Dead" value={lb.barDead} onChange={v => updateLeaderboard('barDead', v)} />
              <SliderControl label="Opacity" value={lb.opacity} min="50" max="100" onChange={v => updateLeaderboard('opacity', v)} />
              <SliderControl label="Border Radius" value={lb.borderRadius} min="0" max="24" onChange={v => updateLeaderboard('borderRadius', v)} />
              <SliderControl label="Bar Height" value={lb.barHeight} min="2" max="16" onChange={v => updateLeaderboard('barHeight', v)} />
              <SliderControl label="Font Size" value={lb.fontSize} min="8" max="18" onChange={v => updateLeaderboard('fontSize', v)} />
              <ToggleControl label="Border Glow" value={lb.borderGlow} onChange={v => updateLeaderboard('borderGlow', v)} />
            </div>
          )}

          {/* FINAL 4 CONTROLS */}
          {activeTab === 'final4' && (
            <div className="flex flex-col gap-4">
              <ColorControl label="Background" value={f4.bg} onChange={v => updateFinal4('bg', v)} />
              <ColorControl label="Border Color" value={f4.borderColor} onChange={v => updateFinal4('borderColor', v)} />
              <ColorControl label="Card Background" value={f4.cardBg} onChange={v => updateFinal4('cardBg', v)} />
              <ColorControl label="Highlight Color" value={f4.highlightColor} onChange={v => updateFinal4('highlightColor', v)} />
              <ColorControl label="Bar Color" value={f4.barColor} onChange={v => updateFinal4('barColor', v)} />
              <ColorControl label="Text Color" value={f4.textColor} onChange={v => updateFinal4('textColor', v)} />
              <SelectControl label="Entry Animation" value={f4.entryAnimation} options={['fade', 'slide', 'zoom']} onChange={v => updateFinal4('entryAnimation', v)} />
              <SelectControl label="Pulse Speed" value={f4.pulseSpeed} options={['slow', 'medium', 'fast']} onChange={v => updateFinal4('pulseSpeed', v)} />
              <SelectControl label="Glow Intensity" value={f4.glowIntensity} options={['none', 'low', 'medium', 'high']} onChange={v => updateFinal4('glowIntensity', v)} />
            </div>
          )}

          {/* BOOYAH CONTROLS */}
          {activeTab === 'booyah' && (
            <div className="flex flex-col gap-4">
              <ColorControl label="Background" value={by.bg} onChange={v => updateBooyah('bg', v)} />
              <ColorControl label="BOOYAH Text Color" value={by.booyahColor} onChange={v => updateBooyah('booyahColor', v)} />
              <ColorControl label="Glow Color" value={by.glowColor} onChange={v => updateBooyah('glowColor', v)} />
              <ColorControl label="Winner Name Color" value={by.winnerColor} onChange={v => updateBooyah('winnerColor', v)} />
              <ColorControl label="Kills Color" value={by.killsColor} onChange={v => updateBooyah('killsColor', v)} />
              <ColorControl label="Accent Color" value={by.accentColor} onChange={v => updateBooyah('accentColor', v)} />
              <SelectControl label="Entry Animation" value={by.entryAnimation} options={['fade', 'slide_up', 'zoom']} onChange={v => updateBooyah('entryAnimation', v)} />
              <SelectControl label="Text Animation" value={by.textAnimation} options={['static', 'pulse', 'glow']} onChange={v => updateBooyah('textAnimation', v)} />
              <SelectControl label="Glow Intensity" value={by.glowIntensity} options={['none', 'low', 'medium', 'high']} onChange={v => updateBooyah('glowIntensity', v)} />
              <ToggleControl label="Particles" value={by.particles} onChange={v => updateBooyah('particles', v)} />
              <ToggleControl label="Confetti" value={by.confetti} onChange={v => updateBooyah('confetti', v)} />
            </div>
          )}

        </div>

        {/* RIGHT — Live Preview */}
        <div className="flex-1 bg-[#111111] flex flex-col">
          <div className="p-3 border-b border-white/10 flex items-center gap-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Live Preview
            </p>
            <div className="flex gap-2">
              {['leaderboard', 'final4', 'booyah'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-xs px-2 py-1 rounded font-bold uppercase tracking-widest transition-all ${
                    activeTab === tab
                      ? 'bg-white/20 text-white'
                      : 'text-slate-500 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-8">

            {/* LEADERBOARD PREVIEW */}
            {activeTab === 'leaderboard' && (
              <div
                className="w-80 rounded-xl overflow-hidden shadow-2xl"
                style={{
                  backgroundColor: lb.panelBg,
                  border: `1px solid ${lb.borderColor}`,
                  borderRadius: `${lb.borderRadius}px`,
                  opacity: lb.opacity / 100,
                  boxShadow: lb.borderGlow ? `0 0 20px ${lb.borderColor}40` : 'none'
                }}
              >
                {/* Header */}
                <div
                  className="px-3 py-2 flex justify-between items-center"
                  style={{ backgroundColor: lb.headerBg }}
                >
                  <span className="font-black text-xs uppercase tracking-widest" style={{ color: lb.textPrimary }}>
                    🏆 Leaderboard
                  </span>
                  <span className="text-[10px] uppercase" style={{ color: lb.textSecondary }}>
                    Match Points
                  </span>
                </div>

                {/* Table Header */}
                <div className="flex px-2 py-1 border-b" style={{ borderColor: lb.borderColor + '30' }}>
                  <span className="w-8 text-[10px] uppercase" style={{ color: lb.textSecondary }}>#</span>
                  <span className="flex-1 text-[10px] uppercase" style={{ color: lb.textSecondary }}>Team</span>
                  <span className="w-8 text-[10px] uppercase text-center" style={{ color: lb.textSecondary }}>K</span>
                  <span className="w-10 text-[10px] uppercase text-center font-bold" style={{ color: lb.pointsColor }}>PTS</span>
                </div>

                {/* Sample Rows */}
                {[
                  { rank: '🥇', name: 'Team ATE', kills: 7, pts: 17 },
                  { rank: '🥈', name: 'Team BLX', kills: 5, pts: 13 },
                  { rank: '🥉', name: 'Team ITS', kills: 3, pts: 11 },
                  { rank: '#4', name: 'Team CME', kills: 2, pts: 9 },
                  { rank: '#5', name: 'Team RUG', kills: 1, pts: 7 },
                ].map((row, i) => (
                  <div key={i} className="px-2 py-1.5 border-b" style={{ borderColor: lb.borderColor + '20' }}>
                    <div className="flex items-center">
                      <span className="w-8 text-xs font-black" style={{ color: lb.rankColor, fontSize: `${lb.fontSize}px` }}>
                        {row.rank}
                      </span>
                      <div className="flex-1">
                        <span className="text-xs font-bold" style={{ color: lb.textPrimary, fontSize: `${lb.fontSize}px` }}>
                          {row.name}
                        </span>
                        <div className="flex gap-0.5 mt-0.5">
                          {[1,2,3,4].map(p => (
                            <div
                              key={p}
                              className="flex-1 rounded-sm"
                              style={{
                                height: `${lb.barHeight}px`,
                                backgroundColor: p <= 4 - i ? lb.barAlive : lb.barDead
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="w-8 text-xs text-center font-bold" style={{ color: lb.killsColor, fontSize: `${lb.fontSize}px` }}>
                        {row.kills}
                      </span>
                      <span className="w-10 text-xs text-center font-black" style={{ color: lb.pointsColor, fontSize: `${lb.fontSize}px` }}>
                        {row.pts}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* FINAL 4 PREVIEW */}
            {activeTab === 'final4' && (
              <div
                className="rounded-xl overflow-hidden shadow-2xl min-w-64"
                style={{
                  backgroundColor: f4.bg,
                  border: `1px solid ${f4.borderColor}`,
                  boxShadow: f4.glowIntensity !== 'none' ? `0 0 ${
                    f4.glowIntensity === 'low' ? '10px' :
                    f4.glowIntensity === 'medium' ? '20px' : '40px'
                  } ${f4.borderColor}50` : 'none'
                }}
              >
                {/* Header */}
                <div
                  className="px-4 py-2 flex items-center gap-2"
                  style={{ backgroundColor: f4.cardBg, borderBottom: `1px solid ${f4.borderColor}50` }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: f4.highlightColor }}/>
                  <span className="font-black text-sm uppercase tracking-widest" style={{ color: f4.highlightColor }}>
                    ⚡ Final 4 Teams
                  </span>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: f4.highlightColor }}/>
                </div>

                {/* Teams */}
                <div className="p-3 flex flex-col gap-2">
                  {['Team ATE', 'Team BLX', 'Team ITS', 'Team CME'].map((name, i) => (
                    <div
                      key={i}
                      className="rounded-lg px-3 py-2"
                      style={{
                        backgroundColor: f4.cardBg,
                        border: `1px solid ${f4.borderColor}40`
                      }}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm" style={{ color: f4.highlightColor }}>
                            #{i + 1}
                          </span>
                          <span className="font-bold text-sm" style={{ color: f4.textColor }}>
                            {name}
                          </span>
                        </div>
                        <span className="text-xs font-bold" style={{ color: f4.highlightColor }}>
                          {7 - i * 2}K
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {[1,2,3,4].map(p => (
                          <div
                            key={p}
                            className="flex-1 rounded-sm h-2"
                            style={{ backgroundColor: p <= 4 - i ? f4.barColor : '#374151' }}
                          />
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
                className="w-96 h-64 rounded-2xl flex flex-col items-center justify-center shadow-2xl border-2"
                style={{
                  backgroundColor: by.bg,
                  borderColor: by.accentColor,
                  boxShadow: by.glowIntensity !== 'none' ? `0 0 ${
                    by.glowIntensity === 'low' ? '20px' :
                    by.glowIntensity === 'medium' ? '40px' : '60px'
                  } ${by.glowColor}40` : 'none'
                }}
              >
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: by.killsColor }}>
                  Winner Winner
                </p>
                <h1
                  className="text-5xl font-black mb-2"
                  style={{
                    color: by.booyahColor,
                    textShadow: `0 0 30px ${by.glowColor}`,
                  }}
                >
                  BOOYAH!
                </h1>
                <h2 className="text-2xl font-black mb-1" style={{ color: by.winnerColor }}>
                  Team ATE
                </h2>
                <p className="text-sm" style={{ color: by.killsColor }}>
                  🎯 7 Kills
                </p>
              </div>
            )}

          </div>
        </div>
      </div>
    </main>
  )
}

// Helper Components
function ColorControl({ label, value, onChange }) {
  return (
    <div className="flex justify-between items-center">
      <label className="text-xs text-slate-400 uppercase tracking-widest">{label}</label>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">{value}</span>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
        />
      </div>
    </div>
  )
}

function SliderControl({ label, value, min, max, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between">
        <label className="text-xs text-slate-400 uppercase tracking-widest">{label}</label>
        <span className="text-xs text-[#10b981] font-bold">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full accent-[#10b981]"
      />
    </div>
  )
}

function SelectControl({ label, value, options, onChange }) {
  return (
    <div className="flex justify-between items-center">
      <label className="text-xs text-slate-400 uppercase tracking-widest">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-[#10b981]"
      >
        {options.map(o => (
          <option key={o} value={o} className="bg-gray-900">{o}</option>
        ))}
      </select>
    </div>
  )
}

function ToggleControl({ label, value, onChange }) {
  return (
    <div className="flex justify-between items-center">
      <label className="text-xs text-slate-400 uppercase tracking-widest">{label}</label>
      <button
        onClick={() => onChange(!value)}
        className={`w-10 h-5 rounded-full transition-all relative ${
          value ? 'bg-[#10b981]' : 'bg-gray-600'
        }`}
      >
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${
          value ? 'left-5' : 'left-0.5'
        }`}/>
      </button>
    </div>
  )
}