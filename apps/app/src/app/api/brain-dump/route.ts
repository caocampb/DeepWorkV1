import { convertBrainDumpToBlocks } from '@/lib/brain-dump'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    const result = await convertBrainDumpToBlocks({
      rawText: body.text
    })
    
    return Response.json(result)
  } catch (error) {
    console.error('Brain Dump Error:', error)
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to process brain dump" 
    }, { status: 500 })
  }
} 