import { type BrainDump, type Block, type Result } from './types'
import { transformToBlocks } from './openai'

export async function convertBrainDumpToBlocks(
  dump: BrainDump
): Promise<Result<Block[]>> {
  try {
    // Just pass the raw text directly to our scheduler
    // It already handles parsing times and task types
    return await transformToBlocks(dump.rawText)
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process brain dump"
    }
  }
} 