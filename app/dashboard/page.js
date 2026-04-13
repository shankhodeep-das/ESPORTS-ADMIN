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
      .from('matches').select('*').order('created_at', { ascending: false })
    if (error) console.log('Error:', error)
    else setMatches(data || [])
    setLoading(false)
  }

  async function checkLiveMatch() {
    const { data } = await supabase
      .from('matches').select('*').eq('status', 'live').limit(1).single()
    setLiveMatch(data)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    router.push('/login')
  }

  const totalMatches = matches.length
  const liveCount    = matches.filter(m => m.status === 'live').length
  const waitingCount = matches.filter(m => m.status === 'waiting').length
  const finishedCount= matches.filter(m => m.status === 'finished').length

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Space+Mono:wght@400;700&family=Barlow+Condensed:wght@400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ══ ROOT ══ */
        .db-root {
          min-height: 100vh;
          background: #060709;
          font-family: 'Barlow Condensed', sans-serif;
          color: #e8f4ee;
          position: relative;
          overflow-x: hidden;
          isolation: isolate;
        }

        /* ══ FIXED AURORA ORBS — stronger opacity ══ */
        .db-orb {
          position: fixed; border-radius: 50%;
          pointer-events: none; z-index: 0;
        }

        /* Large green — top left */
        .db-o1 {
          width: 700px; height: 700px;
          background: radial-gradient(circle, rgba(16,185,129,0.28) 0%, rgba(16,185,129,0.06) 55%, transparent 70%);
          top: -260px; left: -180px; filter: blur(55px);
          animation: oa 14s ease-in-out infinite alternate;
        }

        /* Purple — top right */
        .db-o2 {
          width: 580px; height: 580px;
          background: radial-gradient(circle, rgba(124,58,237,0.22) 0%, rgba(109,40,217,0.06) 55%, transparent 70%);
          top: -160px; right: -140px; filter: blur(58px);
          animation: ob 17s ease-in-out infinite alternate;
        }

        /* Cyan — mid left */
        .db-o3 {
          width: 460px; height: 460px;
          background: radial-gradient(circle, rgba(6,182,212,0.16) 0%, transparent 65%);
          top: 40%; left: -100px; filter: blur(52px);
          animation: oc 11s ease-in-out infinite alternate;
        }

        /* Green — bottom right */
        .db-o4 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 65%);
          bottom: -150px; right: -100px; filter: blur(56px);
          animation: od 9s ease-in-out infinite alternate;
        }

        /* Pink — center */
        .db-o5 {
          width: 340px; height: 340px;
          background: radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 65%);
          top: 55%; left: 42%; filter: blur(50px);
          animation: oa 13s ease-in-out infinite alternate-reverse;
        }

        @keyframes oa { from{transform:translate(0,0) scale(1)}  to{transform:translate(55px,-70px) scale(1.14)} }
        @keyframes ob { from{transform:translate(0,0) scale(1)}  to{transform:translate(-65px,80px) scale(1.2)} }
        @keyframes oc { from{transform:translate(0,0) scale(1)}  to{transform:translate(45px,-55px) scale(1.1)} }
        @keyframes od { from{transform:translate(0,0) scale(1)}  to{transform:translate(-40px,60px) scale(1.18)} }

        /* Grid */
        .db-grid {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image:
            repeating-linear-gradient(0deg,  rgba(16,185,129,0.038) 0px, rgba(16,185,129,0.038) 1px, transparent 1px, transparent 44px),
            repeating-linear-gradient(90deg, rgba(16,185,129,0.028) 0px, rgba(16,185,129,0.028) 1px, transparent 1px, transparent 44px);
        }

        /* Noise */
        .db-noise {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.88' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E");
          background-size: 180px 180px; mix-blend-mode: overlay; opacity: 0.38;
        }

        /* ══ CONTENT — full width, tight padding ══ */
        .db-content {
          position: relative; z-index: 2;
          padding: 24px 28px 60px;
        }

        /* ══ TOPBAR ══ */
        .db-topbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 16px 10px 16px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          margin-bottom: 24px;
          opacity: 0; animation: dbup 0.5s ease forwards 0.05s;
          position: relative; overflow: hidden;
        }

        .db-topbar::before {
          content: ''; position: absolute;
          top: 0; left: 20px; right: 20px; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
        }

        .db-topbar-left { display: flex; align-items: center; gap: 10px; }

        .db-sdot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #10b981; box-shadow: 0 0 9px rgba(16,185,129,0.9);
          animation: spulse 2.2s ease-in-out infinite;
        }

        @keyframes spulse {
          0%,100% { box-shadow: 0 0 9px rgba(16,185,129,.9); }
          50%      { box-shadow: 0 0 3px rgba(16,185,129,.3); }
        }

        .db-stxt {
          font-family: 'Space Mono', monospace; font-size: 10px;
          color: rgba(16,185,129,0.5); letter-spacing: 0.16em; text-transform: uppercase;
        }

        /* Neon sweep clock */
        .db-clock {
          font-family: 'Space Mono', monospace; font-size: 17px; font-weight: 700;
          letter-spacing: 0.18em;
          background: linear-gradient(90deg, #10b981 0%, #06ecb0 28%, #ffffff 50%, #06ecb0 72%, #10b981 100%);
          background-size: 200% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          animation: nsweep 2.8s linear infinite;
          filter: drop-shadow(0 0 9px rgba(16,185,129,0.75)) drop-shadow(0 0 22px rgba(16,185,129,0.3));
        }

        @keyframes nsweep {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }

        .db-clock-sub {
          font-family: 'Space Mono', monospace; font-size: 9px;
          color: rgba(16,185,129,0.22); letter-spacing: 0.13em;
          text-transform: uppercase; text-align: right; margin-top: 1px;
        }

        /* ══ HEADER ══ */
        .db-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          margin-bottom: 28px;
          opacity: 0; animation: dbup 0.6s ease forwards 0.12s;
        }

        .db-eyebrow {
          font-family: 'Space Mono', monospace; font-size: 10px;
          color: rgba(16,185,129,0.4); letter-spacing: 0.22em;
          text-transform: uppercase; margin-bottom: 6px;
          display: flex; align-items: center; gap: 10px;
        }

        .db-eyebrow::before { content:''; width:22px; height:1px; background:rgba(16,185,129,0.38); display:block; }

        .db-page-title {
          font-family: 'Rajdhani', sans-serif; font-size: 48px; font-weight: 700;
          line-height: 0.88; letter-spacing: 0.04em; text-transform: uppercase; color: #fff;
        }

        .db-page-title span { color: #10b981; text-shadow: 0 0 28px rgba(16,185,129,0.45); }

        /* Live banner */
        .db-live-banner {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(232,64,64,0.1);
          border: 1px solid rgba(232,64,64,0.28);
          border-radius: 6px; padding: 7px 14px; margin-top: 12px;
          backdrop-filter: blur(8px);
        }

        .db-live-dot {
          width: 8px; height: 8px; border-radius: 50%; background: #e84040;
          animation: reddot 1.4s ease-in-out infinite;
        }

        @keyframes reddot {
          0%,100% { box-shadow: 0 0 8px rgba(232,64,64,0.9); transform:scale(1); }
          50%      { box-shadow: 0 0 18px rgba(232,64,64,0.5); transform:scale(1.2); }
        }

        .db-live-txt {
          font-family: 'Space Mono', monospace; font-size: 10px;
          color: rgba(232,64,64,0.85); letter-spacing: 0.13em; text-transform: uppercase;
        }

        /* Action buttons */
        .db-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding-top: 8px; }

        .db-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 10px 20px; border-radius: 6px;
          font-family: 'Barlow Condensed', sans-serif; font-size: 13px; font-weight: 600;
          letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer;
          transition: all 0.2s; text-decoration: none; border: none; white-space: nowrap;
        }

        .db-btn-glass {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.11);
          color: rgba(210,235,220,0.65);
          backdrop-filter: blur(12px);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.07);
        }

        .db-btn-glass:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(16,185,129,0.35);
          color: #e8f4ee; transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1);
        }

        .db-btn-primary {
          background: #10b981; color: #021a0e;
          position: relative; overflow: hidden;
          box-shadow: 0 4px 20px rgba(16,185,129,0.3);
        }

        .db-btn-primary::after {
          content: ''; position: absolute; top:0; left:-100%; width:50%; height:100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.42s ease;
        }

        .db-btn-primary:hover::after { left:160%; }
        .db-btn-primary:hover { background:#0ecf8e; transform:translateY(-2px); box-shadow:0 8px 28px rgba(16,185,129,0.45); }

        .db-btn-logout {
          background: transparent; border: 1px solid rgba(232,64,64,0.2);
          color: rgba(232,64,64,0.6);
          font-family: 'Space Mono', monospace; font-size: 10px;
          letter-spacing: 0.14em; cursor: pointer; padding: 10px 14px;
          border-radius: 6px; transition: all 0.2s;
          backdrop-filter: blur(8px);
        }

        .db-btn-logout:hover { border-color:rgba(232,64,64,0.5); color:rgba(232,64,64,0.9); background:rgba(232,64,64,0.06); }

        /* ══ STAT CARDS ══ */
        .db-stats {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 14px; margin-bottom: 28px;
          opacity: 0; animation: dbup 0.6s ease forwards 0.2s;
        }

        .db-stat {
          position: relative; overflow: hidden;
          background: rgba(255,255,255,0.055);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 14px; padding: 22px 24px 18px;
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          box-shadow: 0 4px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1);
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
        }

        /* Top shine line */
        .db-stat::before {
          content: ''; position: absolute;
          top: 0; left: 18px; right: 18px; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent);
        }

        .db-stat:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12);
        }

        /* Bottom coloured glow bar */
        .db-stat-glow {
          position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
          border-radius: 0 0 14px 14px;
        }

        /* Mini orb inside stat card */
        .db-stat-orb {
          position: absolute; width: 120px; height: 120px; border-radius: 50%;
          bottom: -50px; right: -30px; filter: blur(30px); pointer-events: none;
        }

        .db-stat-lbl {
          font-family: 'Space Mono', monospace; font-size: 9px;
          color: rgba(160,200,175,0.4); letter-spacing: 0.18em;
          text-transform: uppercase; margin-bottom: 12px; position: relative; z-index: 1;
        }

        .db-stat-val {
          font-family: 'Rajdhani', sans-serif; font-size: 48px; font-weight: 700;
          line-height: 1; letter-spacing: 0.01em; position: relative; z-index: 1;
        }

        .db-sv-white  { color: #e8f4ee; text-shadow: 0 0 30px rgba(232,244,238,0.15); }
        .db-sv-red    { color: #e84040; text-shadow: 0 0 28px rgba(232,64,64,0.5); }
        .db-sv-yellow { color: #f5c842; text-shadow: 0 0 28px rgba(245,200,66,0.45); }
        .db-sv-green  { color: #10b981; text-shadow: 0 0 28px rgba(16,185,129,0.5); }

        .db-stat-sub {
          font-size: 11px; color: rgba(160,200,175,0.3);
          letter-spacing: 0.06em; margin-top: 5px; position: relative; z-index: 1;
        }

        /* ══ SECTION HEAD ══ */
        .db-sec-head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 14px;
          opacity: 0; animation: dbup 0.5s ease forwards 0.3s;
        }

        .db-sec-title {
          font-family: 'Space Mono', monospace; font-size: 10px;
          color: rgba(16,185,129,0.42); letter-spacing: 0.2em; text-transform: uppercase;
          display: flex; align-items: center; gap: 10px;
        }

        .db-sec-title::before { content:''; width:18px; height:1px; background:rgba(16,185,129,0.32); display:block; }

        .db-sec-count {
          font-family: 'Space Mono', monospace; font-size: 9px;
          color: rgba(16,185,129,0.22); letter-spacing: 0.12em;
        }

        /* ══ MATCH CARDS ══ */
        .db-matches { display: flex; flex-direction: column; gap: 10px; }

        .db-mc {
          position: relative; overflow: hidden;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px; padding: 20px 22px 20px 26px;
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          box-shadow: 0 4px 28px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: space-between;
          transition: all 0.25s;
          opacity: 0; animation: dbup 0.5s ease forwards;
        }

        /* Top shine */
        .db-mc::before {
          content: ''; position: absolute;
          top: 0; left: 20px; right: 20px; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
        }

        .db-mc:hover {
          background: rgba(255,255,255,0.075);
          border-color: rgba(16,185,129,0.28);
          transform: translateX(5px);
          box-shadow: 0 8px 36px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1);
        }

        /* Live card tint */
        .db-mc.is-live {
          background: rgba(232,64,64,0.06);
          border-color: rgba(232,64,64,0.22);
        }

        .db-mc.is-live:hover { border-color:rgba(232,64,64,0.42); background:rgba(232,64,64,0.09); }

        /* Left status bar */
        .db-mcbar {
          position: absolute; left: 0; top: 0; bottom: 0;
          width: 4px; border-radius: 12px 0 0 12px;
        }

        .db-mcbar.live    { background:#e84040; box-shadow:2px 0 14px rgba(232,64,64,0.65); animation:barglowR 1.6s ease-in-out infinite; }
        .db-mcbar.waiting { background:#f5c842; box-shadow:2px 0 10px rgba(245,200,66,0.5); }
        .db-mcbar.finished{ background:rgba(255,255,255,0.12); }

        @keyframes barglowR {
          0%,100% { box-shadow:2px 0 10px rgba(232,64,64,0.5); }
          50%      { box-shadow:2px 0 22px rgba(232,64,64,0.9); }
        }

        /* Inner orb on match card */
        .db-mc-orb {
          position: absolute; width: 200px; height: 200px; border-radius: 50%;
          right: -60px; top: 50%; transform: translateY(-50%);
          filter: blur(38px); pointer-events: none; opacity: 0.5;
        }

        .db-mc-left { display: flex; flex-direction: column; gap: 5px; position: relative; z-index: 1; }

        .db-mc-title {
          font-family: 'Rajdhani', sans-serif; font-size: 22px; font-weight: 700;
          color: #fff; letter-spacing: 0.04em; text-transform: uppercase;
        }

        .db-mc-meta {
          display: flex; align-items: center; gap: 10px;
        }

        .db-mm {
          font-family: 'Space Mono', monospace; font-size: 9px;
          color: rgba(160,200,175,0.42); letter-spacing: 0.1em; text-transform: uppercase;
        }

        .db-mm-sep {
          width: 3px; height: 3px; border-radius: 50%;
          background: rgba(16,185,129,0.28); flex-shrink: 0;
        }

        .db-mc-right { display: flex; align-items: center; gap: 12px; position: relative; z-index: 1; }

        /* Status pill */
        .db-pill {
          font-family: 'Space Mono', monospace; font-size: 9px; font-weight: 700;
          letter-spacing: 0.14em; text-transform: uppercase;
          padding: 5px 12px; border-radius: 4px;
        }

        .db-pill.live    { background:rgba(232,64,64,0.15); color:#e84040; border:1px solid rgba(232,64,64,0.35); }
        .db-pill.waiting { background:rgba(245,200,66,0.12); color:#f5c842; border:1px solid rgba(245,200,66,0.3); }
        .db-pill.finished{ background:rgba(255,255,255,0.05); color:rgba(160,180,170,0.45); border:1px solid rgba(255,255,255,0.08); }

        /* Manage button */
        .db-manage {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 9px 18px; border-radius: 6px;
          background: rgba(16,185,129,0.1);
          border: 1px solid rgba(16,185,129,0.28);
          color: #10b981;
          font-family: 'Barlow Condensed', sans-serif; font-size: 13px;
          font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
          text-decoration: none; cursor: pointer; transition: all 0.2s;
          white-space: nowrap;
          backdrop-filter: blur(8px);
          box-shadow: 0 0 12px rgba(16,185,129,0.08);
        }

        .db-manage:hover {
          background: rgba(16,185,129,0.2); border-color: rgba(16,185,129,0.55);
          box-shadow: 0 0 22px rgba(16,185,129,0.25);
          transform: translateY(-2px);
        }

        .db-manage-arr { transition: transform 0.2s; }
        .db-manage:hover .db-manage-arr { transform: translateX(4px); }

        /* Empty state */
        .db-empty {
          text-align: center; padding: 70px 20px;
          background: rgba(255,255,255,0.03);
          border: 1px dashed rgba(16,185,129,0.14);
          border-radius: 14px;
          backdrop-filter: blur(12px);
        }

        .db-empty-txt {
          font-family: 'Space Mono', monospace; font-size: 10px;
          color: rgba(16,185,129,0.22); letter-spacing: 0.16em; text-transform: uppercase;
          margin-top: 12px;
        }

        /* Loading skeletons */
        .db-skel {
          height: 76px; border-radius: 12px; margin-bottom: 10px;
          background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer { from{background-position:200% center} to{background-position:-200% center} }

        /* Keyframes */
        @keyframes dbup {
          from { opacity:0; transform:translateY(18px); }
          to   { opacity:1; transform:translateY(0); }
        }

        /* Responsive */
        @media (max-width: 900px) {
          .db-content { padding: 16px 14px 48px; }
          .db-stats { grid-template-columns: repeat(2, 1fr); }
          .db-header { flex-direction: column; gap: 16px; align-items: flex-start; }
          .db-page-title { font-size: 36px; }
        }

        @media (max-width: 560px) {
          .db-stats { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <div className="db-root">
        <div className="db-grid" />
        <div className="db-noise" />
        <div className="db-orb db-o1" />
        <div className="db-orb db-o2" />
        <div className="db-orb db-o3" />
        <div className="db-orb db-o4" />
        <div className="db-orb db-o5" />

        <div className="db-content">

          {/* ── TOPBAR ── */}
          <div className="db-topbar">
            <div className="db-topbar-left">
              <div className="db-sdot" />
              <span className="db-stxt">System Online</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="db-clock">{mounted ? time : '--:--:--'}</div>
              <div className="db-clock-sub">Indian Standard Time</div>
            </div>
          </div>

          {/* ── HEADER ── */}
          <div className="db-header">
            <div>
              <div className="db-eyebrow">Tournament Ops</div>
              <h1 className="db-page-title">Match <span>Dashboard</span></h1>
              {liveMatch && (
                <div className="db-live-banner">
                  <div className="db-live-dot" />
                  <span className="db-live-txt">{liveMatch.title} is live now</span>
                </div>
              )}
            </div>

            <div className="db-actions">
              <Link href="/tournaments" style={{ textDecoration: 'none' }}>
                <button className="db-btn db-btn-glass">Tournaments</button>
              </Link>
              <Link href="/themes" style={{ textDecoration: 'none' }}>
                <button className="db-btn db-btn-glass">Themes</button>
              </Link>
              <Link href="/match/create" style={{ textDecoration: 'none' }}>
                <button className="db-btn db-btn-primary">+ New Match</button>
              </Link>
              <button className="db-btn-logout" onClick={handleLogout}>LOGOUT</button>
            </div>
          </div>

          {/* ── STAT CARDS ── */}
          <div className="db-stats">
            {/* Total */}
            <div className="db-stat">
              <div className="db-stat-orb" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.35) 0%, transparent 70%)' }} />
              <div className="db-stat-glow" style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.55), transparent)' }} />
              <div className="db-stat-lbl">Total Matches</div>
              <div className={`db-stat-val db-sv-white`}>{totalMatches}</div>
              <div className="db-stat-sub">all time</div>
            </div>

            {/* Live */}
            <div className="db-stat">
              <div className="db-stat-orb" style={{ background: 'radial-gradient(circle, rgba(232,64,64,0.4) 0%, transparent 70%)' }} />
              <div className="db-stat-glow" style={{ background: 'linear-gradient(90deg, transparent, rgba(232,64,64,0.6), transparent)' }} />
              <div className="db-stat-lbl">Live Now</div>
              <div className={`db-stat-val db-sv-red`}>{liveCount}</div>
              <div className="db-stat-sub">{liveCount > 0 ? 'in progress' : 'no active match'}</div>
            </div>

            {/* Waiting */}
            <div className="db-stat">
              <div className="db-stat-orb" style={{ background: 'radial-gradient(circle, rgba(245,200,66,0.35) 0%, transparent 70%)' }} />
              <div className="db-stat-glow" style={{ background: 'linear-gradient(90deg, transparent, rgba(245,200,66,0.5), transparent)' }} />
              <div className="db-stat-lbl">Waiting</div>
              <div className={`db-stat-val db-sv-yellow`}>{waitingCount}</div>
              <div className="db-stat-sub">queued up</div>
            </div>

            {/* Finished */}
            <div className="db-stat">
              <div className="db-stat-orb" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.32) 0%, transparent 70%)' }} />
              <div className="db-stat-glow" style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.45), transparent)' }} />
              <div className="db-stat-lbl">Finished</div>
              <div className={`db-stat-val db-sv-green`}>{finishedCount}</div>
              <div className="db-stat-sub">completed</div>
            </div>
          </div>

          {/* ── MATCHES ── */}
          <div className="db-sec-head">
            <div className="db-sec-title">All Matches</div>
            <div className="db-sec-count">{totalMatches} total</div>
          </div>

          {loading && (
            <div>
              <div className="db-skel" />
              <div className="db-skel" style={{ opacity: 0.65 }} />
              <div className="db-skel" style={{ opacity: 0.35 }} />
            </div>
          )}

          {!loading && matches.length === 0 && (
            <div className="db-empty">
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 40, fontWeight: 700, color: 'rgba(16,185,129,0.12)', letterSpacing: '0.1em' }}>
                NO MATCHES YET
              </div>
              <div className="db-empty-txt">Create your first match to get started</div>
            </div>
          )}

          {!loading && (
            <div className="db-matches">
              {matches.map((match, i) => (
                <div
                  key={match.id}
                  className={`db-mc ${match.status === 'live' ? 'is-live' : ''}`}
                  style={{ animationDelay: `${0.35 + i * 0.06}s` }}
                >
                  {/* Left bar */}
                  <div className={`db-mcbar ${match.status}`} />

                  {/* Inner orb glow */}
                  <div className="db-mc-orb" style={{
                    background: match.status === 'live'
                      ? 'radial-gradient(circle, rgba(232,64,64,0.18) 0%, transparent 70%)'
                      : match.status === 'waiting'
                      ? 'radial-gradient(circle, rgba(245,200,66,0.12) 0%, transparent 70%)'
                      : 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)'
                  }} />

                  <div className="db-mc-left">
                    <div className="db-mc-title">{match.title}</div>
                    <div className="db-mc-meta">
                      <span className="db-mm">{match.map}</span>
                      <div className="db-mm-sep" />
                      <span className="db-mm">{match.round}</span>
                    </div>
                  </div>

                  <div className="db-mc-right">
                    <div className={`db-pill ${match.status}`}>
                      {match.status === 'live' && '● '}
                      {match.status.toUpperCase()}
                    </div>
                    <Link href={`/match/${match.id}`} style={{ textDecoration: 'none' }}>
                      <div className="db-manage">
                        Manage <span className="db-manage-arr">→</span>
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