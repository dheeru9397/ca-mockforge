// pages/api/submit-test.js
// Called when student finishes the test.
// 1. Saves answers + timings
// 2. Calls Claude (Sonnet) to analyse performance
// 3. Updates student profile (weak topics, avg score, etc.)

import { supabaseAdmin } from '../../lib/supabase'
import { buildAnalysisPrompt } from '../../lib/constants'

async function callClaude(system, user) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514', // Sonnet for nuanced analysis
      max_tokens: 1500,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  })
  const data = await res.json()
  const text = data.content?.map(b => b.text || '').join('') || ''
  return JSON.parse(text.replace(/```json\n?|```\n?/g, '').trim())
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' })
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

  const { testId, answers, timings } = req.body
  if (!testId || !answers || !timings) return res.status(400).json({ error: 'Missing fields' })

  try {
    // Fetch test + questions
    const { data: test } = await supabaseAdmin
      .from('tests')
      .select('*')
      .eq('id', testId)
      .eq('student_id', user.id)
      .single()

    if (!test) return res.status(404).json({ error: 'Test not found' })

    const { data: questions } = await supabaseAdmin
      .from('questions')
      .select('*')
      .in('id', test.question_ids)

    // Reorder questions to match original order
    const orderedQuestions = test.question_ids
      .map(id => questions.find(q => q.id === id))
      .filter(Boolean)

    // Run analysis via Claude
    const prompt = buildAnalysisPrompt(orderedQuestions, answers, timings)
    const analysis = await callClaude(prompt.system, prompt.user)

    const score = analysis.score || 0

    // Save test results
    await supabaseAdmin
      .from('tests')
      .update({
        answers,
        timings,
        score,
        grade: analysis.grade,
        analysis,
        completed_at: new Date().toISOString(),
      })
      .eq('id', testId)

    // Update student profile
    const { data: existingProfile } = await supabaseAdmin
      .from('student_profiles')
      .select('tests_taken, avg_score, weak_topics, strong_topics')
      .eq('id', user.id)
      .single()

    const testsTaken = (existingProfile?.tests_taken || 0) + 1
    const prevAvg = existingProfile?.avg_score || 0
    const newAvg = ((prevAvg * (testsTaken - 1)) + score) / testsTaken

    await supabaseAdmin
      .from('student_profiles')
      .update({
        tests_taken: testsTaken,
        avg_score: Math.round(newAvg * 100) / 100,
        weak_topics: analysis.recommendedTopics || existingProfile?.weak_topics || [],
        strong_topics: analysis.strengths || existingProfile?.strong_topics || [],
        suggested_difficulty: analysis.suggestedDifficulty || 'same',
        last_test_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    return res.status(200).json({ analysis })

  } catch (err) {
    console.error('submit-test error:', err)
    return res.status(500).json({ error: err.message || 'Server error' })
  }
}
