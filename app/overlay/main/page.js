'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useSearchParams } from 'next/navigation'

const PLACEMENT_POINTS = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]

function MainOverlayContent() {
  const searchParams = useSearchParams()
  const matchId = searchParams.get('match')

  const [teams, setTeams] = useState([])
  const [overlayState, setOverlayState] = useState('leaderboard')
  const [winner, setWinner] = useState(null)
  const [settings, setSettings] = useState(null)
  const [matchPoints, setMatchPoints] = useState([])
  const [overallPoints, setOverallPoints] = useState([])
  const [theme, setTheme] = useState(null)
  const [final4Visible, setFinal4Visible] = useState(false)
  const booyahDeclared = useRef(false)

  const [leaderboardPos, setLeaderboardPos] = useState({ x: 20, y: 20 })
  const [leaderboardSize, setLeaderboardSize] = useState({ width: 420, height: 600 })

  const dragging = useRef(null)
  const resizing = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })

  useEffect(() => {
    fetchAll()

    const channel = supabase
      .channel('main-overlay-v4')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'themes' }, () => {
        if (matchId) fetchTheme(matchId)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches' }, (payload) => {
        if (payload.new.status === 'finished') checkWinner(payload.new.id)
        else if (payload.new.status === 'live') {
          booyahDeclared.current = false
          setFinal4Visible(false)
          fetchAll()
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'overlay_settings' }, () => fetchSettings())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_points' }, () => fetchAll())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchAll() {
    if (booyahDeclared.current) return
    await fetchSettings()
    await fetchTeams()
    await fetchPoints()
  }

  async function fetchSettings() {
    if (!matchId) return
    const { data } = await supabase
      .from('overlay_settings')
      .select('*')
      .eq('match_id', matchId)
      .single()
    if (data) {
      setSettings(data)
      setLeaderboardPos({ x: data.leaderboard_x || 20, y: data.leaderboard_y || 20 })
      setLeaderboardSize({ width: data.leaderboard_width || 420, height: data.leaderboard_height || 600 })
    }
  }

  async function fetchTheme(mId) {
    const { data } = await supabase
      .from('themes')
      .select('*')
      .eq('match_id', mId)
      .single()
    if (data) setTheme(data)
  }

  async function fetchTeams() {
    let liveMatchId = matchId
    if (!liveMatchId) {
      const { data: liveMatch } = await supabase
        .from('matches')
        .select('*')
        .eq('status', 'live')
        .limit(1)
        .single()
      if (!liveMatch) { setTeams([]); return }
      liveMatchId = liveMatch.id
    }

    fetchTheme(liveMatchId)

    const { data } = await supabase
      .from('teams')
      .select('*, players(*)')
      .eq('match_id', liveMatchId)
      .order('total_kills', { ascending: false })

    if (!data) { setTeams([]); return }
    setTeams(data)

    const aliveTeams = data.filter(t => t.players?.some(p => p.alive))
    if (aliveTeams.length <= 4 && aliveTeams.length > 0) {
      if (overlayState !== 'final4') {
        setOverlayState('final4')
        setTimeout(() => setFinal4Visible(true), 100)
      }
    } else {
      setOverlayState('leaderboard')
      setFinal4Visible(false)
    }
  }

  async function fetchPoints() {
    if (!matchId) return
    const { data: mp } = await supabase
      .from('match_points')
      .select('*')
      .eq('match_id', matchId)
    setMatchPoints(mp || [])

    const { data: matchData } = await supabase
      .from('matches')
      .select('tournament_id')
      .eq('id', matchId)
      .single()

    if (matchData?.tournament_id) {
      const { data: op } = await supabase
        .from('match_points')
        .select('*')
        .eq('tournament_id', matchData.tournament_id)
      if (op) {
        const teamMap = {}
        op.forEach(p => {
          if (!teamMap[p.team_name]) teamMap[p.team_name] = { team_name: p.team_name, total: 0 }
          teamMap[p.team_name].total += p.total_points
        })
        setOverallPoints(Object.values(teamMap).sort((a, b) => b.total - a.total))
      }
    }
  }

  async function checkWinner(mId) {
    const { data: winnerTeam } = await supabase
      .from('teams')
      .select('*')
      .eq('match_id', mId)
      .eq('placement', 1)
      .single()
    if (winnerTeam) {
      booyahDeclared.current = true
      setWinner(winnerTeam)
      setOverlayState('booyah')
    }
  }

  const teamsWithPoints = teams.map(team => {
    const mp = matchPoints.find(p => p.team_id === team.id)
    const op = overallPoints.find(p => p.team_name === team.name)
    return {
      ...team,
      matchTotal: mp?.total_points || team.total_kills,
      overallTotal: op?.total || 0
    }
  }).sort((a, b) => {
    const mode = settings?.leaderboard_mode || 'match'
    if (mode === 'overall') return b.overallTotal - a.overallTotal
    return b.matchTotal - a.matchTotal
  })

  const aliveTeams = teams.filter(t => t.players?.some(p => p.alive))
  const mode = settings?.leaderboard_mode || 'match'
  const showLeaderboard = settings?.show_leaderboard !== false
  const showFinal4 = settings?.show_final4 !== false

  const lb = theme?.leaderboard_theme || {}
  const f4 = theme?.final4_theme || {}
  const by = theme?.booyah_theme || {}

  function startDrag(e, type) {
    dragging.current = type
    dragOffset.current = {
      x: e.clientX - leaderboardPos.x,
      y: e.clientY - leaderboardPos.y
    }
    e.preventDefault()
  }

  function onMouseMove(e) {
    if (dragging.current === 'leaderboard') {
      setLeaderboardPos({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y
      })
    } else if (resizing.current) {
      setLeaderboardSize({
        width: Math.max(300, e.clientX - leaderboardPos.x),
        height: Math.max(200, e.clientY - leaderboardPos.y)
      })
    }
  }

  function stopDrag() {
    dragging.current = null
    resizing.current = false
  }

  function glowSize(intensity) {
    if (intensity === 'low') return '10px'
    if (intensity === 'medium') return '20px'
    if (intensity === 'high') return '60px'
    return '0px'
  }

  // BOOYAH STATE
  if (overlayState === 'booyah') {
    return (
      <>
        <style>{`
          @keyframes booyahSlideUp {
            0% { transform: translateY(100px) scale(0.8); opacity: 0; }
            60% { transform: translateY(-10px) scale(1.05); opacity: 1; }
            100% { transform: translateY(0) scale(1); opacity: 1; }
          }
          @keyframes booyahWinnerFade {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          @keyframes diagonalMove {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
          @keyframes booyahPulse {
            0%, 100% { text-shadow: 0 0 ${glowSize(by.glowIntensity)} ${by.glowColor || '#10b981'}; }
            50% { text-shadow: 0 0 80px ${by.glowColor || '#10b981'}, 0 0 120px ${by.glowColor || '#10b981'}; }
          }
        `}</style>
        <main style={{
          minHeight: '100vh',
          backgroundColor: by.bg || '#000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative'
        }}>
          {/* Diagonal stripe effects */}
          <div style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            pointerEvents: 'none'
          }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                top: '-50%',
                left: `${i * 20 - 10}%`,
                width: '8%',
                height: '200%',
                background: `${by.accentColor || '#10b981'}08`,
                transform: 'rotate(25deg)',
                animation: `diagonalMove ${3 + i * 0.5}s linear infinite`,
              }}/>
            ))}
          </div>

          {/* Corner accents */}
          <div style={{
            position: 'absolute', top: 0, left: 0,
            width: '200px', height: '4px',
            background: by.accentColor || '#10b981'
          }}/>
          <div style={{
            position: 'absolute', top: 0, left: 0,
            width: '4px', height: '200px',
            background: by.accentColor || '#10b981'
          }}/>
          <div style={{
            position: 'absolute', bottom: 0, right: 0,
            width: '200px', height: '4px',
            background: by.accentColor || '#10b981'
          }}/>
          <div style={{
            position: 'absolute', bottom: 0, right: 0,
            width: '4px', height: '200px',
            background: by.accentColor || '#10b981'
          }}/>

          {/* Main Content */}
          <div style={{ textAlign: 'center', zIndex: 10 }}>
            <p style={{
              color: by.killsColor || '#9ca3af',
              fontWeight: 700,
              fontSize: '18px',
              letterSpacing: '8px',
              textTransform: 'uppercase',
              marginBottom: '16px',
              fontFamily: 'monospace',
              animation: 'booyahWinnerFade 0.8s ease forwards'
            }}>
              WINNER WINNER
            </p>

            <h1 style={{
              color: by.booyahColor || '#10b981',
              fontSize: 'clamp(80px, 12vw, 160px)',
              fontWeight: 900,
              lineHeight: 1,
              margin: '0 0 24px',
              letterSpacing: '-2px',
              fontFamily: "'Rajdhani', 'Arial Black', sans-serif",
              textTransform: 'uppercase',
              animation: 'booyahSlideUp 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, booyahPulse 2s ease 1s infinite',
              textShadow: `0 0 ${glowSize(by.glowIntensity)} ${by.glowColor || '#10b981'}`
            }}>
              BOOYAH!
            </h1>

            {/* Winner Card */}
            <div style={{
              display: 'inline-block',
              background: `${by.accentColor || '#10b981'}15`,
              border: `2px solid ${by.accentColor || '#10b981'}`,
              borderRadius: '8px',
              padding: '20px 48px',
              animation: 'booyahWinnerFade 0.8s ease 0.5s both',
            }}>
              <div style={{
                color: by.killsColor || '#9ca3af',
                fontSize: '12px',
                letterSpacing: '4px',
                marginBottom: '8px',
                fontFamily: 'monospace'
              }}>
                CHAMPION
              </div>
              <h2 style={{
                color: by.winnerColor || '#ffffff',
                fontSize: 'clamp(32px, 5vw, 56px)',
                fontWeight: 900,
                margin: 0,
                letterSpacing: '4px',
                fontFamily: "'Rajdhani', 'Arial Black', sans-serif",
                textTransform: 'uppercase'
              }}>
                {winner?.name}
              </h2>
              <p style={{
                color: by.killsColor || '#9ca3af',
                fontSize: '18px',
                marginTop: '8px',
                fontFamily: 'monospace',
                letterSpacing: '2px'
              }}>
                {winner?.total_kills} KILLS
              </p>
            </div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <style>{`
        @keyframes slideDown {
          0% { transform: translateY(-100%); opacity: 0; }
          60% { transform: translateY(4px); opacity: 1; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes cardPop {
          0% { transform: scale(0.8) translateY(-20px); opacity: 0; }
          70% { transform: scale(1.05) translateY(0); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes leaderPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
        }
      `}</style>

      <main
        className="min-h-screen bg-transparent overflow-hidden relative"
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
      >

        {/* FINAL 4 — TOP BAR */}
        {showFinal4 && overlayState === 'final4' && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            animation: final4Visible ? 'slideDown 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : 'none',
            transform: final4Visible ? 'translateY(0)' : 'translateY(-100%)'
          }}>

            {/* Header Label */}
            <div style={{
              background: f4.bg || '#000000',
              borderBottom: `2px solid ${f4.highlightColor || '#fbbf24'}`,
              padding: '6px 32px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              justifyContent: 'center'
            }}>
              <div style={{
                width: '8px', height: '8px',
                background: f4.highlightColor || '#fbbf24',
                borderRadius: '50%',
                animation: 'pulse 1s infinite'
              }}/>
              <span style={{
                color: f4.highlightColor || '#fbbf24',
                fontSize: '13px',
                fontWeight: 800,
                letterSpacing: '6px',
                fontFamily: "'Rajdhani', monospace",
                textTransform: 'uppercase'
              }}>
                FINAL {aliveTeams.length} TEAMS ALIVE
              </span>
              <div style={{
                width: '8px', height: '8px',
                background: f4.highlightColor || '#fbbf24',
                borderRadius: '50%',
                animation: 'pulse 1s infinite'
              }}/>
            </div>

            {/* Team Cards Row */}
            <div style={{
              display: 'flex',
              gap: '8px',
              padding: '8px 16px',
              background: `${f4.bg || '#000000'}ee`,
              borderBottom: `1px solid ${(f4.borderColor || '#fbbf24')}40`,
              width: '100%',
              justifyContent: 'center'
            }}>
              {aliveTeams.map((team, index) => (
                <div
                  key={team.id}
                  style={{
                    background: f4.cardBg || '#1a1a00',
                    border: `1px solid ${f4.borderColor || '#fbbf24'}`,
                    borderTop: `3px solid ${
                      index === 0 ? '#ffd700' :
                      index === 1 ? '#c0c0c0' :
                      index === 2 ? '#cd7f32' :
                      f4.highlightColor || '#fbbf24'
                    }`,
                    borderRadius: '4px',
                    padding: '8px 20px',
                    minWidth: '140px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    animation: `cardPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.1}s both`,
                    boxShadow: index === 0 ? `0 0 20px rgba(255,215,0,0.3)` : 'none'
                  }}
                >
                  {/* Rank */}
                  <span style={{
                    color: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : f4.highlightColor || '#fbbf24',
                    fontSize: '10px',
                    fontWeight: 800,
                    letterSpacing: '3px',
                    fontFamily: 'monospace'
                  }}>
                    #{index + 1}
                  </span>

                  {/* Team Name */}
                  <span style={{
                    color: f4.textColor || '#ffffff',
                    fontSize: '18px',
                    fontWeight: 800,
                    letterSpacing: '2px',
                    fontFamily: "'Rajdhani', sans-serif",
                    textTransform: 'uppercase',
                    lineHeight: 1
                  }}>
                    {team.name}
                  </span>

                  {/* Player Bars */}
                  <div style={{ display: 'flex', gap: '3px', margin: '4px 0' }}>
                    {team.players?.map(p => (
                      <div key={p.id} style={{
                        width: '20px',
                        height: '4px',
                        background: p.alive
                          ? f4.barColor || '#fbbf24'
                          : '#374151',
                        borderRadius: '1px'
                      }}/>
                    ))}
                  </div>

                  {/* Kills */}
                  <span style={{
                    color: f4.highlightColor || '#fbbf24',
                    fontSize: '13px',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    letterSpacing: '1px'
                  }}>
                    {team.total_kills}K
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LEADERBOARD PANEL */}
        {showLeaderboard && overlayState === 'leaderboard' && (
          <div
            className="absolute select-none"
            style={{
              left: leaderboardPos.x,
              top: leaderboardPos.y,
              width: leaderboardSize.width,
              height: leaderboardSize.height,
            }}
          >
            {/* Header */}
            <div
              className="rounded-t-xl px-3 py-2 cursor-grab active:cursor-grabbing flex justify-between items-center"
              style={{
                backgroundColor: lb.headerBg || '#064e3b',
                border: `1px solid ${lb.borderColor || '#10b981'}`,
                boxShadow: lb.borderGlow ? `0 0 20px ${lb.borderColor || '#10b981'}40` : 'none'
              }}
              onMouseDown={(e) => startDrag(e, 'leaderboard')}
            >
              <span className="font-black text-xs uppercase tracking-widest"
                style={{ color: lb.textPrimary || '#ffffff' }}>
                🏆 Leaderboard
              </span>
              <span className="text-[10px] uppercase"
                style={{ color: lb.textSecondary || '#6b7280' }}>
                {mode === 'match' ? 'Match Points' : 'Overall Points'}
              </span>
            </div>

            {/* Table */}
            <div
              className="border-x overflow-y-auto"
              style={{
                height: leaderboardSize.height - 70,
                backgroundColor: lb.panelBg || '#0a0a0c',
                borderColor: lb.borderColor || '#10b981',
                opacity: (lb.opacity || 95) / 100
              }}
            >
              <table className="w-full">
                <thead className="sticky top-0">
                  <tr style={{ backgroundColor: lb.headerBg || '#064e3b' }}>
                    <th className="text-left px-2 py-1.5 text-[10px] uppercase"
                      style={{ color: lb.textSecondary || '#6b7280' }}>#</th>
                    <th className="text-left px-2 py-1.5 text-[10px] uppercase"
                      style={{ color: lb.textSecondary || '#6b7280' }}>Team</th>
                    <th className="px-2 py-1.5 text-[10px] uppercase"
                      style={{ color: lb.textSecondary || '#6b7280' }}>K</th>
                    <th className="px-2 py-1.5 text-[10px] uppercase font-bold"
                      style={{ color: lb.pointsColor || '#fbbf24' }}>PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {teamsWithPoints.map((team, index) => (
                    <tr key={team.id} className="border-b"
                      style={{ borderColor: (lb.borderColor || '#10b981') + '20' }}>
                      <td className="px-2 py-1.5 font-black"
                        style={{ color: lb.rankColor || '#fbbf24', fontSize: `${lb.fontSize || 12}px` }}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </td>
                      <td className="px-2 py-1.5">
                        <span className="font-bold"
                          style={{ color: lb.textPrimary || '#ffffff', fontSize: `${lb.fontSize || 12}px` }}>
                          {team.name}
                        </span>
                        <div className="flex gap-0.5 mt-1">
                          {team.players?.map(p => (
                            <div key={p.id} className="flex-1 rounded-sm"
                              style={{
                                height: `${lb.barHeight || 6}px`,
                                backgroundColor: p.alive ? lb.barAlive || '#10b981' : lb.barDead || '#374151'
                              }}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <span className="font-bold"
                          style={{ color: lb.killsColor || '#60a5fa', fontSize: `${lb.fontSize || 12}px` }}>
                          {team.total_kills}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <span className="font-black"
                          style={{ color: lb.pointsColor || '#fbbf24', fontSize: `${lb.fontSize || 12}px` }}>
                          {mode === 'overall' ? team.overallTotal : team.matchTotal}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Resize Handle */}
            <div
              className="rounded-b-xl h-5 cursor-se-resize flex items-center justify-center border"
              style={{
                backgroundColor: lb.headerBg || '#064e3b',
                borderColor: lb.borderColor || '#10b981'
              }}
              onMouseDown={(e) => { resizing.current = true; e.preventDefault() }}
            >
              <div className="w-4 h-0.5 rounded"
                style={{ backgroundColor: lb.borderColor || '#10b981' }}/>
            </div>
          </div>
        )}

      </main>
    </>
  )
}

export default function MainOverlay() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-transparent"/>}>
      <MainOverlayContent />
    </Suspense>
  )
}