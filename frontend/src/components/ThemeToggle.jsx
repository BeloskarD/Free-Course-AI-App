"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
  const context = useTheme();

  // ⛔ Prevent hydration mismatch
  if (!context) return null;

  const { theme, toggleTheme } = context;

  return (
    <button
      onClick={toggleTheme}
      className="
        flex items-center justify-center
        w-9 h-9
        rounded-full
        border border-[var(--border-light)]
        hover:bg-[var(--primary-soft)]
        transition
      "
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}
