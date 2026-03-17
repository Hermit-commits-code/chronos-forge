"use client";

import ActionGrid from '@/components/ActionGrid';
import AuthScreen from '@/components/AuthScreen';
import ForgeAnalytics from '@/components/ForgeAnalytics';
import ForgeHeader from '@/components/ForgeHeader';
import HistoryList from '@/components/HistoryList';
import ManualEntryForm from '@/components/ManualEntryForm';
import WeeklyChart from '@/components/WeeklyChart';
import { useCallback, useEffect, useState } from "react";

interface TimeEntry {
  id: number;
  project: string;
  category: string;
  start: string;
  end: string | null;
}

export default function ChronosForge() {
  const [history, setHistory] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [dailyTotal, setDailyTotal] = useState("0h 0m");
  const [showManual, setShowManual] = useState(false);

  // Auth States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // --- MEMOIZED DATA FETCHERS ---
  
  const fetchHistory = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch("http://localhost:8080/api/time/history", {
        headers: { Authorization: token },
      });
      if (response.status === 401) handleLogout();
      const data = await response.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("History fetch failed:", error);
    }
  }, [token]);

  const fetchSummary = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:8080/api/time/summary", {
        headers: { Authorization: token },
      });
      const data = await res.json();
      if (data.total_seconds !== undefined) {
        const mins = Math.floor(data.total_seconds / 60);
        const hrs = Math.floor(mins / 60);
        setDailyTotal(`${hrs}h ${mins % 60}m`);
      }
    } catch (error) {
      console.error("Summary fetch failed:", error);
    }
  }, [token]);

  // --- EFFECTS (LIFECYCLE) ---
  // 1. Session Persistence (On Mount)
  useEffect(() => {
    const savedToken = localStorage.getItem("forge_token");
    if (savedToken) setToken(savedToken);
  }, []);

  // 2. Initial Data Load (When Token changes)
  useEffect(() => {
    if (token) {
      fetchHistory();
      fetchSummary();
    }
  }, [token, fetchHistory, fetchSummary]);

  // 3. Heartbeat: Update summary every 60s while active
  useEffect(() => {
    if (token) {
      const heartbeat = setInterval(() => {
        fetchSummary();
      }, 60000);
      return () => clearInterval(heartbeat);
    }
  }, [token, fetchSummary]);

  // --- HANDLERS ---

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem("forge_token", data.token);
        setToken(data.token);
      } else {
        alert(data.error || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("forge_token");
    setToken(null);
    setHistory([]);
    setDailyTotal("0h 0m");
  };

  const toggleProject = async (project: string, category: string) => {
    const activeEntry = history.find((e) => e.end === null);
    const isClockingOut = activeEntry?.project === project;

    await fetch("http://localhost:8080/api/time/toggle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token || "",
      },
      body: JSON.stringify({
        project: isClockingOut ? "STOP" : project,
        category: isClockingOut ? "None" : category,
      }),
    });
    fetchHistory();
    fetchSummary();
  };

  const deleteEntry = async (id: number) => {
  if (!confirm("Are you sure you want to scrap this shift?")) return;

    const res = await fetch(`http://localhost:8080/api/time/${id}`, {
      method: "DELETE",
      headers: { Authorization: token! },
    });

    if (res.ok) {
      fetchHistory();
      fetchSummary();
    } else {
      alert("Failed to scrap entry.");
    }
  };

  // --- ANALYTICS LOGIC ---
  const goalHours = 8;
  const parts = dailyTotal.match(/(\d+)h (\d+)m/);
  const totalMinutes = parts ? parseInt(parts[1]) * 60 + parseInt(parts[2]) : 0;
  const progress = Math.min((totalMinutes / (goalHours * 60)) * 100, 100);

  // --- RENDER ---

  if (!token) {
   return <AuthScreen onLogin={(newToken)=> setToken(newToken)} />;
  }

  const activeEntry = history.find((e) => e.end === null);

  return (
    <main className="min-h-screen bg-black text-zinc-100 p-8">
      <div className="max-w-md mx-auto bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl">
        
        {/* Header */}
        <ForgeHeader activeProject={activeEntry?.project} onLogout={handleLogout}/>
        {/* Analytics Section */}
        <ForgeAnalytics dailyTotal={dailyTotal} progress={progress} goalHours={goalHours}/>
        {/* Action Grid */}
        <ActionGrid activeProject={activeEntry?.project} onToggle={toggleProject}/>
        {/* Heatmap Section */}
        <WeeklyChart token={token}/>
        {/* History Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Recent Shifts</h2>
          <button 
            onClick={() => setShowManual(!showManual)}
            className="text-[9px] text-orange-500/50 hover:text-orange-500 uppercase font-bold"
          >
            {showManual ? "[Close]" : "[+ Manual Entry]"}
          </button>
        </div>

        {/* Manual Entry Form */}
        {showManual && (
         <ManualEntryForm
          token={token!}
          onSuccess={()=>{
            setShowManual(false);
            fetchHistory();
            fetchSummary();
          }}
         />
        )}

        {/* History List */}
        <HistoryList history={history} onDelete={deleteEntry}/>
      </div>
    </main>
  );
}