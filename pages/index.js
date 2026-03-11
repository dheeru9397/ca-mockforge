import { useState, useEffect } from "react";

// ─── MENTOR MESSAGES BY TIME ─────────────────────────────────────
const getGreeting = (name) => {
  const h = new Date().getHours();
  if (h < 12) return `Good morning, ${name} ☀️`;
  if (h < 17) return `Good afternoon, ${name} 🌤️`;
  return `Good evening, ${name} 🌙`;
};

const getEncouragement = (avgScore, streak) => {
  if (streak >= 7) return "A week of showing up. That's real commitment.";
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

// ─── DATA ────────────────────────────────────────────────────────
const STUDENT = {
  name: "Rahul",
  testsCompleted: 12,
  avgScore: 74,
  streak: 5,
  weakTopics: ["Time Value of Money", "Probability"],
  strongTopics: ["Ratio & Proportion", "Contract Act"],
  recentTests: [
    { subject: "Quantitative Aptitude", score: 80, date: "Today", grade: "B+", improved: true },
    { subject: "Business Economics", score: 68, date: "Yesterday", grade: "C+", improved: false },
    { subject: "Accounting", score: 85, date: "2 days ago", grade: "A", improved: true },
    { subject: "Business Laws", score: 61, date: "3 days ago", grade: "C", improved: false },
  ],
};

const SUBJECTS = [
  { id: "qa",  name: "Quantitative Aptitude",              icon: "📐", lastScore: 80 },
  { id: "be",  name: "Business Economics",                 icon: "📈", lastScore: 68 },
  { id: "acc", name: "Accounting",                         icon: "📊", lastScore: 85 },
  { id: "law", name: "Business Laws",                      icon: "⚖️", lastScore: 61 },
  { id: "bck", name: "Business & Commercial Knowledge",    icon: "🏢", lastScore: null },
  { id: "fr",  name: "Financial Reporting",                icon: "📋", lastScore: null },
];

// ─── TOKENS ──────────────────────────────────────────────────────
const T = {
  bg:          "#F9F7F4",
  surface:     "#FFFFFF",
  surfaceAlt:  "#F4F2EF",
  border:      "#E8E4DF",
  borderLight: "#F0EDE9",
  text:        "#1C1917",
  textMid:     "#6B6460",
  textSoft:    "#A09690",
  accent:      "#C17B4E",   // warm terracotta — muted, not loud
  accentBg:    "#FAF2EB",
  green:       "#4A7C59",
  greenBg:     "#EEF5F1",
  amber:       "#A07840",
  amberBg:     "#FAF4E8",
  red:         "#A05050",
  redBg:       "#FAF0F0",
};

// ─── HELPERS ─────────────────────────────────────────────────────
const gradeColor = (g) => {
  if (!g) return T.textSoft;
  if (g[0] === "A") return T.green;
  if (g[0] === "B") return T.accent;
  if (g[0] === "C") return T.amber;
  return T.red;
};

const scoreColor = (s) => {
  if (!s) return T.textSoft;
  if (s >= 80) return T.green;
  if (s >= 65) return T.accent;
  return T.amber;
};

// ─── SMALL COMPONENTS ────────────────────────────────────────────

function Divider() {
  return <div style={{ height: 1, background: T.borderLight, margin: "0" }} />;
}

function Tag({ children, color, bg }) {
  return (
    <span style={{
      display: "inline-block",
      background: bg, color,
      borderRadius: 6, padding: "3px 10px",
      fontSize: 12, fontWeight: 600,
      lineHeight: 1.5,
    }}>{children}</span>
  );
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
      <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 100 }} />
    </div>
  );
}

// ─── SUBJECT ROW (for practice tab — clean list) ──────────────────
function SubjectRow({ subject, onStart }) {
  const [hov, setHov] = useState(false);
  const sc = scoreColor(subject.lastScore);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => onStart(subject)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 20px",
        background: hov ? T.surfaceAlt : T.surface,
        cursor: "pointer",
        transition: "background 0.15s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 20, width: 28, textAlign: "center" }}>{subject.icon}</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{subject.name}</div>
          {subject.lastScore && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <TinyBar value={subject.lastScore} color={sc} />
              <span style={{ fontSize: 11, color: T.textSoft }}>Last: {subject.lastScore}%</span>
            </div>
          )}
          {!subject.lastScore && (
            <div style={{ fontSize: 11, color: T.textSoft, marginTop: 2 }}>Not started yet</div>
          )}
        </div>
      </div>
      <div style={{
        fontSize: 12, fontWeight: 600,
        color: hov ? T.accent : T.textSoft,
        transition: "color 0.15s",
      }}>
        {hov ? "Start →" : "Practice"}
      </div>
    </div>
  );
}

// ─── MODAL ────────────────────────────────────────────────────────
function Modal({ subject, onClose }) {
  const [diff, setDiff] = useState("Mixed");
  const note = getScoreNote(subject.lastScore);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(28,25,23,0.35)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 200, padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: T.surface,
          borderRadius: 20, padding: "32px",
          width: "100%", maxWidth: 400,
          boxShadow: "0 8px 40px rgba(28,25,23,0.12)",
          border: `1px solid ${T.border}`,
          animation: "floatIn 0.3s cubic-bezier(0.34,1.4,0.64,1) both",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <span style={{ fontSize: 32 }}>{subject.icon}</span>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: T.text }}>{subject.name}</div>
            <div style={{ fontSize: 12, color: T.textSoft, marginTop: 1 }}>10 questions · ~8 min</div>
          </div>
        </div>

        {note && (
          <div style={{
            background: T.accentBg, borderRadius: 10,
            padding: "11px 14px", marginBottom: 20,
            fontSize: 13, color: T.textMid, lineHeight: 1.6,
            borderLeft: `3px solid ${T.accent}`,
          }}>
            {note}
          </div>
        )}

        {!subject.lastScore && (
          <div style={{
            background: T.greenBg, borderRadius: 10,
            padding: "11px 14px", marginBottom: 20,
            fontSize: 13, color: T.textMid, lineHeight: 1.6,
            borderLeft: `3px solid ${T.green}`,
          }}>
            First time here — exciting! Take it easy, focus on learning.
          </div>
        )}

        {/* Difficulty */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textSoft, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
            Difficulty
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {["Easy", "Mixed", "Hard"].map(d => (
              <button key={d} onClick={() => setDiff(d)} style={{
                flex: 1, padding: "9px 0", borderRadius: 10,
                border: `1px solid ${diff === d ? T.accent : T.border}`,
                background: diff === d ? T.accentBg : T.surface,
                color: diff === d ? T.accent : T.textMid,
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                transition: "all 0.15s",
              }}>{d}</button>
            ))}
          </div>
        </div>

        <button style={{
          width: "100%", padding: "13px",
          background: T.text, color: "#fff",
          border: "none", borderRadius: 12,
          fontSize: 15, fontWeight: 700, cursor: "pointer",
          letterSpacing: 0.2,
        }}>
          Begin Test
        </button>
        <button onClick={onClose} style={{
          width: "100%", padding: "10px",
          background: "none", border: "none",
          color: T.textSoft, fontSize: 13, cursor: "pointer", marginTop: 6,
        }}>
          Not now
        </button>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────
export default function CAMockForge() {
  const [tab, setTab] = useState("home");
  const [modal, setModal] = useState(null);
const [greeting, setGreeting] = useState(`Hey ${STUDENT.name}!`);
const [encouragement, setEncouragement] = useState("Every test brings you closer.");

useEffect(() => {
  setGreeting(getGreeting(STUDENT.name));
  setEncouragement(getEncouragement(STUDENT.avgScore, STUDENT.streak));
}, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: T.bg,
      fontFamily: "'Lato', 'Segoe UI', sans-serif",
      color: T.text,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { display: none; }
        @keyframes floatIn {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)  scale(1);    }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .page { animation: fadeUp 0.35s ease both; }
        button { font-family: inherit; }
      `}</style>

      {/* ── NAV ── */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(249,247,244,0.95)",
        backdropFilter: "blur(10px)",
        borderBottom: `1px solid ${T.border}`,
        height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px",
      }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: T.text, letterSpacing: -0.2 }}>
          MockForge
        </div>

        <div style={{ display: "flex", gap: 4 }}>
          {[
            { id: "home",     label: "Home"     },
            { id: "practice", label: "Practice" },
            { id: "progress", label: "Progress" },
          ].map(n => (
            <button key={n.id} onClick={() => setTab(n.id)} style={{
              padding: "6px 14px", borderRadius: 8,
              border: "none",
              background: tab === n.id ? T.text : "transparent",
              color: tab === n.id ? "#fff" : T.textMid,
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              transition: "all 0.15s",
            }}>{n.label}</button>
          ))}
        </div>

        {/* Streak — small, unobtrusive */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 14 }}>🔥</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.amber }}>{STUDENT.streak}</span>
          <span style={{ fontSize: 12, color: T.textSoft }}>day streak</span>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{
        maxWidth: 680, margin: "0 auto",
        padding: "80px 24px 60px",
      }}>

        {/* ══ HOME ══ */}
        {tab === "home" && (
          <div className="page">

            {/* Greeting */}
            <div style={{ marginBottom: 32 }}>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: T.text, letterSpacing: -0.3, marginBottom: 6 }}>
                {greeting}
              </h1>
              <p style={{ fontSize: 15, color: T.textMid, lineHeight: 1.7 }}>
                {encouragement}
              </p>
            </div>

            {/* Quick start */}
            <div style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: 16, overflow: "hidden",
              marginBottom: 24,
            }}>
              <div style={{ padding: "20px 22px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.textSoft, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
                  Suggested for today
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 6 }}>
                  📐 Quantitative Aptitude
                </div>
                <div style={{ fontSize: 13, color: T.textMid, lineHeight: 1.6, marginBottom: 16 }}>
                  You scored 52% on Time Value of Money last time. A focused 10-question session today can change that.
                </div>
                <button
                  onClick={() => setModal(SUBJECTS[0])}
                  style={{
                    background: T.text, color: "#fff",
                    border: "none", borderRadius: 10,
                    padding: "10px 20px", fontSize: 14, fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Start now
                </button>
              </div>
            </div>

            {/* Test summary — 2 clean stats */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr",
              gap: 12, marginBottom: 24,
            }}>
              {[
                { label: "Tests completed", value: STUDENT.testsCompleted },
                { label: "Average score",   value: `${STUDENT.avgScore}%` },
              ].map((s, i) => (
                <div key={i} style={{
                  background: T.surface, border: `1px solid ${T.border}`,
                  borderRadius: 14, padding: "18px 20px",
                }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: T.text, letterSpacing: -0.5 }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: T.textSoft, marginTop: 3, fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Recent tests */}
            <div style={{
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 16, overflow: "hidden", marginBottom: 24,
            }}>
              <div style={{ padding: "16px 22px 12px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Recent Tests</div>
              </div>
              <Divider />
              {STUDENT.recentTests.map((t, i) => (
                <div key={i}>
                  <div style={{
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 22px",
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{t.subject}</div>
                      <div style={{ fontSize: 11, color: T.textSoft, marginTop: 2 }}>{t.date}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {t.improved && <span style={{ fontSize: 11, color: T.green }}>↑ improved</span>}
                      <ScoreDot score={t.score} />
                      <Tag color={gradeColor(t.grade)} bg={gradeColor(t.grade) + "18"}>
                        {t.grade}
                      </Tag>
                    </div>
                  </div>
                  {i < STUDENT.recentTests.length - 1 && <Divider />}
                </div>
              ))}
            </div>

            {/* Growth map */}
            <div style={{
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 16, padding: "20px 22px",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>
                Your Growth Map
              </div>
              <div style={{ fontSize: 12, color: T.textSoft, marginBottom: 18, lineHeight: 1.6 }}>
                Based on your recent tests — here's where to focus.
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.textSoft, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
                  Focus here
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {STUDENT.weakTopics.map(t => (
                    <Tag key={t} color={T.amber} bg={T.amberBg}>
                      {t}
                    </Tag>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.textSoft, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
                  Your strengths
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {STUDENT.strongTopics.map(t => (
                    <Tag key={t} color={T.green} bg={T.greenBg}>
                      {t}
                    </Tag>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ══ PRACTICE ══ */}
        {tab === "practice" && (
          <div className="page">
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: T.text, marginBottom: 6 }}>Practice</h1>
              <p style={{ fontSize: 14, color: T.textMid }}>
                Pick a subject. Take it one question at a time.
              </p>
            </div>

            {/* Level selector — minimal */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {["Foundation", "Intermediate", "Final"].map((l, i) => (
                <button key={l} style={{
                  padding: "6px 16px", borderRadius: 8,
                  border: `1px solid ${i === 0 ? T.text : T.border}`,
                  background: i === 0 ? T.text : "transparent",
                  color: i === 0 ? "#fff" : T.textMid,
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>{l}</button>
              ))}
            </div>

            {/* Subject list — clean rows */}
            <div style={{
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 16, overflow: "hidden",
            }}>
              {SUBJECTS.map((s, i) => (
                <div key={s.id}>
                  <SubjectRow subject={s} onStart={setModal} />
                  {i < SUBJECTS.length - 1 && <Divider />}
                </div>
              ))}
            </div>

            {/* Gentle note */}
            <div style={{
              marginTop: 20, padding: "14px 18px",
              background: T.accentBg, borderRadius: 12,
              fontSize: 13, color: T.textMid, lineHeight: 1.7,
              borderLeft: `3px solid ${T.accent}`,
            }}>
              One test a day is all it takes. Consistency over intensity — always.
            </div>
          </div>
        )}

        {/* ══ PROGRESS ══ */}
        {tab === "progress" && (
          <div className="page">
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: T.text, marginBottom: 6 }}>Your Progress</h1>
              <p style={{ fontSize: 14, color: T.textMid }}>
                {STUDENT.testsCompleted} tests completed. Here's how you're doing.
              </p>
            </div>

            {/* Score trend — simple bars */}
            <div style={{
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 16, padding: "22px", marginBottom: 20,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 20 }}>
                Score Trend
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 100 }}>
                {[52, 61, 58, 70, 68, 72, 74, 80, 72, 80, 68, 85].map((score, i) => {
                  const isLast = i === 11;
                  const c = score >= 80 ? T.green : score >= 65 ? T.accent : T.amber;
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div style={{
                        width: "100%",
                        height: `${score}%`,
                        background: isLast ? T.text : score >= 75 ? T.border + "99" : T.borderLight,
                        borderRadius: 4,
                        border: isLast ? "none" : `1px solid ${T.border}`,
                      }} />
                      {isLast && (
                        <div style={{ fontSize: 9, color: T.textSoft, whiteSpace: "nowrap" }}>latest</div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 14, fontSize: 12, color: T.textSoft }}>
                Up from 52% on your first test to 85% recently. That's real progress.
              </div>
            </div>

            {/* Subject breakdown — clean list */}
            <div style={{
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 16, overflow: "hidden", marginBottom: 20,
            }}>
              <div style={{ padding: "16px 22px 12px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>By Subject</div>
              </div>
              <Divider />
              {SUBJECTS.filter(s => s.lastScore).map((s, i, arr) => (
                <div key={s.id}>
                  <div style={{ padding: "14px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 18 }}>{s.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{s.name}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <TinyBar value={s.lastScore} color={scoreColor(s.lastScore)} />
                      <ScoreDot score={s.lastScore} />
                    </div>
                  </div>
                  {i < arr.length - 1 && <Divider />}
                </div>
              ))}
            </div>

            {/* Growth map on progress page too */}
            <div style={{
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 16, padding: "20px 22px",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 16 }}>
                Growth Map
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.textSoft, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
                  Focus here
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {STUDENT.weakTopics.map(t => (
                    <Tag key={t} color={T.amber} bg={T.amberBg}>{t}</Tag>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.textSoft, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
                  Your strengths
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {STUDENT.strongTopics.map(t => (
                    <Tag key={t} color={T.green} bg={T.greenBg}>{t}</Tag>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* ── MODAL ── */}
      {modal && <Modal subject={modal} onClose={() => setModal(null)} />}

    </div>
  );
}
