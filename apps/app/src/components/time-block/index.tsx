'use client'

import { Block } from '@/lib/types'
import { formatTime, getBlockTimeRange } from '@/lib/time-system'

interface TimeBlockProps {
  block: Block
  onDelete?: (id: string) => void
}

const typeStyles = {
  deep: {
    container: `
      bg-gradient-to-r from-blue-500/20 to-blue-400/10 
      border-blue-400/30 
      hover:from-blue-500/25 hover:to-blue-400/15 hover:border-blue-400/40 
      shadow-[inset_0_1px_0_0_rgba(96,165,250,0.2)]
      hover:shadow-[inset_0_1px_0_0_rgba(96,165,250,0.25)]
    `,
    indicator: 'w-2 h-2 bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)] ring-1 ring-blue-400/40',
    text: 'text-white/95 font-medium tracking-tight',
    time: 'text-blue-300/70'
  },
  shallow: {
    container: `
      bg-gradient-to-r from-purple-500/10 to-purple-400/5 
      border-purple-400/20 
      hover:from-purple-500/15 hover:to-purple-400/10 hover:border-purple-400/30
      shadow-[inset_0_1px_0_0_rgba(168,85,247,0.1)]
      hover:shadow-[inset_0_1px_0_0_rgba(168,85,247,0.15)]
    `,
    indicator: 'w-1.5 h-1.5 bg-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.4)] ring-1 ring-purple-400/30',
    text: 'text-white/90 tracking-tight',
    time: 'text-purple-300/60'
  },
  break: {
    container: `
      bg-gradient-to-r from-green-500/10 to-green-400/5 
      border-green-400/20 
      hover:from-green-500/15 hover:to-green-400/10 hover:border-green-400/30
      shadow-[inset_0_1px_0_0_rgba(74,222,128,0.1)]
      hover:shadow-[inset_0_1px_0_0_rgba(74,222,128,0.15)]
    `,
    indicator: 'w-1.5 h-1.5 bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.4)] ring-1 ring-green-400/30',
    text: 'text-white/85 tracking-tight',
    time: 'text-green-300/60'
  }
}

export function TimeBlock({ block, onDelete }: TimeBlockProps) {
  const { start, end } = getBlockTimeRange(block)
  const styles = typeStyles[block.type]
  
  return (
    <div 
      className={`group relative h-full w-full border rounded-lg px-4 py-2.5
                 backdrop-blur-sm backdrop-saturate-150
                 transition-all duration-150 ease-out
                 ${styles.container}`}
    >
      <div className="flex items-center gap-2.5">
        <div className={`rounded-full ${styles.indicator}`} />
        <div className={`flex-1 text-sm tracking-[-0.01em] ${styles.text}`}>
          {block.task}
        </div>
        {onDelete && (
          <button
            onClick={() => onDelete(block.id)}
            className="opacity-0 group-hover:opacity-100
                      text-[11px] text-red-400/40 hover:text-red-400/90
                      transition-all duration-150 ease-out
                      hover:translate-y-[-0.5px]"
          >
            Delete
          </button>
        )}
      </div>
      <div className={`text-[11px] font-mono mt-1.5 tabular-nums tracking-tight ${styles.time}`}>
        {formatTime(start)} — {formatTime(end)}
      </div>
    </div>
  )
} 