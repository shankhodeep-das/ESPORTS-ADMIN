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
  const [currentMatch, setCurrentMatch] = useState(null)
  const [theme, setTheme] = useState(null)
  const booyahDeclared = useRef(false)

  const [leaderboardPos, setLeaderboardPos] = useState({ x: 20, y: 20 })
  const [leaderboardSize, setLeaderboardSize] = useState({ width: 420, height: 600 })
  const [final4Pos, setFinal4Pos] = useState({ x: 600, y: 150 })

  const dragging = useRef(null)
  const resizing = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })

  useEffect(() => {
    fetchAll()

    const channel = supabase
      .channel('main-overlay-v3')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'themes' }, () => {
        if (matchId) fetchTheme(matchId)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches' }, (payload) => {
        if (payload.new.status === 'finished') checkWinner(payload.new.id)
        else if (payload.new.status === 'live') { booyahDeclared.current = false; fetchAll() }
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
      setFinal4Pos({ x: data.final4_x || 600, y: data.final4_y || 150 })
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
      setCurrentMatch(liveMatch)
    } else {
      const { data: m } = await supabase
        .from('matches')
        .select('*')
        .eq('id', liveMatchId)
        .single()
      setCurrentMatch(m)
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
      setOverlayState('final4')
    } else {
      setOverlayState('leaderboard')
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

  const f4 = theme?.final4_theme || {}
  const by = theme?.booyah_theme || {}

  function startDrag(e, type) {
    dragging.current = type
    dragOffset.current = {
      x: e.clientX - (type === 'leaderboard' ? leaderboardPos.x : final4Pos.x),
      y: e.clientY - (type === 'leaderboard' ? leaderboardPos.y : final4Pos.y)
    }
    e.preventDefault()
  }

  function onMouseMove(e) {
    if (dragging.current === 'leaderboard') {
      setLeaderboardPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y })
    } else if (dragging.current === 'final4') {
      setFinal4Pos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y })
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
    if (intensity === 'high') return '40px'
    return '0px'
  }

  // ─── BOOYAH SCREEN ───────────────────────────────────────────────────────────
  if (overlayState === 'booyah') {
    return (
      <main
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: by.bg || '#000000' }}
      >
        <div className="text-center">
          <p
            className="font-bold text-xl tracking-widest uppercase mb-4"
            style={{ color: by.killsColor || '#9ca3af' }}
          >
            Winner Winner
          </p>
          <h1
            className="text-8xl font-black mb-6"
            style={{
              color: by.booyahColor || '#10b981',
              textShadow: `0 0 ${glowSize(by.glowIntensity)} ${by.glowColor || '#10b981'}`
            }}
          >
            BOOYAH!
          </h1>
          <h2
            className="text-5xl font-black mb-4"
            style={{ color: by.winnerColor || '#ffffff' }}
          >
            {winner?.name}
          </h2>
          <p
            className="text-2xl"
            style={{ color: by.killsColor || '#9ca3af' }}
          >
            🎯 {winner?.total_kills} Kills
          </p>
        </div>
      </main>
    )
  }

  // ─── RANK HELPERS ─────────────────────────────────────────────────────────────
  const SUPS = ['', 'ST', 'ND', 'RD', 'TH', 'TH', 'TH', 'TH', 'TH', 'TH', 'TH', 'TH', 'TH']

  function getRankColor(rank) {
    if (rank === 1) return '#FFD700'
    if (rank === 2) return '#D4D4D4'
    if (rank === 3) return '#cd7f32'
    return 'rgba(180,190,210,0.5)'
  }

  function getBarAlive(rank) {
    if (rank === 1) return '#FFD700'
    if (rank === 2) return '#C0C0C0'
    if (rank === 3) return '#E8A060'
    return '#e8c96a'
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

  // ─── MAIN RETURN ──────────────────────────────────────────────────────────────
  return (
    <main
      className="min-h-screen bg-transparent overflow-hidden relative"
      onMouseMove={onMouseMove}
      onMouseUp={stopDrag}
      onMouseLeave={stopDrag}
    >

      {/* ═══════════════════════════════════════════════════════
          LEADERBOARD PANEL — CINEMATIC GOLD STYLE
      ═══════════════════════════════════════════════════════ */}
      {showLeaderboard && overlayState === 'leaderboard' && (
        <div
          className="absolute select-none"
          style={{
            left: leaderboardPos.x,
            top: leaderboardPos.y,
            width: leaderboardSize.width,
          }}
        >

          {/* Match label bar */}
          <div
            className="flex items-center justify-between px-3 py-1"
            style={{
              background: 'linear-gradient(90deg, rgba(10,8,4,0.98), rgba(20,15,5,0.95))',
              borderLeft: '3px solid #c9a84c',
            }}
          >
            <span style={{
              fontSize: 9, letterSpacing: '3px', textTransform: 'uppercase',
              color: '#c9a84c', fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif"
            }}>
              {mode === 'overall' ? 'Overall Points' : 'Match Points'}
            </span>
            <span style={{
              fontSize: 9, letterSpacing: '2px',
              color: 'rgba(200,170,80,0.5)', fontWeight: 600,
              fontFamily: "'Barlow Condensed', sans-serif"
            }}>
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
              <span
                key={h}
                className={i <= 1 ? 'text-left' : 'text-center'}
                style={{
                  fontSize: 9, fontWeight: 800, letterSpacing: '2.5px',
                  textTransform: 'uppercase', color: 'rgba(20,10,0,0.75)',
                  fontFamily: "'Barlow Condensed', sans-serif"
                }}
              >
                {h}
              </span>
            ))}
          </div>

          {/* Team rows */}
          <div
            className="flex flex-col gap-[1px] mt-[1px]"
            style={{
              maxHeight: leaderboardSize.height - 80,
              overflowY: 'auto',
            }}
          >
            {teamsWithPoints.map((team, index) => {
              const rank = index + 1
              const isElim = !team.players?.some(p => p.alive)
              const alivePlayers = team.players?.filter(p => p.alive).length ?? 0
              const totalPlayers = team.players?.length ?? 4

              return (
                <div
                  key={team.id}
                  className="grid items-center relative overflow-hidden"
                  style={{
                    gridTemplateColumns: '42px 1fr 44px 54px',
                    background: getRowBg(rank, isElim),
                    borderLeft: `3px solid ${getLeftBar(rank, isElim)}`,
                    padding: '6px 10px 6px 0',
                    opacity: isElim ? 0.65 : 1,
                  }}
                >
                  {/* Top shine line */}
                  <div
                    className="absolute top-0 right-0 left-[42px] h-px"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  />

                  {/* Rank / team separator */}
                  <div
                    className="absolute top-[20%] bottom-[20%]"
                    style={{ left: 42, width: 1, background: 'rgba(255,255,255,0.07)' }}
                  />

                  {/* Rank number */}
                  <div className="flex flex-col items-center justify-center gap-[1px] px-1">
                    <span style={{
                      fontSize: rank <= 3 ? 16 : 13,
                      fontWeight: 800,
                      color: getRankColor(rank),
                      lineHeight: 1,
                      fontFamily: "'Barlow Condensed', sans-serif"
                    }}>
                      {rank}
                    </span>
                    <span style={{
                      fontSize: 7, fontWeight: 700, letterSpacing: 1,
                      color: getRankColor(rank), opacity: 0.7, lineHeight: 1,
                      fontFamily: "'Barlow Condensed', sans-serif"
                    }}>
                      {SUPS[rank]}
                    </span>
                  </div>

                  {/* Team name + health bars */}
                  <div className="px-2">
                    <p style={{
                      fontSize: 14, fontWeight: 800, letterSpacing: '1.5px',
                      textTransform: 'uppercase',
                      color: isElim ? 'rgba(240,236,224,0.35)' : '#f0ece0',
                      lineHeight: 1, marginBottom: 4,
                      fontFamily: "'Barlow Condensed', sans-serif",
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>
                      {team.name}
                    </p>
                    <div className="flex gap-[2px]">
                      {team.players?.map((p, i) => (
                        <div
                          key={i}
                          style={{
                            flex: 1, height: 3, borderRadius: 1,
                            background: p.alive ? getBarAlive(rank) : 'rgba(255,255,255,0.08)'
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Kill count */}
                  <div className="text-center">
                    <span style={{
                      fontSize: 17, fontWeight: 800,
                      color: getKillsColor(rank, isElim),
                      lineHeight: 1,
                      fontFamily: "'Barlow Condensed', sans-serif"
                    }}>
                      {team.total_kills}
                    </span>
                  </div>

                  {/* Alive pips */}
                  <div className="flex items-center justify-center pr-1">
                    {isElim ? (
                      <span style={{
                        fontSize: 8, fontWeight: 800, letterSpacing: '2px',
                        color: '#ff4444',
                        border: '1px solid rgba(255,60,60,0.3)',
                        padding: '1px 5px',
                        background: 'rgba(255,0,0,0.07)',
                        fontFamily: "'Barlow Condensed', sans-serif"
                      }}>
                        ELIM
                      </span>
                    ) : (
                      <div className="flex items-center gap-[3px]">
                        {Array.from({ length: totalPlayers }, (_, i) => (
                          <div
                            key={i}
                            style={{
                              width: 6, height: 6, borderRadius: '50%',
                              background: i < alivePlayers
                                ? getRankColor(rank) === 'rgba(180,190,210,0.5)' ? '#e8c96a' : getRankColor(rank)
                                : 'rgba(255,255,255,0.1)'
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer live label */}
          <div
            className="flex items-center gap-2 px-3 py-1"
            style={{
              background: 'linear-gradient(90deg, rgba(184,151,74,0.15), transparent)',
              borderTop: '1px solid rgba(184,151,74,0.2)',
            }}
          >
            <div
              className="w-[5px] h-[5px] rounded-full animate-pulse"
              style={{ background: '#f70707' }}
            />
            <span style={{
              fontSize: 8, letterSpacing: '2px', textTransform: 'uppercase',
              color: 'rgba(241, 49, 49, 0.96)', fontWeight: 700,
              fontFamily: "'Barlow Condensed', sans-serif"
            }}>
              Live — {currentMatch?.name || 'Match'}
            </span>
          </div>

          {/* Resize handle */}
          <div
            className="h-4 flex items-center justify-center cursor-se-resize"
            style={{
              background: 'rgba(184,151,74,0.06)',
              borderTop: '1px solid rgba(184,151,74,0.15)'
            }}
            onMouseDown={(e) => { resizing.current = true; e.preventDefault() }}
          >
            <div
              className="w-6 h-[2px] rounded"
              style={{ background: 'rgba(200,168,76,0.25)' }}
            />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          FINAL 4 PANEL — unchanged from your original
      ═══════════════════════════════════════════════════════ */}
      {showFinal4 && overlayState === 'final4' && (
        <div
          className="absolute select-none"
          style={{ left: final4Pos.x, top: final4Pos.y }}
        >
          <div
            className="rounded-t-xl px-4 py-2 cursor-grab active:cursor-grabbing flex items-center gap-2"
            style={{
              backgroundColor: f4.cardBg || '#1a1a00',
              border: `1px solid ${f4.borderColor || '#fbbf24'}`,
              boxShadow: f4.glowIntensity && f4.glowIntensity !== 'none'
                ? `0 0 ${glowSize(f4.glowIntensity)} ${f4.borderColor || '#fbbf24'}50`
                : 'none'
            }}
            onMouseDown={(e) => startDrag(e, 'final4')}
          >
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: f4.highlightColor || '#fbbf24' }}
            />
            <span
              className="text-sm font-black uppercase tracking-widest"
              style={{ color: f4.highlightColor || '#fbbf24' }}
            >
              ⚡ Final {aliveTeams.length} Teams
            </span>
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: f4.highlightColor || '#fbbf24' }}
            />
          </div>

          <div
            className="border-x border-b rounded-b-xl p-3 flex flex-col gap-2 min-w-64"
            style={{
              backgroundColor: f4.bg || '#000000',
              borderColor: (f4.borderColor || '#fbbf24') + '50'
            }}
          >
            {aliveTeams.map((team, index) => (
              <div
                key={team.id}
                className="rounded-lg px-3 py-2"
                style={{
                  backgroundColor: f4.cardBg || '#1a1a00',
                  border: `1px solid ${(f4.borderColor || '#fbbf24')}40`
                }}
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-black text-sm"
                      style={{ color: f4.highlightColor || '#fbbf24' }}
                    >
                      #{index + 1}
                    </span>
                    <span
                      className="font-bold text-sm"
                      style={{ color: f4.textColor || '#ffffff' }}
                    >
                      {team.name}
                    </span>
                  </div>
                  <span
                    className="text-xs font-bold"
                    style={{ color: f4.highlightColor || '#fbbf24' }}
                  >
                    {team.total_kills} Kill(s)
                  </span>
                </div>
                <div className="flex gap-1">
                  {team.players?.map(p => (
                    <div
                      key={p.id}
                      className="flex-1 rounded-sm h-2"
                      style={{
                        backgroundColor: p.alive
                          ? f4.barColor || '#fbbf24'
                          : '#374151'
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </main>
  )
}

export default function MainOverlay() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-transparent" />}>
      <MainOverlayContent />
    </Suspense>
  )
}