// pages/admin.js
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export default function AdminDashboard() {
  const session = useSession()
  const router = useRouter()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    if (!session) { router.push('/login'); return }
    fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { router.push('/'); })
  }, [session])

  if (loading) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',gap:16,zIndex:1,position:'relative' }}>
      <div style={{ width:40,height:40,border:'2px solid #1c2130',borderTopColor:'#f5c842',borderRadius:'50%',animation:'spin 1s linear infinite' }} />
      <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700 }}>Loading Admin…</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (data?.error) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',color:'#ff5f6d',fontFamily:'DM Mono,monospace' }}>
      Access Denied — Admin only
    </div>
  )

  const { summary, students, recentTests, bankStats } = data || {}

  return (
    <div style={{ minHeight:'100vh',padding:'32px 24px',maxWidth:1100,margin:'0 auto',position:'relative',zIndex:1 }}>
      {/* Glow */}
      <div style={{ position:'fixed',width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle,rgba(245,200,66,.05) 0%,transparent 70%)',top:-80,right:-80,pointerEvents:'none',zIndex:0 }} />

      {/* Header */}
      <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:36 }}>
        <div style={{ width:44,height:44,borderRadius:12,background:'linear-gradient(135deg,#f5c842,#e8b800)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,boxShadow:'0 0 28px rgba(245,200,66,.3)' }}>⚡</div>
        <div>
          <div style={{ fontFamily:'Syne,sans-serif',fontSize:18,fontWeight:800,letterSpacing:-0.5 }}>CA MockForge</div>
          <div style={{ fontSize:11,color:'#4a5568',letterSpacing:2,textTransform:'uppercase' }}>Admin Dashboard</div>
        </div>
        <button onClick={() => router.push('/')} style={{ marginLeft:'auto',padding:'6px 16px',borderRadius:100,border:'1px solid rgba(255,255,255,.07)',background:'transparent',color:'#8892a4',fontFamily:'DM Mono,monospace',fontSize:12,cursor:'pointer' }}>
          ← Back to App
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:14,marginBottom:32 }}>
        {[
          ['Total Students', summary?.totalStudents, '#f5c842', '👥'],
          ['Active (30d)', summary?.activeStudents, '#10d68e', '🔥'],
          ['Tests (30d)', summary?.totalTests, '#4d9de0', '📝'],
          ['Avg Score', `${summary?.avgScore}%`, '#a78bfa', '🎯'],
        ].map(([label, val, color, icon]) => (
          <div key={label} style={{ padding:'20px 18px',borderRadius:16,border:'1px solid rgba(255,255,255,.07)',background:'#0e1117' }}>
            <div style={{ fontSize:22,marginBottom:8 }}>{icon}</div>
            <div style={{ fontFamily:'Syne,sans-serif',fontSize:30,fontWeight:800,color,lineHeight:1 }}>{val ?? '—'}</div>
            <div style={{ fontSize:11,color:'#4a5568',letterSpacing:1,textTransform:'uppercase',marginTop:4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex',gap:4,marginBottom:24,background:'#0e1117',border:'1px solid rgba(255,255,255,.07)',borderRadius:12,padding:4,width:'fit-content' }}>
        {[['overview','Overview'],['students','Students'],['bank','Question Bank']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding:'7px 18px',borderRadius:9,border:'none',cursor:'pointer',fontFamily:'DM Mono,monospace',fontSize:12,transition:'all .15s',
              background: tab === id ? '#f5c842' : 'transparent',
              color: tab === id ? '#000' : '#8892a4',
              fontWeight: tab === id ? 700 : 400,
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div>
          <div style={{ fontSize:10,letterSpacing:3,textTransform:'uppercase',color:'#4a5568',marginBottom:14 }}>Recent Tests</div>
          <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
            {(recentTests || []).slice(0, 20).map(t => (
              <div key={t.id} style={{ padding:'12px 16px',borderRadius:12,border:'1px solid rgba(255,255,255,.07)',background:'#0e1117',display:'flex',alignItems:'center',gap:16,flexWrap:'wrap' }}>
                <div style={{ fontSize:11,color:'#4a5568',minWidth:140 }}>{new Date(t.created_at).toLocaleDateString('en-IN', { day:'numeric',month:'short',hour:'2-digit',minute:'2-digit' })}</div>
                <div style={{ fontSize:12,color:'#8892a4',flex:1 }}>Test #{t.test_number} · {t.level}</div>
                <div style={{ fontSize:12,color:(t.score||0)>=70?'#10d68e':(t.score||0)>=50?'#f5c842':'#ff5f6d',fontFamily:'Syne,sans-serif',fontWeight:700 }}>
                  {t.score != null ? `${t.score}%` : 'In progress'}
                </div>
                <div style={{ fontSize:11,padding:'2px 8px',borderRadius:100,background:'rgba(77,157,224,.1)',color:'#4d9de0' }}>{t.grade || '—'}</div>
              </div>
            ))}
            {!recentTests?.length && <div style={{ color:'#4a5568',fontSize:13 }}>No tests in the last 30 days.</div>}
          </div>
        </div>
      )}

      {/* Students Tab */}
      {tab === 'students' && (
        <div>
          <div style={{ fontSize:10,letterSpacing:3,textTransform:'uppercase',color:'#4a5568',marginBottom:14 }}>All Students</div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%',borderCollapse:'collapse',fontSize:13 }}>
              <thead>
                <tr style={{ borderBottom:'1px solid rgba(255,255,255,.07)' }}>
                  {['Name','Email','Tests Taken','Avg Score','Last Active','Weak Topics'].map(h => (
                    <th key={h} style={{ padding:'10px 12px',textAlign:'left',fontSize:10,letterSpacing:2,textTransform:'uppercase',color:'#4a5568',fontWeight:500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(students || []).map(s => (
                  <tr key={s.id} style={{ borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                    <td style={{ padding:'12px',color:'#f0f2f7' }}>{s.full_name || '—'}</td>
                    <td style={{ padding:'12px',color:'#8892a4' }}>{s.email}</td>
                    <td style={{ padding:'12px',color:'#4d9de0',fontFamily:'Syne,sans-serif',fontWeight:700 }}>{s.tests_taken}</td>
                    <td style={{ padding:'12px',color:s.avg_score>=70?'#10d68e':s.avg_score>=50?'#f5c842':'#ff5f6d',fontFamily:'Syne,sans-serif',fontWeight:700 }}>
                      {s.avg_score ? `${s.avg_score}%` : '—'}
                    </td>
                    <td style={{ padding:'12px',color:'#4a5568',fontSize:11 }}>
                      {s.last_test_at ? new Date(s.last_test_at).toLocaleDateString('en-IN') : 'Never'}
                    </td>
                    <td style={{ padding:'12px' }}>
                      {(s.weak_topics || []).slice(0, 2).map((t, i) => (
                        <span key={i} style={{ fontSize:10,padding:'2px 7px',borderRadius:100,background:'rgba(255,95,109,.1)',color:'#ff5f6d',border:'1px solid rgba(255,95,109,.2)',marginRight:4 }}>{t}</span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Question Bank Tab */}
      {tab === 'bank' && (
        <div>
          <div style={{ fontSize:10,letterSpacing:3,textTransform:'uppercase',color:'#4a5568',marginBottom:14 }}>Question Bank Coverage</div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:10 }}>
            {Object.entries(bankStats || {}).map(([key, counts]) => {
              const [topic, level] = key.split('::')
              const total = (counts.simple || 0) + (counts.medium || 0) + (counts.hard || 0)
              return (
                <div key={key} style={{ padding:'16px',borderRadius:14,border:'1px solid rgba(255,255,255,.07)',background:'#0e1117' }}>
                  <div style={{ fontFamily:'Syne,sans-serif',fontSize:13,fontWeight:700,marginBottom:2 }}>{topic}</div>
                  <div style={{ fontSize:11,color:'#4a5568',marginBottom:12 }}>{level}</div>
                  <div style={{ display:'flex',gap:8 }}>
                    {[['S', counts.simple||0,'#10d68e'],['M',counts.medium||0,'#f5c842'],['H',counts.hard||0,'#ff5f6d']].map(([l,n,c])=>(
                      <div key={l} style={{ flex:1,textAlign:'center',padding:'6px',borderRadius:8,background:'#151821' }}>
                        <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,color:c,fontSize:16 }}>{n}</div>
                        <div style={{ fontSize:9,color:'#4a5568',letterSpacing:1 }}>{l}</div>
                      </div>
                    ))}
                    <div style={{ flex:1,textAlign:'center',padding:'6px',borderRadius:8,background:'#151821' }}>
                      <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,color:'#f0f2f7',fontSize:16 }}>{total}</div>
                      <div style={{ fontSize:9,color:'#4a5568',letterSpacing:1 }}>ALL</div>
                    </div>
                  </div>
                </div>
              )
            })}
            {!Object.keys(bankStats || {}).length && (
              <div style={{ color:'#4a5568',fontSize:13 }}>No questions generated yet. Students will trigger generation when they take their first test.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
