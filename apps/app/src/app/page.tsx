import { BrainDumpInput } from '../components/brain-dump'

export default function Home() {
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8">Deep Work Planner</h1>
      <BrainDumpInput />
    </main>
  )
} 