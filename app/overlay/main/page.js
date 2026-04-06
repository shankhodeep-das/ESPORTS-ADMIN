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
  const [swappingId, setSwappingId] = useState(null)
  const prevOrderRef = useRef([])
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
      matchTotal: mp?.total_points ?? 0,
      overallTotal: op?.total ?? 0
    }
  }).sort((a, b) => {
    const mode = settings?.leaderboard_mode || 'match'
    if (mode === 'overall') return b.overallTotal - a.overallTotal
    if (b.matchTotal !== a.matchTotal) return b.matchTotal - a.matchTotal
    return b.total_kills - a.total_kills
  })

  const aliveTeams = teams
    .filter(t => t.players?.some(p => p.alive))
    .map(team => {
      const mp = matchPoints.find(p => p.team_id === team.id)
      return { ...team, matchTotal: mp?.total_points ?? 0 }
    })
    .sort((a, b) => {
      if (b.matchTotal !== a.matchTotal) return b.matchTotal - a.matchTotal
      return b.total_kills - a.total_kills
    })

  // Detect rank swaps for animation
  useEffect(() => {
    const currentIds = aliveTeams.map(t => t.id)
    const prevIds = prevOrderRef.current
    if (prevIds.length > 0) {
      for (let i = 0; i < currentIds.length; i++) {
        if (prevIds[i] !== currentIds[i]) {
          setSwappingId(currentIds[i])
          setTimeout(() => setSwappingId(null), 800)
          break
        }
      }
    }
    prevOrderRef.current = currentIds
  }, [aliveTeams.map(t => t.id).join(',')])

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

  // rank colors
  const RANK_COLORS = ['#FFD700', '#C0C0C0', '#cd7f32', '#e8c96a']
  const RANK_GLOW   = ['rgba(255,215,0,0.35)', 'rgba(192,192,192,0.2)', 'rgba(205,127,50,0.2)', 'rgba(232,201,106,0.1)']
  const SUPS = ['', 'ST', 'ND', 'RD', 'TH', 'TH', 'TH', 'TH', 'TH', 'TH', 'TH', 'TH', 'TH']

  function getRankColor(rank) {
    if (rank === 1) return '#FFD700'
    if (rank === 2) return '#D4D4D4'
    if (rank === 3) return '#cd7f32'
    return 'rgba(180,190,210,0.5)'
  }
  function getKillsColor(rank, isElim) {
    if (rank === 1) return '#FFD700'
    if (rank === 2) return '#D4D4D4'
    if (rank === 3) return '#cd7f32'
    if (isElim) return 'rgba(240,236,224,0.3)'
    return '#f0ece0'
  }
  function getLeftBar(rank, isElim) {
    if (rank === 1) return '#FFD700'
    if (rank === 2) return '#C0C0C0'
    if (rank === 3) return '#cd7f32'
    if (isElim) return 'rgba(255,60,60,0.4)'
    return 'rgba(200,168,76,0.15)'
  }
  function getRowBg(rank, isElim) {
    if (rank === 1) return 'linear-gradient(90deg, rgba(30,22,0,0.97) 0%, rgba(10,8,4,0.93) 100%)'
    if (rank === 2) return 'linear-gradient(90deg, rgba(20,20,22,0.97) 0%, rgba(8,8,12,0.93) 100%)'
    if (rank === 3) return 'linear-gradient(90deg, rgba(22,14,4,0.97) 0%, rgba(8,8,12,0.93) 100%)'
    if (isElim)    return 'linear-gradient(90deg, rgba(20,5,5,0.95) 0%, rgba(8,8,12,0.90) 100%)'
    return 'linear-gradient(90deg, rgba(12,9,4,0.96) 0%, rgba(8,8,12,0.92) 100%)'
  }

  // BOOYAH
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
          minHeight: '100vh', backgroundColor: by.bg || '#000000',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', position: 'relative'
        }}>
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{
                position: 'absolute', top: '-50%', left: `${i * 20 - 10}%`,
                width: '8%', height: '200%',
                background: `${by.accentColor || '#10b981'}08`,
                transform: 'rotate(25deg)',
                animation: `diagonalMove ${3 + i * 0.5}s linear infinite`,
              }}/>
            ))}
          </div>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '200px', height: '4px', background: by.accentColor || '#10b981' }}/>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '200px', background: by.accentColor || '#10b981' }}/>
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '200px', height: '4px', background: by.accentColor || '#10b981' }}/>
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '4px', height: '200px', background: by.accentColor || '#10b981' }}/>
          <div style={{ textAlign: 'center', zIndex: 10 }}>
            <p style={{ color: by.killsColor || '#9ca3af', fontWeight: 700, fontSize: '18px', letterSpacing: '8px', textTransform: 'uppercase', marginBottom: '16px', fontFamily: 'monospace', animation: 'booyahWinnerFade 0.8s ease forwards' }}>WINNER WINNER</p>
            <h1 style={{ color: by.booyahColor || '#10b981', fontSize: 'clamp(80px, 12vw, 160px)', fontWeight: 900, lineHeight: 1, margin: '0 0 24px', letterSpacing: '-2px', fontFamily: "'Rajdhani', 'Arial Black', sans-serif", textTransform: 'uppercase', animation: 'booyahSlideUp 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, booyahPulse 2s ease 1s infinite', textShadow: `0 0 ${glowSize(by.glowIntensity)} ${by.glowColor || '#10b981'}` }}>BOOYAH!</h1>
            <div style={{ display: 'inline-block', background: `${by.accentColor || '#10b981'}15`, border: `2px solid ${by.accentColor || '#10b981'}`, borderRadius: '8px', padding: '20px 48px', animation: 'booyahWinnerFade 0.8s ease 0.5s both' }}>
              <div style={{ color: by.killsColor || '#9ca3af', fontSize: '12px', letterSpacing: '4px', marginBottom: '8px', fontFamily: 'monospace' }}>CHAMPION</div>
              <h2 style={{ color: by.winnerColor || '#ffffff', fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, margin: 0, letterSpacing: '4px', fontFamily: "'Rajdhani', 'Arial Black', sans-serif", textTransform: 'uppercase' }}>{winner?.name}</h2>
              <p style={{ color: by.killsColor || '#9ca3af', fontSize: '18px', marginTop: '8px', fontFamily: 'monospace', letterSpacing: '2px' }}>{winner?.total_kills} KILLS</p>
            </div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Rajdhani:wght@600;700&display=swap');

        @keyframes f4SlideDown {
          0%   { transform: translateY(-110%); opacity: 0; }
          65%  { transform: translateY(5px);   opacity: 1; }
          100% { transform: translateY(0);     opacity: 1; }
        }
        @keyframes cardDrop {
          0%   { transform: translateY(-40px) scaleY(0.7); opacity: 0; }
          70%  { transform: translateY(4px)   scaleY(1.03); opacity: 1; }
          100% { transform: translateY(0)     scaleY(1);   opacity: 1; }
        }
        @keyframes swipeUp {
          0%   { transform: translateY(0);    opacity: 1; }
          40%  { transform: translateY(-28px); opacity: 0; }
          60%  { transform: translateY(28px);  opacity: 0; }
          100% { transform: translateY(0);    opacity: 1; }
        }
        @keyframes rankGlow {
          0%, 100% { box-shadow: 0 0 0px transparent; }
          50%       { box-shadow: 0 0 18px rgba(255,215,0,0.5); }
        }
        @keyframes scanline {
          0%   { top: -4px; }
          100% { top: 100%; }
        }
        @keyframes pipPulse {
          0%, 100% { opacity: 1;   transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(0.85); }
        }
        @keyframes shimmer {
          0%   { left: -60%; }
          100% { left: 140%; }
        }
        @keyframes lbpulse {
          0%,100% { opacity:1; }
          50% { opacity:0.3; }
        }
      `}</style>

      <main
        className="min-h-screen bg-transparent overflow-hidden relative"
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
      >

        {/* ═══════════════════════════ FINAL 4 TOP BAR ═══════════════════════════ */}
        {showFinal4 && overlayState === 'final4' && (
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            zIndex: 100,
            animation: final4Visible ? 'f4SlideDown 0.75s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'none',
            transform: final4Visible ? undefined : 'translateY(-110%)',
          }}>

            {/* ── Header strip ── */}
            <div style={{
              background: 'linear-gradient(90deg, #0a0600 0%, #1a0e00 50%, #0a0600 100%)',
              borderBottom: '2px solid #c9a84c',
              padding: '5px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Shimmer */}
              <div style={{
                position: 'absolute', top: 0, bottom: 0, width: '60px',
                background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.15), transparent)',
                animation: 'shimmer 2.5s ease-in-out infinite',
                pointerEvents: 'none',
              }}/>

              {/* Left line */}
              <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, #c9a84c)', maxWidth: 120 }}/>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff4444', animation: 'lbpulse 1s infinite' }}/>
                <span style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 11, fontWeight: 800, letterSpacing: '5px',
                  textTransform: 'uppercase', color: '#c9a84c',
                }}>
                  Final {aliveTeams.length} Teams Alive
                </span>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff4444', animation: 'lbpulse 1s infinite' }}/>
              </div>

              {/* Right line */}
              <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, #c9a84c, transparent)', maxWidth: 120 }}/>
            </div>

            {/* ── Team cards row ── */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 20px 10px',
              background: 'linear-gradient(180deg, rgba(8,5,0,0.97) 0%, rgba(4,3,0,0.95) 100%)',
              borderBottom: '1px solid rgba(201,168,76,0.2)',
            }}>
              {aliveTeams.map((team, index) => {
                const rc = RANK_COLORS[index] || '#e8c96a'
                const rg = RANK_GLOW[index]   || 'transparent'
                const alivePl = team.players?.filter(p => p.alive).length ?? 0
                const totalPl = team.players?.length ?? 4
                const isSwap = swappingId === team.id

                return (
                  <div
                    key={team.id}
                    style={{
                      animation: final4Visible
                        ? isSwap
                          ? 'swipeUp 0.75s cubic-bezier(0.4,0,0.2,1)'
                          : `cardDrop 0.6s cubic-bezier(0.34,1.56,0.64,1) ${index * 0.08}s both`
                        : 'none',
                      flex: '1',
                      maxWidth: '220px',
                      minWidth: '130px',
                      position: 'relative',
                      overflow: 'hidden',
                      background: index === 0
                        ? 'linear-gradient(160deg, rgba(40,28,0,0.98) 0%, rgba(20,14,0,0.97) 100%)'
                        : 'linear-gradient(160deg, rgba(14,11,4,0.98) 0%, rgba(8,6,2,0.97) 100%)',
                      border: `1px solid ${rc}40`,
                      borderTop: `3px solid ${rc}`,
                      padding: '10px 14px 10px',
                    }}
                  >
                    {/* Rank glow bg for #1 */}
                    {index === 0 && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'radial-gradient(ellipse at top, rgba(255,215,0,0.06) 0%, transparent 70%)',
                        pointerEvents: 'none',
                      }}/>
                    )}

                    {/* Scanline effect */}
                    <div style={{
                      position: 'absolute', left: 0, right: 0, height: '1px',
                      background: `linear-gradient(90deg, transparent, ${rc}30, transparent)`,
                      animation: 'scanline 3s linear infinite',
                      pointerEvents: 'none',
                    }}/>

                    {/* Rank label */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px',
                    }}>
                      <span style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: 10, fontWeight: 900, letterSpacing: '2px',
                        color: rc, textTransform: 'uppercase',
                      }}>
                        #{index + 1}<span style={{ fontSize: 7 }}>{SUPS[index + 1]}</span>
                      </span>
                      <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, ${rc}50, transparent)` }}/>
                      {/* Kills badge */}
                      <span style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: 10, fontWeight: 800, letterSpacing: '1px',
                        color: rc, background: `${rc}15`,
                        padding: '1px 6px',
                        border: `1px solid ${rc}30`,
                        clipPath: 'polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%)',
                      }}>
                        {team.total_kills}K
                      </span>
                    </div>

                    {/* Team name */}
                    <div style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: index === 0 ? 22 : 19,
                      fontWeight: 900,
                      letterSpacing: '2px',
                      textTransform: 'uppercase',
                      color: index === 0 ? '#fff8e1' : '#f0ece0',
                      lineHeight: 1,
                      marginBottom: '8px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {team.name}
                    </div>

                    {/* Player pips */}
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      {Array.from({ length: totalPl }, (_, i) => (
                        <div key={i} style={{
                          flex: 1,
                          height: i < alivePl ? '5px' : '3px',
                          borderRadius: '2px',
                          background: i < alivePl ? rc : 'rgba(255,255,255,0.1)',
                          transition: 'all 0.3s ease',
                          animation: i < alivePl && index === 0 ? 'pipPulse 2s ease-in-out infinite' : 'none',
                        }}/>
                      ))}
                    </div>

                    {/* Points row */}
                    <div style={{
                      marginTop: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                      <span style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase',
                        color: 'rgba(201,168,76,0.4)',
                      }}>PTS</span>
                      <span style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: 14, fontWeight: 900,
                        color: rc,
                        letterSpacing: '1px',
                      }}>
                        {team.matchTotal}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ═══════════════════════════ LEADERBOARD PANEL ═════════════════════════ */}
        {showLeaderboard && overlayState === 'leaderboard' && (
          <div
            className="absolute select-none"
            style={{ left: leaderboardPos.x, top: leaderboardPos.y, width: leaderboardSize.width }}
          >
            {/* Match label bar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '4px 12px',
              background: 'linear-gradient(90deg, rgba(10,8,4,0.98), rgba(20,15,5,0.95))',
              borderLeft: '3px solid #c9a84c',
            }}>
              <span style={{ fontSize: 9, letterSpacing: '3px', textTransform: 'uppercase', color: '#c9a84c', fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif" }}>
                {mode === 'overall' ? 'Overall Points' : 'Match Points'}
              </span>
              <span style={{ fontSize: 9, letterSpacing: '2px', color: 'rgba(200,170,80,0.5)', fontWeight: 600, fontFamily: "'Barlow Condensed', sans-serif" }}>
                {teams.length} Teams
              </span>
            </div>

            {/* Gold header / drag handle */}
            <div
              className="grid items-center px-2 py-[7px] cursor-grab active:cursor-grabbing"
              style={{
                gridTemplateColumns: '42px 1fr 44px 54px',
                background: 'linear-gradient(90deg, #b8974a 0%, #e8c96a 40%, #c9a84c 100%)',
                clipPath: 'polygon(0 0, 100% 0, 100% 100%, 8px 100%)',
              }}
              onMouseDown={(e) => startDrag(e, 'leaderboard')}
            >
              {['RANK', 'TEAM', 'ELIMS', 'ALIVE'].map((h, i) => (
                <span key={h} className={i <= 1 ? 'text-left' : 'text-center'} style={{
                  fontSize: 9, fontWeight: 800, letterSpacing: '2.5px',
                  textTransform: 'uppercase', color: 'rgba(20,10,0,0.75)',
                  fontFamily: "'Barlow Condensed', sans-serif"
                }}>{h}</span>
              ))}
            </div>

            {/* Rows */}
            <div className="flex flex-col gap-[1px] mt-[1px]" style={{ maxHeight: leaderboardSize.height - 80, overflowY: 'auto' }}>
              {teamsWithPoints.map((team, index) => {
                const rank = index + 1
                const isElim = !team.players?.some(p => p.alive)
                const alivePlayers = team.players?.filter(p => p.alive).length ?? 0
                const totalPlayers = team.players?.length ?? 4
                return (
                  <div key={team.id} className="grid items-center relative overflow-hidden" style={{
                    gridTemplateColumns: '42px 1fr 44px 54px',
                    background: getRowBg(rank, isElim),
                    borderLeft: `3px solid ${getLeftBar(rank, isElim)}`,
                    padding: '6px 10px 6px 0',
                    opacity: isElim ? 0.65 : 1,
                  }}>
                    <div className="absolute top-0 right-0 left-[42px] h-px" style={{ background: 'rgba(255,255,255,0.04)' }}/>
                    <div className="absolute top-[20%] bottom-[20%]" style={{ left: 42, width: 1, background: 'rgba(255,255,255,0.07)' }}/>

                    {/* Rank */}
                    <div className="flex flex-col items-center justify-center gap-[1px] px-1">
                      <span style={{ fontSize: rank <= 3 ? 16 : 13, fontWeight: 800, color: getRankColor(rank), lineHeight: 1, fontFamily: "'Barlow Condensed', sans-serif" }}>{rank}</span>
                      <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: 1, color: getRankColor(rank), opacity: 0.7, lineHeight: 1, fontFamily: "'Barlow Condensed', sans-serif" }}>{SUPS[rank]}</span>
                    </div>

                    {/* Team name */}
                    <div className="px-2 flex items-center">
                      <p style={{
                        fontSize: 14, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase',
                        color: isElim ? 'rgba(240,236,224,0.35)' : '#f0ece0',
                        lineHeight: 1, fontFamily: "'Barlow Condensed', sans-serif",
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                      }}>{team.name}</p>
                    </div>

                    {/* Kills */}
                    <div className="text-center">
                      <span style={{ fontSize: 17, fontWeight: 800, color: getKillsColor(rank, isElim), lineHeight: 1, fontFamily: "'Barlow Condensed', sans-serif" }}>
                        {team.total_kills}
                      </span>
                    </div>

                    {/* Alive pips */}
                    <div className="flex items-center justify-center pr-1">
                      {isElim ? (
                        <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '2px', color: '#ff4444', border: '1px solid rgba(255,60,60,0.3)', padding: '1px 5px', background: 'rgba(255,0,0,0.07)', fontFamily: "'Barlow Condensed', sans-serif" }}>ELIM</span>
                      ) : (
                        <div className="flex items-center gap-[3px]">
                          {Array.from({ length: totalPlayers }, (_, i) => (
                            <div key={i} style={{
                              width: 6, height: 6, borderRadius: '50%',
                              background: i < alivePlayers
                                ? getRankColor(rank) === 'rgba(180,190,210,0.5)' ? '#e8c96a' : getRankColor(rank)
                                : 'rgba(255,255,255,0.1)'
                            }}/>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 px-3 py-1" style={{ background: 'linear-gradient(90deg, rgba(184,151,74,0.15), transparent)', borderTop: '1px solid rgba(184,151,74,0.2)' }}>
              <div className="w-[5px] h-[5px] rounded-full animate-pulse" style={{ background: '#f70707' }}/>
              <span style={{ fontSize: 8, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(241,49,49,0.96)', fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif" }}>
                Live — Match
              </span>
            </div>

            {/* Resize handle */}
            <div className="h-4 flex items-center justify-center cursor-se-resize" style={{ background: 'rgba(184,151,74,0.06)', borderTop: '1px solid rgba(184,151,74,0.15)' }}
              onMouseDown={(e) => { resizing.current = true; e.preventDefault() }}>
              <div className="w-6 h-[2px] rounded" style={{ background: 'rgba(200,168,76,0.25)' }}/>
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