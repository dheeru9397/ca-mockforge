export const CA_TOPICS = [
  { id: "financial_reporting",  label: "Financial Reporting",          icon: "📊" },
  { id: "audit",                label: "Auditing & Assurance",         icon: "🔍" },
  { id: "taxation",             label: "Taxation (Direct & Indirect)", icon: "🏛️" },
  { id: "law",                  label: "Corporate & Other Laws",       icon: "⚖️" },
  { id: "costing",              label: "Cost & Management Accounting", icon: "📐" },
  { id: "fm",                   label: "Financial Management",         icon: "💹" },
  { id: "strategic",            label: "Strategic Management",         icon: "♟️" },
  { id: "economics",            label: "Economics for Finance",        icon: "📈" },
  { id: "isca",                 label: "ISCA / IT Systems",            icon: "💻" },
  { id: "ethics",               label: "Professional Ethics",          icon: "🎯" },
]

export const CA_LEVELS = [
  { id: "foundation",     label: "Foundation",      color: "#4ade80" },
  { id: "inter_group1",   label: "Inter – Group I",  color: "#60a5fa" },
  { id: "inter_group2",   label: "Inter – Group II", color: "#a78bfa" },
  { id: "final_group1",   label: "Final – Group I",  color: "#f97316" },
  { id: "final_group2",   label: "Final – Group II", color: "#f43f5e" },
]

// How many questions we generate per topic+level batch (the question bank)
export const BANK_BATCH_SIZE = 30

// Minimum questions we need in the bank before we skip generation
export const BANK_MIN_THRESHOLD = 15

export function buildBankGenerationPrompt(topic, level) {
  return {
    system: `You are an expert CA exam question setter for ICAI (Institute of Chartered Accountants of India).
Generate exactly ${BANK_BATCH_SIZE} high-quality multiple-choice questions.
Return ONLY valid JSON — no markdown, no explanation, no preamble.`,
    user: `Generate ${BANK_BATCH_SIZE} MCQ questions for:
- Topic: ${topic}
- Level: ${level}
- Mix: 10 simple, 10 medium, 10 hard

Return this exact JSON:
{
  "questions": [
    {
      "question": "Full question text",
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "correct": "A",
      "explanation": "Why this answer is correct and others are wrong",
      "concept": "Core concept being tested",
      "difficulty": "simple"
    }
  ]
}`
  }
}

export function buildAnalysisPrompt(questions, answers, timings) {
  const results = questions.map((q, i) => ({
    topic: q.topic,
    difficulty: q.difficulty,
    concept: q.concept,
    isCorrect: answers[i] === q.correct,
    timeSpent: Math.round(timings[i] / 1000),
    userAnswer: answers[i],
    correctAnswer: q.correct,
  }))

  const score = Math.round(results.filter(r => r.isCorrect).length * 10)

  return {
    system: `You are a CA exam performance analyst. Return ONLY valid JSON — no markdown, no preamble.`,
    user: `Analyse this student's performance:
Score: ${score}%
Results: ${JSON.stringify(results)}

Return:
{
  "score": ${score},
  "grade": "A+|A|B+|B|C|D|F",
  "summary": "2-3 sentence assessment",
  "strengths": ["topic or concept they did well in"],
  "weaknesses": ["topic or concept they struggled with"],
  "timeInsights": "observation about time management",
  "difficultyBreakdown": {
    "simple":  { "correct": 0, "total": 4 },
    "medium":  { "correct": 0, "total": 3 },
    "hard":    { "correct": 0, "total": 3 }
  },
  "nextTestFocus": "Specific instruction for next test",
  "motivationalMessage": "Personalised encouraging message under 30 words",
  "recommendedTopics": ["topic ids to focus next"],
  "suggestedDifficulty": "easier|same|harder"
}`
  }
}
