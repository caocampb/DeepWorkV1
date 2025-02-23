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
}

function timeToSlot(hour: number, minute: number): number {
  const localHour = hour - START_HOUR
  return (localHour * 2) + (minute >= 30 ? 1 : 0)
}

function parseFixedTimes(input: string): FixedTime[] {
  const times = findFixedTimes(input)
  return times.map(({ time, task }) => {
    const [hoursStr = '0', minutesStr = '0'] = time.split(':')
    const hours = parseInt(hoursStr)
    const minutes = parseInt(minutesStr)
    if (isNaN(hours) || isNaN(minutes)) return null
    return { hour: hours, minute: minutes, task }
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
    time: `${time.hour}:${String(time.minute).padStart(2, '0')}`
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
3. FIXED TIMES: Honor these exactly, but try to preserve deep work time:
${fixedSlots.map(f => `- "${f.task}" at ${f.time} (slot ${f.slot})`).join('\n')}

TASK TYPES:
- DEEP: Complex work (90 min)
- SHALLOW: Quick tasks (30 min)
- BREAK: Lunch (60 min) or Rest (30 min)

GOOD PATTERN:
- Use morning for deep work
- Batch meetings/shallow work together
- Take breaks between deep work
- Put lunch ~12:00-13:00

For each task, explain HOW it supports focused work.

Input tasks:
${input}

Example output:
{
  "slots": [
    {
      "slot": 0,
      "duration": 3,
      "task": "deep coding work",
      "type": "deep",
      "reason": "Protected morning time for focused work"
    },
    {
      "slot": 8,
      "duration": 2,
      "task": "batch of code reviews",
      "type": "shallow",
      "reason": "Grouped similar review tasks together after deep work"
    }
  ]
}`
}

function slotToTime(slot: number): string {
  const hour = START_HOUR + Math.floor(slot / 2)
  const minute = (slot % 2) * 30
  
  // Create date at the correct local time
  const date = new Date()
  date.setHours(hour, minute, 0, 0)
  
  // Convert to UTC for storage
  return new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  ).toISOString()
}

// Helper to check if a time slot is available
function isSlotAvailable(
  startTime: string, 
  duration: number,
  blocks: Block[]
): boolean {
  const start = new Date(startTime)
  const end = new Date(start.getTime() + duration * 60000)
  
  // Check working hours
  const localStart = new Date(start.getTime() + start.getTimezoneOffset() * 60000)
  const localEnd = new Date(end.getTime() + end.getTimezoneOffset() * 60000)
  const startHour = localStart.getHours()
  const endHour = localEnd.getHours()
  
  if (startHour < START_HOUR || endHour >= END_HOUR) {
    return false
  }
  
  // Check overlaps
  return !blocks.some(block => {
    const blockStart = new Date(block.startTime)
    const blockEnd = new Date(blockStart.getTime() + block.duration * 60000)
    return start < blockEnd && end > blockStart
  })
}

export async function transformToBlocks(input: string): Promise<Result<Block[]>> {
  try {
    // First parse any fixed times
    const fixedTimes = parseFixedTimes(input)
    
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
    const blocks: Block[] = []
    const invalidBlocks: { block: Partial<Block>; reason: string }[] = []
    
    // Convert slots to blocks
    for (const slot of slots) {
      // Validate slot is within range
      if (slot.slot < 0 || slot.slot >= TOTAL_SLOTS) {
        invalidBlocks.push({
          block: {
            task: slot.task,
            duration: slot.duration * 30,
            type: slot.type
          },
          reason: `${slot.reason} - but slot ${slot.slot} is outside working hours`
        })
        continue
      }
      
      const startTime = slotToTime(slot.slot)
      
      // Check for overlaps
      if (!isSlotAvailable(startTime, slot.duration * 30, blocks)) {
        invalidBlocks.push({
          block: {
            task: slot.task,
            startTime,
            duration: slot.duration * 30,
            type: slot.type
          },
          reason: `${slot.reason} - but slot is not available`
        })
        continue
      }
      
      blocks.push({
        id: crypto.randomUUID(),
        task: slot.task,
        startTime,
        duration: slot.duration * 30,
        type: slot.type
      })
    }

    // Sort blocks by start time
    const sortedBlocks = [...blocks].sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )
    
    return { 
      success: true,
      data: sortedBlocks,
      invalidBlocks: invalidBlocks.length > 0 ? invalidBlocks : undefined,
      warnings: invalidBlocks.length > 0 
        ? [`${invalidBlocks.length} block(s) could not be scheduled. Click "Fix Invalid Blocks" to resolve.`]
        : undefined
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    }
  }
} 