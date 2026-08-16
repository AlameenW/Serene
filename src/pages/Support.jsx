import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GoogleGenAI } from '@google/genai/web'
import { useAuth } from '../auth/AuthContext'
import { useAppState } from '../lib/AppContext'
import { getUpcoming } from '../lib/stress'

function isGeminiConfigured() {
  const key = import.meta.env.VITE_GEMINI_API_KEY
  return typeof key === 'string' && key.length > 0
}

// Constructing GoogleGenAI without a key throws immediately in the browser — build it lazily,
// only once we know a key is present, so a missing key can't crash the whole app on load.
let cachedAi = null
function getGeminiClient() {
  if (!isGeminiConfigured()) return null
  if (!cachedAi) cachedAi = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY })
  return cachedAi
}

const SYSTEM_INSTRUCTION = `You are a warm, empathetic AI support assistant built into Serene, a student wellness app.
Your role is to help college students manage academic stress and emotional wellbeing.
Keep responses concise (2–4 sentences) and conversational — never clinical or robotic.
Never diagnose or provide medical advice. If a student expresses serious distress or mentions self-harm,
gently acknowledge their feelings and direct them to campus counseling or crisis resources.`

const resources = [
  {
    name: 'Counseling Services',
    desc: 'Mental health support, individual and group counseling.',
    url: 'https://www.southeastern.edu/admin/counseling/',
  },
  {
    name: 'Student Health Center',
    desc: 'Medical care, prescriptions, and wellness services on campus.',
    url: 'https://www.southeastern.edu/admin/health_ctr/',
  },
  {
    name: 'Food Pantry',
    desc: 'Free groceries and essentials for students in need.',
    url: 'https://www.southeastern.edu/admin/misa/pantry/',
  },
  {
    name: 'Academic Success Center',
    desc: 'Tutoring, academic coaching, and study skills support.',
    url: 'https://www.southeastern.edu/college-of-honors-and-excellence/tutoring/',
  },
  {
    name: 'Student Disability Services',
    desc: 'Accommodations and support for students with disabilities.',
    url: 'https://www.southeastern.edu/college-of-honors-and-excellence/tutoring/',
  },
]

function ResourcesTab() {
  return (
    <div className="max-w-5xl mx-auto px-8 py-10">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-[#0F0F0F] mb-1">Campus Resources</h2>
        <p className="text-sm text-[#6B6B80]">SLU services available to support your wellbeing.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {resources.map(r => (
          <div
            key={r.name}
            className="bg-white rounded-2xl border border-[#EBEBF0] p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
          >
            <div className="w-9 h-9 rounded-xl bg-[#EDEDFF] flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="#5B5BD6" strokeWidth={1.75} className="w-5 h-5">
                <path d="M12 21C12 21 4 13.5 4 8a8 8 0 1116 0c0 5.5-8 13-8 13z" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="8" r="2.5" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-[#0F0F0F] mb-1">{r.name}</h3>
              <p className="text-sm text-[#6B6B80] leading-relaxed">{r.desc}</p>
            </div>
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="self-start px-4 py-2 rounded-full border border-[#E2E2E9] text-xs font-semibold text-[#0F0F0F] hover:bg-[#F7F7FA] transition-colors"
            >
              Visit site →
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}

function AITab() {
  const { user } = useAuth()
  const { deadlines } = useAppState()
  const firstName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'there'
  const upcomingCount = getUpcoming(deadlines).length
  const [messages, setMessages] = useState(() => [{
    id: 1,
    role: 'ai',
    text: upcomingCount === 0
      ? `Hey ${firstName}, looks like your week is pretty clear. What's on your mind?`
      : `Hey ${firstName}, looks like you've got ${upcomingCount} deadline${upcomingCount === 1 ? '' : 's'} coming up this week. What's on your mind?`,
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    const ai = getGeminiClient()
    if (!ai) return
    chatRef.current = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: { systemInstruction: SYSTEM_INSTRUCTION },
    })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text }])
    setInput('')

    if (!chatRef.current) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'ai',
        text: "AI chat isn't set up yet — a Gemini API key needs to be added to this app's config.",
      }])
      return
    }

    setLoading(true)
    try {
      const response = await chatRef.current.sendMessage({ message: text })
      setMessages(prev => [...prev, { id: Date.now(), role: 'ai', text: response.text }])
    } catch (err) {
      console.error('[Gemini error]', err)
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'ai',
        text: "I'm having trouble connecting right now. Please try again in a moment.",
      }])
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 114px)' }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'ai' && (
                <div className="w-7 h-7 rounded-full bg-[#EDEDFF] flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                  <span className="text-[10px] font-extrabold text-[#5B5BD6]">S</span>
                </div>
              )}
              <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#5B5BD6] text-white rounded-tr-sm'
                    : 'bg-white border border-[#EBEBF0] text-[#0F0F0F] rounded-tl-sm shadow-sm'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-full bg-[#EDEDFF] flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                <span className="text-[10px] font-extrabold text-[#5B5BD6]">S</span>
              </div>
              <div className="bg-white border border-[#EBEBF0] rounded-2xl rounded-tl-sm shadow-sm px-4 py-3 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#9999AA] animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#9999AA] animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#9999AA] animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="border-t border-[#EBEBF0] bg-white px-8 pt-4 pb-3">
        <div className="max-w-2xl mx-auto flex items-end gap-3">
          <textarea
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type a message..."
            disabled={loading}
            className="flex-1 resize-none rounded-2xl border border-[#E2E2E9] px-4 py-3 text-sm text-[#0F0F0F] placeholder-[#9999AA] focus:outline-none focus:border-[#5B5BD6] transition-colors leading-relaxed disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-full bg-[#5B5BD6] flex items-center justify-center flex-shrink-0 hover:bg-[#4F4FBE] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.25} className="w-4 h-4 translate-x-px">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <p className="max-w-2xl mx-auto mt-2 text-center text-[10px] text-[#C8C8D0] flex items-center justify-center gap-1">
          Powered by
          <svg viewBox="0 0 24 24" className="w-3 h-3 inline" fill="none">
            <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z" fill="#9999AA"/>
          </svg>
          Gemini
        </p>
      </div>
    </div>
  )
}

export default function Support() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('resources')
  const { user, signOut } = useAuth()
  const displayName = user?.displayName || user?.email || 'User'

  async function handleSignOut() {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Navbar */}
      <nav className="bg-white border-b border-[#F0F0F5] px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#5B5BD6] flex items-center justify-center">
            <span className="text-white text-xs font-extrabold tracking-tight">S</span>
          </div>
          <span className="text-[#0F0F0F] font-bold text-lg tracking-tight">Serene</span>
        </div>
        <div className="flex items-center gap-1">
          <Link to="/dashboard" className="px-4 py-2 text-sm font-semibold rounded-full text-[#6B6B80] hover:text-[#0F0F0F] hover:bg-[#F7F7FA] transition-colors">Dashboard</Link>
          <Link to="/courses" className="px-4 py-2 text-sm font-semibold rounded-full text-[#6B6B80] hover:text-[#0F0F0F] hover:bg-[#F7F7FA] transition-colors">Courses</Link>
          <Link to="/support" className="px-4 py-2 text-sm font-semibold rounded-full bg-[#5B5BD6] text-white">Support Hub</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/profile" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-[#EDEDFF] flex items-center justify-center">
              <span className="text-[#5B5BD6] text-xs font-extrabold">{displayName[0].toUpperCase()}</span>
            </div>
            <span className="text-sm font-semibold text-[#0F0F0F]">{displayName}</span>
          </Link>
          <button onClick={handleSignOut} className="text-xs font-semibold text-[#9999AA] hover:text-[#0F0F0F] transition-colors">Sign out</button>
        </div>
      </nav>

      {/* Tab toggles */}
      <div className="bg-white border-b border-[#EBEBF0]">
        <div className="max-w-5xl mx-auto px-8 flex gap-1 pt-3">
          {[
            { key: 'resources', label: 'Campus Resources' },
            { key: 'ai', label: 'AI Assistant' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-2.5 text-sm font-semibold rounded-t-xl border-b-2 transition-colors ${
                tab === t.key
                  ? 'text-[#5B5BD6] border-[#5B5BD6] bg-[#FAFAFA]'
                  : 'text-[#6B6B80] border-transparent hover:text-[#0F0F0F]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'resources' ? <ResourcesTab /> : <AITab />}
    </div>
  )
}
