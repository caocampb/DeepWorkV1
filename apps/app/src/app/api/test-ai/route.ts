import { transformToBlocks } from '@/lib/openai'

const CORE_TEST_CASES = [
  // Test 1: The Perfect Day
  // MUST protect morning deep work and batch shallow work
  `deep coding project
catch up on emails
code reviews
team sync at 2pm
planning session`,

  // Test 2: The Reality Check
  // MUST handle fixed meetings but maximize remaining deep work time
  `10am standup
11:30am client meeting
work on complex feature
answer slack messages
3pm team meeting`,

  // Test 3: The Overload
  // MUST reject impossible schedule, preserve deep work where possible
  `deep work on API
9am standup
10am architecture review
11am planning
2pm design review
3pm retrospective
4pm one-on-ones`
]

export async function POST(req: Request) {
  try {
    const results = await Promise.all(
      CORE_TEST_CASES.map(async (input, i) => {
        const result = await transformToBlocks(input)
        return { test: i + 1, input, ...result }
      })
    )
    
    return Response.json({ success: true, results })
  } catch (error) {
    console.error('OpenAI API Error:', error)
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    }, { status: 500 })
  }
} 