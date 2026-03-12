import { useState } from "react";
import { useRouter } from "next/router";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";

const supabase = createPagesBrowserClient();

const T = {
  bg: "#F9F7F4", surface: "#FFFFFF",
  border: "#E8E4DF", borderLight: "#F0EDE9",
  text: "#1C1917", textMid: "#6B6460", textSoft: "#A09690",
  accent: "#C17B4E", accentBg: "#FAF2EB",
  green: "#4A7C59", greenBg: "#EEF5F1",
  red: "#A05050", redBg: "#FAF0F0",
};

export default function Login() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!phone.trim() || phone.length < 10) { setError("Please enter a valid phone number."); return; }
    setLoading(true);
    setError("");

    try {
      // Use phone as a unique email-like identifier
      const fakeEmail = `${phone.trim()}@mockforge.app`;
      const password = `mf_${phone.trim()}_2024`;

      // Try sign in first
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password,
      });

      if (signInData?.session) {
        // Existing user — update name if needed
        await supabase.from("student_profiles").upsert({
          id: signInData.session.user.id,
          full_name: name.trim(),
          phone: phone.trim(),
          email: fakeEmail,
        }, { onConflict: "id" });
        router.push("/");
        return;
      }

      // New user — sign up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: fakeEmail,
        password,
        options: {
          data: { full_name: name.trim() },
          emailRedirectTo: undefined,
        }
      });

      if (signUpError) throw signUpError;

      if (signUpData?.session) {
        // Auto-confirmed — create profile
        await supabase.from("student_profiles").upsert({
          id: signUpData.session.user.id,
          full_name: name.trim(),
          phone: phone.trim(),
          email: fakeEmail,
          tests_taken: 0,
          avg_score: 0,
          streak: 0,
          weak_topics: [],
          strong_topics: [],
        }, { onConflict: "id" });
        router.push("/");
      } else {
        // Email confirmation required — disable this in Supabase
        setError("Please disable email confirmation in Supabase Auth settings.");
      }

    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: T.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Lato', 'Segoe UI', sans-serif", padding: 24,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus { outline: none; border-color: #C17B4E !important; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div style={{
        background: T.surface, borderRadius: 24, padding: "40px 36px",
        width: "100%", maxWidth: 400,
        border: `1px solid ${T.border}`,
        boxShadow: "0 4px 24px rgba(28,25,23,0.08)",
        animation: "fadeUp 0.4s ease both",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🎯</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: T.text, letterSpacing: -0.3 }}>MockForge</div>
          <div style={{ fontSize: 13, color: T.textSoft, marginTop: 4 }}>Your CA Journey Partner</div>
        </div>

        {/* Welcome */}
        <div style={{
          background: T.greenBg, borderRadius: 12, padding: "14px 16px",
          marginBottom: 28, borderLeft: `3px solid ${T.green}`,
          fontSize: 13, color: T.textMid, lineHeight: 1.6,
        }}>
          Welcome! Enter your name and phone number to get started. No password needed.
        </div>

        {/* Name */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: T.textSoft, textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 8 }}>
            Your Name
          </label>
          <input
            type="text"
            placeholder="e.g. Rahul Sharma"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            style={{
              width: "100%", padding: "12px 16px", borderRadius: 10,
              border: `1px solid ${T.border}`, background: T.bg,
              fontSize: 15, color: T.text, transition: "border-color 0.15s",
            }}
          />
        </div>

        {/* Phone */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: T.textSoft, textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 8 }}>
            Phone Number
          </label>
          <input
            type="tel"
            placeholder="e.g. 9876543210"
            value={phone}
            onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            style={{
              width: "100%", padding: "12px 16px", borderRadius: 10,
              border: `1px solid ${T.border}`, background: T.bg,
              fontSize: 15, color: T.text, transition: "border-color 0.15s",
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: T.redBg, borderRadius: 10, padding: "11px 14px",
            marginBottom: 16, fontSize: 13, color: T.red,
            borderLeft: `3px solid ${T.red}`,
          }}>{error}</div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%", padding: "14px",
            background: loading ? T.textSoft : T.text,
            color: "#fff", border: "none", borderRadius: 12,
            fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
            transition: "background 0.15s",
          }}
        >
          {loading ? "Getting ready..." : "Start Learning →"}
        </button>

        <div style={{ fontSize: 12, color: T.textSoft, textAlign: "center", marginTop: 16, lineHeight: 1.6 }}>
          Returning user? Just enter the same name and phone number.
        </div>
      </div>
    </div>
  );
}
