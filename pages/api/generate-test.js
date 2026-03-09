// pages/api/generate-test.js
// Called when student starts a new test.
// 1. Checks question bank in Supabase
// 2. Generates more if bank is low (one Claude call, reused for all students)
// 3. Picks 10 questions (4 simple, 3 medium, 3 hard) weighted by student's weak areas
// 4. Creates a test record and returns questions

import { supabaseAdmin } from '../../lib/supabase'
import { buildBankGenerationPrompt, BANK_BATCH_SIZE, BANK_MIN_THRESHOLD } from '../../lib/constants'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

async function callClaude(system, user) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001', // cheap for question generation
      max_tokens: 8000,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  })
  const data = await res.json()
  const text = data.content?.map(b => b.text || '').join('') || ''
  return JSON.parse(text.replace(/```json\n?|```\n?/g, '').trim())
}

function pickQuestions(bank, distribution, weakTopics = []) {
  const pick = (pool, n) => {
    if (pool.length === 0) return []
    // Boost weak-topic questions by duplicating them in the pool
    const weighted = pool.flatMap(q =>
      weakTopics.includes(q.topic) ? [q, q] : [q]
    )
    const shuffled = weighted.sort(() => Math.random() - 0.5)
    const seen = new Set()
    const result = []
    for (const q of shuffled) {
      if (!seen.has(q.id) && result.length < n) {
        seen.add(q.id)
        result.push(q)
      }
    }
    return result
  }

  const simple = pick(bank.filter(q => q.difficulty === 'simple'), distribution.simple)
  const medium = pick(bank.filter(q => q.difficulty === 'medium'), distribution.medium)
  const hard   = pick(bank.filter(q => q.difficulty === 'hard'),   distribution.hard)

  return [...simple, ...medium, ...hard].sort(() => Math.random() - 0.5)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  // Auth check
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' })
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

  const { topics, level, testNumber } = req.body
  if (!topics?.length || !level) return res.status(400).json({ error: 'Missing topics or level' })

  try {
    // Determine difficulty distribution
    // Test 1: always 4 simple, 3 medium, 3 hard (diagnostic)
    // Later tests: adapt based on student profile
    let distribution = { simple: 4, medium: 3, hard: 3 }

    if (testNumber > 1) {
      const { data: profile } = await supabaseAdmin
        .from('student_profiles')
        .select('suggested_difficulty, avg_score')
        .eq('id', user.id)
        .single()

      if (profile?.suggested_difficulty === 'harder') {
        distribution = { simple: 2, medium: 4, hard: 4 }
      } else if (profile?.suggested_difficulty === 'easier') {
        distribution = { simple: 5, medium: 3, hard: 2 }
      }
    }

    // Get student's weak topics for weighting
    const { data: profile } = await supabaseAdmin
      .from('student_profiles')
      .select('weak_topics')
      .eq('id', user.id)
      .single()
    const weakTopics = profile?.weak_topics || []

    // ── QUESTION BANK LOGIC ──────────────────────────────────
    // For each topic, check if we have enough questions. Generate if not.
    let bankQuestions = []

    for (const topic of topics) {
      for (const diff of ['simple', 'medium', 'hard']) {
        const needed = distribution[diff]
        const { data: existing, count } = await supabaseAdmin
          .from('questions')
          .select('*', { count: 'exact' })
          .eq('topic', topic)
          .eq('level', level)
          .eq('difficulty', diff)

        if ((count || 0) < BANK_MIN_THRESHOLD) {
          // Not enough — generate a batch (this call is shared for ALL students)
          console.log(`Generating bank for ${topic} / ${level} / ${diff}`)
          const prompt = buildBankGenerationPrompt(topic, level)
          try {
            const generated = await callClaude(prompt.system, prompt.user)
            const toInsert = (generated.questions || [])
              .filter(q => q.difficulty === diff)
              .map(q => ({
                topic,
                level,
                difficulty: q.difficulty,
                question: q.question,
                options: q.options,
                correct: q.correct,
                explanation: q.explanation,
                concept: q.concept || '',
              }))

            if (toInsert.length > 0) {
              await supabaseAdmin.from('questions').insert(toInsert)
            }
          } catch (e) {
            console.error('Generation error:', e)
          }
        }

        // Fetch from bank (exclude recently used by this student in last 3 tests)
        const { data: recentTests } = await supabaseAdmin
          .from('tests')
          .select('question_ids')
          .eq('student_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3)

        const recentIds = (recentTests || []).flatMap(t => t.question_ids || [])

        const { data: qs } = await supabaseAdmin
          .from('questions')
          .select('*')
          .eq('topic', topic)
          .eq('level', level)
          .eq('difficulty', diff)
          .not('id', 'in', recentIds.length > 0 ? `(${recentIds.join(',')})` : '(null)')
          .limit(50)

        bankQuestions.push(...(qs || []))
      }
    }

    // Pick final 10 questions
    const selectedQuestions = pickQuestions(bankQuestions, distribution, weakTopics)

    if (selectedQuestions.length < 10) {
      return res.status(500).json({ error: 'Not enough questions in bank. Please try again in a moment.' })
    }

    // Create test record
    const { data: test, error: testError } = await supabaseAdmin
      .from('tests')
      .insert({
        student_id: user.id,
        test_number: testNumber,
        topics,
        level,
        question_ids: selectedQuestions.map(q => q.id),
      })
      .select()
      .single()

    if (testError) throw testError

    // Increment used_count
    await supabaseAdmin.rpc('increment_used_count', {
      ids: selectedQuestions.map(q => q.id)
    }).catch(() => {}) // non-critical

    return res.status(200).json({
      testId: test.id,
      questions: selectedQuestions.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correct: q.correct,
        explanation: q.explanation,
        topic: q.topic,
        difficulty: q.difficulty,
        concept: q.concept,
      }))
    })

  } catch (err) {
    console.error('generate-test error:', err)
    return res.status(500).json({ error: err.message || 'Server error' })
  }
}
