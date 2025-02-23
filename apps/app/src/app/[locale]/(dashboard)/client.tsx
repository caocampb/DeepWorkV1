'use client'

import { useState } from 'react'
import { type Block } from '@/lib/types'
import { BrainDumpInput } from '@/components/brain-dump'
import { BlockList } from '@/components/block-list'
import { SignOut } from "@/components/sign-out"

// Start with just the props we know we need
interface Props {
  user: any // We'll type this properly later
}

export function DashboardClient({ user }: Props) {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [invalidBlocks, setInvalidBlocks] = useState<Array<{
    block: Partial<Block>
    reason: string
  }>>([])
  
  function handleCreateBlock(block: Omit<Block, 'id'>) {
    setBlocks(prev => [...prev, { ...block, id: crypto.randomUUID() }])
  }

  function handleClearBlocks() {
    setBlocks([])
    setInvalidBlocks([])
  }

  function handleDeleteBlock(id: string) {
    setBlocks(prev => prev.filter(block => block.id !== id))
  }

  function handleBrainDumpTransform(result: { data: Block[], invalidBlocks?: Array<{ block: Partial<Block>, reason: string }> }) {
    setBlocks(result.data)
    setInvalidBlocks(result.invalidBlocks || [])
  }

  // Copy existing UI exactly, just add blocks state
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-black via-black/75 to-black/70 text-white selection:bg-white/10 antialiased">
      <header className="h-14 border-b border-white/[0.08] backdrop-blur-xl bg-gradient-to-b from-black/80 to-black/70 sticky top-0 z-10">
        <div className="container mx-auto px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-x-6">
            <h1 className="text-lg font-medium tracking-[-0.02em] select-none text-white/95 hover:text-white transition-colors font-inter">Deep Work</h1>
            <p className="text-sm text-white/60 font-mono tabular-nums tracking-tight select-none font-jetbrains">11:45 AM</p>
          </div>
          <div className="flex items-center gap-6">
            <p className="text-sm text-white/60 font-mono tracking-tight select-all hover:text-white/80 transition-colors font-jetbrains">{user?.email}</p>
            <SignOut />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-8 py-12">
        <div className="relative max-w-2xl mx-auto space-y-6">
          <div className="absolute -top-[8rem] -left-[8rem] w-[24rem] h-[24rem] bg-blue-500/[0.08] rounded-full blur-3xl pointer-events-none opacity-75" />
          <div className="absolute top-[4rem] -right-[8rem] w-[20rem] h-[20rem] bg-purple-500/[0.05] rounded-full blur-3xl pointer-events-none opacity-60" />
          
          <div className="relative backdrop-blur-xl bg-gradient-to-b from-white/[0.11] to-black/[0.02] rounded-lg border border-white/[0.09] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] p-8">
            <div className="space-y-1.5 mb-8">
              <BrainDumpInput onTransform={handleBrainDumpTransform} />
            </div>
          </div>

          <div className="relative backdrop-blur-xl bg-gradient-to-b from-white/[0.08] to-black/[0.02] rounded-lg border border-white/[0.09] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] p-8">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold tracking-[-0.02em] text-white/90">Today's Focus</h2>
                <p className="text-[13px] text-white/60">Your deep work schedule</p>
              </div>
              <BlockList 
                blocks={blocks}
                invalidBlocks={invalidBlocks}
                onCreateBlock={handleCreateBlock} 
                onClearBlocks={handleClearBlocks}
                onDeleteBlock={handleDeleteBlock}
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-4 right-4">
        <a 
          href="https://midday.so" 
          className="text-[10px] text-white/30 tracking-[-0.01em] hover:text-white/50 transition-all hover:tracking-normal font-inter"
          target="_blank"
          rel="noopener noreferrer"
        >
          Made by Midday
        </a>
      </footer>
    </div>
  )
} 