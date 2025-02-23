import OpenAI from 'openai'
import { type Block, type Result } from './types'
import { blockSchema } from './types'
import { validateBlock, START_HOUR, END_HOUR, findFixedTimes } from './time-system'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Each slot is 30 minutes within working hours (8am-8pm)
// Slot 0 = 8:00-8:30, Slot 1 = 8:30-9:00, etc.
const SLOTS_PER_HOUR = 2
const TOTAL_SLOTS = (END_HOUR - START_HOUR) * SLOTS_PER_HOUR // 24 slots (8am-8pm)

interface TimeSlot {
  slot: number      // 0-23 (maps to 8:00-20:00)
  duration: number  // in slots (1=30min, 2=60min, 3=90min)
  task: string
  type: 'deep' | 'shallow' | 'break'
  reason: string
}

interface FixedTime {
  hour: number    // 24-hour format
  minute: number  // 0-59
  task: string
  isDeadline: boolean
}

function timeToSlot(hour: number, minute: number): number {
  const localHour = hour - START_HOUR
  return (localHour * 2) + (minute >= 30 ? 1 : 0)
}

function parseFixedTimes(input: string): FixedTime[] {
  const times = findFixedTimes(input)
  return times.map(({ time, task, isDeadline }) => {
    const [hoursStr = '0', minutesStr = '0'] = time.split(':')
    const hours = parseInt(hoursStr)
    const minutes = parseInt(minutesStr)
    if (isNaN(hours) || isNaN(minutes)) return null
    return { hour: hours, minute: minutes, task, isDeadline: isDeadline || false }
  }).filter((time): time is FixedTime => time !== null)
}

const slotSchema = {
  name: "scheduleInSlots",
  description: "Schedule tasks into 30-minute slots during working hours",
  parameters: {
    type: "object",
    required: ["slots"],
    properties: {
      slots: {
        type: "array",
        items: {
          type: "object",
          required: ["slot", "duration", "task", "type", "reason"],
          properties: {
            slot: {
              type: "number",
              description: "Slot number (0-23, where 0=8:00am, 1=8:30am, etc)"
            },
            duration: {
              type: "number",
              description: "Number of slots (1=30min, 2=60min, 3=90min)"
            },
            task: { type: "string" },
            type: {
              type: "string",
              enum: ["deep", "shallow", "break"]
            },
            reason: { type: "string" }
          }
        }
      }
    }
  }
} as const

function getSystemPrompt(input: string, fixedTimes: FixedTime[]) {
  const fixedSlots = fixedTimes.map(time => ({
    slot: timeToSlot(time.hour, time.minute),
    task: time.task,
    time: `${time.hour}:${String(time.minute).padStart(2, '0')}`,
    isDeadline: time.isDeadline
  }))

  return `You are scheduling tasks to maximize deep focused work.

SLOTS:
0 = 8:00-8:30
1 = 8:30-9:00
...and so on until...
23 = 19:30-20:00

CORE RULES:
1. MORNING FOCUS: Reserve 8:00-12:00 for deep work unless there's a fixed meeting
2. BATCH SIMILAR: Group shallow tasks together to avoid context switching
3. DEADLINE HANDLING: When a task must finish "by X time":
   - Schedule it as ONE continuous block
   - Ensure it ENDS at the deadline time
   - Start it early enough to complete
   - Keep the original task description including "by X"
4. FIXED TIMES: Honor these exactly, but try to preserve deep work time:
${fixedSlots.map(f => {
  const prefix = f.isDeadline ? `- "${f.task}" must finish by` : `- "${f.task}" at`
  return `${prefix} ${f.time} (slot ${f.slot})`
}).join('\n')}

TASK TYPES:
- DEEP: Complex work requiring focus
  - Minimum: 2 slots (1 hour)
  - Maximum: 8 slots (4 hours)
  - Prefer longer blocks when possible
  - Can be split if needed for fixed meetings
- SHALLOW: Quick tasks and meetings
  - Usually 1-2 slots (30-60 min)
  - Can be longer for grouped meetings (like 1:1s)
  - Batch similar tasks together
- BREAK: Rest periods
  - Default: 1 slot (30 min)
  - Can be adjusted if explicitly specified
  - Try to place after deep work sessions

GOOD PATTERN:
- Use morning for deep work when possible
- Schedule deadline tasks to finish ON TIME
- Batch meetings/shallow work together
- Only add breaks when requested
- Keep schedule minimal and focused
- Be flexible with durations based on context

For each task, explain HOW it supports focused work.

Input tasks:
${input}

Example output:
{
  "slots": [
    {
      "slot": 0,
      "duration": 4,
      "task": "ship auth system by 10am",
      "type": "deep",
      "reason": "Scheduled early to ensure completion by 10am deadline"
    }
  ]
}`
}

function slotToTime(slot: number): string {
  const hour = START_HOUR + Math.floor(slot / 2)
  const minute = (slot % 2) * 30
  
  const date = new Date()
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

function isSlotAvailable(
  startTime: string, 
  duration: number,
  blocks: Block[]
): boolean {
  const start = new Date(startTime)
  const end = new Date(start.getTime() + duration * 60000)
  
  // Simple hour check
  const startHour = start.getHours()
  const endHour = end.getHours()
  
  if (startHour < START_HOUR || endHour >= END_HOUR) {
    return false
  }
  
  // Simple overlap check
  return !blocks.some(block => {
    const blockStart = new Date(block.startTime)
    const blockEnd = new Date(blockStart.getTime() + block.duration * 60000)
    return start < blockEnd && end > blockStart
  })
}

export async function transformToBlocks(input: string): Promise<Result<Block[]>> {
  try {
    const fixedTimes = parseFixedTimes(input)
    console.log('Fixed times:', fixedTimes)
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: getSystemPrompt(input, fixedTimes) },
        { role: "user", content: "Please schedule these tasks into slots, respecting fixed times exactly." }
      ],
      functions: [slotSchema],
      function_call: { name: "scheduleInSlots" }
    })

    const message = completion.choices[0]?.message
    if (!message?.function_call?.arguments) {
      return { success: false, error: "Failed to schedule tasks" }
    }

    const { slots } = JSON.parse(message.function_call.arguments) as { slots: TimeSlot[] }
    console.log('AI slots:', slots)
    
    const blocks: Block[] = []
    const invalidBlocks: { block: Partial<Block>; reason: string }[] = []
    
    for (const slot of slots) {
      if (slot.slot < 0 || slot.slot >= TOTAL_SLOTS) {
        console.log('Invalid slot:', slot)
        invalidBlocks.push({
          block: { task: slot.task, duration: slot.duration * 30, type: slot.type },
          reason: 'Outside working hours'
        })
        continue
      }
      
      const startTime = slotToTime(slot.slot)
      
      if (!isSlotAvailable(startTime, slot.duration * 30, blocks)) {
        console.log('Overlap:', { slot, startTime })
        invalidBlocks.push({
          block: { task: slot.task, duration: slot.duration * 30, type: slot.type },
          reason: 'Time slot not available'
        })
        continue
      }
      
      blocks.push({
        id: crypto.randomUUID(),
        task: slot.task,
        startTime,
        duration: slot.duration * 30,
        type: slot.type,
        reason: slot.reason
      })
    }

    return { 
      success: true,
      data: blocks.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
      invalidBlocks: invalidBlocks.length > 0 ? invalidBlocks : undefined,
      warnings: invalidBlocks.length > 0 ? ['Some blocks could not be scheduled'] : undefined
    }
  } catch (error) {
    console.error('Transform error:', error)
    return { success: false, error: String(error) }
  }
} 