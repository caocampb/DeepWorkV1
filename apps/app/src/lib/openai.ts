import OpenAI from 'openai'
import { type Block, type Result } from './types'
import { START_HOUR, END_HOUR, findFixedTimes, MINUTES_PER_INCREMENT, snapToGrid, timeStringToISO, createLocalISOString } from './time-system'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Simple types for scheduling
interface FixedTime {
  task: string
  time: string
  duration: number
  isDeadline?: boolean
}

// Helper to parse fixed times from input
function parseFixedTimes(input: string): FixedTime[] {
  const times = findFixedTimes(input)
  return times.map(({ time, task, isDeadline }) => {
    // Ensure the time aligns to our grid
    const date = new Date()
    const [hoursStr = "00", minutesStr = "00"] = time.split(':')
    const hours = parseInt(hoursStr)
    const minutes = parseInt(minutesStr)
    if (isNaN(hours) || isNaN(minutes)) {
      throw new Error(`Invalid time format: ${time}`)
    }
    date.setHours(hours, minutes)
    const snapped = snapToGrid(date)
    const alignedTime = `${String(snapped.getHours()).padStart(2, '0')}:${String(snapped.getMinutes()).padStart(2, '0')}`
    
    return {
      task,
      time: alignedTime,
      duration: task.toLowerCase().includes('lunch') ? 60 : 30,
      isDeadline: isDeadline || false
    }
  })
}

function getSystemPrompt(input: string, fixedTimes: FixedTime[]): string {
  // Step 1: Sort fixed times chronologically
  const sortedFixedTimes = [...fixedTimes].sort((a, b) => {
    const [aHours = 0, aMinutes = 0] = a.time.split(':').map((num: string) => parseInt(num) || 0);
    const [bHours = 0, bMinutes = 0] = b.time.split(':').map((num: string) => parseInt(num) || 0);
    return (aHours * 60 + aMinutes) - (bHours * 60 + bMinutes);
  });

  // Step 2: Calculate available time blocks
  const timeBlocks: {start: string; end: string; minutes: number}[] = [];
  
  // Start with the morning block before any fixed times
  if (sortedFixedTimes.length > 0) {
    const firstFixedTime = sortedFixedTimes[0];
    if (firstFixedTime) {
      const [firstHours = 0, firstMinutes = 0] = firstFixedTime.time.split(':').map((num: string) => parseInt(num) || 0);
      const firstFixedMinutes = firstHours * 60 + firstMinutes;
      const morningMinutes = firstFixedMinutes - (START_HOUR * 60);
      
      if (morningMinutes > 0) {
        timeBlocks.push({
          start: `${START_HOUR}:00`,
          end: firstFixedTime.time,
          minutes: morningMinutes
        });
      }
    }
  } else {
    // No fixed times, entire day is available
    timeBlocks.push({
      start: `${START_HOUR}:00`,
      end: `${END_HOUR}:00`,
      minutes: (END_HOUR - START_HOUR) * 60
    });
  }
  
  // Add blocks between fixed times
  for (let i = 0; i < sortedFixedTimes.length; i++) {
    const current = sortedFixedTimes[i];
    const next = sortedFixedTimes[i + 1];
    
    if (!current) continue; // Skip if current is undefined
    
    // Add a block after the current fixed time if there is a gap
    const currentEnd = getEndTime(current.time, current.duration);
    
    // If this is the last fixed time or there's a gap until the next one
    if (!next) {
      // Add block from end of this fixed time to end of day
      const [currentEndHours = 0, currentEndMinutes = 0] = currentEnd.split(':').map((num: string) => parseInt(num) || 0);
      const currentEndMinutesTotal = currentEndHours * 60 + currentEndMinutes;
      const endOfDayMinutes = END_HOUR * 60;
      const remainingMinutes = endOfDayMinutes - currentEndMinutesTotal;
      
      if (remainingMinutes >= 30) {
        timeBlocks.push({
          start: currentEnd,
          end: `${END_HOUR}:00`,
          minutes: remainingMinutes
        });
      }
    } else {
      // Add block between this fixed time and the next one
      const [currentEndHours = 0, currentEndMinutes = 0] = currentEnd.split(':').map((num: string) => parseInt(num) || 0);
      const [nextHours = 0, nextMinutes = 0] = next.time.split(':').map((num: string) => parseInt(num) || 0);
      
      const currentEndMinutesTotal = currentEndHours * 60 + currentEndMinutes;
      const nextStartMinutesTotal = nextHours * 60 + nextMinutes;
      
      const gapMinutes = nextStartMinutesTotal - currentEndMinutesTotal;
      
      if (gapMinutes >= 30) {
        timeBlocks.push({
          start: currentEnd,
          end: next.time,
          minutes: gapMinutes
        });
      }
    }
  }
  
  // Format time blocks for display with max block duration guidelines
  const availableTimeBlocks = timeBlocks.map(block => {
    const blockDuration = block.minutes;
    let maxDeepWorkDuration = blockDuration;
    if (maxDeepWorkDuration > 120) maxDeepWorkDuration = 120; // Cap at 120 minutes
    
    // If block duration is less than minimum deep work time, note that
    const deepWorkNote = blockDuration < 60 
      ? " (too small for deep work)"
      : ` (can fit up to ${Math.floor(maxDeepWorkDuration/60)}hr deep work)`;
      
    return `[${block.start}-${block.end}] ${block.minutes}min available${deepWorkNote}`
  }).join('\n');
  
  // Format fixed commitments with enhanced visual separation
  const fixedTimeBlocks = sortedFixedTimes
    .map(f => `[${f.time}-${getEndTime(f.time, f.duration)}] ${f.task.toUpperCase()} (FIXED COMMITMENT)`)
    .join('\n');

  // Calculate exact maximum deep work block sizes for clarity
  const deepWorkBlockOptions = timeBlocks
    .filter(block => block.minutes >= 60)
    .map(block => {
      const maxDuration = Math.min(block.minutes, 120);
      return `- ${block.start}-${block.end}: max ${maxDuration}min deep work`
    }).join('\n');

  return `I'm creating a schedule for flexible tasks ONLY around pre-scheduled commitments.

TWO-PASS SCHEDULING SYSTEM:
1. Fixed commitments are ALREADY scheduled and CANNOT be moved
2. I will ONLY schedule flexible tasks in the available time blocks listed below

FIXED COMMITMENTS (DON'T TOUCH OR OVERLAP THESE):
${fixedTimeBlocks}

AVAILABLE TIME BLOCKS (ONLY schedule within these exact blocks):
${availableTimeBlocks}

DEEP WORK CONSTRAINTS:
${deepWorkBlockOptions}

SCHEDULING RULES:
1. Deep Work (60-120 minutes):
   - Must fit ENTIRELY within ONE available block
   - Prioritize early morning blocks
   - NEVER overlap with fixed commitments
   - Example: If there's a fixed meeting at 9:30am, I can only schedule deep work from 8:00-9:30am, not 8:00-10:00am
   - Maximum 120 minutes per session

2. Shallow Work (30-60 minutes):
   - Good for filling smaller gaps
   - Must fit entirely within available blocks
   - Never overlap with fixed commitments

3. Task Uniqueness:
   - CRITICAL: Each task must be scheduled EXACTLY ONCE
   - NEVER schedule the same task in multiple time blocks
   - If a task would exceed the max duration (120min), cap it at 120min
   - Do NOT split tasks across multiple time blocks

IMPORTANT:
- I will NEVER create a block that crosses a fixed commitment boundary
- All times must align to 30-minute increments (8:00, 8:30, 9:00, etc.)
- I will only use times from the AVAILABLE TIME BLOCKS list
- Each unique task name represents ONE task to be done ONE time
- CRITICAL: ALL tasks MUST be scheduled somewhere in the day

Working hours: ${START_HOUR}:00-${END_HOUR}:00

FLEXIBLE TASKS TO SCHEDULE:
${input}`
}

// Helper to calculate end time for fixed commitments
function getEndTime(startTime: string, durationMinutes: number): string {
  const [hoursStr = "00", minutesStr = "00"] = startTime.split(':')
  const hours = parseInt(hoursStr)
  const minutes = parseInt(minutesStr)
  const totalMinutes = hours * 60 + minutes + durationMinutes
  const endHour = Math.floor(totalMinutes / 60)
  const endMinutes = totalMinutes % 60
  return `${String(endHour).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`
}

const timeBlockSchema = {
  name: "scheduleInTimeBlocks",
  description: "Schedule flexible tasks into available time blocks during working hours (8:00-20:00), ensuring no overlaps with fixed commitments. Each unique task must be scheduled exactly once.",
  parameters: {
    type: "object",
    required: ["blocks"],
    properties: {
      blocks: {
        type: "array",
        description: "Array of non-overlapping time blocks for flexible tasks ONLY. Do NOT include or overlap with fixed commitments. IMPORTANT: Each unique task must appear exactly once - do not schedule the same task in multiple blocks.",
        items: {
          type: "object",
          required: ["startTime", "endTime", "task", "type", "reason"],
          properties: {
            startTime: {
              type: "string",
              description: "Start time in HH:MM format (24-hour), e.g., '08:00', '14:30'. Must be within available time blocks."
            },
            endTime: {
              type: "string",
              description: "End time in HH:MM format (24-hour), e.g., '09:30', '16:00'. Must be within available time blocks."
            },
            task: { type: "string" },
            type: {
              type: "string",
              enum: ["deep", "shallow"]
            },
            reason: { type: "string" }
          }
        }
      }
    }
  }
} as const

function slotToTime(slot: number): string {
  // Convert slot to local time, preserving timezone
  const hour = START_HOUR + Math.floor(slot / 2)
  const minute = (slot % 2) * MINUTES_PER_INCREMENT
  return createLocalISOString(hour, minute)
}

// Helper to convert time string to slot number
function timeToSlot(timeStr: string): number {
  const [hoursStr = "00", minutesStr = "00"] = timeStr.split(':')
  const hours = parseInt(hoursStr)
  const minutes = parseInt(minutesStr)
  if (isNaN(hours) || isNaN(minutes)) {
    throw new Error(`Invalid time format: ${timeStr}`)
  }
  return ((hours - START_HOUR) * 2) + (minutes / MINUTES_PER_INCREMENT)
}

function isValidBlock(
  startTime: string, 
  duration: number,
  blocks: Block[]
): boolean {
  // Convert times to local for validation
  const start = new Date(startTime)
  const end = new Date(start.getTime() + duration * 60000)
  
  // Get hours in local time
  const startHour = start.getHours()
  const endHour = end.getHours()
  const endMinutes = end.getMinutes()
  
  // Check working hours (end time should be before END_HOUR:00)
  if (startHour < START_HOUR || (endHour >= END_HOUR && endMinutes > 0) || endHour > END_HOUR) {
    return false
  }
  
  // Ensure times align to 30-minute grid
  if (start.getMinutes() % MINUTES_PER_INCREMENT !== 0) {
    return false
  }
  
  // Check overlaps using local time comparison
  return !blocks.some(block => {
    const blockStart = new Date(block.startTime)
    const blockEnd = new Date(blockStart.getTime() + block.duration * 60000)
    return start < blockEnd && end > blockStart
  })
}

// Types for task analysis
interface AnalyzedTask {
  task: string
  type: 'deep' | 'shallow'
  duration: number
  priority: 'high' | 'medium' | 'low'
}

interface TaskAnalysisResult {
  tasks: AnalyzedTask[]
}

function getAnalysisPrompt(input: string, preprocessed: PreprocessedTasks): string {
  const fixedTimeBlocks = preprocessed.fixedTimes
    .map(f => `[${f.time}-${getEndTime(f.time, f.duration)}] ${f.task} (${f.duration}min)`)
    .join('\n')

  return `Analyze these tasks and determine their type (deep/shallow) and duration.

Fixed Commitments (Already Scheduled):
${fixedTimeBlocks}

Core Rules:
1. Deep Work
   - Complex tasks requiring focus and concentration
   - Duration: 60-120 minutes
   - Examples: coding, design, writing, planning

2. Shallow Work
   - Routine tasks and communication
   - Duration: 30-60 minutes
   - Examples: email, quick reviews, updates

Pre-categorized tasks:
${preprocessed.focusTasks.length > 0 ? `\nFocus tasks (likely deep work):\n${preprocessed.focusTasks.map(t => `- ${t}`).join('\n')}` : ''}
${preprocessed.quickTasks.length > 0 ? `\nQuick tasks (likely shallow work):\n${preprocessed.quickTasks.map(t => `- ${t}`).join('\n')}` : ''}
${preprocessed.otherTasks.length > 0 ? `\nOther tasks (need analysis):\n${preprocessed.otherTasks.map(t => `- ${t}`).join('\n')}` : ''}

Choose appropriate durations based on task complexity and context.
All times must align to 30-minute increments (30, 60, 90, 120 min).`
}

const analysisSchema = {
  name: "analyzeTasks",
  description: "Analyze tasks and determine their properties",
  parameters: {
    type: "object",
    required: ["tasks"],
    properties: {
      tasks: {
        type: "array",
        items: {
          type: "object",
          required: ["task", "type", "duration", "priority"],
          properties: {
            task: { type: "string" },
            type: { type: "string", enum: ["deep", "shallow"] },
            duration: { type: "number" },
            priority: { type: "string", enum: ["high", "medium", "low"] }
          }
        }
      }
    }
  }
} as const

// Types for preprocessing
interface PreprocessedTasks {
  fixedTimes: FixedTime[]
  focusTasks: string[]
  quickTasks: string[]
  otherTasks: string[]
}

// Preprocess tasks before AI analysis
function preprocessTasks(input: string): PreprocessedTasks {
  const lines = input.split('\n').filter(line => line.trim())
  const fixedTimes = parseFixedTimes(input)
  const fixedTaskNames = new Set(fixedTimes.map(f => f.task.toLowerCase()))

  const focusTasks: string[] = []
  const quickTasks: string[] = []
  const otherTasks: string[] = []

  // Deep work indicators - more comprehensive for technical/strategic work
  const deepWorkPatterns = [
    'deep',
    'focus',
    'complex',
    'design review',  // Design reviews are often deep work
    'architecture',
    'develop',
    'write',         // Writing (docs, specs) is deep work
    'research',
    'plan',          // Strategic planning is deep work
    'tech spec',
    'system',        // System work usually needs focus
    'refactor',
    'auth'           // Auth systems are complex
  ]

  // Shallow work indicators - communication and routine tasks
  const shallowWorkPatterns = [
    'standup',
    'sync',
    'check',
    'reply',
    'email',
    'slack',
    'catch up',      // Catching up is usually shallow
    'update',
    'status'
  ]

  for (const line of lines) {
    const task = line.trim()
    const taskLower = task.toLowerCase()

    // Skip if it's a fixed time task
    if (fixedTaskNames.has(taskLower)) continue

    // Check for deep work patterns
    if (deepWorkPatterns.some(pattern => taskLower.includes(pattern))) {
      focusTasks.push(task)
    }
    // Check for shallow work patterns
    else if (shallowWorkPatterns.some(pattern => taskLower.includes(pattern))) {
      quickTasks.push(task)
    }
    // If unclear, put in other tasks for AI to analyze
    else {
      otherTasks.push(task)
    }
  }

  return {
    fixedTimes,
    focusTasks,
    quickTasks,
    otherTasks
  }
}

// Add a simple utility function for time calculations
function timeToMinutes(time: string): number {
  const [hoursStr = "0", minutesStr = "0"] = time.split(':')
  const hours = parseInt(hoursStr) || 0
  const minutes = parseInt(minutesStr) || 0
  return hours * 60 + minutes
}

function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function calculateDuration(startTime: string, endTime: string): number {
  return timeToMinutes(endTime) - timeToMinutes(startTime)
}

export async function transformToBlocks(input: string): Promise<Result<Block[]>> {
  try {
    // Step 0: Preprocess tasks
    const preprocessed = preprocessTasks(input)
    
    // Calculate available time blocks
    const availableBlocks = calculateAvailableTimeBlocks(preprocessed.fixedTimes);
    
    console.log('PASS 1: Fixed commitments:', preprocessed.fixedTimes);
    console.log('Available time blocks:', availableBlocks);
    
    // FIRST PASS: Pre-create blocks for all fixed commitments
    const fixedBlocks: Block[] = preprocessed.fixedTimes.map(fixed => {
      // Work directly with local time strings
      const duration = fixed.duration;
      
      return {
        id: crypto.randomUUID(),
        // Only convert to ISO at storage time
        startTime: createLocalISOString(
          parseInt(fixed.time.split(':')[0] || "0"), 
          parseInt(fixed.time.split(':')[1] || "0")
        ),
        duration: fixed.duration,
        task: fixed.task,
        type: fixed.task.toLowerCase().includes('design') || fixed.task.toLowerCase().includes('review') ? 'deep' : 'shallow',
        reason: "Fixed commitment as scheduled"
      }
    });
    
    // Get all non-fixed tasks for better clarity in prompts
    const flexibleTasks = input.split('\n')
      .map(line => line.trim())
      .filter(line => line && !preprocessed.fixedTimes.some(f => line.includes(f.task)));
    
    console.log('PASS 2: Flexible tasks to schedule:', flexibleTasks);
    
    // Step 1: Analyze remaining tasks (non-fixed commitments)
    const analysisCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: getAnalysisPrompt(input, preprocessed) },
        { role: "user", content: "Please analyze these tasks." }
      ],
      functions: [analysisSchema],
      function_call: { name: "analyzeTasks" }
    })

    const analysisMessage = analysisCompletion.choices[0]?.message
    if (!analysisMessage?.function_call?.arguments) {
      return { success: false, error: "Task analysis failed" }
    }

    const analysis = JSON.parse(analysisMessage.function_call.arguments) as TaskAnalysisResult
    
    // Filter analyzed tasks to only include non-fixed tasks
    const flexibleTasksAnalysis = analysis.tasks
      .filter(t => !preprocessed.fixedTimes.some(f => f.task.toLowerCase() === t.task.toLowerCase()));
    
    console.log('Analyzed flexible tasks:', flexibleTasksAnalysis);
    
    // SECOND PASS: Schedule flexible tasks around fixed commitments
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: getSystemPrompt(flexibleTasks.join('\n'), preprocessed.fixedTimes) },
        { 
          role: "user", 
          content: `I need to schedule ONLY these tasks into the available time blocks specified above.
Remember: NEVER create blocks that overlap with fixed commitments.

Each deep work task must be scheduled at the earliest possible morning time block if it fits (60-120 min).
Each shallow work task should be 30-60 minutes.

Task analysis:
${flexibleTasksAnalysis
  .map((t: AnalyzedTask) => `- ${t.task}: ${t.type} work, ${t.duration}min, ${t.priority} priority`)
  .join('\n')}`
        }
      ],
      functions: [timeBlockSchema],
      function_call: { name: "scheduleInTimeBlocks" }
    })

    const message = completion.choices[0]?.message
    if (!message?.function_call?.arguments) {
      return { success: false, error: "No schedule generated" }
    }

    const schedule = JSON.parse(message.function_call.arguments)
    
    // Start with our fixed blocks
    const allBlocks = [...fixedBlocks]

    console.log('Fixed blocks:', fixedBlocks)
    console.log('Attempting to schedule additional blocks:', schedule.blocks)

    // Validation: Check for duplicate tasks in schedule.blocks
    const taskCounts = new Map<string, number>();
    for (const block of schedule.blocks) {
      const taskName = block.task.toLowerCase().trim();
      taskCounts.set(taskName, (taskCounts.get(taskName) || 0) + 1);
    }
    
    // Find any duplicates
    const duplicates = Array.from(taskCounts.entries())
      .filter(([_, count]) => count > 1)
      .map(([taskName]) => taskName);
    
    if (duplicates.length > 0) {
      console.log('Duplicate tasks detected:', duplicates);
      return {
        success: false,
        error: "Invalid schedule with duplicate tasks",
        invalidBlocks: duplicates.map(taskName => ({
          block: {
            task: taskName,
            type: schedule.blocks.find((b: {task: string; type: string}) => b.task.toLowerCase().trim() === taskName)?.type || 'deep'
          },
          reason: `This task appears multiple times in the schedule. Each task must be scheduled exactly once.`
        }))
      };
    }

    // Process flexible tasks
    for (const block of schedule.blocks) {
      // Calculate duration from start and end times
      const duration = calculateDuration(block.startTime, block.endTime);
      
      console.log('Validating block:', {
        startTime: block.startTime,
        endTime: block.endTime,
        duration,
        task: block.task,
        type: block.type
      });
      
      // Validate against available time blocks
      const isInAvailableBlock = availableBlocks.some(available => {
        const availStartMinutes = timeToMinutes(available.start);
        const availEndMinutes = timeToMinutes(available.end);
        const blockStartMinutes = timeToMinutes(block.startTime);
        const blockEndMinutes = timeToMinutes(block.endTime);
        
        return blockStartMinutes >= availStartMinutes && 
               blockEndMinutes <= availEndMinutes;
      });
      
      if (!isInAvailableBlock) {
        console.log(`Block not in any available time block: ${block.startTime}-${block.endTime}`);
        
        // Find the overlapping fixed commitments
        const overlappingFixed = preprocessed.fixedTimes.filter(fixed => {
          const fixedStartMinutes = timeToMinutes(fixed.time);
          const fixedEndTime = getEndTime(fixed.time, fixed.duration);
          const fixedEndMinutes = timeToMinutes(fixedEndTime);
          const blockStartMinutes = timeToMinutes(block.startTime);
          const blockEndMinutes = timeToMinutes(block.endTime);
          
          return (blockStartMinutes < fixedEndMinutes && blockEndMinutes > fixedStartMinutes);
        });
        
        // For error display, convert the block time string to ISO format
        const [startHoursStr, startMinutesStr = "0"] = block.startTime.split(':');
        const startHours = parseInt(startHoursStr) || 0;
        const startMinutes = parseInt(startMinutesStr) || 0;
        const startTime = createLocalISOString(startHours, startMinutes);
        
        return {
          success: false,
          error: "Task scheduled outside available time blocks",
          invalidBlocks: [{
            block: {
              startTime,
              task: block.task,
              type: block.type,
              duration
            },
            reason: overlappingFixed.length && overlappingFixed[0] 
              ? `Overlaps with fixed commitment: ${overlappingFixed[0].task || 'unknown task'} (${
                  overlappingFixed[0].time || '00:00'}-${
                  getEndTime(overlappingFixed[0].time || '00:00', overlappingFixed[0].duration || 30)
                })`
              : `Does not fit in any available time block`
          }]
        };
      }
      
      // Check for overlaps with existing scheduled blocks
      const overlappingBlock = allBlocks.find(existingBlock => {
        // Convert ISO times back to local strings for comparison
        const existingStart = new Date(existingBlock.startTime);
        const existingStartString = `${String(existingStart.getHours()).padStart(2, '0')}:${String(existingStart.getMinutes()).padStart(2, '0')}`;
        const existingEndMinutes = timeToMinutes(existingStartString) + existingBlock.duration;
        const existingEndString = minutesToTime(existingEndMinutes);
        
        const newStartMinutes = timeToMinutes(block.startTime);
        const newEndMinutes = timeToMinutes(block.endTime);
        
        return newStartMinutes < existingEndMinutes && newEndMinutes > timeToMinutes(existingStartString);
      });
      
      if (overlappingBlock) {
        // For error display, convert the block time string to ISO format
        const [startHoursStr, startMinutesStr = "0"] = block.startTime.split(':');
        const startHours = parseInt(startHoursStr) || 0;
        const startMinutes = parseInt(startMinutesStr) || 0;
        const startTime = createLocalISOString(startHours, startMinutes);
        
        const overlappingStartTime = new Date(overlappingBlock.startTime);
        const overlappingEndTime = new Date(overlappingStartTime.getTime() + overlappingBlock.duration * 60000);
        
        return { 
          success: false, 
          error: "Invalid block allocation",
          invalidBlocks: [{
            block: {
              startTime,
              task: block.task,
              type: block.type,
              duration
            },
            reason: `Overlaps with ${overlappingBlock.task} (${
              overlappingStartTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})}-${
              overlappingEndTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})
            })`
          }]
        };
      }

      // Validate block durations
      if (block.type === 'deep') {
        if (duration < 60 || duration > 120) {  // 60-120 minutes for deep work
          // For error display, convert the block time string to ISO format
          const [startHoursStr, startMinutesStr = "0"] = block.startTime.split(':');
          const startHours = parseInt(startHoursStr) || 0;
          const startMinutes = parseInt(startMinutesStr) || 0;
          const startTime = createLocalISOString(startHours, startMinutes);
          
          return {
            success: false,
            error: "Deep work blocks must be 60-120 minutes",
            invalidBlocks: [{
              block: {
                startTime,
                task: block.task,
                type: block.type,
                duration
              },
              reason: "Deep work must be between 60 and 120 minutes"
            }]
          };
        }
      } else if (duration < 30) {  // At least 30 minutes for shallow work
        // For error display, convert the block time string to ISO format
        const [startHoursStr, startMinutesStr = "0"] = block.startTime.split(':');
        const startHours = parseInt(startHoursStr) || 0;
        const startMinutes = parseInt(startMinutesStr) || 0;
        const startTime = createLocalISOString(startHours, startMinutes);
        
        return {
          success: false,
          error: "Blocks must be at least 30 minutes",
          invalidBlocks: [{
            block: {
              startTime,
              task: block.task,
              type: block.type,
              duration
            },
            reason: "Minimum duration is 30 minutes"
          }]
        };
      }

      // Add valid block to our collection
      // Only convert to ISO at the storage step
      const [newStartHoursStr, newStartMinutesStr = "0"] = block.startTime.split(':');
      const newStartHours = parseInt(newStartHoursStr) || 0;
      const newStartMinutes = parseInt(newStartMinutesStr) || 0;
      
      allBlocks.push({
        id: crypto.randomUUID(),
        startTime: createLocalISOString(newStartHours, newStartMinutes),
        duration,
        task: block.task,
        type: block.type,
        reason: block.reason
      });
    }

    return { success: true, data: allBlocks };
  } catch (error) {
    return { success: false, error: `Failed to transform input: ${error}` };
  }
}

// Helper function to calculate available time blocks
function calculateAvailableTimeBlocks(fixedTimes: FixedTime[]): {start: string; end: string; minutes: number}[] {
  // Sort fixed times chronologically
  const sortedFixedTimes = [...fixedTimes].sort((a, b) => {
    const [aHours = 0, aMinutes = 0] = a.time.split(':').map((num: string) => parseInt(num) || 0);
    const [bHours = 0, bMinutes = 0] = b.time.split(':').map((num: string) => parseInt(num) || 0);
    return (aHours * 60 + aMinutes) - (bHours * 60 + bMinutes);
  });

  // Calculate available time blocks
  const timeBlocks: {start: string; end: string; minutes: number}[] = [];
  
  // Start with the morning block before any fixed times
  if (sortedFixedTimes.length > 0) {
    const firstFixedTime = sortedFixedTimes[0];
    if (firstFixedTime) {
      const [firstHours = 0, firstMinutes = 0] = firstFixedTime.time.split(':').map((num: string) => parseInt(num) || 0);
      const firstFixedMinutes = firstHours * 60 + firstMinutes;
      const morningMinutes = firstFixedMinutes - (START_HOUR * 60);
      
      if (morningMinutes > 0) {
        timeBlocks.push({
          start: `${START_HOUR}:00`,
          end: firstFixedTime.time,
          minutes: morningMinutes
        });
      }
    }
  } else {
    // No fixed times, entire day is available
    timeBlocks.push({
      start: `${START_HOUR}:00`,
      end: `${END_HOUR}:00`,
      minutes: (END_HOUR - START_HOUR) * 60
    });
  }
  
  // Add blocks between fixed times
  for (let i = 0; i < sortedFixedTimes.length; i++) {
    const current = sortedFixedTimes[i];
    const next = sortedFixedTimes[i + 1];
    
    if (!current) continue; // Skip if current is undefined
    
    // Add a block after the current fixed time if there is a gap
    const currentEnd = getEndTime(current.time, current.duration);
    
    // If this is the last fixed time or there's a gap until the next one
    if (!next) {
      // Add block from end of this fixed time to end of day
      const [currentEndHours = 0, currentEndMinutes = 0] = currentEnd.split(':').map((num: string) => parseInt(num) || 0);
      const currentEndMinutesTotal = currentEndHours * 60 + currentEndMinutes;
      const endOfDayMinutes = END_HOUR * 60;
      const remainingMinutes = endOfDayMinutes - currentEndMinutesTotal;
      
      if (remainingMinutes >= 30) {
        timeBlocks.push({
          start: currentEnd,
          end: `${END_HOUR}:00`,
          minutes: remainingMinutes
        });
      }
    } else {
      // Add block between this fixed time and the next one
      const [currentEndHours = 0, currentEndMinutes = 0] = currentEnd.split(':').map((num: string) => parseInt(num) || 0);
      const [nextHours = 0, nextMinutes = 0] = next.time.split(':').map((num: string) => parseInt(num) || 0);
      
      const currentEndMinutesTotal = currentEndHours * 60 + currentEndMinutes;
      const nextStartMinutesTotal = nextHours * 60 + nextMinutes;
      
      const gapMinutes = nextStartMinutesTotal - currentEndMinutesTotal;
      
      if (gapMinutes >= 30) {
        timeBlocks.push({
          start: currentEnd,
          end: next.time,
          minutes: gapMinutes
        });
      }
    }
  }
  
  return timeBlocks;
} 