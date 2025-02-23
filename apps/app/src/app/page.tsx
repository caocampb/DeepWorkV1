'use client'

import { useState } from 'react'
import { type Block } from '@/lib/types'
import { BrainDumpInput } from '@/components/brain-dump'
import { BlockList } from '@/components/block-list'

export default function Page() {
  const [blocks, setBlocks] = useState<Block[]>([])
  
  return (
    <main className="container max-w-3xl mx-auto py-8 px-4">
      <BrainDumpInput onTransform={blocks => setBlocks(blocks)} />
      <BlockList blocks={blocks} />
    </main>
  )
} 