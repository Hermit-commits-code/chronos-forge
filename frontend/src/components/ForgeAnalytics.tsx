"use client";

interface ForgeAnalyticsProps {
  dailyTotal: string;
  progress: number;
  goalHours: number;
}

export default function ForgeAnalytics({ dailyTotal, progress, goalHours }: ForgeAnalyticsProps) {
  return (
    <div className="mb-8 p-4 bg-black/40 rounded-lg border border-zinc-800/50 shadow-[0_0_20px_rgba(234,88,12,0.05)]">
      <div className="flex justify-between items-end mb-2">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Forge Output</p>
        <p className="text-lg font-black text-orange-500 font-mono drop-shadow-[0_0_8px_rgba(234,88,12,0.4)]">
          {dailyTotal}
        </p>
      </div>
      <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
        <div 
          className="h-full bg-gradient-to-r from-orange-700 via-orange-500 to-orange-400 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(234,88,12,0.5)]"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
         <p className="text-[8px] text-zinc-700 uppercase font-bold">Cold</p>
         <p className="text-[8px] text-orange-900 uppercase font-bold italic">Goal: {goalHours}h</p>
      </div>
    </div>
  );
}