"use client";
import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const [isMounted, setIsMounted] = useState(false);

  // Define the applying function first
  const applyTheme = (val) => {
    if (typeof window === "undefined") return;
    const html = document.documentElement;
    if (val === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  };

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("theme") || "light";
    setTheme(saved);
    applyTheme(saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    applyTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isMounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
