// pages/index.js — full adaptive test flow
import { useState, useEffect, useRef } from 'react'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/router'
import { CA_TOPICS, CA_LEVELS } from '../lib/constants'

// ─── helpers ──────────────────────────────────────────────────────────────────
async function apiFetch(path, session, body) {
  const token = session?.access_token
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

// ─── SETUP SCREEN ─────────────────────────────────────────────────────────────
function SetupScreen({ testNumber, onStart, profile }) {
  const [topics, setTopics] = useState([])
  const [level, setLevel] = useState(null)
  const [mock, setMock] = useState(false)

  const toggle = (t) => {
    if (mock) return
    setTopics(p => p.find(x => x.id === t.id) ? p.filter(x => x.id !== t.id) : [...p, t])
  }
  const canStart = level && (topics.length > 0 || mock)

  return (
    <div className="screen">
      <header className="brand">
        <div className="brand-icon">⚡</div>
        <div>
          <div className="brand-name">CA MockForge</div>
          <div className="brand-sub">Adaptive Intelligence Testing</div>
        </div>
        {profile && (
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>{profile.email}</div>
            <div style={{ fontSize: 12, color: 'var(--gold)' }}>
              {profile.tests_taken} tests · {profile.avg_score}% avg
            </div>
          </div>
        )}
      </header>

      {testNumber === 1 ? (
        <div className="hero">
          <div className="hero-tag"><span className="dot" />AI-Powered Mock Tests</div>
          <h1>Master CA exams<br />with <em>adaptive</em><br />intelligence.</h1>
          <p>Every test learns from you. Every question crafted for your growth. No two tests ever the same.</p>
        </div>
      ) : (
        <div className="hero">
          <div className="hero-tag"><span className="dot" />🔥 Test #{testNumber} — Adaptive</div>
          <h1>Your next<br /><em>challenge</em> awaits.</h1>
          <p>AI has analysed Test #{testNumber - 1} and crafted this test specifically for your weak areas.</p>
        </div>
      )}

      <div className="section-label">Select Level</div>
      <div className="pill-row" style={{ marginBottom: 28 }}>
        {CA_LEVELS.map(y => (
          <button key={y.id} className={`pill${level?.id === y.id ? ' active' : ''}`}
            style={level?.id === y.id ? { background: y.color, borderColor: y.color, color: '#000' } : {}}
            onClick={() => setLevel(y)}>{y.label}</button>
        ))}
      </div>

      <div className="section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Select Topics</span>
        <button className="pill" style={mock ? { borderColor: 'var(--gold)', color: 'var(--gold)' } : {}}
          onClick={() => { setMock(m => !m); setTopics(mock ? [] : CA_TOPICS.slice(0, 5)) }}>
          {mock ? '✓ Full Mock' : 'Full Mock Mode'}
        </button>
      </div>
      <div className="topic-grid">
        {CA_TOPICS.map(t => (
          <div key={t.id} className={`topic-card${topics.find(x => x.id === t.id) ? ' selected' : ''}`}
            onClick={() => toggle(t)}>
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            <span style={{ fontSize: 12 }}>{t.label}</span>
          </div>
        ))}
      </div>

      <button className="btn-primary" disabled={!canStart}
        onClick={() => onStart(mock ? CA_TOPICS : topics, level)}>
        {testNumber === 1 ? 'Generate Test #1 →' : `Generate Adaptive Test #${testNumber} →`}
      </button>

      <style jsx>{`
        .screen { position: relative; z-index: 1; min-height: 100vh; padding: 32px 24px; max-width: 860px; margin: 0 auto; }
        .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 48px; }
        .brand-icon { width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg,#f5c842,#e8b800); display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 0 30px rgba(245,200,66,.3); }
        .brand-name { font-family:var(--font-head);font-size:18px;font-weight:800;letter-spacing:-0.5px; }
        .brand-sub { font-size:11px;color:var(--text3);letter-spacing:2px;text-transform:uppercase; }
        .hero { margin-bottom: 40px; }
        .hero-tag { display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:100px;border:1px solid rgba(245,200,66,.3);background:rgba(245,200,66,.08);color:var(--gold);font-size:11px;letter-spacing:2px;text-transform:uppercase;margin-bottom:20px; }
        .dot { width:6px;height:6px;border-radius:50%;background:var(--gold);animation:blink 2s ease infinite; }
        @keyframes blink { 0%,100%{opacity:1}50%{opacity:.3} }
        .hero h1 { font-family:var(--font-head);font-size:clamp(32px,6vw,56px);font-weight:800;line-height:1.05;letter-spacing:-2px;margin-bottom:14px; }
        .hero h1 em { font-family:var(--font-serif);font-style:italic;color:var(--gold); }
        .hero p { font-size:14px;color:var(--text2);line-height:1.7;max-width:480px; }
        .section-label { font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--text3);margin-bottom:12px; }
        .pill-row { display:flex;flex-wrap:wrap;gap:8px; }
        .pill { padding:7px 16px;border-radius:100px;border:1px solid var(--border);background:var(--surface);cursor:pointer;font-family:var(--font-body);font-size:12px;color:var(--text2);transition:all .18s; }
        .pill:hover { border-color:var(--border2);color:var(--text); }
        .pill.active { border-color:var(--gold);color:var(--gold); }
        .topic-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;margin-bottom:28px; }
        .topic-card { padding:14px;border-radius:var(--radius);border:1px solid var(--border);background:var(--surface);cursor:pointer;display:flex;align-items:center;gap:10px;color:var(--text2);transition:all .18s;user-select:none; }
        .topic-card:hover { border-color:var(--border2);background:var(--surface2);color:var(--text);transform:translateY(-1px); }
        .topic-card.selected { border-color:var(--gold);background:rgba(245,200,66,.07);color:var(--gold); }
        .btn-primary { padding:14px 32px;border-radius:100px;border:none;cursor:pointer;background:linear-gradient(135deg,#f5c842,#e8b800);color:#000;font-family:var(--font-head);font-size:15px;font-weight:700;transition:all .2s;box-shadow:0 4px 20px rgba(245,200,66,.25); }
        .btn-primary:hover { transform:translateY(-2px);box-shadow:0 8px 30px rgba(245,200,66,.4); }
        .btn-primary:disabled { opacity:.4;cursor:not-allowed;transform:none; }
      `}</style>
    </div>
  )
}

// ─── TEST SCREEN ──────────────────────────────────────────────────────────────
function TestScreen({ questions, testNumber, onComplete }) {
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [answers, setAnswers] = useState([])
  const [timings, setTimings] = useState([])
  const [secs, setSecs] = useState(0)
  const [qStart, setQStart] = useState(Date.now())
  const intRef = useRef()

  useEffect(() => {
    intRef.current = setInterval(() => setSecs(s => s + 1), 1000)
    return () => clearInterval(intRef.current)
  }, [idx])

  const q = questions[idx]

  const pick = (key) => {
    if (revealed) return
    setSelected(key); setRevealed(true); clearInterval(intRef.current)
  }

  const next = () => {
    const spent = Date.now() - qStart
    const na = [...answers, selected], nt = [...timings, spent]
    if (idx === questions.length - 1) { onComplete(na, nt); return }
    setAnswers(na); setTimings(nt)
    setSelected(null); setRevealed(false); setSecs(0); setQStart(Date.now()); setIdx(i => i + 1)
  }

  const pct = (idx / questions.length) * 100

  return (
    <div className="screen">
      <div className="top-bar">
        <div>
          <div style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: 1 }}>Question</div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
            {idx + 1}<span style={{ fontSize: 16, color: 'var(--text3)' }}> / {questions.length}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: secs > 90 ? 'var(--hard)' : 'var(--text2)', fontSize: 13 }}>
          ⏱ <span style={{ fontFamily: 'var(--font-head)', fontSize: 18 }}>
            {String(Math.floor(secs / 60)).padStart(2, '0')}:{String(secs % 60).padStart(2, '0')}
          </span>
        </div>
      </div>

      <div className="prog"><div className="prog-fill" style={{ width: `${pct}%` }} /></div>

      <span className={`diff-tag ${q.difficulty}`}>
        {q.difficulty === 'simple' ? '● Simple' : q.difficulty === 'medium' ? '◆ Medium' : '▲ Hard'}
      </span>

      <div className="q-text">{q.question}</div>

      <div className="opts">
        {Object.entries(q.options).map(([k, v]) => {
          let cls = ''
          if (revealed) { cls = k === q.correct ? 'correct' : k === selected ? 'wrong' : '' }
          else if (k === selected) cls = 'sel'
          return (
            <button key={k} className={`opt ${cls}`} onClick={() => pick(k)} disabled={revealed}>
              <span className="opt-key">{k}</span><span>{v}</span>
            </button>
          )
        })}
      </div>

      {revealed && (
        <div className="expl">
          <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--blue)', marginBottom: 8 }}>Explanation</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>{q.explanation}</div>
        </div>
      )}

      {revealed && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn-primary" onClick={next}>
            {idx === questions.length - 1 ? 'View Analysis →' : 'Next →'}
          </button>
        </div>
      )}

      <style jsx>{`
        .screen { position:relative;z-index:1;min-height:100vh;padding:32px 24px;max-width:760px;margin:0 auto; }
        .top-bar { display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:20px; }
        .prog { height:3px;background:var(--surface3);border-radius:2px;margin-bottom:32px;overflow:hidden; }
        .prog-fill { height:100%;background:linear-gradient(90deg,var(--gold),var(--emerald));border-radius:2px;transition:width .5s ease; }
        .diff-tag { display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:100px;font-size:11px;letter-spacing:1px;text-transform:uppercase;margin-bottom:18px; }
        .diff-tag.simple { background:rgba(16,214,142,.1);color:var(--simple);border:1px solid rgba(16,214,142,.2); }
        .diff-tag.medium { background:rgba(245,200,66,.1);color:var(--medium);border:1px solid rgba(245,200,66,.2); }
        .diff-tag.hard { background:rgba(255,95,109,.1);color:var(--hard);border:1px solid rgba(255,95,109,.2); }
        .q-text { font-family:var(--font-serif);font-size:clamp(17px,3vw,22px);line-height:1.55;margin-bottom:28px; }
        .opts { display:flex;flex-direction:column;gap:10px;margin-bottom:28px; }
        .opt { padding:15px 18px;border-radius:var(--radius);border:1px solid var(--border);background:var(--surface);cursor:pointer;text-align:left;display:flex;align-items:flex-start;gap:12px;font-family:var(--font-body);font-size:13px;color:var(--text2);line-height:1.5;transition:all .15s; }
        .opt:hover:not(:disabled) { border-color:var(--border2);background:var(--surface2);color:var(--text);transform:translateX(3px); }
        .opt.sel { border-color:var(--gold);background:rgba(245,200,66,.07);color:var(--text); }
        .opt.correct { border-color:var(--simple);background:rgba(16,214,142,.08);color:var(--simple); }
        .opt.wrong { border-color:var(--hard);background:rgba(255,95,109,.08);color:var(--hard); }
        .opt-key { width:26px;height:26px;min-width:26px;border-radius:7px;background:var(--surface3);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600; }
        .opt.correct .opt-key { background:var(--simple);color:#000; }
        .opt.wrong .opt-key { background:var(--hard);color:#fff; }
        .opt.sel .opt-key { background:var(--gold);color:#000; }
        .expl { padding:16px 18px;border-radius:var(--radius);border:1px solid rgba(77,157,224,.2);background:rgba(77,157,224,.05);margin-bottom:20px;animation:fadeIn .3s ease; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .btn-primary { padding:13px 28px;border-radius:100px;border:none;cursor:pointer;background:linear-gradient(135deg,#f5c842,#e8b800);color:#000;font-family:var(--font-head);font-size:14px;font-weight:700;transition:all .2s; }
        .btn-primary:hover { transform:translateY(-2px);box-shadow:0 6px 24px rgba(245,200,66,.35); }
      `}</style>
    </div>
  )
}

// ─── ANALYSIS SCREEN ──────────────────────────────────────────────────────────
function AnalysisScreen({ analysis, questions, answers, timings, testNumber, onNext }) {
  const { score, grade, summary, strengths, weaknesses, timeInsights, difficultyBreakdown, motivationalMessage, nextTestFocus } = analysis
  const correct = questions.filter((q, i) => answers[i] === q.correct).length
  const avgTime = Math.round(timings.reduce((a, b) => a + b, 0) / timings.length / 1000)
  const color = score >= 70 ? '#10d68e' : score >= 50 ? '#f5c842' : '#ff5f6d'
  const r = 68, c = 2 * Math.PI * r

  return (
    <div className="screen">
      {score >= 70 && <Confetti />}
      <div style={{ textAlign: 'center', padding: '40px 0 28px' }}>
        <svg width="156" height="156" viewBox="0 0 156 156" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="78" cy="78" r={r} fill="none" stroke="#1c2130" strokeWidth="8" />
          <circle cx="78" cy="78" r={r} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${(score / 100) * c} ${c}`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1.5s cubic-bezier(.4,0,.2,1)' }} />
        </svg>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 48, fontWeight: 800, color, marginTop: -88, lineHeight: 1 }}>{score}%</div>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 44, marginBottom: 10 }}>score</div>
        <span style={{ padding: '4px 16px', borderRadius: 100, fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 800, background: `${color}18`, color, border: `1px solid ${color}40` }}>
          Grade: {grade}
        </span>
        <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, maxWidth: 480, margin: '16px auto 0' }}>{summary}</p>
      </div>

      <div className="stats3">
        {[['Correct', `${correct}/10`, '#10d68e'], ['Avg Time', `${avgTime}s`, '#4d9de0'], ['Total', `${Math.round(timings.reduce((a,b)=>a+b,0)/60000)}m`, '#f5c842']].map(([l, v, c]) => (
          <div key={l} className="stat-box">
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 30, fontWeight: 800, color: c }}>{v}</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 1, textTransform: 'uppercase' }}>{l}</div>
          </div>
        ))}
      </div>

      {difficultyBreakdown && (
        <div className="card">
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, marginBottom: 16 }}>By Difficulty</div>
          {[['simple','#10d68e'],['medium','#f5c842'],['hard','#ff5f6d']].map(([d, col]) => {
            const dd = difficultyBreakdown[d] || {}
            const pct = dd.total ? Math.round((dd.correct / dd.total) * 100) : 0
            return (
              <div key={d} style={{ display:'flex',alignItems:'center',gap:12,marginBottom:10 }}>
                <span style={{ fontSize:12,color:col,textTransform:'capitalize',minWidth:55 }}>{d}</span>
                <div style={{ flex:1,height:7,background:'var(--surface3)',borderRadius:4,overflow:'hidden' }}>
                  <div style={{ height:'100%',width:`${pct}%`,background:col,borderRadius:4,transition:'width 1s ease' }} />
                </div>
                <span style={{ fontSize:12,color:'var(--text3)',minWidth:36,textAlign:'right' }}>{dd.correct}/{dd.total}</span>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ display:'flex',flexWrap:'wrap',gap:6,marginBottom:24 }}>
        {(strengths||[]).map((s,i) => <span key={i} style={{ padding:'4px 12px',borderRadius:100,fontSize:11,background:'rgba(16,214,142,.08)',border:'1px solid rgba(16,214,142,.25)',color:'var(--simple)' }}>✓ {s}</span>)}
        {(weaknesses||[]).map((w,i) => <span key={i} style={{ padding:'4px 12px',borderRadius:100,fontSize:11,background:'rgba(255,95,109,.08)',border:'1px solid rgba(255,95,109,.25)',color:'var(--hard)' }}>✗ {w}</span>)}
      </div>
      <div style={{ fontSize:13,color:'var(--text2)',marginBottom:24,lineHeight:1.7 }}>
        <strong style={{ color:'var(--text)',fontFamily:'var(--font-head)' }}>Time:</strong> {timeInsights}
      </div>

      {/* Question review */}
      <div style={{ fontSize:10,letterSpacing:3,textTransform:'uppercase',color:'var(--text3)',marginBottom:12 }}>Question Review</div>
      <div style={{ display:'flex',flexDirection:'column',gap:8,marginBottom:28 }}>
        {questions.map((q, i) => {
          const ok = answers[i] === q.correct
          return (
            <div key={i} style={{ padding:'12px 14px',borderRadius:12,border:'1px solid var(--border)',background:'var(--surface)',display:'flex',gap:10 }}>
              <div style={{ width:9,height:9,minWidth:9,borderRadius:'50%',background:ok?'var(--simple)':'var(--hard)',marginTop:5 }} />
              <div>
                <div style={{ fontSize:13,marginBottom:4,lineHeight:1.4 }}>{q.question.length > 90 ? q.question.slice(0,90)+'…' : q.question}</div>
                <div style={{ display:'flex',gap:10,fontSize:11,color:'var(--text3)' }}>
                  <span style={{ color: ok?'var(--simple)':'var(--hard)' }}>{ok ? 'Correct' : `Wrong (${q.correct})`}</span>
                  <span style={{ color:'var(--blue)' }}>⏱ {Math.round(timings[i]/1000)}s</span>
                  <span style={{ textTransform:'capitalize' }}>{q.difficulty}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ padding:'22px',borderRadius:'var(--radius)',marginBottom:28,background:'linear-gradient(135deg,rgba(245,200,66,.08),rgba(16,214,142,.04))',border:'1px solid rgba(245,200,66,.2)' }}>
        <div style={{ fontSize:26,marginBottom:8 }}>💡</div>
        <div style={{ fontFamily:'var(--font-serif)',fontStyle:'italic',fontSize:16,lineHeight:1.6 }}>"{motivationalMessage}"</div>
        {nextTestFocus && (
          <div style={{ marginTop:10,fontSize:12,color:'var(--text3)',borderTop:'1px solid rgba(255,255,255,.05)',paddingTop:10 }}>
            <strong style={{ color:'var(--gold)' }}>Next Focus:</strong> {nextTestFocus}
          </div>
        )}
      </div>

      <div style={{ textAlign:'center',paddingBottom:48 }}>
        <button onClick={onNext} style={{ padding:'18px 48px',borderRadius:100,border:'none',cursor:'pointer',background:'linear-gradient(135deg,#f5c842,#10d68e)',color:'#000',fontFamily:'var(--font-head)',fontSize:17,fontWeight:800,boxShadow:'0 8px 40px rgba(245,200,66,.3)',transition:'all .25s',animation:'pulse 3s ease-in-out infinite' }}>
          🔥 Take Adaptive Test #{testNumber + 1}
        </button>
        <div style={{ marginTop:10,fontSize:12,color:'var(--text3)' }}>AI-crafted based on this test</div>
      </div>

      <style jsx>{`
        .screen { position:relative;z-index:1;min-height:100vh;padding:28px 24px;max-width:760px;margin:0 auto; }
        .stats3 { display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px; }
        .stat-box { padding:18px;border-radius:var(--radius);border:1px solid var(--border);background:var(--surface);text-align:center; }
        .card { padding:22px;border-radius:var(--radius);border:1px solid var(--border);background:var(--surface);margin-bottom:20px; }
        @keyframes pulse { 0%,100%{box-shadow:0 8px 40px rgba(245,200,66,.3)} 50%{box-shadow:0 8px 60px rgba(245,200,66,.55)} }
      `}</style>
    </div>
  )
}

function Confetti() {
  const pieces = Array.from({ length: 35 }, (_, i) => ({
    id: i, left: Math.random() * 100,
    color: ['#f5c842','#10d68e','#4d9de0','#ff5f6d','#a78bfa'][i % 5],
    delay: Math.random() * 2, dur: 2 + Math.random() * 2, size: 6 + Math.random() * 8,
  }))
  return (
    <div style={{ position:'fixed',inset:0,pointerEvents:'none',zIndex:10,overflow:'hidden' }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position:'absolute', left:`${p.left}%`, width:p.size, height:p.size,
          background:p.color, borderRadius:2,
          animation:`fall ${p.dur}s ${p.delay}s linear forwards`,
        }} />
      ))}
      <style>{`@keyframes fall{0%{transform:translateY(-20px) rotate(0);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0}}`}</style>
    </div>
  )
}

// ─── LOADING ──────────────────────────────────────────────────────────────────
function Loading({ msg, sub }) {
  return (
    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'100vh',gap:20,zIndex:1,position:'relative' }}>
      <div style={{ width:54,height:54,border:'2px solid var(--surface3)',borderTopColor:'var(--gold)',borderRadius:'50%',animation:'spin 1s linear infinite' }} />
      <div style={{ fontFamily:'var(--font-head)',fontSize:22,fontWeight:700 }}>{msg}</div>
      {sub && <div style={{ color:'var(--text3)',fontSize:13 }}>{sub}</div>}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const session = useSession()
  const supabase = useSupabaseClient()
  const router = useRouter()
  const [phase, setPhase] = useState('setup')
  const [testNumber, setTestNumber] = useState(1)
  const [testId, setTestId] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState([])
  const [timings, setTimings] = useState([])
  const [analysis, setAnalysis] = useState(null)
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!session) { router.push('/login'); return }
    supabase.from('student_profiles').select('*').eq('id', session.user.id).single()
      .then(({ data }) => { if (data) setProfile(data) })
  }, [session])

  const startTest = async (topics, level) => {
    setPhase('loading-test')
    setError(null)
    try {
      const data = await apiFetch('/api/generate-test', session, {
        topics: topics.map(t => t.label),
        level: level.label,
        testNumber,
      })
      setTestId(data.testId)
      setQuestions(data.questions)
      setPhase('test')
    } catch (e) {
      setError(e.message); setPhase('setup')
    }
  }

  const completeTest = async (ans, times) => {
    setAnswers(ans); setTimings(times); setPhase('analyzing')
    try {
      const data = await apiFetch('/api/submit-test', session, { testId, answers: ans, timings: times })
      setAnalysis(data.analysis)
      setPhase('analysis')
      // Refresh profile
      supabase.from('student_profiles').select('*').eq('id', session.user.id).single()
        .then(({ data }) => { if (data) setProfile(data) })
    } catch (e) {
      setError(e.message); setPhase('analysis')
    }
  }

  const nextTest = () => {
    setTestNumber(n => n + 1); setPhase('setup')
    setQuestions([]); setAnswers([]); setTimings([]); setAnalysis(null)
  }

  if (!session) return <Loading msg="Loading…" />
  if (phase === 'loading-test') return <Loading msg="Generating Test" sub="Checking question bank…" />
  if (phase === 'analyzing') return <Loading msg="Analysing Performance" sub="AI is reviewing your answers…" />

  return (
    <>
      {/* Ambient glows */}
      <div style={{ position:'fixed',width:600,height:600,borderRadius:'50%',background:'radial-gradient(circle,rgba(245,200,66,.06) 0%,transparent 70%)',top:-100,right:-100,pointerEvents:'none',zIndex:0 }} />
      <div style={{ position:'fixed',width:400,height:400,borderRadius:'50%',background:'radial-gradient(circle,rgba(77,157,224,.05) 0%,transparent 70%)',bottom:-100,left:-100,pointerEvents:'none',zIndex:0 }} />

      {error && (
        <div style={{ position:'fixed',top:20,left:'50%',transform:'translateX(-50%)',background:'rgba(255,95,109,.15)',border:'1px solid rgba(255,95,109,.3)',color:'var(--hard)',padding:'10px 20px',borderRadius:100,fontSize:13,zIndex:100 }}>
          ⚠ {error}
        </div>
      )}

      {phase === 'setup' && <SetupScreen testNumber={testNumber} onStart={startTest} profile={profile} />}
      {phase === 'test' && <TestScreen questions={questions} testNumber={testNumber} onComplete={completeTest} />}
      {phase === 'analysis' && analysis && (
        <AnalysisScreen analysis={analysis} questions={questions} answers={answers} timings={timings} testNumber={testNumber} onNext={nextTest} />
      )}
    </>
  )
}
