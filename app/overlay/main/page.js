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
  const [overallPoints, setOverallPoints] = useState([])
  const [theme, setTheme] = useState(null)
  const booyahDeclared = useRef(false)
  const overlayStateRef = useRef('leaderboard')
  const channelRef = useRef(null)

  const [leaderboardPos, setLeaderboardPos] = useState({ x: 20, y: 20 })
  const [leaderboardSize, setLeaderboardSize] = useState({ width: 420, height: 600 })
  const dragging = useRef(null)
  const resizing = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })

  useEffect(() => {
    fetchAll()
    setupRealtime()

    const reconnect = setInterval(() => setupRealtime(), 25000)
    const poll = setInterval(() => {
      if (!booyahDeclared.current) fetchAll()
    }, 4000)

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
      clearInterval(reconnect)
      clearInterval(poll)
    }
  }, [])

  function setupRealtime() {
    if (channelRef.current) supabase.removeChannel(channelRef.current)
    channelRef.current = supabase
      .channel(`overlay-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => fetchAll())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches' }, (payload) => {
        if (payload.new.status === 'finished') checkWinner(payload.new.id)
        else if (payload.new.status === 'live') {
          booyahDeclared.current = false
          setOverlayState('leaderboard')
          fetchAll()
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'overlay_settings' }, () => fetchSettings())
      .subscribe()
  }

  async function fetchAll() {
    if (booyahDeclared.current) return
    await fetchSettings()
    await fetchTeams()
    await fetchPoints()
  }

  async function fetchSettings() {
    if (!matchId) return
    const { data } = await supabase.from('overlay_settings').select('*').eq('match_id', matchId).single()
    if (data) {
      setSettings(data)
      setLeaderboardPos({ x: data.leaderboard_x || 20, y: data.leaderboard_y || 20 })
      setLeaderboardSize({ width: data.leaderboard_width || 420, height: data.leaderboard_height || 600 })
    }
  }

  async function fetchTeams() {
    let liveMatchId = matchId
    if (!liveMatchId) {
      const { data: liveMatch } = await supabase.from('matches').select('*').eq('status', 'live').limit(1).single()
      if (!liveMatch) return
      liveMatchId = liveMatch.id
    }
    const { data } = await supabase.from('teams').select('*, players(*)').eq('match_id', liveMatchId)
    if (data) {
      setTeams(data)
      const alive = data.filter(t => t.players?.some(p => p.alive))
      if (alive.length <= 4 && alive.length > 0) setOverlayState('final4')
      else setOverlayState('leaderboard')
    }
  }

  async function fetchPoints() {
    if (!matchId) return
    const { data: mp } = await supabase.from('match_points').select('*').eq('match_id', matchId)
    setMatchPoints(mp || [])
  }

  async function checkWinner(mId) {
    const { data } = await supabase.from('teams').select('*').eq('match_id', mId).eq('placement', 1).single()
    if (data) {
      booyahDeclared.current = true
      setWinner(data)
      setOverlayState('booyah')
    }
  }

  // Points and sorting logic
  const teamsWithPoints = teams.map(team => {
    const mp = matchPoints.find(p => p.team_id === team.id)
    return { ...team, matchTotal: mp?.total_points ?? 0 }
  }).sort((a, b) => b.matchTotal - a.matchTotal || b.total_kills - a.total_kills)

  const aliveTeams = teams.filter(t => t.players?.some(p => p.alive))
  const totalAlivePlayers = teams.reduce((sum, t) => sum + (t.players?.filter(p => p.alive).length ?? 0), 0)

  // Dragging logic
  function startDrag(e) {
    dragging.current = 'leaderboard'
    dragOffset.current = { x: e.clientX - leaderboardPos.x, y: e.clientY - leaderboardPos.y }
  }
  function onMouseMove(e) {
    if (dragging.current) setLeaderboardPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y })
  }
  function stopDrag() { dragging.current = null }

  // Styling Helpers
  const getRankColor = (rank) => rank === 1 ? '#FFD700' : rank === 2 ? '#D4D4D4' : rank === 3 ? '#cd7f32' : 'rgba(180,190,210,0.5)'
  const getRowBg = (rank, isElim) => isElim ? 'rgba(20,5,5,0.9)' : 'rgba(10,8,4,0.95)'
  const SUPS = ['', 'ST', 'ND', 'RD', 'TH', 'TH', 'TH', 'TH', 'TH', 'TH']

  if (overlayState === 'booyah') return <main className="flex items-center justify-center min-h-screen text-white"><h1>BOOYAH! {winner?.name}</h1></main>

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&display=swap');
        html, body { background: transparent !important; overflow: hidden; margin: 0; }
      `}</style>

      <main className="relative min-h-screen bg-transparent" onMouseMove={onMouseMove} onMouseUp={stopDrag}>
        
        {/* ══ FINAL 4 UI ══ */}
        {overlayState === 'final4' && (
          <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 15, zIndex: 100 }}>
            {aliveTeams.map((team) => {
              const aliveCount = team.players?.filter(p => p.alive).length || 0
              const themeColor = '#FFD700'
              const winPct = totalAlivePlayers > 0 ? ((aliveCount / totalAlivePlayers) * 100).toFixed(1) : "0.0"
              
              return (
                <div key={team.id} style={{ background: 'rgba(0,0,0,0.85)', padding: '10px 20px', borderRadius: '4px', borderLeft: `4px solid ${themeColor}`, backdropFilter: 'blur(10px)', minWidth: '200px' }}>
                  <div style={{ color: '#fff', fontWeight: 900, fontFamily: 'Barlow Condensed' }}>{team.name}</div>
                  <div style={{ color: themeColor, fontSize: '12px' }}>WIN: {winPct}% | KILLS: {team.total_kills}</div>
                  <div style={{ display: 'flex', gap: 3, marginTop: 5 }}>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} style={{ width: 6, height: 15, background: i < aliveCount ? themeColor : 'rgba(255,255,255,0.1)' }} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ══ LEADERBOARD UI ══ */}
        {overlayState === 'leaderboard' && (
          <div style={{ position: 'absolute', left: leaderboardPos.x, top: leaderboardPos.y, width: leaderboardSize.width, zIndex: 50 }}>
            <div onMouseDown={startDrag} style={{ background: '#e8c96a', padding: '8px', cursor: 'grab', fontWeight: 900, color: '#000', textAlign: 'center', fontFamily: 'Barlow Condensed' }}>
              MATCH LEADERBOARD
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              {teamsWithPoints.map((team, index) => {
                const rank = index + 1
                const isElim = !team.players?.some(p => p.alive)
                const aliveCount = team.players?.filter(p => p.alive).length || 0

                return (
                  <div key={team.id} style={{ background: getRowBg(rank, isElim), display: 'grid', gridTemplateColumns: '40px 1fr 50px 60px', padding: '8px', alignItems: 'center', opacity: isElim ? 0.6 : 1 }}>
                    <span style={{ color: getRankColor(rank), fontWeight: 900 }}>{rank}</span>
                    <span style={{ color: '#fff', textTransform: 'uppercase', fontWeight: 700 }}>{team.name}</span>
                    <span style={{ color: '#fff', textAlign: 'center' }}>{team.total_kills}</span>
                    <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                      {isElim ? <span style={{ color: '#ff4444', fontSize: '10px' }}>ELIM</span> : 
                        Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} style={{ width: 4, height: 10, background: i < aliveCount ? '#e8c96a' : 'rgba(255,255,255,0.1)' }} />
                        ))
                      }
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
  return (
    <Suspense fallback={<div />}>
      <MainOverlayContent />
    </Suspense>
  )
}