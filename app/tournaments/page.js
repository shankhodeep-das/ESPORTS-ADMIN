'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Tournaments() {
  const router = useRouter()
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  useEffect(() => { fetchTournaments() }, [])

  async function fetchTournaments() {
    const { data, error } = await supabase
      .from('tournaments').select('*').order('created_at', { ascending: false })
    if (error) console.log(error)
    else setTournaments(data || [])
    setLoading(false)
  }

  async function deleteTournament(id) {
    setDeletingId(id)
    await supabase.from('tournaments').delete().eq('id', id)
    setDeletingId(null)
    setConfirmId(null)
    fetchTournaments()
  }

  const activeCount   = tournaments.filter(t => t.status === 'active').length
  const inactiveCount = tournaments.filter(t => t.status !== 'active').length

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Space+Mono:wght@400;700&family=Barlow+Condensed:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        /* ══ ROOT ══ */
        .tr-root {
          min-height:100vh; background:#060709;
          font-family:'Barlow Condensed',sans-serif;
          color:#e8f4ee; position:relative;
          overflow-x:hidden; isolation:isolate;
        }

        /* ══ AURORA ORBS ══ */
        .tr-orb { position:fixed; border-radius:50%; pointer-events:none; z-index:0; }

        .tr-o1 { width:680px; height:680px; background:radial-gradient(circle,rgba(16,185,129,0.2) 0%,transparent 65%); top:-240px; left:-170px; filter:blur(62px); animation:toa 15s ease-in-out infinite alternate; }
        .tr-o2 { width:540px; height:540px; background:radial-gradient(circle,rgba(124,58,237,0.17) 0%,transparent 65%); top:-120px; right:-140px; filter:blur(60px); animation:tob 18s ease-in-out infinite alternate; }
        .tr-o3 { width:400px; height:400px; background:radial-gradient(circle,rgba(245,200,66,0.1) 0%,transparent 65%); bottom:20%; left:10%; filter:blur(55px); animation:toc 12s ease-in-out infinite alternate; }
        .tr-o4 { width:460px; height:460px; background:radial-gradient(circle,rgba(16,185,129,0.13) 0%,transparent 65%); bottom:-130px; right:-90px; filter:blur(58px); animation:tod 10s ease-in-out infinite alternate; }
        .tr-o5 { width:280px; height:280px; background:radial-gradient(circle,rgba(236,72,153,0.09) 0%,transparent 65%); top:45%; left:50%; filter:blur(50px); animation:toa 11s ease-in-out infinite alternate-reverse; }

        @keyframes toa { from{transform:translate(0,0) scale(1)} to{transform:translate(55px,-70px) scale(1.14)} }
        @keyframes tob { from{transform:translate(0,0) scale(1)} to{transform:translate(-65px,80px) scale(1.2)} }
        @keyframes toc { from{transform:translate(0,0) scale(1)} to{transform:translate(45px,-55px) scale(1.1)} }
        @keyframes tod { from{transform:translate(0,0) scale(1)} to{transform:translate(-40px,60px) scale(1.18)} }

        .tr-grid { position:fixed; inset:0; pointer-events:none; z-index:0; background-image:repeating-linear-gradient(0deg,rgba(16,185,129,0.032) 0px,rgba(16,185,129,0.032) 1px,transparent 1px,transparent 44px),repeating-linear-gradient(90deg,rgba(16,185,129,0.024) 0px,rgba(16,185,129,0.024) 1px,transparent 1px,transparent 44px); }
        .tr-noise { position:fixed; inset:0; pointer-events:none; z-index:0; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.88' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E"); background-size:180px 180px; mix-blend-mode:overlay; opacity:0.35; }

        /* ══ CONTENT ══ */
        .tr-content { position:relative; z-index:2; padding:22px 26px 60px; }

        /* ══ TOPBAR ══ */
        .tr-topbar {
          display:flex; align-items:center; justify-content:space-between;
          padding:10px 18px;
          background:rgba(255,255,255,0.04);
          border:1px solid rgba(255,255,255,0.08);
          border-radius:10px; backdrop-filter:blur(20px);
          -webkit-backdrop-filter:blur(20px);
          margin-bottom:24px; position:relative; overflow:hidden;
          opacity:0; animation:trup 0.5s ease forwards 0.05s;
        }
        .tr-topbar::before { content:''; position:absolute; top:0; left:20px; right:20px; height:1px; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent); }

        .tr-back {
          display:flex; align-items:center; gap:8px;
          font-family:'Space Mono',monospace; font-size:10px;
          color:rgba(16,185,129,0.45); letter-spacing:0.14em; text-transform:uppercase;
          text-decoration:none; transition:color 0.2s;
        }
        .tr-back:hover { color:rgba(16,185,129,0.85); }
        .tr-back-arr { font-size:13px; transition:transform 0.2s; }
        .tr-back:hover .tr-back-arr { transform:translateX(-3px); }

        .tr-new-btn {
          display:inline-flex; align-items:center; gap:7px;
          padding:8px 20px; border-radius:6px;
          background:#10b981; color:#021a0e;
          font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:600;
          letter-spacing:0.1em; text-transform:uppercase; cursor:pointer; border:none;
          position:relative; overflow:hidden;
          transition:background 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow:0 4px 18px rgba(16,185,129,0.3); text-decoration:none;
        }
        .tr-new-btn::after { content:''; position:absolute; top:0; left:-100%; width:50%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent); transition:left 0.4s; }
        .tr-new-btn:hover::after { left:160%; }
        .tr-new-btn:hover { background:#0ecf8e; transform:translateY(-2px); box-shadow:0 8px 26px rgba(16,185,129,0.4); }

        /* ══ HEADER ══ */
        .tr-header {
          margin-bottom:28px;
          opacity:0; animation:trup 0.6s ease forwards 0.12s;
        }

        .tr-eyebrow { font-family:'Space Mono',monospace; font-size:10px; color:rgba(16,185,129,0.4); letter-spacing:0.22em; text-transform:uppercase; margin-bottom:6px; display:flex; align-items:center; gap:10px; }
        .tr-eyebrow::before { content:''; width:22px; height:1px; background:rgba(16,185,129,0.38); display:block; }

        .tr-page-title { font-family:'Rajdhani',sans-serif; font-size:48px; font-weight:700; line-height:0.9; letter-spacing:0.04em; text-transform:uppercase; color:#fff; }
        .tr-page-title span { color:#10b981; text-shadow:0 0 28px rgba(16,185,129,0.45); }

        /* ══ STAT ROW ══ */
        .tr-stats {
          display:grid; grid-template-columns:repeat(3,1fr); gap:12px;
          margin-bottom:28px; max-width:600px;
          opacity:0; animation:trup 0.5s ease forwards 0.2s;
        }

        .tr-stat {
          position:relative; overflow:hidden;
          background:rgba(255,255,255,0.05);
          border:1px solid rgba(255,255,255,0.1);
          border-radius:12px; padding:18px 20px;
          backdrop-filter:blur(22px); -webkit-backdrop-filter:blur(22px);
          box-shadow:0 4px 28px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08);
        }
        .tr-stat::before { content:''; position:absolute; top:0; left:14px; right:14px; height:1px; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent); }

        .tr-stat-orb { position:absolute; width:100px; height:100px; border-radius:50%; bottom:-40px; right:-30px; filter:blur(28px); pointer-events:none; }
        .tr-stat-glow { position:absolute; bottom:0; left:0; right:0; height:2px; border-radius:0 0 12px 12px; }

        .tr-stat-lbl { font-family:'Space Mono',monospace; font-size:9px; color:rgba(160,200,175,0.38); letter-spacing:0.18em; text-transform:uppercase; margin-bottom:8px; position:relative; z-index:1; }
        .tr-stat-val { font-family:'Rajdhani',sans-serif; font-size:38px; font-weight:700; line-height:1; position:relative; z-index:1; }
        .tr-stat-val.white  { color:#e8f4ee; }
        .tr-stat-val.green  { color:#10b981; text-shadow:0 0 22px rgba(16,185,129,0.45); }
        .tr-stat-val.muted  { color:rgba(160,180,170,0.45); }

        /* ══ SECTION HEAD ══ */
        .tr-sec-head {
          display:flex; align-items:center; justify-content:space-between;
          margin-bottom:14px;
          opacity:0; animation:trup 0.5s ease forwards 0.28s;
        }
        .tr-sec-title { font-family:'Space Mono',monospace; font-size:10px; color:rgba(16,185,129,0.42); letter-spacing:0.2em; text-transform:uppercase; display:flex; align-items:center; gap:10px; }
        .tr-sec-title::before { content:''; width:18px; height:1px; background:rgba(16,185,129,0.32); display:block; }
        .tr-sec-count { font-family:'Space Mono',monospace; font-size:9px; color:rgba(16,185,129,0.22); letter-spacing:0.12em; }

        /* ══ TOURNAMENT CARDS ══ */
        .tr-list { display:flex; flex-direction:column; gap:10px; }

        .tr-card {
          position:relative; overflow:hidden;
          background:rgba(255,255,255,0.052);
          border:1px solid rgba(255,255,255,0.1);
          border-radius:14px; padding:20px 22px;
          backdrop-filter:blur(22px); -webkit-backdrop-filter:blur(22px);
          box-shadow:0 4px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08);
          display:flex; align-items:center; justify-content:space-between; gap:16px;
          transition:all 0.25s;
          opacity:0; animation:trup 0.5s ease forwards;
        }

        .tr-card::before { content:''; position:absolute; top:0; left:18px; right:18px; height:1px; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent); }

        .tr-card:hover { background:rgba(255,255,255,0.072); border-color:rgba(16,185,129,0.22); transform:translateX(5px); box-shadow:0 8px 38px rgba(0,0,0,0.36), inset 0 1px 0 rgba(255,255,255,0.1); }

        /* left status bar */
        .tr-card-bar { position:absolute; left:0; top:0; bottom:0; width:3px; border-radius:14px 0 0 14px; }
        .tr-card-bar.active   { background:#10b981; box-shadow:2px 0 12px rgba(16,185,129,0.55); }
        .tr-card-bar.inactive { background:rgba(255,255,255,0.1); }

        /* inner orb */
        .tr-card-orb { position:absolute; width:180px; height:180px; border-radius:50%; right:-60px; top:50%; transform:translateY(-50%); filter:blur(36px); pointer-events:none; opacity:0.55; }

        /* Index watermark */
        .tr-card-wm { position:absolute; right:10px; bottom:-14px; font-family:'Rajdhani',sans-serif; font-size:80px; font-weight:700; color:rgba(16,185,129,0.04); line-height:1; pointer-events:none; letter-spacing:-0.03em; user-select:none; }

        .tr-card-left { display:flex; flex-direction:column; gap:5px; position:relative; z-index:1; flex:1; min-width:0; }

        .tr-card-name { font-family:'Rajdhani',sans-serif; font-size:22px; font-weight:700; color:#fff; letter-spacing:0.04em; text-transform:uppercase; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

        .tr-card-meta { display:flex; align-items:center; gap:10px; }
        .tr-card-game { font-family:'Space Mono',monospace; font-size:9px; color:rgba(160,200,175,0.4); letter-spacing:0.12em; text-transform:uppercase; }

        .tr-card-right { display:flex; align-items:center; gap:10px; position:relative; z-index:1; flex-shrink:0; }

        /* Status pill */
        .tr-pill { font-family:'Space Mono',monospace; font-size:9px; font-weight:700; letter-spacing:0.14em; text-transform:uppercase; padding:5px 12px; border-radius:4px; }
        .tr-pill.active   { background:rgba(16,185,129,0.14); color:#10b981; border:1px solid rgba(16,185,129,0.32); }
        .tr-pill.inactive { background:rgba(255,255,255,0.05); color:rgba(160,180,170,0.45); border:1px solid rgba(255,255,255,0.08); }

        /* Open button */
        .tr-open-btn {
          display:inline-flex; align-items:center; gap:6px;
          padding:8px 18px; border-radius:6px;
          background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.28);
          color:#10b981; font-family:'Barlow Condensed',sans-serif; font-size:13px;
          font-weight:600; letter-spacing:0.1em; text-transform:uppercase;
          text-decoration:none; cursor:pointer; transition:all 0.2s;
          backdrop-filter:blur(8px);
        }
        .tr-open-btn:hover { background:rgba(16,185,129,0.2); border-color:rgba(16,185,129,0.55); box-shadow:0 0 18px rgba(16,185,129,0.2); transform:translateY(-1px); }
        .tr-open-arr { transition:transform 0.2s; }
        .tr-open-btn:hover .tr-open-arr { transform:translateX(3px); }

        /* Delete button */
        .tr-del-btn {
          display:inline-flex; align-items:center; justify-content:center;
          width:36px; height:36px; border-radius:6px;
          background:rgba(232,64,64,0.08); border:1px solid rgba(232,64,64,0.18);
          color:rgba(232,64,64,0.55); cursor:pointer; transition:all 0.2s;
          font-size:14px; flex-shrink:0;
        }
        .tr-del-btn:hover { background:rgba(232,64,64,0.16); border-color:rgba(232,64,64,0.4); color:#e84040; box-shadow:0 0 14px rgba(232,64,64,0.18); }

        /* Confirm delete inline */
        .tr-confirm-wrap { display:flex; align-items:center; gap:8px; position:relative; z-index:1; flex-shrink:0; }
        .tr-confirm-txt { font-family:'Space Mono',monospace; font-size:9px; color:rgba(232,64,64,0.7); letter-spacing:0.1em; text-transform:uppercase; white-space:nowrap; }
        .tr-confirm-yes {
          padding:6px 12px; border-radius:5px; cursor:pointer; border:none;
          background:rgba(232,64,64,0.18); color:#e84040; border:1px solid rgba(232,64,64,0.35);
          font-family:'Space Mono',monospace; font-size:9px; letter-spacing:0.1em;
          text-transform:uppercase; transition:all 0.2s;
        }
        .tr-confirm-yes:hover { background:rgba(232,64,64,0.28); }
        .tr-confirm-no {
          padding:6px 12px; border-radius:5px; cursor:pointer; border:none;
          background:rgba(255,255,255,0.05); color:rgba(160,180,170,0.5); border:1px solid rgba(255,255,255,0.08);
          font-family:'Space Mono',monospace; font-size:9px; letter-spacing:0.1em;
          text-transform:uppercase; transition:all 0.2s;
        }
        .tr-confirm-no:hover { background:rgba(255,255,255,0.09); color:#e8f4ee; }

        /* Deleting spinner */
        .tr-del-spin { width:14px; height:14px; border:2px solid rgba(232,64,64,0.2); border-top:2px solid #e84040; border-radius:50%; animation:trspin 0.7s linear infinite; flex-shrink:0; }
        @keyframes trspin { to { transform:rotate(360deg); } }

        /* Empty state */
        .tr-empty { text-align:center; padding:70px 20px; background:rgba(255,255,255,0.03); border:1px dashed rgba(16,185,129,0.14); border-radius:14px; backdrop-filter:blur(12px); }
        .tr-empty-title { font-family:'Rajdhani',sans-serif; font-size:36px; font-weight:700; color:rgba(16,185,129,0.12); letter-spacing:0.1em; text-transform:uppercase; margin-bottom:10px; }
        .tr-empty-txt { font-family:'Space Mono',monospace; font-size:10px; color:rgba(16,185,129,0.22); letter-spacing:0.16em; text-transform:uppercase; }

        /* Skeleton */
        .tr-skel { height:76px; border-radius:14px; margin-bottom:10px; background:linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; }
        @keyframes shimmer { from{background-position:200% center} to{background-position:-200% center} }

        /* Keyframes */
        @keyframes trup { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }

        /* Responsive */
        @media (max-width:700px) {
          .tr-content { padding:16px 14px 48px; }
          .tr-stats { grid-template-columns:repeat(2,1fr); }
          .tr-page-title { font-size:36px; }
          .tr-card { flex-direction:column; align-items:flex-start; }
          .tr-card-right { width:100%; justify-content:flex-end; }
        }
      `}</style>

      <div className="tr-root">
        <div className="tr-grid" />
        <div className="tr-noise" />
        <div className="tr-orb tr-o1" />
        <div className="tr-orb tr-o2" />
        <div className="tr-orb tr-o3" />
        <div className="tr-orb tr-o4" />
        <div className="tr-orb tr-o5" />

        <div className="tr-content">

          {/* ── TOPBAR ── */}
          <div className="tr-topbar">
            <Link href="/dashboard" className="tr-back">
              <span className="tr-back-arr">←</span>
              Back to Dashboard
            </Link>
            <Link href="/tournaments/create" className="tr-new-btn">
              + New Tournament
            </Link>
          </div>

          {/* ── HEADER ── */}
          <div className="tr-header">
            <div className="tr-eyebrow">Tournament Hub</div>
            <h1 className="tr-page-title">
              All <span>Tournaments</span>
            </h1>
          </div>

          {/* ── STAT CARDS ── */}
          <div className="tr-stats">
            <div className="tr-stat">
              <div className="tr-stat-orb" style={{ background:'radial-gradient(circle,rgba(16,185,129,0.32) 0%,transparent 70%)' }} />
              <div className="tr-stat-glow" style={{ background:'linear-gradient(90deg,transparent,rgba(16,185,129,0.5),transparent)' }} />
              <div className="tr-stat-lbl">Total</div>
              <div className="tr-stat-val white">{tournaments.length}</div>
            </div>

            <div className="tr-stat">
              <div className="tr-stat-orb" style={{ background:'radial-gradient(circle,rgba(16,185,129,0.3) 0%,transparent 70%)' }} />
              <div className="tr-stat-glow" style={{ background:'linear-gradient(90deg,transparent,rgba(16,185,129,0.48),transparent)' }} />
              <div className="tr-stat-lbl">Active</div>
              <div className="tr-stat-val green">{activeCount}</div>
            </div>

            <div className="tr-stat">
              <div className="tr-stat-orb" style={{ background:'radial-gradient(circle,rgba(160,180,170,0.15) 0%,transparent 70%)' }} />
              <div className="tr-stat-glow" style={{ background:'linear-gradient(90deg,transparent,rgba(160,180,170,0.2),transparent)' }} />
              <div className="tr-stat-lbl">Inactive</div>
              <div className="tr-stat-val muted">{inactiveCount}</div>
            </div>
          </div>

          {/* ── LIST ── */}
          <div className="tr-sec-head">
            <div className="tr-sec-title">All Tournaments</div>
            <div className="tr-sec-count">{tournaments.length} total</div>
          </div>

          {loading && (
            <div>
              <div className="tr-skel" />
              <div className="tr-skel" style={{ opacity:0.65 }} />
              <div className="tr-skel" style={{ opacity:0.35 }} />
            </div>
          )}

          {!loading && tournaments.length === 0 && (
            <div className="tr-empty">
              <div className="tr-empty-title">No Tournaments Yet</div>
              <div className="tr-empty-txt">Create your first tournament to get started</div>
            </div>
          )}

          {!loading && (
            <div className="tr-list">
              {tournaments.map((t, i) => {
                const isActive = t.status === 'active'
                const orbColors = [
                  'rgba(16,185,129,0.14)', 'rgba(124,58,237,0.12)',
                  'rgba(6,182,212,0.12)',  'rgba(245,200,66,0.11)',
                  'rgba(236,72,153,0.1)',  'rgba(16,185,129,0.12)',
                ]
                const orbColor = orbColors[i % orbColors.length]

                return (
                  <div
                    key={t.id}
                    className="tr-card"
                    style={{ animationDelay:`${0.32 + i * 0.06}s` }}
                  >
                    {/* Left bar */}
                    <div className={`tr-card-bar ${isActive ? 'active' : 'inactive'}`} />

                    {/* Inner orb */}
                    <div className="tr-card-orb" style={{ background:`radial-gradient(circle,${orbColor} 0%,transparent 70%)` }} />

                    {/* Index watermark */}
                    <div className="tr-card-wm">{String(i + 1).padStart(2,'0')}</div>

                    {/* Left info */}
                    <div className="tr-card-left">
                      <div className="tr-card-name">{t.name}</div>
                      <div className="tr-card-meta">
                        <span className="tr-card-game">{t.game}</span>
                      </div>
                    </div>

                    {/* Right actions */}
                    {confirmId === t.id ? (
                      <div className="tr-confirm-wrap">
                        <span className="tr-confirm-txt">Delete?</span>
                        <button
                          onClick={() => deleteTournament(t.id)}
                          disabled={deletingId === t.id}
                          className="tr-confirm-yes"
                        >
                          {deletingId === t.id ? <span className="tr-del-spin" /> : 'Yes'}
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          className="tr-confirm-no"
                        >No</button>
                      </div>
                    ) : (
                      <div className="tr-card-right">
                        <div className={`tr-pill ${isActive ? 'active' : 'inactive'}`}>
                          {t.status.toUpperCase()}
                        </div>
                        <Link href={`/tournaments/${t.id}`} className="tr-open-btn">
                          Open <span className="tr-open-arr">→</span>
                        </Link>
                        <button
                          onClick={() => setConfirmId(t.id)}
                          className="tr-del-btn"
                          title="Delete tournament"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

        </div>
      </div>
    </>
  )
}