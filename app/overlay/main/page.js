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

    // Fetch theme for this match
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

  // Theme shortcuts with fallbacks
  const lb = theme?.leaderboard_theme || {}
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

  // BOOYAH STATE
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

  return (
    <main
      className="min-h-screen bg-transparent overflow-hidden relative"
      onMouseMove={onMouseMove}
      onMouseUp={stopDrag}
      onMouseLeave={stopDrag}
    >
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
            <span
              className="font-black text-xs uppercase tracking-widest"
              style={{ color: lb.textPrimary || '#ffffff' }}
            >
              🏆 Leaderboard
            </span>
            <span
              className="text-[10px] uppercase"
              style={{ color: lb.textSecondary || '#6b7280' }}
            >
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
                    style={{ color: lb.textSecondary || '#6b7280' }}> Kill(s)</th>
                  <th className="px-2 py-1.5 text-[10px] uppercase font-bold"
                    style={{ color: lb.pointsColor || '#fbbf24' }}>PTS</th>
                </tr>
              </thead>
              <tbody>
                {teamsWithPoints.map((team, index) => (
                  <tr
                    key={team.id}
                    className="border-b"
                    style={{ borderColor: (lb.borderColor || '#10b981') + '20' }}
                  >
                    <td className="px-2 py-1.5 font-black"
                      style={{
                        color: lb.rankColor || '#fbbf24',
                        fontSize: `${lb.fontSize || 12}px`
                      }}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </td>
                    <td className="px-2 py-1.5">
                      <span
                        className="font-bold"
                        style={{
                          color: lb.textPrimary || '#ffffff',
                          fontSize: `${lb.fontSize || 12}px`
                        }}
                      >
                        {team.name}
                      </span>
                      <div className="flex gap-0.5 mt-1">
                        {team.players?.map(p => (
                          <div
                            key={p.id}
                            className="flex-1 rounded-sm"
                            style={{
                              height: `${lb.barHeight || 6}px`,
                              backgroundColor: p.alive
                                ? lb.barAlive || '#10b981'
                                : lb.barDead || '#374151'
                            }}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <span
                        className="font-bold"
                        style={{
                          color: lb.killsColor || '#60a5fa',
                          fontSize: `${lb.fontSize || 12}px`
                        }}
                      >
                        {team.total_kills}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <span
                        className="font-black"
                        style={{
                          color: lb.pointsColor || '#fbbf24',
                          fontSize: `${lb.fontSize || 12}px`
                        }}
                      >
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
            <div
              className="w-4 h-0.5 rounded"
              style={{ backgroundColor: lb.borderColor || '#10b981' }}
            />
          </div>
        </div>
      )}

      {/* FINAL 4 PANEL */}
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
    <Suspense fallback={<div className="min-h-screen bg-transparent"/>}>
      <MainOverlayContent />
    </Suspense>
  )
}