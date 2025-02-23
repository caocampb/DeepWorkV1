'use client'

import { Block } from '@/lib/types'
import { TimeBlock } from '@/components/time-block'
import { 
  PIXELS_PER_HOUR,
  START_HOUR,
  END_HOUR,
  formatHour,
  formatTime,
  getBlockPosition,
  getBlockHeight,
  getGridLines,
  createLocalISOString,
  validateBlock,
  snapToGrid
} from '@/lib/time-system'
import { useState, useRef, useEffect } from 'react'

interface BlockListProps {
  blocks: Block[]
  invalidBlocks?: Array<{
    block: Partial<Block>
    reason: string
  }>
  onCreateBlock?: (block: Omit<Block, 'id'>) => void
  onClearBlocks?: () => void
  onDeleteBlock?: (id: string) => void
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

function CurrentTimeLine() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  const currentHour = now.getHours()
  const currentMinutes = now.getMinutes()
  
  if (currentHour < START_HOUR || currentHour >= END_HOUR) {
    return null
  }

  const position = ((currentHour - START_HOUR) * PIXELS_PER_HOUR) + 
                  ((currentMinutes / 60) * PIXELS_PER_HOUR)

  const timeDisplay = `${currentHour % 12 || 12}:${String(currentMinutes).padStart(2, '0')}${currentHour < 12 ? 'a' : 'p'}`

  return (
    <>
      {/* Time label - positioned in the axis area */}
      <div 
        className="absolute -left-[42px] flex items-center pointer-events-none"
        style={{ top: position - 6 }}
      >
        <div className="text-[11px] font-mono text-indigo-400 font-medium tabular-nums tracking-tight">
          {timeDisplay}
        </div>
      </div>

      {/* Line - positioned in the main area */}
      <div 
        className="absolute inset-x-0 flex items-center pointer-events-none"
        style={{ top: position }}
      >
        <div className="flex-1 h-[1px] bg-gradient-to-r from-indigo-400/60 to-indigo-400/30 shadow-[0_0_2px_rgba(129,140,248,0.3)]" />
        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400/60 -translate-x-[2px]" />
      </div>
    </>
  )
}

function snapTimeToGrid(time: string): string {
  const [hours = "00", minutes = "00"] = time.split(':');
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  const snappedDate = snapToGrid(date);
  return `${String(snappedDate.getHours()).padStart(2, '0')}:${String(snappedDate.getMinutes()).padStart(2, '0')}`;
}

export function BlockList({ blocks, invalidBlocks, onCreateBlock, onClearBlocks, onDeleteBlock }: BlockListProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [timeInput, setTimeInput] = useState('')
  const [period, setPeriod] = useState('am')
  const [error, setError] = useState<string | null>(null)
  const [showReasoning, setShowReasoning] = useState(false)
  const isEmpty = !blocks?.length

  function handleDelete(id: string) {
    if (onDeleteBlock) {
      onDeleteBlock(id)
    }
  }

  // Convert 12h to 24h format for storage
  function to24Hour(time: string, p: string): string {
    const [hours = "00", minutes = "00"] = time.split(':')
    let h = parseInt(hours || "0")
    if (p === 'pm' && h < 12) h += 12
    if (p === 'am' && h === 12) h = 0
    return `${String(h).padStart(2, '0')}:${minutes}`
  }

  function handleTimeInput(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    
    // Allow backspace/delete
    if (value.length < timeInput.length) {
      setTimeInput(value)
      return
    }
    
    // Only allow digits
    const digits = value.replace(/[^\d]/g, '')
    
    // Format as we type
    if (digits.length <= 4) {
      // Handle hours
      if (digits.length <= 2) {
        const hour = parseInt(digits)
        // Don't allow hours > 12
        if (hour > 12) {
          setTimeInput('12')
        } else {
          setTimeInput(digits)
        }
      } else {
        const hours = digits.slice(0, 2)
        const mins = digits.slice(2)
        const minutes = parseInt(mins)
        
        // When they finish typing minutes, snap to nearest 30
        if (mins.length === 2) {
          const snappedMins = Math.round(minutes / 30) * 30
          if (snappedMins === 60) {
            // Roll over to next hour
            const nextHour = (parseInt(hours) % 12) + 1
            setTimeInput(`${String(nextHour).padStart(2, '0')}:00`)
          } else {
            setTimeInput(`${hours}:${String(snappedMins).padStart(2, '0')}`)
          }
        } else {
          // Don't allow minutes > 59
          if (minutes > 59) {
            setTimeInput(`${hours}:59`)
          } else {
            setTimeInput(`${hours}:${mins}`)
          }
        }
      }
    }
  }

  // Reset form when opening
  function handleOpenForm() {
    setIsCreating(true)
    setTimeInput('')
    setPeriod('am')
    setError(null)
  }

  function togglePeriod() {
    setPeriod(prev => prev === 'am' ? 'pm' : 'am')
  }

  function handleCreateBlock(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    
    const task = formData.get('task')
    const duration = formData.get('duration')
    const type = formData.get('type')
    
    if (!task || !duration || !type || !onCreateBlock) return
    
    // Ensure we have a valid time
    if (!timeInput.match(/^\d{2}:\d{2}$/)) {
      setError('Please enter a valid time')
      return
    }
    
    // Convert to 24-hour format for processing
    const time24 = to24Hour(timeInput, period)
    const [hours = "00", minutes = "00"] = time24.split(':')
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
    const newBlock = {
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
    
    // Add the new block
    onCreateBlock(newBlock)
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
        {blocks.length > 0 && onClearBlocks && (
          <button
            onClick={onClearBlocks}
            className="text-white/40 hover:text-white/60 transition-colors text-sm"
          >
            Clear All
          </button>
        )}
        <button
          onClick={() => {
            if (isCreating) {
              setIsCreating(false)
            } else {
              handleOpenForm()
            }
          }}
          className={`text-white/40 hover:text-white/60 transition-colors ${isCreating ? 'text-white/60' : ''}`}
        >
          {isCreating ? '×' : '+'}
        </button>
      </div>

      {/* Creation Form - Moved above the timeline */}
      {isCreating && (
        <div className="mb-4 rounded-lg bg-[#1C1C1C] border border-white/[0.08] relative">
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
              <div className="flex items-center justify-between bg-white/[0.04] hover:bg-white/[0.06] rounded px-3 py-2 text-white/80 hover:text-white/90 transition-colors group relative min-w-[120px]">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="HH:mm"
                    maxLength={5}
                    value={timeInput}
                    onChange={handleTimeInput}
                    className="bg-transparent border-none text-white/80 text-sm font-mono focus:outline-none w-[52px]"
                  />
                  <button
                    type="button"
                    onClick={togglePeriod}
                    className="text-white/60 hover:text-white/80 text-xs uppercase transition-colors w-[24px] text-left"
                  >
                    {period}
                  </button>
                </div>
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
              </div>

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

      {/* Timeline */}
      <div className="flex gap-8">
        <div className="flex-1 flex gap-4">
          <TimeAxis />
          <div 
            className="flex-1 relative rounded-lg border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm overflow-hidden" 
            style={{ height: (END_HOUR - START_HOUR) * PIXELS_PER_HOUR }}
          > 
            {/* Grid lines */}
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
                <TimeBlock block={block} onDelete={handleDelete} />
              </div>
            ))}

            {/* Current time line */}
            <div className="relative z-50">
              <CurrentTimeLine />
            </div>
          </div>
        </div>
      </div>

      {/* Reasoning Panel Toggle */}
      {blocks.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setShowReasoning(prev => !prev)}
            className="w-full group px-4 py-3 rounded-md
                     bg-gradient-to-b from-white/[0.02] to-transparent
                     hover:from-white/[0.04] hover:to-transparent
                     focus:from-white/[0.05] focus:to-white/[0.02]
                     transition-all duration-300 ease-out
                     flex items-center justify-between
                     hover:translate-y-[-1px] active:translate-y-0"
          >
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-5 h-5">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-400/10 to-purple-400/10 blur-md" />
                <div className="relative w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-blue-400/40 to-purple-400/30 ring-1 ring-white/[0.03]" />
              </div>
              <span className="text-[13px] text-white/60 tracking-tight font-medium group-hover:text-white/70 transition-colors">
                View Schedule Reasoning
              </span>
            </div>
            <div className={`transform transition-all duration-300 ease-out ${showReasoning ? 'rotate-180 translate-y-[1px] text-white/40' : 'text-white/30'}`}>
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none" className="group-hover:text-white/40 transition-colors">
                <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </button>

          {/* Reasoning Content */}
          <div className={`transform-gpu transition-all duration-300 ease-out overflow-hidden
                        ${showReasoning ? 'max-h-[1000px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 translate-y-[-8px]'}`}>
            <div className="mt-3 space-y-6 rounded-lg bg-gradient-to-b from-white/[0.02] to-transparent p-6">
              {/* Successful Scheduling */}
              <div className="space-y-4">
                {sortedBlocks.map(block => (
                  <div key={block.id} className="group">
                    {/* Time + Task */}
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <div className="text-sm text-white/80 font-medium tracking-tight">
                        {block.task}
                      </div>
                      <div className="text-xs text-white/40 font-mono tabular-nums tracking-tight">
                        {formatTime(new Date(block.startTime))}
                      </div>
                    </div>

                    {/* Type Indicator + Duration */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`h-[3px] w-[18px] rounded-full ${
                        block.type === 'deep' ? 'bg-gradient-to-r from-blue-400/70 to-blue-500/70' :
                        block.type === 'shallow' ? 'bg-gradient-to-r from-purple-400/50 to-purple-500/50' :
                        'bg-gradient-to-r from-green-400/50 to-green-500/50'
                      }`} />
                      <div className="text-[11px] text-white/40 font-mono tracking-tight">
                        {block.duration}min {block.type === 'deep' ? 'focused' : block.type} work
                      </div>
                    </div>

                    {/* Reasoning - More emphasis on deep work principles */}
                    <div className="pl-6 border-l border-white/[0.08] group-hover:border-white/[0.12] transition-colors">
                      <div className="text-xs text-white/50 italic leading-relaxed">
                        {block.type === 'deep' ? (
                          <span className="text-blue-400/70">"</span>
                        ) : block.type === 'shallow' ? (
                          <span className="text-purple-400/70">"</span>
                        ) : (
                          <span className="text-green-400/70">"</span>
                        )}
                        {block.reason || 'Scheduled based on availability'}
                        {block.type === 'deep' ? (
                          <span className="text-blue-400/70">"</span>
                        ) : block.type === 'shallow' ? (
                          <span className="text-purple-400/70">"</span>
                        ) : (
                          <span className="text-green-400/70">"</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Scheduling Conflicts */}
              {invalidBlocks && invalidBlocks.length > 0 && (
                <div className="mt-8 pt-8 border-t border-white/[0.08]">
                  <div className="space-y-1 mb-4">
                    <h3 className="text-sm font-medium tracking-tight text-red-400/80">Couldn't Schedule</h3>
                    <p className="text-xs text-white/40">Tasks that need adjustment</p>
                  </div>

                  <div className="space-y-4">
                    {invalidBlocks.map((invalid, i) => (
                      <div key={i} className="group">
                        {/* Task */}
                        <div className="text-sm text-red-400/70 font-medium tracking-tight mb-1">
                          {invalid.block.task}
                        </div>

                        {/* Type Indicator + Duration */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`h-[3px] w-[18px] rounded-full bg-red-400/40`} />
                          <div className="text-[11px] text-white/40 font-mono tracking-tight">
                            {invalid.block.duration}min {invalid.block.type} work
                          </div>
                        </div>

                        {/* Reasoning */}
                        <div className="pl-6 border-l border-red-400/20 group-hover:border-red-400/30 transition-colors">
                          <div className="text-xs text-red-400/60 italic">
                            "{invalid.reason}"
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}