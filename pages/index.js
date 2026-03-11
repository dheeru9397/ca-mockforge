import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";

const supabase = createPagesBrowserClient();

const SUBJECTS = [
  { id: "Quantitative Aptitude",           icon: "📐", levels: ["Foundation"] },
  { id: "Business Economics",              icon: "📈", levels: ["Foundation"] },
  { id: "Accounting",                      icon: "📊", levels: ["Foundation", "Inter", "Final"] },
  { id: "Business Laws",                   icon: "⚖️", levels: ["Foundation"] },
  { id: "Business & Commercial Knowledge", icon: "🏢", levels: ["Foundation"] },
  { id: "Financial Reporting",             icon: "📋", levels: ["Inter", "Final"] },
  { id: "Auditing",                        icon: "🔍", levels: ["Inter", "Final"] },
  { id: "Taxation",                        icon: "🧾", levels: ["Inter", "Final"] },
  { id: "Corporate Law",                   icon: "🏛️", levels: ["Inter", "Final"] },
  { id: "Cost Accounting",                 icon: "💰", levels: ["Inter", "Final"] },
];

const LEVELS = ["Foundation", "Inter", "Final"];

const getGreeting = (name) => {
  const h = new Date().getHours();
  const first = name?.split(" ")[0] || "there";
  if (h < 12) return `Good morning, ${first} ☀️`;
  if (h < 17) return `Good afternoon, ${first} 🌤️`;
  return `Good evening, ${first} 🌙`;
};

const getEncouragement = (testsCount, avgScore) => {
  if (testsCount === 0) return "Welcome! Your CA journey starts here. Take your first test when you're ready.";
  if (testsCount < 5) return "Great start! Keep the momentum going — consistency is everything.";
  if (avgScore >= 80) return "Your scores are reflecting your effort. Keep going.";
  if (avgScore >= 65) return "You're building momentum. Every test counts.";
  return "Every attempt makes you sharper. You're on the right path.";
};

const getScoreNote = (score) => {
  if (!score) return null;
  if (score >= 85) return "Excellent work on this one.";
  if (score >= 70) return "Solid. A little more practice and you'll ace it.";
  if (score >= 55) return "Good attempt. Review the explanations and try again.";
  return "This one was tough — but now you know exactly what to focus on.";
};

const T = {
  bg: "#F9F7F4", surface: "#FFFFFF", surfaceAlt: "#F4F2EF",
  border: "#E8E4DF", borderLight: "#F0EDE9",
  text: "#1C1917", textMid: "#6B6460", textSoft: "#A09690",
  accent: "#C17B4E", accentBg: "#FAF2EB",
  green: "#4A7C59", greenBg: "#EEF5F1",
  amber: "#A07840", amberBg: "#FAF4E8",
  red: "#A05050", redBg: "#FAF0F0",
};

const scoreColor = (s) => { if (!s) return T.textSoft; if (s >= 80) return T.green; if (s >= 65) return T.accent; return T.amber; };
const gradeColor = (g) => { if (!g) return T.textSoft; if (g[0]==="A") return T.green; if (g[0]==="B") return T.accent; if (g[0]==="C") return T.amber; return T.red; };

function Divider() { return <div style={{ height: 1, background: T.borderLight }} />; }

function Tag({ children, color, bg }) {
  return <span style={{ display: "inline-block", background: bg, color, borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600, lineHeight: 1.5 }}>{children}</span>;
}

function ScoreDot({ score }) {
  const c = scoreColor(score);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: c, flexShrink: 0 }} />
      <span style={{ fontSize: 13, fontWeight: 700, color: c }}>{score}%</span>
    </div>
  );
}

function TinyBar({ value, color }) {
  return (
    <div style={{ height: 3, background: T.border, borderRadius: 100, width: 60 }}>
      <div style={{ height: "100%", width: `${Math.min(value, 100)}%`, background: color, borderRadius: 100 }} />
    </div>
  );
}

function EmptyState({ icon, title, subtitle }) {
  return (
    <div style={{ padding: "40px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: T.textSoft, lineHeight: 1.6 }}>{subtitle}</div>
    </div>
  );
}

function SubjectRow({ subject, lastScore, onStart }) {
  const [hov, setHov] = useState(false);
  const sc = scoreColor(lastScore);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={() => onStart(subject)}
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: hov ? T.surfaceAlt : T.surface, cursor: "pointer", transition: "background 0.15s ease" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 20, width: 28, textAlign: "center" }}>{subject.icon}</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{subject.id}</div>
          {lastScore ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <TinyBar value={lastScore} color={sc} />
              <span style={{ fontSize: 11, color: T.textSoft }}>Last: {lastScore}%</span>
            </div>
          ) : (
            <div style={{ fontSize: 11, color: T.textSoft, marginTop: 2 }}>Not started yet</div>
          )}
        </div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: hov ? T.accent : T.textSoft, transition: "color 0.15s" }}>
        {hov ? "Start →" : "Practice"}
      </div>
    </div>
  );
}

function Modal({ subject, lastScore, level, onClose, onStart }) {
  const [diff, setDiff] = useState("Mixed");
  const note = getScoreNote(lastScore);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(28,25,23,0.35)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.surface, borderRadius: 20, padding: "32px", width: "100%", maxWidth: 400, boxShadow: "0 8px 40px rgba(28,25,23,0.12)", border: `1px solid ${T.border}`, animation: "floatIn 0.3s cubic-bezier(0.34,1.4,0.64,1) both" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <span style={{ fontSize: 32 }}>{subject.icon}</span>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: T.text }}>{subject.id}</div>
            <div style={{ fontSize: 12, color: T.textSoft, marginTop: 1 }}>10 questions · ~8 min · {level}</div>
          </div>
        </div>
        {note ? (
          <div style={{ background: T.accentBg, borderRadius: 10, padding: "11px 14px", marginBottom: 20, fontSize: 13, color: T.textMid, lineHeight: 1.6, borderLeft: `3px solid ${T.accent}` }}>{note}</div>
        ) : (
          <div style={{ background: T.greenBg, borderRadius: 10, padding: "11px 14px", marginBottom: 20, fontSize: 13, color: T.textMid, lineHeight: 1.6, borderLeft: `3px solid ${T.green}` }}>First time here — exciting! Take it easy, focus on learning.</div>
        )}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textSoft, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Difficulty</div>
          <div style={{ display: "flex", gap: 8 }}>
            {["Easy", "Mixed", "Hard"].map(d => (
              <button key={d} onClick={() => setDiff(d)} style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: `1px solid ${diff === d ? T.accent : T.border}`, background: diff === d ? T.accentBg : T.surface, color: diff === d ? T.accent : T.textMid, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>{d}</button>
            ))}
          </div>
        </div>
        <button onClick={() => onStart(subject.id, level, diff)} style={{ width: "100%", padding: "13px", background: T.text, color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Begin Test</button>
        <button onClick={onClose} style={{ width: "100%", padding: "10px", background: "none", border: "none", color: T.textSoft, fontSize: 13, cursor: "pointer", marginTop: 6 }}>Not now</button>
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [tab, setTab] = useState("home");
  const [level, setLevel] = useState("Foundation");
  const [modal, setModal] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [recentTests, setRecentTests] = useState([]);
  const [subjectScores, setSubjectScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("Welcome!");
  const [encouragement, setEncouragement] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      setUser(session.user);
      await loadStudentData(session.user);
      setLoading(false);
    };
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) router.push("/login");
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadStudentData = async (authUser) => {
    try {
      const { data: prof } = await supabase.from("student_profiles").select("*").eq("id", authUser.id).single();
      setProfile(prof);
      const { data: tests } = await supabase.from("tests").select("*").eq("student_id", authUser.id).order("completed_at", { ascending: false }).limit(5);
      setRecentTests(tests || []);
      const scores = {};
      (tests || []).forEach(t => {
        const topic = t.topics?.[0];
        if (topic && !scores[topic]) scores[topic] = Math.round((t.score / 10) * 100);
      });
      setSubjectScores(scores);
      const name = prof?.full_name || authUser.user_metadata?.full_name || authUser.email;
      setGreeting(getGreeting(name));
      setEncouragement(getEncouragement(prof?.tests_taken || 0, prof?.avg_score || 0));
    } catch (err) { console.error(err); }
  };

  const handleSignOut = async () => { await supabase.auth.signOut(); router.push("/login"); };

  const handleStartTest = (topicId, selectedLevel, difficulty) => {
    setModal(null);
    router.push(`/?topic=${encodeURIComponent(topicId)}&level=${selectedLevel}&difficulty=${difficulty}&start=true`);
  };

  const filteredSubjects = SUBJECTS.filter(s => s.levels.includes(level));

  const getSuggestedSubject = () => {
    const ls = filteredSubjects;
    const untried = ls.find(s => !subjectScores[s.id]);
    if (untried) return untried;
    return ls.reduce((low, s) => (subjectScores[s.id] || 100) < (subjectScores[low.id] || 100) ? s : low, ls[0]);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Lato, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🎯</div>
          <div style={{ fontSize: 14, color: T.textSoft }}>Loading your dashboard...</div>
        </div>
      </div>
    );
  }

  const suggested = getSuggestedSubject();
  const testsCount = profile?.tests_taken || 0;
  const avgScore = profile?.avg_score || 0;
  const weakTopics = profile?.weak_topics || [];
  const strongTopics = profile?.strong_topics || [];

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Lato', 'Segoe UI', sans-serif", color: T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { display: none; }
        @keyframes floatIn { from { opacity:0; transform:translateY(12px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .page { animation: fadeUp 0.35s ease both; }
        button { font-family: inherit; }
      `}</style>

      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(249,247,244,0.95)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${T.border}`, height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: T.text, letterSpacing: -0.2 }}>MockForge</div>
        <div style={{ display: "flex", gap: 4 }}>
          {[{ id: "home", label: "Home" }, { id: "practice", label: "Practice" }, { id: "progress", label: "Progress" }].map(n => (
            <button key={n.id} onClick={() => setTab(n.id)} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: tab === n.id ? T.text : "transparent", color: tab === n.id ? "#fff" : T.textMid, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>{n.label}</button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {(profile?.streak || 0) > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 14 }}>🔥</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.amber }}>{profile.streak}</span>
              <span style={{ fontSize: 12, color: T.textSoft }}>day streak</span>
            </div>
          )}
          <button onClick={handleSignOut} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 8, padding: "5px 12px", fontSize: 12, color: T.textSoft, cursor: "pointer" }}>Sign out</button>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "80px 24px 60px" }}>

        {tab === "home" && (
          <div className="page">
            <div style={{ marginBottom: 32 }}>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: T.text, letterSpacing: -0.3, marginBottom: 6 }}>{greeting}</h1>
              <p style={{ fontSize: 15, color: T.textMid, lineHeight: 1.7 }}>{encouragement}</p>
            </div>

            {testsCount === 0 && (
              <div style={{ background: T.greenBg, border: `1px solid #C6E8D4`, borderRadius: 16, padding: "20px 22px", marginBottom: 24, borderLeft: `4px solid ${T.green}` }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.green, marginBottom: 6 }}>Welcome to MockForge! 🎉</div>
                <div style={{ fontSize: 13, color: T.textMid, lineHeight: 1.7 }}>You haven't taken any tests yet. That's completely fine — every CA topper started exactly where you are right now. Pick a subject below and take your first test. No pressure, just learning.</div>
              </div>
            )}

            {suggested && (
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden", marginBottom: 24 }}>
                <div style={{ padding: "20px 22px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.textSoft, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>{testsCount === 0 ? "Start here" : "Suggested for today"}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 6 }}>{suggested.icon} {suggested.id}</div>
                  <div style={{ fontSize: 13, color: T.textMid, lineHeight: 1.6, marginBottom: 16 }}>
                    {subjectScores[suggested.id] ? `You scored ${subjectScores[suggested.id]}% last time. A focused session today can push that higher.` : `You haven't tried this subject yet. A great place to start your ${level} preparation.`}
                  </div>
                  <button onClick={() => setModal(suggested)} style={{ background: T.text, color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Start now</button>
                </div>
              </div>
            )}

            {testsCount > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
                {[{ label: "Tests completed", value: testsCount }, { label: "Average score", value: `${Math.round(avgScore)}%` }].map((s, i) => (
                  <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 20px" }}>
                    <div style={{ fontSize: 26, fontWeight: 900, color: T.text, letterSpacing: -0.5 }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: T.textSoft, marginTop: 3, fontWeight: 600 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {recentTests.length > 0 && (
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden", marginBottom: 24 }}>
                <div style={{ padding: "16px 22px 12px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Recent Tests</div>
                </div>
                <Divider />
                {recentTests.map((t, i) => {
                  const score = t.score !== null ? Math.round((t.score / 10) * 100) : null;
                  const grade = t.grade || (score >= 85 ? "A" : score >= 70 ? "B" : score >= 55 ? "C" : "D");
                  const topic = t.topics?.[0] || "Test";
                  const date = new Date(t.completed_at);
                  const isToday = new Date().toDateString() === date.toDateString();
                  const dateStr = isToday ? "Today" : date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
                  return (
                    <div key={t.id}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 22px" }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{topic}</div>
                          <div style={{ fontSize: 11, color: T.textSoft, marginTop: 2 }}>{dateStr}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          {score && <ScoreDot score={score} />}
                          <Tag color={gradeColor(grade)} bg={gradeColor(grade) + "18"}>{grade}</Tag>
                        </div>
                      </div>
                      {i < recentTests.length - 1 && <Divider />}
                    </div>
                  );
                })}
              </div>
            )}

            {(weakTopics.length > 0 || strongTopics.length > 0) ? (
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px 22px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>Your Growth Map</div>
                <div style={{ fontSize: 12, color: T.textSoft, marginBottom: 18, lineHeight: 1.6 }}>Based on your recent tests — here's where to focus.</div>
                {weakTopics.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.textSoft, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Focus here</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>{weakTopics.map(t => <Tag key={t} color={T.amber} bg={T.amberBg}>{t}</Tag>)}</div>
                  </div>
                )}
                {strongTopics.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.textSoft, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Your strengths</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>{strongTopics.map(t => <Tag key={t} color={T.green} bg={T.greenBg}>{t}</Tag>)}</div>
                  </div>
                )}
              </div>
            ) : testsCount > 0 ? (
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px 22px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 6 }}>Your Growth Map</div>
                <div style={{ fontSize: 13, color: T.textSoft, lineHeight: 1.6 }}>Complete a few more tests and we'll show you exactly where to focus your energy.</div>
              </div>
            ) : null}
          </div>
        )}

        {tab === "practice" && (
          <div className="page">
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: T.text, marginBottom: 6 }}>Practice</h1>
              <p style={{ fontSize: 14, color: T.textMid }}>Pick a subject. Take it one question at a time.</p>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {LEVELS.map(l => (
                <button key={l} onClick={() => setLevel(l)} style={{ padding: "6px 16px", borderRadius: 8, border: `1px solid ${level === l ? T.text : T.border}`, background: level === l ? T.text : "transparent", color: level === l ? "#fff" : T.textMid, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>{l}</button>
              ))}
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
              {filteredSubjects.length > 0 ? filteredSubjects.map((s, i) => (
                <div key={s.id}>
                  <SubjectRow subject={s} lastScore={subjectScores[s.id] || null} onStart={(subj) => setModal({ ...subj, selectedLevel: level })} />
                  {i < filteredSubjects.length - 1 && <Divider />}
                </div>
              )) : <EmptyState icon="📚" title="No subjects yet" subtitle="More subjects coming soon for this level." />}
            </div>
            <div style={{ marginTop: 20, padding: "14px 18px", background: T.accentBg, borderRadius: 12, fontSize: 13, color: T.textMid, lineHeight: 1.7, borderLeft: `3px solid ${T.accent}` }}>
              One test a day is all it takes. Consistency over intensity — always.
            </div>
          </div>
        )}

        {tab === "progress" && (
          <div className="page">
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: T.text, marginBottom: 6 }}>Your Progress</h1>
              <p style={{ fontSize: 14, color: T.textMid }}>{testsCount > 0 ? `${testsCount} test${testsCount > 1 ? "s" : ""} completed. Here's how you're doing.` : "No tests yet — your progress will appear here after your first test."}</p>
            </div>
            {testsCount === 0 ? (
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16 }}>
                <EmptyState icon="📈" title="Nothing here yet" subtitle="Take your first test and your progress will start to appear here. Every expert started at zero." />
              </div>
            ) : (
              <>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden", marginBottom: 20 }}>
                  <div style={{ padding: "16px 22px 12px" }}><div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>By Subject</div></div>
                  <Divider />
                  {Object.keys(subjectScores).length > 0 ? Object.entries(subjectScores).map(([topic, score], i, arr) => {
                    const subj = SUBJECTS.find(s => s.id === topic);
                    return (
                      <div key={topic}>
                        <div style={{ padding: "14px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 18 }}>{subj?.icon || "📚"}</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{topic}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <TinyBar value={score} color={scoreColor(score)} />
                            <ScoreDot score={score} />
                          </div>
                        </div>
                        {i < arr.length - 1 && <Divider />}
                      </div>
                    );
                  }) : <EmptyState icon="📊" title="No data yet" subtitle="Complete tests to see your subject breakdown." />}
                </div>
                {(weakTopics.length > 0 || strongTopics.length > 0) && (
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px 22px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 16 }}>Growth Map</div>
                    {weakTopics.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: T.textSoft, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Focus here</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>{weakTopics.map(t => <Tag key={t} color={T.amber} bg={T.amberBg}>{t}</Tag>)}</div>
                      </div>
                    )}
                    {strongTopics.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: T.textSoft, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Strengths</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>{strongTopics.map(t => <Tag key={t} color={T.green} bg={T.greenBg}>{t}</Tag>)}</div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>

      {modal && <Modal subject={modal} lastScore={subjectScores[modal.id] || null} level={modal.selectedLevel || level} onClose={() => setModal(null)} onStart={handleStartTest} />}
    </div>
  );
}
