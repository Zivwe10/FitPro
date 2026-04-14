import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

// ── Coach definitions ─────────────────────────────────────────────────────────
const COACHES = [
  {
    id: 'sunny',
    name: 'Sunny',
    title: 'The Motivator',
    description: 'Boundless energy and relentless positivity. Sunny turns every rep into a celebration and makes you believe you can do anything.',
    bgColor: '#fffbeb',
    accentColor: '#f59e0b',
    animClass: 'coach-anim-bounce',
  },
  {
    id: 'rex',
    name: 'Rex',
    title: 'The Drill Sergeant',
    description: "No excuses. No shortcuts. Rex demands your best and won't accept anything less. Pain is just weakness leaving the body.",
    bgColor: '#fff1f2',
    accentColor: '#ef4444',
    animClass: 'coach-anim-shake',
  },
  {
    id: 'dana',
    name: 'Dana',
    title: 'The Realist',
    description: 'Evidence-based, brutally honest, and refreshingly direct. Dana cuts through every fitness myth with surgical precision.',
    bgColor: '#f0fdf4',
    accentColor: '#10b981',
    animClass: 'coach-anim-nod',
  },
  {
    id: 'natasha',
    name: 'Natasha',
    title: 'The Soviet',
    description: "Iron discipline meets sports science. Natasha's methods forged Olympic champions. Emotion is irrelevant. Results are not.",
    bgColor: '#faf5ff',
    accentColor: '#8b5cf6',
    animClass: 'coach-anim-pulse',
  },
]

// ── SVG Avatars ───────────────────────────────────────────────────────────────
function SunnySVG() {
  return (
    <svg viewBox="0 0 140 140" width="130" height="130" aria-hidden="true">
      {/* Sun rays */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const r = Math.PI / 180
        const x1 = 70 + 53 * Math.cos(deg * r)
        const y1 = 70 + 53 * Math.sin(deg * r)
        const x2 = 70 + 64 * Math.cos(deg * r)
        const y2 = 70 + 64 * Math.sin(deg * r)
        return (
          <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" />
        )
      })}
      {/* Face */}
      <circle cx="70" cy="70" r="46" fill="#fcd34d" stroke="#f59e0b" strokeWidth="2.5" />
      {/* Rosy cheeks */}
      <circle cx="44" cy="80" r="10" fill="#fca5a5" opacity="0.45" />
      <circle cx="96" cy="80" r="10" fill="#fca5a5" opacity="0.45" />
      {/* Eyes */}
      <circle cx="54" cy="62" r="8" fill="#1f2937" />
      <circle cx="86" cy="62" r="8" fill="#1f2937" />
      <circle cx="57" cy="59" r="3" fill="white" />
      <circle cx="89" cy="59" r="3" fill="white" />
      {/* Eyebrows — raised happy */}
      <path d="M46 50 Q54 45 62 50" stroke="#92400e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M78 50 Q86 45 94 50" stroke="#92400e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Big smile */}
      <path d="M44 80 Q70 102 96 80" stroke="#92400e" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Teeth */}
      <path d="M50 81 Q70 95 90 81 Q70 87 50 81Z" fill="white" opacity="0.8" />
    </svg>
  )
}

function RexSVG() {
  return (
    <svg viewBox="0 0 140 140" width="130" height="130" aria-hidden="true">
      {/* Buzz-cut / military flat-top */}
      <rect x="32" y="22" width="76" height="16" rx="4" fill="#374151" />
      <rect x="26" y="36" width="88" height="8" rx="2" fill="#1f2937" />
      {/* Cap brim line */}
      <path d="M22 44 L118 44" stroke="#111827" strokeWidth="2" />
      {/* Face */}
      <rect x="33" y="44" width="74" height="66" rx="10" fill="#fde8d8" />
      {/* Jawline accent */}
      <path d="M33 88 Q70 114 107 88" stroke="#f5d0b0" strokeWidth="1.5" fill="none" />
      {/* Heavy brows — furrowed */}
      <path d="M38 60 L58 56" stroke="#374151" strokeWidth="4" strokeLinecap="round" />
      <path d="M82 56 L102 60" stroke="#374151" strokeWidth="4" strokeLinecap="round" />
      {/* Brow crease */}
      <path d="M66 56 L70 63 L74 56" stroke="#d1a080" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Eyes — narrow, stern */}
      <ellipse cx="50" cy="70" rx="8" ry="5.5" fill="#1f2937" />
      <ellipse cx="90" cy="70" rx="8" ry="5.5" fill="#1f2937" />
      <circle cx="52" cy="68" r="2" fill="white" />
      <circle cx="92" cy="68" r="2" fill="white" />
      {/* Flat stern mouth */}
      <path d="M52 90 L88 90" stroke="#b45309" strokeWidth="3" strokeLinecap="round" />
      {/* Military star badge */}
      <text x="70" y="48" textAnchor="middle" fontSize="10" fill="#fbbf24">★</text>
      {/* Chin cleft */}
      <path d="M67 108 L70 112 L73 108" stroke="#e2bfa0" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function DanaSVG() {
  return (
    <svg viewBox="0 0 140 140" width="130" height="130" aria-hidden="true">
      {/* Hair */}
      <ellipse cx="70" cy="45" rx="42" ry="28" fill="#374151" />
      <rect x="28" y="45" width="84" height="20" fill="#374151" />
      {/* Side part */}
      <path d="M70 22 L62 44" stroke="#4b5563" strokeWidth="2" />
      {/* Face */}
      <ellipse cx="70" cy="78" rx="36" ry="38" fill="#fde8d8" />
      {/* Neck */}
      <rect x="60" y="112" width="20" height="14" rx="4" fill="#fde8d8" />
      {/* Glasses frames */}
      <rect x="36" y="65" width="26" height="17" rx="5" fill="none" stroke="#374151" strokeWidth="2.5" />
      <rect x="78" y="65" width="26" height="17" rx="5" fill="none" stroke="#374151" strokeWidth="2.5" />
      {/* Glasses bridge */}
      <path d="M62 73 L78 73" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
      {/* Glasses arms */}
      <path d="M36 73 L28 70" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
      <path d="M104 73 L112 70" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
      {/* Eyes behind glasses */}
      <circle cx="49" cy="73" r="5" fill="#1f2937" />
      <circle cx="91" cy="73" r="5" fill="#1f2937" />
      <circle cx="51" cy="71" r="2" fill="white" />
      <circle cx="93" cy="71" r="2" fill="white" />
      {/* Eyebrows — level, analytical */}
      <path d="M38 60 L60 59" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M80 59 L102 60" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" />
      {/* Dry smirk — asymmetric */}
      <path d="M52 95 Q70 100 88 93" stroke="#b45309" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Slight chin definition */}
      <path d="M60 110 Q70 116 80 110" stroke="#f5d0b0" strokeWidth="1.5" fill="none" />
    </svg>
  )
}

function NatashaSVG() {
  return (
    <svg viewBox="0 0 140 140" width="130" height="130" aria-hidden="true">
      {/* Hair bun */}
      <circle cx="70" cy="26" r="16" fill="#1f2937" />
      <ellipse cx="70" cy="38" rx="36" ry="18" fill="#1f2937" />
      {/* Bun detail */}
      <circle cx="70" cy="26" r="10" fill="none" stroke="#374151" strokeWidth="2" />
      <circle cx="70" cy="26" r="5" fill="#374151" />
      {/* Face — angular */}
      <path d="M38 56 L34 92 L50 116 L70 122 L90 116 L106 92 L102 56 L70 48 Z"
        fill="#f3e8e0" />
      {/* Cheekbone shadows */}
      <ellipse cx="42" cy="86" rx="10" ry="6" fill="#e8d5c8" opacity="0.6" />
      <ellipse cx="98" cy="86" rx="10" ry="6" fill="#e8d5c8" opacity="0.6" />
      {/* Eyes — sharp, cold */}
      <ellipse cx="52" cy="72" rx="9" ry="6" fill="#1f2937" />
      <ellipse cx="88" cy="72" rx="9" ry="6" fill="#1f2937" />
      <circle cx="55" cy="70" r="2.5" fill="white" />
      <circle cx="91" cy="70" r="2.5" fill="white" />
      {/* Eyelids — heavy */}
      <path d="M43 68 L61 68" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
      <path d="M79 68 L97 68" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
      {/* Eyebrows — perfectly flat, severe */}
      <path d="M42 60 L62 58" stroke="#1f2937" strokeWidth="3" strokeLinecap="round" />
      <path d="M78 58 L98 60" stroke="#1f2937" strokeWidth="3" strokeLinecap="round" />
      {/* Cold thin mouth — no emotion */}
      <path d="M54 98 L86 98" stroke="#9d7060" strokeWidth="2.5" strokeLinecap="round" />
      {/* Tiny red medal / order */}
      <circle cx="70" cy="52" r="4" fill="#ef4444" />
      <circle cx="70" cy="52" r="2" fill="#fbbf24" />
    </svg>
  )
}

const AVATAR_MAP = {
  sunny: SunnySVG,
  rex: RexSVG,
  dana: DanaSVG,
  natasha: NatashaSVG,
}

// ── Chat bubbles ──────────────────────────────────────────────────────────────
function ChatBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`chat-bubble-row ${isUser ? 'chat-bubble-user' : 'chat-bubble-coach'}`}>
      <div className={`chat-bubble ${isUser ? 'chat-bubble-right' : 'chat-bubble-left'}`}>
        {msg.content}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="chat-bubble-row chat-bubble-coach">
      <div className="chat-bubble chat-bubble-left chat-typing">
        <span /><span /><span />
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Coach() {
  const { userId } = useAuth()
  const uid = userId ?? parseInt(localStorage.getItem('user_id') || '0', 10)

  const [selectedId, setSelectedId] = useState(
    () => localStorage.getItem('selected_coach') || 'rex'
  )
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  const coach = COACHES.find(c => c.id === selectedId) || COACHES[1]
  const AvatarComponent = AVATAR_MAP[coach.id]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  useEffect(() => {
    setMessages([])
  }, [selectedId])

  const selectCoach = (id) => {
    setSelectedId(id)
    localStorage.setItem('selected_coach', id)
  }

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || sending) return
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setInput('')
    setSending(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/coach/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: uid, message: text, coach_name: selectedId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      setMessages(prev => [...prev, { role: 'coach', content: data.reply }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'coach',
        content: `[${err.message}]`,
      }])
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">My Coach</h1>
        <p className="page-subtitle">Choose your coach and start a conversation</p>
      </div>

      {/* ── Selection grid ── */}
      <section className="coach-section">
        <h2 className="coach-section-title">Select Your Coach</h2>
        <div className="coach-grid">
          {COACHES.map(c => (
            <div
              key={c.id}
              className={`coach-card${selectedId === c.id ? ' coach-card-selected' : ''}`}
              style={selectedId === c.id ? { borderColor: c.accentColor } : {}}
              onClick={() => selectCoach(c.id)}
            >
              <div className="coach-card-emoji" style={{ background: c.bgColor, borderRadius: 12, padding: '0.5rem', display:'inline-flex' }}>
                <span style={{ fontSize: '2rem' }}>
                  {{ sunny: '☀️', rex: '🎖️', dana: '📊', natasha: '🏋️' }[c.id]}
                </span>
              </div>
              <div className="coach-card-info">
                <div className="coach-card-name">{c.name}</div>
                <div className="coach-card-title-text" style={{ color: c.accentColor }}>{c.title}</div>
                <p className="coach-card-desc">{c.description}</p>
              </div>
              <button
                className="btn btn-sm"
                style={selectedId === c.id
                  ? { background: c.bgColor, color: c.accentColor, border: `1.5px solid ${c.accentColor}`, fontWeight: 600 }
                  : { background: 'var(--gray-100)', color: 'var(--gray-700)' }}
                onClick={e => { e.stopPropagation(); selectCoach(c.id) }}
              >
                {selectedId === c.id ? '✓ Selected' : 'Select'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── Avatar + chat ── */}
      <section className="coach-section">
        <div className="coach-chat-layout">

          {/* Avatar panel */}
          <div className="coach-avatar-panel" style={{ background: coach.bgColor }}>
            <div className="coach-avatar-stage">
              <div
                className={`coach-avatar-figure ${coach.animClass}${sending ? ' coach-anim-speaking' : ''}`}
                style={{ filter: `drop-shadow(0 8px 24px ${coach.accentColor}44)` }}
              >
                <AvatarComponent />
              </div>
            </div>
            <div className="coach-avatar-label">
              <span className="coach-avatar-name" style={{ color: coach.accentColor }}>
                {coach.name}
              </span>
              <span className="coach-avatar-subtitle">{coach.title}</span>
            </div>
          </div>

          {/* Chat panel */}
          <div className="coach-chat-panel">
            <div className="coach-chat-header" style={{ borderBottom: `2px solid ${coach.accentColor}22` }}>
              <span className="coach-chat-header-name">
                Chat with <strong style={{ color: coach.accentColor }}>{coach.name}</strong>
              </span>
              {sending && <span className="coach-chat-status">typing…</span>}
            </div>

            <div className="coach-messages">
              {messages.length === 0 && (
                <div className="coach-empty-chat">
                  <p>Say hello to {coach.name} to get started.</p>
                </div>
              )}
              {messages.map((msg, i) => <ChatBubble key={i} msg={msg} />)}
              {sending && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            <div className="coach-chat-input-row">
              <textarea
                className="coach-chat-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask ${coach.name} anything…`}
                rows={1}
                disabled={sending}
              />
              <button
                className="btn btn-primary coach-send-btn"
                style={{ background: coach.accentColor, borderColor: coach.accentColor }}
                onClick={sendMessage}
                disabled={!input.trim() || sending}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>

        </div>
      </section>
    </div>
  )
}
