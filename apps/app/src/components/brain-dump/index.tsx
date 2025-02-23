'use client'

import { useState, useCallback, KeyboardEvent, useRef, useEffect } from 'react'
import { Button } from "@v1/ui/button"
import { Icons } from "@v1/ui/icons"
import { type Block } from '@/lib/types'

// Regex for time markers like "2pm", "14:00", etc
const TIME_REGEX = /\b((1[0-2]|0?[1-9]):[0-5][0-9]([ap]m)?|(1[0-2]|0?[1-9])([ap]m))\b/gi

interface BrainDumpInputProps {
  onTransform: (blocks: Block[]) => void
}

export function BrainDumpInput({ onTransform }: BrainDumpInputProps) {
  const [text, setText] = useState('')
  const [isTransforming, setIsTransforming] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [charCount, setCharCount] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Highlight time markers in the display text
  const highlightedText = text.split('\n').map(line => 
    line.replace(TIME_REGEX, match => `<span class="text-blue-400/70">${match}</span>`)
  ).join('\n')

  const handleTransform = useCallback(async () => {
    if (!text.trim() || isTransforming) return
    
    setIsTransforming(true)
    
    try {
      const res = await fetch('/api/brain-dump', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      
      const result = await res.json()
      
      if (result.success && result.data) {
        onTransform(result.data)
      }
    } finally {
      setIsTransforming(false)
    }
  }, [text, isTransforming, onTransform])

  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleTransform()
    }
  }

  // Sync the display div with textarea scroll
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    const handleScroll = () => {
      const display = textarea.nextElementSibling as HTMLElement
      if (display) {
        display.scrollTop = textarea.scrollTop
      }
    }
    
    textarea.addEventListener('scroll', handleScroll)
    return () => textarea.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="space-y-8">
      {/* Brain Dump Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-[-0.02em] text-white/90">Brain Dump</h2>
          <p className="text-[13px] text-white/60">What do you want to accomplish today?</p>
        </div>
        
        <div className="relative group">
          {/* Input handler - invisible but handles all interaction */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              setCharCount(e.target.value.length)
            }}
            onKeyDown={handleKeyDown}
            className="w-full h-48 p-4 bg-black/60 rounded-lg border border-white/[0.08] resize-none font-mono text-sm
                     focus:outline-none focus:ring-1 focus:ring-white/[0.12] focus:border-white/[0.12]
                     transition-all duration-200 ease-out
                     group-hover:border-white/[0.11] group-hover:bg-black/70
                     selection:bg-white/10"
            style={{ 
              color: 'transparent',
              caretColor: 'white',
              WebkitTextFillColor: 'transparent'
            }}
          />
          
          {/* Display layer - shows either placeholder or actual text */}
          <div 
            className="absolute inset-0 w-full h-48 p-4 pointer-events-none font-mono text-sm whitespace-pre-wrap"
          >
            {text ? (
              <span className="text-white/90" dangerouslySetInnerHTML={{ __html: highlightedText }} />
            ) : (
              <span className="text-white/40">Example:
- Build auth system (complex, morning)
- Review PRs
- Team meeting at 2pm
- Write documentation
- Take breaks between deep work</span>
            )}
          </div>
          
          {/* Character count */}
          <div className="absolute bottom-2 right-2 text-[10px] tabular-nums font-mono text-white/40">
            {charCount}/1000
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Button 
            onClick={handleTransform}
            disabled={isTransforming || !text.trim()}
            className={`gap-2 relative group overflow-hidden transition-all duration-200 ease-out
                      bg-white/[0.05] border border-white/[0.08]
                      hover:bg-white/[0.08] hover:border-white/[0.12]
                      hover:translate-x-[1px] hover:translate-y-[-1px]
                      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0
                      text-white/90
                      shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]`}
          >
            <span className="relative z-10 flex items-center gap-2">
              {isTransforming ? (
                <>
                  <Icons.Loader className="size-4 animate-spin" />
                  <span>Transforming</span>
                </>
              ) : (
                <>
                  Transform <span aria-hidden="true" className="text-white/60 group-hover:translate-x-[2px] transition-transform duration-200">→</span>
                </>
              )}
            </span>
          </Button>
          
          {/* Loading bar */}
          {isTransforming && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/[0.02] overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-white/20 w-1/3 animate-[loading_1s_ease-in-out_infinite]" />
            </div>
          )}
        </div>
        
        <Button 
          variant="outline" 
          onClick={() => setText('')}
          className="text-white/60 hover:text-white/80 transition-colors border-white/[0.05] hover:border-white/[0.08]"
        >
          Clear
        </Button>

        {/* Keyboard shortcut hint */}
        <span className="text-[10px] font-mono text-white/40">⌘+Enter to transform</span>
      </div>

      {/* Workflow State - Always visible */}
      <div className="mt-8 text-center space-y-6">
        <div className="flex items-center justify-center gap-4 text-xl">
          <div className="flex flex-col items-center">
            <span className={`transform transition-transform hover:scale-110 ${!text ? 'text-white/70' : 'text-white/30'}`}>○</span>
            <span className="text-[11px] font-mono mt-2 text-white/50">Brain dump</span>
          </div>
          <span className="text-white/20 translate-y-[-2px]">→</span>
          <div className="flex flex-col items-center">
            <span className={`transform transition-transform hover:scale-110 ${text && !isTransforming ? 'text-white/70' : 'text-white/30'}`}>◇</span>
            <span className="text-[11px] font-mono mt-2 text-white/50">Transform</span>
          </div>
          <span className="text-white/20 translate-y-[-2px]">→</span>
          <div className="flex flex-col items-center">
            <span className={`transform transition-transform hover:scale-110 ${isTransforming ? 'text-white/70' : 'text-white/30'}`}>◎</span>
            <span className="text-[11px] font-mono mt-2 text-white/50">Deep work</span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-white/60">Ready for deep work?</p>
          <p className="text-sm text-white/40">Brain dump your tasks above and transform them into focused blocks</p>
        </div>
      </div>
    </div>
  )
}

// Add to your global CSS
const styles = `
@keyframes loading {
  0% { transform: translateX(-100%) }
  50% { transform: translateX(100%) }
  100% { transform: translateX(-100%) }
}` 