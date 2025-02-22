import { SignOut } from "@/components/sign-out";
import { getI18n } from "@/locales/server";
import { getUser } from "@v1/supabase/queries";
import { BrainDumpInput } from "@/components/brain-dump";
import { BlockList } from "@/components/block-list";
import { Block } from "@/lib/types";

// Create blocks in local time matching our grid
function createLocalISOString(hour: number, minute: number): string {
  const date = new Date()
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

// Example blocks using our grid system (3 AM - 9 AM)
const exampleBlocks: Block[] = [
  {
    id: '1',
    startTime: createLocalISOString(3, 0),  // 3:00 AM
    duration: 90,                           // 90 minutes
    task: 'Build auth system',
    type: 'deep'
  },
  {
    id: '2',
    startTime: createLocalISOString(4, 30), // 4:30 AM
    duration: 30,                           // 30 minutes
    task: 'Quick break',
    type: 'break'
  },
  {
    id: '3',
    startTime: createLocalISOString(5, 0),  // 5:00 AM
    duration: 30,                           // 30 minutes
    task: 'Review PRs',
    type: 'shallow'
  }
];

export const metadata = {
  title: "Deep Work",
  description: "Plan your focused time"
};

export default async function Page() {
  const { data } = await getUser();
  const t = await getI18n();

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-black via-black/75 to-black/70 text-white selection:bg-white/10 antialiased">
      {/* Header - Linear-inspired minimal header */}
      <header className="h-14 border-b border-white/[0.08] backdrop-blur-xl bg-gradient-to-b from-black/80 to-black/70 sticky top-0 z-10">
        <div className="container mx-auto px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-x-6">
            <h1 className="text-lg font-medium tracking-[-0.02em] select-none text-white/95 hover:text-white transition-colors font-inter">Deep Work</h1>
            <p className="text-sm text-white/60 font-mono tabular-nums tracking-tight select-none font-jetbrains">11:45 AM</p>
          </div>
          <div className="flex items-center gap-6">
            <p className="text-sm text-white/60 font-mono tracking-tight select-all hover:text-white/80 transition-colors font-jetbrains">{data?.user?.email}</p>
            <SignOut />
          </div>
        </div>
      </header>

      {/* Main Content - Clean canvas for focused work */}
      <main className="container mx-auto px-8 py-12">
        <div className="relative max-w-2xl mx-auto space-y-6">
          {/* Ambient light effects */}
          <div className="absolute -top-[8rem] -left-[8rem] w-[24rem] h-[24rem] bg-blue-500/[0.08] rounded-full blur-3xl pointer-events-none opacity-75" />
          <div className="absolute top-[4rem] -right-[8rem] w-[20rem] h-[20rem] bg-purple-500/[0.05] rounded-full blur-3xl pointer-events-none opacity-60" />
          
          {/* Brain Dump Panel */}
          <div className="relative backdrop-blur-xl bg-gradient-to-b from-white/[0.11] to-black/[0.02] rounded-lg border border-white/[0.09] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] p-8">
            <div className="space-y-1.5 mb-8">
              <h2 className="text-base font-semibold tracking-[-0.02em] text-white/90 select-none hover:text-white transition-colors font-inter">Brain Dump</h2>
              <p className="text-[13px] leading-relaxed text-white/60 select-none font-inter font-normal">What do you want to accomplish today?</p>
            </div>
            <BrainDumpInput />
          </div>

          {/* Time Blocks Panel */}
          <div className="relative backdrop-blur-xl bg-gradient-to-b from-white/[0.08] to-black/[0.02] rounded-lg border border-white/[0.09] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] p-8">
            <div className="space-y-1.5 mb-8">
              <h2 className="text-base font-semibold tracking-[-0.02em] text-white/90 select-none hover:text-white transition-colors font-inter">Today's Focus</h2>
              <p className="text-[13px] leading-relaxed text-white/60 select-none font-inter font-normal">Your deep work schedule</p>
            </div>
            <BlockList blocks={exampleBlocks} />
          </div>
        </div>
      </main>

      {/* Made by - Linear style attribution */}
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
  );
}
