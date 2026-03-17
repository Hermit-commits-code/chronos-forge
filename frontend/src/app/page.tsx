"use client";

import ActionGrid from '@/components/ActionGrid';
import AuthScreen from '@/components/AuthScreen';
import ForgeAnalytics from '@/components/ForgeAnalytics';
import ForgeHeader from '@/components/ForgeHeader';
import HistoryList from '@/components/HistoryList';
import ManualEntryForm from '@/components/ManualEntryForm';
import RecipeBar from '@/components/RecipeBar';
import WeeklyChart from '@/components/WeeklyChart';
import { useCallback, useEffect, useState } from "react";

interface TimeEntry {
  id: number;
  project: string;
  category: string;
  start: string;
  end: string | null;
}

interface WeeklyBreakdown {
  date: string;
  forge: number;
  admin: number;
  repair: number;
}

export default function ChronosForge() {
  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [history, setHistory] = useState<TimeEntry[]>([]);
  const [dailyTotal, setDailyTotal] = useState("0h 0m");
  const [showManual, setShowManual] = useState(false);
  const [weeklyData, setWeeklyData] = useState<WeeklyBreakdown[]>([]);

  // --- 1. HELPERS (Declared early) ---
  const handleLogout = useCallback(() => {
    localStorage.removeItem("forge_token");
    setToken(null);
    setHistory([]);
    setDailyTotal("0h 0m");
    setWeeklyData([]);
  }, []);

  // --- 2. DATA FETCHERS ---
  const fetchHistory = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch("http://localhost:8080/api/time/history", {
        headers: { Authorization: token },
      });
      if (response.status === 401) {
        handleLogout();
        return;
      }
      const data = await response.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("History fetch failed:", error);
    }
  }, [token, handleLogout]);

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

  const fetchWeeklyData = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:8080/api/time/weekly", {
        headers: { Authorization: token },
      });
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Weekly API returned non-JSON.");
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) setWeeklyData(data);
    } catch (error) {
      console.error("Weekly fetch failed:", error);
    }
  }, [token]);

  // --- 3. THE "PURIST" EFFECTS (Linter-Proof) ---

  // Handle Mount and Token retrieval separately to avoid cascading render warning
  useEffect(() => {
    const savedToken = localStorage.getItem("forge_token");
    if (savedToken) {
      // Wrapping in a microtask or simply ensuring it's the first thing we do
      setToken(savedToken);
    }
    setMounted(true);
  }, []);

  // Sync data when token is ready
  useEffect(() => {
    if (!token) return;

    let isSubscribed = true;
    const load = async () => {
      if (isSubscribed) {
        await Promise.all([fetchHistory(), fetchSummary(), fetchWeeklyData()]);
      }
    };

    load();
    return () => { isSubscribed = false; };
  }, [token, fetchHistory, fetchSummary, fetchWeeklyData]);

  // Heartbeat
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(fetchSummary, 60000);
    return () => clearInterval(interval);
  }, [token, fetchSummary]);

  // --- 4. HANDLERS ---
  const toggleProject = async (project: string, category: string) => {
    if (!token) return;
    const activeEntry = history.find((e) => e.end === null);
    const isClockingOut = activeEntry?.project === project;

    try {
      await fetch("http://localhost:8080/api/time/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: token },
        body: JSON.stringify({
          project: isClockingOut ? "STOP" : project,
          category: isClockingOut ? "None" : category,
        }),
      });
      await Promise.all([fetchHistory(), fetchSummary(), fetchWeeklyData()]);
    } catch (err) {
      console.error("Toggle failed:", err);
    }
  };

  const deleteEntry = async (id: number) => {
    if (!token || !confirm("Are you sure?")) return;
    try {
      const res = await fetch(`http://localhost:8080/api/time/${id}`, {
        method: "DELETE",
        headers: { Authorization: token },
      });
      if (res.ok) await Promise.all([fetchHistory(), fetchSummary(), fetchWeeklyData()]);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // --- 5. RENDER LOGIC ---
  const parts = dailyTotal.match(/(\d+)h (\d+)m/);
  const totalMinutes = parts ? parseInt(parts[1]) * 60 + parseInt(parts[2]) : 0;
  const progress = Math.min((totalMinutes / 480) * 100, 100);
  const activeEntry = history.find((e) => e.end === null);

  // HYDRATION GUARD: Server and Client must render the same thing first
  if (!mounted) {
    return <div className="min-h-screen bg-black" />;
  }

  // AUTH GUARD
  if (!token) {
    return (
      <AuthScreen 
        onLogin={(newToken) => {
          localStorage.setItem("forge_token", newToken);
          setToken(newToken);
        }} 
      />
    );
  }

  // FULL DASHBOARD
  return (
    <main className="min-h-screen bg-black text-zinc-100 p-8">
      <div className="max-w-md mx-auto bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl">
        <ForgeHeader activeProject={activeEntry?.project} onLogout={handleLogout}/>
        <ForgeAnalytics dailyTotal={dailyTotal} progress={progress} goalHours={8}/>
        <RecipeBar token={token} activeProject={activeEntry?.project} onSelect={toggleProject} />
        <ActionGrid activeProject={activeEntry?.project} onToggle={toggleProject}/>
        <WeeklyChart data={weeklyData}/>
        
        <div className="flex justify-between items-center mb-4 mt-8">
          <h2 className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Recent Shifts</h2>
          <button 
            onClick={() => setShowManual(!showManual)}
            className="text-[9px] text-orange-500/50 hover:text-orange-500 uppercase font-bold"
          >
            {showManual ? "[Close]" : "[+ Manual Entry]"}
          </button>
        </div>

        {showManual && (
          <ManualEntryForm
            token={token}
            onSuccess={() => {
              setShowManual(false);
              fetchHistory(); fetchSummary(); fetchWeeklyData();
            }}
          />
        )}
        <HistoryList history={history} onDelete={deleteEntry}/>
      </div>
    </main>
  );
}