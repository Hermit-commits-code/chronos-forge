"use client";

interface ActionGridProps {
  activeProject?: string;
  onToggle: (project: string, category: string) => void;
}

export default function ActionGrid({ activeProject, onToggle }: ActionGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-8">
      <button
        onClick={() => onToggle("Chronos Forge", "Development")}
        className={`py-3 px-4 rounded-lg font-black text-xs uppercase tracking-tighter transition-all active:scale-95 ${
          activeProject === "Chronos Forge" 
          ? "bg-orange-500/10 text-orange-500 border border-orange-500 shadow-[0_0_15px_rgba(234,88,12,0.2)]" 
          : "bg-orange-600 text-white hover:bg-orange-500 shadow-lg"
        }`}
      >
        {activeProject === "Chronos Forge" ? "Douse Forge" : "Ignite Forge"}
      </button>

      <button
        onClick={() => onToggle("Admin", "Management")}
        className={`py-3 px-4 rounded-lg font-black text-xs uppercase tracking-tighter transition-all active:scale-95 ${
          activeProject === "Admin" 
          ? "bg-purple-500/10 text-purple-400 border border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]" 
          : "bg-zinc-100 text-black hover:bg-white"
        }`}
      >
        {activeProject === "Admin" ? "Close Ledger" : "Open Ledger"}
      </button>
    </div>
  );
}