// Core constants - Linear inspired grid system
export const PIXELS_PER_HOUR = 120  // Each hour is 120px tall
export const MINUTES_PER_INCREMENT = 30  // 30-minute grid like Linear
export const PIXELS_PER_INCREMENT = PIXELS_PER_HOUR / 2  // 60px per increment
export const BLOCK_GAP = 2  // Minimal 2px gap for visual separation
export const START_HOUR = 8   // 8 AM
export const END_HOUR = 20    // 8 PM
export const TOTAL_HEIGHT = (END_HOUR - START_HOUR) * PIXELS_PER_HOUR

// Simple time extraction - just find HH:MM or HH(am/pm)
export function findFixedTimes(input: string): { time: string; task: string }[] {
  const fixedTimes: { time: string; task: string }[] = []
  const lines = input.split('\n')

  for (const line of lines) {
    // Match "HH:MM" or "HH(am|pm)" or "HH:MM(am|pm)"
    const match = line.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i)
    if (match) {
      const [_, hours, minutes = '00', meridian = ''] = match
      let hour = parseInt(hours || '0')
      
      // Convert to 24hr
      if (meridian.toLowerCase() === 'pm' && hour < 12) hour += 12
      if (meridian.toLowerCase() === 'am' && hour === 12) hour = 0
      
      // Round to nearest 30
      const mins = parseInt(minutes)
      const roundedMins = Math.round(mins / 30) * 30
      
      const time = `${hour.toString().padStart(2, '0')}:${roundedMins.toString().padStart(2, '0')}`
      const task = line.replace(match[0], '').trim()
      
      fixedTimes.push({ time, task })
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
  newBlock: Block, 
  existingBlocks: Block[],
  ignoreId?: string
): BlockValidationError | null {
  const { start: newStart, end: newEnd } = getBlockTimeRange(newBlock)

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