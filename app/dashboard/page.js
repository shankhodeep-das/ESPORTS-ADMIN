'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Dashboard() {
  const router = useRouter()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [time, setTime] = useState('')
  const [mounted, setMounted] = useState(false)
  const [liveMatch, setLiveMatch] = useState(null)

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      }))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchMatches()
    checkLiveMatch()
  }, [])

  async function fetchMatches() {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) console.log('Error:', error)
    else setMatches(data || [])
    setLoading(false)
  }

  async function checkLiveMatch() {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'live')
      .limit(1)
      .single()
    setLiveMatch(data)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    router.push('/login')
  }

  const totalMatches = matches.length
  const liveCount = matches.filter(m => m.status === 'live').length
  const waitingCount = matches.filter(m => m.status === 'waiting').length
  const finishedCount = matches.filter(m => m.status === 'finished').length

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Space+Mono:wght@400;700&family=Barlow+Condensed:wght@400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .db-root {
          min-height: 100vh;
          background: #07080b;
          font-family: 'Barlow Condensed', sans-serif;
          color: #e8f4ee;
          position: relative;
          overflow-x: hidden;
          isolation: isolate;
        }

        /* ── BACKGROUND AURORA ORBS ── */
        .db-orb {
          position: fixed; border-radius: 50%;
          pointer-events: none; z-index: 0;
        }

        .db-orb1 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(16,185,129,0.14) 0%, transparent 65%);
          top: -200px; left: -150px; filter: blur(70px);
          animation: db-orb-a 12s ease-in-out infinite alternate;
        }

        .db-orb2 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 65%);
          top: -100px; right: -120px; filter: blur(65px);
          animation: db-orb-b 15s ease-in-out infinite alternate;
        }

        .db-orb3 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(6,182,212,0.09) 0%, transparent 65%);
          bottom: 10%; left: 30%; filter: blur(60px);
          animation: db-orb-c 10s ease-in-out infinite alternate;
        }

        .db-orb4 {
          width: 350px; height: 350px;
          background: radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 65%);
          bottom: -100px; right: -80px; filter: blur(60px);
          animation: db-orb-d 8s ease-in-out infinite alternate;
        }

        @keyframes db-orb-a { from { transform: translate(0,0) scale(1); } to { transform: translate(60px,-80px) scale(1.15); } }
        @keyframes db-orb-b { from { transform: translate(0,0) scale(1); } to { transform: translate(-70px,90px) scale(1.2); } }
        @keyframes db-orb-c { from { transform: translate(0,0) scale(1); } to { transform: translate(-50px,-60px) scale(1.1); } }
        @keyframes db-orb-d { from { transform: translate(0,0) scale(1); } to { transform: translate(40px,50px) scale(1.18); } }

        /* Grid texture */
        .db-grid {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image:
            repeating-linear-gradient(0deg,  rgba(16,185,129,0.03) 0px, rgba(16,185,129,0.03) 1px, transparent 1px, transparent 44px),
            repeating-linear-gradient(90deg, rgba(16,185,129,0.022) 0px, rgba(16,185,129,0.022) 1px, transparent 1px, transparent 44px);
        }

        /* Noise grain */
        .db-noise {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.88' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          background-size: 180px 180px; mix-blend-mode: overlay; opacity: 0.35;
        }

        /* ── CONTENT WRAPPER ── */
        .db-content {
          position: relative; z-index: 2;
          max-width: 1100px; margin: 0 auto;
          padding: 32px 40px 60px;
        }

        /* ── TOP BAR ── */
        .db-topbar {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 36px;
          opacity: 0; animation: db-up 0.6s ease forwards 0.05s;
        }

        .db-topbar-left {
          display: flex; align-items: center; gap: 12px;
        }

        .db-status-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #10b981; box-shadow: 0 0 8px rgba(16,185,129,0.9);
          animation: db-pulse 2.2s ease-in-out infinite;
        }

        @keyframes db-pulse {
          0%,100% { box-shadow: 0 0 8px rgba(16,185,129,0.9); }
          50%      { box-shadow: 0 0 3px rgba(16,185,129,0.4); }
        }

        .db-system-txt {
          font-family: 'Space Mono', monospace; font-size: 10px;
          color: rgba(16,185,129,0.5); letter-spacing: 0.16em; text-transform: uppercase;
        }

        /* Neon sweep clock */
        .db-clock {
          font-family: 'Space Mono', monospace; font-size: 16px; font-weight: 700;
          letter-spacing: 0.18em;
          background: linear-gradient(90deg, #10b981 0%, #06ecb0 30%, #ffffff 50%, #06ecb0 70%, #10b981 100%);
          background-size: 200% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          animation: neon-sweep 2.8s linear infinite;
          filter: drop-shadow(0 0 8px rgba(16,185,129,0.7)) drop-shadow(0 0 18px rgba(16,185,129,0.3));
        }

        @keyframes neon-sweep {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }

        .db-clock-sub {
          font-family: 'Space Mono', monospace; font-size: 9px;
          color: rgba(16,185,129,0.25); letter-spacing: 0.14em;
          text-transform: uppercase; text-align: right; margin-top: 2px;
        }

        /* ── HEADER ROW ── */
        .db-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          margin-bottom: 32px;
          opacity: 0; animation: db-up 0.6s ease forwards 0.12s;
        }

        .db-title-wrap {}

        .db-eyebrow {
          font-family: 'Space Mono', monospace; font-size: 10px;
          color: rgba(16,185,129,0.45); letter-spacing: 0.22em;
          text-transform: uppercase; margin-bottom: 6px;
          display: flex; align-items: center; gap: 10px;
        }

        .db-eyebrow::before {
          content: ''; width: 22px; height: 1px;
          background: rgba(16,185,129,0.4); display: block;
        }

        .db-page-title {
          font-family: 'Rajdhani', sans-serif; font-size: 42px; font-weight: 700;
          line-height: 0.9; letter-spacing: 0.04em; text-transform: uppercase;
          color: #fff;
        }

        .db-page-title span { color: #10b981; }

        /* Live banner */
        .db-live-banner {
          display: flex; align-items: center; gap: 8px;
          background: rgba(220,55,55,0.08);
          border: 1px solid rgba(220,55,55,0.22);
          border-radius: 6px;
          padding: 8px 14px; margin-top: 12px; width: fit-content;
        }

        .db-live-dot {
          width: 8px; height: 8px; border-radius: 50%; background: #e84040;
          box-shadow: 0 0 8px rgba(232,64,64,0.9);
          animation: db-pulse-red 1.4s ease-in-out infinite;
        }

        @keyframes db-pulse-red {
          0%,100% { box-shadow: 0 0 8px rgba(232,64,64,0.9); transform: scale(1); }
          50%      { box-shadow: 0 0 16px rgba(232,64,64,0.6); transform: scale(1.15); }
        }

        .db-live-txt {
          font-family: 'Space Mono', monospace; font-size: 10px;
          color: rgba(232,64,64,0.85); letter-spacing: 0.14em; text-transform: uppercase;
        }

        /* Action buttons */
        .db-actions { display: flex; align-items: center; gap: 10px; }

        .db-btn {
          display: flex; align-items: center; gap: 7px;
          padding: 10px 18px; border-radius: 4px;
          font-family: 'Barlow Condensed', sans-serif; font-size: 13px;
          font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase;
          cursor: pointer; transition: all 0.2s; text-decoration: none;
          border: none; white-space: nowrap;
        }

        .db-btn-glass {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(220,240,230,0.7);
          backdrop-filter: blur(8px);
        }

        .db-btn-glass:hover {
          background: rgba(255,255,255,0.09);
          border-color: rgba(16,185,129,0.3);
          color: #e8f4ee;
          transform: translateY(-1px);
        }

        .db-btn-primary {
          background: #10b981; color: #021a0e;
          position: relative; overflow: hidden;
        }

        .db-btn-primary::after {
          content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
          transition: left 0.4s ease;
        }

        .db-btn-primary:hover::after { left: 160%; }
        .db-btn-primary:hover { background: #0ecf8e; transform: translateY(-2px); box-shadow: 0 6px 24px rgba(16,185,129,0.35); }

        .db-btn-danger {
          background: transparent; border: none;
          color: rgba(220,80,80,0.7);
          font-family: 'Space Mono', monospace; font-size: 10px;
          letter-spacing: 0.14em; cursor: pointer;
          transition: color 0.2s; padding: 10px 6px;
        }

        .db-btn-danger:hover { color: rgba(232,64,64,0.95); }

        /* ── STAT CARDS ── */
        .db-stats {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 14px; margin-bottom: 32px;
          opacity: 0; animation: db-up 0.6s ease forwards 0.2s;
        }

        .db-stat-card {
          position: relative; overflow: hidden;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 12px; padding: 20px 22px;
          backdrop-filter: blur(16px);
          transition: border-color 0.2s, transform 0.2s;
        }

        .db-stat-card::before {
          content: ''; position: absolute;
          top: 0; left: 16px; right: 16px; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent);
        }

        .db-stat-card:hover {
          border-color: rgba(16,185,129,0.22);
          transform: translateY(-2px);
        }

        .db-stat-card-accent {
          position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
          border-radius: 0 0 12px 12px;
        }

        .db-stat-lbl {
          font-family: 'Space Mono', monospace; font-size: 9px;
          color: rgba(160,200,180,0.4); letter-spacing: 0.18em;
          text-transform: uppercase; margin-bottom: 10px;
        }

        .db-stat-val {
          font-family: 'Rajdhani', sans-serif; font-size: 38px; font-weight: 700;
          line-height: 1; letter-spacing: 0.02em;
        }

        .db-stat-val.green  { color: #10b981; text-shadow: 0 0 20px rgba(16,185,129,0.35); }
        .db-stat-val.red    { color: #e84040; text-shadow: 0 0 20px rgba(232,64,64,0.3); }
        .db-stat-val.yellow { color: #f5c842; text-shadow: 0 0 20px rgba(245,200,66,0.3); }
        .db-stat-val.white  { color: #e8f4ee; }

        .db-stat-sub {
          font-size: 11px; color: rgba(160,200,180,0.3);
          letter-spacing: 0.06em; margin-top: 4px;
        }

        /* ── SECTION LABEL ── */
        .db-section-head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 16px;
          opacity: 0; animation: db-up 0.5s ease forwards 0.3s;
        }

        .db-section-title {
          font-family: 'Space Mono', monospace; font-size: 10px;
          color: rgba(16,185,129,0.45); letter-spacing: 0.2em; text-transform: uppercase;
          display: flex; align-items: center; gap: 10px;
        }

        .db-section-title::before {
          content: ''; width: 20px; height: 1px;
          background: rgba(16,185,129,0.35); display: block;
        }

        .db-section-count {
          font-family: 'Space Mono', monospace; font-size: 9px;
          color: rgba(16,185,129,0.25); letter-spacing: 0.12em;
        }

        /* ── MATCH LIST ── */
        .db-matches {
          display: flex; flex-direction: column; gap: 10px;
        }

        .db-match-card {
          position: relative; overflow: hidden;
          background: rgba(255,255,255,0.038);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px; padding: 18px 22px;
          backdrop-filter: blur(14px);
          display: flex; align-items: center; justify-content: space-between;
          transition: all 0.25s;
          opacity: 0; animation: db-up 0.5s ease forwards;
        }

        .db-match-card::before {
          content: ''; position: absolute;
          top: 0; left: 16px; right: 16px; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
        }

        .db-match-card:hover {
          background: rgba(255,255,255,0.055);
          border-color: rgba(16,185,129,0.2);
          transform: translateX(4px);
        }

        /* Live match gets a green left border glow */
        .db-match-card.is-live {
          border-color: rgba(232,64,64,0.25);
          background: rgba(232,64,64,0.04);
        }

        .db-match-card.is-live:hover {
          border-color: rgba(232,64,64,0.4);
        }

        /* Left status bar */
        .db-match-bar {
          position: absolute; left: 0; top: 0; bottom: 0;
          width: 3px; border-radius: 10px 0 0 10px;
        }

        .db-match-bar.live    { background: #e84040; box-shadow: 0 0 10px rgba(232,64,64,0.7); animation: bar-glow-red 1.6s ease-in-out infinite; }
        .db-match-bar.waiting { background: #f5c842; box-shadow: 0 0 8px rgba(245,200,66,0.5); }
        .db-match-bar.finished { background: rgba(255,255,255,0.15); }

        @keyframes bar-glow-red {
          0%,100% { box-shadow: 0 0 8px rgba(232,64,64,0.6); }
          50%      { box-shadow: 0 0 18px rgba(232,64,64,0.9); }
        }

        .db-match-left { display: flex; flex-direction: column; gap: 5px; padding-left: 8px; }

        .db-match-title {
          font-family: 'Rajdhani', sans-serif; font-size: 20px; font-weight: 700;
          color: #ffffff; letter-spacing: 0.04em; text-transform: uppercase;
        }

        .db-match-meta {
          display: flex; align-items: center; gap: 14px;
        }

        .db-meta-item {
          font-family: 'Space Mono', monospace; font-size: 9px;
          color: rgba(160,200,180,0.4); letter-spacing: 0.1em; text-transform: uppercase;
          display: flex; align-items: center; gap: 5px;
        }

        .db-meta-dot {
          width: 3px; height: 3px; border-radius: 50%;
          background: rgba(16,185,129,0.3);
        }

        .db-match-right { display: flex; align-items: center; gap: 12px; }

        /* Status pill */
        .db-pill {
          font-family: 'Space Mono', monospace; font-size: 9px; font-weight: 700;
          letter-spacing: 0.14em; text-transform: uppercase;
          padding: 4px 10px; border-radius: 3px;
        }

        .db-pill.live    { background: rgba(232,64,64,0.15); color: #e84040; border: 1px solid rgba(232,64,64,0.3); }
        .db-pill.waiting { background: rgba(245,200,66,0.12); color: #f5c842; border: 1px solid rgba(245,200,66,0.28); }
        .db-pill.finished { background: rgba(255,255,255,0.05); color: rgba(160,180,170,0.5); border: 1px solid rgba(255,255,255,0.08); }

        /* Manage button */
        .db-manage-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 16px; border-radius: 4px;
          background: rgba(16,185,129,0.12);
          border: 1px solid rgba(16,185,129,0.25);
          color: #10b981;
          font-family: 'Barlow Condensed', sans-serif; font-size: 13px;
          font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
          text-decoration: none; cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .db-manage-btn:hover {
          background: rgba(16,185,129,0.2);
          border-color: rgba(16,185,129,0.5);
          box-shadow: 0 0 16px rgba(16,185,129,0.2);
          transform: translateY(-1px);
        }

        .db-manage-arrow {
          font-size: 14px; transition: transform 0.2s;
        }

        .db-manage-btn:hover .db-manage-arrow { transform: translateX(3px); }

        /* Empty state */
        .db-empty {
          text-align: center; padding: 60px 20px;
          background: rgba(255,255,255,0.03);
          border: 1px dashed rgba(16,185,129,0.15);
          border-radius: 12px;
        }

        .db-empty-icon {
          font-family: 'Rajdhani', sans-serif; font-size: 48px; font-weight: 700;
          color: rgba(16,185,129,0.15); letter-spacing: 0.1em; margin-bottom: 12px;
        }

        .db-empty-txt {
          font-family: 'Space Mono', monospace; font-size: 10px;
          color: rgba(16,185,129,0.25); letter-spacing: 0.16em; text-transform: uppercase;
        }

        /* Loading skeleton */
        .db-skeleton {
          height: 72px; border-radius: 10px;
          background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.04) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.6s infinite;
          margin-bottom: 10px;
        }

        @keyframes shimmer {
          from { background-position: 200% center; }
          to   { background-position: -200% center; }
        }

        /* ── KEYFRAMES ── */
        @keyframes db-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Responsive */
        @media (max-width: 900px) {
          .db-content { padding: 24px 20px 48px; }
          .db-stats { grid-template-columns: repeat(2, 1fr); }
          .db-header { flex-direction: column; gap: 16px; align-items: flex-start; }
          .db-actions { flex-wrap: wrap; }
        }

        @media (max-width: 600px) {
          .db-stats { grid-template-columns: repeat(2, 1fr); }
          .db-topbar { flex-direction: column; gap: 8px; align-items: flex-start; }
        }
      `}</style>

      <div className="db-root">
        {/* Background */}
        <div className="db-grid" />
        <div className="db-noise" />
        <div className="db-orb db-orb1" />
        <div className="db-orb db-orb2" />
        <div className="db-orb db-orb3" />
        <div className="db-orb db-orb4" />

        <div className="db-content">

          {/* ── TOP STATUS BAR ── */}
          <div className="db-topbar">
            <div className="db-topbar-left">
              <div className="db-status-dot" />
              <span className="db-system-txt">System Online</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="db-clock">{mounted ? time : '--:--:--'}</div>
              <div className="db-clock-sub">Indian Standard Time</div>
            </div>
          </div>

          {/* ── HEADER ── */}
          <div className="db-header">
            <div className="db-title-wrap">
              <div className="db-eyebrow">Tournament Ops</div>
              <h1 className="db-page-title">
                Match <span>Dashboard</span>
              </h1>
              {liveMatch && (
                <div className="db-live-banner">
                  <div className="db-live-dot" />
                  <span className="db-live-txt">{liveMatch.title} is live now</span>
                </div>
              )}
            </div>

            <div className="db-actions">
              <Link href="/tournaments" style={{ textDecoration: 'none' }}>
                <button className="db-btn db-btn-glass">
                  Tournaments
                </button>
              </Link>
              <Link href="/themes" style={{ textDecoration: 'none' }}>
                <button className="db-btn db-btn-glass">
                  Themes
                </button>
              </Link>
              <Link href="/match/create" style={{ textDecoration: 'none' }}>
                <button className="db-btn db-btn-primary">
                  + New Match
                </button>
              </Link>
              <button className="db-btn-danger" onClick={handleLogout}>
                LOGOUT
              </button>
            </div>
          </div>

          {/* ── STAT CARDS ── */}
          <div className="db-stats">
            <div className="db-stat-card">
              <div className="db-stat-card-accent" style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.4), transparent)' }} />
              <div className="db-stat-lbl">Total Matches</div>
              <div className="db-stat-val white">{totalMatches}</div>
              <div className="db-stat-sub">all time</div>
            </div>
            <div className="db-stat-card">
              <div className="db-stat-card-accent" style={{ background: 'linear-gradient(90deg, transparent, rgba(232,64,64,0.5), transparent)' }} />
              <div className="db-stat-lbl">Live Now</div>
              <div className="db-stat-val red">{liveCount}</div>
              <div className="db-stat-sub">{liveCount > 0 ? 'in progress' : 'no active match'}</div>
            </div>
            <div className="db-stat-card">
              <div className="db-stat-card-accent" style={{ background: 'linear-gradient(90deg, transparent, rgba(245,200,66,0.4), transparent)' }} />
              <div className="db-stat-lbl">Waiting</div>
              <div className="db-stat-val yellow">{waitingCount}</div>
              <div className="db-stat-sub">queued up</div>
            </div>
            <div className="db-stat-card">
              <div className="db-stat-card-accent" style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.3), transparent)' }} />
              <div className="db-stat-lbl">Finished</div>
              <div className="db-stat-val green">{finishedCount}</div>
              <div className="db-stat-sub">completed</div>
            </div>
          </div>

          {/* ── MATCH LIST ── */}
          <div className="db-section-head">
            <div className="db-section-title">All Matches</div>
            <div className="db-section-count">{totalMatches} total</div>
          </div>

          {loading && (
            <div>
              <div className="db-skeleton" />
              <div className="db-skeleton" style={{ opacity: 0.7 }} />
              <div className="db-skeleton" style={{ opacity: 0.4 }} />
            </div>
          )}

          {!loading && matches.length === 0 && (
            <div className="db-empty">
              <div className="db-empty-icon">NO MATCHES</div>
              <div className="db-empty-txt">Create your first match to get started</div>
            </div>
          )}

          {!loading && (
            <div className="db-matches">
              {matches.map((match, i) => (
                <div
                  key={match.id}
                  className={`db-match-card ${match.status === 'live' ? 'is-live' : ''}`}
                  style={{ animationDelay: `${0.35 + i * 0.07}s` }}
                >
                  {/* Left status bar */}
                  <div className={`db-match-bar ${match.status}`} />

                  <div className="db-match-left">
                    <div className="db-match-title">{match.title}</div>
                    <div className="db-match-meta">
                      <div className="db-meta-item">{match.map}</div>
                      <div className="db-meta-dot" />
                      <div className="db-meta-item">{match.round}</div>
                    </div>
                  </div>

                  <div className="db-match-right">
                    <div className={`db-pill ${match.status}`}>
                      {match.status === 'live' && '● '}
                      {match.status.toUpperCase()}
                    </div>
                    <Link href={`/match/${match.id}`} style={{ textDecoration: 'none' }}>
                      <div className="db-manage-btn">
                        Manage <span className="db-manage-arrow">→</span>
                      </div>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  )
}