"use client";

interface TimeEntry {
  id: number;
  project: string;
  category: string;
  start: string;
  end: string | null;
}

interface HistoryListProps {
  history: TimeEntry[];
  onDelete: (id: number) => void;
}

export default function HistoryList({ history, onDelete }: HistoryListProps) {
  if (history.length === 0) {
    return <p className="text-zinc-700 text-center py-8 italic text-sm">No forge activity recorded today.</p>;
  }

  const getBrand = (name: string) => {
    switch (name.toLowerCase()) {
      case "chronos forge":
        return "border-orange-500/30 bg-orange-500/5 text-orange-500";
      case "admin":
        return "border-purple-500/30 bg-purple-500/5 text-purple-400";
      default:
        return "border-zinc-800 bg-zinc-950/50 text-zinc-400";
    }
  };

  return (
    <div className="space-y-3">
      {history.map((entry) => {
        const brandClasses = getBrand(entry.project);

        return (
          <div key={entry.id} className={`flex justify-between items-center p-3 rounded-lg border transition-all ${brandClasses}`}>
            <div>
              <p className="font-bold text-sm tracking-tight uppercase">{entry.project}</p>
              <p className="text-[10px] opacity-70 font-mono italic">{entry.category}</p>
            </div>
            <div className="text-right flex flex-col items-end gap-2">
              <div>
                <p className="text-[10px] font-mono opacity-80">
                  {new Date(entry.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
                <p className={`text-[9px] uppercase font-black ${entry.end ? "opacity-30" : "text-green-500 animate-pulse"}`}>
                  {entry.end ? "Archived" : "Live"}
                </p>
              </div>
              <button 
                onClick={() => onDelete(entry.id)}
                className="text-[9px] text-red-900/50 hover:text-red-500 font-bold uppercase transition-colors"
              >
                [Scrap]
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}