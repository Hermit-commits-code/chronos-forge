"use client";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function WeeklyChart({ data }: { data: any[] }) {
  if(!data || data.length === 0) return <div className="h-48 w-full animate-pulse bg-zinc-900"/>
  return (
    <div className="group relative h-48 w-full mt-8 bg-zinc-900/30 rounded-xl p-4 border border-zinc-800/50 backdrop-blur-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Velocity Breakdown</h3>
        <div className="flex gap-3 text-[9px] uppercase tracking-tighter">
          <span className="flex items-center gap-1.5 text-orange-500"><div className="w-1.5 h-1.5 rounded-full bg-orange-500"/> Forge</span>
          <span className="flex items-center gap-1.5 text-purple-500"><div className="w-1.5 h-1.5 rounded-full bg-purple-500"/> Admin</span>
          <span className="flex items-center gap-1.5 text-red-500"><div className="w-1.5 h-1.5 rounded-full bg-red-500"/> Repair</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="forgeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          <Tooltip 
            cursor={{ stroke: '#3f3f46', strokeWidth: 1 }}
            contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '11px' }}
          />

          {/* Layers: Admin on bottom, then Repair, then Forge on top */}
          <Area 
            type="monotone" dataKey="admin" stackId="forge" 
            stroke="#a855f7" strokeWidth={2} fill="url(#adminGrad)" 
          />
          <Area 
            type="monotone" dataKey="repair" stackId="forge" 
            stroke="#ef4444" strokeWidth={2} fill="#ef444410" 
          />
          <Area 
            type="monotone" dataKey="forge" stackId="forge" 
            stroke="#f97316" strokeWidth={2} fill="url(#forgeGrad)" 
          />

          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{fontSize: 10, fill: '#71717a'}} 
            dy={10}
          />
          <YAxis hide domain={[0, 'auto']} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}