'use client'

import { Block } from '@/lib/types'
import { TimeBlock } from '@/components/time-block'
import { 
  PIXELS_PER_HOUR,
  START_HOUR,
  END_HOUR,
  formatHour,
  getBlockPosition,
  getBlockHeight,
  getGridLines
} from '@/lib/time-system'

interface BlockListProps {
  blocks: Block[]
}

function TimeAxis() {
  const hours = Array.from(
    { length: END_HOUR - START_HOUR }, 
    (_, i) => START_HOUR + i
  )
  
  return (
    <div className="relative w-8 flex-shrink-0 select-none">
      {hours.map(hour => (
        <div 
          key={hour}
          className="absolute left-0 font-mono text-[11px] text-white/30 tabular-nums tracking-tight hover:text-white/40 transition-colors"
          style={{ top: (hour - START_HOUR) * PIXELS_PER_HOUR - 6 }}
        >
          {formatHour(hour)}
        </div>
      ))}
    </div>
  )
}

export function BlockList({ blocks }: BlockListProps) {
  if (!blocks?.length) {
    return (
      <div className="mt-8 text-center space-y-1">
        <p className="text-sm text-white/60">Ready for deep work?</p>
        <p className="text-sm text-white/40">Transform your tasks to create focused blocks</p>
      </div>
    )
  }

  // Sort blocks by start time
  const sortedBlocks = [...blocks].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )

  // Get grid lines for consistent 30-min increments
  const gridLines = getGridLines()

  return (
    <div className="mt-8 flex gap-4">
      <TimeAxis />
      <div 
        className="flex-1 relative rounded-lg border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm overflow-hidden" 
        style={{ height: (END_HOUR - START_HOUR) * PIXELS_PER_HOUR }}
      > 
        {/* Time grid lines */}
        {gridLines.map(({ position, isHour }, i) => (
          <div 
            key={i}
            className={`absolute left-0 right-0 border-t ${
              isHour ? 'border-white/[0.08]' : 'border-white/[0.04]'
            }`}
            style={{ top: position }}
          />
        ))}
        
        {/* Blocks */}
        {sortedBlocks.map(block => (
          <div
            key={block.id}
            className="absolute inset-x-0"
            style={{ 
              top: getBlockPosition(block),
              height: getBlockHeight(block.duration)
            }}
          >
            <TimeBlock block={block} />
          </div>
        ))}
      </div>
    </div>
  )
} 