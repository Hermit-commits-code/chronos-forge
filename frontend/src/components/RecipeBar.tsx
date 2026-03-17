"use client";

import { useEffect, useState } from "react";

interface Recipe {
  id: number;
  name: string;
  project: string;
  category: string;
  color: string;
}

interface RecipeBarProps {
  token: string;
  onSelect: (project: string, category: string) => void;
  activeProject?: string;
}

export default function RecipeBar({ token, onSelect, activeProject }: RecipeBarProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/recipes", {
          headers: { Authorization: token },
        });
        const data = await res.json();
        if (Array.isArray(data)) setRecipes(data);
      } catch (err) {
        console.error("Failed to fetch recipes", err);
      }
    };
    fetchRecipes();
  }, [token]);

  const getColor = (color: string) => {
    const map: Record<string, string> = {
      orange: "border-orange-500/30 text-orange-500 hover:bg-orange-500/10",
      purple: "border-purple-500/30 text-purple-500 hover:bg-purple-500/10",
      red: "border-red-500/30 text-red-500 hover:bg-red-500/10",
    };
    return map[color] || "border-zinc-700 text-zinc-400";
  };

  return (
    <div className="mb-6">
      <h2 className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] mb-3">Quick Recipes</h2>
      <div className="flex flex-wrap gap-2">
        {recipes.map((recipe) => {
          const isActive = activeProject === recipe.project;
          return (
            <button
              key={recipe.id}
              onClick={() => onSelect(recipe.project, recipe.category)}
              className={`
                px-3 py-1.5 rounded-md border text-[11px] font-medium transition-all duration-200
                ${getColor(recipe.color)}
                ${isActive ? 'bg-zinc-800 border-zinc-500 ring-1 ring-zinc-500/50 scale-95' : 'bg-transparent'}
              `}
            >
              {isActive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse mr-2" />}
              {recipe.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}