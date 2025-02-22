'use client'

import { Block } from '@/lib/types'
import { formatTime, getBlockTimeRange } from '@/lib/time-system'

interface TimeBlockProps {
  block: Block
}

const typeStyles = {
  deep: {
    container: 'bg-gradient-to-r from-white/[0.08] to-white/[0.06] border-white/[0.12] hover:from-white/[0.09] hover:to-white/[0.07]',
    indicator: 'bg-blue-400/80',
    text: 'text-white/90'
  },
  shallow: {
    container: 'bg-gradient-to-r from-white/[0.06] to-white/[0.04] border-white/[0.10] hover:from-white/[0.07] hover:to-white/[0.05]',
    indicator: 'bg-purple-400/70',
    text: 'text-white/85'
  },
  break: {
    container: 'bg-gradient-to-r from-white/[0.04] to-white/[0.02] border-white/[0.08] hover:from-white/[0.05] hover:to-white/[0.03]',
    indicator: 'bg-green-400/70',
    text: 'text-white/80'
  }
}

export function TimeBlock({ block }: TimeBlockProps) {
  const { start, end } = getBlockTimeRange(block)
  const styles = typeStyles[block.type]
  
  return (
    <div 
      className={`group h-full w-full border px-3 py-2.5
                 backdrop-blur-sm backdrop-saturate-150
                 transition-all duration-200 ease-out
                 hover:translate-x-[1px] hover:translate-y-[-1px]
                 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]
                 ${styles.container}`}
    >
      <div className="flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${styles.indicator}`} />
        <div className={`text-sm font-medium tracking-[-0.01em] ${styles.text}`}>
          {block.task}
        </div>
      </div>
      <div className="text-[11px] text-white/40 font-mono mt-1.5 tabular-nums tracking-tight">
        {formatTime(start)} — {formatTime(end)}
      </div>
    </div>
  )
} 