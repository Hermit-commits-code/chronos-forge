"use client";

interface ManualEntryProps {
  token: string;
  onSuccess: () => void;
}

export default function ManualEntryForm({ token, onSuccess }: ManualEntryProps) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      project: formData.get("project"),
      category: formData.get("category"),
      start: new Date(formData.get("start") as string).toISOString(),
      end: new Date(formData.get("end") as string).toISOString(),
    };

    const res = await fetch("http://localhost:8080/api/time/manual", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": token 
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      onSuccess();
      (e.target as HTMLFormElement).reset();
    } else {
      const err = await res.json();
      alert(err.error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 p-4 border border-orange-500/20 rounded-lg bg-zinc-950 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <input name="project" placeholder="Project Name" required className="bg-black border border-zinc-800 p-2 rounded text-xs text-orange-500 outline-none focus:border-orange-500" />
        <input name="category" placeholder="Category" required className="bg-black border border-zinc-800 p-2 rounded text-xs text-orange-500 outline-none focus:border-orange-500" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col">
          <label className="text-[8px] uppercase text-zinc-500 mb-1 ml-1">Start</label>
          <input name="start" type="datetime-local" required className="bg-black border border-zinc-800 p-2 rounded text-xs text-orange-500 outline-none invert-[0.8] grayscale" />
        </div>
        <div className="flex flex-col">
          <label className="text-[8px] uppercase text-zinc-500 mb-1 ml-1">End</label>
          <input name="end" type="datetime-local" required className="bg-black border border-zinc-800 p-2 rounded text-xs text-orange-500 outline-none invert-[0.8] grayscale" />
        </div>
      </div>
      <button type="submit" className="w-full bg-zinc-100 text-black font-bold py-2 rounded text-xs hover:bg-white transition-colors uppercase tracking-widest">
        Forge Entry
      </button>
    </form>
  );
}