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
  const [popup, setPopup] = useState(null)

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

        /* ─── ROOT ─── */
        .sl-root {
          min-height: 100vh;
          display: flex;
          background: #07080b;
          font-family: 'Barlow Condensed', sans-serif;
        }

        /* ─── SHARED PANEL BASE ─── */
        .sl-panel {
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 36px 44px;
          isolation: isolate;
        }

        .sl-left  { width: 45%; background: #07090c; }
        .sl-right { flex: 1;   background: #07090b; }

        /* ─── SHARED GRID OVERLAY ─── */
        .sl-grid {
          position: absolute; inset: 0; pointer-events: none; z-index: 0;
          background-image:
            repeating-linear-gradient(0deg,  rgba(16,185,129,0.045) 0px, rgba(16,185,129,0.045) 1px, transparent 1px, transparent 44px),
            repeating-linear-gradient(90deg, rgba(16,185,129,0.032) 0px, rgba(16,185,129,0.032) 1px, transparent 1px, transparent 44px);
        }

        /* ─── LEFT AURORA ORBS (green + purple) ─── */
        .sl-orb { position: absolute; border-radius: 50%; pointer-events: none; z-index: 0; }

        .sl-l-orb1 {
          width: 480px; height: 480px;
          background: radial-gradient(circle, rgba(16,185,129,0.52) 0%, rgba(16,185,129,0.14) 45%, transparent 70%);
          bottom: -160px; left: -120px;
          filter: blur(62px);
          animation: orb-a 9s ease-in-out infinite alternate;
        }

        .sl-l-orb2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(124,58,237,0.48) 0%, rgba(109,40,217,0.14) 50%, transparent 70%);
          top: -130px; right: -90px;
          filter: blur(58px);
          animation: orb-b 11s ease-in-out infinite alternate;
        }

        .sl-l-orb3 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(236,72,153,0.32) 0%, transparent 70%);
          top: 38%; left: 28%;
          filter: blur(52px);
          animation: orb-c 13s ease-in-out infinite alternate;
        }

        .sl-l-orb4 {
          width: 240px; height: 240px;
          background: radial-gradient(circle, rgba(6,182,212,0.36) 0%, transparent 70%);
          top: 18%; left: -50px;
          filter: blur(46px);
          animation: orb-d 7s ease-in-out infinite alternate;
        }

        /* ─── RIGHT AURORA ORBS (green + cyan — subtler) ─── */
        .sl-r-orb1 {
          width: 420px; height: 420px;
          background: radial-gradient(circle, rgba(16,185,129,0.38) 0%, rgba(16,185,129,0.1) 45%, transparent 70%);
          bottom: -140px; right: -110px;
          filter: blur(64px);
          animation: orb-b 10s ease-in-out infinite alternate;
        }

        .sl-r-orb2 {
          width: 360px; height: 360px;
          background: radial-gradient(circle, rgba(6,182,212,0.32) 0%, rgba(14,165,233,0.1) 50%, transparent 70%);
          top: -110px; left: -80px;
          filter: blur(56px);
          animation: orb-a 12s ease-in-out infinite alternate;
        }

        .sl-r-orb3 {
          width: 260px; height: 260px;
          background: radial-gradient(circle, rgba(16,185,129,0.22) 0%, transparent 70%);
          top: 45%; right: 20%;
          filter: blur(48px);
          animation: orb-c 8s ease-in-out infinite alternate;
        }

        @keyframes orb-a {
          from { transform: translate(0,   0)   scale(1);    }
          to   { transform: translate(40px,-55px) scale(1.14); }
        }
        @keyframes orb-b {
          from { transform: translate(0,   0)   scale(1);    }
          to   { transform: translate(-48px,65px) scale(1.18); }
        }
        @keyframes orb-c {
          from { transform: translate(0, 0)    scale(1);    }
          to   { transform: translate(-36px,-44px) scale(1.1); }
        }
        @keyframes orb-d {
          from { transform: translate(0, 0)  scale(1);    }
          to   { transform: translate(28px,56px) scale(1.22); }
        }

        /* ─── NOISE GRAIN ─── */
        .sl-noise {
          position: absolute; inset: 0; z-index: 1; pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.88' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E");
          background-size: 180px 180px;
          mix-blend-mode: overlay; opacity: 0.4;
        }

        /* ─── STATUS BAR ─── */
        .sl-status {
          display: flex; align-items: center; gap: 8px;
          position: relative; z-index: 3;
          opacity: 0; animation: sl-fade 0.5s ease forwards 0.1s;
        }

        .sl-status-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #10b981; box-shadow: 0 0 9px rgba(16,185,129,0.9);
          animation: sl-pulse 2.2s ease-in-out infinite;
        }

        @keyframes sl-pulse {
          0%,100% { opacity:1; box-shadow:0 0 9px rgba(16,185,129,.9); }
          50%      { opacity:.45; box-shadow:0 0 3px rgba(16,185,129,.4); }
        }

        .sl-status-txt {
          font-family: 'Space Mono', monospace; font-size: 10px;
          color: rgba(16,185,129,0.5); letter-spacing: 0.16em;
        }

        /* ─── LEFT GLASS CARD (brand) ─── */
        .sl-glass-card {
          position: relative; z-index: 3;
          background: rgba(255,255,255,0.045);
          border: 1px solid rgba(255,255,255,0.11);
          border-radius: 18px;
          padding: 32px 32px 28px;
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          box-shadow: 0 8px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.09);
          opacity: 0;
          animation: sl-up 0.7s cubic-bezier(0.22,1,0.36,1) forwards 0.22s;
        }

        .sl-glass-card::before {
          content: '';
          position: absolute; top: 0; left: 18px; right: 18px; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        }

        /* ─── RIGHT FORM WRAP — no card, full panel ─── */
        .sl-form-wrap {
          position: relative; z-index: 3;
          display: flex; flex-direction: column; justify-content: center;
          width: 100%; max-width: 420px;
          opacity: 0;
          animation: sl-up 0.7s cubic-bezier(0.22,1,0.36,1) forwards 0.3s;
        }

        /* Thin left accent bar on the form heading */
        .sl-form-accent {
          width: 3px; height: 36px;
          background: linear-gradient(to bottom, #10b981, rgba(16,185,129,0.1));
          border-radius: 2px;
          margin-bottom: 14px;
          box-shadow: 0 0 12px rgba(16,185,129,0.4);
        }

        /* ─── NEON CLOCK ─── */
        .sl-eyebrow {
          font-family: 'Space Mono', monospace; font-size: 10px;
          color: rgba(180,255,215,0.65); letter-spacing: 0.22em;
          text-transform: uppercase; margin-bottom: 14px;
          display: flex; align-items: center; gap: 10px;
        }

        .sl-eyebrow::before {
          content: ''; width: 26px; height: 1px;
          background: rgba(16,185,129,0.55); display: block;
        }

        .sl-title {
          font-family: 'Rajdhani', sans-serif;
          font-size: clamp(52px, 5.5vw, 76px); font-weight: 700;
          line-height: 0.88; letter-spacing: 0.02em;
          text-transform: uppercase; color: #ffffff;
          text-shadow: 0 0 40px rgba(16,185,129,0.25);
        }

        .sl-title-accent {
          display: block; color: #10b981;
          font-size: clamp(58px, 6.5vw, 88px);
          text-shadow: 0 0 30px rgba(16,185,129,0.45);
        }

        .sl-tagline {
          margin-top: 16px; font-size: 13px;
          color: rgba(160,220,190,0.42); letter-spacing: 0.09em;
          text-transform: uppercase; line-height: 1.55;
        }

        .sl-stats { display: flex; gap: 22px; margin-top: 28px; }
        .sl-stat  { display: flex; flex-direction: column; gap: 3px; }

        .sl-stat-val {
          font-family: 'Space Mono', monospace; font-size: 17px;
          font-weight: 700; color: #10b981;
        }

        .sl-stat-lbl {
          font-size: 10px; color: rgba(16,185,129,0.3);
          letter-spacing: 0.14em; text-transform: uppercase;
        }

        .sl-stat-div {
          width: 1px; align-self: stretch;
          background: rgba(255,255,255,0.1);
        }

        /* ─── LEFT FOOTER ─── */
        .sl-left-foot {
          position: relative; z-index: 3;
          opacity: 0; animation: sl-fade 0.5s ease forwards 0.6s;
        }

        .sl-left-foot-txt {
          font-family: 'Space Mono', monospace; font-size: 9px;
          color: rgba(16,185,129,0.18); letter-spacing: 0.13em;
          line-height: 1.9; text-transform: uppercase;
        }

        /* ─── DIVIDER ─── */
        .sl-divider { position: relative; width: 0; flex-shrink: 0; }

        .sl-divider::before {
          content: ''; position: absolute; top: 0; bottom: 0; left: 0; width: 1px;
          background: linear-gradient(to bottom,
            transparent 0%, rgba(16,185,129,0.2) 25%,
            rgba(16,185,129,0.2) 75%, transparent 100%);
        }

        .sl-notch {
          position: absolute; top: 50%; left: -5px;
          width: 10px; height: 10px;
          border: 1px solid rgba(16,185,129,0.3);
          background: #07090c;
          transform: translateY(-50%) rotate(45deg);
        }

        /* ─── RIGHT PANEL INNER ─── */
        .sl-right-inner {
          position: relative; z-index: 3;
          display: flex; flex-direction: column; justify-content: center;
          height: 100%; padding: 20px 0;
        }

        /* ─── NEON SWEEP CLOCK ─── */
        .sl-time {
          position: absolute; top: 28px; right: 40px;
          z-index: 4;
          font-family: 'Space Mono', monospace;
          font-size: 15px; font-weight: 700;
          letter-spacing: 0.18em;
          /* Neon sweep: color shifts left→right→left */
          background: linear-gradient(
            90deg,
            #10b981 0%,
            #06ecb0 30%,
            #ffffff 50%,
            #06ecb0 70%,
            #10b981 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: neon-sweep 2.8s linear infinite;
          filter: drop-shadow(0 0 8px rgba(16,185,129,0.7)) drop-shadow(0 0 18px rgba(16,185,129,0.35));
        }

        @keyframes neon-sweep {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }

        /* ─── FORM HEADING ─── */
        .sl-form-title {
          font-family: 'Rajdhani', sans-serif; font-size: 28px;
          font-weight: 700; color: #ffffff;
          letter-spacing: 0.07em; text-transform: uppercase;
          margin-bottom: 4px;
        }

        .sl-form-sub {
          font-size: 12px; color: rgba(160,220,195,0.38);
          letter-spacing: 0.1em; text-transform: uppercase;
          margin-bottom: 28px;
        }

        /* ─── FIELDS ─── */
        .sl-fields { display: flex; flex-direction: column; gap: 18px; margin-bottom: 22px; }

        .sl-field { display: flex; flex-direction: column; gap: 7px; }

        .sl-label {
          font-family: 'Space Mono', monospace; font-size: 10px;
          color: rgba(16,185,129,0.42); letter-spacing: 0.18em; text-transform: uppercase;
        }

        .sl-input {
          width: 100%;
          padding: 12px 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 6px;
          color: #d8f0e4;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 16px; font-weight: 500; letter-spacing: 0.04em;
          outline: none;
          backdrop-filter: blur(8px);
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }

        .sl-input::placeholder {
          color: rgba(255,255,255,0.18);
          font-family: 'Space Mono', monospace;
          font-size: 11px; letter-spacing: 0.07em;
        }

        .sl-input:focus {
          border-color: rgba(16,185,129,0.55);
          background: rgba(16,185,129,0.07);
          box-shadow: 0 0 0 3px rgba(16,185,129,0.08);
        }

        /* ─── BUTTON ─── */
        .sl-btn {
          width: 100%; padding: 14px 24px; background: #10b981;
          border: none; border-radius: 6px; color: #02110a;
          font-family: 'Rajdhani', sans-serif; font-size: 17px;
          font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase;
          cursor: pointer; display: flex; align-items: center;
          justify-content: center; gap: 10px;
          position: relative; overflow: hidden;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          margin-bottom: 20px;
        }

        .sl-btn::after {
          content: ''; position: absolute; top: 0; left: -100%;
          width: 50%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
          transition: left 0.45s ease;
        }

        .sl-btn:hover::after { left: 160%; }
        .sl-btn:hover { background: #0ecf8e; transform: translateY(-2px); box-shadow: 0 8px 28px rgba(16,185,129,0.38); }
        .sl-btn:active { transform: translateY(0); box-shadow: none; }
        .sl-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none; }

        .sl-spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(2,17,10,0.3); border-top-color: #02110a;
          border-radius: 50%; animation: sl-spin 0.65s linear infinite; flex-shrink: 0;
        }

        /* ─── FOOTER ─── */
        .sl-form-foot {
          display: flex; align-items: center; justify-content: space-between;
          padding-top: 16px;
          border-top: 1px solid rgba(255,255,255,0.07);
        }

        .sl-form-foot-txt {
          font-family: 'Space Mono', monospace; font-size: 9px;
          color: rgba(255,255,255,0.2); letter-spacing: 0.12em; text-transform: uppercase;
        }

        .sl-lock { display: flex; align-items: center; gap: 5px; }

        .sl-lock-icon { width: 10px; height: 12px; position: relative; }

        .sl-lock-body {
          width: 10px; height: 7px;
          background: rgba(255,255,255,0.18);
          border-radius: 1px; position: absolute; bottom: 0;
        }

        .sl-lock-shackle {
          width: 6px; height: 6px;
          border: 1.5px solid rgba(255,255,255,0.18);
          border-bottom: none; border-radius: 3px 3px 0 0;
          position: absolute; top: 0; left: 2px;
        }

        /* ══════════════════════════════════
           POPUP — AURORA GLASSMORPHISM
        ══════════════════════════════════ */

        .sl-overlay {
          position: fixed; inset: 0; z-index: 200;
          display: flex; align-items: center; justify-content: center;
          animation: sl-fade 0.25s ease forwards;
        }

        /* Blurred backdrop */
        .sl-overlay-bg {
          position: absolute; inset: 0;
          background: rgba(3,4,7,0.78);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        /* Moving scanlines across backdrop */
        .sl-overlay-scan {
          position: absolute; inset: 0; pointer-events: none;
          background: repeating-linear-gradient(
            0deg, rgba(255,255,255,0.014) 0px, rgba(255,255,255,0.014) 1px,
            transparent 1px, transparent 3px
          );
          animation: scan-drift 6s linear infinite;
        }

        @keyframes scan-drift {
          from { background-position: 0 0; }
          to   { background-position: 0 60px; }
        }

        /* Popup card — aurora glass */
        .sl-popup {
          position: relative; z-index: 1;
          padding: 52px 64px 48px; text-align: center; min-width: 340px;
          background: rgba(10,14,18,0.72);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          overflow: hidden;
          animation: sl-popup-in 0.45s cubic-bezier(0.22,1,0.36,1) forwards;
        }

        /* Top highlight edge */
        .sl-popup::before {
          content: '';
          position: absolute; top: 0; left: 20px; right: 20px; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
        }

        /* Aurora orb inside popup — granted = green */
        .sl-popup.granted::after {
          content: '';
          position: absolute;
          width: 320px; height: 320px; border-radius: 50%;
          background: radial-gradient(circle, rgba(16,185,129,0.28) 0%, rgba(16,185,129,0.08) 45%, transparent 70%);
          bottom: -130px; left: 50%; transform: translateX(-50%);
          filter: blur(40px);
          pointer-events: none;
          animation: orb-breathe 4s ease-in-out infinite alternate;
        }

        /* Aurora orb inside popup — denied = red */
        .sl-popup.denied::after {
          content: '';
          position: absolute;
          width: 320px; height: 320px; border-radius: 50%;
          background: radial-gradient(circle, rgba(220,55,55,0.28) 0%, rgba(220,55,55,0.08) 45%, transparent 70%);
          bottom: -130px; left: 50%; transform: translateX(-50%);
          filter: blur(40px);
          pointer-events: none;
          animation: orb-breathe 4s ease-in-out infinite alternate;
        }

        /* Secondary top-left orb */
        .sl-popup-orb2 {
          position: absolute; width: 200px; height: 200px; border-radius: 50%;
          top: -80px; left: -60px; pointer-events: none;
          filter: blur(40px);
          animation: orb-breathe 5s ease-in-out infinite alternate-reverse;
        }

        .sl-popup.granted .sl-popup-orb2 {
          background: radial-gradient(circle, rgba(6,182,212,0.2) 0%, transparent 70%);
        }

        .sl-popup.denied .sl-popup-orb2 {
          background: radial-gradient(circle, rgba(200,40,100,0.2) 0%, transparent 70%);
        }

        @keyframes orb-breathe {
          from { opacity: 0.6; transform: translateX(-50%) scale(1); }
          to   { opacity: 1;   transform: translateX(-50%) scale(1.15); }
        }

        @keyframes orb-breathe-tl {
          from { opacity: 0.5; transform: scale(1); }
          to   { opacity: 0.9; transform: scale(1.2); }
        }

        /* Card glow ring */
        .sl-popup.granted { box-shadow: 0 0 0 1px rgba(16,185,129,0.25), 0 16px 60px rgba(16,185,129,0.2), 0 0 100px rgba(16,185,129,0.08); }
        .sl-popup.denied  { box-shadow: 0 0 0 1px rgba(220,55,55,0.25),  0 16px 60px rgba(220,55,55,0.2),  0 0 100px rgba(220,55,55,0.08); }

        /* Popup entrance — scale + blur in */
        @keyframes sl-popup-in {
          0%   { opacity: 0; transform: scale(0.78) translateY(24px); filter: blur(8px); }
          60%  { filter: blur(0px); }
          100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0px); }
        }

        /* ── CORNER BRACKETS ── */
        .sl-pc  { position: absolute; inset: 0; pointer-events: none; }
        .sl-pc2 { position: absolute; inset: 0; pointer-events: none; }

        .sl-pc::before, .sl-pc::after,
        .sl-pc2 span:nth-child(1), .sl-pc2 span:nth-child(2) {
          content: ''; position: absolute;
          width: 28px; height: 28px; display: block;
        }

        .sl-popup.granted .sl-pc::before,
        .sl-popup.granted .sl-pc::after,
        .sl-popup.granted .sl-pc2 span { border-color: rgba(16,185,129,0.8); }

        .sl-popup.denied .sl-pc::before,
        .sl-popup.denied .sl-pc::after,
        .sl-popup.denied .sl-pc2 span { border-color: rgba(220,55,55,0.8); }

        .sl-pc::before { top:0; left:0; border-top:2px solid; border-left:2px solid; border-radius:4px 0 0 0; animation: corner-glow 1.5s ease-in-out infinite alternate; }
        .sl-pc::after  { bottom:0; right:0; border-bottom:2px solid; border-right:2px solid; border-radius:0 0 4px 0; animation: corner-glow 1.5s ease-in-out infinite alternate 0.75s; }
        .sl-pc2 span:nth-child(1) { top:0; right:0; border-top:2px solid; border-right:2px solid; border-radius:0 4px 0 0; animation: corner-glow 1.5s ease-in-out infinite alternate 0.38s; }
        .sl-pc2 span:nth-child(2) { bottom:0; left:0; border-bottom:2px solid; border-left:2px solid; border-radius:0 0 0 4px; animation: corner-glow 1.5s ease-in-out infinite alternate 1.1s; }

        .sl-popup.granted .sl-pc::before,
        .sl-popup.granted .sl-pc::after,
        .sl-popup.granted .sl-pc2 span { animation-name: corner-glow-green; }

        .sl-popup.denied .sl-pc::before,
        .sl-popup.denied .sl-pc::after,
        .sl-popup.denied .sl-pc2 span  { animation-name: corner-glow-red; }

        @keyframes corner-glow-green {
          from { opacity: 0.5; filter: drop-shadow(0 0 2px rgba(16,185,129,0.4)); }
          to   { opacity: 1;   filter: drop-shadow(0 0 6px rgba(16,185,129,0.9)); }
        }

        @keyframes corner-glow-red {
          from { opacity: 0.5; filter: drop-shadow(0 0 2px rgba(220,55,55,0.4)); }
          to   { opacity: 1;   filter: drop-shadow(0 0 6px rgba(220,55,55,0.9)); }
        }

        /* ── ICON RING ── */
        .sl-pi {
          width: 72px; height: 72px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 24px; position: relative; z-index: 1;
        }

        .sl-popup.granted .sl-pi {
          border: 2px solid rgba(16,185,129,0.75);
          box-shadow: 0 0 0 6px rgba(16,185,129,0.06), 0 0 28px rgba(16,185,129,0.3);
          animation: ring-pulse-green 2s ease-in-out infinite;
        }

        .sl-popup.denied .sl-pi {
          border: 2px solid rgba(220,55,55,0.75);
          box-shadow: 0 0 0 6px rgba(220,55,55,0.06), 0 0 28px rgba(220,55,55,0.3);
          animation: ring-pulse-red 2s ease-in-out infinite;
        }

        @keyframes ring-pulse-green {
          0%,100% { box-shadow: 0 0 0 6px rgba(16,185,129,0.06), 0 0 28px rgba(16,185,129,0.3); }
          50%      { box-shadow: 0 0 0 12px rgba(16,185,129,0.03), 0 0 48px rgba(16,185,129,0.5); }
        }

        @keyframes ring-pulse-red {
          0%,100% { box-shadow: 0 0 0 6px rgba(220,55,55,0.06), 0 0 28px rgba(220,55,55,0.3); }
          50%      { box-shadow: 0 0 0 12px rgba(220,55,55,0.03), 0 0 48px rgba(220,55,55,0.5); }
        }

        .sl-pi::before {
          content: ''; position: absolute; inset: 8px;
          border-radius: 50%; border: 1px solid; opacity: 0.2;
        }

        .sl-popup.granted .sl-pi::before { border-color: #10b981; }
        .sl-popup.denied  .sl-pi::before { border-color: #dc3737; }

        /* ── CHECK / X ── */
        .sl-check { width: 30px; height: 30px; position: relative; z-index: 1; }

        .sl-check::before {
          content: ''; position: absolute;
          left: 1px; top: 13px; width: 10px; height: 3px;
          background: #10b981; border-radius: 2px;
          transform: rotate(45deg); transform-origin: left center;
          box-shadow: 0 0 6px rgba(16,185,129,0.8);
          animation: draw-check-1 0.3s ease forwards 0.45s; opacity: 0; transform-origin: left center;
        }

        .sl-check::after {
          content: ''; position: absolute;
          left: 8px; top: 17px; width: 18px; height: 3px;
          background: #10b981; border-radius: 2px;
          transform: rotate(-52deg); transform-origin: left center;
          box-shadow: 0 0 6px rgba(16,185,129,0.8);
          animation: draw-check-2 0.35s ease forwards 0.7s; opacity: 0;
        }

        @keyframes draw-check-1 {
          from { opacity: 0; width: 0; }
          to   { opacity: 1; width: 10px; }
        }

        @keyframes draw-check-2 {
          from { opacity: 0; width: 0; }
          to   { opacity: 1; width: 18px; }
        }

        .sl-xmark { width: 26px; height: 26px; position: relative; z-index: 1; }

        .sl-xmark::before {
          content: ''; position: absolute;
          width: 0; height: 3px; background: #dc3737;
          top: 50%; left: 0; border-radius: 2px;
          transform: translateY(-50%) rotate(45deg); transform-origin: left center;
          box-shadow: 0 0 6px rgba(220,55,55,0.8);
          animation: draw-x 0.3s ease forwards 0.45s;
        }

        .sl-xmark::after {
          content: ''; position: absolute;
          width: 0; height: 3px; background: #dc3737;
          top: 50%; right: 0; border-radius: 2px;
          transform: translateY(-50%) rotate(-45deg); transform-origin: right center;
          box-shadow: 0 0 6px rgba(220,55,55,0.8);
          animation: draw-x 0.3s ease forwards 0.62s;
        }

        @keyframes draw-x {
          from { width: 0; opacity: 0; }
          to   { width: 26px; opacity: 1; }
        }

        /* ── TEXT ── */
        .sl-popup-title {
          font-family: 'Rajdhani', sans-serif; font-size: 38px; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase; line-height: 1;
          margin-bottom: 10px; position: relative; z-index: 1;
          opacity: 0; animation: sl-up 0.4s ease forwards 0.5s;
        }

        .sl-popup.granted .sl-popup-title {
          color: #10b981;
          text-shadow: 0 0 20px rgba(16,185,129,0.5), 0 0 40px rgba(16,185,129,0.2);
        }

        .sl-popup.denied .sl-popup-title {
          color: #e84040;
          text-shadow: 0 0 20px rgba(220,55,55,0.5), 0 0 40px rgba(220,55,55,0.2);
        }

        .sl-popup-sub {
          font-family: 'Space Mono', monospace; font-size: 10px;
          letter-spacing: 0.18em; text-transform: uppercase;
          position: relative; z-index: 1;
          opacity: 0; animation: sl-fade 0.4s ease forwards 0.65s;
        }

        .sl-popup.granted .sl-popup-sub { color: rgba(16,185,129,0.48); }
        .sl-popup.denied  .sl-popup-sub { color: rgba(220,55,55,0.48); }

        /* ── PROGRESS BAR with neon sweep ── */
        .sl-popup-prog {
          height: 2px; border-radius: 1px; margin: 22px auto 0;
          position: relative; z-index: 1; overflow: hidden;
          opacity: 0; animation: sl-fade 0.1s ease forwards 0.8s;
        }

        .sl-popup.granted .sl-popup-prog { background: rgba(16,185,129,0.15); width: 140px; }
        .sl-popup.denied  .sl-popup-prog { background: rgba(220,55,55,0.15);  width: 140px; }

        .sl-popup-prog::after {
          content: ''; position: absolute;
          top: 0; left: -60px; width: 60px; height: 100%;
          border-radius: 1px;
          animation: prog-fill 1.9s cubic-bezier(0.4,0,0.2,1) forwards 0.82s;
        }

        .sl-popup.granted .sl-popup-prog::after {
          background: linear-gradient(90deg, transparent, #10b981, #5fffd4, #10b981);
          box-shadow: 0 0 10px rgba(16,185,129,0.9);
          animation-duration: 1.9s;
        }

        .sl-popup.denied .sl-popup-prog::after {
          background: linear-gradient(90deg, transparent, #dc3737, #ff8080, #dc3737);
          box-shadow: 0 0 10px rgba(220,55,55,0.9);
          animation-duration: 3s;
        }

        @keyframes prog-fill {
          from { left: -60px; }
          to   { left: 140px; }
        }

        /* ─── KEYFRAMES ─── */
        @keyframes sl-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes sl-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes sl-spin  { to { transform: rotate(360deg); } }

        /* ─── RESPONSIVE ─── */
        @media (max-width: 768px) {
          .sl-root { flex-direction: column; }
          .sl-left  { width: 100%; }
          .sl-title { font-size: 48px; }
          .sl-title-accent { font-size: 54px; }
          .sl-stats { display: none; }
          .sl-divider { display: none; }
          .sl-right { padding: 36px 24px 48px; }
          .sl-form-wrap { max-width: 100%; }
          .sl-popup { padding: 36px 28px 32px; min-width: 260px; }
        }
      `}</style>

      <div className="sl-root">

        {/* ════ LEFT PANEL ════ */}
        <div className="sl-panel sl-left">
          <div className="sl-grid" />
          <div className="sl-noise" />

          {/* Aurora orbs — green + purple */}
          <div className="sl-orb sl-l-orb1" />
          <div className="sl-orb sl-l-orb2" />
          <div className="sl-orb sl-l-orb3" />
          <div className="sl-orb sl-l-orb4" />

          {/* Status */}
          <div className="sl-status">
            <div className="sl-status-dot" />
            <span className="sl-status-txt">SYSTEM ONLINE</span>
          </div>

          {/* Glass brand card */}
          <div className="sl-glass-card">
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

          {/* Footer */}
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

        {/* ════ RIGHT PANEL ════ */}
        <div className="sl-panel sl-right" style={{ justifyContent: 'center', padding: '36px 56px' }}>
          <div className="sl-grid" />
          <div className="sl-noise" />

          {/* Aurora orbs — green + cyan */}
          <div className="sl-orb sl-r-orb1" />
          <div className="sl-orb sl-r-orb2" />
          <div className="sl-orb sl-r-orb3" />

          {/* Neon sweep clock */}
          <div className="sl-time">{mounted ? time : '--:--:--'}</div>

          {/* Open form — no card */}
          <div className="sl-form-wrap">
            <div className="sl-form-accent" />
            <div className="sl-form-title">Sign In</div>
            <div className="sl-form-sub">Enter your admin credentials</div>

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

              <button type="submit" className="sl-btn" disabled={loading}>
                {loading && <span className="sl-spinner" />}
                {loading ? 'Verifying...' : 'Request for Access'}
              </button>
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
      </div>

      {/* ════ POPUP ════ */}
      {popup && (
        <div className="sl-overlay">
          <div className="sl-overlay-bg" />
          <div className="sl-overlay-scan" />

          <div className={`sl-popup ${popup}`}>
            <div className="sl-pc" />
            <div className="sl-pc2"><span /><span /></div>
            <div className="sl-popup-orb2" />

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