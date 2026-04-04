'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [time, setTime] = useState('')
  const [mounted, setMounted] = useState(false)
  const [popup, setPopup] = useState(null) // 'granted' | 'denied' | null

  useEffect(() => {
    setMounted(true)
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      }))
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setPopup('denied')
      setTimeout(() => setPopup(null), 3200)
      return
    }
    if (data.session) {
      document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=3600`
    }
    setPopup('granted')
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Space+Mono:wght@400;700&family=Barlow+Condensed:wght@400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .sl-root {
          min-height: 100vh;
          display: flex;
          background: #060809;
          font-family: 'Barlow Condensed', sans-serif;
          isolation: isolate;
        }

        /* LEFT PANEL */
        .sl-left {
          width: 45%;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 36px 44px;
          overflow: hidden;
          background: #060e0a;
          isolation: isolate;
        }

        .sl-left-grid {
          position: absolute; inset: 0;
          background-image:
            repeating-linear-gradient(0deg,  rgba(16,185,129,0.055) 0px, rgba(16,185,129,0.055) 1px, transparent 1px, transparent 44px),
            repeating-linear-gradient(90deg, rgba(16,185,129,0.04)  0px, rgba(16,185,129,0.04)  1px, transparent 1px, transparent 44px);
          pointer-events: none; z-index: 0;
        }

        .sl-left-glow {
          position: absolute;
          width: 420px; height: 420px; border-radius: 50%;
          background: radial-gradient(circle, rgba(16,185,129,0.22) 0%, transparent 65%);
          bottom: -140px; left: -100px;
          pointer-events: none; z-index: 0;
          animation: sl-breathe 7s ease-in-out infinite alternate;
        }

        @keyframes sl-breathe {
          from { opacity: 0.7; transform: scale(1); }
          to   { opacity: 1;   transform: scale(1.1); }
        }

        .sl-status {
          display: flex; align-items: center; gap: 8px;
          position: relative; z-index: 2;
          opacity: 0; animation: sl-fade 0.5s ease forwards 0.1s;
        }

        .sl-status-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #10b981; box-shadow: 0 0 8px rgba(16,185,129,0.9);
          animation: sl-pulse 2.2s ease-in-out infinite;
        }

        @keyframes sl-pulse {
          0%,100% { opacity:1; box-shadow: 0 0 8px rgba(16,185,129,0.9); }
          50%      { opacity:.45; box-shadow: 0 0 3px rgba(16,185,129,0.4); }
        }

        .sl-status-txt {
          font-family: 'Space Mono', monospace; font-size: 10px;
          color: rgba(16,185,129,0.5); letter-spacing: 0.16em;
        }

        .sl-brand {
          position: relative; z-index: 2;
          opacity: 0; animation: sl-up 0.7s cubic-bezier(0.22,1,0.36,1) forwards 0.22s;
        }

        .sl-eyebrow {
          font-family: 'Space Mono', monospace; font-size: 10px;
          color: rgba(16,185,129,0.45); letter-spacing: 0.22em;
          text-transform: uppercase; margin-bottom: 14px;
          display: flex; align-items: center; gap: 10px;
        }

        .sl-eyebrow::before {
          content: ''; width: 26px; height: 1px;
          background: rgba(16,185,129,0.4); display: block;
        }

        .sl-title {
          font-family: 'Rajdhani', sans-serif;
          font-size: clamp(54px, 5.5vw, 78px); font-weight: 700;
          line-height: 0.88; letter-spacing: 0.02em;
          text-transform: uppercase; color: #eaf4ee;
        }

        .sl-title-accent {
          display: block; color: #10b981;
          font-size: clamp(60px, 6.5vw, 90px);
        }

        .sl-tagline {
          margin-top: 18px; font-size: 13px;
          color: rgba(140,190,165,0.38); letter-spacing: 0.09em;
          text-transform: uppercase; line-height: 1.55;
        }

        .sl-stats { display: flex; gap: 24px; margin-top: 30px; }
        .sl-stat  { display: flex; flex-direction: column; gap: 3px; }

        .sl-stat-val {
          font-family: 'Space Mono', monospace; font-size: 18px;
          font-weight: 700; color: #10b981; letter-spacing: -0.01em;
        }

        .sl-stat-lbl {
          font-size: 10px; color: rgba(16,185,129,0.28);
          letter-spacing: 0.14em; text-transform: uppercase;
        }

        .sl-stat-div {
          width: 1px; align-self: stretch;
          background: rgba(16,185,129,0.14);
        }

        .sl-left-foot {
          position: relative; z-index: 2;
          opacity: 0; animation: sl-fade 0.5s ease forwards 0.6s;
        }

        .sl-left-foot-txt {
          font-family: 'Space Mono', monospace; font-size: 9px;
          color: rgba(16,185,129,0.18); letter-spacing: 0.13em;
          line-height: 1.9; text-transform: uppercase;
        }

        /* DIVIDER */
        .sl-divider { position: relative; width: 0; flex-shrink: 0; }

        .sl-divider::before {
          content: ''; position: absolute;
          top: 0; bottom: 0; left: 0; width: 1px;
          background: linear-gradient(to bottom,
            transparent 0%, rgba(16,185,129,0.22) 25%,
            rgba(16,185,129,0.22) 75%, transparent 100%);
        }

        .sl-notch {
          position: absolute; top: 50%; left: -5px;
          width: 10px; height: 10px;
          border: 1px solid rgba(16,185,129,0.35);
          background: #060e0a;
          transform: translateY(-50%) rotate(45deg);
        }

        /* RIGHT PANEL */
        .sl-right {
          flex: 1; position: relative;
          display: flex; flex-direction: column; justify-content: center;
          padding: 56px 60px; background: #060809;
          overflow: hidden; isolation: isolate;
        }

        .sl-right-grid {
          position: absolute; inset: 0;
          background-image:
            repeating-linear-gradient(0deg,  rgba(16,185,129,0.025) 0px, rgba(16,185,129,0.025) 1px, transparent 1px, transparent 44px),
            repeating-linear-gradient(90deg, rgba(16,185,129,0.02)  0px, rgba(16,185,129,0.02)  1px, transparent 1px, transparent 44px);
          pointer-events: none; z-index: 0;
        }

        .sl-right-glow {
          position: absolute; width: 360px; height: 360px; border-radius: 50%;
          background: radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 65%);
          top: -80px; right: -80px; pointer-events: none; z-index: 0;
        }

        /* Corner brackets on right */
        .sl-rc {
          position: absolute; width: 20px; height: 20px;
          z-index: 2; pointer-events: none;
        }

        .sl-rc.tl { top: 20px; left: 24px;
          border-top: 1.5px solid rgba(16,185,129,0.28);
          border-left: 1.5px solid rgba(16,185,129,0.28); }
        .sl-rc.tr { top: 20px; right: 24px;
          border-top: 1.5px solid rgba(16,185,129,0.28);
          border-right: 1.5px solid rgba(16,185,129,0.28); }
        .sl-rc.bl { bottom: 20px; left: 24px;
          border-bottom: 1.5px solid rgba(16,185,129,0.28);
          border-left: 1.5px solid rgba(16,185,129,0.28); }
        .sl-rc.br { bottom: 20px; right: 24px;
          border-bottom: 1.5px solid rgba(16,185,129,0.28);
          border-right: 1.5px solid rgba(16,185,129,0.28); }

        .sl-time {
          position: absolute; top: 28px; right: 40px;
          font-family: 'Space Mono', monospace; font-size: 11px;
          color: rgba(16,185,129,0.28); letter-spacing: 0.12em; z-index: 2;
        }

        .sl-form-head {
          position: relative; z-index: 2; margin-bottom: 34px;
          opacity: 0; animation: sl-up 0.6s ease forwards 0.3s;
        }

        .sl-form-title {
          font-family: 'Rajdhani', sans-serif; font-size: 30px;
          font-weight: 700; color: #eaf4ee;
          letter-spacing: 0.07em; text-transform: uppercase;
        }

        .sl-form-sub {
          font-size: 12px; color: rgba(120,160,140,0.45);
          letter-spacing: 0.1em; text-transform: uppercase; margin-top: 4px;
        }

        .sl-fields {
          position: relative; z-index: 2;
          display: flex; flex-direction: column; gap: 20px; margin-bottom: 26px;
        }

        .sl-field {
          display: flex; flex-direction: column; gap: 7px;
          opacity: 0; animation: sl-up 0.5s ease forwards;
        }

        .sl-field:nth-child(1) { animation-delay: 0.4s; }
        .sl-field:nth-child(2) { animation-delay: 0.5s; }

        .sl-label {
          font-family: 'Space Mono', monospace; font-size: 10px;
          color: rgba(16,185,129,0.42); letter-spacing: 0.18em; text-transform: uppercase;
        }

        .sl-input {
          width: 100%; max-width: 380px;
          padding: 13px 18px;
          background: rgba(16,185,129,0.03);
          border: 1px solid rgba(16,185,129,0.13);
          border-radius: 2px; color: #cce8d8;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 16px; font-weight: 500; letter-spacing: 0.04em;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }

        .sl-input::placeholder {
          color: rgba(16,185,129,0.17);
          font-family: 'Space Mono', monospace;
          font-size: 11px; letter-spacing: 0.07em;
        }

        .sl-input:focus {
          border-color: rgba(16,185,129,0.5);
          background: rgba(16,185,129,0.06);
          box-shadow: 0 0 0 3px rgba(16,185,129,0.05);
        }

        .sl-btn-wrap {
          position: relative; z-index: 2; max-width: 380px;
          opacity: 0; animation: sl-up 0.5s ease forwards 0.58s;
        }

        .sl-btn {
          width: 100%; padding: 15px 24px; background: #10b981;
          border: none; border-radius: 2px; color: #03150a;
          font-family: 'Rajdhani', sans-serif; font-size: 17px;
          font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase;
          cursor: pointer; display: flex; align-items: center;
          justify-content: center; gap: 10px;
          position: relative; overflow: hidden;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
        }

        .sl-btn::after {
          content: ''; position: absolute; top: 0; left: -100%;
          width: 50%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          transition: left 0.45s ease;
        }

        .sl-btn:hover::after { left: 160%; }
        .sl-btn:hover { background: #0ecf8e; transform: translateY(-2px); box-shadow: 0 8px 30px rgba(16,185,129,0.32); }
        .sl-btn:active { transform: translateY(0); box-shadow: none; }
        .sl-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none; }

        .sl-spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(3,21,10,0.3); border-top-color: #03150a;
          border-radius: 50%; animation: sl-spin 0.65s linear infinite; flex-shrink: 0;
        }

        .sl-form-foot {
          position: relative; z-index: 2; max-width: 380px;
          margin-top: 28px; padding-top: 18px;
          border-top: 1px solid rgba(16,185,129,0.08);
          display: flex; align-items: center; justify-content: space-between;
          opacity: 0; animation: sl-fade 0.5s ease forwards 0.72s;
        }

        .sl-form-foot-txt {
          font-family: 'Space Mono', monospace; font-size: 9px;
          color: rgba(16,185,129,0.2); letter-spacing: 0.12em; text-transform: uppercase;
        }

        .sl-lock { display: flex; align-items: center; gap: 5px; }

        .sl-lock-icon { width: 10px; height: 12px; position: relative; }

        .sl-lock-body {
          width: 10px; height: 7px; background: rgba(16,185,129,0.2);
          border-radius: 1px; position: absolute; bottom: 0;
        }

        .sl-lock-shackle {
          width: 6px; height: 6px;
          border: 1.5px solid rgba(16,185,129,0.2);
          border-bottom: none; border-radius: 3px 3px 0 0;
          position: absolute; top: 0; left: 2px;
        }

        /* POPUP OVERLAY */
        .sl-overlay {
          position: fixed; inset: 0; z-index: 200;
          display: flex; align-items: center; justify-content: center;
          animation: sl-fade 0.2s ease forwards;
        }

        .sl-overlay-bg {
          position: absolute; inset: 0;
          background: rgba(4,6,8,0.85);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .sl-overlay-scan {
          position: absolute; inset: 0;
          background: repeating-linear-gradient(
            0deg, rgba(255,255,255,0.012) 0px, rgba(255,255,255,0.012) 1px,
            transparent 1px, transparent 3px
          );
          pointer-events: none;
        }

        /* Popup card */
        .sl-popup {
          position: relative; z-index: 1;
          padding: 48px 60px 44px; text-align: center; min-width: 320px;
          animation: sl-popup-in 0.4s cubic-bezier(0.22,1,0.36,1) forwards;
        }

        @keyframes sl-popup-in {
          from { opacity: 0; transform: scale(0.82) translateY(20px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }

        /* Corner brackets — 4 corners via 2 pseudo-elements + 2 spans */
        .sl-pc  { position: absolute; inset: 0; pointer-events: none; }
        .sl-pc2 { position: absolute; inset: 0; pointer-events: none; }

        .sl-pc::before, .sl-pc::after,
        .sl-pc2 span:nth-child(1), .sl-pc2 span:nth-child(2) {
          content: ''; position: absolute;
          width: 24px; height: 24px; display: block;
        }

        .sl-popup.granted .sl-pc::before,
        .sl-popup.granted .sl-pc::after,
        .sl-popup.granted .sl-pc2 span { border-color: rgba(16,185,129,0.65); }

        .sl-popup.denied .sl-pc::before,
        .sl-popup.denied .sl-pc::after,
        .sl-popup.denied .sl-pc2 span { border-color: rgba(220,55,55,0.65); }

        .sl-pc::before { top:0; left:0; border-top:2px solid; border-left:2px solid; }
        .sl-pc::after  { bottom:0; right:0; border-bottom:2px solid; border-right:2px solid; }
        .sl-pc2 span:nth-child(1) { top:0; right:0; border-top:2px solid; border-right:2px solid; }
        .sl-pc2 span:nth-child(2) { bottom:0; left:0; border-bottom:2px solid; border-left:2px solid; }

        /* Ring icon */
        .sl-pi {
          width: 68px; height: 68px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 24px; position: relative;
        }

        .sl-popup.granted .sl-pi {
          border: 2px solid rgba(16,185,129,0.65);
          box-shadow: 0 0 32px rgba(16,185,129,0.18), inset 0 0 20px rgba(16,185,129,0.05);
        }

        .sl-popup.denied .sl-pi {
          border: 2px solid rgba(220,55,55,0.65);
          box-shadow: 0 0 32px rgba(220,55,55,0.18), inset 0 0 20px rgba(220,55,55,0.05);
        }

        .sl-pi::before {
          content: ''; position: absolute; inset: 7px;
          border-radius: 50%; border: 1px solid; opacity: 0.25;
        }

        .sl-popup.granted .sl-pi::before { border-color: #10b981; }
        .sl-popup.denied  .sl-pi::before { border-color: #dc3737; }

        /* Checkmark */
        .sl-check { width: 28px; height: 28px; position: relative; }

        .sl-check::before {
          content: ''; position: absolute;
          left: 1px; top: 12px; width: 9px; height: 2.5px;
          background: #10b981; border-radius: 1px;
          transform: rotate(45deg); transform-origin: left center;
        }

        .sl-check::after {
          content: ''; position: absolute;
          left: 7px; top: 15px; width: 16px; height: 2.5px;
          background: #10b981; border-radius: 1px;
          transform: rotate(-52deg); transform-origin: left center;
        }

        /* X mark */
        .sl-xmark { width: 24px; height: 24px; position: relative; }

        .sl-xmark::before, .sl-xmark::after {
          content: ''; position: absolute;
          width: 24px; height: 2.5px; background: #dc3737;
          top: 50%; left: 0; border-radius: 1px;
          transform-origin: center;
        }

        .sl-xmark::before { transform: translateY(-50%) rotate(45deg); }
        .sl-xmark::after  { transform: translateY(-50%) rotate(-45deg); }

        /* Popup title & sub */
        .sl-popup-title {
          font-family: 'Rajdhani', sans-serif;
          font-size: 36px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          line-height: 1; margin-bottom: 8px;
        }

        .sl-popup.granted .sl-popup-title { color: #10b981; }
        .sl-popup.denied  .sl-popup-title { color: #dc3737; }

        .sl-popup-sub {
          font-family: 'Space Mono', monospace; font-size: 10px;
          letter-spacing: 0.16em; text-transform: uppercase;
        }

        .sl-popup.granted .sl-popup-sub { color: rgba(16,185,129,0.45); }
        .sl-popup.denied  .sl-popup-sub { color: rgba(220,55,55,0.45); }

        /* Progress bar */
        .sl-popup-prog {
          height: 2px; border-radius: 1px;
          margin: 20px auto 0; width: 0;
          animation: sl-prog 1.95s cubic-bezier(0.4,0,0.2,1) forwards;
        }

        .sl-popup.granted .sl-popup-prog {
          background: #10b981;
          box-shadow: 0 0 8px rgba(16,185,129,0.7);
        }

        .sl-popup.denied .sl-popup-prog {
          background: #dc3737;
          box-shadow: 0 0 8px rgba(220,55,55,0.6);
          animation-duration: 3.1s;
        }

        @keyframes sl-prog {
          from { width: 0; }
          to   { width: 130px; }
        }

        /* KEYFRAMES */
        @keyframes sl-up {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes sl-fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        @keyframes sl-spin { to { transform: rotate(360deg); } }

        /* RESPONSIVE */
        @media (max-width: 768px) {
          .sl-root { flex-direction: column; }
          .sl-left { width: 100%; padding: 28px 24px 24px; }
          .sl-title { font-size: 48px; }
          .sl-title-accent { font-size: 54px; }
          .sl-stats { display: none; }
          .sl-divider { display: none; }
          .sl-right { padding: 40px 24px 48px; }
          .sl-input, .sl-btn-wrap, .sl-form-foot { max-width: 100%; }
          .sl-rc { display: none; }
          .sl-popup { padding: 36px 32px 32px; min-width: 260px; }
        }
      `}</style>

      <div className="sl-root">

        {/* LEFT: BRAND */}
        <div className="sl-left">
          <div className="sl-left-grid" />
          <div className="sl-left-glow" />

          <div className="sl-status">
            <div className="sl-status-dot" />
            <span className="sl-status-txt">SYSTEM ONLINE</span>
          </div>

          <div className="sl-brand">
            <div className="sl-eyebrow">Tournament Control</div>
            <h1 className="sl-title">
              Admin
              <span className="sl-title-accent">OPS</span>
            </h1>
            <p className="sl-tagline">
              Real-time match control &<br />tournament management
            </p>
            <div className="sl-stats">
              <div className="sl-stat">
                <span className="sl-stat-val">LIVE</span>
                <span className="sl-stat-lbl">Status</span>
              </div>
              <div className="sl-stat-div" />
              <div className="sl-stat">
                <span className="sl-stat-val">v2.0</span>
                <span className="sl-stat-lbl">Version</span>
              </div>
              <div className="sl-stat-div" />
              <div className="sl-stat">
                <span className="sl-stat-val">IST</span>
                <span className="sl-stat-lbl">Timezone</span>
              </div>
            </div>
          </div>

          <div className="sl-left-foot">
            <div className="sl-left-foot-txt">
              AUTHORIZED PERSONNEL ONLY<br />
              UNAUTHORIZED ACCESS PROHIBITED
            </div>
          </div>
        </div>

        {/* DIVIDER */}
        <div className="sl-divider">
          <div className="sl-notch" />
        </div>

        {/* RIGHT: FORM */}
        <div className="sl-right">
          <div className="sl-right-grid" />
          <div className="sl-right-glow" />

          {/* Corner brackets */}
          <div className="sl-rc tl" />
          <div className="sl-rc tr" />
          <div className="sl-rc bl" />
          <div className="sl-rc br" />

          <div className="sl-time">{mounted ? time : '--:--:--'}</div>

          <div className="sl-form-head">
            <div className="sl-form-title">Sign In</div>
            <div className="sl-form-sub">Enter your admin credentials</div>
          </div>

          <form onSubmit={handleLogin}>
            <div className="sl-fields">
              <div className="sl-field">
                <label className="sl-label">Email Address</label>
                <input
                  type="email" className="sl-input"
                  placeholder="admin@domain.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  required autoComplete="email"
                />
              </div>
              <div className="sl-field">
                <label className="sl-label">Password</label>
                <input
                  type="password" className="sl-input"
                  placeholder="••••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                  required autoComplete="current-password"
                />
              </div>
            </div>

            <div className="sl-btn-wrap">
              <button type="submit" className="sl-btn" disabled={loading}>
                {loading && <span className="sl-spinner" />}
                {loading ? 'Verifying...' : 'Request for Access'}
              </button>
            </div>
          </form>

          <div className="sl-form-foot">
            <span className="sl-form-foot-txt">Secured · Encrypted connection</span>
            <div className="sl-lock">
              <div className="sl-lock-icon">
                <div className="sl-lock-shackle" />
                <div className="sl-lock-body" />
              </div>
              <span className="sl-form-foot-txt">SSL</span>
            </div>
          </div>
        </div>
      </div>

      {/* POPUP */}
      {popup && (
        <div className="sl-overlay">
          <div className="sl-overlay-bg" />
          <div className="sl-overlay-scan" />

          <div className={`sl-popup ${popup}`}>
            <div className="sl-pc" />
            <div className="sl-pc2"><span /><span /></div>

            <div className="sl-pi">
              {popup === 'granted'
                ? <div className="sl-check" />
                : <div className="sl-xmark" />
              }
            </div>

            <div className="sl-popup-title">
              {popup === 'granted' ? 'Access Granted' : 'Access Denied'}
            </div>
            <div className="sl-popup-sub">
              {popup === 'granted'
                ? 'Identity confirmed · Redirecting...'
                : 'Authentication failed · Try again'
              }
            </div>
            <div className="sl-popup-prog" />
          </div>
        </div>
      )}
    </>
  )
}