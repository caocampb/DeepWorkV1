import { z } from 'zod'

// Core block type - used everywhere
export interface Block {
  id: string
  startTime: string    // ISO string
  duration: number     // minutes
  task: string
  type: 'deep' | 'shallow' | 'break'
}

// Type helpers
export type BlockType = Block['type']

// Brain dump input type
export interface BrainDump {
  rawText: string
  timeContext?: {
    startTime?: string
    endTime?: string
    fixedBreaks?: Array<{time: string, duration: number}>
  }
}

// Zod schemas for validation
export const blockSchema = z.object({
  id: z.string(),
  startTime: z.string().datetime(),
  duration: z.number().min(5),     // Minimum 5 minutes
  task: z.string().min(1),
  type: z.enum(['deep', 'shallow', 'break']),
})

export const brainDumpSchema = z.object({
  text: z.string().min(1).max(1000),
  timePreferences: z.object({
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional()
  }).optional()
})

// Type inference
export type ValidBlock = z.infer<typeof blockSchema>
export type BrainDumpInput = z.infer<typeof brainDumpSchema>

// Result type for error handling
export interface Result<T> {
  success: boolean
  data?: T
  error?: string
  warnings?: string[]  // Add warnings for partial success
  invalidBlocks?: {    // Add structured invalid block info
    block: Partial<Block>
    reason: string
  }[]
}

// Block utils
export function formatTime(time: string): string {
  return new Date(time).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  })
}

export function formatDuration(minutes: number): string {
  return `${minutes}min`
}

export function calculateEndTime(block: Block): Date {
  const start = new Date(block.startTime)
  return new Date(start.getTime() + block.duration * 60000)
} 