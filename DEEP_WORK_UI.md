# Deep Work Planner UI

## Core Experience

**Philosophy**: Linear-inspired minimalism meets Newport's deep work principles.
> Beautiful, focused blocks for intentional time planning.

## 1. Main Components

### Brain Dump
```typescript
// Two paths: AI or Manual
┌─ Brain Dump ────────────────────────────────────┐
│                                                │
│ What do you want to accomplish today?          │
│ [Beautiful minimal textarea]                   │
│                                                │
│ [Transform →] [Clear] [+ Add Block] <- Actions │
└────────────────────────────────────────────────┘

// Quick Add Block
┌─ Add Block ──────────────────────────────────┐
│ Task: [Input]                               │
│ Time: [10:00] Duration: [90] Type: [Deep]   │
│ [Add →]                                     │
└──────────────────────────────────────────────┘

// Edit Block (Inline)
┌─ Deep Work ────────────────────────────────┐
│ ⋮⋮ [10:00] - [11:30]                     │ <- Time edit
│    [Build auth system]                    │ <- Task edit
│    [Deep ▾]                               │ <- Type select
│ [Save] [Cancel]                           │
└────────────────────────────────────────────┘

// Quick Actions
┌─ Actions ─────────┐
│ Edit    ⌘E       │
│ Delete  ⌘⌫       │
│ Move    ⌘↑/↓     │
└─────────────────┘
```

### Block Timeline
```typescript
// Beautiful blocks with personality
┌─ Deep Work ─────────────────────────────────────┐
│ ✦ Build auth system                            │ <- Type icon
│ 10:00 - 11:30                                  │ <- Mono time
│ ▂▃▅▇ Progress                                  │ <- Tiny bar
└─────────────────────────────────────────────────┘

┌─ Break ───────────────────────────────────────┐
│ ○ Lunch                                      │ <- Break icon
│ 12:00 - 12:30                                │
│ Take a real break                            │
└───────────────────────────────────────────────┘

// Micro-animations (all CSS)
{
  transform: {
    enter: 'transform-gpu scale-95 → scale-100',
    opacity: '0 → 1',
    duration: '150ms ease-out'
  },
  complete: {
    checkmark: 'opacity-0 → opacity-100',
    text: 'text-primary → text-primary/80',
    duration: '300ms ease'
  },
  success: {
    flash: 'bg-primary/0 → bg-primary/10 → bg-primary/0',
    duration: '500ms ease'
  }
}

// Empty state with personality
┌─ Empty Timeline ─────────────────────────────────┐
│                                                 │
│   ○ → ◇ → ◎                                    │ <- Journey
│   Ready for deep work?                          │
│   Brain dump your tasks above and transform     │
│   them into focused blocks                      │
│                                                 │
└─────────────────────────────────────────────────┘
```

## 2. Block System

### Block Types
```typescript
type Block = {
  id: string
  startTime: string
  duration: number
  task: string
  type: 'deep' | 'shallow' | 'break'
  status: 'upcoming' | 'active' | 'completed'
}
```

### Visual Hierarchy
- Deep Work: Strong gradient
- Shallow Work: Medium gradient
- Break: Subtle gradient
- Status affects opacity

### Energy & Time Indicators
```typescript
// Time-based styling
{
  morning: {
    deep: 'from-primary/30 to-primary-light/30',    // Stronger
    shallow: 'from-surface-hover/20 to-surface-hover/30'
  },
  afternoon: {
    deep: 'from-primary/20 to-primary-light/20',    // Softer
    shallow: 'from-surface-hover/10 to-surface-hover/20'
  }
}

// Simple status display
┌─ Stats ──────────────────┐
│ 3hrs deep work today    │ <- Counter
│ Prime hours: until 2pm  │ <- Time hint
└─────────────────────────┘
```

These visual cues are subtle but helpful:
- Deep work hour tracking
- Time-appropriate styling
- Simple status hints

### Block Interactions
1. **Drag and Drop**
   - Vertical reordering
   - Edge dragging for resize
   - Suggested 15min time intervals
   - Flexible gap handling

2. **Empty Space**
   - Click anywhere to add
   - Hover reveals actions
   - Shows time range
   - Auto-adjusts gaps

3. **Quick Edit**
   - Click to edit inline
   - Command+K shortcuts
   - Smart suggestions
   - Time adjustments

## 3. AI Integration

### Transform Flow
```typescript
// Brain dump → Blocks
input → AI analysis → Smart schedule → Manual adjustments
```

### Smart Assistance
- Offers optimal time suggestions
- Proposes break rhythm
- Highlights prime deep work hours
- Suggests task groupings

### AI Principles
- Helpful but subtle
- Always suggests, never enforces
- Adapts to preferences
- Supports focus time

## 4. Time Management

### Simple Setup
```typescript
// One-time, minimal setup
┌─────────────────────────┐
│ When do you start work? │
│ [9:00] ← Default       │
└─────────────────────────┘
```

### Flexible Timing
- Place blocks freely
- Suggested time intervals
- No fixed constraints
- Smart defaults as guides

## 5. Interaction Details

### Micro-interactions
```typescript
{
  hover: {
    scale: 1.001,
    shadow: 'sm',
    duration: 150
  },
  active: {
    scale: 0.999,
    shadow: 'md'
  },
  drag: {
    scale: 1.02,
    shadow: 'lg'
  }
}
```

### Typography
```typescript
{
  fonts: {
    mono: 'JetBrains Mono',  // Times
    sans: 'Inter',           // Tasks
  },
  weights: {
    normal: 400,
    medium: 500
  }
}
```

### Colors
```typescript
{
  block: {
    deep: 'bg-gradient-to-r from-primary/20 to-primary-light/20',
    shallow: 'bg-gradient-to-r from-surface-hover/10 to-surface-hover/20',
    break: 'bg-gradient-to-r from-surface/5 to-surface/10'
  },
  text: {
    primary: '#E2E8F0',
    secondary: '#94A3B8'
  }
}
```

## 6. Implementation Priority

1. **Core Block System**
   - Beautiful blocks
   - Drag and drop
   - Basic editing
   - Time management

2. **AI Integration**
   - Transform flow
   - Smart suggestions
   - Schedule optimization
   - Learning system

3. **Polish**
   - Animations
   - Empty states
   - Error handling
   - Edge cases

## Premium Details (High Impact, Low Effort)

### Focus Polish
```typescript
{
  focus: {
    ring: '#2C3E6640',
    glow: '0 0 0 1px #2C3E6620',
    transition: 'all 150ms ease'
  }
}
```

### Success States
- Transform: Subtle fade-in of new blocks
- Complete: Gentle opacity shift
- Save: Minimal flash of success color

### Loading
```typescript
// During AI transform
┌─ Transform Button ─────────┐
│ [||||||||     ] Creating  │ <- Subtle pulse
└─────────────────────────────┘

// Block transitions
opacity: [1 → 0.8 → 1]
transform: translateY([-1px → 0])
duration: 150ms
```

These tiny details make it feel premium without adding complexity.

## Success Metrics

1. **Interaction Quality**
   - Block manipulation feels natural
   - Time adjustments are intuitive
   - AI suggestions are helpful
   - Empty spaces are useful

2. **Focus Support**
   - Deep work is protected
   - Breaks are maintained
   - Schedule feels balanced
   - Planning is effortless

The magic is making everything feel inevitable:
- Blocks feel physical
- Time feels fluid
- AI feels natural
- Focus feels easy 