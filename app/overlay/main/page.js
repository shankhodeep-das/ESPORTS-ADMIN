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

  const [leaderboardPos, setLeaderboardPos] = useState({ x: 20, y: 20 })
  const [leaderboardSize, setLeaderboardSize] = useState({ width: 420, height: 600 })
  const dragging = useRef(null)
  const dragOffset = useRef({ x: 0, y: 0 })

  useEffect(() => {
    // Initial fetch
    fetchAll()
    setupRealtime()

    // Reconnect logic
    const reconnect = setInterval(() => setupRealtime(), 25000)

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
      clearInterval(reconnect)
      // Note: Polling interval is COMPLETELY removed to prevent "jumps"
    }
  }, [matchId])

  function setupRealtime() {
    if (channelRef.current) supabase.removeChannel(channelRef.current)
    
    channelRef.current = supabase
      .channel(`overlay-live-${Date.now()}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'teams' 
      }, (payload) => {
        // ══ ABSOLUTE UPDATE LOGIC ══
        setTeams(currentTeams => {
          return currentTeams.map(team => {
            if (team.id === payload.new.id) {
              // CRITICAL: We preserve the 'players' array because the 
              // payload update doesn't include nested relations!
              return { 
                ...team, 
                ...payload.new, 
                players: team.players // Keep the players we already have
              };
            }
            return team;
          });
        });
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'players' 
      }, (payload) => {
        // Update specific player status instantly
        setTeams(prev => prev.map(t => ({
          ...t,
          players: t.players?.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p)
        })));
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

    // ══ CACHE BUSTING ══
    // Fetching from server directly using .order() and no-cache logic
    const { data } = await supabase
      .from('teams')
      .select('*, players(*)')
      .eq('match_id', liveMatchId)
      .order('id', { ascending: true });

    if (data) {
      setTeams(data)
      const aliveCount = data.filter(t => t.players?.some(p => p.alive)).length
      if (aliveCount <= 4 && aliveCount > 0) setOverlayState('final4')
      else setOverlayState('leaderboard')
    }
  }

  async function fetchPoints() {
    if (!matchId) return
    const { data: mp } = await supabase.from('match_points').select('*').eq('match_id', matchId)
    setMatchPoints(mp || [])
  }

  // --- UI Logic ---
  const teamsWithPoints = teams.map(team => {
    const mp = matchPoints.find(p => p.team_id === team.id)
    return { ...team, matchTotal: mp?.total_points ?? 0 }
  }).sort((a, b) => b.matchTotal - a.matchTotal || b.total_kills - a.total_kills)

  const aliveTeams = teams.filter(t => t.players?.some(p => p.alive)).sort((a, b) => b.total_kills - a.total_kills)

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

      <main className="min-h-screen bg-transparent relative" onMouseMove={(e) => {
        if (dragging.current === 'leaderboard') setLeaderboardPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y })
      }} onMouseUp={() => { dragging.current = null }}>

        {/* ══ FINAL 4 ══ */}
        {overlayState === 'final4' && (
          <div style={{ position: 'absolute', top: 10, left: 200, right: 200, zIndex: 100 }}>
            <div style={{ display: 'flex', height: 56, gap: 12, background: 'transparent' }}>
              {aliveTeams.map((team) => {
                const alivePl = team.players?.filter(p => p.alive).length ?? 0
                const teamStrength = Math.pow(alivePl, 2.5) + (team.total_kills * 0.1);
                const totalStrength = aliveTeams.reduce((acc, t) => acc + (Math.pow(t.players?.filter(p => p.alive).length ?? 0, 2.5) + (t.total_kills * 0.1)), 0);
                const winPct = totalStrength > 0 ? ((teamStrength / totalStrength) * 100).toFixed(0) : "0";

                return (
                  <div key={team.id} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', position: 'relative', background: 'rgba(8,4,4,0.88)', backdropFilter: 'blur(12px)', borderRadius: '4px', borderBottom: `2px solid #FFD70066` }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, fontWeight: 900, color: '#fff', textTransform: 'uppercase' }}>{team.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 900, color: '#fff', fontFamily: "'Barlow Condensed',sans-serif" }}>Kill(s): {team.total_kills}</span>
                        <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, fontWeight: 900, color: '#FFD700' }}>Win: {winPct}%</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ══ LEADERBOARD ══ */}
        {overlayState === 'leaderboard' && (
          <div className="absolute" style={{ left: leaderboardPos.x, top: leaderboardPos.y, width: leaderboardSize.width, zIndex: 50 }}>
             <div className="grid px-2 py-[7px]" style={{ gridTemplateColumns:'42px 1fr 44px 54px', background:'linear-gradient(90deg,#b8974a 0%,#e8c96a 40%,#c9a84c 100%)', cursor:'grab' }} onMouseDown={(e) => {
               dragging.current = 'leaderboard'
               dragOffset.current = { x: e.clientX - leaderboardPos.x, y: e.clientY - leaderboardPos.y }
             }}>
               {['RANK','TEAM','ELIMS','ALIVE'].map((h) => <span key={h} style={{ fontSize:9, fontWeight:800, color:'rgba(20,10,0,0.75)', fontFamily:"'Barlow Condensed',sans-serif" }}>{h}</span>)}
             </div>
             <div className="flex flex-col gap-[1px] mt-[1px]">
               {teamsWithPoints.map((team, index) => (
                 <div key={team.id} className="grid items-center" style={{ gridTemplateColumns:'42px 1fr 44px 54px', background: 'rgba(12,9,4,0.96)', padding:'6px 0', borderLeft:`3px solid ${getRankColor(index + 1)}` }}>
                   <div className="text-center" style={{ color:getRankColor(index+1), fontWeight:800 }}>{index+1}</div>
                   <div className="px-2" style={{ fontSize:14, fontWeight:800, color:'#f0ece0', textTransform:'uppercase' }}>{team.name}</div>
                   <div className="text-center" style={{ color:'#fff', fontWeight:800 }}>{team.total_kills}</div>
                   <div className="flex gap-1 justify-center">
                      {(team.players?.filter(p => p.alive).length ?? 0) === 0 ? <span style={{color:'#ff4444', fontSize:8}}>ELIM</span> : 
                        Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} style={{ width: 4, height: 14, background: i < (team.players?.filter(p => p.alive).length ?? 0) ? '#e8c96a' : 'rgba(255,255,255,0.1)' }} />
                        ))
                      }
                   </div>
                 </div>
               ))}
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