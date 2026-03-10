// pages/api/generate-test.js
import { supabaseAdmin } from '../../lib/supabase'

async function callClaude(topic, level) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8000,
      messages: [{
        role: 'user',
        content: `You are an expert CA exam question setter for ICAI (Institute of Chartered Accountants of India).

Generate exactly 30 multiple choice questions for:
- Topic: ${topic}
- Level: ${level}
- Mix: 10 simple, 10 medium, 10 hard

Return ONLY this JSON, no other text:
{
  "questions": [
    {
      "question": "Full question text",
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "correct": "A",
      "explanation": "Why this is correct",
      "concept": "Core concept tested",
      "difficulty": "simple"
    }
  ]
}`
      }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Claude API error: ${err}`)
  }

  const data = await res.json()
  const text = data.content?.map(b => b.text || '').join('') || ''
  const clean = text.replace(/```json\n?|```\n?/g, '').trim()
  return JSON.parse(clean)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  // Auth check
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

  const { topics, level, testNumber } = req.body
  if (!topics?.length || !level) return res.status(400).json({ error: 'Missing topics or level' })

  try {
    // Difficulty distribution
    let distribution = { simple: 4, medium: 3, hard: 3 }
    if (testNumber > 1) {
      const { data: profile } = await supabaseAdmin
        .from('student_profiles')
        .select('suggested_difficulty')
        .eq('id', user.id)
        .single()

      if (profile?.suggested_difficulty === 'harder') distribution = { simple: 2, medium: 4, hard: 4 }
      else if (profile?.suggested_difficulty === 'easier') distribution = { simple: 5, medium: 3, hard: 2 }
    }

    // Pick a random topic from selected topics
    const topic = topics[Math.floor(Math.random() * topics.length)]

    // ── CHECK QUESTION BANK ──────────────────────────────────
    console.log(`Checking bank for topic: ${topic}, level: ${level}`)

    const { data: existingQuestions } = await supabaseAdmin
      .from('questions')
      .select('*')
      .eq('topic', topic)
      .eq('level', level)

    console.log(`Found ${existingQuestions?.length || 0} questions in bank`)

    // Generate if we don't have enough
    if (!existingQuestions || existingQuestions.length < 10) {
      console.log('Generating new questions from Claude...')

      try {
        const generated = await callClaude(topic, level)
        console.log(`Claude returned ${generated.questions?.length} questions`)

        if (generated.questions?.length > 0) {
          const toInsert = generated.questions.map(q => ({
            topic,
            level,
            difficulty: q.difficulty || 'medium',
            question: q.question,
            options: q.options,
            correct: q.correct,
            explanation: q.explanation || '',
            concept: q.concept || '',
          }))

          const { error: insertError } = await supabaseAdmin
            .from('questions')
            .insert(toInsert)

          if (insertError) {
            console.error('Insert error:', insertError)
          } else {
            console.log(`Inserted ${toInsert.length} questions into bank`)
          }
        }
      } catch (genError) {
        console.error('Generation error:', genError.message)
        // If generation fails and we have some questions, use them anyway
        // If we have nothing, return error
        if (!existingQuestions || existingQuestions.length === 0) {
          return res.status(500).json({ error: `Failed to generate questions: ${genError.message}` })
        }
      }
    }

    // Fetch updated bank
    const { data: bank } = await supabaseAdmin
      .from('questions')
      .select('*')
      .eq('topic', topic)
      .eq('level', level)

    console.log(`Bank now has ${bank?.length || 0} questions`)

    if (!bank || bank.length < 10) {
      return res.status(500).json({
        error: `Only ${bank?.length || 0} questions available for ${topic} / ${level}. Generation may have failed. Check your ANTHROPIC_API_KEY.`
      })
    }

    // Pick 10 questions (4 simple, 3 medium, 3 hard)
    const pick = (pool, n) => {
      const shuffled = [...pool].sort(() => Math.random() - 0.5)
      return shuffled.slice(0, n)
    }

    const simpleQs = pick(bank.filter(q => q.difficulty === 'simple'), distribution.simple)
    const mediumQs = pick(bank.filter(q => q.difficulty === 'medium'), distribution.medium)
    const hardQs   = pick(bank.filter(q => q.difficulty === 'hard'),   distribution.hard)

    let selected = [...simpleQs, ...mediumQs, ...hardQs]

    // If we don't have enough of each difficulty, just pick any 10
    if (selected.length < 10) {
      selected = pick(bank, 10)
    }

    // Shuffle final selection
    selected = selected.sort(() => Math.random() - 0.5)

    // Create test record
    const { data: test, error: testError } = await supabaseAdmin
      .from('tests')
      .insert({
        student_id: user.id,
        test_number: testNumber || 1,
        topics,
        level,
        question_ids: selected.map(q => q.id),
      })
      .select()
      .single()

    if (testError) {
      console.error('Test insert error:', testError)
      throw testError
    }

    return res.status(200).json({
      testId: test.id,
      questions: selected.map(q => ({
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
