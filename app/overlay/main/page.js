'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useSearchParams } from 'next/navigation'

function MainOverlayContent() {
  const searchParams = useSearchParams()
  const matchId = searchParams.get('match')

  const [teams, setTeams] = useState([])
  const [overlayState, setOverlayState] = useState('leaderboard')
  const [winner, setWinner] = useState(null)
  const [settings, setSettings] = useState(null)
  const [matchPoints, setMatchPoints] = useState([])
  const booyahDeclared = useRef(false)
  const channelRef = useRef(null)
  const matchIdRef = useRef(matchId)

  const [leaderboardPos, setLeaderboardPos] = useState({ x: 20, y: 20 })
  const [leaderboardSize, setLeaderboardSize] = useState({ width: 420, height: 600 })
  const dragging = useRef(null)
  const dragOffset = useRef({ x: 0, y: 0 })

  // Keep matchIdRef always in sync so closures can read latest value
  useEffect(() => {
    matchIdRef.current = matchId
  }, [matchId])

  useEffect(() => {
    fetchAll()
    setupRealtime()

    const reconnect = setInterval(() => setupRealtime(), 25000)

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
      clearInterval(reconnect)
    }
  }, [matchId])

  // Extracted so both realtime handlers and fetchTeams can call it
  async function loadTeams() {
    let liveMatchId = matchIdRef.current
    if (!liveMatchId) {
      const { data: liveMatch } = await supabase
        .from('matches')
        .select('*')
        .eq('status', 'live')
        .limit(1)
        .single()
      if (!liveMatch) return
      liveMatchId = liveMatch.id
    }
    const { data } = await supabase
      .from('teams')
      .select('*, players(*)')
      .eq('match_id', liveMatchId)
      .order('id', { ascending: true })
    if (data) {
      setTeams(data)
      const aliveCount = data.filter(t => t.players?.some(p => p.alive)).length
      if (aliveCount <= 4 && aliveCount > 0) setOverlayState('final4')
      else setOverlayState('leaderboard')
    }
  }

  function setupRealtime() {
    if (channelRef.current) supabase.removeChannel(channelRef.current)

    channelRef.current = supabase
      .channel(`overlay-live-${Date.now()}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'teams'
      }, () => {
        loadTeams()
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'players'
      }, () => {
        loadTeams()
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'overlay_settings'
      }, () => fetchSettings())
      .subscribe((status) => {
        console.log('Realtime status:', status)
      })
  }

  async function fetchAll() {
    if (booyahDeclared.current) return
    await fetchSettings()
    await loadTeams()
    await fetchPoints()
  }

  async function fetchSettings() {
    if (!matchIdRef.current) return
    const { data } = await supabase
      .from('overlay_settings')
      .select('*')
      .eq('match_id', matchIdRef.current)
      .single()
    if (data) {
      setSettings(data)
      setLeaderboardPos({ x: data.leaderboard_x || 20, y: data.leaderboard_y || 20 })
      setLeaderboardSize({ width: data.leaderboard_width || 420, height: data.leaderboard_height || 600 })
    }
  }

  // kept for compatibility — now just calls loadTeams
  async function fetchTeams() {
    await loadTeams()
  }

  async function fetchPoints() {
    if (!matchIdRef.current) return
    const { data: mp } = await supabase
      .from('match_points')
      .select('*')
      .eq('match_id', matchIdRef.current)
    setMatchPoints(mp || [])
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

  // Derived state for UI
  const teamsWithPoints = teams.map(team => {
    const mp = matchPoints.find(p => p.team_id === team.id)
    return { ...team, matchTotal: mp?.total_points ?? 0 }
  }).sort((a, b) => b.matchTotal - a.matchTotal || b.total_kills - a.total_kills)

  const aliveTeams = teams
    .filter(t => t.players?.some(p => p.alive))
    .sort((a, b) => b.total_kills - a.total_kills)

  function startDrag(e) {
    dragging.current = 'leaderboard'
    dragOffset.current = { x: e.clientX - leaderboardPos.x, y: e.clientY - leaderboardPos.y }
  }
  function onMouseMove(e) {
    if (dragging.current === 'leaderboard') setLeaderboardPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y })
  }
  function stopDrag() { dragging.current = null }

  const getRankColor = (rank) => rank === 1 ? '#FFD700' : rank === 2 ? '#D4D4D4' : rank === 3 ? '#cd7f32' : 'rgba(180,190,210,0.5)'

  if (overlayState === 'booyah') {
    return <main className="min-h-screen bg-black flex items-center justify-center text-white"><h1>BOOYAH! {winner?.name}</h1></main>
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800;900&family=Rajdhani:wght@600;700&display=swap');
        html, body { background: transparent !important; margin: 0; padding: 0; overflow: hidden; }
      `}</style>

      <main className="min-h-screen bg-transparent relative" onMouseMove={onMouseMove} onMouseUp={stopDrag}>

        {/* ══ FINAL 4 — PRESERVED UI + WEIGHTED LOGIC ══ */}
        {overlayState === 'final4' && (
          <div style={{ position: 'absolute', top: 10, left: 200, right: 200, zIndex: 100 }}>
            <div style={{ display: 'flex', height: 56, gap: 12, background: 'transparent' }}>
              {aliveTeams.map((team) => {
                const alivePl = team.players?.filter(p => p.alive).length ?? 0
                const totalPl = team.players?.length ?? 4

                const teamStrength = Math.pow(alivePl, 2.5) + (team.total_kills * 0.1)
                const totalStrength = aliveTeams.reduce((acc, t) => {
                  const tAlive = t.players?.filter(p => p.alive).length ?? 0
                  return acc + (Math.pow(tAlive, 2.5) + (t.total_kills * 0.1))
                }, 0)

                const winPct = totalStrength > 0 ? ((teamStrength / totalStrength) * 100).toFixed(2) : '0.00'
                const themeColor = '#FFD700'

                return (
                  <div key={team.id} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', position: 'relative', background: 'rgba(8,4,4,0.88)', backdropFilter: 'blur(12px)', borderRadius: '4px', borderBottom: `2px solid ${themeColor}66` }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: themeColor, borderRadius: '4px 0 0 4px' }}/>
                    <div style={{ width: 28, height: 28, borderRadius: 4, background: `${themeColor}22`, border: `1px solid ${themeColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 10, fontWeight: 900, color: themeColor }}>{team.name?.slice(0, 2).toUpperCase()}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, fontWeight: 900, color: '#fff', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{team.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 900, color: 'rgb(255,255,255)', fontFamily: "'Barlow Condensed',sans-serif" }}>Kill(s): {team.total_kills}</span>
                        <div style={{ width: 1, height: 8, background: 'rgba(255,255,255,0.1)' }}/>
                        <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, fontWeight: 900, color: themeColor }}>Win: {winPct}%</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 28 }}>
                      {Array.from({ length: totalPl }, (_, i) => (
                        <div key={i} style={{ width: 6, height: 28, borderRadius: '2px', background: i < alivePl ? `linear-gradient(180deg,${themeColor} 0%,${themeColor}80 100%)` : 'rgba(255,255,255,0.1)' }}/>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ══ LEADERBOARD — PRESERVED UI ══ */}
        {overlayState === 'leaderboard' && (
          <div className="absolute" style={{ left: leaderboardPos.x, top: leaderboardPos.y, width: leaderboardSize.width, zIndex: 50 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'4px 12px', background:'linear-gradient(90deg,rgba(10,8,4,0.98),rgba(20,15,5,0.95))', borderLeft:'3px solid #c9a84c' }}>
              <span style={{ fontSize:9, letterSpacing:'3px', textTransform:'uppercase', color:'#c9a84c', fontWeight:700, fontFamily:"'Barlow Condensed',sans-serif" }}>Match Points</span>
            </div>
            <div className="grid items-center px-2 py-[7px]" style={{ gridTemplateColumns:'42px 1fr 44px 54px', background:'linear-gradient(90deg,#b8974a 0%,#e8c96a 40%,#c9a84c 100%)', cursor:'grab' }} onMouseDown={startDrag}>
              {['RANK','TEAM','ELIMS','ALIVE'].map((h) => (
                <span key={h} style={{ fontSize:9, fontWeight:800, color:'rgba(20,10,0,0.75)', fontFamily:"'Barlow Condensed',sans-serif" }}>{h}</span>
              ))}
            </div>
            <div className="flex flex-col gap-[1px] mt-[1px]">
              {teamsWithPoints.map((team, index) => {
                const rank = index + 1
                const alivePlayers = team.players?.filter(p => p.alive).length ?? 0
                const isElim = alivePlayers === 0
                return (
                  <div key={team.id} className="grid items-center" style={{ gridTemplateColumns:'42px 1fr 44px 54px', background: isElim ? 'rgba(20,5,5,0.9)' : 'rgba(12,9,4,0.96)', padding:'6px 0', borderLeft:`3px solid ${getRankColor(rank)}` }}>
                    <div className="text-center"><span style={{ color:getRankColor(rank), fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif" }}>{rank}</span></div>
                    <div className="px-2"><p style={{ fontSize:14, fontWeight:800, color:'#f0ece0', fontFamily:"'Barlow Condensed',sans-serif", textTransform:'uppercase' }}>{team.name}</p></div>
                    <div className="text-center"><span style={{ color:'#fff', fontWeight:800 }}>{team.total_kills}</span></div>
                    <div className="flex gap-1 justify-center">
                      {isElim ? (
                        <span style={{ color:'#ff4444', fontSize:8 }}>ELIM</span>
                      ) : (
                        Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} style={{ width:4, height:14, background: i < alivePlayers ? '#e8c96a' : 'rgba(255,255,255,0.1)' }}/>
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </>
  )
}

export default function MainOverlay() {
  return <Suspense fallback={<div />}><MainOverlayContent /></Suspense>
}