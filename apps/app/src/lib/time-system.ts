// Core constants - Linear inspired grid system
export const PIXELS_PER_HOUR = 120  // Each hour is 120px tall
export const MINUTES_PER_INCREMENT = 30  // 30-minute grid like Linear
export const PIXELS_PER_INCREMENT = PIXELS_PER_HOUR / 2  // 60px per increment
export const BLOCK_GAP = 2  // Minimal 2px gap for visual separation
export const START_HOUR = 8   // 8 AM
export const END_HOUR = 20    // 8 PM
export const TOTAL_HEIGHT = (END_HOUR - START_HOUR) * PIXELS_PER_HOUR

// Simple time extraction - just find HH:MM or HH(am|pm)
export function findFixedTimes(input: string): { time: string; task: string; isDeadline?: boolean }[] {
  const fixedTimes: { time: string; task: string; isDeadline?: boolean }[] = []
  const lines = input.split('\n')

  for (const line of lines) {
    // Find any time mentioned (3pm, 15:30, 3:45pm, etc)
    const timeMatch = line.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i)
    if (timeMatch && timeMatch[1]) {  // Ensure hours exists
      const [fullMatch, hours, minutes = '00', meridian = ''] = timeMatch
      let hour = parseInt(hours)
      
      // Convert to 24hr
      const isPM = meridian.toLowerCase() === 'pm' || 
        (!meridian && hour < 12 && /\b(afternoon|evening|night|pm)\b/i.test(line))
      
      if (isPM && hour < 12) hour += 12
      if (meridian.toLowerCase() === 'am' && hour === 12) hour = 0
      
      const time = `${hour.toString().padStart(2, '0')}:${minutes}`
      const task = line.replace(fullMatch, '').trim()
      
      // If it has a time, it's a fixed commitment
      fixedTimes.push({ time, task, isDeadline: /\b(by|before)\b/i.test(line) })
    }
  }
  
  return fixedTimes
}

// Basic types
export interface Block {
  id: string
  startTime: string
  duration: number
  task: string
  type: 'deep' | 'shallow' | 'break'
}

export type BlockValidationError = 
  | { type: 'OUT_OF_BOUNDS' }
  | { type: 'OVERLAP'; conflictingBlock: Block }
  | { type: 'INVALID_DURATION'; min: number; max: number }

// Time grid system
export function snapToGrid(date: Date): Date {
  const snapped = new Date(date)
  const minutes = snapped.getMinutes()
  const roundedMinutes = Math.round(minutes / MINUTES_PER_INCREMENT) * MINUTES_PER_INCREMENT
  snapped.setMinutes(roundedMinutes, 0, 0)
  return snapped
}

// Convert UTC time to local hour for validation
function getLocalHour(date: Date): number {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return localDate.getUTCHours() + (localDate.getUTCMinutes() / 60)
}

// Time slot validation
export function getBlockTimeRange(block: Block): { start: Date; end: Date } {
  const start = snapToGrid(new Date(block.startTime))
  const end = new Date(start.getTime() + block.duration * 60000)
  return { start, end }
}

export function validateBlock(
  newBlock: Omit<Block, 'id'>, 
  existingBlocks: Block[],
  ignoreId?: string
): BlockValidationError | null {
  // Known fixed event durations
  const knownDurations: Record<string, number> = {
    standup: 30,
    meeting: 30,
    sync: 30,
    lunch: 60
  }

  // Check if this is a known fixed event by task name
  const matchingFixedEvent = Object.entries(knownDurations).find(([key]) => 
    newBlock.task.toLowerCase().includes(key)
  )
  
  if (matchingFixedEvent) {
    const [eventType, expectedDuration] = matchingFixedEvent
    // Fixed events must be shallow work type with exact duration
    if (newBlock.type !== 'shallow') {
      return { type: 'INVALID_DURATION', min: expectedDuration, max: expectedDuration }
    }
    if (newBlock.duration !== expectedDuration) {
      return { type: 'INVALID_DURATION', min: expectedDuration, max: expectedDuration }
    }
  } else if (newBlock.type === 'deep') {
    // Deep work: 60-120 minutes
    if (newBlock.duration < 60 || newBlock.duration > 120) {
      return { type: 'INVALID_DURATION', min: 60, max: 120 }
    }
  } else if (newBlock.type === 'shallow') {
    // Regular shallow work: minimum 30 minutes
    if (newBlock.duration < 30) {
      return { type: 'INVALID_DURATION', min: 30, max: Infinity }
    }
  }

  const { start: newStart, end: newEnd } = getBlockTimeRange(newBlock as Block)

  // Convert UTC times to local for validation
  const startHour = getLocalHour(newStart)
  const endHour = getLocalHour(newEnd)
  
  if (startHour < START_HOUR || endHour > END_HOUR) {
    return { type: 'OUT_OF_BOUNDS' }
  }

  // Check for overlaps with existing blocks
  const conflictingBlock = existingBlocks.find(block => {
    if (ignoreId && block.id === ignoreId) return false
    
    const { start: blockStart, end: blockEnd } = getBlockTimeRange(block)
    return newStart < blockEnd && newEnd > blockStart
  })

  if (conflictingBlock) {
    return { type: 'OVERLAP', conflictingBlock }
  }

  return null
}

// Position calculations
export function getBlockPosition(block: Block): number {
  const startTime = snapToGrid(new Date(block.startTime))
  const hours = startTime.getHours() - START_HOUR
  const minutes = startTime.getMinutes()
  return (hours * PIXELS_PER_HOUR) + (minutes / 60) * PIXELS_PER_HOUR
}

export function getBlockHeight(minutes: number): number {
  return (minutes / 60) * PIXELS_PER_HOUR - BLOCK_GAP
}

// Time formatting
export function formatHour(hour: number): string {
  return `${hour}${hour < 12 ? 'a' : 'p'}`
}

export function formatTime(date: Date): string {
  const snapped = snapToGrid(date)
  const hours = snapped.getHours()
  const minutes = snapped.getMinutes().toString().padStart(2, '0')
  const period = hours < 12 ? 'am' : 'pm'
  return `${hours % 12 || 12}:${minutes} ${period}`
}

// Grid line generation
export function getGridLines() {
  const lines: { position: number; isHour: boolean }[] = []
  const totalIncrements = ((END_HOUR - START_HOUR) * 60) / MINUTES_PER_INCREMENT
  
  for (let i = 0; i <= totalIncrements; i++) {
    const position = i * PIXELS_PER_INCREMENT
    const isHour = i % 2 === 0
    lines.push({ position, isHour })
  }
  
  return lines
}

// Create blocks in local time matching our grid
export function createLocalISOString(hour: number, minute: number): string {
  const date = new Date()
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

// Add this helper function
export function timeStringToISO(timeStr: string): string {
  const [hours = "00", minutes = "00"] = timeStr.split(':')
  const date = new Date()
  date.setHours(parseInt(hours), parseInt(minutes), 0, 0)
  return date.toISOString()
} 