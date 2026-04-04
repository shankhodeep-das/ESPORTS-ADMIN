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
  const [mounted, setMounted] = useState(false)
  const [time, setTime] = useState('')

  useEffect(() => {
    setMounted(true)
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
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
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Space+Mono:wght@400;700&family=Barlow+Condensed:wght@400;500;600&display=swap');

        .login-root {
          min-height: 100vh;
          background-color: #080a0c;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family: 'Barlow Condensed', sans-serif;
          position: relative;
          overflow: hidden;
        }

        /* Dot grid background */
        .login-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(16,185,129,0.12) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
        }

        /* Radial vignette over grid */
        .login-root::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 70% 70% at 50% 50%, transparent 30%, #080a0c 100%);
          pointer-events: none;
        }

        /* Horizontal scan line animation */
        .scanline {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent 50%, rgba(16,185,129,0.015) 50%);
          background-size: 100% 4px;
          animation: scanmove 8s linear infinite;
          pointer-events: none;
          z-index: 0;
        }

        @keyframes scanmove {
          0% { background-position: 0 0; }
          100% { background-position: 0 100px; }
        }

        /* Top status bar */
        .status-bar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          border-bottom: 1px solid rgba(16,185,129,0.1);
          background: rgba(8,10,12,0.9);
          backdrop-filter: blur(8px);
          z-index: 50;
        }

        .status-bar-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
          animation: pulsedot 2s ease-in-out infinite;
        }

        @keyframes pulsedot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .status-text {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: rgba(16,185,129,0.6);
          letter-spacing: 0.1em;
        }

        .status-time {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: rgba(16,185,129,0.5);
          letter-spacing: 0.12em;
        }

        /* Main card wrapper */
        .card-wrap {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 420px;
          opacity: 0;
          transform: translateY(24px);
          animation: fadeup 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          animation-delay: 0.1s;
        }

        @keyframes fadeup {
          to { opacity: 1; transform: translateY(0); }
        }

        /* Corner accent marks */
        .corner {
          position: absolute;
          width: 16px;
          height: 16px;
        }
        .corner-tl { top: -1px; left: -1px; border-top: 2px solid #10b981; border-left: 2px solid #10b981; }
        .corner-tr { top: -1px; right: -1px; border-top: 2px solid #10b981; border-right: 2px solid #10b981; }
        .corner-bl { bottom: -1px; left: -1px; border-bottom: 2px solid #10b981; border-left: 2px solid #10b981; }
        .corner-br { bottom: -1px; right: -1px; border-bottom: 2px solid #10b981; border-right: 2px solid #10b981; }

        .card {
          background: rgba(10,14,18,0.95);
          border: 1px solid rgba(16,185,129,0.15);
          border-radius: 4px;
          padding: 40px 40px 36px;
          position: relative;
        }

        /* Header */
        .card-header {
          margin-bottom: 36px;
          opacity: 0;
          animation: fadeup 0.5s ease forwards;
          animation-delay: 0.25s;
        }

        .eyebrow {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: #10b981;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .eyebrow::before {
          content: '';
          display: block;
          width: 24px;
          height: 1px;
          background: #10b981;
        }

        .card-title {
          font-family: 'Rajdhani', sans-serif;
          font-size: 36px;
          font-weight: 700;
          color: #f0f4f0;
          line-height: 1;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .card-title span {
          color: #10b981;
        }

        .card-sub {
          font-size: 13px;
          color: rgba(160,180,170,0.5);
          margin-top: 6px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        /* Fields */
        .field-group {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 28px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          opacity: 0;
          animation: fadeup 0.5s ease forwards;
        }

        .field:nth-child(1) { animation-delay: 0.35s; }
        .field:nth-child(2) { animation-delay: 0.45s; }

        .field-label {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: rgba(16,185,129,0.5);
          letter-spacing: 0.18em;
          text-transform: uppercase;
          padding-left: 2px;
        }

        .field-input-wrap {
          position: relative;
        }

        .field-input {
          width: 100%;
          padding: 12px 16px;
          background: rgba(16,185,129,0.04);
          border: 1px solid rgba(16,185,129,0.15);
          border-radius: 3px;
          color: #e8f4ee;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 16px;
          font-weight: 500;
          letter-spacing: 0.04em;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }

        .field-input::placeholder {
          color: rgba(16,185,129,0.2);
          font-family: 'Space Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.06em;
        }

        .field-input:focus {
          border-color: rgba(16,185,129,0.5);
          background: rgba(16,185,129,0.07);
          box-shadow: 0 0 0 3px rgba(16,185,129,0.06), inset 0 0 20px rgba(16,185,129,0.03);
        }

        /* Error */
        .error-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(220,50,50,0.08);
          border: 1px solid rgba(220,50,50,0.2);
          border-radius: 3px;
          padding: 10px 14px;
          margin-bottom: 20px;
          animation: fadeup 0.3s ease forwards;
        }

        .error-icon {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 1.5px solid rgba(220,80,80,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 9px;
          color: rgba(220,80,80,0.9);
          font-family: 'Space Mono', monospace;
          font-weight: 700;
        }

        .error-text {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: rgba(220,100,100,0.9);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        /* Submit button */
        .submit-wrap {
          opacity: 0;
          animation: fadeup 0.5s ease forwards;
          animation-delay: 0.55s;
        }

        .submit-btn {
          width: 100%;
          padding: 14px 24px;
          background: #10b981;
          border: none;
          border-radius: 3px;
          color: #050d09;
          font-family: 'Rajdhani', sans-serif;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
        }

        .submit-btn::before {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 60%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
          transition: left 0.4s ease;
        }

        .submit-btn:hover::before {
          left: 150%;
        }

        .submit-btn:hover {
          background: #0ecf8e;
          box-shadow: 0 0 28px rgba(16,185,129,0.35);
          transform: translateY(-1px);
        }

        .submit-btn:active {
          transform: translateY(1px);
          box-shadow: none;
        }

        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .btn-inner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .btn-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(5,13,9,0.3);
          border-top-color: #050d09;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Footer */
        .card-footer {
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid rgba(16,185,129,0.08);
          display: flex;
          justify-content: space-between;
          align-items: center;
          opacity: 0;
          animation: fadeup 0.5s ease forwards;
          animation-delay: 0.65s;
        }

        .footer-text {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          color: rgba(16,185,129,0.25);
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .footer-ver {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          color: rgba(16,185,129,0.2);
          letter-spacing: 0.1em;
        }

        /* Side decorative lines */
        .deco-line {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          flex-direction: column;
          gap: 6px;
          opacity: 0;
          animation: fadein 1s ease forwards;
          animation-delay: 0.8s;
        }

        @keyframes fadein {
          to { opacity: 1; }
        }

        .deco-line-left { right: calc(100% + 28px); align-items: flex-end; }
        .deco-line-right { left: calc(100% + 28px); align-items: flex-start; }

        .deco-seg {
          height: 1px;
          background: rgba(16,185,129,0.2);
        }

        @media (max-width: 600px) {
          .deco-line { display: none; }
          .card { padding: 32px 24px 28px; }
          .card-title { font-size: 28px; }
          .status-bar { display: none; }
        }
      `}</style>

      {/* Status bar */}
      <div className="status-bar">
        <div className="status-bar-left">
          <div className="status-dot" />
          <span className="status-text">SYSTEM ONLINE</span>
          <span className="status-text" style={{ color: 'rgba(16,185,129,0.3)' }}>·</span>
          <span className="status-text" style={{ color: 'rgba(16,185,129,0.35)' }}>SECURE CONNECTION</span>
        </div>
        <span className="status-time">{mounted ? time : '--:--:--'}</span>
      </div>

      <main className="login-root">
        <div className="scanline" />

        {/* Left deco lines */}
        <div className="deco-line deco-line-left">
          <div className="deco-seg" style={{ width: 48 }} />
          <div className="deco-seg" style={{ width: 80 }} />
          <div className="deco-seg" style={{ width: 32 }} />
          <div className="deco-seg" style={{ width: 64 }} />
          <div className="deco-seg" style={{ width: 24 }} />
        </div>

        <div className="card-wrap">
          <div className="card">
            {/* Corner accents */}
            <div className="corner corner-tl" />
            <div className="corner corner-tr" />
            <div className="corner corner-bl" />
            <div className="corner corner-br" />

            {/* Header */}
            <header className="card-header">
              <div className="eyebrow">Admin Portal</div>
              <h1 className="card-title">
                Control<br /><span>Panel</span>
              </h1>
              <p className="card-sub">Authenticate to access dashboard</p>
            </header>

            {/* Form */}
            <form onSubmit={handleLogin}>
              <div className="field-group">
                <div className="field">
                  <label className="field-label">Email Address</label>
                  <div className="field-input-wrap">
                    <input
                      type="email"
                      className="field-input"
                      placeholder="admin@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="field">
                  <label className="field-label">Password</label>
                  <div className="field-input-wrap">
                    <input
                      type="password"
                      className="field-input"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="error-box">
                  <div className="error-icon">!</div>
                  <span className="error-text">{error}</span>
                </div>
              )}

              <div className="submit-wrap">
                <button type="submit" className="submit-btn" disabled={loading}>
                  <span className="btn-inner">
                    {loading && <span className="btn-spinner" />}
                    {loading ? 'Authenticating...' : 'Authenticate'}
                  </span>
                </button>
              </div>
            </form>

            <div className="card-footer">
              <span className="footer-text">Tournament Ops System</span>
              <span className="footer-ver">v2.0.0</span>
            </div>
          </div>
        </div>

        {/* Right deco lines */}
        <div className="deco-line deco-line-right">
          <div className="deco-seg" style={{ width: 32 }} />
          <div className="deco-seg" style={{ width: 64 }} />
          <div className="deco-seg" style={{ width: 48 }} />
          <div className="deco-seg" style={{ width: 80 }} />
          <div className="deco-seg" style={{ width: 20 }} />
        </div>
      </main>
    </>
  )
}