// pages/api/admin/stats.js
// Admin-only endpoint. Returns all student stats.
// Protected by checking ADMIN_EMAIL env variable.

import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' })
  const token = authHeader.replace('Bearer ', '')

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' })

  // Only allow admin email
  if (user.email !== process.env.ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  try {
    // All student profiles
    const { data: profiles } = await supabaseAdmin
      .from('student_profiles')
      .select('*')
      .order('last_test_at', { ascending: false })

    // All tests (last 30 days)
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: recentTests } = await supabaseAdmin
      .from('tests')
      .select('id, student_id, score, grade, level, topics, test_number, completed_at, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })

    // Question bank stats
    const { data: bankStats } = await supabaseAdmin
      .from('questions')
      .select('topic, level, difficulty, used_count')

    // Aggregate bank stats
    const bankByTopicLevel = {}
    for (const q of bankStats || []) {
      const key = `${q.topic}::${q.level}`
      if (!bankByTopicLevel[key]) bankByTopicLevel[key] = { simple: 0, medium: 0, hard: 0 }
      bankByTopicLevel[key][q.difficulty]++
    }

    // Summary stats
    const totalStudents = profiles?.length || 0
    const activeStudents = profiles?.filter(p => p.last_test_at && new Date(p.last_test_at) > new Date(since)).length || 0
    const totalTests = recentTests?.length || 0
    const avgScore = recentTests?.length
      ? Math.round(recentTests.filter(t => t.score != null).reduce((s, t) => s + t.score, 0) / recentTests.filter(t => t.score != null).length)
      : 0

    return res.status(200).json({
      summary: { totalStudents, activeStudents, totalTests, avgScore },
      students: profiles,
      recentTests,
      bankStats: bankByTopicLevel,
    })

  } catch (err) {
    console.error('admin stats error:', err)
    return res.status(500).json({ error: err.message })
  }
}
