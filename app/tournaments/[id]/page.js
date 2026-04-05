'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function TournamentPage() {
  const { id } = useParams()
  const router = useRouter()
  const [tournament, setTournament] = useState(null)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [creatingMatch, setCreatingMatch] = useState(false)
  const [time, setTime] = useState('')

  useEffect(() => {
    fetchTournament()
    fetchMatches()
    const timer = setInterval(() => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  async function fetchTournament() {
    const { data } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .single()
    setTournament(data)
  }

  async function fetchMatches() {
    const { data } = await supabase
      .from('matches')
      .select('*, teams(*)')
      .eq('tournament_id', id)
      .order('match_number')
    setMatches(data || [])
    setLoading(false)
  }

  async function createMatch() {
    if (creatingMatch) return
    setCreatingMatch(true)

    const matchNumber = matches.length + 1
    const totalMatches = tournament?.total_matches || 4

    if (matchNumber > totalMatches) {
      alert('All matches have been created for this tournament!')
      setCreatingMatch(false)
      return
    }

    const { error } = await supabase
      .from('matches')
      .insert([{
        title: tournament?.name,
        game: tournament?.game,
        map: '',
        round: `Match ${matchNumber}`,
        status: 'waiting',
        tournament_id: id,
        match_number: matchNumber
      }])

    if (error) {
      alert('Error: ' + error.message)
      setCreatingMatch(false)
      return
    }

    await fetchMatches()
    setCreatingMatch(false)
  }

  async function deleteMatch(matchId) {
    if (!confirm('Delete this match?')) return
    await supabase.from('matches').delete().eq('id', matchId)
    fetchMatches()
  }

  const totalMatches = tournament?.total_matches || 4
  const completedMatches = matches.filter(m => m.status === 'finished').length
  const liveMatch = matches.find(m => m.status === 'live')
  const progressPercent = Math.round((completedMatches / totalMatches) * 100)
  const canCreateMore = matches.length < totalMatches
  const tournamentComplete = completedMatches === totalMatches

  function getMatchStatusStyle(status) {
    if (status === 'live') return { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.4)', color: '#ef4444' }
    if (status === 'finished') return { bg: 'rgba(100,100,100,0.1)', border: 'rgba(100,100,100,0.3)', color: '#666' }
    return { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)', color: '#fbbf24' }
  }

  if (loading) return (
    <main style={{ minHeight: '100vh', background: '#050a0e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'monospace', color: '#00ffa9', letterSpacing: '4px', fontSize: '13px' }}>
        LOADING OPERATION...
      </div>
    </main>
  )

  return (
    <main style={{
      minHeight: '100vh',
      background: '#050a0e',
      backgroundImage: 'linear-gradient(rgba(0,255,170,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,170,0.02) 1px, transparent 1px)',
      backgroundSize: '32px 32px',
      fontFamily: "'Rajdhani', 'Arial', sans-serif",
      color: '#e2e8f0'
    }}>

      {/* TOP NAV */}
      <nav style={{
        background: '#080d12',
        borderBottom: '1px solid #1e2d3d',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '52px',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '6px', height: '6px',
              background: '#00ffa9',
              borderRadius: '50%',
              animation: 'pulse 2s infinite'
            }}/>
            <span style={{ color: '#00ffa9', fontWeight: 700, fontSize: '15px', letterSpacing: '3px' }}>
              NEXUS
            </span>
          </div>
          <div style={{ height: '20px', width: '1px', background: '#1e2d3d' }}/>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[
              { label: 'OPS', href: '/dashboard' },
              { label: 'TOURNAMENTS', href: '/tournaments', active: true },
              { label: 'THEMES', href: '/themes' },
            ].map(item => (
              <Link key={item.label} href={item.href}>
                <span style={{
                  color: item.active ? '#00ffa9' : '#4a5568',
                  fontSize: '12px',
                  letterSpacing: '2px',
                  padding: '6px 12px',
                  fontWeight: item.active ? 700 : 600,
                  borderBottom: item.active ? '2px solid #00ffa9' : 'none',
                  background: item.active ? 'rgba(0,255,169,0.05)' : 'transparent',
                  borderRadius: '2px',
                  cursor: 'pointer'
                }}>
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: '#00ffa9', fontFamily: 'monospace', fontSize: '13px', letterSpacing: '2px' }}>
            {time}
          </span>
        </div>
      </nav>

      <div style={{ padding: '24px' }}>

        {/* BREADCRUMB */}
        <div style={{ marginBottom: '16px' }}>
          <Link href="/tournaments">
            <span style={{ color: '#4a5568', fontSize: '11px', letterSpacing: '2px', cursor: 'pointer', fontFamily: 'monospace' }}>
              ← TOURNAMENTS
            </span>
          </Link>
          <span style={{ color: '#1e2d3d', margin: '0 8px', fontFamily: 'monospace', fontSize: '11px' }}>/</span>
          <span style={{ color: '#00ffa9', fontSize: '11px', letterSpacing: '2px', fontFamily: 'monospace' }}>
            {tournament?.name?.toUpperCase()}
          </span>
        </div>

        {/* PAGE HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div style={{ color: '#00ffa9', opacity: 0.6, fontSize: '11px', letterSpacing: '2px', fontFamily: 'monospace', marginBottom: '4px' }}>
              // TOURNAMENT OPERATION
            </div>
            <h1 style={{ color: '#e2e8f0', fontSize: '28px', fontWeight: 700, letterSpacing: '3px', margin: 0 }}>
              {tournament?.name?.toUpperCase()}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px' }}>
              <span style={{ color: '#4a5568', fontSize: '12px', letterSpacing: '2px', fontFamily: 'monospace' }}>
                {tournament?.game?.toUpperCase()}
              </span>
              <span style={{ color: '#1e2d3d' }}>|</span>
              <span style={{ color: '#4a5568', fontSize: '12px', letterSpacing: '2px', fontFamily: 'monospace' }}>
                {totalMatches} MATCHES TOTAL
              </span>
              {liveMatch && (
                <>
                  <span style={{ color: '#1e2d3d' }}>|</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '6px', height: '6px', background: '#ef4444', borderRadius: '50%', animation: 'pulse 1s infinite' }}/>
                    <span style={{ color: '#ef4444', fontSize: '11px', letterSpacing: '2px', fontFamily: 'monospace', fontWeight: 700 }}>
                      MATCH {liveMatch.match_number} LIVE
                    </span>
                  </div>
                </>
              )}
              {tournamentComplete && (
                <>
                  <span style={{ color: '#1e2d3d' }}>|</span>
                  <span style={{ color: '#00ffa9', fontSize: '11px', letterSpacing: '2px', fontFamily: 'monospace', fontWeight: 700 }}>
                    ✓ TOURNAMENT COMPLETE
                  </span>
                </>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {matches.length > 0 && (
              <Link href={`/tournaments/${id}/leaderboard`}>
                <button style={{
                  background: 'rgba(251,191,36,0.1)',
                  border: '1px solid rgba(251,191,36,0.3)',
                  color: '#fbbf24',
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 700,
                  fontSize: '12px',
                  letterSpacing: '2px',
                  padding: '10px 20px',
                  cursor: 'pointer',
                  borderRadius: '2px',
                }}>
                  OVERALL LB
                </button>
              </Link>
            )}
            {canCreateMore && (
              <button
                onClick={createMatch}
                disabled={creatingMatch}
                style={{
                  background: '#00ffa9',
                  border: 'none',
                  color: '#050a0e',
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 700,
                  fontSize: '13px',
                  letterSpacing: '2px',
                  padding: '10px 24px',
                  cursor: 'pointer',
                  borderRadius: '2px',
                  opacity: creatingMatch ? 0.5 : 1
                }}
              >
                {creatingMatch ? 'CREATING...' : `+ MATCH ${matches.length + 1}`}
              </button>
            )}
          </div>
        </div>

        {/* PROGRESS SECTION */}
        <div style={{
          background: '#0d1117',
          border: '1px solid #1e2d3d',
          borderRadius: '4px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: '#4a5568', fontSize: '11px', letterSpacing: '2px', fontFamily: 'monospace' }}>
              OPERATION PROGRESS
            </span>
            <span style={{ color: '#00ffa9', fontSize: '20px', fontWeight: 700, fontFamily: 'monospace', letterSpacing: '2px' }}>
              {completedMatches}<span style={{ color: '#4a5568', fontSize: '13px' }}>/{totalMatches}</span>
            </span>
          </div>

          {/* Progress Bar */}
          <div style={{ height: '4px', background: '#1e2d3d', borderRadius: '0', marginBottom: '12px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${progressPercent}%`,
              background: tournamentComplete ? '#00ffa9' : '#00ffa9',
              transition: 'width 0.5s ease'
            }}/>
          </div>

          {/* Match Dots */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {Array.from({ length: totalMatches }).map((_, i) => {
              const match = matches[i]
              let bg = '#1e2d3d'
              let label = `M${i + 1}`
              if (match?.status === 'finished') bg = '#00ffa9'
              else if (match?.status === 'live') bg = '#ef4444'
              else if (match?.status === 'waiting') bg = '#fbbf24'

              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    background: bg,
                    borderRadius: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: bg === '#1e2d3d' ? '#4a5568' : '#050a0e',
                    fontFamily: 'monospace',
                    letterSpacing: '1px',
                    animation: match?.status === 'live' ? 'pulse 1s infinite' : 'none'
                  }}>
                    {match?.status === 'finished' ? '✓' : label}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
            {[
              { color: '#00ffa9', label: 'FINISHED' },
              { color: '#ef4444', label: 'LIVE' },
              { color: '#fbbf24', label: 'WAITING' },
              { color: '#1e2d3d', label: 'PENDING' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', background: item.color, borderRadius: '1px' }}/>
                <span style={{ color: '#4a5568', fontSize: '10px', letterSpacing: '1px', fontFamily: 'monospace' }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* MATCHES LIST */}
        {matches.length === 0 ? (
          <div style={{
            background: '#0d1117',
            border: '1px dashed #1e2d3d',
            borderRadius: '4px',
            padding: '40px',
            textAlign: 'center'
          }}>
            <div style={{ color: '#4a5568', fontSize: '12px', letterSpacing: '3px', fontFamily: 'monospace' }}>
              NO MATCHES INITIALIZED
            </div>
            <div style={{ color: '#2d3748', fontSize: '11px', letterSpacing: '2px', fontFamily: 'monospace', marginTop: '8px' }}>
              CLICK + MATCH 1 TO BEGIN OPERATION
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ color: '#4a5568', fontSize: '11px', letterSpacing: '2px', fontFamily: 'monospace' }}>
                MATCH REGISTRY
              </span>
              <div style={{ flex: 1, height: '1px', background: '#1e2d3d' }}/>
            </div>

            {matches.map((match) => {
              const statusStyle = getMatchStatusStyle(match.status)
              const aliveTeams = match.teams?.filter(t => t.total_kills >= 0).length || 0

              return (
                <div
                  key={match.id}
                  style={{
                    background: '#0d1117',
                    border: match.status === 'live'
                      ? '1px solid rgba(239,68,68,0.4)'
                      : match.status === 'finished'
                      ? '1px solid rgba(0,255,169,0.2)'
                      : '1px solid #1e2d3d',
                    borderRadius: '4px',
                    padding: '0',
                    overflow: 'hidden',
                    transition: 'border-color 0.2s',
                    opacity: match.status === 'finished' ? 0.7 : 1
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px' }}>

                    {/* Left accent */}
                    <div style={{
                      width: '3px',
                      height: '48px',
                      background: match.status === 'live' ? '#ef4444' :
                                  match.status === 'finished' ? '#00ffa9' :
                                  '#fbbf24',
                      borderRadius: '0',
                      flexShrink: 0,
                      animation: match.status === 'live' ? 'pulse 1s infinite' : 'none'
                    }}/>

                    {/* Match Number */}
                    <div style={{ textAlign: 'center', minWidth: '48px' }}>
                      <div style={{ color: '#4a5568', fontSize: '10px', letterSpacing: '2px', fontFamily: 'monospace' }}>
                        MATCH
                      </div>
                      <div style={{ color: '#e2e8f0', fontSize: '24px', fontWeight: 700, lineHeight: 1, fontFamily: 'monospace' }}>
                        {match.match_number}
                      </div>
                    </div>

                    {/* Divider */}
                    <div style={{ width: '1px', height: '40px', background: '#1e2d3d' }}/>

                    {/* Match Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <span style={{ color: '#e2e8f0', fontSize: '16px', fontWeight: 700, letterSpacing: '2px' }}>
                          {match.round?.toUpperCase() || `MATCH ${match.match_number}`}
                        </span>
                        <div style={{
                          background: statusStyle.bg,
                          border: `1px solid ${statusStyle.border}`,
                          color: statusStyle.color,
                          fontSize: '10px',
                          padding: '2px 8px',
                          borderRadius: '2px',
                          letterSpacing: '2px',
                          fontWeight: 700,
                          fontFamily: 'monospace',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {match.status === 'live' && (
                            <div style={{ width: '5px', height: '5px', background: '#ef4444', borderRadius: '50%', animation: 'pulse 1s infinite' }}/>
                          )}
                          {match.status.toUpperCase()}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <span style={{ color: '#4a5568', fontSize: '11px', fontFamily: 'monospace', letterSpacing: '1px' }}>
                          {match.map ? `MAP: ${match.map.toUpperCase()}` : 'MAP: NOT SET'}
                        </span>
                        <span style={{ color: '#1e2d3d' }}>|</span>
                        <span style={{ color: '#4a5568', fontSize: '11px', fontFamily: 'monospace', letterSpacing: '1px' }}>
                          TEAMS: {match.teams?.length || 0}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <Link href={`/match/${match.id}`}>
                        <button style={{
                          background: match.status === 'live' ? '#ef4444' : 'transparent',
                          border: match.status === 'live' ? 'none' : '1px solid #00ffa9',
                          color: match.status === 'live' ? '#fff' : '#00ffa9',
                          fontFamily: "'Rajdhani', sans-serif",
                          fontWeight: 700,
                          fontSize: '12px',
                          letterSpacing: '2px',
                          padding: '8px 16px',
                          cursor: 'pointer',
                          borderRadius: '2px',
                        }}>
                          {match.status === 'live' ? '● MANAGE' : 'MANAGE ▶'}
                        </button>
                      </Link>
                      <button
                        onClick={() => deleteMatch(match.id)}
                        style={{
                          background: 'transparent',
                          border: '1px solid #2d1e1e',
                          color: '#ef4444',
                          fontSize: '12px',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          borderRadius: '2px',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* FOOTER */}
        <div style={{
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid #1e2d3d',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ color: '#1e2d3d', fontSize: '10px', letterSpacing: '2px', fontFamily: 'monospace' }}>
            NEXUS COMMAND v2.0 · AUTHORIZED PERSONNEL ONLY
          </span>
          <span style={{ color: '#1e2d3d', fontSize: '10px', letterSpacing: '2px', fontFamily: 'monospace' }}>
            SYSTEM NOMINAL
          </span>
        </div>

      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>

    </main>
  )
}