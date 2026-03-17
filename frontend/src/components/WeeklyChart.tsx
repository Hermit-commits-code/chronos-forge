"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis
} from "recharts";

// 1. Updated Interface to include the fields we create during formatting
interface DailyData {
  date: string;
  total_hours: number;
  displayDate?: string; // Optional because we add it during map
  hours?: number;       // Optional because we add it during map
}

export default function WeeklyChart({ token }: { token: string }) {
  const [data, setData] = useState<DailyData[]>([]);

  useEffect(() => {
    const fetchWeekly = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/weekly", {
          headers: { Authorization: token },
        });
        const json = await res.json();
        
        const formatted = json.map((d: DailyData) => {
          // Split the YYYY-MM-DD and create a date using local parts
          const [year, month, day] = d.date.split('-').map(Number);
          const localDate = new Date(year, month - 1, day); 

          return {
            ...d,
            displayDate: localDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            hours: parseFloat(d.total_hours.toFixed(1))
          };
        });
        setData(formatted);
      } catch (err) {
        console.error("Failed to fetch heat map:", err);
      }
    };
    if (token) fetchWeekly();
  }, [token]);

  return (
    <div className="h-56 w-full mt-6 bg-black/40 rounded-xl p-4 border border-zinc-800/50 shadow-inner">
      <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">Forge Intensity</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            {/* The "Glow" Gradient */}
            <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="displayDate" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "#52525b", fontSize: 9, fontWeight: "bold" }}
            minTickGap={10}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "#09090b", 
              border: "1px solid #27272a", 
              borderRadius: "8px",
              fontSize: "10px",
              color: "#fff"
            }}
            itemStyle={{ color: "#f97316", fontWeight: "bold" }}
            cursor={{ stroke: "#f97316", strokeWidth: 1, strokeDasharray: "4 4" }}
          />
          <Area 
            type="monotone" 
            dataKey="hours" 
            stroke="#f97316" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorHours)" 
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}