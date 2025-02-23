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
  getGridLines,
  createLocalISOString,
  validateBlock,
  snapToGrid
} from '@/lib/time-system'
import { useState } from 'react'

interface BlockListProps {
  blocks: Block[]
}

// Helper to format time in 12-hour format
function formatTimeForDisplay(time: string): string {
  const [hours = "00", minutes = "00"] = time.split(':')
  const date = new Date()
  date.setHours(parseInt(hours), parseInt(minutes))
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  }).replace(/\s/, ' ') // Ensure consistent space before AM/PM
}

// Get current time in HH:mm format
function getCurrentTime(): string {
  return new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit',
    minute: '2-digit',
    hour12: false 
  })
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

function snapTimeToGrid(time: string): string {
  const [hoursStr = "0", minutesStr = "0"] = time.split(':')
  const hours = parseInt(hoursStr)
  const minutes = parseInt(minutesStr)
  const date = new Date()
  date.setHours(hours, minutes)
  const snappedDate = snapToGrid(date)
  return `${String(snappedDate.getHours()).padStart(2, '0')}:${String(snappedDate.getMinutes()).padStart(2, '0')}`
}

export function BlockList({ blocks: initialBlocks }: BlockListProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [selectedTime, setSelectedTime] = useState(getCurrentTime())
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks)
  const [error, setError] = useState<string | null>(null)
  const isEmpty = !blocks?.length

  function handleCreateBlock(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    
    const task = formData.get('task')
    const duration = formData.get('duration')
    const type = formData.get('type')
    
    if (!task || !duration || !type) return
    
    const [hours = '0', minutes = '0'] = selectedTime.split(':')
    const parsedHours = parseInt(hours)
    const parsedMinutes = parseInt(minutes)
    const parsedDuration = parseInt(duration.toString())
    
    if (isNaN(parsedHours) || isNaN(parsedMinutes) || isNaN(parsedDuration)) return
    
    // Validate duration
    const maxDuration = (END_HOUR - parsedHours) * 60 - parsedMinutes
    if (parsedDuration > maxDuration) {
      setError(`Duration too long. Max duration for this time slot is ${maxDuration} minutes`)
      return
    }
    
    // Create the new block
    const newBlock: Block = {
      id: crypto.randomUUID(),
      task: task.toString(),
      startTime: createLocalISOString(parsedHours, parsedMinutes),
      duration: parsedDuration,
      type: type.toString() as Block['type']
    }
    
    // Validate the block
    const validationError = validateBlock(newBlock, blocks)
    if (validationError) {
      if (validationError.type === 'OUT_OF_BOUNDS') {
        setError(`Time must be between ${START_HOUR}:00 AM and ${END_HOUR > 12 ? END_HOUR - 12 : END_HOUR}:00 ${END_HOUR >= 12 ? 'PM' : 'AM'}`)
        return
      }
      if (validationError.type === 'OVERLAP') {
        setError('This time slot overlaps with another block')
        return
      }
      return
    }
    
    // Add the new block to our list
    setBlocks(prev => [...prev, newBlock])
    setIsCreating(false)
  }

  // Sort blocks by start time
  const sortedBlocks = [...blocks].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )

  // Get grid lines for consistent 30-min increments
  const gridLines = getGridLines()

  return (
    <div className="mt-8">
      {/* Header with add button */}
      <div className="flex items-center justify-end gap-2">
        {!isEmpty && (
          <button
            onClick={() => setBlocks([])}
            className="text-white/40 hover:text-white/60 transition-colors text-sm"
          >
            Clear All
          </button>
        )}
        <button
          onClick={() => setIsCreating(!isCreating)}
          className={`text-white/40 hover:text-white/60 transition-colors ${isCreating ? 'text-white/60' : ''}`}
        >
          {isCreating ? '×' : '+'}
        </button>
      </div>

      {isCreating && (
        <div className="mt-4 rounded-lg bg-[#1C1C1C] border border-white/[0.08] relative">
          <form className="p-4" onSubmit={handleCreateBlock}>
            <div className="text-[13px] text-white/40 mb-2">Task</div>
            {error && (
              <div className="text-red-400/90 text-sm mb-3">
                {error}
              </div>
            )}
            <input
              name="task"
              type="text"
              required
              autoFocus
              placeholder="Enter a focused task for deep work..."
              className="w-full bg-[#252525] border-none rounded px-3 py-2 text-white/90 placeholder-white/30 text-sm focus:outline-none mb-3"
            />
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={() => {
                  const timeInput = document.querySelector('input[name="time"]') as HTMLInputElement
                  if (timeInput) timeInput.showPicker()
                }}
                className="flex items-center justify-between bg-white/[0.04] hover:bg-white/[0.06] rounded px-3 py-2 text-white/80 hover:text-white/90 transition-colors group relative min-w-[120px]"
              >
                <input
                  name="time"
                  type="time"
                  step={1800}
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(snapTimeToGrid(e.target.value))}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-transparent border-none text-white/80 text-sm font-mono tracking-tight focus:outline-none w-[85px] [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden [&::-webkit-clear-button]:hidden selection:bg-white/10"
                />
                <svg 
                  width="13" 
                  height="13" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  className="text-white/30 group-hover:text-white/40 transition-colors flex-shrink-0 ml-2"
                  strokeWidth="1.5"
                >
                  <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              <div className="flex items-center gap-1.5 bg-white/[0.04] rounded px-3 py-2">
                <input
                  name="duration"
                  type="number"
                  required
                  defaultValue={30}
                  min="5"
                  step="5"
                  className="bg-transparent border-none text-white/80 text-sm w-8 focus:outline-none [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden"
                />
                <span className="text-white/40 text-sm">min</span>
              </div>

              <select 
                name="type"
                className="bg-white/[0.04] border-none rounded px-3 py-2 text-white/80 text-sm focus:outline-none cursor-pointer min-w-[110px]"
                defaultValue="deep"
              >
                <option value="deep">Deep Work</option>
                <option value="shallow">Shallow Work</option>
                <option value="break">Break</option>
              </select>

              <button 
                type="submit"
                className="ml-auto text-sm text-white/90 hover:text-white transition-colors"
              >
                Add →
              </button>
            </div>
          </form>
        </div>
      )}

      {isEmpty ? (
        <div className="mt-8 text-center space-y-1">
          <p className="text-sm text-white/60">Ready for deep work?</p>
          <p className="text-sm text-white/40">Transform your tasks to create focused blocks</p>
        </div>
      ) : (
        <div className="mt-4 flex gap-4">
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
      )}
    </div>
  )
}