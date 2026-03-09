// pages/login.js
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react'
import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function LoginPage() {
  const supabase = useSupabaseClient()
  const session = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) router.push('/')
  }, [session])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', position: 'relative', zIndex: 1,
    }}>
      {/* Glow */}
      <div style={{
        position: 'fixed', width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,200,66,0.07) 0%, transparent 70%)',
        top: -100, right: -100, pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #f5c842, #e8b800)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
            boxShadow: '0 0 40px rgba(245,200,66,0.3)',
          }}>⚡</div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, letterSpacing: -1, marginBottom: 6 }}>
            CA MockForge
          </div>
          <div style={{ fontSize: 13, color: 'var(--text3)', letterSpacing: 2, textTransform: 'uppercase' }}>
            Adaptive Intelligence Testing
          </div>
        </div>

        {/* Auth widget */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 20, padding: 28,
        }}>
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#f5c842', brandAccent: '#e8b800',
                    inputBackground: '#151821', inputBorder: 'rgba(255,255,255,0.07)',
                    inputText: '#f0f2f7', inputPlaceholder: '#4a5568',
                    messageText: '#f0f2f7', anchorTextColor: '#f5c842',
                    dividerBackground: 'rgba(255,255,255,0.07)',
                  },
                  fonts: { bodyFontFamily: `'DM Mono', monospace`, labelFontFamily: `'Syne', sans-serif` },
                  radii: { borderRadiusButton: '100px', inputBorderRadius: '12px' },
                }
              }
            }}
            providers={['google']}
            redirectTo={`${process.env.NEXT_PUBLIC_APP_URL}/`}
          />
        </div>
      </div>
    </div>
  )
}
