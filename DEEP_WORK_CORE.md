# Deep Work Core Systems

## 1. AI Brain - The Magic Transform

### Core Promise
> "Brain dump your tasks, get a perfectly structured deep work schedule that respects your energy and cognitive limits"

### Input Understanding
```typescript
type BrainDump = {
  rawText: string,      // Free-form task list
  timeContext?: {       // Optional time bounds
    startTime?: string,
    endTime?: string,
    fixedBreaks?: Array<{time: string, duration: number}>
  }
}
```

### AI Processing Steps

1. **Task Analysis**
   - Extract discrete tasks
   - Identify complexity levels
   - Estimate cognitive load
   - Parse time hints

2. **Deep Work Optimization**
   - Group by cognitive similarity
   - Front-load complex tasks
   - Respect 4-hour deep work limit
   - Strategic break placement

3. **Schedule Generation**
   - Default to 90-minute focus blocks
   - Buffer for context switching
   - Energy curve optimization
   - Break rhythm (short + long)

### Intelligence Rules

1. **Work Types**
   ```typescript
   // Unified work categorization
   type WorkType = 'deep' | 'shallow' | 'break'
   
   type TaskContext = {
     type: WorkType
     preferredTime: 'morning' | 'afternoon' | 'anytime'
     maxDuration: number // minutes
   }
   ```

2. **Break Philosophy**
   - 15min breaks after deep work blocks
   - 5min breaks after shallow work
   - Lunch/dinner protection
   - Movement prompts

3. **Energy Management**
   - Optimal deep work: ~4hrs/day
   - Best deep work: before 2pm
   - Break clusters for recovery
   - Balance deep and shallow work

## 2. Time Block Canvas - The Heart

### Block DNA
```typescript
// Unified block type matching our type system
type Block = {
  id: string
  startTime: string    // ISO string
  duration: number     // minutes
  task: string
  type: 'deep' | 'shallow' | 'break'
  status: 'upcoming' | 'active' | 'completed'
}

// Core rules
- Blocks cannot overlap (one task at a time)
- AI suggests optimal durations:
  • Deep work: 90 minutes (can extend up to 4 hours)
  • Shallow work: 30 minutes
  • Breaks: 15 minutes after deep work, 5 minutes after shallow
- Users have full flexibility to adjust durations
- Types follow Newport's principles

// Creation flows
1. Primary: Brain dump → AI transform
2. Secondary: Quick manual block creation

// Time handling
- Drag operations snap to 15min (natural UX)
- Manual input allows 5min precision (flexibility)
- Automatic status transitions based on current time
```

### Visual Intelligence

1. **Block Expression**
   - Deep work: Strong gradient
   - Shallow work: Medium gradient
   - Break: Subtle gradient
   - Status affects opacity

2. **Energy Indicators**
   ```typescript
   // Simple time-based styling
   const gradientByTime = {
     morning: {
       deep: 'from-primary/30 to-primary-light/30',    // Stronger
       shallow: 'from-surface-hover/20 to-surface-hover/30'
     },
     afternoon: {
       deep: 'from-primary/20 to-primary-light/20',    // Softer
       shallow: 'from-surface-hover/10 to-surface-hover/20'
     }
   }

   // Simple counters
   interface DayStats {
     deepWorkHours: number      // "3hrs deep work today"
     isPrimeHours: boolean      // Before/after 2pm
   }
   ```

3. **Time Patterns**
   ```
   Morning (Peak)
   ┌────────────────┐
   │ Deep Work      │ <- Strongest gradient
   │ Complex First  │
   └────────────────┘

   Afternoon (Steady)
   ┌────────────────┐
   │ Mixed Work     │ <- Balanced gradient
   │ Regular Breaks │
   └────────────────┘
   ```

3. **State Poetry**
   - Upcoming: Calm, potential
   - Active: Subtle pulse
   - Break: Peaceful gradient
   - Complete: Quiet celebration

### Interaction Philosophy

1. **During Planning**
   - Two creation flows (AI transform or manual)
   - Drag snaps to 15min for natural UX
   - Manual input allows 5min precision
   - Smart overlap prevention

2. **During Focus**
   - Minimal UI
   - Current time indicator
   - Automatic state transitions
   - Essential block info

3. **Block States**
   ```
   Upcoming → Active → Completed
   [Future]   [Now]    [Past]
   
   - States transition automatically based on time
   - No manual state management needed
   - Visual distinction between states
   ```

## Implementation Priority

1. **AI Foundation**
   - Perfect task parsing
   - Smart block creation
   - Energy optimization
   - Break balancing

2. **Block Excellence**
   - Beautiful time layout
   - Perfect interactions
   - State transitions
   - Focus modes

3. **Intelligence Layer**
   - Learning from adjustments
   - Pattern recognition
   - Schedule optimization
   - Energy tracking

## Success Metrics

1. **AI Quality**
   - Task understanding accuracy
   - Schedule balance rating
   - Break timing appropriateness
   - User adjustment frequency

2. **Block Experience**
   - Time to first block
   - Interaction smoothness
   - Focus time achieved
   - Break adherence

The magic is making these two systems feel like one coherent experience:
- AI that truly understands work patterns
- Blocks that feel natural to adjust
- Intelligence that learns and adapts
- Experience that delights while focusing 

## MVP Approach - Minimal First

### 1. Core Stack
```typescript
// Just the essentials
import { z } from 'zod'
import { OpenAIStream } from 'ai'
import { type TimeBlock } from '~/types'

// Simple validation
const brainDumpSchema = z.object({
  text: z.string().min(1)
})
```

### 2. Single Server Action

```typescript
// ~/app/actions.ts
export async function transformToBlocks(input: string) {
  // 1. Validate
  const parsed = brainDumpSchema.parse({ text: input })
  
  // 2. Transform with AI
  const blocks = await generateBlocks(parsed.text)
  
  // 3. Return schedule
  return blocks
}
```

### 3. Minimal Client

```typescript
// ~/app/page.tsx
export default function Home() {
  const [blocks, setBlocks] = useState<TimeBlock[]>([])
  
  async function onTransform(text: string) {
    const newBlocks = await transformToBlocks(text)
    setBlocks(newBlocks)
  }

  const handleClear = () => setBlocks([])  // Simple reset

  return (
    <main className="min-h-screen p-8 bg-bg-primary text-text-primary">
      <BrainDump onTransform={onTransform} onClear={handleClear} />
      {blocks.length === 0 ? (
        <EmptyState />
      ) : (
        <BlockList blocks={blocks} currentTime={new Date()} />
      )}
    </main>
  )
}

// ~/components/empty-state.tsx
function EmptyState() {
  return (
    <div className="text-center py-12 text-secondary">
      <p className="text-lg mb-2">Ready for deep work?</p>
      <p className="text-sm">Brain dump your tasks above and transform them into focused blocks</p>
    </div>
  )
}

// ~/components/time-indicator.tsx
function TimeIndicator({ time }: { time: Date }) {
  return (
    <div className="relative w-full border-t border-primary/20">
      <span className="absolute -top-3 right-0 text-xs text-secondary font-mono">
        {formatTime(time)}
      </span>
    </div>
  )
}
```

### 4. Three Core Components

```typescript
// ~/components/brain-dump.tsx
// Simple textarea + transform button

// ~/components/time-block.tsx
// Single block display

// ~/components/block-list.tsx
// Vertical stack of blocks
```

### 5. MVP Features

1. **Input → Output**
   - Clean textarea
   - Transform button
   - Basic AI response

2. **Block Display**
   - Simple vertical list
   - Time + task display
   - Basic styling only

3. **Essential Types**
```typescript
type CoreBlock = {
  id: string
  time: string
  task: string
}

type BrainDumpInput = {
  text: string
}
```

### 6. Next Steps
1. Block styling
2. Better AI prompts
3. Basic interactions
4. Time adjustments

The goal: Get the core loop working with minimal complexity:
1. Type in tasks
2. Get AI schedule
3. See blocks
4. Done

Everything else comes later. 

## MVP Backend

### 1. AI Integration
```typescript
// ~/app/api/transform/route.ts
import { OpenAIStream, StreamingTextResponse } from 'ai'
import { Configuration, OpenAIApi } from 'openai-edge'

// Simple edge function using Vercel AI SDK
export async function POST(req: Request) {
  const { text } = await req.json()
  
  const response = await openai.createChatCompletion({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are a deep work planning assistant.' },
      { role: 'user', content: generatePrompt(text) }
    ],
    temperature: 0.7,
    stream: true
  })

  // Stream the response
  const stream = OpenAIStream(response, {
    onCompletion: async (completion: string) => {
      // Parse and validate blocks
      const blocks = JSON.parse(completion)
      return blockSchema.parse(blocks)
    }
  })

  return new StreamingTextResponse(stream)
}

// Client-side usage
const { completion, complete, error } = useCompletion({
  api: '/api/transform'
})
```

### 2. Simple Types
```typescript
// Consistent with our type system
type Block = {
  id: string
  startTime: string    // ISO string
  duration: number     // minutes
  task: string
  type: 'deep' | 'shallow' | 'break'
  status: 'upcoming' | 'active' | 'completed'
}
```

### 3. Core Function
```typescript
// Single endpoint that does one thing well
async function transformTasks(input: string): Promise<Block[]> {
  // 1. Parse tasks from input
  const tasks = parseTasksFromText(input)
  
  // 2. Generate schedule with OpenAI
  const blocks = await generateBlocks(tasks)
  
  // 3. Return typed blocks
  return blocks
}
```

### 4. AI Prompt (MVP)
```typescript
const prompt = `Given these tasks, create a deep work schedule that:
- Categorizes tasks as deep, shallow, or break
- Puts deep work early in the day
- Adds breaks between deep work blocks
- Groups shallow work efficiently
- Suggests 90min blocks for deep work (optimal for most)
- Returns JSON array of Block objects

Tasks:
${input}

Example response:
[{
  "id": "1",
  "startTime": "2024-02-22T09:00:00Z",
  "duration": 90,
  "task": "Complex task A",
  "type": "deep",
  "status": "upcoming"
},
{
  "id": "2",
  "startTime": "2024-02-22T10:30:00Z",
  "duration": 15,
  "task": "Break",
  "type": "break",
  "status": "upcoming"
},
{
  "id": "3",
  "startTime": "2024-02-22T10:45:00Z",
  "duration": 30,
  "task": "Email and quick tasks",
  "type": "shallow",
  "status": "upcoming"
}]`
```

### 5. Error Handling
```typescript
type Result<T> = {
  data?: T
  error?: {
    code: 'INVALID_INPUT' | 'AI_ERROR' | 'PARSE_ERROR'
    message: string
  }
}

// Return errors as values
async function transformTasks(input: string): Promise<Result<Block[]>>
```

That's it! No database, no complex state, no auth.
Just text in → blocks out with proper typing. 

## Type System (Theo Style)

### 1. Basic Types
```typescript
// ~/types/index.ts

// Core block type - used everywhere
export interface Block {
  id: string
  startTime: string    // ISO string
  duration: number     // minutes
  task: string
  type: 'deep' | 'shallow' | 'break'  // True to Newport's principles
  status: 'upcoming' | 'active' | 'completed'
}

// Type helpers
export type BlockType = Block['type']
export type BlockStatus = Block['status']

// Rich task info (for future)
export interface TaskInfo {
  text: string
  estimatedMinutes?: number
  type: BlockType      // Explicitly categorize the task type
}

// Results wrapper
export type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: string }
```

### 2. Zod Schemas
```typescript
// ~/lib/validations/block.ts
import { z } from 'zod'

// Input validation
export const inputSchema = z.object({
  text: z.string().min(1).max(1000),
  timePreferences: z.object({
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional()
  }).optional()
})

// Block validation
export const blockSchema = z.object({
  id: z.string(),
  startTime: z.string().datetime(),
  duration: z.number().min(5),     // Minimum 5 minutes, no max
  task: z.string().min(1),
  type: z.enum(['deep', 'shallow', 'break']),
  status: z.enum(['upcoming', 'active', 'completed'])
})

// Type inference
export type BlockInput = z.infer<typeof inputSchema>
export type ValidBlock = z.infer<typeof blockSchema>
```

### 3. Type Utils
```typescript
// ~/lib/utils.ts

// Type guards
export function isDeepWork(block: Block): boolean {
  return block.type === 'deep'
}

export function isShallowWork(block: Block): boolean {
  return block.type === 'shallow'
}

export function isBreak(block: Block): boolean {
  return block.type === 'break'
}

export function isActiveBlock(block: Block): boolean {
  return block.status === 'active'
}

// Formatters
export function formatTime(time: string): string {
  return new Date(time).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  })
}

export function formatDuration(minutes: number): string {
  return `${minutes}min`
}

// Block helpers
export function calculateEndTime(block: Block): Date {
  const start = new Date(block.startTime)
  return new Date(start.getTime() + block.duration * 60000)
}

// Block type styling
export function getBlockStyle(type: BlockType): string {
  return {
    deep: 'bg-gradient-to-r from-primary/20 to-primary-light/20',    // Stronger gradient
    shallow: 'bg-gradient-to-r from-surface-hover/10 to-surface-hover/20', // Subtle gradient
    break: 'bg-gradient-to-r from-surface/5 to-surface/10'           // Most subtle
  }[type]
}
```

That's it! Unified types + validation + utils.
Everything else builds on these foundations. 

// ~/components/time-block.tsx
interface TimeBlockProps {
  block: Block
  onEdit: (block: Block) => void
  onDelete: (id: string) => void
}

function TimeBlock({ block, onEdit, onDelete }: TimeBlockProps) {
  const [isEditing, setIsEditing] = useState(false)
  
  if (isEditing) {
    return (
      <form className="block-card" onSubmit={handleSave}>
        <div className="flex items-center gap-2">
          <input 
            type="time" 
            defaultValue={formatTime(block.startTime)}
            className="font-mono"
          />
          <span>-</span>
          <input 
            type="number" 
            defaultValue={block.duration}
            min={5}
            step={5}
            className="w-16"
          />
        </div>
        <input 
          defaultValue={block.task}
          className="block w-full mt-2"
        />
        <select defaultValue={block.type} className="mt-2">
          <option value="deep">Deep</option>
          <option value="shallow">Shallow</option>
          <option value="break">Break</option>
        </select>
        <div className="flex gap-2 mt-3">
          <button type="submit">Save</button>
          <button type="button" onClick={() => setIsEditing(false)}>
            Cancel
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="block-card group">
      <div className="font-mono">
        {formatTime(block.startTime)} - {formatEndTime(block)}
      </div>
      <div>{block.task}</div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setIsEditing(true)}>Edit</button>
        <button onClick={() => onDelete(block.id)}>Delete</button>
      </div>
    </div>
  )
} 