'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [time, setTime] = useState('')
  const [mounted, setMounted] = useState(false)

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
    setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Invalid credentials. Access denied.')
      setLoading(false)
      return
    }
    if (data.session) {
      document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=3600`
    }
    router.push('/dashboard')
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Space+Mono:wght@400;700&family=Barlow+Condensed:ital,wght@0,400;0,500;0,600;1,400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .sl-root {
          min-height: 100vh;
          display: flex;
          background: #06080a;
          font-family: 'Barlow Condensed', sans-serif;
        }

        /* ── LEFT PANEL ── */
        .sl-left {
          width: 45%;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 40px 44px;
          overflow: hidden;
          background: #07100d;
        }

        /* Vertical scanline grid */
        .sl-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            repeating-linear-gradient(0deg, rgba(16,185,129,0.06) 0px, rgba(16,185,129,0.06) 1px, transparent 1px, transparent 40px),
            repeating-linear-gradient(90deg, rgba(16,185,129,0.04) 0px, rgba(16,185,129,0.04) 1px, transparent 1px, transparent 40px);
          pointer-events: none;
        }

        /* Radial glow from bottom-left */
        .sl-left::after {
          content: '';
          position: absolute;
          bottom: -120px;
          left: -80px;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 65%);
          pointer-events: none;
        }

        /* Top-left status */
        .sl-status {
          display: flex;
          align-items: center;
          gap: 8px;
          z-index: 1;
          opacity: 0;
          animation: sl-fade 0.6s ease forwards;
          animation-delay: 0.1s;
        }

        .sl-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 10px #10b981;
          animation: sl-pulse 2s ease-in-out infinite;
        }

        @keyframes sl-pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 10px #10b981; }
          50% { opacity: 0.5; box-shadow: 0 0 4px #10b981; }
        }

        .sl-status-txt {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: rgba(16,185,129,0.5);
          letter-spacing: 0.15em;
        }

        /* Center brand block */
        .sl-brand {
          z-index: 1;
          opacity: 0;
          animation: sl-up 0.7s cubic-bezier(0.22,1,0.36,1) forwards;
          animation-delay: 0.2s;
        }

        .sl-eyebrow {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: rgba(16,185,129,0.45);
          letter-spacing: 0.22em;
          text-transform: uppercase;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sl-eyebrow::before {
          content: '';
          display: block;
          width: 28px;
          height: 1px;
          background: rgba(16,185,129,0.4);
        }

        .sl-title {
          font-family: 'Rajdhani', sans-serif;
          font-size: clamp(52px, 6vw, 80px);
          font-weight: 700;
          line-height: 0.9;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          color: #e8f4ee;
        }

        .sl-title-accent {
          display: block;
          color: #10b981;
          font-size: clamp(56px, 7vw, 92px);
        }

        .sl-tagline {
          margin-top: 20px;
          font-size: 14px;
          color: rgba(160,200,180,0.4);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          line-height: 1.5;
          max-width: 260px;
        }

        /* Stat row */
        .sl-stats {
          display: flex;
          gap: 28px;
          margin-top: 36px;
          z-index: 1;
        }

        .sl-stat {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .sl-stat-val {
          font-family: 'Space Mono', monospace;
          font-size: 22px;
          font-weight: 700;
          color: #10b981;
          letter-spacing: -0.02em;
        }

        .sl-stat-lbl {
          font-size: 10px;
          color: rgba(16,185,129,0.3);
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .sl-stat-div {
          width: 1px;
          background: rgba(16,185,129,0.15);
          align-self: stretch;
        }

        /* Bottom left meta */
        .sl-left-foot {
          z-index: 1;
          opacity: 0;
          animation: sl-fade 0.6s ease forwards;
          animation-delay: 0.6s;
        }

        .sl-left-foot-txt {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          color: rgba(16,185,129,0.2);
          letter-spacing: 0.12em;
          line-height: 1.8;
        }

        /* Diagonal separator */
        .sl-divider {
          position: relative;
          width: 0;
          flex-shrink: 0;
        }

        .sl-divider::before {
          content: '';
          position: absolute;
          top: 0; bottom: 0;
          left: 0;
          width: 1px;
          background: linear-gradient(to bottom, transparent, rgba(16,185,129,0.25) 30%, rgba(16,185,129,0.25) 70%, transparent);
        }

        /* Notch on divider */
        .sl-notch {
          position: absolute;
          top: 50%;
          left: -5px;
          transform: translateY(-50%);
          width: 10px;
          height: 10px;
          border: 1px solid rgba(16,185,129,0.4);
          background: #07100d;
          transform: translateY(-50%) rotate(45deg);
        }

        /* ── RIGHT PANEL ── */
        .sl-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px 56px;
          position: relative;
          background: #06080a;
        }

        .sl-right::before {
          content: '';
          position: absolute;
          top: 0; right: 0;
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%);
          pointer-events: none;
        }

        /* Time top-right */
        .sl-time {
          position: absolute;
          top: 28px;
          right: 40px;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: rgba(16,185,129,0.3);
          letter-spacing: 0.12em;
        }

        /* Form heading */
        .sl-form-head {
          margin-bottom: 36px;
          opacity: 0;
          animation: sl-up 0.6s ease forwards;
          animation-delay: 0.3s;
        }

        .sl-form-title {
          font-family: 'Rajdhani', sans-serif;
          font-size: 28px;
          font-weight: 700;
          color: #e8f4ee;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .sl-form-sub {
          font-size: 12px;
          color: rgba(130,160,145,0.5);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-top: 4px;
        }

        /* Fields */
        .sl-fields {
          display: flex;
          flex-direction: column;
          gap: 22px;
          margin-bottom: 28px;
        }

        .sl-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
          opacity: 0;
          animation: sl-up 0.5s ease forwards;
        }

        .sl-field:nth-child(1) { animation-delay: 0.4s; }
        .sl-field:nth-child(2) { animation-delay: 0.5s; }

        .sl-label {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: rgba(16,185,129,0.45);
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .sl-input {
          width: 100%;
          padding: 13px 18px;
          background: rgba(16,185,129,0.03);
          border: 1px solid rgba(16,185,129,0.12);
          border-radius: 2px;
          color: #d4ede2;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 16px;
          font-weight: 500;
          letter-spacing: 0.05em;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          max-width: 380px;
        }

        .sl-input::placeholder {
          color: rgba(16,185,129,0.18);
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.08em;
        }

        .sl-input:focus {
          border-color: rgba(16,185,129,0.45);
          background: rgba(16,185,129,0.06);
          box-shadow: 0 0 0 3px rgba(16,185,129,0.05);
        }

        /* Error */
        .sl-error {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: rgba(200,40,40,0.07);
          border: 1px solid rgba(200,60,60,0.2);
          border-radius: 2px;
          margin-bottom: 20px;
          max-width: 380px;
        }

        .sl-error-bar {
          width: 3px;
          height: 32px;
          background: rgba(200,60,60,0.5);
          border-radius: 2px;
          flex-shrink: 0;
        }

        .sl-error-txt {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: rgba(210,90,90,0.9);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        /* Button */
        .sl-btn-wrap {
          opacity: 0;
          animation: sl-up 0.5s ease forwards;
          animation-delay: 0.6s;
          max-width: 380px;
        }

        .sl-btn {
          width: 100%;
          padding: 15px 24px;
          background: #10b981;
          border: none;
          border-radius: 2px;
          color: #041a0e;
          font-family: 'Rajdhani', sans-serif;
          font-size: 17px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .sl-btn::after {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent);
          transition: left 0.45s ease;
        }

        .sl-btn:hover::after { left: 160%; }

        .sl-btn:hover {
          background: #0ecf8e;
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(16,185,129,0.3);
        }

        .sl-btn:active { transform: translateY(0); box-shadow: none; }
        .sl-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none; }

        .sl-spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(4,26,14,0.3);
          border-top-color: #041a0e;
          border-radius: 50%;
          animation: sl-spin 0.7s linear infinite;
          flex-shrink: 0;
        }

        /* Footer */
        .sl-form-foot {
          margin-top: 32px;
          padding-top: 20px;
          border-top: 1px solid rgba(16,185,129,0.07);
          max-width: 380px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          opacity: 0;
          animation: sl-fade 0.6s ease forwards;
          animation-delay: 0.75s;
        }

        .sl-form-foot-txt {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          color: rgba(16,185,129,0.2);
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .sl-lock {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .sl-lock-icon {
          width: 10px;
          height: 11px;
          position: relative;
        }

        .sl-lock-body {
          width: 10px;
          height: 7px;
          background: rgba(16,185,129,0.2);
          border-radius: 1px;
          position: absolute;
          bottom: 0;
        }

        .sl-lock-shackle {
          width: 6px;
          height: 5px;
          border: 1.5px solid rgba(16,185,129,0.2);
          border-bottom: none;
          border-radius: 3px 3px 0 0;
          position: absolute;
          top: 0;
          left: 2px;
        }

        /* Keyframes */
        @keyframes sl-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes sl-fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        @keyframes sl-spin {
          to { transform: rotate(360deg); }
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .sl-root { flex-direction: column; }
          .sl-left {
            width: 100%;
            padding: 32px 28px 28px;
            min-height: auto;
          }
          .sl-title { font-size: 48px; }
          .sl-title-accent { font-size: 54px; }
          .sl-stats { display: none; }
          .sl-divider { display: none; }
          .sl-right { padding: 36px 28px 48px; }
          .sl-input, .sl-btn-wrap, .sl-form-foot, .sl-error { max-width: 100%; }
        }
      `}</style>

      <div className="sl-root">

        {/* ── LEFT: BRAND ── */}
        <div className="sl-left">

          {/* Top status */}
          <div className="sl-status">
            <div className="sl-status-dot" />
            <span className="sl-status-txt">SYSTEM ONLINE</span>
          </div>

          {/* Center brand */}
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

          {/* Bottom meta */}
          <div className="sl-left-foot">
            <div className="sl-left-foot-txt">
              AUTHORIZED PERSONNEL ONLY<br />
              UNAUTHORIZED ACCESS PROHIBITED
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="sl-divider">
          <div className="sl-notch" />
        </div>

        {/* ── RIGHT: FORM ── */}
        <div className="sl-right">

          {/* Live clock */}
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
                  type="email"
                  className="sl-input"
                  placeholder="admin@domain.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="sl-field">
                <label className="sl-label">Password</label>
                <input
                  type="password"
                  className="sl-input"
                  placeholder="••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div className="sl-error">
                <div className="sl-error-bar" />
                <span className="sl-error-txt">{error}</span>
              </div>
            )}

            <div className="sl-btn-wrap">
              <button type="submit" className="sl-btn" disabled={loading}>
                {loading && <span className="sl-spinner" />}
                {loading ? 'Authenticating...' : 'Access Dashboard'}
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
    </>
  )
}