// Core constants - Linear inspired grid system
export const PIXELS_PER_HOUR = 120  // Each hour is 120px tall
export const MINUTES_PER_INCREMENT = 30  // 30-minute grid like Linear
export const PIXELS_PER_INCREMENT = PIXELS_PER_HOUR / 2  // 60px per increment
export const BLOCK_GAP = 2  // Minimal 2px gap for visual separation
export const START_HOUR = 3   // 3 AM
export const END_HOUR = 9    // 9 AM
export const TOTAL_HEIGHT = (END_HOUR - START_HOUR) * PIXELS_PER_HOUR

// Basic types
export interface TimeRange {
  start: Date
  end: Date
}

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

// Time slot validation
export function getBlockTimeRange(block: Block): TimeRange {
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

  // Validate within day bounds
  const startHour = newStart.getHours()
  const endHour = newEnd.getHours()
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

export function isValidBlock(
  newBlock: Block, 
  existingBlocks: Block[],
  ignoreId?: string
): boolean {
  return validateBlock(newBlock, existingBlocks, ignoreId) === null
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