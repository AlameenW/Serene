import LandingSignInNav from '../components/LandingSignInNav'

const features = [
  {
    title: 'Deadline Sync',
    desc: 'Connect Canvas and your full semester loads instantly — courses, due dates, and exam weights already filled in.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5">
        <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Stress Forecast',
    desc: 'A 7-day bar chart that scores each day by deadline proximity, academic weight, clustering, and your current mood.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5">
        <path d="M3 20h18M7 20V12m4 8V8m4 12V4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'AI Support',
    desc: 'Gemini opens already knowing your stress level and mood — warm, concise, and always ready to point you to real help.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5">
        <path d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]

const previewBars = [
  { day: 'Mon', pct: 22, color: '#22c55e' },
  { day: 'Tue', pct: 52, color: '#eab308' },
  { day: 'Wed', pct: 92, color: '#ef4444' },
  { day: 'Thu', pct: 78, color: '#ef4444' },
  { day: 'Fri', pct: 44, color: '#eab308' },
  { day: 'Sat', pct: 20, color: '#22c55e' },
  { day: 'Sun', pct: 14, color: '#22c55e' },
]

const upcoming = [
  { course: 'CMPS 4700', name: 'Midterm Exam', due: 'Apr 28', badge: 'midterm', cls: 'bg-orange-100 text-orange-600' },
  { course: 'MATH 2850', name: 'Final Exam', due: 'May 8', badge: 'final', cls: 'bg-red-100 text-red-600' },
]

export default function Landing() {
  return (
    <div className="relative min-h-screen bg-white">
      {/* Background glow */}
      <div className="pointer-events-none absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-[#EDEDFF] opacity-60 blur-3xl -translate-y-1/3 translate-x-1/4" />

      {/* Navbar */}
      <nav className="relative flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#5B5BD6] flex items-center justify-center">
            <span className="text-white text-xs font-extrabold tracking-tight">S</span>
          </div>
          <span className="text-[#0F0F0F] font-bold text-lg tracking-tight">Serene</span>
        </div>

        <LandingSignInNav />
      </nav>

      {/* Hero */}
      <section className="relative max-w-6xl mx-auto px-8 pt-14 pb-32 flex items-center gap-16">
        {/* Left copy */}
        <div className="flex-1 min-w-0">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EDEDFF] text-[#5B5BD6] text-xs font-semibold mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5B5BD6]" />
            Built for Southeastern students
          </div>

          <h1 className="text-[3.25rem] font-extrabold text-[#0F0F0F] leading-[1.08] tracking-tight mb-5">
            Know your hard<br />
            weeks{' '}
            <span className="text-[#5B5BD6]">before</span>
            <br />
            they hit.
          </h1>

          <p className="text-[#6B6B80] text-lg leading-relaxed max-w-[420px]">
            Serene maps your deadlines, tracks your mood, and forecasts academic stress — so you're never blindsided by a brutal week again.
          </p>
        </div>

        {/* Right — app preview mockup */}
        <div className="flex-shrink-0 w-[400px] relative mt-4">
          {/* Main forecast card */}
          <div className="bg-white rounded-2xl border border-[#EBEBF0] shadow-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[11px] font-semibold text-[#9999AA] uppercase tracking-widest mb-0.5">Stress Forecast</p>
                <p className="text-sm font-bold text-[#0F0F0F]">This week</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-500 text-[11px] font-bold">High stress</span>
            </div>

            {/* Bar chart */}
            <div className="flex items-end gap-[6px] h-32 mb-4">
              {previewBars.map(bar => (
                <div key={bar.day} className="flex-1 flex flex-col items-center gap-1.5">
                  <div
                    className="w-full rounded-t-[5px]"
                    style={{ height: `${bar.pct}%`, backgroundColor: bar.color }}
                  />
                  <span className="text-[10px] font-medium text-[#9999AA]">{bar.day}</span>
                </div>
              ))}
            </div>

            {/* Upcoming deadlines */}
            <div className="border-t border-[#F2F2F7] pt-4 space-y-3">
              <p className="text-[11px] font-semibold text-[#9999AA] uppercase tracking-widest">Upcoming</p>
              {upcoming.map(d => (
                <div key={d.name} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#0F0F0F]">{d.name}</p>
                    <p className="text-[11px] text-[#9999AA]">{d.course}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${d.cls}`}>{d.badge}</span>
                    <span className="text-[11px] font-semibold text-[#6B6B80]">{d.due}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Floating mood card */}
          <div className="absolute -bottom-5 left-0 bg-white rounded-xl border border-[#EBEBF0] shadow-xl px-4 py-3">
            <p className="text-[11px] font-semibold text-[#9999AA] mb-2">How are you feeling?</p>
            <div className="flex gap-1.5">
              {['Calm', 'Focused', 'Anxious', 'Tired'].map((mood, i) => (
                <span
                  key={mood}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    i === 2 ? 'bg-[#5B5BD6] text-white' : 'bg-[#F4F4F8] text-[#6B6B80]'
                  }`}
                >
                  {mood}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section className="border-t border-[#F0F0F5] bg-[#FAFAFA]">
        <div className="max-w-6xl mx-auto px-8 py-16 grid grid-cols-1 md:grid-cols-3 gap-10">
          {features.map(f => (
            <div key={f.title}>
              <div className="w-9 h-9 rounded-xl bg-[#EDEDFF] text-[#5B5BD6] flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="text-sm font-bold text-[#0F0F0F] mb-1.5">{f.title}</h3>
              <p className="text-sm text-[#6B6B80] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
