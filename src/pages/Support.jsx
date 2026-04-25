import { useState, useRef, useEffect } from 'react'

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

const openingMessage = {
  id: 1,
  role: 'ai',
  text: "Hey Alex, looks like you've got a heavy week ahead with 3 deadlines coming up. What's on your mind?",
}

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
  const [messages, setMessages] = useState([openingMessage])
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend() {
    const text = input.trim()
    if (!text) return
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text }])
    setInput('')
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 57px)' }}>
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
                  <span className="text-[10px] font-extrabold text-[#5B5BD6]">AI</span>
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
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="border-t border-[#EBEBF0] bg-white px-8 py-4">
        <div className="max-w-2xl mx-auto flex items-end gap-3">
          <textarea
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type a message..."
            className="flex-1 resize-none rounded-2xl border border-[#E2E2E9] px-4 py-3 text-sm text-[#0F0F0F] placeholder-[#9999AA] focus:outline-none focus:border-[#5B5BD6] transition-colors leading-relaxed"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-10 h-10 rounded-full bg-[#5B5BD6] flex items-center justify-center flex-shrink-0 hover:bg-[#4F4FBE] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.25} className="w-4 h-4 translate-x-px">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Support() {
  const [tab, setTab] = useState('resources')

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
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
