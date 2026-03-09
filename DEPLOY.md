# CA MockForge — Complete Deployment Guide
# From zero to live URL in ~45 minutes

═══════════════════════════════════════════════════════════
 STEP 1: SUPABASE SETUP (10 min)
═══════════════════════════════════════════════════════════

1. Go to https://supabase.com → Sign up / Log in
2. Click "New Project"
   - Name: ca-mockforge
   - Database password: pick a strong one, save it
   - Region: Asia (Mumbai) — closest to India
3. Wait ~2 minutes for project to spin up

4. Set up the database:
   - Click "SQL Editor" in left sidebar
   - Click "New Query"
   - Open the file: supabase-schema.sql (in this project)
   - Paste the ENTIRE contents into the editor
   - Click "Run"
   - You should see "Success. No rows returned"

5. Enable Google Auth (optional but recommended):
   - Go to Authentication → Providers → Google
   - Toggle ON
   - Follow the instructions to get Google OAuth credentials
   - (Or skip this — email/password login works without it)

6. Get your API keys:
   - Go to Settings → API
   - Copy:
     ✓ Project URL          → NEXT_PUBLIC_SUPABASE_URL
     ✓ anon (public) key    → NEXT_PUBLIC_SUPABASE_ANON_KEY
     ✓ service_role key     → SUPABASE_SERVICE_ROLE_KEY (keep secret!)

7. Add increment_used_count function (optional, for usage tracking):
   - Go to SQL Editor → New Query → paste this:

   CREATE OR REPLACE FUNCTION increment_used_count(ids uuid[])
   RETURNS void AS $$
     UPDATE questions SET used_count = used_count + 1 WHERE id = ANY(ids);
   $$ LANGUAGE sql;

═══════════════════════════════════════════════════════════
 STEP 2: ANTHROPIC API KEY (2 min)
═══════════════════════════════════════════════════════════

1. Go to https://console.anthropic.com
2. Click "API Keys" → "Create Key"
3. Copy the key → ANTHROPIC_API_KEY
4. Recommended: Set a monthly spend limit (e.g. ₹2000) in Billing

═══════════════════════════════════════════════════════════
 STEP 3: DEPLOY TO VERCEL (10 min)
═══════════════════════════════════════════════════════════

Option A — Deploy from GitHub (recommended):

1. Push this project to GitHub:
   cd ca-mockforge
   git init
   git add .
   git commit -m "Initial commit"
   # Create a repo on github.com, then:
   git remote add origin https://github.com/YOUR_USERNAME/ca-mockforge.git
   git push -u origin main

2. Go to https://vercel.com → Sign up with GitHub
3. Click "Add New Project" → Import your repo
4. Framework: Next.js (auto-detected)
5. Click "Environment Variables" and add ALL of these:

   NEXT_PUBLIC_SUPABASE_URL       = https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY  = eyJxxx...
   SUPABASE_SERVICE_ROLE_KEY      = eyJxxx...
   ANTHROPIC_API_KEY              = sk-ant-xxx...
   NEXT_PUBLIC_APP_URL            = https://your-project.vercel.app
   ADMIN_EMAIL                    = your@email.com

6. Click "Deploy"
7. Wait ~2 minutes → You get a live URL! 🎉

Option B — Deploy from CLI:
   npm i -g vercel
   cd ca-mockforge
   vercel
   # Follow prompts, add env vars when asked

═══════════════════════════════════════════════════════════
 STEP 4: CONFIGURE SUPABASE AUTH REDIRECT (2 min)
═══════════════════════════════════════════════════════════

1. In Supabase → Authentication → URL Configuration
2. Set "Site URL" to: https://your-project.vercel.app
3. Add to "Redirect URLs": https://your-project.vercel.app/**

═══════════════════════════════════════════════════════════
 STEP 5: TEST IT (5 min)
═══════════════════════════════════════════════════════════

1. Open your Vercel URL
2. Sign up with your email
3. Pick a topic + level → Start Test
4. First test will take ~15s (generating question bank)
5. Second student doing the same topic = instant ⚡
6. Admin dashboard: your-url.vercel.app/admin
   (only works for the email set in ADMIN_EMAIL)

═══════════════════════════════════════════════════════════
 CUSTOM DOMAIN (optional, 5 min)
═══════════════════════════════════════════════════════════

1. Buy a domain (e.g. camockforge.in) from GoDaddy/Namecheap (~₹800/yr)
2. In Vercel → Project → Settings → Domains → Add Domain
3. Follow DNS instructions → live in ~10 minutes

═══════════════════════════════════════════════════════════
 ARCHITECTURE RECAP
═══════════════════════════════════════════════════════════

  Student Browser
       │
       ├── GET /          → Next.js frontend (Vercel CDN)
       ├── POST /api/generate-test → checks Supabase question bank
       │                             generates via Claude Haiku if needed
       │                             returns 10 questions (4S+3M+3H)
       └── POST /api/submit-test  → saves answers + timings
                                    calls Claude Sonnet for analysis
                                    updates student profile

  Supabase:
  ├── Auth (student login)
  ├── questions (shared bank, generated once per topic+level)
  ├── tests (per-student test records)
  └── student_profiles (adaptive intelligence per student)

═══════════════════════════════════════════════════════════
 COST ESTIMATE (after question bank is warm)
═══════════════════════════════════════════════════════════

  Question generation: ~₹25 per topic+level combo (one time)
  Analysis per test:   ~₹1.50 per student per test
  Vercel hosting:      Free up to 100GB bandwidth
  Supabase:            Free up to 50,000 monthly active users

  At 500 students × 3 tests/month = 1,500 tests
  → Total AI cost: ~₹2,250/month
  → Cost per test: ~₹1.50

═══════════════════════════════════════════════════════════
 TROUBLESHOOTING
═══════════════════════════════════════════════════════════

  "Unauthorized" error   → Check Supabase keys in Vercel env vars
  "Not enough questions" → First test for a topic takes ~20s; retry
  Admin shows "Forbidden" → Make sure ADMIN_EMAIL matches your login email
  Login redirect loop    → Check NEXT_PUBLIC_APP_URL matches your Vercel URL
  Build fails            → Run `npm install` locally first, check for errors
