"use client";

interface ForgeHeaderProps {
  activeProject?: string;
  onLogout: () => void;
}

export default function ForgeHeader({ activeProject, onLogout }: ForgeHeaderProps) {
  return (
    <div className="flex justify-between items-start mb-6">
      <div>
        <h1 className="text-2xl font-black text-orange-500 tracking-tighter uppercase">Chronos Forge</h1>
        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
          Status: {activeProject ? `Active: ${activeProject}` : "Idle"}
        </p>
      </div>
      <button 
        onClick={onLogout} 
        className="text-[10px] text-zinc-600 hover:text-zinc-400 uppercase font-bold underline"
      >
        Logout
      </button>
    </div>
  );
}